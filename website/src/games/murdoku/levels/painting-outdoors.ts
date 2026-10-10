/**
 * Malen im Freien: a pond with a boulder, a wood with an easel and a statue,
 * and a pavement - and a murdered painter's guest.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Malen im Freien.png`, no solution sheet).
 * Vincenza is the victim; whoever was alone with her killed her.
 */
import { about, beside, column, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const PAINTING_OUTDOORS: Level = {
  id: "painting-outdoors",
  name: "Malen im Freien",
  difficulty: "veryEasy",
  series: { book: "online" },
  story:
    "Vincenza wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "T",
      name: "Teich",
      at: "im Teich",
      ground: "water",
      tint: "#bfe6f7",
      label: { row: 1, col: 0 },
    },
    {
      key: "W",
      name: "Wald",
      at: "im Wald",
      ground: "grass",
      tint: "#a8dd88",
      label: { row: 4, col: 2 },
    },
    {
      key: "G",
      name: "Gehweg",
      at: "auf dem Gehweg",
      ground: "stone",
      tint: "#ddd2ec",
      label: { row: 5, col: 2 },
    },
  ],
  areaMap: ["TTTTWW", "TTWWWW", "WWWWWW", "WWWWWW", "GWWWWG", "GGGGGG"],
  thingMap: ["..b.c.", "...sf.", "f...ec", "......", "...f..", "...c.."],
  things: {
    b: "boulder",
    c: "chair",
    s: "statue",
    f: "flowers",
    e: "easel",
  },
  suspects: [
    {
      id: "A",
      name: "Allison",
      pronoun: "sie",
      clue: { text: "Sie war in der ersten Spalte.", ...column(1) },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Brandon",
      pronoun: "er",
      clue: {
        text: "Er war eine Reihe südlich von Donovan, in einem anderen Bereich.",
        ...about(["D"], (c) => {
          const donovan = c.cellOf("D");
          return (
            donovan !== undefined &&
            c.cell.row === donovan.row + 1 &&
            c.areaOf(c.cell) !== c.areaOf(donovan)
          );
        }),
      },
      colour: "#0e7490",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Clark",
      pronoun: "er",
      clue: { text: "Er war neben dem Felsblock.", ...beside("boulder") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Donovan",
      pronoun: "er",
      clue: { text: "Er war neben der Staffelei.", ...beside("easel") },
      colour: "#6366f1",
      face: "\u{1F474}",
    },
    {
      id: "E",
      name: "Ellie",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("seat") },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "V",
      name: "Vincenza",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F475}",
    },
  ],
  hints: [
    {
      text: "Um neben dem Felsblock zu sein, muss C im selben Bereich liegen. C muss in R1 sein; blockiere den Rest von R1.",
      cross: [
        { row: 0, col: 0 },
        { row: 0, col: 2 },
        { row: 0, col: 4 },
        { row: 0, col: 5 },
      ],
    },
    {
      text: "D muss in R2, R3 oder R4 neben der Staffelei liegen. B ist eine Reihe südlich von D und in einem anderen Bereich, also auf dem Gehweg. D kann nur in R4 C5 sein und B in R5 C6.",
      place: { D: { row: 3, col: 4 }, B: { row: 4, col: 5 } },
    },
    {
      text: "Das isoliert E auf dem letzten Stuhl.",
      place: { E: { row: 5, col: 3 } },
    },
    {
      text: "Das isoliert A auf dem letzten Feld von C1, dann V auf dem letzten verbleibenden Feld.",
      place: {
        A: { row: 1, col: 0 },
        C: { row: 0, col: 1 },
        V: { row: 2, col: 2 },
      },
    },
  ],
  solution: {
    A: { row: 1, col: 0 },
    B: { row: 4, col: 5 },
    C: { row: 0, col: 1 },
    D: { row: 3, col: 4 },
    E: { row: 5, col: 3 },
    V: { row: 2, col: 2 },
  },
};
