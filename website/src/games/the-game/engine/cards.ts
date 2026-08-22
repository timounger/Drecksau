/**
 * The 98 number cards, the four rows, and the one rule that governs both.
 *
 * @module
 * @remarks
 * A card here is simply its number. Every value from 2 to 99 exists exactly
 * once, so there is nothing else about a card to know - no suit, no colour, no
 * identity beyond the number - and giving it a wrapper object would only invent
 * a distinction the game does not have.
 *
 * The four rows are two ascending and two descending, and the whole of the
 * placing rule is expressed once, in {@link gain}. See the note there: written
 * the obvious way this file would carry the same rule twice, mirrored, and the
 * backwards trick a third and fourth time.
 */

/** The lowest number card. The 1 is a row card, never in anybody's hand. */
export const LOWEST = 2;

/** The highest number card. The 100 is a row card. */
export const HIGHEST = 99;

/** Where an ascending row starts. */
export const UP_BASE = 1;

/** Where a descending row starts. */
export const DOWN_BASE = 100;

/**
 * The one step backwards the rules allow.
 *
 * @remarks
 * "Auf einen aufsteigenden Stapel darf eine Karte gelegt werden, die genau um
 * den Wert 10 kleiner ist" - and the mirror of it on a descending row. Exactly
 * ten, not up to ten, and as often per turn as you like.
 */
export const BACKWARD = 10;

/** How many number cards there are: the 98 of the box. */
export const DECK_SIZE = HIGHEST - LOWEST + 1;

/**
 * What a card in somebody else's hand looks like from outside.
 *
 * @remarks
 * Zero, which is not a card - the deck runs from 2 to 99. A hand travelling
 * over the wire keeps its length and loses its faces, and a value that could
 * never be a real card means a bug cannot quietly pass one off as one.
 */
export const HIDDEN = 0;

/** Which way a row runs. */
export type PileKind = "up" | "down";

/** One of the four rows. */
export type Pile = {
  readonly kind: PileKind;
  /**
   * The row card and every number card laid on it, oldest first.
   *
   * @remarks
   * The row card itself is the first entry, so a row is never empty and
   * {@link topOf} needs no special case for the opening move. Only the last
   * entry is ever shown: "die Zahlenkarten werden nicht nebeneinander abgelegt,
   * sondern übereinander."
   */
  readonly cards: readonly number[];
};

/** The four rows, in the order the table lays them out. */
export const PILE_KINDS: readonly PileKind[] = ["up", "up", "down", "down"];

/** How many rows there are. */
export const PILE_COUNT = PILE_KINDS.length;

/**
 * The 98 number cards, in order.
 *
 * @returns every value from 2 to 99, each once
 */
export function buildDeck(): readonly number[] {
  return Array.from({ length: DECK_SIZE }, (unused, index) => LOWEST + index);
}

/**
 * The four rows as they are laid out before anything is played.
 *
 * @returns two ascending rows on 1 and two descending rows on 100
 */
export function freshPiles(): readonly Pile[] {
  return PILE_KINDS.map((kind) => ({
    kind,
    cards: [kind === "up" ? UP_BASE : DOWN_BASE],
  }));
}

/**
 * The card you have to beat.
 *
 * @param pile - the row
 * @returns the number showing, which is the row card while the row is empty
 */
export function topOf(pile: Pile): number {
  return pile.cards[pile.cards.length - 1];
}

/**
 * How many number cards have been laid on a row.
 *
 * @param pile - the row
 * @returns the count, not counting the row card underneath
 */
export function heightOf(pile: Pile): number {
  return pile.cards.length - 1;
}

/**
 * How far a card would carry a row.
 *
 * @param pile - the row
 * @param card - the number card
 * @returns how much higher on an ascending row, how much lower on a descending
 *   one - and -10 for the backwards trick either way
 * @remarks
 * **One number for both directions**, and that is the point of it. On an
 * ascending row the useful measure is `card - top`; on a descending row it is
 * `top - card`. Measured that way both rows want the same thing - a small
 * positive number - and the backwards trick comes out as exactly `-10` on
 * either, because ten lower on an ascending row and ten higher on a descending
 * one are the same move seen from two ends.
 *
 * Every other question in this game is asked through here: whether a card may
 * be played, how expensive it is, which row wants it least. Written per
 * direction instead, each of those would be two mirrored branches - and the
 * mirror is exactly the sort of thing that gets fixed on one side only.
 */
export function gain(pile: Pile, card: number): number {
  const top = topOf(pile);
  return pile.kind === "up" ? card - top : top - card;
}

/**
 * Whether this card may go on this row.
 *
 * @param pile - the row
 * @param card - the number card
 * @returns true if it carries the row on, or is the backwards trick
 */
export function canPlace(pile: Pile, card: number): boolean {
  const step = gain(pile, card);
  return step > 0 || step === -BACKWARD;
}

/**
 * Whether playing this card here would be the backwards trick.
 *
 * @param pile - the row
 * @param card - the number card
 * @returns true for the one move that wins ground back
 */
export function isBackward(pile: Pile, card: number): boolean {
  return gain(pile, card) === -BACKWARD;
}

/**
 * What a row is called in the log and on screen.
 *
 * @param index - which of the four rows
 * @returns its name, with the direction in it
 * @remarks
 * Named rather than numbered on its own: the two ascending rows are
 * interchangeable in the rules but never in a conversation, and "die dritte"
 * means nothing across a table where nobody agrees which end to count from.
 */
export function pileLabel(index: number): string {
  const kind = PILE_KINDS[index] ?? "up";
  return `Reihe ${index + 1} ${kind === "up" ? "hoch" : "runter"}`;
}
