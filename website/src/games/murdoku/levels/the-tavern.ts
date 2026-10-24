/**
 * Die Taverne: kitchen, cellar, taproom, guest room and two royal chambers
 * of an inn, with a murdered noblewoman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/10.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Valeria is the victim; whoever was alone with her killed her.
 *
 * The map is nine by nine with fields missing at the top left and top right.
 * Beds and chairs can be stood on; tables and barrels
 * cannot. A field is in a corner of its
 * area when the area's border runs along two of its sides that meet
 * ({@link inCorner}).
 *
 * The book's estates: nobles (purple cards: Camilla, Fabian, Valeria) only
 * in the crowned royal chambers, villagers (wooden cards: Alric, Benjamin,
 * Dulcie, Eloise) only in the other areas, knights (grey shields: Giselle,
 * Hank) anywhere.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  alone,
  all,
  beside,
  cellsWhere,
  column,
  counting,
  not,
  on,
  own,
  ranks,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** The nobles, for Camilla's clue. */
const NOBLES: readonly string[] = ["C", "F", "V"];

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

/** Everybody standing on a thing of this id. */
function peopleOn(c: Context, what: string): readonly string[] {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  });
}

/** Whether the only person on a chair is somebody else in the suspect's area. */
function withTheOneOnAChair(c: Context): boolean {
  const seated = peopleOn(c, "chair");
  const one = seated[0];
  const there = one === undefined ? undefined : c.cellOf(one);
  return (
    seated.length === 1 &&
    one !== c.self &&
    there !== undefined &&
    c.areaOf(there) === c.areaOf(c.cell)
  );
}

/** Whether a noble stood exactly this many rows from the suspect. */
function nobleRowsAway(c: Context, rows: number): boolean {
  return NOBLES.some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self && there !== undefined && there.row === c.cell.row + rows
    );
  });
}

/** The case. */
export const THE_TAVERN: Level = {
  id: "the-tavern",
  name: "Die Taverne",
  series: { book: "timeTravel", number: 10 },
  story:
    "Der Barde singt wirklich gut, aber für eine Zugabe ist jetzt nicht der richtige Moment.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#d6e3ec",
      label: { row: 1, col: 4 },
    },
    {
      key: "B",
      name: "Keller",
      at: "im Keller",
      ground: "stone",
      tint: "#b4c0d0",
      label: { row: 2, col: 6 },
    },
    {
      key: "R",
      name: "Schankraum",
      at: "im Schankraum",
      ground: "floor",
      tint: "#ddd6cc",
      label: { row: 5, col: 0 },
    },
    {
      key: "A",
      name: "Königliches Gemach A",
      at: "im Königlichen Gemach A",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 8, col: 0 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#c9cec6",
      label: { row: 8, col: 4 },
    },
    {
      key: "Q",
      name: "Königliches Gemach B",
      at: "im Königlichen Gemach B",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    ".KKKKKBB.",
    ".RRKKKBB.",
    ".RRRRRBB.",
    "RRRRRRRQQ",
    "RRRRRRRQQ",
    "RRRRRRRQQ",
    "AAARRRRQQ",
    "AAAAGGGQQ",
    "AAAAGGGQQ",
  ],
  thingMap: [
    ".t..tto..",
    "...o.o...",
    ".o.tct...",
    "..ctctt.c",
    "c.....c..",
    "..ttt....",
    "btb.cttb.",
    "bcb..b.b.",
    ".....b...",
  ],
  things: {
    b: "bed",
    c: "chair",
    o: "barrel",
    t: "table",
  },
  pieces: [
    { at: { row: 0, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 2 }, rows: 1, cols: 3 },
    { at: { row: 6, col: 5 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 7 }, rows: 2, cols: 1 },
  ],
  shapes: [
    [
      { row: 2, col: 5 },
      { row: 3, col: 5 },
      { row: 3, col: 6 },
    ],
  ],
  suspects: [
    {
      id: "A",
      traits: ["villager"],
      name: "Alric",
      pronoun: "er",
      clue: {
        text: "Er und die einzige Person, die auf einem Stuhl saß, waren im selben Bereich.",
        ...counting(withTheOneOnAChair),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      traits: ["villager"],
      name: "Benjamin",
      pronoun: "er",
      clue: {
        text: "Er war in der fünften Spalte. Er saß nicht auf einem Stuhl.",
        ...all(column(5), not(on("chair"))),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      traits: ["noble"],
      name: "Camilla",
      pronoun: "sie",
      clue: {
        text: "Eine Zeile nördlich und eine Zeile südlich von ihr waren Adlige.",
        ...about(NOBLES, (c) => nobleRowsAway(c, -1) && nobleRowsAway(c, 1)),
      },
      colour: "#7c3aed",
      face: "\u{1F478}",
    },
    {
      id: "D",
      traits: ["villager"],
      name: "Dulcie",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einem Tisch.",
        ...not(beside("table")),
      },
      colour: "#a16207",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "E",
      traits: ["villager"],
      name: "Eloise",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fass.", ...beside("barrel") },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      traits: ["noble"],
      name: "Fabian",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Bett.",
        ...all(
          on("bed"),
          counting((c) => peopleOn(c, "bed").length === 1),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F934}",
    },
    {
      id: "G",
      traits: ["knight"],
      name: "Giselle",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke ihres Bereichs.",
        ...own((c) => inCorner(c.areaOf, c.cell)),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#0e7490",
      face: "\u{1F482}‍♀️",
    },
    {
      id: "H",
      traits: ["knight"],
      name: "Hank",
      pronoun: "er",
      clue: { text: "Er war allein.", ...alone() },
      colour: "#57534e",
      face: "\u{1F482}",
    },
    {
      id: "V",
      traits: ["noble"],
      name: "Valeria",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#334155",
      face: "\u{1F469}",
    },
  ],
  rules: [
    ranks(
      "Adlige (\u{1F451}) waren nur in den königlichen Gemächern, Dorfbewohner nur in den anderen Bereichen, Ritter überall.",
      ["A", "Q"],
    ),
  ],
  hints: [
    {
      text: "Alric ist Dorfbewohner und mit der einzigen sitzenden Person im selben Bereich. Stühle außerhalb der Gemächer gibt es nur im Schankraum - dort sind beide, also ist Hank (allein) nie im Schankraum. In C6 sind nur R5 C6 und R6 C6 im Schankraum frei: Giselle fände keine Ecke, Dulcie stünde neben einem Tisch, Eloise neben keinem Fass. Alric steht in C6.",
    },
    {
      text: "Wer sitzt auf dem Stuhl im Schankraum? Nicht Alric, nicht Benjamin, nicht Hank, keine Adlige; Eloise findet keinen Stuhl neben einem Fass, Giselle keinen in einer Ecke. Es ist Dulcie - und nicht neben einem Tisch geht nur R5 C1. Alric steht damit in R6 C6.",
      place: { D: { row: 4, col: 0 }, A: { row: 5, col: 5 } },
    },
    {
      text: "Camilla hat Adlige eine Zeile über und unter sich: Die drei Adligen stehen in drei Zeilen nacheinander, ab R4 - R5 und R6 sind besetzt, also R7 bis R9 mit Camilla in R8. Benjamin in C5: R2 C5 ist das einzige freie Feld ohne Stuhl und Tisch.",
      place: { B: { row: 1, col: 4 } },
    },
    {
      text: "Eloise, Giselle und Hank teilen sich R1, R3 und R4. In R4 bleiben R4 C2 und R4 C8. Stünde Eloise in R4 C2, müssten Giselle und Hank in R1 und R3 stehen: Hank allein nur im Keller, und Giselles Ecken dort (R1 C8, R3 C7, R3 C8) liegen auch im Keller. Also steht jemand in R4 C8.",
    },
    {
      text: "Hank allein in R4 C8 hieße: keine Adligen im Königlichen Gemach B, alle drei in Gemach A - Valeria wäre nicht allein mit einer Person. Giselle steht in R4 C8. Hank ist allein im Keller, nicht in C8: R3 C7. Eloise neben einem Fass in R1: R1 C4.",
      place: {
        G: { row: 3, col: 7 },
        H: { row: 2, col: 6 },
        E: { row: 0, col: 3 },
      },
    },
    {
      text: "Fabian liegt in R7 auf einem Bett: R7 C1 und R7 C8 liegen in besetzten Spalten - R7 C3. Camilla in R8: R8 C2 ist ein Stuhl, R8 C4 Eloises Spalte - R8 C9. Valeria steht in R9 C2, allein mit Fabian. Fabian ist der Mörder!",
      place: {
        F: { row: 6, col: 2 },
        C: { row: 7, col: 8 },
        V: { row: 8, col: 1 },
      },
    },
  ],
  solution: {
    A: { row: 5, col: 5 },
    B: { row: 1, col: 4 },
    C: { row: 7, col: 8 },
    D: { row: 4, col: 0 },
    E: { row: 0, col: 3 },
    F: { row: 6, col: 2 },
    G: { row: 3, col: 7 },
    H: { row: 2, col: 6 },
    V: { row: 8, col: 1 },
  },
};
