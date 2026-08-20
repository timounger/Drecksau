/**
 * The German texts of Jammerlappen.
 *
 * @module
 */

/** Every label the screens use. */
export const JAMMER_TEXTS = {
  title: "Jammerlappen",
  tagline: "Wer als Letzter auf seinen Karten sitzt, hat verloren.",
  newGame: "Neues Spiel",
  playOnline: "Online spielen",
  settings: "Einstellungen",
  statistics: "Statistik",
  backToGame: "Zurück zum Spiel",
  log: "Verlauf",

  settingsTitle: "Jammerlappen - Einstellungen",
  settingsSubtitle: "Wie viele am Tisch sitzen.",
  playerCount: "Spielerzahl",
  playerCountHint:
    "Du und deine Computergegner, zwei bis sechs am Tisch. Zu zweit wird mit dem kleinen Deck gespielt.",
  settingsNote:
    "Änderungen gelten ab dem nächsten Spiel - das laufende bleibt, wie es ist.",

  yourTurn: "Du bist dran",
  waitingFor: (name: string) => `${name} ist dran …`,

  phaseSwap: "Einmal tauschen",
  phaseSwapHint:
    "Eine Handkarte gegen eine offene Karte - einmal, jetzt oder gar nicht. Die verdeckten Karten bleiben, wie sie liegen.",
  swapDo: "Tauschen",
  swapKeep: "So lassen",
  swapPickHand: "Wähle eine Handkarte und eine offene Karte.",
  swapWaiting: "Warte auf die anderen …",
  swapDone: "Getauscht",

  phasePlay: "Ablegen",
  needsAtLeast: (value: number) => `Mindestens die ${value}`,
  needsAtMost: (value: number) => `Höchstens die ${value} - es geht abwärts`,
  anythingGoes: "Du darfst legen, was du willst",
  descending: "Runter geht's",
  potSize: (n: number) => `Pot: ${n}`,
  potEmpty: "Der Pot ist leer",
  drawPile: (n: number) => `Aufnahmestapel: ${n}`,
  drawEmpty: "Aufnahmestapel leer - jetzt zählt, was noch da ist",
  burned: (n: number) => `${n} Karten aus dem Spiel`,
  clockwise: "im Uhrzeigersinn",
  counterClockwise: "gegen den Uhrzeigersinn",

  play: "Legen",
  playCount: (n: number) => (n > 1 ? `${n} legen` : "Legen"),
  takePot: "Pot aufnehmen",
  takePotStuck: "Du kannst nicht legen - Pot aufnehmen",
  blindHint: "Verdeckte Karte blind spielen",
  forcedHint:
    "Keine deiner offenen Karten passt - lege eine und nimm den Pot dazu.",
  jumpIn: "Zwischenschmeißen!",
  jumpInHint: (value: number) =>
    `Du kannst das Quartett der ${value} vollmachen`,

  yourHand: "Deine Handkarten",
  hand: "Hand",
  handEmpty: "Keine Handkarten mehr - jetzt kommt der Tisch dran.",
  handCount: (n: number) => (n === 1 ? "1 Karte" : `${n} Karten`),
  openCards: "Offen",
  hiddenCards: "Verdeckt",
  tableLocked: "Erst wenn die Hand leer ist",
  cardsLeft: (n: number) => `${n} übrig`,
  out: "Geschafft!",
  place: (n: number) => `${n}.`,

  gameOverTitle: "Runde vorbei",
  loser: (name: string) => `${name} ist der Jammerlappen.`,
  loserYou: "Du bist der Jammerlappen.",
  order: "Reihenfolge",
  playAgain: "Neues Spiel",
} as const;
