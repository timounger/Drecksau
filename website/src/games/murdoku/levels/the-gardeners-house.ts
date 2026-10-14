/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and fields as printed */
/**
 * Das Haus des Gärtners: a guest room, a dining room, a kitchen, a living
 * room, a bathroom and a bedroom full of plants, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/54. Das Haus des Gärtners.JPG`,
 * solution on `Lösungen 1-80/Lösung 53-56.JPG`).
 * Osborne is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the beds can be stood on. The
 * tables (the kitchen counters among them), the TVs and the plants cannot.
 * A field is in a corner of its room when the room's border runs along two
 * of its sides that meet: one above or below it, one to its left or right.
 */
import {
  about,
  all,
  alone,
  beside,
  cellsWhere,
  column,
  counting,
  inArea,
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

/** Whether the suspect stood south of Giselle, in another room. */
function southOfGiselleElsewhere(c: Context): boolean {
  const giselle = c.cellOf("G");
  return (
    giselle !== undefined &&
    c.cell.row > giselle.row &&
    c.areaOf(giselle) !== c.areaOf(c.cell)
  );
}

/** How many others share Giselle's room. */
const OTHERS_WITH_GISELLE = 2;

/** The case. */
export const THE_GARDENERS_HOUSE: Level = {
  id: "the-gardeners-house",
  name: "Das Haus des Gärtners",
  series: { book: "original", number: 54 },
  story: "Ich fühle mich durch den Duft hier gleich entspannter.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#cfe3cf",
      label: { row: 4, col: 0 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#d3ddd3",
      label: { row: 4, col: 3 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#e4ebe6",
      label: { row: 2, col: 8 },
      labelEnd: true,
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#cfe0e6",
      label: { row: 8, col: 0 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#c3cdef",
      label: { row: 8, col: 2 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#d4e3c4",
      label: { row: 8, col: 8 },
      labelEnd: true,
    },
  ],
  areaMap: [
    "GGGEEEKKK",
    "GGGEEEKKK",
    "GGGEEEKKK",
    "GGGEESSSS",
    "GGGEESSSS",
    "WWWWWSSSS",
    "WWWWWSSSS",
    "WWBBBSSSS",
    "WWBBBSSSS",
  ],
  thingMap: [
    "bbt.p...p",
    "..p.ctttt",
    "...c.t.pp",
    "v.tttbbtt",
    "..c..p..t",
    "pt..t..p.",
    ".p....pp.",
    "..p.c..t.",
    ".p..p...v",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 6 }, rows: 1, cols: 3 },
    { at: { row: 3, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 5 }, rows: 1, cols: 2 },
  ],
  shapes: [
    [
      { row: 3, col: 7 },
      { row: 3, col: 8 },
      { row: 4, col: 8 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Arthur",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#c2410c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Benedikt",
      pronoun: "er",
      clue: {
        text: "Er war südlich von Giselle, in einem anderen Raum.",
        ...about(["G"], southOfGiselleElsewhere),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Christopher",
      pronoun: "er",
      clue: {
        text: "Er war allein im Badezimmer.",
        ...all(inArea("B"), alone()),
      },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Darla",
      pronoun: "sie",
      clue: {
        text: "Sie war in der sechsten Spalte, im Schlafzimmer.",
        ...all(column(6), inArea("S")),
      },
      colour: "#6366f1",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Ellie",
      pronoun: "sie",
      clue: { text: "Sie war im Esszimmer.", ...inArea("E") },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Franklin",
      pronoun: "er",
      clue: {
        text: "Er war entweder auf einem Stuhl oder auf einem Bett.",
        ...own((c) => c.is(c.cell, "chair") || c.is(c.cell, "bed")),
        glow: (level) => [
          ...(on("chair").glow?.(level) ?? []),
          ...(on("bed").glow?.(level) ?? []),
        ],
      },
      colour: "#7f1d1d",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Giselle",
      pronoun: "sie",
      clue: {
        text: "Sie war in einem Raum mit genau zwei anderen Verdächtigen.",
        ...counting(
          (c) =>
            c.peopleIn(c.areaOf(c.cell) ?? "").length ===
            OTHERS_WITH_GISELLE + 1,
        ),
      },
      colour: "#ea580c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "H",
      name: "Henrietta",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke.",
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
      name: "Osborne",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#be123c",
      face: "\u{1F468}\u{1F3FF}",
    },
  ],
  rules: [
    {
      text: "Keine Frau war neben einem Tisch.",
      unary: (suspect, c) =>
        suspect.pronoun !== "sie" || !c.beside(c.cell, "table"),
    },
    {
      text: "Es gab keinen leeren Raum.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length > 0),
    },
  ],
  hints: [
    {
      text: "Darla ist in S6, im Schlafzimmer. Schließe Z1 S6 aus.",
      cross: [{ row: 0, col: 5 }],
    },
    {
      text: "Kein Raum ist leer, und Giselle ist in einem Raum mit zwei anderen Verdächtigen. Das bedeutet, dass es in jedem Raum außer Giselles genau einen Verdächtigen geben muss, was das Schlafzimmer sein muss. (Mit je einem Verdächtigen im Gästezimmer, Esszimmer, Wohnzimmer und Badezimmer gibt es nur Platz für eine weitere Person in den ersten fünf Spalten.)",
    },
    {
      text: "Laut dem ersten allgemeinen Hinweis ist Ellie nicht neben einem Tisch, also muss sie in S4 im Esszimmer sein, in Z1 oder Z2.",
    },
    {
      text: "Keine Frau ist neben dem Tisch in der Küche, also kann nur Arthur dort sein. Die andere Person mit Darla und Giselle im Schlafzimmer kann nur Franklin sein. (Nicht Henrietta, da Darla in S6 ist.) Das lokalisiert Franklin, dann Arthur, dann Ellie und Giselle (in S9, aber nicht neben einem Tisch).",
      place: {
        F: { row: 3, col: 6 },
        A: { row: 0, col: 7 },
        E: { row: 1, col: 3 },
        G: { row: 6, col: 8 },
      },
    },
    {
      text: "Benedikt und Christopher sind in Z8/Z9, was Darla lokalisiert, und lokalisiert auch Henrietta in der Südwestecke des Gästezimmers. Das lokalisiert Benedikt, dann Christopher, dann Osborne. Ellie ist die Mörderin!",
      place: {
        D: { row: 5, col: 5 },
        H: { row: 4, col: 0 },
        B: { row: 7, col: 1 },
        C: { row: 8, col: 2 },
        O: { row: 2, col: 4 },
      },
    },
  ],
  solution: {
    A: { row: 0, col: 7 },
    B: { row: 7, col: 1 },
    C: { row: 8, col: 2 },
    D: { row: 5, col: 5 },
    E: { row: 1, col: 3 },
    F: { row: 3, col: 6 },
    G: { row: 6, col: 8 },
    H: { row: 4, col: 0 },
    O: { row: 2, col: 4 },
  },
};
