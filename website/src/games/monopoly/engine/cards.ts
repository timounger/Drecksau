/**
 * The sixteen Ereignis- and sixteen Gemeinschaftskarten.
 *
 * @module
 * @remarks
 * **These are not in the rulebook.** It counts them - "16 Ereigniskarten, 16
 * Gemeinschaftskarten" - and says what to do with them, and prints not one of
 * them. The texts below are the standard German set; where a wording or an
 * amount could not be checked it is still one of these two decks doing one of
 * the things the rulebook describes. Recorded as a reading in
 * `docs/games/monopoly/game-rules.md`.
 *
 * A card is **data, not a function**: an `effect` the referee knows how to carry
 * out. That keeps the deck plain JSON - it travels to storage and over the wire
 * like everything else - and it means the referee is the only place that moves
 * money, which is what stops a card quietly inventing a rule of its own.
 */
import { GO_AT, JAIL_AT } from "./board";

/** Which of the two decks a card belongs to. */
export type DeckId = "ereignis" | "gemeinschaft";

/** What a card does. */
export type Effect =
  /** Go to a field, collecting the salary if LOS is passed. */
  | { readonly kind: "goTo"; readonly at: number; readonly salary: boolean }
  /** Go to the next station, and pay double if somebody owns it. */
  | { readonly kind: "toStation" }
  /** Go to the next utility, and pay ten times the roll if owned. */
  | { readonly kind: "toUtility" }
  /** Walk backwards, resolving wherever that lands. */
  | { readonly kind: "back"; readonly steps: number }
  /** Straight to jail, no salary. */
  | { readonly kind: "toJail" }
  /** Keep it until it gets you out. */
  | { readonly kind: "pardon" }
  /** Take from, or pay to, the bank. */
  | { readonly kind: "bank"; readonly amount: number }
  /** Pay every other player this much, or collect it from each. */
  | { readonly kind: "each"; readonly amount: number }
  /** Pay per house and per hotel owned. */
  | {
      readonly kind: "repairs";
      readonly perHouse: number;
      readonly perHotel: number;
    };

/** One card. */
export type Card = {
  readonly deck: DeckId;
  readonly text: string;
  readonly effect: Effect;
};

/** Board positions the cards send people to. */
const SCHLOSSALLEE = 39;
const SEESTRASSE = 11;
const OPERNPLATZ = 24;
const SUEDBAHNHOF = 5;

/** The Ereignis deck - the one that mostly moves you. */
const EREIGNIS: readonly Card[] = [
  {
    deck: "ereignis",
    text: "Rücke vor bis auf LOS.",
    effect: { kind: "goTo", at: GO_AT, salary: true },
  },
  {
    deck: "ereignis",
    text: "Rücke vor bis zur Schlossallee.",
    effect: { kind: "goTo", at: SCHLOSSALLEE, salary: true },
  },
  {
    deck: "ereignis",
    text: "Rücke vor bis zur Seestraße. Wenn du über LOS kommst, ziehe 200 € ein.",
    effect: { kind: "goTo", at: SEESTRASSE, salary: true },
  },
  {
    deck: "ereignis",
    text: "Rücke vor bis zum Opernplatz. Wenn du über LOS kommst, ziehe 200 € ein.",
    effect: { kind: "goTo", at: OPERNPLATZ, salary: true },
  },
  {
    deck: "ereignis",
    text: "Rücke vor bis zum Südbahnhof. Wenn du über LOS kommst, ziehe 200 € ein.",
    effect: { kind: "goTo", at: SUEDBAHNHOF, salary: true },
  },
  {
    deck: "ereignis",
    text: "Rücke vor bis zum nächsten Bahnhof. Zahle dem Besitzer die doppelte Miete. Gehört er der Bank, darfst du ihn kaufen.",
    effect: { kind: "toStation" },
  },
  {
    deck: "ereignis",
    text: "Rücke vor bis zum nächsten Bahnhof. Zahle dem Besitzer die doppelte Miete. Gehört er der Bank, darfst du ihn kaufen.",
    effect: { kind: "toStation" },
  },
  {
    deck: "ereignis",
    text: "Rücke vor bis zum nächsten Versorgungswerk. Würfle und zahle dem Besitzer das Zehnfache. Gehört es der Bank, darfst du es kaufen.",
    effect: { kind: "toUtility" },
  },
  {
    deck: "ereignis",
    text: "Gehe 3 Felder zurück.",
    effect: { kind: "back", steps: 3 },
  },
  {
    deck: "ereignis",
    text: "Gehe in das Gefängnis. Begib dich direkt dorthin. Gehe nicht über LOS.",
    effect: { kind: "toJail" },
  },
  {
    deck: "ereignis",
    text: "Du kommst aus dem Gefängnis frei. Diese Karte kannst du aufheben.",
    effect: { kind: "pardon" },
  },
  {
    deck: "ereignis",
    text: "Die Bank zahlt dir eine Dividende von 50 €.",
    effect: { kind: "bank", amount: 50 },
  },
  {
    deck: "ereignis",
    text: "Deine Baudarlehen werden fällig. Ziehe 150 € ein.",
    effect: { kind: "bank", amount: 150 },
  },
  {
    deck: "ereignis",
    text: "Zahle eine Strafe von 15 €.",
    effect: { kind: "bank", amount: -15 },
  },
  {
    deck: "ereignis",
    text: "Lass alle deine Straßen reparieren: Zahle 25 € je Haus und 100 € je Hotel.",
    effect: { kind: "repairs", perHouse: 25, perHotel: 100 },
  },
  {
    deck: "ereignis",
    text: "Du bist zum Vorstand gewählt worden. Zahle jedem Mitspieler 50 €.",
    effect: { kind: "each", amount: -50 },
  },
];

/** The Gemeinschaft deck - the one that mostly pays you. */
const GEMEINSCHAFT: readonly Card[] = [
  {
    deck: "gemeinschaft",
    text: "Rücke vor bis auf LOS.",
    effect: { kind: "goTo", at: GO_AT, salary: true },
  },
  {
    deck: "gemeinschaft",
    text: "Irrtum der Bank zu deinen Gunsten. Ziehe 200 € ein.",
    effect: { kind: "bank", amount: 200 },
  },
  {
    deck: "gemeinschaft",
    text: "Zahle 50 € Arztkosten.",
    effect: { kind: "bank", amount: -50 },
  },
  {
    deck: "gemeinschaft",
    text: "Der Verkauf von Aktien bringt dir 50 € ein.",
    effect: { kind: "bank", amount: 50 },
  },
  {
    deck: "gemeinschaft",
    text: "Du kommst aus dem Gefängnis frei. Diese Karte kannst du aufheben.",
    effect: { kind: "pardon" },
  },
  {
    deck: "gemeinschaft",
    text: "Gehe in das Gefängnis. Begib dich direkt dorthin. Gehe nicht über LOS.",
    effect: { kind: "toJail" },
  },
  {
    deck: "gemeinschaft",
    text: "Du hast Geburtstag. Ziehe von jedem Mitspieler 10 € ein.",
    effect: { kind: "each", amount: 10 },
  },
  {
    deck: "gemeinschaft",
    text: "Einkommensteuer-Rückzahlung. Ziehe 20 € ein.",
    effect: { kind: "bank", amount: 20 },
  },
  {
    deck: "gemeinschaft",
    text: "Aus einer Lebensversicherung erhältst du 100 €.",
    effect: { kind: "bank", amount: 100 },
  },
  {
    deck: "gemeinschaft",
    text: "Zahle Krankenhauskosten von 100 €.",
    effect: { kind: "bank", amount: -100 },
  },
  {
    deck: "gemeinschaft",
    text: "Zahle Schulgeld von 50 €.",
    effect: { kind: "bank", amount: -50 },
  },
  {
    deck: "gemeinschaft",
    text: "Du erhältst 25 € Beratungshonorar.",
    effect: { kind: "bank", amount: 25 },
  },
  {
    deck: "gemeinschaft",
    text: "Straßenausbesserung: Zahle 40 € je Haus und 115 € je Hotel.",
    effect: { kind: "repairs", perHouse: 40, perHotel: 115 },
  },
  {
    deck: "gemeinschaft",
    text: "Du hast im Kreuzworträtselwettbewerb gewonnen. Ziehe 100 € ein.",
    effect: { kind: "bank", amount: 100 },
  },
  {
    deck: "gemeinschaft",
    text: "Du erbst 100 €.",
    effect: { kind: "bank", amount: 100 },
  },
  {
    deck: "gemeinschaft",
    text: "Zweiter Preis im Schönheitswettbewerb. Ziehe 10 € ein.",
    effect: { kind: "bank", amount: 10 },
  },
];

/** Both decks, in one list; a card is an index into this. */
export const CARDS: readonly Card[] = [...EREIGNIS, ...GEMEINSCHAFT];

/** Where the jail is, for the cards that send you there. */
export const CARD_JAIL = JAIL_AT;

/**
 * The card at an index.
 *
 * @param index - the card's place in {@link CARDS}
 * @returns the card, or null for an index that is not one
 */
export function cardAt(index: number): Card | null {
  return CARDS[index] ?? null;
}

/**
 * The indexes of one deck's cards, in printing order.
 *
 * @param deck - which deck
 * @returns the indexes, to be shuffled into a pile
 */
export function deckOf(deck: DeckId): readonly number[] {
  return CARDS.map((card, index) => (card.deck === deck ? index : -1)).filter(
    (index) => index >= 0,
  );
}

/**
 * Whether a card is one to keep rather than to carry out.
 *
 * @param index - the card's index
 * @returns true for a Get-Out-Of-Jail card
 */
export function isPardon(index: number): boolean {
  return cardAt(index)?.effect.kind === "pardon";
}
