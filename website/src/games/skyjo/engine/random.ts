/**
 * A tiny deterministic pseudo-random generator for reproducible seeds.
 *
 * @module
 * @remarks
 * Used to shuffle a round's deck. Being seeded, the same seed always deals the
 * same round, which is what makes the rules testable and lets a game be
 * replayed. This is the well-known mulberry32 generator - small, fast and good
 * enough for shuffling cards.
 */

/** A function that returns the next pseudo-random number in [0, 1). */
export type Random = () => number;

/** A large odd increment that spreads successive seeds well. */
const SEED_STEP = 0x6d2b79f5;

/** Bit-mixing constants of mulberry32. */
const MIX_A = 15;
const MIX_B = 61;
const MIX_C = 7;
const MIX_D = 14;

/** Divisor that maps a 32-bit unsigned integer into [0, 1). */
const UINT32 = 4294967296;

/**
 * Creates a deterministic generator seeded by a number.
 *
 * @param seed - the seed; the same seed always yields the same sequence
 * @returns a function returning the next value in [0, 1)
 */
export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + SEED_STEP) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> MIX_A), 1 | t);
    t = (t + Math.imul(t ^ (t >>> MIX_C), MIX_B | t)) ^ t;
    const result = ((t ^ (t >>> MIX_D)) >>> 0) / UINT32;
    return result;
  };
}

/**
 * Picks an integer in [0, count) from a generator.
 *
 * @param random - the generator
 * @param count - the exclusive upper bound (must be positive)
 * @returns an integer in [0, count)
 */
export function randomInt(random: Random, count: number): number {
  return Math.floor(random() * count);
}
