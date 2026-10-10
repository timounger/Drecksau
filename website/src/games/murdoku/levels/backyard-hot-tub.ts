/**
 * Backyard Hot Tub: a garden, a terrace around a hot tub, a living room, a
 * bedroom and a kitchen, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Whirlpool im Hintergarten/Whirlpool im Hintergarten.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Ophelia is the victim; whoever was alone with her killed her.
 *
 * The hot tub is its own area inside the terrace ring, and its water can be
 * stood in. The armchairs and the bed can be stood on; the plants, the TV and
 * the teal tables cannot. Sitting on a chair means being on an armchair.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import { all, beside, column, inArea, not, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const BACKYARD_HOT_TUB: Level = {
  id: "backyard-hot-tub",
  name: "Whirlpool im Hintergarten",
  series: { book: "original", number: 8 },
  story:
    "Sieht aus, als wären ein paar Emotionen hochgekocht. Ophelia wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "G",
      name: "Garten",
      at: "im Garten",
      ground: "grass",
      tint: "#cfe8d6",
      label: { row: 2, col: 1 },
    },
    {
      key: "T",
      name: "Terrasse",
      at: "auf der Terrasse",
      ground: "floor",
      tint: "#f6dcc4",
      label: { row: 3, col: 5 },
    },
    {
      key: "W",
      name: "Whirlpool",
      at: "im Whirlpool",
      ground: "water",
      tint: "#a9c9f2",
      label: { row: 2, col: 4 },
    },
    {
      key: "L",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "stone",
      tint: "#b9dbf2",
      label: { row: 6, col: 3 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "stone",
      tint: "#e3ecf2",
      label: { row: 6, col: 0 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#c6d8f5",
      label: { row: 6, col: 6 },
    },
  ],
  areaMap: [
    "GGGTTTT",
    "GGGTWWT",
    "GGGTWWT",
    "LLLTTTT",
    "LLLLLKK",
    "SSLLLKK",
    "SSLLLKK",
  ],
  thingMap: [
    ".tt..c.",
    "..p....",
    "p.....c",
    ".p..p..",
    "....r..",
    "t.cpc..",
    "bb.t.tt",
  ],
  things: { t: "table", p: "plant", c: "chair", r: "tv", b: "bed" },
  suspects: [
    {
      id: "A",
      name: "Ahmet",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#b91c1c",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Bertie",
      pronoun: "er",
      clue: { text: "Er war in der fünften Spalte.", ...column(5) },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Carly",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Daphne",
      pronoun: "sie",
      traits: ["glasses"],
      clue: { text: "Sie war auf dem Bett.", ...on("bed") },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "E",
      name: "Ellie",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einer Pflanze.",
        ...not(beside("plant")),
      },
      colour: "#9f1239",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Friedrich",
      pronoun: "er",
      clue: {
        text: "Er war im Garten. Er war nicht neben einer Pflanze.",
        ...all(inArea("G"), not(beside("plant"))),
      },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Ophelia",
      pronoun: "sie",
      traits: ["glasses"],
      clue: {
        text: "Sie war im letzten verbleibenden Feld, allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}‍\u{1F9B3}",
    },
  ],
  rules: [
    {
      text: "Beachte, dass jeder Bereich mit einer schwarzen Umrandung als Raum zählt. Die Terrasse, der Garten und der Whirlpool sind also Räume.",
    },
  ],
  hints: [
    {
      text: "Friedrich war im Garten, aber nicht neben einer Pflanze. Neben R2 C1, R2 C2, R3 C2 und R3 C3 steht jeweils eine Pflanze, R1 C2 und R1 C3 sind ein Tisch: Friedrich war in R1 C1. Blockiere den Rest von R1 und C1.",
      place: { F: { row: 0, col: 0 } },
      cross: [
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
        { row: 0, col: 4 },
        { row: 0, col: 5 },
        { row: 0, col: 6 },
        { row: 1, col: 0 },
        { row: 2, col: 0 },
        { row: 3, col: 0 },
        { row: 4, col: 0 },
        { row: 5, col: 0 },
        { row: 6, col: 0 },
      ],
    },
    {
      text: "Daphne war auf dem Bett in R7 C1 und R7 C2. C1 ist gesperrt, also lag sie in R7 C2. Blockiere den Rest von R7 und C2.",
      place: { D: { row: 6, col: 1 } },
      cross: [
        { row: 6, col: 2 },
        { row: 6, col: 3 },
        { row: 6, col: 4 },
        { row: 6, col: 5 },
        { row: 6, col: 6 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
        { row: 3, col: 1 },
        { row: 4, col: 1 },
        { row: 5, col: 1 },
      ],
    },
    {
      text: "Ahmet war neben einem Tisch. Am Gartentisch und am Nachttisch ist nichts mehr frei, und neben dem Tisch in R7 C4 steht in R6 C4 eine Pflanze. Bleibt der Küchentisch: Ahmet war in R6 C6 oder R6 C7 - auf jeden Fall in R6.",
      cross: [
        { row: 5, col: 2 },
        { row: 5, col: 4 },
      ],
    },
    {
      text: "Carly saß auf einem Stuhl. Der Sessel in R1 C6 liegt in R1, die Sessel in R6 C3 und R6 C5 in Ahmets R6. Carly saß im Sessel in R3 C7 - damit war Ahmet in R6 C6.",
      place: { C: { row: 2, col: 6 }, A: { row: 5, col: 5 } },
    },
    {
      text: "Bertie war in der fünften Spalte. R1, R3, R6 und R7 sind belegt, R4 C5 ist eine Pflanze und R5 C5 der Fernseher: Bertie war in R2 C5 im Whirlpool.",
      place: { B: { row: 1, col: 4 } },
    },
    {
      text: "Frei sind nur noch R4 C3, R4 C4, R5 C3 und R5 C4. Ellie war nicht neben einer Pflanze - nur R5 C3 hat keine Pflanze neben sich. Ellie war in R5 C3.",
      place: { E: { row: 4, col: 2 } },
    },
    {
      text: "Für Ophelia bleibt das letzte Feld, R4 C4 auf der Terrasse - allein mit Carly. Carly ist die Mörderin!",
      place: { O: { row: 3, col: 3 } },
    },
  ],
  solution: {
    A: { row: 5, col: 5 },
    B: { row: 1, col: 4 },
    C: { row: 2, col: 6 },
    D: { row: 6, col: 1 },
    E: { row: 4, col: 2 },
    F: { row: 0, col: 0 },
    O: { row: 3, col: 3 },
  },
};
