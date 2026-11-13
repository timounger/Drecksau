/**
 * Frost Fortress: a new game, one step of time, research - and the commands
 * the screen calls, gathered in one place.
 *
 * @module
 * @remarks
 * No DOM in here. A step is split into slices of at most {@link MAX_SLICE}
 * seconds, so fast forward does not let shells or enemies skip through walls.
 */
import { LOG, RESEARCH_TEXTS } from "@/games/frost-fortress/i18n/texts";
import { construct, makeStructure } from "./build";
import {
  sweepEnemies,
  updateDefenders,
  updateEnemies,
  updateProjectiles,
  updateTowers,
} from "./combat";
import { canAfford, pay, produce, receive, RESOURCE_IDS } from "./economy";
import { updateHappenings, updateWeather } from "./happenings";
import { pushMessage } from "./log";
import { HQ_COL, HQ_ROW } from "./map";
import {
  CHEAT_STOCK,
  hasResearch,
  maxHp,
  researchSpeed,
  storageLimit,
} from "./modifiers";
import { RESEARCH, researchById, type ResearchDef } from "./research";
import { indexEnemies, runtimeOf } from "./runtime";
import type { Game, Resources } from "./types";
import { chooseGates, FIRST_WAVE, updateWaves } from "./waves";

export {
  demolish,
  isUnlocked,
  moveSite,
  nextLevel,
  placeProblem,
  placeStructure,
  repair,
  repairAll,
  repairCost,
  needsRepair,
  startUpgrade,
  busySites,
  upgradeReady,
} from "./build";
export { callWave, summonEnemies, SUMMON_GROUP } from "./waves";
export { ALLY_LIMIT, summonAllies } from "./combat";
export {
  answerOffer,
  collectAt,
  startExpedition,
  toggleAutoExplore,
} from "./happenings";

/** Slices per second at least. */
const SLICES_PER_SECOND = 30;

/** Seconds between two warnings about missing energy. */
const POWER_WARN_EVERY = 60;

/** Longest slice of time simulated at once, seconds. */
export const MAX_SLICE = 1 / SLICES_PER_SECOND;

/** What the game begins with. */
const START: Resources = {
  wood: 200,
  iron: 150,
  stone: 100,
  energy: 100,
  food: 80,
  fuel: 20,
};

/** Seconds into the first day when the game begins. */
const START_CLOCK = 0;

/** Seconds until the first blizzard may come. */
const FIRST_CALM = 240;

/** Seconds until the first random event. */
const FIRST_EVENT = 60;

/** Where the first warehouse stands, relative to the headquarters. */
const WAREHOUSE_OFFSET = { col: 4, row: 0 };

/**
 * Starts a new game.
 *
 * @param seed - the map's seed
 * @returns the game
 */
export function createGame(seed: number): Game {
  const game: Game = {
    seed,
    rng: seed,
    time: 0,
    res: { ...START },
    structures: [],
    enemies: [],
    projectiles: [],
    defenders: [],
    drops: [],
    nextId: 1,
    wave: {
      number: 0,
      countdown: FIRST_WAVE,
      active: false,
      elapsed: 0,
      queue: [],
      gates: [],
    },
    research: { done: [], current: null, progress: 0 },
    weather: {
      clock: START_CLOCK,
      storm: 0,
      stormGoal: 0,
      stormLeft: FIRST_CALM,
    },
    effects: [],
    offer: null,
    eventIn: FIRST_EVENT,
    expedition: 0,
    stats: { kills: 0, bosses: 0, built: 0, lost: 0, collected: 0 },
    over: false,
    cheat: false,
    cheated: false,
    autoExplore: false,
    rangeBoost: 1,
    freeBuild: false,
    messages: [],
    events: [],
  };
  makeStructure(game, "hq", HQ_COL, HQ_ROW, true);
  makeStructure(
    game,
    "warehouse",
    HQ_COL + WAREHOUSE_OFFSET.col,
    HQ_ROW + WAREHOUSE_OFFSET.row,
    true,
  );
  game.wave.gates = chooseGates(game, 1);
  pushMessage(game, LOG.welcome);
  return game;
}

/**
 * Lets time pass.
 *
 * @param game - the game, changed
 * @param seconds - how much
 */
export function step(game: Game, seconds: number): void {
  let left = seconds;
  while (left > 0 && !game.over) {
    const slice = Math.min(MAX_SLICE, left);
    left -= slice;
    tick(game, slice);
  }
}

/**
 * Whether a project may be started now.
 *
 * @param game - the game
 * @param def - the project
 * @returns true if its needs are done and nothing else runs
 */
export function canResearch(game: Game, def: ResearchDef): boolean {
  return (
    !hasResearch(game, def.id) &&
    game.research.current === null &&
    def.needs.every((need) => hasResearch(game, need)) &&
    researchSpeed(game) > 0 &&
    canAfford(game.res, def.cost)
  );
}

/**
 * Starts a research project and pays for it.
 *
 * @param game - the game, changed
 * @param id - the project
 * @returns true if it began
 */
export function startResearch(game: Game, id: string): boolean {
  const def = researchById(id);
  const ok = def !== undefined && canResearch(game, def);
  if (ok) {
    pay(game.res, def.cost);
    game.research.current = id;
    game.research.progress = 0;
  }
  return ok;
}

/**
 * Stops the running project and gives its price back.
 *
 * @param game - the game, changed
 * @returns true if one was stopped
 */
export function cancelResearch(game: Game): boolean {
  const def =
    game.research.current === null
      ? undefined
      : researchById(game.research.current);
  if (def !== undefined) {
    receive(game, def.cost);
    game.research.current = null;
    game.research.progress = 0;
  }
  return def !== undefined;
}

/**
 * Takes the events of the last steps off the game.
 *
 * @param game - the game, changed
 * @returns what happened
 */
export function drainEvents(game: Game): Game["events"] {
  const events = game.events;
  game.events = [];
  return events;
}

/** One slice of time. */
function tick(game: Game, dt: number): void {
  game.time += dt;
  runtimeOf(game);
  updateWeather(game, dt);
  produce(game, dt);
  construct(game, dt);
  advanceResearch(game, dt);
  updateWaves(game, dt);
  indexEnemies(game);
  updateTowers(game, dt);
  updateDefenders(game, dt);
  updateEnemies(game, dt);
  updateProjectiles(game, dt);
  sweepEnemies(game);
  updateHappenings(game, dt);
  warnPower(game);
  fillIfCheating(game);
}

/**
 * Turns the cheat on or off.
 *
 * @param game - the game, changed
 * @param on - whether it should be on
 * @remarks
 * Switched on, all research counts as done and the stores fill up; switched
 * off, the research stays done and the stores shrink back to their limit.
 */
export function setCheat(game: Game, on: boolean): void {
  game.cheat = on;
  // The jump in stock is no production - the shown rates start afresh.
  const rates = runtimeOf(game).rates;
  for (const id of Object.keys(rates)) {
    delete rates[id];
  }
  if (on) {
    game.cheated = true;
    game.research.done = RESEARCH.map((entry) => entry.id);
    game.research.current = null;
    game.research.progress = 0;
    fillIfCheating(game);
  } else {
    const limit = storageLimit(game);
    for (const id of RESOURCE_IDS) {
      game.res[id] = Math.min(limit, game.res[id]);
    }
  }
}

/** With the cheat on, fills every store to the brim. */
function fillIfCheating(game: Game): void {
  if (game.cheat) {
    for (const id of RESOURCE_IDS) {
      game.res[id] = CHEAT_STOCK;
    }
  }
}

/** Moves the running project forward. */
function advanceResearch(game: Game, dt: number): void {
  const id = game.research.current;
  const def = id === null ? undefined : researchById(id);
  if (def !== undefined) {
    game.research.progress += researchSpeed(game) * dt;
    if (game.research.progress >= def.points) {
      // Stronger armour raises the hit points too, not just the maximum.
      const before = game.structures.map((structure) => maxHp(game, structure));
      game.research.done.push(def.id);
      game.structures.forEach((structure, index) => {
        structure.hp += maxHp(game, structure) - before[index];
      });
      game.research.current = null;
      game.research.progress = 0;
      pushMessage(
        game,
        LOG.researchDone(RESEARCH_TEXTS[def.id]?.name ?? def.id),
        "good",
      );
      game.events.push({ type: "researchDone" });
      runtimeOf(game).dirty = true;
    }
  }
}

/** Says so in the log when the energy runs out. */
function warnPower(game: Game): void {
  const runtime = runtimeOf(game);
  if (
    runtime.power < 1 &&
    game.time - runtime.powerWarnedAt > POWER_WARN_EVERY
  ) {
    runtime.powerWarnedAt = game.time;
    pushMessage(game, LOG.noPower, "bad");
  }
}
