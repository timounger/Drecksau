/**
 * Seeded random numbers kept in the game state, so a run can be replayed.
 *
 * @module
 */

/** Something carrying a random seed. */
type Seeded = { seed: number };

/* eslint-disable @typescript-eslint/no-magic-numbers -- the constants of the
   mulberry32 generator */
/**
 * The next random number (mulberry32).
 *
 * @param state - holds the seed; advanced
 * @returns a number from 0 (inclusive) to 1 (exclusive)
 */
export function nextRandom(state: Seeded): number {
  state.seed = (state.seed + 0x6d2b79f5) | 0;
  let t = state.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * A random number in a range.
 *
 * @param state - holds the seed
 * @param low - smallest value
 * @param high - largest value (exclusive)
 * @returns the number
 */
export function randomIn(state: Seeded, low: number, high: number): number {
  return low + nextRandom(state) * (high - low);
}

/**
 * One element of a list, picked at random.
 *
 * @param state - holds the seed
 * @param list - the choices; must not be empty
 * @returns one of them
 */
export function pick<T>(state: Seeded, list: readonly T[]): T {
  return list[Math.floor(nextRandom(state) * list.length) % list.length];
}
