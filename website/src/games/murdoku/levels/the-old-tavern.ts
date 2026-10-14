/**
 * The Old Tavern: a lounge, a toilet, a bar and a storeroom in an old pub, with
 * a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Die alte Taverne/Die alte Taverne.png`,
 * solution sheet `Das Murdoku-Orginal/Lösungen 1-80/Lösung 13-16.JPG`).
 * Oleg is the victim; whoever was alone with him killed him.
 *
 * Chairs can be stood on; tables, shelves, plants and the TVs cannot.
 */
import { all, beside, column, inArea, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_OLD_TAVERN: Level = {
  id: "the-old-tavern",
  name: "Die alte Taverne",
  series: { book: "original", number: 13 },
  story: "Seit 1987 ist nichts passiert, was annähernd so aufregend war.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Aufenthaltsraum",
      at: "im Aufenthaltsraum",
      ground: "floor",
      tint: "#dcd6c8",
      label: { row: 4, col: 1 },
    },
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "floor",
      tint: "#e6d8dc",
      label: { row: 2, col: 6 },
    },
    {
      key: "H",
      name: "Theke",
      at: "an der Theke",
      ground: "floor",
      tint: "#d8d1c0",
      label: { row: 7, col: 2 },
    },
    {
      key: "L",
      name: "Lagerraum",
      at: "im Lagerraum",
      ground: "stone",
      tint: "#c9c4e2",
      label: { row: 7, col: 5 },
    },
  ],
  areaMap: [
    "AAAATTTT",
    "AAAAATTT",
    "AAAAATTT",
    "AAAAAAAA",
    "AAAAAAAA",
    "HHHHHHLL",
    "HHHHHHLL",
    "HHHHHLLL",
  ],
  thingMap: [
    ".ctcc.c.",
    "p....t.t",
    "s.ct....",
    "t.t...pt",
    "..cccc.v",
    "t.tttt.s",
    "t...v...",
    "ss....s.",
  ],
  things: { c: "chair", t: "table", p: "plant", s: "shelf", v: "tv" },
  pieces: [
    { at: { row: 5, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 2 }, rows: 1, cols: 4 },
  ],
  suspects: [
    {
      id: "A",
      name: "Amir",
      pronoun: "er",
      clue: { text: "Er war in der ersten Spalte.", ...column(1) },
      colour: "#b91c1c",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "B",
      name: "Baldur",
      pronoun: "er",
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#15803d",
      face: "\u{1F474}",
    },
    {
      id: "C",
      name: "Caleb",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Damien",
      pronoun: "er",
      clue: { text: "Er war in der Toilette.", ...inArea("T") },
      colour: "#6366f1",
      face: "\u{1F474}",
    },
    {
      id: "E",
      name: "Eric",
      pronoun: "er",
      clue: {
        text: "Er saß auf einem Stuhl in der Toilette.",
        ...all(on("chair"), inArea("T")),
      },
      colour: "#7c3aed",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "F",
      name: "Finn",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#ea580c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "G",
      name: "Gerhard",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#334155",
      face: "\u{1F9D4}",
    },
    {
      id: "O",
      name: "Oleg",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    { text: "Eric war in der Toilette, auf einem der Stühle in Zeile 1." },
    {
      text: "Das lokalisiert Amir in Zeile 5.",
      place: { A: { row: 4, col: 0 } },
    },
    {
      text: "Das lokalisiert Gerhard auf dem Stuhl in Spalte 3.",
      place: { G: { row: 2, col: 2 } },
    },
    {
      text: "Das lokalisiert Damien in der Toilette, dann Eric und Finn (im letzten Feld neben einer Pflanze).",
      place: {
        D: { row: 1, col: 6 },
        E: { row: 0, col: 4 },
        F: { row: 3, col: 5 },
      },
    },
    {
      text: "Das lokalisiert Baldur neben dem Fernseher in Zeile 7, dann Caleb (im letzten Feld neben einem Regal) und Oleg.",
      place: {
        B: { row: 6, col: 3 },
        C: { row: 7, col: 7 },
        O: { row: 5, col: 1 },
      },
    },
    {
      text: "Oleg war allein mit der Person, die den Mord beging, hinter der Theke. Baldur ist der Mörder!",
    },
  ],
  solution: {
    A: { row: 4, col: 0 },
    B: { row: 6, col: 3 },
    C: { row: 7, col: 7 },
    D: { row: 1, col: 6 },
    E: { row: 0, col: 4 },
    F: { row: 3, col: 5 },
    G: { row: 2, col: 2 },
    O: { row: 5, col: 1 },
  },
};
