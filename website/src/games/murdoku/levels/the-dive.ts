/**
 * Der Tauchgang: a beach, the shallow water with a boat and a coral reef off
 * Port Vila, Vanuatu, with a murdered diver.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 3 - Auf Weltreise/2. Der Tauchgang.png`,
 * no solution sheet - the solved grid and the culprit are pencilled in on
 * the photographed page, and the solver proves it is the only solution).
 * Océane is the victim; whoever was alone with her killed her.
 *
 * The map is five by five. The boat lies in the shallow water and belongs to
 * it. The boulders cannot be stood on; the boat can.
 */
import { all, beside, column, inArea, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_DIVE: Level = {
  id: "the-dive",
  name: "Der Tauchgang",
  series: { book: "worldTravel", number: 2 },
  story: "Jemand stand unter zu viel Druck.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "S",
      name: "Strand",
      at: "am Strand",
      ground: "sand",
      tint: "#ecd27a",
      label: { row: 0, col: 3 },
    },
    {
      key: "F",
      name: "Flachwasser",
      at: "im Flachwasser",
      ground: "water",
      tint: "#a7d3f2",
      label: { row: 2, col: 1 },
    },
    {
      key: "K",
      name: "Korallenriff",
      at: "im Korallenriff",
      ground: "water",
      tint: "#8fc4c9",
      label: { row: 4, col: 2 },
    },
  ],
  areaMap: ["FFSSS", "FFFFS", "FFFFF", "KKKFF", "KKKKK"],
  thingMap: ["..r..", ".r...", "..bb.", ".....", ".r..."],
  things: {
    b: "boat",
    r: "boulder",
  },
  pieces: [{ at: { row: 2, col: 2 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Ayla",
      pronoun: "sie",
      clue: { text: "Sie war auf dem Boot.", ...on("boat") },
      colour: "#b45309",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "B",
      name: "Brandon",
      pronoun: "er",
      clue: {
        text: "Er war am Strand, neben dem Felsbrocken.",
        ...all(inArea("S"), beside("boulder")),
      },
      colour: "#ca8a04",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Clover",
      pronoun: "sie",
      clue: { text: "Sie war in der zweiten Spalte.", ...column(2) },
      colour: "#0e7490",
      face: "\u{1F93F}",
    },
    {
      id: "D",
      name: "Dante",
      pronoun: "er",
      clue: { text: "Er war im Flachwasser.", ...inArea("F") },
      colour: "#15803d",
      face: "\u{1F468}\u{200D}\u{1F9B0}",
    },
    {
      id: "O",
      name: "Océane",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
  ],
  hints: [
    {
      text: "Brandon war am Strand neben dem Felsbrocken: Neben dem Felsen in R1 C3 liegt am Strand nur R1 C4.",
      place: { B: { row: 0, col: 3 } },
    },
    {
      text: "Ayla war auf dem Boot, in R3 C3 oder R3 C4 - C4 ist Brandons Spalte. Ayla steht in R3 C3, im Flachwasser.",
      place: { A: { row: 2, col: 2 } },
    },
    {
      text: "Clover war in der zweiten Spalte: R1 ist Brandons Zeile, R2 C2 und R5 C2 sind Felsen, R3 ist Aylas Zeile - Clover steht in R4 C2, im Korallenriff.",
      place: { C: { row: 3, col: 1 } },
    },
    {
      text: "Dante war im Flachwasser. Frei sind R2 und R5 sowie C1 und C5; im Flachwasser liegt davon nur R2 C1. Océane steht auf dem letzten Feld, R5 C5 im Korallenriff - allein mit Clover. Clover ist die Mörderin!",
      place: { D: { row: 1, col: 0 }, O: { row: 4, col: 4 } },
    },
  ],
  solution: {
    A: { row: 2, col: 2 },
    B: { row: 0, col: 3 },
    C: { row: 3, col: 1 },
    D: { row: 1, col: 0 },
    O: { row: 4, col: 4 },
  },
};
