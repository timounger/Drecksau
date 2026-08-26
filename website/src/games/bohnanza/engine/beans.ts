/**
 * The eight bean sorts, their Bohnometer, and the deck they make up.
 *
 * @module
 * @remarks
 * Every number here is read off the cards printed in the rulebook. The one that
 * matters most is also the joke of the whole game: **the big number on a card
 * is how often it is in the deck**, and the commoner a bean is, the more of it
 * a harvest needs before it is worth a single Taler. Twenty Blaue Bohnen exist
 * and four of them buy one coin; six Gartenbohnen exist and two of them do.
 *
 * The Bohnometer is stored as the thresholds themselves - "one coin from two
 * cards, two from three" - rather than as a table of counts. That is the shape
 * the card is printed in, it is shorter than the alternative, and it answers
 * both questions the game asks of it: what a field is worth now, and how many
 * cards it still needs to be worth more.
 */

/** One of the eight sorts. */
export type Bean =
  "garten" | "rot" | "augen" | "soja" | "brech" | "sau" | "feuer" | "blau";

/** A single bean card. */
export type Card = {
  /** Unique in the deck, so React and the trade offers can name one card. */
  readonly id: string;
  readonly bean: Bean;
};

/** What one sort is. */
export type BeanInfo = {
  /** German name, as printed on the card. */
  readonly name: string;
  /** How many of them are in the deck - the big number on the card. */
  readonly count: number;
  /**
   * The Bohnometer: cards needed for 1, 2, 3 and 4 Taler.
   *
   * @remarks
   * Ascending, and as long as the card has entries - the Gartenbohne stops
   * after two, because two Taler is all it ever pays.
   */
  readonly meter: readonly number[];
};

/**
 * The sorts, from rarest to commonest.
 *
 * @remarks
 * That order is the order they are printed in the rulebook, and it is the one
 * worth keeping: read down the table and the whole economy of the game is
 * there, one sort per line.
 */
export const BEANS: readonly Bean[] = [
  "garten",
  "rot",
  "augen",
  "soja",
  "brech",
  "sau",
  "feuer",
  "blau",
];

/* eslint-disable @typescript-eslint/no-magic-numbers -- the Bohnometer is
   printed on the cards as a row of coins with a number under each; it is data
   read off the box, not arithmetic. */

/** Everything about each sort. */
export const BEAN_INFO: Readonly<Record<Bean, BeanInfo>> = {
  garten: { name: "Gartenbohne", count: 6, meter: [2, 3] },
  rot: { name: "Rote Bohne", count: 8, meter: [2, 3, 4, 5] },
  augen: { name: "Augenbohne", count: 10, meter: [2, 4, 5, 6] },
  soja: { name: "Sojabohne", count: 12, meter: [2, 4, 6, 7] },
  brech: { name: "Brechbohne", count: 14, meter: [3, 5, 6, 7] },
  sau: { name: "Saubohne", count: 16, meter: [3, 5, 7, 8] },
  feuer: { name: "Feuerbohne", count: 18, meter: [3, 6, 8, 9] },
  blau: { name: "Blaue Bohne", count: 20, meter: [4, 6, 8, 10] },
};

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Cards in a full deck - and the sum of the eight counts above. */
export const DECK_SIZE = 104;

/**
 * The colour each sort is drawn in, light theme and dark.
 *
 * @remarks
 * Two classes rather than one colour, for the same reason as everywhere else in
 * the collection: a fixed value cannot know which theme it landed in. Eight
 * hues that stay apart from each other matter more here than matching the
 * printed artwork - a player reads a field by its colour before they read the
 * name on it.
 */
export const BEAN_STYLE: Readonly<Record<Bean, string>> = {
  garten:
    "bg-lime-100 text-lime-900 border-lime-300 dark:bg-lime-950/60 dark:text-lime-100 dark:border-lime-800",
  rot: "bg-red-100 text-red-900 border-red-300 dark:bg-red-950/60 dark:text-red-100 dark:border-red-800",
  augen:
    "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 dark:bg-fuchsia-950/60 dark:text-fuchsia-100 dark:border-fuchsia-800",
  soja: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-100 dark:border-sky-800",
  brech:
    "bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950/60 dark:text-violet-100 dark:border-violet-800",
  sau: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-100 dark:border-emerald-800",
  feuer:
    "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/60 dark:text-orange-100 dark:border-orange-800",
  blau: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-100 dark:border-blue-800",
};

/**
 * What the id of a card nobody may see begins with.
 *
 * @remarks
 * A real card's id is `sorte-nummer`, so this can never collide with one. It
 * has to be readable off the card itself rather than kept in a second field,
 * because these stand-ins travel through the same snapshot as everything else -
 * and the screen has to be able to tell "a Blaue Bohne" from "a card I am not
 * allowed to see yet", which are otherwise the same object.
 */
export const FACE_DOWN_PREFIX = "verdeckt";

/**
 * A stand-in for a card the reader may not see.
 *
 * @param tag - what makes this row of stand-ins unique in the snapshot
 * @param at - its place in that row
 * @returns a card that says nothing but that it is there
 * @remarks
 * The sort is arbitrary and nothing may read it: {@link isFaceDown} is the only
 * question anybody is allowed to ask of one of these.
 */
export function faceDownCard(tag: string, at: number): Card {
  return { id: `${FACE_DOWN_PREFIX}-${tag}-${at}`, bean: "blau" };
}

/**
 * Whether this is a stand-in rather than a card.
 *
 * @param card - the card
 * @returns true if the reader is not allowed to see what it is
 * @remarks
 * Worth checking wherever a card is **drawn**. Online your own hand arrives on
 * a private channel a moment after the shared snapshot does, and until it lands
 * the snapshot's blanked hand is what there is. Drawn as real cards those would
 * be a screen telling you that you hold five Blaue Bohnen - which is not a
 * delay, it is a lie.
 */
export function isFaceDown(card: Card): boolean {
  return card.id.startsWith(`${FACE_DOWN_PREFIX}-`);
}

/**
 * Builds a full deck, unshuffled.
 *
 * @returns all 104 cards, each with an id of its own
 */
export function buildDeck(): readonly Card[] {
  const cards: Card[] = [];
  for (const bean of BEANS) {
    for (let n = 0; n < BEAN_INFO[bean].count; n++) {
      cards.push({ id: `${bean}-${n}`, bean });
    }
  }
  return cards;
}

/**
 * What a harvest of this many cards pays.
 *
 * @param bean - the sort on the field
 * @param count - how many cards are lying there
 * @returns the Bohnentaler, 0 to 4
 * @remarks
 * "Beachte: Bei manchen Ernten erhältst du keine Taler." Counting thresholds
 * rather than looking a count up in a table is what makes that fall out on its
 * own: below the first threshold nothing has been reached, and the answer is
 * zero without a special case.
 */
export function coinsFor(bean: Bean, count: number): number {
  return BEAN_INFO[bean].meter.filter((needed) => count >= needed).length;
}

/**
 * What the most a field of this sort can ever pay is.
 *
 * @param bean - the sort
 * @returns the last entry of its Bohnometer
 */
export function maxCoins(bean: Bean): number {
  return BEAN_INFO[bean].meter.length;
}

/**
 * How many more cards this field needs before it is worth one Taler more.
 *
 * @param bean - the sort on the field
 * @param count - how many cards are lying there
 * @returns the cards still missing, or null once nothing more can be reached
 * @remarks
 * The number a player actually wants while deciding whether to harvest, and the
 * reason the Bohnometer is stored as thresholds: it is the next threshold minus
 * what is already there, and nothing has to be searched for.
 */
export function toNextCoin(bean: Bean, count: number): number | null {
  const next = BEAN_INFO[bean].meter.find((needed) => count < needed);
  return next === undefined ? null : next - count;
}

/**
 * How each sort is printed on a card.
 *
 * @remarks
 * Fixed colours in both themes, on purpose and for the same reason the Monopoly
 * board keeps its own: **a card is printed card.** A real one does not get
 * darker in the evening, and the page around it carries the theme. It also
 * makes the drawing possible at all - a bean with a dark outline needs
 * something pale to sit on, and a background that flips out from under it would
 * take the outline with it.
 *
 * `band` is the colour strip the name and the count sit on, `ink` what is
 * legible on that strip, and `body`/`mark` are the bean itself and whatever is
 * drawn on it. The sorts are told apart by **shape first** - a pod, a kidney,
 * an eye, a pair, a broken pod, a flat disc, speckles - because eight colours
 * is more than a palette can keep apart for everybody.
 */
export const BEAN_PAINT: Readonly<
  Record<
    Bean,
    {
      readonly band: string;
      readonly ink: string;
      readonly body: string;
      readonly mark: string;
    }
  >
> = {
  garten: { band: "#7cb342", ink: "#12250a", body: "#8fc44a", mark: "#4e7a22" },
  rot: { band: "#c62828", ink: "#ffffff", body: "#cf3b32", mark: "#8c1b18" },
  augen: { band: "#ede3d2", ink: "#3b2a16", body: "#f2e7d4", mark: "#2f2418" },
  soja: { band: "#e8c34a", ink: "#2f2405", body: "#f0d36c", mark: "#a8801c" },
  brech: { band: "#9ccc65", ink: "#17280a", body: "#dbe89a", mark: "#7a9b3c" },
  sau: { band: "#2e7d52", ink: "#ffffff", body: "#57a978", mark: "#245f3f" },
  feuer: { band: "#8e3ba8", ink: "#ffffff", body: "#9c56b4", mark: "#3d1350" },
  blau: { band: "#2f5fb8", ink: "#ffffff", body: "#4d7ed0", mark: "#1c3a76" },
};

/** The card stock every bean is printed on, in both themes. */
export const CARD_STOCK = "#fbf8f0";

/** The line round the edge of a card. */
export const CARD_EDGE = "#2b2b26";

/** The gold of a Bohnentaler on the Bohnometer strip. */
export const COIN_GOLD = "#e8b93c";

/**
 * What each sort is called where there is no room for its whole name.
 *
 * @remarks
 * On a card in a hand of twelve there is room for about six letters, and
 * "Gartenbohne" is eleven. Every one of these is the printed name with
 * "-bohne" taken off, so nobody has to learn a second set of names.
 */
export const BEAN_SHORT: Readonly<Record<Bean, string>> = {
  garten: "Garten",
  rot: "Rot",
  augen: "Augen",
  soja: "Soja",
  brech: "Brech",
  sau: "Sau",
  feuer: "Feuer",
  blau: "Blau",
};

/** What a sort is called. */
export function beanName(bean: Bean): string {
  return BEAN_INFO[bean].name;
}
