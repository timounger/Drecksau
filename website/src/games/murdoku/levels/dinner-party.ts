/**
 * Dinnerparty: a living room, a dining room, a bathroom, a kitchen and a
 * bedroom of a flat, with a murdered delivery man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/50. Dinnerparty.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Ovid is the victim; whoever was alone with him killed him.
 *
 * The map has nine rows and nine columns; the four fields at the top left and
 * the five at the bottom right are not part of it. The armchairs are the
 * chairs; they, the beds and the rugs can be stood on. The tables, the TVs and
 * the plants cannot. A field is in a corner of its room when the room's border
 * runs along two of its sides that meet: one above or below it, one to its
 * left or right.
 */
import {
  about,
  all,
  alone,
  beside,
  cellsWhere,
  counting,
  on,
  own,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** Whether a field lies in a corner of its area, given the area of each field. */
function inCorner(areaOf: (cell: Cell) => string | null, cell: Cell): boolean {
  const area = areaOf(cell);
  const outside = (row: number, col: number): boolean =>
    areaOf({ row, col }) !== area;
  const vertical =
    outside(cell.row - 1, cell.col) || outside(cell.row + 1, cell.col);
  const horizontal =
    outside(cell.row, cell.col - 1) || outside(cell.row, cell.col + 1);
  return vertical && horizontal;
}

/** Whether the suspect stands east of somebody - in a column further right. */
function eastOf(c: Context, id: string): boolean {
  const other = c.cellOf(id);
  return other !== undefined && c.cell.col > other.col;
}

/** Whether another woman stands on a rug in the suspect's area. */
function anotherWomanOnARug(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      c.has(id, "woman") &&
      there !== undefined &&
      c.is(there, "rug")
    );
  });
}

/** The case. */
export const DINNER_PARTY: Level = {
  id: "dinner-party",
  name: "Dinnerparty",
  series: { book: "original", number: 50 },
  story:
    "Normalerweise ist das Schlimmste, was man einem Lieferanten antun kann, kein Trinkgeld zu geben.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#cfe1e6",
      label: { row: 4, col: 4 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#e6d3ea",
      label: { row: 6, col: 7 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#f3e3c4",
      label: { row: 4, col: 0 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#dccbea",
      label: { row: 6, col: 3 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#d6c8ec",
      label: { row: 8, col: 2 },
    },
  ],
  areaMap: [
    "....WWWEE",
    "....WWWEE",
    "BBBWWWWEE",
    "BBBWWWWEE",
    "BBBWWWWEE",
    "SSSKKKEEE",
    "SSSKKKEEE",
    "SSSS.....",
    "SSSS.....",
  ],
  thingMap: [
    ".....cT.p",
    "........T",
    "r.r..r.r.",
    "rcrv.rprT",
    ".p......T",
    "...p..p..",
    "bb..Tc..T",
    "bbv......",
    "pT.......",
  ],
  things: {
    T: "table",
    b: "bed",
    c: "chair",
    p: "plant",
    r: "rug",
    v: "tv",
  },
  pieces: [
    { at: { row: 2, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 1 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Amos",
      pronoun: "er",
      clue: {
        text: "Er war östlich von Ovid.",
        ...about(["O"], (c) => eastOf(c, "O")),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Benjamin",
      pronoun: "er",
      clue: {
        text: "Er war auf einem Teppich. Er war östlich von Farouk.",
        ...all(
          on("rug"),
          about(["F"], (c) => eastOf(c, "F")),
        ),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Chrissi",
      pronoun: "sie",
      clue: { text: "Sie war allein.", ...alone() },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Deborah",
      pronoun: "sie",
      clue: {
        text: "Eine weitere Frau war auf einem Teppich in ihrem Raum.",
        ...counting(anotherWomanOnARug),
      },
      colour: "#6366f1",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Emma",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fernseher.", ...beside("tv") },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Farouk",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#9f1239",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Gerrit",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke. Er war südlich von Amos.",
        ...all(
          own((c) => inCorner(c.areaOf, c.cell)),
          about(["A"], (c) => {
            const amos = c.cellOf("A");
            return amos !== undefined && c.cell.row > amos.row;
          }),
        ),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Helen",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Tisch.", ...beside("table") },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Ovid",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      text: "Mindestens eine Person saß auf einem Stuhl.",
      check: (c) =>
        c.people().some((id) => {
          const there = c.cellOf(id);
          return there !== undefined && c.is(there, "chair");
        }),
    },
  ],
  hints: [
    {
      text: "Deborah sah eine weitere Frau auf einem Teppich in ihrem Raum. Chrissi war allein, und Emma stand neben einem Fernseher - dort liegt kein Teppich. Also war es Helen: auf einem Teppich neben einem Tisch, und das ist nur R4 C8 neben dem Tisch R4 C9. Helen stand in R4 C8, und Deborah war im Esszimmer. Blockiere den Rest von R4 und C8.",
      place: { H: { row: 3, col: 7 } },
      cross: [
        { row: 3, col: 0 },
        { row: 3, col: 1 },
        { row: 3, col: 2 },
        { row: 3, col: 4 },
        { row: 3, col: 5 },
        { row: 0, col: 7 },
        { row: 1, col: 7 },
        { row: 2, col: 7 },
        { row: 4, col: 7 },
        { row: 5, col: 7 },
        { row: 6, col: 7 },
      ],
    },
    {
      text: "Benjamin war auf einem Teppich und östlich von Farouk - also nicht in C1. R4 und C8 sind blockiert: Es bleiben R3 C3 und R3 C6. Benjamin stand in R3; blockiere den Rest von R3.",
      cross: [
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 3 },
        { row: 2, col: 4 },
        { row: 2, col: 6 },
        { row: 2, col: 8 },
      ],
    },
    {
      text: "In C9 sind nur R3 C9 und R6 C9 frei, und R3 gehört Benjamin - jemand stand in R6 C9, im Esszimmer. Chrissi kann es nicht sein (Helen ist dort), Farouk, Gerrit und Emma finden dort weder Pflanze noch Ecke noch Fernseher. Deborah stand in R6 C9.",
      place: { D: { row: 5, col: 8 } },
    },
    {
      text: "In R1 und R2 sind nur noch Felder im Wohnzimmer frei. Farouk findet dort keine Pflanze, Gerrits Ecke R1 C5 läge nördlich von Amos, Emma hat dort keinen Fernseher, und Chrissi wäre nicht allein. Amos und Ovid standen in R1 und R2. Ovid war allein mit einer Person - außer Amos war niemand im Wohnzimmer. Also stand Benjamin nicht in R3 C6, sondern in R3 C3.",
      place: { B: { row: 2, col: 2 } },
    },
    {
      text: "Emma war neben einem Fernseher. Die Felder am Fernseher im Wohnzimmer sind blockiert, also war sie im Schlafzimmer. Chrissi war allein: nicht im Wohnzimmer, Esszimmer, Badezimmer (Benjamin) oder Schlafzimmer (Emma) - sie war in der Küche, in R7 C4 oder R7 C6. Sonst war niemand in der Küche.",
    },
    {
      text: "Für Emma, Farouk und Gerrit bleiben R5, R8 und R9. In R9 ist nur R9 C4 frei (C3 gehört Benjamin) - eine Ecke, also Gerrit. Emma bleibt am Fernseher nur R8 C2, und Farouk neben der Pflanze nur R5 C1.",
      place: {
        G: { row: 8, col: 3 },
        E: { row: 7, col: 1 },
        F: { row: 4, col: 0 },
      },
    },
    {
      text: "Chrissi saß in R7 C6 auf dem Stuhl (C4 gehört Gerrit). Für Amos und Ovid bleiben C5 und C7, und Amos war östlich von Ovid: Ovid in R1 C5, Amos in R2 C7 (R1 C7 ist ein Tisch).",
      place: {
        C: { row: 6, col: 5 },
        O: { row: 0, col: 4 },
        A: { row: 1, col: 6 },
      },
    },
    {
      text: "Ovid war im Wohnzimmer allein mit Amos - Amos ist der Mörder!",
    },
  ],
  solution: {
    A: { row: 1, col: 6 },
    B: { row: 2, col: 2 },
    C: { row: 6, col: 5 },
    D: { row: 5, col: 8 },
    E: { row: 7, col: 1 },
    F: { row: 4, col: 0 },
    G: { row: 8, col: 3 },
    H: { row: 3, col: 7 },
    O: { row: 0, col: 4 },
  },
};
