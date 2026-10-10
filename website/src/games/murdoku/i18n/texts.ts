/**
 * Everything Murdoku says on screen, in German.
 *
 * @module
 * @remarks
 * The clues themselves are not here: each case carries its own sentences,
 * translated from the printed page, beside the checks behind them.
 */
import type { Difficulty, Level, Suspect } from "../engine/types";

/** What the difficulties are called. */
export const DIFFICULTY_NAMES: Readonly<Record<Difficulty, string>> = {
  easy: "Leicht",
  medium: "Mittel",
  hard: "Schwer",
  expert: "Experte",
};

/** How the traits of suspects are shown on their cards. */
export const TRAIT_NAMES: Readonly<Record<string, string>> = {
  cap: "\u{1F9E2} Kappe",
  glasses: "\u{1F453} Brille",
  hat: "\u{1F3A9} Hut",
  visitor: "Besucher",
  zookeeper: "Tierpfleger",
};

/** The fixed texts. */
export const MURDOKU_TEXTS = {
  title: "Murdoku",
  subtitle: "Ein Kriminalrätsel wie ein Sudoku",
  cases: "Fälle",
  chooseCase: "Wähle einen Fall",
  difficulty: "Schwierigkeit",
  allCases: "Alle",
  solved: "Gelöst",
  resume: "Weiter",
  open: "Ermitteln",
  toCases: "Alle Fälle",
  playOnline: "Gemeinsam online",
  suspects: "Die Verdächtigen",
  victim: "Das Opfer",
  placed: "gesetzt",
  undo: "Rückgängig",
  restart: "Von vorn",
  hint: "Tipp",
  nextCase: "Nächster Fall",
  clockTitle: "So lange arbeitest du schon an diesem Fall",
  statistics: "Statistik",
  hintHold:
    "Klick: nächster Tipp. Eine Sekunde halten: alle Tipps zeigen und ausführen.",
  canStand: "Hier kann jemand sein",
  cannotStand: "Hier kann niemand sein",
  water: "Wasser",
  hideHints: "Tipps ausblenden",
  applyHint: "Ausführen",
  reveal: "Lösung zeigen",
  revealTitle: "Lösung zeigen?",
  revealText:
    "Alle Personen erscheinen auf ihrem Feld und der Täter wird genannt. Du kannst die Lösung wieder ausblenden und mit deinen eigenen Notizen weiterknobeln - der Fall zählt dann aber nicht mehr als gelöst.",
  hideSolution: "Lösung ausblenden",
  rightPeeked: (name: string, culprit: string) =>
    `Richtig, ${name} ist ${culprit} - mit Blick in die Lösung.`,
  revealYes: "Ja, Lösung zeigen",
  revealNo: "Weiter knobeln",
  confirm: "Bestätigen",
  confirmHint: "Erst wenn alle Personen und das Opfer fest gesetzt sind.",
  solvedTitle: "Fall gelöst!",
  wrongTitle: "Noch nicht ganz",
  wrongCount: (wrong: number, all: number) =>
    wrong === 1
      ? `1 von ${String(all)} steht falsch - rot umkreist.`
      : `${String(wrong)} von ${String(all)} stehen falsch - rot umkreist.`,
  replay: "Nochmal",
  edit: "Bearbeiten",
  close: "Schließen",
  right: (name: string, culprit: string) =>
    `Richtig! ${name} ist ${culprit}. Fall gelöst.`,
  gaveUp: (name: string, culprit: string) =>
    `Aufgelöst: ${name} war ${culprit}.`,
  hintsUsed: (count: number) => (count === 1 ? "1 Tipp" : `${count} Tipps`),
  time: (minutes: number, seconds: number) =>
    `${minutes}:${String(seconds).padStart(2, "0")}`,
  boardLabel: (name: string) => `Karte des Falls ${name}`,
  noSolution: "Dieser Fall hat keine eindeutige Lösung.",
} as const;

/**
 * A suspect's clue as printed.
 *
 * @param level - the case
 * @param suspect - whose clue
 * @returns what the clue card says
 */
export function clueText(level: Level, suspect: Suspect): string {
  void level;
  return suspect.clue.text;
}
