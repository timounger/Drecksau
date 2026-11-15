/**
 * Small plants and stones on the land: tufts of grass, flowers, bushes and
 * pebbles, scattered by the terrain and merged into one mesh per chunk, with
 * the wind in the vertex shader.
 *
 * @module
 * @remarks
 * Each item is a handful of triangles. Where they stand follows from the
 * world's seed, so a chunk looks the same each time it is rebuilt; nothing
 * grows on roads or under buildings. How many are drawn follows the graphics
 * level.
 */
import * as THREE from "three";
import { NO_ROAD } from "@/games/imperavis/engine/logistics-data";
import { hash2 } from "@/games/imperavis/engine/random";
import { groundHeight } from "@/games/imperavis/engine/terrain";
import { Terrain, type Game } from "@/games/imperavis/engine/types";
import type { SharedUniforms } from "./materials";

/* eslint-disable @typescript-eslint/no-magic-numbers -- shapes, colours and odds of the plants */

/** What can grow, with its shape. */
type Kind = "grass" | "flower" | "bush" | "stone";

/** Chances per try on a tile, by terrain, at full density. */
const ODDS: Partial<Record<Terrain, Readonly<Record<Kind, number>>>> = {
  [Terrain.Meadow]: { grass: 0.62, flower: 0.12, bush: 0.035, stone: 0.025 },
  [Terrain.Forest]: { grass: 0.4, flower: 0.03, bush: 0.2, stone: 0.04 },
  [Terrain.Beach]: { grass: 0.09, flower: 0, bush: 0, stone: 0.05 },
  [Terrain.Rock]: { grass: 0.14, flower: 0.02, bush: 0.02, stone: 0.22 },
  [Terrain.Mountain]: { grass: 0.04, flower: 0, bush: 0, stone: 0.2 },
};

/** Tries per tile; each may place one thing. */
const TRIES = 3;

/** Lowest ground anything grows on (keeps the surf free). */
const DRY = 0.2;

/** Salt of the seed for the plants' places. */
const SALT = 4100;

/** Colours (sRGB). */
const GRASS = [0x86b34a, 0x97bc52, 0x76a443, 0xa6c25c] as const;
const FLOWERS = [0xf4f1e6, 0xf2cf3c, 0xd9473b, 0x9b6fd0, 0xf09ac0] as const;
const BUSH = [0x4b7d2c, 0x557f30, 0x3f6e28] as const;
const STONE = [0x8f8a80, 0x9d988d, 0x7c776e] as const;
const STEM = 0x5f8a34;

/** Sway of a tip in the wind, tiles, at gust 1. */
const SWAY = 0.06;

/** How far tips sink under a full cover of snow, tiles. */
const SNOW_SINK = 0.3;

/** Shade of a blade at its foot and at its tip. */
const FOOT_SHADE = 0.82;
const TIP_SHADE = 1.12;

/** One finished mesh's vertex data, filled item by item. */
type Buffers = {
  positions: number[];
  normals: number[];
  colors: number[];
  sway: number[];
};

/** Where and how one item stands. */
type Place = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly turn: number;
  readonly size: number;
  /** 0 to 1, picks the colour. */
  readonly pick: number;
};

/** Writes one item into the buffers. */
type Item = (out: Buffers, place: Place, color: THREE.Color) => void;

/** The items by kind. */
const ITEMS: Readonly<Record<Kind, Item>> = {
  grass: (out, place, color) => {
    // Three to five blades, leaning outwards; normals point up so the tuft
    // is lit like the meadow it stands in.
    color.setHex(GRASS[Math.floor(place.pick * GRASS.length)]);
    const blades = 3 + Math.floor(place.pick * 3);
    for (let b = 0; b < blades; b += 1) {
      const angle = place.turn + (b / blades) * Math.PI * 2;
      const lean = 0.05 + 0.04 * ((b * 7) % 3);
      const tall = (0.18 + 0.06 * ((b * 5) % 3)) * place.size;
      const ax = Math.cos(angle);
      const az = Math.sin(angle);
      const width = 0.05 * place.size;
      blade(
        out,
        [place.x - az * width, place.y, place.z + ax * width],
        [place.x + az * width, place.y, place.z - ax * width],
        [place.x + ax * lean, place.y + tall, place.z + az * lean],
        color,
      );
    }
  },
  flower: (out, place, color) => {
    color.setHex(STEM);
    const tall = 0.24 * place.size;
    blade(
      out,
      [place.x - 0.015, place.y, place.z],
      [place.x + 0.015, place.y, place.z],
      [place.x, place.y + tall, place.z],
      color,
    );
    color.setHex(FLOWERS[Math.floor(place.pick * FLOWERS.length)]);
    solid(
      out,
      OCTAHEDRON,
      place.x,
      place.y + tall,
      place.z,
      0.055 * place.size,
      0.6,
      place.turn,
      color,
      1,
    );
  },
  bush: (out, place, color) => {
    color.setHex(BUSH[Math.floor(place.pick * BUSH.length)]);
    const r = 0.26 * place.size;
    solid(
      out,
      ICOSAHEDRON,
      place.x,
      place.y + r * 0.55,
      place.z,
      r,
      0.75,
      place.turn,
      color,
      0.3,
    );
  },
  stone: (out, place, color) => {
    color.setHex(STONE[Math.floor(place.pick * STONE.length)]);
    const r = 0.11 * place.size;
    solid(
      out,
      OCTAHEDRON,
      place.x,
      place.y + r * 0.2,
      place.z,
      r,
      0.55,
      place.turn,
      color,
      0,
    );
  },
};

/** The corners of an octahedron and of an icosahedron, as triangle lists. */
const OCTAHEDRON = triangleList(new THREE.OctahedronGeometry(1, 0));
const ICOSAHEDRON = triangleList(new THREE.IcosahedronGeometry(1, 0));

/**
 * The material of the small plants: vertex colours, wind on the tips, a
 * dusting of snow and the season's tint (through `color`).
 *
 * @param uniforms - the shared values (live time, gust, snow)
 * @param wind - 1 while the wind may move the plants, 0 for still
 * @returns the material
 */
export function createVegetationMaterial(
  uniforms: SharedUniforms,
  wind: { value: number },
): THREE.MeshLambertMaterial {
  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uLiveTime = uniforms.liveTime;
    shader.uniforms.uGust = uniforms.gust;
    shader.uniforms.uWind = wind;
    shader.uniforms.uSnow = uniforms.snow;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute float sway;
        uniform float uLiveTime;
        uniform float uGust;
        uniform float uWind;
        uniform float uSnow;
        const float SWAY = ${SWAY.toFixed(3)};
        const float SNOW_SINK = ${SNOW_SINK.toFixed(3)};`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float phase = dot(position.xz, vec2(0.37, 0.53));
        float bend = sway * SWAY * uGust * uWind;
        transformed.x += sin(uLiveTime * 1.9 + phase) * bend;
        transformed.z += cos(uLiveTime * 1.4 + phase * 1.3) * bend * 0.6;
        transformed.y -= sway * uSnow * SNOW_SINK;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uSnow;")
      // Blades are lit by their upward normal from both sides.
      .replace(
        "#include <normal_fragment_begin>",
        "#include <normal_fragment_begin>\nnormal = normalize(vNormal);",
      )
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.94, 0.98), uSnow * 0.7);",
      );
  };
  return material;
}

/**
 * The plants and stones of one block of tiles, as one geometry in world
 * space.
 *
 * @param game - the game (roads and buildings keep tiles free)
 * @param x0 - first column
 * @param y0 - first row
 * @param size - tiles per side of the block
 * @param density - share of the plants drawn, 0 to 1
 * @returns the geometry, or null when nothing grows there
 */
export function vegetationGeometry(
  game: Game,
  x0: number,
  y0: number,
  size: number,
  density: number,
): THREE.BufferGeometry | null {
  const world = game.world;
  const n = world.n;
  const seed = world.seed + SALT;
  const out: Buffers = { positions: [], normals: [], colors: [], sway: [] };
  const color = new THREE.Color();
  for (let y = y0; y < Math.min(n, y0 + size) && density > 0; y += 1) {
    for (let x = x0; x < Math.min(n, x0 + size); x += 1) {
      const i = y * n + x;
      const ground = world.terrain[i] as Terrain;
      const odds = ODDS[ground];
      const free = game.occupancy[i] === 0 && game.roads[i] === NO_ROAD;
      for (let k = 0; k < TRIES && odds !== undefined && free; k += 1) {
        const roll = hash2(x * TRIES + k, y, seed) / density;
        const px = x + 0.08 + hash2(x, y * TRIES + k, seed + 1) * 0.84;
        const pz = y + 0.08 + hash2(x * TRIES + k, y, seed + 2) * 0.84;
        const height = groundHeight(world, px, pz);
        const turn = hash2(x + k, y, seed + 3) * Math.PI * 2;
        const pick = hash2(x, y + k, seed + 4);
        const size2 = 0.75 + hash2(x + k, y + k, seed + 5) * 0.6;
        const kind = chooseKind(odds, roll);
        if (kind !== null && height > DRY) {
          const place = { x: px, y: height, z: pz, turn, size: size2, pick };
          ITEMS[kind](out, place, color);
        }
      }
    }
  }
  let geometry: THREE.BufferGeometry | null = null;
  if (out.positions.length > 0) {
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(out.positions, 3),
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(out.normals, 3),
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(out.colors, 3),
    );
    geometry.setAttribute(
      "sway",
      new THREE.Float32BufferAttribute(out.sway, 1),
    );
    geometry.computeBoundingSphere();
  }
  return geometry;
}

/**
 * Picks what grows from a roll against the odds of the terrain.
 *
 * @param odds - chances of the kinds
 * @param roll - 0 to 1 (and beyond when the density is low)
 * @returns the kind, or null for nothing
 */
function chooseKind(
  odds: Readonly<Record<Kind, number>>,
  roll: number,
): Kind | null {
  let left = roll;
  let chosen: Kind | null = null;
  for (const kind of ["bush", "flower", "stone", "grass"] as const) {
    if (chosen === null && left < odds[kind]) {
      chosen = kind;
    }
    left -= odds[kind];
  }
  return chosen;
}

/** One blade: a triangle from two foot points to a tip that sways. */
function blade(
  out: Buffers,
  a: readonly number[],
  b: readonly number[],
  tip: readonly number[],
  color: THREE.Color,
): void {
  out.positions.push(...a, ...b, ...tip);
  out.normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
  // The tip is lighter, the foot darker.
  out.colors.push(
    color.r * FOOT_SHADE,
    color.g * FOOT_SHADE,
    color.b * FOOT_SHADE,
    color.r * FOOT_SHADE,
    color.g * FOOT_SHADE,
    color.b * FOOT_SHADE,
    color.r * TIP_SHADE,
    color.g * TIP_SHADE,
    color.b * TIP_SHADE,
  );
  out.sway.push(0, 0, 1);
}

/** A squashed, turned solid with flat faces. */
function solid(
  out: Buffers,
  corners: Float32Array,
  x: number,
  y: number,
  z: number,
  radius: number,
  squash: number,
  turn: number,
  color: THREE.Color,
  sway: number,
): void {
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const at = (k: number) => {
    const lx = corners[k * 3] * radius;
    const ly = corners[k * 3 + 1] * radius * squash;
    const lz = corners[k * 3 + 2] * radius;
    return [x + lx * cos - lz * sin, y + ly, z + lx * sin + lz * cos];
  };
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  for (let t = 0; t < corners.length / 9; t += 1) {
    const p0 = at(t * 3);
    const p1 = at(t * 3 + 1);
    const p2 = at(t * 3 + 2);
    e1.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
    e2.set(p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]);
    e1.cross(e2).normalize();
    out.positions.push(...p0, ...p1, ...p2);
    for (const p of [p0, p1, p2]) {
      out.normals.push(e1.x, e1.y, e1.z);
      const shade = 0.85 + (p[1] - y) / (radius * 2);
      out.colors.push(color.r * shade, color.g * shade, color.b * shade);
      out.sway.push(p[1] > y ? sway : 0);
    }
  }
}

/** The corners of a geometry's triangles in order (and frees it). */
function triangleList(geometry: THREE.BufferGeometry): Float32Array {
  const flat = geometry.index !== null ? geometry.toNonIndexed() : geometry;
  const result = Float32Array.from(flat.getAttribute("position").array);
  geometry.dispose();
  flat.dispose();
  return result;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
