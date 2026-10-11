/**
 * The Terracotta Courtyard: a villa with dining room, kitchen, garage, living
 * room, bedroom, a courtyard and a pool, and a murdered guest.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Der Terrakotta-Innenhof.png`, no solution
 * sheet; the solver proves the case has exactly one solution). Vernon is the
 * victim; whoever was alone with him killed him. The pool's water can be
 * stood in; the car spans two fields, as do the long tables and the bed.
 */
import {
  about,
  alone,
  all,
  beside,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether the suspect's row and column each hold a shelf somewhere. */
function shelvesAcross(c: Context): boolean {
  let inRow = false;
  let inColumn = false;
  for (let index = 0; index < Math.max(c.rows, c.cols); index += 1) {
    inRow ||= c.is({ row: c.cell.row, col: index }, "shelf");
    inColumn ||= c.is({ row: index, col: c.cell.col }, "shelf");
  }
  return inRow && inColumn;
}

/** The case. */
export const THE_TERRACOTTA_COURTYARD: Level = {
  id: "the-terracotta-courtyard",
  name: "Der Terrakotta-Innenhof",
  difficulty: "medium",
  series: { book: "online" },
  story:
    "Vernon wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#f2b3b3",
      label: { row: 2, col: 1 },
    },
    {
      key: "I",
      name: "Innenhof",
      at: "im Innenhof",
      ground: "stone",
      tint: "#e9a48c",
      label: { row: 4, col: 6 },
    },
    {
      key: "P",
      name: "Pool",
      at: "im Pool",
      ground: "water",
      tint: "#7fb0ec",
      label: { row: 3, col: 6 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#b9b7a8",
      label: { row: 5, col: 1 },
    },
    {
      key: "G",
      name: "Garage",
      at: "in der Garage",
      ground: "floor",
      tint: "#b39a8f",
      label: { row: 8, col: 1 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#eeaa98",
      label: { row: 8, col: 3 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#f0d39c",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "EEEEEIIII",
    "EEEEIIPPI",
    "EEEEIIPPI",
    "KKKKIIPPI",
    "KKKWIIIII",
    "KKKWWWSSS",
    "GGGWWWSSS",
    "GGGWWWSSS",
    "GGGWWWSSS",
  ],
  groundMap: [
    "fffffssss",
    "ffffsswws",
    "ffffsswws",
    "ffffsswwc",
    "ffffssccc",
    "ffffffccf",
    "ffffffcff",
    "fffffffff",
    "fffffffff",
  ],
  grounds: { f: "floor", s: "stone", w: "water", c: "carpet" },
  thingMap: [
    "..c...tp.",
    "ctt.....c",
    "kccp....c",
    "k....c...",
    "tt..p....",
    "....v....",
    "........b",
    ".aac.c..b",
    ".ktpck.kk",
  ],
  things: {
    a: "car",
    b: "bed",
    c: "chair",
    k: "shelf",
    p: "plant",
    t: "table",
    v: "tv",
  },
  // The rugs, as the page draws them.
  carpets: [
    [
      { row: 3, col: 8 },
      { row: 4, col: 8 },
      { row: 4, col: 7 },
      { row: 4, col: 6 },
    ],
    [
      { row: 5, col: 6 },
      { row: 5, col: 7 },
      { row: 6, col: 6 },
    ],
  ],
  pieces: [
    { at: { row: 1, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 1 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Agnes",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Pflanze.", ...beside("plant") },
      colour: "#b91c1c",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "B",
      name: "Bill",
      pronoun: "er",
      clue: {
        text: "Es gab irgendwo in seiner Reihe ein Regal und ein weiteres Regal in seiner Spalte.",
        ...own(shelvesAcross),
      },
      colour: "#15803d",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Chris",
      pronoun: "er",
      clue: { text: "Er war in der Garage.", ...inArea("G") },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Dina",
      pronoun: "sie",
      clue: { text: "Sie war im Auto.", ...on("car") },
      colour: "#6366f1",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Eira",
      pronoun: "sie",
      clue: {
        text: "Sie war allein. Sie war westlich von Dina.",
        ...all(
          alone(),
          about(["D"], (c) => {
            const dina = c.cellOf("D");
            return dina !== undefined && c.cell.col < dina.col;
          }),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Finlay",
      pronoun: "er",
      clue: {
        text: "Er war nicht auf einem Teppich.",
        ...own((c) => c.groundAt(c.cell) !== "carpet"),
      },
      colour: "#9f1239",
      face: "\u{1F9D4}",
    },
    {
      id: "G",
      name: "Gino",
      pronoun: "er",
      clue: { text: "Er war auf dem Bett.", ...on("bed") },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Hassan",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("seat") },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Vernon",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F471}‍♂️",
    },
  ],
  hints: [
    {
      text: "D muss im Auto in R8 sein, blockiere den Rest von R8. Das isoliert G auf dem letzten Feld mit einem Bett, in R7 C9.",
      place: { G: { row: 6, col: 8 } },
      cross: [
        { row: 7, col: 0 },
        { row: 7, col: 3 },
        { row: 7, col: 4 },
        { row: 7, col: 5 },
        { row: 7, col: 6 },
        { row: 7, col: 7 },
        { row: 7, col: 8 },
      ],
    },
    {
      text: "Das isoliert C auf dem letzten Feld in der Garage, in R9 C1. Um westlich von D zu sein, kann E nur in C2 sein. Das isoliert D im Auto, in R8 C3.",
      place: { C: { row: 8, col: 0 }, D: { row: 7, col: 2 } },
    },
    {
      text: "Für H bleibt nur noch ein Stuhl übrig (er kann nicht in C2 sein, denn dort muss E sein); das isoliert H in R4 C6.",
      place: { H: { row: 3, col: 5 } },
    },
    {
      text: "Das isoliert A auf dem letzten Feld neben einer Pflanze (denk daran, dass „neben“ auch im selben Bereich bedeutet), in R2 C4.",
      place: { A: { row: 1, col: 3 } },
    },
    {
      text: "E ist allein, also kann sie nicht mit A im Esszimmer sein. Sie muss auf dem letzten Feld der Küche sein, in R6 C2.",
      place: { E: { row: 5, col: 1 } },
    },
    {
      text: "Das isoliert B auf dem letzten Feld, das irgendwo in derselben Reihe und in derselben Spalte ein Regal hat.",
      place: { B: { row: 2, col: 7 } },
    },
    {
      text: "Das isoliert F auf dem letzten Feld ohne Teppich, in R1 C5, dann V in R5 C7. V war allein mit H, Hassan ist der Mörder!",
      place: { F: { row: 0, col: 4 }, V: { row: 4, col: 6 } },
    },
  ],
  solution: {
    A: { row: 1, col: 3 },
    B: { row: 2, col: 7 },
    C: { row: 8, col: 0 },
    D: { row: 7, col: 2 },
    E: { row: 5, col: 1 },
    F: { row: 0, col: 4 },
    G: { row: 6, col: 8 },
    H: { row: 3, col: 5 },
    V: { row: 4, col: 6 },
  },
};
