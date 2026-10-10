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
  veryEasy: "Sehr leicht",
  easy: "Leicht",
  medium: "Mittel",
  hard: "Schwer",
  expert: "Experte",
  family: "Familie",
  treasure: "Schatzsuche",
};

/** How the traits of suspects are shown on their cards. */
export const TRAIT_NAMES: Readonly<Record<string, string>> = {
  cap: "\u{1F9E2} Kappe",
  eyepatch: "\u{1F3F4}\u200D\u2620\uFE0F Augenklappe",
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
  search: "Fall suchen ...",
  hideSolved: "Gelöste ausblenden",
  noCases: "Kein Fall passt dazu.",
  solved: "Gelöst",
  resume: "Weiter",
  open: "Ermitteln",
  toCases: "Alle Fälle",
  playOnline: "Gemeinsam online",
  suspects: "Die Verdächtigen",
  victim: "Das Opfer",
  treasure: "Der Schatz",
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
  revealTreasureText:
    "Alle Personen erscheinen auf ihrem Feld und der Schatz wird gefunden. Du kannst die Lösung wieder ausblenden und mit deinen eigenen Notizen weiterknobeln - der Fall zählt dann aber nicht mehr als gelöst.",
  hideSolution: "Lösung ausblenden",
  rightPeeked: (name: string, culprit: string) =>
    `Richtig, ${name} ist ${culprit} - mit Blick in die Lösung.`,
  revealYes: "Ja, Lösung zeigen",
  revealNo: "Weiter knobeln",
  confirm: "Bestätigen",
  confirmHint: "Erst wenn alle Personen und das Opfer fest gesetzt sind.",
  confirmTreasureHint:
    "Erst wenn alle Personen und der Schatz fest gesetzt sind.",
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
  treasureRight: (row: number, col: number) =>
    `Richtig! Der Schatz liegt in Reihe ${String(row)}, Spalte ${String(col)}. Fall gelöst.`,
  treasureRightPeeked: (row: number, col: number) =>
    `Richtig, der Schatz liegt in Reihe ${String(row)}, Spalte ${String(col)} - mit Blick in die Lösung.`,
  treasureGaveUp: (row: number, col: number) =>
    `Aufgelöst: Der Schatz liegt in Reihe ${String(row)}, Spalte ${String(col)}.`,
  hintsUsed: (count: number) => (count === 1 ? "1 Tipp" : `${count} Tipps`),
  time: (minutes: number, seconds: number) =>
    `${minutes}:${String(seconds).padStart(2, "0")}`,
  boardLabel: (name: string) => `Karte des Falls ${name}`,
  noSolution: "Dieser Fall hat keine eindeutige Lösung.",
} as const;

/**
 * What the culprit is called - in the female form when it is a woman.
 *
 * @param level - the case, with its word for the culprit
 * @param id - the culprit
 * @returns e.g. "der Dieb", or "die Diebin" for a woman
 * @remarks
 * German makes the word follow the person: der Dieb, die Diebin; der Täter,
 * die Täterin; der Mörder, die Mörderin - the same pattern for all of them.
 */
export function culpritWord(level: Level, id: string): string {
  const woman = level.suspects.find((one) => one.id === id)?.pronoun === "sie";
  const word = level.culprit.name;
  return woman && word.startsWith("der ")
    ? `die ${word.slice("der ".length)}in`
    : word;
}

/**
 * What the dialog says once the case is solved: who the culprit is - or, in a
 * treasure hunt, where the treasure lies.
 *
 * @param level - the case
 * @param who - the culprit, or the treasure
 * @param peeked - whether the solution was looked at first
 * @returns the sentence
 */
export function solvedText(level: Level, who: string, peeked: boolean): string {
  const at = treasureAt(level);
  const name = level.suspects.find((one) => one.id === who)?.name ?? "?";
  let text: string;
  if (at !== null) {
    text = peeked
      ? MURDOKU_TEXTS.treasureRightPeeked(at.row, at.col)
      : MURDOKU_TEXTS.treasureRight(at.row, at.col);
  } else {
    text = peeked
      ? MURDOKU_TEXTS.rightPeeked(name, culpritWord(level, who))
      : MURDOKU_TEXTS.right(name, culpritWord(level, who));
  }
  return text;
}

/**
 * What is said under the map while the solution is shown.
 *
 * @param level - the case
 * @param who - the culprit, or the treasure
 * @returns the sentence
 */
export function revealedText(level: Level, who: string): string {
  const at = treasureAt(level);
  const name = level.suspects.find((one) => one.id === who)?.name ?? "?";
  return at === null
    ? MURDOKU_TEXTS.gaveUp(name, culpritWord(level, who))
    : MURDOKU_TEXTS.treasureGaveUp(at.row, at.col);
}

/** Where the treasure of a treasure hunt lies, counted from 1 - or null. */
function treasureAt(level: Level): { row: number; col: number } | null {
  const cell =
    level.treasure === undefined ? undefined : level.solution[level.treasure];
  return cell === undefined ? null : { row: cell.row + 1, col: cell.col + 1 };
}

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
