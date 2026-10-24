/**
 * Der Bahnhof: a general store, a barber's shop, a butcher's, the town
 * square with the tracks, the platform and the station hall, two outlaws
 * hiding among the suspects and a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/25.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Vanessa is the victim; whoever was alone with her killed her. The case
 * plays in the Wild West, so there are no estates.
 *
 * **Who the outlaws are is not printed.** There are exactly two, Vanessa is
 * none of them, and both stood beside a cash register - so at least two
 * people other than Vanessa did ({@link twoBesideRegisters}).
 *
 * The town square reaches from the middle of the map over the tracks down
 * the right edge. A field is in a corner of its area when the area's border
 * runs along two of its sides that meet. Chairs, horses and the tracks can
 * be stood on; tables, shelves, sacks, cash registers and the hay bale
 * cannot.
 */
import {
  about,
  alone,
  all,
  cellsWhere,
  counting,
  inArea,
  not,
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

/** Whether two people other than Vanessa - the outlaws - stood beside a cash register. */
function twoBesideRegisters(c: Context): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return (
        id !== "V" && there !== undefined && c.beside(there, "cashRegister")
      );
    }).length >= 2
  );
}

/** Whether a man other than Calvin sat on a chair in the barber's shop. */
function manSeatedInBarbers(c: Context): boolean {
  return c.peopleIn("B").some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      c.has(id, "man") &&
      there !== undefined &&
      c.is(there, "chair")
    );
  });
}

/** Who was alone, as their clues say. */
const LONERS: readonly string[] = ["E", "F"];

/**
 * For the solver: whether nobody yet shares an area with Elise or Frances,
 * who were alone, and nobody but one shares it with Vanessa.
 *
 * @param c - the context, with the people placed so far
 * @returns false when the placement can no longer be finished
 */
function stillPossible(c: Context): boolean {
  const crowd = (id: string) => {
    const there = c.cellOf(id);
    return there === undefined ? 0 : c.peopleIn(c.areaOf(there) ?? "").length;
  };
  const placed = c.people();
  const open = c.level.suspects.filter(
    (one) => one.id !== "V" && !placed.includes(one.id),
  ).length;
  const besides = placed.filter((id) => {
    const there = c.cellOf(id);
    return id !== "V" && there !== undefined && c.beside(there, "cashRegister");
  }).length;
  return (
    LONERS.every((id) => crowd(id) <= 1) &&
    crowd("V") <= 2 &&
    besides + open >= 2
  );
}

/** The case. */
export const THE_TRAIN_STATION: Level = {
  id: "the-train-station",
  name: "Der Bahnhof",
  series: { book: "timeTravel", number: 25 },
  story:
    "Der Tod hält sich an keinen Fahrplan. Diese Eisenbahn übrigens auch nicht.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "T",
      name: "Gemischtwarenladen",
      at: "im Gemischtwarenladen",
      ground: "floor",
      tint: "#e9ecc4",
      label: { row: 4, col: 0 },
      labelOverhang: true,
    },
    {
      key: "B",
      name: "Barbier",
      at: "beim Barbier",
      ground: "floor",
      tint: "#eef1d8",
      label: { row: 2, col: 4 },
    },
    {
      key: "M",
      name: "Metzgerei",
      at: "in der Metzgerei",
      ground: "floor",
      tint: "#e9ecc4",
      label: { row: 3, col: 7 },
    },
    {
      key: "P",
      name: "Dorfplatz",
      at: "auf dem Dorfplatz",
      ground: "path",
      tint: "#f0d4cf",
      label: { row: 5, col: 2 },
    },
    {
      key: "A",
      name: "Bahnsteig",
      at: "auf dem Bahnsteig",
      ground: "floor",
      tint: "#e2c6cc",
      label: { row: 7, col: 3 },
    },
    {
      key: "S",
      name: "Bahnhofshalle",
      at: "in der Bahnhofshalle",
      ground: "floor",
      tint: "#cdbbdb",
      label: { row: 8, col: 3 },
    },
  ],
  areaMap: [
    "TTTBBBMMM",
    "TTTBBBMMM",
    "TTTBBBMMM",
    "TTPPPPMMM",
    "TTPPPPPPP",
    "PPPPPPPPP",
    "AAAAAAAAP",
    "AAAASSSSP",
    "SSSSSSSSS",
  ],
  thingMap: [
    ".s.ttt.ht",
    "k.hc.cs.t",
    "t.h..c.kt",
    "..p......",
    "h....p..y",
    "rrrrrrrrr",
    "....c..p.",
    "ccc.ckt..",
    ".c.c.ct.s",
  ],
  things: {
    c: "chair",
    h: "shelf",
    k: "cashRegister",
    p: "horse",
    r: "rails",
    s: "sack",
    t: "table",
    y: "hay",
  },
  extraThings: {
    cashRegister: { name: "Kasse", emoji: "\u{1F4B5}", standable: false },
    rails: { name: "Gleise", emoji: "\u{1F6E4}\u{FE0F}", standable: true },
  },
  pieces: [
    { at: { row: 0, col: 3 }, rows: 1, cols: 3 },
    { at: { row: 0, col: 8 }, rows: 3, cols: 1 },
    { at: { row: 5, col: 0 }, rows: 1, cols: 9 },
    { at: { row: 7, col: 6 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Aurora",
      pronoun: "sie",
      clue: { text: "Sie ritt auf einem Pferd.", ...on("horse") },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bradford",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#15803d",
      face: "\u{1F474}",
    },
    {
      id: "C",
      name: "Calvin",
      pronoun: "er",
      clue: {
        text: "Er war beim Barbier bei einem Mann, der auf einem Stuhl saß.",
        ...all(inArea("B"), counting(manSeatedInBarbers)),
      },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Diego",
      pronoun: "er",
      clue: {
        text: "Er war nördlich von Frances.",
        ...about(["F"], (c) => {
          const frances = c.cellOf("F");
          return frances !== undefined && c.cell.row < frances.row;
        }),
      },
      colour: "#a16207",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Elise",
      pronoun: "sie",
      clue: {
        text: "Sie war allein in der Bahnhofshalle. Sie saß nicht auf einem Stuhl.",
        ...all(inArea("S"), alone(), not(on("chair"))),
      },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "F",
      name: "Frances",
      pronoun: "sie",
      clue: {
        text: "Sie war allein. Sie war nördlich von Bradford.",
        ...all(
          alone(),
          about(["B"], (c) => {
            const bradford = c.cellOf("B");
            return bradford !== undefined && c.cell.row < bradford.row;
          }),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "Gustav",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke seines Bereichs.",
        ...own((c) => inCorner(c.areaOf, c.cell)),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#57534e",
      face: "\u{1F920}",
    },
    {
      id: "H",
      name: "Harold",
      pronoun: "er",
      clue: {
        text: "Er war nicht auf dem Dorfplatz.",
        ...not(inArea("P")),
      },
      colour: "#6366f1",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "V",
      name: "Vanessa",
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
      text: "Es gab genau zwei Gesetzlose. Beide waren neben einer Kasse.",
      check: twoBesideRegisters,
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Beim Barbier füllt die Theke ganz R1, es bleiben R2 und R3. Calvin ist dort mit einem sitzenden Mann - die beiden belegen R2 und R3. Elise ist allein in der Bahnhofshalle, und R9 gehört ganz zur Halle: Elise steht in R9, und in R8 steht jemand auf dem Bahnsteig (R8 C1 bis C4).",
    },
    {
      text: "Die zwei Gesetzlosen stehen neben einer Kasse. R2 C2, R2 C8 und R3 C7 liegen in den Zeilen der Barbier-Leute, R8 C5 und R9 C6 sind Stühle in der Halle, wo nur Elise ist - und sie sitzt nicht. Es bleiben genau R1 C1 und R4 C8: Dort stehen die beiden Gesetzlosen.",
    },
    {
      text: "Aurora reitet: R4 C3 liegt in der Zeile von R4 C8, R7 C8 in dessen Spalte. Aurora reitet in R5 C6. Frances war allein und hat Diego nördlich von sich, steht also nicht in R1. Beim Barbier sind zwei, in der Halle ist Elise, auf dem Dorfplatz Aurora; R5 C2 teilt sie mit R1 C1, R7 auf dem Bahnsteig mit R8, und in R8 müsste Bradford südlich von ihr in der Halle sitzen. Frances steht in R4 C8.",
      place: { A: { row: 4, col: 5 }, F: { row: 3, col: 7 } },
    },
    {
      text: "Beim Barbier liegen R2 C6 und R3 C6 in Auroras Spalte: Der sitzende Mann sitzt in R2 C4, Calvin steht in R3 C5. Bradford sitzt südlich von Frances, also auf dem Bahnsteig: R7 C5 ist Calvins Spalte, R8 C1 die Spalte von R1 C1. Elise steht in R9 nicht auf einem Stuhl: R9 C1, R9 C5 und R9 C8 liegen in besetzten Spalten, also R9 C3. R8 C3 liegt in ihrer Spalte - Bradford sitzt in R8 C2.",
      place: {
        C: { row: 2, col: 4 },
        E: { row: 8, col: 2 },
        B: { row: 7, col: 1 },
      },
    },
    {
      text: "Übrig sind R1 C1, der Stuhl in R2 C4 sowie R6 und R7 in C7 oder C9. Diego ist nördlich von Frances, also oben. Gustav steht in einer Ecke seines Bereichs: R2 C4, R6 C7, R6 C9, R7 C7 und R7 C9 sind keine - er steht in R1 C1, Diego sitzt in R2 C4.",
      place: { G: { row: 0, col: 0 }, D: { row: 1, col: 3 } },
    },
    {
      text: "Harold ist nicht auf dem Dorfplatz, und R6 gehört ganz dazu: Harold steht in R7 C7 auf dem Bahnsteig, Vanessa in R6 C9 auf dem Dorfplatz - allein mit Aurora. Aurora ist die Mörderin!",
      place: { H: { row: 6, col: 6 }, V: { row: 5, col: 8 } },
    },
  ],
  solution: {
    A: { row: 4, col: 5 },
    B: { row: 7, col: 1 },
    C: { row: 2, col: 4 },
    D: { row: 1, col: 3 },
    E: { row: 8, col: 2 },
    F: { row: 3, col: 7 },
    G: { row: 0, col: 0 },
    H: { row: 6, col: 6 },
    V: { row: 5, col: 8 },
  },
};
