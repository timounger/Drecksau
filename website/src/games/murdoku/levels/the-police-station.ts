/**
 * The Police Station: an evidence room, an open-plan office, a cell, an
 * interrogation room, a reception and the chief's office, with a murdered
 * officer.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Die Polizeistation/Die Polizeistation.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Odin is the victim; whoever was alone with him killed him.
 *
 * A field is in a corner of its room when the room's border runs along two of
 * its sides that meet: one above or below it, one to its left or right. The
 * chairs and the bed can be stood on; the desks, shelves, TVs and plants
 * cannot.
 */
import {
  all,
  alone,
  beside,
  cellsWhere,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Level } from "../engine/types";

/** Whether a field lies in a corner of its room, given the room of each field. */
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

/** The case. */
export const THE_POLICE_STATION: Level = {
  id: "the-police-station",
  name: "Die Polizeistation",
  series: { book: "original", number: 18 },
  story:
    "Immerhin mussten wir für die Ermittlungen nicht weit fahren. Odin wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Asservatenkammer",
      at: "in der Asservatenkammer",
      ground: "floor",
      tint: "#d4cbe6",
      label: { row: 0, col: 0 },
    },
    {
      key: "G",
      name: "Großraumbüro",
      at: "im Großraumbüro",
      ground: "floor",
      tint: "#ddd0e8",
      label: { row: 4, col: 1 },
    },
    {
      key: "Z",
      name: "Gefängniszelle",
      at: "in der Gefängniszelle",
      ground: "stone",
      tint: "#c9cdd2",
      label: { row: 2, col: 6 },
    },
    {
      key: "V",
      name: "Verhörraum",
      at: "im Verhörraum",
      ground: "stone",
      tint: "#d9dcdf",
      label: { row: 5, col: 6 },
    },
    {
      key: "E",
      name: "Empfangsbereich",
      at: "im Empfangsbereich",
      ground: "floor",
      tint: "#cfc6dc",
      label: { row: 8, col: 1 },
    },
    {
      key: "B",
      name: "Büro des Chiefs",
      at: "im Büro des Chiefs",
      ground: "carpet",
      tint: "#c6d3ea",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "AAAAGGZZZ",
    "AAGGGGZZZ",
    "GGGGGVZZZ",
    "GGGGGVVVV",
    "GGGGGVVVV",
    "EEEEEVVVV",
    "EEEEEBBBB",
    "EEEEEBBBB",
    "EEEEEBBBB",
  ],
  thingMap: [
    "sss.tc..t",
    "..c.t.bb.",
    "t.tf.....",
    "fc....tc.",
    "tt..ptt..",
    ".........",
    ".tc....tt",
    ".ttp..ctc",
    ".....p.tf",
  ],
  things: {
    b: "bed",
    c: "chair",
    f: "tv",
    p: "plant",
    s: "shelf",
    t: "table",
  },
  suspects: [
    {
      id: "A",
      name: "Annika",
      pronoun: "sie",
      clue: { text: "Sie war in der Asservatenkammer.", ...inArea("A") },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bertie",
      pronoun: "er",
      clue: { text: "Er war im Empfangsbereich.", ...inArea("E") },
      colour: "#15803d",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Charlie",
      pronoun: "er",
      traits: ["glasses"],
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#0e7490",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "D",
      name: "Donovan",
      pronoun: "er",
      traits: ["cap"],
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Ernst",
      pronoun: "er",
      clue: { text: "Er war auf dem Bett.", ...on("bed") },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Filipa",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#9f1239",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "Gregor",
      pronoun: "er",
      clue: {
        text: "Er war allein im Büro des Chiefs.",
        ...all(inArea("B"), alone()),
      },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Harrison",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke seines Raumes.",
        ...own((c) => inCorner(c.areaOf, c.cell)),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#334155",
      face: "\u{1F9D4}",
    },
    {
      id: "O",
      name: "Odin",
      pronoun: "er",
      traits: ["cap"],
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      text: "Es gab keinen leeren Raum.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length > 0),
    },
  ],
  hints: [
    {
      text: "Ernst war auf dem Bett. Es liegt in der Gefängniszelle auf R2 C7 und R2 C8 - R2 gehört also Ernst. Annika war in der Asservatenkammer: R1 C1 bis C3 sind Regale und R2 ist vergeben, also steht Annika in R1 C4. Blockiere den Rest von R2 und C4.",
      place: { A: { row: 0, col: 3 } },
      cross: [
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
        { row: 1, col: 5 },
        { row: 1, col: 8 },
        { row: 3, col: 3 },
        { row: 4, col: 3 },
        { row: 5, col: 3 },
        { row: 6, col: 3 },
        { row: 8, col: 3 },
      ],
    },
    {
      text: "Im Büro des Chiefs war Gregor allein. Donovan war neben einem Fernseher: R3 C5 (neben R3 C4) oder R4 C2 (neben R4 C1). Charlie war neben einer Pflanze: da C4 blockiert ist, bleiben nur R4 C5 und R8 C5, beide in C5. Stünde Donovan in R3 C5, bliebe für Charlie nichts - also steht Donovan in R4 C2 und Charlie in R8 C5.",
      place: { D: { row: 3, col: 1 }, C: { row: 7, col: 4 } },
      cross: [
        { row: 3, col: 2 },
        { row: 3, col: 4 },
        { row: 3, col: 5 },
        { row: 3, col: 7 },
        { row: 3, col: 8 },
        { row: 7, col: 0 },
        { row: 7, col: 5 },
        { row: 7, col: 6 },
        { row: 7, col: 8 },
        { row: 2, col: 1 },
        { row: 5, col: 1 },
        { row: 8, col: 1 },
        { row: 2, col: 4 },
        { row: 5, col: 4 },
        { row: 6, col: 4 },
        { row: 8, col: 4 },
      ],
    },
    {
      text: "Filipa saß auf einem Stuhl. Die Stühle in R1 C6, R2 C3 und R4 C8 liegen in vergebenen Reihen, im Büro des Chiefs war Gregor allein, also saß Filipa in R7 C3.",
      place: { F: { row: 6, col: 2 } },
    },
    {
      text: "Gregor war allein im Büro des Chiefs. R7 und R8 sind vergeben, und in R9 stehen eine Pflanze, der Schreibtisch und ein Fernseher - Gregor war in R9 C7. Damit bleibt Ernst nur R2 C8. Bertie war im Empfangsbereich: C2 bis C5 und R9 sind vergeben, also R6 C1.",
      place: {
        G: { row: 8, col: 6 },
        E: { row: 1, col: 7 },
        B: { row: 5, col: 0 },
      },
    },
    {
      text: "Für Harrison und Odin bleiben R3 und R5 in C6 und C9. R5 C6 ist ein Tisch, also sind es R3 C6 und R5 C9. Nur R3 C6 ist eine Ecke seines Raumes: Harrison steht dort, Odin in R5 C9. Im Verhörraum war Odin allein mit Harrison - Harrison ist der Mörder!",
      place: { H: { row: 2, col: 5 }, O: { row: 4, col: 8 } },
    },
  ],
  solution: {
    A: { row: 0, col: 3 },
    B: { row: 5, col: 0 },
    C: { row: 7, col: 4 },
    D: { row: 3, col: 1 },
    E: { row: 1, col: 7 },
    F: { row: 6, col: 2 },
    G: { row: 8, col: 6 },
    H: { row: 2, col: 5 },
    O: { row: 4, col: 8 },
  },
};
