/**
 * The numbers the screen shows that the game does not keep as such: goods
 * made and used per minute, the mean mood, the stage of development, an
 * island's summary and the table of production with its bottlenecks.
 *
 * @module
 * @remarks
 * Everything is read from the running game with the engine's own rules
 * (speed of a producer, wants of a tier, taxes of a house, upkeep of a
 * building), nothing is stored. Cheap enough to run a few times a second.
 */
import { BUILDING } from "@/games/imperavis/engine/buildings-data";
import { upkeepOf } from "@/games/imperavis/engine/economy";
import { GOOD_IDS } from "@/games/imperavis/engine/goods";
import { linkKind } from "@/games/imperavis/engine/logistics";
import { HUMAN, playerById } from "@/games/imperavis/engine/players";
import { centerTile, houseTax } from "@/games/imperavis/engine/population";
import { speedOf } from "@/games/imperavis/engine/production";
import { isBuildableTerrain } from "@/games/imperavis/engine/terrain";
import { TIERS } from "@/games/imperavis/engine/tiers";
import { capacityOf } from "@/games/imperavis/engine/warehouse";
import type {
  Building,
  Crop,
  Game,
  GoodId,
  LinkKind,
  ProducerStatus,
  Terrain,
} from "@/games/imperavis/engine/types";

/** Seconds in a minute. */
const MINUTE = 60;

/** Supply at or above this counts as good. */
const WELL_SUPPLIED = 0.75;

/** Supply below this counts as want. */
const POORLY_SUPPLIED = 0.4;

/** Goods made and used per minute. */
export type Flow = { made: number; used: number };

/** The crops an island may be fertile for, in display order. */
export const CROPS: readonly Crop[] = ["grain", "grapes", "tobacco"];

/** How well an island's people are supplied, in words. */
export type EconomyState = "good" | "mixed" | "poor" | "none";

/** Producer states that count as a bottleneck, and are not just waiting. */
const STALLS: readonly ProducerStatus[] = [
  "noInput",
  "noWorkers",
  "noResource",
  "noRoad",
  "full",
];

/** What the island overview shows. */
export type IslandSummary = {
  readonly residents: number;
  readonly balance: number;
  readonly buildings: number;
  readonly storage: number;
  readonly freeTiles: number;
  readonly producers: number;
  readonly efficiency: number;
  /** Mean supply of what the residents want, or null without wants. */
  readonly supply: number | null;
  readonly kontor: Building | null;
  readonly docked: number;
  readonly yard: boolean;
};

/** One row of the production table. */
export type ProductionRow = {
  readonly good: GoodId;
  readonly made: number;
  readonly used: number;
  readonly plants: number;
  /** Producers of this good that stand still, by reason. */
  readonly stalls: Partial<Record<ProducerStatus, number>>;
  /** Producers whose carts come over open land (slower). */
  readonly overLand: number;
  /** Producers no cart reaches. */
  readonly cutOff: number;
  /** Goods of this kind waiting in the producers for a cart. */
  readonly waiting: number;
};

/**
 * Goods made and used per minute right now, by producers and residents.
 *
 * @param game - the game
 * @param island - one island, or null for all the human's islands
 * @returns the flow of every good
 */
export function goodFlows(
  game: Game,
  island: number | null,
): Record<GoodId, Flow> {
  const flows = Object.fromEntries(
    GOOD_IDS.map((good) => [good, { made: 0, used: 0 }]),
  ) as Record<GoodId, Flow>;
  const n = game.world.n;
  const market = game.coverage.market;
  for (const building of game.buildings) {
    if (counts(game, building, island)) {
      const recipe = BUILDING[building.kind].recipe;
      const prod = building.prod;
      if (prod !== null && recipe !== null && building.complete) {
        const cycles =
          (prod.efficiency * speedOf(game, building) * MINUTE) / recipe.seconds;
        flows[recipe.output].made += cycles * recipe.amount;
        for (const input of recipe.inputs) {
          flows[input.good].used += cycles * input.amount;
        }
      }
      const house = building.house;
      if (
        house !== null &&
        building.complete &&
        market?.[centerTile(building, n)] === 1
      ) {
        for (const want of TIERS[house.tier].goods) {
          flows[want.good].used += house.residents * want.rate;
        }
      }
    }
  }
  return flows;
}

/**
 * The mean satisfaction of the human's residents.
 *
 * @param game - the game
 * @returns 0 to 1, or null without residents
 */
export function meanSatisfaction(game: Game): number | null {
  let residents = 0;
  let mood = 0;
  for (const building of game.buildings) {
    const house = building.house;
    if (house !== null && game.islands[building.island].owner === HUMAN) {
      residents += house.residents;
      mood += house.satisfaction * house.residents;
    }
  }
  return residents > 0 ? mood / residents : null;
}

/**
 * The highest tier the human's people have reached.
 *
 * @param tiers - residents per tier
 * @returns the tier index, or -1 without residents
 */
export function topTier(tiers: readonly number[]): number {
  let top = -1;
  tiers.forEach((count, tier) => {
    if (count > 0) {
      top = tier;
    }
  });
  return top;
}

/**
 * Income of the last minute split into money in and money out.
 *
 * @param game - the game
 * @returns gold in and out of the last full minute
 */
export function incomeAndExpenses(game: Game): {
  income: number;
  expenses: number;
} {
  const line = game.players[HUMAN].ledger.last;
  return {
    income: line.taxes + line.sales + line.rewards,
    expenses:
      line.upkeepBuildings +
      line.upkeepShips +
      line.purchases +
      line.construction +
      line.payments,
  };
}

/**
 * The facts of one island for the island overview.
 *
 * @param game - the game
 * @param island - the island id
 * @returns the summary
 */
export function islandSummary(game: Game, island: number): IslandSummary {
  const state = game.islands[island];
  const owner = playerById(game, state.owner);
  let residents = 0;
  let taxes = 0;
  let upkeep = 0;
  let buildings = 0;
  let producers = 0;
  let efficiency = 0;
  let yard = false;
  let kontor: Building | null = null;
  for (const building of game.buildings) {
    if (building.island === island) {
      buildings += 1;
      upkeep += upkeepOf(building);
      if (building.house !== null) {
        residents += building.house.residents;
        taxes += owner === null ? 0 : houseTax(owner, building.house);
      }
      if (building.prod !== null && building.complete) {
        producers += 1;
        efficiency += building.prod.efficiency;
      }
      yard = yard || building.kind === "shipyard";
      kontor = building.kind === "kontor" ? building : kontor;
    }
  }
  const docked =
    kontor === null
      ? 0
      : game.ships.filter((ship) => ship.docked === (kontor as Building).id)
          .length;
  return {
    residents,
    balance: taxes - upkeep,
    buildings,
    storage: capacityOf(game, island),
    freeTiles: freeTiles(game, island),
    producers,
    efficiency: producers > 0 ? efficiency / producers : 0,
    supply: islandSupply(game, island),
    kontor,
    docked,
    yard,
  };
}

/**
 * How well an island's people are supplied, in words.
 *
 * @param game - the game
 * @param island - the island id
 * @returns the state
 */
export function islandEconomy(game: Game, island: number): EconomyState {
  const supply = islandSupply(game, island);
  let state: EconomyState = "none";
  if (supply !== null) {
    state =
      supply >= WELL_SUPPLIED
        ? "good"
        : supply >= POORLY_SUPPLIED
          ? "mixed"
          : "poor";
  }
  return state;
}

/**
 * The goods an island makes, most first.
 *
 * @param game - the game
 * @param island - the island id
 * @returns goods and units per minute
 */
export function islandProducts(
  game: Game,
  island: number,
): { good: GoodId; rate: number }[] {
  const rates = new Map<GoodId, number>();
  for (const building of game.buildings) {
    const recipe = BUILDING[building.kind].recipe;
    const prod = building.prod;
    if (
      building.island === island &&
      prod !== null &&
      recipe !== null &&
      building.complete
    ) {
      const rate =
        (prod.efficiency * speedOf(game, building) * MINUTE * recipe.amount) /
        recipe.seconds;
      rates.set(recipe.output, (rates.get(recipe.output) ?? 0) + rate);
    }
  }
  return [...rates.entries()]
    .map(([good, rate]) => ({ good, rate }))
    .sort((a, b) => b.rate - a.rate);
}

/**
 * The production table: per good the human makes or uses, how much, by how
 * many producers, and which of them stand still and why.
 *
 * @param game - the game
 * @param island - one island, or null for all
 * @returns the rows, goods with producers first
 */
export function productionRows(
  game: Game,
  island: number | null,
): ProductionRow[] {
  const flows = goodFlows(game, island);
  const plants = new Map<GoodId, number>();
  const stalls = new Map<GoodId, Partial<Record<ProducerStatus, number>>>();
  const links = new Map<GoodId, Record<LinkKind, number>>();
  const waiting = new Map<GoodId, number>();
  for (const building of game.buildings) {
    const recipe = BUILDING[building.kind].recipe;
    const prod = building.prod;
    if (
      counts(game, building, island) &&
      prod !== null &&
      recipe !== null &&
      building.complete
    ) {
      plants.set(recipe.output, (plants.get(recipe.output) ?? 0) + 1);
      const kinds = links.get(recipe.output) ?? { road: 0, land: 0, none: 0 };
      kinds[linkKind(game, building)] += 1;
      links.set(recipe.output, kinds);
      waiting.set(
        recipe.output,
        (waiting.get(recipe.output) ?? 0) + Math.floor(prod.output),
      );
      if (STALLS.includes(prod.status) && !building.paused) {
        const entry = stalls.get(recipe.output) ?? {};
        entry[prod.status] = (entry[prod.status] ?? 0) + 1;
        stalls.set(recipe.output, entry);
      }
    }
  }
  return GOOD_IDS.filter(
    (good) =>
      (plants.get(good) ?? 0) > 0 ||
      flows[good].used > 0 ||
      flows[good].made > 0,
  )
    .map((good) => ({
      good,
      made: flows[good].made,
      used: flows[good].used,
      plants: plants.get(good) ?? 0,
      stalls: stalls.get(good) ?? {},
      overLand: links.get(good)?.land ?? 0,
      cutOff: links.get(good)?.none ?? 0,
      waiting: waiting.get(good) ?? 0,
    }))
    .sort((a, b) => b.plants - a.plants);
}

/** Whether a building counts for one island, or for all the human's. */
function counts(
  game: Game,
  building: Building,
  island: number | null,
): boolean {
  return island === null
    ? game.islands[building.island].owner === HUMAN
    : building.island === island;
}

/** Mean supply of the goods an island's residents want, or null. */
function islandSupply(game: Game, island: number): number | null {
  const wanted = new Set<GoodId>();
  for (const building of game.buildings) {
    if (building.island === island && building.house !== null) {
      for (const want of TIERS[building.house.tier].goods) {
        wanted.add(want.good);
      }
    }
  }
  const supply = game.islands[island].supply;
  const goods = [...wanted];
  return goods.length === 0
    ? null
    : goods.reduce((sum, good) => sum + supply[good], 0) / goods.length;
}

/** Free tiles in the island's building ground. */
function freeTiles(game: Game, island: number): number {
  const world = game.world;
  const info = world.islands[island];
  const n = world.n;
  let free = 0;
  for (let y = info.minY; y <= info.maxY; y += 1) {
    for (let x = info.minX; x <= info.maxX; x += 1) {
      const index = y * n + x;
      if (
        world.islandOf[index] === island &&
        game.territory[index] === 1 &&
        game.occupancy[index] === 0 &&
        game.roads[index] === 0 &&
        isBuildableTerrain(world.terrain[index] as Terrain)
      ) {
        free += 1;
      }
    }
  }
  return free;
}
