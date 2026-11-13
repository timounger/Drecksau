/**
 * The PopulationManager: what residents consume, how satisfied they are,
 * the taxes they pay, how houses fill, empty, rise to the next tier and fall
 * back, how many workers each island has, and what that unlocks.
 *
 * @module
 */
import {
  BUILDING,
  BUILDINGS,
  DECOR_BEAUTY,
  DECOR_CAP,
  DECOR_KINDS,
} from "./buildings-data";
import { earn } from "./economy";
import { hasAmounts, takeAmounts } from "./placement";
import { ownerOf, playerById } from "./players";
import { TICK } from "./time";
import { needCount, TIERS, TOP_TIER } from "./tiers";
import type {
  Building,
  Game,
  GoodId,
  HouseState,
  Player,
  TaxLevel,
} from "./types";

/** Seconds between two population rounds. */
export const POPULATION_EVERY = 1;

/** Steps per population round. */
const ROUND_STEPS = Math.round(POPULATION_EVERY / TICK);

/** Seconds in a minute, for per-minute rates. */
const PER_MINUTE = 60;

/** How quickly the remembered supply follows the real one, per round. */
const SUPPLY_BLEND = 0.15;

/** How quickly satisfaction follows its target, per round. */
const SATISFACTION_BLEND = 0.1;

/** A house holds at least this share of its residents, needs or not. */
const BASE_SHARE = 0.25;

/** Seconds between two residents moving in or out. */
const GROWTH_SECONDS = 5;

/** Seconds between two tries to rise. */
const UPGRADE_SECONDS = 8;

/** Every need must be met at least this well to rise... */
export const RISE_NEED = 0.75;

/** ...and satisfaction be at least this. */
const RISE_SATISFACTION = 0.6;

/** Below this satisfaction a house starts to decline... */
export const DECLINE_SATISFACTION = 0.3;

/** ...and after this many seconds of it, it falls back a tier. */
export const DECLINE_SECONDS = 90;

/** Supply below this counts as a shortage. */
const SHORTAGE = 0.35;

/** A plague lowers the mood of houses without a doctor by this much. */
export const PLAGUE_MOOD = 0.35;

/** Tax factor and its effect on satisfaction, per tax level. */
export const TAX_LEVELS: Readonly<
  Record<TaxLevel, { factor: number; mood: number }>
> = {
  0: { factor: 0.7, mood: 0.1 },
  1: { factor: 1, mood: 0 },
  2: { factor: 1.35, mood: -0.12 },
};

/** Satisfaction adds this much on top of the base tax. */
const TAX_MOOD_SHARE = 0.5;

/**
 * A fresh house of the lowest tier.
 *
 * @returns its state
 */
export function createHouse(): HouseState {
  return {
    tier: 0,
    residents: 0,
    satisfaction: 0,
    needs: new Array<number>(needCount(0)).fill(0),
    growth: GROWTH_SECONDS,
    upgrade: UPGRADE_SECONDS,
    blocked: "none",
    decline: 0,
  };
}

/**
 * Residents per tier of one player, or on one island.
 *
 * @param game - the game
 * @param island - an island id, or null for all islands of the player
 * @param player - whose residents, when no island is given
 * @returns counts by tier index
 */
export function residentsByTier(
  game: Game,
  island: number | null,
  player = 0,
): number[] {
  const counts = new Array<number>(TIERS.length).fill(0);
  for (const building of game.buildings) {
    if (
      building.house !== null &&
      (island === null
        ? ownerOf(game, building) === player
        : building.island === island)
    ) {
      counts[building.house.tier] += building.house.residents;
    }
  }
  return counts;
}

/**
 * All residents of a player.
 *
 * @param game - the game
 * @param player - the player id
 * @returns the head count
 */
export function populationOf(game: Game, player: number): number {
  return residentsByTier(game, null, player).reduce((a, b) => a + b, 0);
}

/**
 * Taxes a house pays per minute at its owner's tax level and its mood.
 *
 * @param owner - the player the house belongs to
 * @param house - the house
 * @returns gold per minute
 */
export function houseTax(owner: Player, house: HouseState): number {
  return (
    house.residents *
    TIERS[house.tier].tax *
    TAX_LEVELS[owner.taxLevel].factor *
    (1 - TAX_MOOD_SHARE + TAX_MOOD_SHARE * house.satisfaction)
  );
}

/**
 * Satisfaction the decorations in reach add to a house on a tile.
 *
 * @param game - the game
 * @param at - tile index of the house's centre
 * @returns a share from 0 to {@link DECOR_CAP}
 */
export function beautyAt(game: Game, at: number): number {
  let sum = 0;
  for (const kind of DECOR_KINDS) {
    if (game.coverage[kind]?.[at] === 1) {
      sum += DECOR_BEAUTY[kind] ?? 0;
    }
  }
  return Math.min(DECOR_CAP, sum);
}

/**
 * Tile index under a building's centre, as the houses use it for reach.
 *
 * @param building - the building
 * @param n - tiles per side of the map
 * @returns the tile index
 */
export function centerTile(building: Building, n: number): number {
  return centerIndex(building, n);
}

/**
 * Workers needed per tier on an island, by working producers.
 *
 * @param game - the game
 * @param island - the island id
 * @returns counts by tier index
 */
export function workersNeeded(game: Game, island: number): number[] {
  const counts = new Array<number>(TIERS.length).fill(0);
  for (const building of game.buildings) {
    const workers = BUILDING[building.kind].workers;
    if (
      workers !== null &&
      building.island === island &&
      building.complete &&
      !building.paused
    ) {
      counts[workers.tier] += workers.count;
    }
  }
  return counts;
}

/**
 * One population round, every {@link POPULATION_EVERY} seconds.
 *
 * @param game - the game
 */
export function stepPopulation(game: Game): void {
  if (game.tick % ROUND_STEPS === 0) {
    for (const island of game.islands) {
      if (island.owner >= 0) {
        game.labour[island.id] = labourShares(game, island.id);
        consume(game, island.id);
        island.plague = Math.max(0, island.plague - POPULATION_EVERY);
      }
    }
    for (const building of game.buildings) {
      const owner = playerById(game, ownerOf(game, building));
      if (building.house !== null && building.complete && owner !== null) {
        live(game, owner, building, building.house);
      }
    }
    for (const player of game.players) {
      unlockAndCount(game, player);
    }
  }
}

/**
 * Whether a tier is open to a player's houses.
 *
 * @param player - the player
 * @param tier - the tier index
 * @returns true when its research is done or it needs none
 */
export function tierOpen(player: Player, tier: number): boolean {
  const research = TIERS[tier]?.research ?? null;
  return (
    tier <= TOP_TIER &&
    (research === null || player.research.done.includes(research))
  );
}

/**
 * Share of needed workers present per tier. Higher tiers fill the jobs of
 * lower ones when their own are taken.
 */
function labourShares(game: Game, island: number): number[] {
  const have = residentsByTier(game, island);
  const need = workersNeeded(game, island);
  const shares = new Array<number>(TIERS.length).fill(1);
  let spare = 0;
  for (let tier = TIERS.length - 1; tier >= 0; tier -= 1) {
    const available = have[tier] + spare;
    const filled = Math.min(need[tier], available);
    shares[tier] = need[tier] > 0 ? filled / need[tier] : 1;
    spare = available - filled;
  }
  return shares;
}

/** Residents in reach of a market take their goods from the island. */
function consume(game: Game, islandId: number): void {
  const island = game.islands[islandId];
  const market = game.coverage.market;
  const demand: Partial<Record<GoodId, number>> = {};
  const n = game.world.n;
  for (const building of game.buildings) {
    const house = building.house;
    if (
      house !== null &&
      building.island === islandId &&
      building.complete &&
      market !== undefined &&
      market[centerIndex(building, n)] === 1
    ) {
      for (const want of TIERS[house.tier].goods) {
        demand[want.good] =
          (demand[want.good] ?? 0) +
          (house.residents * want.rate * POPULATION_EVERY) / PER_MINUTE;
      }
    }
  }
  for (const [good, amount] of Object.entries(demand) as [GoodId, number][]) {
    const taken = Math.min(amount, island.stock[good]);
    island.stock[good] -= taken;
    const ratio = amount > 0 ? taken / amount : 1;
    const before = island.supply[good];
    island.supply[good] += (ratio - before) * SUPPLY_BLEND;
    if (before >= SHORTAGE && island.supply[good] < SHORTAGE) {
      game.events.push({
        type: "shortage",
        player: island.owner,
        island: islandId,
        good,
      });
    }
  }
}

/** Tile index under a building's centre. */
function centerIndex(building: Building, n: number): number {
  return (
    Math.floor(building.y + building.h / 2) * n +
    Math.floor(building.x + building.w / 2)
  );
}

/** One round of a house: needs, mood, taxes, residents, rising and falling. */
function live(
  game: Game,
  owner: Player,
  building: Building,
  house: HouseState,
): void {
  const tier = TIERS[house.tier];
  const n = game.world.n;
  const at = centerIndex(building, n);
  const island = game.islands[building.island];
  const market = game.coverage.market?.[at] === 1;
  const needs: number[] = [];
  for (const want of tier.goods) {
    needs.push(market ? Math.max(0, Math.min(1, island.supply[want.good])) : 0);
  }
  for (const service of tier.services) {
    needs.push(game.coverage[service]?.[at] === 1 ? 1 : 0);
  }
  house.needs = needs;
  const mean =
    needs.reduce((sum, value) => sum + value, 0) / Math.max(1, needs.length);
  const sick = island.plague > 0 && game.coverage.doctor?.[at] !== 1;
  const target = Math.max(
    0,
    Math.min(
      1,
      mean +
        TAX_LEVELS[owner.taxLevel].mood -
        (sick ? PLAGUE_MOOD : 0) +
        beautyAt(game, at),
    ),
  );
  house.satisfaction += (target - house.satisfaction) * SATISFACTION_BLEND;
  // Taxes.
  const perMinute = houseTax(owner, house);
  earn(owner, (perMinute * POPULATION_EVERY) / PER_MINUTE, "taxes");
  // Residents follow what the house offers.
  const wanted = Math.round(
    tier.capacity * (BASE_SHARE + (1 - BASE_SHARE) * house.satisfaction),
  );
  house.growth -= POPULATION_EVERY;
  if (house.growth <= 0 && wanted !== house.residents) {
    house.residents += wanted > house.residents ? 1 : -1;
    house.growth = GROWTH_SECONDS;
  }
  house.decline =
    house.satisfaction < DECLINE_SATISFACTION && house.tier > 0
      ? house.decline + POPULATION_EVERY
      : 0;
  if (house.decline >= DECLINE_SECONDS) {
    fall(game, owner, building, house);
  }
  house.upgrade -= POPULATION_EVERY;
  if (house.upgrade <= 0) {
    house.upgrade = UPGRADE_SECONDS;
    rise(game, owner, building, house, needs);
  }
}

/** A badly supplied house falls back a tier. */
function fall(
  game: Game,
  owner: Player,
  building: Building,
  house: HouseState,
): void {
  house.tier -= 1;
  house.decline = 0;
  house.residents = Math.min(house.residents, TIERS[house.tier].capacity);
  house.needs = new Array<number>(needCount(house.tier)).fill(0);
  game.events.push({
    type: "downgraded",
    player: owner.id,
    tier: house.tier,
    x: building.x,
    y: building.y,
  });
  game.version += 1;
}

/** Tries to lift a house to the next tier. */
function rise(
  game: Game,
  owner: Player,
  building: Building,
  house: HouseState,
  needs: readonly number[],
): void {
  const next = house.tier + 1;
  const stock = game.islands[building.island].stock;
  let blocked: HouseState["blocked"] = "none";
  if (house.tier >= TOP_TIER) {
    blocked = "locked";
  } else if (
    !needs.every((value) => value >= RISE_NEED) ||
    house.satisfaction < RISE_SATISFACTION
  ) {
    blocked = "needs";
  } else if (house.residents < TIERS[house.tier].capacity) {
    blocked = "full";
  } else if (!tierOpen(owner, next)) {
    blocked = "research";
  } else if (!hasAmounts(stock, TIERS[next].upgradeCost)) {
    blocked = "materials";
  } else {
    takeAmounts(stock, TIERS[next].upgradeCost);
    house.tier = next;
    house.needs = new Array<number>(needCount(next)).fill(0);
    game.events.push({
      type: "upgraded",
      player: owner.id,
      tier: next,
      x: building.x,
      y: building.y,
    });
    game.version += 1;
  }
  house.blocked = blocked;
}

/** Unlocks buildings by residents reached and keeps the peak numbers. */
function unlockAndCount(game: Game, player: Player): void {
  const counts = residentsByTier(game, null, player.id);
  // Residents of a tier or above.
  const atLeast = counts.map((_, tier) =>
    counts.slice(tier).reduce((sum, value) => sum + value, 0),
  );
  for (const def of BUILDINGS) {
    const researched =
      def.research === null || player.research.done.includes(def.research);
    const peopled =
      def.unlock === null || atLeast[def.unlock.tier] >= def.unlock.residents;
    if (
      (def.unlock !== null || def.research !== null) &&
      !player.unlocked.includes(def.kind) &&
      researched &&
      peopled
    ) {
      player.unlocked.push(def.kind);
      game.events.push({ type: "unlocked", player: player.id, kind: def.kind });
    }
  }
  const total = atLeast[0];
  player.stats.peakPopulation = Math.max(player.stats.peakPopulation, total);
  counts.forEach((count, tier) => {
    if (count > 0) {
      player.stats.peakTier = Math.max(player.stats.peakTier, tier);
    }
  });
}
