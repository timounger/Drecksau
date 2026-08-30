/**
 * The Skat pack this game is played with, and what beats what.
 *
 * @module
 * @remarks
 * Thirty-two French-suited cards. The order is the one the rules name first for
 * a Skat pack: **7-8-9-Bube-Dame-Koenig-10-Ass**, so the Zehn sits between the
 * Koenig and the Ass rather than down among the numbers - the same oddity Skat
 * itself has, and the reason strength is its own scale here rather than
 * something read off the card.
 *
 * Suit never beats anything. It is on the card so a player can tell two Damen
 * apart, and for nothing else: "wer den hoechsten Wert ausgespielt hat, wenn
 * alle anderen Spieler gepasst haben, gewinnt den Stich."
 */

/** The four French suits of a Skat pack. */
export type Suit = "kreuz" | "pik" | "herz" | "karo";

/** The eight ranks of a Skat pack. */
export type Rank =
  "sieben" | "acht" | "neun" | "bube" | "dame" | "koenig" | "zehn" | "ass";

/** All suits, in the order a fresh pack lies in. */
export const SUITS: readonly Suit[] = ["kreuz", "pik", "herz", "karo"];

/** All ranks, lowest first - which is also the order they beat each other in. */
export const RANKS: readonly Rank[] = [
  "sieben",
  "acht",
  "neun",
  "bube",
  "dame",
  "koenig",
  "zehn",
  "ass",
];

/** How many cards a full pack holds. */
export const DECK_SIZE = SUITS.length * RANKS.length;

/** One card of the pack. No two cards share an id. */
export type Card = {
  readonly id: string;
  readonly suit: Suit;
  readonly rank: Rank;
};

/**
 * How strong a rank is, low to high.
 *
 * @param rank - the rank
 * @returns its place in the order, 0 for the Sieben and 7 for the Ass
 */
export function strengthOf(rank: Rank): number {
  return RANKS.indexOf(rank);
}

/**
 * Whether one rank beats another.
 *
 * @param rank - the rank being played
 * @param over - the rank lying on the table
 * @returns true if it may be played on top
 */
export function beats(rank: Rank, over: Rank): boolean {
  return strengthOf(rank) > strengthOf(over);
}

/**
 * A fresh pack, in order.
 *
 * @returns all thirty-two cards
 */
export function createDeck(): readonly Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${suit}-${rank}`, suit, rank });
    }
  }
  return deck;
}

/**
 * One card by its id.
 *
 * @param id - the card id
 * @returns the card, or null if no card has that id
 */
export function cardById(id: string): Card | null {
  return createDeck().find((card) => card.id === id) ?? null;
}

/**
 * Sorts a hand the way a player holds it: weakest first.
 *
 * @param hand - the cards
 * @returns the same cards, ordered by strength and then by suit
 */
export function sortHand(hand: readonly Card[]): readonly Card[] {
  return [...hand].sort(
    (left, right) =>
      strengthOf(left.rank) - strengthOf(right.rank) ||
      SUITS.indexOf(left.suit) - SUITS.indexOf(right.suit),
  );
}
