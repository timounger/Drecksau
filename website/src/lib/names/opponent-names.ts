/**
 * Random names for computer opponents, shared by every game in the collection.
 *
 * @module
 * @remarks
 * One pool and one seeded draw, so each game deals a different-looking table
 * without carrying its own name list. The draw is seeded (not `Math.random`) on
 * purpose: the first game of each game is prerendered at build time, so real
 * randomness would make the browser render different names than the shipped HTML
 * and break hydration. A seed also keeps a game replayable - same seed, same
 * table. The tiny Mulberry32 generator here is self-contained so this module
 * depends on no single game's engine.
 */

/**
 * The names opponents are drawn from.
 *
 * @remarks
 * Plain German first names, mixed on purpose. Big enough that a table rarely
 * looks the same twice, that removing the player's own name never runs it dry,
 * and that even a six-player game (five opponents) has plenty to choose from.
 */
export const OPPONENT_NAME_POOL: readonly string[] = [
  "Anna",
  "Bea",
  "Berta",
  "Cleo",
  "Doris",
  "Emil",
  "Emma",
  "Frieda",
  "Gerda",
  "Hugo",
  "Ida",
  "Jonas",
  "Klara",
  "Lotte",
  "Mia",
  "Nora",
  "Otto",
  "Paula",
  "Rosi",
  "Theo",
];

/** Mulberry32 constants (see {@link https://en.wikipedia.org/wiki/Xorshift}). */
const STEP = 0x6d2b79f5;
const MASK_32 = 0xffffffff;
const MUL_1 = 61;
const SHIFT_A = 15;
const SHIFT_B = 7;
const SHIFT_C = 14;

/**
 * Keeps the name draw apart from a game's own card shuffle.
 *
 * @remarks
 * Both start from the game's seed; without an offset they would consume the same
 * random sequence. Nothing would break today, but tying two unrelated things to
 * one sequence is the kind of coupling that surprises later.
 */
const NAME_SEED_OFFSET = 7919;

/**
 * Draws the names for one game's opponents.
 *
 * @param count - how many opponents are needed
 * @param humanName - the player's own name, which no opponent may share
 * @param seed - the game's seed
 * @returns that many distinct names, in a seed-determined order
 * @throws if the pool cannot supply enough names
 * @example
 * ```ts
 * pickOpponentNames(2, "Timo", 42); // e.g. ["Otto", "Frieda"] - always the same for 42
 * ```
 */
export function pickOpponentNames(
  count: number,
  humanName: string,
  seed: number,
): string[] {
  const available = OPPONENT_NAME_POOL.filter((name) => name !== humanName);
  if (count > available.length) {
    throw new Error(
      `need ${count} opponent names, only ${available.length} left`,
    );
  }
  // Shuffled, not drawn with replacement: no two opponents share a name.
  return shuffle(available, seed + NAME_SEED_OFFSET).slice(0, count);
}

/**
 * Shuffles a list without touching the input, seeded so it is reproducible.
 *
 * @param items - the list to shuffle
 * @param seed - the generator seed
 * @returns a shuffled copy
 */
function shuffle(items: readonly string[], seed: number): string[] {
  const result = [...items];
  let state = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    state = (state + STEP) >>> 0;
    let x = state;
    x = Math.imul(x ^ (x >>> SHIFT_A), x | 1);
    x ^= x + Math.imul(x ^ (x >>> SHIFT_B), x | MUL_1);
    const value = ((x ^ (x >>> SHIFT_C)) >>> 0) / (MASK_32 + 1);
    const j = Math.floor(value * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
