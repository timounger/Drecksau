/**
 * Der Laden des Goldsuchers: a river between two banks and a little shop,
 * an outlaw hiding among the prospectors and a murdered gold digger.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/19.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution). Victor
 * is the victim; whoever was alone with him killed him.
 *
 * **Who the outlaw is, is not printed.** Exactly one suspect is the outlaw,
 * it is not Victor, and the outlaw was beside a sack. Danika was with the
 * outlaw: somebody in her area other than herself stands beside a sack. A
 * field is in a corner of its area when the area's border runs along two of
 * its sides that meet: one above or below it, one to its left or right.
 * Boulders, sacks and the table cannot be stood on; the bed in the shop can.
 */
import { beside, counting, inArea, own, victim } from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The suspects who are said not to be the outlaw. */
const NOT_OUTLAWS: readonly string[] = ["V"];

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

/** Whether somebody may be the outlaw: not Victor, and beside a sack. */
function mayBeOutlaw(c: Context, id: string): boolean {
  const there = c.cellOf(id);
  return (
    !NOT_OUTLAWS.includes(id) && there !== undefined && c.beside(there, "sack")
  );
}

/** Whether Danika shares her area with somebody who may be the outlaw. */
function danikaWithOutlaw(c: Context): boolean {
  const danika = c.cellOf("D");
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      id !== "D" &&
      danika !== undefined &&
      there !== undefined &&
      c.areaOf(there) === c.areaOf(danika) &&
      mayBeOutlaw(c, id)
    );
  });
}

/** The case. */
export const THE_PROSPECTORS_SHOP: Level = {
  id: "the-prospectors-shop",
  name: "Der Laden des Goldsuchers",
  series: { book: "timeTravel", number: 19 },
  story:
    "Goldsucher ist ein recht sicherer Beruf - es sei denn, das ganze Dorf weiß, womit du dein Geld verdienst.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "F",
      name: "Fluss",
      at: "im Fluss",
      ground: "water",
      tint: "#b7dcef",
      label: { row: 5, col: 4 },
    },
    {
      key: "W",
      name: "Westufer",
      at: "am Westufer",
      ground: "grass",
      tint: "#e2ecb0",
      label: { row: 5, col: 0 },
    },
    {
      key: "O",
      name: "Ostufer",
      at: "am Ostufer",
      ground: "stone",
      tint: "#b8cdd2",
      label: { row: 2, col: 3 },
    },
    {
      key: "L",
      name: "Laden",
      at: "im Laden",
      ground: "floor",
      tint: "#f2e8c4",
      label: { row: 1, col: 5 },
    },
  ],
  areaMap: ["FFOOLL", "WFFOLL", "WFFOOO", "WWFFOO", "WWFFFO", "WWWFFF"],
  thingMap: ["....bb", "...ft.", "..f...", "......", ".....k", "..k..."],
  things: {
    b: "bed",
    f: "boulder",
    k: "sack",
    t: "table",
  },
  pieces: [{ at: { row: 0, col: 4 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Ace",
      pronoun: "er",
      clue: { text: "Er war im Laden.", ...inArea("L") },
      colour: "#b91c1c",
      face: "\u{1F920}",
    },
    {
      id: "B",
      name: "Bernard",
      pronoun: "er",
      clue: { text: "Er war am Ostufer.", ...inArea("O") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Clark",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke seines Bereichs.",
        ...own((c) => inCorner(c.areaOf, c.cell)),
      },
      colour: "#0e7490",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "D",
      name: "Danika",
      pronoun: "sie",
      clue: {
        text: "Sie war bei dem Gesetzlosen.",
        ...counting(danikaWithOutlaw),
      },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Emmett",
      pronoun: "er",
      clue: { text: "Er war neben einem Felsbrocken.", ...beside("boulder") },
      colour: "#a16207",
      face: "\u{1F474}",
    },
    {
      id: "V",
      name: "Victor",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Nicht der Gesetzlose. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F468}",
    },
  ],
  rules: [
    {
      text: "Es versteckt sich genau ein Gesetzloser unter den Verdächtigen. Der Gesetzlose kann der Mörder sein oder auch nicht.",
    },
    {
      text: "Der Gesetzlose war neben einem Sack.",
      check: (c) => c.people().some((id) => mayBeOutlaw(c, id)),
    },
  ],
  hints: [
    {
      text: "Der Gesetzlose war neben einem Sack, und Danika war bei ihm. Neben dem Sack am Westufer ist nur R6 C2 frei - dort passt niemand: Es ist keine Ecke für Clark, und Ace, Bernard und Emmett haben dort nichts zu suchen. Neben dem Sack am Ostufer ist R4 C6 frei, und dort passt nur Bernard. Bernard ist der Gesetzlose in R4 C6, und Danika ist bei ihm am Ostufer.",
      place: { B: { row: 3, col: 5 } },
    },
    {
      text: "Ace ist im Laden: R1 C6 und R2 C6 liegen in Bernards Spalte. Er steht in R1 C5.",
      place: { A: { row: 0, col: 4 } },
    },
    {
      text: "Danika ist am Ostufer, nicht in Aces Zeile R1 und nicht in Bernards Zeile R4: Es bleiben R3 C4 und R3 C5 - C5 ist Aces Spalte. Sie steht in R3 C4.",
      place: { D: { row: 2, col: 3 } },
    },
    {
      text: "Emmett steht neben einem Felsbrocken: R1 C4 ist Aces Zeile, R3 C2 Danikas, R4 C3 Bernards. Es bleibt R2 C3 im Fluss.",
      place: { E: { row: 1, col: 2 } },
    },
    {
      text: "Übrig sind R5 und R6 in C1 und C2, alles am Westufer. Eine Ecke ist dort nur R6 C1 - dort steht Clark. Victor steht in R5 C2, allein mit Clark. Clark ist der Mörder!",
      place: { C: { row: 5, col: 0 }, V: { row: 4, col: 1 } },
    },
  ],
  solution: {
    A: { row: 0, col: 4 },
    B: { row: 3, col: 5 },
    C: { row: 5, col: 0 },
    D: { row: 2, col: 3 },
    E: { row: 1, col: 2 },
    V: { row: 4, col: 1 },
  },
};
