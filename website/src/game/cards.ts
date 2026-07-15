/**
 * Card types of Drecksau and the composition of the action card deck.
 *
 * @module
 */

/**
 * The seven action cards of the German 66 card edition.
 *
 * @remarks
 * See `docs/game-rules.md` for the effect of each card.
 */
export type ActionCardType =
  | "mud"
  | "rain"
  | "barn"
  | "lightning"
  | "lightningRod"
  | "farmerScrubs"
  | "barnDoor";

/** A single action card in the deck, in a hand or on a pile. */
export type Card = {
  /** Unique across the whole deck - used as identity in moves and in React. */
  readonly id: string;
  readonly type: ActionCardType;
};

/**
 * How many copies of each action card the deck holds.
 *
 * @remarks
 * Sums up to {@link ACTION_CARD_COUNT} (54). Taken verbatim from the Kosmos
 * rulebook.
 */
export const DECK_COMPOSITION: Readonly<Record<ActionCardType, number>> = {
  mud: 21,
  rain: 4,
  barn: 9,
  lightning: 4,
  lightningRod: 4,
  farmerScrubs: 8,
  barnDoor: 4,
};

/** Total number of action cards in the deck. */
export const ACTION_CARD_COUNT = 54;

/** Number of pig cards the physical game ships with. */
export const PIG_CARD_COUNT = 12;

/**
 * Cards that are attached to an own pig instead of going to the discard pile.
 */
export const ATTACHED_CARD_TYPES: readonly ActionCardType[] = [
  "barn",
  "lightningRod",
  "barnDoor",
];

/**
 * Builds the full, unshuffled action card deck.
 *
 * @returns all 54 action cards, grouped by type and with unique ids
 */
export function createDeck(): Card[] {
  const cards: Card[] = [];
  for (const [type, count] of Object.entries(DECK_COMPOSITION)) {
    for (let index = 0; index < count; index++) {
      cards.push({ id: `${type}-${index}`, type: type as ActionCardType });
    }
  }
  return cards;
}

/**
 * Tells whether a card is attached to a pig rather than discarded after use.
 *
 * @param type - the card type to check
 * @returns true for stall, lightning rod and barn door
 */
export function isAttachedCard(type: ActionCardType): boolean {
  return ATTACHED_CARD_TYPES.includes(type);
}
