/**
 * The German texts of Camel Up.
 *
 * @module
 * @remarks
 * All user facing wording in one place. The game's own vocabulary is kept as
 * the box prints it - Etappe, Wüstenplättchen, Pyramide - because that is what
 * somebody who knows the game will look for on screen.
 */

/** Every label the screens use. */
export const CAMEL_TEXTS = {
  title: "Camel Up",
  tagline: "Fünf Kamele, ein Stapel und viel zu viele Wetten.",
  newGame: "Neues Rennen",
  playOnline: "Online spielen",
  settings: "Einstellungen",
  statistics: "Statistik",
  backToGame: "Zurück zum Spiel",
  log: "Rennverlauf",

  settingsTitle: "Camel Up - Einstellungen",
  settingsSubtitle: "Wie viele am Rennen wetten.",
  playerCount: "Spielerzahl",
  playerCountHint:
    "Du und die Computergegner. Jede:r startet mit 3 Münzen und je einer Farbkarte pro Kamel.",
  settingsNote:
    "Änderungen gelten ab dem nächsten Rennen - das laufende bleibt, wie es ist.",

  leg: (n: number) => `Etappe ${n}`,
  diceLeft: (n: number) => `${n} Würfel in der Pyramide`,
  yourTurn: "Du bist dran",
  waitingFor: (name: string) => `${name} ist dran …`,

  coins: "Münzen",
  coinsShort: "M",
  youShort: "Du",
  botBadge: "Computer",
  tilePlaced: (space: number) => `Plättchen auf Feld ${space}`,
  tileInHand: "Plättchen noch in der Hand",
  raceCardsLeft: (n: number) => `${n} Farbkarten übrig`,

  chooseAction: "Wähle 1 Aktion",
  actionRoll: "Pyramide würfeln",
  actionRollHint: "Ein Würfel raus, das Kamel zieht - und du bekommst 1 Münze.",
  actionLegBet: "Etappenwette",
  actionLegBetHint:
    "Nimm die oberste Karte eines Kamels. Vorn: der Wert. Zweiter: 1. Sonst: -1.",
  actionRaceBet: "Gesamtwette",
  actionRaceBetHint:
    "Lege verdeckt eine Farbkarte auf Sieger oder Verlierer. Früh tippen zahlt besser.",
  actionTile: "Wüstenplättchen",
  actionTileHint:
    "Oase: 1 Feld vor, drauf. Fata Morgana: 1 Feld zurück, drunter. Du bekommst 1 Münze.",

  chooseCamel: "Auf welches Kamel?",
  chooseSide: "Sieger oder Verlierer?",
  chooseSpace: "Auf welches Feld?",
  chooseTile: "Welche Seite?",
  sideWinner: "Gesamtsieg",
  sideLoser: "Letzter Platz",
  tileOasis: "Oase (+1)",
  tileMirage: "Fata Morgana (-1)",
  cancel: "Abbrechen",
  nextPayout: (n: number) => `zahlt ${n}`,
  noCardsLeft: "keine Karte mehr",

  legOverTitle: (n: number) => `Etappe ${n} abgerechnet`,
  legFirst: (name: string) => `${name} vorn`,
  legSecond: (name: string) => `${name} dahinter`,
  nextLeg: "Nächste Etappe",

  gameOverTitle: "Endstand",
  raceWinner: (name: string) => `${name} gewinnt das Rennen`,
  raceLoser: (name: string) => `${name} wird letzter`,
  winner: (name: string) => `${name} hat das meiste Geld!`,
  winnerShared: (names: string) => `Gleichstand: ${names}`,
  playAgain: "Nochmal",

  trackTitle: "Rennstrecke",
  trackHint:
    "Oben auf dem Stapel heißt vorn: Wer getragen wird, ist vor dem, der trägt.",
  finishLine: "Ziel",
  legBetsTitle: "Etappenwetten",
  raceBetsTitle: "Gesamtwetten",
  winnerPile: (n: number) => `Sieger: ${n} verdeckt`,
  loserPile: (n: number) => `Verlierer: ${n} verdeckt`,
} as const;
