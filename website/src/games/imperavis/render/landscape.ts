/**
 * The landscape in 3D: island terrain meshes from the height map, the sea
 * floor, rivers, roads, the territory border and instanced trees and rocks
 * in chunks that the camera can cull and simplify when far away.
 *
 * @module
 */
import * as THREE from "three";
import {
  NO_ROAD,
  PAVED_ROAD,
  PLAIN_ROAD,
} from "@/games/imperavis/engine/logistics-data";
import { HUMAN } from "@/games/imperavis/engine/players";
import { hash2 } from "@/games/imperavis/engine/random";
import {
  cornerHeight,
  groundHeight,
  isSea,
  tileHeight,
} from "@/games/imperavis/engine/terrain";
import {
  Deposit,
  Terrain,
  type Game,
  type World,
} from "@/games/imperavis/engine/types";
import type { SharedUniforms } from "./materials";
import { farTreeModel, treeModel } from "./models";

/* eslint-disable @typescript-eslint/no-magic-numbers -- colours, offsets and chunk sizes of the landscape */

/** Colour of each terrain. */
const TERRAIN_COLORS: Readonly<Record<Terrain, number>> = {
  [Terrain.DeepWater]: 0x24485a,
  [Terrain.Water]: 0xc9b98a,
  [Terrain.Beach]: 0xe2d29c,
  [Terrain.Meadow]: 0x7fa64e,
  [Terrain.Forest]: 0x5d8a3c,
  [Terrain.Rock]: 0x9c9585,
  [Terrain.Mountain]: 0x857f74,
  [Terrain.River]: 0x6f8c8a,
};

/** Tint of deposits over their ground. */
const DEPOSIT_COLORS: Readonly<Record<Deposit, number>> = {
  [Deposit.None]: 0,
  [Deposit.Stone]: 0xc4c0b4,
  [Deposit.Clay]: 0xb8734a,
  [Deposit.Ore]: 0x8a4e3c,
};

/** Tiles per side of a tree chunk. */
const CHUNK = 24;

/** Beyond this camera distance chunks use the simple trees. */
const FAR_TREES = 70;

/** Tiles of sea floor drawn around each island. */
const SHELF = 5;

/** Lift of roads and borders over the ground. */
const LIFT = 0.05;

/** Share of a tile a plain road leaves free at each side. */
const ROAD_INSET = 0.08;

/** A paved road's stones sit inside a kerb this wide... */
const PAVED_INSET = 0.16;

/** ...and this much above the ground. */
const PAVED_LIFT = 0.08;

/** The landscape objects and how to keep them current. */
export type Landscape = {
  readonly group: THREE.Group;
  /** Rebuilds what buildings and roads change: roads, border, trees. */
  rebuild(game: Game): void;
  /** Per frame: tree detail by distance, border visibility. */
  update(
    camera: THREE.Camera,
    target: THREE.Vector2,
    showBorder: boolean,
    foliage: THREE.Color,
  ): void;
  dispose(): void;
};

/**
 * Builds the landscape of a world.
 *
 * @param world - the world
 * @param terrainMaterial - material for the ground
 * @param waterMaterial - material for rivers
 * @param uniforms - shared values
 * @returns the landscape
 */
export function createLandscape(
  world: World,
  terrainMaterial: THREE.Material,
  waterMaterial: THREE.Material,
  uniforms: SharedUniforms,
): Landscape {
  const group = new THREE.Group();
  const disposables: { dispose(): void }[] = [];
  for (const island of world.islands) {
    const mesh = new THREE.Mesh(
      islandGeometry(
        world,
        island.minX - SHELF,
        island.minY - SHELF,
        island.maxX + SHELF,
        island.maxY + SHELF,
      ),
      terrainMaterial,
    );
    mesh.receiveShadow = true;
    group.add(mesh);
    disposables.push(mesh.geometry);
  }
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(world.n * 3, world.n * 3),
    new THREE.MeshLambertMaterial({ color: 0x1d3a4a }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(world.n / 2, -3.2, world.n / 2);
  group.add(floor);
  disposables.push(floor.geometry, floor.material as THREE.Material);
  const river = riverGeometry(world);
  if (river !== null) {
    const mesh = new THREE.Mesh(river, waterMaterial);
    group.add(mesh);
    disposables.push(river);
  }
  // Roads and the border change with the game.
  const roadMaterial = new THREE.MeshLambertMaterial({
    color: 0xa88a5f,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const roads = new THREE.Mesh(new THREE.BufferGeometry(), roadMaterial);
  roads.receiveShadow = true;
  group.add(roads);
  // Paved roads: grey stone, a little higher, with a darker kerb below.
  const pavedMaterial = new THREE.MeshLambertMaterial({
    color: 0x9a9893,
    polygonOffset: true,
    polygonOffsetFactor: -3,
  });
  const paved = new THREE.Mesh(new THREE.BufferGeometry(), pavedMaterial);
  paved.receiveShadow = true;
  group.add(paved);
  const kerbMaterial = new THREE.MeshLambertMaterial({
    color: 0x5f5a52,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const kerb = new THREE.Mesh(new THREE.BufferGeometry(), kerbMaterial);
  kerb.receiveShadow = true;
  group.add(kerb);
  const borderMaterial = new THREE.LineBasicMaterial({
    color: 0xfff1b8,
    transparent: true,
    opacity: 0.85,
  });
  const border = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    borderMaterial,
  );
  group.add(border);
  // The land of the rivals is always outlined in their colours.
  const rivalMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
  });
  const rivalBorder = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    rivalMaterial,
  );
  group.add(rivalBorder);
  disposables.push(
    roadMaterial,
    pavedMaterial,
    kerbMaterial,
    borderMaterial,
    rivalMaterial,
  );
  // Trees and rocks.
  const foliageMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  foliageMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uSnow = uniforms.snow;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uSnow;")
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.94, 0.98), uSnow * 0.55);",
      );
  };
  const geometries = {
    near: [treeModel(true), treeModel(false)],
    far: [farTreeModel(true), farTreeModel(false)],
  };
  const rockGeometry = new THREE.DodecahedronGeometry(0.35, 0);
  rockGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(
      new Float32Array(rockGeometry.getAttribute("position").count * 3).fill(
        0.55,
      ),
      3,
    ),
  );
  disposables.push(
    foliageMaterial,
    rockGeometry,
    ...geometries.near,
    ...geometries.far,
  );
  const chunks: { cx: number; cz: number; meshes: THREE.InstancedMesh[] }[] =
    [];
  const chunkCount = Math.ceil(world.n / CHUNK);
  for (let cy = 0; cy < chunkCount; cy += 1) {
    for (let cx = 0; cx < chunkCount; cx += 1) {
      chunks.push({
        cx: (cx + 0.5) * CHUNK,
        cz: (cy + 0.5) * CHUNK,
        meshes: [],
      });
    }
  }
  const rocks = buildRocks(world, rockGeometry, foliageMaterial);
  if (rocks !== null) {
    group.add(rocks);
  }
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();

  const rebuildTrees = (game: Game) => {
    for (const chunk of chunks) {
      for (const mesh of chunk.meshes) {
        group.remove(mesh);
        mesh.dispose();
      }
      chunk.meshes = [];
    }
    chunks.forEach((chunk, index) => {
      const x0 = (index % chunkCount) * CHUNK;
      const y0 = Math.floor(index / chunkCount) * CHUNK;
      const spots: [number[], number[]] = [[], []];
      for (let y = y0; y < Math.min(world.n, y0 + CHUNK); y += 1) {
        for (let x = x0; x < Math.min(world.n, x0 + CHUNK); x += 1) {
          const i = y * world.n + x;
          const free =
            game.cleared[i] === 0 &&
            game.occupancy[i] === 0 &&
            game.roads[i] === 0;
          if (world.terrain[i] === Terrain.Forest && free) {
            const kind = hash2(x, y, world.seed + 3) < 0.55 ? 0 : 1;
            spots[kind].push(
              x + 0.2 + hash2(x, y, world.seed + 5) * 0.6,
              y + 0.2 + hash2(x, y, world.seed + 7) * 0.6,
            );
            if (hash2(x, y, world.seed + 11) < 0.35) {
              spots[1 - kind].push(
                x + hash2(x, y, world.seed + 13) * 0.9,
                y + hash2(x, y, world.seed + 17) * 0.9,
              );
            }
          }
        }
      }
      spots.forEach((list, kind) => {
        const count = list.length / 2;
        if (count > 0) {
          const mesh = new THREE.InstancedMesh(
            geometries.near[kind],
            foliageMaterial,
            count,
          );
          for (let k = 0; k < count; k += 1) {
            const px = list[k * 2];
            const pz = list[k * 2 + 1];
            const size =
              0.6 +
              hash2(Math.floor(px * 7), Math.floor(pz * 7), world.seed) * 0.6;
            quaternion.setFromAxisAngle(
              up,
              hash2(Math.floor(px * 3), Math.floor(pz * 3), world.seed + 1) *
                Math.PI *
                2,
            );
            position.set(px, groundHeight(world, px, pz) - 0.05, pz);
            scale.set(size, size, size);
            matrix.compose(position, quaternion, scale);
            mesh.setMatrixAt(k, matrix);
          }
          mesh.castShadow = true;
          mesh.computeBoundingSphere();
          mesh.userData.kind = kind;
          chunk.meshes.push(mesh);
          group.add(mesh);
        }
      });
    });
  };

  return {
    group,
    rebuild(game) {
      roads.geometry.dispose();
      roads.geometry = roadGeometry(game, PLAIN_ROAD, ROAD_INSET, LIFT);
      paved.geometry.dispose();
      paved.geometry = roadGeometry(game, PAVED_ROAD, PAVED_INSET, PAVED_LIFT);
      kerb.geometry.dispose();
      kerb.geometry = roadGeometry(game, PAVED_ROAD, 0, LIFT);
      border.geometry.dispose();
      border.geometry = borderGeometry(game, (owner) => owner === HUMAN);
      rivalBorder.geometry.dispose();
      rivalBorder.geometry = borderGeometry(game, (owner) => owner > HUMAN);
      rebuildTrees(game);
    },
    update(camera, target, showBorder, foliage) {
      border.visible = showBorder;
      foliageMaterial.color.copy(foliage);
      for (const chunk of chunks) {
        const far =
          Math.hypot(chunk.cx - target.x, chunk.cz - target.y) +
            camera.position.y * 0.6 >
          FAR_TREES;
        for (const mesh of chunk.meshes) {
          const kind = mesh.userData.kind as number;
          mesh.geometry = far ? geometries.far[kind] : geometries.near[kind];
          mesh.castShadow = !far;
        }
      }
    },
    dispose() {
      for (const chunk of chunks) {
        for (const mesh of chunk.meshes) {
          mesh.dispose();
        }
      }
      rocks?.dispose();
      roads.geometry.dispose();
      border.geometry.dispose();
      rivalBorder.geometry.dispose();
      for (const item of disposables) {
        item.dispose();
      }
    },
  };
}

/** Flat-shaded quads for the tiles of one island and its shelf. */
function islandGeometry(
  world: World,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): THREE.BufferGeometry {
  const n = world.n;
  const minX = Math.max(0, x0);
  const minY = Math.max(0, y0);
  const maxX = Math.min(n - 1, x1);
  const maxY = Math.min(n - 1, y1);
  const tiles = (maxX - minX + 1) * (maxY - minY + 1);
  const positions = new Float32Array(tiles * 18);
  const colors = new Float32Array(tiles * 18);
  const color = new THREE.Color();
  const deposit = new THREE.Color();
  let v = 0;
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const i = y * n + x;
      const ground = world.terrain[i] as Terrain;
      const h = tileHeight(world, x, y);
      color.setHex(TERRAIN_COLORS[ground]);
      if (isSea(ground)) {
        // Shallows are sand, darkening with depth.
        color.lerp(new THREE.Color(0x2c5566), Math.min(1, Math.max(0, -h / 3)));
      }
      if (world.deposits[i] !== Deposit.None) {
        deposit.setHex(DEPOSIT_COLORS[world.deposits[i] as Deposit]);
        color.lerp(deposit, 0.55);
      }
      const shade = 0.93 + hash2(x, y, world.seed + 21) * 0.12;
      color.multiplyScalar(shade);
      const corners = [
        [x, y],
        [x, y + 1],
        [x + 1, y],
        [x + 1, y],
        [x, y + 1],
        [x + 1, y + 1],
      ];
      for (const [cx, cy] of corners) {
        positions[v * 3] = cx;
        positions[v * 3 + 1] = cornerHeight(world, cx, cy);
        positions[v * 3 + 2] = cy;
        colors[v * 3] = color.r;
        colors[v * 3 + 1] = color.g;
        colors[v * 3 + 2] = color.b;
        v += 1;
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Water quads lying in the river beds. */
function riverGeometry(world: World): THREE.BufferGeometry | null {
  const n = world.n;
  const positions: number[] = [];
  for (let i = 0; i < n * n; i += 1) {
    if (world.terrain[i] === Terrain.River) {
      const x = i % n;
      const y = Math.floor(i / n);
      const h = tileHeight(world, x, y) + 0.22;
      positions.push(
        x - 0.1,
        h,
        y - 0.1,
        x - 0.1,
        h,
        y + 1.1,
        x + 1.1,
        h,
        y - 0.1,
        x + 1.1,
        h,
        y - 0.1,
        x - 0.1,
        h,
        y + 1.1,
        x + 1.1,
        h,
        y + 1.1,
      );
    }
  }
  let geometry: THREE.BufferGeometry | null = null;
  if (positions.length > 0) {
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
  }
  return geometry;
}

/**
 * Quads on every road tile of one kind, following the ground, joined to
 * neighbouring road tiles of any kind.
 */
function roadGeometry(
  game: Game,
  kind: number,
  inset: number,
  lift: number,
): THREE.BufferGeometry {
  const world = game.world;
  const n = world.n;
  const positions: number[] = [];
  const joins = (index: number) => game.roads[index] !== NO_ROAD;
  for (let i = 0; i < n * n; i += 1) {
    if (game.roads[i] === kind) {
      const x = i % n;
      const y = Math.floor(i / n);
      const h = (cx: number, cy: number) => cornerHeight(world, cx, cy) + lift;
      const a = inset;
      const b = 1 - inset;
      positions.push(
        x + a,
        h(x, y),
        y + a,
        x + a,
        h(x, y + 1),
        y + b,
        x + b,
        h(x + 1, y),
        y + a,
        x + b,
        h(x + 1, y),
        y + a,
        x + a,
        h(x, y + 1),
        y + b,
        x + b,
        h(x + 1, y + 1),
        y + b,
      );
      // Join neighbouring road tiles so the road is continuous.
      if (x + 1 < n && joins(i + 1)) {
        positions.push(
          x + b,
          h(x + 1, y),
          y + a,
          x + b,
          h(x + 1, y + 1),
          y + b,
          x + 1 + a,
          h(x + 1, y),
          y + a,
          x + 1 + a,
          h(x + 1, y),
          y + a,
          x + b,
          h(x + 1, y + 1),
          y + b,
          x + 1 + a,
          h(x + 1, y + 1),
          y + b,
        );
      }
      if (y + 1 < n && joins(i + n)) {
        positions.push(
          x + a,
          h(x, y + 1),
          y + b,
          x + a,
          h(x, y + 1),
          y + 1 + a,
          x + b,
          h(x + 1, y + 1),
          y + b,
          x + b,
          h(x + 1, y + 1),
          y + b,
          x + a,
          h(x, y + 1),
          y + 1 + a,
          x + b,
          h(x + 1, y + 1),
          y + 1 + a,
        );
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.computeVertexNormals();
  return geometry;
}

/** Lines along the edge of the land of the players a test picks, in their colours. */
function borderGeometry(
  game: Game,
  picks: (owner: number) => boolean,
): THREE.BufferGeometry {
  const world = game.world;
  const n = world.n;
  const positions: number[] = [];
  const colors: number[] = [];
  const color = new THREE.Color();
  const ownerAt = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < n && y < n && game.territory[y * n + x] === 1
      ? (game.islands[world.islandOf[y * n + x]]?.owner ?? -1)
      : -1;
  let current = -1;
  const owned = (x: number, y: number) => ownerAt(x, y) === current;
  const line = (ax: number, ay: number, bx: number, by: number) => {
    color.setHex(game.players[current]?.color ?? 0xfff1b8);
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    positions.push(
      ax,
      cornerHeight(world, ax, ay) + LIFT * 2,
      ay,
      bx,
      cornerHeight(world, bx, by) + LIFT * 2,
      by,
    );
  };
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      current = ownerAt(x, y);
      if (current >= 0 && picks(current)) {
        if (!owned(x - 1, y)) {
          line(x, y, x, y + 1);
        }
        if (!owned(x + 1, y)) {
          line(x + 1, y, x + 1, y + 1);
        }
        if (!owned(x, y - 1)) {
          line(x, y, x + 1, y);
        }
        if (!owned(x, y + 1)) {
          line(x, y + 1, x + 1, y + 1);
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

/** Scattered boulders on rock and mountain. */
function buildRocks(
  world: World,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
): THREE.InstancedMesh | null {
  const n = world.n;
  const spots: number[] = [];
  for (let i = 0; i < n * n; i += 1) {
    const ground = world.terrain[i];
    const x = i % n;
    const y = Math.floor(i / n);
    if (
      (ground === Terrain.Mountain || ground === Terrain.Rock) &&
      hash2(x, y, world.seed + 31) < (ground === Terrain.Mountain ? 0.3 : 0.08)
    ) {
      spots.push(x + 0.5, y + 0.5);
    }
  }
  let mesh: THREE.InstancedMesh | null = null;
  if (spots.length > 0) {
    mesh = new THREE.InstancedMesh(geometry, material, spots.length / 2);
    const matrix = new THREE.Matrix4();
    for (let k = 0; k < spots.length / 2; k += 1) {
      const x = spots[k * 2];
      const z = spots[k * 2 + 1];
      const s = 0.6 + hash2(k, 1, world.seed) * 1.1;
      matrix.makeRotationY(hash2(k, 2, world.seed) * Math.PI);
      matrix.scale(new THREE.Vector3(s, s * 0.7, s));
      matrix.setPosition(x, groundHeight(world, x, z), z);
      mesh.setMatrixAt(k, matrix);
    }
    mesh.castShadow = true;
    mesh.computeBoundingSphere();
  }
  return mesh;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
