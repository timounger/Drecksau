/**
 * The snowfield: terrain from a seed - forests, rocks, frozen lakes, ore and
 * quarries - and the gates the enemies come through.
 *
 * @module
 * @remarks
 * Nothing of the terrain is saved: it comes out of the seed the same every
 * time, and it is cached per seed so each lookup is one array read.
 */
import { hash2 } from "./random";
import { Terrain } from "./types";

/** Tiles across and down. */
export const MAP_COLS = 72;
export const MAP_ROWS = 72;

/** World units per tile. */
export const TILE = 32;

/** The headquarters' top-left tile (it is three by three). */
export const HQ_COL = 34;
export const HQ_ROW = 34;

/** Places on the edge where waves come in. */
export const GATES: readonly { col: number; row: number }[] = [
  { col: 36, row: 0 },
  { col: 71, row: 36 },
  { col: 36, row: 71 },
  { col: 0, row: 36 },
  { col: 4, row: 4 },
  { col: 67, row: 4 },
  { col: 67, row: 67 },
  { col: 4, row: 67 },
];

/** Radius kept free around the headquarters. */
const HQ_CLEARING = 6;

/** Radius kept free around a gate. */
const GATE_CLEARING = 3;

/** Size of a noise cell in tiles, per layer. */
const FOREST_CELL = 7;
const ROCK_CELL = 6;
const DRIFT_CELL = 5;

/** Noise thresholds. */
const FOREST_LEVEL = 0.67;
const ROCK_LEVEL = 0.74;
const DRIFT_LEVEL = 0.6;

/** Salts that make the noise layers differ. */
const FOREST_SALT = 11;
const ROCK_SALT = 23;
const DRIFT_SALT = 37;
const LAKE_SALT = 51;
const ORE_SALT = 67;
const STONE_SALT = 79;

/** First coefficient of smoothstep. */
const SMOOTH_A = 3;

/** Lakes per map, and their radius range. */
const LAKES = 3;
const LAKE_MIN = 3;
const LAKE_SPREAD = 3;

/** Deposits per kind; the first sits close to the headquarters. */
const DEPOSITS = 6;
const DEPOSIT_NEAR = 8;
const DEPOSIT_FAR = 30;

/** A forest patch is planted this close to the headquarters. */
const NEAR_FOREST = 9;
const NEAR_FOREST_RADIUS = 3;

/** Lakes stay this far from the centre. */
const LAKE_CLEAR = 12;

/** Terrain per seed. */
const cache = new Map<number, Uint8Array>();

/**
 * The terrain of a map.
 *
 * @param seed - the map's seed
 * @returns one {@link Terrain} value per tile, row by row
 */
export function terrainOf(seed: number): Uint8Array {
  let tiles = cache.get(seed);
  if (tiles === undefined) {
    tiles = generate(seed);
    cache.set(seed, tiles);
  }
  return tiles;
}

/**
 * The terrain of one tile.
 *
 * @param seed - the map's seed
 * @param col - the column
 * @param row - the row
 * @returns its terrain, or Rock outside the map
 */
export function terrainAt(seed: number, col: number, row: number): Terrain {
  const inside = col >= 0 && row >= 0 && col < MAP_COLS && row < MAP_ROWS;
  return inside ? terrainOf(seed)[row * MAP_COLS + col] : Terrain.Rock;
}

/**
 * Whether enemies and soldiers can walk over a terrain.
 *
 * @param terrain - the terrain
 * @returns false only for rock
 */
export function isWalkable(terrain: Terrain): boolean {
  return terrain !== Terrain.Rock;
}

/**
 * Whether a structure may stand on a terrain.
 *
 * @param terrain - the terrain
 * @returns true for open snow and for ore
 */
export function isBuildable(terrain: Terrain): boolean {
  return (
    terrain === Terrain.Snow ||
    terrain === Terrain.DeepSnow ||
    terrain === Terrain.IronOre ||
    terrain === Terrain.StoneOre
  );
}

/**
 * The centre of the headquarters' footprint, in tiles.
 *
 * @returns column and row of the middle
 */
export function hqCentre(): { col: number; row: number } {
  return { col: HQ_COL + 1, row: HQ_ROW + 1 };
}

/** Builds the terrain. */
function generate(seed: number): Uint8Array {
  const tiles = new Uint8Array(MAP_COLS * MAP_ROWS);
  const centre = hqCentre();
  for (let row = 0; row < MAP_ROWS; row += 1) {
    for (let col = 0; col < MAP_COLS; col += 1) {
      let terrain = Terrain.Snow;
      if (noise(col, row, FOREST_CELL, seed + FOREST_SALT) > FOREST_LEVEL) {
        terrain = Terrain.Forest;
      } else if (noise(col, row, ROCK_CELL, seed + ROCK_SALT) > ROCK_LEVEL) {
        terrain = Terrain.Rock;
      } else if (noise(col, row, DRIFT_CELL, seed + DRIFT_SALT) > DRIFT_LEVEL) {
        terrain = Terrain.DeepSnow;
      }
      tiles[row * MAP_COLS + col] = terrain;
    }
  }
  for (let lake = 0; lake < LAKES; lake += 1) {
    const angle = hash2(lake, 1, seed + LAKE_SALT) * Math.PI * 2;
    const far = LAKE_CLEAR + hash2(lake, 2, seed + LAKE_SALT) * LAKE_CLEAR;
    const radius = LAKE_MIN + hash2(lake, -1, seed + LAKE_SALT) * LAKE_SPREAD;
    blob(
      tiles,
      centre.col + Math.cos(angle) * far,
      centre.row + Math.sin(angle) * far,
      radius,
      Terrain.Ice,
    );
  }
  placeDeposits(tiles, seed + ORE_SALT, Terrain.IronOre);
  placeDeposits(tiles, seed + STONE_SALT, Terrain.StoneOre);
  const forestAngle = hash2(0, 0, seed + FOREST_SALT) * Math.PI * 2;
  blob(
    tiles,
    centre.col + Math.cos(forestAngle) * NEAR_FOREST,
    centre.row + Math.sin(forestAngle) * NEAR_FOREST,
    NEAR_FOREST_RADIUS,
    Terrain.Forest,
  );
  blob(tiles, centre.col, centre.row, HQ_CLEARING, Terrain.Snow);
  for (const gate of GATES) {
    blob(tiles, gate.col, gate.row, GATE_CLEARING, Terrain.Snow);
  }
  carvePaths(tiles);
  return tiles;
}

/** Smooth value noise in 0..1. */
function noise(col: number, row: number, cell: number, seed: number): number {
  const gx = Math.floor(col / cell);
  const gy = Math.floor(row / cell);
  const fx = smooth(col / cell - gx);
  const fy = smooth(row / cell - gy);
  const a = hash2(gx, gy, seed);
  const b = hash2(gx + 1, gy, seed);
  const c = hash2(gx, gy + 1, seed);
  const d = hash2(gx + 1, gy + 1, seed);
  const top = a + (b - a) * fx;
  const bottom = c + (d - c) * fx;
  return top + (bottom - top) * fy;
}

/** Smoothstep. */
function smooth(t: number): number {
  return t * t * (SMOOTH_A - 2 * t);
}

/** Paints a round patch of one terrain. */
function blob(
  tiles: Uint8Array,
  cx: number,
  cy: number,
  radius: number,
  terrain: Terrain,
): void {
  const reach = Math.ceil(radius);
  for (let row = Math.floor(cy) - reach; row <= cy + reach; row += 1) {
    for (let col = Math.floor(cx) - reach; col <= cx + reach; col += 1) {
      const inside = col >= 0 && row >= 0 && col < MAP_COLS && row < MAP_ROWS;
      if (inside && Math.hypot(col - cx, row - cy) <= radius) {
        tiles[row * MAP_COLS + col] = terrain;
      }
    }
  }
}

/** Scatters ore or stone patches, the first one near the centre. */
function placeDeposits(
  tiles: Uint8Array,
  seed: number,
  terrain: Terrain,
): void {
  const centre = hqCentre();
  for (let index = 0; index < DEPOSITS; index += 1) {
    const angle = hash2(index, 0, seed) * Math.PI * 2;
    const far =
      index === 0
        ? DEPOSIT_NEAR
        : DEPOSIT_NEAR + hash2(index, 1, seed) * (DEPOSIT_FAR - DEPOSIT_NEAR);
    blob(
      tiles,
      centre.col + Math.cos(angle) * far,
      centre.row + Math.sin(angle) * far,
      1 + hash2(index, 2, seed),
      terrain,
    );
  }
}

/**
 * Clears a walkable way from every gate to the centre, so rock can never
 * wall the headquarters in.
 */
function carvePaths(tiles: Uint8Array): void {
  const centre = hqCentre();
  for (const gate of GATES) {
    const steps = Math.max(
      Math.abs(gate.col - centre.col),
      Math.abs(gate.row - centre.row),
    );
    for (let step = 0; step <= steps; step += 1) {
      const col = Math.round(
        gate.col + ((centre.col - gate.col) * step) / steps,
      );
      const row = Math.round(
        gate.row + ((centre.row - gate.row) * step) / steps,
      );
      // Two tiles wide, so a diagonal stretch never needs a corner cut.
      for (const index of [row * MAP_COLS + col, row * MAP_COLS + col + 1]) {
        if (index < tiles.length && tiles[index] === Terrain.Rock) {
          tiles[index] = Terrain.DeepSnow;
        }
      }
    }
  }
}
