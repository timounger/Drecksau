/**
 * Demolition Zone: a half torn-down house - a guest room, a dining room, a
 * bedroom and a living room at the edge of the rubble - with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Abrisszone/Abrisszone.png`, solution
 * sheet `Das Murdoku-Orginal/Lösungen 1-80/Lösung 09-12.JPG`).
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
      text: "Weil Francisco die einzige Person auf einem Stuhl ist, lokalisiert das Antonio in Spalte 5, neben dem Regal.",
      place: { A: { row: 5, col: 4 } },
    },
    {
      text: "Das lokalisiert Francisco auf dem letzten verbleibenden Stuhl im Gästezimmer.",
      place: { F: { row: 4, col: 0 } },
    },
    {
      text: "Das eliminiert drei der vier Felder, die Teil eines Bettes sind, und lokalisiert Hans in Zeile 7, Spalte 2.",
      place: { H: { row: 6, col: 1 } },
    },
    {
      text: "Das lokalisiert Claus im Wohnzimmer.",
      place: { C: { row: 7, col: 5 } },
    },
    {
      text: "Das lokalisiert Emmett im letzten verbleibenden Feld neben dem Felsbrocken.",
      place: { E: { row: 1, col: 6 } },
    },
    {
      text: "Das lokalisiert Benjamin, dann Gemma.",
      place: { B: { row: 3, col: 7 }, G: { row: 8, col: 8 } },
    },
    {
      text: "Dina kann nur in Zeile 1 in Spalte 3 sein.",
      place: { D: { row: 0, col: 2 } },
    },
    {
      text: "Das lokalisiert Orlando. Antonio ist der Mörder!",
      place: { O: { row: 2, col: 3 } },
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
