/**
 * The achievements: which there are, unlocking them with a banner and a
 * jingle, what has been collected towards them, and the ones that are
 * reached just by being somewhere.
 *
 * @module
 * @remarks
 * Achievements are data ({@link ACHIEVEMENTS}); the moments that unlock them
 * call {@link unlock} where they happen (the toy machine, a show, a lamp ...),
 * and {@link checkAchievements} looks every step at what is reached by
 * standing, flying or swimming somewhere. Only what the player does counts:
 * a character nobody steers unlocks nothing ({@link steered}). Unlocked
 * achievements, collected wishes and instruments and counted falls and toys
 * are saved; the world changes behind them are not.
 */
import { GATE_COUNT } from "./gates";
import { CHIMNEYS, TILE, terrainUnder } from "./map";
import { currentProfile } from "./movement";
import { isRiding } from "./sleigh";
import {
  ACHIEVEMENT_IDS,
  CHARACTER_IDS,
  COUNT_IDS,
  PROGRESS_IDS,
  type AchievementId,
  type Character,
  type CharacterId,
  type CountId,
  type GameState,
  type ProgressId,
  type SaveData,
  type SavedAchievement,
} from "./types";

/** One achievement: whether it is secret, for whom, and how much it takes. */
export type AchievementDef = {
  readonly id: AchievementId;
  /** Secret: title and hint stay hidden until it is unlocked. */
  readonly hidden: boolean;
  /** The characters it is meant for; empty for anybody. */
  readonly who: readonly CharacterId[];
  /** How many steps it takes; 1 for a single moment. */
  readonly goal: number;
};

/** How long a banner stays on screen, seconds. */
export const TOAST_SECONDS = 4.5;

/** The elves, who can repair the toy machine. */
const ELVES: readonly CharacterId[] = ["jordi", "trixi", "gilfi"];

/** The four instruments in Grantelbart's house. */
const INSTRUMENT_COUNT = 4;

/** The others whose wishes Santa can read. */
const WISHERS = CHARACTER_IDS.length - 1;

/** Falls and toys it takes. */
const FALL_GOAL = 10;
const TOY_GOAL = 10;

/** Corners of the map Rudolf has to fly through. */
const CORNERS = 4;

/** How far into the map a corner reaches, cells. */
const CORNER_CELLS = 12;

/** The fastest the hare has to run from door to door, seconds. */
export const HARE_SECONDS = 8;

/** How close to a door the hare counts as there, map px. */
const DOOR_NEAR = 22;

/** How close to the chimney's mouth the bird has to come, map px. */
const CHIMNEY_NEAR = 12;

/** How far above its feet the bird's body is, map px. */
const BIRD_BODY = 5;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the doors' places
   on the map and the lamp count of the map */
/** The workshop door and Grantelbart's door, outside, map px. */
const WORKSHOP_DOOR = { x: 13 * TILE, y: 12.4 * TILE } as const;
const GRANTEL_DOOR = { x: 46.5 * TILE, y: 13.4 * TILE } as const;

/** Every achievement, in the order of the panel. */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: "fish", hidden: false, who: ["jordi"], goal: 1 },
  { id: "roofGift", hidden: false, who: ["trixi"], goal: 1 },
  { id: "rudolfLap", hidden: false, who: ["rudolf"], goal: CORNERS },
  { id: "wishesAll", hidden: false, who: ["santa"], goal: WISHERS },
  { id: "machineBroken", hidden: false, who: ["grantelbart"], goal: 1 },
  { id: "machineFixed", hidden: false, who: ELVES, goal: 1 },
  { id: "grantelConcert", hidden: false, who: ["grantelbart"], goal: 1 },
  { id: "spyWorkshop", hidden: false, who: ["gugor"], goal: 1 },
  { id: "spySleigh", hidden: true, who: ["gugor"], goal: 1 },
  { id: "levitateSnowman", hidden: false, who: ["gilfi"], goal: 1 },
  { id: "balboIce", hidden: false, who: ["balbo"], goal: 1 },
  { id: "balboTen", hidden: false, who: ["balbo"], goal: FALL_GOAL },
  { id: "balboSnowman", hidden: true, who: ["balbo"], goal: 1 },
  { id: "mouseFence", hidden: false, who: ["jordi"], goal: 1 },
  { id: "bearDrift", hidden: false, who: ["jordi"], goal: 1 },
  { id: "birdChimney", hidden: false, who: ["jordi"], goal: 1 },
  { id: "hareRace", hidden: false, who: ["jordi"], goal: 1 },
  { id: "foxDig", hidden: true, who: ["jordi"], goal: 1 },
  { id: "sleighRide", hidden: false, who: ["santa", "rudolf"], goal: 1 },
  { id: "lampFirst", hidden: false, who: [], goal: 1 },
  { id: "lampsAll", hidden: false, who: [], goal: 35 },
  { id: "snowmanDown", hidden: false, who: [], goal: 1 },
  { id: "snowmanBuilt", hidden: false, who: [], goal: 1 },
  { id: "instruments", hidden: false, who: [], goal: INSTRUMENT_COUNT },
  { id: "toys10", hidden: false, who: [], goal: TOY_GOAL },
  { id: "grantelVisit", hidden: false, who: ["santa"], goal: 1 },
  {
    id: "allInWorkshop",
    hidden: false,
    who: [],
    goal: CHARACTER_IDS.length,
  },
  { id: "firstGate", hidden: false, who: [], goal: 1 },
  { id: "allGates", hidden: false, who: [], goal: GATE_COUNT },
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Which count each counting achievement needs. */
const COUNT_GOALS: Readonly<Record<CountId, number>> = {
  falls: FALL_GOAL,
  toys: TOY_GOAL,
};

/** Which collection each collecting achievement needs. */
const PROGRESS_GOALS: Readonly<
  Record<ProgressId, { readonly id: AchievementId; readonly goal: number }>
> = {
  wishes: { id: "wishesAll", goal: WISHERS },
  instruments: { id: "instruments", goal: INSTRUMENT_COUNT },
};

/**
 * Whether the player steers somebody right now - only that counts.
 *
 * @param state - the game
 * @param char - the character
 * @returns true for the character steered
 */
export function steered(state: GameState, char: Character): boolean {
  return state.chars[state.active] === char;
}

/**
 * Unlocks an achievement, once: a banner and a jingle.
 *
 * @param state - the game
 * @param id - which
 */
export function unlock(state: GameState, id: AchievementId): void {
  if (!state.achieved.has(id)) {
    state.achieved.set(id, state.now);
    state.toasts.push({ id, age: 0 });
    state.sounds.push("achievement");
  }
}

/**
 * Notes something collected towards an achievement, and unlocks it once all
 * is there.
 *
 * @param state - the game
 * @param kind - which collection
 * @param item - what was collected
 */
export function collect(
  state: GameState,
  kind: ProgressId,
  item: string,
): void {
  const items = state.progress[kind];
  items.add(item);
  const target = PROGRESS_GOALS[kind];
  if (items.size >= target.goal) {
    unlock(state, target.id);
  }
}

/**
 * Counts one more towards an achievement, and unlocks it at the goal.
 *
 * @param state - the game
 * @param kind - which count
 * @param id - the achievement it leads to
 */
export function addCount(
  state: GameState,
  kind: CountId,
  id: AchievementId,
): void {
  state.counts[kind] += 1;
  if (state.counts[kind] >= COUNT_GOALS[kind]) {
    unlock(state, id);
  }
}

/**
 * Looks at what is reached by being somewhere: the mouse in a fence, the bird
 * on the chimney, Rudolf's corners, the hare's race, Santa at Grantelbart's,
 * everybody in the workshop - and the Advent gates won.
 *
 * @param state - the game
 */
export function checkAchievements(state: GameState): void {
  const char = state.chars[state.active];
  const map = state.maps[char.area];
  const outside = char.area === "outdoors";
  if (
    char.form === "maus" &&
    terrainUnder(map, char.x, char.y - 1) === "fence"
  ) {
    unlock(state, "mouseFence");
  }
  if (char.form === "vogel" && outside && nearChimney(state, char)) {
    unlock(state, "birdChimney");
  }
  checkLap(state, char);
  checkHare(state, char);
  if (char.id === "santa" && char.area === "grantelHouse") {
    unlock(state, "grantelVisit");
  }
  if (inWorkshop(state) >= CHARACTER_IDS.length) {
    unlock(state, "allInWorkshop");
  }
  if (state.gatesDone.size >= 1) {
    unlock(state, "firstGate");
  }
  if (state.gatesDone.size >= GATE_COUNT) {
    unlock(state, "allGates");
  }
}

/**
 * Moves the banners on: the first shows, the rest wait their turn.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateToasts(state: GameState, dt: number): void {
  const first = state.toasts.at(0);
  if (first !== undefined) {
    first.age += dt;
    if (first.age >= TOAST_SECONDS) {
      state.toasts.shift();
    }
  }
}

/**
 * How far an achievement has come, for the panel.
 *
 * @param state - the game
 * @param id - which
 * @returns steps done, at most its goal
 */
export function progressOf(state: GameState, id: AchievementId): number {
  const def = ACHIEVEMENTS.find((candidate) => candidate.id === id);
  const goal = def?.goal ?? 1;
  let done: number;
  switch (id) {
    case "wishesAll":
      done = state.progress.wishes.size;
      break;
    case "instruments":
      done = state.progress.instruments.size;
      break;
    case "balboTen":
      done = state.counts.falls;
      break;
    case "toys10":
      done = state.counts.toys;
      break;
    case "lampsAll":
      done = state.world.lampsOff.length;
      break;
    case "rudolfLap":
      done = state.world.lap.size;
      break;
    case "allInWorkshop":
      done = inWorkshop(state);
      break;
    case "allGates":
      done = state.gatesDone.size;
      break;
    default:
      done = 0;
  }
  return state.achieved.has(id) ? goal : Math.min(goal, done);
}

/**
 * Whether somebody stands in the visible part of the map.
 *
 * @param state - the game
 * @param char - the character
 * @returns true when on screen
 */
export function inView(state: GameState, char: Character): boolean {
  const { x, y } = state.camera;
  return (
    char.area === state.viewArea &&
    char.x > x &&
    char.x < x + state.view.w &&
    char.y > y &&
    char.y - currentProfile(char).height < y + state.view.h
  );
}

/**
 * What of the achievements goes into the save.
 *
 * @param state - the game
 * @returns the unlocked achievements, the collections and the counts
 */
export function achievementSave(
  state: GameState,
): Pick<SaveData, "achievements" | "progress" | "counts"> {
  return {
    achievements: [...state.achieved].map(([id, at]) => ({ id, at })),
    progress: {
      wishes: [...state.progress.wishes].sort(),
      instruments: [...state.progress.instruments].sort(),
    },
    counts: { ...state.counts },
  };
}

/**
 * Takes the achievements back from a save; unknown ids are dropped.
 *
 * @param state - the game
 * @param save - what was saved
 */
export function applyAchievementSave(state: GameState, save: SaveData): void {
  for (const saved of save.achievements ?? []) {
    const id = knownId(saved);
    if (id !== null) {
      state.achieved.set(id, saved.at);
    }
  }
  for (const kind of PROGRESS_IDS) {
    for (const item of save.progress?.[kind] ?? []) {
      state.progress[kind].add(item);
    }
  }
  for (const kind of COUNT_IDS) {
    state.counts[kind] = Math.max(0, Math.floor(save.counts?.[kind] ?? 0));
  }
}

/** The id of a saved achievement, if this version knows it. */
function knownId(saved: SavedAchievement): AchievementId | null {
  return ACHIEVEMENT_IDS.find((candidate) => candidate === saved.id) ?? null;
}

/** How many characters are in the workshop, not off in the sleigh. */
function inWorkshop(state: GameState): number {
  return state.chars.filter(
    (char) => char.area === "workshop" && !isRiding(state, char),
  ).length;
}

/** Whether the bird sits on Grantelbart's chimney. */
function nearChimney(state: GameState, char: Character): boolean {
  return state.maps.outdoors.objects.some((object) => {
    const mouth = CHIMNEYS[object.kind];
    return (
      mouth !== undefined &&
      Math.abs(char.x - (object.tx * TILE + mouth[0])) < CHIMNEY_NEAR &&
      Math.abs(
        char.y - char.altitude - BIRD_BODY - (object.ty * TILE + mouth[1]),
      ) < CHIMNEY_NEAR
    );
  });
}

/**
 * Rudolf in the air collects the corners of the map he flies through; landing
 * starts the lap afresh.
 */
function checkLap(state: GameState, char: Character): void {
  const lap = state.world.lap;
  const rudolf = state.chars.find((other) => other.id === "rudolf");
  if (rudolf === undefined || !rudolf.flying) {
    lap.clear();
  } else if (char === rudolf && char.area === "outdoors") {
    const map = state.maps.outdoors;
    const reach = CORNER_CELLS * TILE;
    const west = char.x < reach;
    const east = char.x > map.cols * TILE - reach;
    const north = char.y < reach;
    const south = char.y > map.rows * TILE - reach;
    // Corners numbered clockwise from the top left.
    const corners: readonly boolean[] = [
      north && west,
      north && east,
      south && east,
      south && west,
    ];
    corners.forEach((inside, corner) => {
      if (inside) {
        lap.add(corner);
      }
    });
    if (lap.size >= CORNERS) {
      unlock(state, "rudolfLap");
    }
  }
}

/**
 * The hare's race: the clock starts when it leaves the workshop door and
 * stops at Grantelbart's door.
 */
function checkHare(state: GameState, char: Character): void {
  const world = state.world;
  if (char.form === "hase" && char.area === "outdoors") {
    if (near(char, WORKSHOP_DOOR)) {
      world.hareFrom = state.time;
    } else if (
      world.hareFrom !== null &&
      near(char, GRANTEL_DOOR) &&
      state.time - world.hareFrom < HARE_SECONDS
    ) {
      unlock(state, "hareRace");
    }
  } else {
    world.hareFrom = null;
  }
}

/** Whether somebody stands near a point, map px. */
function near(char: Character, point: { x: number; y: number }): boolean {
  return Math.hypot(char.x - point.x, char.y - point.y) < DOOR_NEAR;
}
