/**
 * The German texts of Kuhle Kühe.
 *
 * @module
 */

/** Every label the screens use. */
export const KUHLE_TEXTS = {
  title: "Kuhle Kühe",
  tagline: "Baut die längsten Kühe und die größte Herde.",
  newGame: "Neues Spiel",
  playOnline: "Online spielen",
  settings: "Einstellungen",
  statistics: "Statistik",
  backToGame: "Zurück zum Spiel",
  log: "Verlauf",

  settingsTitle: "Kuhle Kühe - Einstellungen",
  settingsSubtitle: "Wie viele am Tisch sitzen.",
  playerCount: "Spielerzahl",
  playerCountHint: "Du und deine Computergegner, zwei bis fünf am Tisch.",
  settingsNote:
    "Änderungen gelten ab dem nächsten Spiel - das laufende bleibt, wie es ist.",

  yourTurn: "Du bist dran",
  waitingFor: (name: string) => `${name} ist dran …`,
  phaseDraw: "Karten holen",
  phaseDrawHint: "Zwei ziehen, eine Kuhkarte vom Ablagestapel, oder Kuhhandel.",
  phasePlay: "Karten ausspielen",
  phasePlayHint:
    "So viele Kühe und Aktionskarten, wie du willst. Jede Kuh braucht Kopf und Hinterteil.",
  phaseTrade: "Kuhhandel",
  phaseTradeHint: "Alle geben zwei Karten nach links.",
  phaseDefend: "Angriff!",

  drawTwo: "Zwei Karten ziehen",
  fromDiscard: "Vom Ablagestapel nehmen",
  callTrade: "Kuhhandel auslösen",
  tradeBlocked: "In der letzten Runde nicht mehr möglich",
  passCards: "Diese zwei geben",
  layCow: "Kuh auslegen",
  layCalf: "Kalb auslegen",
  endTurn: "Muh! (Zug beenden)",
  defend: "Herdenhund einsetzen",
  letThrough: "Durchlassen",
  attackedBy: (who: string, what: string) =>
    `${who} spielt ${what} gegen dich.`,

  yourHand: "Deine Karten",
  handEmpty: "Keine Karten auf der Hand.",
  handCount: (n: number) => `${n} Karten`,
  drawPile: (n: number) => `Nachziehstapel: ${n}`,
  discardPile: "Ablagestapel",
  discardEmpty: "noch leer",
  herd: "Herde",
  herdEmpty: "Noch keine Kuh.",
  calves: "Kälber",
  lastRound: "Letzte Runde!",
  chooseTarget: "Ziel wählen",
  chooseCow: "Kuh wählen",
  chooseMiddle: "Mittelteil wählen",
  cancel: "Abbrechen",
  guarded: "Geschützt",

  awardFirst: "Erste Kuh",
  awardBiggest: "Größte Herde",
  awardLongest: "Längste Kuh",

  pure: "reinrassig",
  mixed: "gemischt",
  points: "Punkte",
  gameOverTitle: "Endstand",
  winner: (name: string) => `${name} gewinnt!`,
  winners: (names: string) => `Gleichstand: ${names}`,
  playAgain: "Neues Spiel",
} as const;
