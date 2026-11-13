/**
 * The SaveManager's storage: the automatic save a reload resumes and three
 * slots the player saves to by hand.
 *
 * @module
 * @remarks
 * All go through the versioned local store. Saves of the first version are
 * converted on loading; a save the game cannot read is reported as such
 * instead of breaking the page.
 */
import { isSaveData, type SaveData } from "@/games/imperavis/engine/save";
import {
  readStored,
  removeStored,
  storageKey,
  writeStored,
} from "@/lib/storage/local-store";

/** Schema version of a stored game. */
const VERSION = 1;

/** How many slots there are for saving by hand. */
export const SLOTS = 3;

/** Where the automatic save lives. */
const AUTO_KEY = storageKey("imperavis", "autosave-game");

/** A saved game with when it was saved and when it began. */
export type SavedGame = {
  readonly savedAt: number;
  readonly startedAt: number;
  readonly game: SaveData;
};

/**
 * Reads the automatic save.
 *
 * @returns it, or null
 */
export function loadAutosave(): SavedGame | null {
  return readStored(AUTO_KEY, VERSION, isSavedGame);
}

/**
 * Writes the automatic save.
 *
 * @param saved - the game
 * @returns true if it was stored
 */
export function writeAutosave(saved: SavedGame): boolean {
  return writeStored(AUTO_KEY, VERSION, saved);
}

/** Forgets the automatic save. */
export function clearAutosave(): void {
  removeStored(AUTO_KEY);
}

/**
 * Reads a hand-made save.
 *
 * @param slot - 1 to {@link SLOTS}
 * @returns it, or null
 */
export function loadSlot(slot: number): SavedGame | null {
  return readStored(slotKey(slot), VERSION, isSavedGame);
}

/**
 * Writes a hand-made save.
 *
 * @param slot - 1 to {@link SLOTS}
 * @param saved - the game
 * @returns true if it was stored
 */
export function writeSlot(slot: number, saved: SavedGame): boolean {
  return writeStored(slotKey(slot), VERSION, saved);
}

/**
 * Stored games this version cannot load, so the menu can say so instead of
 * showing an empty slot.
 *
 * @returns slot numbers, 0 for the automatic save
 */
export function unreadableSaves(): number[] {
  const keys = [
    AUTO_KEY,
    ...Array.from({ length: SLOTS }, (_, i) => slotKey(i + 1)),
  ];
  const anything = (value: unknown): value is unknown => value !== undefined;
  return keys
    .map((key, index) => ({ key, index }))
    .filter(
      ({ key }) =>
        readStored(key, VERSION, anything) !== null &&
        readStored(key, VERSION, isSavedGame) === null,
    )
    .map(({ index }) => index);
}

/** The storage key of a slot. */
function slotKey(slot: number): string {
  return storageKey("imperavis", `save-${slot}`);
}

/** Whether a stored value is a saved game. */
function isSavedGame(value: unknown): value is SavedGame {
  const saved = value as SavedGame;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof saved.savedAt === "number" &&
    typeof saved.startedAt === "number" &&
    isSaveData(saved.game)
  );
}
