/**
 * Backyard Hot Tub: a garden, a terrace around a hot tub, a living room, a
 * bedroom and a kitchen, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Whirlpool im Hintergarten/Whirlpool im Hintergarten.png`,
 * solution sheet
 * `game_instructions/Murdoku/Das Murdoku-Orginal/Lösungen 1-80/Lösung 05-08.JPG`).
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
  story: "Sieht aus, als wären ein paar Emotionen hochgekocht.",
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
  pieces: [
    { at: { row: 0, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 5 }, rows: 1, cols: 2 },
  ],
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
      note: true,
      text: "Beachte, dass jeder Bereich mit einer schwarzen Umrandung als Raum zählt. Die Terrasse, der Garten und der Whirlpool sind also Räume.",
    },
  ],
  hints: [
    {
      text: "Es gibt nur ein Feld im Garten, das nicht neben einer Pflanze ist, also muss Friedrich dort sein: Zeile 1, Spalte 1.",
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
      text: "Das lokalisiert Daphne auf dem Bett im Schlafzimmer, in Spalte 2.",
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
      text: "Ahmet kann nur in Zeile 6 sein, in einem der Felder nördlich des Küchentischs.",
      cross: [
        { row: 5, col: 2 },
        { row: 5, col: 4 },
      ],
    },
    {
      text: "Das lokalisiert Carly auf dem letzten verbleibenden Stuhl.",
      place: { C: { row: 2, col: 6 } },
    },
    {
      text: "Das lokalisiert Bertie im Whirlpool und lokalisiert auch Ahmet in Spalte 6.",
      place: { B: { row: 1, col: 4 }, A: { row: 5, col: 5 } },
    },
    {
      text: "Von den vier verfügbaren Feldern sind drei neben einer Pflanze, also ist Ellie im verbleibenden: Zeile 5, Spalte 3.",
      place: { E: { row: 4, col: 2 } },
    },
    {
      text: "Das lokalisiert Ophelia auf der Terrasse. Carly ist die Mörderin!",
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
