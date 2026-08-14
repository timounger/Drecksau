/**
 * The German texts of Kniffel.
 *
 * @module
 */

/** Every label the screens use. */
export const KNIFFEL_TEXTS = {
  title: "Kniffel",
  tagline: "Fünf Würfel, drei Würfe, dreizehn Felder - und jedes nur einmal.",
  newGame: "Neues Spiel",
  playOnline: "Online spielen",
  settings: "Einstellungen",
  statistics: "Statistik",
  backToGame: "Zurück zum Spiel",
  log: "Verlauf",

  settingsTitle: "Kniffel - Einstellungen",
  settingsSubtitle: "Wie viele einen Block ausfüllen.",
  playerCount: "Spielerzahl",
  playerCountHint:
    "Du und die Computergegner. Eins bedeutet allein gegen den eigenen Rekord - so hat Kniffel die meisten Abende verbracht.",
  settingsNote:
    "Änderungen gelten ab dem nächsten Spiel - das laufende bleibt, wie es ist.",

  round: (n: number) => `Runde ${n} von 13`,
  yourTurn: "Du bist dran",
  waitingFor: (name: string) => `${name} ist dran …`,
  rollsLeft: (n: number) =>
    n === 0
      ? "Keine Würfe mehr - jetzt eintragen"
      : n === 1
        ? "Noch 1 Wurf"
        : `Noch ${n} Würfe`,
  roll: "Würfeln",
  holdHint: "Klick auf einen Würfel, um ihn zu behalten.",
  held: "behalten",
  enterHint: "Klick auf ein freies Feld, um den Wurf einzutragen.",
  zeroWarning: "Dieses Feld gibt 0 - du streichst es damit.",

  upper: "Oberer Teil",
  lower: "Unterer Teil",
  sum: "Summe",
  bonus: (target: number) => `Bonus ab ${target}`,
  bonusShort: "Bonus",
  totalLabel: "Gesamt",
  free: "frei",

  gameOverTitle: "Endstand",
  winner: (name: string) => `${name} gewinnt!`,
  winnerShared: (names: string) => `Gleichstand: ${names}`,
  soloResult: (points: number) => `${points} Punkte.`,
  playAgain: "Nochmal",
} as const;
