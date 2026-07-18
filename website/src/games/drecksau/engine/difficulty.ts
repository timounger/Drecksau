/**
 * How hard the computer opponents play.
 *
 * @module
 * @remarks
 * Kept small and free of engine imports so the settings, which are also run in
 * the plain-node test runner, can depend on it. The behaviour of each level
 * lives in the AI ({@link ./ai}) and in who starts a game ({@link ./setup}).
 */

/**
 * The three difficulty levels.
 *
 * @remarks
 * - `leicht`: plays mostly at random (but still grabs an immediate win). You
 *   always start.
 * - `mittel`: the plain heuristic - best move each turn. Random starting
 *   player.
 * - `schwer`: the heuristic plus one move of look-ahead that blocks an
 *   opponent about to win. Random starting player.
 *
 * On every level the opponents only ever see the board and their own hand -
 * never your cards.
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
