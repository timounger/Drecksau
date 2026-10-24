/**
 * Das Strandresort: a dining room, a bedroom, a balcony and the sea in Bora
 * Bora, with a murdered holidaymaker.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 3 - Auf Weltreise/1. Das Strandresport.png`,
 * no solution sheet - the solved grid and the culprit are pencilled in on
 * the photographed page, and the solver proves it is the only solution).
 * Onur is the victim; whoever was alone with him killed him.
 *
 * The map is five by five. The bed, the chair and the rug can be stood on;
 * the tables and the shelves cannot. The wooden strip west of the balcony
 * belongs to the balcony.
 */
import { inArea, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_BEACH_RESORT: Level = {
  id: "the-beach-resort",
  name: "Das Strandresort",
  series: { book: "worldTravel", number: 1 },
  story: "Das war die Reise ihres Lebens.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#ecdcbc",
      label: { row: 2, col: 1 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#e6d6c0",
      label: { row: 2, col: 3 },
    },
    {
      key: "B",
      name: "Balkon",
      at: "auf dem Balkon",
      ground: "floor",
      tint: "#e9dcc4",
      label: { row: 3, col: 2 },
    },
    {
      key: "M",
      name: "Meer",
      at: "im Meer",
      ground: "water",
      tint: "#a7d3f2",
      label: { row: 4, col: 3 },
    },
  ],
  areaMap: ["EEESS", "EEESS", "EEESS", "BBBBM", "BMMMM"],
  thingMap: ["tt.bt", "sc.b.", "....s", ".rrr.", "....."],
  things: {
    b: "bed",
    c: "chair",
    r: "rug",
    s: "shelf",
    t: "table",
  },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 1 }, rows: 1, cols: 3 },
  ],
  suspects: [
    {
      id: "A",
      name: "Andrea",
      pronoun: "sie",
      clue: { text: "Sie war im Meer.", ...inArea("M") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Brooke",
      pronoun: "sie",
      clue: { text: "Sie war auf dem Teppich.", ...on("rug") },
      colour: "#ca8a04",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "C",
      name: "Carlos",
      pronoun: "er",
      clue: { text: "Er war auf dem Bett.", ...on("bed") },
      colour: "#7c3aed",
      face: "\u{1F474}",
    },
    {
      id: "D",
      name: "Debbie",
      pronoun: "sie",
      clue: { text: "Sie saß auf dem Stuhl.", ...on("chair") },
      colour: "#b91c1c",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "O",
      name: "Onur",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  hints: [
    {
      text: "Debbie saß auf dem Stuhl - es gibt nur einen, in R2 C2.",
      place: { D: { row: 1, col: 1 } },
    },
    {
      text: "Carlos war auf dem Bett, in R1 C4 oder R2 C4. R2 ist Debbies Zeile - Carlos liegt in R1 C4.",
      place: { C: { row: 0, col: 3 } },
    },
    {
      text: "Brooke war auf dem Teppich, in R4 C2 bis C4. C2 ist Debbies Spalte, C4 die von Carlos - Brooke steht in R4 C3.",
      place: { B: { row: 3, col: 2 } },
    },
    {
      text: "Andrea war im Meer. R4 ist Brookes Zeile, also R5 - und dort sind C2, C3 und C4 besetzt. Andrea schwimmt in R5 C5.",
      place: { A: { row: 4, col: 4 } },
    },
    {
      text: "Für Onur bleibt nur R3 C1 im Esszimmer - allein mit Debbie. Debbie ist die Mörderin!",
      place: { O: { row: 2, col: 0 } },
    },
  ],
  solution: {
    A: { row: 4, col: 4 },
    B: { row: 3, col: 2 },
    C: { row: 0, col: 3 },
    D: { row: 1, col: 1 },
    O: { row: 2, col: 0 },
  },
};
