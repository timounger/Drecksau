/**
 * Seeded random numbers, so both players draw the same wind and the same
 * scenery from one seed.
 *
 * @module
 * @remarks
 * Mulberry32, as everywhere else in the collection. Stateless helpers: a value
 * is always derived from a seed and a counter, so nothing has to be carried
 * along between draws and any client can recompute any draw.
 */

/** Mulberry32 step constant. */
const STEP = 0x6d2b79f5;
/** Shifts of the Mulberry32 mixer. */
const SHIFT_A = 15;
const SHIFT_B = 7;
const SHIFT_C = 14;
/** Or-ed in by the second Mulberry32 multiply. */
const MUL_OR = 61;
/** 2 to the 32, to turn a 32-bit integer into [0, 1). */
const TWO_POW_32 = 4_294_967_296;
/** Golden-ratio constant used to spread a counter over the seed space. */
const GOLDEN = 0x9e3779b9;

/**
 * A number in [0, 1) that depends only on the seed and the counter.
 *
 * @param seed - the match seed
 * @param counter - which draw this is
 * @returns the value
 */
export function randomAt(seed: number, counter: number): number {
  let x = (seed + Math.imul(counter + 1, GOLDEN) + STEP) >>> 0;
  x = Math.imul(x ^ (x >>> SHIFT_A), x | 1);
  x ^= x + Math.imul(x ^ (x >>> SHIFT_B), x | MUL_OR);
  return ((x ^ (x >>> SHIFT_C)) >>> 0) / TWO_POW_32;
}

/**
 * A whole number in [0, bound) that depends only on the seed and the counter.
 *
 * @param seed - the match seed
 * @param counter - which draw this is
 * @param bound - the exclusive upper bound
 * @returns the integer
 */
export function intAt(seed: number, counter: number, bound: number): number {
  return Math.floor(randomAt(seed, counter) * bound);
}

/**
 * A fresh seed for the next match at the same table.
 *
 * @param seed - this match's seed
 * @returns a seed that looks unrelated, but is the same on every client
 */
export function nextSeed(seed: number): number {
  return Math.floor(randomAt(seed, -1) * TWO_POW_32) >>> 0;
}
