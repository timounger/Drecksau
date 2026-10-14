/**
 * Dim Sum: a kitchen, two toilets, a hall, a lobby and the dining room of a
 * dumpling restaurant, with a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/40. Dim Sum.png`,
 * solution sheet `Lösungen 1-80/Lösung 37-40.JPG`).
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
      text: "Elias muss am Fenster in S9 sein, aber laut Chengleis Hinweis nicht auf einem Stuhl. Das lokalisiert Elias.",
      place: { E: { row: 5, col: 8 } },
    },
    {
      text: "Dean kann nur allein im Flur sein (da Alice, Feng und Gao in den anderen Räumen mit Pflanzen sind).",
    },
    {
      text: "Gao ist in der Damentoilette in S8. Das lokalisiert Dean.",
      place: { D: { row: 4, col: 5 } },
    },
    {
      text: "Das lokalisiert Feng, der nicht auf einem Stuhl ist, dann Gao.",
      place: { F: { row: 0, col: 6 }, G: { row: 1, col: 7 } },
    },
    {
      text: "Huifang ist nicht in der Lobby (wo Alice allein ist), also kann sie nur in der Ecke des Speiseraums sein, in Z7 S1.",
      place: { H: { row: 6, col: 0 } },
    },
    {
      text: "Das lokalisiert Bowei im letzten verfügbaren Teppichfeld.",
      place: { B: { row: 3, col: 3 } },
    },
    {
      text: "Das lokalisiert Chenglei auf dem letzten Stuhl, was Alice in der Lobby lokalisiert, dann das Opfer. Bowei ist der Mörder!",
      place: {
        C: { row: 8, col: 4 },
        A: { row: 7, col: 2 },
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
