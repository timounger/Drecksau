/**
 * Midnight Rain: a rainy street at night with a newspaper kiosk, two
 * pavements and the street, and a murdered passer-by.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Mitternachtsregen.png`, no solution
 * sheet; the solver proves the case has exactly one solution). Vasilisa is
 * the victim; whoever was alone with her killed her. The car stands on the
 * street over two fields and can be stood on, like the puddles; the shelf,
 * the counter, the street lamps and the bins cannot.
 */
import {
  alone,
  all,
  beside,
  column,
  counting,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */

/** Whether the suspect is the only person on a puddle. */
function onlyOneOnAPuddle(c: Context): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, "puddle");
    }).length === 1
  );
}

/** Whether a car stands anywhere in the column east of the suspect. */
function carInColumnEast(c: Context): boolean {
  const col = c.cell.col + 1;
  return Array.from({ length: c.rows }, (_, row) => ({ row, col })).some(
    (cell) => c.inside(cell) && c.is(cell, "car"),
  );
}

/** Whether a man stands in a car exactly one column east of the suspect. */
function manInACarEast(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      there !== undefined &&
      c.has(id, "man") &&
      c.is(there, "car") &&
      there.col === c.cell.col + 1
    );
  });
}

/** The case. */
export const MIDNIGHT_RAIN: Level = {
  id: "midnight-rain",
  name: "Mitternachtsregen",
  difficulty: "easy",
  story:
    "Vasilisa wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Zeitungskiosk",
      at: "im Zeitungskiosk",
      ground: "floor",
      tint: "#7f9fae",
      label: { row: 1, col: 0 },
    },
    {
      key: "N",
      name: "Gehweg (Nord)",
      at: "auf dem Gehweg (Nord)",
      ground: "stone",
      tint: "#9b9cc0",
      label: { row: 2, col: 1 },
    },
    {
      key: "S",
      name: "Straße",
      at: "auf der Straße",
      ground: "stone",
      tint: "#6a6c94",
      label: { row: 4, col: 3 },
    },
    {
      key: "G",
      name: "Gehweg (Süd)",
      at: "auf dem Gehweg (Süd)",
      ground: "stone",
      tint: "#9b9cc0",
      label: { row: 6, col: 2 },
    },
  ],
  areaMap: [
    "KKKKNNN",
    "KKKNNNN",
    "NNNNNSS",
    "SSSSSSS",
    "SSSSSSS",
    "GGGGGGG",
    "GGGGGGG",
  ],
  thingMap: [
    "s....w.",
    "tt..m..",
    "....l..",
    "......w",
    ".w...cc",
    "wl...l.",
    "..m..w.",
  ],
  things: {
    s: "shelf",
    t: "table",
    w: "puddle",
    m: "bin",
    l: "streetLamp",
    c: "car",
  },
  extraThings: {
    puddle: { name: "Wasserpfütze", emoji: "\u{1F4A7}", standable: true },
    bin: { name: "Mülleimer", emoji: "\u{1F5D1}️", standable: false },
    streetLamp: { name: "Laterne", emoji: "\u{1F3EE}", standable: false },
  },
  suspects: [
    {
      id: "A",
      name: "Archer",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einer Wasserpfütze.",
        ...all(on("puddle"), counting(onlyOneOnAPuddle)),
      },
      colour: "#b91c1c",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Barry",
      pronoun: "er",
      clue: { text: "Er war neben dem Regal.", ...beside("shelf") },
      colour: "#15803d",
      face: "\u{1F9D1}",
    },
    {
      id: "C",
      name: "Clara",
      pronoun: "sie",
      clue: {
        text: "Sie war allein. Sie war neben einer Laterne.",
        ...all(alone(), beside("streetLamp")),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dale",
      pronoun: "er",
      traits: ["cap", "glasses"],
      clue: {
        text: "Genau eine Spalte östlich von ihm war ein Mann im Auto.",
        ...all(own(carInColumnEast), counting(manInACarEast)),
      },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Emma",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einer Wasserpfütze.",
        ...not(beside("puddle")),
      },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Flynn",
      pronoun: "er",
      clue: { text: "Er war in der letzten Spalte.", ...column(7) },
      colour: "#9f1239",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "V",
      name: "Vasilisa",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F475}",
    },
  ],
  hints: [
    {
      text: "Es gibt nur ein Feld neben einem Regal, das isoliert B in R1 C2.",
      place: { B: { row: 0, col: 1 } },
    },
    {
      text: "Wer kann laut dem Hinweis von D der Mann im Auto sein? A ist auf einer Wasserpfütze und B ist bereits platziert, also ist F die einzige Möglichkeit, in der letzten Spalte. Das setzt F als den Mann im Auto in R5 C7, was D in C6 setzt.",
      place: { F: { row: 4, col: 6 } },
    },
    {
      text: "Da D in C6 ist, kann niemand sonst in derselben Spalte sein. Das isoliert A auf der letzten Wasserpfütze in R6 C1. Da A die einzige Person auf einer Wasserpfütze ist, blockiere R7 C6.",
      place: { A: { row: 5, col: 0 } },
      cross: [{ row: 6, col: 5 }],
    },
    {
      text: "B ist im Zeitungskiosk, F auf der Straße und A auf dem Gehweg (Süd), also kann C nur auf dem Gehweg (Nord) allein sein. Das isoliert C auf dem letzten Feld neben einer Laterne in diesem Bereich, R3 C4.",
      place: { C: { row: 2, col: 3 } },
    },
    {
      text: "C ist allein, das isoliert D auf der Straße in R4 C6. Das isoliert E auf dem letzten Feld, das nicht neben einer Wasserpfütze liegt, R2 C3, dann V auf dem letzten Feld. V war allein mit A, Archer ist der Mörder!",
      place: {
        D: { row: 3, col: 5 },
        E: { row: 1, col: 2 },
        V: { row: 6, col: 4 },
      },
    },
  ],
  solution: {
    A: { row: 5, col: 0 },
    B: { row: 0, col: 1 },
    C: { row: 2, col: 3 },
    D: { row: 3, col: 5 },
    E: { row: 1, col: 2 },
    F: { row: 4, col: 6 },
    V: { row: 6, col: 4 },
  },
};
