/**
 * Die Spielhölle: an upstairs floor, a back room, a gaming room and a
 * porch, two outlaws among the gamblers and a murdered card player.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/20.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution). Vann
 * is the victim; whoever was alone with him killed him.
 *
 * **There are two outlaws.** Byron is one of them; the other is one of
 * Abigail, Cooper, Doc and Elisa - not Vann. Both outlaws sat on a chair or
 * rode a horse. Elisa stood south of an outlaw in her area, so the outlaw
 * she means is not herself. The swing door sits in the wall between the
 * gaming room and the porch; a field is in front of it when the door lies
 * on one of its sides ({@link DOOR}). Chairs and the horse can be stood on;
 * the piano and the bar counter cannot.
 */
import { counting, inArea, victim } from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The swing door: the two fields on either side of it. */
const DOOR: readonly Cell[] = [
  { row: 4, col: 2 },
  { row: 5, col: 2 },
];

/** The outlaw everybody knows. */
const KNOWN_OUTLAW = "B";

/** Who may be the second outlaw. */
const MAYBE_OUTLAWS: readonly string[] = ["A", "C", "D", "E"];

/** Whether the door lies on one of a field's sides. */
function beforeDoor(cell: Cell): boolean {
  return DOOR.some((one) => one.row === cell.row && one.col === cell.col);
}

/** Whether somebody sits on a chair or rides a horse. */
function seated(c: Context, id: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && (c.is(there, "chair") || c.is(there, "horse"));
}

/** Whether Elisa stands south of somebody else in her area. */
function elisaSouthOf(c: Context, id: string): boolean {
  const elisa = c.cellOf("E");
  const there = c.cellOf(id);
  return (
    id !== "E" &&
    elisa !== undefined &&
    there !== undefined &&
    c.areaOf(elisa) === c.areaOf(there) &&
    elisa.row > there.row
  );
}

/**
 * Whether a second outlaw fits every clue: both outlaws seated, and one of
 * them north of Elisa in her area.
 *
 * @param c - the context, with everybody placed
 * @returns whether such an outlaw exists
 */
function outlawsFit(c: Context): boolean {
  return (
    seated(c, KNOWN_OUTLAW) &&
    MAYBE_OUTLAWS.some(
      (id) =>
        seated(c, id) && (elisaSouthOf(c, id) || elisaSouthOf(c, KNOWN_OUTLAW)),
    )
  );
}

/** The case. */
export const THE_GAMBLING_DEN: Level = {
  id: "the-gambling-den",
  name: "Die Spielhölle",
  series: { book: "timeTravel", number: 20 },
  story:
    "Nichts schlägt einen Royal Flush - außer einem Paar Kugeln natürlich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "O",
      name: "Obergeschoss",
      at: "im Obergeschoss",
      ground: "floor",
      tint: "#e4dca4",
      label: { row: 2, col: 0 },
    },
    {
      key: "H",
      name: "Hinterzimmer",
      at: "im Hinterzimmer",
      ground: "floor",
      tint: "#e2e4d8",
      label: { row: 0, col: 3 },
    },
    {
      key: "S",
      name: "Spielsaal",
      at: "im Spielsaal",
      ground: "floor",
      tint: "#c9a9a0",
      label: { row: 4, col: 4 },
    },
    {
      key: "V",
      name: "Veranda",
      at: "auf der Veranda",
      ground: "floor",
      tint: "#dfe2e4",
      label: { row: 5, col: 2 },
    },
  ],
  areaMap: ["OOSHHH", "OOSSSS", "OOSSSS", "OSSSSS", "VSSSSS", "VVVVVS"],
  thingMap: ["..t...", ".pttt.", "..c.c.", "..tctc", "h.....", ".....c"],
  things: {
    c: "chair",
    h: "horse",
    p: "piano",
    t: "table",
  },
  extraThings: {
    piano: { name: "Klavier", emoji: "\u{1F3B9}", standable: false },
  },
  // The bar counter round the corner.
  shapes: [
    [
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 1, col: 4 },
    ],
  ],
  windows: [{ at: { row: 4, col: 2 }, side: "bottom", door: true }],
  suspects: [
    {
      id: "A",
      name: "Abigail",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit jemandem, der vor der Tür stand.",
        ...counting((c) => {
          const others = c
            .peopleIn(c.areaOf(c.cell) ?? "")
            .filter((id) => id !== c.self);
          const other = others.length === 1 ? c.cellOf(others[0]) : undefined;
          return other !== undefined && beforeDoor(other);
        }),
      },
      colour: "#b91c1c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "B",
      name: "Byron",
      pronoun: "er",
      clue: {
        text: "Ein Gesetzloser.",
        ...counting((c) => seated(c, KNOWN_OUTLAW)),
      },
      colour: "#15803d",
      face: "\u{1F920}",
    },
    {
      id: "C",
      name: "Cooper",
      pronoun: "er",
      clue: { text: "Er war im Hinterzimmer.", ...inArea("H") },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Doc",
      pronoun: "er",
      clue: { text: "Er war im Obergeschoss.", ...inArea("O") },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Elisa",
      pronoun: "sie",
      clue: {
        text: "Sie war südlich eines Gesetzlosen, der in ihrem Bereich war.",
        ...counting(
          (c) =>
            elisaSouthOf(c, KNOWN_OUTLAW) ||
            MAYBE_OUTLAWS.some((id) => seated(c, id) && elisaSouthOf(c, id)),
        ),
      },
      colour: "#a16207",
      face: "\u{1F469}",
    },
    {
      id: "V",
      name: "Vann",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Nicht der Gesetzlose. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F468}‍\u{1F9B2}",
    },
  ],
  rules: [
    {
      text: "Es verstecken sich genau zwei Gesetzlose unter den Verdächtigen. Ein Gesetzloser kann der Mörder sein oder auch nicht.",
    },
    {
      text: "Beide Gesetzlosen saßen auf einem Stuhl oder ritten auf einem Pferd.",
      check: outlawsFit,
    },
  ],
  hints: [
    {
      text: "Abigail war allein mit jemandem vor der Tür - in ihrem Bereich waren genau zwei Personen. Im Obergeschoss und im Hinterzimmer steht niemand vor der Tür. Im Spielsaal müsste der andere in R5 C3 stehen; Byron säße dann nicht im Spielsaal, sondern auf dem Pferd in R5 C1 - in derselben Zeile. Also ist Abigail auf der Veranda, und dort steht noch jemand in R6 C3. Abigail ist dann nicht in R6: Sie reitet das Pferd in R5 C1.",
      place: { A: { row: 4, col: 0 } },
    },
    {
      text: "Cooper steht im Hinterzimmer, also in R1. Doc ist im Obergeschoss: R1 ist Coopers Zeile, C1 Abigails Spalte - es bleibt R3 C2.",
      place: { D: { row: 2, col: 1 } },
    },
    {
      text: "Byron sitzt auf einem Stuhl: R3 ist Docs Zeile, R6 die Zeile der Person in R6 C3. Er sitzt in R4. Für Elisa und Vann bleiben R2 und R6. Elisa war südlich eines Gesetzlosen, also nicht in R2. Vann steht in R2 - R2 C1 ist Abigails Spalte, also R2 C6. Damit sitzt Byron in R4 C4.",
      place: { V: { row: 1, col: 5 }, B: { row: 3, col: 3 } },
    },
    {
      text: "Elisa ist in R6, und nur sie kann die Person in R6 C3 sein: R6 C3, vor der Tür, südlich von Abigail auf dem Pferd. Cooper steht in R1 C5. Vann ist im Spielsaal allein mit Byron. Byron ist der Mörder!",
      place: { E: { row: 5, col: 2 }, C: { row: 0, col: 4 } },
    },
  ],
  solution: {
    A: { row: 4, col: 0 },
    B: { row: 3, col: 3 },
    C: { row: 0, col: 4 },
    D: { row: 2, col: 1 },
    E: { row: 5, col: 2 },
    V: { row: 1, col: 5 },
  },
};
