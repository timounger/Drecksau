/**
 * Großraumbüro: four offices, a break room and the corridor between them,
 * with a murdered colleague.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/48. Großraumbüro.png`, no
 * solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Odelia is the victim; whoever was alone with her killed her.
 *
 * The armchairs are the chairs; they and the rugs can be stood on. Tables,
 * TVs and plants cannot - a plant or table drawn on a rug covers that field.
 * The windows are the bars in the outer walls; standing in front of one means
 * being on the field right beside it. A field is in a corner of its room when
 * the room's border runs along two of its sides that meet.
 *
 * Unfinished: as transcribed, the case has 60 solutions. The bottom of the
 * photographed page, where a magnifier rule would stand, is cut off. The
 * solution is the one pencilled in on the page; there are no hints yet.
 */
import {
  alone,
  all,
  cellsWhere,
  counting,
  inArea,
  not,
  own,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** The fields right in front of a window. */
const WINDOWS: readonly Cell[] = [
  { row: 0, col: 0 },
  { row: 2, col: 0 },
  { row: 0, col: 6 },
  { row: 0, col: 7 },
];

/** How many people stood on a rug in all. */
const ON_RUGS = 4;

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

/** Whether no field of the suspect's room lies further down than the suspect. */
function inBottomRow(c: Context): boolean {
  return c
    .cellsOf(c.areaOf(c.cell) ?? "")
    .every((cell) => cell.row <= c.cell.row);
}

/** Whether the suspect's row holds a TV in the suspect's own room. */
function tvInRow(c: Context): boolean {
  const area = c.areaOf(c.cell);
  return c
    .cellsOf(area ?? "")
    .some((cell) => cell.row === c.cell.row && c.is(cell, "tv"));
}

/** How many people stand on a rug. */
function onRugs(c: Context): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "rug");
  }).length;
}

/** The case. */
export const OPEN_PLAN_OFFICE: Level = {
  id: "open-plan-office",
  name: "Großraumbüro",
  series: { book: "original", number: 48 },
  story:
    "Können die ihre Streitigkeiten nicht mit passiv-aggressiven E-Mails klären wie normale Kollegen?",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Büro A",
      at: "in Büro A",
      ground: "floor",
      tint: "#c8dcef",
      label: { row: 1, col: 1 },
    },
    {
      key: "B",
      name: "Büro B",
      at: "in Büro B",
      ground: "floor",
      tint: "#c4d8ec",
      label: { row: 3, col: 1 },
    },
    {
      key: "C",
      name: "Büro C",
      at: "in Büro C",
      ground: "floor",
      tint: "#c8dcef",
      label: { row: 3, col: 7 },
    },
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "stone",
      tint: "#dde9f2",
      label: { row: 4, col: 6 },
    },
    {
      key: "P",
      name: "Pausenraum",
      at: "im Pausenraum",
      ground: "floor",
      tint: "#c4d8ec",
      label: { row: 8, col: 0 },
    },
    {
      key: "D",
      name: "Büro D",
      at: "in Büro D",
      ground: "floor",
      tint: "#c8dcef",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "AAAAFCCCC",
    "AAAAFCCCC",
    "BBBBFCCCC",
    "BBBBFCCCC",
    "FFFFFFFFF",
    "PPPPFDDDD",
    "PPPPFDDDD",
    "PPPPFDDDD",
    "PPPPFDDDD",
  ],
  thingMap: [
    ".rr..c...",
    ".rrt.trpf",
    ".rrt.trr.",
    ".rrc.t..p",
    ".........",
    ".rr...c.p",
    "frp...rrf",
    "crr...rrp",
    ".rt..tt..",
  ],
  things: {
    c: "chair",
    f: "tv",
    p: "plant",
    r: "rug",
    t: "table",
  },
  suspects: [
    {
      id: "A",
      name: "Angelo",
      pronoun: "er",
      clue: {
        text: "Insgesamt waren vier Personen auf einem Teppich, aber er war keine davon.",
        ...all(
          not(own((c) => c.is(c.cell, "rug"))),
          counting((c) => onRugs(c) === ON_RUGS),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Belah",
      pronoun: "sie",
      clue: {
        text: "Sie war allein in Büro A oder Büro B.",
        ...all(inArea("A", "B"), alone()),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Calvin",
      pronoun: "er",
      clue: {
        text: "In seinem Raum war ein Fernseher, in derselben Zeile.",
        ...own(tvInRow),
      },
      colour: "#0e7490",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "D",
      name: "Dagmar",
      pronoun: "sie",
      clue: {
        text: "Sie war in der untersten Zeile ihres Raumes.",
        ...own(inBottomRow),
      },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Eli",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke des Raumes. Er war nicht im Flur.",
        ...all(
          own((c) => inCorner(c.areaOf, c.cell)),
          not(inArea("F")),
        ),
        glow: (level) =>
          cellsWhere(
            level,
            (cell) =>
              areaAt(level, cell)?.key !== "F" &&
              inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Fatima",
      pronoun: "sie",
      clue: {
        text: "Sie war vor einem Fenster.",
        ...own((c) => byWindow(c.cell)),
        glow: (level) => cellsWhere(level, (cell) => byWindow(cell)),
      },
      colour: "#9f1239",
      face: "\u{1F469}",
    },
    {
      id: "G",
      name: "Georg",
      pronoun: "er",
      clue: {
        text: "Er war in Büro C. Eine weitere Person war in seinem Raum.",
        ...all(
          inArea("C"),
          counting((c) => c.peopleIn("C").length === 2),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Harriet",
      pronoun: "sie",
      clue: { text: "Sie war allein.", ...alone() },
      colour: "#4338ca",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "O",
      name: "Odelia",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}",
    },
  ],
  hints: [],
  solution: {
    A: { row: 2, col: 8 },
    B: { row: 3, col: 3 },
    C: { row: 6, col: 7 },
    D: { row: 8, col: 1 },
    E: { row: 5, col: 5 },
    F: { row: 0, col: 0 },
    G: { row: 1, col: 6 },
    H: { row: 4, col: 4 },
    O: { row: 7, col: 2 },
  },
};
