/**
 * King-Size Beds: a bathroom, a kitchen, a guest room, a dining room, a
 * bedroom and a living room, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Kingsize-Betten/Kingsize-Betten.png`, no
 * solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
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
      text: "Dakota war allein mit Bruce im Gästezimmer - also war auch Bruce dort. Am Gästezimmer liegt nur das Fenster bei R2 C9: Bruce stand direkt davor, in R2 C9. Blockiere den Rest von R2 und C9.",
      place: { B: { row: 1, col: 8 } },
      cross: [
        { row: 1, col: 0 },
        { row: 0, col: 8 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 2, col: 8 },
        { row: 1, col: 3 },
        { row: 3, col: 8 },
        { row: 1, col: 4 },
        { row: 4, col: 8 },
        { row: 1, col: 5 },
        { row: 5, col: 8 },
        { row: 1, col: 6 },
        { row: 6, col: 8 },
        { row: 1, col: 7 },
        { row: 7, col: 8 },
        { row: 8, col: 8 },
      ],
    },
    {
      text: "Charlotte saß auf einem Stuhl im Wohnzimmer. Frei sind dort nur noch R9 C6 und R9 C7 - sie war also in R9. Fata war neben einem Regal: Neben dem Regal in R3 C6 liegt nur das Gästezimmer, wo allein Dakota und Bruce waren, und neben dem in R9 C4 nur R9 C3. Also war Fata in R8 C6, neben dem Regal in R7 C6. Blockiere den Rest von R8 und C6.",
      place: { F: { row: 7, col: 5 } },
      cross: [
        { row: 7, col: 0 },
        { row: 0, col: 5 },
        { row: 7, col: 1 },
        { row: 1, col: 5 },
        { row: 7, col: 2 },
        { row: 2, col: 5 },
        { row: 7, col: 3 },
        { row: 3, col: 5 },
        { row: 7, col: 4 },
        { row: 4, col: 5 },
        { row: 5, col: 5 },
        { row: 7, col: 6 },
        { row: 6, col: 5 },
        { row: 7, col: 7 },
        { row: 7, col: 8 },
        { row: 8, col: 5 },
      ],
    },
    {
      text: "Damit bleibt für Charlotte R9 C7. Dakota war im Gästezimmer: R1 C7 und R3 C7 sind jetzt gesperrt, R1 C6 und R3 C8 sind Tische, R3 C6 ist ein Regal - Dakota war auf dem Bett in R1 C8. Blockiere R1, C7 und C8.",
      place: { C: { row: 8, col: 6 }, D: { row: 0, col: 7 } },
      cross: [
        { row: 8, col: 0 },
        { row: 0, col: 6 },
        { row: 8, col: 1 },
        { row: 1, col: 6 },
        { row: 8, col: 2 },
        { row: 2, col: 6 },
        { row: 8, col: 3 },
        { row: 3, col: 6 },
        { row: 8, col: 4 },
        { row: 4, col: 6 },
        { row: 8, col: 5 },
        { row: 5, col: 6 },
        { row: 6, col: 6 },
        { row: 8, col: 7 },
        { row: 7, col: 6 },
        { row: 8, col: 8 },
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 7 },
        { row: 0, col: 2 },
        { row: 2, col: 7 },
        { row: 0, col: 3 },
        { row: 3, col: 7 },
        { row: 0, col: 4 },
        { row: 4, col: 7 },
        { row: 0, col: 5 },
        { row: 5, col: 7 },
        { row: 6, col: 7 },
        { row: 7, col: 7 },
        { row: 0, col: 8 },
      ],
    },
    {
      text: "Frei sind nur noch R3 bis R7 in C1 bis C5. Emilio war neben einer Pflanze: Das geht nur noch in R3 C3, neben der Pflanze in R2 C3. Blockiere den Rest von R3 und C3.",
      place: { E: { row: 2, col: 2 } },
      cross: [
        { row: 2, col: 0 },
        { row: 0, col: 2 },
        { row: 2, col: 1 },
        { row: 1, col: 2 },
        { row: 2, col: 3 },
        { row: 3, col: 2 },
        { row: 2, col: 4 },
        { row: 4, col: 2 },
        { row: 2, col: 5 },
        { row: 5, col: 2 },
        { row: 2, col: 6 },
        { row: 6, col: 2 },
        { row: 2, col: 7 },
        { row: 7, col: 2 },
        { row: 2, col: 8 },
        { row: 8, col: 2 },
      ],
    },
    {
      text: "Ashton war auf einem Bett: Frei sind nur noch R6 C2 und R7 C2 - Ashton war in C2. Hazel saß nicht auf einem Stuhl und war nicht im Schlafzimmer: Ihr bleiben R4 C2 und R6 C5. C2 gehört Ashton, also war Hazel in R6 C5 - und Ashton auf dem Bett in R7 C2.",
      place: { H: { row: 5, col: 4 }, A: { row: 6, col: 1 } },
      cross: [
        { row: 5, col: 0 },
        { row: 0, col: 4 },
        { row: 5, col: 1 },
        { row: 1, col: 4 },
        { row: 5, col: 2 },
        { row: 2, col: 4 },
        { row: 5, col: 3 },
        { row: 3, col: 4 },
        { row: 4, col: 4 },
        { row: 5, col: 5 },
        { row: 5, col: 6 },
        { row: 6, col: 4 },
        { row: 5, col: 7 },
        { row: 7, col: 4 },
        { row: 5, col: 8 },
        { row: 8, col: 4 },
        { row: 6, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 1 },
        { row: 6, col: 2 },
        { row: 2, col: 1 },
        { row: 6, col: 3 },
        { row: 3, col: 1 },
        { row: 4, col: 1 },
        { row: 6, col: 5 },
        { row: 6, col: 6 },
        { row: 6, col: 7 },
        { row: 7, col: 1 },
        { row: 6, col: 8 },
        { row: 8, col: 1 },
      ],
    },
    {
      text: "Frei sind nur noch R4 und R5 in C1 und C4. Gloria war neben einem Tisch: R4 C4 ist selbst ein Tisch, R5 C1 und R5 C4 liegen neben keinem - Gloria saß in R4 C1, neben dem Tisch in R3 C1. Otis blieb das letzte Feld, R5 C4 im Schlafzimmer - allein mit Ashton. Ashton ist der Mörder!",
      place: { G: { row: 3, col: 0 }, O: { row: 4, col: 3 } },
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
