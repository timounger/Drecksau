/**
 * The Lab: an experiment lab, a decontamination room, a store room, a data
 * analysis room, an office and a cold store, with a murdered scientist.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Das Labor/Das Labor.png`, no solution
 * sheet - the solver proves the one solution, with the culprit pencilled in on
 * the photographed page).
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
  story:
    "Eine Schutzbrille kann dich wohl nicht vor allem schützen. Oskar wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
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
  suspects: [
    {
      id: "A",
      name: "Armin",
      pronoun: "er",
      traits: ["glasses"],
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
      traits: ["glasses"],
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
      traits: ["glasses"],
      clue: { text: "Sie war in der ersten Spalte.", ...column(1) },
      colour: "#9f1239",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Frank",
      pronoun: "er",
      traits: ["glasses"],
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
      traits: ["glasses"],
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
      text: "Estella war in der ersten Spalte: Dort sind nur R3 C1 und R7 C1 frei. Armin saß im selben Raum auf einem Stuhl - im Büro wäre das nur R7 C3, in derselben Zeile. Also war Estella in R3 C1, und Armin war im Experimentierlabor.",
      place: { E: { row: 2, col: 0 } },
    },
    {
      text: "Bernhard war im Lagerraum, also in R3 C4 oder R4 C3. R3 gehört Estella - Bernhard war in R4 C3. Damit bleibt Armin von den Stühlen im Experimentierlabor nur R2 C2.",
      place: { B: { row: 3, col: 2 }, A: { row: 1, col: 1 } },
    },
    {
      text: "Doris war im Büro, in R7 oder R8. C1 bis C3 sind schon besetzt, in C4 steht der Schreibtisch und in R7 C5 ein Fernseher. Doris war in R8 C5.",
      place: { D: { row: 7, col: 4 } },
    },
    {
      text: "Calypso war nördlich von Bernhard, also in R1 (R2 und R3 sind besetzt), und neben einem Tisch. Das sind R1 C5 und R1 C7 - C5 gehört Doris. Calypso war in R1 C7.",
      place: { C: { row: 0, col: 6 } },
    },
    {
      text: "Frei sind noch R5 bis R7 in C4, C6 und C8. Gil war neben einem Regal: Das trifft nur auf R7 C6 neben dem Regal in der Gefrierkammer zu. Gil war in R7 C6.",
      place: { G: { row: 6, col: 5 } },
    },
    {
      text: "Übrig sind R5 und R6 in C4 und C8; in R6 C8 steht ein Regal. Frank neben dem Fernseher war in R6 C4, Oskar im letzten Feld R5 C8. In der Datenanalyse war er allein mit Frank - Frank ist der Mörder!",
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
