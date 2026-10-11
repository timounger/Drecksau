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
 * The magnifier rule under the map is cut off in the photo; its printed
 * wording ("Genau eine Person saß auf einem Stuhl.") came from the book. Without
 * it the case has 60 solutions, with it exactly the pencilled one. The hints
 * are our own solution path.
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

/** How many people stand on a thing of this id or kind. */
function countOn(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
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
  pieces: [
    { at: { row: 0, col: 1 }, rows: 2, cols: 2 },
    { at: { row: 2, col: 1 }, rows: 2, cols: 2 },
    { at: { row: 1, col: 5 }, rows: 3, cols: 1 },
    { at: { row: 1, col: 6 }, rows: 2, cols: 2, thing: "rug" },
    { at: { row: 5, col: 1 }, rows: 4, cols: 2, thing: "rug" },
    { at: { row: 6, col: 6 }, rows: 2, cols: 2 },
    { at: { row: 8, col: 5 }, rows: 1, cols: 2 },
  ],
  windows: [
    { at: { row: 0, col: 0 }, side: "left" },
    { at: { row: 2, col: 0 }, side: "left" },
    { at: { row: 0, col: 6 }, side: "top" },
    { at: { row: 0, col: 7 }, side: "top" },
  ],
  suspects: [
    {
      id: "A",
      name: "Angelo",
      pronoun: "er",
      clue: {
        text: "Insgesamt waren vier Personen auf einem Teppich, aber er war keine davon.",
        ...all(
          not(own((c) => c.is(c.cell, "rug"))),
          counting((c) => countOn(c, "rug") === ON_RUGS),
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
  rules: [
    {
      text: "Genau eine Person saß auf einem Stuhl.",
      check: (c) => countOn(c, "chair") === 1,
    },
  ],
  hints: [
    {
      text: "Teppiche liegen nur in den Spalten 2, 3, 7 und 8. Insgesamt standen vier Personen auf einem Teppich - also stand in jeder dieser vier Spalten die Person auf einem Teppich, und Angelo war in keiner davon. Blockiere die Felder dieser Spalten ohne Teppich.",
      cross: [
        { row: 4, col: 1 },
        { row: 4, col: 2 },
        { row: 0, col: 6 },
        { row: 3, col: 6 },
        { row: 4, col: 6 },
        { row: 5, col: 6 },
        { row: 0, col: 7 },
        { row: 3, col: 7 },
        { row: 4, col: 7 },
        { row: 5, col: 7 },
        { row: 8, col: 7 },
      ],
    },
    {
      text: "Die Fenster R1 C7 und R1 C8 liegen in den Spalten 7 und 8, aber auf keinem Teppich: Fatima stand in Spalte 1 vor einem Fenster in Büro A (R1 C1) oder Büro B (R3 C1). Belah war allein in Büro A oder B, also im anderen der beiden Büros - sonst war dort niemand. In den Zeilen 1 bis 4 standen nur Fatima, Belah und die zwei Personen in Büro C; der Flur R1-R4 C5 blieb leer.",
      cross: [
        { row: 0, col: 4 },
        { row: 1, col: 4 },
        { row: 2, col: 4 },
        { row: 3, col: 4 },
      ],
    },
    {
      text: "Genau eine Person saß auf einem Stuhl. Der Stuhl R6 C7 liegt in Spalte 7 ohne Teppich, R8 C1 in Fatimas Spalte. Säße jemand auf R1 C6, stünde Fatima in R3 C1 und Belah in Zeile 2 von Büro A - für die zweite Person in Büro C bliebe nur Zeile 4, wo R4 C7 und R4 C8 keine Teppiche sind. Also saß Belah auf dem Stuhl R4 C4, und Fatima stand in R1 C1.",
      place: { B: { row: 3, col: 3 }, F: { row: 0, col: 0 } },
    },
    {
      text: "Büro C bekommt die Zeilen 2 und 3. In Zeile 2 ist dort nur R2 C7 frei, die zweite Person stand in R3 C8 oder R3 C9.",
    },
    {
      text: "Dagmar war in der untersten Zeile ihres Raumes: Büro A und B sind voll, und in Zeile 4 von Büro C ist nichts frei - sie war in Zeile 9. Eli war in einer Ecke außerhalb des Flurs: R1 C6 und R1 C9 liegen in Fatimas Zeile, R6 C1 und R9 C1 in ihrer Spalte, R6 C4 und R9 C4 in Belahs Spalte, R9 C9 in Dagmars Zeile. Eli war in R6 C6 in Büro D.",
      place: { E: { row: 5, col: 5 } },
    },
    {
      text: "Die Spalten 2 und 3 stehen auf einem Teppich im Pausenraum: Spalte 3 in R8 C3 (R6 gehört Eli), Spalte 2 in R7 C2 oder R9 C2 (R8 ist belegt). Im Pausenraum und in Büro C waren also je zwei Personen, in Büro D war Eli. Harriet war allein - das geht nur im Flur, und nur wenn Zeile 5 und Spalte 5 dieselbe Person haben: Harriet in R5 C5.",
      place: { H: { row: 4, col: 4 } },
    },
    {
      text: "Übrig sind die Zeilen 7 und 9 für Spalte 2 und für Büro D. Stünde die zweite Person in Büro C in R3 C8, bliebe Büro D nur R9 C9 und Spalte 2 nur R7 C2. Angelo (kein Teppich) müsste nach R9 C9, und Dagmar hätte in Zeile 9 keinen Platz. Also stand in Büro C jemand in R3 C9, in Büro D jemand in R7 C8 und im Pausenraum jemand in R9 C2.",
    },
    {
      text: "Dagmar war in R9 C2, Angelo ohne Teppich in R3 C9, Georg in Büro C in R2 C7. Calvin stand in R7 C8 - der Fernseher R7 C9 ist in seinem Raum und seiner Zeile.",
      place: {
        D: { row: 8, col: 1 },
        A: { row: 2, col: 8 },
        G: { row: 1, col: 6 },
        C: { row: 6, col: 7 },
      },
    },
    {
      text: "Odelia war in R8 C3 im Pausenraum, allein mit Dagmar - Dagmar ist die Mörderin!",
      place: { O: { row: 7, col: 2 } },
    },
  ],
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
