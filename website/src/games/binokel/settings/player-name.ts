/**
 * Remembers the name a player last used for online Binokel, so the entry screen
 * can prefill it next time.
 *
 * @module
 * @remarks
 * Stored per browser under a Binokel-specific key. This is the personal display
 * name, separate from the host's per-lobby choices.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored name - raise it on breaking changes. */
const NAME_VERSION = 1;

/** Storage key for the player's last online name. */
const NAME_KEY = storageKey("binokel", "online-player-name");

/**
 * Loads the last online name.
 *
 * @returns the stored name, or an empty string if none is stored
 */
export function loadPlayerName(): string {
  return readStored(NAME_KEY, NAME_VERSION, isName) ?? "";
}

/**
 * Stores the online name to reuse next time.
 *
 * @param name - the name the player chose
 */
export function savePlayerName(name: string): void {
  writeStored(NAME_KEY, NAME_VERSION, name);
}

/** Whether a stored value is a usable name string. */
function isName(value: unknown): value is string {
  return typeof value === "string";
}
