/**
 * Studentenwohnheim: three bedrooms, a corridor, a toilet and a kitchen of a
 * student hall, with a murdered student.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/46. Studentenwohnheim.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Olivier is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they, the beds and the rugs can be stood on.
 * Tables (the kitchen counter among them), shelves, TVs and plants cannot. The
 * windows are the bars in the left wall of the corridor; standing in front of
 * one means being on the field right beside it. A field is beside a wall when
 * one of its sides lies on a room border or on the edge of the map.
 */
import {
  about,
  alone,
  all,
  beside,
  cellsWhere,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** The fields right in front of a window. */
const WINDOWS: readonly Cell[] = [
  { row: 5, col: 0 },
  { row: 6, col: 0 },
  { row: 8, col: 0 },
];

/** The keys of the three bedrooms. */
const BEDROOMS: readonly string[] = ["A", "B", "C"];

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

/** Whether nobody but the suspect stands on a thing of this id. */
function onlyOneOn(c: Context, what: string): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, what);
  });
}

/** Whether somebody else in the suspect's room stands in front of a window. */
function otherAtWindow(c: Context): boolean {
  const area = c.areaOf(c.cell) ?? "";
  return c.peopleIn(area).some((id) => {
    const there = c.cellOf(id);
    return id !== c.self && there !== undefined && byWindow(there);
  });
}

/** Whether no two bedrooms held the same number of people. */
function bedroomsDiffer(c: Context): boolean {
  const counts = BEDROOMS.map((key) => c.peopleIn(key).length);
  return new Set(counts).size === counts.length;
}

/** The case. */
export const STUDENT_DORM: Level = {
  id: "student-dorm",
  name: "Studentenwohnheim",
  series: { book: "original", number: 46 },
  story: "Wenn du ermordet wirst, melde es sofort dem Studentenvorstand.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Schlafzimmer 1",
      at: "in Schlafzimmer 1",
      ground: "floor",
      tint: "#b9cdec",
      label: { row: 3, col: 0 },
    },
    {
      key: "B",
      name: "Schlafzimmer 2",
      at: "in Schlafzimmer 2",
      ground: "floor",
      tint: "#cdb9e6",
      label: { row: 3, col: 3 },
    },
    {
      key: "C",
      name: "Schlafzimmer 3",
      at: "in Schlafzimmer 3",
      ground: "floor",
      tint: "#b5e0e8",
      label: { row: 3, col: 6 },
    },
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "stone",
      tint: "#f2efc9",
      label: { row: 8, col: 0 },
    },
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "stone",
      tint: "#f2d2b8",
      label: { row: 8, col: 3 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#eef0c8",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "AAABBBCCC",
    "AAABBBCCC",
    "AAABBBCCC",
    "AAABBBCCC",
    "FFFFFFFFF",
    "FFFFFFFFF",
    "FFTTTTKKK",
    "FFTTTTKKK",
    "FFTTTTKKK",
  ],
  thingMap: [
    ".tpf.s..f",
    "btc.bt.sb",
    "bs..b...b",
    ".rr....rr",
    ".tcrrp.rr",
    ".........",
    "r.c..c.t.",
    "r.p..t.tt",
    "..c..c...",
  ],
  things: {
    b: "bed",
    c: "chair",
    f: "tv",
    p: "plant",
    r: "rug",
    s: "shelf",
    t: "table",
  },
  shapes: [
    [
      { row: 6, col: 7 },
      { row: 7, col: 7 },
      { row: 7, col: 8 },
    ],
  ],
  pieces: [
    { at: { row: 0, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 4 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 7 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 7 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 0 }, rows: 2, cols: 1 },
  ],
  windows: [
    { at: { row: 5, col: 0 }, side: "left" },
    { at: { row: 6, col: 0 }, side: "left" },
    { at: { row: 8, col: 0 }, side: "left" },
  ],
  suspects: [
    {
      id: "A",
      name: "Adrian",
      pronoun: "er",
      clue: {
        text: "Er war allein in einem Schlafzimmer.",
        ...all(inArea(...BEDROOMS), alone()),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Ben",
      pronoun: "er",
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#15803d",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "C",
      name: "Carmen",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(
          on("chair"),
          counting((c) => onlyOneOn(c, "chair")),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Damian",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Teppich.",
        ...all(
          on("rug"),
          counting((c) => onlyOneOn(c, "rug")),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Eowyn",
      pronoun: "sie",
      clue: {
        text: "Sie war nördlich von Hope. Sie waren im selben Raum.",
        ...about(["H"], (c) => {
          const hope = c.cellOf("H");
          return (
            hope !== undefined &&
            c.cell.row < hope.row &&
            c.areaOf(hope) === c.areaOf(c.cell)
          );
        }),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Fletcher",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#9f1239",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "G",
      name: "Gaja",
      pronoun: "sie",
      clue: {
        text: "Jemand anders war vor einem Fenster in ihrem Raum.",
        ...counting(otherAtWindow),
      },
      colour: "#ea580c",
      face: "\u{1F469}",
    },
    {
      id: "H",
      name: "Hope",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einer Wand.",
        ...not(own((c) => byWall(c.areaOf, c.cell))),
        glow: (level) =>
          cellsWhere(
            level,
            (cell) => !byWall((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "O",
      name: "Olivier",
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
      text: "In jedem Schlafzimmer war eine unterschiedliche Anzahl von Personen.",
      check: bedroomsDiffer,
    },
  ],
  hints: [
    {
      text: "Die Reihen R1 bis R4 liegen ganz in den drei Schlafzimmern - dort standen also genau vier Personen. Mit drei verschiedenen Anzahlen und Adrian allein in einem Schlafzimmer geht das nur als 3, 1 und 0. Olivier war in keinem Schlafzimmer, denn er war mit genau einer Person allein. Ben lag auf einem Bett, und alle Betten stehen in Schlafzimmern - er war im Dreierzimmer, denn bei Adrian war niemand.",
    },
    {
      text: "Das Dreierzimmer belegt alle drei Spalten. Schlafzimmer 1 kann es nicht sein: Dann stünde jemand in C1, und alle Fenster liegen vor C1 (R6 C1, R7 C1, R9 C1) - Gaja hätte niemanden vor einem Fenster. Schlafzimmer 2 auch nicht: In C4 kann dort nur Eowyn stehen (kein Stuhl, kein Bett, kein Teppich, kein Tisch daneben, und jedes Feld liegt an einer Wand), mit Hope südlich von ihr - und Hope findet dort nur auf den Betten in C5 ein Feld ohne Wand. Bens Betten in Schlafzimmer 2 liegen aber ebenfalls in C5.",
    },
    {
      text: "Also war Schlafzimmer 3 das Dreierzimmer. In C7 gibt es dort keinen Stuhl, keinen Teppich und keinen Tisch, und jedes Feld liegt an einer Wand - nur Eowyn kann dort stehen, und mit ihr Hope auf dem einzigen Feld ohne Wand, R3 C8. Ben lag in C9, nicht in Hopes R3: R2 C9. Eowyn war nördlich von Hope in C7: R1 C7.",
      place: {
        H: { row: 2, col: 7 },
        B: { row: 1, col: 8 },
        E: { row: 0, col: 6 },
      },
    },
    {
      text: "Adrian war allein in einem anderen Schlafzimmer, in der letzten freien Reihe R4. Damit bleiben Damian nur die Flurteppiche. Vor einem Fenster in Gajas Flur konnte nur Damian (Teppich R7 C1) oder Olivier (R6 C1 oder R9 C1) stehen - Adrian war im Schlafzimmer, Gaja meint jemand anderen, Carmen saß auf einem Stuhl, und Fletcher stand neben einem Tisch. Olivier wäre im Flur aber nicht allein mit einer Person, denn dort waren Gaja und Damian. Also stand Damian in R7 C1.",
      place: { D: { row: 6, col: 0 } },
    },
    {
      text: "Olivier war also nicht im Flur, und die Küche liegt in den belegten Spalten C7 bis C9 - er war in der Toilette, in R8 oder R9. R5 liegt ganz im Flur: R5 C1 ist Damians Spalte, R5 C4 und R5 C5 sind Teppiche, R5 C2 ein Tisch, R5 C6 eine Pflanze. Bleibt nur der Stuhl R5 C3 - für Carmen.",
      place: { C: { row: 4, col: 2 } },
    },
    {
      text: "R6 liegt ebenfalls ganz im Flur, frei ist nur noch R6 C2: für Gaja oder für Fletcher (neben dem Tisch R5 C2). Stünde Fletcher dort, bliebe Gaja im Flur nur C2 - seine Spalte. Also war Gaja in R6, und Fletcher stand neben dem Tisch in der Toilette: R8 C5. Olivier blieb in R9 nur R9 C4 - die Stühle sind Carmens.",
      place: { F: { row: 7, col: 4 }, O: { row: 8, col: 3 } },
    },
    {
      text: "Adrian in R4: C1, C4 und C5 sind belegt, R4 C2 und R4 C3 Teppiche - er war in R4 C6, Gaja in R6 C2. In der Toilette war Olivier allein mit Fletcher - Fletcher ist der Mörder!",
      place: { A: { row: 3, col: 5 }, G: { row: 5, col: 1 } },
    },
  ],
  solution: {
    A: { row: 3, col: 5 },
    B: { row: 1, col: 8 },
    C: { row: 4, col: 2 },
    D: { row: 6, col: 0 },
    E: { row: 0, col: 6 },
    F: { row: 7, col: 4 },
    G: { row: 5, col: 1 },
    H: { row: 2, col: 7 },
    O: { row: 8, col: 3 },
  },
};
