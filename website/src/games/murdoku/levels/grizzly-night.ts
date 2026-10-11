/**
 * Grizzly-Nacht: a camp with a clearing, three tents and the forest, a bear
 * among the trees, and a murdered camper.
 *
 * @module
 * @remarks
 * After the hard case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Schwer/Grizzly-Nacht/Grizzly-Nacht.png`, no
 * solution sheet and no hints - the solver proves the single solution).
 * Victor is the victim; whoever was alone with him killed him. Cars, beds,
 * chairs and rugs can be stood on; shrubs, trees, tables and the bear cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  column,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** How many people stand on a field that passes a test. */
function countWhere(c: Context, test: (cell: Cell) => boolean): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && test(there);
  }).length;
}

/** Whether nobody but the suspect stands on a field that passes a test. */
function nobodyElse(c: Context, test: (cell: Cell) => boolean): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !test(there);
  });
}

/** Whether somebody other than the suspect stands beside the bear. */
function somebodyElseBesideBear(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return id !== c.self && there !== undefined && c.beside(there, "bear");
  });
}

/** The case. */
export const GRIZZLY_NIGHT: Level = {
  id: "grizzly-night",
  name: "Grizzly-Nacht",
  difficulty: "hard",
  series: { book: "online" },
  story:
    "Victor wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "L",
      name: "Lichtung",
      at: "auf der Lichtung",
      ground: "stone",
      tint: "#c9bf8f",
      label: { row: 2, col: 0 },
    },
    {
      key: "A",
      name: "Zelt A",
      at: "in Zelt A",
      ground: "floor",
      tint: "#b9c9d0",
      label: { row: 2, col: 6 },
    },
    {
      key: "W",
      name: "Wald",
      at: "im Wald",
      ground: "grass",
      tint: "#5f8f6c",
      label: { row: 8, col: 3 },
    },
    {
      key: "B",
      name: "Zelt B",
      at: "in Zelt B",
      ground: "floor",
      tint: "#bccbd2",
      label: { row: 8, col: 1 },
    },
    {
      key: "C",
      name: "Zelt C",
      at: "in Zelt C",
      ground: "floor",
      tint: "#b6c6cd",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "LLLLLAAAA",
    "LLLLLAAAA",
    "LLWWAAAAA",
    "WWWWWWWWW",
    "BBWWWWWWW",
    "BBBWWWWWW",
    "BBBWWCCCC",
    "BBBWWCCCC",
    "BBBWWCCCC",
  ],
  thingMap: [
    ".aa..t...",
    "s..aa.bb.",
    "......uu.",
    "s...st...",
    "...x.tc.s",
    "...p.....",
    ".bb.c..c.",
    "c.us..bb.",
    "uuu.puuut",
  ],
  things: {
    a: "car",
    b: "bed",
    c: "chair",
    p: "tree",
    s: "shrub",
    t: "table",
    u: "rug",
    x: "bear",
  },
  pieces: [
    { at: { row: 0, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 8, col: 5 }, rows: 1, cols: 3 },
  ],
  suspects: [
    {
      id: "A",
      name: "Alicia",
      pronoun: "sie",
      clue: { text: "Sie war in Zelt A oder Zelt C.", ...inArea("A", "C") },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Brenda",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht auf einem Teppich. Sie war in der obersten oder der untersten Reihe.",
        ...all(
          not(on("rug")),
          own((c) => c.cell.row === 0 || c.cell.row === c.rows - 1),
        ),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Clark",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person neben einem Strauch.",
        ...all(
          beside("shrub"),
          own((c) => nobodyElse(c, (cell) => c.beside(cell, "shrub"))),
          counting(
            (c) => countWhere(c, (cell) => c.beside(cell, "shrub")) === 1,
          ),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Dylan",
      pronoun: "er",
      clue: { text: "Er lag auf einem Bett.", ...on("bed") },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Ezequiel",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person in einem Auto.",
        ...all(
          on("car"),
          own((c) => nobodyElse(c, (cell) => c.is(cell, "car"))),
          counting((c) => countWhere(c, (cell) => c.is(cell, "car")) === 1),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Florence",
      pronoun: "sie",
      clue: {
        text: "Sie war in der letzten Spalte. Sie war südlich von Clark.",
        ...all(
          column(9),
          about(["C"], (c) => {
            const clark = c.cellOf("C");
            return clark !== undefined && c.cell.row > clark.row;
          }),
        ),
      },
      colour: "#9f1239",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "George",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("seat") },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Holden",
      pronoun: "er",
      clue: {
        text: "Er war im Wald. Jemand anderes war neben dem Bären.",
        ...all(inArea("W"), counting(somebodyElseBesideBear)),
      },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Victor",
      pronoun: "er",
      clue: { text: "Das Opfer. Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F468}‍\u{1F9B0}",
    },
  ],
  rules: [
    {
      text: "Genau eine Person stand auf einem Teppich.",
      check: (c) => countWhere(c, (cell) => c.is(cell, "rug")) === 1,
    },
  ],
  hints: [
    {
      text: "R9 besteht nur aus Teppich, einem Baum, einem Tisch und R9 C4. R9 C4 liegt neben einem Strauch, dort könnte nur C stehen - aber F muss südlich von C sein. Also steht in R9 jemand auf einem Teppich, und das ist die einzige Person auf einem Teppich. Streiche die übrigen Teppichfelder. Damit ist B in R1, und E sitzt in einem Auto in R2.",
      cross: [
        { row: 2, col: 6 },
        { row: 2, col: 7 },
        { row: 7, col: 2 },
        { row: 8, col: 3 },
      ],
    },
    {
      text: "In R4 können nur C, H oder V stehen, in R6 nur H oder V. Neben dem Bären liegen R4 C4 und R5 C5, beide neben einem Strauch und damit nur für C, und R5 C3, wo nur V stehen könnte. Stünde V dort, müsste H in R6 und C in R4 sein - dann wären drei Personen im Wald, und V wäre nicht allein mit einer. Also steht C neben dem Bären, in C4 oder C5, und E und C teilen sich C4 und C5.",
    },
    {
      text: "C und H sind beide im Wald, also ist V nicht im Wald. Wäre C in R5 C5, müsste H in R4 und V in R6 stehen. F muss südlich von C sein, also bliebe für R3 nur A - und dann fehlt jemand für den Teppich in R9. Also ist C in R4 C4 und E im Auto in R2 C5.",
      place: { C: { row: 3, col: 3 }, E: { row: 1, col: 4 } },
    },
    {
      text: "F muss jetzt in R7 oder R8 sein, und D liegt auf einem Bett in R7 oder R8. Damit sind R7 und R8 belegt, und G sitzt auf dem Stuhl in R5 C7.",
      place: { G: { row: 4, col: 6 } },
    },
    {
      text: "B ist in R1 in Zelt A, und C7 ist belegt - also ist B in R1 C8. D kann nur noch auf das Bett in R7 C2 oder R7 C3, also ist F in R8 C9.",
      place: { B: { row: 0, col: 7 }, F: { row: 7, col: 8 } },
    },
    {
      text: "Übrig sind A, H und V für R3, R6 und R9. H kann nur noch nach R3 C3 oder R6 C6, A nur nach R3 C6 oder auf den Teppich in R9 C6. Stünde A in R3 C6, hätte H kein Feld mehr. Also ist A in R9 C6 und H in R3 C3.",
      place: { A: { row: 8, col: 5 }, H: { row: 2, col: 2 } },
    },
    {
      text: "C3 ist belegt, also liegt D auf dem Bett in R7 C2. Für V bleibt nur R6 C1. V war allein mit D in Zelt B, Dylan ist der Mörder!",
      place: { D: { row: 6, col: 1 }, V: { row: 5, col: 0 } },
    },
  ],
  solution: {
    A: { row: 8, col: 5 },
    B: { row: 0, col: 7 },
    C: { row: 3, col: 3 },
    D: { row: 6, col: 1 },
    E: { row: 1, col: 4 },
    F: { row: 7, col: 8 },
    G: { row: 4, col: 6 },
    H: { row: 2, col: 2 },
    V: { row: 5, col: 0 },
  },
};
