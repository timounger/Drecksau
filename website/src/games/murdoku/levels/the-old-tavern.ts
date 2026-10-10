/**
 * The Old Tavern: a lounge, a toilet, a bar and a storeroom in an old pub, with
 * a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Die alte Taverne/Die alte Taverne.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Oleg is the victim; whoever was alone with him killed him.
 *
 * Chairs can be stood on; tables, shelves, plants and the TVs cannot.
 */
import { all, beside, column, inArea, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_OLD_TAVERN: Level = {
  id: "the-old-tavern",
  name: "Die alte Taverne",
  series: { book: "original", number: 13 },
  story:
    "Seit 1987 ist nichts passiert, was annähernd so aufregend war. Oleg wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Aufenthaltsraum",
      at: "im Aufenthaltsraum",
      ground: "floor",
      tint: "#dcd6c8",
      label: { row: 4, col: 1 },
    },
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "floor",
      tint: "#e6d8dc",
      label: { row: 2, col: 6 },
    },
    {
      key: "H",
      name: "Theke",
      at: "an der Theke",
      ground: "floor",
      tint: "#d8d1c0",
      label: { row: 7, col: 2 },
    },
    {
      key: "L",
      name: "Lagerraum",
      at: "im Lagerraum",
      ground: "stone",
      tint: "#c9c4e2",
      label: { row: 7, col: 5 },
    },
  ],
  areaMap: [
    "AAAATTTT",
    "AAAAATTT",
    "AAAAATTT",
    "AAAAAAAA",
    "AAAAAAAA",
    "HHHHHHLL",
    "HHHHHHLL",
    "HHHHHLLL",
  ],
  thingMap: [
    ".ctcc.c.",
    "p....t.t",
    "s.ct....",
    "t.t...pt",
    "..cccc.v",
    "t.tttt.s",
    "t...v...",
    "ss....s.",
  ],
  things: { c: "chair", t: "table", p: "plant", s: "shelf", v: "tv" },
  suspects: [
    {
      id: "A",
      name: "Amir",
      pronoun: "er",
      clue: { text: "Er war in der ersten Spalte.", ...column(1) },
      colour: "#b91c1c",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "B",
      name: "Baldur",
      pronoun: "er",
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#15803d",
      face: "\u{1F474}",
    },
    {
      id: "C",
      name: "Caleb",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Damien",
      pronoun: "er",
      clue: { text: "Er war in der Toilette.", ...inArea("T") },
      colour: "#6366f1",
      face: "\u{1F474}",
    },
    {
      id: "E",
      name: "Eric",
      pronoun: "er",
      clue: {
        text: "Er saß auf einem Stuhl in der Toilette.",
        ...all(on("chair"), inArea("T")),
      },
      colour: "#7c3aed",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "F",
      name: "Finn",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#ea580c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "G",
      name: "Gerhard",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#334155",
      face: "\u{1F9D4}",
    },
    {
      id: "O",
      name: "Oleg",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Eric saß auf einem Stuhl in der Toilette - beide Stühle dort stehen in R1. Amir steht in C1, wo nur R1 C1 und R5 C1 frei sind; R1 gehört Eric, also steht Amir in R5 C1.",
      place: { A: { row: 4, col: 0 } },
    },
    {
      text: "Gerhard saß auf einem Stuhl. R1 und R5 sind vergeben, es bleibt nur der Stuhl in R3 C3.",
      place: { G: { row: 2, col: 2 } },
    },
    {
      text: "Damien war in der Toilette. R1 und R3 sind vergeben, in R2 sind C6 und C8 Tische: Damien steht in R2 C7. Damit sitzt Eric auf dem Stuhl in R1 C5.",
      place: { D: { row: 1, col: 6 }, E: { row: 0, col: 4 } },
    },
    {
      text: "Finn war neben einer Pflanze. Neben der Pflanze in R2 C1 ist nichts mehr frei. Bei der Pflanze in R4 C7 liegt R3 C7 in der Toilette, R5 ist vergeben und R4 C8 ist ein Tisch: Finn steht in R4 C6.",
      place: { F: { row: 3, col: 5 } },
    },
    {
      text: "Frei sind noch R6 bis R8 in C2, C4 und C8. Baldur war neben einem Fernseher - nur R7 C4 neben dem Fernseher in R7 C5 passt. Caleb war neben einem Regal: R8 C8 neben dem Regal in R8 C7.",
      place: { B: { row: 6, col: 3 }, C: { row: 7, col: 7 } },
    },
    {
      text: "Für Oleg bleibt R6 C2 an der Theke - allein mit Baldur. Baldur ist der Mörder!",
      place: { O: { row: 5, col: 1 } },
    },
  ],
  solution: {
    A: { row: 4, col: 0 },
    B: { row: 6, col: 3 },
    C: { row: 7, col: 7 },
    D: { row: 1, col: 6 },
    E: { row: 0, col: 4 },
    F: { row: 3, col: 5 },
    G: { row: 2, col: 2 },
    O: { row: 5, col: 1 },
  },
};
