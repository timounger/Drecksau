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

/**
 * The two extra cards of the "Drecksau total" edition.
 *
 * @remarks
 * Both are defence cards that trigger automatically - see `docs/game-rules.md`.
 * `extraMud` shields a Drecksau, `lipstick` shields a Schönsau.
 */
export type DefenseCardType = "extraMud" | "lipstick";

/** Every card that can be in a deck. */
export type ActionCardType = BaseCardType | ExpansionCardType | DefenseCardType;

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

/**
 * How many copies of each defence card "Drecksau total" adds.
 *
 * @remarks
 * `extraMud` belongs to the base half and protects a Drecksau; `lipstick`
 * belongs to the Sauschön half and protects a Schönsau. That split decides
 * when each one joins the deck - see {@link createDeck}.
 */
export const DEFENSE_DECK_COMPOSITION: Readonly<
  Record<DefenseCardType, number>
> = {
  extraMud: 2,
  lipstick: 2,
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
 * Cards that cannot be played actively - they only defend automatically.
 *
 * @remarks
 * On your own turn these can only be discarded. They spend themselves when an
 * attack hits one of your pigs - see the engine.
 */
export const DEFENSE_CARD_TYPES: readonly ActionCardType[] = [
  "extraMud",
  "lipstick",
];

/**
 * Builds the full, unshuffled action card deck.
 *
 * @param withExpansion - true to mix in the Sauschön cards
 * @param withDefense - true to add the "Drecksau total" defence cards
 * @returns all cards of the deck, with unique ids
 * @remarks
 * The lipstick only defends a Schönsau, so it joins only when the expansion is
 * in as well - otherwise it could never do anything and would just clog hands.
 * @example
 * ```ts
 * createDeck(true, true).length; // 90
 * ```
 */
export function createDeck(
  withExpansion: boolean,
  withDefense = false,
): Card[] {
  const composition: Record<string, number> = { ...BASE_DECK_COMPOSITION };
  if (withExpansion) {
    Object.assign(composition, EXPANSION_DECK_COMPOSITION);
  }
  if (withDefense) {
    composition.extraMud = DEFENSE_DECK_COMPOSITION.extraMud;
    if (withExpansion) {
      composition.lipstick = DEFENSE_DECK_COMPOSITION.lipstick;
    }
  }

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

/**
 * Tells whether a card only ever defends, never gets actively played.
 *
 * @param type - the card type to check
 * @returns true for Extra-Matsch and Lippenstift
 */
export function isDefenseCard(type: ActionCardType): boolean {
  return DEFENSE_CARD_TYPES.includes(type);
}
