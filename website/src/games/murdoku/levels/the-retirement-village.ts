/**
 * The Retirement Village: two flats, a path, a pool, a street, a community
 * centre and a pickleball court, and a murdered resident.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Die Seniorensiedlung.png`, no solution
 * sheet; the solver proves the case has exactly one solution). Violet is the
 * victim; whoever was alone with her killed her. The golf carts can be sat
 * in, the pool's water stood in; the long tables and the beds span two
 * fields. A corner of the pickleball court is one of its four corner fields.
 */
import {
  alone,
  all,
  beside,
  counting,
  inArea,
  on,
  onGround,
  own,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether a field is a corner field of the pickleball court. */
function courtCorner(c: Context): boolean {
  const court = c.cellsOf("K");
  const rows = court.map((cell) => cell.row);
  const cols = court.map((cell) => cell.col);
  return (
    c.areaOf(c.cell) === "K" &&
    (c.cell.row === Math.min(...rows) || c.cell.row === Math.max(...rows)) &&
    (c.cell.col === Math.min(...cols) || c.cell.col === Math.max(...cols))
  );
}

/** Whether a golf cart stands somewhere in the row just north of the suspect. */
function cartJustNorth(c: Context): boolean {
  let found = false;
  for (let col = 0; col < c.cols; col += 1) {
    found ||= c.is({ row: c.cell.row - 1, col }, "cart");
  }
  return found;
}

/** Whether a man sat in a golf cart exactly one row north of the suspect. */
function manInCartJustNorth(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined &&
      c.has(id, "man") &&
      c.is(there, "cart") &&
      there.row === c.cell.row - 1
    );
  });
}

/** The case. */
export const THE_RETIREMENT_VILLAGE: Level = {
  id: "the-retirement-village",
  name: "Die Seniorensiedlung",
  difficulty: "medium",
  story:
    "Violet wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Wohnung A",
      at: "in Wohnung A",
      ground: "floor",
      tint: "#c9eef2",
      label: { row: 2, col: 1 },
    },
    {
      key: "W",
      name: "Weg",
      at: "auf dem Weg",
      ground: "path",
      tint: "#ece2b0",
      label: { row: 3, col: 5 },
    },
    {
      key: "P",
      name: "Schwimmbad",
      at: "im Schwimmbad",
      ground: "water",
      tint: "#8fb8f5",
      label: { row: 2, col: 7 },
    },
    {
      key: "B",
      name: "Wohnung B",
      at: "in Wohnung B",
      ground: "floor",
      tint: "#c8f0e0",
      label: { row: 6, col: 7 },
    },
    {
      key: "S",
      name: "Straße",
      at: "auf der Straße",
      ground: "stone",
      tint: "#a3b1c2",
      label: { row: 9, col: 5 },
    },
    {
      key: "G",
      name: "Gemeindezentrum",
      at: "im Gemeindezentrum",
      ground: "floor",
      tint: "#f6f0c4",
      label: { row: 9, col: 1 },
    },
    {
      key: "K",
      name: "Pickleballplatz",
      at: "auf dem Pickleballplatz",
      ground: "grass",
      tint: "#a7e3c4",
      label: { row: 9, col: 7 },
    },
  ],
  areaMap: [
    "AAAAAAWPPP",
    "AAAAAWWPPP",
    "AAAAAWPPPP",
    "SSSSSWBBBB",
    "SSSSSSBBBB",
    "GGGGSSSBBB",
    "GGGGSSSBBB",
    "GGGGGSSKKK",
    "GGGGGSSKKK",
    "GGGGGSSKKK",
  ],
  groundMap: [
    "ffffffpwww",
    "ccfffppwww",
    "cffffpwwww",
    "ssssspffff",
    "ssssssffff",
    "ffffssscff",
    "ffccsssccf",
    "ffcffssggg",
    "ffcffssggg",
    "fffffssggg",
  ],
  grounds: {
    f: "floor",
    p: "path",
    w: "water",
    s: "stone",
    g: "grass",
    c: "carpet",
  },
  thingMap: [
    "v..bk.....",
    "...b......",
    ".c........",
    "......ctv.",
    "pg........",
    "...cp....b",
    ".c.......b",
    "tt.c..g...",
    "c..tt.....",
    "k..ckp....",
  ],
  things: {
    b: "bed",
    c: "chair",
    g: "cart",
    k: "shelf",
    p: "palm",
    t: "table",
    v: "tv",
  },
  extraThings: {
    cart: { name: "Golfwagen", emoji: "\u{1F6FA}", standable: true },
  },
  suspects: [
    {
      id: "A",
      name: "August",
      pronoun: "er",
      clue: { text: "Er war auf einem Teppich.", ...onGround("carpet") },
      colour: "#b91c1c",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Barnaby",
      pronoun: "er",
      clue: {
        text: "Er war allein in Wohnung A oder Wohnung B.",
        ...all(inArea("A", "B"), alone()),
      },
      colour: "#15803d",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "C",
      name: "Clarence",
      pronoun: "er",
      clue: { text: "Er war neben einem Baum.", ...beside("tree") },
      colour: "#0e7490",
      face: "\u{1F474}",
    },
    {
      id: "D",
      name: "Donna",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("seat") },
      colour: "#6366f1",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Eirlys",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Bett.", ...on("bed") },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "F",
      name: "Florence",
      pronoun: "sie",
      clue: { text: "Sie war in einem Golfwagen.", ...on("cart") },
      colour: "#9f1239",
      face: "\u{1F475}",
    },
    {
      id: "G",
      name: "Gus",
      pronoun: "er",
      clue: { text: "Er war in der obersten Reihe.", ...row(1) },
      colour: "#ea580c",
      face: "\u{1F474}",
    },
    {
      id: "H",
      name: "Horatio",
      pronoun: "er",
      clue: {
        text: "Genau eine Reihe nördlich von ihm war ein Mann in einem Golfwagen.",
        ...all(own(cartJustNorth), counting(manInCartJustNorth)),
      },
      colour: "#4338ca",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "I",
      name: "Ira",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke vom Pickleballplatz.",
        ...own(courtCorner),
      },
      colour: "#0f766e",
      face: "\u{1F474}",
    },
    {
      id: "V",
      name: "Violet",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F475}",
    },
  ],
  hints: [
    {
      text: "Wer kann laut dem Hinweis von H der Mann in einem Golfwagen sein? A auf einem Teppich, B in einer Wohnung, G in der obersten Reihe und I auf dem Pickleballplatz können alle nicht in einem Golfwagen sein. C ist die einzige Möglichkeit. Das isoliert C in R5 C2.",
      place: { C: { row: 4, col: 1 } },
    },
    {
      text: "Das setzt H in R6, eine Reihe südlich von C. Das isoliert auch F im letzten Golfwagen, in R8 C7. Das setzt I in die unterste Reihe, R10.",
      place: { F: { row: 7, col: 6 } },
    },
    {
      text: "Für D bleibt nur noch ein Stuhl übrig, das isoliert D in R9 C1.",
      place: { D: { row: 8, col: 0 } },
    },
    {
      text: "Alle verbleibenden Teppichfelder für A liegen in R7, blockiere den Rest von R7. E, auf einem Bett, kann nicht in R1 sein, weil G bereits in R1 ist. E kann auch nicht in R6 sein, da H in R6 ist und A in R7. Das isoliert E in R2 C4.",
      place: { E: { row: 1, col: 3 } },
      cross: [
        { row: 6, col: 0 },
        { row: 6, col: 1 },
        { row: 6, col: 4 },
        { row: 6, col: 5 },
        { row: 6, col: 6 },
        { row: 6, col: 7 },
        { row: 6, col: 8 },
        { row: 6, col: 9 },
      ],
    },
    {
      text: "B, der allein in einer Wohnung ist, kann nicht mit E in Wohnung A sein. B muss allein in Wohnung B auf dem letzten verbleibenden Feld sein, R4 C10. Blockiere den Rest von Wohnung B.",
      place: { B: { row: 3, col: 9 } },
      cross: [
        { row: 3, col: 6 },
        { row: 4, col: 6 },
        { row: 4, col: 7 },
        { row: 4, col: 8 },
        { row: 4, col: 9 },
        { row: 5, col: 7 },
        { row: 5, col: 8 },
        { row: 5, col: 9 },
        { row: 6, col: 7 },
        { row: 6, col: 8 },
        { row: 6, col: 9 },
      ],
    },
    {
      text: "Das isoliert I. Das isoliert auch A auf dem letzten Teppichfeld, R7 C3, dann H auf dem letzten Feld in R6, R6 C6.",
      place: {
        I: { row: 9, col: 7 },
        A: { row: 6, col: 2 },
        H: { row: 5, col: 5 },
      },
    },
    {
      text: "Das isoliert G auf dem letzten Feld in R1, R1 C9, dann V auf dem letzten Feld, R3 C5. V war allein mit E, Eirlys ist die Mörderin!",
      place: { G: { row: 0, col: 8 }, V: { row: 2, col: 4 } },
    },
  ],
  solution: {
    A: { row: 6, col: 2 },
    B: { row: 3, col: 9 },
    C: { row: 4, col: 1 },
    D: { row: 8, col: 0 },
    E: { row: 1, col: 3 },
    F: { row: 7, col: 6 },
    G: { row: 0, col: 8 },
    H: { row: 5, col: 5 },
    I: { row: 9, col: 7 },
    V: { row: 2, col: 4 },
  },
};
