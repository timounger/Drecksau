/**
 * What is in the deck, and what each card is.
 *
 * @module
 * @remarks
 * Ninety cards: 56 cow parts, 7 calves, 27 action cards. Those three totals and
 * the split of the cow parts into 17 heads, 22 middles and 17 rears come from
 * the rulebook.
 *
 * What the rulebook does **not** give is how those cards divide up further - it
 * says the breakdown is printed on the bottom of the box, which did not come
 * with the PDF. So {@link BREED_SPLIT} and {@link ACTION_SPLIT} below are this
 * implementation's choice. They are the only invented numbers in the game, they
 * sit here together, and each is one line to change.
 */

/** The three breeds a cow can be. */
export type Breed = "longhorn" | "holstein" | "hochland";

/** The breeds, in the order they are shown. */
export const BREEDS: readonly Breed[] = ["longhorn", "holstein", "hochland"];

/** Which piece of a cow a card is. */
export type Part = "head" | "middle" | "rear";

/** The parts, front to back - which is also the order they are laid out in. */
export const PARTS: readonly Part[] = ["head", "middle", "rear"];

/** What an action card does. */
export type Action =
  /** Feed: discard this to slot one middle from hand into a cow of yours. */
  | "feed"
  /** Kuhliebe: lay a cow out of two breeds. */
  | "cross2"
  /** Verrückter Professor / Franken-Kuh: lay a cow out of three breeds. */
  | "cross3"
  /** Viehdieb: take one whole cow from somebody. */
  | "rustler"
  /** Kuhschubser: strip every middle out of one cow. */
  | "shove"
  /** Mistgabel: take one middle out of one cow. */
  | "pitchfork"
  /** Kälberklau: take one calf. */
  | "calfNap"
  /** Herdenhund: turn one attack away. */
  | "dog"
  /** Brandeisen: protect one of your cows for good. */
  | "brand"
  /** Stall: the same, and the one thing that lifts a Brandeisen. */
  | "barn"
  /** Lasso: take one card out of somebody's hand, unseen. */
  | "lasso"
  /** Du bist noch mal dran. */
  | "again";

/** A card, as it sits in a hand, a pile or a herd. */
export type Card =
  /** A piece of a cow. A null breed is a joker - it fits anywhere. */
  | {
      readonly id: string;
      readonly kind: "cow";
      readonly part: Part;
      readonly breed: Breed | null;
    }
  | { readonly id: string; readonly kind: "calf" }
  | { readonly id: string; readonly kind: "action"; readonly action: Action }
  /**
   * A card this client is not allowed to see.
   *
   * @remarks
   * Online the host blanks every hand but your own and the whole draw pile, and
   * this is what is left: a card back with a name, so the screen can show how
   * many somebody holds without showing what. It never exists offline, and no
   * move may name one - the referee looks cards up by id in the **real** state,
   * which has no hidden cards in it at all.
   */
  | { readonly id: string; readonly kind: "hidden" };

/** A face-down stand-in, numbered so React can tell two of them apart. */
export function hiddenCard(at: number): Card {
  return { id: `hidden-${at}`, kind: "hidden" };
}

/** Cards in a full deck, from the rulebook. */
export const DECK_SIZE = 90;

/** Cow parts in a full deck, by part - from the rulebook. */
export const PART_COUNTS: Readonly<Record<Part, number>> = {
  head: 17,
  middle: 22,
  rear: 17,
};

/** Calves in a full deck - from the rulebook. */
export const CALF_COUNT = 7;

/** Action cards in a full deck - from the rulebook. */
export const ACTION_COUNT = 27;

/**
 * How the cow parts divide between the three breeds and the jokers.
 *
 * @remarks
 * Invented - see the module note. Each row adds up to its {@link PART_COUNTS}
 * total. Jokers are rarer than any single breed, because a card that fits
 * everywhere would flatten the game if it were common: the whole tension is
 * holding a Holstein head and waiting for a Holstein rear.
 */
const BREED_SPLIT: Readonly<
  Record<Part, { readonly perBreed: number; readonly jokers: number }>
> = {
  head: { perBreed: 5, jokers: 2 },
  middle: { perBreed: 6, jokers: 4 },
  rear: { perBreed: 5, jokers: 2 },
};

/**
 * How many of each action card the deck holds.
 *
 * @remarks
 * Invented - see the module note. Adds up to {@link ACTION_COUNT}. Weighted so
 * that building is the main thing and wrecking is the seasoning: feed and
 * crossing together outnumber the attacks, and the two protections are one
 * apiece because a pair of them would make the leader untouchable.
 */
const ACTION_SPLIT: Readonly<Record<Action, number>> = {
  feed: 6,
  cross2: 3,
  cross3: 2,
  shove: 4,
  rustler: 2,
  pitchfork: 2,
  calfNap: 1,
  dog: 3,
  brand: 1,
  barn: 1,
  lasso: 1,
  again: 1,
};

/** German names of the actions, for the cards and the log. */
export const ACTION_NAMES: Readonly<Record<Action, string>> = {
  feed: "Futter",
  cross2: "Kuhliebe",
  cross3: "Verrückter Professor",
  rustler: "Viehdieb",
  shove: "Kuhschubser",
  pitchfork: "Mistgabel",
  calfNap: "Kälberklau",
  dog: "Herdenhund",
  brand: "Brandeisen",
  barn: "Stall",
  lasso: "Lasso",
  again: "Nochmal dran",
};

/** What each action card says on it. */
export const ACTION_TEXTS: Readonly<Record<Action, string>> = {
  feed: "Bau ein Mittelteil in eine eigene Kuh ein",
  cross2: "Leg eine Kuh aus zwei Rassen aus",
  cross3: "Leg eine Kuh aus drei Rassen aus",
  rustler: "Stiehl eine komplette Kuh",
  shove: "Entferne alle Mittelteile einer Kuh",
  pitchfork: "Entferne ein Mittelteil einer Kuh",
  calfNap: "Entferne ein Kalb",
  dog: "Wehre eine Angriffskarte ab",
  brand: "Beschütze eine Kuh (nur mit Stall entfernbar)",
  barn: "Beschütze eine Kuh (nur mit Brandeisen entfernbar)",
  lasso: "Stiehl eine Handkarte von einem Mitspieler",
  again: "Du bist noch mal dran",
};

/** German names of the breeds. */
export const BREED_NAMES: Readonly<Record<Breed, string>> = {
  longhorn: "Longhorn",
  holstein: "Holstein",
  hochland: "Hochland",
};

/** German names of the parts. */
export const PART_NAMES: Readonly<Record<Part, string>> = {
  head: "Kopf",
  middle: "Mittelteil",
  rear: "Hinterteil",
};

/** The colour each breed is drawn in. */
export const BREED_INK: Readonly<Record<Breed, string>> = {
  longhorn: "#b45309",
  holstein: "#334155",
  hochland: "#92400e",
};

/** The colour a joker is drawn in - deliberately none of the breeds'. */
export const JOKER_INK = "#7c3aed";

/** Which actions are attacks, and so can be turned away by a Herdenhund. */
const ATTACKS: readonly Action[] = ["rustler", "shove", "pitchfork", "calfNap"];

/**
 * Whether this action attacks somebody else's herd.
 *
 * @param action - the action
 * @returns true for the red cards
 * @remarks
 * The Herdenhund turns exactly these away and nothing else. A special card -
 * the Lasso, say - goes through it, which the rulebook calls out in a box of
 * its own.
 */
export function isAttack(action: Action): boolean {
  return ATTACKS.includes(action);
}

/** Whether this action is one of the two protections. */
export function isGuard(action: Action): boolean {
  return action === "brand" || action === "barn";
}

/**
 * The one protection that lifts another.
 *
 * @param guard - the protection lying on a cow
 * @returns the action that removes it
 * @remarks
 * "Eine Schutzkarte kann jeweils nur durch die andere Schutzkarte entfernt
 * werden." So they unlock each other and nothing else does.
 */
export function guardBreaker(guard: Action): Action {
  return guard === "brand" ? "barn" : "brand";
}

/**
 * Builds a full deck, unshuffled.
 *
 * @returns the ninety cards, each with an id of its own
 * @remarks
 * Ids are handed out here rather than generated later, so a card keeps the same
 * name from the deck through a hand, a herd and the discard pile. Online that
 * matters: a move names the card it means, and both ends must agree what that
 * name refers to.
 */
export function buildDeck(): readonly Card[] {
  const cards: Card[] = [];
  for (const part of PARTS) {
    const split = BREED_SPLIT[part];
    for (const breed of BREEDS) {
      for (let n = 0; n < split.perBreed; n++) {
        cards.push({ id: `${part}-${breed}-${n}`, kind: "cow", part, breed });
      }
    }
    for (let n = 0; n < split.jokers; n++) {
      cards.push({ id: `${part}-joker-${n}`, kind: "cow", part, breed: null });
    }
  }
  for (let n = 0; n < CALF_COUNT; n++) {
    cards.push({ id: `calf-${n}`, kind: "calf" });
  }
  for (const action of Object.keys(ACTION_SPLIT) as Action[]) {
    for (let n = 0; n < ACTION_SPLIT[action]; n++) {
      cards.push({ id: `${action}-${n}`, kind: "action", action });
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
  } else if (card.kind === "calf") {
    name = "Kalb";
  } else if (card.kind === "action") {
    name = ACTION_NAMES[card.action];
  } else {
    const breed = card.breed === null ? "Joker" : BREED_NAMES[card.breed];
    name = `${breed}-${PART_NAMES[card.part]}`;
  }
  return name;
}
