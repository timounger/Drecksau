/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and fields as printed */
/**
 * Der Nachtclub: two toilets, a DJ booth, a dance floor, a bar, a VIP area,
 * a cloakroom and a lounge, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/55. Der Nachtclub.JPG`,
 * solution on `Lösungen 1-80/Lösung 53-56.JPG`).
 * Olympe is the victim; whoever was alone with her killed her.
 *
 * The armchairs are the chairs; they and the rugs (the cross on the dance
 * floor, open in its middle, and the mats in the DJ booth and the VIP area)
 * can be stood on. The field inside the U of the bar is plain floor. The tables (the U-shaped bar counter among them), the TVs, the
 * cloakroom shelf and the plants cannot. A field is in a corner of its room
 * when the room's border runs along two of its sides that meet: one above
 * or below it, one to its left or right.
 */
import {
  about,
  all,
  beside,
  cellsWhere,
  column,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

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

/** Whether the suspect stood south of Astrid. */
function southOfAstrid(c: Context): boolean {
  const astrid = c.cellOf("A");
  return astrid !== undefined && c.cell.row > astrid.row;
}

/** Whether the suspect stood east of Astrid. */
function eastOfAstrid(c: Context): boolean {
  const astrid = c.cellOf("A");
  return astrid !== undefined && c.cell.col > astrid.col;
}

/** Whether Astrid was alone with Bella: the two of them, nobody else. */
function aloneWithBella(c: Context): boolean {
  const here = c.peopleIn(c.areaOf(c.cell) ?? "");
  return here.length === 2 && here.includes("B");
}

/** How many people sat on chairs. */
const SEATED = 2;

/** Whether exactly two people sat on chairs. */
function twoOnChairs(c: Context): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, "chair");
    }).length === SEATED
  );
}

/** The case. */
export const THE_NIGHTCLUB: Level = {
  id: "the-nightclub",
  name: "Der Nachtclub",
  series: { book: "original", number: 55 },
  story: "Sie hätten nicht »Murder on the Dancefloor« spielen sollen ...",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Toilette (W)",
      at: "in der Toilette (W)",
      ground: "floor",
      tint: "#b9e3e6",
      label: { row: 2, col: 0 },
    },
    {
      key: "D",
      name: "DJ-Pult",
      at: "am DJ-Pult",
      ground: "floor",
      tint: "#b9c3ec",
      label: { row: 1, col: 4 },
    },
    {
      key: "V",
      name: "VIP-Bereich",
      at: "im VIP-Bereich",
      ground: "floor",
      tint: "#c3bdea",
      label: { row: 4, col: 8 },
      labelEnd: true,
    },
    {
      key: "F",
      name: "Tanzfläche",
      at: "auf der Tanzfläche",
      ground: "floor",
      tint: "#e6c8e6",
      label: { row: 6, col: 4 },
    },
    {
      key: "B",
      name: "Bar",
      at: "an der Bar",
      ground: "floor",
      tint: "#b3cfee",
      label: { row: 6, col: 1 },
      labelEnd: true,
    },
    {
      key: "M",
      name: "Toilette (M)",
      at: "in der Toilette (M)",
      ground: "floor",
      tint: "#b9e3e6",
      label: { row: 8, col: 2 },
    },
    {
      key: "G",
      name: "Garderobe",
      at: "in der Garderobe",
      ground: "floor",
      tint: "#d4cdee",
      label: { row: 7, col: 3 },
    },
    {
      key: "L",
      name: "Lounge",
      at: "in der Lounge",
      ground: "floor",
      tint: "#dcbfe0",
      label: { row: 8, col: 8 },
      labelEnd: true,
    },
  ],
  areaMap: [
    "WWDDDDVVV",
    "WWDDDDVVV",
    "WWFFFFFVV",
    "BBFFFFFVV",
    "BBFFFFFVV",
    "BBFFFFFLL",
    "BBFFFFFLL",
    "MMMGGLLLL",
    "MMMMGLLLL",
  ],
  thingMap: [
    "tcvrr.pcc",
    "c.tt.vrtt",
    "....r..rc",
    "tt.rrr.tc",
    ".trr.rr.p",
    "tt.rrr.pc",
    "cc..r..ct",
    "...s.c..c",
    "ctc...vcp",
  ],
  things: {
    c: "chair",
    p: "plant",
    r: "rug",
    s: "shelf",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 0, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 7 }, rows: 1, cols: 2 },
  ],
  shapes: [
    [
      { row: 3, col: 0 },
      { row: 3, col: 1 },
      { row: 4, col: 1 },
      { row: 5, col: 1 },
      { row: 5, col: 0 },
    ],
    [
      { row: 2, col: 4 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 3, col: 5 },
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 4, col: 5 },
      { row: 4, col: 6 },
      { row: 5, col: 3 },
      { row: 5, col: 4 },
      { row: 5, col: 5 },
      { row: 6, col: 4 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Astrid",
      pronoun: "sie",
      clue: {
        text: "Sie war auf einem Teppich. Sie war allein mit Bella.",
        ...all(on("rug"), counting(aloneWithBella)),
      },
      colour: "#c2410c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bella",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke.",
        ...own((c) => inCorner(c.areaOf, c.cell)),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Clemens",
      pronoun: "er",
      clue: {
        text: "Er war an der Bar. Er war südlich von Astrid.",
        ...all(inArea("B"), about(["A"], southOfAstrid)),
      },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Detlef",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Fernseher. Er war östlich von Astrid.",
        ...all(beside("tv"), about(["A"], eastOfAstrid)),
      },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Eloise",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#7c3aed",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "F",
      name: "Fred",
      pronoun: "er",
      clue: { text: "Er war im VIP-Bereich.", ...inArea("V") },
      colour: "#7f1d1d",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Gian",
      pronoun: "er",
      clue: { text: "Er war in der dritten Spalte.", ...column(3) },
      colour: "#ea580c",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "H",
      name: "Hawa",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Pflanze.", ...beside("plant") },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Olympe",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#be123c",
      face: "\u{1F471}‍♀️",
    },
  ],
  rules: [
    { text: "Genau zwei Personen saßen auf einem Stuhl.", check: twoOnChairs },
  ],
  hints: [
    {
      text: "Astrid (auf einem Teppich) und Bella können nur allein zusammen auf der Tanzfläche sein, da Fred im VIP-Bereich ist.",
    },
    {
      text: "Da Gian in S3 ist (in der Toilette), muss Bella in S7 sein, in einer der Ecken.",
    },
    {
      text: "Fred und Hawa sind in S8 und S9 in irgendeiner Konfiguration. Wer auch immer von ihnen in S9 ist, muss auf einem Stuhl sein. Eloise ist auch auf einem Stuhl - und niemand sonst, laut dem allgemeinen Hinweis.",
    },
    {
      text: "Das lässt uns alle Stühle in S8 ausschließen und lokalisiert Gian in Z8 und Clemens an der Bar.",
      place: { G: { row: 7, col: 2 }, C: { row: 4, col: 0 } },
    },
    {
      text: "Das lässt ein verfügbares Feld in S8 (in Z3), das Fred besetzen muss. Das lokalisiert Bella, dann Eloise auf dem letzten Stuhl nicht in S9.",
      place: {
        F: { row: 2, col: 7 },
        B: { row: 6, col: 6 },
        E: { row: 0, col: 1 },
      },
    },
    {
      text: "Detlef muss in Z2 S5 sein. Astrid ist nördlich von Clemens und westlich von Detlef, also ist sie in Z4 S4. Das lokalisiert Hawa, dann Olympe. Hawa ist die Mörderin!",
      place: {
        D: { row: 1, col: 4 },
        A: { row: 3, col: 3 },
        H: { row: 5, col: 8 },
        O: { row: 8, col: 5 },
      },
    },
  ],
  solution: {
    A: { row: 3, col: 3 },
    B: { row: 6, col: 6 },
    C: { row: 4, col: 0 },
    D: { row: 1, col: 4 },
    E: { row: 0, col: 1 },
    F: { row: 2, col: 7 },
    G: { row: 7, col: 2 },
    H: { row: 5, col: 8 },
    O: { row: 8, col: 5 },
  },
};
