/**
 * The German words of the Sherlock Holmes puzzle collection: buttons,
 * labels and the names of the book's parts.
 *
 * @module
 */
import type { Part, Puzzle } from "@/games/sherlock/engine/types";

/** The words on the screen. */
export const SHERLOCK_TEXTS = {
  title: "Sherlock Holmes - Rätselsammlung",
  subtitle: "Rätsel aus der Baker Street - lesen, grübeln, Lösung prüfen",
  statistics: "Statistik",
  choosePuzzle: "Wähle ein Rätsel",
  search: "Suchen: Titel, englischer Titel oder Text",
  clearSearch: "Suche leeren",
  hideSolved: "Gelöste ausblenden",
  parts: "Teile des Buchs",
  allPuzzles: "Alle",
  noPuzzles: "Keine Rätsel passen zu dieser Auswahl.",
  open: "Rätsel öffnen",
  resume: "Weiter grübeln",
  solved: "Gelöst",
  markSolved: "Gelöst",
  markSolvedTitle: "Als gelöst markieren",
  markUnsolvedTitle: "Wieder als ungelöst markieren",
  toList: "Zu den Rätseln",
  previous: "Voriges Rätsel",
  next: "Nächstes Rätsel",
  englishNote: "Englisches Worträtsel - die Wörter bleiben englisch",
  original: "Original",
  reveal: "Lösung ansehen",
  hideSolution: "Lösung ausblenden",
  solution: "Lösung",
  revealed: "Lösung angesehen",
  clockTitle: "Zeit für dieses Rätsel",
  print: "Drucken / PDF",
  printTitle:
    "Das Rätsel als Druckseite in einem neuen Tab - mit der Lösung auf einer eigenen Seite",
  printMetaTitle: (name: string) => `Sherlock Holmes - ${name}`,
  printMetaDescription:
    "Ein Rätsel aus der Sherlock-Holmes-Rätselsammlung als Druckseite, die Lösung auf der zweiten Seite.",
  speak: "Vorlesen",
  speakSolution: "Lösung vorlesen",
  speakPause: "Pause",
  speakResume: "Weiter",
  speakStop: "Stopp",
  speakFromMarker: "ab Markierung",
  readFromHere: "Ab hier vorlesen",
  speechSettings: "Vorlese-Stimme",
  speechVoice: "Stimme",
  speechRate: "Tempo",
  speechNoVoice: "Standard des Browsers",
  number: (number: number) => `Nr. ${String(number)}`,
} as const;

/** The parts of the book, in German. */
export const PART_NAMES: Readonly<Record<Part, string>> = {
  elementary: "Elementar",
  straightforward: "Einfach",
  cunning: "Knifflig",
  fiendish: "Teuflisch",
};

/** How many magnifying glasses stand beside each part. */
export const PART_GLASSES: Readonly<Record<Part, number>> = {
  elementary: 1,
  straightforward: 2,
  cunning: 3,
  fiendish: 4,
};

/**
 * A part's name with its magnifying glasses.
 *
 * @param part - the part
 * @returns e.g. "Knifflig 🔍🔍🔍"
 */
export function partLabel(part: Part): string {
  return `${PART_NAMES[part]} ${"\u{1F50D}".repeat(PART_GLASSES[part])}`;
}

/**
 * A puzzle's name with its number, as the list and the print show it.
 *
 * @param puzzle - the puzzle
 * @returns e.g. "12. Am Strand"
 */
export function titleOf(puzzle: Puzzle): string {
  return `${String(puzzle.number)}. ${puzzle.title}`;
}
