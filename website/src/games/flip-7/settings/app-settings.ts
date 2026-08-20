/**
 * Flip 7 settings, stored in the browser.
 *
 * @module
 * @remarks
 * Kept under this game's own key, so it does not collide with the other games'
 * settings. Anything unknown or out of range falls back to the default, which
 * keeps a hand-edited or outdated entry from breaking a game.
 */
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/flip-7/engine/state";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings - raise it on breaking changes. */
const SETTINGS_VERSION = 1;

/** Key of the settings entry. */
const SETTINGS_KEY = storageKey("flip-7", "settings");

/**
 * Table size of a first-time visitor's game.
 *
 * @remarks
 * Four. The box says three at a minimum, and four is where the action cards
 * start being worth holding: with three, an Einfrieren has almost nobody to
 * choose between.
 */
export const DEFAULT_PLAYER_COUNT = 4;

/** The table sizes on offer, derived from the engine limits. */
export const PLAYER_COUNTS: readonly number[] = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (unused, index) => MIN_PLAYERS + index,
);

/** What the player can configure. */
export type Flip7Settings = {
  /** How many sit at the table, the human included. */
  readonly playerCount: number;
};

/** What a first-time visitor gets. */
export const DEFAULT_SETTINGS: Flip7Settings = {
  playerCount: DEFAULT_PLAYER_COUNT,
};

/**
 * Loads the stored settings.
 *
 * @returns the settings, with anything missing or unusable defaulted
 */
export function loadSettings(): Flip7Settings {
  const stored = readStored(SETTINGS_KEY, SETTINGS_VERSION, isPartialSettings);
  return { playerCount: clampPlayers(stored?.playerCount) };
}

/**
 * Stores the settings.
 *
 * @param settings - the settings to keep for next time
 */
export function saveSettings(settings: Flip7Settings): void {
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, {
    playerCount: clampPlayers(settings.playerCount),
  });
}

/**
 * Holds a table size inside what the game can actually seat.
 *
 * @param count - the value read back from storage or a control
 * @returns a seatable table size
 */
export function clampPlayers(count: unknown): number {
  return typeof count === "number" && Number.isFinite(count)
    ? Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.round(count)))
    : DEFAULT_PLAYER_COUNT;
}

/** Whether a stored value could be a settings object at all. */
function isPartialSettings(value: unknown): value is Partial<Flip7Settings> {
  return typeof value === "object" && value !== null;
}
