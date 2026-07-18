/**
 * Seeded pseudo-random numbers, so a game replays identically from a seed.
 *
 * @module
 * @remarks
 * Mulberry32 - tiny, fast, and good enough for shuffling. The state is a plain
 * number so it serializes with the rest of the game state.
 */

/** The generator's state - just the current seed. */
export type RandomState = {
  readonly seed: number;
};

/** Keeps the multiplier in the 32-bit range mulberry32 expects. */
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
 * Shuffles a list without touching the input.
 *
 * @param items - the list to shuffle
 * @param state - the generator state
 * @returns the shuffled copy and the next state
 */
export function shuffle<T>(
  items: readonly T[],
  state: RandomState,
): { items: T[]; state: RandomState } {
  const result = [...items];
  let current = state;

  for (let i = result.length - 1; i > 0; i--) {
    const draw = nextRandom(current);
    current = draw.state;
    const j = Math.floor(draw.value * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return { items: result, state: current };
}
