/**
 * Remembers what the online entry screen was last set to: the name a player
 * goes by and the table size they search for.
 *
 * @module
 * @remarks
 * Kept apart from {@link ./app-settings}: that one is the table the computer
 * game is dealt, this one is only about looking for strangers online. Someone
 * who plays three-handed against the computer may well want a full table when
 * searching, and changing one must not quietly change the other.
 *
 * Stored per browser under Skyjo-specific keys. The count is clamped on the way
 * out, so a hand-edited or outdated entry can never ask for a table the game
 * cannot seat.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";
import { clampPlayers, DEFAULT_PLAYER_COUNT } from "./app-settings";

/** Schema version of the stored entries - raise it on breaking changes. */
const ONLINE_VERSION = 1;

/** Storage key for the wished number of players. */
const COUNT_KEY = storageKey("skyjo", "online-player-count");

/** Storage key for the player's last online name. */
const NAME_KEY = storageKey("skyjo", "online-player-name");

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
 * Loads the last online name.
 *
 * @returns the stored name, or an empty string if none is stored
 */
export function loadPlayerName(): string {
  return readStored(NAME_KEY, ONLINE_VERSION, isString) ?? "";
}

/**
 * Stores the online name to reuse next time.
 *
 * @param name - the name the player chose
 */
export function savePlayerName(name: string): void {
  writeStored(NAME_KEY, ONLINE_VERSION, name);
}

/** Whether a stored value is a usable number. */
function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Whether a stored value is a usable name string. */
function isString(value: unknown): value is string {
  return typeof value === "string";
}
