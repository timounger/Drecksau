/**
 * The German texts of Heckmeck am Bratwurmeck.
 *
 * @module
 */

/** Every label the screens use. */
export const HECKMECK_TEXTS = {
  title: "Heckmeck am Bratwurmeck",
  tagline: "Acht Würfel, sechzehn Chips - und ein Wurm, ohne den nichts zählt.",
  newGame: "Neues Spiel",
  playOnline: "Online spielen",
  settings: "Einstellungen",
  statistics: "Statistik",
  backToGame: "Zurück zum Spiel",
  log: "Verlauf",

  settingsTitle: "Heckmeck - Einstellungen",
  settingsSubtitle: "Wie viele um die Würmer würfeln.",
  playerCount: "Spielerzahl",
  playerCountHint:
    "Du und die Computergegner. Gespielt wird, bis kein Chip mehr auf dem Grill liegt.",
  settingsNote:
    "Änderungen gelten ab dem nächsten Spiel - das laufende bleibt, wie es ist.",

  grill: "Grill",
  burnt: "Aus dem Spiel",
  grillEmpty: "Der Grill ist leer.",
  dice: "Auf dem Tisch",
  kept: "Beiseitegelegt",
  keptNone: "Noch nichts beiseitegelegt.",
  sum: (n: number) => `Summe ${n}`,
  noWormYet: "Noch kein Wurm - so zählt nichts davon.",
  hasWorm: "Wurm gesichert",

  yourTurn: "Du bist dran",
  waitingFor: (name: string) => `${name} ist dran …`,
  pickPrompt: "Lege einen Wert beiseite",
  pickHint:
    "Alle Würfel dieses Werts wandern zur Seite. Jeden Wert nur einmal - das ist der ganze Haken.",
  pickFace: (face: string, count: number) => `${count}× ${face}`,
  decidePrompt: "Weiter würfeln oder aufhören?",
  rollOn: (n: number) => `${n} Würfel werfen`,
  takeTile: (tile: number) => `Chip ${tile} nehmen`,
  stealFrom: (tile: number, name: string) => `Chip ${tile} von ${name} klauen`,
  nothingToTake: "Nichts zu holen - du musst weiterwürfeln.",
  wormMissing: (tile: number | null) =>
    tile === null
      ? "Etwas wäre in Reichweite - aber ohne Wurm zählt nichts."
      : `Chip ${tile} wäre in Reichweite - aber ohne Wurm zählt nichts.`,

  bustTitle: "Verspekuliert!",
  bustReturned: (tile: number) => `Chip ${tile} geht zurück auf den Grill.`,
  bustBurnt: (tile: number) => `Chip ${tile} fliegt aus dem Spiel.`,
  tookTile: (name: string, tile: number) => `${name} nimmt Chip ${tile}.`,
  stoleTile: (name: string, tile: number, from: string) =>
    `${name} klaut Chip ${tile} von ${from}.`,

  worms: "Würmer",
  stack: "Stapel",
  stackEmpty: "noch nichts",
  topTile: (tile: number) => `oben: ${tile}`,

  gameOverTitle: "Endstand",
  winner: (name: string) => `${name} gewinnt!`,
  winnerShared: (names: string) => `Gleichstand: ${names}`,
  playAgain: "Nochmal",
} as const;
