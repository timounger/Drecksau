/**
 * Flight 85: an aeroplane with two toilets, economy class, first class and a
 * cockpit, and a murdered passenger.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Flug 85/Flug 85.png`, solution sheet
 * `game_instructions/Murdoku/Das Murdoku-Orginal/Lösungen 1-80/Lösung 21-24.JPG`).
 * Omar is the victim; whoever was alone with him killed him. The map has ten
 * rows but only six people, so four rows stay empty.
 *
 * Every seat - the toilet seats too - is a chair. Angela being "the only
 * person in one of the toilets" means she was in a toilet and nobody else was
 * in either. The dark side tables and the TVs cannot be stood on.
 */
import {
  about,
  all,
  alone,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether the suspect is the only person in the two toilets. */
function onlyOneInTheToilets(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return (
      id === c.self ||
      there === undefined ||
      !["T", "U"].includes(c.areaOf(there) ?? "")
    );
  });
}

/** Whether everybody but the suspect sits on a chair. */
function allOthersSitting(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || c.is(there, "chair");
  });
}

/** Whether a TV stands in the field's column, in the field's area. */
function tvInColumn(c: Context): boolean {
  const area = c.areaOf(c.cell);
  return Array.from({ length: c.rows }, (_, row) => ({
    row,
    col: c.cell.col,
  })).some((cell) => c.areaOf(cell) === area && c.is(cell, "tv"));
}

/** The case. */
export const FLIGHT_85: Level = {
  id: "flight-85",
  name: "Flug 85",
  series: { book: "original", number: 22 },
  story: "Was für eine sinnlose Verschwendung von Vielfliegermeilen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "T",
      name: "Toilette 1",
      at: "in Toilette 1",
      ground: "floor",
      tint: "#c9c4e6",
      label: { row: 1, col: 0 },
    },
    {
      key: "U",
      name: "Toilette 2",
      at: "in Toilette 2",
      ground: "floor",
      tint: "#c9c4e6",
      label: { row: 1, col: 4 },
    },
    {
      key: "E",
      name: "Economy-Class",
      at: "in der Economy-Class",
      ground: "floor",
      tint: "#cfe0ea",
      label: { row: 5, col: 2 },
    },
    {
      key: "F",
      name: "First Class",
      at: "in der First Class",
      ground: "carpet",
      tint: "#c7dbe8",
      label: { row: 8, col: 2 },
    },
    {
      key: "C",
      name: "Cockpit",
      at: "im Cockpit",
      ground: "floor",
      tint: "#d6e2ea",
      label: { row: 9, col: 2 },
    },
  ],
  areaMap: [
    "TTEEUU",
    "TTEEUU",
    "EEEEEE",
    "EEEEEE",
    "EEEEEE",
    "EEEEEE",
    "FFFFFF",
    "FFFFFF",
    "FFFFFF",
    ".CCCC.",
  ],
  thingMap: [
    ".c..c.",
    "......",
    "tc..c.",
    "cc..cc",
    "cc..c.",
    "t...cf",
    ".cc.cc",
    "cct...",
    "tcf.f.",
    "..cc..",
  ],
  things: { c: "chair", f: "tv", t: "table" },
  suspects: [
    {
      id: "A",
      name: "Angela",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person in einer der Toiletten.",
        ...all(inArea("T", "U"), counting(onlyOneInTheToilets)),
      },
      colour: "#b91c1c",
      face: "\u{1F475}",
    },
    {
      id: "B",
      name: "Bernardo",
      pronoun: "er",
      clue: {
        text: "Er war in der First Class. Er war westlich von David und östlich von Angela.",
        ...all(
          inArea("F"),
          about(["A", "D"], (c) => {
            const david = c.cellOf("D");
            const angela = c.cellOf("A");
            return (
              david !== undefined &&
              angela !== undefined &&
              c.cell.col < david.col &&
              c.cell.col > angela.col
            );
          }),
        ),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Cassius",
      pronoun: "er",
      clue: {
        text: "Er war in derselben Spalte wie ein Fernseher in seinem Raum.",
        ...own(tvInColumn),
      },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "David",
      pronoun: "er",
      clue: { text: "Er war allein.", ...alone() },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Evangeline",
      pronoun: "sie",
      clue: {
        text: "Sie stand. Alle anderen im Flugzeug saßen auf einem Stuhl, einschließlich Omar.",
        ...all(not(on("chair")), counting(allOthersSitting)),
      },
      colour: "#7c3aed",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "O",
      name: "Omar",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  rules: [
    {
      note: true,
      text: "Detective, manche Tatorte haben ungewöhnliche Abmessungen. Dieser hier hat zum Beispiel zehn Zeilen und sechs Spalten, was bedeutet, dass vier Zeilen leer sein werden. - Chief Williams",
    },
  ],
  hints: [
    {
      text: "Jede einzelne Person saß auf einem Stuhl außer Evangeline. Das platziert Angela auf einen Stuhl in Zeile 1. Schließe den Rest beider Toiletten aus.",
      cross: [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 0, col: 5 },
        { row: 1, col: 4 },
        { row: 1, col: 5 },
      ],
    },
    {
      text: "Bernardo war in der First Class und östlich von Angela. Das platziert ihn in Zeile 7, sitzend in Spalte 3, 5 oder 6.",
    },
    {
      text: "Cassius kann nicht in der First Class sein, sonst würde er in derselben Zeile wie Bernardo sitzen, also ist er in der Economy-Class, in Zeile 4, Spalte 6.",
      place: { C: { row: 3, col: 5 } },
    },
    {
      text: "David kann nur allein im Cockpit sein, und er ist östlich von Bernardo, also muss er in Spalte 4 sitzen, was Bernardo in Spalte 3 und Angela in Spalte 2 lokalisiert.",
      place: {
        D: { row: 9, col: 3 },
        B: { row: 6, col: 2 },
        A: { row: 0, col: 1 },
      },
    },
    {
      text: "Es bleibt nur ein Feld ohne Stuhl übrig. Das lokalisiert Evangeline.",
      place: { E: { row: 7, col: 4 } },
    },
    {
      text: "Das lokalisiert Omar in der Economy-Class mit Cassius. Cassius ist der Mörder!",
      place: { O: { row: 4, col: 0 } },
    },
  ],
  solution: {
    A: { row: 0, col: 1 },
    B: { row: 6, col: 2 },
    C: { row: 3, col: 5 },
    D: { row: 9, col: 3 },
    E: { row: 7, col: 4 },
    O: { row: 4, col: 0 },
  },
};
