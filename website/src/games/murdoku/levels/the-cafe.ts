/**
 * The Café: a counter, a toilet and a main room of a café, with a murdered
 * guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Das Cafe/Das Cafe.png`, no solution
 * sheet - the solver proves the one solution, with the culprit pencilled in on
 * the photographed page).
 * Ole is the victim; whoever was alone with him killed him.
 *
 * The armchairs can be stood on (sitting means being on one); the L-shaped
 * bar, the till, the tables and the plants cannot.
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
    "Auf dem Kaffee des Opfers steht »Lindsey« ... überlassen wir das Ausfüllen der Sterbeurkunde lieber nicht dem Barista. Ole wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
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
  thingMap: ["...b.c", "...b..", ".rbb.t", ".ctt.c", "..cct.", "c.p.cp"],
  things: {
    b: "bar",
    c: "chair",
    p: "plant",
    r: "cashRegister",
    t: "table",
  },
  extraThings: {
    bar: { name: "Tresen", emoji: "\u{1F9C1}", standable: false },
    cashRegister: { name: "Kasse", emoji: "\u{1F4B5}", standable: false },
  },
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
      traits: ["glasses"],
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
      traits: ["cap"],
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
      traits: ["cap"],
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
      text: "Eberhard saß auf einem Stuhl, aber nicht neben einem Tisch. Das trifft nur auf die Stühle in R1 C6 (Toilette) und R6 C1 zu.",
    },
    {
      text: "Wäre Eberhard in R6 C1, müsste Astrid (neben einer Pflanze, nicht auf einem Stuhl) in R5 C6 sein, Chloe in R4 C2 und Dirk nördlich davon in R3 C5 - dann bliebe für Bea neben der Kasse kein Feld. Also saß Eberhard in R1 C6. Blockiere den Rest von R1 und C6.",
      place: { E: { row: 0, col: 5 } },
      cross: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 4 },
        { row: 1, col: 5 },
        { row: 3, col: 5 },
        { row: 4, col: 5 },
      ],
    },
    {
      text: "Dirk war im Hauptbereich nördlich von Chloe, also war Chloe in der zweiten Spalte frühestens in R4. Astrid kann nur noch in R6 C2 oder R6 C4 sein; R6 C2 würde Chloe die Spalte nehmen. Astrid war in R6 C4.",
      place: { A: { row: 5, col: 3 } },
    },
    {
      text: "Neben der Kasse sind nur R2 C2 und R3 C1 frei. C2 gehört Chloe, also war Bea in R3 C1. Blockiere den Rest von R3 und C1.",
      place: { B: { row: 2, col: 0 } },
    },
    {
      text: "Dirk muss nun in R4 oder R5 nördlich von Chloe sein: Dirk in R4, Chloe in R5 C2. In R4 ist nur C5 frei und begehbar - Dirk war in R4 C5.",
      place: { C: { row: 4, col: 1 }, D: { row: 3, col: 4 } },
    },
    {
      text: "Ole blieb das letzte Feld, R2 C3. An der Theke war er allein mit Bea - Bea ist die Mörderin!",
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
