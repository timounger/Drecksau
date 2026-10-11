/**
 * The Riding Lesson: a riding stable with a tool shed, a stall, a riding
 * ring and a pasture, and a murdered rider.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Die Reitstunde.png`, no solution sheet;
 * the solver proves the case has exactly one solution). Vanessa is the
 * victim; whoever was alone with her killed her. The horses are saddled and
 * can be sat on, like the mud puddles can be stood on; shelves, crates,
 * tables, shrubs and the tree cannot.
 */
import {
  about,
  all,
  beside,
  column,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Level } from "../engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */

/** The case. */
export const THE_RIDING_LESSON: Level = {
  id: "the-riding-lesson",
  name: "Die Reitstunde",
  difficulty: "easy",
  series: { book: "online" },
  story:
    "Vanessa wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "G",
      name: "Geräteschuppen",
      at: "im Geräteschuppen",
      ground: "floor",
      tint: "#ecebc0",
      label: { row: 3, col: 0 },
    },
    {
      key: "S",
      name: "Stall",
      at: "im Stall",
      ground: "stone",
      tint: "#d9d39a",
      label: { row: 3, col: 7 },
    },
    {
      key: "R",
      name: "Reitring",
      at: "im Reitring",
      ground: "path",
      tint: "#e6b98a",
      label: { row: 7, col: 3 },
    },
    {
      key: "W",
      name: "Weide",
      at: "auf der Weide",
      ground: "grass",
      tint: "#a9dc8a",
      label: { row: 8, col: 4 },
    },
  ],
  areaMap: [
    "GGGSSSSSS",
    "GGGSSSSSS",
    "GGGSSSSSS",
    "GGRRRRSSS",
    "RRRRRRRRW",
    "RRRRRRRRW",
    "WRRRRRRRW",
    "WWRRRRWWW",
    "WWWWWWWWW",
  ],
  thingMap: [
    "k.kxth...",
    "t..htttht",
    "x.k.....h",
    "....h..tt",
    "..m......",
    ".h...h...",
    ".m...m...",
    "s...x..b.",
    ".hs.....s",
  ],
  things: {
    k: "shelf",
    x: "crate",
    t: "table",
    h: "horse",
    m: "mud",
    s: "shrub",
    b: "tree",
  },
  extraThings: {
    horse: {
      name: "Pferd",
      emoji: "\u{1F40E}",
      standable: true,
      kinds: ["seat", "animal"],
    },
  },
  // The table round the corner in the stable.
  shapes: [
    [
      { row: 0, col: 4 },
      { row: 1, col: 4 },
      { row: 1, col: 5 },
      { row: 1, col: 6 },
    ],
  ],
  pieces: [{ at: { row: 3, col: 7 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Ayla",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Strauch.", ...beside("shrub") },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Brandon",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Christa",
      pronoun: "sie",
      clue: {
        text: "Sie war eine Spalte westlich von einer Frau, die auf einem Pferd saß.",
        ...all(
          own((c) =>
            c
              .cellsOf("G")
              .concat(c.cellsOf("S"), c.cellsOf("R"), c.cellsOf("W"))
              .some(
                (cell) => cell.col === c.cell.col + 1 && c.is(cell, "horse"),
              ),
          ),
          counting((c) =>
            c.people().some((id) => {
              const there = c.cellOf(id);
              return (
                there !== undefined &&
                c.has(id, "woman") &&
                c.is(there, "horse") &&
                there.col === c.cell.col + 1
              );
            }),
          ),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Dolores",
      pronoun: "sie",
      clue: { text: "Sie war in der fünften Spalte.", ...column(5) },
      colour: "#6366f1",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Evangeline",
      pronoun: "sie",
      clue: { text: "Sie war im Stall.", ...inArea("S") },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Finn",
      pronoun: "er",
      clue: {
        text: "Er saß auf einem Pferd im Reitring.",
        ...all(on("horse"), inArea("R")),
      },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gabby",
      pronoun: "sie",
      clue: {
        text: "Sie war im Geräteschuppen mit Brandon.",
        ...all(
          inArea("G"),
          about(["B"], (c) => {
            const brandon = c.cellOf("B");
            return brandon !== undefined && c.areaOf(brandon) === "G";
          }),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "H",
      name: "Heidi",
      pronoun: "sie",
      clue: { text: "Sie war auf einer Schlammpfütze.", ...on("mud") },
      colour: "#4338ca",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "V",
      name: "Vanessa",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F469}‍\u{1F9B0}",
    },
  ],
  hints: [
    {
      text: "B ist laut Gs Hinweis im Geräteschuppen, das isoliert B auf dem einzigen Feld des Bereichs neben einem Tisch.",
      place: { B: { row: 1, col: 1 } },
    },
    {
      text: "Es bleibt ein Feld für G im Geräteschuppen, also ist G in R4 C1.",
      place: { G: { row: 3, col: 0 } },
    },
    {
      text: "Da F auf einem Pferd im Reitring sein muss, muss F auf dem letzten Pferd in diesem Bereich sein, in R6 C6. Dann ist H in R5 C3, der letzten Schlammpfütze.",
      place: { F: { row: 5, col: 5 }, H: { row: 4, col: 2 } },
    },
    {
      text: "Laut Cs Hinweis sitzt eine Frau auf einem Pferd: Wir können herleiten, dass diese Frau R3 C9 belegen muss. Streiche alle anderen Felder in R3 und C9. (Momentan können wir NICHT herleiten, wer die Frau auf dem Pferd ist, da sowohl E als auch V dieses Feld belegen können.)",
      cross: [
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 2 },
        { row: 2, col: 3 },
        { row: 2, col: 4 },
        { row: 2, col: 5 },
        { row: 2, col: 6 },
        { row: 2, col: 7 },
        { row: 0, col: 8 },
        { row: 1, col: 8 },
        { row: 3, col: 8 },
        { row: 4, col: 8 },
        { row: 5, col: 8 },
        { row: 6, col: 8 },
        { row: 7, col: 8 },
        { row: 8, col: 8 },
      ],
    },
    {
      text: "Wir können herleiten, dass A in R9 C4 sein muss. A kann nicht in R9 C8 sein, denn Cs Hinweis besagt, dass sie eine Spalte westlich der Frau auf dem Pferd sein muss, also muss C in C8 sein.",
      place: { A: { row: 8, col: 3 } },
    },
    {
      text: "Das isoliert D auf dem letzten verfügbaren Feld in C5.",
      place: { C: { row: 0, col: 7 }, D: { row: 6, col: 4 } },
    },
    {
      text: "Da E im Stall sein muss, muss sie das Pferdefeld in R3 C9 belegen. Das isoliert V auf dem letzten verbleibenden Feld.",
      place: { E: { row: 2, col: 8 }, V: { row: 7, col: 6 } },
    },
  ],
  solution: {
    A: { row: 8, col: 3 },
    B: { row: 1, col: 1 },
    C: { row: 0, col: 7 },
    D: { row: 6, col: 4 },
    E: { row: 2, col: 8 },
    F: { row: 5, col: 5 },
    G: { row: 3, col: 0 },
    H: { row: 4, col: 2 },
    V: { row: 7, col: 6 },
  },
};
