/**
 * The First Case: a living room, a bedroom, an entrance hall and a dining
 * room, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Der erste Fall/Der erste Fall.png`, no
 * solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Oliver is the victim; whoever was alone with him killed him.
 *
 * The two windows sit in the top wall; standing in front of one means being on
 * the field right below it. The rug and the bed can be stood on; the small
 * tables and the plants cannot.
 */
import { beside, inArea, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_FIRST_CASE: Level = {
  id: "the-first-case",
  name: "Dein erster Fall",
  series: { book: "original", number: 1 },
  story:
    "Dieser sollte nicht allzu knifflig sein. Erinnere dich einfach an dein Training.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#b9def0",
      label: { row: 2, col: 1 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#d6cbe8",
      label: { row: 2, col: 4 },
    },
    {
      key: "E",
      name: "Eingangsbereich",
      at: "im Eingangsbereich",
      ground: "floor",
      tint: "#ecd6dc",
      label: { row: 5, col: 1 },
    },
    {
      key: "Z",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#a9cfe8",
      label: { row: 5, col: 4 },
    },
  ],
  areaMap: ["WWWSSS", "WWWSSS", "WWWSSS", "EEEZZZ", "EEEZZZ", "EEEZZZ"],
  thingMap: [".f..f.", "..r.b.", "....b.", "t....t", "..p..p", "t....."],
  things: { f: "window", r: "rug", b: "bed", t: "table", p: "plant" },
  pieces: [{ at: { row: 1, col: 4 }, rows: 2, cols: 1 }],
  windows: [
    { at: { row: 0, col: 1 }, side: "top" },
    { at: { row: 0, col: 4 }, side: "top" },
  ],
  extraThings: {
    window: { name: "Fenster", emoji: "\u{1FA9F}", standable: true },
  },
  suspects: [
    {
      id: "A",
      name: "Axel",
      pronoun: "er",
      clue: { text: "Er war vor einem Fenster.", ...on("window") },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Bella",
      pronoun: "sie",
      clue: { text: "Sie war im Eingangsbereich.", ...inArea("E") },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "C",
      name: "Coraline",
      pronoun: "sie",
      clue: { text: "Sie war auf dem Teppich.", ...on("rug") },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Dominik",
      pronoun: "er",
      clue: { text: "Er war auf dem Bett.", ...on("bed") },
      colour: "#4338ca",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "E",
      name: "Elisa",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Pflanze.", ...beside("plant") },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Oliver",
      pronoun: "er",
      clue: { text: "Er war im letzten verbleibenden Feld.", ...victim() },
      colour: "#d97706",
      face: "\u{1F9D1}",
    },
  ],
  rules: [
    {
      note: true,
      text: "Man sagt, man vergisst seinen ersten Fall nie. Obwohl das bei mir nicht stimmte ... ein Verdächtiger hat mich bewusstlos geschlagen und ich verlor mein Gedächtnis. Ich hoffe, du hast mehr Glück!",
    },
  ],
  hints: [
    {
      text: "Coraline war auf dem Teppich - es gibt nur einen, in R2 C3. Blockiere den Rest von R2 und C3.",
      place: { C: { row: 1, col: 2 } },
      cross: [
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 3 },
        { row: 1, col: 4 },
        { row: 1, col: 5 },
        { row: 0, col: 2 },
        { row: 2, col: 2 },
        { row: 3, col: 2 },
        { row: 4, col: 2 },
        { row: 5, col: 2 },
      ],
    },
    {
      text: "Dominik war auf dem Bett. Es liegt auf R2 C5 und R3 C5, und R2 ist gesperrt: Dominik liegt in R3 C5. Blockiere den Rest von R3 und C5.",
      place: { D: { row: 2, col: 4 } },
      cross: [
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 3 },
        { row: 2, col: 5 },
        { row: 0, col: 4 },
        { row: 3, col: 4 },
        { row: 4, col: 4 },
        { row: 5, col: 4 },
      ],
    },
    {
      text: "Axel war vor einem Fenster: R1 C2 oder R1 C5. C5 ist gesperrt, also steht Axel in R1 C2.",
      place: { A: { row: 0, col: 1 } },
    },
    {
      text: "Bella war im Eingangsbereich. Dort ist nur noch C1 frei, und R4 C1 und R6 C1 sind Tische: Bella steht in R5 C1.",
      place: { B: { row: 4, col: 0 } },
    },
    {
      text: "Elisa war neben einer Pflanze. Neben der Pflanze in R5 C3 ist kein Feld mehr frei. Neben der Pflanze in R5 C6 steht in R4 C6 ein Tisch und R5 ist besetzt - Elisa steht in R6 C6.",
      place: { E: { row: 5, col: 5 } },
    },
    {
      text: "Für Oliver bleibt das letzte Feld, R4 C4 im Esszimmer - allein mit Elisa. Elisa ist die Mörderin!",
      place: { O: { row: 3, col: 3 } },
    },
  ],
  solution: {
    A: { row: 0, col: 1 },
    B: { row: 4, col: 0 },
    C: { row: 1, col: 2 },
    D: { row: 2, col: 4 },
    E: { row: 5, col: 5 },
    O: { row: 3, col: 3 },
  },
};
