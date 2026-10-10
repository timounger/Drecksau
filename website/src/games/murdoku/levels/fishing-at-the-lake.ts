/**
 * Fishing at the Lake: a lake with a jetty, rocky, northern and southern
 * shores, and a murdered angler.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Angeln am See.png`, already in German).
 * Vadim is the victim; whoever was alone with him killed him. No area held
 * exactly one person.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  beside,
  counting,
  inArea,
  not,
  on,
  victim,
} from "../engine/clues";
import type { Cell, Level } from "../engine/types";

/** The side length of the square map. */
const SIZE = 8;

/**
 * The fields of a row, counted from nought, except some columns.
 *
 * @param row - the row
 * @param keep - the columns left out
 * @returns the fields
 */
function rowExcept(row: number, keep: readonly number[]): readonly Cell[] {
  return Array.from({ length: SIZE }, (_, col) => ({ row, col })).filter(
    (cell) => !keep.includes(cell.col),
  );
}

/**
 * The fields of a column, counted from nought, except some rows.
 *
 * @param col - the column
 * @param keep - the rows left out
 * @returns the fields
 */
function columnExcept(col: number, keep: readonly number[]): readonly Cell[] {
  return Array.from({ length: SIZE }, (_, row) => ({ row, col })).filter(
    (cell) => !keep.includes(cell.row),
  );
}

/** The case. */
export const FISHING_AT_THE_LAKE: Level = {
  id: "fishing-at-the-lake",
  name: "Angeln am See",
  difficulty: "medium",
  series: { book: "online" },
  story:
    "Vadim wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "N",
      name: "Nordufer",
      at: "am Nordufer",
      ground: "grass",
      tint: "#6cc4c0",
      label: { row: 0, col: 3 },
    },
    {
      key: "S",
      name: "Steg",
      at: "auf dem Steg",
      ground: "floor",
      tint: "#a07fa8",
      label: { row: 3, col: 0 },
    },
    {
      key: "L",
      name: "See",
      at: "im See",
      ground: "water",
      tint: "#7fb3b8",
      label: { row: 5, col: 3 },
    },
    {
      key: "R",
      name: "Felsiges Ufer",
      at: "am felsigen Ufer",
      ground: "stone",
      tint: "#8a9ba3",
      label: { row: 6, col: 0 },
    },
    {
      key: "U",
      name: "Südufer",
      at: "am Südufer",
      ground: "grass",
      tint: "#6cc4c0",
      label: { row: 6, col: 4 },
    },
  ],
  areaMap: [
    "NNNNNNNN",
    "NNNLLLNN",
    "NSSLLLLL",
    "SSLLLLLL",
    "RLLLLLLU",
    "RRLLLLUU",
    "RRRLUUUU",
    "RRRRUUUU",
  ],
  thingMap: [
    "....fs..",
    ".s....t.",
    "t....o..",
    "........",
    "..o.....",
    "........",
    ".....t..",
    "..f....s",
  ],
  things: {
    f: "boulder",
    s: "shrub",
    t: "tree",
    o: "boat",
  },
  suspects: [
    {
      id: "A",
      name: "Alan",
      pronoun: "er",
      clue: { text: "Er war in einem Boot.", ...on("boat") },
      colour: "#b91c1c",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Blaine",
      pronoun: "er",
      traits: ["cap"],
      clue: { text: "Er war auf dem Steg.", ...inArea("S") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Corina",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Strauch.", ...beside("shrub") },
      colour: "#0e7490",
      face: "\u{1F475}",
    },
    {
      id: "D",
      name: "Dawn",
      pronoun: "sie",
      clue: {
        text: "Sie war südwestlich von Blaine.",
        ...about(["B"], (c) => {
          const blaine = c.cellOf("B");
          return (
            blaine !== undefined &&
            c.cell.row > blaine.row &&
            c.cell.col < blaine.col
          );
        }),
      },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "E",
      name: "Elias",
      pronoun: "er",
      traits: ["glasses"],
      clue: { text: "Er war nicht neben einem Baum.", ...not(beside("tree")) },
      colour: "#7c3aed",
      face: "\u{1F474}",
    },
    {
      id: "F",
      name: "Frederick",
      pronoun: "er",
      clue: { text: "Er war neben einem Felsblock.", ...beside("boulder") },
      colour: "#9f1239",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "G",
      name: "Gerald",
      pronoun: "er",
      clue: {
        text: "Er war mit einem Mann.",
        ...counting((c) =>
          c
            .peopleIn(c.areaOf(c.cell) ?? "")
            .some((one) => one !== c.self && c.has(one, "man")),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Vadim",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F474}",
    },
  ],
  rules: [
    {
      text: "In keinem Bereich befand sich genau eine Person.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length !== 1),
    },
  ],
  hints: [
    {
      text: "Laut dem allgemeinen Hinweis kann B nicht allein auf dem Steg sein; B muss mit jemand anderem auf dem Steg sein. Sperre den Rest von R3 und R4. Das isoliert A auf dem letzten Boot.",
      place: { A: { row: 4, col: 2 } },
      cross: [...rowExcept(2, [1, 2]), ...rowExcept(3, [0, 1])],
    },
    {
      text: "Dadurch befinden sich B und die andere Person auf dem Steg in C1 und C2; sperre den Rest von C1-C2. D kann jetzt nur noch in R4 C1 sein, mit B in R3 C2.",
      place: { B: { row: 2, col: 1 }, D: { row: 3, col: 0 } },
      cross: [...columnExcept(0, [3]), ...columnExcept(1, [2, 3])],
    },
    {
      text: "Laut dem allgemeinen Hinweis kann F nicht allein am felsigen Ufer sein; das isoliert F neben dem Felsblock in R1 C4. Jemand muss bei ihm in R2 C8 sein.",
      place: { F: { row: 0, col: 3 } },
    },
    {
      text: "Das isoliert C auf dem letzten Feld neben einem Strauch. Jemand muss bei ihr in R7 C5 sein. Das isoliert E im See, auf dem letzten Feld, das sich nicht neben einem Baum befindet.",
      place: { C: { row: 7, col: 6 }, E: { row: 5, col: 5 } },
    },
    {
      text: "Das isoliert G am Nordufer und dann V am Südufer, allein mit C. Corina ist die Mörderin!",
      place: { G: { row: 1, col: 7 }, V: { row: 6, col: 4 } },
    },
  ],
  solution: {
    A: { row: 4, col: 2 },
    B: { row: 2, col: 1 },
    C: { row: 7, col: 6 },
    D: { row: 3, col: 0 },
    E: { row: 5, col: 5 },
    F: { row: 0, col: 3 },
    G: { row: 1, col: 7 },
    V: { row: 6, col: 4 },
  },
};
