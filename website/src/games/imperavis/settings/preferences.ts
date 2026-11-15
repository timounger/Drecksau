/**
 * What IMPERAVIS remembers between visits: the settings page and the
 * difficulty, events and peoples of the last new game.
 *
 * @module
 * @remarks
 * Kept as stored values so React reads them without breaking hydration - the
 * page is prerendered, and the first render must match the HTML that was made
 * without any storage at all.
 */
import { DIFFICULTIES } from "@/games/imperavis/engine/difficulty-data";
import { EVENT_OPTIONS } from "@/games/imperavis/engine/disasters-data";
import { NATIONS, PIRATE_BANDS } from "@/games/imperavis/engine/factions-data";
import type {
  CultureId,
  Difficulty,
  EventOption,
} from "@/games/imperavis/engine/types";
import { storageKey } from "@/lib/storage/local-store";
import {
  createStoredValue,
  type StoredValue,
} from "@/lib/storage/stored-value";

/** Schema version of these small values. */
const VERSION = 1;

/**
 * The game speeds there are (0 is pause).
 *
 * @remarks
 * Before this version the fastest speed was 4; such a stored start speed
 * fails the check of {@link speedSetting} and falls back to 1.
 */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the speeds themselves
export const SPEEDS = [1, 2, 3] as const;

/** The fastest speed without the cheat. */
export const NORMAL_TOP: number = SPEEDS[SPEEDS.length - 1];

/** The speeds the cheat adds, run with a time budget per frame. */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the speeds themselves
export const CHEAT_SPEEDS = [10, 100] as const;

/** One game speed. */
export type Speed = (typeof SPEEDS)[number];

/** Whether a value is a boolean. */
function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/** Whether the game's sounds are off. */
export const mutedSetting: StoredValue<boolean> = createStoredValue(
  storageKey("imperavis", "muted"),
  VERSION,
  false,
  isBoolean,
);

/** Whether shadows are drawn. */
export const shadowsSetting: StoredValue<boolean> = createStoredValue(
  storageKey("imperavis", "shadows"),
  VERSION,
  true,
  isBoolean,
);

/** Whether rain, storm and thick fog are drawn. */
export const weatherSetting: StoredValue<boolean> = createStoredValue(
  storageKey("imperavis", "weather"),
  VERSION,
  true,
  isBoolean,
);

/** Whether the game saves itself now and then. */
export const autosaveSetting: StoredValue<boolean> = createStoredValue(
  storageKey("imperavis", "autosave"),
  VERSION,
  true,
  isBoolean,
);

/** Whether the mouse at the edge of the map moves the camera. */
export const edgeScrollSetting: StoredValue<boolean> = createStoredValue(
  storageKey("imperavis", "edgeScroll"),
  VERSION,
  true,
  isBoolean,
);

/** The speed a game starts with. */
export const speedSetting: StoredValue<Speed> = createStoredValue(
  storageKey("imperavis", "speed"),
  VERSION,
  1 as Speed,
  (value): value is Speed => SPEEDS.includes(value as Speed),
);

/**
 * The difficulty, events and peoples of the last new game, offered again
 * next time.
 */
export type NewGameChoice = {
  /** The level; missing (stored before there were levels) means normal. */
  readonly difficulty?: Difficulty;
  /** Events switched off. */
  readonly eventsOff: readonly EventOption[];
  /** Peoples and pirate bands left out. */
  readonly culturesOff: readonly CultureId[];
};

/** Whether a value is a list of strings from a given set. */
function isListOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is readonly T[] {
  return (
    Array.isArray(value) && value.every((item) => allowed.includes(item as T))
  );
}

/** Every event and every people on, as in a game from before the choice. */
export const ALL_ON: NewGameChoice = { eventsOff: [], culturesOff: [] };

/** The difficulty, events and peoples chosen for the last new game. */
export const newGameSetting: StoredValue<NewGameChoice> = createStoredValue(
  storageKey("imperavis", "newGame"),
  VERSION,
  ALL_ON,
  (value): value is NewGameChoice => {
    const choice = value as NewGameChoice | null;
    return (
      typeof choice === "object" &&
      choice !== null &&
      (choice.difficulty === undefined ||
        DIFFICULTIES.includes(choice.difficulty)) &&
      isListOf(choice.eventsOff, EVENT_OPTIONS) &&
      isListOf(choice.culturesOff, [...NATIONS, ...PIRATE_BANDS])
    );
  },
);
