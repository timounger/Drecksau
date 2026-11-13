/**
 * A whole game of IMPERAVIS: creating one with its players, and the fixed
 * simulation step that runs every manager in a set order.
 *
 * @module
 * @remarks
 * Deterministic: the same seed, the same settings and the same commands at
 * the same steps give the same game, because all chance comes from the
 * game's own random state and time only moves in steps of {@link TICK}.
 * Every command carries the id of the player who gives it, the AI players
 * use the same commands as the human - that is what a later server for
 * multiplayer needs.
 */
import { stepAi } from "./ai";
import { stepConstruction } from "./buildings";
import { fillIfCheating } from "./cheat";
import { stepCombat } from "./combat";
import { refreshDerived } from "./derived";
import { createRelations, stepDiplomacy } from "./diplomacy";
import { stepEconomy } from "./economy";
import { perGood } from "./goods";
import { FIRST_INCIDENT, stepIncidents } from "./incidents";
import { FIRST_MISSION, stepMissions } from "./missions";
import { createPlayer, DEFAULT_AI, MAX_AI, RIVALS } from "./players";
import { stepPopulation } from "./population";
import { stepProduction } from "./production";
import { stepResearch } from "./research";
import { createShip, prepareSea, stepShips, stepShipyards } from "./ships";
import { DAY_SECONDS, stepTime, TICK } from "./time";
import { stepRoutes } from "./trade-routes";
import { stepTroops } from "./troops";
import { createTrader, stepTrader } from "./trader";
import { stepTutorial } from "./tutorial";
import { createTutorial } from "./tutorial-data";
import { stepCarts } from "./warehouse";
import { createWorld, shipStart } from "./world";
import type {
  Amounts,
  Game,
  GameSettings,
  IslandState,
  MapSize,
  World,
} from "./types";

/** Gold at the start. */
export const START_GOLD = 3000;

/** What the first ship carries. */
export const START_CARGO: Amounts = {
  planks: 50,
  tools: 14,
  fish: 24,
  bricks: 10,
};

/** Mixed into the seed so the game's chance differs from the terrain's. */
const RNG_SALT = 0x5eed;

/** The first weather lasts this long. */
const FIRST_WEATHER = DAY_SECONDS / 2;

/** The first AI thinks after this many seconds, the next ones a little later. */
const FIRST_THINK = 1;
const THINK_STAGGER = 0.7;

/** AI home islands should lie at least this share of the map apart. */
const RIVAL_SPACING = 0.22;

/** Settings of a new game unless chosen otherwise. */
export const DEFAULT_SETTINGS: GameSettings = {
  aiCount: DEFAULT_AI,
  peaceful: false,
  guided: false,
};

export { TICK };

/**
 * Starts a new game.
 *
 * @param seed - the world seed
 * @param size - the map size
 * @param settings - AI players, peace and the guided start
 * @returns the game
 */
export function createGame(
  seed: number,
  size: MapSize,
  settings: GameSettings = DEFAULT_SETTINGS,
): Game {
  const world = createWorld(seed, size);
  const aiCount = Math.max(0, Math.min(MAX_AI, Math.round(settings.aiCount)));
  const game = emptyGame(world, { ...settings, aiCount });
  const ship = createShip(game, 0, "cog", world.startShip.x, world.startShip.y);
  ship.cargo = { ...START_CARGO };
  for (const [index, island] of rivalIslands(world, aiCount).entries()) {
    const id = index + 1;
    const start = shipStart(world.n, world.terrain, world.islands[island]);
    const rivalShip = createShip(game, id, "cog", start.x, start.y);
    rivalShip.cargo = { ...START_CARGO };
  }
  return game;
}

/**
 * A game on a world, with nothing built and nothing at sea.
 *
 * @param world - the world
 * @param settings - AI players, peace and the guided start
 * @returns the game
 */
export function emptyGame(world: World, settings: GameSettings): Game {
  const n = world.n;
  prepareSea(world);
  const players = [
    createPlayer(0, START_GOLD, null, 0),
    ...RIVALS.slice(0, settings.aiCount).map((rival, index) =>
      createPlayer(
        index + 1,
        START_GOLD,
        rival,
        FIRST_THINK + index * THINK_STAGGER,
      ),
    ),
  ];
  return {
    world,
    settings,
    tick: 0,
    time: 0,
    rng: world.seed ^ RNG_SALT,
    players,
    islands: world.islands.map((info): IslandState => ({
      id: info.id,
      owner: -1,
      stock: perGood(0),
      supply: perGood(0),
      orders: {},
      foundedAt: 0,
      plague: 0,
      harvest: null,
    })),
    buildings: [],
    nextId: 1,
    roads: new Uint8Array(n * n),
    cleared: new Uint8Array(n * n),
    occupancy: new Int32Array(n * n),
    territory: new Uint8Array(n * n),
    coverage: {},
    labour: {},
    traffic: new Uint16Array(n * n),
    links: new Map(),
    carts: [],
    ships: [],
    soldiers: [],
    fleets: [],
    routes: [],
    trader: createTrader(),
    traderShip: -1,
    weather: "clear",
    weatherUntil: FIRST_WEATHER,
    diplomacy: {
      relations: createRelations(players.length),
      offers: [],
      log: [],
    },
    missions: [],
    nextMission: FIRST_MISSION,
    incidents: [],
    nextIncident: FIRST_INCIDENT,
    events: [],
    version: 0,
    dirty: true,
    cheat: false,
    cheated: false,
    goldBeforeCheat: 0,
    tutorial: createTutorial(settings.guided === true),
    tutorialSeen: -1,
  };
}

/**
 * Advances the game by one fixed step.
 *
 * @param game - the game
 */
export function stepGame(game: Game): void {
  refreshDerived(game);
  stepTime(game);
  stepConstruction(game);
  refreshDerived(game);
  stepPopulation(game);
  stepProduction(game);
  stepCarts(game);
  stepShipyards(game);
  stepRoutes(game);
  stepTrader(game);
  stepShips(game);
  stepCombat(game);
  stepTroops(game);
  stepIncidents(game);
  stepResearch(game);
  stepDiplomacy(game);
  stepMissions(game);
  stepAi(game);
  stepEconomy(game);
  fillIfCheating(game);
  stepTutorial(game);
}

/**
 * Runs the game for a span of game time.
 *
 * @param game - the game
 * @param seconds - game seconds
 */
export function runFor(game: Game, seconds: number): void {
  const steps = Math.round(seconds / TICK);
  for (let i = 0; i < steps; i += 1) {
    stepGame(game);
  }
}

/**
 * Home islands for the AI players: good land, far from the human and from
 * each other.
 *
 * @param world - the world
 * @param count - how many
 * @returns island ids
 */
function rivalIslands(world: World, count: number): number[] {
  const chosen: number[] = [world.startIsland];
  const spacing = world.n * RIVAL_SPACING;
  for (let k = 0; k < count; k += 1) {
    let best = -1;
    let bestScore = -Infinity;
    for (const info of world.islands) {
      if (!chosen.includes(info.id)) {
        const nearest = Math.min(
          ...chosen.map((id) =>
            Math.hypot(
              world.islands[id].cx - info.cx,
              world.islands[id].cy - info.cy,
            ),
          ),
        );
        const score =
          info.buildable +
          info.forest +
          (info.fertile.grain ? info.buildable / 2 : 0) +
          (nearest >= spacing ? world.n * world.n : nearest * world.n);
        if (score > bestScore) {
          best = info.id;
          bestScore = score;
        }
      }
    }
    if (best >= 0) {
      chosen.push(best);
    }
  }
  return chosen.slice(1);
}
