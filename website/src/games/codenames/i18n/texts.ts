/**
 * The German texts of Codenames.
 *
 * @module
 */

/** Every label the screens use. */
export const CN_TEXTS = {
  title: "Codenames",
  tagline: "Ein Wort, eine Zahl - und der Attentäter wartet.",
  newGame: "Neues Spiel",
  playOnline: "Online spielen",
  statistics: "Statistik",
  backToGame: "Zurück zum Spiel",
  log: "Verlauf",

  yourTurn: "Ihr seid dran",
  waitingFor: (name: string) => `${name} ist dran …`,
  teamTurn: (team: string) => `${team} ist am Zug`,

  phaseClue: "Hinweis geben",
  phaseGuess: "Raten",
  spymasterHint:
    "Ein Wort und eine Zahl. Das Wort darf keines sein, das noch offen auf dem Tisch liegt.",
  operativeHint:
    "Tippt auf ein Wort. Richtig geraten heißt weiterraten - daneben heißt Zug vorbei.",
  waitingForClue: "Wartet auf den Hinweis …",

  clueWord: "Hinweis",
  cluePlaceholder: "z. B. Tier",
  clueCount: "Zahl",
  clueUnlimited: "unbegrenzt",
  giveClue: "Hinweis geben",
  clueOnBoard: "Das Wort liegt noch auf dem Tisch.",
  clueOneWord: "Nur ein Wort.",
  clueOn: (word: string, count: number) =>
    count === 0 ? `${word} · unbegrenzt` : `${word} · ${count}`,
  guessesLeft: (n: number) => (n === 1 ? "noch 1 Tipp" : `noch ${n} Tipps`),
  guessesUnlimited: "so viele ihr wollt",
  stop: "Aufhören",
  mustGuessOnce: "Einmal müsst ihr raten.",

  youAre: (team: string, role: string) => `Du: ${team}, ${role}`,
  spymaster: "Geheimdienstchef",
  operative: "Ermittler",
  keyHidden: "Du siehst den Schlüssel nicht - das ist der Sinn der Sache.",
  keyShown: "Du siehst den Schlüssel. Nicht verraten.",

  agentsLeft: (team: string, n: number) => `${team}: ${n}`,
  bystander: "Unbeteiligt",
  assassin: "Attentäter",
  team: "Team",

  gameOverTitle: "Spiel vorbei",
  winner: (team: string) => `${team} gewinnt!`,
  wonByAssassin: (team: string) =>
    `${team} hat den Attentäter erwischt und verliert sofort.`,
  youWon: "Ihr gewinnt!",
  youLost: "Ihr verliert.",
  playAgain: "Neues Spiel",
  revealAll: "Der Schlüssel",
} as const;
