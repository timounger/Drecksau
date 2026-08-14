/**
 * The German texts of Qwixx.
 *
 * @module
 */

/** Every label the screens use. */
export const QWIXX_TEXTS = {
  title: "Qwixx",
  tagline: "Würfeln, ankreuzen - und alles überspringen, was dazwischen lag.",
  newGame: "Neues Spiel",
  playOnline: "Online spielen",
  settings: "Einstellungen",
  statistics: "Statistik",
  backToGame: "Zurück zum Spiel",
  log: "Verlauf",

  settingsTitle: "Qwixx - Einstellungen",
  settingsSubtitle: "Wie viele mitwürfeln.",
  playerCount: "Spielerzahl",
  playerCountHint:
    "Du und die Computergegner. Jede:r hat einen eigenen Zettel, gewürfelt wird reihum.",
  settingsNote:
    "Änderungen gelten ab dem nächsten Spiel - das laufende bleibt, wie es ist.",

  dice: "Würfel",
  whiteSum: (sum: number) => `Weiß zusammen: ${sum}`,
  activeIs: (name: string) => `${name} würfelt`,
  youRoll: "Du würfelst",

  phaseWhite: "Weiße Würfel - alle dürfen",
  phaseWhiteHint:
    "Kreuze die weiße Summe in einer Reihe an, oder verzichte. Das darf jede:r.",
  phaseColour: "Farbwürfel - nur du",
  phaseColourHint:
    "Ein weißer Würfel plus ein Farbwürfel, angekreuzt in dieser Farbe.",
  waitingFor: (name: string) => `Warte auf ${name} …`,
  waitingForOthers: (n: number) =>
    n === 1 ? "Noch 1 Mitspieler entscheidet …" : `Noch ${n} entscheiden …`,
  alreadyDecided: "Du hast entschieden.",

  pass: "Verzichten",
  passWarning: "Verzichten kostet dich einen Fehlwurf.",
  yourSheet: "Dein Zettel",
  penalties: "Fehlwürfe",
  locked: "geschlossen",
  rowPoints: (n: number) => `${n} Pkt`,
  lockOpen: "Schloss frei",
  burns: (n: number) =>
    n === 1 ? "verbrennt 1 Zahl" : `verbrennt ${n} Zahlen`,
  points: "Punkte",

  gameOverTitle: "Endstand",
  winner: (name: string) => `${name} gewinnt!`,
  winnerShared: (names: string) => `Gleichstand: ${names}`,
  playAgain: "Nochmal",
  endedByLocks: "Zwei Reihen sind geschlossen.",
  endedByPenalties: (name: string) => `${name} hat vier Fehlwürfe.`,
} as const;
