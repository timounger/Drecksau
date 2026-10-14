/**
 * Rainy Day: a kitchen, a living room, a dining room, a bedroom, a guest room
 * and a bathroom of a house, with a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Regentag/Regentag.png`,
 * solution on `Das Murdoku-Orginal/Lösungen 1-80/Lösung 29-32.JPG`).
 * Othello is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they, the beds and the rugs can be stood on.
 * Tables (the kitchen counter among them), shelves, TVs and plants cannot.
 * A field is in a corner of its room when the room's border runs along two of
 * its sides that meet: one above or below it, one to its left or right.
 */
import {
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

/** Whether nobody but the suspect sits on a chair. */
function onlyOneOnAChair(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "chair");
  });
}

/** The case. */
export const RAINY_DAY: Level = {
  id: "rainy-day",
  name: "Regentag",
  series: { book: "original", number: 30 },
  story: "Dieser Niederschlag stand in keinem Wetterbericht.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#d3dde6",
      label: { row: 4, col: 0 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "stone",
      tint: "#bcd6dc",
      label: { row: 1, col: 4 },
    },
    {
      key: "Z",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "stone",
      tint: "#c9bfe0",
      label: { row: 4, col: 3 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#b9d9d9",
      label: { row: 8, col: 1 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#b4d0d6",
      label: { row: 6, col: 6 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "stone",
      tint: "#c2e0e0",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "KKWWWWWWW",
    "KKWWWWWWW",
    "KKZZZZZWW",
    "KKZZZZZGG",
    "KKZZZZZGG",
    "SSSSGGGGG",
    "SSSSGGGGG",
    "SSSSBBBBB",
    "SSSSBBBBB",
  ],
  thingMap: [
    "tt..sfs..",
    ".trrc.c.p",
    ".....c.tc",
    "..ctttc..",
    "t....p..r",
    "f....bb.r",
    "sc..s...p",
    ".bpc..tct",
    ".b..rr...",
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
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
    ],
  ],
  pieces: [
    { at: { row: 1, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 3 }, rows: 1, cols: 3 },
    { at: { row: 4, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 5 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 8, col: 4 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Albert",
      pronoun: "er",
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Betty",
      pronoun: "sie",
      clue: {
        text: "Sie war allein in der Küche.",
        ...all(inArea("K"), alone()),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Carlos",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Tisch. Er war nicht im Esszimmer.",
        ...all(beside("table"), not(inArea("Z"))),
      },
      colour: "#0e7490",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "D",
      name: "Dörte",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOnAChair)),
      },
      colour: "#6366f1",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Esther",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Teppich.", ...on("rug") },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Florian",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#9f1239",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Günther",
      pronoun: "er",
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#ea580c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "H",
      name: "Hannah",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke.",
        ...own((c) => inCorner(c.areaOf, c.cell)),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Othello",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  hints: [
    {
      text: "Günther ist auf einem der Betten. Schließe das sich überschneidende Feld in Zeile 6, Spalte 2 aus.",
      cross: [{ row: 5, col: 1 }],
    },
    {
      text: "Das lokalisiert Albert neben dem Fernseher im Wohnzimmer.",
      place: { A: { row: 1, col: 5 } },
    },
    {
      text: "Esther ist auf einem der verbleibenden Teppiche. Schließe das sich überschneidende Feld in Zeile 9, Spalte 9 aus.",
      cross: [{ row: 8, col: 8 }],
    },
    {
      text: "Das lokalisiert Carlos in Zeile 9, Spalte 7 (laut Carlos' Hinweis war er nicht im Esszimmer, nicht auf einem Stuhl laut Dörtes Hinweis und nicht in der Küche laut Bettys Hinweis).",
      place: { C: { row: 8, col: 6 } },
    },
    {
      text: "Das lokalisiert Günther und platziert Esther in Spalte 9 auf dem Teppich.",
      place: { G: { row: 7, col: 1 } },
    },
    {
      text: "Schließe den Rest von Spalte 9 aus. Das lokalisiert Dörte auf dem letzten Stuhl. Das lokalisiert Betty.",
      cross: [
        { row: 0, col: 8 },
        { row: 2, col: 8 },
        { row: 3, col: 8 },
      ],
      place: { D: { row: 3, col: 2 }, B: { row: 2, col: 0 } },
    },
    {
      text: "Hannah muss in Zeile 6 sein, in Spalte 4 oder 5. Das lokalisiert Esther, dann Florian.",
      place: { E: { row: 4, col: 8 }, F: { row: 6, col: 7 } },
    },
    {
      text: "Das lokalisiert Hannah und Othello, der allein im Wohnzimmer mit Albert war. Albert ist der Mörder!",
      place: { H: { row: 5, col: 4 }, O: { row: 0, col: 3 } },
    },
  ],
  solution: {
    A: { row: 1, col: 5 },
    B: { row: 2, col: 0 },
    C: { row: 8, col: 6 },
    D: { row: 3, col: 2 },
    E: { row: 4, col: 8 },
    F: { row: 6, col: 7 },
    G: { row: 7, col: 1 },
    H: { row: 5, col: 4 },
    O: { row: 0, col: 3 },
  },
};
