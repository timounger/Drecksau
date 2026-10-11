/**
 * An Unexpected Visit: a flat with guest room, master bedroom, living room,
 * bathroom, dining room and kitchen, and a murdered visitor.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Unangemeldeter Besuch.png`, no solution
 * sheet; the solver proves the case has exactly one solution). Virginia is
 * the victim; whoever was alone with her killed her. Beds, chairs and rugs
 * can be stood on; plants, shelves, tables and the TV cannot.
 */
import { all, beside, column, counting, on, victim } from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */

/** The side length of the square map. */
const SIZE = 9;

/**
 * The fields of a row, counted from nought, except some columns.
 *
 * @param row - the row
 * @param keep - the columns left out
 * @returns the fields
 */
function rowExcept(row: number, keep: readonly number[]): readonly Cell[] {
  return Array.from({ length: SIZE }, (_, col) => ({ row, col })).filter(
    (cell) => !keep.includes(cell.col),
  );
}

/** How many people stand on a field that passes a test. */
function countWhere(c: Context, test: (cell: Cell) => boolean): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && test(there);
  }).length;
}

/** Whether the suspect is the only person beside a plant. */
function onlyOneBesidePlant(c: Context): boolean {
  return countWhere(c, (cell) => c.beside(cell, "plant")) === 1;
}

/** The case. */
export const AN_UNEXPECTED_VISIT: Level = {
  id: "an-unexpected-visit",
  name: "Unangemeldeter Besuch",
  difficulty: "medium",
  series: { book: "online" },
  story:
    "Virginia wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#b5ead9",
      label: { row: 4, col: 0 },
    },
    {
      key: "H",
      name: "Hauptschlafzimmer",
      at: "im Hauptschlafzimmer",
      ground: "floor",
      tint: "#c2f0e2",
      label: { row: 3, col: 7 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#c3c9dc",
      label: { row: 5, col: 3 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "stone",
      tint: "#bfd0ee",
      label: { row: 8, col: 0 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#c6f0c4",
      label: { row: 8, col: 4 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#b2e6b4",
      label: { row: 8, col: 8 },
    },
  ],
  areaMap: [
    "GGGGHHHHH",
    "GGGGHHHHH",
    "GGGWWWHHH",
    "GGWWWWWHH",
    "GGWWWWWKK",
    "BBWWWWWKK",
    "BBBBBEEEK",
    "BBBBEEEEK",
    "BBBEEEEEK",
  ],
  thingMap: [
    "sps.t.pb.",
    "bu....ub.",
    "bus.v.uuc",
    "uusuuuc.s",
    ".pcuuucc.",
    "t....cpsu",
    "c....pccu",
    ".t...cttu",
    ".ts....c.",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    s: "shelf",
    t: "table",
    u: "rug",
    v: "tv",
  },
  // The L-shaped rugs, as the page draws them.
  shapes: [
    [
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 3, col: 1 },
      { row: 3, col: 0 },
    ],
    [
      { row: 1, col: 6 },
      { row: 2, col: 6 },
      { row: 2, col: 7 },
    ],
  ],
  pieces: [
    { at: { row: 1, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 3 }, rows: 2, cols: 3 },
    { at: { row: 5, col: 8 }, rows: 3, cols: 1 },
    { at: { row: 7, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 6 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Angelo",
      pronoun: "er",
      clue: { text: "Er war neben dem Fernseher.", ...beside("tv") },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Brigitte",
      pronoun: "sie",
      clue: { text: "Sie lag auf einem Bett.", ...on("bed") },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Catherine",
      pronoun: "sie",
      clue: { text: "Sie war in der letzten Spalte.", ...column(SIZE) },
      colour: "#0e7490",
      face: "\u{1F475}",
    },
    {
      id: "D",
      name: "Dalton",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Elliot",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person neben einer Pflanze.",
        ...all(beside("plant"), counting(onlyOneBesidePlant)),
      },
      colour: "#7c3aed",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "F",
      name: "Fabrice",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#9f1239",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Genevieve",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Bett.", ...beside("bed") },
      colour: "#ea580c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "H",
      name: "Hayden",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("seat") },
      colour: "#4338ca",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "V",
      name: "Virginia",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F469}",
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
      text: "Beginnen wir damit, Gs mögliche Felder mit Bleistift zu notieren. Sie war neben einem Bett, kann aber NICHT neben einer Pflanze sein, da E die einzige Person neben einer Pflanze ist. Sie kann auch nicht in der letzten Spalte sein, da C in dieser Spalte ist. Das sollte G auf drei Felder einschränken, alle auf einem Teppich. Und gemäß dem allgemeinen Hinweis, dass nur eine Person auf einem Teppich ist, wissen wir, dass G diese Person ist. Streiche alle anderen Teppichfelder. Wir können auch R3 C1 streichen, denn wenn jemand dieses Feld belegen würde, würden alle Felder wegfallen, die G belegen kann.",
      cross: [
        { row: 1, col: 1 },
        { row: 1, col: 6 },
        { row: 3, col: 1 },
        { row: 3, col: 3 },
        { row: 3, col: 4 },
        { row: 3, col: 5 },
        { row: 4, col: 3 },
        { row: 4, col: 4 },
        { row: 4, col: 5 },
        { row: 5, col: 8 },
        { row: 6, col: 8 },
        { row: 7, col: 8 },
        { row: 2, col: 0 },
      ],
    },
    {
      text: "Da A neben einem Fernseher ist, muss er in R3 sein, in C4 oder C6. Streiche alle anderen Felder in dieser Reihe. Das schränkt G auf R4 C1 ein.",
      place: { G: { row: 3, col: 0 } },
      cross: rowExcept(2, [3, 5]),
    },
    {
      text: "Da B auf einem Bett ist, muss sie in C8 sein. Sie kann jedoch NICHT in R1 C8 sein, weil E die einzige Person neben einer Pflanze ist, also ist B in R2 C8.",
      place: { B: { row: 1, col: 7 } },
    },
    {
      text: "Unter allen verbleibenden Stühlen muss H R5 C3 belegen, denn alle anderen Stühle sind neben einer Pflanze, was nur E sein darf. F ist in R1 C4, denn das ist das letzte Feld, auf dem er neben einem Regal sein kann. Das schränkt A auf R3 C6 ein.",
      place: {
        H: { row: 4, col: 2 },
        F: { row: 0, col: 3 },
        A: { row: 2, col: 5 },
      },
    },
    {
      text: "E belegt R7 C7, um neben einer Pflanze zu sein. D ist in R6 C2, um neben dem Tisch zu sein. Da C in der letzten Spalte ist, muss sie in R9 C9 sein.",
      place: {
        E: { row: 6, col: 6 },
        D: { row: 5, col: 1 },
        C: { row: 8, col: 8 },
      },
    },
    {
      text: "Damit bleibt das letzte Feld R8 C5 für V, also ist E der Mörder.",
      place: { V: { row: 7, col: 4 } },
    },
  ],
  solution: {
    A: { row: 2, col: 5 },
    B: { row: 1, col: 7 },
    C: { row: 8, col: 8 },
    D: { row: 5, col: 1 },
    E: { row: 6, col: 6 },
    F: { row: 0, col: 3 },
    G: { row: 3, col: 0 },
    H: { row: 4, col: 2 },
    V: { row: 7, col: 4 },
  },
};
