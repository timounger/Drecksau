/**
 * Das Kino: two cinema halls, the corridor, the entrance, the ticket counter
 * and the projection room, with a murdered film-goer.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/51. Kino.png`, solution
 * sheet `Lösungen 1-80/Lösung 49-52.JPG`).
 * Obi is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the rugs can be stood on. The
 * L-shaped counter is the table; it, the cash registers, the TVs and the
 * plants cannot. The windows are the bars in the outer walls; standing in
 * front of one means being on the field right beside it. A field is in a
 * corner of its room when the room's border runs along two of its sides that
 * meet: one above or below it, one to its left or right.
 */
import {
  all,
  alone,
  beside,
  cellsWhere,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** The fields right in front of a window. */
const WINDOWS: readonly Cell[] = [
  { row: 0, col: 5 },
  { row: 4, col: 0 },
];

/** Whether a field lies right in front of a window. */
function byWindow(cell: Cell): boolean {
  return WINDOWS.some((one) => one.row === cell.row && one.col === cell.col);
}

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

/** Whether a field is in a corner of one of the two halls. */
function hallCorner(
  areaOf: (cell: Cell) => string | null,
  cell: Cell,
): boolean {
  return ["A", "B"].includes(areaOf(cell) ?? "") && inCorner(areaOf, cell);
}

/** Whether a TV stands in the suspect's row and area. */
function tvInRowAndRoom(c: Context): boolean {
  return c
    .cellsOf(c.areaOf(c.cell) ?? "")
    .some((cell) => cell.row === c.cell.row && c.is(cell, "tv"));
}

/** Whether another woman stands in the suspect's area. */
function anotherWomanInRoom(c: Context): boolean {
  return c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .some((id) => id !== c.self && c.has(id, "woman"));
}

/** The case. */
export const THE_CINEMA: Level = {
  id: "the-cinema",
  name: "Das Kino",
  series: { book: "original", number: 51 },
  story:
    "Deshalb vermeide ich keine Spoiler. Man weiß nie, ob man das Ende des Films noch erlebt.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Saal A",
      at: "in Saal A",
      ground: "floor",
      tint: "#e2dcf0",
      label: { row: 3, col: 0 },
    },
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "floor",
      tint: "#ecdcdc",
      label: { row: 5, col: 5 },
    },
    {
      key: "B",
      name: "Saal B",
      at: "in Saal B",
      ground: "floor",
      tint: "#e2dcf0",
      label: { row: 6, col: 7 },
    },
    {
      key: "E",
      name: "Eingang",
      at: "im Eingang",
      ground: "floor",
      tint: "#e6dcea",
      label: { row: 5, col: 1 },
    },
    {
      key: "K",
      name: "Kassentheke",
      at: "an der Kassentheke",
      ground: "floor",
      tint: "#dcd6e2",
      label: { row: 8, col: 2 },
    },
    {
      key: "V",
      name: "Vorführraum",
      at: "im Vorführraum",
      ground: "floor",
      tint: "#e6dcdc",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "AAAAFFBBB",
    "AAAAFFBBB",
    "AAAAFFBBB",
    "AAAAFFBBB",
    "EEEEFFBBB",
    "EEEEFFBBB",
    "KKKKKKBBB",
    "KKKKKKVVV",
    "KKKKKKVVV",
  ],
  thingMap: [
    ".cc.prccc",
    "cc.crr..c",
    "cc.crrcc.",
    ".vv......",
    "rrrr..c.c",
    "rrrpp.ccc",
    "...rr....",
    "rkTTTT.vv",
    ".kT.r.r..",
  ],
  things: {
    T: "table",
    c: "chair",
    k: "cashRegister",
    p: "plant",
    r: "rug",
    v: "tv",
  },
  extraThings: {
    cashRegister: { name: "Kasse", emoji: "\u{1F4B5}", standable: false },
  },
  shapes: [
    [
      { row: 7, col: 2 },
      { row: 7, col: 3 },
      { row: 7, col: 4 },
      { row: 7, col: 5 },
      { row: 8, col: 2 },
    ],
  ],
  pieces: [
    { at: { row: 0, col: 4 }, rows: 3, cols: 2, thing: "rug" },
    { at: { row: 4, col: 0 }, rows: 2, cols: 4 },
    { at: { row: 6, col: 3 }, rows: 1, cols: 2 },
  ],
  windows: [
    { at: { row: 0, col: 5 }, side: "top" },
    { at: { row: 4, col: 0 }, side: "left" },
  ],
  suspects: [
    {
      id: "A",
      name: "Anna",
      pronoun: "sie",
      clue: { text: "Sie war neben dem Tisch.", ...beside("table") },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Buff",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Carry",
      pronoun: "sie",
      clue: {
        text: "Sie war auf einem Teppich. Eine weitere Frau war in ihrem Raum.",
        ...all(on("rug"), counting(anotherWomanInRoom)),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Dory",
      pronoun: "sie",
      clue: {
        text: "Sie war allein und vor einem Fenster.",
        ...all(
          own((c) => byWindow(c.cell)),
          alone(),
        ),
        glow: () => WINDOWS,
      },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "E",
      name: "Effie",
      pronoun: "sie",
      clue: {
        text: "Sie saß nicht auf einem Stuhl.",
        ...not(on("chair")),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Fred",
      pronoun: "er",
      clue: {
        text: "Er war in derselben Zeile und im selben Raum wie ein Fernseher.",
        ...own(tvInRowAndRoom),
      },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Galadriel",
      pronoun: "sie",
      clue: { text: "Sie war im Vorführraum.", ...inArea("V") },
      colour: "#ea580c",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "H",
      name: "Hans",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke von Saal A oder B.",
        ...own((c) => hallCorner(c.areaOf, c.cell)),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            hallCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#4338ca",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "O",
      name: "Obi",
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
      text: "Buff und Dory müssen in separaten Räumen sein; einer ist im Eingang und der andere im Flur. Anna ist bei den Kassen, neben dem Tisch.",
    },
    {
      text: "Carry, auf einem Teppich, kann nicht mit Dory sein (die alleine ist) oder mit Buff (da Carry mit einer Frau ist und nur zwei Leute in Buffs Raum sein können). Sie muss bei den Kassen mit Anna sein oder im Vorführraum mit Galadriel.",
    },
    {
      text: "Zusammen besetzen Anna, Carry und Galadriel die letzten drei Zeilen, also können wir die unterste Zeile von Saal B ausschließen.",
      cross: [
        { row: 6, col: 6 },
        { row: 6, col: 7 },
        { row: 6, col: 8 },
      ],
    },
    {
      text: "Fred muss in Saal A sein, in Z4. Das platziert Hans in Z1, was das Fenster in Z1 blockiert und Dory im Eingang lokalisiert und Buff im Flur. Das lokalisiert Fred.",
      place: { D: { row: 4, col: 0 }, F: { row: 3, col: 3 } },
    },
    {
      text: "Jemand muss in Z8 S7 sein; das kann nur Galadriel sein. Das lokalisiert Hans und blockiert auch den Teppich im Vorführraum, was Carry in S5 platziert, was Buff lokalisiert.",
      place: {
        G: { row: 7, col: 6 },
        H: { row: 0, col: 8 },
        B: { row: 5, col: 5 },
      },
    },
    {
      text: "Das lokalisiert Anna, dann Carry, dann Effie im letzten Feld ohne Stuhl, dann Obi. Fred ist der Mörder!",
      place: {
        A: { row: 6, col: 2 },
        C: { row: 8, col: 4 },
        E: { row: 1, col: 7 },
        O: { row: 2, col: 1 },
      },
    },
  ],
  solution: {
    A: { row: 6, col: 2 },
    B: { row: 5, col: 5 },
    C: { row: 8, col: 4 },
    D: { row: 4, col: 0 },
    E: { row: 1, col: 7 },
    F: { row: 3, col: 3 },
    G: { row: 7, col: 6 },
    H: { row: 0, col: 8 },
    O: { row: 2, col: 1 },
  },
};
