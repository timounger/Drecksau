/**
 * Octavia's New House: a dining room, a living room, a lounge, a guest room,
 * a kitchen and a bedroom, with the murdered owner.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/33. Octavias neues Haus.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Octavia is the victim; whoever was alone with her killed her.
 *
 * The armchairs and the beds can be stood on; the tables, the TVs and the
 * plants cannot. Sitting on a chair means being on an armchair. The windows
 * are the bars in the outer walls; standing in front of one means being on
 * the field right beside it. A field is "beside a wall" when one of its sides
 * lies on a room border or on the edge of the map.
 */
import {
  all,
  alone,
  beside,
  cellsWhere,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The fields right in front of a window. */
const WINDOWS: readonly Cell[] = [
  { row: 0, col: 3 },
  { row: 0, col: 4 },
  { row: 0, col: 8 },
  { row: 4, col: 8 },
  { row: 8, col: 0 },
  { row: 8, col: 3 },
  { row: 8, col: 4 },
];

/** Whether a field lies right in front of a window. */
function byWindow(cell: Cell): boolean {
  return WINDOWS.some((one) => one.row === cell.row && one.col === cell.col);
}

/** Whether a side of the field lies on a room border or the map's edge. */
function besideWall(c: Context, cell: Cell): boolean {
  const steps: readonly Cell[] = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  return steps.some((step) => {
    const next = { row: cell.row + step.row, col: cell.col + step.col };
    return !c.inside(next) || c.areaOf(next) !== c.areaOf(cell);
  });
}

/** Whether a TV stands in the field's row and area. */
function tvInRowAndRoom(c: Context): boolean {
  const area = c.areaOf(c.cell);
  return c
    .cellsOf(area ?? "")
    .some((cell) => cell.row === c.cell.row && c.is(cell, "tv"));
}

/** Whether somebody besides the suspect stood in the suspect's area. */
function notAlone(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").length > 1;
}

/** The case. */
export const OCTAVIAS_NEW_HOUSE: Level = {
  id: "octavias-new-house",
  name: "Octavias neues Haus",
  series: { book: "original", number: 33 },
  story:
    "Und die Farbe ist noch nicht mal trocken. Oh ... das ist keine Farbe.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#e3e8ee",
      label: { row: 4, col: 0 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#e6ebf0",
      label: { row: 2, col: 6 },
    },
    {
      key: "A",
      name: "Aufenthaltsraum",
      at: "im Aufenthaltsraum",
      ground: "stone",
      tint: "#d9e7ec",
      label: { row: 5, col: 3 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#e1e7ee",
      label: { row: 5, col: 6 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#dcebe6",
      label: { row: 8, col: 1 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#e4e9ef",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "EEEWWWWWW",
    "EEEWWWWWW",
    "EEEWWWWWW",
    "EEEAAGGGG",
    "EEEAAGGGG",
    "KKKAAGGGG",
    "KKKSSSSSS",
    "KKKSSSSSS",
    "KKKSSSSSS",
  ],
  thingMap: [
    ".t.......",
    ".t.c..t.f",
    ".tp......",
    ".c.p.p...",
    "....c.bb.",
    ".........",
    ".tt......",
    ".ttpcbb.f",
    ".c.......",
  ],
  things: {
    b: "bed",
    c: "chair",
    f: "tv",
    p: "plant",
    t: "table",
  },
  pieces: [
    { at: { row: 0, col: 1 }, rows: 3, cols: 1 },
    { at: { row: 4, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 1 }, rows: 2, cols: 2 },
    { at: { row: 7, col: 5 }, rows: 1, cols: 2 },
  ],
  windows: [
    { at: { row: 0, col: 3 }, side: "top" },
    { at: { row: 0, col: 4 }, side: "top" },
    { at: { row: 0, col: 8 }, side: "right" },
    { at: { row: 4, col: 8 }, side: "right" },
    { at: { row: 8, col: 0 }, side: "left" },
    { at: { row: 8, col: 3 }, side: "bottom" },
    { at: { row: 8, col: 4 }, side: "bottom" },
  ],
  suspects: [
    {
      id: "A",
      name: "Alistair",
      pronoun: "er",
      clue: {
        text: "Er war im Gästezimmer. Er war nicht neben einer Wand.",
        ...all(
          inArea("G"),
          own((c) => !besideWall(c, c.cell)),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Brooke",
      pronoun: "sie",
      clue: { text: "Sie war in der Küche.", ...inArea("K") },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Cornelia",
      pronoun: "sie",
      clue: {
        text: "Sie war allein im Esszimmer.",
        ...all(inArea("E"), alone()),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Denis",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#6366f1",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Elia",
      pronoun: "er",
      clue: {
        text: "Er war vor einem Fenster.",
        ...own((c) => byWindow(c.cell)),
        glow: (level) => cellsWhere(level, byWindow),
      },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Francesca",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#9f1239",
      face: "\u{1F475}",
    },
    {
      id: "G",
      name: "George",
      pronoun: "er",
      clue: {
        text: "Er war im Aufenthaltsraum. Jemand anderes war im Raum.",
        ...all(inArea("A"), counting(notAlone)),
      },
      colour: "#ea580c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "H",
      name: "Hajo",
      pronoun: "er",
      clue: {
        text: "In seinem Raum war ein Fernseher, in derselben Zeile.",
        ...own(tvInRowAndRoom),
      },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Octavia",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F471}‍♀️",
    },
  ],
  rules: [
    {
      text: "Genau eine Person war auf einem Bett.",
      check: (c) =>
        c.people().filter((id) => {
          const there = c.cellOf(id);
          return there !== undefined && c.is(there, "bed");
        }).length === 1,
    },
  ],
  hints: [
    {
      text: "Alistair war im Gästezimmer und nicht neben einer Wand: Das sind nur die Bettfelder R5 C7 und R5 C8. Genau eine Person war auf einem Bett - das ist Alistair, und R5 gehört ihm. Blockiere die übrigen Bettfelder R8 C6 und R8 C7.",
      cross: [
        { row: 7, col: 5 },
        { row: 7, col: 6 },
      ],
    },
    {
      text: "George war im Aufenthaltsraum, und dort war noch jemand. Frei sind dort R4 C5, R6 C4 und R6 C5 (R5 ist Alistairs Zeile). Zwei Personen passen nur in R4 C5 und R6 C4. Blockiere den Rest von R4, R6, C4 und C5.",
    },
    {
      text: "Francesca saß auf einem Stuhl. Die Stühle in R2 C4, R4 C2, R5 C5 und R8 C5 liegen in blockierten Zeilen und Spalten - Francesca saß in R9 C2. Elia war vor einem Fenster: Die Fenster in C4, C5, R5 und R9 fallen weg, es bleibt R1 C9.",
      place: { F: { row: 8, col: 1 }, E: { row: 0, col: 8 } },
    },
    {
      text: "Brooke war in der Küche: R6 und R9 sind vergeben, in C2 und C3 steht der Tisch - Brooke war in C1, in R7 oder R8. Cornelia war allein im Esszimmer: R1, R4 und R5 sind vergeben, C1 gehört Brooke, R3 C3 ist eine Pflanze - Cornelia war in R2 C3.",
      place: { C: { row: 1, col: 2 } },
    },
    {
      text: "Hajo hatte einen Fernseher in seinem Raum und seiner Zeile: R2 im Wohnzimmer ist vergeben, also R8 im Schlafzimmer, wo nur R8 C8 frei ist. Damit war Brooke in R7 C1 und Alistair in R5 C7.",
      place: {
        H: { row: 7, col: 7 },
        B: { row: 6, col: 0 },
        A: { row: 4, col: 6 },
      },
    },
    {
      text: "Denis, George und Octavia bleiben R3, R4 und R6 in C4, C5 und C6. In R3 steht keine Pflanze neben einem freien Feld des Wohnzimmers, also war Denis im Aufenthaltsraum - neben der Pflanze nur in R4 C5. George war in R6 C4, Octavia in R3 C6. Im Wohnzimmer war sie allein mit Elia - Elia ist der Mörder!",
      place: {
        D: { row: 3, col: 4 },
        G: { row: 5, col: 3 },
        O: { row: 2, col: 5 },
      },
    },
  ],
  solution: {
    A: { row: 4, col: 6 },
    B: { row: 6, col: 0 },
    C: { row: 1, col: 2 },
    D: { row: 3, col: 4 },
    E: { row: 0, col: 8 },
    F: { row: 8, col: 1 },
    G: { row: 5, col: 3 },
    H: { row: 7, col: 7 },
    O: { row: 2, col: 5 },
  },
};
