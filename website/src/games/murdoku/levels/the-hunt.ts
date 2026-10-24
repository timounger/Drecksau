/**
 * Die Jagd: the north bank with a mammoth, a place for an ambush, the river
 * and the south bank, and a murdered hunter.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/49.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution). The
 * cards show no estates and no area has a crown.
 * Vek is the victim; whoever was alone with him killed him.
 *
 * The marked fields - a wolf for a wolf tamer, spears for a hunter - can be
 * stood on. The legend says there was one wolf tamer and three hunters, so
 * exactly one person stood on the wolf fields and exactly three on the spear
 * fields. The mammoth fills four fields; it, the rocks, the bushes and the
 * boars cannot be stood on.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  alone,
  all,
  beside,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** How many people stood on the fields of each mark. */
const ROLES: readonly (readonly [string, number])[] = [
  ["wolf", 1],
  ["spear", 3],
];

/** How many people stand on a field of this thing. */
function standingOn(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  }).length;
}

/** Whether the mammoth stands in one's row, in another area. */
function mammothInRowElsewhere(c: Context): boolean {
  const here = c.areaOf(c.cell);
  return Array.from({ length: c.cols }, (_, col) => ({
    row: c.cell.row,
    col,
  })).some((cell) => c.is(cell, "mammoth") && c.areaOf(cell) !== here);
}

/** The case. */
export const THE_HUNT: Level = {
  id: "the-hunt",
  name: "Die Jagd",
  series: { book: "timeTravel", number: 49 },
  story: "Unmöglich, dass jemand diesen Kerl mit einem Mammut verwechselt hat.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "N",
      name: "Nordufer",
      at: "am Nordufer",
      ground: "grass",
      tint: "#a9cfd0",
      label: { row: 3, col: 0 },
    },
    {
      key: "H",
      name: "Hinterhalt",
      at: "im Hinterhalt",
      ground: "grass",
      tint: "#9cc3c8",
      label: { row: 2, col: 5 },
    },
    {
      key: "F",
      name: "Fluss",
      at: "im Fluss",
      ground: "water",
      tint: "#a9c8ee",
      label: { row: 5, col: 1 },
    },
    {
      key: "S",
      name: "Südufer",
      at: "am Südufer",
      ground: "grass",
      tint: "#a9cfd0",
      label: { row: 6, col: 1 },
    },
  ],
  areaMap: [
    "NNNNHHH",
    "NNNNNHH",
    "NNNNNHH",
    "NNNNNFF",
    "FFNNFFS",
    "SFFFFSS",
    "SSSSSSS",
  ],
  thingMap: [
    "ws..rss",
    "..mm.rs",
    "usmm.us",
    ".u.w...",
    "...s...",
    "..s.w..",
    "b..s.b.",
  ],
  things: {
    b: "boar",
    m: "mammoth",
    r: "boulder",
    s: "spear",
    u: "shrub",
    w: "wolf",
  },
  pieces: [{ at: { row: 1, col: 2 }, rows: 2, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Alok",
      pronoun: "er",
      clue: {
        text: "Das Mammut war in seiner Zeile, aber in einem anderen Bereich.",
        ...own(mammothInRowElsewhere),
      },
      colour: "#57534e",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Boko",
      pronoun: "er",
      clue: {
        text: "Der Wolfszähmer: Er stand auf einem Feld mit einem Wolf.",
        ...on("wolf"),
      },
      colour: "#64748b",
      face: "\u{1F474}",
    },
    {
      id: "C",
      name: "Caya",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einem Wildschwein.",
        ...not(beside("boar")),
      },
      colour: "#a16207",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dak",
      pronoun: "sie",
      clue: {
        text: "Sie war allein im Fluss.",
        ...all(inArea("F"), alone()),
      },
      colour: "#1d4ed8",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Erka",
      pronoun: "sie",
      clue: { text: "Sie war im Hinterhalt.", ...inArea("H") },
      colour: "#ca8a04",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "F",
      name: "Freg",
      pronoun: "sie",
      clue: {
        text: "Eine Jägerin: Sie stand auf einem Feld mit Speeren.",
        ...on("spear"),
      },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B2}",
    },
    {
      id: "V",
      name: "Vek",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#9f1239",
      face: "\u{1F468}‍\u{1F9B0}",
    },
  ],
  rules: [
    {
      text: "Es gab genau einen Wolfszähmer und drei Jäger: Auf den Wolfsfeldern stand genau eine Person, auf den Speerfeldern genau drei.",
      // Search only: no mark may hold more people than the legend says.
      prune: (c) =>
        ROLES.every(([what, count]) => standingOn(c, what) <= count),
      check: (c) =>
        ROLES.every(([what, count]) => standingOn(c, what) === count),
    },
  ],
  hints: [
    {
      text: "Das Mammut steht in Zeile 2 und 3 am Nordufer. Alok ist in einer dieser Zeilen, aber nicht am Nordufer: R2C7 oder R3C7 im Hinterhalt, also in Spalte 7. Erka ist auch im Hinterhalt, aber nicht in Aloks Spalte - sie steht in R1C6.",
      place: { E: { row: 0, col: 5 } },
    },
    {
      text: "Boko steht auf einem Wolf: R1C1 ist Erkas Zeile, und R6C5 liegt im Fluss, wo Dak allein war. Er steht in R4C4.",
      place: { B: { row: 3, col: 3 } },
    },
    {
      text: "Erka (R1C6) und Alok (R2C7 oder R3C7) stehen beide auf Speeren - Freg ist also die dritte und letzte Jägerin. Ihr bleiben R3C2 und R6C3; R6C3 liegt im Fluss bei Dak. Freg steht in R3C2, Alok damit in R2C7.",
      place: { F: { row: 2, col: 1 }, A: { row: 1, col: 6 } },
    },
    {
      text: "Frei sind noch Zeile 5 bis 7 und Spalte 1, 3 und 5, und Speer- und Wolfsfelder sind vergeben. In Zeile 6 bleibt damit nur R6C1, und dort kann Caya nicht stehen, denn das Wildschwein in R7C1 ist neben ihr. Dak ist im Fluss, also steht Vek in R6C1.",
      place: { V: { row: 5, col: 0 } },
    },
    {
      text: "Dak bleibt im Fluss nur R5C5, Caya damit R7C3 am Südufer - allein mit Vek. Caya ist die Mörderin!",
      place: { D: { row: 4, col: 4 }, C: { row: 6, col: 2 } },
    },
  ],
  solution: {
    A: { row: 1, col: 6 },
    B: { row: 3, col: 3 },
    C: { row: 6, col: 2 },
    D: { row: 4, col: 4 },
    E: { row: 0, col: 5 },
    F: { row: 2, col: 1 },
    V: { row: 5, col: 0 },
  },
};
