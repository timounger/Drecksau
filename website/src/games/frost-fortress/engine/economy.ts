/**
 * Resources: paying, refunding, and what the buildings make and use each
 * second - energy first, because everything else may depend on it.
 *
 * @module
 */
import { MAP_COLS, MAP_ROWS, terrainAt } from "./map";
import { energyDraw, outputMultiplier, storageLimit } from "./modifiers";
import { runtimeOf } from "./runtime";
import {
  LUMBER_FULL,
  LUMBER_REACH,
  outputFactor,
  SOLDIER_FOOD,
  STRUCTURES,
} from "./structures";
import {
  Terrain,
  type Cost,
  type Game,
  type ResourceId,
  type Resources,
  type Structure,
  type StructureKind,
} from "./types";

/** The resources in display order. */
export const RESOURCE_IDS: readonly ResourceId[] = [
  "wood",
  "iron",
  "stone",
  "energy",
  "food",
  "fuel",
];

/** Half a tile, to measure from the middle of a tile. */
const HALF = 0.5;

/** Most a lumber camp makes from very dense forest, as a factor. */
const LUMBER_CAP = 1.25;

/** Deposit tiles near a mine for its full output. */
const MINE_FULL = 6;

/** Generator output during a blackout. */
const BLACKOUT_OUTPUT = 0.5;

/** Rounding slack when comparing stock and price. */
const EPSILON = 1e-6;

/** Yields per placement, which never change. */
const yieldCache = new Map<
  string,
  { wood: number; iron: number; stone: number; trees: number }
>();

/** How quickly the shown rates follow the real ones. */
const RATE_SMOOTHING = 0.05;

/**
 * Whether the stock covers a price.
 *
 * @param res - the stock
 * @param cost - the price
 * @returns true if every part is there
 */
export function canAfford(res: Resources, cost: Cost): boolean {
  return RESOURCE_IDS.every((id) => res[id] + EPSILON >= (cost[id] ?? 0));
}

/**
 * Takes a price off the stock.
 *
 * @param res - the stock, changed
 * @param cost - the price
 */
export function pay(res: Resources, cost: Cost): void {
  for (const id of RESOURCE_IDS) {
    res[id] = Math.max(0, res[id] - (cost[id] ?? 0));
  }
}

/**
 * Adds resources, up to the storage limit.
 *
 * @param game - the game, changed
 * @param gain - what comes in
 * @param share - the share of it that does (1 for all)
 * @returns how much came in altogether
 */
export function receive(game: Game, gain: Cost, share = 1): number {
  const limit = storageLimit(game);
  let total = 0;
  for (const id of RESOURCE_IDS) {
    const amount = Math.round((gain[id] ?? 0) * share);
    const room = Math.max(0, limit - game.res[id]);
    const taken = Math.min(room, amount);
    game.res[id] += taken;
    total += taken;
  }
  return total;
}

/**
 * Scales a price.
 *
 * @param cost - the price
 * @param factor - the factor
 * @returns the scaled price, rounded up
 */
export function scaleCost(cost: Cost, factor: number): Cost {
  const result: Partial<Record<ResourceId, number>> = {};
  for (const id of RESOURCE_IDS) {
    const amount = cost[id];
    if (amount !== undefined && amount > 0) {
      result[id] = Math.ceil(amount * factor);
    }
  }
  return result;
}

/**
 * Adds two prices.
 *
 * @param a - one price
 * @param b - the other
 * @returns their sum
 */
export function addCost(a: Cost, b: Cost): Cost {
  const result: Partial<Record<ResourceId, number>> = {};
  for (const id of RESOURCE_IDS) {
    const amount = (a[id] ?? 0) + (b[id] ?? 0);
    if (amount > 0) {
      result[id] = amount;
    }
  }
  return result;
}

/**
 * Runs the economy for a moment.
 *
 * @param game - the game, changed
 * @param dt - seconds
 */
export function produce(game: Game, dt: number): void {
  const runtime = runtimeOf(game);
  const before = { ...game.res };
  const multiplier = outputMultiplier(game);
  const blackout = game.effects.some((effect) => effect.kind === "blackout");
  let energyIn = 0;
  let energyOut = 0;
  for (const structure of game.structures) {
    if (structure.built) {
      const made = STRUCTURES[structure.kind].produce?.energy ?? 0;
      const failing = blackout && structure.kind === "generator";
      energyIn +=
        made *
        outputFactor(structure.level) *
        multiplier *
        (failing ? BLACKOUT_OUTPUT : 1);
      energyOut += energyDraw(structure);
    }
  }
  const covered = game.res.energy > energyOut * dt;
  const power =
    covered || energyOut <= 0 ? 1 : Math.min(1, energyIn / energyOut);
  runtime.power = power;
  runtime.energyIn = energyIn;
  runtime.energyOut = energyOut;
  game.res.energy += (energyIn - energyOut * power) * dt;

  for (const structure of game.structures) {
    if (structure.built) {
      makeGoods(game, structure, power, multiplier, dt);
    }
  }
  game.res.food -= game.defenders.length * SOLDIER_FOOD * dt;

  const limit = storageLimit(game);
  for (const id of RESOURCE_IDS) {
    game.res[id] = Math.min(limit, Math.max(0, game.res[id]));
    const rate = dt > 0 ? (game.res[id] - before[id]) / dt : 0;
    const old = runtime.rates[id] ?? rate;
    runtime.rates[id] = old + (rate - old) * RATE_SMOOTHING;
  }
}

/**
 * How well a lumber camp or mine is placed.
 *
 * @param seed - the map's seed
 * @param kind - which structure
 * @param col - its left column
 * @param row - its top row
 * @returns factors on wood (lumber camp) or on iron and stone (mine)
 */
export function siteYield(
  seed: number,
  kind: StructureKind,
  col: number,
  row: number,
): { wood: number; iron: number; stone: number; trees: number } {
  const key = `${seed}:${kind}:${col}:${row}`;
  const known = yieldCache.get(key);
  const result = known ?? measureYield(seed, kind, col, row);
  yieldCache.set(key, result);
  return result;
}

/** Counts trees or deposits around a footprint. */
function measureYield(
  seed: number,
  kind: StructureKind,
  col: number,
  row: number,
): { wood: number; iron: number; stone: number; trees: number } {
  const result = { wood: 1, iron: 1, stone: 1, trees: 0 };
  const def = STRUCTURES[kind];
  if (kind === "lumberCamp") {
    const cx = col + def.width / 2;
    const cy = row + def.height / 2;
    let trees = 0;
    for (
      let r = Math.floor(cy - LUMBER_REACH);
      r <= cy + LUMBER_REACH;
      r += 1
    ) {
      for (
        let c = Math.floor(cx - LUMBER_REACH);
        c <= cx + LUMBER_REACH;
        c += 1
      ) {
        const near = Math.hypot(c + HALF - cx, r + HALF - cy) <= LUMBER_REACH;
        if (near && terrainAt(seed, c, r) === Terrain.Forest) {
          trees += 1;
        }
      }
    }
    result.trees = trees;
    result.wood = Math.min(LUMBER_CAP, trees / LUMBER_FULL);
  } else if (kind === "mine") {
    let iron = 0;
    let stone = 0;
    for (let r = row - 1; r <= row + def.height; r += 1) {
      for (let c = col - 1; c <= col + def.width; c += 1) {
        const inside = c >= 0 && r >= 0 && c < MAP_COLS && r < MAP_ROWS;
        const terrain = inside ? terrainAt(seed, c, r) : Terrain.Rock;
        iron += terrain === Terrain.IronOre ? 1 : 0;
        stone += terrain === Terrain.StoneOre ? 1 : 0;
      }
    }
    result.iron = Math.min(1, iron / MINE_FULL);
    result.stone = Math.min(1, stone / MINE_FULL);
  }
  return result;
}

/** What one building makes this moment (energy aside). */
function makeGoods(
  game: Game,
  structure: Structure,
  power: number,
  multiplier: number,
  dt: number,
): void {
  const def = STRUCTURES[structure.kind];
  const level = outputFactor(structure.level);
  let efficiency = energyDraw(structure) > 0 ? power : 1;
  const wood = def.consume?.wood ?? 0;
  if (wood > 0) {
    const need = wood * level * efficiency * dt;
    const share = need > 0 ? Math.min(1, game.res.wood / need) : 1;
    game.res.wood -= need * share;
    efficiency *= share;
  }
  if (def.produce !== undefined) {
    const site = siteYield(
      game.seed,
      structure.kind,
      structure.col,
      structure.row,
    );
    for (const id of RESOURCE_IDS) {
      const made = id === "energy" ? 0 : (def.produce[id] ?? 0);
      if (made > 0) {
        const place =
          id === "wood" || id === "iron" || id === "stone" ? site[id] : 1;
        game.res[id] += made * level * multiplier * efficiency * place * dt;
      }
    }
  }
}
