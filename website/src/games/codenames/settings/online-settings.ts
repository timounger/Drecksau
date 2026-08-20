/**
 * Remembers what the online entry screen was last set to: the table size this
 * player searches for.
 *
 * @module
 * @remarks
 * The only setting this game has, and it exists only online. Against the
 * computer the table is fixed - you and three machines - so there is nothing to
 * choose and no settings page to choose it on.
 *
 * The **name** is not here: it belongs to the player rather than to this game,
 * and lives in {@link @/online/player-name} where every game finds it.
 */
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/codenames/engine/state";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored entries - raise it on breaking changes. */
const ONLINE_VERSION = 1;

/** Storage key for the wished number of players. */
const COUNT_KEY = storageKey("codenames", "online-player-count");

/**
 * Table size a first-time searcher looks for.
 *
 * @remarks
 * Four - the smallest table the rulebook calls a standard game, and the one a
 * search is most likely to fill.
 */
export const DEFAULT_PLAYER_COUNT = MIN_PLAYERS;

/**
 * The table sizes on offer.
 *
 * @remarks
 * Even numbers only. Sides are handed out alternately, so an odd table leaves
 * one team an operative short - playable, but not a table anybody chose.
 */
export const PLAYER_COUNTS: readonly number[] = Array.from(
  { length: Math.floor((MAX_PLAYERS - MIN_PLAYERS) / 2) + 1 },
  (unused, index) => MIN_PLAYERS + index * 2,
);

/**
 * Loads the wished number of players for automatic matchmaking.
 *
 * @returns the stored count, or {@link DEFAULT_PLAYER_COUNT} if none is stored
 */
export function loadMatchCount(): number {
  const stored = readStored(COUNT_KEY, ONLINE_VERSION, isNumber);
  return stored === null ? DEFAULT_PLAYER_COUNT : clampPlayers(stored);
}

/**
 * Stores the wished number of players to reuse next time.
 *
 * @param count - the table size the player chose
 */
export function saveMatchCount(count: number): void {
  writeStored(COUNT_KEY, ONLINE_VERSION, clampPlayers(count));
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

/** Whether a stored value is a usable number. */
function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
