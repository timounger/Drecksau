/**
 * Texts shared across the collection - the start page and the statistics page.
 *
 * @module
 * @remarks
 * Kept apart from any single game's texts so the shared overview and statistics
 * pages do not depend on a game's engine or wording.
 */

/** Texts of the start page - the game collection overview. */
export const COLLECTION_TEXTS = {
  title: "Spielesammlung",
  subtitle: "Wähle ein Spiel.",
  play: "Spielen",
  statistics: "Statistik",
  settings: "Einstellungen",
  moreSoon: "Weitere Spiele folgen.",
} as const;

/** Texts of the statistics page - one section per game. */
export const STATS_TEXTS = {
  title: "Statistik",
  subtitle: "Wird nur in deinem Browser gespeichert.",
  backToOverview: "Zurück zur Übersicht",
  backToGame: "Zurück zum Spiel",
  startedGames: "Spiele begonnen",
  finishedGames: "Abgeschlossen",
  abandonedGames: "Abgebrochen oder laufend",
  wins: "Gewonnen",
  losses: "Verloren",
  winRate: "Siegquote",
  totalPlayTime: "Gesamte Spielzeit",
  averagePlayTime: "Schnitt pro Spiel",
  fastestWin: "Schnellster Sieg",
  lastPlayed: "Zuletzt gespielt",
  nothingYet: "Noch nichts gespielt.",
  reset: "Statistik zurücksetzen",
  resetConfirm:
    "Wirklich alles zurücksetzen? Das laufende Spiel geht dabei verloren.",
  resetDone: "Zurückgesetzt.",
  noValue: "-",
} as const;
