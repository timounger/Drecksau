/**
 * Das Gefängnisschiff: a leaking prison ship between two piers nobody will
 * name, and its captain murdered on board.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/35.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Vane is the victim; whoever was alone with him killed him. No estates in
 * this case.
 *
 * The map is seven by seven. The two piers carry no names: one is the Iron
 * Pier, the other the Rust Pier, and which is which is part of the puzzle -
 * the clues of Anne, Blake and Cali hold for one of the two ways round
 * ({@link DOCKS}). "In the sea" means in the water or on the prison ship
 * floating in it, "on land" means on one of the piers. Hammocks can be
 * stood on; ropes, crates, sharks and the rock cannot.
 */

import {
  about,
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The two unnamed piers: either may be the Iron Pier. */
const DOCKS: readonly string[] = ["I", "O"];

/** The areas that are land. */
const LAND: readonly string[] = DOCKS;

/** The area of somebody, or an empty string while not placed. */
function areaOfPerson(c: Context, id: string): string {
  const there = c.cellOf(id);
  return there === undefined ? "" : (c.areaOf(there) ?? "");
}

/**
 * Whether the clues about the piers hold with this pier as the Iron Pier:
 * Anne on it, Blake on the other, and Cali one column east of somebody on it.
 */
function fitsIron(c: Context, iron: string): boolean {
  const rust = DOCKS.find((key) => key !== iron) ?? "";
  const cali = c.cellOf("C");
  return (
    areaOfPerson(c, "A") === iron &&
    areaOfPerson(c, "B") === rust &&
    cali !== undefined &&
    c.people().some((id) => {
      const there = c.cellOf(id);
      return (
        there !== undefined &&
        there.col === cali.col - 1 &&
        c.areaOf(there) === iron
      );
    })
  );
}

/** Whether one of the two piers can be the Iron Pier. */
function piersFit(c: Context): boolean {
  return DOCKS.some((iron) => fitsIron(c, iron));
}

/** Whether one of the two was in the sea and the other on land. */
function seaAndLand(c: Context, other: string): boolean {
  const mine = LAND.includes(c.areaOf(c.cell) ?? "");
  const theirs = LAND.includes(areaOfPerson(c, other));
  return mine !== theirs;
}

/** The case. */
export const THE_PRISON_SHIP: Level = {
  id: "the-prison-ship",
  name: "Das Gefängnisschiff",
  series: { book: "timeTravel", number: 35 },
  story: "In allen Zellen gibt es fließend Wasser … weil das Schiff leckt.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "I",
      name: "???",
      at: "auf dem oberen Steg",
      ground: "floor",
      tint: "#b9c6d3",
      label: { row: 0, col: 2 },
    },
    {
      key: "W",
      name: "Wasser",
      at: "im Wasser",
      ground: "water",
      label: { row: 4, col: 1 },
    },
    {
      key: "S",
      name: "Gefängnisschiff",
      at: "auf dem Gefängnisschiff",
      ground: "floor",
      tint: "#cfd6de",
      label: { row: 5, col: 4 },
    },
    {
      key: "O",
      name: "???",
      at: "auf dem unteren Steg",
      ground: "floor",
      tint: "#b9c6d3",
      label: { row: 6, col: 4 },
    },
  ],
  areaMap: [
    "WIIIIII",
    "WWWIIII",
    "WWWWWWW",
    "WWSSSSW",
    "WWSSSSW",
    "OOSSSSW",
    "OOOOOOO",
  ],
  thingMap: [
    "....rhh",
    ".......",
    "...k.b.",
    "...chh.",
    "k.hh.c.",
    ".......",
    "rhh....",
  ],
  things: {
    b: "boulder",
    c: "woodCrate",
    h: "hammock",
    k: "shark",
    r: "rope",
  },
  pieces: [
    { at: { row: 0, col: 5 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 1 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Anne",
      pronoun: "sie",
      clue: {
        text: "Sie war auf dem Eisensteg, neben einem Seil.",
        ...all(inArea(...DOCKS), beside("rope"), counting(piersFit)),
      },
      colour: "#b91c1c",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "B",
      name: "Blake",
      pronoun: "er",
      clue: {
        text: "Er war auf dem Roststeg, in einer Hängematte.",
        ...all(inArea(...DOCKS), on("hammock"), counting(piersFit)),
      },
      colour: "#15803d",
      face: "\u{1F474}",
    },
    {
      id: "C",
      name: "Cali",
      pronoun: "sie",
      clue: {
        text: "Sie war genau eine Spalte östlich von jemandem auf dem Eisensteg.",
        ...counting(piersFit),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "D",
      name: "Dagger Jack",
      pronoun: "er",
      clue: {
        text: "Er war auf dem Gefängnisschiff. Er war nicht in einer Hängematte.",
        ...all(inArea("S"), not(on("hammock"))),
      },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Edmund",
      pronoun: "er",
      clue: { text: "Er war in der obersten Zeile.", ...row(1) },
      colour: "#a16207",
      face: "\u{1F468}\u{1F3FF}‍\u{1F9B1}",
    },
    {
      id: "F",
      name: "Finn",
      pronoun: "er",
      clue: {
        text: "Entweder er oder Cali war im Meer, die andere Person an Land.",
        ...about(["C"], (c) => seaAndLand(c, "C")),
      },
      colour: "#be185d",
      face: "\u{1F468}",
    },
    {
      id: "V",
      name: "Vane",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F474}",
    },
  ],
  rules: [
    {
      text: "Die Stege sind nicht beschriftet: Einer ist der Eisensteg, der andere der Roststeg. Finde heraus, welcher welcher ist.",
      note: true,
    },
  ],
  hints: [
    {
      text: "Blake liegt in einer Hängematte auf einem Steg. Die Hängematten des oberen Stegs liegen in Zeile 1, Edmunds Zeile. Also ist Blake auf dem unteren Steg, in R7 C2 oder R7 C3: Der untere Steg ist der Roststeg, der obere der Eisensteg.",
    },
    {
      text: "Anne steht auf dem Eisensteg neben einem Seil: R1 C4 und R1 C6 liegen in Edmunds Zeile, es bleibt R2 C5.",
      place: { A: { row: 1, col: 4 } },
    },
    {
      text: "Finn oder Cali ist an Land. Die Stege in Zeile 1, 2 und 7 sind belegt (Edmund, Anne, Blake) - es bleiben R6 C1 und R6 C2. Cali kann dort nicht stehen, denn in Spalte 1 liegt kein Feld des Eisenstegs, westlich von ihr wäre also niemand darauf. Finn ist an Land, Cali im Meer.",
    },
    {
      text: "Dagger Jack ist auf dem Schiff, nicht in einer Hängematte: Zeile 6 ist Finns, R5 C5 ist Annes Spalte - er steht in R4 C3. Damit liegt Blake in R7 C2 (Spalte 3 ist Daggers) und Finn steht in R6 C1.",
      place: {
        D: { row: 3, col: 2 },
        B: { row: 6, col: 1 },
        F: { row: 5, col: 0 },
      },
    },
    {
      text: "Frei sind noch Zeile 3 und 5 und die Spalten 4, 6 und 7. Cali steht im Meer: R3 C4 ist ein Hai, R3 C6 ein Felsen, R5 C6 eine Kiste - sie steht in Spalte 4 oder 7. In Spalte 4 müsste jemand in Spalte 3 auf dem Eisensteg stehen - das ist Daggers Spalte. Also ist Cali in Spalte 7, und in Spalte 6 steht jemand auf dem Eisensteg - das kann nur Edmund sein, in R1 C6.",
      place: { E: { row: 0, col: 5 } },
    },
    {
      text: "Vane bleibt Spalte 4: R3 C4 ist ein Hai, also R5 C4, und Cali steht in R3 C7. Vane ist auf dem Schiff allein mit Dagger Jack. Dagger Jack ist der Mörder!",
      place: { V: { row: 4, col: 3 }, C: { row: 2, col: 6 } },
    },
  ],
  solution: {
    A: { row: 1, col: 4 },
    B: { row: 6, col: 1 },
    C: { row: 2, col: 6 },
    D: { row: 3, col: 2 },
    E: { row: 0, col: 5 },
    F: { row: 5, col: 0 },
    V: { row: 4, col: 3 },
  },
};
