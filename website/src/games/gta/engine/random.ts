/**
 * Seeded pseudo-random numbers, so the enemy behaviour is reproducible.
 *
 * @module
 * @remarks
 * Mulberry32 - tiny and fast. The state is a plain number so it stays part of
 * the immutable game state; each draw returns the next state alongside a value.
 */

/** The generator's state - just the current seed. */
export type RandomState = {
  readonly seed: number;
};

/** Mulberry32 constants. */
const STEP = 0x6d2b79f5;
const MASK_32 = 0xffffffff;
const MUL_1 = 61;
const SHIFT_A = 15;
const SHIFT_B = 7;
const SHIFT_C = 14;

/**
 * Starts a generator from a seed.
 *
 * @param seed - any integer
 * @returns the initial state
 */
export function createRandom(seed: number): RandomState {
  return { seed: seed >>> 0 };
}

/**
 * Draws the next value in [0, 1).
 *
 * @param state - the current state
 * @returns the value and the next state
 */
export function nextRandom(state: RandomState): {
  value: number;
  state: RandomState;
} {
  const t = (state.seed + STEP) >>> 0;
  let x = t;
  x = Math.imul(x ^ (x >>> SHIFT_A), x | 1);
  x ^= x + Math.imul(x ^ (x >>> SHIFT_B), x | MUL_1);
  const value = ((x ^ (x >>> SHIFT_C)) >>> 0) / (MASK_32 + 1);
  return { value, state: { seed: t } };
}

/**
 * Draws a whole number in [0, bound).
 *
 * @param state - the current state
 * @param bound - the exclusive upper bound (must be positive)
 * @returns the integer and the next state
 */
export function nextInt(
  state: RandomState,
  bound: number,
): { value: number; state: RandomState } {
  const draw = nextRandom(state);
  return { value: Math.floor(draw.value * bound), state: draw.state };
}
