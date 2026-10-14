/**
 * Die Bäckerei: a storeroom, a break room, a kitchen, the till counter and
 * the sales floor of a bakery, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/57. Die Bäckerei.JPG`,
 * solution on `Lösungen 1-80/Lösung 57-60.JPG`).
 * Ora is the victim; whoever was alone with her killed her.
 *
 * The armchairs are the chairs; they and the rugs can be stood on. The
 * tables (the bakery counters among them), the shelves, the crates in the
 * storeroom, the till and the plants cannot. A field is in a corner of its
 * room when the room's border runs along two of its sides that meet: one
 * above or below it, one to its left or right.
 */
import {
  about,
  all,
  beside,
  cellsWhere,
  counting,
  inArea,
  on,
  own,
  row,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** Whether a field lies in a corner of its area, given the area of each field. */
function inCorner(areaOf: (cell: Cell) => string | null, cell: Cell): boolean {
  const area = areaOf(cell);
  const outside = (r: number, col: number): boolean =>
    areaOf({ row: r, col }) !== area;
  const vertical =
    outside(cell.row - 1, cell.col) || outside(cell.row + 1, cell.col);
  const horizontal =
    outside(cell.row, cell.col - 1) || outside(cell.row, cell.col + 1);
  return vertical && horizontal;
}

/** Whether nobody but the suspect stood on a thing of this id. */
function onlyOneOn(what: string): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return id === c.self || there === undefined || !c.is(there, what);
    });
}

/** Whether the suspect's room held a shelf. */
function shelfInRoom(c: Context): boolean {
  return c.cellsOf(c.areaOf(c.cell) ?? "").some((cell) => c.is(cell, "shelf"));
}

/** Whether the suspect stood west of Gunnar. */
function westOfGunnar(c: Context): boolean {
  const gunnar = c.cellOf("G");
  return gunnar !== undefined && c.cell.col < gunnar.col;
}

/** How many people sat on chairs. */
const SEATED = 1;

/** Whether exactly one person sat on a chair. */
function oneOnAChair(c: Context): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, "chair");
    }).length === SEATED
  );
}

/** The case. */
export const THE_BAKERY: Level = {
  id: "the-bakery",
  name: "Die Bäckerei",
  series: { book: "original", number: 57 },
  story:
    "Fingerabdrücke zu finden wird ein Kinderspiel ... hier ist sowieso schon alles mit Mehl bedeckt.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "L",
      name: "Lager",
      at: "im Lager",
      ground: "floor",
      tint: "#f6dcb4",
      label: { row: 2, col: 1 },
    },
    {
      key: "P",
      name: "Pausenraum",
      at: "im Pausenraum",
      ground: "floor",
      tint: "#e8bfae",
      label: { row: 2, col: 3 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#f0d0cc",
      label: { row: 3, col: 8 },
      labelEnd: true,
    },
    {
      key: "T",
      name: "Kassentheke",
      at: "an der Kassentheke",
      ground: "floor",
      tint: "#f5ebc6",
      label: { row: 6, col: 0 },
    },
    {
      key: "V",
      name: "Verkaufsbereich",
      at: "im Verkaufsbereich",
      ground: "floor",
      tint: "#f3dfa0",
      label: { row: 8, col: 4 },
      labelOverhang: true,
    },
  ],
  areaMap: [
    "LLPPPPKKK",
    "LLPPPPKKK",
    "LLLPPPKKK",
    "TTTTTTKKK",
    "TTTTTVVVV",
    "TTTTTVVVV",
    "TTTVVVVVV",
    "VVVVVVVVV",
    "VVVVVVVVV",
  ],
  thingMap: [
    "..hcct.tt",
    "x....c..t",
    "x......th",
    "...rr....",
    "ttkrrt.th",
    "t....c...",
    ".......th",
    "chtt..tt.",
    "prrr.prrr",
  ],
  things: {
    c: "chair",
    h: "shelf",
    k: "cashRegister",
    p: "plant",
    r: "rug",
    t: "table",
    x: "crate",
  },
  extraThings: {
    cashRegister: { name: "Kasse", emoji: "\u{1F4B5}", standable: false },
  },
  pieces: [
    { at: { row: 3, col: 3 }, rows: 2, cols: 2 },
    { at: { row: 7, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 8, col: 1 }, rows: 1, cols: 3 },
    { at: { row: 8, col: 6 }, rows: 1, cols: 3 },
  ],
  shapes: [
    [
      { row: 0, col: 7 },
      { row: 0, col: 8 },
      { row: 1, col: 8 },
    ],
    [
      { row: 4, col: 0 },
      { row: 4, col: 1 },
      { row: 5, col: 0 },
    ],
    [
      { row: 6, col: 7 },
      { row: 7, col: 6 },
      { row: 7, col: 7 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Ava",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person auf einem Teppich.",
        ...all(on("rug"), counting(onlyOneOn("rug"))),
      },
      colour: "#b91c1c",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "B",
      name: "Brenda",
      pronoun: "sie",
      clue: { text: "In ihrem Raum war ein Regal.", ...own(shelfInRoom) },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Chiara",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke in der Küche.",
        ...all(
          inArea("K"),
          own((c) => inCorner(c.areaOf, c.cell)),
        ),
        glow: (level) =>
          cellsWhere(
            level,
            (cell) =>
              areaAt(level, cell)?.key === "K" &&
              inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dörte",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Pflanze.", ...beside("plant") },
      colour: "#6366f1",
      face: "\u{1F469}\u{1F3FF}",
    },
    {
      id: "E",
      name: "Emily",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Teppich.", ...beside("rug") },
      colour: "#7c3aed",
      face: "\u{1F475}",
    },
    {
      id: "F",
      name: "Finn",
      pronoun: "er",
      clue: { text: "Er war in der obersten Zeile.", ...row(1) },
      colour: "#7f1d1d",
      face: "\u{1F468}‍\u{1F373}",
    },
    {
      id: "G",
      name: "Gunnar",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Haley",
      pronoun: "sie",
      clue: {
        text: "Sie war im Pausenraum. Sie war westlich von Gunnar.",
        ...all(inArea("P"), about(["G"], westOfGunnar)),
      },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "O",
      name: "Ora",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#be123c",
      face: "\u{1F469}",
    },
  ],
  rules: [
    { text: "Genau eine Person saß auf einem Stuhl.", check: oneOnAChair },
  ],
  hints: [
    {
      text: "Gunnar ist östlich von Haley (die im Pausenraum ist), also kann er nur in S9 sein.",
    },
    {
      text: "Finn ist in Z1; das lokalisiert Chiara in der Südwestecke der Küche.",
      place: { C: { row: 3, col: 6 } },
    },
    {
      text: "Alle verbleibenden Felder in Z5 sind Teppich, also muss Ava in Z5 sein. Schließe alle anderen Teppichfelder aus.",
    },
    {
      text: "Jemand muss in Z9 S5 sein. Das lokalisiert Ava, was Emily lokalisiert.",
      place: { A: { row: 4, col: 3 }, E: { row: 8, col: 4 } },
    },
    {
      text: "Alle verbleibenden Stühle schneiden sich bei Z8 S6; schließe dieses Feld aus. Das lokalisiert Dörte im letzten Feld neben einer Pflanze, auf dem Stuhl in Z8. Schließe die anderen Stühle aus.",
      place: { D: { row: 7, col: 0 } },
      cross: [{ row: 7, col: 5 }],
    },
    {
      text: "Das lokalisiert Finn und Gunnar.",
      place: { F: { row: 0, col: 1 }, G: { row: 5, col: 8 } },
    },
    {
      text: "Jemand muss in Z2 S8 sein. Das lokalisiert Haley, dann Brenda, dann Ora. Ava ist die Mörderin!",
      place: {
        H: { row: 2, col: 5 },
        B: { row: 1, col: 7 },
        O: { row: 6, col: 2 },
      },
    },
  ],
  solution: {
    A: { row: 4, col: 3 },
    B: { row: 1, col: 7 },
    C: { row: 3, col: 6 },
    D: { row: 7, col: 0 },
    E: { row: 8, col: 4 },
    F: { row: 0, col: 1 },
    G: { row: 5, col: 8 },
    H: { row: 2, col: 5 },
    O: { row: 6, col: 2 },
  },
};
