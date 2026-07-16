/**
 * Card types of Drecksau and the composition of the action card deck.
 *
 * @module
 */

/**
 * The seven action cards of the German 66 card base game.
 *
 * @remarks
 * See `docs/game-rules.md` for the effect of each card.
 */
export type BaseCardType =
  | "mud"
  | "rain"
  | "barn"
  | "lightning"
  | "lightningRod"
  | "farmerScrubs"
  | "barnDoor";

/**
 * The three cards the Sauschön expansion adds.
 *
 * @remarks
 * `beauty` is laid on top of a pig card and hides whatever is underneath,
 * `dustOff` is the only card that takes it away again, and `luckyBird` lets a
 * player use both of their other hand cards at once.
 */
export type ExpansionCardType = "beauty" | "dustOff" | "luckyBird";

/** Every card that can be in a deck, with or without the expansion. */
export type ActionCardType = BaseCardType | ExpansionCardType;

/** A single action card in the deck, in a hand or on a pile. */
export type Card = {
  /** Unique across the whole deck - used as identity in moves and in React. */
  readonly id: string;
  readonly type: ActionCardType;
};

/**
 * How many copies of each card the base game holds.
 *
 * @remarks
 * Sums up to {@link BASE_ACTION_CARD_COUNT} (54). Taken verbatim from the
 * Kosmos rulebook.
 */
export const BASE_DECK_COMPOSITION: Readonly<Record<BaseCardType, number>> = {
  mud: 21,
  rain: 4,
  barn: 9,
  lightning: 4,
  lightningRod: 4,
  farmerScrubs: 8,
  barnDoor: 4,
};

/**
 * How many copies of each card the Sauschön expansion adds.
 *
 * @remarks
 * Sums up to {@link EXPANSION_CARD_COUNT} (32).
 */
export const EXPANSION_DECK_COMPOSITION: Readonly<
  Record<ExpansionCardType, number>
> = {
  beauty: 16,
  dustOff: 12,
  luckyBird: 4,
};

/** Total number of action cards in the base game. */
export const BASE_ACTION_CARD_COUNT = 54;

/** Total number of cards the expansion adds. */
export const EXPANSION_CARD_COUNT = 32;

/** Number of pig cards the physical game ships with. */
export const PIG_CARD_COUNT = 12;

/**
 * Cards that are attached to a pig instead of going to the discard pile.
 *
 * @remarks
 * `beauty` belongs here too: it stays on the pig until a `dustOff` takes it
 * off. The other two expansion cards are discarded like normal actions.
 */
export const ATTACHED_CARD_TYPES: readonly ActionCardType[] = [
  "barn",
  "lightningRod",
  "barnDoor",
  "beauty",
];

/** Cards that take effect without choosing a pig. */
export const UNTARGETED_CARD_TYPES: readonly ActionCardType[] = [
  "rain",
  "luckyBird",
];

/**
 * Builds the full, unshuffled action card deck.
 *
 * @param withExpansion - true to mix in the Sauschön cards
 * @returns all cards of the deck, with unique ids
 * @example
 * ```ts
 * createDeck(true).length; // 86
 * ```
 */
export function createDeck(withExpansion: boolean): Card[] {
  const composition: Record<string, number> = withExpansion
    ? { ...BASE_DECK_COMPOSITION, ...EXPANSION_DECK_COMPOSITION }
    : { ...BASE_DECK_COMPOSITION };

  const cards: Card[] = [];
  for (const [type, count] of Object.entries(composition)) {
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
 * @returns true for stall, lightning rod, barn door and Schönsau
 */
export function isAttachedCard(type: ActionCardType): boolean {
  return ATTACHED_CARD_TYPES.includes(type);
}

/**
 * Tells whether a card type belongs to the expansion.
 *
 * @param type - the card type to check
 * @returns true for Schönsau, Aus-dem-Staub and Glücksvogel
 */
export function isExpansionCard(type: ActionCardType): boolean {
  return type in EXPANSION_DECK_COMPOSITION;
}
