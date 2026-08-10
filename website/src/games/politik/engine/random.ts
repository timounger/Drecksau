/**
 * The seeded generator the whole game draws its randomness from.
 *
 * @module
 * @remarks
 * "Das politische Talent" rolls dice all game long, not only when it is dealt.
 * So the generator's state has to travel **inside** the game state: it is a
 * plain number, it survives a save and a trip over the wire, and replaying the
 * same moves from the same state gives the same dice. That is what lets the
 * online host be the single referee - every client can check the roll instead
 * of having to trust it.
 *
 * The generator is mulberry32: small, fast and more than good enough for dice.
 */

/** A generator that keeps its own cursor and can hand it back out again. */
export type Random = {
  /** The next value in [0, 1). */
  next(): number;
  /** The next die, 1 to {@link DIE_FACES}. */
  roll(): number;
  /** The cursor as it stands now, to store in the game state. */
  state(): number;
};

/** Faces of one die. */
export const DIE_FACES = 6;

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
  return {
    next,
    roll: () => 1 + Math.floor(next() * DIE_FACES),
    state: () => state,
  };
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
