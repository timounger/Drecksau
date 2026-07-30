/**
 * Skyjo settings, stored in the browser.
 *
 * @module
 * @remarks
 * Kept under a Skyjo-specific key, so it does not collide with the other
 * games' settings. Anything unknown or out of range falls back to the default,
 * which keeps a hand-edited or outdated entry from breaking a game.
 */
import {
  DEFAULT_DIFFICULTY,
  isDifficulty,
  type Difficulty,
} from "@/games/skyjo/engine/difficulty";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/skyjo/engine/state";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings - raise it on breaking changes. */
const SETTINGS_VERSION = 1;

/** Key of the Skyjo settings entry. */
const SETTINGS_KEY = storageKey("skyjo", "settings");

/** Table size of a first-time visitor's game. */
export const DEFAULT_PLAYER_COUNT = 3;

/** The table sizes on offer, derived from the engine limits. */
export const PLAYER_COUNTS: readonly number[] = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (unused, index) => MIN_PLAYERS + index,
);

/** What the player can configure. */
export type SkyjoSettings = {
  /** How many seats the table has, the human included. */
  readonly playerCount: number;
  /** How hard the computer opponents play. */
  readonly difficulty: Difficulty;
};

/** What a first-time visitor gets. */
export const DEFAULT_SETTINGS: SkyjoSettings = {
  playerCount: DEFAULT_PLAYER_COUNT,
  difficulty: DEFAULT_DIFFICULTY,
};

/**
 * Loads the stored settings.
 *
 * @returns the settings, with anything missing or unusable defaulted
 */
export function loadSettings(): SkyjoSettings {
  const stored = readStored(SETTINGS_KEY, SETTINGS_VERSION, isPartialSettings);
  return {
    playerCount: clampPlayers(stored?.playerCount),
    difficulty: isDifficulty(stored?.difficulty)
      ? stored.difficulty
      : DEFAULT_DIFFICULTY,
  };
}

/**
 * Stores the settings.
 *
 * @param settings - the settings to keep for next time
 */
export function saveSettings(settings: SkyjoSettings): void {
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, {
    playerCount: clampPlayers(settings.playerCount),
    difficulty: settings.difficulty,
  });
}

/** Holds a table size inside what the game can actually seat. */
export function clampPlayers(count: unknown): number {
  return typeof count === "number" && Number.isFinite(count)
    ? Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.round(count)))
    : DEFAULT_PLAYER_COUNT;
}

/** Whether a stored value could be a settings object at all. */
function isPartialSettings(value: unknown): value is Partial<SkyjoSettings> {
  return typeof value === "object" && value !== null;
}
