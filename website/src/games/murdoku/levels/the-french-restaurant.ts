/**
 * The French Restaurant: a kitchen, a store room, a dining room, a toilet and
 * an entrance, and a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Das französische Restaurant.png`, already
 * in German). Vincent is the victim; whoever was alone with him killed him.
 * Chairs and carpet can be stood on; shelves, tables and plants cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  onGround,
  victim,
} from "../engine/clues";
import type { Cell, Level } from "../engine/types";

/** The side length of the square map. */
const SIZE = 9;

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
export const THE_FRENCH_RESTAURANT: Level = {
  id: "the-french-restaurant",
  name: "Das französische Restaurant",
  difficulty: "medium",
  series: { book: "online" },
  story:
    "Vincent wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#cfe5e1",
      label: { row: 4, col: 0 },
    },
    {
      key: "L",
      name: "Lager",
      at: "im Lager",
      ground: "floor",
      tint: "#dcc7e6",
      label: { row: 2, col: 7 },
    },
    {
      key: "S",
      name: "Speisesaal",
      at: "im Speisesaal",
      ground: "floor",
      tint: "#dbe7fb",
      label: { row: 8, col: 2 },
    },
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "floor",
      tint: "#c9d3e0",
      label: { row: 5, col: 7 },
    },
    {
      key: "E",
      name: "Eingang",
      at: "im Eingang",
      ground: "floor",
      tint: "#d4c8ef",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "KKKKKLLLL",
    "KKKKKKLLL",
    "KKKKKKLLL",
    "KKSSSSSTT",
    "KKSSSSSTT",
    "SSSSSSSTT",
    "SSSSSSSEE",
    "SSSSSSSEE",
    "SSSSSSSEE",
  ],
  groundMap: [
    "ffffffccf",
    "fffffffff",
    "fffffffff",
    "fffffffff",
    "fffffffcf",
    "fffffffcf",
    "ffcffffff",
    "ffcffffff",
    "ffccccccc",
  ],
  grounds: { f: "floor", c: "carpet" },
  thingMap: [
    "s..st...s",
    ".tt.....s",
    ".......s.",
    "..t..c..s",
    "ss.tctc.c",
    "s..c.c..c",
    "pc.tctc.p",
    "tt.t.cp.t",
    ".c.......",
  ],
  things: {
    s: "shelf",
    t: "table",
    c: "chair",
    p: "plant",
  },
  pieces: [
    { at: { row: 1, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 0 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Antoine",
      pronoun: "er",
      clue: {
        text: "Er war der einzige Mann im Speisesaal.",
        ...all(
          inArea("S"),
          counting((c) =>
            c
              .peopleIn("S")
              .every((one) => one === c.self || !c.has(one, "man")),
          ),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Béatrice",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Teppich.", ...onGround("carpet") },
      colour: "#15803d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "C",
      name: "Charlotte",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Tisch.", ...beside("table") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Denis",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Regal. Er war nicht in der Küche.",
        ...all(beside("shelf"), not(inArea("K"))),
      },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Etienne",
      pronoun: "er",
      clue: { text: "Er war im Eingang.", ...inArea("E") },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Fabrice",
      pronoun: "er",
      clue: {
        text: "Er war in der Küche, neben einem Tisch.",
        ...all(inArea("K"), beside("table")),
      },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gilbert",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Henriette",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(
          on("seat"),
          counting((c) =>
            c.people().every((one) => {
              const there = c.cellOf(one);
              return (
                one === c.self || there === undefined || !c.is(there, "seat")
              );
            }),
          ),
        ),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "V",
      name: "Vincent",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  hints: [
    {
      text: "Laut dem Hinweis von A kann G nicht neben einer Pflanze im Speisesaal sein. Damit bleibt für G nur R7 C8, neben der Pflanze im Eingang. Damit bleibt für E nur R9 C9, das letzte Feld im Eingang.",
      place: { G: { row: 6, col: 7 }, E: { row: 8, col: 8 } },
    },
    {
      text: "D kann weder in der Küche noch im Speisesaal sein (laut dem Hinweis von A), also muss D in R3 C7 sein, auf dem letzten Feld neben einem Regal.",
      place: { D: { row: 2, col: 6 } },
    },
    {
      text: "Damit bleibt für B nur R8 C3, das letzte Teppichfeld.",
      place: { B: { row: 7, col: 2 } },
    },
    {
      text: "In R5 ist genau ein Feld frei: R5 C5. Wir müssen 9 Personen auf einem 9x9-Gitter platzieren, also darf keine Reihe leer bleiben: Jemand muss dort sein. H, die einzige Person auf einem Stuhl, muss also auf dem Stuhl in R5 C5 sein. Blockiere alle anderen Stühle.",
      place: { H: { row: 4, col: 4 } },
      cross: [
        { row: 3, col: 5 },
        { row: 4, col: 6 },
        { row: 4, col: 8 },
        { row: 5, col: 3 },
        { row: 5, col: 5 },
        { row: 5, col: 8 },
        { row: 6, col: 1 },
        { row: 6, col: 4 },
        { row: 6, col: 6 },
        { row: 7, col: 5 },
        { row: 8, col: 1 },
      ],
    },
    {
      text: "In R6 ist nur ein Feld frei: R6 C2, blockiere den Rest von C2. Damit kommt F in R2, in R2 C1 oder R2 C4; blockiere den Rest von R2.",
      cross: [...columnExcept(1, [5]), ...rowExcept(1, [0, 3])],
    },
    {
      text: "Damit bleibt für C nur das letzte Feld neben einem Tisch, R4 C4, dann für A das letzte Feld im Speisesaal, R6 C2, und dann für F R2 C1.",
      place: {
        C: { row: 3, col: 3 },
        A: { row: 5, col: 1 },
        F: { row: 1, col: 0 },
      },
    },
    {
      text: "Damit bleibt für V nur das letzte Feld, R1 C6. V war allein mit D: Denis ist der Mörder!",
      place: { V: { row: 0, col: 5 } },
    },
  ],
  solution: {
    A: { row: 5, col: 1 },
    B: { row: 7, col: 2 },
    C: { row: 3, col: 3 },
    D: { row: 2, col: 6 },
    E: { row: 8, col: 8 },
    F: { row: 1, col: 0 },
    G: { row: 6, col: 7 },
    H: { row: 4, col: 4 },
    V: { row: 0, col: 5 },
  },
};
