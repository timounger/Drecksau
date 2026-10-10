/**
 * The Electronics Store: a store room, a repair room, the computers, the
 * checkout counter and the media corner, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Elektroladen/Elektroladen.png`, no
 * solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
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
  story:
    "Hier stand wohl jemand sehr unter Spannung. Odo wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
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
      traits: ["glasses"],
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
      traits: ["glasses"],
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
      text: "Daniel war neben einem Tisch. Neben dem Tisch an der Kassentheke liegt kein freies Feld der Kassentheke; am langen Tisch in der Mediathek bleiben R6 C4, R8 C4 und R8 C5. Da Daniel nördlich von Bobby war, kann er nicht in R8 sein: Daniel war in R6 C4. Blockiere den Rest von R6 und C4.",
      place: { D: { row: 5, col: 3 } },
      cross: [
        { row: 5, col: 0 },
        { row: 5, col: 1 },
        { row: 5, col: 2 },
        { row: 5, col: 5 },
        { row: 5, col: 6 },
        { row: 5, col: 7 },
        { row: 0, col: 3 },
        { row: 1, col: 3 },
        { row: 2, col: 3 },
        { row: 3, col: 3 },
        { row: 7, col: 3 },
      ],
    },
    {
      text: "Der einzige Stuhl steht im Reparaturraum, in R2 C7. Franco war also im Reparaturraum, und jemand anders saß auf dem Stuhl. Blockiere den Rest von R2 und C7 für diese Person.",
      cross: [
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 4 },
        { row: 0, col: 6 },
        { row: 2, col: 6 },
        { row: 3, col: 6 },
        { row: 4, col: 6 },
        { row: 6, col: 6 },
        { row: 7, col: 6 },
      ],
    },
    {
      text: "Gideon war neben einer Kiste: R1 C4, R2 C3, R3 C2 oder R4 C7 - R2 und C7 sind gesperrt, also war er im Lager. Wäre Caroline in R3 C8, stünden Franco, die Person auf dem Stuhl und Caroline in R1 bis R3, und für Gideon bliebe kein Platz. Caroline war in R8 C8. Blockiere den Rest von R8 und C8.",
      place: { C: { row: 7, col: 7 } },
      cross: [
        { row: 7, col: 0 },
        { row: 7, col: 1 },
        { row: 7, col: 2 },
        { row: 7, col: 4 },
        { row: 7, col: 5 },
        { row: 2, col: 7 },
      ],
    },
    {
      text: "Bobby war südlich von Daniel, also in R7, neben einem Fernseher: R7 C1 oder R7 C3 (R7 C7 ist gesperrt). R1 bis R3 gehören Franco, der Person auf dem Stuhl und Gideon, R6 bis R8 Daniel, Bobby und Caroline. Adam war also in R4 oder R5 - nicht neben einem Fernseher, Regal oder einer Kasse geht das nur in R4 C6. Blockiere den Rest von R4 und C6.",
      place: { A: { row: 3, col: 5 } },
      cross: [
        { row: 3, col: 0 },
        { row: 3, col: 4 },
        { row: 0, col: 5 },
        { row: 2, col: 5 },
        { row: 4, col: 5 },
      ],
    },
    {
      text: "In R5 ist nur noch R5 C1 frei. Dort war Odo oder die Person auf dem Stuhl - Emir kann nicht in C1 sein, denn in C1 steht eine Kiste. Odo war in R5 C1, Emir saß auf dem Stuhl in R2 C7. Blockiere den Rest von R5 und C1.",
      place: { O: { row: 4, col: 0 }, E: { row: 1, col: 6 } },
      cross: [{ row: 6, col: 0 }],
    },
    {
      text: "Bobby war damit in R7 C3, Gideon in R3 C2 (C4 ist gesperrt) und Franco in R1 C5. Bei den Computern war Odo allein mit Bobby - Bobby ist der Mörder!",
      place: {
        B: { row: 6, col: 2 },
        G: { row: 2, col: 1 },
        F: { row: 0, col: 4 },
      },
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
