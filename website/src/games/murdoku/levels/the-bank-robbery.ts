/**
 * Der Banküberfall: a storeroom, the manager's office, a hall, a porch, the
 * vault and the street outside, three outlaws hiding among the suspects and
 * a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/24.png`, no solution
 * sheet - the culprit is noted in pencil next to the photographed page, and
 * the solver proves the only solution). Vito is the victim; whoever was alone
 * with him killed him. The case plays in the Wild West, so there are no
 * estates.
 *
 * **Who the outlaws are is not printed - it is part of the puzzle.** There
 * are exactly three, neither Cooper nor Vito is one, and every outlaw was
 * alone with somebody who is no outlaw. Cooper was not with an outlaw, and
 * Francesca stood north of two outlaws and south of a woman who is one. The
 * clues about the outlaws hold when some choice of the three fits them all
 * ({@link someGang}).
 *
 * A field is beside a wall when one of its sides lies on an area border or
 * on the map's edge. Horses can be stood on; tables, shelves, money bags,
 * the cash register, the safes, dynamite and cacti cannot.
 */
import {
  about,
  alone,
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  own,
  row,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** Who may be an outlaw: everybody but Cooper and Vito. */
const MAYBE_OUTLAWS: readonly string[] = ["A", "B", "D", "E", "F", "G", "H"];

/** Every choice of three outlaws. */
const GANGS: readonly (readonly string[])[] = MAYBE_OUTLAWS.flatMap(
  (first, at) =>
    MAYBE_OUTLAWS.slice(at + 1).flatMap((second, next) =>
      MAYBE_OUTLAWS.slice(at + next + 2).map((third) => [first, second, third]),
    ),
);

/** The four steps to a field's neighbours. */
const STEPS: readonly Cell[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/** Whether one of a field's sides lies on an area border or the map's edge. */
function besideWall(c: Context): boolean {
  return STEPS.some((step) => {
    const next = { row: c.cell.row + step.row, col: c.cell.col + step.col };
    return !c.inside(next) || c.areaOf(next) !== c.areaOf(c.cell);
  });
}

/** The people in somebody's area, without them. */
function companyOf(c: Context, id: string): readonly string[] {
  const there = c.cellOf(id);
  return there === undefined
    ? []
    : c.peopleIn(c.areaOf(there) ?? "").filter((other) => other !== id);
}

/** Whether every clue about the outlaws holds for this choice of them. */
function fits(c: Context, gang: readonly string[]): boolean {
  const francesca = c.cellOf("F");
  const rowOf = (id: string) => c.cellOf(id)?.row ?? -1;
  return (
    francesca !== undefined &&
    gang.every((id) => {
      const company = companyOf(c, id);
      return company.length === 1 && !gang.includes(company[0] ?? "");
    }) &&
    !companyOf(c, "C").some((id) => gang.includes(id)) &&
    gang.filter((id) => rowOf(id) > francesca.row).length === 2 &&
    gang.some((id) => c.has(id, "woman") && rowOf(id) < francesca.row)
  );
}

/** Whether some choice of the outlaws fits every clue about them. */
function someGang(c: Context): boolean {
  return GANGS.some((gang) => fits(c, gang));
}

/** Whether a field is a corner of the grid. */
function inGridCorner(c: Context): boolean {
  return (
    (c.cell.row === 0 || c.cell.row === c.rows - 1) &&
    (c.cell.col === 0 || c.cell.col === c.cols - 1)
  );
}

/** Whether somebody rode a horse. */
function somebodyRides(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "horse");
  });
}

/** The case. */
export const THE_BANK_ROBBERY: Level = {
  id: "the-bank-robbery",
  name: "Der Banküberfall",
  series: { book: "timeTravel", number: 24 },
  story: "Eine Art, das tägliche Abhebelimit deines Kontos zu erhöhen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "L",
      name: "Lager",
      at: "im Lager",
      ground: "floor",
      tint: "#cfc9c9",
      label: { row: 1, col: 0 },
    },
    {
      key: "D",
      name: "Büro des Direktors",
      at: "im Büro des Direktors",
      ground: "floor",
      tint: "#e2dfe3",
      label: { row: 2, col: 3 },
    },
    {
      key: "V",
      name: "Schalterhalle",
      at: "in der Schalterhalle",
      ground: "floor",
      tint: "#dad5d8",
      label: { row: 4, col: 5 },
    },
    {
      key: "P",
      name: "Veranda",
      at: "auf der Veranda",
      ground: "stone",
      tint: "#e0dfdc",
      label: { row: 5, col: 7 },
    },
    {
      key: "T",
      name: "Tresorraum",
      at: "im Tresorraum",
      ground: "stone",
      tint: "#e8c7c7",
      label: { row: 8, col: 1 },
    },
    {
      key: "A",
      name: "Draußen",
      at: "draußen",
      ground: "sand",
      tint: "#f1e3a6",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "LLDDDDDDD",
    "LLDDDDDDD",
    "VVVDDDDDP",
    "VVVVVVVVP",
    "VVVVVVVVP",
    "VVVVPPPPP",
    "TTTTAAAAA",
    "TTTTAAAAA",
    "TTTTAAAAA",
  ],
  thingMap: [
    "..s.s.t..",
    ".s....t..",
    "b.s....b.",
    "........p",
    "kttts....",
    "..bt.....",
    "b...xc...",
    ".rr...xc.",
    "...x.p..p",
  ],
  things: {
    b: "sack",
    c: "cactus",
    k: "cashRegister",
    p: "horse",
    r: "safe",
    s: "shelf",
    t: "table",
    x: "dynamite",
  },
  extraThings: {
    cashRegister: { name: "Kasse", emoji: "\u{1F4B5}", standable: false },
    safe: { name: "Tresor", emoji: "\u{1F512}", standable: false },
    // The money bags, drawn like the sacks of the other cases.
    sack: { name: "Geldsack", emoji: "\u{1F4B0}", standable: false },
  },
  pieces: [{ at: { row: 0, col: 6 }, rows: 2, cols: 1 }],
  // The counter in the hall, round a corner.
  shapes: [
    [
      { row: 4, col: 1 },
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 5, col: 3 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Andy",
      pronoun: "er",
      clue: {
        text: "Er ritt nicht auf einem Pferd, aber mindestens eine Person tat es.",
        ...all(not(on("horse")), counting(somebodyRides)),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Betty",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Tisch. Sie war genau eine Spalte östlich von Andy.",
        ...all(
          beside("table"),
          about(["A"], (c) => {
            const andy = c.cellOf("A");
            return andy !== undefined && c.cell.col === andy.col + 1;
          }),
        ),
      },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Cooper",
      pronoun: "er",
      clue: {
        text: "Kein Gesetzloser. Er war nicht bei einem Gesetzlosen.",
        ...counting(someGang),
      },
      colour: "#0e7490",
      face: "\u{1F474}",
    },
    {
      id: "D",
      name: "Dave",
      pronoun: "er",
      clue: { text: "Er war neben einem Geldsack.", ...beside("sack") },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Elliot",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke des Rasters.",
        ...own(inGridCorner),
      },
      colour: "#a16207",
      face: "\u{1F935}",
    },
    {
      id: "F",
      name: "Francesca",
      pronoun: "sie",
      clue: {
        text: "Sie war nördlich von zwei Gesetzlosen und südlich einer Gesetzlosen.",
        ...counting(someGang),
      },
      colour: "#be185d",
      face: "\u{1F475}",
    },
    {
      id: "G",
      name: "Gabriella",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einer Wand. Sie war allein.",
        ...all(not(own(besideWall)), alone()),
      },
      colour: "#7c3aed",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "H",
      name: "Hank",
      pronoun: "er",
      clue: {
        text: "Er war im Büro des Direktors in der obersten Zeile.",
        ...all(inArea("D"), row(1)),
      },
      colour: "#57534e",
      face: "\u{1F9D3}",
    },
    {
      id: "V",
      name: "Vito",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Kein Gesetzloser. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}‍\u{1F9B1}",
    },
  ],
  rules: [
    {
      text: "Es gab genau drei Gesetzlose. Jeder Gesetzlose war allein mit jemandem, der kein Gesetzloser war.",
      check: someGang,
    },
  ],
  hints: [
    {
      text: "Gabriella war allein - also ist sie keine Gesetzlose, denn jeder Gesetzlose war mit genau einer anderen Person zusammen. Die Gesetzlose nördlich von Francesca ist also Betty. Hank steht in R1, also steht Elliot in einer unteren Ecke: R9 C1 oder R9 C9. Gabriella steht nicht neben einer Wand und nicht bei Hank im Büro: Es bleiben R4 C2, R4 C3 und R8 C6.",
    },
    {
      text: "Stünde Betty in der Schalterhalle, wäre Gabriella allein draußen in R8 C6, und nur noch das Pferd in R4 C9 auf der Veranda könnte jemand reiten. Betty stünde dann neben der Theke in R6 C2 (R4 ist die Zeile des Reiters), Francesca südlich von ihr in R7 - und südlich von Francesca wären nur Gabriella und Elliot, kein zweiter Gesetzloser. Betty ist also im Büro des Direktors, allein mit Hank.",
    },
    {
      text: "Stünde Gabriella allein in der Schalterhalle (R4), bliebe für R5 nur R5 C9 und für R3 nur Betty im Büro. Elliot stünde dann in R9 C1 (C9 ist besetzt), und kein Pferd wäre mehr frei: R4 C9 und R9 C9 liegen in C9, R9 C6 in Elliots Zeile. Aber Andy sagt, jemand ritt. Gabriella steht also in R8 C6, allein draußen - und Elliot in R9 C1.",
      place: { G: { row: 7, col: 5 }, E: { row: 8, col: 0 } },
    },
    {
      text: "Draußen ist nur Gabriella, also reitet jemand das Pferd in R4 C9. Dave steht neben einem Geldsack: R4 C1 ist die Zeile des Reiters, R8 C1 Gabriellas, ins Büro passt niemand mehr - es bleiben R3 C2, R6 C2 und R7 C2. Betty steht in R2 oder R3, und in der anderen Zeile ist nur noch das Lager (C1, C2) oder R3 C2 frei. C1 gehört Elliot, C2 Dave: Dave steht in R3 C2, Betty in R2. R2 C6 ist Gabriellas Spalte, also steht Betty in R2 C8 und Hank in R1 C4.",
      place: {
        D: { row: 2, col: 1 },
        B: { row: 1, col: 7 },
        H: { row: 0, col: 3 },
      },
    },
    {
      text: "Francesca steht südlich von Betty, also unterhalb von Dave in R3 - die zwei Gesetzlosen südlich von ihr sind Andy und Elliot. Andy steht eine Spalte westlich von Betty in C7: R5 C7 oder R6 C7. Francesca steht nördlich von ihm, also in R4 auf dem Pferd oder in R5. In R5 stünde Andy auf der Veranda bei dem Reiter, und für Cooper und Vito blieben das Pferd und R7 im Tresorraum bei Elliot - Cooper wäre bei einem Gesetzlosen. Francesca reitet also in R4 C9.",
      place: { F: { row: 3, col: 8 } },
    },
    {
      text: "In R7 steht jemand im Tresorraum bei Elliot, einem Gesetzlosen - das kann nicht Cooper sein. Vito steht in R7 C3. Cooper bleibt nur C5: R6 C5 auf der Veranda, und Andy steht in R5 C7. Vito war allein mit Elliot. Elliot ist der Mörder!",
      place: {
        V: { row: 6, col: 2 },
        C: { row: 5, col: 4 },
        A: { row: 4, col: 6 },
      },
    },
  ],
  solution: {
    A: { row: 4, col: 6 },
    B: { row: 1, col: 7 },
    C: { row: 5, col: 4 },
    D: { row: 2, col: 1 },
    E: { row: 8, col: 0 },
    F: { row: 3, col: 8 },
    G: { row: 7, col: 5 },
    H: { row: 0, col: 3 },
    V: { row: 6, col: 2 },
  },
};
