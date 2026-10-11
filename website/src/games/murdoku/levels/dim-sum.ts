/**
 * Dim Sum: a kitchen, two toilets, a hall, a lobby and the dining room of a
 * dumpling restaurant, with a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/40. Dim Sum.png`, no
 * solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Ochi is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the rugs can be stood on. Tables
 * (the L-shaped counter among them), shelves and plants cannot. The windows
 * are the bars in the east wall of the dining room; standing in front of one
 * means being on the field right beside it. A field is in a corner of its
 * room when the room's border runs along two of its sides that meet: one
 * above or below it, one to its left or right.
 */
import {
  all,
  alone,
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

/** The fields right in front of a window. */
const WINDOWS: readonly Cell[] = [
  { row: 5, col: 8 },
  { row: 6, col: 8 },
  { row: 7, col: 8 },
  { row: 8, col: 8 },
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

/** Whether nobody but the suspect sits on a chair. */
function onlyOneOnAChair(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "chair");
  });
}

/** The case. */
export const DIM_SUM: Level = {
  id: "dim-sum",
  name: "Dim Sum",
  series: { book: "original", number: 40 },
  story: "Für diese Teigtaschen könnte man wirklich sterben.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#e4dfee",
      label: { row: 4, col: 0 },
    },
    {
      key: "M",
      name: "Toilette (M)",
      at: "in der Herrentoilette",
      ground: "floor",
      tint: "#b9b6ec",
      label: { row: 2, col: 5 },
    },
    {
      key: "W",
      name: "Toilette (W)",
      at: "in der Damentoilette",
      ground: "floor",
      tint: "#cbbde6",
      label: { row: 2, col: 7 },
    },
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "stone",
      tint: "#c9c9cf",
      label: { row: 4, col: 6 },
    },
    {
      key: "S",
      name: "Speiseraum",
      at: "im Speiseraum",
      ground: "floor",
      tint: "#ecbcb8",
      label: { row: 8, col: 5 },
    },
    {
      key: "L",
      name: "Lobby",
      at: "in der Lobby",
      ground: "floor",
      tint: "#f3d6d0",
      label: { row: 8, col: 0 },
    },
  ],
  areaMap: [
    "KKKKKMMWW",
    "KKKKKMMWW",
    "KKKKKMMWW",
    "KKKKKFFFF",
    "KKKKKFFFF",
    "SSSSSSSSS",
    "SSSSSSSSS",
    "LLLSSSSSS",
    "LLLSSSSSS",
  ],
  thingMap: [
    ".ss.s....",
    "rtt.t.c.c",
    "r.....pp.",
    "tt.rcpprr",
    "..srr.trr",
    ".........",
    "..pccrr.c",
    ".p.ttrrct",
    ".r.tc...c",
  ],
  things: {
    c: "chair",
    p: "plant",
    r: "rug",
    s: "shelf",
    t: "table",
  },
  shapes: [
    [
      { row: 3, col: 3 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
    ],
    [
      { row: 7, col: 3 },
      { row: 7, col: 4 },
      { row: 8, col: 3 },
    ],
  ],
  pieces: [
    { at: { row: 1, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 7 }, rows: 2, cols: 2 },
    { at: { row: 6, col: 5 }, rows: 2, cols: 2 },
  ],
  windows: [
    { at: { row: 5, col: 8 }, side: "right" },
    { at: { row: 6, col: 8 }, side: "right" },
    { at: { row: 7, col: 8 }, side: "right" },
    { at: { row: 8, col: 8 }, side: "right" },
  ],
  suspects: [
    {
      id: "A",
      name: "Alice",
      pronoun: "sie",
      clue: {
        text: "Sie war allein in der Lobby.",
        ...all(inArea("L"), alone()),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bowei",
      pronoun: "er",
      clue: { text: "Er war auf einem Teppich.", ...on("rug") },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Chenglei",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOnAChair)),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dean",
      pronoun: "er",
      clue: {
        text: "Er war allein im Raum, neben einer Pflanze.",
        ...all(beside("plant"), alone()),
      },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Elias",
      pronoun: "er",
      clue: {
        text: "Er war vor einem Fenster.",
        ...own((c) => byWindow(c.cell)),
        glow: () => WINDOWS,
      },
      colour: "#7c3aed",
      face: "\u{1F474}",
    },
    {
      id: "F",
      name: "Feng",
      pronoun: "er",
      clue: { text: "Er war in der Herrentoilette.", ...inArea("M") },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gao",
      pronoun: "sie",
      clue: { text: "Sie war in der Damentoilette.", ...inArea("W") },
      colour: "#ea580c",
      face: "\u{1F475}",
    },
    {
      id: "H",
      name: "Huifang",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke ihres Raumes.",
        ...own((c) => inCorner(c.areaOf, c.cell)),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Ochi",
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
      text: "Elias war vor einem Fenster: Die Fenster liegen in der Ostwand bei R6 bis R9. R8 C9 ist ein Tisch, und auf den Stühlen in R7 C9 und R9 C9 saß nur Chenglei. Elias stand in R6 C9. Blockiere den Rest von R6 und C9.",
      place: { E: { row: 5, col: 8 } },
      cross: [
        { row: 6, col: 8 },
        { row: 8, col: 8 },
      ],
    },
    {
      text: "Dean war allein im Raum: In den Toiletten waren Feng und Gao, in der Lobby Alice, im Speiseraum Elias - Dean war im Flur. Neben einer Pflanze liegen dort nur R5 C6 und R4 C8. Gao war in der Damentoilette, und C9 ist blockiert, also gehört ihr C8. Dean stand in R5 C6.",
      place: { D: { row: 4, col: 5 } },
      cross: [{ row: 3, col: 7 }],
    },
    {
      text: "Feng war in der Herrentoilette, und C6 ist blockiert: Er war in C7. R2 C7 ist ein Stuhl, R3 C7 eine Pflanze - Feng stand in R1 C7. R1 gehört damit Feng, und R3 C8 ist eine Pflanze - Gao stand in R2 C8.",
      place: { F: { row: 0, col: 6 }, G: { row: 1, col: 7 } },
      cross: [
        { row: 1, col: 6 },
        { row: 0, col: 7 },
      ],
    },
    {
      text: "Frei sind noch R3, R4, R7, R8 und R9 in C1 bis C5. R3 und R4 liegen dort in der Küche, R7 im Speiseraum. Alice nimmt R8 oder R9 in der Lobby, die anderen beiden der Reihen R7 bis R9 liegen im Speiseraum - mit Elias wären dort drei. Ochi war also in der Küche. Bowei war auf einem Teppich: Frei sind nur noch R3 C1 und R4 C4, beide in der Küche. In der Küche waren also Bowei und Ochi, Huifang und Chenglei im Speiseraum.",
    },
    {
      text: "Huifang war in einer Ecke ihres Raumes: Im freien Teil des Speiseraums ist das nur R7 C1. Chenglei saß auf einem Stuhl: R7 C4 und R7 C5 liegen in Huifangs Reihe, es bleibt R9 C5.",
      place: { H: { row: 6, col: 0 }, C: { row: 8, col: 4 } },
      cross: [
        { row: 6, col: 3 },
        { row: 6, col: 4 },
      ],
    },
    {
      text: "Alice war allein in der Lobby, in R8: R8 C2 ist eine Pflanze, also R8 C3. Bowei bleibt in der blockierten C1 nichts - er stand in R4 C4. Ochi bleibt R3 C2. In der Küche war er allein mit Bowei - Bowei ist der Mörder!",
      place: {
        A: { row: 7, col: 2 },
        B: { row: 3, col: 3 },
        O: { row: 2, col: 1 },
      },
    },
  ],
  solution: {
    A: { row: 7, col: 2 },
    B: { row: 3, col: 3 },
    C: { row: 8, col: 4 },
    D: { row: 4, col: 5 },
    E: { row: 5, col: 8 },
    F: { row: 0, col: 6 },
    G: { row: 1, col: 7 },
    H: { row: 6, col: 0 },
    O: { row: 2, col: 1 },
  },
};
