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
 * achievements, collected wishes, instruments, booths, bells and animals and
 * counted falls, toys, letters, hits, errands and the best sled time are
 * saved; the world changes behind them are not.
 */
import { BELLS, STALLS } from "./east-data";
import { STATIONS } from "./places-data";
import { ANGEL_POINTS, NIGHT_STARS, PHOTO_POINTS } from "./extras-data";
import { bestLevel } from "./friends";
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

/** One achievement: for whom, and how much it takes. */
export type AchievementDef = {
  readonly id: AchievementId;
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

/** Falls, toys, sorted letters, snowball hits and errands it takes. */
const FALL_GOAL = 10;
const TOY_GOAL = 10;
const LETTER_GOAL = 10;
const HIT_GOAL = 15;
const ERRAND_GOAL = 5;

/** The kinds of wild animals to talk to. */
const CRITTER_KINDS = 3;

/** Laps round the lake's island, and seconds through a storm. */
const LAP_GOAL = 3;
const STORM_GOAL = 20;

/** Happy children, presents under the tree and days of tasks it takes. */
const KID_GOAL = 5;
const GIFT_GOAL = 10;
const DAILY_DAYS = 3;

/** Hits in one round at the magic school, and the jury's best. */
const SCHOOL_HITS = 5;
const SNOWMAN_STARS = 5;

/** The step of friendship of best friends (see `friends.ts`). */
const BEST_FRIEND_STEP = 4;

/** The reindeer in the stable, all to be fed at once. */
const REINDEER = 4;

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
  { id: "fish", who: ["jordi"], goal: 1 },
  { id: "roofGift", who: ["trixi"], goal: 1 },
  { id: "rudolfLap", who: ["rudolf"], goal: CORNERS },
  { id: "wishesAll", who: ["santa"], goal: WISHERS },
  { id: "machineBroken", who: ["grantelbart"], goal: 1 },
  { id: "machineFixed", who: ELVES, goal: 1 },
  { id: "grantelConcert", who: ["grantelbart"], goal: 1 },
  { id: "spyWorkshop", who: ["gugor"], goal: 1 },
  { id: "spySleigh", who: ["gugor"], goal: 1 },
  { id: "levitateSnowman", who: ["gilfi"], goal: 1 },
  { id: "balboIce", who: ["balbo"], goal: 1 },
  { id: "balboTen", who: ["balbo"], goal: FALL_GOAL },
  { id: "balboSnowman", who: ["balbo"], goal: 1 },
  { id: "mouseFence", who: ["jordi"], goal: 1 },
  { id: "bearDrift", who: ["jordi"], goal: 1 },
  { id: "birdChimney", who: ["jordi"], goal: 1 },
  { id: "hareRace", who: ["jordi"], goal: 1 },
  { id: "foxDig", who: ["jordi"], goal: 1 },
  { id: "sleighRide", who: ["santa", "rudolf"], goal: 1 },
  { id: "lampFirst", who: [], goal: 1 },
  { id: "lampsAll", who: [], goal: 35 },
  { id: "snowmanDown", who: [], goal: 1 },
  { id: "snowmanBuilt", who: [], goal: 1 },
  { id: "instruments", who: [], goal: INSTRUMENT_COUNT },
  { id: "toys10", who: [], goal: TOY_GOAL },
  { id: "grantelVisit", who: ["santa"], goal: 1 },
  {
    id: "allInWorkshop",
    who: [],
    goal: CHARACTER_IDS.length,
  },
  { id: "firstGate", who: [], goal: 1 },
  { id: "allGates", who: [], goal: GATE_COUNT },
  { id: "movieNight", who: [], goal: 1 },
  { id: "stableFed", who: [], goal: REINDEER },
  { id: "rudolfNap", who: ["rudolf"], goal: 1 },
  { id: "letters10", who: [], goal: LETTER_GOAL },
  { id: "santaLetter", who: ["santa"], goal: 1 },
  { id: "firstTray", who: [], goal: 1 },
  { id: "balboFlour", who: ["balbo"], goal: 1 },
  { id: "gilfiTrays", who: ["gilfi"], goal: 1 },
  { id: "overview", who: [], goal: 1 },
  { id: "gugorEagle", who: ["gugor"], goal: 1 },
  { id: "giftFound", who: [], goal: 1 },
  { id: "mouseGap", who: ["jordi"], goal: 1 },
  { id: "marketStalls", who: [], goal: STALLS.length },
  { id: "carousel", who: [], goal: 1 },
  { id: "iceCave", who: [], goal: 1 },
  { id: "aurora", who: ["gugor"], goal: 1 },
  { id: "sledFast", who: [], goal: 1 },
  { id: "snowballs", who: [], goal: HIT_GOAL },
  { id: "skater", who: [], goal: LAP_GOAL },
  { id: "firTree", who: ["santa", ...ELVES], goal: 1 },
  { id: "bellsAll", who: [], goal: BELLS.length },
  { id: "animalTalk", who: ["jordi"], goal: CRITTER_KINDS },
  { id: "errands5", who: [], goal: ERRAND_GOAL },
  { id: "stormWalk", who: [], goal: STORM_GOAL },
  { id: "fullThrottle", who: [], goal: 1 },
  { id: "hockeyWin", who: [], goal: 1 },
  { id: "snowCastle", who: [], goal: 1 },
  { id: "balloonRide", who: [], goal: 1 },
  { id: "roofSecret", who: [], goal: 1 },
  { id: "summit", who: [], goal: 1 },
  { id: "skiRun", who: [], goal: 1 },
  { id: "lighthouse", who: [], goal: 1 },
  { id: "trainStops", who: [], goal: STATIONS.length },
  { id: "trainLoop", who: [], goal: 1 },
  { id: "stageRock", who: ["grantelbart"], goal: 1 },
  { id: "magicSchool", who: ["gilfi"], goal: SCHOOL_HITS },
  { id: "airMail", who: ["trixi"], goal: 1 },
  { id: "angelStar", who: ["balbo"], goal: ANGEL_POINTS.length },
  { id: "nightStars", who: ["rudolf"], goal: NIGHT_STARS.length },
  { id: "happyKids", who: [], goal: KID_GOAL },
  { id: "snowmanJury", who: [], goal: SNOWMAN_STARS },
  { id: "photoAlbum", who: [], goal: PHOTO_POINTS.length },
  { id: "shootingStar", who: [], goal: 1 },
  { id: "fireworks", who: [], goal: 1 },
  { id: "dailyTasks", who: [], goal: DAILY_DAYS },
  { id: "bestFriends", who: [], goal: BEST_FRIEND_STEP },
  { id: "giftPile", who: [], goal: GIFT_GOAL },
  { id: "christmasEve", who: [], goal: 1 },
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Which count each counting achievement needs; the best sled time is none. */
const COUNT_GOALS: Readonly<Partial<Record<CountId, number>>> = {
  falls: FALL_GOAL,
  toys: TOY_GOAL,
  letters: LETTER_GOAL,
  hits: HIT_GOAL,
  errands: ERRAND_GOAL,
  kids: KID_GOAL,
  wrapped: GIFT_GOAL,
  dailyDays: DAILY_DAYS,
};

/** Which collection each collecting achievement needs. */
const PROGRESS_GOALS: Readonly<
  Record<ProgressId, { readonly id: AchievementId; readonly goal: number }>
> = {
  wishes: { id: "wishesAll", goal: WISHERS },
  instruments: { id: "instruments", goal: INSTRUMENT_COUNT },
  stalls: { id: "marketStalls", goal: STALLS.length },
  bells: { id: "bellsAll", goal: BELLS.length },
  critters: { id: "animalTalk", goal: CRITTER_KINDS },
  stops: { id: "trainStops", goal: STATIONS.length },
  nightStars: { id: "nightStars", goal: NIGHT_STARS.length },
  photos: { id: "photoAlbum", goal: PHOTO_POINTS.length },
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
  if (state.counts[kind] >= (COUNT_GOALS[kind] ?? Infinity)) {
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
  if (char.area === "iceCave") {
    unlock(state, "iceCave");
  }
  if (char.area === "summit") {
    unlock(state, "summit");
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
    case "letters10":
      done = state.counts.letters;
      break;
    case "stableFed":
      done = state.world.stable.full.filter((left) => left > 0).length;
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
    case "marketStalls":
      done = state.progress.stalls.size;
      break;
    case "bellsAll":
      done = state.progress.bells.size;
      break;
    case "animalTalk":
      done = state.progress.critters.size;
      break;
    case "snowballs":
      done = state.counts.hits;
      break;
    case "errands5":
      done = state.counts.errands;
      break;
    case "skater":
      done = Math.floor(Math.abs(state.world.east.lapTurn) / (Math.PI * 2));
      break;
    case "stormWalk":
      done = Math.floor(state.world.sky.stormWalked);
      break;
    case "trainStops":
      done = state.progress.stops.size;
      break;
    case "magicSchool":
      done = state.counts.schoolBest;
      break;
    case "angelStar":
      done = state.world.extras.angels.filter((left) => left > 0).length;
      break;
    case "nightStars":
      done = state.progress.nightStars.size;
      break;
    case "happyKids":
      done = state.counts.kids;
      break;
    case "snowmanJury":
      done = state.counts.snowmanBest;
      break;
    case "photoAlbum":
      done = state.progress.photos.size;
      break;
    case "dailyTasks":
      done = state.counts.dailyDays;
      break;
    case "bestFriends":
      done = bestLevel(state);
      break;
    case "giftPile":
      done = state.counts.wrapped;
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
    progress: Object.fromEntries(
      PROGRESS_IDS.map((kind) => [kind, [...state.progress[kind]].sort()]),
    ),
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

/** Whether the bird sits on Grantelbart's chimney (not the village's). */
function nearChimney(state: GameState, char: Character): boolean {
  return state.maps.outdoors.objects.some((object) => {
    const mouth = CHIMNEYS[object.kind];
    return (
      object.kind === "grantelMain" &&
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
