/**
 * Die Gasse der Handwerker: statue maker, jeweller, smithy, weaver,
 * upholsterer and potter round a cobbled alley, with a murdered knight.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/9.png`, no solution
 * sheet - the culprit is pencilled in on the photographed page, and the
 * solver proves it is the only solution). Vassili is the victim; whoever was
 * alone with him killed him.
 *
 * The map is nine by nine. Rugs can be stood on; statues, tables, weapon racks,
 * the crate, pots and looms cannot - the book's legend says a loom cannot be
 * occupied. A field is in a corner of its area when the area's border runs
 * along two of its sides that meet ({@link inCorner}); it is on the edge of
 * the grid when it lies in the outer rows or columns.
 *
 * The book's estates: nobles (purple cards: Allan, Berengar, Carissa,
 * Denise) only in the crowned statue maker's, jeweller's, weaver's and
 * upholsterer's, each in a different one; villagers (wooden cards:
 * Elizabeth, Falco, George, Harry) only in the other areas; the knight
 * (grey shield: Vassili) anywhere.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  cellsWhere,
  column,
  inArea,
  not,
  own,
  ranks,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** The nobles, each in an area of their own. */
const NOBLES: readonly string[] = ["A", "B", "C", "D"];

/** The women, for Harry's clue. */
const WOMEN: readonly string[] = ["C", "D", "E"];

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

/** The clue's parts for standing in a corner of one's area. */
function cornered(): ReturnType<typeof own> {
  return {
    ...own((c) => inCorner(c.areaOf, c.cell)),
    glow: (level) =>
      cellsWhere(level, (cell) =>
        inCorner((one) => areaAt(level, one)?.key ?? null, cell),
      ),
  };
}

/** Whether a field lies in the outer rows or columns of the map. */
function onEdge(c: Context): boolean {
  return (
    c.cell.row === 0 ||
    c.cell.col === 0 ||
    c.cell.row === c.rows - 1 ||
    c.cell.col === c.cols - 1
  );
}

/** Whether a woman stood on a rug one row north of the suspect. */
function womanOnARugAbove(c: Context): boolean {
  return WOMEN.some((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined && there.row === c.cell.row - 1 && c.is(there, "rug")
    );
  });
}

/** The case. */
export const THE_CRAFTSMENS_ALLEY: Level = {
  id: "the-craftsmens-alley",
  name: "Die Gasse der Handwerker",
  series: { book: "timeTravel", number: 9 },
  story: "Hier wimmelt es nur so von Verdächtigen mit allerlei Kniffen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "S",
      name: "Statuen",
      at: "bei den Statuen",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 1, col: 1 },
    },
    {
      key: "J",
      name: "Juwelier",
      at: "beim Juwelier",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 2, col: 6 },
    },
    {
      key: "H",
      name: "Schmiede",
      at: "in der Schmiede",
      ground: "floor",
      tint: "#efe6c0",
      label: { row: 4, col: 1 },
    },
    {
      key: "G",
      name: "Gasse",
      at: "in der Gasse",
      ground: "stone",
      tint: "#b8c2d0",
      label: { row: 8, col: 3 },
    },
    {
      key: "W",
      name: "Weberei",
      at: "in der Weberei",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 5, col: 7 },
    },
    {
      key: "T",
      name: "Polsterei",
      at: "in der Polsterei",
      ground: "floor",
      tint: "#d3c3ea",
      label: { row: 7, col: 3 },
    },
    {
      key: "A",
      name: "Töpferei",
      at: "in der Töpferei",
      ground: "floor",
      tint: "#efe6c0",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "SSSSGJJJJ",
    "SSSSGJJJJ",
    "HHHGGJJJJ",
    "HHHHGGGGG",
    "HHHGGGWWW",
    "TTTGGGWWW",
    "TTTTTGAAA",
    "TTGTTGAAA",
    "TTGGGGAAA",
  ],
  thingMap: [
    "s.s...dd.",
    ".....rrrr",
    "..f......",
    ".f.......",
    ".....x.dd",
    "......l.d",
    "drdrd...p",
    "r...r..p.",
    "lr.......",
  ],
  things: {
    d: "table",
    f: "weaponRack",
    l: "loom",
    p: "pot",
    r: "rug",
    s: "statue",
    x: "woodCrate",
  },
  extraThings: {
    loom: { name: "Webstuhl", emoji: "\u{1F9F6}", standable: false },
  },
  pieces: [
    { at: { row: 0, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 5 }, rows: 1, cols: 4 },
  ],
  shapes: [
    [
      { row: 4, col: 7 },
      { row: 4, col: 8 },
      { row: 5, col: 8 },
    ],
  ],
  suspects: [
    {
      id: "A",
      traits: ["noble"],
      name: "Allan",
      pronoun: "er",
      clue: { text: "Er war in der vierten Spalte.", ...column(4) },
      colour: "#7c3aed",
      face: "\u{1F934}",
    },
    {
      id: "B",
      traits: ["noble"],
      name: "Berengar",
      pronoun: "er",
      clue: { text: "Er war am Rand der Karte.", ...own(onEdge) },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      traits: ["noble"],
      name: "Carissa",
      pronoun: "sie",
      clue: { text: "Sie war in einer Ecke ihres Bereichs.", ...cornered() },
      colour: "#be185d",
      face: "\u{1F478}",
    },
    {
      id: "D",
      traits: ["noble"],
      name: "Denise",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einem Tisch.",
        ...not(beside("table")),
      },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      traits: ["villager"],
      name: "Elizabeth",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke ihres Bereichs. Sie war nicht in der Gasse.",
        ...all(cornered(), not(inArea("G"))),
      },
      colour: "#a16207",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "F",
      traits: ["villager"],
      name: "Falco",
      pronoun: "er",
      clue: { text: "Er war am Rand der Karte.", ...own(onEdge) },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "G",
      traits: ["villager"],
      name: "George",
      pronoun: "er",
      clue: { text: "Er war nicht in der Gasse.", ...not(inArea("G")) },
      colour: "#ea580c",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "H",
      traits: ["villager"],
      name: "Harry",
      pronoun: "er",
      clue: {
        text: "Eine Zeile nördlich von ihm war eine Frau auf einem Teppich.",
        ...about(WOMEN, womanOnARugAbove),
      },
      colour: "#57534e",
      face: "\u{1F474}",
    },
    {
      id: "V",
      traits: ["knight"],
      name: "Vassili",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#334155",
      face: "\u{1F468}‍\u{1F9B1}",
    },
  ],
  rules: [
    ranks(
      "Adlige (\u{1F451}) waren nur bei den Statuen, beim Juwelier, in der Weberei oder in der Polsterei, Dorfbewohner nur in den anderen Bereichen, Ritter überall.",
      ["S", "J", "W", "T"],
    ),
    {
      text: "Jeder Adlige war in einem anderen Bereich.",
      check: (c) =>
        new Set(
          NOBLES.map((id) => {
            const there = c.cellOf(id);
            return there === undefined ? id : c.areaOf(there);
          }),
        ).size === NOBLES.length,
    },
  ],
  hints: [
    {
      text: "Vier Adlige, vier gekrönte Bereiche, jeder Adlige in einem anderen: In jedem gekrönten Bereich steht genau ein Adliger. In der Weberei sind nur R5 C7 und R6 C8 frei. Allan (C4) und Berengar (Rand) passen nicht, Denise stünde neben einem Tisch, und R6 C8 ist keine Ecke. Carissa steht in R5 C7.",
      place: { C: { row: 4, col: 6 } },
    },
    {
      text: "Harry hat eine Zeile über sich eine Frau auf einem Teppich. Carissa steht auf keinem, und alle Teppiche liegen in gekrönten Bereichen, wo Elizabeth nicht hin darf - es ist Denise. Nicht neben einem Tisch bleiben ihr R2 C6, R2 C9 und R9 C2; unter R9 gibt es keine Zeile. Denise steht in R2 beim Juwelier, Harry in R3.",
    },
    {
      text: "Elizabeth steht in einer Ecke der Schmiede oder der Töpferei: R3 C1 (Harrys Zeile), R4 C4 (Allans Spalte), R5 C1 und R5 C3 (Carissas Zeile), R7 C7 und R9 C7 (Carissas Spalte) oder R9 C9. Sie steht in R9 C9 - damit bleibt Denise R2 C6.",
      place: { E: { row: 8, col: 8 }, D: { row: 1, col: 5 } },
    },
    {
      text: "Wer kann in C3 und C8 stehen? Allan steht in C4, Harry in R3 (dort ein Waffenständer und der Juwelier), und Berengar und Falco finden dort kein freies Randfeld. Es bleiben George und Vassili. George darf nicht in die Gasse und nicht in gekrönte Bereiche: R4 C3 in der Schmiede oder R7 C8 in der Töpferei.",
    },
    {
      text: "C2 kann nur Berengar (R1 C2) oder Harry (R3 C2) füllen, C5 nur Falco (R1 C5) oder Harry (R3 C5). In R3 C1 müssten Berengar und Falco beide in R1 stehen. In R3 C2 stünde Falco in R1 C5 - und bei den Statuen hätte kein Adliger mehr Platz (R1 besetzt, R2 ist Denises Zeile). Harry steht in R3 C5.",
      place: { H: { row: 2, col: 4 } },
    },
    {
      text: "Falco steht am Rand, R1 C5 liegt in Harrys Spalte - es bleibt R4 C1. C2 füllt also Berengar in R1 C2, der Adlige bei den Statuen. Allan ist der Adlige in der Polsterei: R7 C4 oder R8 C4.",
      place: { F: { row: 3, col: 0 }, B: { row: 0, col: 1 } },
    },
    {
      text: "George: R4 ist Falcos Zeile, also R7 C8. Allan steht in R8 C4. Vassili bleibt C3 und R6 - R6 C3 in der Polsterei, allein mit Allan. Allan ist der Mörder!",
      place: {
        G: { row: 6, col: 7 },
        A: { row: 7, col: 3 },
        V: { row: 5, col: 2 },
      },
    },
  ],
  solution: {
    A: { row: 7, col: 3 },
    B: { row: 0, col: 1 },
    C: { row: 4, col: 6 },
    D: { row: 1, col: 5 },
    E: { row: 8, col: 8 },
    F: { row: 3, col: 0 },
    G: { row: 6, col: 7 },
    H: { row: 2, col: 4 },
    V: { row: 5, col: 2 },
  },
};
