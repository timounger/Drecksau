/**
 * The SaveManager's format: a game as plain JSON and back, and the way old
 * saves of the first version are brought up to date.
 *
 * @module
 * @remarks
 * The terrain is not saved - it comes back from seed and size. Saved are
 * the things the players changed and the running state: buildings, roads,
 * felled trees, stocks, people, ships, routes, the trader, every player's
 * treasury, research and AI mind, diplomacy, missions, chance events, the
 * time, the weather and the random state, and since format 3 the land
 * troops, the races for crown orders and what each AI has looked at.
 * Decorations are ordinary buildings, and the carts' priority of a building
 * is filled in as off when a save has none, so format 3 stays as it was.
 * Paved roads are listed apart (`paved`); a save without the list has plain
 * roads only, so format 3 stays as it was here too.
 * The guided start (task, on or off, the times of the tasks done) is saved
 * too; a save without it - every save from before it - loads with the
 * guided start off, so everything opens by the usual rules.
 * Format 4 brought the shipyard queue, the kinds of land units with their
 * orders and formations, the training queue of the barracks (with pause),
 * the war orders of ships (attack, patrol, escort) and the fleets; the
 * goods weapons, cannons and steam engines start at nothing in older saves.
 * Formats 1 (the first version, one player), 2 (rivals, before troops) and
 * 3 (before format 4) are converted on loading; anything else is refused.
 */
import { FIRST_MISSION } from "./missions";
import { emptyGame } from "./game";
import { emptyLine } from "./economy";
import { perGood } from "./goods";
import { FIRST_INCIDENT } from "./incidents";
import { NO_ROAD, PAVED_ROAD, PLAIN_ROAD } from "./logistics-data";
import { emptyStats } from "./players";
import { SHIP } from "./ships-data";
import { OLD_SOLDIER } from "./units-data";
import { createTrader } from "./trader";
import { createTutorial } from "./tutorial-data";
import { BUILDING, STARTING_UNLOCKS } from "./buildings-data";
import { createWorld } from "./world";
import type {
  Building,
  Cart,
  DiplomacyState,
  Fleet,
  Game,
  GameSettings,
  Incident,
  IslandState,
  MapSize,
  Mission,
  Player,
  Ship,
  Soldier,
  TradeRoute,
  TraderState,
  TutorialState,
  WeatherKind,
} from "./types";

/** Version of the format. */
export const SAVE_FORMAT = 4;

/** The format before fleets, unit kinds and queues, still loaded. */
export const TROOPS_FORMAT = 3;

/** The first version's format, still loaded. */
export const OLD_FORMAT = 1;

/** The second version's format (rivals, no troops yet), still loaded. */
export const RIVALS_FORMAT = 2;

/** A game as stored. */
export type SaveData = {
  readonly format: number;
  readonly seed: number;
  readonly size: MapSize;
  readonly settings: GameSettings;
  readonly tick: number;
  readonly time: number;
  readonly rng: number;
  readonly players: Player[];
  readonly islands: IslandState[];
  readonly buildings: Building[];
  readonly nextId: number;
  /** Tile indices with a road, plain or paved. */
  readonly roads: number[];
  /** Tile indices whose road is paved; missing in saves from before paving. */
  readonly paved?: number[];
  /** Tile indices whose trees were felled. */
  readonly cleared: number[];
  readonly carts: Cart[];
  readonly ships: Ship[];
  /** Soldiers on land and aboard (format 3). */
  readonly soldiers: Soldier[];
  /** The fleets (format 4). */
  readonly fleets?: Fleet[];
  readonly routes: TradeRoute[];
  readonly trader: TraderState;
  readonly traderShip: number;
  readonly weather: WeatherKind;
  readonly weatherUntil: number;
  readonly diplomacy: DiplomacyState;
  readonly missions: Mission[];
  readonly nextMission: number;
  readonly incidents: Incident[];
  readonly nextIncident: number;
  /** Worker shares per island and tier, so a loaded game goes on exactly. */
  readonly labour: Record<number, number[]>;
  /** Missing in saves from before the cheat mode. */
  readonly cheat?: boolean;
  /** Missing in saves from before the cheat mode. */
  readonly cheated?: boolean;
  /** Missing in saves from before the cheat mode. */
  readonly goldBeforeCheat?: number;
  /** Missing in saves from before the guided start: then it is off. */
  readonly tutorial?: TutorialState;
};

/**
 * Turns a game into its saved form.
 *
 * @param game - the game
 * @returns plain data, safe to stringify
 */
export function toSave(game: Game): SaveData {
  const data: SaveData = {
    format: SAVE_FORMAT,
    seed: game.world.seed,
    size: game.world.size,
    settings: game.settings,
    tick: game.tick,
    time: game.time,
    rng: game.rng,
    players: game.players,
    islands: game.islands,
    buildings: game.buildings,
    nextId: game.nextId,
    roads: indicesOf(game.roads, (value) => value !== NO_ROAD),
    paved: indicesOf(game.roads, (value) => value === PAVED_ROAD),
    cleared: indicesOf(game.cleared, (value) => value !== 0),
    carts: game.carts,
    ships: game.ships,
    soldiers: game.soldiers,
    fleets: game.fleets,
    routes: game.routes,
    trader: game.trader,
    traderShip: game.traderShip,
    weather: game.weather,
    weatherUntil: game.weatherUntil,
    diplomacy: game.diplomacy,
    missions: game.missions,
    nextMission: game.nextMission,
    incidents: game.incidents,
    nextIncident: game.nextIncident,
    labour: game.labour,
    cheat: game.cheat,
    cheated: game.cheated,
    goldBeforeCheat: game.goldBeforeCheat,
    tutorial: game.tutorial,
  };
  // A deep copy, so the stored game never shares objects with the live one.
  return JSON.parse(JSON.stringify(data)) as SaveData;
}

/**
 * Brings a saved game back to life; a save of the first version is
 * converted first.
 *
 * @param data - the saved form
 * @returns the game
 */
export function fromSave(data: SaveData): Game {
  const plain = JSON.parse(JSON.stringify(data)) as SaveData;
  const copy =
    data.format === SAVE_FORMAT
      ? plain
      : upgradeTroops(
          data.format === TROOPS_FORMAT
            ? plain
            : upgradeRivals(
                data.format === OLD_FORMAT
                  ? upgradeOld(plain as unknown as OldSave)
                  : plain,
              ),
        );
  const fresh = createTrader();
  const game = emptyGame(createWorld(copy.seed, copy.size), copy.settings);
  for (const index of copy.roads) {
    game.roads[index] = PLAIN_ROAD;
  }
  for (const index of copy.paved ?? []) {
    game.roads[index] = PAVED_ROAD;
  }
  for (const index of copy.cleared) {
    game.cleared[index] = 1;
  }
  Object.assign(game, {
    tick: copy.tick,
    time: copy.time,
    rng: copy.rng,
    // Kinds open from the start that came after the save (the simple
    // decorations) are opened for everyone.
    players: copy.players.map((player) => ({
      ...player,
      unlocked: [
        ...player.unlocked,
        ...STARTING_UNLOCKS.filter((kind) => !player.unlocked.includes(kind)),
      ],
    })),
    // Goods that came after a save start at nothing.
    islands: copy.islands.map((island) => ({
      ...island,
      stock: { ...perGood(0), ...island.stock },
      supply: { ...perGood(0), ...island.supply },
    })),
    // Saves from before the carts' priority have none set.
    buildings: copy.buildings.map((building) => ({
      ...building,
      priority: building.priority === true,
    })),
    nextId: copy.nextId,
    carts: copy.carts,
    ships: copy.ships,
    soldiers: copy.soldiers,
    fleets: copy.fleets ?? [],
    routes: copy.routes,
    trader: {
      ...copy.trader,
      pressure: { ...fresh.pressure, ...copy.trader.pressure },
      stock: { ...fresh.stock, ...copy.trader.stock },
    },
    traderShip: copy.traderShip,
    weather: copy.weather,
    weatherUntil: copy.weatherUntil,
    diplomacy: copy.diplomacy,
    missions: copy.missions,
    nextMission: copy.nextMission,
    incidents: copy.incidents,
    nextIncident: copy.nextIncident,
    labour: copy.labour ?? {},
    dirty: true,
    cheat: copy.cheat === true,
    cheated: copy.cheated === true || copy.cheat === true,
    goldBeforeCheat: copy.goldBeforeCheat ?? 0,
    tutorial: copy.tutorial ?? createTutorial(false),
  });
  return game;
}

/**
 * Whether a value looks like a saved game this version can load.
 *
 * @param value - anything
 * @returns true if it can be loaded
 */
export function isSaveData(value: unknown): value is SaveData {
  const data = value as SaveData & { gold?: number };
  const common =
    typeof value === "object" &&
    value !== null &&
    Number.isInteger(data.seed) &&
    (data.size === "small" ||
      data.size === "medium" ||
      data.size === "large") &&
    typeof data.time === "number" &&
    Array.isArray(data.islands) &&
    Array.isArray(data.buildings) &&
    Array.isArray(data.roads) &&
    Array.isArray(data.ships) &&
    Array.isArray(data.routes) &&
    typeof data.trader === "object" &&
    data.trader !== null;
  return (
    common &&
    (((data.format === SAVE_FORMAT ||
      data.format === TROOPS_FORMAT ||
      data.format === RIVALS_FORMAT) &&
      Array.isArray(data.players) &&
      data.players.length > 0 &&
      typeof data.diplomacy === "object") ||
      (data.format === OLD_FORMAT && typeof data.gold === "number"))
  );
}

/** The parts of a first-version save that changed shape. */
type OldSave = Omit<
  SaveData,
  "players" | "settings" | "diplomacy" | "missions" | "incidents" | "islands"
> & {
  gold: number;
  taxLevel: Player["taxLevel"];
  ledger: Player["ledger"];
  unlocked: Player["unlocked"];
  stats: Partial<Player["stats"]>;
  islands: (Omit<IslandState, "owner" | "plague" | "harvest"> & {
    owned?: boolean;
  })[];
};

/**
 * Converts a save of format 3: shipyards get an empty queue, the barracks'
 * count of soldiers on order becomes a queue of line infantry, every
 * soldier becomes line infantry without an order, standing in a line, and
 * there are no fleets yet.
 */
function upgradeTroops(old: SaveData): SaveData {
  return {
    ...old,
    format: SAVE_FORMAT,
    buildings: old.buildings.map((building) => {
      const drill = building.drill as unknown as {
        queue: number | string[];
        progress: number;
        paused?: boolean;
      } | null;
      return {
        ...building,
        yard:
          building.yard === null
            ? null
            : { ...building.yard, queue: building.yard.queue ?? [] },
        drill:
          drill === null
            ? null
            : {
                queue:
                  typeof drill.queue === "number"
                    ? new Array<typeof OLD_SOLDIER>(drill.queue).fill(
                        OLD_SOLDIER,
                      )
                    : (drill.queue as (typeof OLD_SOLDIER)[]),
                progress: drill.progress,
                paused: drill.paused === true,
              },
      };
    }),
    soldiers: old.soldiers.map((soldier) => ({
      ...soldier,
      kind: soldier.kind ?? OLD_SOLDIER,
      order: soldier.order ?? { type: "idle" },
      formation: soldier.formation ?? "line",
    })),
    fleets: old.fleets ?? [],
  };
}

/**
 * Converts a save of format 2: no barracks training, no soldiers, crown
 * orders without races, AI minds without the orders they looked at.
 */
function upgradeRivals(old: SaveData): SaveData {
  return {
    ...old,
    format: TROOPS_FORMAT,
    buildings: old.buildings.map((building) => ({
      ...building,
      drill: building.drill ?? null,
    })),
    soldiers: old.soldiers ?? [],
    players: old.players.map((player) => ({
      ...player,
      ai:
        player.ai === null
          ? null
          : {
              ...player.ai,
              // Sites were noted per kind before, now per kind and island.
              noSite: {},
              missions: player.ai.missions ?? [],
            },
    })),
    missions: old.missions.map((mission) => ({
      ...mission,
      contract: mission.contract ?? mission.id,
      wonBy: mission.wonBy ?? (mission.state === "done" ? mission.taker : -1),
    })),
  };
}

/** Converts a first-version save: one player, no rivals, nothing new yet. */
function upgradeOld(old: OldSave): SaveData {
  const line = emptyLine();
  const fresh = createTrader();
  const ledger = {
    ...old.ledger,
    current: { ...line, ...old.ledger.current },
    last: { ...line, ...old.ledger.last },
  };
  const player: Player = {
    id: 0,
    name: "Du",
    color: 0xd6a21e,
    human: true,
    gold: old.gold,
    taxLevel: old.taxLevel,
    ledger,
    unlocked: old.unlocked,
    stats: { ...emptyStats(), ...old.stats },
    research: { current: null, progress: 0, done: [], rate: 0 },
    reputation: [],
    ai: null,
    alive: true,
  };
  return {
    ...old,
    format: RIVALS_FORMAT,
    settings: { aiCount: 0, peaceful: false },
    players: [player],
    // Goods added since then start at nothing (the trader with his stock).
    trader: {
      ...old.trader,
      pressure: { ...fresh.pressure, ...old.trader.pressure },
      stock: { ...fresh.stock, ...old.trader.stock },
    },
    islands: old.islands.map((island) => {
      const { owned, ...rest } = island;
      return {
        ...rest,
        stock: { ...perGood(0), ...rest.stock },
        supply: { ...perGood(0), ...rest.supply },
        owner: owned === true ? 0 : -1,
        plague: 0,
        harvest: null,
      };
    }),
    buildings: old.buildings.map((building) => ({
      ...building,
      hp: BUILDING[building.kind].hp,
      level: 0,
      fire: 0,
      hitAt: 0,
      reload: 0,
      house: building.house === null ? null : { ...building.house, decline: 0 },
    })),
    ships: old.ships.map((ship) => ({
      ...ship,
      owner: ship.kind === "trader" ? -1 : 0,
      hp: SHIP[ship.kind].hp,
      reload: 0,
      hitAt: 0,
    })),
    routes: old.routes.map((route) => ({
      ...route,
      owner: 0,
      stops: route.stops.map((stop) => ({
        ...stop,
        actions: stop.actions.map((action) => ({ ...action, priority: 1 })),
      })),
    })),
    diplomacy: { relations: [], offers: [], log: [] },
    missions: [],
    nextMission: old.time + FIRST_MISSION,
    incidents: [],
    nextIncident: old.time + FIRST_INCIDENT,
  };
}

/** Indices where a grid's value passes a test. */
function indicesOf(
  grid: Uint8Array,
  test: (value: number) => boolean,
): number[] {
  const result: number[] = [];
  for (let i = 0; i < grid.length; i += 1) {
    if (test(grid[i])) {
      result.push(i);
    }
  }
  return result;
}
