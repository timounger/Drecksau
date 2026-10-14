/**
 * Der Geburtstag des Richters: a kitchen, a dining room, a bathroom, a
 * bedroom, a living room and a guest room, with a murdered judge.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/66. Der Geburtstag des Richters.JPG`,
 * solution sheet in `Lösungen 1-80/Lösung 65-68.JPG`).
 * Onno is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the beds can be stood on. The
 * tables, the TVs and the plants cannot. A field is in a corner of its room
 * when the room's border runs along two of its sides that meet: one above or
 * below it, one to its left or right.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
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

/** How many people stood on a thing of this id or kind. */
function countOn(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  }).length;
}

/** Whether exactly one other was in the suspect's area, and she was a woman. */
function aloneWithAWoman(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  return others.length === 1 && c.has(others[0] ?? "", "woman");
}

/** Whether a TV stood in the suspect's room, in her row. */
function tvInRowAndRoom(c: Context): boolean {
  const area = c.areaOf(c.cell);
  return c
    .cellsOf(area ?? "")
    .some((cell) => cell.row === c.cell.row && c.is(cell, "tv"));
}

/** The case. */
export const THE_JUDGES_BIRTHDAY: Level = {
  id: "the-judges-birthday",
  name: "Der Geburtstag des Richters",
  series: { book: "original", number: 66 },
  story: "Sein Urteilsvermögen hat ihn im Stich gelassen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#efe6cf",
      label: { row: 2, col: 2 },
      labelEnd: true,
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#f1dfae",
      label: { row: 4, col: 3 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#f4ecd6",
      label: { row: 2, col: 6 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#dccbb2",
      label: { row: 8, col: 0 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#efe4c8",
      label: { row: 6, col: 7 },
      labelEnd: true,
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#f2e3bf",
      label: { row: 8, col: 7 },
      labelEnd: true,
    },
  ],
  areaMap: [
    "KKKEEEBBB",
    "KKKEEEBBB",
    "KKKEEEBBB",
    "SSSEEEWWW",
    "SSSEEEWWW",
    "SSSSWWWWW",
    "SSSSWWWWW",
    "SSSSGGGGG",
    "SSSSGGGGG",
  ],
  thingMap: [
    "tt.t....t",
    "...t.....",
    "tc...p...",
    "pv.....v.",
    ".....c..p",
    "..c..c.tt",
    "t.c..p..c",
    ".bbt.p.t.",
    ".bbppbb.c",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 7 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 8, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 8, col: 5 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Adrianna",
      pronoun: "sie",
      clue: {
        text: "Sie war im Esszimmer allein mit einer Frau.",
        ...all(inArea("E"), counting(aloneWithAWoman)),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bernadette",
      pronoun: "sie",
      clue: { text: "Sie war in der fünften Spalte.", ...column(5) },
      colour: "#15803d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "C",
      name: "Colin",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Bett.",
        ...all(
          on("bed"),
          counting((c) => countOn(c, "bed") === 1),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "D",
      name: "Dharma",
      pronoun: "sie",
      clue: { text: "Sie war im Schlafzimmer.", ...inArea("S") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Elfriede",
      pronoun: "sie",
      clue: {
        text: "In ihrem Raum war ein Fernseher, in derselben Zeile.",
        ...own(tvInRowAndRoom),
      },
      colour: "#7c3aed",
      face: "\u{1F475}",
    },
    {
      id: "F",
      name: "Florentine",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Pflanze.", ...beside("plant") },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Gernot",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke.",
        ...own((c) => inCorner(c.areaOf, c.cell)),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Hedwig",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(
          on("chair"),
          counting((c) => countOn(c, "chair") === 1),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Onno",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F474}",
    },
  ],
  rules: [
    {
      text: "Es gab keinen leeren Raum.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length > 0),
    },
  ],
  hints: [
    {
      text: "Elfriede muss in R4 im Schlafzimmer oder Wohnzimmer sein. Schließe den Rest von R4 aus.",
    },
    {
      text: "Adrianna ist allein mit einer anderen Frau im Esszimmer. Wenn keine von ihnen in R5 ist, kann nur eine andere Person in den oberen drei Zeilen sein. Aber kein Raum ist leer, also ist das unmöglich.",
    },
    {
      text: "R5 im Esszimmer ist also besetzt. Schließe den Rest von R5 aus. In R1/R2/R3 muss je eine Person in der Küche, im Esszimmer und im Badezimmer sein. Nur zwei Personen können allein in der Küche oder im Badezimmer sein: Gernot und Hedwig. Das lokalisiert Hedwig auf dem Küchenstuhl, was Gernot lokalisiert. Schließe alle anderen Stühle aus.",
      place: { H: { row: 2, col: 1 }, G: { row: 0, col: 6 } },
      cross: [
        { row: 4, col: 0 },
        { row: 4, col: 1 },
        { row: 4, col: 2 },
        { row: 4, col: 6 },
        { row: 4, col: 7 },
        { row: 4, col: 5 },
        { row: 5, col: 2 },
        { row: 5, col: 5 },
        { row: 6, col: 2 },
        { row: 6, col: 8 },
        { row: 8, col: 8 },
      ],
    },
    {
      text: "Florentine kann nicht in C5 sein (wo Bernadette ist) oder in R4 (wo Elfriede ist) oder auf einem Bett (laut Colins Hinweis), was nur ein Feld neben einer Pflanze für sie lässt: R2 C6. Das lokalisiert Adrianna in R5 C4.",
      place: { F: { row: 1, col: 5 }, A: { row: 4, col: 3 } },
    },
    {
      text: "Colin muss auf einem Bett in C3 sein, was Elfriede lokalisiert.",
      place: { E: { row: 3, col: 8 } },
    },
    {
      text: "Kein Raum ist leer, also muss ein Verdächtiger im Gästezimmer sein. Das kann nur Bernadette sein, in R8 C5. Das lokalisiert Colin, dann Dharma, dann Onno. Elfriede ist die Mörderin!",
      place: {
        B: { row: 7, col: 4 },
        C: { row: 8, col: 2 },
        D: { row: 5, col: 0 },
        O: { row: 6, col: 7 },
      },
    },
  ],
  solution: {
    A: { row: 4, col: 3 },
    B: { row: 7, col: 4 },
    C: { row: 8, col: 2 },
    D: { row: 5, col: 0 },
    E: { row: 3, col: 8 },
    F: { row: 1, col: 5 },
    G: { row: 0, col: 6 },
    H: { row: 2, col: 1 },
    O: { row: 6, col: 7 },
  },
};
