/**
 * Der Kerker: three cells, two royal cells and the passage between them, with
 * a murdered prisoner.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/5. Der Kerker/Der Kerker.png`,
 * no solution sheet - the solved grid and the culprit are pencilled in on
 * the photographed page, and the solver proves it is the only solution).
 * Ortolf is the victim; whoever was alone with him killed him.
 *
 * The map is eight by eight with two fields missing at the top left and
 * three at the bottom right. The doors sit in the walls between two rooms; a
 * field is in front of a door when the door lies on one of its sides - on
 * either side of the wall ({@link DOORS}). Chairs and mud puddles can be
 * stood on; jugs, tables and the shelf cannot.
 *
 * The book's estates make it unique: nobles (purple cards: Gordon) only in
 * the royal cells, villagers (wooden cards: Aldvin, Benedikt, Dominik,
 * Elias) only in the others, knights (grey shields: Claude, Forrester and
 * Ortolf) anywhere.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  own,
  ranks,
  row,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The doors: the two fields on either side of each. */
const DOORS: readonly (readonly [Cell, Cell])[] = [
  [
    { row: 1, col: 4 },
    { row: 1, col: 5 },
  ],
  [
    { row: 2, col: 5 },
    { row: 2, col: 6 },
  ],
  [
    { row: 4, col: 5 },
    { row: 4, col: 6 },
  ],
  [
    { row: 4, col: 2 },
    { row: 5, col: 2 },
  ],
  [
    { row: 4, col: 3 },
    { row: 5, col: 3 },
  ],
  [
    { row: 5, col: 3 },
    { row: 6, col: 3 },
  ],
  [
    { row: 6, col: 4 },
    { row: 6, col: 5 },
  ],
];

/** Whether a door lies on one of a field's sides. */
function beforeDoor(cell: Cell): boolean {
  return DOORS.some((door) =>
    door.some((one) => one.row === cell.row && one.col === cell.col),
  );
}

/** Whether exactly one person stood on a thing of this id. */
function onlyOneOn(c: Context, what: string): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, what);
    }).length === 1
  );
}

/** The case. */
export const THE_DUNGEON: Level = {
  id: "the-dungeon",
  name: "Der Kerker",
  series: { book: "timeTravel", number: 5 },
  story:
    "Oh, sieh an: Benedikt! Nun ja - es gilt die Unschuldsvermutung bis zum Beweis der Schuld … schon wieder.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Zelle A",
      at: "in Zelle A",
      ground: "floor",
      tint: "#dfe3ea",
      label: { row: 2, col: 3 },
    },
    {
      key: "B",
      name: "Zelle B",
      at: "in Zelle B",
      ground: "stone",
      tint: "#c9ced8",
      label: { row: 4, col: 1 },
    },
    {
      key: "C",
      name: "Zelle C",
      at: "in Zelle C",
      ground: "stone",
      tint: "#c7d6ea",
      label: { row: 7, col: 5 },
    },
    {
      key: "G",
      name: "Gang",
      at: "im Gang",
      ground: "stone",
      tint: "#e2dfe3",
      label: { row: 5, col: 1 },
    },
    {
      key: "K",
      name: "Königliche Zelle A",
      at: "in Königlicher Zelle A",
      ground: "floor",
      tint: "#ead7ea",
      label: { row: 4, col: 6 },
    },
    {
      key: "Q",
      name: "Königliche Zelle B",
      at: "in Königlicher Zelle B",
      ground: "floor",
      tint: "#ead7ea",
      label: { row: 7, col: 0 },
      labelOverhang: true,
    },
  ],
  areaMap: [
    "..AAAGKK",
    "BBAAAGKK",
    "BBAAAGKK",
    "BBBBBGKK",
    "BBBBBGKK",
    "QGGGGGC.",
    "QQQQGCC.",
    "QQQQGCC.",
  ],
  thingMap: [
    "..m..s.c",
    "..j.....",
    "m...m..t",
    "j...j..m",
    "c.......",
    "........",
    "m.t...c.",
    ".c.cj.m.",
  ],
  things: {
    c: "chair",
    j: "jug",
    m: "mud",
    s: "shelf",
    t: "table",
  },
  extraThings: {
    jug: { name: "Krug", emoji: "\u{1F3FA}", standable: false },
  },
  // The doors, drawn in the walls between the rooms.
  windows: [
    { at: { row: 1, col: 4 }, side: "right", door: true },
    { at: { row: 2, col: 5 }, side: "right", door: true },
    { at: { row: 4, col: 5 }, side: "right", door: true },
    { at: { row: 4, col: 2 }, side: "bottom", door: true },
    { at: { row: 4, col: 3 }, side: "bottom", door: true },
    { at: { row: 5, col: 3 }, side: "bottom", door: true },
    { at: { row: 6, col: 4 }, side: "right", door: true },
  ],
  suspects: [
    {
      id: "A",
      traits: ["villager"],
      name: "Aldvin",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person in einer Schlammpfütze.",
        ...all(
          on("mud"),
          counting((c) => onlyOneOn(c, "mud")),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      traits: ["villager"],
      name: "Benedikt",
      pronoun: "er",
      clue: { text: "Er war neben einem Krug.", ...beside("jug") },
      colour: "#15803d",
      face: "\u{1F474}",
    },
    {
      id: "C",
      traits: ["knight"],
      name: "Claude",
      pronoun: "er",
      clue: {
        text: "Er war vor einer Tür.",
        ...own((c) => beforeDoor(c.cell)),
      },
      colour: "#0e7490",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "D",
      traits: ["villager"],
      name: "Dominik",
      pronoun: "er",
      clue: {
        text: "Er war in Zelle A. Er war nicht vor der Tür.",
        ...all(inArea("A"), not(own((c) => beforeDoor(c.cell)))),
      },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      traits: ["villager"],
      name: "Elias",
      pronoun: "er",
      clue: { text: "Er war in der untersten Zeile.", ...row(8) },
      colour: "#a16207",
      face: "\u{1F977}",
    },
    {
      id: "F",
      traits: ["knight"],
      name: "Forrester",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#be185d",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "G",
      traits: ["noble"],
      name: "Gordon",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person, die auf einem Stuhl saß.",
        ...all(
          on("chair"),
          counting((c) => onlyOneOn(c, "chair")),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F934}",
    },
    {
      id: "O",
      traits: ["knight"],
      name: "Ortolf",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F468}‍\u{1F9B0}",
    },
  ],
  rules: [
    ranks(
      "Adlige (\u{1F451}) waren nur in den königlichen Zellen, Dorfbewohner nur in den anderen Bereichen, Ritter überall.",
      ["K", "Q"],
    ),
  ],
  hints: [
    {
      text: "Elias ist Dorfbewohner und steht in der untersten Zeile - also nicht in Königlicher Zelle B. Dort bleiben R8 C5 (ein Krug), R8 C6 und R8 C7 (eine Schlammpfütze, die Aldvin allein gehört). Elias steht in R8 C6.",
      place: { E: { row: 7, col: 5 } },
    },
    {
      text: "Gordon ist adlig, also in einer königlichen Zelle, und sitzt auf einem Stuhl. Die Stühle in Königlicher Zelle B stehen in Elias' Zeile - Gordon sitzt in R1 C8.",
      place: { G: { row: 0, col: 7 } },
    },
    {
      text: "Aldvin ist Dorfbewohner und steht in einer Schlammpfütze außerhalb der königlichen Zellen: R1 C3 ist Gordons Zeile, R8 C7 Elias' - es bleiben R3 C1 und R3 C5, beide in Zeile 3. Dominik ist in Zelle A, nicht vor der Tür und nicht in Zeile 1 oder 3: Er steht in R2 C4.",
      place: { D: { row: 1, col: 3 } },
    },
    {
      text: "Forrester steht neben einem Tisch. Am Tisch in Königlicher Zelle A ist R2 C8 Gordons Spalte, R3 C7 Aldvins Zeile und R4 C8 eine Schlammpfütze; am Tisch in Königlicher Zelle B ist R7 C4 Dominiks Spalte und R8 C3 Elias' Zeile. Forrester steht in R7 C2.",
      place: { F: { row: 6, col: 1 } },
    },
    {
      text: "Benedikt ist Dorfbewohner neben einem Krug. Alle Felder neben einem Krug liegen in besetzten Zeilen oder Spalten - bis auf R4 C2 (Forresters Spalte) und R5 C5. Er steht in R5 C5. Damit bleibt Aldvin nur die Schlammpfütze in R3 C1.",
      place: { B: { row: 4, col: 4 }, A: { row: 2, col: 0 } },
    },
    {
      text: "Claude steht vor einer Tür: Frei sind nur noch Zeile 4 und 6, und vor einer Tür bleibt R6 C3. Ortolf steht auf dem letzten Feld, R4 C7 in Königlicher Zelle A - allein mit Gordon. Gordon ist der Mörder!",
      place: { C: { row: 5, col: 2 }, O: { row: 3, col: 6 } },
    },
  ],
  solution: {
    A: { row: 2, col: 0 },
    B: { row: 4, col: 4 },
    C: { row: 5, col: 2 },
    D: { row: 1, col: 3 },
    E: { row: 7, col: 5 },
    F: { row: 6, col: 1 },
    G: { row: 0, col: 7 },
    O: { row: 3, col: 6 },
  },
};
