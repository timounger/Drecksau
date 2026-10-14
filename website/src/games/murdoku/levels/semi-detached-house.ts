/**
 * Semi-Detached House: Beth's dining room, bedroom and living room on one
 * side of the wall, Abel's on the other, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Doppelhaushälfte/Doppelhaushälfte.png`,
 * solution sheet
 * `game_instructions/Murdoku/Das Murdoku-Orginal/Lösungen 1-80/Lösung 21-24.JPG`).
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
    "Wie viel weiß man wirklich über seine Nachbarn? Eine Menge, wenn ihre Wände so dünn sind wie meine.",
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
  pieces: [
    { at: { row: 0, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 6 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 7 }, rows: 2, cols: 1 },
  ],
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
      text: "Weil Gustavo in Zeile 8 ist, muss Ellie in Spalte 8 sein. Laut Felix' Hinweis kann sie nicht auf einem Bett sein, das lokalisiert sie in Zeile 5.",
      place: { E: { row: 4, col: 7 } },
    },
    {
      text: "Felix muss daher auf dem Bett in Zeile 1 sein. Die anderen Felder in Zeile 1 können ausgeschlossen werden.",
      cross: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
        { row: 0, col: 6 },
      ],
    },
    {
      text: "Das lokalisiert Denise auf dem verbleibenden Stuhl in Beths Wohnzimmer, was Felix in der fünften Spalte lokalisiert.",
      place: { D: { row: 3, col: 5 }, F: { row: 0, col: 4 } },
    },
    {
      text: "Abel kann sich nicht im Esszimmer befinden, da Beth und Carrie dann nicht mehr lokalisiert werden können. Da Gustavo damit in Abels Esszimmer sein muss, muss Carrie in Beths Esszimmer alleine sein. Das lokalisiert Beth im einzig verbleibenden Feld in Beths Wohnzimmer: Zeile 3, Spalte 7. Das lokalisiert Carrie.",
      place: {
        A: { row: 6, col: 3 },
        G: { row: 7, col: 1 },
        B: { row: 2, col: 6 },
        C: { row: 1, col: 2 },
      },
    },
    {
      text: "Das lokalisiert Oswald, der allein mit Gustavo war. Gustavo ist der Mörder!",
      place: { O: { row: 5, col: 0 } },
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
