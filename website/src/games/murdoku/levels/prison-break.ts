/**
 * Gefängnisausbruch: five prison cells and the common room, with a murdered
 * prisoner.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/43. Gefängnisausbruch.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Orestes is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the beds can be stood on. The
 * tables, the television and the plants cannot. The purple rug in the common
 * room is carpet underfoot. "Beside a bed, left of it" means the bed field
 * right east of the suspect, in the same cell.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  counting,
  inArea,
  not,
  on,
  onGround,
  own,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether nobody but the suspect stood on a thing of this id. */
function onlyOneOn(what: string): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return id === c.self || there === undefined || !c.is(there, what);
    });
}

/** The case. */
export const PRISON_BREAK: Level = {
  id: "prison-break",
  name: "Gefängnisausbruch",
  series: { book: "original", number: 43 },
  story:
    "Will man es poetisch betrachten, so ist er den Fesseln der Sterblichkeit entkommen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Zelle A",
      at: "in Zelle A",
      ground: "floor",
      tint: "#e3e6ee",
      label: { row: 5, col: 0 },
    },
    {
      key: "B",
      name: "Zelle B",
      at: "in Zelle B",
      ground: "floor",
      tint: "#dfe3ec",
      label: { row: 5, col: 2 },
    },
    {
      key: "C",
      name: "Zelle C",
      at: "in Zelle C",
      ground: "floor",
      tint: "#e3e6ee",
      label: { row: 5, col: 4 },
    },
    {
      key: "D",
      name: "Zelle D",
      at: "in Zelle D",
      ground: "floor",
      tint: "#dfe3ec",
      label: { row: 5, col: 6 },
    },
    {
      key: "E",
      name: "Zelle E",
      at: "in Zelle E",
      ground: "floor",
      tint: "#e3e6ee",
      label: { row: 5, col: 8 },
    },
    {
      key: "G",
      name: "Gemeinschaftsraum",
      at: "im Gemeinschaftsraum",
      ground: "floor",
      tint: "#c9daea",
      label: { row: 8, col: 3 },
    },
  ],
  areaMap: [
    "AABBCCDEE",
    "AABBCCDEE",
    "AABBCCDEE",
    "AABBCCDDE",
    "AABBCCDDE",
    "AABBCCDDE",
    "GGGGGGGGG",
    "GGGGGGGGG",
    "GGGGGGGGG",
  ],
  groundMap: [
    "fffffffff",
    "fffffffff",
    "fffffffff",
    "fffffffff",
    "fffffffff",
    "fffffffff",
    "rrfffffff",
    "rrfffffff",
    "rrfffffff",
  ],
  grounds: { f: "floor", r: "carpet" },
  thingMap: [
    "c....ttc.",
    "...c.c...",
    ".b.b.b...",
    ".btb.b...",
    "....t....",
    ".c..tct..",
    ".pccvcc..",
    "..cc.c...",
    ".pctctc.t",
  ],
  things: { b: "bed", c: "chair", p: "plant", t: "table", v: "tv" },
  pieces: [
    { at: { row: 2, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 4 }, rows: 2, cols: 1 },
  ],
  windows: [
    { at: { row: 0, col: 1 }, side: "top" },
    { at: { row: 0, col: 3 }, side: "top" },
    { at: { row: 0, col: 5 }, side: "top" },
  ],
  suspects: [
    {
      id: "A",
      name: "Ace",
      pronoun: "er",
      clue: { text: "Er war in Zelle C.", ...inArea("C") },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Benno",
      pronoun: "er",
      clue: {
        text: "Er war im Gemeinschaftsraum. Er war nicht auf dem Teppich.",
        ...all(inArea("G"), not(onGround("carpet"))),
      },
      colour: "#15803d",
      face: "\u{1F46E}",
    },
    {
      id: "C",
      name: "Carsten",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Bett.",
        ...all(on("bed"), counting(onlyOneOn("bed"))),
      },
      colour: "#0e7490",
      face: "\u{1F471}",
    },
    {
      id: "D",
      name: "Derek",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Bett, links davon.",
        ...own((c) => {
          const east = { row: c.cell.row, col: c.cell.col + 1 };
          return c.areaOf(east) === c.areaOf(c.cell) && c.is(east, "bed");
        }),
      },
      colour: "#6366f1",
      face: "\u{1F46E}‍♂️",
    },
    {
      id: "E",
      name: "Emilio",
      pronoun: "er",
      clue: { text: "Er war auf dem Teppich.", ...onGround("carpet") },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Finnegan",
      pronoun: "er",
      clue: {
        text: "Er war in Zelle D oder Zelle E.",
        ...inArea("D", "E"),
      },
      colour: "#9f1239",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "G",
      name: "Gustaf",
      pronoun: "er",
      clue: {
        text: "Er war in derselben Zeile wie der Fernseher.",
        ...row(7),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Hector",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOn("chair"))),
      },
      colour: "#4338ca",
      face: "\u{1F474}",
    },
    {
      id: "O",
      name: "Orestes",
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
      text: "Es gab keinen leeren Raum.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length > 0),
    },
  ],
  hints: [
    {
      text: "Gustaf (in R7), Emilio (auf dem Teppich) und Benno waren im Gemeinschaftsraum. Er hat nur drei Reihen - sonst war niemand dort. Die anderen sechs verteilen sich auf die fünf Zellen, und keine ist leer: Genau eine Zelle hat zwei Personen - Orestes und den Mörder. In jeder anderen Zelle war genau eine Person.",
    },
    {
      text: "Hector saß als Einziger, also auf einem Stuhl in einer Zelle. In Zelle D gibt es weder Stuhl noch Bett: Dort kann nur Finnegan oder Orestes sein. In Zelle E nur Finnegan, Orestes oder Hector auf dem Stuhl in R1 C8. Wäre Hector nicht in Zelle E, müssten Finnegan und Orestes die Zellen D und E jeder für sich füllen - Orestes wäre ohne den Mörder. Also saß Hector in R1 C8.",
      place: { H: { row: 0, col: 7 } },
    },
    {
      text: "Der Teil von Zelle D in C8 ist durch Hector gesperrt, es bleibt C7 - dort hat nur eine Person Platz. Orestes kann also nicht mit dem Mörder in Zelle D sein: Finnegan war in Zelle D, in C7.",
      cross: [
        { row: 3, col: 7 },
        { row: 4, col: 7 },
        { row: 5, col: 7 },
      ],
    },
    {
      text: "Carsten (auf einem Bett) und Derek (links neben einem Bett) können nur in R3 oder R4 sein - sie teilen sich diese beiden Reihen. Ace in Zelle C war also nicht in R1, R3 oder R4 und weder auf einem Stuhl noch auf einem Tisch: R2 C5 oder R5 C6.",
    },
    {
      text: "Gustaf in R7 stand nicht auf einem Stuhl: R7 C1 oder R7 C9 (C8 ist gesperrt). Benno war nicht auf dem Teppich, nicht auf einem Stuhl und nicht in R7: Ohne C7 und C8 bleiben R8 C5 und R8 C9. Emilio auf dem Teppich: R7 C1, R8 C1, R8 C2 oder R9 C1 (in R7 C2 und R9 C2 stehen Pflanzen).",
    },
    {
      text: "Stünde Benno in R8 C9, wäre Gustaf in R7 C1 - und Emilio fände kein Feld mehr: C1, R7 und R8 wären belegt. Also stand Benno in R8 C5, Gustaf in R7 C9 und Emilio in R9 C1. Damit kann auch Orestes nicht in Zelle E sein: C8 und C9 sind dort belegt.",
      place: {
        B: { row: 7, col: 4 },
        G: { row: 6, col: 8 },
        E: { row: 8, col: 0 },
      },
    },
    {
      text: "C1 und C5 sind belegt: Derek bleibt nur R3 C3, links vom Bett in Zelle B, und Carsten lag in R4. Ace war nicht in C5, also in R5 C6. Finnegan in C7 bleibt nur R2 C7.",
      place: {
        D: { row: 2, col: 2 },
        A: { row: 4, col: 5 },
        F: { row: 1, col: 6 },
      },
    },
    {
      text: "Carsten lag in R4, C6 ist belegt: R4 C2 oder R4 C4. Orestes bleibt R6, in C2 oder C4 - auf dem Stuhl in R6 C2 saß er nicht, nur Hector saß. Orestes war in R6 C4, Carsten in R4 C2. In Zelle B war Orestes allein mit Derek - Derek ist der Mörder!",
      place: { O: { row: 5, col: 3 }, C: { row: 3, col: 1 } },
    },
  ],
  solution: {
    A: { row: 4, col: 5 },
    B: { row: 7, col: 4 },
    C: { row: 3, col: 1 },
    D: { row: 2, col: 2 },
    E: { row: 8, col: 0 },
    F: { row: 1, col: 6 },
    G: { row: 6, col: 8 },
    H: { row: 0, col: 7 },
    O: { row: 5, col: 3 },
  },
};
