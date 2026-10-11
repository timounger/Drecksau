/**
 * The Remote Village: a storehouse, a forest, a tavern and a general store,
 * and a murdered villager.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Das Abgelegene Dorf.png`, no solution
 * sheet; the solver proves the case has exactly one solution). Vaughn is the
 * victim; whoever was alone with him killed him. Chairs, rugs and the cars
 * can be stood on; trees, shrubs, flowers, shelves, tables and boxes cannot.
 */
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

/** Whether the row just south of the suspect has a car in it at all. */
function carRowSouth(c: Context): boolean {
  return Array.from({ length: c.cols }, (_, col) => ({
    row: c.cell.row + 1,
    col,
  })).some((cell) => c.inside(cell) && c.is(cell, "car"));
}

/** Whether a woman stood in a car exactly one row south of the suspect. */
function womanInCarSouth(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      there !== undefined &&
      there.row === c.cell.row + 1 &&
      c.is(there, "car") &&
      c.has(id, "woman")
    );
  });
}

/** Whether nobody in the suspect's area was a man. */
function noManInArea(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").every((id) => !c.has(id, "man"));
}

/** Whether at least one woman was in the suspect's area. */
function womanInArea(c: Context): boolean {
  return c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .some((id) => id !== c.self && c.has(id, "woman"));
}

/** Whether the suspect was north of Ethan. */
function northOfEthan(c: Context): boolean {
  const ethan = c.cellOf("E");
  return ethan !== undefined && c.cell.row < ethan.row;
}

/** Whether a person stands on a seat. */
function seated(c: Context, id: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && c.is(there, "seat");
}

/** The case. */
export const THE_REMOTE_VILLAGE: Level = {
  id: "the-remote-village",
  name: "Das abgelegene Dorf",
  difficulty: "hard",
  series: { book: "online" },
  story:
    "Vaughn wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "L",
      name: "Lager",
      at: "im Lager",
      ground: "floor",
      tint: "#dce8b4",
      label: { row: 3, col: 1 },
    },
    {
      key: "W",
      name: "Wald",
      at: "im Wald",
      ground: "grass",
      tint: "#a9bd7c",
      label: { row: 8, col: 7 },
    },
    {
      key: "T",
      name: "Taverne",
      at: "in der Taverne",
      ground: "floor",
      tint: "#d7e4a8",
      label: { row: 4, col: 7 },
    },
    {
      key: "G",
      name: "Gemischtwarenladen",
      at: "im Gemischtwarenladen",
      ground: "floor",
      tint: "#e0eab9",
      label: { row: 8, col: 0 },
    },
  ],
  areaMap: [
    ".WWWWTTTT",
    ".WWWWTTTT",
    "LLLWWTTTT",
    "LLLWWTTTT",
    "GGGWWWTTT",
    "GGGWWWWW.",
    "GGGWWWWW.",
    "GGGGGWWW.",
    "GGGGGWWW.",
  ],
  groundMap: [
    "gggggffff",
    "gggggffff",
    "fffggffff",
    "fffggffff",
    "fffgggfff",
    "fffggssgg",
    "fffgssggg",
    "fffffsggg",
    "fffffsggg",
  ],
  grounds: { g: "grass", s: "stone", f: "floor" },
  thingMap: [
    ".f.rt..sc",
    "......ck.",
    "x.x...ckk",
    "x..f..uu.",
    "ssu.....c",
    "..u.raa..",
    "ssu.aa...",
    "ckuu..t..",
    "kk.x..f..",
  ],
  things: {
    a: "car",
    c: "chair",
    f: "flowers",
    k: "table",
    r: "shrub",
    s: "shelf",
    t: "tree",
    u: "rug",
    x: "box",
  },
  pieces: [
    { at: { row: 3, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 5 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 4 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Arnold",
      pronoun: "er",
      clue: {
        text: "Genau eine Reihe südlich von ihm war eine Frau in einem Auto.",
        ...all(own(carRowSouth), counting(womanInCarSouth)),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Bruce",
      pronoun: "er",
      clue: { text: "Er war neben einem Baum.", ...beside("tree") },
      colour: "#15803d",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "C",
      name: "Connor",
      pronoun: "er",
      clue: {
        text: "Er war nördlich von Ethan.",
        ...about(["E"], northOfEthan),
      },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Delilah",
      pronoun: "sie",
      clue: {
        text: "In ihrem Bereich war kein Mann.",
        ...counting(noManInArea),
      },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Ethan",
      pronoun: "er",
      clue: {
        text: "In seinem Bereich war mindestens eine Frau.",
        ...counting(womanInArea),
      },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Fern",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Teppich.", ...on("rug") },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "G",
      name: "Graham",
      pronoun: "er",
      clue: { text: "Er war in der fünften Spalte.", ...column(5) },
      colour: "#ea580c",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "H",
      name: "Hedda",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Strauch.", ...beside("shrub") },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "V",
      name: "Vaughn",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F468}‍\u{1F9B0}",
    },
  ],
  rules: [
    {
      text: "Genau eine Person saß auf einem Stuhl.",
      check: (c) => c.people().filter((id) => seated(c, id)).length === 1,
    },
  ],
  hints: [
    {
      text: "Wer kann laut As Hinweis die Frau in einem Auto sein? D kann nicht im Wald sein, da sie nicht bei einem Mann sein kann, und B muss im Wald sein. Es bleibt nur H: Neben dem Strauch muss sie in R6 C6 sein. (Nicht in C5, G ist bereits in dieser Spalte.)",
      place: { H: { row: 5, col: 5 } },
    },
    {
      text: "Dies ist ein 9x9-Gitter mit genau neun Personen, also muss in jeder Reihe und Spalte genau eine Person sein. Wer in C1 ist, muss auf dem letzten verfügbaren Feld sein: C1 R8. Blockiere den Rest von R8. Das isoliert B auf dem letzten Feld neben einem Baum.",
      place: { B: { row: 6, col: 6 } },
      cross: rowExcept(7, [0]),
    },
    {
      text: "C1 R8 enthält einen Stuhl, und laut dem allgemeinen Hinweis sitzt genau eine Person auf einem Stuhl. Blockiere alle anderen Stuhlfelder.",
      cross: [
        { row: 0, col: 8 },
        { row: 1, col: 6 },
        { row: 2, col: 6 },
        { row: 4, col: 8 },
      ],
    },
    {
      text: "A muss eine Reihe nördlich von H sein, in R5. Das isoliert F auf dem letzten Teppichfeld in R4 C8.",
      place: { F: { row: 3, col: 7 } },
    },
    {
      text: "Jemand muss auf dem letzten Feld in R1 sein, R1 C3: Blockiere den Rest von C3. Das isoliert A. Jemand muss auf dem letzten Feld in C9 sein, R2 C9: Blockiere den Rest von R2.",
      place: { A: { row: 4, col: 3 } },
      cross: [...columnExcept(2, [0]), ...rowExcept(1, [8])],
    },
    {
      text: "Jemand muss auf dem letzten Feld in C2 sein, R3 C2. Das isoliert G auf dem letzten Feld in C5.",
      place: { G: { row: 8, col: 4 } },
    },
    {
      text: "Da E südlich von C ist, kann E nur in der Taverne bei einer Frau sein, bei F. Das isoliert E und C.",
      place: { E: { row: 1, col: 8 }, C: { row: 0, col: 2 } },
    },
    {
      text: "Das isoliert D im Lager, jetzt dem einzigen Bereich ohne Mann, dann V auf dem letzten Feld.",
      place: { D: { row: 2, col: 1 }, V: { row: 7, col: 0 } },
    },
  ],
  solution: {
    A: { row: 4, col: 3 },
    B: { row: 6, col: 6 },
    C: { row: 0, col: 2 },
    D: { row: 2, col: 1 },
    E: { row: 1, col: 8 },
    F: { row: 3, col: 7 },
    G: { row: 8, col: 4 },
    H: { row: 5, col: 5 },
    V: { row: 7, col: 0 },
  },
};
