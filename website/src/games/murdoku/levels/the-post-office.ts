/**
 * Das Postamt: a lobby, a parcel room and a telegraph room, two outlaws
 * hiding among the customers and a murdered postwoman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/18.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution). Verena
 * is the victim; whoever was alone with her killed her.
 *
 * **There are two outlaws.** Elias is one of them; the other is one of
 * Aaron, Becky, Carrie and Damien - not Verena. Both outlaws stood in a
 * corner of their area, and Damien was with an outlaw: somebody in his area
 * other than himself. A field is in a corner of its area when the area's
 * border runs along two of its sides that meet: one above or below it, one
 * to its left or right. Chairs can be stood on; sacks, the safe, the table,
 * the shelves and the telegraph desk cannot.
 */
import { all, beside, counting, on, victim } from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The outlaw everybody knows. */
const KNOWN_OUTLAW = "E";

/** Who may be the second outlaw. */
const MAYBE_OUTLAWS: readonly string[] = ["A", "B", "C", "D"];

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

/** Whether somebody stands in a corner of their area. */
function cornered(c: Context, id: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && inCorner(c.areaOf, there);
}

/** Whether two people other than each other share an area. */
function together(c: Context, one: string, other: string): boolean {
  const first = c.cellOf(one);
  const second = c.cellOf(other);
  return (
    one !== other &&
    first !== undefined &&
    second !== undefined &&
    c.areaOf(first) === c.areaOf(second)
  );
}

/** Whether somebody in Damien's area, not himself, may be an outlaw. */
function withAnOutlaw(c: Context): boolean {
  return (
    together(c, "D", KNOWN_OUTLAW) ||
    MAYBE_OUTLAWS.some((id) => together(c, "D", id) && cornered(c, id))
  );
}

/**
 * Whether a second outlaw fits every clue: in a corner, with Elias in one
 * too, and one of the two in Damien's area.
 *
 * @param c - the context, with everybody placed
 * @returns whether such an outlaw exists
 */
function outlawsFit(c: Context): boolean {
  return (
    cornered(c, KNOWN_OUTLAW) &&
    MAYBE_OUTLAWS.some(
      (id) =>
        cornered(c, id) &&
        (together(c, "D", id) || together(c, "D", KNOWN_OUTLAW)),
    )
  );
}

/** The case. */
export const THE_POST_OFFICE: Level = {
  id: "the-post-office",
  name: "Das Postamt",
  series: { book: "timeTravel", number: 18 },
  story:
    "Es hat zweimal an der Tür der Postbotin geklingelt … und jetzt wissen wir, warum sie nicht aufgemacht hat.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "V",
      name: "Vorraum",
      at: "im Vorraum",
      ground: "stone",
      tint: "#b9d4e4",
      label: { row: 4, col: 0 },
    },
    {
      key: "P",
      name: "Paketannahme",
      at: "in der Paketannahme",
      ground: "stone",
      tint: "#a9c4d4",
      label: { row: 3, col: 4 },
    },
    {
      key: "T",
      name: "Telegrafenraum",
      at: "im Telegrafenraum",
      ground: "floor",
      tint: "#ece6c8",
      label: { row: 5, col: 0 },
    },
  ],
  areaMap: ["VVVPPP", "VVVPPP", "VVVPPP", "VVVPPP", "VVVTTT", "TTTTTT"],
  thingMap: [".c.k.k", ".t.xk.", ".s...s", "..c...", ".c.c.c", "..tttt"],
  things: {
    c: "chair",
    k: "sack",
    s: "shelf",
    t: "table",
    x: "safe",
  },
  extraThings: {
    safe: { name: "Tresor", emoji: "\u{1F512}", standable: false },
  },
  // The long telegraph desk.
  pieces: [{ at: { row: 5, col: 2 }, rows: 1, cols: 4 }],
  suspects: [
    {
      id: "A",
      name: "Aaron",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#b91c1c",
      face: "\u{1F9D0}",
    },
    {
      id: "B",
      name: "Becky",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Carrie",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Sack.", ...beside("sack") },
      colour: "#0e7490",
      face: "\u{1F475}",
    },
    {
      id: "D",
      name: "Damien",
      pronoun: "er",
      clue: {
        text: "Er war neben dem Tresor. Er war bei einem Gesetzlosen.",
        ...all(beside("safe"), counting(withAnOutlaw)),
      },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Elias",
      pronoun: "er",
      clue: {
        text: "Ein Gesetzloser.",
        ...counting((c) => cornered(c, KNOWN_OUTLAW)),
      },
      colour: "#a16207",
      face: "\u{1F920}",
    },
    {
      id: "V",
      name: "Verena",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Keine Gesetzlose. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F469}‍\u{1F9B1}",
    },
  ],
  rules: [
    {
      text: "Es verstecken sich genau zwei Gesetzlose unter den Verdächtigen. Ein Gesetzloser kann der Mörder sein oder auch nicht.",
    },
    {
      text: "Alle Gesetzlosen waren in einer Ecke ihres Bereichs.",
      check: outlawsFit,
    },
  ],
  hints: [
    {
      text: "Damien steht neben dem Tresor: R1 C4 und R2 C5 sind Säcke, R2 C3 liegt im Vorraum - es bleibt R3 C4.",
      place: { D: { row: 2, col: 3 } },
    },
    {
      text: "Damien war bei einem Gesetzlosen, und Gesetzlose standen in einer Ecke. Die freien Ecken der Paketannahme sind R4 C4 (Damiens Spalte) und R4 C6, und dort passt nur Becky (neben dem Regal) oder Elias. Wäre Elias dort, fände Becky kein Feld mehr neben einem Regal: R3 ist Damiens Zeile, R4 C2 und R4 C6 lägen in Elias' Zeile, R2 C6 in seiner Spalte. Also steht Becky als Gesetzlose in R4 C6.",
      place: { B: { row: 3, col: 5 } },
    },
    {
      text: "Carrie steht neben einem Sack: R3 C5 ist Damiens Zeile, R2 C6 Beckys Spalte. Sie steht in R1 C5.",
      place: { C: { row: 0, col: 4 } },
    },
    {
      text: "Die Spalten 4 bis 6 sind besetzt. Aaron sitzt auf einem Stuhl in C1 bis C3: R1 C2 ist Carries Zeile, R4 C3 Beckys - er sitzt in R5 C2.",
      place: { A: { row: 4, col: 1 } },
    },
    {
      text: "Übrig sind R2 und R6. In R6 bleibt nur R6 C1 (C2 ist Aarons Spalte), in R2 R2 C1 oder R2 C3. Elias ist Gesetzloser und steht in einer Ecke - das ist nur R6 C1. Verena steht in R2 C3 im Vorraum, allein mit Aaron. Aaron ist der Mörder!",
      place: { E: { row: 5, col: 0 }, V: { row: 1, col: 2 } },
    },
  ],
  solution: {
    A: { row: 4, col: 1 },
    B: { row: 3, col: 5 },
    C: { row: 0, col: 4 },
    D: { row: 2, col: 3 },
    E: { row: 5, col: 0 },
    V: { row: 1, col: 2 },
  },
};
