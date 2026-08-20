/**
 * What is in the deck, and what each card is.
 *
 * @module
 * @remarks
 * Ninety-four cards, and every number here comes from the rulebook. The deck is
 * the joke of the whole game: **there are as many copies of a number as the
 * number is worth**. Twelve twelves, one one - so the card you most want is the
 * card you are most likely to draw again, and drawing it twice is the end of
 * your round. Nothing else in Flip 7 needs explaining once that is clear.
 *
 * The zero is the exception that proves it: one copy, worth nothing, and still a
 * number card - so it can bust you and it counts towards the seven.
 */

/** What a card does. */
export type CardKind =
  /** A plain number, 0 to 12. */
  | "number"
  /** Adds to the sum of the number cards. */
  | "plus"
  /** Doubles the sum of the number cards. */
  | "times"
  /** Einfrieren - whoever gets it banks and is out. */
  | "freeze"
  /** Dreimal - whoever gets it must take the next three cards. */
  | "flip3"
  /** Zweite Chance - saves you from one duplicate. */
  | "second";

/** A card, in the deck, in the discard, or lying in front of somebody. */
export type Card = {
  readonly id: string;
  readonly kind: CardKind;
  /** The number on it, or the amount it adds - unused by the rest. */
  readonly value: number;
};

/** Cards in a full deck - from the rulebook. */
export const DECK_SIZE = 94;

/** The highest number card, and so the most common one. */
export const HIGHEST = 12;

/** Number cards a player needs for the bonus - from the rulebook. */
export const FLIP_SEVEN = 7;

/** What the bonus is worth - from the rulebook. */
export const FLIP_BONUS = 15;

/** Cards a Dreimal forces on its victim - from the rulebook. */
export const FLIP_THREE = 3;

/** How many of each action card the deck holds - from the rulebook. */
export const ACTION_COUNT = 3;

/** How many plus cards there are - from the rulebook. */
const PLUS_COUNT = 5;

/** The step between them: +2, +4, and so on up to +10. */
const PLUS_STEP = 2;

/** The amounts the plus cards add, one card each - from the rulebook. */
export const PLUS_VALUES: readonly number[] = Array.from(
  { length: PLUS_COUNT },
  (unused, index) => (index + 1) * PLUS_STEP,
);

/** What the x2 card multiplies by. */
export const TIMES_FACTOR = 2;

/** What each card is called. */
export const CARD_NAMES: Readonly<Record<CardKind, string>> = {
  number: "Zahl",
  plus: "Bonus",
  times: "Verdoppler",
  freeze: "Einfrieren",
  flip3: "Dreimal",
  second: "Zweite Chance",
};

/** What each card says on it. */
export const CARD_TEXTS: Readonly<Record<CardKind, string>> = {
  number: "Zahlenkarte. Zweimal dieselbe, und du bist raus.",
  plus: "Wird am Ende zur Summe deiner Zahlen addiert.",
  times: "Verdoppelt die Summe deiner Zahlen.",
  freeze: "Wer sie bekommt, sichert seine Punkte und ist aus der Runde.",
  flip3: "Wer sie bekommt, muss die nächsten drei Karten nehmen.",
  second: "Rettet dich einmal vor einer doppelten Zahl.",
};

/**
 * The colour each card is drawn in, light theme and dark.
 *
 * @remarks
 * Two classes rather than one colour, because a fixed value cannot know which
 * theme it landed in. These used to be hex codes handed to an inline `style`,
 * and a dark slate number on a dark card was simply not there.
 */
export const CARD_INK: Readonly<Record<CardKind, string>> = {
  number: "text-zinc-800 dark:text-zinc-100",
  plus: "text-green-700 dark:text-green-300",
  times: "text-amber-700 dark:text-amber-300",
  freeze: "text-sky-700 dark:text-sky-300",
  flip3: "text-orange-700 dark:text-orange-300",
  second: "text-violet-700 dark:text-violet-300",
};

/** The icon each card wears. */
export const CARD_ICONS: Readonly<Record<CardKind, string>> = {
  number: "",
  plus: "\u{2795}",
  times: "\u{2716}\u{FE0F}",
  freeze: "\u{2744}\u{FE0F}",
  flip3: "\u{1F501}",
  second: "\u{1F6DF}",
};

/** Whether this card can end a round by being a duplicate. */
export function isNumber(card: Card): boolean {
  return card.kind === "number";
}

/** Whether this card is played on somebody. */
export function isAction(card: Card): boolean {
  return (
    card.kind === "freeze" || card.kind === "flip3" || card.kind === "second"
  );
}

/** Whether this card only ever changes the score. */
export function isModifier(card: Card): boolean {
  return card.kind === "plus" || card.kind === "times";
}

/**
 * Builds a full deck, unshuffled.
 *
 * @returns the ninety-four cards, each with an id of its own
 * @remarks
 * The loop is the rule: `count` runs from the value itself, so a twelve is dealt
 * twelve times and a one once. The zero has to be written out separately - it is
 * the only number whose count is not its value, because a count of zero would
 * leave it out of a deck that is supposed to contain it.
 */
export function buildDeck(): readonly Card[] {
  const cards: Card[] = [];
  cards.push({ id: "n0-0", kind: "number", value: 0 });
  for (let value = 1; value <= HIGHEST; value++) {
    for (let n = 0; n < value; n++) {
      cards.push({ id: `n${value}-${n}`, kind: "number", value });
    }
  }
  for (const value of PLUS_VALUES) {
    cards.push({ id: `plus${value}`, kind: "plus", value });
  }
  cards.push({ id: "times2", kind: "times", value: TIMES_FACTOR });
  for (const kind of ["freeze", "flip3", "second"] as const) {
    for (let n = 0; n < ACTION_COUNT; n++) {
      cards.push({ id: `${kind}-${n}`, kind, value: 0 });
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
  if (card.kind === "number") {
    name = `die ${card.value}`;
  } else if (card.kind === "plus") {
    name = `+${card.value}`;
  } else if (card.kind === "times") {
    name = `x${card.value}`;
  } else {
    name = CARD_NAMES[card.kind];
  }
  return name;
}

/** The short text printed on a card. */
export function cardFace(card: Card): string {
  let text: string;
  if (card.kind === "number") {
    text = String(card.value);
  } else if (card.kind === "plus") {
    text = `+${card.value}`;
  } else if (card.kind === "times") {
    text = `x${card.value}`;
  } else {
    text = CARD_NAMES[card.kind];
  }
  return text;
}
