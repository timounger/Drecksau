/**
 * The one name a player goes by online, shared by every game.
 *
 * @module
 * @remarks
 * It used to be stored per game, so the name typed for Binokel meant nothing
 * to Skyjo and the one typed for Drecksau was not stored at all. Nobody thinks
 * of themselves as a different person per game: the name belongs to the
 * player, not to the table they happen to sit at.
 *
 * One key for all of them, therefore, and every entry screen fills its field
 * from it and writes it back as it is typed - so whatever was used last is
 * what comes up next, wherever that was.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored name - raise it on breaking changes. */
const NAME_VERSION = 1;

/** Storage key for the player's online name, shared by every game. */
const NAME_KEY = storageKey("online", "player-name");

/**
 * The per-game keys this replaced.
 *
 * @remarks
 * Read once, so that nobody who already had a name loses it the day the
 * shared one arrives. The first non-empty one wins and is adopted; from then
 * on only the shared key is ever read. Safe to delete once no browser can
 * plausibly still be carrying one of these.
 */
const OLD_KEYS: readonly string[] = [
  storageKey("binokel", "online-player-name"),
  storageKey("krakel", "online-player-name"),
  storageKey("panzerkiste", "online-player-name"),
  storageKey("skyjo", "online-player-name"),
];

/**
 * Loads the name this player last went by online.
 *
 * @returns the stored name, or an empty string if there is none
 * @remarks
 * Trimmed on the way out: a name of nothing but spaces is not a name, and
 * every caller would otherwise have to remember to say so itself.
 */
export function loadPlayerName(): string {
  const shared = readStored(NAME_KEY, NAME_VERSION, isName)?.trim() ?? "";
  return shared === "" ? adoptOldName() : shared;
}

/**
 * Stores the name to use next time, in every game.
 *
 * @param name - the name the player chose
 * @remarks
 * Stored as typed rather than trimmed, so a space that is about to be followed
 * by a surname does not vanish from under the cursor.
 */
export function savePlayerName(name: string): void {
  writeStored(NAME_KEY, NAME_VERSION, name);
}

/**
 * Takes over a name left behind by one of the per-game keys.
 *
 * @returns the adopted name, or an empty string if there is none to adopt
 */
function adoptOldName(): string {
  for (const key of OLD_KEYS) {
    const old = readStored(key, NAME_VERSION, isName)?.trim() ?? "";
    if (old !== "") {
      savePlayerName(old);
      return old;
    }
  }
  return "";
}

/** Whether a stored value is a usable name string. */
function isName(value: unknown): value is string {
  return typeof value === "string";
}
