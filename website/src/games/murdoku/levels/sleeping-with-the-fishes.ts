/**
 * Sleeping with the Fishes: a harbour at night - sea, docks, a boardwalk, a
 * fish market and a warehouse.
 *
 * @module
 * @remarks
 * After the Murdoku case by Manuel Garand
 * (`game_instructions/Murdoku/Hard/SleepingWithTheFishes.png`, solution
 * beside it). Of the three boats, exactly one lies in the two empty columns.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data:
   rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The columns each boat covers, counted from 0. */
const BOATS: readonly (readonly number[])[] = [
  [2, 3],
  [6, 7],
  [1, 2],
];

/** The columns nobody stands in. */
function emptyColumns(c: Context): readonly number[] {
  const taken = new Set(c.people().map((id) => (c.cellOf(id) as Cell).col));
  return Array.from({ length: c.cols }, (_, col) => col).filter(
    (col) => !taken.has(col),
  );
}

/** The case. */
export const SLEEPING_WITH_THE_FISHES: Level = {
  id: "sleeping-with-the-fishes",
  name: "Bei den Fischen schlafen",
  difficulty: "hard",
  story:
    "Vincenza wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "S",
      name: "Meer",
      at: "im Meer",
      ground: "water",
      label: { row: 1, col: 0 },
    },
    {
      key: "H",
      name: "Bootshaus",
      at: "im Bootshaus",
      ground: "floor",
      tint: "#c9b3c4",
      label: { row: 3, col: 0 },
    },
    {
      key: "A",
      name: "Dock A",
      at: "auf Dock A",
      ground: "stone",
      tint: "#c4b8ab",
      label: { row: 3, col: 4 },
    },
    {
      key: "D",
      name: "Dock B",
      at: "auf Dock B",
      ground: "stone",
      tint: "#c9aeb4",
      label: { row: 2, col: 8 },
    },
    {
      key: "W",
      name: "Promenade",
      at: "auf der Promenade",
      ground: "floor",
      tint: "#d6d3c4",
      label: { row: 5, col: 1 },
    },
    {
      key: "F",
      name: "Fischmarkt",
      at: "im Fischmarkt",
      ground: "floor",
      tint: "#b9d8d0",
      label: { row: 8, col: 1 },
    },
    {
      key: "L",
      name: "Lagerhaus",
      at: "im Lagerhaus",
      ground: "floor",
      tint: "#c8b2cc",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "SSSSSSSSSSS",
    "SSSSSASSSSS",
    "HHHSSASSDDD",
    "HHHSAASSSSD",
    "WWWWWSSWWWW",
    "WWWWWWWWLWW",
    "FFFFWWLLLLW",
    "FFFFWWLLLLL",
    "FFFFFFLLLLL",
  ],
  thingMap: [
    "..bb.......",
    "......bb...",
    "xbb..o....x",
    "c..........",
    ".........c.",
    "cc.........",
    ".ttt..s..x.",
    ".x.o..x.x..",
    ".o..co.ssxs",
  ],
  things: {
    b: "boat",
    c: "chair",
    x: "crate",
    o: "box",
    s: "shelf",
    t: "table",
  },
  suspects: [
    {
      id: "A",
      name: "Antonio",
      pronoun: "er",
      clue: { text: "Er war auf einem Boot.", ...on("boat") },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Barry",
      pronoun: "er",
      clue: {
        text: "In seinem Bereich war eine Frau neben einer Kiste.",
        ...counting((c) =>
          c
            .people()
            .some(
              (id) =>
                id !== c.self &&
                c.has(id, "woman") &&
                c.areaOf(c.cellOf(id) as Cell) === c.areaOf(c.cell) &&
                c.beside(c.cellOf(id) as Cell, "crate"),
            ),
        ),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Claire",
      pronoun: "sie",
      clue: {
        text: "Sie war auf einem Boot. Sie war östlich von Antonio.",
        ...all(
          on("boat"),
          about(["A"], (c) => (c.cellOf("A") as Cell).col < c.cell.col),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Delilah",
      pronoun: "sie",
      clue: { text: "Sie war im Fischmarkt.", ...inArea("F") },
      colour: "#6366f1",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Erin",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Franklin",
      pronoun: "er",
      clue: { text: "Er war auf Dock A oder B.", ...inArea("A", "D") },
      colour: "#9f1239",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Graham",
      pronoun: "er",
      clue: { text: "Er war neben einer Kiste.", ...beside("crate") },
      colour: "#ea580c",
      face: "\u{1F9D1}",
    },
    {
      id: "H",
      name: "Hilton",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#4338ca",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "V",
      name: "Vincenza",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F469}",
    },
  ],
  rules: [
    {
      text: "Es gibt genau zwei leere Spalten. Ein Boot liegt ganz in den zwei leeren Spalten.",
      check: (c: Context): boolean => {
        const empty = emptyColumns(c);
        return (
          empty.length === 2 &&
          BOATS.some((cols) => cols.every((col) => empty.includes(col)))
        );
      },
    },
  ],
  hints: [
    {
      text: "Ein Boot ist leer (laut der allgemeinen Regel), die beiden anderen sind besetzt - Antonio und Claire stehen darauf. Wären Barry und die Frau neben einer Kiste auf Dock A oder B, stünde Franklin auf Dock A, und es gäbe zwei leere Boote - unmöglich. Die Frau neben einer Kiste steht also zwischen Reihe 7 und 9. Delilah ist im Fischmarkt und Hilton im Lagerhaus. Die einzige Frau, die in Barrys Bereich neben einer Kiste stehen kann, ist Delilah. Damit steht Delilah in Reihe 8.",
    },
    {
      text: "Hilton kann nur in Spalte 7 oder 8 stehen. Das leere Boot muss in den zwei leeren Spalten liegen, also kann das rechte Boot nicht leer sein. Claire (östlich von Antonio) muss darauf stehen. Streiche den Rest von Reihe 2.",
      cross: [0, 1, 2, 3, 4, 5, 8, 9, 10].map((col) => ({ row: 1, col })),
    },
    {
      text: "Franklin und Graham müssen Reihe 3 und 4 belegen, also steht Antonio auf dem Boot in Reihe 1. Das linke Boot ist dann das leere: Sperre seine beiden Spalten, 2 und 3. Damit stehen Antonio und Delilah fest.",
      place: { A: { row: 0, col: 3 }, D: { row: 7, col: 0 } },
    },
    {
      text: "Damit steht Barry fest.",
      place: { B: { row: 8, col: 4 } },
    },
    {
      text: "Damit steht Hilton fest, dann Claire. Und für Erin bleibt nur der letzte Stuhl.",
      place: {
        H: { row: 6, col: 7 },
        C: { row: 1, col: 6 },
        E: { row: 4, col: 9 },
      },
    },
    {
      text: "Damit steht Graham fest, dann Franklin.",
      place: { G: { row: 3, col: 10 }, F: { row: 2, col: 8 } },
    },
    {
      text: "Für Vincenza bleibt das letzte Feld, allein mit Erin auf der Promenade. Erin ist die Mörderin!",
      place: { V: { row: 5, col: 5 } },
    },
  ],
  solution: {
    A: { row: 0, col: 3 },
    B: { row: 8, col: 4 },
    C: { row: 1, col: 6 },
    D: { row: 7, col: 0 },
    E: { row: 4, col: 9 },
    F: { row: 2, col: 8 },
    G: { row: 3, col: 10 },
    H: { row: 6, col: 7 },
    V: { row: 5, col: 5 },
  },
};
