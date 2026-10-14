/**
 * English Breakfast: a guest room, a bathroom, a kitchen, a bedroom and a
 * living room of a cosy flat, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/3. English Breakfast/3. English Breakfast.png`,
 * solution sheet
 * `game_instructions/Murdoku/Das Murdoku-Orginal/Lösungen 1-80/Lösung 01-04.JPG`).
 * Orville is the victim; whoever was alone with him killed him.
 *
 * The armchairs, the beds and the rugs can be stood on; the plants, the TV,
 * the bedside table and the kitchen counter (a table) cannot. The window is
 * the bar in the east wall; standing in front of it means being on the field
 * right beside it.
 */
import { beside, cellsWhere, inArea, on, own, victim } from "../engine/clues";
import type { Cell, Level } from "../engine/types";

/** The field right in front of the window. */
const WINDOW: Cell = { row: 3, col: 5 };

/** Whether a field lies right in front of the window. */
function byWindow(cell: Cell): boolean {
  return cell.row === WINDOW.row && cell.col === WINDOW.col;
}

/** The case. */
export const ENGLISH_BREAKFAST: Level = {
  id: "english-breakfast",
  name: "English Breakfast",
  series: { book: "original", number: 3 },
  story:
    "Sieht wirklich gemütlich aus, aber jetzt wissen wir, dass sich hier etwas zusammenbraute.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#e2dcef",
      label: { row: 5, col: 0 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "stone",
      tint: "#ddd3ea",
      label: { row: 1, col: 2 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#ecd3e6",
      label: { row: 2, col: 5 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#cfe3ee",
      label: { row: 3, col: 2 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#ebe6da",
      label: { row: 5, col: 4 },
    },
  ],
  areaMap: ["GBBBKK", "GBBBKK", "GSSSKK", "GSSSWW", "GGWWWW", "GGWWWW"],
  thingMap: ["b...tt", "b..c..", "r..tp.", "rbbrp.", "..c...", "..f..."],
  things: {
    b: "bed",
    c: "chair",
    f: "tv",
    p: "plant",
    r: "rug",
    t: "table",
  },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 4 }, rows: 1, cols: 2 },
  ],
  windows: [{ at: WINDOW, side: "right" }],
  suspects: [
    {
      id: "A",
      name: "Alexander",
      pronoun: "er",
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Burkhard",
      pronoun: "er",
      clue: { text: "Er war in der Küche.", ...inArea("K") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Cleo",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Tisch.", ...beside("table") },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Diane",
      pronoun: "sie",
      clue: { text: "Sie war neben dem Fernseher.", ...beside("tv") },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Elsa",
      pronoun: "sie",
      clue: {
        text: "Sie war vor dem Fenster.",
        ...own((c) => byWindow(c.cell)),
        glow: (level) => cellsWhere(level, byWindow),
      },
      colour: "#334155",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Orville",
      pronoun: "er",
      clue: { text: "Er war im letzten verbleibenden Feld.", ...victim() },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  rules: [],
  hints: [
    {
      text: "Elsa muss vor dem einzigen Fenster sein, in Zeile 4, Spalte 6.",
      place: { E: { row: 3, col: 5 } },
      cross: [
        { row: 3, col: 0 },
        { row: 3, col: 1 },
        { row: 3, col: 2 },
        { row: 3, col: 3 },
        { row: 0, col: 5 },
        { row: 1, col: 5 },
        { row: 2, col: 5 },
        { row: 4, col: 5 },
        { row: 5, col: 5 },
      ],
    },
    {
      text: "Das lokalisiert Burkhard im letzten verbleibenden Feld in der Küche.",
      place: { B: { row: 1, col: 4 } },
      cross: [
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 4, col: 4 },
        { row: 5, col: 4 },
      ],
    },
    {
      text: "Das lokalisiert Alexander im letzten verbleibenden Feld auf einem Bett.",
      place: { A: { row: 0, col: 0 } },
      cross: [
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
        { row: 2, col: 0 },
        { row: 4, col: 0 },
        { row: 5, col: 0 },
      ],
    },
    {
      text: "Das lokalisiert auch Cleo im letzten Feld neben einem Tisch.",
      place: { C: { row: 2, col: 2 } },
      cross: [
        { row: 2, col: 1 },
        { row: 4, col: 2 },
        { row: 5, col: 2 },
      ],
    },
    {
      text: "Das lokalisiert Diane im letzten Feld neben dem Fernseher.",
      place: { D: { row: 5, col: 3 } },
    },
    {
      text: "Das lokalisiert Orville, allein im Gästezimmer mit Alexander. Alexander ist der Mörder!",
      place: { O: { row: 4, col: 1 } },
    },
  ],
  solution: {
    A: { row: 0, col: 0 },
    B: { row: 1, col: 4 },
    C: { row: 2, col: 2 },
    D: { row: 5, col: 3 },
    E: { row: 3, col: 5 },
    O: { row: 4, col: 1 },
  },
};
