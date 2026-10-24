/**
 * Der Schiffbruch: a sinking frigate between the north and the south coast,
 * and its captain murdered before he could leave it last.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/34.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Vergo is the victim; whoever was alone with him killed him. No estates in
 * this case.
 *
 * The map is five rows by six columns, so one column stays empty. "In the
 * sea" means in the water or on the frigate floating in it, "on land" means
 * on one of the two coasts. The water, the coasts and the frigate's planks
 * can be stood on; the barrels, the chest and the rock cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  own,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The areas that are land. */
const LAND: readonly string[] = ["N", "S"];

/** Whether exactly one person stood beside a thing of this id. */
function onlyOneBeside(c: Context, what: string): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.beside(there, what);
    }).length === 1
  );
}

/** Whether both were on land, or both at sea. */
function bothSame(c: Context, other: string): boolean {
  const there = c.cellOf(other);
  const mine = LAND.includes(c.areaOf(c.cell) ?? "");
  const theirs = there !== undefined && LAND.includes(c.areaOf(there) ?? "");
  return mine === theirs;
}

/** Whether nobody stood in the column at the other edge of the map. */
function otherEdgeEmpty(c: Context): boolean {
  const empty = c.cell.col === 0 ? c.cols - 1 : 0;
  return c.people().every((id) => c.cellOf(id)?.col !== empty);
}

/** The case. */
export const THE_SHIPWRECK: Level = {
  id: "the-shipwreck",
  name: "Der Schiffbruch",
  series: { book: "timeTravel", number: 34 },
  story:
    "Wenn ein Schiff sinkt, verlässt der Kapitän es als Letzter. Deshalb muss man ihn aber nicht gleich umbringen, um sicherzugehen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "N",
      name: "Nordküste",
      at: "an der Nordküste",
      ground: "stone",
      tint: "#c9ced2",
      label: { row: 1, col: 0 },
    },
    {
      key: "W",
      name: "Wasser",
      at: "im Wasser",
      ground: "water",
      label: { row: 4, col: 1 },
    },
    {
      key: "F",
      name: "Fregatte",
      at: "auf der Fregatte",
      ground: "floor",
      tint: "#d8cbb4",
      label: { row: 2, col: 3 },
    },
    {
      key: "S",
      name: "Südküste",
      at: "an der Südküste",
      ground: "stone",
      tint: "#c9ced2",
      label: { row: 4, col: 4 },
    },
  ],
  areaMap: ["NNWWWW", "NNFFFW", "WNFFFW", "WWWWSS", "WWWSSS"],
  thingMap: ["b.....", ".....r", "...t..", "......", "b....."],
  things: {
    b: "barrel",
    r: "boulder",
    t: "chest",
  },
  suspects: [
    {
      id: "A",
      name: "Arlene",
      pronoun: "sie",
      clue: {
        text: "Sie war in der ersten oder der letzten Spalte. Die Spalte, in der sie nicht war, blieb leer.",
        ...all(
          own((c) => c.cell.col === 0 || c.cell.col === c.cols - 1),
          counting(otherEdgeEmpty),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F475}",
    },
    {
      id: "B",
      name: "Bree",
      pronoun: "sie",
      clue: { text: "Sie war an der Südküste.", ...inArea("S") },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Cole",
      pronoun: "er",
      clue: {
        text: "Er war in der dritten Zeile. Er und Dalika waren beide im Meer oder beide an Land.",
        ...all(
          row(3),
          about(["D"], (c) => bothSame(c, "D")),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Dalika",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person neben einem Fass.",
        ...all(
          beside("barrel"),
          counting((c) => onlyOneBeside(c, "barrel")),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "V",
      name: "Vergo",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F474}",
    },
  ],
  hints: [
    {
      text: "Stünde Arlene in Spalte 1: R1 C1 und R5 C1 sind Fässer, in R2 C1 oder R4 C1 wäre sie neben einem Fass (dann wäre Dalika nicht die einzige), und R3 C1 ist Coles Zeile. Also steht Arlene in Spalte 6, und Spalte 1 bleibt leer.",
    },
    {
      text: "Dalika steht neben einem Fass, nicht in Spalte 1: R1 C2 an der Nordküste oder R5 C2 im Wasser. Stünde sie an Land, müsste Cole auch an Land sein - in Zeile 3 ist das nur R3 C2, Dalikas Spalte. Also steht Dalika in R5 C2, und Cole ist im Meer.",
      place: { D: { row: 4, col: 1 } },
    },
    {
      text: "Bree ist an der Südküste, Zeile 5 ist Dalikas: R4 C5 oder R4 C6. Arlene in Spalte 6: R2 C6 ist ein Felsen, Zeile 3 ist Coles, Zeile 4 Brees, Zeile 5 Dalikas - sie steht in R1 C6. Damit steht Bree in R4 C5.",
      place: { A: { row: 0, col: 5 }, B: { row: 3, col: 4 } },
    },
    {
      text: "Cole ist im Meer in Zeile 3: Spalte 1 bleibt leer, R3 C2 ist Nordküste, R3 C4 ist die Truhe, R3 C5 ist Brees und R3 C6 Arlenes Spalte. Er steht in R3 C3 auf der Fregatte.",
      place: { C: { row: 2, col: 2 } },
    },
    {
      text: "Vergo steht auf dem letzten freien Feld, R2 C4 auf der Fregatte - allein mit Cole. Cole ist der Mörder!",
      place: { V: { row: 1, col: 3 } },
    },
  ],
  solution: {
    A: { row: 0, col: 5 },
    B: { row: 3, col: 4 },
    C: { row: 2, col: 2 },
    D: { row: 4, col: 1 },
    V: { row: 1, col: 3 },
  },
};
