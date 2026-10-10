/**
 * Die Flussüberquerung: a river, cliffs, a hunting lodge, a forest and a
 * fort, an outlaw hiding among the suspects and a murdered woman.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Schwer/Die Flussüberquerung/Die Flussüberquerung.png`,
 * no solution sheet - the solver proves the single solution). Valeria is the
 * victim; whoever was alone with her killed her.
 *
 * **Who the outlaw is, is not printed - it is part of the puzzle.** Exactly
 * one suspect is the outlaw; it is neither Horatio nor Valeria, and the
 * outlaw was alone. Estelle stood exactly six rows south of the outlaw, so
 * her check and the case's rule both ask for somebody alone, not Horatio,
 * not Valeria, in the row six above hers. Each covered wagon covers two
 * fields and can be stood on, as can the horses and the chairs; trees,
 * bushes, boulders, crates and shelves cannot.
 */
import { all, beside, counting, on, own, victim } from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** Who cannot be the outlaw, as their clues say. */
const NOT_OUTLAWS: readonly string[] = ["H", "V"];

/** How many rows south of the outlaw Estelle stood. */
const ROWS_SOUTH_OF_OUTLAW = 6;

/** Whether somebody stands alone in their area. */
function isAlone(c: Context, id: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && c.peopleIn(c.areaOf(there) ?? "").length === 1;
}

/**
 * Everybody who could be the outlaw: alone, not Horatio, not Valeria, and
 * exactly six rows north of Estelle.
 *
 * @param c - the context, with everybody placed
 * @returns the candidates
 */
function outlaws(c: Context): readonly string[] {
  const estelle = c.cellOf("E");
  return c
    .people()
    .filter(
      (id) =>
        !NOT_OUTLAWS.includes(id) &&
        isAlone(c, id) &&
        estelle !== undefined &&
        c.cellOf(id)?.row === estelle.row - ROWS_SOUTH_OF_OUTLAW,
    );
}

/** Whether there is an outlaw who fits every clue about the outlaw. */
function someOutlaw(c: Context): boolean {
  return outlaws(c).length > 0;
}

/** Whether nobody stands in a row, counted from nought. */
function emptyRow(c: Context, row: number): boolean {
  return c.people().every((id) => c.cellOf(id)?.row !== row);
}

/** How many columns the map has. */
const COLS = 9;

/** Every field of a row, counted from nought. */
function rowCells(row: number): readonly Cell[] {
  return Array.from({ length: COLS }, (_, col) => ({ row, col }));
}

/** The case. */
export const THE_RIVER_CROSSING: Level = {
  id: "the-river-crossing",
  name: "Die Flussüberquerung",
  difficulty: "hard",
  story:
    "Valeria wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "F",
      name: "Fluss",
      at: "im Fluss",
      ground: "water",
      tint: "#a8e0d6",
      label: { row: 9, col: 0 },
    },
    {
      key: "K",
      name: "Klippen",
      at: "auf den Klippen",
      ground: "stone",
      tint: "#bcc2a4",
      label: { row: 6, col: 1 },
    },
    {
      key: "J",
      name: "Jagdhütte",
      at: "in der Jagdhütte",
      ground: "floor",
      tint: "#ece0c4",
      label: { row: 4, col: 3 },
    },
    {
      key: "W",
      name: "Wald",
      at: "im Wald",
      ground: "grass",
      tint: "#58b98f",
      label: { row: 9, col: 3 },
    },
    {
      key: "T",
      name: "Fort",
      at: "im Fort",
      ground: "stone",
      tint: "#c9cbe0",
      label: { row: 9, col: 7 },
    },
  ],
  areaMap: [
    "FFFFKKKWW",
    "FFFFKWWWW",
    "FFFKKWWWW",
    "FFKKJWWWW",
    "FFKJJWWWW",
    "FKKWWWWWW",
    "FKWWWTTTW",
    "FFWWWTTTT",
    "FFWWWTTTT",
    "FWWWWWTTT",
  ],
  thingMap: [
    ".......t.",
    "..b...ww.",
    "........s",
    "....c..p.",
    "...p.t..t",
    ".b.sww...",
    "..p....k.",
    "...t.kr..",
    ".......c.",
    ".....p..r",
  ],
  things: {
    t: "tree",
    s: "shrub",
    b: "boulder",
    w: "wagon",
    c: "chair",
    p: "horse",
    k: "crate",
    r: "shelf",
  },
  extraThings: {
    wagon: { name: "Kutsche", emoji: "\u{1F6FB}", standable: true },
    horse: {
      name: "Pferd",
      emoji: "\u{1F40E}",
      standable: true,
      kinds: ["seat", "animal"],
    },
  },
  suspects: [
    {
      id: "A",
      name: "Alvin",
      pronoun: "er",
      clue: { text: "Er war neben einer Kiste.", ...beside("crate") },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Basil",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Clarence",
      pronoun: "er",
      clue: { text: "Er war neben einem Baum.", ...beside("tree") },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Delphine",
      pronoun: "sie",
      clue: { text: "Sie war in einer Kutsche.", ...on("wagon") },
      colour: "#6366f1",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "E",
      name: "Estelle",
      pronoun: "sie",
      clue: {
        text: "Sie war genau sechs Reihen südlich des Gesetzlosen.",
        ...all(
          own((c) => c.cell.row >= ROWS_SOUTH_OF_OUTLAW),
          counting(someOutlaw),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Flora",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Pferd.", ...on("horse") },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Gilbert",
      pronoun: "er",
      clue: { text: "Er war neben einem Felsblock.", ...beside("boulder") },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Horatio",
      pronoun: "er",
      clue: {
        text: "Nicht der Gesetzlose. Er war allein.",
        ...counting((c) => isAlone(c, "H")),
      },
      colour: "#0f766e",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Valeria",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Nicht der Gesetzlose. Sie war allein mit dem Mörder.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F471}‍♀️",
    },
  ],
  rules: [
    {
      text: "Es versteckt sich genau ein Gesetzloser unter den Verdächtigen. Der Gesetzlose kann der Mörder sein oder auch nicht.",
    },
    {
      text: "Der Gesetzlose war allein.",
      check: someOutlaw,
    },
    {
      text: "Entweder die oberste Reihe oder die unterste Reihe war leer.",
      check: (c) => emptyRow(c, 0) || emptyRow(c, c.rows - 1),
    },
  ],
  hints: [
    {
      text: "C und D sind sicher im Wald: Alle Kutschen und alle Felder neben einem Baum liegen dort. Der Wald ist also nicht der Bereich des Gesetzlosen, der allein war. A ist neben einer Kiste immer im Fort, frühestens in R7 - zu weit südlich für den Gesetzlosen, der sechs Reihen nördlich von E war.",
    },
    {
      text: "Der Gesetzlose ist also in R1 bis R4 allein in der Jagdhütte, auf den Klippen oder im Fluss. Dort passen nur B auf dem Stuhl in R4 C5 oder G neben dem Felsblock im Fluss. C1 liegt ganz im Fluss, und dort kann nur E, H oder V stehen - G wäre nicht allein. Der Gesetzlose ist B in R4 C5, und E ist sechs Reihen südlich in R10.",
      place: { B: { row: 3, col: 4 } },
    },
    {
      text: "Damit ist R10 nicht leer, also ist R1 leer. Blockiere R1, R4, C5 und den Rest der Jagdhütte. Für F bleibt nur das Pferd in R7 C3.",
      place: { F: { row: 6, col: 2 } },
      cross: rowCells(0),
    },
    {
      text: "Neben einem Felsblock sind für G nur noch R2 C2 und R2 C4 frei, beide in R2. Das isoliert D auf der Kutsche in R6 C6 und A auf R8 C8 neben der Kiste.",
      place: { D: { row: 5, col: 5 }, A: { row: 7, col: 7 } },
    },
    {
      text: "H war allein: nicht im Wald bei C, D und F, nicht in der Jagdhütte bei B, nicht im Fort bei A und nicht im Fluss bei G. Auf den Klippen ist nur noch R3 C4 frei. Für G bleibt damit nur R2 C2.",
      place: { H: { row: 2, col: 3 }, G: { row: 1, col: 1 } },
    },
    {
      text: "C bleibt neben einem Baum nur R5 C7, denn R9 C4 ist durch H gesperrt. Für E bleibt in R10 nur R10 C1, und V ist auf dem letzten Feld, R9 C9 im Fort. V war allein mit A, Alvin ist der Mörder!",
      place: {
        C: { row: 4, col: 6 },
        E: { row: 9, col: 0 },
        V: { row: 8, col: 8 },
      },
    },
  ],
  solution: {
    A: { row: 7, col: 7 },
    B: { row: 3, col: 4 },
    C: { row: 4, col: 6 },
    D: { row: 5, col: 5 },
    E: { row: 9, col: 0 },
    F: { row: 6, col: 2 },
    G: { row: 1, col: 1 },
    H: { row: 2, col: 3 },
    V: { row: 8, col: 8 },
  },
};
