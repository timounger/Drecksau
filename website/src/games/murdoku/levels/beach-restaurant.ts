/**
 * Beach Restaurant: a toilet, a dining room, a kitchen, a terrace, a VIP area
 * and the sea, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Strandrestaurant/Strandrestaurant.png`,
 * solution on `Das Murdoku-Orginal/Lösungen 1-80/Lösung 25-28.JPG`).
 * Olena is the victim; whoever was alone with her killed her.
 *
 * The chairs, the rugs and the sea can be stood on; the plants, the shelves,
 * the tables and the kitchen counter (a table) cannot. Sitting means being on
 * a chair.
 */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether nobody but the suspect stood on a rug. */
function onlyOneOnARug(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "rug");
  });
}

/** The case. */
export const BEACH_RESTAURANT: Level = {
  id: "beach-restaurant",
  name: "Strandrestaurant",
  series: { book: "original", number: 27 },
  story:
    "Wir sind hier auf uns allein gestellt ... die Zeugen stecken alle den Kopf in den Sand.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "floor",
      tint: "#e6dcef",
      label: { row: 1, col: 0 },
    },
    {
      key: "S",
      name: "Speiseraum",
      at: "im Speiseraum",
      ground: "floor",
      tint: "#ece4f2",
      label: { row: 4, col: 3 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#e2dcea",
      label: { row: 3, col: 7 },
    },
    {
      key: "R",
      name: "Terrasse",
      at: "auf der Terrasse",
      ground: "stone",
      tint: "#e8e2ee",
      label: { row: 7, col: 4 },
    },
    {
      key: "V",
      name: "VIP-Bereich",
      at: "im VIP-Bereich",
      ground: "stone",
      tint: "#ddd3ea",
      label: { row: 8, col: 0 },
    },
    {
      key: "M",
      name: "Meer",
      at: "im Meer",
      ground: "water",
      label: { row: 8, col: 5 },
    },
  ],
  areaMap: [
    "TTTSSKKKK",
    "TTTSSKKKK",
    "SSSSSSSKK",
    "SSSSSSSKK",
    "SSSSSSSRR",
    "RRRRRRRRR",
    "RRRRRRRRR",
    "VVVVRRRMM",
    "VVVVMMMMM",
  ],
  thingMap: [
    "pctrrhht.",
    "rrr.....h",
    "c.c..cr.t",
    "tcttctrtt",
    "p.......p",
    ".c.crrc..",
    "cttctctt.",
    "tc.......",
    "..tc.....",
  ],
  things: {
    c: "chair",
    h: "shelf",
    p: "plant",
    r: "rug",
    t: "table",
  },
  shapes: [
    [
      { row: 2, col: 8 },
      { row: 3, col: 8 },
      { row: 3, col: 7 },
    ],
  ],
  pieces: [
    { at: { row: 0, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 0 }, rows: 1, cols: 3 },
    { at: { row: 2, col: 6 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 6 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Arwin",
      pronoun: "er",
      clue: {
        text: "Er war auf der Terrasse. Er saß nicht.",
        ...all(inArea("R"), not(on("seat"))),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Briana",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Cleo",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl im Speiseraum.",
        ...all(on("chair"), inArea("S")),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Deena",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einem Tisch.",
        ...not(beside("table")),
      },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Eugen",
      pronoun: "er",
      clue: { text: "Er war in der Toilette.", ...inArea("T") },
      colour: "#334155",
      face: "\u{1F474}",
    },
    {
      id: "F",
      name: "Fabrice",
      pronoun: "er",
      clue: {
        text: "Er war südlich von Deena.",
        ...about(["D"], (c) => {
          const deena = c.cellOf("D");
          return deena !== undefined && c.cell.row > deena.row;
        }),
      },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gabriel",
      pronoun: "er",
      clue: {
        text: "Er war mit Briana zusammen.",
        ...about(["B"], (c) => {
          const briana = c.cellOf("B");
          return briana !== undefined && c.areaOf(briana) === c.areaOf(c.cell);
        }),
      },
      colour: "#a16207",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Hope",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person auf einem Teppich.",
        ...all(on("rug"), counting(onlyOneOnARug)),
      },
      colour: "#be185d",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "O",
      name: "Olena",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}",
    },
  ],
  hints: [
    {
      text: "Briana ist in Zeile 1 oder 2 neben einem Regal. Eugen ist in der Toilette und kann laut Hopes Hinweis nicht auf einem Teppich sein. Das lokalisiert Eugen in der Toilette und platziert Briana in Zeile 2.",
      place: { E: { row: 0, col: 1 } },
    },
    {
      text: "Das lokalisiert Gabriel in der Küche.",
      place: { G: { row: 2, col: 7 } },
    },
    {
      text: "Es gibt nur einen verbleibenden Stuhl für Cleo im Speiseraum, in Zeile 4, Spalte 5.",
      place: { C: { row: 3, col: 4 } },
    },
    {
      text: "Das lokalisiert Hope im letzten verfügbaren Teppichfeld, was Briana lokalisiert.",
      place: { H: { row: 5, col: 5 }, B: { row: 1, col: 6 } },
    },
    {
      text: "Das lokalisiert Arwin, der nicht auf einem Stuhl sitzt, auf der Terrasse.",
      place: { A: { row: 6, col: 8 } },
    },
    {
      text: "Das lokalisiert auch Deena im letzten Feld ohne Tisch, dann Fabrice.",
      place: { D: { row: 7, col: 3 }, F: { row: 8, col: 0 } },
    },
    {
      text: "Das lokalisiert Olena, allein im Speiseraum mit Cleo. Cleo ist die Mörderin!",
      place: { O: { row: 4, col: 2 } },
    },
  ],
  solution: {
    A: { row: 6, col: 8 },
    B: { row: 1, col: 6 },
    C: { row: 3, col: 4 },
    D: { row: 7, col: 3 },
    E: { row: 0, col: 1 },
    F: { row: 8, col: 0 },
    G: { row: 2, col: 7 },
    H: { row: 5, col: 5 },
    O: { row: 4, col: 2 },
  },
};
