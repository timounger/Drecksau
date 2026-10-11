/**
 * The Frontier Town: a parsonage, a chapel, a general store, a porch and a
 * bank in the desert, an outlaw hiding among the suspects and a murdered
 * stranger.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Schwer/Die Siedlerstadt/Die Siedlerstadt.png`,
 * no solution sheet; the solver proves the case has exactly one solution).
 * Virgil is the victim; whoever was alone with him killed him. Exactly one
 * suspect is the outlaw, and the outlaw was beside a table. Hazel was with
 * the outlaw - in her area - and neither Duke nor Virgil is the outlaw, so
 * somebody else in Hazel's area stands beside a table.
 *
 * A field is in a corner of its area when the area's border runs along two
 * of its sides that meet: one above or below it, one to its left or right.
 * Chairs, the bed and the horses can be stood on; tables, shelves, cacti,
 * money bags, cash registers and the safe cannot.
 */
import {
  about,
  all,
  beside,
  cellsWhere,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** The suspects who are said not to be the outlaw. */
const NOT_OUTLAWS: readonly string[] = ["D", "V"];

/** Whether a field lies in a corner of its area, given the area of each field. */
function inCorner(areaOf: (cell: Cell) => string | null, cell: Cell): boolean {
  const area = areaOf(cell);
  const outside = (row: number, col: number): boolean =>
    areaOf({ row, col }) !== area;
  const vertical =
    outside(cell.row - 1, cell.col) || outside(cell.row + 1, cell.col);
  const horizontal =
    outside(cell.row, cell.col - 1) || outside(cell.row, cell.col + 1);
  return vertical && horizontal;
}

/** Whether somebody who may be the outlaw stands beside a table. */
function outlawBesideTable(c: Context, among: readonly string[]): boolean {
  return among.some((id) => {
    const there = c.cellOf(id);
    return (
      !NOT_OUTLAWS.includes(id) &&
      there !== undefined &&
      c.beside(there, "table")
    );
  });
}

/** The case. */
export const THE_FRONTIER_TOWN: Level = {
  id: "the-frontier-town",
  name: "Die Siedlerstadt",
  difficulty: "hard",
  series: { book: "online" },
  story:
    "Virgil wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "P",
      name: "Pfarrhaus",
      at: "im Pfarrhaus",
      ground: "floor",
      tint: "#d8c79a",
      label: { row: 2, col: 0 },
    },
    {
      key: "D",
      name: "Draußen",
      at: "draußen",
      ground: "sand",
      tint: "#f0cf6e",
      label: { row: 6, col: 4 },
    },
    {
      key: "K",
      name: "Kapelle",
      at: "in der Kapelle",
      ground: "stone",
      tint: "#f6d3bb",
      label: { row: 4, col: 5 },
    },
    {
      key: "G",
      name: "Gemischtwarenladen",
      at: "im Gemischtwarenladen",
      ground: "stone",
      tint: "#e2c4a8",
      label: { row: 9, col: 0 },
    },
    {
      key: "R",
      name: "Veranda",
      at: "auf der Veranda",
      ground: "floor",
      tint: "#e6cfae",
      label: { row: 9, col: 4 },
    },
    {
      key: "B",
      name: "Bank",
      at: "in der Bank",
      ground: "stone",
      tint: "#d2b39a",
      label: { row: 9, col: 7 },
    },
  ],
  areaMap: [
    "PPPDKKKKDD",
    "PPPDKKKKDD",
    "PPDDKKKKDD",
    "DDDDKKKKDD",
    "DDDDKKKKDD",
    "GGGDDDDDDD",
    "GGGDDDRBBB",
    "GGGGRRRBBB",
    "GGGGRRBBBB",
    "GGGGRRBBBB",
  ],
  thingMap: [
    ".ts.....kh",
    "cbbh.tt...",
    ".sm.m..c.k",
    "..c.c..ch.",
    "k...c..c..",
    "..........",
    "s...k...sc",
    "m.srhm.t.t",
    ".c....tt..",
    "s.st.cx..r",
  ],
  things: {
    b: "bed",
    c: "chair",
    h: "horse",
    k: "cactus",
    m: "moneyBag",
    r: "cashRegister",
    s: "shelf",
    t: "table",
    x: "safe",
  },
  extraThings: {
    horse: {
      name: "Pferd",
      emoji: "\u{1F40E}",
      standable: true,
      kinds: ["seat", "animal"],
    },
    moneyBag: { name: "Geldsack", emoji: "\u{1F4B0}", standable: false },
    cashRegister: {
      name: "Registrierkasse",
      emoji: "\u{1F9FE}",
      standable: false,
    },
    safe: { name: "Tresor", emoji: "\u{1F512}", standable: false },
  },
  pieces: [
    { at: { row: 1, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 5 }, rows: 1, cols: 2 },
  ],
  // The counter round the corner in the bank.
  shapes: [
    [
      { row: 7, col: 7 },
      { row: 8, col: 7 },
      { row: 8, col: 6 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Abigail",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einer Registrierkasse.",
        ...beside("cashRegister"),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bessie",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke ihres Bereichs.",
        ...own((c) => inCorner(c.areaOf, c.cell)),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Curtis",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#0e7490",
      face: "\u{1F920}",
    },
    {
      id: "D",
      name: "Duke",
      pronoun: "er",
      clue: {
        text: "Nicht der Gesetzlose. Er war neben einem Stuhl.",
        ...beside("chair"),
      },
      colour: "#6366f1",
      face: "\u{1F474}",
    },
    {
      id: "E",
      name: "Etta",
      pronoun: "sie",
      clue: { text: "Sie war in der Bank.", ...inArea("B") },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Frank",
      pronoun: "er",
      clue: { text: "Er saß auf einem Pferd.", ...on("horse") },
      colour: "#9f1239",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Garrett",
      pronoun: "er",
      clue: { text: "Er war neben einem Kaktus.", ...beside("cactus") },
      colour: "#ea580c",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "H",
      name: "Hazel",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl. Sie war bei dem Gesetzlosen.",
        ...all(
          on("chair"),
          counting((c) =>
            outlawBesideTable(
              c,
              c.peopleIn(c.areaOf(c.cell) ?? "").filter((id) => id !== c.self),
            ),
          ),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "I",
      name: "Ivy",
      pronoun: "sie",
      clue: {
        text: "Sie war südlich von Hazel, in einem anderen Bereich.",
        ...about(["H"], (c) => {
          const hazel = c.cellOf("H");
          return (
            hazel !== undefined &&
            c.cell.row > hazel.row &&
            c.areaOf(hazel) !== c.areaOf(c.cell)
          );
        }),
      },
      colour: "#0f766e",
      face: "\u{1F469}",
    },
    {
      id: "V",
      name: "Virgil",
      pronoun: "er",
      clue: {
        text: "Nicht der Gesetzlose. Er war allein mit dem Mörder.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      text: "Es versteckt sich genau ein Gesetzloser unter den Verdächtigen. Der Gesetzlose kann der Mörder sein oder nicht.",
    },
    {
      text: "Der Gesetzlose war neben einem Tisch.",
      check: (c) => outlawBesideTable(c, c.people()),
    },
  ],
  hints: [
    {
      text: "Laut den Hinweisen muss der Gesetzlose ein Verdächtiger sein, der neben einem Tisch ist, und zwar bei H, die auf einem Stuhl sitzt. H würde alle Felder neben einem Tisch blockieren, wenn sie in R2 C1 oder R9 C2 säße. Und kein Verdächtiger könnte der Gesetzlose sein und neben den Tisch in der Kapelle passen.",
    },
    {
      text: "Der einzige Bereich, in dem H mit einem Verdächtigen neben einem Tisch sitzen kann, ist also die Bank. Wenn man H auf den Stuhl in R7 C10 setzt, ist E der einzige Verdächtige, der auf ein Feld neben einem Tisch in der Bank passt. Blockiere Es Schnittfeld, R10 C9.",
      place: { H: { row: 6, col: 9 } },
      cross: [{ row: 9, col: 8 }],
    },
    {
      text: "Das isoliert A auf dem letzten Feld neben einer Kasse. I ist südlich von H, also müssen I und E in R8 und R10 sein, in beliebiger Reihenfolge. Niemand sonst passt in diese beiden Reihen.",
      place: { A: { row: 8, col: 3 } },
    },
    {
      text: "Das isoliert F auf dem letzten Pferd, dann E. Das setzt I in R8.",
      place: { F: { row: 3, col: 8 }, E: { row: 9, col: 7 } },
    },
    {
      text: "G ist in R5 C2 oder R6 C5, blockiere die Schnittfelder R6 C2 und R5 C5. Das isoliert C auf dem letzten Stuhl.",
      place: { C: { row: 1, col: 0 } },
      cross: [
        { row: 5, col: 1 },
        { row: 4, col: 4 },
      ],
    },
    {
      text: "B ist in R6 C3 oder R1 C5, blockiere die Schnittfelder R6 C5 und R1 C3. Das isoliert G auf dem letzten Feld neben einem Kaktus.",
      place: { G: { row: 4, col: 1 } },
      cross: [{ row: 5, col: 4 }],
    },
    {
      text: "Das isoliert D auf dem letzten Feld neben einem Stuhl, dann I auf dem letzten Feld in R8, dann B in der letzten Ecke, dann V auf dem letzten Feld.",
      place: {
        D: { row: 2, col: 6 },
        I: { row: 7, col: 4 },
        B: { row: 5, col: 2 },
        V: { row: 0, col: 5 },
      },
    },
  ],
  solution: {
    A: { row: 8, col: 3 },
    B: { row: 5, col: 2 },
    C: { row: 1, col: 0 },
    D: { row: 2, col: 6 },
    E: { row: 9, col: 7 },
    F: { row: 3, col: 8 },
    G: { row: 4, col: 1 },
    H: { row: 6, col: 9 },
    I: { row: 7, col: 4 },
    V: { row: 0, col: 5 },
  },
};
