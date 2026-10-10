/**
 * Everything Murdoku says on screen, in German.
 *
 * @module
 * @remarks
 * The clues are not written out per case but put together from the clue
 * itself ({@link clueText}): a case only says "beside a boar", and the
 * sentence follows. That way a clue on screen can never say something other
 * than what the referee checks.
 */
import type { Clue, Difficulty, Level, Suspect, Thing } from "../engine/types";

/** How each thing is spoken of. */
const THINGS: Readonly<
  Record<
    Thing,
    { readonly name: string; readonly on: string; readonly beside: string }
  >
> = {
  house: { name: "Haus", on: "in einem Haus", beside: "einem Haus" },
  boat: { name: "Boot", on: "auf einem Boot", beside: "einem Boot" },
  tree: { name: "Baum", on: "auf einem Baum", beside: "einem Baum" },
  shrub: { name: "Strauch", on: "in einem Strauch", beside: "einem Strauch" },
  shark: { name: "Hai", on: "bei einem Hai", beside: "einem Hai" },
  boar: {
    name: "Wildschwein",
    on: "bei einem Wildschwein",
    beside: "einem Wildschwein",
  },
  boulder: { name: "Felsen", on: "auf einem Felsen", beside: "einem Felsen" },
  cactus: { name: "Kaktus", on: "bei einem Kaktus", beside: "einem Kaktus" },
};

/**
 * What a thing is called, on its own.
 *
 * @param thing - the thing
 * @returns its name, e.g. "Wildschwein"
 */
export function thingName(thing: Thing): string {
  return THINGS[thing].name;
}

/** The ordinals for rows and columns, from the first. */
const ORDINALS: readonly string[] = [
  "ersten",
  "zweiten",
  "dritten",
  "vierten",
  "fünften",
  "sechsten",
  "siebten",
  "achten",
  "neunten",
  "zehnten",
];

/** Small numbers as words. */
const NUMBERS: readonly string[] = [
  "keiner",
  "einer",
  "zwei",
  "drei",
  "vier",
  "fünf",
  "sechs",
  "sieben",
  "acht",
];

/** What the difficulties are called. */
export const DIFFICULTY_NAMES: Readonly<Record<Difficulty, string>> = {
  easy: "Leicht",
  medium: "Mittel",
  hard: "Schwer",
};

/** The fixed texts. */
export const MURDOKU_TEXTS = {
  title: "Murdoku",
  subtitle: "Ein Kriminalrätsel wie ein Sudoku",
  cases: "Fälle",
  chooseCase: "Wähle einen Fall",
  solved: "Gelöst",
  resume: "Weiter",
  open: "Ermitteln",
  toCases: "Alle Fälle",
  playOnline: "Gemeinsam online",
  suspects: "Die Verdächtigen",
  victim: "Das Opfer",
  undo: "Rückgängig",
  restart: "Von vorn",
  hint: "Tipp",
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
  accuse: (culprit: string) => `${capital(culprit)} ist ...`,
  accuseHint: "Wenn du sicher bist, klage an.",
  right: (name: string, culprit: string) =>
    `Richtig! ${name} ist ${culprit}. Fall gelöst.`,
  wrong: (name: string) =>
    `${name} war es nicht. Prüfe noch einmal, wer mit dem Opfer allein war.`,
  gaveUp: (name: string, culprit: string) =>
    `Aufgelöst: ${name} war ${culprit}.`,
  hintsUsed: (count: number) => (count === 1 ? "1 Tipp" : `${count} Tipps`),
  time: (minutes: number, seconds: number) =>
    `${minutes}:${String(seconds).padStart(2, "0")}`,
  boardLabel: (name: string) => `Karte des Falls ${name}`,
  noSolution: "Dieser Fall hat keine eindeutige Lösung.",
} as const;

/**
 * A suspect's clue as a sentence.
 *
 * @param level - the case, for the names of areas and people
 * @param suspect - whose clue
 * @returns what the clue card says
 */
export function clueText(level: Level, suspect: Suspect): string {
  const who = capital(suspect.pronoun);
  return sentence(level, suspect.clue, who);
}

/** The sentence for one clue. */
function sentence(level: Level, clue: Clue, who: string): string {
  let text: string;
  switch (clue.kind) {
    case "on":
      text = `${who} war ${THINGS[clue.thing].on}.`;
      break;
    case "in": {
      const area = level.areas.find((one) => one.key === clue.area);
      text = `${who} war ${area?.at ?? "?"}.`;
      break;
    }
    case "beside":
      text = `${who} war neben ${THINGS[clue.thing].beside}.`;
      break;
    case "column":
      text = `${who} war in der ${ORDINALS[clue.col] ?? "?"} Spalte.`;
      break;
    case "row":
      text = `${who} war in der ${ORDINALS[clue.row] ?? "?"} Reihe.`;
      break;
    case "besideSame": {
      const other = level.suspects.find((one) => one.id === clue.other);
      text = `${who} war neben derselben Art Gegenstand (oder Tier) wie ${other?.name ?? "?"}.`;
      break;
    }
    case "crowd":
      text = `${who} war auf einer Insel mit ${NUMBERS[clue.others] ?? String(clue.others)} anderen Personen.`;
      break;
    default:
      text = `${who} war allein mit ${level.culprit.dative}.`;
  }
  return text;
}

/** A word with its first letter in capitals. */
function capital(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
