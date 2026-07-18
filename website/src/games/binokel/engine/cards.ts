/**
 * The Binokel deck: suits, ranks, point values and trick strength.
 *
 * @module
 * @remarks
 * A double German-suited pack: every card exists twice. Ranks high to low are
 * Daus, Zehn, Koenig, Ober, Unter, Sieben - note the Zehn is the second highest,
 * not somewhere in the middle. See `docs/games/binokel/game-rules.md`.
 */

/** The four German suits (Blatt is also called Schippen/Laub/Gruen). */
export type Suit = "eichel" | "blatt" | "herz" | "schellen";

/** The card ranks. */
export type Rank = "daus" | "zehn" | "koenig" | "ober" | "unter" | "sieben";

/** All suits, in a fixed order. */
export const SUITS: readonly Suit[] = ["eichel", "blatt", "herz", "schellen"];

/** All ranks, highest first. */
export const RANKS: readonly Rank[] = [
  "daus",
  "zehn",
  "koenig",
  "ober",
  "unter",
  "sieben",
];

/** Point value (Augen) of each rank when won in a trick. */
export const CARD_VALUES: Readonly<Record<Rank, number>> = {
  daus: 11,
  zehn: 10,
  koenig: 4,
  ober: 3,
  unter: 2,
  sieben: 0,
};

/**
 * Trick strength of each rank, higher beats lower.
 *
 * @remarks
 * Not the same as the point value: the Zehn (10 points) beats the Koenig
 * (4 points), so strength is its own scale.
 */
export const RANK_STRENGTH: Readonly<Record<Rank, number>> = {
  sieben: 0,
  unter: 1,
  ober: 2,
  koenig: 3,
  zehn: 4,
  daus: 5,
};

/** How many copies of each card the double pack holds. */
export const COPIES_PER_CARD = 2;

/** One card. Two cards can share suit and rank but never an id. */
export type Card = {
  readonly id: string;
  readonly suit: Suit;
  readonly rank: Rank;
};

/**
 * Builds a fresh, ordered Binokel deck.
 *
 * @param withSevens - true for the 48-card deck, false for 40 cards
 * @returns every card of the pack, twice each
 */
export function createDeck(withSevens: boolean): Card[] {
  const ranks = withSevens ? RANKS : RANKS.filter((rank) => rank !== "sieben");
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of ranks) {
      for (let copy = 0; copy < COPIES_PER_CARD; copy++) {
        deck.push({ id: `${suit}-${rank}-${copy}`, suit, rank });
      }
    }
  }
  return deck;
}

/**
 * Point value of a card.
 *
 * @param card - the card
 * @returns its Augen
 */
export function cardValue(card: Card): number {
  return CARD_VALUES[card.rank];
}

/**
 * Trick strength of a card within its suit.
 *
 * @param card - the card
 * @returns the strength, higher beats lower
 */
export function cardStrength(card: Card): number {
  return RANK_STRENGTH[card.rank];
}
