/**
 * King-Size Beds: a bathroom, a kitchen, a guest room, a dining room, a
 * bedroom and a living room, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Kingsize-Betten/Kingsize-Betten.png`,
 * solution sheet `Das Murdoku-Orginal/Lösungen 1-80/Lösung 13-16.JPG`).
 * Otis is the victim; whoever was alone with him killed him.
 *
 * The armchairs and the beds can be stood on; the TV, the plants, the
 * shelves, the dark tables and the kitchen counter (a table) cannot. Sitting
 * on a chair means being on an armchair. The windows are the bars in the
 * outer walls; standing directly in front of one means being on the field
 * right beside it.
 */
import {
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
import type { Cell, Context, Level } from "../engine/types";

/** The fields right in front of a window. */
const WINDOWS: readonly Cell[] = [
  { row: 1, col: 8 },
  { row: 4, col: 8 },
  { row: 7, col: 8 },
  { row: 6, col: 0 },
  { row: 8, col: 0 },
];

/** Whether a field lies right in front of a window. */
function byWindow(cell: Cell): boolean {
  return WINDOWS.some((one) => one.row === cell.row && one.col === cell.col);
}

/** Whether the guest room held exactly the suspect and Bruce. */
function aloneWithBruce(c: Context): boolean {
  const there = c.peopleIn("G");
  return there.length === 2 && there.includes("B");
}

/** The case. */
export const KING_SIZE_BEDS: Level = {
  id: "king-size-beds",
  name: "Kingsize-Betten",
  series: { book: "original", number: 16 },
  story: "Das könnte unser erster Fall von Königsmord sein.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "stone",
      tint: "#eed6d8",
      label: { row: 3, col: 0 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#d9d4ec",
      label: { row: 3, col: 3 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#e6ccd0",
      label: { row: 2, col: 6 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#eed2d6",
      label: { row: 5, col: 6 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#dcbcc4",
      label: { row: 8, col: 1 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#efdfe2",
      label: { row: 8, col: 5 },
    },
  ],
  areaMap: [
    "BBKKKGGGG",
    "BBKKKGGGG",
    "BBKKKGGGG",
    "BBKKKEEEE",
    "SSSSEEEEE",
    "SSSSEEEEE",
    "SSSSWWWWW",
    "SSSSWWWWW",
    "SSSSWWWWW",
  ],
  thingMap: [
    ".tt..tbb.",
    "..p.t.bb.",
    "t...tr.t.",
    "c..tt.c.p",
    "....cttt.",
    ".bb..c..c",
    ".bb.trf..",
    "t..tp...c",
    ".p.r.cc.c",
  ],
  things: {
    b: "bed",
    c: "chair",
    f: "tv",
    p: "plant",
    r: "shelf",
    t: "table",
  },
  shapes: [
    [
      { row: 1, col: 4 },
      { row: 2, col: 4 },
      { row: 3, col: 4 },
      { row: 3, col: 3 },
    ],
  ],
  pieces: [
    { at: { row: 0, col: 6 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 5 }, rows: 1, cols: 3 },
    { at: { row: 5, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 1 }, rows: 1, cols: 2 },
  ],
  windows: [
    { at: { row: 1, col: 8 }, side: "right" },
    { at: { row: 4, col: 8 }, side: "right" },
    { at: { row: 7, col: 8 }, side: "right" },
    { at: { row: 6, col: 0 }, side: "left" },
    { at: { row: 8, col: 0 }, side: "left" },
  ],
  suspects: [
    {
      id: "A",
      name: "Ashton",
      pronoun: "er",
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Bruce",
      pronoun: "er",
      clue: {
        text: "Er war direkt vor einem Fenster.",
        ...own((c) => byWindow(c.cell)),
        glow: (level) => cellsWhere(level, byWindow),
      },
      colour: "#15803d",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "C",
      name: "Charlotte",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl im Wohnzimmer.",
        ...all(on("chair"), inArea("W")),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dakota",
      pronoun: "sie",
      clue: {
        text: "Sie war allein im Gästezimmer mit Bruce.",
        ...all(inArea("G"), counting(aloneWithBruce)),
      },
      colour: "#4338ca",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Emilio",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#7c3aed",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "F",
      name: "Fata",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#9f1239",
      face: "\u{1F469}",
    },
    {
      id: "G",
      name: "Gloria",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Tisch.", ...beside("table") },
      colour: "#ea580c",
      face: "\u{1F469}",
    },
    {
      id: "H",
      name: "Hazel",
      pronoun: "sie",
      clue: {
        text: "Sie saß nicht auf einem Stuhl. Sie war nicht im Schlafzimmer.",
        ...all(not(on("chair")), not(inArea("S"))),
      },
      colour: "#0f766e",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "O",
      name: "Otis",
      pronoun: "er",
      clue: {
        text: "Er war im letzten verbleibenden Feld, allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Bruce und Dakota sind im Gästezimmer; das lokalisiert Bruce vor dem Fenster.",
      place: { B: { row: 1, col: 8 } },
    },
    {
      text: "Das lokalisiert Charlotte in Zeile 9 auf einen der beiden verbleibenden Stühle. Schließe den Rest von Zeile 9 aus.",
      cross: [
        { row: 8, col: 0 },
        { row: 8, col: 2 },
        { row: 8, col: 4 },
        { row: 8, col: 7 },
        { row: 8, col: 8 },
      ],
    },
    {
      text: "Das lokalisiert Fata (die laut Dakotas Hinweis nicht im Gästezimmer ist) neben dem Regal im Wohnzimmer.",
      place: { F: { row: 7, col: 5 } },
    },
    {
      text: "Das lokalisiert Charlotte in Spalte 7, was Dakota auf dem Bett im Gästezimmer lokalisiert.",
      place: { C: { row: 8, col: 6 }, D: { row: 0, col: 7 } },
    },
    {
      text: "Das lokalisiert Emilio im letzten Feld neben einer Pflanze, was Ashton auf eines der Bettfelder in Spalte 2 setzt.",
      place: { E: { row: 2, col: 2 } },
    },
    {
      text: "Das lokalisiert Hazel im Esszimmer, was Ashton in Zeile 7 lokalisiert.",
      place: { H: { row: 5, col: 4 }, A: { row: 6, col: 1 } },
    },
    {
      text: "Das lokalisiert Gloria auf dem Stuhl im Badezimmer, dann Otis.",
      place: { G: { row: 3, col: 0 }, O: { row: 4, col: 3 } },
    },
    {
      text: "Ashton war allein mit Otis im Schlafzimmer. Ashton ist der Mörder!",
    },
  ],
  solution: {
    A: { row: 6, col: 1 },
    B: { row: 1, col: 8 },
    C: { row: 8, col: 6 },
    D: { row: 0, col: 7 },
    E: { row: 2, col: 2 },
    F: { row: 7, col: 5 },
    G: { row: 3, col: 0 },
    H: { row: 5, col: 4 },
    O: { row: 4, col: 3 },
  },
};
