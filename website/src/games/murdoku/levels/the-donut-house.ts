/**
 * The Donut House: a ring of rooms round an inner courtyard - kitchen, living
 * room, hall, guest room, master bedroom and bathroom - and a murdered guest.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Das Donut-Haus.png`, no solution sheet;
 * the solver proves the case has exactly one solution). Vallie is the
 * victim; whoever was alone with her killed her. The middle of the map is
 * not part of the house. Beds, chairs and rugs can be stood on; tables,
 * shelves, TVs and plants cannot.
 */
import {
  all,
  alone,
  beside,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */

/** How many rows north of Hudson the seated man was. */
const ROWS_NORTH = 2;

/** The side length of the square map. */
const SIZE = 9;

/** One string per row, one area key per field; the courtyard is off the map. */
const AREA_MAP: readonly string[] = [
  ".KKKKGGG.",
  "WWKKKGGGG",
  "WWFFFFFGG",
  "WWF...FGG",
  "WWF...FHH",
  "WWF...FHH",
  "BBFFFFFHH",
  "BBBBHHHHH",
  ".BBBHHHH.",
];

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

/**
 * The fields of an area, except some.
 *
 * @param key - the area's key
 * @param keep - the fields left out
 * @returns the fields
 */
function areaExcept(key: string, keep: readonly Cell[]): readonly Cell[] {
  return AREA_MAP.flatMap((line, row) =>
    [...line].flatMap((here, col) =>
      here === key && !keep.some((cell) => cell.row === row && cell.col === col)
        ? [{ row, col }]
        : [],
    ),
  );
}

/**
 * The fields of a row, counted from nought, that belong to the map.
 *
 * @param c - the context
 * @param row - the row
 * @returns the fields of the map in that row
 */
function rowCells(c: Context, row: number): readonly Cell[] {
  return Array.from({ length: c.cols }, (_, col) => ({ row, col })).filter(
    (cell) => c.inside(cell),
  );
}

/** Whether there is a seat two rows north of the suspect at all. */
function seatTwoRowsNorth(c: Context): boolean {
  return rowCells(c, c.cell.row - ROWS_NORTH).some((cell) =>
    c.is(cell, "seat"),
  );
}

/** Whether a man sat on a seat exactly two rows north of the suspect. */
function manSeatedTwoRowsNorth(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      there !== undefined &&
      there.row === c.cell.row - ROWS_NORTH &&
      c.is(there, "seat") &&
      c.has(id, "man")
    );
  });
}

/** The case. */
export const THE_DONUT_HOUSE: Level = {
  id: "the-donut-house",
  name: "Das Donut-Haus",
  difficulty: "hard",
  series: { book: "online" },
  story:
    "Vallie wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#d9a6dc",
      label: { row: 1, col: 3 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#f3cde3",
      label: { row: 5, col: 0 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#eeb3e2",
      label: { row: 3, col: 7 },
    },
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "floor",
      tint: "#e6cfcf",
      label: { row: 6, col: 4 },
    },
    {
      key: "H",
      name: "Hauptschlafzimmer",
      at: "im Hauptschlafzimmer",
      ground: "floor",
      tint: "#efb6e4",
      label: { row: 8, col: 5 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#cf98cc",
      label: { row: 8, col: 1 },
    },
  ],
  areaMap: AREA_MAP,
  thingMap: [
    "..tts..s.",
    ".....c...",
    "v.uu...bb",
    ".cu....t.",
    "......u..",
    "cc....u.v",
    ".....pu.s",
    "p...sbbc.",
    ".sc.tt.p.",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    s: "shelf",
    t: "table",
    u: "rug",
    v: "tv",
  },
  suspects: [
    {
      id: "A",
      name: "Allison",
      pronoun: "sie",
      clue: {
        text: "Sie war auf einem Bett. Sie war allein.",
        ...all(on("bed"), alone()),
      },
      colour: "#b91c1c",
      face: "\u{1F475}",
    },
    {
      id: "B",
      name: "Bonnie",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Teppich.", ...on("rug") },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Claudio",
      pronoun: "er",
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Duncan",
      pronoun: "er",
      clue: { text: "Er war in der Küche.", ...inArea("K") },
      colour: "#6366f1",
      face: "\u{1F474}",
    },
    {
      id: "E",
      name: "Evan",
      pronoun: "er",
      clue: { text: "Er war allein.", ...alone() },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Fabrice",
      pronoun: "er",
      traits: ["glasses"],
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gracie",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#ea580c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "H",
      name: "Hudson",
      pronoun: "er",
      clue: {
        text: "Genau zwei Reihen nördlich von ihm saß ein Mann auf einem Stuhl.",
        ...all(own(seatTwoRowsNorth), counting(manSeatedTwoRowsNorth)),
      },
      colour: "#4338ca",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "V",
      name: "Vallie",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F469}",
    },
  ],
  rules: [
    {
      text: "Es gab genau einen leeren Bereich.",
      check: (c) =>
        c.level.areas.filter((area) => c.peopleIn(area.key).length === 0)
          .length === 1,
    },
  ],
  hints: [
    {
      text: "Wer kann der Mann sein, der zwei Reihen nördlich von H auf einem Stuhl sitzt? Die einzigen Stühle, die zwei Reihen nördlich von H liegen können, befinden sich im Wohnzimmer oder im Gästezimmer, in einer Ecke. Das schließt C, D und F aus. E ist damit der einzige Mann, der zwei Reihen nördlich von H auf einem Stuhl sitzen kann. E ist allein, entweder im Wohnzimmer oder im Gästezimmer.",
    },
    {
      text: "A ist laut ihrem eigenen Hinweis allein im Gästezimmer oder im Hauptschlafzimmer. C ist im Hauptschlafzimmer oder im Wohnzimmer, aber nicht mit A oder E. Anders gesagt: Wohnzimmer, Hauptschlafzimmer und Gästezimmer müssen alle von A, E und C belegt sein, in beliebiger Reihenfolge. Die Küche ist von D belegt und der Flur von B, dem einzigen Bereich mit Teppich. Damit bleibt nur das Badezimmer als einziger möglicher leerer Bereich übrig: Blockiere jedes Feld im Badezimmer.",
      cross: areaExcept("B", []),
    },
    {
      text: "In R9 gibt es genau ein freies Feld. Dies ist ein 9x9-Raster mit genau 9 Figuren, also genau eine Person pro Reihe. Jemand muss demnach in R9 C7 sein. Blockiere den Rest von C7.",
      cross: columnExcept(6, [8]),
    },
    {
      text: "A ist allein in einem Schlafzimmer und muss nun auf dem Bett in R3 sein. Blockiere den Rest von R3 und den Rest des Gästezimmers.",
      cross: [
        ...rowExcept(2, [7, 8]),
        ...areaExcept("G", [
          { row: 2, col: 7 },
          { row: 2, col: 8 },
        ]),
      ],
    },
    {
      text: "Damit bleibt nur noch ein Feld in R1 übrig: R1 C2. Blockiere den Rest von C2.",
      cross: columnExcept(1, [0]),
    },
    {
      text: "Damit ist E auf dem letzten Stuhl isoliert; blockiere den Rest des Wohnzimmers. Dadurch befindet sich H zwei Reihen südlich von ihm in R8.",
      place: { E: { row: 5, col: 0 } },
      cross: areaExcept("W", [{ row: 5, col: 0 }]),
    },
    {
      text: "Damit ist C auf dem letzten Feld neben einem Fernseher isoliert, dann A, dann H. Damit ist B auf dem letzten Teppichfeld isoliert und G auf dem letzten Feld neben einem Regal.",
      place: {
        C: { row: 4, col: 8 },
        A: { row: 2, col: 7 },
        H: { row: 7, col: 5 },
        B: { row: 3, col: 2 },
        G: { row: 1, col: 4 },
      },
    },
    {
      text: "Damit ist D auf dem letzten Feld in der Küche in R1 C2 isoliert und F auf dem letzten Feld neben einer Pflanze in R9 C7. Damit ist V auf dem letzten Feld in R7 C4 isoliert, allein mit B. Bonnie ist die Mörderin!",
      place: {
        D: { row: 0, col: 1 },
        F: { row: 8, col: 6 },
        V: { row: 6, col: 3 },
      },
    },
  ],
  solution: {
    A: { row: 2, col: 7 },
    B: { row: 3, col: 2 },
    C: { row: 4, col: 8 },
    D: { row: 0, col: 1 },
    E: { row: 5, col: 0 },
    F: { row: 8, col: 6 },
    G: { row: 1, col: 4 },
    H: { row: 7, col: 5 },
    V: { row: 6, col: 3 },
  },
};
