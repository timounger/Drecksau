/**
 * The floor of the 3D city: the 2D picture's own ground, painted flat onto
 * tiles near the camera, a coarse copy of the whole map under it, the sea,
 * and what lies beyond the map.
 *
 * @module
 * @remarks
 * The ground is not modelled again. {@link drawFloor} paints the squares,
 * the lane paint, the bridge decks, the track and the rest exactly as the
 * tilted view does, only straight from above - so the 3D city cannot get a
 * lane or a car park wrong that the 2D one has right.
 *
 * Painting all of San Andreas sharply would be a texture of eight thousand
 * pixels a side. So there are two layers: the whole map once, coarse, and
 * on top of it a few dozen sharp tiles round wherever the camera is, painted
 * one or two a frame as it moves and reused once they fall behind. The water
 * is left transparent in both, and the sea is a plane underneath.
 */
import * as THREE from "three";
import { drawFloor } from "@/games/gta/components/render";
import { FLAT } from "@/games/gta/components/projection";
import { CITY_SIZE, type GameState } from "@/games/gta/engine/types";
import { Bin, WATER_LEVEL } from "./kit";
import { createSea, type Uniforms3d } from "./materials";
import type { Quality3d } from "./quality";

/** The floor and how to keep it sharp where one looks. */
export type Ground3d = {
  /** Everything, ready to go into the scene. */
  readonly group: THREE.Group;
  /**
   * Paints whatever is missing round the camera's target.
   *
   * @param x - the target, city x
   * @param z - the target, city y
   * @param distance - how far the camera stands from it
   * @param budget - how many tiles may be painted now
   */
  readonly update: (
    x: number,
    z: number,
    distance: number,
    budget: number,
  ) => void;
};

/** One sharp tile: where it lies and what it is painted on. */
type Tile = {
  readonly mesh: THREE.Mesh;
  readonly canvas: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;
  /** Which tile of the grid it shows, or -1 while it shows none. */
  key: number;
};

/** How wide one sharp tile is, in city pixels: two blocks. */
const TILE_SPAN = 768;

/** How many tiles across the map is. */
const TILES_ACROSS = Math.ceil(CITY_SIZE / TILE_SPAN);

/** Texels of the coarse map, on the two levels. */
const MAP_TEXELS = { low: 1024, high: 2048 } as const;

/** The coarse map, painted once per page - the city does not change. */
const painted = new Map<number, HTMLCanvasElement>();

/* eslint-disable @typescript-eslint/no-magic-numbers -- how far round the
   camera the tiles reach, and the heights the layers lie at */

/** Where the coarse map lies, just under the sharp tiles. */
const MAP_LEVEL = -0.4;

/** What lies outside the map: the dark country of the 2D picture. */
const BEYOND = 0x1c2a17;

/**
 * Lays the floor.
 *
 * @param state - the city, for its floor
 * @param uniforms - the shared values; the coarse map goes into `land`
 * @param quality - what this device can carry
 * @param bin - where everything made is kept for freeing
 * @returns the floor
 */
export function buildGround(
  state: GameState,
  uniforms: Uniforms3d,
  quality: Quality3d,
  bin: Bin,
): Ground3d {
  const group = new THREE.Group();
  const texels = MAP_TEXELS[quality.level];
  const map = bin.keep(new THREE.CanvasTexture(wholeMap(state, texels)));
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  uniforms.land.value = map;
  const plane = bin.keep(new THREE.PlaneGeometry(CITY_SIZE, CITY_SIZE));
  plane.rotateX(-Math.PI / 2);
  const coarse = new THREE.Mesh(
    plane,
    bin.keep(new THREE.MeshLambertMaterial({ map, alphaTest: 0.5 })),
  );
  coarse.position.set(CITY_SIZE / 2, MAP_LEVEL, CITY_SIZE / 2);
  coarse.receiveShadow = true;
  group.add(coarse);

  const seaPlane = bin.keep(
    new THREE.PlaneGeometry(CITY_SIZE, CITY_SIZE, 1, 1),
  );
  seaPlane.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaPlane, createSea(uniforms, bin));
  sea.position.set(CITY_SIZE / 2, WATER_LEVEL, CITY_SIZE / 2);
  sea.receiveShadow = true;
  group.add(sea);

  const farPlane = bin.keep(
    new THREE.PlaneGeometry(CITY_SIZE * 8, CITY_SIZE * 8),
  );
  farPlane.rotateX(-Math.PI / 2);
  const beyond = new THREE.Mesh(
    farPlane,
    bin.keep(new THREE.MeshLambertMaterial({ color: BEYOND })),
  );
  beyond.position.set(CITY_SIZE / 2, WATER_LEVEL - 1, CITY_SIZE / 2);
  group.add(beyond);

  const tileShape = bin.keep(new THREE.PlaneGeometry(TILE_SPAN, TILE_SPAN));
  tileShape.rotateX(-Math.PI / 2);
  const tiles: Tile[] = [];
  for (let at = 0; at < quality.tiles; at += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = quality.tileTexels;
    canvas.height = quality.tileTexels;
    const texture = bin.keep(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const mesh = new THREE.Mesh(
      tileShape,
      bin.keep(new THREE.MeshLambertMaterial({ map: texture, alphaTest: 0.5 })),
    );
    mesh.receiveShadow = true;
    mesh.visible = false;
    group.add(mesh);
    tiles.push({ mesh, canvas, texture, key: -1 });
  }
  const wanted: number[] = [];
  return {
    group,
    update: (x, z, distance, budget) => {
      // Round the point the camera looks at, the same in every direction:
      // the camera turns with the player, so there is no "up the screen".
      const reachX = distance * 1.6 + 420;
      const reachFar = reachX;
      const reachNear = reachX;
      wanted.length = 0;
      const fromX = Math.max(0, Math.floor((x - reachX) / TILE_SPAN));
      const toX = Math.min(
        TILES_ACROSS - 1,
        Math.floor((x + reachX) / TILE_SPAN),
      );
      const fromZ = Math.max(0, Math.floor((z - reachFar) / TILE_SPAN));
      const toZ = Math.min(
        TILES_ACROSS - 1,
        Math.floor((z + reachNear) / TILE_SPAN),
      );
      for (let row = fromZ; row <= toZ; row += 1) {
        for (let col = fromX; col <= toX; col += 1) {
          wanted.push(row * TILES_ACROSS + col);
        }
      }
      const away = (key: number): number => {
        const col = key % TILES_ACROSS;
        const row = Math.floor(key / TILES_ACROSS);
        return Math.hypot(
          (col + 0.5) * TILE_SPAN - x,
          (row + 0.5) * TILE_SPAN - z,
        );
      };
      wanted.sort((one, other) => away(one) - away(other));
      const keep = wanted.slice(0, tiles.length);
      let left = budget;
      for (const key of keep) {
        if (left > 0 && !tiles.some((tile) => tile.key === key)) {
          const free =
            tiles.find((tile) => tile.key === -1) ??
            tiles
              .filter((tile) => !keep.includes(tile.key))
              .sort((one, other) => away(other.key) - away(one.key))[0];
          if (free !== undefined) {
            paintTile(free, key, state);
            left -= 1;
          }
        }
      }
    },
  };
}

/**
 * Paints one sharp tile and lays it where it belongs.
 *
 * @param tile - the tile to paint on
 * @param key - which tile of the grid it now shows
 * @param state - the city
 */
function paintTile(tile: Tile, key: number, state: GameState): void {
  const col = key % TILES_ACROSS;
  const row = Math.floor(key / TILES_ACROSS);
  const middle = { x: (col + 0.5) * TILE_SPAN, y: (row + 0.5) * TILE_SPAN };
  const paint = tile.canvas.getContext("2d");
  if (paint !== null) {
    const scale = tile.canvas.width / TILE_SPAN;
    paint.setTransform(1, 0, 0, 1, 0, 0);
    paint.clearRect(0, 0, tile.canvas.width, tile.canvas.height);
    paint.setTransform(scale, 0, 0, scale, 0, 0);
    drawFloor(
      paint,
      state,
      { at: middle, width: TILE_SPAN, height: TILE_SPAN, squash: FLAT },
      {
        left: middle.x - TILE_SPAN / 2 - 60,
        top: middle.y - TILE_SPAN / 2 - 60,
        right: middle.x + TILE_SPAN / 2 + 60,
        bottom: middle.y + TILE_SPAN / 2 + 60,
      },
    );
    tile.texture.needsUpdate = true;
  }
  tile.key = key;
  tile.mesh.position.set(middle.x, 0, middle.y);
  tile.mesh.visible = true;
}

/**
 * The whole map, coarse, painted once and kept for the rest of the visit.
 *
 * @param state - the city
 * @param texels - how many texels a side
 * @returns the canvas
 */
function wholeMap(state: GameState, texels: number): HTMLCanvasElement {
  let canvas = painted.get(texels);
  if (canvas === undefined) {
    canvas = document.createElement("canvas");
    canvas.width = texels;
    canvas.height = texels;
    const paint = canvas.getContext("2d");
    if (paint !== null) {
      const scale = texels / CITY_SIZE;
      paint.setTransform(scale, 0, 0, scale, 0, 0);
      drawFloor(
        paint,
        state,
        {
          at: { x: CITY_SIZE / 2, y: CITY_SIZE / 2 },
          width: CITY_SIZE,
          height: CITY_SIZE,
          squash: FLAT,
        },
        { left: 0, top: 0, right: CITY_SIZE, bottom: CITY_SIZE },
      );
    }
    painted.set(texels, canvas);
  }
  return canvas;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
