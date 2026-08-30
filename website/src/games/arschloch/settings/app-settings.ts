/**
 * Arschloch settings, stored in the browser.
 *
 * @module
 * @remarks
 * Kept under this game's own key, so it does not collide with the other games'
 * settings. Anything unknown or out of range falls back to the default, which
 * keeps a hand-edited or outdated entry from breaking a game.
 */
import {
  DEFAULT_ROUNDS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROUND_COUNTS,
} from "@/games/arschloch/engine/state";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings - raise it on breaking changes. */
const SETTINGS_VERSION = 1;

/** Key of the settings entry. */
const SETTINGS_KEY = storageKey("arschloch", "settings");

/**
 * Table size of a first-time visitor's game.
 *
 * @remarks
 * Four, because at four the pack divides evenly and all five titles exist -
 * both Vize seats included. At three the middle chair is simply a Buerger, and
 * the exchange that gives the game its bite happens between two players only.
 */
export const DEFAULT_PLAYER_COUNT = 4;

/** The table sizes on offer. */
export const PLAYER_COUNTS: readonly number[] = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (unused, index) => MIN_PLAYERS + index,
);

/** What the player can configure. */
export type ArschlochSettings = {
  /** How many sit at the table, the human included. */
  readonly playerCount: number;
  /** How many rounds are played before the points are counted. */
  readonly rounds: number;
};

/** What a first-time visitor gets. */
export const DEFAULT_SETTINGS: ArschlochSettings = {
  playerCount: DEFAULT_PLAYER_COUNT,
  rounds: DEFAULT_ROUNDS,
};

/**
 * Loads the stored settings.
 *
 * @returns the settings, with anything missing or unusable defaulted
 */
export function loadSettings(): ArschlochSettings {
  const stored = readStored(SETTINGS_KEY, SETTINGS_VERSION, isPartialSettings);
  return {
    playerCount: clampPlayers(stored?.playerCount),
    rounds: clampRounds(stored?.rounds),
  };
}

/**
 * Stores the settings.
 *
 * @param settings - the settings to keep for next time
 */
export function saveSettings(settings: ArschlochSettings): void {
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, {
    playerCount: clampPlayers(settings.playerCount),
    rounds: clampRounds(settings.rounds),
  });
}

/**
 * Holds a table size inside what the game seats.
 *
 * @param count - the value read back from storage or a control
 * @returns a seatable table size
 */
export function clampPlayers(count: unknown): number {
  return typeof count === "number" && Number.isFinite(count)
    ? Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.round(count)))
    : DEFAULT_PLAYER_COUNT;
}

/**
 * Holds a round count to one of the lengths on offer.
 *
 * @param rounds - the value read back from storage or a control
 * @returns a playable number of rounds
 */
export function clampRounds(rounds: unknown): number {
  return typeof rounds === "number" && ROUND_COUNTS.includes(rounds)
    ? rounds
    : DEFAULT_ROUNDS;
}

/** Whether a stored value could be a settings object at all. */
function isPartialSettings(
  value: unknown,
): value is Partial<ArschlochSettings> {
  return typeof value === "object" && value !== null;
}
