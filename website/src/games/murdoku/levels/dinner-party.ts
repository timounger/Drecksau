/**
 * Dinnerparty: a living room, a dining room, a bathroom, a kitchen and a
 * bedroom of a flat, with a murdered delivery man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/50. Dinnerparty.png`,
 * solution sheet `Lösungen 1-80/Lösung 49-52.JPG`).
 * Ovid is the victim; whoever was alone with him killed him.
 *
 * The map has nine rows and nine columns; the four fields at the top left and
 * the five at the bottom right are not part of it. The armchairs are the
 * chairs; they, the beds and the rugs can be stood on. The tables, the TVs and
 * the plants cannot. A field is in a corner of its room when the room's border
 * runs along two of its sides that meet: one above or below it, one to its
 * left or right.
 */
import {
  about,
  all,
  alone,
  beside,
  cellsWhere,
  counting,
  on,
  own,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

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

/** Whether the suspect stands east of somebody - in a column further right. */
function eastOf(c: Context, id: string): boolean {
  const other = c.cellOf(id);
  return other !== undefined && c.cell.col > other.col;
}

/** Whether another woman stands on a rug in the suspect's area. */
function anotherWomanOnARug(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      c.has(id, "woman") &&
      there !== undefined &&
      c.is(there, "rug")
    );
  });
}

/** The case. */
export const DINNER_PARTY: Level = {
  id: "dinner-party",
  name: "Dinnerparty",
  series: { book: "original", number: 50 },
  story:
    "Normalerweise ist das Schlimmste, was man einem Lieferanten antun kann, kein Trinkgeld zu geben.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#cfe1e6",
      label: { row: 4, col: 4 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#e6d3ea",
      label: { row: 6, col: 7 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#f3e3c4",
      label: { row: 4, col: 0 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#dccbea",
      label: { row: 6, col: 3 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#d6c8ec",
      label: { row: 8, col: 2 },
    },
  ],
  areaMap: [
    "....WWWEE",
    "....WWWEE",
    "BBBWWWWEE",
    "BBBWWWWEE",
    "BBBWWWWEE",
    "SSSKKKEEE",
    "SSSKKKEEE",
    "SSSS.....",
    "SSSS.....",
  ],
  thingMap: [
    ".....cT.p",
    "........T",
    "r.r..r.r.",
    "rcrv.rprT",
    ".p......T",
    "...p..p..",
    "bb..Tc..T",
    "bbv......",
    "pT.......",
  ],
  things: {
    T: "table",
    b: "bed",
    c: "chair",
    p: "plant",
    r: "rug",
    v: "tv",
  },
  pieces: [
    { at: { row: 2, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 1 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Amos",
      pronoun: "er",
      clue: {
        text: "Er war östlich von Ovid.",
        ...about(["O"], (c) => eastOf(c, "O")),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Benjamin",
      pronoun: "er",
      clue: {
        text: "Er war auf einem Teppich. Er war östlich von Farouk.",
        ...all(
          on("rug"),
          about(["F"], (c) => eastOf(c, "F")),
        ),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Chrissi",
      pronoun: "sie",
      clue: { text: "Sie war allein.", ...alone() },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Deborah",
      pronoun: "sie",
      clue: {
        text: "Eine weitere Frau war auf einem Teppich in ihrem Raum.",
        ...counting(anotherWomanOnARug),
      },
      colour: "#6366f1",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Emma",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fernseher.", ...beside("tv") },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Farouk",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#9f1239",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Gerrit",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke. Er war südlich von Amos.",
        ...all(
          own((c) => inCorner(c.areaOf, c.cell)),
          about(["A"], (c) => {
            const amos = c.cellOf("A");
            return amos !== undefined && c.cell.row > amos.row;
          }),
        ),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Helen",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Tisch.", ...beside("table") },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Ovid",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      text: "Mindestens eine Person saß auf einem Stuhl.",
      check: (c) =>
        c.people().some((id) => {
          const there = c.cellOf(id);
          return there !== undefined && c.is(there, "chair");
        }),
    },
  ],
  hints: [
    {
      text: "Helen ist die einzige Frau, die mit Deborah auf einem Teppich sein kann. Das lokalisiert Helen im einzigen Teppichfeld neben einem Tisch. Deborah ist mit ihr, irgendwo anders im Esszimmer.",
      place: { H: { row: 3, col: 7 } },
    },
    {
      text: "Jemand muss auf einem Stuhl in S6 sein. Schließe den Rest der Spalte aus.",
      cross: [
        { row: 1, col: 5 },
        { row: 2, col: 5 },
        { row: 3, col: 5 },
        { row: 4, col: 5 },
        { row: 5, col: 5 },
      ],
    },
    {
      text: "Benjamin ist auf einem der beiden verbleibenden Teppichfelder in Z3. Da Benjamin östlich von Farouk ist, kann er nicht in S1 sein, also ist er in Z3 S3.",
      place: { B: { row: 2, col: 2 } },
    },
    {
      text: "Nur ein Feld bleibt in Z9, also muss es besetzt sein; schließe den Rest von S4 aus. Das lokalisiert Emma, dann Farouk (der westlich von Benjamin ist).",
      place: { E: { row: 7, col: 1 }, F: { row: 4, col: 0 } },
      cross: [
        { row: 2, col: 3 },
        { row: 4, col: 3 },
        { row: 5, col: 3 },
        { row: 6, col: 3 },
        { row: 7, col: 3 },
      ],
    },
    {
      text: "Jemand muss im Wohnzimmer in Z2 sein, also kann Chrissi nur allein in der Küche sein. Sie und Deborah im Esszimmer besetzen Z6 und Z7 in irgendeiner Reihenfolge. Nur ein Feld bleibt in S9, also muss Deborah darin sein, was Chrissi lokalisiert.",
      place: { D: { row: 5, col: 8 }, C: { row: 6, col: 5 } },
    },
    {
      text: "Gerrit ist in einer Ecke, aber nicht in Z1, da er südlich von Amos ist, also ist er in Z9. Amos ist östlich von Ovid, was beide lokalisiert. Amos ist der Mörder!",
      place: {
        G: { row: 8, col: 3 },
        A: { row: 1, col: 6 },
        O: { row: 0, col: 4 },
      },
    },
  ],
  solution: {
    A: { row: 1, col: 6 },
    B: { row: 2, col: 2 },
    C: { row: 6, col: 5 },
    D: { row: 5, col: 8 },
    E: { row: 7, col: 1 },
    F: { row: 4, col: 0 },
    G: { row: 8, col: 3 },
    H: { row: 3, col: 7 },
    O: { row: 0, col: 4 },
  },
};
