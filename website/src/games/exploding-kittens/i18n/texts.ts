/**
 * The German texts of Exploding Kittens.
 *
 * @module
 * @remarks
 * The rulebook is English, the game is not. The card names are the ones the
 * German edition uses; only "Nö!" and "Tacocat" stay as they are, because both
 * are already the joke.
 */

/** Every label the screens use. */
export const EK_TEXTS = {
  title: "Exploding Kittens",
  tagline: "Zieh keine Bombe. Wer als Letzter übrig ist, gewinnt.",
  newGame: "Neues Spiel",
  playOnline: "Online spielen",
  settings: "Einstellungen",
  statistics: "Statistik",
  backToGame: "Zurück zum Spiel",
  log: "Verlauf",

  settingsTitle: "Exploding Kittens - Einstellungen",
  settingsSubtitle: "Wie viele am Tisch sitzen und wie schnell es gehen soll.",
  playerCount: "Spielerzahl",
  playerCountHint: "Du und deine Computergegner, zwei bis fünf am Tisch.",
  fastGame: "Schnelles Spiel",
  fastGameHint:
    "Ein Drittel des Decks kommt ungesehen raus - kürzere Partie, mehr Nervenkitzel. Die Anleitung empfiehlt es zu zweit und zu dritt.",
  fastOn: "An",
  fastOff: "Aus",
  settingsNote:
    "Änderungen gelten ab dem nächsten Spiel - das laufende bleibt, wie es ist.",

  yourTurn: "Du bist dran",
  waitingFor: (name: string) => `${name} ist dran …`,

  phasePlay: "Spielen oder ziehen",
  phasePlayHint:
    "So viele Karten ausspielen, wie du magst - danach ziehst du eine und dein Zug ist vorbei.",
  phaseNope: "Nö?",
  phaseNopeHint: "Noch kann jemand dazwischenfunken.",
  phaseFavor: "Gefallen",
  phaseInsert: "Wo soll es hin?",
  phaseInsertHint:
    "Steck das Kätzchen heimlich zurück in den Stapel. Niemand sieht, wohin.",

  turnsOwed: (n: number) => `${n} Züge übrig`,
  drawPile: (n: number) => `Nachziehstapel: ${n}`,
  discardPile: (n: number) => `Ablage: ${n}`,
  kittensLeft: (n: number) =>
    n === 1 ? "1 Kätzchen im Stapel" : `${n} Kätzchen im Stapel`,
  risk: (percent: number) => `${percent}% Bombenrisiko`,

  play: "Spielen",
  drawCard: "Karte ziehen (Zug beenden)",
  comboSteal: "Zwei gleiche: Karte klauen",
  comboName: "Drei gleiche: Karte fordern",
  chooseTarget: "Wen?",
  chooseWanted: "Welche Karte willst du?",
  cancel: "Abbrechen",
  nope: "Nö!",
  yup: "Doch!",
  letThrough: "Durchlassen",
  give: "Diese Karte geben",
  giveHint: (name: string) =>
    `${name} will eine Karte von dir - du suchst aus.`,
  insertAt: (at: number, total: number) =>
    at === 0
      ? `ganz oben (0 Karten darüber)`
      : at >= total
        ? `ganz unten (${at} Karten darüber)`
        : `${at} Karten darüber`,
  insertTop: "Ganz oben",
  insertBottom: "Ganz unten",
  insertDo: "Verstecken",

  yourHand: "Deine Karten",
  hand: "Hand",
  handEmpty: "Keine Karten mehr - zieh einfach.",
  handCount: (n: number) => (n === 1 ? "1 Karte" : `${n} Karten`),
  onlyCats: "Katzenkarten wirken nur paarweise.",
  peekTitle: "Blick in die Zukunft",
  peekHint: "Von oben nach unten - nur du siehst das.",
  dead: "Explodiert",
  alive: "Im Spiel",
  place: (n: number) => `${n}.`,

  gameOverTitle: "Spiel vorbei",
  winner: (name: string) => `${name} gewinnt!`,
  winnerYou: "Du gewinnst!",
  playAgain: "Neues Spiel",
} as const;
