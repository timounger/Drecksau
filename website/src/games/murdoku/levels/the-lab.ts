/**
 * The Lab: an experiment lab, a decontamination room, a store room, a data
 * analysis room, an office and a cold store, with a murdered scientist.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Das Labor/Das Labor.png`, solution
 * sheet `Das Murdoku-Orginal/Lösungen 1-80/Lösung 09-12.JPG`).
 * Oskar is the victim; whoever was alone with him killed him.
 *
 * The armchairs can be stood on (sitting means being on one); the tables, the
 * L-shaped desk in the office, the shelves, the monitors (TVs) and the plant
 * cannot. The desk counts as a table.
 */
import {
  about,
  all,
  beside,
  column,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_LAB: Level = {
  id: "the-lab",
  name: "Das Labor",
  series: { book: "original", number: 9 },
  story: "Eine Schutzbrille kann dich wohl nicht vor allem schützen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "X",
      name: "Experimentierlabor",
      at: "im Experimentierlabor",
      ground: "floor",
      tint: "#dbe9ef",
      label: { row: 5, col: 0 },
    },
    {
      key: "K",
      name: "Dekontamination",
      at: "in der Dekontamination",
      ground: "floor",
      tint: "#e3eef2",
      label: { row: 2, col: 4 },
    },
    {
      key: "L",
      name: "Lagerraum",
      at: "im Lagerraum",
      ground: "stone",
      tint: "#d4e4ec",
      label: { row: 3, col: 2 },
    },
    {
      key: "D",
      name: "Datenanalyse",
      at: "in der Datenanalyse",
      ground: "floor",
      tint: "#cfe0ea",
      label: { row: 4, col: 5 },
    },
    {
      key: "B",
      name: "Büro",
      at: "im Büro",
      ground: "carpet",
      tint: "#d5e8e4",
      label: { row: 7, col: 2 },
    },
    {
      key: "G",
      name: "Gefrierkammer",
      at: "in der Gefrierkammer",
      ground: "snow",
      tint: "#e6f0f5",
      label: { row: 7, col: 5 },
    },
  ],
  areaMap: [
    "XXXKKKKK",
    "XXXKKKKK",
    "XXLLKKKK",
    "XXLLDDDD",
    "XXXDDDDD",
    "XXXDDGGG",
    "BBBBBGGG",
    "BBBBBGGG",
  ],
  thingMap: [
    "ttst.s..",
    "vc...tt.",
    "..s.....",
    "tc.s.vvt",
    "v.......",
    "tt..v..s",
    "..ctv.st",
    "pttt...s",
  ],
  things: {
    c: "chair",
    p: "plant",
    s: "shelf",
    t: "table",
    v: "tv",
  },
  shapes: [
    [
      { row: 6, col: 3 },
      { row: 7, col: 1 },
      { row: 7, col: 2 },
      { row: 7, col: 3 },
    ],
  ],
  pieces: [
    { at: { row: 0, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 5 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 0 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Armin",
      pronoun: "er",
      clue: {
        text: "Er war im selben Raum wie Estella. Er saß auf einem Stuhl.",
        ...all(
          on("chair"),
          about(["E"], (c) => {
            const estella = c.cellOf("E");
            return (
              estella !== undefined && c.areaOf(estella) === c.areaOf(c.cell)
            );
          }),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "B",
      name: "Bernhard",
      pronoun: "er",
      clue: { text: "Er war im Lagerraum.", ...inArea("L") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Calypso",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Tisch. Sie war nördlich von Bernhard.",
        ...all(
          beside("table"),
          about(["B"], (c) => {
            const bernhard = c.cellOf("B");
            return bernhard !== undefined && c.cell.row < bernhard.row;
          }),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Doris",
      pronoun: "sie",
      clue: { text: "Sie war im Büro.", ...inArea("B") },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Estella",
      pronoun: "sie",
      clue: { text: "Sie war in der ersten Spalte.", ...column(1) },
      colour: "#9f1239",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Frank",
      pronoun: "er",
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#ea580c",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Gil",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#4338ca",
      face: "\u{1F9D1}",
    },
    {
      id: "O",
      name: "Oskar",
      pronoun: "er",
      clue: {
        text: "Er war im letzten verbleibenden Feld, allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F471}‍♂️",
    },
  ],
  rules: [],
  hints: [
    {
      text: "Estella, in Spalte 1, kann nur mit Armin im Experimentierlabor sein. (Wenn sie im Büro wären, müssten beide in Zeile 7 sein.) Das lokalisiert Estella in Zeile 3.",
      place: { E: { row: 2, col: 0 } },
    },
    {
      text: "Das lokalisiert Bernhard im Lagerraum.",
      place: { B: { row: 3, col: 2 } },
    },
    {
      text: "Das lokalisiert Armin auf dem letzten verbleibenden Stuhl im Experimentierlabor.",
      place: { A: { row: 1, col: 1 } },
    },
    {
      text: "Es gibt nur ein verfügbares Feld für Doris im Büro: Zeile 8, Spalte 5.",
      place: { D: { row: 7, col: 4 } },
    },
    {
      text: "Das lokalisiert Calypso im letzten verbleibenden Feld neben einem Tisch und nördlich von Bernhard.",
      place: { C: { row: 0, col: 6 } },
    },
    {
      text: "Das lokalisiert Gil im letzten verbleibenden Feld neben einem Regal.",
      place: { G: { row: 6, col: 5 } },
    },
    {
      text: "Das lokalisiert Frank neben dem Fernseher, dann Oskar. Frank ist der Mörder!",
      place: { F: { row: 5, col: 3 }, O: { row: 4, col: 7 } },
    },
  ],
  solution: {
    A: { row: 1, col: 1 },
    B: { row: 3, col: 2 },
    C: { row: 0, col: 6 },
    D: { row: 7, col: 4 },
    E: { row: 2, col: 0 },
    F: { row: 5, col: 3 },
    G: { row: 6, col: 5 },
    O: { row: 4, col: 7 },
  },
};
