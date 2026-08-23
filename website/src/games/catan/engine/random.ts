/**
 * The seeded generator the island is laid out and the dice are rolled from.
 *
 * @module
 * @remarks
 * The same generator the other games of the collection use, with its cursor
 * carried **inside** the game state. Cards are drawn from the first turn to the
 * last, so a saved game and a snapshot on the wire both have to remember where
 * that sequence had got to - and a client can check a draw instead of having to
 * trust the host.
 */

/** A generator that keeps its own cursor and can hand it back out again. */
export type Random = {
  /** The next value in [0, 1). */
  next(): number;
  /** The cursor as it stands now, to store in the game state. */
  state(): number;
};

/** A large odd increment that spreads successive states well. */
const SEED_STEP = 0x6d2b79f5;

/** Bit-mixing constants of mulberry32. */
const MIX_A = 15;
const MIX_B = 61;
const MIX_C = 7;
const MIX_D = 14;

/** Divisor that maps a 32-bit unsigned integer into [0, 1). */
const UINT32 = 4294967296;

/**
 * Creates a generator that continues from a stored cursor.
 *
 * @param seed - the cursor to continue from
 * @returns the generator; read {@link Random.state} back into the game after use
 */
export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  const next = () => {
    state = (state + SEED_STEP) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> MIX_A), 1 | t);
    t = (t + Math.imul(t ^ (t >>> MIX_C), MIX_B | t)) ^ t;
    return ((t ^ (t >>> MIX_D)) >>> 0) / UINT32;
  };
  return { next, state: () => state };
}

/**
 * Picks an integer in [0, count).
 *
 * @param random - the generator
 * @param count - the exclusive upper bound (must be positive)
 * @returns an integer in [0, count)
 */
export function randomInt(random: Random, count: number): number {
  return Math.floor(random.next() * count);
}

/**
 * Shuffles a list without touching the original.
 *
 * @param random - the generator
 * @param items - the list to shuffle
 * @returns a new list in random order
 */
export function shuffle<T>(random: Random, items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = randomInt(random, index + 1);
    const swap = copy[index];
    copy[index] = copy[other];
    copy[other] = swap;
  }
  return copy;
}
