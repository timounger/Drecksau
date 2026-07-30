/**
 * How hard the computer opponents play.
 *
 * @module
 * @remarks
 * Kept free of engine imports so the settings, which also run in the plain-node
 * test runner, can depend on it. What each level actually does lives in the AI
 * ({@link ./ai}).
 */

/**
 * The three difficulty levels.
 *
 * @remarks
 * - `leicht`: takes an obviously good card, but is otherwise careless - it
 *   ignores the column rule and often turns cards up instead of improving.
 * - `mittel`: the plain heuristic - the best move it can see each turn.
 * - `schwer`: the heuristic plus an eye on the end of the round; it holds back
 *   on turning its last card up unless it is actually ahead.
 *
 * On every level the computer only ever sees what a player at the table can
 * see - never a face-down value, not even its own.
 */
export type Difficulty = "leicht" | "mittel" | "schwer";

/** All levels, in the order they appear in the settings. */
export const DIFFICULTIES: readonly Difficulty[] = [
  "leicht",
  "mittel",
  "schwer",
];

/** The level new visitors get. */
export const DEFAULT_DIFFICULTY: Difficulty = "mittel";

/**
 * Tells whether a value is a known difficulty.
 *
 * @param value - the value to check, e.g. from storage
 * @returns true if it names a level this version ships
 */
export function isDifficulty(value: unknown): value is Difficulty {
  return (
    typeof value === "string" && DIFFICULTIES.includes(value as Difficulty)
  );
}
