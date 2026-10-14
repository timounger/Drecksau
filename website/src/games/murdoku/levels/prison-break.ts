/**
 * Gefängnisausbruch: five prison cells and the common room, with a murdered
 * prisoner.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/43. Gefängnisausbruch.png`,
 * solution sheet `Lösungen 1-80/Lösung 41-44.JPG`).
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
  carpets: [
    [
      { row: 6, col: 0 },
      { row: 6, col: 1 },
      { row: 7, col: 0 },
      { row: 7, col: 1 },
      { row: 8, col: 0 },
      { row: 8, col: 1 },
    ],
  ],
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
      text: "Es sind drei Personen im Gemeinschaftsraum, und das müssen Benno, Emilio und Gustaf sein, mit Gustaf in Z7.",
    },
    {
      text: "Da jeder Raum besetzt ist, müssen die anderen fünf Verdächtigen jeweils in einem der verbleibenden fünf Räume sein.",
    },
    {
      text: "Die einzigen Verdächtigen, die in Zelle D und Zelle E sein können, sind Finnegan und Hector. Da Hector sitzt, muss er auf dem Stuhl in Zelle E sein (und Finnegan ist in Zelle D, in S7). Schließe jeden anderen Stuhl und den Rest von S7 aus.",
      place: { H: { row: 0, col: 7 } },
      cross: [
        { row: 0, col: 0 },
        { row: 1, col: 3 },
        { row: 1, col: 5 },
        { row: 5, col: 1 },
        { row: 5, col: 5 },
        { row: 6, col: 2 },
        { row: 6, col: 3 },
        { row: 6, col: 5 },
        { row: 6, col: 6 },
        { row: 7, col: 2 },
        { row: 7, col: 3 },
        { row: 7, col: 5 },
        { row: 7, col: 6 },
        { row: 8, col: 2 },
        { row: 8, col: 4 },
        { row: 8, col: 6 },
      ],
    },
    {
      text: "Das lässt nur ein verfügbares Feld in Z9, das nur Emilio besetzen kann, was ihn in S1 lokalisiert.",
      place: { E: { row: 8, col: 0 } },
    },
    {
      text: "Das lokalisiert Gustaf, was Benno lokalisiert, was Carsten lokalisiert.",
      place: {
        G: { row: 6, col: 8 },
        B: { row: 7, col: 4 },
        C: { row: 3, col: 1 },
      },
    },
    {
      text: "Carsten ist der einzige Verdächtige, der in Zelle A sein kann, in Z4 S2. Das lokalisiert Ace, dann Finnegan und Orestes. Derek ist der Mörder!",
      place: {
        A: { row: 4, col: 5 },
        F: { row: 1, col: 6 },
        O: { row: 5, col: 3 },
        D: { row: 2, col: 2 },
      },
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
