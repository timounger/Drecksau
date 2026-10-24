/**
 * Die Schatzinsel: a small island with a clearing and a beach, a frigate at
 * anchor beside it and a pirate stabbed where X marks the spot.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/33.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Voss is the victim; whoever was alone with him killed him. No estates in
 * this case.
 *
 * The map is five by five. "In the sea" means in the water around the
 * island or on the frigate floating in it (as in case 34, where only that
 * reading leaves a solution), "on land" means on the clearing or the beach. The water and the frigate's planks can be stood on; the bush,
 * the chests and the rock cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  column,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The areas that are land. */
const LAND: readonly string[] = ["C", "P"];

/** The areas that are at sea: the water and the frigate on it. */
const SEA: readonly string[] = ["W", "F"];

/** Whether exactly one person stood beside a thing of this id. */
function onlyOneBeside(c: Context, what: string): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.beside(there, what);
    }).length === 1
  );
}

/** Whether one of the two was in the sea and the other on land. */
function seaAndLand(c: Context, other: string): boolean {
  const there = c.cellOf(other);
  const mine = c.areaOf(c.cell) ?? "";
  const theirs = there === undefined ? "" : (c.areaOf(there) ?? "");
  return (
    (SEA.includes(mine) && LAND.includes(theirs)) ||
    (LAND.includes(mine) && SEA.includes(theirs))
  );
}

/** The case. */
export const TREASURE_ISLAND: Level = {
  id: "treasure-island",
  name: "Die Schatzinsel",
  series: { book: "timeTravel", number: 33 },
  story: "Das X markiert die Stelle … an der man den Kerl erstochen hat.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Wasser",
      at: "im Wasser",
      ground: "water",
      label: { row: 4, col: 4 },
    },
    {
      key: "F",
      name: "Fregatte",
      at: "auf der Fregatte",
      ground: "floor",
      tint: "#e8d3a8",
      label: { row: 1, col: 3 },
    },
    {
      key: "C",
      name: "Lichtung",
      at: "auf der Lichtung",
      ground: "grass",
      label: { row: 2, col: 2 },
    },
    {
      key: "P",
      name: "Strand",
      at: "am Strand",
      ground: "sand",
      label: { row: 3, col: 2 },
    },
  ],
  areaMap: ["WWFFF", "WCFFF", "WCCPW", "WPPPW", "WWWWW"],
  thingMap: [".....", ".s..t", ".....", ".t...", "b...."],
  things: {
    b: "boulder",
    s: "shrub",
    t: "chest",
  },
  suspects: [
    {
      id: "A",
      name: "Adeline",
      pronoun: "sie",
      clue: { text: "Sie war auf der Lichtung.", ...inArea("C") },
      colour: "#b91c1c",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "B",
      name: "Basil",
      pronoun: "er",
      clue: { text: "Er war in der dritten Spalte.", ...column(3) },
      colour: "#15803d",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "C",
      name: "Clea",
      pronoun: "sie",
      clue: {
        text: "Entweder sie oder Basil war im Meer, die andere Person an Land.",
        ...about(["B"], (c) => seaAndLand(c, "B")),
      },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Drea",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person neben einer Schatztruhe.",
        ...all(
          beside("chest"),
          counting((c) => onlyOneBeside(c, "chest")),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "V",
      name: "Voss",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Spalte 1 ist ganz Wasser, Zeile 5 auch (R5 C1 ist ein Felsen) - in beiden muss jemand stehen, und zwar zwei verschiedene Personen. Adeline ist auf der Lichtung, Drea neben einer Schatztruhe, also stehen zwei von Basil, Clea und Voss im Wasser.",
    },
    {
      text: "Wären Clea und Voss im Wasser, müsste Basil an Land in Spalte 3 stehen: R3 C3 ist Adelines Zeile (die Lichtung liegt in Zeile 3), und in R4 C3 wäre er neben der Truhe - Drea wäre nicht mehr die einzige. Also steht Basil im Wasser, in Spalte 3 nur R5 C3. Clea ist damit an Land.",
      place: { B: { row: 4, col: 2 } },
    },
    {
      text: "Adeline steht auf der Lichtung, aber nicht in Basils Spalte: R3 C2.",
      place: { A: { row: 2, col: 1 } },
    },
    {
      text: "Clea ist an Land: Zeile 3 ist Adelines, Spalte 3 Basils, R4 C2 ist eine Truhe - es bleibt R4 C4. Drea neben einer Truhe: R2 C4 ist Cleas Spalte, R4 C3 Basils - sie steht in R1 C5.",
      place: { C: { row: 3, col: 3 }, D: { row: 0, col: 4 } },
    },
    {
      text: "Voss steht in Spalte 1 auf der letzten freien Zeile: R2 C1, im Wasser - allein mit Basil. Basil ist der Mörder!",
      place: { V: { row: 1, col: 0 } },
    },
  ],
  solution: {
    A: { row: 2, col: 1 },
    B: { row: 4, col: 2 },
    C: { row: 3, col: 3 },
    D: { row: 0, col: 4 },
    V: { row: 1, col: 0 },
  },
};
