/**
 * What is in the deck, and what each card is.
 *
 * @module
 * @remarks
 * Fifty-six cards: 44 number cards and 12 action cards. Both totals come from
 * the rulebook, as do the five kinds of action card and the fact that the deck
 * holds four of every number.
 *
 * Two numbers are **not** in the rulebook and are this implementation's choice:
 * which numbers there are, and how the twelve action cards split between the
 * five kinds. 44 divides into 11 sorts of 4, and the highest card shown in the
 * booklet is an 11, so {@link VALUES} runs 1 to 11. {@link ACTION_SPLIT} is the
 * other one. They sit here together and each is one line to change.
 */

/** What an action card does. */
export type ActionKind =
  /** Dein Problem! - the last number card stands, and it is the next player's. */
  | "problem"
  /** Richtungswechsel! - the table turns round. */
  | "reverse"
  /** Aussetzen! - the next player misses their turn. */
  | "skip"
  /** Weg damit! - the pot leaves the game and you start again. */
  | "burn"
  /** Neustart! - the next player starts free, but the pot stays. */
  | "restart";

/** A card, in a hand, on the table, in a pile or in the pot. */
export type Card =
  | { readonly id: string; readonly kind: "number"; readonly value: number }
  | {
      readonly id: string;
      readonly kind: "action";
      readonly action: ActionKind;
    }
  /**
   * A card this client is not allowed to see.
   *
   * @remarks
   * Online the host blanks the draw pile, every hand but your own, and **every**
   * face-down table card - your own included, because the whole point of them is
   * that nobody knows what they are, least of all their owner. This is what is
   * left: a card back that can be counted but not read. It never exists offline,
   * and no move may name one - the referee looks cards up by id in the real
   * state, which has no hidden card in it at all.
   */
  | { readonly id: string; readonly kind: "hidden" };

/** Cards in a full deck - from the rulebook. */
export const DECK_SIZE = 56;

/** Number cards in a full deck - from the rulebook. */
export const NUMBER_COUNT = 44;

/** Action cards in a full deck - from the rulebook. */
export const ACTION_COUNT = 12;

/** Copies of every number in a full deck - from the rulebook. */
export const COPIES = 4;

/**
 * Copies of every number at a two-handed table.
 *
 * @remarks
 * "Von jeder Zahlenkarte eine aus dem Spiel nehmen" - and with it the quartet
 * shrinks to a triplet, which is why this number is the one both rules read.
 */
export const TWO_PLAYER_COPIES = 3;

/** The lowest number in the deck. */
export const LOWEST_VALUE = 1;

/**
 * The highest number in the deck.
 *
 * @remarks
 * Invented, within what the rulebook fixes - see the module note. Eleven sorts
 * of four make the 44 number cards it counts, and 2, 3, 4, 5, 7, 9 and 11 all
 * appear in its text and its pictures.
 */
export const HIGHEST_VALUE = 11;

/** The numbers on the cards, lowest first. */
export const VALUES: readonly number[] = Array.from(
  { length: HIGHEST_VALUE - LOWEST_VALUE + 1 },
  (unused, index) => LOWEST_VALUE + index,
);

/** The card that turns the table around - "Die 5, runter geht's!". */
export const TURNING_VALUE = 5;

/**
 * How many of each action card the deck holds.
 *
 * @remarks
 * Invented - see the module note. Adds up to {@link ACTION_COUNT}. Weighted by
 * what each one costs the table: "Dein Problem!" and "Neustart!" only move the
 * problem along, so they are the common ones, while "Weg damit!" makes a whole
 * pot disappear and is worth waiting for.
 */
const ACTION_SPLIT: Readonly<Record<ActionKind, number>> = {
  problem: 3,
  reverse: 2,
  skip: 2,
  burn: 2,
  restart: 3,
};

/**
 * The action cards a two-handed deck does without.
 *
 * @remarks
 * "Nehmt einfach alle Richtungswechsel- und Aussetzen-Karten aus dem Spiel" -
 * and rightly so: with two players one turns nothing round and the other hands
 * you your own turn back.
 */
const TWO_PLAYER_DROPS: readonly ActionKind[] = ["reverse", "skip"];

/** The action cards, in the order the rules introduce them. */
export const ACTIONS: readonly ActionKind[] = [
  "problem",
  "reverse",
  "skip",
  "burn",
  "restart",
];

/** What each action card is called. */
export const ACTION_NAMES: Readonly<Record<ActionKind, string>> = {
  problem: "Dein Problem!",
  reverse: "Richtungswechsel!",
  skip: "Aussetzen!",
  burn: "Weg damit!",
  restart: "Neustart!",
};

/**
 * The short form printed on the card itself.
 *
 * @remarks
 * A card is a nine-millimetre-wide box on a phone and "Richtungswechsel!" set
 * across four hyphenated lines is not read, only recognised. The full name is
 * one hover or one line of the log away.
 */
export const ACTION_SHORT: Readonly<Record<ActionKind, string>> = {
  problem: "Problem",
  reverse: "Richtung",
  skip: "Aussetzen",
  burn: "Weg damit",
  restart: "Neustart",
};

/** What each action card says on it. */
export const ACTION_TEXTS: Readonly<Record<ActionKind, string>> = {
  problem: "Die zuletzt gespielte Zahlenkarte gilt für den nächsten Spieler.",
  reverse: "Die Spielrichtung dreht sich um.",
  skip: "Der nächste Mitspieler wird übersprungen.",
  burn: "Der ganze Pot geht aus dem Spiel. Du beginnst neu.",
  restart: "Der nächste Spieler beginnt neu - der Pot bleibt liegen.",
};

/** The colour each action card is drawn in. */
export const ACTION_INK: Readonly<Record<ActionKind, string>> = {
  problem: "#b45309",
  reverse: "#0f766e",
  skip: "#7c3aed",
  burn: "#be123c",
  restart: "#1d4ed8",
};

/** A face-down stand-in, numbered so React can tell two of them apart. */
export function hiddenCard(at: number): Card {
  return { id: `hidden-${at}`, kind: "hidden" };
}

/**
 * Builds a deck, unshuffled.
 *
 * @param copies - how many of each number to include
 * @param withTurnCards - false leaves out Richtungswechsel and Aussetzen
 * @returns the cards, each with an id of its own
 * @remarks
 * Ids are handed out here rather than generated later, so a card keeps the same
 * name from the deck through a hand, the pot and back into somebody's hand.
 * Online that matters: a move names the cards it means, and both ends have to
 * agree what those names refer to.
 */
export function buildDeck(
  copies: number,
  withTurnCards: boolean,
): readonly Card[] {
  const cards: Card[] = [];
  for (const value of VALUES) {
    for (let n = 0; n < copies; n++) {
      cards.push({ id: `n${value}-${n}`, kind: "number", value });
    }
  }
  for (const action of ACTIONS) {
    if (withTurnCards || !TWO_PLAYER_DROPS.includes(action)) {
      for (let n = 0; n < ACTION_SPLIT[action]; n++) {
        cards.push({ id: `${action}-${n}`, kind: "action", action });
      }
    }
  }
  return cards;
}

/**
 * What a card is called.
 *
 * @param card - the card
 * @returns its name, for the log and for a screen reader
 */
export function cardName(card: Card): string {
  let name: string;
  if (card.kind === "hidden") {
    name = "verdeckte Karte";
  } else if (card.kind === "action") {
    name = ACTION_NAMES[card.action];
  } else {
    name = `die ${card.value}`;
  }
  return name;
}
