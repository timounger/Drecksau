/**
 * What to choose before a game against the computer, kept in the browser.
 *
 * @module
 */
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  MISTER_X_NAMES,
  type Role,
  type Variant,
} from "@/games/scotland-yard/engine/state";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings. */
const SETTINGS_VERSION = 1;

/** Storage key of the settings. */
const SETTINGS_KEY = storageKey("scotland-yard", "settings");

/** What a game against the computer is set up with. */
export type ScotlandYardSettings = {
  /** The side you play; the computer plays the other. */
  readonly role: Role;
  /** How many sit at the table, Mister X included - it sets the pieces. */
  readonly players: number;
  readonly variant: Variant;
  /** "Mister X" or "Ms. X". */
  readonly misterXName: string;
  /** Marks every station Mister X can be at, for the detectives. */
  readonly showHidingPlaces: boolean;
};

/** The settings for somebody who has never chosen. */
export const DEFAULT_SETTINGS: ScotlandYardSettings = {
  role: "detectives",
  players: 4,
  variant: "standard",
  misterXName: MISTER_X_NAMES[0],
  showHidingPlaces: false,
};

/** The table sizes there are to choose from. */
export const PLAYER_COUNTS: readonly number[] = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (unused, index) => MIN_PLAYERS + index,
);

/**
 * The settings last chosen.
 *
 * @returns the stored settings, or the defaults
 */
export function loadSettings(): ScotlandYardSettings {
  return (
    readStored(SETTINGS_KEY, SETTINGS_VERSION, isSettings) ?? DEFAULT_SETTINGS
  );
}

/**
 * Remembers the settings for next time.
 *
 * @param settings - what was chosen
 */
export function saveSettings(settings: ScotlandYardSettings): void {
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, settings);
}

/** Whether a stored value is a set of settings. */
function isSettings(value: unknown): value is ScotlandYardSettings {
  const one = value as Partial<Record<keyof ScotlandYardSettings, unknown>>;
  return (
    typeof value === "object" &&
    value !== null &&
    (one.role === "misterX" || one.role === "detectives") &&
    typeof one.players === "number" &&
    PLAYER_COUNTS.includes(one.players) &&
    (one.variant === "standard" || one.variant === "intro") &&
    typeof one.misterXName === "string" &&
    MISTER_X_NAMES.includes(one.misterXName) &&
    typeof one.showHidingPlaces === "boolean"
  );
}
