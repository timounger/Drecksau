/**
 * The Study Session: a living room, a study, a bathroom and a bedroom of a
 * student's flat, with a murdered student.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Lernsession/Lernsession.png`, no solution
 * sheet - the solver proves the one solution, with the culprit pencilled in on
 * the photographed page).
 * Olaf is the victim; whoever was alone with him killed him.
 *
 * Two windows sit in the top wall and one in the left wall; standing in front
 * of one means being on the field right next to it. The armchairs and the bed
 * can be stood on, sitting on a chair means being on an armchair; the tables,
 * the plants and the TV cannot be stood on.
 */
import { all, beside, counting, inArea, on, victim } from "../engine/clues";
import type { Context, Level } from "../engine/types";

/**
 * How many people stand on a field with this thing.
 *
 * @param c - the context
 * @param what - the thing's id
 * @returns the count
 */
function countOn(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  }).length;
}

/** The case. */
export const STUDY_SESSION: Level = {
  id: "study-session",
  name: "Lernsession",
  series: { book: "original", number: 5 },
  story:
    "Er dachte wahrscheinlich, bei seiner Abschlussprüfung durchzufallen wäre das Schlimmste, was ihm passieren könnte.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#ece8e0",
      label: { row: 5, col: 0 },
    },
    {
      key: "A",
      name: "Arbeitszimmer",
      at: "im Arbeitszimmer",
      ground: "floor",
      tint: "#eeeac4",
      label: { row: 0, col: 2 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#e4ebe4",
      label: { row: 5, col: 3 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#ece6e2",
      label: { row: 5, col: 4 },
    },
  ],
  areaMap: ["WWAASS", "WWAASS", "WWAASS", "WWBBSS", "WWBBSS", "WWBBSS"],
  thingMap: ["cf..f.", "..c...", ".cp..t", "f...bb", "v.tc..", "..p..t"],
  things: {
    b: "bed",
    c: "chair",
    f: "window",
    p: "plant",
    t: "table",
    v: "tv",
  },
  extraThings: {
    window: { name: "Fenster", emoji: "\u{1FA9F}", standable: true },
  },
  pieces: [{ at: { row: 3, col: 4 }, rows: 1, cols: 2 }],
  windows: [
    { at: { row: 0, col: 1 }, side: "top" },
    { at: { row: 0, col: 4 }, side: "top" },
    { at: { row: 3, col: 0 }, side: "left" },
  ],
  suspects: [
    {
      id: "A",
      name: "Aaron",
      pronoun: "er",
      clue: { text: "Er war auf dem Bett.", ...on("bed") },
      colour: "#b91c1c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "B",
      name: "Bruno",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person, die auf einem Stuhl saß.",
        ...all(
          on("chair"),
          counting((c) => countOn(c, "chair") === 1),
        ),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Clara",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person vor einem Fenster.",
        ...all(
          on("window"),
          counting((c) => countOn(c, "window") === 1),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Donna",
      pronoun: "sie",
      clue: { text: "Sie war im Badezimmer.", ...inArea("B") },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Evelyn",
      pronoun: "sie",
      clue: { text: "Sie war neben dem Fernseher.", ...beside("tv") },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Olaf",
      pronoun: "er",
      clue: { text: "Er war im letzten verbleibenden Feld.", ...victim() },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  rules: [
    {
      note: true,
      text: "Tipp: Wenn du weißt, dass Aaron auf einem bestimmten Bett ist, kann niemand sonst in Feldern dieser Spalte sein.",
    },
  ],
  hints: [
    {
      text: "Aaron war auf dem Bett. Es liegt auf R4 C5 und R4 C6 - Aaron war also in R4. Blockiere den Rest von R4.",
      cross: [
        { row: 3, col: 0 },
        { row: 3, col: 1 },
        { row: 3, col: 2 },
        { row: 3, col: 3 },
      ],
    },
    {
      text: "Donna war im Badezimmer. R4 ist gesperrt, in R5 C3 steht ein Tisch und in R6 C3 eine Pflanze. Auf den Sessel in R5 C4 kann sie nicht, denn nur Bruno saß auf einem Stuhl. Donna war in R6 C4 - blockiere den Rest von R6 und C4.",
      place: { D: { row: 5, col: 3 } },
      cross: [
        { row: 5, col: 0 },
        { row: 5, col: 1 },
        { row: 5, col: 4 },
        { row: 0, col: 3 },
        { row: 1, col: 3 },
        { row: 2, col: 3 },
        { row: 4, col: 3 },
      ],
    },
    {
      text: "Evelyn war neben dem Fernseher in R5 C1. R4 C1 und R6 C1 sind gesperrt, also war sie in R5 C2. Blockiere den Rest von R5 und C2.",
      place: { E: { row: 4, col: 1 } },
      cross: [
        { row: 4, col: 4 },
        { row: 4, col: 5 },
        { row: 0, col: 1 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
      ],
    },
    {
      text: "Clara war vor einem Fenster. R4 C1 und R1 C2 sind gesperrt, es bleibt R1 C5. Blockiere den Rest von R1 und C5 - damit war Aaron in R4 C6.",
      place: { C: { row: 0, col: 4 }, A: { row: 3, col: 5 } },
      cross: [
        { row: 0, col: 0 },
        { row: 0, col: 2 },
        { row: 0, col: 5 },
        { row: 1, col: 4 },
        { row: 2, col: 4 },
      ],
    },
    {
      text: "Bruno saß auf einem Stuhl. Die Sessel in R1 C1, R3 C2 und R5 C4 sind gesperrt, also saß er in R2 C3.",
      place: { B: { row: 1, col: 2 } },
    },
    {
      text: "Olaf blieb das letzte Feld, R3 C1. Im Wohnzimmer war er allein mit Evelyn - Evelyn ist die Mörderin!",
      place: { O: { row: 2, col: 0 } },
    },
  ],
  solution: {
    A: { row: 3, col: 5 },
    B: { row: 1, col: 2 },
    C: { row: 0, col: 4 },
    D: { row: 5, col: 3 },
    E: { row: 4, col: 1 },
    O: { row: 2, col: 0 },
  },
};
