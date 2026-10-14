/**
 * The Café: a counter, a toilet and a main room of a café, with a murdered
 * guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Das Cafe/Das Cafe.png`, solution sheet
 * `game_instructions/Murdoku/Das Murdoku-Orginal/Lösungen 1-80/Lösung 05-08.JPG`).
 * Ole is the victim; whoever was alone with him killed him.
 *
 * The armchairs can be stood on (sitting means being on one); the till, the
 * tables and the plants cannot. The counter at the Theke is a table round the
 * corner, drawn as one (`shapes`).
 */
import {
  about,
  all,
  beside,
  column,
  inArea,
  not,
  on,
  victim,
} from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_CAFE: Level = {
  id: "the-cafe",
  name: "Das Café",
  series: { book: "original", number: 7 },
  story:
    "Auf dem Kaffee des Opfers steht »Lindsey« ... überlassen wir das Ausfüllen der Sterbeurkunde lieber nicht dem Barista.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "T",
      name: "Theke",
      at: "an der Theke",
      ground: "stone",
      tint: "#ddd6f0",
      label: { row: 2, col: 2 },
    },
    {
      key: "W",
      name: "Toilette",
      at: "in der Toilette",
      ground: "floor",
      tint: "#f3f1f8",
      label: { row: 1, col: 4 },
    },
    {
      key: "H",
      name: "Hauptbereich",
      at: "im Hauptbereich",
      ground: "carpet",
      tint: "#cdbfe6",
      label: { row: 5, col: 3 },
    },
  ],
  areaMap: ["TTTTWW", "TTTTWW", "TTTTHH", "HHHHHH", "HHHHHH", "HHHHHH"],
  thingMap: ["...t.c", "...t..", ".rtt.t", ".ctt.c", "..cct.", "c.p.cp"],
  things: {
    c: "chair",
    p: "plant",
    r: "cashRegister",
    t: "table",
  },
  extraThings: {
    cashRegister: { name: "Kasse", emoji: "\u{1F4B5}", standable: false },
  },
  shapes: [
    [
      { row: 0, col: 3 },
      { row: 1, col: 3 },
      { row: 2, col: 3 },
      { row: 2, col: 2 },
    ],
  ],
  pieces: [{ at: { row: 3, col: 2 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Astrid",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einer Pflanze. Sie saß nicht auf einem Stuhl.",
        ...all(beside("plant"), not(on("chair"))),
      },
      colour: "#b91c1c",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "B",
      name: "Bea",
      pronoun: "sie",
      clue: { text: "Sie war neben der Kasse.", ...beside("cashRegister") },
      colour: "#15803d",
      face: "\u{1F475}",
    },
    {
      id: "C",
      name: "Chloe",
      pronoun: "sie",
      clue: { text: "Sie war in der zweiten Spalte.", ...column(2) },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Dirk",
      pronoun: "er",
      clue: {
        text: "Er war nördlich von Chloe. Er war im Hauptbereich.",
        ...all(
          inArea("H"),
          about(["C"], (c) => {
            const chloe = c.cellOf("C");
            return chloe !== undefined && c.cell.row < chloe.row;
          }),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Eberhard",
      pronoun: "er",
      clue: {
        text: "Er saß auf einem Stuhl. Er war nicht neben einem Tisch.",
        ...all(on("chair"), not(beside("table"))),
      },
      colour: "#334155",
      face: "\u{1F9D4}",
    },
    {
      id: "O",
      name: "Ole",
      pronoun: "er",
      clue: {
        text: "Er war im letzten verbleibenden Feld, allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  rules: [],
  hints: [
    {
      text: "Weil Chloe in Spalte 2 ist, können wir Bea in Spalte 1 lokalisieren, neben der Kasse.",
      place: { B: { row: 2, col: 0 } },
      cross: [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 3, col: 0 },
        { row: 4, col: 0 },
        { row: 5, col: 0 },
        { row: 2, col: 4 },
        { row: 2, col: 5 },
      ],
    },
    {
      text: "Es gibt nur einen Stuhl, auf dem Eberhard sein kann. Wir können Eberhard auf dem Stuhl in der Toilette lokalisieren.",
      place: { E: { row: 0, col: 5 } },
      cross: [
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 4 },
        { row: 1, col: 5 },
        { row: 3, col: 5 },
        { row: 4, col: 5 },
      ],
    },
    {
      text: "Astrid muss in Zeile 6 sein, neben einer Pflanze, in Spalte 4.",
      place: { A: { row: 5, col: 3 } },
    },
    {
      text: "Dirk ist nördlich von Chloe und im Hauptbereich. Er muss irgendwo in Zeile 4 sein. Das bedeutet, dass Chloe in Zeile 5 ist.",
    },
    {
      text: "Das lokalisiert Chloe, dann Dirk.",
      place: { C: { row: 4, col: 1 }, D: { row: 3, col: 4 } },
    },
    {
      text: "Es gibt nur ein verbleibendes Feld für Ole, an der Theke. Bea ist die Mörderin!",
      place: { O: { row: 1, col: 2 } },
    },
  ],
  solution: {
    A: { row: 5, col: 3 },
    B: { row: 2, col: 0 },
    C: { row: 4, col: 1 },
    D: { row: 3, col: 4 },
    E: { row: 0, col: 5 },
    O: { row: 1, col: 2 },
  },
};
