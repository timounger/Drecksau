/**
 * Remembers what the online entry screen was last set to: the table size this
 * player searches for.
 *
 * @module
 * @remarks
 * Kept apart from {@link ./app-settings}: that one is the table the computer
 * game is dealt, this one is only about looking for strangers online. Someone
 * who plays three-handed against the computer may well want a full table when
 * searching, and changing one must not quietly change the other.
 *
 * The **name** is not here: it belongs to the player rather than to this game,
 * and lives in {@link @/online/player-name} where every game finds it.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";
import { clampPlayers, DEFAULT_PLAYER_COUNT } from "./app-settings";

/** Schema version of the stored entries - raise it on breaking changes. */
const ONLINE_VERSION = 1;

/** Storage key for the wished number of players. */
const COUNT_KEY = storageKey("heckmeck", "online-player-count");

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

/** Whether a stored value is a usable number. */
function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
