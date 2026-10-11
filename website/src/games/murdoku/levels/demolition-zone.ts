/**
 * Demolition Zone: a half torn-down house - a guest room, a dining room, a
 * bedroom and a living room at the edge of the rubble - with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Abrisszone/Abrisszone.png`, no solution
 * sheet - the solver proves the one solution, with the culprit pencilled in on
 * the photographed page).
 * Orlando is the victim; whoever was alone with him killed him.
 *
 * The page's legend names the boulder and the rubble as fields nobody can
 * stand on; as in the book's other cases, the tables, the shelf and the TV
 * cannot be stood on either (with them standable the case has ten solutions).
 * The beds and the armchairs - the chairs - can be stood on. A field is in a corner of its area when the area's
 * border (or the map's edge) runs along two of its sides that meet.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data:
   rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  column,
  counting,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** Whether a field lies in a corner of its area. */
function inCorner(c: Context, cell: Cell): boolean {
  const area = c.areaOf(cell);
  const outside = (row: number, col: number): boolean =>
    c.areaOf({ row, col }) !== area;
  const vertical =
    outside(cell.row - 1, cell.col) || outside(cell.row + 1, cell.col);
  const horizontal =
    outside(cell.row, cell.col - 1) || outside(cell.row, cell.col + 1);
  return vertical && horizontal;
}

/** The fields holding a TV. */
function tvs(c: Context): readonly Cell[] {
  const found: Cell[] = [];
  for (let row = 0; row < c.rows; row += 1) {
    for (let col = 0; col < c.cols; col += 1) {
      if (c.is({ row, col }, "tv")) {
        found.push({ row, col });
      }
    }
  }
  return found;
}

/** Whether nobody but the suspect sits on a chair. */
function onlyOneOnAChair(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "chair");
  });
}

/** The case. */
export const DEMOLITION_ZONE: Level = {
  id: "demolition-zone",
  name: "Abrisszone",
  series: { book: "original", number: 11 },
  story: "Mit Absperrband erwürgt? Das ist mal was Neues.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Abrisszone",
      at: "in der Abrisszone",
      ground: "path",
      tint: "#e8d5c0",
      label: { row: 3, col: 5 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#d4d8dc",
      label: { row: 4, col: 1 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "stone",
      tint: "#cfe6ef",
      label: { row: 5, col: 4 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "stone",
      tint: "#dfe3e8",
      label: { row: 8, col: 1 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#e6eaee",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    ".AAAAA...",
    ".AAAAAAA.",
    ".AAEEAAAA",
    "GGGGEAAAA",
    "GGGGEEEAA",
    "SSSSEEEWW",
    "SSSSSWWWW",
    "SSSSSWWWW",
    "SSSSSWWWW",
  ],
  thingMap: [
    ".r.r.....",
    ".r...f...",
    ".......r.",
    "....c....",
    "c.bb.tt..",
    ".....scv.",
    "bb.tr....",
    ".t....t..",
    ".....tr..",
  ],
  things: {
    b: "bed",
    c: "chair",
    f: "boulder",
    r: "rubble",
    s: "shelf",
    t: "table",
    v: "tv",
  },
  extraThings: {
    boulder: { name: "Felsbrocken", emoji: "\u{1FAA8}", standable: false },
  },
  pieces: [
    { at: { row: 4, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 5 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 0 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Antonio",
      pronoun: "er",
      clue: { text: "Er war neben dem Regal.", ...beside("shelf") },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Benjamin",
      pronoun: "er",
      clue: {
        text: "Der Fernseher war in seiner Spalte, in einem anderen Raum.",
        ...own((c) =>
          tvs(c).some(
            (tv) => tv.col === c.cell.col && c.areaOf(tv) !== c.areaOf(c.cell),
          ),
        ),
      },
      colour: "#15803d",
      face: "\u{1F477}‍♂️",
    },
    {
      id: "C",
      name: "Claus",
      pronoun: "er",
      clue: {
        text: "Er war südwestlich vom Fernseher und im selben Raum.",
        ...own((c) =>
          tvs(c).some(
            (tv) =>
              c.cell.row > tv.row &&
              c.cell.col < tv.col &&
              c.areaOf(tv) === c.areaOf(c.cell),
          ),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Dina",
      pronoun: "sie",
      clue: { text: "Sie war in der dritten Spalte.", ...column(3) },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Emmett",
      pronoun: "er",
      clue: { text: "Er war neben dem Felsbrocken.", ...beside("boulder") },
      colour: "#334155",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "F",
      name: "Francisco",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Stuhl.",
        ...all(on("chair"), counting(onlyOneOnAChair)),
      },
      colour: "#ea580c",
      face: "\u{1F477}‍♂️",
    },
    {
      id: "G",
      name: "Gemma",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke und südlich von Benjamin.",
        ...all(
          own((c) => inCorner(c, c.cell)),
          about(["B"], (c) => {
            const benjamin = c.cellOf("B");
            return benjamin !== undefined && c.cell.row > benjamin.row;
          }),
        ),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "H",
      name: "Hans",
      pronoun: "er",
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#a16207",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "O",
      name: "Orlando",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D1}",
    },
  ],
  hints: [
    {
      text: "Antonio war neben dem Regal in R6 C6. R5 C6 ist ein Tisch, und auf dem Stuhl in R6 C7 darf er nicht sein - Francisco war die einzige Person auf einem Stuhl. Antonio war in R6 C5. Blockiere den Rest von R6 und C5.",
      place: { A: { row: 5, col: 4 } },
      cross: [
        { row: 5, col: 0 },
        { row: 5, col: 1 },
        { row: 5, col: 2 },
        { row: 5, col: 3 },
        { row: 5, col: 5 },
        { row: 5, col: 6 },
        { row: 5, col: 7 },
        { row: 5, col: 8 },
        { row: 0, col: 4 },
        { row: 1, col: 4 },
        { row: 2, col: 4 },
        { row: 3, col: 4 },
        { row: 4, col: 4 },
        { row: 6, col: 4 },
        { row: 7, col: 4 },
        { row: 8, col: 4 },
      ],
    },
    {
      text: "Francisco saß auf einem Stuhl: R4 C5 liegt in C5 und R6 C7 in R6, also bleibt der Sessel in R5 C1. Blockiere den Rest von R5 und C1.",
      place: { F: { row: 4, col: 0 } },
      cross: [
        { row: 4, col: 1 },
        { row: 4, col: 2 },
        { row: 4, col: 3 },
        { row: 4, col: 4 },
        { row: 4, col: 5 },
        { row: 4, col: 6 },
        { row: 4, col: 7 },
        { row: 4, col: 8 },
        { row: 3, col: 0 },
        { row: 5, col: 0 },
        { row: 6, col: 0 },
        { row: 7, col: 0 },
        { row: 8, col: 0 },
      ],
    },
    {
      text: "Hans war auf einem Bett. Das Bett im Gästezimmer liegt in R5, und R7 C1 liegt in C1 - Hans war in R7 C2. Claus war im Wohnzimmer südwestlich vom Fernseher in R6 C8, also in R7 bis R9 und C6 oder C7. R7 ist gesperrt, R8 C7 und R9 C6 sind Tische, R9 C7 ist Schutt: Claus war in R8 C6.",
      place: { H: { row: 6, col: 1 }, C: { row: 7, col: 5 } },
    },
    {
      text: "Emmett war neben dem Felsbrocken in R2 C6. R1 C6 und R3 C6 liegen in C6, R2 C5 in C5 - Emmett war in R2 C7. Benjamin war in C8, aber nicht im Wohnzimmer mit dem Fernseher: R2 ist gesperrt, R3 C8 ist Schutt und R5 gesperrt, also war Benjamin in R4 C8.",
      place: { E: { row: 1, col: 6 }, B: { row: 3, col: 7 } },
    },
    {
      text: "Gemma war südlich von Benjamin, also unterhalb von R4 - dort ist nur noch R9 frei. Von R9 C3, R9 C4 und R9 C9 ist nur R9 C9 eine Ecke: Gemma war in R9 C9.",
      place: { G: { row: 8, col: 8 } },
    },
    {
      text: "Frei sind nur noch R1 und R3 in C3 und C4, und R1 C4 ist Schutt. Wer in C4 war, war also in R3 C4, und Dina in C3 war in R1 C3. Orlando blieb R3 C4 im Esszimmer - allein mit Antonio. Antonio ist der Mörder!",
      place: { D: { row: 0, col: 2 }, O: { row: 2, col: 3 } },
    },
  ],
  solution: {
    A: { row: 5, col: 4 },
    B: { row: 3, col: 7 },
    C: { row: 7, col: 5 },
    D: { row: 0, col: 2 },
    E: { row: 1, col: 6 },
    F: { row: 4, col: 0 },
    G: { row: 8, col: 8 },
    H: { row: 6, col: 1 },
    O: { row: 2, col: 3 },
  },
};
