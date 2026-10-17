/**
 * What to choose before a game against the computer, kept in the browser.
 *
 * @module
 */
import {
  DEFAULT_TARGET,
  MAX_PLAYERS,
  TARGETS,
  type Difficulty,
} from "@/games/hitster/engine/state";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings. */
const SETTINGS_VERSION = 1;

/** Storage key of the settings. */
const SETTINGS_KEY = storageKey("hitster", "settings");

/** What a game against the computer is set up with. */
export type HitsterSettings = {
  /** How many computers sit at the table. */
  readonly computers: number;
  readonly difficulty: Difficulty;
  /** How many cards win. */
  readonly target: number;
};

/** The settings for somebody who has never chosen. */
export const DEFAULT_SETTINGS: HitsterSettings = {
  computers: 2,
  difficulty: "medium",
  target: DEFAULT_TARGET,
};

/** The numbers of computers there are to choose from. */
export const COMPUTER_COUNTS: readonly number[] = Array.from(
  { length: MAX_PLAYERS - 1 },
  (unused, index) => index + 1,
);

/**
 * The settings last chosen.
 *
 * @returns the stored settings, or the defaults
 */
export function loadSettings(): HitsterSettings {
  return (
    readStored(SETTINGS_KEY, SETTINGS_VERSION, isSettings) ?? DEFAULT_SETTINGS
  );
}

/**
 * Remembers the settings for next time.
 *
 * @param settings - what was chosen
 */
export function saveSettings(settings: HitsterSettings): void {
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, settings);
}

/** Whether a stored value is a set of settings. */
function isSettings(value: unknown): value is HitsterSettings {
  const one = value as Partial<Record<keyof HitsterSettings, unknown>> | null;
  return (
    typeof one === "object" &&
    one !== null &&
    typeof one.computers === "number" &&
    COMPUTER_COUNTS.includes(one.computers) &&
    (one.difficulty === "easy" ||
      one.difficulty === "medium" ||
      one.difficulty === "hard") &&
    typeof one.target === "number" &&
    TARGETS.includes(one.target)
  );
}
