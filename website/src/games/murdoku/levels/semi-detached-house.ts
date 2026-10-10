/**
 * Semi-Detached House: Beth's dining room, bedroom and living room on one
 * side of the wall, Abel's on the other, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Doppelhaushälfte/Doppelhaushälfte.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Oswald is the victim; whoever was alone with him killed him.
 *
 * Chairs and beds can be stood on; tables, the wardrobe-like table in Abel's
 * bedroom, plants and the TVs cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  alone,
  all,
  counting,
  inArea,
  not,
  on,
  row,
  victim,
} from "../engine/clues";
import type { Cell, Level } from "../engine/types";

/** Beth's rooms. */
const BETHS: readonly string[] = ["E", "S", "W"];

/** Abel's rooms. */
const ABELS: readonly string[] = ["F", "L", "B"];

/** The case. */
export const SEMI_DETACHED_HOUSE: Level = {
  id: "semi-detached-house",
  name: "Doppelhaushälfte",
  series: { book: "original", number: 23 },
  story:
    "Wie viel weiß man wirklich über seine Nachbarn? Eine Menge, wenn ihre Wände so dünn sind wie meine. Oswald wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Beths Esszimmer",
      at: "in Beths Esszimmer",
      ground: "floor",
      tint: "#ecd3e4",
      label: { row: 3, col: 0 },
    },
    {
      key: "S",
      name: "Beths Schlafzimmer",
      at: "in Beths Schlafzimmer",
      ground: "floor",
      tint: "#dccbe8",
      label: { row: 1, col: 4 },
    },
    {
      key: "W",
      name: "Beths Wohnzimmer",
      at: "in Beths Wohnzimmer",
      ground: "carpet",
      tint: "#e4c4e0",
      label: { row: 3, col: 4 },
    },
    {
      key: "F",
      name: "Abels Esszimmer",
      at: "in Abels Esszimmer",
      ground: "stone",
      tint: "#cfe6d6",
      label: { row: 7, col: 0 },
    },
    {
      key: "L",
      name: "Abels Wohnzimmer",
      at: "in Abels Wohnzimmer",
      ground: "floor",
      tint: "#c8e6d0",
      label: { row: 7, col: 3 },
    },
    {
      key: "B",
      name: "Abels Schlafzimmer",
      at: "in Abels Schlafzimmer",
      ground: "floor",
      tint: "#cdeacf",
      label: { row: 7, col: 6 },
    },
  ],
  areaMap: [
    "EEESSSSS",
    "EEESSSSS",
    "EEEWWWWW",
    "EEEWWWWW",
    "FFFLLLBB",
    "FFFLLLBB",
    "FFFLLLBB",
    "FFFLLLBB",
  ],
  thingMap: [
    "cc..bb.t",
    "tt.t..f.",
    ".p.tf..p",
    ".....c..",
    "...pt.t.",
    ".tc..ftb",
    ".t.c..pb",
    "c...cp..",
  ],
  things: {
    b: "bed",
    c: "chair",
    f: "tv",
    p: "plant",
    t: "table",
  },
  suspects: [
    {
      id: "A",
      name: "Abel",
      pronoun: "er",
      clue: {
        text: "Er war in einem seiner eigenen Räume. Er saß auf einem Stuhl.",
        ...all(inArea(...ABELS), on("chair")),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}\u{1F3FF}",
    },
    {
      id: "B",
      name: "Beth",
      pronoun: "sie",
      traits: ["glasses"],
      clue: {
        text: "Sie war in einem ihrer eigenen Räume.",
        ...inArea(...BETHS),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Carrie",
      pronoun: "sie",
      clue: {
        text: "Sie war allein in Abels oder Beths Esszimmer.",
        ...all(inArea("E", "F"), alone()),
      },
      colour: "#0e7490",
      face: "\u{1F471}\u200D\u2640\uFE0F",
    },
    {
      id: "D",
      name: "Denise",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl in einem von Beths Räumen.",
        ...all(inArea(...BETHS), on("chair")),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Ellie",
      pronoun: "sie",
      clue: {
        text: "Sie war allein in Abels Schlafzimmer.",
        ...all(inArea("B"), alone()),
      },
      colour: "#be185d",
      face: "\u{1F469}\u200D\u{1F9B3}",
    },
    {
      id: "F",
      name: "Felix",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Bett.",
        ...all(
          on("bed"),
          counting((c) =>
            c
              .people()
              .every(
                (id) => id === c.self || !c.is(c.cellOf(id) as Cell, "bed"),
              ),
          ),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gustavo",
      pronoun: "er",
      clue: {
        text: "Er war in der untersten Zeile. Er saß nicht auf einem Stuhl.",
        ...all(row(8), not(on("chair"))),
      },
      colour: "#334155",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Oswald",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  hints: [
    {
      text: "Felix war die einzige Person auf einem Bett: R1 C5/C6 in Beths Schlafzimmer oder R6 C8/R7 C8 in Abels Schlafzimmer. Dort war Ellie allein, also lag Felix in R1. Denise saß auf einem Stuhl in Beths Räumen: R1 C1, R1 C2 oder R4 C6 - R1 ist besetzt, also R4 C6. Damit ist C6 gesperrt, und Felix lag in R1 C5.",
      place: { D: { row: 3, col: 5 }, F: { row: 0, col: 4 } },
    },
    {
      text: "Gustavo war in R8. Ellie war allein in Abels Schlafzimmer und nicht auf einem Bett: R5 C8, R8 C7 oder R8 C8 - R8 gehört Gustavo, also R5 C8. Abel saß auf einem Stuhl in seinen Räumen: R8 und C5 sind gesperrt, es bleiben R6 C3 und R7 C4.",
      place: { E: { row: 4, col: 7 } },
    },
    {
      text: "R2 und R3 liegen ganz in Beths Räumen - dort können nur Beth, Carrie und Oswald stehen. In C7 sind nur R3 C7 und R8 C7 frei; in R8 C7 wäre Gustavo bei Ellie. Also steht in R3 C7 Beth oder Oswald. Wäre es Oswald, stünde Beth in R2 C3 in ihrem Esszimmer, Carrie allein in Abels Esszimmer in R6 C1 (Abel in R7 C4) - und Gustavo müsste in R8 C2 zu ihr. Also war Beth in R3 C7.",
      place: { B: { row: 2, col: 6 } },
    },
    {
      text: "In R2 ist nur noch R2 C3 frei, für Carrie oder Oswald. Oswald wäre dort allein in Beths Esszimmer - ohne Mörder. Also war Carrie in R2 C3, allein in Beths Esszimmer.",
      place: { C: { row: 1, col: 2 } },
    },
    {
      text: "C3 ist gesperrt, also saß Abel in R7 C4. Oswald blieb R6 C1 und Gustavo R8 C2 - Oswald war allein mit Gustavo in Abels Esszimmer. Gustavo ist der Mörder!",
      place: {
        A: { row: 6, col: 3 },
        O: { row: 5, col: 0 },
        G: { row: 7, col: 1 },
      },
    },
  ],
  solution: {
    A: { row: 6, col: 3 },
    B: { row: 2, col: 6 },
    C: { row: 1, col: 2 },
    D: { row: 3, col: 5 },
    E: { row: 4, col: 7 },
    F: { row: 0, col: 4 },
    G: { row: 7, col: 1 },
    O: { row: 5, col: 0 },
  },
};
