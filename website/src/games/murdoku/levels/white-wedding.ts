/**
 * White Wedding: a chapel with an altar, a porch and two courtyards, and a
 * murdered wedding guest.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Weiße Hochzeit.png`, no solution sheet;
 * the solver proves the case has exactly one solution). Vikram is the
 * victim; whoever was alone with him killed him. Chairs can be stood on;
 * trees, flowers and tables cannot. A field is in a corner of its area when
 * the area's border or the map's edge runs along two adjacent sides of it.
 */
import {
  about,
  beside,
  column,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */

/** The side length of the square map. */
const SIZE = 9;

/** The key of the altar. */
const ALTAR = "A";

/** How many people stand on the altar: a man and a woman. */
const PAIR = 2;

/** The steps to the four sides of a field: up, down, left, right. */
const UP: Cell = { row: -1, col: 0 };
const DOWN: Cell = { row: 1, col: 0 };
const LEFT: Cell = { row: 0, col: -1 };
const RIGHT: Cell = { row: 0, col: 1 };

/** The pairs of adjacent sides that make a corner. */
const CORNERS: readonly (readonly [Cell, Cell])[] = [
  [UP, LEFT],
  [UP, RIGHT],
  [DOWN, LEFT],
  [DOWN, RIGHT],
];

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

/**
 * The fields of a column, counted from nought, except some rows.
 *
 * @param col - the column
 * @param keep - the rows left out
 * @returns the fields
 */
function columnExcept(col: number, keep: readonly number[]): readonly Cell[] {
  return Array.from({ length: SIZE }, (_, row) => ({ row, col })).filter(
    (cell) => !keep.includes(cell.row),
  );
}

/** Whether the area's border or the map's edge runs along this side of the suspect's field. */
function bordered(c: Context, step: Cell): boolean {
  const next = { row: c.cell.row + step.row, col: c.cell.col + step.col };
  return c.areaOf(next) !== c.areaOf(c.cell);
}

/** Whether the suspect stands in a corner of their area. */
function inCorner(c: Context): boolean {
  return CORNERS.some(([one, other]) => bordered(c, one) && bordered(c, other));
}

/** Whether the suspect is north-east of Crystal. */
function northEastOfCrystal(c: Context): boolean {
  const crystal = c.cellOf("C");
  return (
    crystal !== undefined &&
    c.cell.row < crystal.row &&
    c.cell.col > crystal.col
  );
}

/** Whether somebody else in the suspect's area was beside a tree. */
function withSomebodyBesideTree(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").some((id) => {
    const there = c.cellOf(id);
    return id !== c.self && there !== undefined && c.beside(there, "tree");
  });
}

/** Whether exactly a man and a woman stand on the altar. */
function manAndWomanOnAltar(c: Context): boolean {
  const there = c.peopleIn(ALTAR);
  return (
    there.length === PAIR &&
    there.some((id) => c.has(id, "man")) &&
    there.some((id) => c.has(id, "woman"))
  );
}

/** The case. */
export const WHITE_WEDDING: Level = {
  id: "white-wedding",
  name: "Weiße Hochzeit",
  difficulty: "medium",
  series: { book: "online" },
  story:
    "Vikram wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Westhof",
      at: "im Westhof",
      ground: "grass",
      tint: "#b4ec98",
      label: { row: 8, col: 0 },
    },
    {
      key: ALTAR,
      name: "Altar",
      at: "auf dem Altar",
      ground: "carpet",
      tint: "#fcdcef",
      label: { row: 1, col: 4 },
    },
    {
      key: "K",
      name: "Kapelle",
      at: "in der Kapelle",
      ground: "floor",
      tint: "#ffffff",
      label: { row: 6, col: 3 },
    },
    {
      key: "P",
      name: "Veranda",
      at: "auf der Veranda",
      ground: "stone",
      tint: "#fbe9f5",
      label: { row: 8, col: 3 },
    },
    {
      key: "O",
      name: "Osthof",
      at: "im Osthof",
      ground: "grass",
      tint: "#b4ec98",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "WWKAAAKOO",
    "WWKAAAKOO",
    "WWKKKKKOO",
    "WWKKKKKOO",
    "WWKKKKKOO",
    "WWKKKKKOO",
    "WWKKKKKOO",
    "WWWPPPOOO",
    "WWWPPPOOO",
  ],
  thingMap: [
    ".f..t...b",
    "b........",
    ".....f...",
    "..fc.c..b",
    "..cc.cc.t",
    "f........",
    "..fc.ccfb",
    "bttf..f..",
    "..t......",
  ],
  things: {
    b: "tree",
    c: "chair",
    f: "flowers",
    t: "table",
  },
  // The altar rug and the runner down the aisle, as the page draws them.
  carpets: [
    [
      { row: 0, col: 3 },
      { row: 0, col: 4 },
      { row: 0, col: 5 },
      { row: 1, col: 3 },
      { row: 1, col: 4 },
      { row: 1, col: 5 },
    ],
    [
      { row: 2, col: 4 },
      { row: 3, col: 4 },
      { row: 4, col: 4 },
      { row: 5, col: 4 },
      { row: 6, col: 4 },
    ],
  ],
  // The table round the corner in the west yard.
  shapes: [
    [
      { row: 7, col: 1 },
      { row: 7, col: 2 },
      { row: 8, col: 2 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Archer",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Brooke",
      pronoun: "sie",
      clue: { text: "Sie war neben ein paar Blumen.", ...beside("flowers") },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "C",
      name: "Crystal",
      pronoun: "sie",
      clue: { text: "Sie war in der fünften Spalte.", ...column(5) },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Daisy",
      pronoun: "sie",
      clue: { text: "Sie war auf der Veranda.", ...inArea("P") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Ernie",
      pronoun: "er",
      clue: {
        text: "Er war nordöstlich von Crystal.",
        ...about(["C"], northEastOfCrystal),
      },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Finn",
      pronoun: "er",
      clue: { text: "Er war in einer Ecke seines Bereichs.", ...own(inCorner) },
      colour: "#9f1239",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "G",
      name: "Giulia",
      pronoun: "sie",
      clue: {
        text: "Sie war bei jemandem, der neben einem Baum war.",
        ...counting(withSomebodyBesideTree),
      },
      colour: "#ea580c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "H",
      name: "Harper",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("seat") },
      colour: "#4338ca",
      face: "\u{1F475}",
    },
    {
      id: "V",
      name: "Vikram",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      text: "Auf dem Altar waren ein Mann und eine Frau.",
      check: manAndWomanOnAltar,
    },
  ],
  hints: [
    {
      text: "Da der allgemeine Hinweis besagt, dass ein Mann und eine Frau am Altar sind, können wir herleiten, dass sie R1 und R2 belegen müssen, denn der Altar erstreckt sich nur über zwei Reihen. Streiche alle anderen Felder in diesen Reihen.",
      cross: [...rowExcept(0, [3, 4, 5]), ...rowExcept(1, [3, 4, 5])],
    },
    {
      text: "Unter allen Frauen kann nur C am Altar sein. Es kann nicht B sein, da sie neben Blumen sein muss. Es kann nicht D sein, da sie auf der Veranda ist. Es kann nicht G sein, da sie in einem Bereich mit Bäumen sein muss. Es kann nicht H sein, da sie auf einem Stuhl sitzt. Das bedeutet, dass C die Frau am Altar ist, also ist sie in R2 C5. Da E nordöstlich von C ist, muss er in R1 C6 sein.",
      place: { C: { row: 1, col: 4 }, E: { row: 0, col: 5 } },
    },
    {
      text: "Das schränkt D auf R9 C4 ein, das letzte Feld auf der Veranda. Da F in der Ecke seines Bereichs sein muss, muss er in R7 C7 sein, der einzigen verbleibenden Ecke.",
      place: { D: { row: 8, col: 3 }, F: { row: 6, col: 6 } },
    },
    {
      text: "H belegt den letzten Stuhl in R5 C3. A ist in R6 C9, denn das ist das letzte Feld, auf dem er neben einem Tisch sein kann.",
      place: { H: { row: 4, col: 2 }, A: { row: 5, col: 8 } },
    },
    {
      text: "Das letzte Feld, auf dem B neben Blumen sein kann, ist R8 C8.",
      place: { B: { row: 7, col: 7 } },
    },
    {
      text: "Da G bei jemandem ist, der neben einem Baum war, muss diese Person R3 C1 belegen. Streiche alle Felder, die R3 C1 schneiden. Das bedeutet, dass G in R4 C2 sein muss. Damit bleibt das letzte Feld R3 C1 für V, also ist G die Mörderin.",
      place: { G: { row: 3, col: 1 }, V: { row: 2, col: 0 } },
      cross: [...rowExcept(2, [0]), ...columnExcept(0, [2])],
    },
  ],
  solution: {
    A: { row: 5, col: 8 },
    B: { row: 7, col: 7 },
    C: { row: 1, col: 4 },
    D: { row: 8, col: 3 },
    E: { row: 0, col: 5 },
    F: { row: 6, col: 6 },
    G: { row: 3, col: 1 },
    H: { row: 4, col: 2 },
    V: { row: 2, col: 0 },
  },
};
