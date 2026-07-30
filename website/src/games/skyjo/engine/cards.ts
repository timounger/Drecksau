/**
 * The Skyjo deck: which cards exist, and how a round's deck is shuffled.
 *
 * @module
 * @remarks
 * A card is nothing but its value, from -2 to 12. There are no suits and no
 * backs to tell apart - what makes a card interesting is only whether it is
 * face up yet. That is why the whole deck is a plain list of numbers.
 */
import { randomInt, type Random } from "./random";

/** The lowest and highest value printed on a card. */
export const MIN_VALUE = -2;
export const MAX_VALUE = 12;

/** How many cards of each value the deck holds. */
const COPIES: Readonly<Record<number, number>> = {
  [-2]: 5,
  [-1]: 10,
  0: 15,
};

/** Copies of every value from 1 to 12, which are all equally common. */
const COPIES_DEFAULT = 10;

/** How many cards one player is dealt. */
export const GRID_SIZE = 12;

/** The shape of a player's layout. */
export const GRID_COLUMNS = 4;
export const GRID_ROWS = 3;

/**
 * The whole deck, in order.
 *
 * @returns all 150 cards, lowest value first
 * @remarks
 * Built rather than written out: the composition is a rule of the game, and a
 * list of 150 literals would hide a miscount.
 */
export function fullDeck(): number[] {
  const cards: number[] = [];
  for (let value = MIN_VALUE; value <= MAX_VALUE; value++) {
    const copies = COPIES[value] ?? COPIES_DEFAULT;
    for (let i = 0; i < copies; i++) {
      cards.push(value);
    }
  }
  return cards;
}

/**
 * Shuffles a list with the seeded generator (Fisher-Yates).
 *
 * @param random - the seeded generator to draw from
 * @param cards - the cards to shuffle
 * @returns a new list in a shuffled order
 */
export function shuffle(random: Random, cards: readonly number[]): number[] {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(random, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * The indexes of one column of the layout.
 *
 * @param column - the column, 0-based from the left
 * @returns the three grid indexes that column occupies, top to bottom
 * @remarks
 * The layout is stored row-major, so a column is every fourth index.
 */
export function columnIndexes(column: number): number[] {
  const indexes: number[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    indexes.push(row * GRID_COLUMNS + column);
  }
  return indexes;
}
