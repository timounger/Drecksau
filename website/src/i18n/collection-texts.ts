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
  /** The way out of a game, in the header of every game screen. */
  backToCollection: "Zurück zur Spielesammlung",
  play: "Spielen",
  statistics: "Statistik",
  settings: "Einstellungen",
  popular: "Beliebt",
  popularHint: (days: number) =>
    `Am längsten gespielt in den letzten ${days} Tagen.`,
  newest: "Neu",
  newestHint: (days: number) =>
    `In den letzten ${days} Tagen neu dazugekommen.`,
  jump: "Bereiche",
  heroEyebrow: "Zuletzt gespielt",
  heroPlay: "Weiterspielen",
  searchPlaceholder: "Spiel suchen ...",
  noResults: "Keine Spiele gefunden.",
} as const;

/** Texts of the statistics page - one section per game. */
/**
 * The developer's usage dashboard, which only shows up with `?stats`.
 *
 * @remarks
 * Its own block rather than part of {@link STATS_TEXTS}: those are the numbers
 * a player sees about themselves, these are the numbers about everybody, and
 * the two have nothing to do with each other beyond the word "Statistik".
 */
export const USAGE_TEXTS = {
  title: "Aufrufstatistik",
  loading: "wird geladen …",
  failed: "Keine Verbindung zur Datenbank.",
  window: (days: number): string => `Balken: letzte ${String(days)} Tage`,
  visits: "Aufrufe gesamt",
  starts: "Spiele gestartet",
  playTime: "Spielzeit gesamt",
  todayLabel: "Aufrufe heute",
  recent: (week: string, month: string): string =>
    `${week} in 7 Tagen · ${month} in 30`,
  week: (time: string): string => `${time} in 7 Tagen`,
  perDay: (average: string): string => `Ø ${average} pro Tag (30 Tage)`,
  peak: (count: string): string => `Spitze ${count}`,
  game: "Spiel",
  colVisits: "Aufrufe",
  colWeek: "7 T",
  colMonth: "30 T",
  colStarts: "Starts",
  colTime: "Spielzeit",
  colLast: "Zuletzt",
  startPage: "Startseite",
  devices: "Geräte",
  deviceNames: {
    windows: "Windows",
    android: "Android",
    ios: "iPhone / iPad",
    mac: "Mac",
    linux: "Linux",
    chromeos: "ChromeOS",
    other: "Sonstige",
  } as Readonly<Record<string, string>>,
  deviceNote:
    "Je Besuch und Tab eine Zahl, aus der groben Art des Geräts - keine Version, kein Browser, kein Bildschirm: mehrere davon zusammen wären ein Fingerabdruck.",
  never: "–",
  note: "Gezählt wird pro Spiel und UTC-Tag: ein Aufruf je Seite und Browser-Tab, ein Start je begonnenem Spiel, dazu die Spielzeit aus der Beliebt-Liste. Gespeichert sind nur Zahlen - keine Kennung, keine Adresse, kein Gerät; deshalb braucht das auch keinen Banner. Die Seite ist unauffällig, aber nicht geheim: Wer die Adresse kennt, sieht sie, und die Zahlen stehen in derselben Datenbank wie die Online-Partien.",
} as const;

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
