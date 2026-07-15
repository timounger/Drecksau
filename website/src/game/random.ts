/**
 * Seeded pseudo random number generator, kept pure so games are reproducible.
 *
 * @module
 */

/** Opaque state of the generator - carried inside the game state. */
export type RandomState = {
  readonly seed: number;
};

/** Multiplier of the mulberry32 step - see the algorithm reference. */
const SEED_INCREMENT = 0x6d2b79f5;
const MIX_SHIFT_A = 15;
const MIX_SHIFT_B = 7;
const MIX_SHIFT_C = 14;
const MIX_MULTIPLIER = 61;
const UINT32_RANGE = 4294967296;

/**
 * Creates a generator state from an arbitrary seed.
 *
 * @param seed - any integer; the same seed always replays the same game
 * @returns the initial generator state
 */
export function createRandom(seed: number): RandomState {
  return { seed: seed >>> 0 };
}

/**
 * Draws the next number in the sequence.
 *
 * @param state - current generator state
 * @returns the value in [0, 1) and the advanced state
 */
export function nextRandom(state: RandomState): {
  value: number;
  state: RandomState;
} {
  const seed = (state.seed + SEED_INCREMENT) >>> 0;
  let mixed = seed;
  mixed = Math.imul(mixed ^ (mixed >>> MIX_SHIFT_A), mixed | 1);
  mixed ^=
    mixed + Math.imul(mixed ^ (mixed >>> MIX_SHIFT_B), mixed | MIX_MULTIPLIER);
  const value = ((mixed ^ (mixed >>> MIX_SHIFT_C)) >>> 0) / UINT32_RANGE;
  return { value, state: { seed } };
}

/**
 * Shuffles a list without touching the input (Fisher-Yates).
 *
 * @param items - the list to shuffle
 * @param state - current generator state
 * @returns the shuffled copy and the advanced state
 */
export function shuffle<T>(
  items: readonly T[],
  state: RandomState,
): { items: T[]; state: RandomState } {
  const result = [...items];
  let current = state;
  for (let index = result.length - 1; index > 0; index--) {
    const drawn = nextRandom(current);
    current = drawn.state;
    const swapIndex = Math.floor(drawn.value * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return { items: result, state: current };
}

/**
 * Picks one element at random.
 *
 * @param items - a non empty list
 * @param state - current generator state
 * @returns the picked element and the advanced state
 * @throws if the list is empty
 */
export function pickRandom<T>(
  items: readonly T[],
  state: RandomState,
): { item: T; state: RandomState } {
  if (items.length === 0) {
    throw new Error("pickRandom needs a non empty list");
  }
  const drawn = nextRandom(state);
  const index = Math.floor(drawn.value * items.length);
  return { item: items[index], state: drawn.state };
}
