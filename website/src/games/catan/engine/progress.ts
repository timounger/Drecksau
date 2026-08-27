/**
 * *Städte & Ritter*: the 54 Fortschrittskarten.
 *
 * @module
 * @remarks
 * Three decks of eighteen, one per track. Every count here is printed on the
 * card in the rulebook and none of them is invented - which matters more than
 * usual, because the deck sizes are what make the three tracks worth the same:
 * eighteen each, however differently they are made up.
 *
 * The cards are drawn on the event die's symbol and the red die's number
 * ({@link drawLimit}), played after the roll, and put back **under** their own
 * deck - so a deck is a ring and never runs out, as in Bohnanza. Only the two
 * Siegpunkt cards leave it, because they stay face up in front of their owner.
 */
import { TRACKS, type Track } from "./knights";

/** Every Fortschrittskarte, by the name printed on it. */
export type Progress =
  // Wissenschaft
  | "alchemie"
  | "baukran"
  | "bergbau"
  | "bewaesserung"
  | "buchdruck"
  | "erfindung"
  | "ingenieurwesen"
  | "medizin"
  | "schmiedekunst"
  | "strassenbau"
  // Handel
  | "haendler"
  | "handelshafen"
  | "handelsflotte"
  | "abgaben"
  | "warenmonopol"
  | "rohstoffmonopol"
  // Politik
  | "steuern"
  | "diplomatie"
  | "motivation"
  | "hochzeit"
  | "intrige"
  | "sabotage"
  | "spionage"
  | "verrat"
  | "verfassung";

/** Which deck each card belongs to, and how many of it there are. */
type Printing = { readonly track: Track; readonly count: number };

/**
 * The whole deck, card by card.
 *
 * @remarks
 * Each track adds up to eighteen. Worth checking when anything changes here -
 * {@link deckOf} builds the piles straight off this table, so a miscount would
 * quietly make one track luckier than another for the whole game.
 */
export const PROGRESS_CARDS: Readonly<Record<Progress, Printing>> = {
  // Wissenschaft: 2+2+2+2+1+2+1+2+2+2 = 18
  alchemie: { track: "wissenschaft", count: 2 },
  baukran: { track: "wissenschaft", count: 2 },
  bergbau: { track: "wissenschaft", count: 2 },
  bewaesserung: { track: "wissenschaft", count: 2 },
  buchdruck: { track: "wissenschaft", count: 1 },
  erfindung: { track: "wissenschaft", count: 2 },
  ingenieurwesen: { track: "wissenschaft", count: 1 },
  medizin: { track: "wissenschaft", count: 2 },
  schmiedekunst: { track: "wissenschaft", count: 2 },
  strassenbau: { track: "wissenschaft", count: 2 },
  // Handel: 6+2+2+2+2+4 = 18
  haendler: { track: "handel", count: 6 },
  handelshafen: { track: "handel", count: 2 },
  handelsflotte: { track: "handel", count: 2 },
  abgaben: { track: "handel", count: 2 },
  warenmonopol: { track: "handel", count: 2 },
  rohstoffmonopol: { track: "handel", count: 4 },
  // Politik: 2+2+2+2+2+2+3+2+1 = 18
  steuern: { track: "politik", count: 2 },
  diplomatie: { track: "politik", count: 2 },
  motivation: { track: "politik", count: 2 },
  hochzeit: { track: "politik", count: 2 },
  intrige: { track: "politik", count: 2 },
  sabotage: { track: "politik", count: 2 },
  spionage: { track: "politik", count: 3 },
  verrat: { track: "politik", count: 2 },
  verfassung: { track: "politik", count: 1 },
};

/**
 * What a card looks like from the other side of the table.
 *
 * @remarks
 * Not one of the twenty-five, on purpose. A real card as the stand-in - which
 * is what the development cards do - would make "a Bergbau card" and "a card I
 * am not allowed to see" the same value, and the one place that matters is
 * **Spionage**, which shows somebody else's hand and asks you to pick from it.
 * A screen that offers you a Bergbau that is not there is worse than one that
 * says it cannot see.
 */
export const FACE_DOWN_CARD = "verdeckt";

/**
 * A card as it is **held** - either a real one, or a back.
 *
 * @remarks
 * Apart from {@link Progress} on purpose. The twenty-five real cards each have
 * a name, a text and a deck, and every one of those tables is complete; a back
 * has none of them and belongs in none of them. Keeping it out of the union is
 * what lets the tables stay exhaustive - and what makes the compiler point at
 * every place that has to decide which of the two it is looking at.
 */
export type HeldCard = Progress | typeof FACE_DOWN_CARD;

/** Whether this is a back rather than a card. */
export function isFaceDownCard(card: HeldCard): card is typeof FACE_DOWN_CARD {
  return card === FACE_DOWN_CARD;
}

/** Whether this is a real card the referee can act on. */
export function isRealCard(card: HeldCard): card is Progress {
  return card !== FACE_DOWN_CARD;
}

/** How many cards each deck holds - the same for all three. */
export const DECK_SIZE = 18;

/** The two cards that are a victory point and stay face up. */
export const POINT_CARDS: readonly Progress[] = ["buchdruck", "verfassung"];

/** Whether this card is a victory point rather than an action. */
export function isPointCard(card: HeldCard): boolean {
  return POINT_CARDS.includes(card as Progress);
}

/** What each card is called. */
export const PROGRESS_NAMES: Readonly<Record<Progress, string>> = {
  alchemie: "Alchemie",
  baukran: "Baukran",
  bergbau: "Bergbau",
  bewaesserung: "Bewässerung",
  buchdruck: "Buchdruck",
  erfindung: "Erfindung",
  ingenieurwesen: "Ingenieurwesen",
  medizin: "Medizin",
  schmiedekunst: "Schmiedekunst",
  strassenbau: "Straßenbau",
  haendler: "Der Händler",
  handelshafen: "Handelshafen",
  handelsflotte: "Handelsflotte",
  abgaben: "Abgaben",
  warenmonopol: "Handelswaren-Monopol",
  rohstoffmonopol: "Rohstoff-Monopol",
  steuern: "Steuern",
  diplomatie: "Diplomatie",
  motivation: "Motivation",
  hochzeit: "Hochzeit",
  intrige: "Intrige",
  sabotage: "Sabotage",
  spionage: "Spionage",
  verrat: "Verrat",
  verfassung: "Verfassung",
};

/** What each card says on it, shortened to what a player has to decide. */
export const PROGRESS_TEXTS: Readonly<Record<Progress, string>> = {
  alchemie: "Vor dem Wurf: beide Augenwürfel selbst bestimmen.",
  baukran: "Ein Stadtausbau kostet diese Runde 1 Handelsware weniger.",
  bergbau: "Je Gebirgsfeld mit eigener Siedlung oder Stadt: 2 Erz.",
  bewaesserung: "Je Ackerland mit eigener Siedlung oder Stadt: 2 Getreide.",
  buchdruck: "Siegpunkt. Liegt offen aus.",
  erfindung: "Zwei Zahlenchips tauschen - nie 2, 12, 6 oder 8.",
  ingenieurwesen: "Baue sofort kostenlos 1 Stadtmauer.",
  medizin: "Für 2 Erz und 1 Getreide eine Siedlung zur Stadt machen.",
  schmiedekunst: "2 Ritter je 1 Stufe kostenlos aufwerten.",
  strassenbau: "Baue sofort kostenlos 2 Straßen.",
  haendler:
    "Setze den Händler auf ein Feld neben deiner Siedlung. 1 Siegpunkt.",
  handelshafen:
    "Jeder anderen Person einmal 1 Rohstoff gegen 1 Handelsware anbieten.",
  handelsflotte: "Bis Zugende 1 Sorte beliebig oft 2:1 tauschen.",
  abgaben: "Von einer Person mit mehr Siegpunkten 2 Handkarten nehmen.",
  warenmonopol: "Eine Handelsware bestimmen; alle geben 1 davon ab.",
  rohstoffmonopol: "Eine Rohstoffsorte bestimmen; alle geben 2 davon ab.",
  steuern: "Räuber versetzen; von jeder Person am neuen Feld 1 Karte ziehen.",
  diplomatie: "Eine offene fremde Straße entfernen.",
  motivation: "Alle eigenen Ritter sofort kostenlos aktivieren.",
  hochzeit: "Jede Person mit mehr Siegpunkten schenkt dir 2 Karten.",
  intrige: "Einen fremden Ritter von einer Kreuzung vertreiben.",
  sabotage:
    "Alle mit gleich vielen oder mehr Siegpunkten verlieren die Hälfte.",
  spionage: "Fortschrittskarten einer Person ansehen und 1 nehmen.",
  verrat:
    "Eine Person nimmt einen Ritter vom Feld; du stellst einen eigenen auf.",
  verfassung: "Siegpunkt. Liegt offen aus.",
};

/**
 * One deck, unshuffled.
 *
 * @param track - which of the three
 * @returns its eighteen cards, ready to be shuffled
 */
export function deckOf(track: Track): readonly Progress[] {
  const cards: Progress[] = [];
  for (const name of Object.keys(PROGRESS_CARDS) as Progress[]) {
    const printing = PROGRESS_CARDS[name];
    if (printing.track === track) {
      for (let copy = 0; copy < printing.count; copy++) {
        cards.push(name);
      }
    }
  }
  return cards;
}

/** All three decks, unshuffled, keyed by track. */
export function buildDecks(): Readonly<Record<Track, readonly Progress[]>> {
  return {
    wissenschaft: deckOf("wissenschaft"),
    handel: deckOf("handel"),
    politik: deckOf("politik"),
  };
}

/** Which deck a card belongs back under. */
export function trackOf(card: Progress): Track {
  return PROGRESS_CARDS[card].track;
}

/** Every card name, for the guards that check a stored game. */
export const PROGRESS_NAMES_LIST: readonly string[] = [
  ...Object.keys(PROGRESS_CARDS),
  // The stand-in travels in the same field, so a redacted snapshot has to pass
  // the same guard the real one does.
  FACE_DOWN_CARD,
];

/** Every track name, for the same. */
export const TRACK_LIST: readonly string[] = [...TRACKS];
