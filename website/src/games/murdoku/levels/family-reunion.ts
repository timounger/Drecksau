/**
 * Familientreffen: a guest room, a bathroom, a bedroom, a living room, a
 * dining room, a study and a kitchen of a house, with a murdered relative.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/47. Familientreffen.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Otfried is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the beds can be stood on. Tables
 * (the kitchen counter among them), shelves, TVs and plants cannot. Gaspard
 * sat on a chair "just like a woman in another room": some woman sat on a
 * chair in a room other than his.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  alone,
  all,
  beside,
  column,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether nobody but the suspect stands on a thing of this id. */
function onlyOneOn(c: Context, what: string): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, what);
  });
}

/** Whether a woman sat on a chair in a room other than the suspect's. */
function womanOnChairElsewhere(c: Context): boolean {
  const area = c.areaOf(c.cell);
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined &&
      c.has(id, "woman") &&
      c.is(there, "chair") &&
      c.areaOf(there) !== area
    );
  });
}

/** The case. */
export const FAMILY_REUNION: Level = {
  id: "family-reunion",
  name: "Familientreffen",
  series: { book: "original", number: 47 },
  story:
    "Jetzt haben alle eine ausgezeichnete Ausrede, das Treffen nächstes Jahr ausfallen zu lassen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#c4e4ec",
      label: { row: 3, col: 0 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#dcd6ee",
      label: { row: 1, col: 3 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#bcd4ee",
      label: { row: 4, col: 6 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#d4c2e2",
      label: { row: 6, col: 4 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#ecd2dc",
      label: { row: 7, col: 0 },
    },
    {
      key: "A",
      name: "Arbeitszimmer",
      at: "im Arbeitszimmer",
      ground: "floor",
      tint: "#ccbadf",
      label: { row: 8, col: 1 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#dde0ee",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "GGGBBBSSS",
    "GGGBBBSSS",
    "GGGWWWSSS",
    "GGGWWWSSS",
    "EEEWWWSSS",
    "EEEWWWWWW",
    "EEEWWWWWW",
    "EEEAAKKKK",
    "AAAAAKKKK",
  ],
  thingMap: [
    "f..p....p",
    "..p.c..bf",
    "p...tt.b.",
    "bb...s.c.",
    ".cpfctp..",
    "ctc..c...",
    "pt......p",
    ".c..c..tt",
    "s..s.c..t",
  ],
  things: {
    b: "bed",
    c: "chair",
    f: "tv",
    p: "plant",
    s: "shelf",
    t: "table",
  },
  pieces: [
    { at: { row: 1, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 1 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Andrea",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#b91c1c",
      face: "\u{1F475}",
    },
    {
      id: "B",
      name: "Becky",
      pronoun: "sie",
      clue: {
        text: "Sie war in der Küche neben dem Tisch.",
        ...all(inArea("K"), beside("table")),
      },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Claudia",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person auf einem Bett.",
        ...all(
          on("bed"),
          counting((c) => onlyOneOn(c, "bed")),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Danilo",
      pronoun: "er",
      clue: { text: "Er war in der fünften Spalte.", ...column(5) },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Emma",
      pronoun: "sie",
      clue: { text: "Sie war allein.", ...alone() },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Frankie",
      pronoun: "er",
      clue: {
        text: "Er war allein im Badezimmer.",
        ...all(inArea("B"), alone()),
      },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gaspard",
      pronoun: "er",
      clue: {
        text: "Er saß auf einem Stuhl, genau wie eine Frau in einem anderen Raum.",
        ...all(on("chair"), counting(womanOnChairElsewhere)),
      },
      colour: "#ea580c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "H",
      name: "Heidi",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Pflanze.", ...beside("plant") },
      colour: "#4338ca",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "O",
      name: "Otfried",
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
      text: "Andrea war neben einem Regal. Neben dem Regal im Wohnzimmer liegt nur R4 C5, und R9 C5 neben dem rechten Regal im Arbeitszimmer - beide in Danilos Spalte C5. Andrea war also in R8 C4, R9 C2 oder R9 C3. Becky war in der Küche neben dem Tisch: R8 C7 oder R9 C8. R8 und R9 gehören den beiden.",
      cross: [
        { row: 7, col: 0 },
        { row: 7, col: 1 },
        { row: 7, col: 2 },
        { row: 7, col: 4 },
        { row: 7, col: 5 },
        { row: 8, col: 4 },
        { row: 8, col: 5 },
        { row: 8, col: 6 },
      ],
    },
    {
      text: "Danilo war in C5: R1 und R2 gehören zu Frankies Badezimmer, R3 C5 ist ein Tisch - also im Wohnzimmer. Gaspard saß auf einem Stuhl, nicht in R8, R9, C5 oder im Badezimmer: R4 C8, R5 C2, R6 C1, R6 C3 oder R6 C6. Claudias Betten (R2 C8, R3 C8, R4 C1, R4 C2) liegen alle in R4 oder C8 - auf R4 C8 saß also niemand.",
    },
    {
      text: "Die Frau auf einem Stuhl in einem anderen Raum als Gaspard: Andrea und Becky stehen auf keinem Stuhl, Claudia lag auf einem Bett. Heidis Stühle neben einer Pflanze stehen alle im Esszimmer, und Emma war allein - im Wohnzimmer ist schon Danilo. Säße Gaspard im Esszimmer, bliebe für die Frau nur R6 C6 im Wohnzimmer - dort ist keine Pflanze, und Emma wäre dort nicht allein. Also saß Gaspard in R6 C6.",
      place: { G: { row: 5, col: 5 } },
    },
    {
      text: "Damit saß die Frau im Esszimmer, außerhalb von R6: auf R5 C2. Frankie war allein im Badezimmer: C5 gehört Danilo, C6 Gaspard, R1 C4 ist eine Pflanze - Frankie war in R2 C4.",
      place: { F: { row: 1, col: 3 } },
    },
    {
      text: "Andrea: R9 C2 liegt in C2 der Frau auf R5 C2, R8 C4 in Frankies C4 - Andrea war in R9 C3, Becky in R8 C7.",
      place: { A: { row: 8, col: 2 }, B: { row: 7, col: 6 } },
    },
    {
      text: "Frei sind noch R1, R3, R4 und R7 in C1, C5, C8 und C9. In C1 ist davon nur das Bett R4 C1 betretbar - dort lag Claudia, die Einzige auf einem Bett. Danilo blieb in C5 nur R7 C5 - R1 C5 liegt in Frankies Badezimmer.",
      place: { C: { row: 3, col: 0 }, D: { row: 6, col: 4 } },
    },
    {
      text: "Übrig sind R1 und R3 in C8 und C9: R1 C9 ist eine Pflanze, R3 C8 ein Bett - also R1 C8 und R3 C9, beide im Schlafzimmer. Emma war allein, also saß sie auf R5 C2. Heidi war neben einer Pflanze: R1 C8, und Otfried in R3 C9. Im Schlafzimmer war er allein mit Heidi - Heidi ist die Mörderin!",
      place: {
        E: { row: 4, col: 1 },
        H: { row: 0, col: 7 },
        O: { row: 2, col: 8 },
      },
    },
  ],
  solution: {
    A: { row: 8, col: 2 },
    B: { row: 7, col: 6 },
    C: { row: 3, col: 0 },
    D: { row: 6, col: 4 },
    E: { row: 4, col: 1 },
    F: { row: 1, col: 3 },
    G: { row: 5, col: 5 },
    H: { row: 0, col: 7 },
    O: { row: 2, col: 8 },
  },
};
