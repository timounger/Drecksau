/**
 * Das Balsamierhaus: the mummification hall, the preparation room, the
 * sarcophagus hall and the canopic chamber, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/67.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Vahset is the victim; whoever was alone with her killed her.
 *
 * The cards show no estates and the map no crowns. Some fields carry the
 * Anubis hieroglyph: whoever stood on one was alone in the area
 * ({@link ANUBIS}). A corner of an area is a field with the area's edge on
 * one side and on a side next to it ({@link isCorner}). Tables, basins,
 * sarcophagi and statues cannot be stood on.
 */
import { all, beside, counting, not, own, victim } from "../engine/clues";
import type { Context, Level, Rule } from "../engine/types";

/** Whoever stood on an Anubis field was alone in their area. */
const ANUBIS: Rule = {
  text: "Wer auf einer Anubis-Hieroglyphe stand, war allein in seinem Bereich.",
  check: (c) =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return (
        there === undefined ||
        !c.is(there, "anubis") ||
        c.peopleIn(c.areaOf(there) ?? "").length === 1
      );
    }),
};

/** The case. */
export const THE_EMBALMING_HOUSE: Level = {
  id: "the-embalming-house",
  name: "Das Balsamierhaus",
  series: { book: "timeTravel", number: 67 },
  story: "Eine der Mumien ist frischer als die anderen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "M",
      name: "Mumifizierung",
      at: "in der Mumifizierung",
      ground: "stone",
      tint: "#c9d8e6",
      label: { row: 4, col: 3 },
    },
    {
      key: "P",
      name: "Vorbereitung",
      at: "in der Vorbereitung",
      ground: "stone",
      tint: "#d3e3f0",
      label: { row: 7, col: 1 },
    },
    {
      key: "S",
      name: "Sarkophagsaal",
      at: "im Sarkophagsaal",
      ground: "floor",
      tint: "#e2e4e8",
      label: { row: 5, col: 5 },
    },
    {
      key: "K",
      name: "Kanopenkammer",
      at: "in der Kanopenkammer",
      ground: "floor",
      tint: "#cfd4f0",
      label: { row: 7, col: 5 },
    },
  ],
  areaMap: [
    "MMMMSSSS",
    "MMMMMSSS",
    "MMMMMSSS",
    "MMMMMSSS",
    "PPMMMSSS",
    "PPPPSSSK",
    "PPPPKKKK",
    "PPPPKKKK",
  ],
  thingMap: [
    "...a..ss",
    "t.a...a.",
    "t.tt....",
    "......ss",
    "a.tt....",
    "a..b....",
    "b...x...",
    "t..b...x",
  ],
  things: {
    a: "anubis",
    b: "basin",
    s: "sarcophagus",
    t: "table",
    x: "statue",
  },
  extraThings: {
    basin: { name: "Schale", emoji: "\u{1F963}", standable: false },
  },
  pieces: [
    { at: { row: 0, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 2 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Ankhmu",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einem Tisch, aber jemand in seinem Bereich war es.",
        ...all(
          not(beside("table")),
          own((c) => areaHasOther(c, "table")),
          counting((c) =>
            c
              .peopleIn(c.areaOf(c.cell) ?? "")
              .some((id) => id !== c.self && besideThing(c, id, "table")),
          ),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F473}",
    },
    {
      id: "B",
      name: "Bakari",
      pronoun: "er",
      clue: {
        text: "Er war allein mit einer Frau, die südlich von ihm war.",
        ...counting((c) => {
          const others = c
            .peopleIn(c.areaOf(c.cell) ?? "")
            .filter((id) => id !== c.self);
          const other = others[0];
          const there = other === undefined ? undefined : c.cellOf(other);
          return (
            others.length === 1 &&
            other !== undefined &&
            there !== undefined &&
            c.has(other, "woman") &&
            there.row > c.cell.row
          );
        }),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Chenamun",
      pronoun: "sie",
      clue: {
        text: "Sie war in der ersten oder in der letzten Spalte.",
        ...own((c) => c.cell.col === 0 || c.cell.col === c.cols - 1),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Djefat",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Feld mit einer Hieroglyphe.",
        ...beside("hieroglyph"),
      },
      colour: "#7c3aed",
      face: "\u{1F478}",
    },
    {
      id: "E",
      name: "Ehot",
      pronoun: "er",
      clue: {
        text: "Er war mit jemandem zusammen, der neben einer Statue war.",
        ...all(
          own((c) => areaHasOther(c, "statue")),
          counting((c) =>
            c
              .peopleIn(c.areaOf(c.cell) ?? "")
              .some((id) => id !== c.self && besideThing(c, id, "statue")),
          ),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F466}",
    },
    {
      id: "F",
      name: "Fai",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke ihres Bereichs.",
        ...own((c) => isCorner(c)),
      },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "G",
      name: "Gaut",
      pronoun: "sie",
      clue: {
        text: "Sie war mit einer Frau zusammen, die neben einem Sarkophag war.",
        ...all(
          own((c) => areaHasOther(c, "sarcophagus")),
          counting((c) =>
            c
              .peopleIn(c.areaOf(c.cell) ?? "")
              .some(
                (id) =>
                  id !== c.self &&
                  c.has(id, "woman") &&
                  besideThing(c, id, "sarcophagus"),
              ),
          ),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "V",
      name: "Vahset",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F9DF}",
    },
  ],
  rules: [ANUBIS],
  prune: stillPossible,
  hints: [
    {
      text: "Ehot braucht jemanden neben einer Statue - das geht nur in der Kanopenkammer. Gaut braucht eine Frau neben einem Sarkophag - nur im Sarkophagsaal. Ankhmu braucht jemanden neben einem Tisch - nur in Mumifizierung oder Vorbereitung. Bakari ist allein mit einer Frau, also in Mumifizierung oder Vorbereitung, aber nicht bei Ankhmu. Acht Personen in vier Bereichen mit je mindestens zwei: In jedem Bereich stehen genau zwei. Darum steht niemand auf einer Anubis-Hieroglyphe.",
    },
    {
      text: "Sarkophagsaal und Kanopenkammer liegen in Spalte 5-8 - ihre vier Personen füllen diese Spalten, Mumifizierung und Vorbereitung bleiben in Spalte 1-4. In Spalte 1 bleiben nur R1C1 und R4C1 in der Mumifizierung. Die Kanopenkammer liegt in Zeile 6-8 und braucht zwei dieser Zeilen; die Vorbereitung hat dort nur noch Platz für eine Person, die andere steht in Zeile 5: auf R5C2.",
    },
    {
      text: "Stünde Ankhmu in der Vorbereitung, müsste dort jemand neben dem Tisch in R8C1 stehen - auf R8C2, in der Spalte von R5C2. Also ist Ankhmu in der Mumifizierung und Bakari in der Vorbereitung. Seine Frau steht südlich von ihm, also steht Bakari in R5C2.",
      place: { B: { row: 4, col: 1 } },
    },
    {
      text: "Ankhmu steht in der Mumifizierung, in Spalte 1-4 und nicht neben einem Tisch: R1C2 und R4C2 liegen in Bakaris Spalte, es bleibt R1C3. Die zweite Person der Mumifizierung steht in Spalte 1, also in R4C1. Die Frau bei Bakari steht in Zeile 6-8 in Spalte 3 oder 4 - Spalte 3 ist Ankhmus: R7C4.",
      place: { A: { row: 0, col: 2 } },
    },
    {
      text: "Frei sind Zeile 2, 3, 6 und 8 sowie Spalte 5-8. Die Kanopenkammer bekommt Zeile 6 und 8: R6C8 und ein Feld in Zeile 8. Der Sarkophagsaal bekommt Zeile 2 und 3 ohne Spalte 8: R2C6 und R3C7. Für die Kanopenkammer bleibt R8C5.",
    },
    {
      text: "Ehot braucht jemanden neben einer Statue: Das ist R8C5, Ehot steht in R6C8. Chenamun steht in der ersten oder letzten Spalte, also in R4C1. Gaut braucht eine Frau neben einem Sarkophag: Die steht in R3C7, Gaut in R2C6.",
      place: {
        E: { row: 5, col: 7 },
        C: { row: 3, col: 0 },
        G: { row: 1, col: 5 },
      },
    },
    {
      text: "Von R3C7, R7C4 und R8C5 ist nur R8C5 eine Ecke ihres Bereichs - dort steht Fai. Djefat steht neben einer Hieroglyphe: R3C7. Vahset steht in R7C4 - allein mit Bakari. Bakari ist der Mörder!",
      place: {
        F: { row: 7, col: 4 },
        D: { row: 2, col: 6 },
        V: { row: 6, col: 3 },
      },
    },
  ],
  solution: {
    A: { row: 0, col: 2 },
    B: { row: 4, col: 1 },
    C: { row: 3, col: 0 },
    D: { row: 2, col: 6 },
    E: { row: 5, col: 7 },
    F: { row: 7, col: 4 },
    G: { row: 1, col: 5 },
    V: { row: 6, col: 3 },
  },
};

/** Whether the suspect's area has another field to stand on beside a thing of this id - where the other person must be. */
function areaHasOther(c: Context, thing: string): boolean {
  return c
    .cellsOf(c.areaOf(c.cell) ?? "")
    .some(
      (cell) =>
        (cell.row !== c.cell.row || cell.col !== c.cell.col) &&
        c.standable(cell) &&
        c.beside(cell, thing),
    );
}

/** Whether somebody stood beside a thing of this id. */
function besideThing(c: Context, id: string, thing: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && c.beside(there, thing);
}

/** Whether the suspect's field is a corner of its area: the edge on two sides that meet. */
function isCorner(c: Context): boolean {
  const area = c.areaOf(c.cell);
  const out = (row: number, col: number) =>
    c.areaOf({ row: c.cell.row + row, col: c.cell.col + col }) !== area;
  return (out(-1, 0) || out(1, 0)) && (out(0, -1) || out(0, 1));
}

/**
 * For the solver: whether a partial placement can still be finished.
 * Whoever stands on Anubis stays alone, Vahset's area never holds more than
 * two, and Bakari's area holds at most one more - a woman south of him.
 */
function stillPossible(c: Context): boolean {
  const bakari = c.cellOf("B");
  const withBakari =
    bakari === undefined
      ? []
      : c.peopleIn(c.areaOf(bakari) ?? "").filter((id) => id !== "B");
  return (
    c.people().every((id) => {
      const there = c.cellOf(id);
      const count =
        there === undefined ? 0 : c.peopleIn(c.areaOf(there) ?? "").length;
      return (
        there === undefined ||
        ((!c.is(there, "anubis") || count === 1) && (id !== "V" || count <= 2))
      );
    }) &&
    withBakari.length <= 1 &&
    withBakari.every((id) => {
      const there = c.cellOf(id);
      return (
        bakari !== undefined &&
        there !== undefined &&
        c.has(id, "woman") &&
        there.row > bakari.row
      );
    })
  );
}
