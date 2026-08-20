/**
 * The German texts of Flip 7.
 *
 * @module
 */

/** Every label the screens use. */
export const F7_TEXTS = {
  title: "Flip 7",
  tagline: "Sieben verschiedene Zahlen - oder eine zu viel.",
  newGame: "Neues Spiel",
  playOnline: "Online spielen",
  settings: "Einstellungen",
  statistics: "Statistik",
  backToGame: "Zurück zum Spiel",
  log: "Verlauf",

  settingsTitle: "Flip 7 - Einstellungen",
  settingsSubtitle: "Wie viele am Tisch sitzen.",
  playerCount: "Spielerzahl",
  playerCountHint:
    "Du und deine Computergegner, drei bis acht am Tisch. Die Anleitung nennt drei als Minimum.",
  settingsNote:
    "Änderungen gelten ab dem nächsten Spiel - das laufende bleibt, wie es ist.",

  yourTurn: "Du bist dran",
  waitingFor: (name: string) => `${name} ist dran …`,
  round: (n: number) => `Runde ${n}`,
  dealer: "Geber",
  target: (n: number) => `Ziel: ${n} Punkte`,
  deckLeft: (n: number) => `Stapel: ${n}`,
  discardLeft: (n: number) => `Ablage: ${n}`,

  hit: "Karte",
  stay: "Stopp",
  stayValue: (n: number) => `Stopp (${n})`,
  flip: (n: number) => (n === 1 ? "Letzte umdrehen" : `Umdrehen (noch ${n})`),
  nextRound: "Nächste Runde",
  pointAt: "Auf wen?",
  pointHint: (card: string) => `${card} - such dir jemanden aus.`,
  cannotStay: "Ohne Karte kannst du nicht stoppen.",

  risk: (percent: number) => `${percent}% Bustgefahr`,
  riskSafe: "Keine Gefahr",
  deadly: "Doppelt wäre raus:",
  oneAway: "Noch eine Zahl bis Flip 7!",

  yourCards: "Deine Karten",
  numbers: "Zahlen",
  modifiers: "Modifikatoren",
  secondChance: "Zweite Chance",
  busted: "Raus",
  stayed: "Gestoppt",
  stillIn: "Im Spiel",
  points: (n: number) => `${n} Punkte`,
  roundPoints: (n: number) => (n === 0 ? "0" : `+${n}`),

  roundOver: "Runde vorbei",
  flipSeven: (name: string) => `${name} hat Flip 7 geschafft!`,
  gameOverTitle: "Spiel vorbei",
  winner: (name: string) => `Gewonnen: ${name}`,
  winners: (names: string) => `Gleichstand: ${names}`,
  playAgain: "Neues Spiel",
  total: "Gesamt",
} as const;
