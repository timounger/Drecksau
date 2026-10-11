/**
 * Masked Ball: a hall, a ballroom, a dining room, a kitchen and a lounge, with
 * a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/34. Maskenball.png`, no
 * solution sheet), with the culprit pencilled in on the photographed page.
 * Orion is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the rugs can be stood on. Tables
 * (the kitchen counter among them) and plants cannot. The windows are the
 * bars in the outer walls; standing in front of one means being on the field
 * right beside it. A field is beside a wall when one of its sides lies on a
 * room border or on the edge of the map.
 *
 * The page says Angelo was "in der Spalte ganz rechts". Read as the map's
 * last column the case has no solution; read as the rightmost column of his
 * room it has exactly one, the one pencilled in on the photographed page. The
 * clue says so in words.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  alone,
  all,
  beside,
  cellsWhere,
  counting,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** The fields right in front of a window. */
const WINDOWS: readonly Cell[] = [
  { row: 3, col: 0 },
  { row: 4, col: 0 },
  { row: 5, col: 0 },
  { row: 6, col: 0 },
  { row: 3, col: 8 },
  { row: 4, col: 8 },
  { row: 6, col: 8 },
];

/** The steps to a field's four sides. */
const SIDES: readonly Cell[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/** Whether a field lies right in front of a window. */
function byWindow(cell: Cell): boolean {
  return WINDOWS.some((one) => one.row === cell.row && one.col === cell.col);
}

/** Whether one of a field's sides lies on a room border or the map's edge. */
function byWall(areaOf: (cell: Cell) => string | null, cell: Cell): boolean {
  const area = areaOf(cell);
  return SIDES.some(
    (step) =>
      areaOf({ row: cell.row + step.row, col: cell.col + step.col }) !== area,
  );
}

/** Whether the suspect's row holds a chair in the suspect's own room. */
function chairInRow(c: Context): boolean {
  const area = c.areaOf(c.cell);
  return Array.from({ length: c.cols }, (_, col) => ({
    row: c.cell.row,
    col,
  })).some(
    (cell) =>
      cell.col !== c.cell.col && c.areaOf(cell) === area && c.is(cell, "chair"),
  );
}

/** Whether no field of the suspect's room lies further right than the suspect. */
function inRightmostColumn(c: Context): boolean {
  return c
    .cellsOf(c.areaOf(c.cell) ?? "")
    .every((cell) => cell.col <= c.cell.col);
}

/** Whether exactly three women shared the suspect's room. */
function withThreeWomen(c: Context): boolean {
  return (
    c.peopleIn(c.areaOf(c.cell) ?? "").filter((id) => c.has(id, "woman"))
      .length === 3
  );
}

/** Whether nobody but the suspect stands on a thing of this id. */
function onlyOneOn(c: Context, what: string): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, what);
  });
}

/** The case. */
export const MASKED_BALL: Level = {
  id: "masked-ball",
  name: "Maskenball",
  series: { book: "original", number: 34 },
  story:
    "Wenn sie versuchen, ihre Identität mit diesen Masken zu verbergen, geht der Witz auf ihre Kosten - ich bin sowieso gesichtsblind.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "floor",
      tint: "#e3cfe3",
      label: { row: 1, col: 4 },
    },
    {
      key: "T",
      name: "Tanzsaal",
      at: "im Tanzsaal",
      ground: "stone",
      tint: "#f2d6cc",
      label: { row: 6, col: 4 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "stone",
      tint: "#c9c3e6",
      label: { row: 5, col: 6 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#ddc9e3",
      label: { row: 8, col: 2 },
    },
    {
      key: "L",
      name: "Lounge",
      at: "in der Lounge",
      ground: "floor",
      tint: "#e6d0e6",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "FFFFFFFFF",
    "FFFFFFFFF",
    "TTTTTTEEE",
    "TTTTTTEEE",
    "TTTTTTEEE",
    "TTTTTTEEE",
    "TTTTTTLLL",
    "KKKKKLLLL",
    "KKKKKLLLL",
  ],
  thingMap: [
    "....p...c",
    ".pt...p..",
    "..rrtp...",
    "..rrr.ttc",
    "..prr....",
    "rr.....pc",
    "rrpt....c",
    "c..t.cctc",
    "..ttt.p..",
  ],
  things: {
    c: "chair",
    p: "plant",
    r: "rug",
    t: "table",
  },
  shapes: [
    [
      { row: 7, col: 3 },
      { row: 8, col: 2 },
      { row: 8, col: 3 },
      { row: 8, col: 4 },
    ],
  ],
  pieces: [
    { at: { row: 2, col: 2 }, rows: 3, cols: 3 },
    { at: { row: 3, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 0 }, rows: 2, cols: 2 },
  ],
  windows: [
    { at: { row: 3, col: 0 }, side: "left" },
    { at: { row: 4, col: 0 }, side: "left" },
    { at: { row: 5, col: 0 }, side: "left" },
    { at: { row: 6, col: 0 }, side: "left" },
    { at: { row: 3, col: 8 }, side: "right" },
    { at: { row: 4, col: 8 }, side: "right" },
    { at: { row: 6, col: 8 }, side: "right" },
  ],
  suspects: [
    {
      id: "A",
      name: "Angelo",
      pronoun: "er",
      clue: {
        text: "Er war in einem Raum mit drei Frauen. Er war in der Spalte ganz rechts in seinem Raum.",
        ...all(own(inRightmostColumn), counting(withThreeWomen)),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Bastian",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Caitlin",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(
          on("chair"),
          counting((c) => onlyOneOn(c, "chair")),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Darla",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Pflanze.", ...beside("plant") },
      colour: "#6366f1",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Eric",
      pronoun: "er",
      clue: {
        text: "Er war allein. Er war nicht neben einer Wand.",
        ...all(alone(), not(own((c) => byWall(c.areaOf, c.cell)))),
        glow: (level) =>
          cellsWhere(
            level,
            (cell) => !byWall((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Francine",
      pronoun: "sie",
      clue: {
        text: "Sie war vor einem Fenster.",
        ...own((c) => byWindow(c.cell)),
        glow: (level) => cellsWhere(level, (cell) => byWindow(cell)),
      },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Gemma",
      pronoun: "sie",
      clue: {
        text: "Sie war in derselben Zeile wie ein Stuhl, im selben Raum.",
        ...own(chairInRow),
      },
      colour: "#ea580c",
      face: "\u{1F469}",
    },
    {
      id: "H",
      name: "Harriet",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person auf einem Teppich.",
        ...all(
          on("rug"),
          counting((c) => onlyOneOn(c, "rug")),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Orion",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}‍\u{1F9B2}",
    },
  ],
  hints: [
    {
      text: "Eric war allein und nicht neben einer Wand. Solche Felder gibt es nur mitten im Tanzsaal (R4 bis R6, C2 bis C5), in R5 C8 im Esszimmer und in R8 C7 - ein Stuhl, auf dem nur Caitlin sitzen kann. Wäre Eric allein im Tanzsaal, müssten die übrigen vier Reihen des Tanzsaals (R3 bis R7) außerhalb von ihm besetzt werden - dort gibt es nur C7 bis C9. Also war Eric in R5 C8. Blockiere den Rest des Esszimmers.",
      place: { E: { row: 4, col: 7 } },
      cross: [
        { row: 2, col: 6 },
        { row: 2, col: 7 },
        { row: 2, col: 8 },
        { row: 3, col: 8 },
        { row: 4, col: 6 },
        { row: 4, col: 8 },
        { row: 5, col: 8 },
      ],
    },
    {
      text: "Angelo war mit drei Frauen in einem Raum - vier Personen. Flur und Küche haben nur zwei Reihen, die Lounge drei, und im Esszimmer war Eric allein. Also war Angelo im Tanzsaal, in dessen rechter Spalte C6. Im Tanzsaal steht kein Stuhl, also waren weder Caitlin noch Gemma dort: Die drei Frauen sind Darla, Francine und Harriet. Mit Eric in R5 gehören R3, R4, R6 und R7 diesen vier - blockiere R7 in der Lounge.",
      cross: [
        { row: 6, col: 6 },
        { row: 6, col: 7 },
        { row: 6, col: 8 },
      ],
    },
    {
      text: "Darla war im Tanzsaal neben einer Pflanze, aber nicht auf einem Teppich - dort war nur Harriet. Neben der Pflanze in R3 C6 ist nur R4 C6 frei, und C6 gehört Angelo. Neben der in R5 C3 liegen R4 C3 (Teppich) und Felder in R5. Neben der in R7 C3 ist R7 C2 ein Teppich und R7 C4 ein Tisch. Darla war in R6 C3.",
      place: { D: { row: 5, col: 2 } },
    },
    {
      text: "Francine war vor einem Fenster im Tanzsaal, also in C1: R5 gehört Eric, R6 Darla, und R7 C1 ist ein Teppich. Francine war in R4 C1. Angelo bleibt in C6 nur R7 C6, denn R3 C6 ist eine Pflanze. Harriet war auf einem Teppich in R3, aber nicht in C3 - in R3 C4.",
      place: {
        F: { row: 3, col: 0 },
        A: { row: 6, col: 5 },
        H: { row: 2, col: 3 },
      },
    },
    {
      text: "Bastian, Caitlin, Gemma und Orion bleiben R1, R2, R8 und R9 in C2, C5, C7 und C9. Caitlin saß auf einem Stuhl: R8 C7, R1 C9 oder R8 C9. Bastian war neben einem Tisch: R8 C5 oder R9 C2. Gemma braucht einen Stuhl in ihrer Reihe und ihrem Raum: R1 C2, R1 C7, R8 C2 oder R8 C5. Säße Caitlin in R8 C7, stünde Bastian in R9 C2, und Gemma bliebe kein Feld. Also war Caitlin in C9. In C7 ist dann nur noch R1 C7 frei, R1 ist besetzt - Caitlin saß in R8 C9.",
      place: { C: { row: 7, col: 8 } },
    },
    {
      text: "R8 ist besetzt, also stand Bastian in R9 C2. Gemma bleibt nur R1 C7, Orion R2 C5. Im Flur war Orion allein mit Gemma - Gemma ist die Mörderin!",
      place: {
        B: { row: 8, col: 1 },
        G: { row: 0, col: 6 },
        O: { row: 1, col: 4 },
      },
    },
  ],
  solution: {
    A: { row: 6, col: 5 },
    B: { row: 8, col: 1 },
    C: { row: 7, col: 8 },
    D: { row: 5, col: 2 },
    E: { row: 4, col: 7 },
    F: { row: 3, col: 0 },
    G: { row: 0, col: 6 },
    H: { row: 2, col: 3 },
    O: { row: 1, col: 4 },
  },
};
