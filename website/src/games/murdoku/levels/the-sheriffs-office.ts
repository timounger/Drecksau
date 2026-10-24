/**
 * Das Büro des Sheriffs: two cells, an armoury, an office, a hall and a
 * porch, three outlaws hiding among the suspects and a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/22.png`, no solution
 * sheet - the culprit is pencilled in on the photographed page, and the
 * solver proves it is the only solution). Vidal is the victim; whoever was
 * alone with him killed him. The case plays in the Wild West, so there are
 * no estates.
 *
 * **Who the outlaws are is only partly printed - it is part of the puzzle.**
 * There are exactly three; Abel is one of them, Harry and Vidal are not.
 * Every outlaw was alone with somebody who is no outlaw. Benito stood south
 * of exactly one outlaw, and Georgia was in the hall with an outlaw. The
 * clues about the outlaws hold when some choice of the three fits them all
 * ({@link fittingGangs}).
 *
 * The map is nine by nine; the bottom row only has the porch. Chairs, rugs
 * and horses can be stood on; tables, shelves, crates and safes cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  column,
  counting,
  inArea,
  not,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Who is an outlaw for certain, as his clue says. */
const SURE_OUTLAW = "A";

/** Who may be one of the other two outlaws. */
const MAYBE_OUTLAWS: readonly string[] = ["B", "C", "D", "E", "F", "G"];

/** Every choice of the three outlaws the printed clues allow. */
const GANGS: readonly (readonly string[])[] = MAYBE_OUTLAWS.flatMap(
  (first, at) =>
    MAYBE_OUTLAWS.slice(at + 1).map((second) => [SURE_OUTLAW, first, second]),
);

/** Whether somebody shares their area with exactly one person, no outlaw. */
function aloneWithHonest(
  c: Context,
  id: string,
  gang: readonly string[],
): boolean {
  const there = c.cellOf(id);
  const company =
    there === undefined
      ? []
      : c.peopleIn(c.areaOf(there) ?? "").filter((other) => other !== id);
  return company.length === 1 && !gang.includes(company[0] ?? "");
}

/** Whether exactly one outlaw stands in a row north of Benito. */
function southOfOneOutlaw(c: Context, gang: readonly string[]): boolean {
  const benito = c.cellOf("B");
  return (
    benito !== undefined &&
    gang.filter((id) => (c.cellOf(id)?.row ?? benito.row) < benito.row)
      .length === 1
  );
}

/** Whether an outlaw other than Georgia stands in the hall. */
function outlawInHall(c: Context, gang: readonly string[]): boolean {
  return gang.some((id) => {
    const there = c.cellOf(id);
    return id !== "G" && there !== undefined && c.areaOf(there) === "V";
  });
}

/**
 * The choices of the three outlaws that fit every clue about them.
 *
 * @param c - the context, with everybody placed
 * @returns the fitting gangs
 */
function fittingGangs(c: Context): readonly (readonly string[])[] {
  return GANGS.filter(
    (gang) =>
      gang.every((id) => aloneWithHonest(c, id, gang)) &&
      southOfOneOutlaw(c, gang) &&
      outlawInHall(c, gang),
  );
}

/** Whether some choice of the outlaws fits every clue about them. */
function someGang(c: Context): boolean {
  return fittingGangs(c).length > 0;
}

/** The case. */
export const THE_SHERIFFS_OFFICE: Level = {
  id: "the-sheriffs-office",
  name: "Das Büro des Sheriffs",
  series: { book: "timeTravel", number: 22 },
  story:
    "Falls du hergekommen bist, um jemandem bei der Flucht zu helfen: Stell dich hinten an.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Zelle A",
      at: "in Zelle A",
      ground: "stone",
      tint: "#c9ced8",
      label: { row: 2, col: 1 },
    },
    {
      key: "W",
      name: "Waffenkammer",
      at: "in der Waffenkammer",
      ground: "floor",
      tint: "#d6dbe6",
      label: { row: 2, col: 3 },
    },
    {
      key: "O",
      name: "Büro",
      at: "im Büro",
      ground: "floor",
      tint: "#dfe3ea",
      label: { row: 3, col: 5 },
    },
    {
      key: "V",
      name: "Vorraum",
      at: "im Vorraum",
      ground: "floor",
      tint: "#e2dfe3",
      label: { row: 7, col: 0 },
    },
    {
      key: "B",
      name: "Zelle B",
      at: "in Zelle B",
      ground: "stone",
      tint: "#c9ced8",
      label: { row: 6, col: 6 },
    },
    {
      key: "P",
      name: "Veranda",
      at: "auf der Veranda",
      ground: "floor",
      tint: "#ece4d2",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "AAAWWOOOO",
    "AAAWWOOOO",
    "AAAWWOOOO",
    "VVVVVOOOO",
    "VVVVVVVBB",
    "VVVVVVBBP",
    "VVVVVVBBP",
    "VVVVVPPPP",
    ".....PPPP",
  ],
  thingMap: [
    "....s....",
    "x...h.cs.",
    "r....rtt.",
    "..hc..ctt",
    ".c.c.....",
    "c..tr..x.",
    "c.ccr....",
    ".hrhr...p",
    ".....pp..",
  ],
  things: {
    c: "chair",
    h: "shelf",
    p: "horse",
    r: "rug",
    s: "safe",
    t: "table",
    x: "woodCrate",
  },
  extraThings: {
    safe: { name: "Tresor", emoji: "\u{1F512}", standable: false },
  },
  shapes: [
    // The rug in the hall, down the room and along the bottom under both shelves.
    [
      { row: 5, col: 4 },
      { row: 6, col: 4 },
      { row: 7, col: 4 },
      { row: 7, col: 3 },
      { row: 7, col: 2 },
      { row: 7, col: 1 },
    ],
    // The desk in the office, round a corner.
    [
      { row: 2, col: 6 },
      { row: 2, col: 7 },
      { row: 3, col: 7 },
      { row: 3, col: 8 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Abel",
      pronoun: "er",
      clue: { text: "Ein Gesetzloser.", ...counting(someGang) },
      colour: "#b91c1c",
      face: "\u{1F920}",
    },
    {
      id: "B",
      name: "Benito",
      pronoun: "er",
      clue: {
        text: "Er war westlich von Harry und südlich von genau einem Gesetzlosen.",
        ...all(
          about(["H"], (c) => {
            const harry = c.cellOf("H");
            return harry !== undefined && c.cell.col < harry.col;
          }),
          counting(someGang),
        ),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Clarence",
      pronoun: "er",
      clue: {
        text: "Er ritt auf einem Pferd oder saß auf einem Stuhl.",
        ...on("seat"),
      },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Douglas",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#6366f1",
      face: "\u{1F9D1}",
    },
    {
      id: "E",
      name: "Edgar",
      pronoun: "er",
      clue: { text: "Er war auf einem Teppich.", ...on("rug") },
      colour: "#a16207",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "F",
      name: "Fletcher",
      pronoun: "er",
      clue: { text: "Er war in Zelle A oder Zelle B.", ...inArea("A", "B") },
      colour: "#57534e",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Georgia",
      pronoun: "sie",
      clue: {
        text: "Sie war im Vorraum bei einem Gesetzlosen. Sie saß nicht auf einem Stuhl.",
        ...all(inArea("V"), not(on("chair")), counting(someGang)),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "H",
      name: "Harry",
      pronoun: "er",
      clue: {
        text: "Kein Gesetzloser. Er war in der fünften Spalte.",
        ...column(5),
      },
      colour: "#7c3aed",
      face: "\u{1F46E}",
    },
    {
      id: "V",
      name: "Vidal",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Kein Gesetzloser. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F935}",
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
      text: "Ein Gesetzloser ist allein mit genau einer Person, die kein Gesetzloser ist. Georgia ist mit einem Gesetzlosen im Vorraum - dort sind also genau zwei: Georgia und ein Gesetzloser. Harry ist kein Gesetzloser und steht in C5: R1 C5 ist ein Tresor, R2 C5 ein Regal, der Vorraum scheidet aus. Harry steht in R3 C5.",
      place: { H: { row: 2, col: 4 } },
    },
    {
      text: "Edgar steht auf einem Teppich: R3 C1 und R3 C6 liegen in Harrys Zeile, R6 C5 bis R8 C5 in Harrys Spalte. Edgar steht in R8 C3 - er ist der Gesetzlose im Vorraum, und außer ihm und Georgia ist niemand dort.",
      place: { E: { row: 7, col: 2 } },
    },
    {
      text: "Douglas steht neben einem Tisch, aber nicht im Vorraum - der Tisch in R6 C4 scheidet aus. Am Schreibtisch im Büro liegen R3 C6 und R3 C9 in Harrys Zeile, R2 C8 ist ein Tresor, R5 C8 und R5 C9 gehören zu Zelle B. Es bleiben R2 C7 und R4 C7: Douglas steht in C7. Clarence reitet oder sitzt. Die Stühle außerhalb des Vorraums stehen in C7, das Pferd in R8 C9 in Edgars Zeile, das in R9 C7 in C7. Clarence reitet in R9 C6.",
      place: { C: { row: 8, col: 5 } },
    },
    {
      text: "C1, C2 und C4 brauchen je eine Person. Außerhalb des Vorraums haben sie nur Felder in R1 und R2 (R3 ist Harrys Zeile), und im Vorraum bleibt nur Georgia. Also stehen die Personen in R1 und R2 in C1, C2 oder C4, Georgia in der dritten dieser Spalten. Douglas steht damit nicht in R2, sondern in R4 C7.",
      place: { D: { row: 3, col: 6 } },
    },
    {
      text: "Georgia steht im Vorraum, nicht auf einem Stuhl und nicht in einer besetzten Zeile oder Spalte: R5 C1, R6 C2 oder R7 C2 - also in C1 oder C2. In R1 und R2 steht darum eine Person in C4, bei Harry in der Waffenkammer, und eine in C1 oder C2 in Zelle A - dort allein, denn R3 ist Harrys Zeile.",
    },
    {
      text: "Benito ist westlich von Harry und nicht im Vorraum, also in R1 oder R2. Er ist südlich von genau einem Gesetzlosen - in R1 wäre niemand nördlich von ihm. Benito steht in R2, und die Person in R1 ist ein Gesetzloser. Allein in Zelle A wäre sie das nicht: Sie steht in R1 C4 bei Harry, Benito in Zelle A in R2 C2 (R2 C1 ist eine Kiste). Georgia bleibt C1: R5 C1.",
      place: { B: { row: 1, col: 1 }, G: { row: 4, col: 0 } },
    },
    {
      text: "Übrig sind Abel, Fletcher und Vidal. Fletcher ist in einer Zelle, Vidal kein Gesetzloser - der Gesetzlose in R1 C4 ist Abel. Frei sind R6 und R7 sowie C8 und C9; R6 C8 ist eine Kiste. Fletcher steht in Zelle B in R7 C8, Vidal in R6 C9 auf der Veranda - allein mit Clarence. Clarence ist der Mörder!",
      place: {
        A: { row: 0, col: 3 },
        F: { row: 6, col: 7 },
        V: { row: 5, col: 8 },
      },
    },
  ],
  solution: {
    A: { row: 0, col: 3 },
    B: { row: 1, col: 1 },
    C: { row: 8, col: 5 },
    D: { row: 3, col: 6 },
    E: { row: 7, col: 2 },
    F: { row: 6, col: 7 },
    G: { row: 4, col: 0 },
    H: { row: 2, col: 4 },
    V: { row: 5, col: 8 },
  },
};
