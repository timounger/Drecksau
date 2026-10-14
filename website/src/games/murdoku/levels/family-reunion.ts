/**
 * Familientreffen: a guest room, a bathroom, a bedroom, a living room, a
 * dining room, a study and a kitchen of a house, with a murdered relative.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/47. Familientreffen.png`,
 * solution sheet `Lösungen 1-80/Lösung 45-48.JPG`).
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
  shapes: [
    [
      { row: 7, col: 7 },
      { row: 7, col: 8 },
      { row: 8, col: 8 },
    ],
  ],
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
      text: "Becky muss in Z8 oder Z9 sein, und ebenso Andrea, da Danilo in S5 ist. Schließe alle Felder in Z8 und Z9 aus, die nicht neben dem Küchentisch oder einem Regal sind (oder in S5 sind).",
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
      text: "Eines der Betten ist besetzt, also kann der Stuhl im Schlafzimmer ausgeschlossen werden.",
      cross: [{ row: 3, col: 7 }],
    },
    {
      text: "Die einzigen verbleibenden Stühle für Gaspard und die Frau auf einem Stuhl sind in Z5 und Z6, mit einem im Esszimmer, dem anderen im Wohnzimmer. Keiner kann in S5 sitzen (Danilos Spalte), was nur den Stuhl in Z6 S6 im Wohnzimmer lässt, was wiederum nur Z5 S2 im Esszimmer lässt. Schließe diese Zeilen und Spalten aus.",
      cross: [
        { row: 4, col: 0 },
        { row: 4, col: 4 },
        { row: 4, col: 7 },
        { row: 4, col: 8 },
        { row: 5, col: 0 },
        { row: 5, col: 2 },
        { row: 5, col: 3 },
        { row: 5, col: 4 },
        { row: 5, col: 6 },
        { row: 5, col: 7 },
        { row: 5, col: 8 },
        { row: 0, col: 1 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
        { row: 3, col: 1 },
        { row: 7, col: 1 },
        { row: 8, col: 1 },
        { row: 0, col: 5 },
        { row: 1, col: 5 },
        { row: 6, col: 5 },
        { row: 7, col: 5 },
        { row: 8, col: 5 },
      ],
    },
    {
      text: "Das lokalisiert Frankie (allein im Badezimmer) und Andrea, dann Becky.",
      place: {
        F: { row: 1, col: 3 },
        A: { row: 8, col: 2 },
        B: { row: 7, col: 6 },
      },
    },
    {
      text: "Claudia muss im letzten Feld in S1 sein.",
      place: { C: { row: 3, col: 0 } },
    },
    {
      text: "Das lokalisiert Danilo, was bedeutet, dass Emma nicht auf dem Wohnzimmerstuhl ist, also ist das Gaspard. Die letzten beiden Felder sind Z1 S8 und Z3 S9, im Schlafzimmer. Emma, allein, muss auf dem Esszimmerstuhl sein. Heidi ist neben der Pflanze; Otfried ist im verbleibenden Feld. Heidi ist die Mörderin!",
      place: {
        D: { row: 6, col: 4 },
        G: { row: 5, col: 5 },
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
