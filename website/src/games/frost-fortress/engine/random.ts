/**
 * Seeded random numbers, so a saved game goes on the way it would have.
 *
 * @module
 */

/** Multiplier of the mulberry32 step. */
const STEP = 0x6d2b79f5;

/** Shifts and the mixing constant of mulberry32. */
const SHIFT_A = 15;
const SHIFT_B = 7;
const SHIFT_C = 14;
const MIX = 61;

/** 2 to the 32nd, to turn the integer into a fraction. */
const UINT_RANGE = 4294967296;

/** Primes that spread the two hash coordinates. */
const HASH_X = 0x27d4eb2d;
const HASH_Y = 0x165667b1;

/** Something that carries a random state. */
export type Seeded = { rng: number };

/**
 * Draws the next number of a seeded sequence.
 *
 * @param holder - the object whose `rng` field is the state; it is advanced
 * @returns a number from 0 (inclusive) to 1 (exclusive)
 */
export function nextRandom(holder: Seeded): number {
  holder.rng = (holder.rng + STEP) | 0;
  let value = holder.rng;
  value = Math.imul(value ^ (value >>> SHIFT_A), value | 1);
  value ^= value + Math.imul(value ^ (value >>> SHIFT_B), value | MIX);
  return ((value ^ (value >>> SHIFT_C)) >>> 0) / UINT_RANGE;
}

/**
 * A whole number between two bounds.
 *
 * @param holder - the random state
 * @param low - smallest value
 * @param high - largest value, inclusive
 * @returns the number
 */
export function randomInt(holder: Seeded, low: number, high: number): number {
  return low + Math.floor(nextRandom(holder) * (high - low + 1));
}

/**
 * A number between two bounds.
 *
 * @param holder - the random state
 * @param low - smallest value
 * @param high - largest value
 * @returns the number
 */
export function randomRange(holder: Seeded, low: number, high: number): number {
  return low + nextRandom(holder) * (high - low);
}

/**
 * One element of a list.
 *
 * @param holder - the random state
 * @param items - a list with at least one element
 * @returns one of them
 */
export function randomPick<T>(holder: Seeded, items: readonly T[]): T {
  return items[Math.floor(nextRandom(holder) * items.length)];
}

/**
 * A pure hash of two integers and a seed, for terrain that must come out the
 * same every time without carrying a state.
 *
 * @param x - first coordinate
 * @param y - second coordinate
 * @param seed - the map's seed
 * @returns a number from 0 to 1
 */
export function hash2(x: number, y: number, seed: number): number {
  const holder = {
    rng: (Math.imul(x, HASH_X) ^ Math.imul(y, HASH_Y) ^ seed) | 0,
  };
  return nextRandom(holder);
}
