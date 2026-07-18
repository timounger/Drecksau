/**
 * German user-facing texts for Binokel, plus card and meld labels.
 *
 * @module
 */
import type { Rank, Suit } from "@/games/binokel/engine/cards";
import type { Meld, MeldKind } from "@/games/binokel/engine/melds";

/** Static texts of the Binokel screen. */
export const BINOKEL_TEXTS = {
  title: "Binokel",
  subtitle: "Schwaebisches Stichspiel gegen zwei Computergegner.",
  withSevens: "Mit Siebenern (48 Karten)",
  newMatch: "Neue Partie",
  yourHand: "Deine Karten",
  dabb: "Dabb",
  dealer: "Geber",
  trump: "Trumpf",
  target: (points: number) => `Ziel ${points}`,
  cardsLeft: "Karten",
  // Bidding
  bidding: "Reizen",
  reizen: (value: number) => `Reizen (${value})`,
  pass: "Weg",
  passed: "weg",
  yourBidTurn: "Du bist am Reizen.",
  // Exchange
  discardPrompt: (count: number) =>
    `Dabb aufgenommen - drücke ${count} Karten weg.`,
  confirmDiscard: "Ablegen",
  chooseTrumpTitle: "Trumpf ansagen",
  declarerWorking: (name: string) => `${name} nimmt den Dabb und drückt ...`,
  // Melding
  meldingTitle: "Meldungen",
  meldPoints: "Meldepunkte",
  noMelds: "keine",
  toTricks: "Weiter zum Stechen",
  // Trick
  trickTitle: "Stich",
  yourTurn: "Du bist dran.",
  waiting: (name: string) => `${name} ist am Zug ...`,
  // Round / match end
  roundResultTitle: "Rundenergebnis",
  colTricks: "Stiche",
  colMeld: "Meldung",
  colDelta: "Runde",
  colScore: "Stand",
  declarerMade: (name: string) => `${name} hat das Spiel gemacht.`,
  declarerOff: (name: string) => `${name} ist abgegangen (doppelter Reizwert).`,
  nextRound: "Nächste Runde",
  matchOver: "Partie zu Ende",
  winner: (name: string) => `${name} gewinnt die Partie!`,
  // Settings & navigation
  settings: "Einstellungen",
  statistics: "Statistik",
  settingsTitle: "Binokel-Einstellungen",
  settingsSubtitle: "Wird nur in deinem Browser gespeichert.",
  withSevensHint:
    "48-Karten-Deck mit Siebenern statt 40 Karten. Gilt ab der nächsten Partie.",
  backToGame: "Zurück zum Spiel",
} as const;

/** Full name of each suit. */
export const SUIT_LABELS: Readonly<Record<Suit, string>> = {
  eichel: "Eichel",
  blatt: "Blatt",
  herz: "Herz",
  schellen: "Schellen",
};

/** Short name of each rank, as shown on a card. */
export const RANK_LABELS: Readonly<Record<Rank, string>> = {
  daus: "A",
  zehn: "10",
  koenig: "K",
  ober: "O",
  unter: "U",
  sieben: "7",
};

/** Name of each meld kind. */
export const MELD_LABELS: Readonly<Record<MeldKind, string>> = {
  dix: "Dix",
  paar: "Paar",
  binokel: "Binokel",
  doppelbinokel: "Doppelbinokel",
  vier: "Vier Gleiche",
  acht: "Acht Gleiche",
  familie: "Familie",
  doppelteFamilie: "Doppelte Familie",
  rundgang: "Rundgang",
};

/**
 * A readable label for a meld, including its rank or suit where it has one.
 *
 * @param meld - the meld
 * @returns e.g. "Familie Herz" or "Vier Gleiche (Daus)"
 */
export function meldLabel(meld: Meld): string {
  let label = MELD_LABELS[meld.kind];
  if (meld.suit !== undefined) {
    label = `${label} ${SUIT_LABELS[meld.suit]}`;
  }
  if (meld.rank !== undefined) {
    label = `${label} (${RANK_LABELS[meld.rank]})`;
  }
  return label;
}
