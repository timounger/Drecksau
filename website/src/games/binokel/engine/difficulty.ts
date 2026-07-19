/**
 * How hard the Binokel computer opponents play.
 *
 * @module
 * @remarks
 * Kept small and free of engine imports so the settings, which also run in the
 * plain-node test runner, can depend on it. The behaviour of each level lives
 * in the AI ({@link ./ai}): how boldly it reizt and how well it plays tricks.
 * Who opens the bidding stays random on every level.
 */

/**
 * The three difficulty levels.
 *
 * @remarks
 * - `leicht`: bids timidly and plays a random legal card - the weakest play.
 * - `mittel`: bids to its hand estimate and always plays the cheapest legal
 *   card.
 * - `schwer`: competes harder in the bidding and cashes its winners, leading
 *   its strongest cards to pull trumps and take points.
 *
 * On every level the opponents only ever see their own hand and the table -
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
