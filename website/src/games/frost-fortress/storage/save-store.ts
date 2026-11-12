/**
 * The saved games: the automatic one that a reload resumes, and the one the
 * player saves by hand from the menu.
 *
 * @module
 * @remarks
 * Both go through the versioned local store, so a save from an older version
 * of the game is simply not offered instead of breaking the page.
 */
import { isSaveData } from "@/games/frost-fortress/engine/save";
import type { SaveData } from "@/games/frost-fortress/engine/types";
import {
  readStored,
  removeStored,
  storageKey,
  writeStored,
} from "@/lib/storage/local-store";

/** Schema version of a saved game. */
const VERSION = 1;

/** Where the two saves live. */
const AUTO_KEY = storageKey("frost-fortress", "autosave-game");
const MANUAL_KEY = storageKey("frost-fortress", "save");

/** What the statistics have already counted of a game. */
export type Counted = {
  readonly kills: number;
  readonly bosses: number;
  readonly built: number;
  readonly waves: number;
};

/** A saved game with when it was saved. */
export type SavedGame = {
  readonly savedAt: number;
  readonly game: SaveData;
  /** When the game was begun. */
  readonly startedAt: number;
  /** What of it the statistics already hold. */
  readonly counted: Counted;
  /** True once the defeat was counted. */
  readonly finished: boolean;
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
 * Reads the hand-made save.
 *
 * @returns it, or null
 */
export function loadManual(): SavedGame | null {
  return readStored(MANUAL_KEY, VERSION, isSavedGame);
}

/**
 * Writes the hand-made save.
 *
 * @param saved - the game
 * @returns true if it was stored
 */
export function writeManual(saved: SavedGame): boolean {
  return writeStored(MANUAL_KEY, VERSION, saved);
}

/** Whether a stored value is a saved game. */
function isSavedGame(value: unknown): value is SavedGame {
  const saved = value as SavedGame;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof saved.savedAt === "number" &&
    typeof saved.startedAt === "number" &&
    typeof saved.finished === "boolean" &&
    typeof saved.counted === "object" &&
    saved.counted !== null &&
    isSaveData(saved.game)
  );
}
