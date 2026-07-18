/**
 * Names for the computer opponents.
 *
 * @module
 */
import { createRandom, shuffle } from "@/games/drecksau/engine/random";

/**
 * The names opponents are drawn from.
 *
 * @remarks
 * Plain German first names, mixed on purpose. Big enough that a table rarely
 * looks the same twice, and that removing the player's own name never runs it
 * dry.
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

/**
 * Keeps the name draw apart from the card shuffle.
 *
 * @remarks
 * Both would otherwise start from the same seed and consume the same random
 * numbers. Nothing would go wrong today, but tying two unrelated things to one
 * sequence is the kind of coupling that surprises later.
 */
const NAME_SEED_OFFSET = 7919;

/**
 * Draws the names for one game's opponents.
 *
 * @param count - how many opponents are needed
 * @param humanName - the player's own name, which no opponent may share
 * @param seed - the game's seed
 * @returns that many distinct names
 * @throws if the pool cannot supply enough names
 * @remarks
 * Deliberately drawn from the seed rather than `Math.random`: the first game is
 * prerendered at build time, so real randomness would make the browser render
 * different names than the shipped HTML and break hydration. It also keeps a
 * game replayable - same seed, same table.
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
  return shuffle(available, createRandom(seed + NAME_SEED_OFFSET)).items.slice(
    0,
    count,
  );
}
