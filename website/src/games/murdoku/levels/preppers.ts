/**
 * Preppers: a house built for the end of the world, and a murder inside it.
 *
 * @module
 * @remarks
 * After the free sample case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Medium/Preppers.png`, solution beside it).
 * Vivianna is the victim; whoever was alone with her killed her. The
 * solution sheet skips its step 5, so the hints run from 1 to 9 without it.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data:
   rows, columns and counts straight off the printed page. */
import {
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

/** Whether somebody other than the suspect, in the suspect's area, passes a test on their field. */
function someoneElseHere(
  c: Context,
  test: (id: string, there: Cell) => boolean,
): boolean {
  const area = c.areaOf(c.cell) ?? "";
  return c.peopleIn(area).some((id) => {
    const there = c.cellOf(id);
    return id !== c.self && there !== undefined && test(id, there);
  });
}

/** The case. */
export const PREPPERS: Level = {
  id: "preppers",
  name: "Prepper",
  difficulty: "medium",
  series: { book: "online" },
  story:
    "Vivianna wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "Y",
      name: "Hof",
      at: "im Hof",
      ground: "grass",
      tint: "#b9df8f",
      label: { row: 4, col: 7 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#efe4d2",
      label: { row: 3, col: 1 },
    },
    {
      key: "L",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#f6dcc0",
      label: { row: 3, col: 4 },
    },
    {
      key: "T",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#f8d7a8",
      label: { row: 5, col: 1 },
    },
    {
      key: "R",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#f3dcb8",
      label: { row: 5, col: 5 },
    },
    {
      key: "X",
      name: "Geheimtreppe",
      at: "auf der Geheimtreppe",
      ground: "stone",
      tint: "#a9b4c2",
      label: { row: 7, col: 3 },
    },
    {
      key: "S",
      name: "Sicherheitsraum",
      at: "im Sicherheitsraum",
      ground: "stone",
      tint: "#b9c8d8",
      label: { row: 8, col: 1 },
    },
    {
      key: "U",
      name: "Vorratsraum",
      at: "im Vorratsraum",
      ground: "stone",
      tint: "#b4c4d6",
      label: { row: 8, col: 5 },
    },
  ],
  areaMap: [
    "YYYYYYYYY",
    "YKKKLLLYY",
    "YKKKLLLYY",
    "YKKKLLLYY",
    "YTTRRRRYY",
    "YTTRRRRUU",
    "SSSXRUUUU",
    "SSSXXUUUU",
    "SSSSSUUUU",
  ],
  thingMap: [
    "......aa.",
    ".tt.c..b.",
    ".t.tc.v.h",
    "h..c..s..",
    "...tdd...",
    ".cts...sb",
    "tvt..sb..",
    "dcb....bb",
    "ds..b.bs.",
  ],
  things: {
    a: "car",
    t: "table",
    c: "chair",
    b: "box",
    v: "tv",
    s: "shelf",
    h: "shrub",
    d: "bed",
  },
  suspects: [
    {
      id: "A",
      name: "Angelo",
      pronoun: "er",
      clue: {
        text: "In seinem Bereich war ein Karton. Er war neben keinem Karton.",
        ...all(
          own((c) =>
            c.cellsOf(c.areaOf(c.cell) ?? "").some((cell) => c.is(cell, "box")),
          ),
          not(beside("box")),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "B",
      name: "Blake",
      pronoun: "er",
      clue: { text: "Er war im Schlafzimmer.", ...inArea("R") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Carolina",
      pronoun: "sie",
      traits: ["glasses"],
      clue: {
        text: "In ihrem Bereich war ein Mann auf dem Bett.",
        ...all(
          own((c) =>
            c.cellsOf(c.areaOf(c.cell) ?? "").some((cell) => c.is(cell, "bed")),
          ),
          counting((c) =>
            someoneElseHere(
              c,
              (id, there) => c.has(id, "man") && c.is(there, "bed"),
            ),
          ),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Daryl",
      pronoun: "sie",
      clue: {
        text: "Jemand anderes in ihrem Bereich war neben einem Regal.",
        ...counting((c) =>
          someoneElseHere(c, (_id, there) => c.beside(there, "shelf")),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Edna",
      pronoun: "sie",
      traits: ["glasses"],
      clue: { text: "Sie war in der untersten Reihe.", ...row(9) },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Friedrich",
      pronoun: "er",
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Greg",
      pronoun: "er",
      traits: ["hat"],
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#ea580c",
      face: "\u{1F920}",
    },
    {
      id: "H",
      name: "Howie",
      pronoun: "er",
      clue: { text: "Er war im Badezimmer.", ...inArea("T") },
      colour: "#4338ca",
      face: "\u{1F474}",
    },
    {
      id: "V",
      name: "Vivianna",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F469}",
    },
  ],
  hints: [
    {
      text: "Da Cs Hinweis besagt, dass ein Mann auf dem Bett ist, wissen wir, dass dieser Mann das Bett in R5 belegen muss. Streiche alle anderen Felder in R5.",
      cross: [
        { row: 4, col: 0 },
        { row: 4, col: 1 },
        { row: 4, col: 2 },
        { row: 4, col: 6 },
        { row: 4, col: 7 },
        { row: 4, col: 8 },
      ],
    },
    {
      text: "H muss in R6 C2 sein, denn das ist das letzte verfügbare Feld im Badezimmer. Das bedeutet, dass C R7 C5 belegen muss, um im selben Raum wie der Mann auf dem Bett zu sein.",
      place: { H: { row: 5, col: 1 }, C: { row: 6, col: 4 } },
    },
    {
      text: "Da B im Schlafzimmer ist, muss er der Mann auf dem Bett sein, in R5 C6. Damit bleibt ein Feld übrig, auf dem F neben dem Fernseher sein kann, also ist F in R2 C7.",
      place: { B: { row: 4, col: 5 }, F: { row: 1, col: 6 } },
    },
    {
      text: "Konzentrieren wir uns auf D: Da ihr Hinweis besagt, dass jemand anderes in ihrem Bereich neben einem Regal war, können wir herleiten, dass D in R8 C1 im Sicherheitsraum ist, dem einzigen verbleibenden Bereich, der sie und eine weitere Person neben dem Bücherregal aufnehmen kann. Das bedeutet, dass die Person neben dem Bücherregal im Sicherheitsraum R9 C3 belegen muss. Wir wissen, dass diese Person E ist, da sie in der untersten Reihe ist.",
      place: { D: { row: 7, col: 0 }, E: { row: 8, col: 2 } },
    },
    {
      text: "G belegt R4 C4, denn das ist der letzte Stuhl. Da A nicht neben einer Kiste sein kann, muss er in R1 C9 sein.",
      place: { G: { row: 3, col: 3 }, A: { row: 0, col: 8 } },
    },
    {
      text: "Damit bleibt das letzte Feld R3 C8 für V, also ist A der Mörder.",
      place: { V: { row: 2, col: 7 } },
    },
  ],
  solution: {
    A: { row: 0, col: 8 },
    B: { row: 4, col: 5 },
    C: { row: 6, col: 4 },
    D: { row: 7, col: 0 },
    E: { row: 8, col: 2 },
    F: { row: 1, col: 6 },
    G: { row: 3, col: 3 },
    H: { row: 5, col: 1 },
    V: { row: 2, col: 7 },
  },
};
