/**
 * Die Schafweide: a farmhouse, a sheep pasture and a shearing shed near
 * Queenstown, New Zealand, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 3 - Auf Weltreise/4. Die Schafweide.png`,
 * no solution sheet - the solved grid and the culprit are pencilled in on
 * the photographed page, and the solver proves it is the only solution).
 * Oriini is the victim; whoever was alone with her killed her.
 *
 * The map is six by six. The bed and the chair can be stood on; the sheep,
 * the bushes and the two tables cannot, as the grid on the page greys them
 * out. "Next to" means a field sharing a side.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: the column straight off the printed page. */
import { beside, column, not, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_SHEEP_PASTURE: Level = {
  id: "the-sheep-pasture",
  name: "Die Schafweide",
  series: { book: "worldTravel", number: 4 },
  story: "Vielleicht können uns ja die Schafe beim Lösen dieses Mordes helfen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "F",
      name: "Farmhaus",
      at: "im Farmhaus",
      ground: "floor",
      tint: "#e6d2b0",
      label: { row: 1, col: 1 },
    },
    {
      key: "W",
      name: "Weide",
      at: "auf der Weide",
      ground: "grass",
      tint: "#9fcf7f",
      label: { row: 5, col: 3 },
    },
    {
      key: "S",
      name: "Scherschuppen",
      at: "im Scherschuppen",
      ground: "stone",
      tint: "#d4b98c",
      label: { row: 5, col: 4 },
    },
  ],
  areaMap: ["FFFWWW", "FFFWWW", "FWWWWW", "WWWWWS", "WWWWSS", "WWWWSS"],
  thingMap: ["tbb.s.", "..c..u", ".....s", "s.s.s.", "..us.t", "us...s"],
  things: {
    b: "bed",
    c: "chair",
    s: "sheep",
    t: "table",
    u: "shrub",
  },
  extraThings: {
    sheep: {
      name: "Schaf",
      emoji: "\u{1F411}",
      standable: false,
      kinds: ["animal"],
    },
  },
  pieces: [{ at: { row: 0, col: 1 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Anthony",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einem Schaf.",
        ...not(beside("sheep")),
      },
      colour: "#a16207",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Brie",
      pronoun: "sie",
      clue: { text: "Sie saß auf dem Stuhl.", ...on("chair") },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Carrie",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Busch.", ...beside("shrub") },
      colour: "#c2410c",
      face: "\u{1F469}\u{200D}\u{1F9B0}",
    },
    {
      id: "D",
      name: "Don",
      pronoun: "er",
      clue: { text: "Er war auf dem Bett.", ...on("bed") },
      colour: "#0e7490",
      face: "\u{1F471}\u{200D}\u{2642}\u{FE0F}",
    },
    {
      id: "E",
      name: "Elisa",
      pronoun: "sie",
      clue: { text: "Sie war in der letzten Spalte.", ...column(6) },
      colour: "#be185d",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "O",
      name: "Oriini",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#b91c1c",
      face: "\u{1F475}",
    },
  ],
  hints: [
    {
      text: "Brie saß auf dem Stuhl - es gibt nur einen, in R2 C3.",
      place: { B: { row: 1, col: 2 } },
    },
    {
      text: "Don war auf dem Bett (R1 C2 und C3). C3 ist Bries Spalte - Don liegt in R1 C2.",
      place: { D: { row: 0, col: 1 } },
    },
    {
      text: "Elisa war in der letzten Spalte. R1 C6 liegt in Dons Zeile; R2 C6 ist ein Busch, R3 C6 und R6 C6 sind Schafe, R5 C6 ein Tisch - Elisa steht in R4 C6.",
      place: { E: { row: 3, col: 5 } },
    },
    {
      text: "Frei sind noch die Zeilen 3, 5 und 6 und die Spalten 1, 4 und 5. Carrie war neben einem Busch: Am Busch in R2 C6 ist nichts frei, am Busch in R5 C3 liegen R5 C2 und R6 C3 in belegten Spalten - Carrie steht neben dem Busch in R6 C1, in R5 C1.",
      place: { C: { row: 4, col: 0 } },
    },
    {
      text: "Anthony war nicht neben einem Schaf. Übrig sind R3 C4, R3 C5, R6 C4 und R6 C5; R3 C5 grenzt an das Schaf in R3 C6, R6 C4 an das in R5 C4 und R6 C5 an das in R6 C6 - Anthony steht in R3 C4. Oriini bleibt R6 C5 im Scherschuppen, allein mit Elisa. Elisa ist die Mörderin!",
      place: { A: { row: 2, col: 3 }, O: { row: 5, col: 4 } },
    },
  ],
  solution: {
    A: { row: 2, col: 3 },
    B: { row: 1, col: 2 },
    C: { row: 4, col: 0 },
    D: { row: 0, col: 1 },
    E: { row: 3, col: 5 },
    O: { row: 5, col: 4 },
  },
};
