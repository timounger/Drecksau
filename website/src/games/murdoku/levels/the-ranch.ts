/**
 * Die Ranch: a field, a house, a stable, a barn and a shed, two outlaws
 * hiding among the suspects and a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/23.png`, no solution
 * sheet - part of the solved grid is pencilled in on the photographed page,
 * and the solver proves the only solution). Vester is the victim; whoever
 * was alone with him killed him. The case plays in the Wild West, so there
 * are no estates.
 *
 * **Who the outlaws are is not printed - it is part of the puzzle.** There
 * are exactly two, Vester is none of them, and both rode a horse or sat on a
 * chair. Alfonso was with an outlaw - somebody else in his area. The clues
 * about the outlaws hold when some pair fits them all ({@link someGang}).
 *
 * The field reaches from the top left round the middle down to the bottom.
 * Horses and chairs can be stood on; cows, hay bales, shelves and the table
 * cannot.
 */
import {
  alone,
  all,
  beside,
  counting,
  inArea,
  not,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Who may be an outlaw: everybody but Vester. */
const MAYBE_OUTLAWS: readonly string[] = ["A", "B", "C", "D", "E", "F", "G"];

/** Every pair of outlaws the printed clues allow. */
const GANGS: readonly (readonly string[])[] = MAYBE_OUTLAWS.flatMap(
  (first, at) => MAYBE_OUTLAWS.slice(at + 1).map((second) => [first, second]),
);

/** Whether somebody rode a horse or sat on a chair. */
function seated(c: Context, id: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && c.is(there, "seat");
}

/** Whether an outlaw other than Alfonso stands in Alfonso's area. */
function withAlfonso(c: Context, gang: readonly string[]): boolean {
  const alfonso = c.cellOf("A");
  return (
    alfonso !== undefined &&
    c
      .peopleIn(c.areaOf(alfonso) ?? "")
      .some((id) => id !== "A" && gang.includes(id))
  );
}

/** Whether some pair of outlaws fits every clue about them. */
function someGang(c: Context): boolean {
  return GANGS.some(
    (gang) => gang.every((id) => seated(c, id)) && withAlfonso(c, gang),
  );
}

/** Whether a field is a corner of the grid. */
function inGridCorner(c: Context): boolean {
  return (
    (c.cell.row === 0 || c.cell.row === c.rows - 1) &&
    (c.cell.col === 0 || c.cell.col === c.cols - 1)
  );
}

/** Whether Estefania is the only woman in the barn. */
function onlyWomanInBarn(c: Context): boolean {
  return c.peopleIn("S").every((id) => id === c.self || !c.has(id, "woman"));
}

/** The case. */
export const THE_RANCH: Level = {
  id: "the-ranch",
  name: "Die Ranch",
  series: { book: "timeTravel", number: 23 },
  story:
    "Nicht jeder hier arbeitet im Stall. Und nicht jeder hier ist ganz stabil, wenn du verstehst.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "F",
      name: "Feld",
      at: "auf dem Feld",
      ground: "grass",
      tint: "#ece7b4",
      label: { row: 7, col: 3 },
    },
    {
      key: "H",
      name: "Haus",
      at: "im Haus",
      ground: "floor",
      tint: "#e6d8d3",
      label: { row: 3, col: 6 },
    },
    {
      key: "T",
      name: "Stall",
      at: "im Stall",
      ground: "stone",
      tint: "#c9cbd8",
      label: { row: 4, col: 1 },
    },
    {
      key: "S",
      name: "Scheune",
      at: "in der Scheune",
      ground: "floor",
      tint: "#b9b8c8",
      label: { row: 7, col: 1 },
    },
    {
      key: "C",
      name: "Schuppen",
      at: "im Schuppen",
      ground: "floor",
      tint: "#b9b8c8",
      label: { row: 7, col: 6 },
    },
  ],
  areaMap: [
    "FFFFFHHH",
    "FFFFFHHH",
    "TTTTFFHH",
    "TTTFFFHH",
    "TTTFFFFF",
    "SSSFFFFF",
    "SSSSFFFC",
    "SSSFFCCC",
  ],
  thingMap: [
    ".pp..c.c",
    "....p.t.",
    "p..p....",
    ".p...hs.",
    "p..p....",
    ".k...k.p",
    "k...p.h.",
    ".hh...ss",
  ],
  things: {
    c: "chair",
    h: "hay",
    k: "cow",
    p: "horse",
    s: "shelf",
    t: "table",
  },
  suspects: [
    {
      id: "A",
      name: "Alfonso",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Regal. Er war bei einem Gesetzlosen.",
        ...all(beside("shelf"), counting(someGang)),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Bruce",
      pronoun: "er",
      clue: { text: "Er war allein.", ...alone() },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Charlene",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Heuballen.", ...beside("hay") },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Daniel",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einer Kuh oder einem Pferd.",
        ...not(own((c) => c.beside(c.cell, "animal"))),
      },
      colour: "#6366f1",
      face: "\u{1F920}",
    },
    {
      id: "E",
      name: "Estefania",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Frau in der Scheune.",
        ...all(inArea("S"), counting(onlyWomanInBarn)),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Fritz",
      pronoun: "er",
      clue: { text: "Er war im Schuppen.", ...inArea("C") },
      colour: "#57534e",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Grace",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke des Rasters.",
        ...own(inGridCorner),
      },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "V",
      name: "Vester",
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
      text: "Es gab genau zwei Gesetzlose. Beide ritten auf einem Pferd oder saßen auf einem Stuhl.",
      check: someGang,
    },
  ],
  hints: [
    {
      text: "Grace steht in einer Ecke: R1 C1, R1 C8 oder R8 C1 (R8 C8 ist ein Regal). R8 C1 liegt in der Scheune, wo Estefania die einzige Frau ist - Grace steht also in R1.",
    },
    {
      text: "Alfonso steht neben einem Regal und bei einem Gesetzlosen, und Gesetzlose reiten oder sitzen. Im Schuppen gibt es weder Pferd noch Stuhl, also ist Alfonso im Haus - und dort sitzt ein Gesetzloser auf einem Stuhl in R1. R1 ist Grace' Zeile: Sie ist die Gesetzlose und sitzt in R1 C8. Neben dem Regal im Haus liegt R4 C8 in ihrer Spalte, also steht Alfonso in R3 C7.",
      place: { G: { row: 0, col: 7 }, A: { row: 2, col: 6 } },
    },
    {
      text: "Fritz ist im Schuppen: R7 C8 liegt in Grace' Spalte, also R8 C6. Charlene steht neben einem Heuballen, nicht in der Scheune (Estefania ist dort die einzige Frau). Auf dem Feld liegen R3 C6 in Alfonsos Zeile, R5 C6 und R7 C6 in Fritz' Spalte, R6 C7 in Alfonsos Spalte - Charlene steht in R4 C5.",
      place: { F: { row: 7, col: 5 }, C: { row: 3, col: 4 } },
    },
    {
      text: "Frei sind nur noch R2, R5, R6, R7 und C1 bis C4 für Bruce, Daniel, Estefania und Vester. Bruce war allein: Auf dem Feld steht Charlene, in der Scheune Estefania - er steht im Stall, und dort ist nur noch R5 frei. Der zweite Gesetzlose reitet oder sitzt, und frei sind nur noch die Pferde in R5 C1 und R5 C4 - beide in Bruces Zeile. Bruce ist also der Gesetzlose und reitet in R5 C1.",
      place: { B: { row: 4, col: 0 } },
    },
    {
      text: "Daniel steht nicht neben einem Tier: Frei bleiben nur R7 C3 und R7 C4 (R2 C1 ist Bruces Spalte). Estefania steht also in R6 in der Scheune - R6 C1 ist Bruces Spalte, also R6 C3. Daniel steht in R7 C4, Vester auf dem letzten Feld, R2 C2 auf dem Feld - allein mit Charlene. Charlene ist die Mörderin!",
      place: {
        E: { row: 5, col: 2 },
        D: { row: 6, col: 3 },
        V: { row: 1, col: 1 },
      },
    },
  ],
  solution: {
    A: { row: 2, col: 6 },
    B: { row: 4, col: 0 },
    C: { row: 3, col: 4 },
    D: { row: 6, col: 3 },
    E: { row: 5, col: 2 },
    F: { row: 7, col: 5 },
    G: { row: 0, col: 7 },
    V: { row: 1, col: 1 },
  },
};
