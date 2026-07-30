/**
 * Remembers which word list a person likes to play Krakel Orakel with, so the
 * entry screen offers the same difficulty next time.
 *
 * @module
 * @remarks
 * Stored per browser under a Krakel-specific key, next to the player's name and
 * table size. Anything unknown in storage falls back to the default, so an
 * outdated or hand-edited entry can never select a list that does not exist.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";
import { DIFFICULTIES, type Difficulty } from "@/games/krakel/engine/types";

/** Schema version of the stored difficulty - raise it on breaking changes. */
const DIFFICULTY_VERSION = 1;

/** Storage key for the wished difficulty. */
const DIFFICULTY_KEY = storageKey("krakel", "online-difficulty");

/** The difficulty offered before anybody has chosen one. */
export const DEFAULT_DIFFICULTY: Difficulty = "easy";

/**
 * Loads the wished difficulty.
 *
 * @returns the stored difficulty, or {@link DEFAULT_DIFFICULTY} if none is stored
 */
export function loadDifficulty(): Difficulty {
  return (
    readStored(DIFFICULTY_KEY, DIFFICULTY_VERSION, isDifficulty) ??
    DEFAULT_DIFFICULTY
  );
}

/**
 * Stores the difficulty to reuse next time.
 *
 * @param difficulty - the word list the player chose
 */
export function saveDifficulty(difficulty: Difficulty): void {
  writeStored(DIFFICULTY_KEY, DIFFICULTY_VERSION, difficulty);
}

/** Whether a stored value is a difficulty the game still knows. */
function isDifficulty(value: unknown): value is Difficulty {
  return (
    typeof value === "string" && DIFFICULTIES.includes(value as Difficulty)
  );
}
