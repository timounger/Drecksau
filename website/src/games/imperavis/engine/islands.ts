/**
 * The IslandManager: names islands and measures them - area, coast, forest,
 * deposits, fertility - once the terrain exists.
 *
 * @module
 */
import { nextRandom, randomPick, type Seeded } from "./random";
import { DIRS4, DIRS8, isSea, isBuildableTerrain } from "./terrain";
import { Deposit, Terrain, type Crop, type IslandInfo } from "./types";

/** First syllables of island names - made up for this game. */
const NAME_HEADS = [
  "Mar",
  "Vel",
  "Ost",
  "Kal",
  "Sor",
  "Bren",
  "Tal",
  "Iru",
  "Fen",
  "Hav",
  "Lun",
  "Dor",
  "Sel",
  "Arn",
  "Quel",
  "Tor",
  "Nim",
  "Wen",
  "Rul",
  "Ebb",
] as const;

/** Last syllables of island names. */
const NAME_TAILS = [
  "ora",
  "inde",
  "holm",
  "ar",
  "essa",
  "wyn",
  "ica",
  "ago",
  "und",
  "aria",
  "eth",
  "ven",
  "ok",
  "ila",
] as const;

/** Below this area an island counts as small... */
const SMALL_AREA = 350;

/** ...below this as medium, above as large. */
const MEDIUM_AREA = 900;

/** Attempts to find an unused name before numbering one. */
const NAME_TRIES = 40;

/** Raw facts about the land of one island, gathered tile by tile. */
export type IslandScan = {
  readonly tiles: readonly number[];
};

/**
 * Finds the islands: groups of land tiles joined side by side.
 *
 * @param terrain - terrain per tile
 * @param n - tiles per side
 * @returns the groups, largest first
 */
export function findIslands(terrain: Uint8Array, n: number): number[][] {
  const seen = new Uint8Array(n * n);
  const groups: number[][] = [];
  for (let start = 0; start < n * n; start += 1) {
    if (!seen[start] && !isSea(terrain[start] as Terrain)) {
      const group: number[] = [];
      const stack = [start];
      seen[start] = 1;
      while (stack.length > 0) {
        const index = stack.pop() as number;
        group.push(index);
        const x = index % n;
        const y = Math.floor(index / n);
        for (const [dx, dy] of DIRS4) {
          const nx = x + dx;
          const ny = y + dy;
          const next = ny * n + nx;
          if (
            nx >= 0 &&
            ny >= 0 &&
            nx < n &&
            ny < n &&
            !seen[next] &&
            !isSea(terrain[next] as Terrain)
          ) {
            seen[next] = 1;
            stack.push(next);
          }
        }
      }
      groups.push(group);
    }
  }
  return groups.sort((a, b) => b.length - a.length);
}

/**
 * Makes up island names, never the same twice.
 *
 * @param random - the random state
 * @param count - how many
 * @returns the names
 */
export function islandNames(random: Seeded, count: number): string[] {
  const used = new Set<string>();
  const names: string[] = [];
  for (let i = 0; i < count; i += 1) {
    let name = "";
    for (
      let attempt = 0;
      attempt < NAME_TRIES && (name === "" || used.has(name));
      attempt += 1
    ) {
      name = `${randomPick(random, NAME_HEADS)}${randomPick(random, NAME_TAILS)}`;
    }
    if (used.has(name)) {
      name = `${name} ${i + 1}`;
    }
    used.add(name);
    names.push(name);
  }
  return names;
}

/**
 * Measures one island.
 *
 * @param id - its index
 * @param name - its name
 * @param tiles - its land tiles
 * @param terrain - terrain per tile
 * @param deposits - deposit per tile
 * @param n - tiles per side
 * @param fertile - which crops grow there
 * @returns the facts
 */
export function describeIsland(
  id: number,
  name: string,
  tiles: readonly number[],
  terrain: Uint8Array,
  deposits: Uint8Array,
  n: number,
  fertile: Record<Crop, boolean>,
): IslandInfo {
  let minX = n;
  let minY = n;
  let maxX = 0;
  let maxY = 0;
  let sumX = 0;
  let sumY = 0;
  const counts = { forest: 0, coast: 0, mountain: 0, river: 0, buildable: 0 };
  const found = { stone: 0, clay: 0, ore: 0 };
  for (const index of tiles) {
    const x = index % n;
    const y = Math.floor(index / n);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    sumX += x;
    sumY += y;
    const ground = terrain[index] as Terrain;
    counts.forest += ground === Terrain.Forest ? 1 : 0;
    counts.mountain += ground === Terrain.Mountain ? 1 : 0;
    counts.river += ground === Terrain.River ? 1 : 0;
    counts.buildable += isBuildableTerrain(ground) ? 1 : 0;
    counts.coast += touchesSea(terrain, n, x, y) ? 1 : 0;
    found.stone += deposits[index] === Deposit.Stone ? 1 : 0;
    found.clay += deposits[index] === Deposit.Clay ? 1 : 0;
    found.ore += deposits[index] === Deposit.Ore ? 1 : 0;
  }
  const area = tiles.length;
  return {
    id,
    name,
    area,
    minX,
    minY,
    maxX,
    maxY,
    cx: sumX / area,
    cy: sumY / area,
    fertile,
    deposits: found,
    ...counts,
    size: area < SMALL_AREA ? "small" : area < MEDIUM_AREA ? "medium" : "large",
  };
}

/**
 * Draws which crops grow on an island.
 *
 * @param random - the random state
 * @param grainChance - chance of grain
 * @param grapesChance - chance of grapes
 * @returns the fertility
 */
export function drawFertility(
  random: Seeded,
  grainChance: number,
  grapesChance: number,
): Record<Crop, boolean> {
  return {
    grain: nextRandom(random) < grainChance,
    grapes: nextRandom(random) < grapesChance,
    tobacco: false,
  };
}

/** Whether a land tile has sea among its eight neighbours. */
function touchesSea(
  terrain: Uint8Array,
  n: number,
  x: number,
  y: number,
): boolean {
  let result = false;
  for (const [dx, dy] of DIRS8) {
    const nx = x + dx;
    const ny = y + dy;
    if (
      nx >= 0 &&
      ny >= 0 &&
      nx < n &&
      ny < n &&
      isSea(terrain[ny * n + nx] as Terrain)
    ) {
      result = true;
    }
  }
  return result;
}
