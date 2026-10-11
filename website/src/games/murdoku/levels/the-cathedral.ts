/**
 * The Cathedral: altar, choir, two transepts, the nave and two side aisles of
 * a medieval cathedral, with a murdered guard.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Die Kathedrale/Die Kathedrale.png`,
 * no solution sheet). The book's rule for crowned areas (nobles - the purple
 * cards - only there) makes it unique, with the culprit pencilled in on the
 * photographed page. Unlike the other book cases the usual second half
 * ("everybody else never") cannot hold here: the victim, a guard, lies at the
 * crowned altar, so the rule is one-way.
 * Oswin is the victim; whoever was alone with him killed him.
 *
 * Chairs can be stood on; statues, tables and jugs cannot. The carpet runner
 * down the nave is only decoration.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import { about, beside, column, nobility, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The crowned areas: the altar and both transepts. */
const CROWNED: readonly string[] = ["A", "W", "O"];

/** The case. */
export const THE_CATHEDRAL: Level = {
  id: "the-cathedral",
  name: "Die Kathedrale",
  series: { book: "timeTravel", number: 4 },
  story:
    "Mal sehen, ob du durch die Wand des Beichtstuhls den einen oder anderen Hinweis aufschnappen kannst.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Altar",
      at: "am Altar",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 1, col: 5 },
    },
    {
      key: "C",
      name: "Chor",
      at: "im Chor",
      ground: "stone",
      tint: "#e9d3a6",
      label: { row: 3, col: 4 },
    },
    {
      key: "W",
      name: "Westliches Querschiff",
      at: "im westlichen Querschiff",
      ground: "floor",
      tint: "#b99ad8",
      label: { row: 5, col: 0 },
    },
    {
      key: "O",
      name: "Östliches Querschiff",
      at: "im östlichen Querschiff",
      ground: "floor",
      tint: "#b99ad8",
      label: { row: 5, col: 6 },
    },
    {
      key: "H",
      name: "Hauptschiff",
      at: "im Hauptschiff",
      ground: "floor",
      tint: "#ece4d2",
      label: { row: 8, col: 4 },
    },
    {
      key: "L",
      name: "Westliches Seitenschiff",
      at: "im westlichen Seitenschiff",
      ground: "stone",
      tint: "#d8d0cc",
      label: { row: 8, col: 2 },
      labelEnd: true,
      labelOverhang: true,
    },
    {
      key: "R",
      name: "Östliches Seitenschiff",
      at: "im östlichen Seitenschiff",
      ground: "stone",
      tint: "#d8d0cc",
      label: { row: 8, col: 6 },
      labelOverhang: true,
    },
  ],
  areaMap: [
    "..CAAAC..",
    "..CAAAC..",
    "..CCACC..",
    "WWWCCCOOO",
    "WWWHHHOOO",
    "WWWHHHOOO",
    "..LHHHR..",
    "..LHHHR..",
    ".LLHHHRR.",
  ],
  // The runner down the nave, as the page draws it - only the look.
  carpets: [
    [
      { row: 4, col: 3 },
      { row: 4, col: 4 },
      { row: 4, col: 5 },
      { row: 5, col: 4 },
      { row: 6, col: 4 },
      { row: 7, col: 4 },
    ],
  ],
  thingMap: [
    "..s.s.s..",
    "....t....",
    "..c......",
    "ps.....p.",
    "...c.c...",
    ".t......s",
    "...c.c...",
    "..s..c...",
    "...c.....",
  ],
  things: {
    c: "chair",
    p: "jug",
    s: "statue",
    t: "table",
  },
  extraThings: {
    jug: { name: "Krug", emoji: "\u{1F3FA}", standable: false },
  },
  suspects: [
    {
      id: "A",
      name: "Anselm",
      pronoun: "er",
      traits: ["noble"],
      clue: { text: "Er war in der letzten Spalte.", ...column(9) },
      colour: "#b91c1c",
      face: "\u{1F9D1}",
    },
    {
      id: "B",
      name: "Ben",
      pronoun: "er",
      traits: ["noble"],
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Cecil",
      pronoun: "er",
      traits: ["noble"],
      clue: { text: "Er war neben einem Krug.", ...beside("jug") },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Darius",
      pronoun: "er",
      traits: ["noble"],
      clue: {
        text: "Er war östlich von Ben.",
        ...about(["B"], (c) => {
          const ben = c.cellOf("B");
          return ben !== undefined && c.cell.col > ben.col;
        }),
      },
      colour: "#7c3aed",
      face: "\u{1F474}",
    },
    {
      id: "E",
      name: "Egon",
      pronoun: "er",
      clue: {
        text: "Er war im selben Bereich wie Fidelina.",
        ...about(["F"], (c) => {
          const fidelina = c.cellOf("F");
          return (
            fidelina !== undefined && c.areaOf(fidelina) === c.areaOf(c.cell)
          );
        }),
      },
      colour: "#ea580c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "F",
      name: "Fidelina",
      pronoun: "sie",
      clue: {
        text: "Sie war genau eine Spalte östlich von Cecil.",
        ...about(["C"], (c) => {
          const cecil = c.cellOf("C");
          return cecil !== undefined && c.cell.col === cecil.col + 1;
        }),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "G",
      name: "Genoveva",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "H",
      name: "Harry",
      pronoun: "er",
      clue: { text: "Er war neben einer Statue.", ...beside("statue") },
      colour: "#334155",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "O",
      name: "Oswin",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F482}",
    },
  ],
  rules: [
    nobility(
      "Adlige (\u{1F451}) waren nur am Altar oder in den Querschiffen.",
      CROWNED,
    ),
  ],
  hints: [
    {
      text: "Adlige sind nur am Altar oder in den Querschiffen. Anselm steht in C9, also in R4 C9 oder R5 C9. Cecil ist adlig und neben einem Krug: R5 C1, R4 C7 oder R5 C8 (R4 C9 ist Anselms Spalte). In R5 C8 müsste Fidelina in C9 stehen - Anselms Spalte. In R4 C7 stünde sie in C8: im östlichen Querschiff wären mit Egon vier Personen in drei Reihen, und in R9 C8 müsste Egon im östlichen Seitenschiff in C7 stehen - Cecils Spalte. Also steht Cecil in R5 C1.",
      place: { C: { row: 4, col: 0 } },
    },
    {
      text: "Fidelina steht genau eine Spalte östlich von Cecil, in C2. R5 ist besetzt, also R9 C2. Egon ist im selben Bereich, dem westlichen Seitenschiff: R8 C3 ist eine Statue und R9 besetzt, also R7 C3. Anselm kann nicht mehr in R5 stehen - er steht in R4 C9.",
      place: {
        F: { row: 8, col: 1 },
        E: { row: 6, col: 2 },
        A: { row: 3, col: 8 },
      },
    },
    {
      text: "Genoveva saß auf einem Stuhl. Die Stühle in C3, R5, R7 und R9 sind gesperrt, es bleibt nur R8 C6.",
      place: { G: { row: 7, col: 5 } },
    },
    {
      text: "Ben ist neben einem Tisch. Am Tisch im westlichen Querschiff ist alles gesperrt, am Altar bleiben R2 C4 und R3 C5. Frei sind noch R1, R2, R3 und R6 und C4, C5, C7 und C8 - C8 gibt es dort nur in R6 C8. Darius ist adlig und östlich von Ben: am Altar ginge nur R3 C5 (mit Ben in R2 C4), dann bliebe für R1 nur die Statue in C7. Also steht Darius in R6 C8.",
      place: { D: { row: 5, col: 7 } },
    },
    {
      text: "In C5 bleibt nur R3 C5. Stünde Oswin dort, müsste Ben in R2 C4 und Harry in C7 stehen - frei wäre nur die Statue in R1 C7. Also steht Ben in R3 C5. Harry steht neben einer Statue: R1 C4 oder R2 C7. In R1 C4 wäre Oswin allein im Chor - das Opfer war aber mit dem Mörder zusammen. Also steht Harry in R2 C7 und Oswin in R1 C4, allein mit Ben - Ben ist der Mörder!",
      place: {
        B: { row: 2, col: 4 },
        H: { row: 1, col: 6 },
        O: { row: 0, col: 3 },
      },
    },
  ],
  solution: {
    A: { row: 3, col: 8 },
    B: { row: 2, col: 4 },
    C: { row: 4, col: 0 },
    D: { row: 5, col: 7 },
    E: { row: 6, col: 2 },
    F: { row: 8, col: 1 },
    G: { row: 7, col: 5 },
    H: { row: 1, col: 6 },
    O: { row: 0, col: 3 },
  },
};
