/**
 * German user-facing texts for Binokel, plus card and meld labels.
 *
 * @module
 */
import type { Rank, Suit } from "@/games/binokel/engine/cards";
import type { Difficulty } from "@/games/binokel/engine/difficulty";
import type { Meld, MeldKind } from "@/games/binokel/engine/melds";

/** Static texts of the Binokel screen. */
export const BINOKEL_TEXTS = {
  title: "Binokel",
  subtitle: "Schwaebisches Stichspiel gegen Computergegner.",
  withSevens: "Mit 7ern spielen (Siebener · 48 Karten)",
  newMatch: "Neue Partie",
  yourHand: "Deine Karten",
  dabb: "Dabb",
  dealer: "Geber",
  trump: "Trumpf",
  target: (points: number) => `Ziel ${points}`,
  cardsLeft: "Karten",
  // Bidding (the "Reizen"/"Steigern" term is chosen in the settings)
  reizen: (term: string, value: number) => `${term} (${value})`,
  pass: "Weg",
  passed: "weg",
  yourBidTurn: (term: string) => `Du bist am ${term}.`,
  meldEstimate: (min: number, max: number) =>
    min === max ? `Melden: ${min}` : `Melden: ${min}-${max}`,
  // Exchange
  discardPrompt: (count: number) =>
    `Dabb aufgenommen - drücke ${count} Karten weg.`,
  confirmDiscard: "Ablegen",
  confirmDiscardCount: (marked: number, total: number) =>
    `Ablegen (${marked}/${total})`,
  swapHint:
    "Karte antippen, dann eine aus der anderen Reihe - sie tauschen. Die obere Reihe (Dabb) wird weggedrückt.",
  markDiscardHint: (count: number) =>
    `Markiere ${count} Karten zum Ablegen, dann auf Ablegen klicken.`,
  chooseTrumpTitle: "Trumpf ansagen",
  declarerWorking: (name: string) => `${name} nimmt den Dabb und drückt ...`,
  // Melding
  meldingTitle: "Meldungen",
  meldPoints: "Meldepunkte",
  noMelds: "keine",
  toTricks: "Weiter zum Stechen",
  concede: "Abgehen",
  playOn: "Spielen",
  playNormal: "Normal",
  playDurch: "Durch",
  durchHint: "Durch = alle Stiche machen (gewonnen +1000, verloren -1000).",
  // Trick
  trickTitle: "Stich",
  yourTurn: "Du bist dran.",
  waiting: (name: string) => `${name} ist am Zug ...`,
  trickComplete: "Stich komplett",
  continueTrick: "Weiter",
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
  teamWinner: (names: string) => `Team ${names} gewinnt die Partie!`,
  // Settings & navigation
  settings: "Einstellungen",
  statistics: "Statistik",
  online: "Online",
  settingsTitle: "Binokel-Einstellungen",
  settingsSubtitle: "Wird nur in deinem Browser gespeichert.",
  difficulty: "Schwierigkeit",
  difficultyHint:
    "Wie stark die Computergegner reizen und stechen. Sie sehen nie deine Handkarten. Gilt sofort.",
  withSevensHint:
    "An: mit 7ern, 48 Karten. Aus: ohne 7er, 40 Karten. Gilt ab der nächsten Partie.",
  withDabb: "Mit Dabb spielen",
  withDabbHint:
    "An: mit Dabb (Widow) und Drücken. Aus: Karten werden aufgeteilt, kein Drücken. Gilt ab der nächsten Partie.",
  discardModeTitle: "Dabb ablegen",
  discardModeHint:
    "Wie du beim Drücken die Karten weglegst. Gilt sofort für dein nächstes Drücken.",
  discardModeSwap: "Wie bisher (zwei Reihen tauschen)",
  discardModeMark: "Karten markieren und ablegen",
  suitOrderTitle: "Farb-Reihenfolge",
  suitOrderHint:
    "So werden deine Handkarten sortiert - von links (oben) nach rechts (unten).",
  rankOrderTitle: "Reihenfolge je Farbe",
  rankOrderHint:
    "Ob innerhalb einer Farbe von hoch nach niedrig oder umgekehrt sortiert wird.",
  rankAceFirst: (ace: string) => `${ace} nach 7`,
  rankSevenFirst: (ace: string) => `7 nach ${ace}`,
  namingTitle: "Bezeichnungen",
  namingHint:
    "Wähle, wie Farben und Karten heißen. Standard ist jeweils die erste Bezeichnung. Gilt sofort.",
  namingDix: "Trumpf-Sieben",
  namingAce: "Ass",
  namingBid: "Reiz-Vorgang",
  moveUp: "Nach oben",
  moveDown: "Nach unten",
  playerCountTitle: "Spieleranzahl",
  playerCountHint: "Du plus Computergegner. Gilt ab der nächsten Partie.",
  teams: "In Teams spielen",
  teamsHint:
    "Zwei Teams über Kreuz - nur bei 4 oder 6 Spielern (2er- bzw. 3er-Teams). Teamkollegen zählen ihre Punkte zusammen.",
  backToGame: "Zurück zum Spiel",
} as const;

/** Texts of the Binokel online mode (lobby, board shell and chat). */
export const BINOKEL_ONLINE_TEXTS = {
  title: "Binokel online",
  subtitle: "Mit Freunden per Raumcode - alle brauchen nur den Link.",
  backToGame: "Zurück zum Spiel",
  yourName: "Dein Name",
  yourNamePlaceholder: "Spieler",
  createRoom: "Raum erstellen",
  joinRoom: "Raum beitreten",
  // Automatic matchmaking
  autoMatch: "Automatisch Spiel suchen",
  autoMatchHint: "Wir setzen dich mit anderen Spielern an einen Tisch.",
  orDivider: "oder privat spielen",
  matchWish: "Dein Wunsch-Tisch",
  matchWishHint:
    "Passt ein offener Tisch, geht es sofort los - sonst nach kurzer Wartezeit auch mit einer anderen Spieleranzahl.",
  matchCount: "Spieler:",
  matchCountValue: (count: number) => `${count} Spieler`,
  searching: "Suche Mitspieler ...",
  playersHere: (count: number) =>
    count === 1 ? "1 Spieler im Raum" : `${count} Spieler im Raum`,
  startingIn: (seconds: number) => `Spiel startet in ${seconds} s ...`,
  waitingForMore: "Warte auf weitere Mitspieler ...",
  almostReady: "Genug Spieler - es geht gleich los ...",
  cancelSearch: "Suche abbrechen",
  playersOnline: (count: number) =>
    count === 1 ? "1 Spieler online" : `${count} Spieler online`,
  roomCode: "Raumcode",
  roomCodePlaceholder: "z. B. ABCD",
  connecting: "Verbinde ...",
  waitingForHost: "Warte auf den Gastgeber ...",
  lobbyTitle: "Lobby",
  shareHint: "Teile diesen Code oder Link, damit Freunde beitreten können:",
  copyCode: "Code kopieren",
  copyLink: "Link kopieren",
  copied: "Kopiert!",
  players: "Mitspieler",
  hostBadge: "Gastgeber",
  youBadge: "Du",
  startGame: "Spiel starten",
  needMorePlayers: "Mindestens 3 Mitspieler nötig.",
  withSevens: "Mit 7ern (48 Karten)",
  withDabb: "Mit Dabb",
  teams: "In Teams (bei 4 oder 6)",
  autoPlay: "Auto-Zug bei Untätigkeit",
  autoPlayHint:
    "Reagiert ein Spieler nicht rechtzeitig, übernimmt der Computer seinen Zug.",
  autoPlayOff: "Aus",
  autoPlaySeconds: (seconds: number) => `${seconds} Sekunden`,
  yourTurnOnline: "Du bist dran",
  waitingForPlayer: (name: string) => `${name} ist am Zug ...`,
  computerBadge: "Computer",
  computerPlaysFor: (name: string) => `Computer spielt für ${name} ...`,
  leaveRoom: "Raum verlassen",
  newRound: "Neue Partie",
  waitingForRematch: "Warte auf eine neue Partie vom Gastgeber ...",
  chatTitle: "Chat",
  chatPlaceholder: "Nachricht schreiben ...",
  chatSend: "Senden",
  chatEmpty: "Noch keine Nachrichten. Schreib etwas!",
  chatYou: "Du",
  chatNewest: "neu",
  errorRoomNotFound:
    "Kein Raum mit diesem Code gefunden. Stimmt der Code, und läuft der Gastgeber noch?",
  hostLeftNotice:
    "Hinweis: Verlässt jemand die Seite, übernimmt der Computer seinen Sitz und die Partie läuft weiter - auch die Gastgeberrolle geht dann an einen anderen Spieler.",
} as const;

/** Label of each difficulty level. */
export const DIFFICULTY_LABELS: Readonly<Record<Difficulty, string>> = {
  leicht: "Leicht",
  mittel: "Mittel",
  schwer: "Schwer",
};

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
