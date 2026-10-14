/**
 * Geschwisterrivalität: a flat with a living room, a guest room, a dining
 * room, a kitchen, a bedroom and a bathroom, and a murdered brother.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/58. Geschwisterrivalität.JPG`,
 * solution sheet `Lösungen 1-80/Lösung 57-60.JPG`).
 * Oktay is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they, the beds and the rugs (the L in the
 * living room among them) can be stood on. The tables (the bedside table and
 * the L-shaped kitchen counter among them), the shelves, the TV and the
 * plants cannot.
 */
import {
  about,
  all,
  alone,
  beside,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether the suspect stands south of Alex. */
function southOfAlex(c: Context): boolean {
  const alex = c.cellOf("A");
  return alex !== undefined && alex.row < c.cell.row;
}

/** Whether the suspect shares the area with exactly one other person, a man. */
function aloneWithAMan(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  return others.length === 1 && c.has(others[0] ?? "", "man");
}

/** Whether Alex, Brad and Cora stood in three different rooms. */
function threeRooms(c: Context): boolean {
  const rooms = ["A", "B", "C"].map((id) => {
    const there = c.cellOf(id);
    return there === undefined ? null : c.areaOf(there);
  });
  return new Set(rooms).size === rooms.length;
}

/** The case. */
export const SIBLING_RIVALRY: Level = {
  id: "sibling-rivalry",
  name: "Geschwisterrivalität",
  series: { book: "original", number: 58 },
  story:
    "Wir können nicht ausschließen, dass »saß auf jemandes Lieblingsstuhl« das Motiv war.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#d4ece8",
      label: { row: 3, col: 0 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#dcebee",
      label: { row: 1, col: 5 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#e6f0e0",
      label: { row: 6, col: 3 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#dde6ee",
      label: { row: 6, col: 8 },
      labelEnd: true,
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#e2ecee",
      label: { row: 8, col: 0 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#d6eeea",
      label: { row: 8, col: 3 },
    },
  ],
  areaMap: [
    "WWWWGGGGG",
    "WWWWGGGGG",
    "WWWWEEKKK",
    "WWWWEEKKK",
    "SSSEEEEKK",
    "SSSEEEEKK",
    "SSSEEEEKK",
    "SSSBBBBBB",
    "SSSBBBBBB",
  ],
  thingMap: [
    "tctcttbb.",
    "vrc..s.tc",
    ".rrc.p.tt",
    "spc.rr...",
    "t...c....",
    "b..cttc.t",
    "bcr..c.tt",
    "..r...c..",
    "p....t.ts",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    r: "rug",
    s: "shelf",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 0, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 7 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 2 }, rows: 2, cols: 1 },
  ],
  shapes: [
    [
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ],
    [
      { row: 5, col: 8 },
      { row: 6, col: 8 },
      { row: 6, col: 7 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Alex",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#c2410c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "B",
      name: "Brad",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Cora",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Dorothy",
      pronoun: "sie",
      clue: {
        text: "Sie war allein im Gästezimmer.",
        ...all(inArea("G"), alone()),
      },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "E",
      name: "Evangeline",
      pronoun: "sie",
      clue: {
        text: "Sie war im Esszimmer allein mit einem Mann.",
        ...all(inArea("E"), counting(aloneWithAMan)),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Falcon",
      pronoun: "er",
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#9f1239",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "G",
      name: "Gerd",
      pronoun: "er",
      clue: {
        text: "Er war südlich von Alex. Er war in der Küche.",
        ...all(inArea("K"), about(["A"], southOfAlex)),
      },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Henry",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#6d28d9",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Oktay",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
  ],
  rules: [
    {
      text: "Alex, Brad und Cora waren in verschiedenen Räumen.",
      check: threeRooms,
    },
  ],
  hints: [
    {
      text: "Dorothy ist allein im Gästezimmer, also muss Falcon auf dem Bett in C1 sein.",
    },
    {
      text: "Es gibt jetzt nur ein Feld, wo Henry neben einem Regal sein kann: R8 C9.",
      place: { H: { row: 7, col: 8 } },
    },
    {
      text: "Alex, Brad und Cora, alle in verschiedenen Räumen sitzend laut dem allgemeinen Hinweis, müssen im Wohnzimmer, Esszimmer und Schlafzimmer in irgendeiner Reihenfolge sein.",
    },
    {
      text: "Das bedeutet, der Stuhl im Schlafzimmer ist besetzt; das lokalisiert Falcon.",
      place: { F: { row: 5, col: 0 } },
    },
    {
      text: "Das eliminiert alle Stühle im Esszimmer bis auf einen. Er muss auch besetzt sein, was Evangeline im Esszimmer lokalisiert. Sie ist mit einem Mann zusammen, also ist entweder Alex oder Brad auf dem Stuhl.",
      place: { E: { row: 3, col: 5 } },
    },
    {
      text: "Das lokalisiert Gerd im letzten Feld in der Küche, was Dorothy im Gästezimmer lokalisiert.",
      place: { G: { row: 2, col: 6 }, D: { row: 0, col: 7 } },
    },
    {
      text: "Das lässt einen Stuhl im Wohnzimmer. Alex, der nördlich von Gerd ist, muss darauf sitzen. Das identifiziert Brad im Esszimmer, dann Cora im Schlafzimmer und lokalisiert auch Oktay. Henry ist der Mörder!",
      place: {
        A: { row: 1, col: 2 },
        B: { row: 4, col: 4 },
        C: { row: 6, col: 1 },
        O: { row: 8, col: 3 },
      },
    },
  ],
  solution: {
    A: { row: 1, col: 2 },
    B: { row: 4, col: 4 },
    C: { row: 6, col: 1 },
    D: { row: 0, col: 7 },
    E: { row: 3, col: 5 },
    F: { row: 5, col: 0 },
    G: { row: 2, col: 6 },
    H: { row: 7, col: 8 },
    O: { row: 8, col: 3 },
  },
};
