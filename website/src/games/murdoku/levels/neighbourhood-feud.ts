/**
 * Neighbourhood Feud: two neighbouring plots, Arnold's and Brie's, each with
 * a pool, a garden and a house, and a murdered guest.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Nachbarschaftsstreit.png`, no solution
 * sheet; the solver proves the case has exactly one solution). Vivi is the
 * victim; whoever was alone with her killed her. Every area belongs to
 * Arnold or to Brie, which their own clues ask about. Beds, chairs and rugs
 * can be stood on; trees, the plant, tables, the shelf, the wardrobe and the
 * TVs cannot.
 */
import {
  all,
  alone,
  beside,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */

/** Arnold's pool, garden and house. */
const ARNOLDS_AREAS: readonly string[] = ["P", "G", "H"];

/** Brie's pool, garden and house. */
const BRIES_AREAS: readonly string[] = ["Q", "R", "S"];

/** How many people stand in an area where one is alone with one other. */
const PAIR = 2;

/** The side length of the square map. */
const SIZE = 8;

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

/** Whether the suspect is alone in her area with exactly one man. */
function aloneWithMan(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  return others.length === PAIR - 1 && c.has(others[0], "man");
}

/** The case. */
export const NEIGHBOURHOOD_FEUD: Level = {
  id: "neighbourhood-feud",
  name: "Nachbarschaftsstreit",
  difficulty: "medium",
  series: { book: "online" },
  story:
    "Vivi wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "P",
      name: "Arnolds Pool",
      at: "in Arnolds Pool",
      ground: "water",
      tint: "#a9bfe8",
      label: { row: 1, col: 1 },
    },
    {
      key: "G",
      name: "Arnolds Garten",
      at: "in Arnolds Garten",
      ground: "grass",
      tint: "#7fc9a0",
      label: { row: 3, col: 0 },
    },
    {
      key: "H",
      name: "Arnolds Haus",
      at: "in Arnolds Haus",
      ground: "floor",
      tint: "#9fb8cc",
      label: { row: 7, col: 1 },
    },
    {
      key: "Q",
      name: "Bries Pool",
      at: "in Bries Pool",
      ground: "water",
      tint: "#a9bfe8",
      label: { row: 3, col: 7 },
    },
    {
      key: "R",
      name: "Bries Garten",
      at: "in Bries Garten",
      ground: "grass",
      tint: "#9fd08a",
      label: { row: 4, col: 4 },
    },
    {
      key: "S",
      name: "Bries Haus",
      at: "in Bries Haus",
      ground: "floor",
      tint: "#e6dc9c",
      label: { row: 7, col: 5 },
    },
  ],
  areaMap: [
    "GPPGRRRR",
    "GPPGRQQQ",
    "GGGGRQQQ",
    "GGGGRRRQ",
    "HHHHRRRS",
    "HHHHSSSS",
    "HHHHSSSS",
    "HHHHSSSS",
  ],
  thingMap: [
    "...t....",
    "........",
    "....c...",
    "..c..uu.",
    ".kv.tp..",
    "......b.",
    "..uw.sbk",
    "bbuw..cv",
  ],
  things: {
    b: "bed",
    c: "chair",
    k: "table",
    p: "plant",
    s: "shelf",
    t: "tree",
    u: "rug",
    v: "tv",
    w: "wardrobe",
  },
  extraThings: {
    wardrobe: {
      name: "Schrank",
      emoji: "\u{1F6AA}",
      standable: false,
      kinds: ["furniture"],
    },
  },
  pieces: [
    { at: { row: 3, col: 5 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 6 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 0 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Arnold",
      pronoun: "er",
      clue: {
        text: "Er war allein in einem seiner eigenen Bereiche.",
        ...all(inArea(...ARNOLDS_AREAS), alone()),
      },
      colour: "#b91c1c",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Brie",
      pronoun: "sie",
      clue: {
        text: "Sie war in einem ihrer eigenen Bereiche.",
        ...inArea(...BRIES_AREAS),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Casey",
      pronoun: "er",
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Dorothy",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit einem Mann.",
        ...counting(aloneWithMan),
      },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "E",
      name: "Eda",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Teppich.", ...on("rug") },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "F",
      name: "Fabian",
      pronoun: "er",
      clue: { text: "Er war neben einem Baum.", ...beside("tree") },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Ginevra",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fernseher.", ...beside("tv") },
      colour: "#4338ca",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "V",
      name: "Vivi",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit dem Mörder.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}",
    },
  ],
  rules: [
    {
      text: "Genau eine Person saß auf einem Stuhl.",
      check: (c) =>
        c.people().filter((id) => {
          const there = c.cellOf(id);
          return there !== undefined && c.is(there, "seat");
        }).length === 1,
    },
  ],
  hints: [
    {
      text: "C ist auf einem Bett in R8 oder C7. Blockiere das Schnittfeld R8 C7, auf dem niemand sein kann (jemand in R8 C7 würde alle möglichen Bettfelder für C blockieren).",
      cross: [{ row: 7, col: 6 }],
    },
    {
      text: "E ist auf einem Teppich in R4 oder C3. Blockiere das Schnittfeld R4 C3. Laut dem allgemeinen Hinweis muss jemand auf dem letzten Stuhl in R3 C5 sitzen. Blockiere den Rest von R3 und C5.",
      cross: [
        { row: 3, col: 2 },
        ...rowExcept(2, [4]),
        ...columnExcept(4, [2]),
      ],
    },
    {
      text: "Das isoliert F auf dem letzten Feld neben einem Baum in R2 C4, was G auf dem letzten Feld neben einem Fernseher in R6 C3 isoliert.",
      place: { F: { row: 1, col: 3 }, G: { row: 5, col: 2 } },
    },
    {
      text: "A muss allein in einem seiner eigenen Bereiche sein, doch F ist in seinem Garten und G in seinem Haus. A kann nur in Arnolds Pool allein sein. Das isoliert A auf dem letzten Feld in seinem Pool, R1 C2.",
      place: { A: { row: 0, col: 1 } },
    },
    {
      text: "E ist in R4 C6 oder R4 C7. Blockiere den Rest von R4.",
      cross: rowExcept(3, [5, 6]),
    },
    {
      text: "D allein mit einem Mann kann nur mit C allein sein. G belegt Arnolds Haus, also muss C mit D allein in Bries Haus sein. Das isoliert C und D.",
      place: {
        C: { row: 6, col: 6 },
        D: { row: 4, col: 7 },
        E: { row: 3, col: 5 },
      },
    },
    {
      text: "Das isoliert B auf dem letzten freien Feld in einem ihrer eigenen Bereiche, R3 C5, und dann V auf dem letzten verbleibenden Feld. V war allein mit G, Ginevra ist die Mörderin!",
      place: { B: { row: 2, col: 4 }, V: { row: 7, col: 0 } },
    },
  ],
  solution: {
    A: { row: 0, col: 1 },
    B: { row: 2, col: 4 },
    C: { row: 6, col: 6 },
    D: { row: 4, col: 7 },
    E: { row: 3, col: 5 },
    F: { row: 1, col: 3 },
    G: { row: 5, col: 2 },
    V: { row: 7, col: 0 },
  },
};
