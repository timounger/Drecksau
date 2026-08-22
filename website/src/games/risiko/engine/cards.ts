/**
 * The card deck, the truce card, and what a handful of stars buys.
 *
 * @module
 * @remarks
 * A card here is a territory id, which is all a territory card is: a picture of
 * one place and one or two stars, and the stars belong to the territory rather
 * than to the card. The one exception is {@link TRUCE}, which is not a place.
 *
 * This edition prices trade-ins in **stars, not sets**. The old rule - three
 * matching symbols, escalating 4, 6, 8, 10 - is gone; here you hand in any
 * cards you like and read the total off a table. That changes how the game
 * feels more than it sounds: there is no waiting for a set, only the choice
 * between cashing in small now and saving for the big number.
 */
import { TERRITORIES, territoryOf } from "./map";

/**
 * The card that ends the basic game.
 *
 * @remarks
 * "Sobald sie aus dem Stapel gezogen wird, ist das Spiel zu Ende." It is shuffled
 * into the deck at a depth that depends on how many are playing, and it is the
 * only card that is not a territory - hence an id no territory can have.
 */
export const TRUCE = "__waffenstillstand";

/**
 * What a card in somebody else's hand looks like from outside.
 *
 * @remarks
 * Not a territory and not the truce, so nothing can mistake it for either. A
 * hand travelling over the wire keeps its **length** - which everybody can see
 * at a real table, and which matters, because a player sitting on five cards is
 * a player about to buy an army.
 */
export const HIDDEN_CARD = "__verdeckt";

/**
 * What a total of stars is worth in units.
 *
 * @remarks
 * Read straight off the "EINHEITEN FÜR KARTEN" table on the board, as printed
 * in the rulebook: 2 stars buy 2 units, 3 buy 4, 4 buy 7, and on to 10 stars
 * for 30. Written as a table rather than a formula because it is one - the
 * steps are 2, 3, 3, 3, 3, 4, 4, 4, 5 and no rule produces that.
 */
const UNITS_FOR_STARS: Readonly<Record<number, number>> = {
  2: 2,
  3: 4,
  4: 7,
  5: 10,
  6: 13,
  7: 17,
  8: 21,
  9: 25,
  10: 30,
};

/** The fewest stars that may be handed in at all. */
export const MIN_TRADE_STARS = 2;

/** The most the table goes up to. */
export const MAX_TRADE_STARS = 10;

/**
 * The whole territory deck, one card per territory.
 *
 * @returns the 42 territory ids, in board order
 */
export function buildDeck(): readonly string[] {
  return TERRITORIES.map((each) => each.id);
}

/**
 * How many stars a card shows.
 *
 * @param card - a territory id
 * @returns its stars, or 0 for the truce card
 */
export function starsOf(card: string): number {
  return territoryOf(card)?.stars ?? 0;
}

/**
 * How many stars a handful of cards shows.
 *
 * @param cards - the cards being handed in
 * @returns the total
 */
export function starsIn(cards: readonly string[]): number {
  return cards.reduce((total, card) => total + starsOf(card), 0);
}

/**
 * What a handful of cards buys.
 *
 * @param cards - the cards being handed in
 * @returns the units, or 0 if that total is not on the table
 * @remarks
 * Above ten stars the table simply stops, and so does this: the rulebook prints
 * no row for eleven. Handing in more than ten stars' worth is therefore not a
 * trade the referee will accept, which is also the only sane reading - the
 * alternative would be inventing a price the box does not name.
 */
export function unitsForCards(cards: readonly string[]): number {
  return UNITS_FOR_STARS[starsIn(cards)] ?? 0;
}

/**
 * Whether these cards are a trade the table has a price for.
 *
 * @param cards - the cards being handed in
 * @returns true if their star total is between 2 and 10
 */
export function isTradable(cards: readonly string[]): boolean {
  const stars = starsIn(cards);
  return (
    cards.length > 0 &&
    new Set(cards).size === cards.length &&
    stars >= MIN_TRADE_STARS &&
    stars <= MAX_TRADE_STARS
  );
}

/**
 * The best trade a hand can make, or null if it cannot make one.
 *
 * @param hand - the cards held
 * @returns the cards to hand in and what they buy
 * @remarks
 * Used by the computer and by the screen's "bestes Angebot" hint. It is a
 * subset search, which sounds worse than it is: a hand of ten cards is a
 * thousand subsets and the star total caps out at ten anyway.
 */
export function bestTrade(
  hand: readonly string[],
): { readonly cards: readonly string[]; readonly units: number } | null {
  let best: { cards: readonly string[]; units: number } | null = null;
  const total = 1 << Math.min(hand.length, MAX_SUBSET_CARDS);
  for (let mask = 1; mask < total; mask += 1) {
    const cards = hand.filter((unused, at) => (mask & (1 << at)) !== 0);
    const units = isTradable(cards) ? unitsForCards(cards) : 0;
    if (units > (best?.units ?? 0)) {
      best = { cards, units };
    }
  }
  return best;
}

/**
 * How many cards the subset search looks at.
 *
 * @remarks
 * A hand can grow past this when somebody inherits a beaten player's cards, and
 * the search would then take longer than it is worth. Sixteen is 65536 subsets,
 * which is nothing, and the cards beyond it are only ever worth less: the table
 * stops at ten stars, so five two-star cards already reach the top row.
 */
const MAX_SUBSET_CARDS = 16;
