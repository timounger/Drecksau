/**
 * The Cathedral: altar, choir, two transepts, the nave and two side aisles of
 * a medieval cathedral, with a murdered guard.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Die Kathedrale/Die Kathedrale.png`,
 * no solution sheet). The book's estates - nobles (purple cards) only in the
 * crowned areas, villagers (wooden cards) only outside them, knights (grey
 * shields) anywhere - make it unique, with the culprit pencilled in on the
 * photographed page. The victim, a guard, lies at the crowned altar:
 * he is a knight, and knights may be anywhere.
 * Oswin is the victim; whoever was alone with him killed him.
 *
 * Chairs can be stood on; statues, tables and jugs cannot. The carpet runner
 * down the nave is only decoration.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import { about, beside, column, on, ranks, victim } from "../engine/clues";
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
      traits: ["villager"],
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
      traits: ["villager"],
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
      traits: ["villager"],
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "H",
      name: "Harry",
      pronoun: "er",
      traits: ["villager"],
      clue: { text: "Er war neben einer Statue.", ...beside("statue") },
      colour: "#334155",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "O",
      name: "Oswin",
      pronoun: "er",
      traits: ["knight"],
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F482}",
    },
  ],
  rules: [
    ranks(
      "Adlige (\u{1F451}) waren nur am Altar oder in den Querschiffen, Dorfbewohner nur in den anderen Bereichen, Ritter überall.",
      CROWNED,
    ),
  ],
  hints: [
    {
      text: "Anselm, Ben, Cecil und Darius sind adlig, also nur am Altar oder in den Querschiffen; Egon, Fidelina, Genoveva und Harry sind Dorfbewohner, also nie dort. Cecil steht neben einem Krug: R5 C1, R4 C7 oder R5 C8 (R4 C9 liegt in Anselms Spalte). Fidelina steht genau eine Spalte östlich - nie in einem Querschiff: Zu R5 C8 gibt es in C9 nur Querschiff-Felder, zu R4 C7 bleibt R9 C8 und zu R5 C1 bleibt R9 C2. Fidelina steht also in R9.",
    },
    {
      text: "Egon ist im selben Bereich wie Fidelina. Mit Cecil in R4 C7 stünde Fidelina im östlichen Seitenschiff, und Egon müsste dort in C7 stehen - Cecils Spalte. Also steht Cecil in R5 C1 und Fidelina in R9 C2. Egon steht im westlichen Seitenschiff: R8 C3 ist eine Statue, also R7 C3. Anselm steht adlig in C9, also im östlichen Querschiff: R5 ist Cecils Zeile, R6 C9 eine Statue - er steht in R4 C9.",
      place: {
        C: { row: 4, col: 0 },
        F: { row: 8, col: 1 },
        E: { row: 6, col: 2 },
        A: { row: 3, col: 8 },
      },
    },
    {
      text: "Genoveva sitzt auf einem Stuhl. Der Stuhl im Chor liegt in C3 (Egons Spalte), die im Hauptschiff in R5, R7 und R9 - es bleibt nur R8 C6.",
      place: { G: { row: 7, col: 5 } },
    },
    {
      text: "Harry steht neben einer Statue, aber nie am Altar oder in einem Querschiff. Das geht nur im Chor (R2 C3 oder R2 C7) oder im westlichen Seitenschiff (R7 C3, R9 C3). C3, R7 und R9 sind besetzt - Harry steht in R2 C7.",
      place: { H: { row: 1, col: 6 } },
    },
    {
      text: "Ben steht neben einem Tisch. Am Tisch im westlichen Querschiff ist alles besetzt, am Altar bleiben R2 C4, R3 C5 und R2 C6 - R2 ist Harrys Zeile, C6 Genovevas Spalte. Ben steht in R3 C5.",
      place: { B: { row: 2, col: 4 } },
    },
    {
      text: "Darius ist adlig und steht östlich von Ben. Frei sind nur noch R1 und R6 sowie C4 und C8: östlich von Ben und am Altar oder in einem Querschiff bleibt R6 C8. Oswin steht auf dem letzten Feld, R1 C4 am Altar - allein mit Ben. Ben ist der Mörder!",
      place: { D: { row: 5, col: 7 }, O: { row: 0, col: 3 } },
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
