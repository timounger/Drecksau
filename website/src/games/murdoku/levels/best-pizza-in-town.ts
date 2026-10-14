/**
 * Best Pizza in Town: two rival pizzerias with their kitchens on either side
 * of a street, with a murdered pizzeria owner.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/32. Beste Pizza der Stadt.png`,
 * solution on `Lösungen 1-80/Lösung 29-32.JPG`).
 * Ottavio is the victim; whoever was alone with him killed him.
 *
 * Every car covers two fields and faces east: its west field is the back.
 * Cars and the armchairs can be stood on; the tables (the kitchen counters
 * among them), the TVs and the plants cannot. Sitting on a chair means being
 * on an armchair. The windows are the bars in the walls along the street;
 * standing on the street in front of one means being on the street field
 * right beside it.
 */
import {
  about,
  all,
  cellsWhere,
  column,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */

/** The street fields right in front of a window. */
const WINDOWS: readonly Cell[] = [
  { row: 3, col: 3 },
  { row: 4, col: 6 },
  { row: 4, col: 7 },
];

/** Whether a field lies right in front of a window. */
function byWindow(cell: Cell): boolean {
  return WINDOWS.some((one) => one.row === cell.row && one.col === cell.col);
}

/** Whether a TV stands in the field's row and area. */
function tvInRowAndRoom(c: Context): boolean {
  const area = c.areaOf(c.cell);
  return c
    .cellsOf(area ?? "")
    .some((cell) => cell.row === c.cell.row && c.is(cell, "tv"));
}

/** Whether nobody but the suspect stood on a thing of this id. */
function onlyOneOn(what: string): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return id === c.self || there === undefined || !c.is(there, what);
    });
}

/** The case. */
export const BEST_PIZZA_IN_TOWN: Level = {
  id: "best-pizza-in-town",
  name: "Beste Pizza der Stadt",
  series: { book: "original", number: 32 },
  story:
    "Ist das ein Fall von Pizzeria-Rivalität, die außer Kontrolle geriet? Oder war es ein unzufriedener Kunde?",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "O",
      name: "Ottavios Pizzeria",
      at: "in Ottavios Pizzeria",
      ground: "stone",
      tint: "#cfe7dc",
      label: { row: 2, col: 0 },
    },
    {
      key: "K",
      name: "Ottavios Küche",
      at: "in Ottavios Küche",
      ground: "stone",
      tint: "#c6e3e3",
      label: { row: 2, col: 6 },
    },
    {
      key: "S",
      name: "Straße",
      at: "auf der Straße",
      ground: "path",
      tint: "#9ca3b4",
      label: { row: 4, col: 3 },
    },
    {
      key: "G",
      name: "Giuseppes Pizzeria",
      at: "in Giuseppes Pizzeria",
      ground: "stone",
      tint: "#ecc4bd",
      label: { row: 7, col: 0 },
    },
    {
      key: "J",
      name: "Giuseppes Küche",
      at: "in Giuseppes Küche",
      ground: "stone",
      tint: "#f1dcd8",
      label: { row: 7, col: 5 },
    },
  ],
  areaMap: [
    "OOOOOOKK",
    "OOOOOOKK",
    "OOOOOOKK",
    "SSSSSSSS",
    "SSSSSSSS",
    "GGGGGGGG",
    "GGGGGGJJ",
    "GGGGJJJJ",
  ],
  thingMap: [
    ".f..tctt",
    "p.tc....",
    "..c....c",
    ".ba..ba.",
    "ba......",
    "c...p...",
    "tctc...t",
    ".pf.t.tt",
  ],
  things: {
    a: "car",
    b: "carBack",
    c: "chair",
    f: "tv",
    p: "plant",
    t: "table",
  },
  extraThings: {
    carBack: {
      name: "Auto (hinten)",
      emoji: "\u{1F697}",
      standable: true,
      kinds: ["car"],
    },
  },
  shapes: [
    [
      { row: 6, col: 7 },
      { row: 7, col: 7 },
      { row: 7, col: 6 },
    ],
  ],
  pieces: [
    { at: { row: 0, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 1 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 3, col: 5 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 4, col: 0 }, rows: 1, cols: 2, thing: "car" },
  ],
  windows: [
    { at: { row: 3, col: 3 }, side: "top" },
    { at: { row: 4, col: 6 }, side: "bottom" },
    { at: { row: 4, col: 7 }, side: "bottom" },
  ],
  suspects: [
    {
      id: "A",
      name: "Aubrey",
      pronoun: "sie",
      clue: {
        text: "In ihrer Zeile und im selben Raum war ein Fernseher.",
        ...own(tvInRowAndRoom),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bobby",
      pronoun: "er",
      clue: {
        text: "Er war auf der Straße, vor einem Fenster.",
        ...all(
          inArea("S"),
          own((c) => byWindow(c.cell)),
        ),
        glow: (level) => cellsWhere(level, byWindow),
      },
      colour: "#15803d",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "C",
      name: "Chiara",
      pronoun: "sie",
      clue: { text: "Sie war hinten in einem Auto.", ...on("carBack") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dominic",
      pronoun: "er",
      clue: { text: "Er war in der achten Spalte.", ...column(8) },
      colour: "#6366f1",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "E",
      name: "Elton",
      pronoun: "er",
      clue: { text: "Er war in Giuseppes Küche.", ...inArea("J") },
      colour: "#7c3aed",
      face: "\u{1F474}",
    },
    {
      id: "F",
      name: "Fitz",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOn("chair"))),
      },
      colour: "#9f1239",
      face: "\u{1F9D4}",
    },
    {
      id: "G",
      name: "Giuseppe",
      pronoun: "er",
      clue: {
        text: "Er war genau eine Zeile südlich von Chiara.",
        ...about(["C"], (c) => c.cellOf("C")?.row === c.cell.row - 1),
      },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Ottavio",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Bobby und Chiara sind auf der Straße.",
    },
    {
      text: "Giuseppe muss in Z6 sein und Chiara in Z5.",
    },
    {
      text: "Das lokalisiert Chiara in S1, dann Bobby in S4.",
      place: { C: { row: 4, col: 0 }, B: { row: 3, col: 3 } },
    },
    {
      text: "Das lokalisiert Aubrey (die laut Fitz' Hinweis nicht auf einem Stuhl war).",
      place: { A: { row: 0, col: 2 } },
    },
    {
      text: "Da Dominic in S8 war, gibt es nur einen verfügbaren Stuhl für Fitz, in Z7 S2. Wir können den anderen Stuhl ausschließen.",
      place: { F: { row: 6, col: 1 } },
      cross: [{ row: 2, col: 7 }],
    },
    {
      text: "Das lokalisiert Dominic und Elton, dann Giuseppe, dann das Opfer. Aubrey ist die Mörderin!",
      place: {
        D: { row: 1, col: 7 },
        E: { row: 7, col: 5 },
        G: { row: 5, col: 6 },
        O: { row: 2, col: 4 },
      },
    },
  ],
  solution: {
    A: { row: 0, col: 2 },
    B: { row: 3, col: 3 },
    C: { row: 4, col: 0 },
    D: { row: 1, col: 7 },
    E: { row: 7, col: 5 },
    F: { row: 6, col: 1 },
    G: { row: 5, col: 6 },
    O: { row: 2, col: 4 },
  },
};
