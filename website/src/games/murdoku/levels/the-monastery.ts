/**
 * Das Kloster: church, guest chambers, library, cloister round the garden,
 * dormitory, kitchen, refectory and guest hall, with a murdered monk.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/11.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution). Virgil
 * is the victim; whoever was alone with him killed him.
 *
 * The map is eleven by eleven with the top right corner missing. Chairs,
 * beds and rugs can be stood on; shelves, tables, shrubs, the sack and the
 * barrel cannot - as the blank grid of the page shows. A field
 * is in a corner of its area when the area's border runs along two of its
 * sides that meet ({@link inCorner}); it is beside a wall when one of its
 * sides is the border of its area or of the map ({@link besideAWall}).
 *
 * The book's estates: nobles (purple cards: Igraine, John) only in the
 * crowned guest chambers and guest hall, villagers (wooden cards: Ambrose,
 * Bernard, Cyrus, Edmund, Finnegan, Gilbert, Virgil) only in the other
 * areas, knights (grey shields: Dunstan, Holger) anywhere.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  cellsWhere,
  column,
  counting,
  inArea,
  on,
  own,
  ranks,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** The four sides of a field. */
const STEPS: readonly Cell[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

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

/** Whether one of a field's sides is the border of its area or the map. */
function besideAWall(c: Context): boolean {
  const area = c.areaOf(c.cell);
  return STEPS.some(
    (step) =>
      c.areaOf({ row: c.cell.row + step.row, col: c.cell.col + step.col }) !==
      area,
  );
}

/** Everybody standing on a thing of this id. */
function peopleOn(c: Context, what: string): readonly string[] {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  });
}

/** Whether the suspect shares the area with exactly one other person. */
function aloneWithOne(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").length === 2;
}

/** Whether the suspect is alone with the only person on a bed. */
function aloneWithTheOneOnABed(c: Context): boolean {
  const onBeds = peopleOn(c, "bed");
  const one = onBeds[0];
  const there = one === undefined ? undefined : c.cellOf(one);
  return (
    onBeds.length === 1 &&
    one !== c.self &&
    there !== undefined &&
    c.areaOf(there) === c.areaOf(c.cell) &&
    aloneWithOne(c)
  );
}

/** Whether the suspect stands east of somebody. */
function eastOf(c: Context, id: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && c.cell.col > there.col;
}

/** The case. */
export const THE_MONASTERY: Level = {
  id: "the-monastery",
  name: "Das Kloster",
  series: { book: "timeTravel", number: 11 },
  story:
    "Jetzt fällt es ihm nicht mehr schwer, sein Schweigegelübde zu halten.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "P",
      name: "Gästegemächer",
      at: "in den Gästegemächern",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 3, col: 0 },
      labelOverhang: true,
    },
    {
      key: "I",
      name: "Kirche",
      at: "in der Kirche",
      ground: "floor",
      tint: "#e2ddd0",
      label: { row: 2, col: 4 },
    },
    {
      key: "L",
      name: "Bibliothek",
      at: "in der Bibliothek",
      ground: "floor",
      tint: "#ddd8d0",
      label: { row: 7, col: 0 },
    },
    {
      key: "K",
      name: "Kreuzgang",
      at: "im Kreuzgang",
      ground: "stone",
      tint: "#ece4d8",
      label: { row: 9, col: 4 },
    },
    {
      key: "J",
      name: "Garten",
      at: "im Garten",
      ground: "grass",
      tint: "#bfe0d0",
      label: { row: 8, col: 5 },
    },
    {
      key: "D",
      name: "Schlafsaal",
      at: "im Schlafsaal",
      ground: "floor",
      tint: "#e2ddd6",
      label: { row: 6, col: 9 },
    },
    {
      key: "C",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#d6d3cc",
      label: { row: 8, col: 9 },
    },
    {
      key: "R",
      name: "Refektorium",
      at: "im Refektorium",
      ground: "floor",
      tint: "#e2ddd6",
      label: { row: 10, col: 7 },
    },
    {
      key: "S",
      name: "Gästesaal",
      at: "im Gästesaal",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 10, col: 1 },
    },
  ],
  areaMap: [
    "PPPIIIIIII.",
    "PPPIIIIIII.",
    "PPPIIIIIII.",
    "PPKKKKKKKDD",
    "LLKJJJJJKDD",
    "LLKJJJJJKDD",
    "LLKJJJJJKDD",
    "LLKJJJJJKCC",
    "SSKJJJJJKCC",
    "SSKKKKKKKRR",
    "SSSSSKRRRRR",
  ],
  thingMap: [
    "f...ccc.rr.",
    "btb.c....t.",
    "b.b...c.rr.",
    "rr.......bb",
    ".f.s.....bb",
    "....s.s...b",
    "f....s...kb",
    "ff..s.s...o",
    ".......s...",
    ".........c.",
    ".c.rr.....t",
  ],
  things: {
    b: "bed",
    c: "chair",
    f: "shelf",
    k: "sack",
    o: "barrel",
    r: "rug",
    s: "shrub",
    t: "table",
  },
  pieces: [
    { at: { row: 1, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 8 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 8 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 9 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 10 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 10 }, rows: 2, cols: 1 },
    { at: { row: 10, col: 3 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      traits: ["villager"],
      name: "Ambrose",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke des Gartens.",
        ...all(
          inArea("J"),
          own((c) => inCorner(c.areaOf, c.cell)),
        ),
        glow: (level) =>
          cellsWhere(
            level,
            (cell) =>
              areaAt(level, cell)?.key === "J" &&
              inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#b91c1c",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "B",
      traits: ["villager"],
      name: "Bernard",
      pronoun: "er",
      clue: {
        text: "Er war im Kreuzgang, allein mit jemandem.",
        ...all(inArea("K"), counting(aloneWithOne)),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      traits: ["villager"],
      name: "Cyrus",
      pronoun: "er",
      clue: { text: "Er war in der letzten Spalte.", ...column(11) },
      colour: "#0e7490",
      face: "\u{1F474}",
    },
    {
      id: "D",
      traits: ["knight"],
      name: "Dunstan",
      pronoun: "er",
      clue: {
        text: "Er war östlich von Virgil.",
        ...about(["V"], (c) => eastOf(c, "V")),
      },
      colour: "#57534e",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      traits: ["villager"],
      name: "Edmund",
      pronoun: "er",
      clue: { text: "Er war in der Bibliothek.", ...inArea("L") },
      colour: "#a16207",
      face: "\u{1F9D1}",
    },
    {
      id: "F",
      traits: ["villager"],
      name: "Finnegan",
      pronoun: "er",
      clue: {
        text: "Er saß auf einem Stuhl. Er war östlich von Bernard und Gilbert.",
        ...all(
          on("chair"),
          about(["B", "G"], (c) => eastOf(c, "B") && eastOf(c, "G")),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "G",
      traits: ["villager"],
      name: "Gilbert",
      pronoun: "er",
      clue: {
        text: "Er war genau drei Zeilen nördlich von Bernard.",
        ...about(["B"], (c) => {
          const bernard = c.cellOf("B");
          return bernard !== undefined && c.cell.row === bernard.row - 3;
        }),
      },
      colour: "#4338ca",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "H",
      traits: ["knight"],
      name: "Holger",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der einzigen Person auf einem Bett.",
        ...counting(aloneWithTheOneOnABed),
      },
      colour: "#334155",
      face: "\u{1F482}",
    },
    {
      id: "I",
      traits: ["noble"],
      name: "Igraine",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Teppich.", ...on("rug") },
      colour: "#be185d",
      face: "\u{1F478}",
    },
    {
      id: "J",
      traits: ["noble"],
      name: "John",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einer Wand.",
        ...own((c) => !besideAWall(c)),
      },
      colour: "#7c3aed",
      face: "\u{1F934}",
    },
    {
      id: "V",
      traits: ["villager"],
      name: "Virgil",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#6b7280",
      face: "\u{1F9D3}",
    },
  ],
  rules: [
    ranks(
      "Adlige (\u{1F451}) waren nur in den Gästegemächern oder im Gästesaal, Dorfbewohner nur in den anderen Bereichen, Ritter überall.",
      ["P", "S"],
    ),
  ],
  hints: [
    {
      text: "John ist adlig, also in den Gästegemächern oder im Gästesaal, und nicht neben einer Wand. Das einzige solche Feld ist R3 C2. Edmund steht in der Bibliothek, nicht in Johns Spalte: R5 C1 oder R6 C1.",
      place: { J: { row: 2, col: 1 } },
    },
    {
      text: "Igraine steht adlig auf einem Teppich: in den Gästegemächern R4 C1 (Edmunds Spalte) oder R4 C2 (Johns Spalte) - also im Gästesaal, R11 C4 oder R11 C5.",
    },
    {
      text: "Holger ist allein mit der einzigen Person auf einem Bett. In den Gästegemächern wäre John dabei, also ist es der Schlafsaal: Holger steht auf R6 C10 oder R6 C11, die andere Person auf einem Bett. Edmund steht damit in R5 C1. Ambrose in einer Gartenecke: R5 C8 liegt in Edmunds Zeile, R5 C4 und R9 C8 sind Sträucher - R9 C4. Igraine steht in R11 C5.",
      place: {
        E: { row: 4, col: 0 },
        A: { row: 8, col: 3 },
        I: { row: 10, col: 4 },
      },
    },
    {
      text: "Cyrus steht in C11, also Holger in R6 C10. Die Betten im Schlafsaal außerhalb von C10 und R5 sind R4 C11 und R7 C11 - beide in C11. Die Person auf dem Bett ist Cyrus.",
      place: { H: { row: 5, col: 9 } },
    },
    {
      text: "Finnegan sitzt auf einem Stuhl: R1 C5 und R2 C5 liegen in Igraines Spalte, R3 C7 in Johns Zeile, R10 C10 in Holgers Spalte - es bleiben R1 C6 und R1 C7. Gilbert ist also nicht in R1, Bernard nicht in R4. Bernard in R8 hieße Gilbert in R5, in R7 Gilbert in R4 - dann fände Cyrus keine Zeile. Bernard steht in R10, Gilbert in R7, Cyrus in R4 C11.",
      place: { C: { row: 3, col: 10 } },
    },
    {
      text: "Frei sind C3, C6, C7, C8 und C9. Finnegan steht östlich von Bernard und Gilbert; säße er in C6, müssten beide in C3 stehen. Er sitzt in R1 C7, Gilbert und Bernard teilen C3 und C6: Gilbert in R7 C3 (R7 C6 ist ein Strauch), Bernard in R10 C6.",
      place: {
        F: { row: 0, col: 6 },
        G: { row: 6, col: 2 },
        B: { row: 9, col: 5 },
      },
    },
    {
      text: "Dunstan und Virgil bleiben R2 und R8 sowie C8 und C9; Dunstan steht östlich, also Virgil in C8 und Dunstan in C9. Bernard ist mit Gilbert schon zu zweit im Kreuzgang, also steht Dunstan nicht in R8 C9, sondern in R2 C9. Virgil steht in R8 C8 im Garten - allein mit Ambrose. Ambrose ist der Mörder!",
      place: { D: { row: 1, col: 8 }, V: { row: 7, col: 7 } },
    },
  ],
  solution: {
    A: { row: 8, col: 3 },
    B: { row: 9, col: 5 },
    C: { row: 3, col: 10 },
    D: { row: 1, col: 8 },
    E: { row: 4, col: 0 },
    F: { row: 0, col: 6 },
    G: { row: 6, col: 2 },
    H: { row: 5, col: 9 },
    I: { row: 10, col: 4 },
    J: { row: 2, col: 1 },
    V: { row: 7, col: 7 },
  },
};
