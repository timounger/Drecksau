/**
 * Remembers how many players a person likes to play Krakel Orakel with, so the
 * entry screen offers the same table size next time.
 *
 * @module
 * @remarks
 * Stored per browser under a Krakel-specific key, next to the player's name.
 * The stored value is clamped on the way out, so a hand-edited or outdated
 * entry can never ask for a table the game cannot seat.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/krakel/engine/types";

/** Schema version of the stored count - raise it on breaking changes. */
const COUNT_VERSION = 1;

/** Storage key for the wished number of players. */
const COUNT_KEY = storageKey("krakel", "online-player-count");

/** The table size offered before anybody has chosen one. */
export const DEFAULT_PLAYER_COUNT = 4;

/** Every table size a player may pick, fewest first. */
export const PLAYER_COUNTS: readonly number[] = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, index) => MIN_PLAYERS + index,
);

/**
 * Loads the wished number of players.
 *
 * @returns the stored count, or {@link DEFAULT_PLAYER_COUNT} if none is stored
 */
export function loadPlayerCount(): number {
  const stored = readStored(COUNT_KEY, COUNT_VERSION, isCount);
  return stored === null ? DEFAULT_PLAYER_COUNT : clampCount(stored);
}

/**
 * Stores the wished number of players to reuse next time.
 *
 * @param count - the table size the player chose
 */
export function savePlayerCount(count: number): void {
  writeStored(COUNT_KEY, COUNT_VERSION, clampCount(count));
}

/** Holds a count inside the range the game can actually seat. */
export function clampCount(count: number): number {
  return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.round(count)));
}

/** Whether a stored value is a usable player count. */
function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
