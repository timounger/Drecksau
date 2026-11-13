/**
 * The TerrainSystem: questions about single tiles - height, slope, ground,
 * water and the land around them.
 *
 * @module
 */
import { Terrain, type World } from "./types";

/** The four straight neighbours. */
export const DIRS4: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** The eight neighbours. */
export const DIRS8: readonly (readonly [number, number])[] = [
  ...DIRS4,
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** Offset from a tile's corner to its centre. */
export const TILE_CENTER = 0.5;

/** Corners of a tile. */
export const CORNERS = 4;

/**
 * Whether a tile lies on the map.
 *
 * @param world - the world
 * @param x - tile column
 * @param y - tile row
 * @returns true inside
 */
export function inBounds(world: World, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < world.n && y < world.n;
}

/**
 * Height of one tile corner.
 *
 * @param world - the world
 * @param x - corner column, 0 to n
 * @param y - corner row, 0 to n
 * @returns the height
 */
export function cornerHeight(world: World, x: number, y: number): number {
  return world.heights[y * (world.n + 1) + x];
}

/**
 * Mean height of a tile.
 *
 * @param world - the world
 * @param x - tile column
 * @param y - tile row
 * @returns the height
 */
export function tileHeight(world: World, x: number, y: number): number {
  return (
    (cornerHeight(world, x, y) +
      cornerHeight(world, x + 1, y) +
      cornerHeight(world, x, y + 1) +
      cornerHeight(world, x + 1, y + 1)) /
    CORNERS
  );
}

/**
 * Height of the ground at any point, by bilinear interpolation.
 *
 * @param world - the world
 * @param px - position in tiles
 * @param py - position in tiles
 * @returns the height
 */
export function groundHeight(world: World, px: number, py: number): number {
  const x = Math.min(world.n - 1, Math.max(0, Math.floor(px)));
  const y = Math.min(world.n - 1, Math.max(0, Math.floor(py)));
  const fx = Math.min(1, Math.max(0, px - x));
  const fy = Math.min(1, Math.max(0, py - y));
  const a = cornerHeight(world, x, y);
  const b = cornerHeight(world, x + 1, y);
  const c = cornerHeight(world, x, y + 1);
  const d = cornerHeight(world, x + 1, y + 1);
  const top = a + (b - a) * fx;
  const bottom = c + (d - c) * fx;
  return top + (bottom - top) * fy;
}

/**
 * Highest minus lowest corner over a rectangle of tiles.
 *
 * @param world - the world
 * @param x - left tile
 * @param y - top tile
 * @param w - width in tiles
 * @param h - height in tiles
 * @returns the height difference
 */
export function areaSlope(
  world: World,
  x: number,
  y: number,
  w: number,
  h: number,
): number {
  let low = Infinity;
  let high = -Infinity;
  for (let cy = y; cy <= y + h; cy += 1) {
    for (let cx = x; cx <= x + w; cx += 1) {
      const value = cornerHeight(world, cx, cy);
      low = Math.min(low, value);
      high = Math.max(high, value);
    }
  }
  return high - low;
}

/**
 * Mean corner height over a rectangle, where a building's floor sits.
 *
 * @param world - the world
 * @param x - left tile
 * @param y - top tile
 * @param w - width in tiles
 * @param h - height in tiles
 * @returns the floor height
 */
export function areaHeight(
  world: World,
  x: number,
  y: number,
  w: number,
  h: number,
): number {
  let sum = 0;
  let count = 0;
  for (let cy = y; cy <= y + h; cy += 1) {
    for (let cx = x; cx <= x + w; cx += 1) {
      sum += cornerHeight(world, cx, cy);
      count += 1;
    }
  }
  return sum / count;
}

/**
 * Ground kind of a tile; off the map is deep water.
 *
 * @param world - the world
 * @param x - tile column
 * @param y - tile row
 * @returns the terrain
 */
export function terrainAt(world: World, x: number, y: number): Terrain {
  return inBounds(world, x, y)
    ? (world.terrain[y * world.n + x] as Terrain)
    : Terrain.DeepWater;
}

/**
 * Whether a terrain is open sea.
 *
 * @param terrain - the terrain
 * @returns true for water
 */
export function isSea(terrain: Terrain): boolean {
  return terrain === Terrain.Water || terrain === Terrain.DeepWater;
}

/**
 * Whether buildings may stand on a terrain at all.
 *
 * @param terrain - the terrain
 * @returns true for beach, meadow, forest and rock
 */
export function isBuildableTerrain(terrain: Terrain): boolean {
  return (
    terrain === Terrain.Beach ||
    terrain === Terrain.Meadow ||
    terrain === Terrain.Forest ||
    terrain === Terrain.Rock
  );
}

/**
 * Whether any sea tile touches a rectangle from outside.
 *
 * @param world - the world
 * @param x - left tile
 * @param y - top tile
 * @param w - width
 * @param h - height
 * @returns the number of sea tiles along its border
 */
export function seaAlong(
  world: World,
  x: number,
  y: number,
  w: number,
  h: number,
): number {
  let count = 0;
  for (let cx = x - 1; cx <= x + w; cx += 1) {
    for (let cy = y - 1; cy <= y + h; cy += 1) {
      const border =
        cx === x - 1 || cx === x + w || cy === y - 1 || cy === y + h;
      if (border && isSea(terrainAt(world, cx, cy))) {
        count += 1;
      }
    }
  }
  return count;
}

/**
 * Counts tiles in a square reach around a rectangle that pass a test.
 *
 * @param world - the world
 * @param x - left tile
 * @param y - top tile
 * @param w - width
 * @param h - height
 * @param radius - reach in tiles beyond the rectangle
 * @param test - which tiles count
 * @returns how many do
 */
export function countAround(
  world: World,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  test: (index: number) => boolean,
): number {
  let count = 0;
  const centerX = x + w / 2;
  const centerY = y + h / 2;
  const reach = radius + Math.max(w, h) / 2;
  for (let cy = Math.floor(centerY - reach); cy <= centerY + reach; cy += 1) {
    for (let cx = Math.floor(centerX - reach); cx <= centerX + reach; cx += 1) {
      const dx = cx + TILE_CENTER - centerX;
      const dy = cy + TILE_CENTER - centerY;
      if (
        inBounds(world, cx, cy) &&
        dx * dx + dy * dy <= reach * reach &&
        test(cy * world.n + cx)
      ) {
        count += 1;
      }
    }
  }
  return count;
}
