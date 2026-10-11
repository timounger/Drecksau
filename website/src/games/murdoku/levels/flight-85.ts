/**
 * Flight 85: an aeroplane with two toilets, economy class, first class and a
 * cockpit, and a murdered passenger.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Flug 85/Flug 85.png`, no solution sheet),
 * with the culprit pencilled in on the photographed page.
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
      text: "Alle außer Evangeline saßen, also saß Angela in einer Toilette: auf R1 C2 oder R1 C5. Bernardo war östlich von Angela und David östlich von Bernardo - von C5 aus bliebe für beide nur C6. Angela saß in R1 C2. Blockiere den Rest von R1 und C2.",
      place: { A: { row: 0, col: 1 } },
      cross: [
        { row: 0, col: 0 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
        { row: 0, col: 4 },
        { row: 0, col: 5 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
        { row: 3, col: 1 },
        { row: 4, col: 1 },
        { row: 5, col: 1 },
        { row: 6, col: 1 },
        { row: 7, col: 1 },
        { row: 8, col: 1 },
        { row: 9, col: 1 },
      ],
    },
    {
      text: "Bernardo saß in der First Class östlich von C2 - die einzigen Stühle dort liegen in R7. Cassius saß in einer Spalte mit einem Fernseher seines Raums: R7 C3, R7 C5 oder R4 C6. R7 gehört Bernardo, also saß Cassius in R4 C6. Blockiere den Rest von R4 und C6.",
      place: { C: { row: 3, col: 5 } },
      cross: [
        { row: 3, col: 0 },
        { row: 3, col: 2 },
        { row: 3, col: 3 },
        { row: 3, col: 4 },
        { row: 1, col: 5 },
        { row: 2, col: 5 },
        { row: 4, col: 5 },
        { row: 5, col: 5 },
        { row: 6, col: 5 },
        { row: 7, col: 5 },
        { row: 8, col: 5 },
      ],
    },
    {
      text: "Für Bernardo bleiben R7 C3 und R7 C5. David war östlich von ihm, und C6 ist blockiert - also saß Bernardo in R7 C3.",
      place: { B: { row: 6, col: 2 } },
    },
    {
      text: "David saß allein, östlich von C3, also in C4 oder C5. Dort sind noch die Stühle R3 C5, R5 C5 und R6 C5 in der Economy-Class frei - da wäre er mit Cassius - und R10 C4 im Cockpit. David saß in R10 C4.",
      place: { D: { row: 9, col: 3 } },
    },
    {
      text: "Frei sind nur noch C1 und C5. Evangeline stand, und Angela war die einzige Person in den Toiletten, also nicht R2 C5. Evangeline stand in R8 C5. Omar saß in C1 - nur der Stuhl in R5 C1 ist frei. In der Economy-Class war er allein mit Cassius - Cassius ist der Mörder!",
      place: { E: { row: 7, col: 4 }, O: { row: 4, col: 0 } },
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
