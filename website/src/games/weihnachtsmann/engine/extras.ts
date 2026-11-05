/**
 * Part B together: setting it up, running it on, the keys it takes first,
 * the characters it moves, and what of it is saved.
 *
 * @module
 * @remarks
 * Each activity has its own module (`concert.ts`, `school.ts`,
 * `airmail.ts`, `angels.ts`, `nightstars.ts`, `kids.ts`, `contest.ts`,
 * `photos.ts`, `night-sky.ts`, `presents.ts`, `daily.ts`, `friends.ts`,
 * `gather.ts`); this one starts them, runs them once per step from
 * `world.ts` and tells the engine which keys and characters they take.
 */
import { holdRocker, updateConcert } from "./concert";
import { createSnowman, updateContest } from "./contest";
import { syncDay, TASKS_PER_DAY } from "./daily";
import { ANGEL_POINTS } from "./extras-data";
import type { ExtrasKeep, ExtrasState, SavedExtras } from "./extras-types";
import { updateChats } from "./friends";
import { driveGathered, updateGather } from "./gather";
import { updateAirMail } from "./airmail";
import { updateAngels } from "./angels";
import { KID_FIRST, updateKids } from "./kids";
import { createFireworks, updateNightSky, wishOnStar } from "./night-sky";
import { updateNightStars } from "./nightstars";
import { holdWrapper, updatePresents } from "./presents";
import { driveSchool, schoolAbility, updateSchool } from "./school";
import type { Character, GameState, Input, SaveData } from "./types";

/** Seconds until the first shooting star of a night. */
const FIRST_SHOOTING = 12;

/** Most friendship points kept per pair. */
const MAX_POINTS = 999;

/**
 * Part B as it is on a new visit.
 *
 * @returns its state
 */
export function createExtras(): ExtrasState {
  return {
    concert: null,
    gather: null,
    school: null,
    airMail: null,
    angels: ANGEL_POINTS.map(() => 0),
    stamped: false,
    kids: [],
    kidIn: KID_FIRST,
    snowman: createSnowman(),
    shot: null,
    flash: 0,
    shooting: null,
    shootIn: FIRST_SHOOTING,
    fireworks: createFireworks(),
    wrapping: null,
    eve: null,
    eveDone: false,
    chats: new Map(),
  };
}

/**
 * What part B keeps on a new game: no friends yet, no tasks.
 *
 * @returns the kept part
 */
export function createKeep(): ExtrasKeep {
  return { friends: new Map(), daily: { day: "", done: [] } };
}

/**
 * Runs part B on.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateExtras(state: GameState, dt: number): void {
  const extras = state.world.extras;
  extras.flash = Math.max(0, extras.flash - dt);
  syncDay(state);
  updateGather(state, dt);
  updateConcert(state, dt);
  updateSchool(state, dt);
  updateAirMail(state, dt);
  updateAngels(state, dt);
  updateNightStars(state);
  updateKids(state, dt);
  updateContest(state, dt);
  updateNightSky(state, dt);
  updatePresents(state, dt);
  updateChats(state, dt);
}

/**
 * The talk or ability key, before anything else: a wish on a shooting star,
 * a throw at the magic school.
 *
 * @param state - the game
 * @param key - which key
 * @returns true when the key was taken
 */
export function extrasKey(state: GameState, key: "talk" | "ability"): boolean {
  return wishOnStar(state) || (key === "ability" && schoolAbility(state));
}

/**
 * Moves a character part B holds: Grantelbart rocking, Gilfi steering his
 * throw, somebody wrapping, the crowd gathering.
 *
 * @param state - the game
 * @param char - the character
 * @param index - its index
 * @param input - the held controls, for the character steered
 * @param dt - seconds
 * @returns true when part B moved it
 */
export function extrasDrive(
  state: GameState,
  char: Character,
  index: number,
  input: Input,
  dt: number,
): boolean {
  return (
    holdRocker(state, char, index, dt) ||
    driveSchool(state, char, index, input, dt) ||
    holdWrapper(state, char, index, dt) ||
    driveGathered(state, char, index, dt)
  );
}

/**
 * What of part B goes into the save.
 *
 * @param state - the game
 * @returns the friendships and today's tasks
 */
export function extrasSave(state: GameState): SavedExtras {
  return {
    friends: Object.fromEntries(state.keep.friends),
    daily: { day: state.keep.daily.day, done: [...state.keep.daily.done] },
  };
}

/**
 * Takes part B back from a save; odd values are dropped.
 *
 * @param state - the game
 * @param save - what was saved
 */
export function applyExtrasSave(state: GameState, save: SaveData): void {
  const saved = save.extras;
  for (const [key, points] of Object.entries(saved?.friends ?? {})) {
    if (Number.isFinite(points) && points > 0) {
      state.keep.friends.set(key, Math.min(MAX_POINTS, Math.floor(points)));
    }
  }
  const daily = saved?.daily;
  if (
    daily !== undefined &&
    typeof daily.day === "string" &&
    Array.isArray(daily.done) &&
    daily.done.length === TASKS_PER_DAY
  ) {
    state.keep.daily.day = daily.day;
    state.keep.daily.done.length = 0;
    state.keep.daily.done.push(
      ...daily.done.map((value) =>
        Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0,
      ),
    );
  }
}
