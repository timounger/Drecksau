/**
 * The Wine Cellar: a house with a bathroom, a master bedroom, a kitchen, a
 * living and a dining room above a cellar and a wine cellar, eight suspects
 * and a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Schwer/Der Weinkeller/Der Weinkeller.png`, no
 * solution sheet; the solver proves the case has exactly one solution). Vin
 * is the victim; whoever was alone with him killed him. The bed and the
 * chairs can be stood on; plants, tables, televisions, shelves and barrels
 * cannot.
 */
import {
  about,
  alone,
  all,
  beside,
  inArea,
  not,
  on,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */

/** How many people sat on a chair, as the case's rule has it. */
const SITTING = 2;

/** How many people stood on a thing of this id. */
function countOn(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  }).length;
}

/** The case. */
export const THE_WINE_CELLAR: Level = {
  id: "the-wine-cellar",
  name: "Der Weinkeller",
  difficulty: "hard",
  series: { book: "online" },
  story:
    "Vin wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#c9a3b3",
      label: { row: 1, col: 0 },
    },
    {
      key: "S",
      name: "Hauptschlafzimmer",
      at: "im Hauptschlafzimmer",
      ground: "floor",
      tint: "#e2a9bf",
      label: { row: 2, col: 3 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#c99a8e",
      label: { row: 2, col: 7 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#b77f95",
      label: { row: 4, col: 1 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#a88aae",
      label: { row: 4, col: 6 },
    },
    {
      key: "L",
      name: "Keller",
      at: "im Keller",
      ground: "stone",
      tint: "#b98a95",
      label: { row: 8, col: 7 },
    },
    {
      key: "C",
      name: "Weinkeller",
      at: "im Weinkeller",
      ground: "stone",
      tint: "#9c7d8c",
      label: { row: 8, col: 3 },
    },
  ],
  areaMap: [
    "BBBBSSSKK",
    "BBBSSSSKK",
    "WWSSSSSKK",
    "WWWWWEEEE",
    "WWWWWEEEE",
    "LLLLLLLLL",
    "LLCCCCCLL",
    "LLCCCCCLL",
    "LLCCCCCLL",
  ],
  thingMap: [
    "pt.cb.ctt",
    "c...b.p..",
    ".c.....t.",
    "v.t..tc..",
    "p.c..c..s",
    "sc.c....t",
    "..ks.ks.t",
    "svs..k...",
    "ttss.s.p.",
  ],
  things: {
    b: "bed",
    c: "chair",
    k: "barrel",
    p: "plant",
    s: "shelf",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 0, col: 4 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 7 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 8, col: 0 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Austin",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einem Tisch.",
        ...not(beside("table")),
      },
      colour: "#b91c1c",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "B",
      name: "Benton",
      pronoun: "er",
      clue: { text: "Er war in der untersten Reihe.", ...row(9) },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Chloe",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dawn",
      pronoun: "sie",
      clue: {
        text: "Sie war östlich von Benton. Sie war nicht neben einem Tisch.",
        ...all(
          not(beside("table")),
          about(["B"], (c) => {
            const benton = c.cellOf("B");
            return benton !== undefined && c.cell.col > benton.col;
          }),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Elodie",
      pronoun: "sie",
      clue: {
        text: "Sie war im Keller. Sie war nicht neben dem Fernseher.",
        ...all(inArea("L"), not(beside("tv"))),
      },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Fred",
      pronoun: "er",
      clue: {
        text: "Er war allein. Er saß auf einem Stuhl.",
        ...all(on("chair"), alone()),
      },
      colour: "#9f1239",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Gino",
      pronoun: "er",
      clue: { text: "Er war im Badezimmer.", ...inArea("B") },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Herman",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Vin",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  rules: [
    {
      text: "Genau eine Person war auf dem Bett.",
      check: (c) => countOn(c, "bed") === 1,
    },
    {
      text: "Kein Raum war leer.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length > 0),
    },
    {
      text: "Genau zwei Personen saßen auf einem Stuhl.",
      check: (c) => countOn(c, "chair") === SITTING,
    },
  ],
  hints: [
    {
      text: "Laut dem allgemeinen Hinweis ist jemand auf dem Bett. Blockiere den Rest von C5. B ist in R9, westlich von D, das isoliert B im letzten Feld von R9, R9 C7. D ist östlich von B, in C8 oder C9.",
      place: { B: { row: 8, col: 6 } },
      cross: [
        { row: 2, col: 4 },
        { row: 3, col: 4 },
        { row: 4, col: 4 },
        { row: 5, col: 4 },
        { row: 6, col: 4 },
        { row: 7, col: 4 },
        { row: 8, col: 4 },
      ],
    },
    {
      text: "Laut dem allgemeinen Hinweis war kein Raum leer. Zwischen R1 und R5 gibt es genau fünf Räume: das Badezimmer, das Hauptschlafzimmer, das Wohnzimmer, das Esszimmer und die Küche. Um den allgemeinen Hinweis zu erfüllen, muss in jedem dieser Räume genau eine Person sein. Wer kann allein in der Küche sein? H ist die einzige Möglichkeit.",
    },
    {
      text: "Wer kann auf dem Bett im Hauptschlafzimmer sein? A ist die einzige Möglichkeit. Damit ist A die Person auf dem Bett, blockiere den Rest des Hauptschlafzimmers.",
      cross: [
        { row: 0, col: 5 },
        { row: 0, col: 6 },
        { row: 1, col: 3 },
        { row: 1, col: 5 },
        { row: 2, col: 2 },
        { row: 2, col: 3 },
        { row: 2, col: 4 },
        { row: 2, col: 5 },
        { row: 2, col: 6 },
      ],
    },
    {
      text: "Wer kann dann die Person sein, die allein im Wohnzimmer ist? F ist an dieser Stelle die einzige Möglichkeit. G, A und H belegen R1 bis R3, das isoliert F auf dem letzten Stuhl im Wohnzimmer, R5 C3.",
      place: { F: { row: 4, col: 2 } },
    },
    {
      text: "Jemand muss im letzten Feld des Esszimmers sein, R4 C8. Wir wissen, dass D und H die einzigen zwei Personen in C8-C9 sind, das isoliert D in R4 C8.",
      place: { D: { row: 3, col: 7 } },
    },
    {
      text: "Das isoliert eine unbekannte Person im letzten Feld von R8: R8 C4. Blockiere den Rest von C4. Das isoliert auch jemanden im letzten Feld von C6: R6 C6, blockiere den Rest von C6.",
      cross: [
        { row: 0, col: 3 },
        { row: 1, col: 3 },
        { row: 2, col: 3 },
        { row: 3, col: 3 },
        { row: 4, col: 3 },
        { row: 5, col: 3 },
        { row: 0, col: 5 },
        { row: 1, col: 5 },
        { row: 2, col: 5 },
        { row: 4, col: 5 },
      ],
    },
    {
      text: "Laut dem allgemeinen Hinweis sitzen genau zwei Personen auf einem Stuhl, das isoliert G auf dem letzten verbleibenden Stuhl, in R2 C1. Das isoliert A und dann H.",
      place: {
        G: { row: 1, col: 0 },
        A: { row: 0, col: 4 },
        H: { row: 2, col: 8 },
      },
    },
    {
      text: "Das isoliert C im letzten Feld neben einem Regal, R8 C4, dann E im letzten Feld, das nicht neben einem Fernseher ist, und dann V. V war allein mit E, Elodie ist die Mörderin!",
      place: {
        C: { row: 7, col: 3 },
        E: { row: 5, col: 5 },
        V: { row: 6, col: 1 },
      },
    },
  ],
  solution: {
    A: { row: 0, col: 4 },
    B: { row: 8, col: 6 },
    C: { row: 7, col: 3 },
    D: { row: 3, col: 7 },
    E: { row: 5, col: 5 },
    F: { row: 4, col: 2 },
    G: { row: 1, col: 0 },
    H: { row: 2, col: 8 },
    V: { row: 6, col: 1 },
  },
};
