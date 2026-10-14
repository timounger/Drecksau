/**
 * The Electronics Store: a store room, a repair room, the computers, the
 * checkout counter and the media corner, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Elektroladen/Elektroladen.png`,
 * solution sheet
 * `game_instructions/Murdoku/Das Murdoku-Orginal/Lösungen 1-80/Lösung 21-24.JPG`).
 * Odo is the victim; whoever was alone with him killed him.
 *
 * The only chair stands in the repair room and can be stood on; the TVs, the
 * shelves, the crates, the two tables and the cash registers cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  column,
  counting,
  not,
  own,
  victim,
} from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_ELECTRONICS_STORE: Level = {
  id: "the-electronics-store",
  name: "Elektroladen",
  series: { book: "original", number: 24 },
  story: "Hier stand wohl jemand sehr unter Spannung.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "L",
      name: "Lager",
      at: "im Lager",
      ground: "stone",
      tint: "#d4d6ee",
      label: { row: 2, col: 1 },
    },
    {
      key: "R",
      name: "Reparaturraum",
      at: "im Reparaturraum",
      ground: "floor",
      tint: "#ddd0ea",
      label: { row: 2, col: 5 },
    },
    {
      key: "C",
      name: "Computer",
      at: "bei den Computern",
      ground: "floor",
      tint: "#b8d8ea",
      label: { row: 7, col: 0 },
    },
    {
      key: "K",
      name: "Kassentheke",
      at: "an der Kassentheke",
      ground: "floor",
      tint: "#d8cceb",
      label: { row: 4, col: 3 },
    },
    {
      key: "M",
      name: "Mediathek",
      at: "in der Mediathek",
      ground: "floor",
      tint: "#c0e2e6",
      label: { row: 7, col: 5 },
    },
  ],
  areaMap: [
    "LLLLRRRR",
    "LLLLRRRR",
    "LLLLRRRR",
    "CCKKKKMM",
    "CCKKKKMM",
    "CCCMMMMM",
    "CCCMMMMM",
    "CCCMMMMM",
  ],
  thingMap: [
    "ffx....f",
    "f....fcs",
    "x.......",
    ".sf....x",
    ".ftkk..f",
    "....s...",
    ".f.ttf.f",
    "........",
  ],
  things: {
    c: "chair",
    f: "tv",
    k: "cashRegister",
    s: "shelf",
    t: "table",
    x: "crate",
  },
  extraThings: {
    cashRegister: { name: "Kasse", emoji: "\u{1F4B5}", standable: false },
  },
  pieces: [{ at: { row: 6, col: 3 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Adam",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einem Fernseher, Regal oder einer Kasse.",
        ...all(
          not(beside("tv")),
          not(beside("shelf")),
          not(beside("cashRegister")),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Bobby",
      pronoun: "er",
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Caroline",
      pronoun: "sie",
      clue: { text: "Sie war in der letzten Spalte.", ...column(8) },
      colour: "#0e7490",
      face: "\u{1F475}",
    },
    {
      id: "D",
      name: "Daniel",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Tisch. Er war nördlich von Bobby.",
        ...all(
          beside("table"),
          about(["B"], (c) => {
            const bobby = c.cellOf("B");
            return bobby === undefined || c.cell.row < bobby.row;
          }),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "E",
      name: "Emir",
      pronoun: "er",
      clue: {
        text: "In seiner Spalte war keine Kiste, weder im selben Raum noch anderswo.",
        ...own((c) =>
          Array.from({ length: c.rows }, (_, at) => ({
            row: at,
            col: c.cell.col,
          })).every((cell) => !c.is(cell, "crate")),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "F",
      name: "Franco",
      pronoun: "er",
      clue: {
        text: "Jemand anders saß auf dem Stuhl in seinem Raum.",
        ...all(
          own((c) =>
            c
              .cellsOf(c.areaOf(c.cell) ?? "")
              .some((cell) => c.is(cell, "chair")),
          ),
          counting((c) =>
            c.cellsOf(c.areaOf(c.cell) ?? "").some((cell) => {
              const sitter = c.personAt(cell);
              return (
                c.is(cell, "chair") && sitter !== null && sitter !== c.self
              );
            }),
          ),
        ),
      },
      colour: "#9f1239",
      face: "\u{1F9D4}",
    },
    {
      id: "G",
      name: "Gideon",
      pronoun: "er",
      clue: { text: "Er war neben einer Kiste.", ...beside("crate") },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "O",
      name: "Odo",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [],
  hints: [
    {
      text: "Franco war im Reparaturraum mit dem Stuhl. Jemand sitzt auf dem Stuhl, also schließe den Rest von Zeile 2 und Spalte 7 aus.",
      cross: [
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
        { row: 1, col: 4 },
        { row: 0, col: 6 },
        { row: 2, col: 6 },
        { row: 3, col: 6 },
        { row: 4, col: 6 },
        { row: 5, col: 6 },
        { row: 6, col: 6 },
        { row: 7, col: 6 },
      ],
    },
    {
      text: "Weil Daniel nördlich von Bobby ist, lokalisiert das Daniel in Zeile 6, Spalte 4. Das setzt Bobby in Zeile 7 oder 8.",
      place: { D: { row: 5, col: 3 } },
    },
    {
      text: "Das lokalisiert Gideon im letzten Feld neben einer Kiste.",
      place: { G: { row: 2, col: 1 } },
    },
    {
      text: "Das lokalisiert Caroline in Zeile 8 und setzt Franco in Zeile 1 des Reparaturraums.",
      place: { C: { row: 7, col: 7 } },
    },
    {
      text: "Das lokalisiert Adam im letzten verfügbaren Feld, das nicht neben einem Fernseher, Regal oder einer Kasse ist: Zeile 4, Spalte 6.",
      place: { A: { row: 3, col: 5 }, F: { row: 0, col: 4 } },
    },
    {
      text: "Spalte 1 und 3 enthalten Kisten, also muss Emir auf dem Stuhl in Spalte 7 sein.",
      place: { E: { row: 1, col: 6 } },
    },
    {
      text: "Bobby muss mit Odo bei den Computern sein, mit Odo in Spalte 1 und Bobby in Spalte 3. Bobby ist der Mörder!",
      place: { O: { row: 4, col: 0 }, B: { row: 6, col: 2 } },
    },
  ],
  solution: {
    A: { row: 3, col: 5 },
    B: { row: 6, col: 2 },
    C: { row: 7, col: 7 },
    D: { row: 5, col: 3 },
    E: { row: 1, col: 6 },
    F: { row: 0, col: 4 },
    G: { row: 2, col: 1 },
    O: { row: 4, col: 0 },
  },
};
