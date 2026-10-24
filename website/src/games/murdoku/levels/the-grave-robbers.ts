/**
 * Die Grabräuber: a bank, the town square, a saloon, the cemetery and the
 * undertaker's hut, three outlaws hiding among the suspects and a murdered
 * woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/26.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Valeria is the victim; whoever was alone with her killed her. The case
 * plays in the Wild West, so there are no estates.
 *
 * **Who the outlaws are is not printed - it is part of the puzzle.** There
 * are exactly three, Valeria is none of them, and all of them were in the
 * cemetery. There was an outlaw exactly one column west of Brigham, and all
 * outlaws stood south of Della. The clues about the outlaws hold when some
 * choice of the three fits them all ({@link someGang}).
 *
 * The town square takes in the top row east of the bank and reaches round
 * the saloon down the right edge. Chairs and horses can be stood on; tables,
 * shelves, crates, sacks, the safe, barrels, tombstones, bushes and the
 * coffin cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  beside,
  column,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Who may be an outlaw: everybody but Valeria. */
const MAYBE_OUTLAWS: readonly string[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
];

/** Every choice of three outlaws. */
const GANGS: readonly (readonly string[])[] = MAYBE_OUTLAWS.flatMap(
  (first, at) =>
    MAYBE_OUTLAWS.slice(at + 1).flatMap((second, next) =>
      MAYBE_OUTLAWS.slice(at + next + 2).map((third) => [first, second, third]),
    ),
);

/** Whether every clue about the outlaws holds for this choice of them. */
function fits(c: Context, gang: readonly string[]): boolean {
  const brigham = c.cellOf("B");
  const della = c.cellOf("D");
  const cells = gang.map((id) => c.cellOf(id));
  return (
    brigham !== undefined &&
    della !== undefined &&
    cells.every(
      (there) =>
        there !== undefined && c.areaOf(there) === "F" && there.row > della.row,
    ) &&
    cells.some((there) => there?.col === brigham.col - 1)
  );
}

/** Whether some choice of the outlaws fits every clue about them. */
function someGang(c: Context): boolean {
  return GANGS.some((gang) => fits(c, gang));
}

/** The case. */
export const THE_GRAVE_ROBBERS: Level = {
  id: "the-grave-robbers",
  name: "Die Grabräuber",
  series: { book: "timeTravel", number: 26 },
  story: "Kann sein, dass wir für diesen Fall ganz tief graben müssen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "B",
      name: "Bank",
      at: "in der Bank",
      ground: "floor",
      tint: "#d9cde6",
      label: { row: 3, col: 0 },
    },
    {
      key: "P",
      name: "Platz",
      at: "auf dem Platz",
      ground: "stone",
      tint: "#e4e0ec",
      label: { row: 4, col: 3 },
    },
    {
      key: "S",
      name: "Saloon",
      at: "im Saloon",
      ground: "floor",
      tint: "#d9cde6",
      label: { row: 4, col: 7 },
    },
    {
      key: "F",
      name: "Friedhof",
      at: "auf dem Friedhof",
      ground: "grass",
      tint: "#b9d3dc",
      label: { row: 8, col: 1 },
    },
    {
      key: "K",
      name: "Hütte des Totengräbers",
      at: "in der Hütte des Totengräbers",
      ground: "floor",
      tint: "#cfc6dc",
      label: { row: 8, col: 5 },
      labelOverhang: true,
    },
  ],
  areaMap: [
    "BBBPPPPSS",
    "BBPPPPPSS",
    "BBPPPPPSS",
    "BBPPPPPSS",
    "FFFPPPPSS",
    "FFFFFPPPP",
    "FFFFFKPPP",
    "FFFFFKKPP",
    "FFFFFKKPP",
  ],
  thingMap: [
    "hhsxx..ct",
    "h......t.",
    "r.......b",
    "s..p..b..",
    "....bp.hs",
    ".g.....sp",
    ".s..gh...",
    "g.....o..",
    "p.ug.uo..",
  ],
  things: {
    b: "barrel",
    c: "chair",
    g: "tombstone",
    h: "shelf",
    o: "coffin",
    p: "horse",
    r: "safe",
    s: "sack",
    t: "table",
    u: "shrub",
    x: "woodCrate",
  },
  extraThings: {
    safe: { name: "Tresor", emoji: "\u{1F512}", standable: false },
    coffin: { name: "Sarg", emoji: "\u{26B0}\u{FE0F}", standable: false },
  },
  pieces: [{ at: { row: 7, col: 6 }, rows: 2, cols: 1 }],
  suspects: [
    {
      id: "A",
      name: "Archibald",
      pronoun: "er",
      clue: { text: "Er ritt auf einem Pferd.", ...on("horse") },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Brigham",
      pronoun: "er",
      clue: {
        text: "Genau eine Spalte westlich von ihm war ein Gesetzloser.",
        ...counting(someGang),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Cynthia",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fass.", ...beside("barrel") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Della",
      pronoun: "sie",
      clue: {
        text: "Alle Gesetzlosen waren südlich von ihr. Sie war neben einem Sack.",
        ...all(beside("sack"), counting(someGang)),
      },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Elizabeth",
      pronoun: "sie",
      clue: {
        text: "Sie war in der ersten oder der letzten Spalte.",
        ...own((c) => c.cell.col === 0 || c.cell.col === c.cols - 1),
      },
      colour: "#be185d",
      face: "\u{1F977}",
    },
    {
      id: "F",
      name: "Finn",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Regal oder einem Grabstein.",
        ...own(
          (c) => c.beside(c.cell, "shelf") || c.beside(c.cell, "tombstone"),
        ),
      },
      colour: "#a16207",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Grover",
      pronoun: "er",
      clue: {
        text: "Er war in der Hütte des Totengräbers.",
        ...inArea("K"),
      },
      colour: "#57534e",
      face: "\u{1F920}",
    },
    {
      id: "H",
      name: "Hartley",
      pronoun: "er",
      clue: { text: "Er war in der fünften Spalte.", ...column(5) },
      colour: "#7c3aed",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "V",
      name: "Valeria",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Keine Gesetzlose. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}‍\u{1F9B0}",
    },
  ],
  rules: [
    {
      text: "Es gab genau drei Gesetzlose. Alle Gesetzlosen waren auf dem Friedhof.",
      check: someGang,
    },
  ],
  hints: [
    {
      text: "Grover steht in der Hütte in C6: R8 C6 oder R9 C6 (der Sarg und das Regal belegen den Rest). Die drei Gesetzlosen stehen in drei verschiedenen Zeilen auf dem Friedhof, alle südlich von Della - Grovers Zeile fällt weg. Della steht also höchstens in R4 neben einem Sack: R4 C2 oder R4 C9 (der Sack in R1 C3 hat kein freies Feld daneben).",
    },
    {
      text: "Archibald reitet: R4 C4 liegt in Dellas Zeile, R5 C6 in Grovers Spalte - es bleiben R6 C9 und R9 C1. Angenommen, er reitet in R6 C9: Dann steht Della in R4 C2, und Elizabeth (nur noch C1) und Finn (R2 C2 und R4 C8 fallen weg) bleiben nur Felder auf dem Friedhof - beide wären Gesetzlose. In C3 hätte Finn nur R6 C3, Archibalds Zeile. Ist Hartley der dritte (R8 C5), braucht Brigham einen Gesetzlosen eine Spalte westlich: C2 und C6 gehören Della und Grover, also müsste Finn in C3 stehen. Ist Brigham der dritte, steht Hartley oben in C5, und Brigham in C3 oder C4 hätte westlich Della oder wieder Finn in C3. Beides geht nicht - Archibald reitet in R9 C1 als Gesetzloser, und Grover steht in R8 C6.",
      place: { A: { row: 8, col: 0 }, G: { row: 7, col: 5 } },
    },
    {
      text: "Elizabeth steht in C9 (C1 ist Archibalds Spalte), also nicht auf dem Friedhof. In R1 sind nur R1 C6 bis R1 C8 frei - dahin kommt nur Brigham oder Valeria. Brigham hätte dort keinen Gesetzlosen eine Spalte westlich (der Friedhof endet in C5, C6 ist Grovers Spalte). Valeria steht in R1 C7 oder R1 C8.",
    },
    {
      text: "C7 bis C9 brauchen drei Leute: Valeria, Elizabeth und einen von Cynthia, Della (R4 C9) und Brigham. Della in C9 nähme Elizabeth die Spalte. Brigham dort wäre kein Gesetzloser, Cynthia stünde in R5 C4, Della in R4 C2 und Finn in C3 - nur R6 C3; dann wären Finn und Hartley die Gesetzlosen, Hartley in R6 C5, in Finns Zeile. Also steht Della in R4 C2, Cynthia in C7 oder C8, und Brigham und Finn teilen sich C3 und C4.",
      place: { D: { row: 3, col: 1 } },
    },
    {
      text: "Brigham in C3 hätte Della westlich von sich, keine Gesetzlose. Brigham steht in C4 und Finn in C3 - in R6 C3, als Gesetzloser. Hartley kann nicht mehr in R6 C5 oder R8 C5 stehen; er steht oben, ist kein Gesetzloser, und Brigham ist der dritte: auf dem Friedhof in C4 bleibt nur R7 C4.",
      place: { F: { row: 5, col: 2 }, B: { row: 6, col: 3 } },
    },
    {
      text: "Elizabeth steht in C9: R6 C9 und R7 C9 liegen in besetzten Zeilen, also R2 C9. Hartley steht in R3 C5, Cynthia neben einem Fass in R5 C7 und Valeria in R1 C8 - im Saloon allein mit Elizabeth. Elizabeth ist die Mörderin!",
      place: {
        E: { row: 1, col: 8 },
        H: { row: 2, col: 4 },
        C: { row: 4, col: 6 },
        V: { row: 0, col: 7 },
      },
    },
  ],
  solution: {
    A: { row: 8, col: 0 },
    B: { row: 6, col: 3 },
    C: { row: 4, col: 6 },
    D: { row: 3, col: 1 },
    E: { row: 1, col: 8 },
    F: { row: 5, col: 2 },
    G: { row: 7, col: 5 },
    H: { row: 2, col: 4 },
    V: { row: 0, col: 7 },
  },
};
