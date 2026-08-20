/**
 * What is in the deck, and what each card does.
 *
 * @module
 * @remarks
 * Fifty-six cards, and every count comes from the rulebook - there is nothing
 * invented about the deck here. The one thing the booklet does not put in
 * writing is what the five sorts of cat card are **called**: it prints them as
 * pictures and counts them as "4 of each". {@link CAT_KINDS} carries the names
 * of the Original Edition, and that is the only line in this module that is a
 * choice rather than a reading.
 *
 * The card texts are German, like everything a player sees. The rulebook is
 * English; the game is not.
 */

/** The five cat cards - worthless alone, and the whole point of a combo. */
export type CatKind = "tacocat" | "rainbow" | "melon" | "potato" | "beard";

/** Every sort of card in the deck. */
export type CardKind =
  /** Explodierendes Kätzchen - draw it without a Defuse and you are out. */
  | "kitten"
  /** Entschärfung - the only thing that saves you. */
  | "defuse"
  /** Nö! - stops any action but a kitten or a defuse. */
  | "nope"
  /** Angriff - end your turn and hand two of them to the next player. */
  | "attack"
  /** Aussetzen - end your turn without drawing. */
  | "skip"
  /** Gefallen - somebody hands you a card of their choosing. */
  | "favor"
  /** Mischen - shuffle the draw pile. */
  | "shuffle"
  /** Blick in die Zukunft - look at the top three, privately. */
  | "future"
  | CatKind;

/** A card, in a hand, in a pile or on the table. */
export type Card =
  | { readonly id: string; readonly kind: CardKind }
  /**
   * A card this client is not allowed to see.
   *
   * @remarks
   * Online the host blanks the draw pile and every hand but your own. This is
   * what is left: a card back that can be counted but not read. It never exists
   * offline, and no move may name one - the referee looks cards up by id in the
   * real state, which has no hidden card in it at all.
   */
  | { readonly id: string; readonly kind: "hidden" };

/** Cards in a full deck - from the rulebook. */
export const DECK_SIZE = 56;

/** The cat cards, in the order they are shown. */
export const CAT_KINDS: readonly CatKind[] = [
  "tacocat",
  "rainbow",
  "melon",
  "potato",
  "beard",
];

/**
 * How many of each card a full deck holds - every number from the rulebook.
 *
 * @remarks
 * Adds up to {@link DECK_SIZE}. Setup then takes most of the kittens and
 * defuses back out again, which is what {@link ../engine/setup} does.
 */
export const DECK_COUNTS: Readonly<Record<CardKind, number>> = {
  kitten: 4,
  defuse: 6,
  nope: 5,
  attack: 4,
  skip: 4,
  favor: 4,
  shuffle: 4,
  future: 5,
  tacocat: 4,
  rainbow: 4,
  melon: 4,
  potato: 4,
  beard: 4,
};

/** The cards, in the order the rules introduce them. */
export const KINDS: readonly CardKind[] = [
  "kitten",
  "defuse",
  "nope",
  "attack",
  "skip",
  "favor",
  "shuffle",
  "future",
  ...CAT_KINDS,
];

/** What each card is called. */
export const CARD_NAMES: Readonly<Record<CardKind, string>> = {
  kitten: "Explodierendes Kätzchen",
  defuse: "Entschärfung",
  nope: "Nö!",
  attack: "Angriff",
  skip: "Aussetzen",
  favor: "Gefallen",
  shuffle: "Mischen",
  future: "Blick in die Zukunft",
  tacocat: "Tacocat",
  rainbow: "Regenbogen-Kotz-Katze",
  melon: "Katzemelone",
  potato: "Haarige Kartoffelkatze",
  beard: "Bartkatze",
};

/** The short form printed on the card itself, where a name would not fit. */
export const CARD_SHORT: Readonly<Record<CardKind, string>> = {
  kitten: "Kätzchen",
  defuse: "Entschärfung",
  nope: "Nö!",
  attack: "Angriff",
  skip: "Aussetzen",
  favor: "Gefallen",
  shuffle: "Mischen",
  future: "Zukunft",
  tacocat: "Tacocat",
  rainbow: "Kotzkatze",
  melon: "Katzemelone",
  potato: "Kartoffelkatze",
  beard: "Bartkatze",
};

/** What each card says on it. */
export const CARD_TEXTS: Readonly<Record<CardKind, string>> = {
  kitten: "Sofort zeigen. Ohne Entschärfung bist du raus.",
  defuse:
    "Rettet dich vor einem gezogenen Kätzchen. Danach steckst du es heimlich irgendwo in den Nachziehstapel zurück.",
  nope: "Stoppt jede Aktion außer Kätzchen und Entschärfung - auch ein anderes Nö!.",
  attack: "Zug beenden, ohne zu ziehen. Der Nächste macht 2 Züge.",
  skip: "Zug sofort beenden, ohne zu ziehen.",
  favor: "Ein Mitspieler gibt dir eine Karte - er sucht sie aus.",
  shuffle: "Mische den Nachziehstapel.",
  future: "Sieh dir heimlich die obersten 3 Karten an.",
  tacocat: "Allein wertlos. Zwei gleiche klauen eine Karte.",
  rainbow: "Allein wertlos. Zwei gleiche klauen eine Karte.",
  melon: "Allein wertlos. Zwei gleiche klauen eine Karte.",
  potato: "Allein wertlos. Zwei gleiche klauen eine Karte.",
  beard: "Allein wertlos. Zwei gleiche klauen eine Karte.",
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
  kitten: "text-rose-700 dark:text-rose-300",
  defuse: "text-green-700 dark:text-green-300",
  nope: "text-orange-700 dark:text-orange-300",
  attack: "text-red-700 dark:text-red-300",
  skip: "text-violet-700 dark:text-violet-300",
  favor: "text-teal-700 dark:text-teal-300",
  shuffle: "text-blue-700 dark:text-blue-300",
  future: "text-amber-700 dark:text-amber-300",
  tacocat: "text-cyan-700 dark:text-cyan-300",
  rainbow: "text-pink-700 dark:text-pink-300",
  melon: "text-lime-700 dark:text-lime-300",
  potato: "text-amber-800 dark:text-amber-200",
  beard: "text-indigo-700 dark:text-indigo-300",
};

/** The emoji each card wears, so a hand reads at a glance. */
export const CARD_ICONS: Readonly<Record<CardKind, string>> = {
  kitten: "\u{1F4A5}",
  defuse: "\u{2702}\u{FE0F}",
  nope: "\u{1F6AB}",
  attack: "\u{2694}\u{FE0F}",
  skip: "\u{23ED}\u{FE0F}",
  favor: "\u{1F91D}",
  shuffle: "\u{1F500}",
  future: "\u{1F52E}",
  tacocat: "\u{1F32E}",
  rainbow: "\u{1F308}",
  melon: "\u{1F349}",
  potato: "\u{1F954}",
  beard: "\u{1F9D4}",
};

/** How many cards a Blick in die Zukunft shows - from the card itself. */
export const FUTURE_CARDS = 3;

/** Whether this is one of the five cat cards. */
export function isCat(kind: CardKind): boolean {
  return (CAT_KINDS as readonly string[]).includes(kind);
}

/**
 * Whether this card can be played on its own, on your turn.
 *
 * @param kind - the card
 * @returns true for the cards that do something by themselves
 * @remarks
 * Four sorts cannot. A **kitten** is never in a hand to begin with. A
 * **defuse** is only ever played in answer to one, which the referee handles
 * itself. A **Nö!** belongs to somebody else's action, never to your own turn.
 * And a **cat card** is "powerless on its own" - so it is offered as a combo or
 * not at all, rather than as a button that does nothing.
 */
export function playsAlone(kind: CardKind): boolean {
  return (
    kind !== "kitten" && kind !== "defuse" && kind !== "nope" && !isCat(kind)
  );
}

/**
 * Whether a Nö! can stop this.
 *
 * @param kind - the card that was played
 * @returns false for the two cards the rulebook puts out of reach
 * @remarks
 * "Stop any action except for an Exploding Kitten or a Defuse." Everything
 * else - including another Nö! and including a combo - is fair game.
 */
export function isNopeable(kind: CardKind): boolean {
  return kind !== "kitten" && kind !== "defuse";
}

/**
 * Builds a full deck, unshuffled.
 *
 * @returns the fifty-six cards, each with an id of its own
 * @remarks
 * Ids are handed out here rather than generated later, so a card keeps the same
 * name from the deck through a hand, the discard pile and back again. Online
 * that matters: a move names the cards it means, and both ends have to agree
 * what those names refer to.
 */
export function buildDeck(): readonly Card[] {
  const cards: Card[] = [];
  for (const kind of KINDS) {
    for (let n = 0; n < DECK_COUNTS[kind]; n++) {
      cards.push({ id: `${kind}-${n}`, kind });
    }
  }
  return cards;
}

/**
 * A face-down stand-in.
 *
 * @param tag - what makes this one different from the next
 * @returns a card back with an id of its own
 * @remarks
 * The tag has to be unique across the whole table, not just within one hand:
 * every card back on screen is a React key, and two of them sharing one would
 * make the list jump about whenever a hand changed size.
 */
export function hiddenCard(tag: string): Card {
  return { id: `hidden-${tag}`, kind: "hidden" };
}

/**
 * What a card is called.
 *
 * @param card - the card
 * @returns its name, for the log and for a screen reader
 */
export function cardName(card: Card): string {
  return card.kind === "hidden" ? "verdeckte Karte" : CARD_NAMES[card.kind];
}
