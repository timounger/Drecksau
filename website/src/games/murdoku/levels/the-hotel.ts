/**
 * Das Hotel: four rooms along a hallway, with a murdered bellboy.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/65. Das Hotel.JPG`,
 * solution sheet `Lösungen 1-80/Lösung 65-68.JPG`).
 * Orson is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they, the beds, the rugs and the four
 * windows (in the outer walls) can be stood on. The tables, the TVs and the
 * plants cannot. A field is in a corner of its room when the room's border
 * runs along two of its sides that meet. "Directly beside an empty room"
 * means a field next to it, left, right, above or below, lies in a room
 * nobody was in.
 */
import {
  all,
  beside,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The four steps to the fields next to one. */
const STEPS: readonly Cell[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/** Whether a field lies in a corner of its area. */
function inCorner(c: Context): boolean {
  const area = c.areaOf(c.cell);
  const outside = (row: number, col: number): boolean =>
    c.areaOf({ row, col }) !== area;
  const vertical =
    outside(c.cell.row - 1, c.cell.col) || outside(c.cell.row + 1, c.cell.col);
  const horizontal =
    outside(c.cell.row, c.cell.col - 1) || outside(c.cell.row, c.cell.col + 1);
  return vertical && horizontal;
}

/** Whether a field next to the suspect's lies in another room nobody was in. */
function besideAnEmptyRoom(c: Context): boolean {
  const home = c.areaOf(c.cell);
  return STEPS.some((step) => {
    const area = c.areaOf({
      row: c.cell.row + step.row,
      col: c.cell.col + step.col,
    });
    return area !== null && area !== home && c.peopleIn(area).length === 0;
  });
}

/** Whether the suspect was alone in the area with somebody, by id. */
function aloneWith(id: string): (c: Context) => boolean {
  return (c: Context): boolean => {
    const there = c.peopleIn(c.areaOf(c.cell) ?? "");
    return there.length === 2 && there.includes(id);
  };
}

/** Whether the suspect was in the area with exactly two others, both women. */
function withTwoOtherWomen(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  return others.length === 2 && others.every((id) => c.has(id, "woman"));
}

/** Whether nobody but the suspect stood on a thing of this id. */
function onlyOneOn(what: string): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return id === c.self || there === undefined || !c.is(there, what);
    });
}

/** Whether exactly one person stood on a rug. */
function oneOnARug(c: Context): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, "rug");
    }).length === 1
  );
}

/** Whether exactly one area held nobody. */
function oneEmptyRoom(c: Context): boolean {
  return (
    c.level.areas.filter((area) => c.peopleIn(area.key).length === 0).length ===
    1
  );
}

/** The case. */
export const THE_HOTEL: Level = {
  id: "the-hotel",
  name: "Das Hotel",
  series: { book: "original", number: 65 },
  story:
    "Ich hoffe, der Mörder hat ein extra großzügiges Trinkgeld für die Reinigungskraft dagelassen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "1",
      name: "Zimmer 1",
      at: "in Zimmer 1",
      ground: "floor",
      tint: "#f2dcd6",
      label: { row: 2, col: 1 },
    },
    {
      key: "2",
      name: "Zimmer 2",
      at: "in Zimmer 2",
      ground: "floor",
      tint: "#efd9d6",
      label: { row: 4, col: 2 },
    },
    {
      key: "3",
      name: "Zimmer 3",
      at: "in Zimmer 3",
      ground: "floor",
      tint: "#f6e8c4",
      label: { row: 6, col: 4 },
    },
    {
      key: "4",
      name: "Zimmer 4",
      at: "in Zimmer 4",
      ground: "floor",
      tint: "#f1dfd8",
      label: { row: 2, col: 7 },
    },
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "floor",
      tint: "#f0c9a8",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "1111FF444",
    "1111FF444",
    "1111FF444",
    "2222FFFFF",
    "22222FFFF",
    "3333333FF",
    "3333333FF",
    "FFFFFFFFF",
    "FFFFFFFFF",
  ],
  thingMap: [
    ".p.v..tbv",
    "bb...r.bc",
    "c...t...w",
    "bb...rr..",
    "wpv.prr..",
    "cbb..v..p",
    "v..t..p..",
    ".rrr.....",
    "wrrr....w",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    r: "rug",
    t: "table",
    v: "tv",
    w: "window",
  },
  extraThings: {
    window: { name: "Fenster", emoji: "\u{1FA9F}", standable: true },
  },
  windows: [
    { at: { row: 2, col: 8 }, side: "right" },
    { at: { row: 4, col: 0 }, side: "left" },
    { at: { row: 8, col: 0 }, side: "left" },
    { at: { row: 8, col: 8 }, side: "right" },
  ],
  pieces: [
    { at: { row: 1, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 5 }, rows: 2, cols: 2 },
    { at: { row: 7, col: 1 }, rows: 2, cols: 3 },
  ],
  suspects: [
    {
      id: "A",
      name: "Aziza",
      pronoun: "sie",
      clue: {
        text: "Sie war auf einem Teppich und direkt neben einem leeren Raum.",
        ...all(on("rug"), counting(besideAnEmptyRoom)),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Birgit",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit Charles.",
        ...counting(aloneWith("C")),
      },
      colour: "#15803d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "C",
      name: "Charles",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOn("chair"))),
      },
      colour: "#0e7490",
      face: "\u{1F9D4}\u{1F3FE}",
    },
    {
      id: "D",
      name: "Dean",
      pronoun: "er",
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#6366f1",
      face: "\u{1F468}\u{1F3FD}‍\u{1F9B2}",
    },
    {
      id: "E",
      name: "Ethan",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke von Zimmer 1, 2 oder 3.",
        ...all(inArea("1", "2", "3"), own(inCorner)),
      },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Frida",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Tisch.", ...beside("table") },
      colour: "#7f1d1d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Georgina",
      pronoun: "sie",
      clue: {
        text: "Sie war im Flur allein mit zwei anderen Frauen.",
        ...all(inArea("F"), counting(withTwoOtherWomen)),
      },
      colour: "#ea580c",
      face: "\u{1F469}",
    },
    {
      id: "H",
      name: "Hilda",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person vor einem Fenster.",
        ...all(on("window"), counting(onlyOneOn("window"))),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Orson",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#be123c",
      face: "\u{1F468}",
    },
  ],
  rules: [
    { text: "Genau eine Person war auf einem Teppich.", check: oneOnARug },
    { text: "Es gab genau einen leeren Raum.", check: oneEmptyRoom },
  ],
  hints: [
    {
      text: "Laut Georgina sind drei Personen im Flur. Zwei von ihnen müssen in Z8 und Z9 sein. Weder Zimmer 2 noch 3 kann leer sein, sonst müssten zwei Personen im Flur in diesen Zeilen sein.",
    },
    {
      text: "Der leere Raum ist laut Azizas Hinweis neben einem Teppich, also ist Zimmer 1 besetzt und Zimmer 4 ist der leere Raum.",
      cross: [
        { row: 0, col: 7 },
        { row: 1, col: 7 },
        { row: 1, col: 8 },
        { row: 1, col: 6 },
        { row: 2, col: 6 },
        { row: 2, col: 7 },
        { row: 2, col: 8 },
      ],
    },
    {
      text: "Das platziert Charles auf einem Stuhl in S1, was Hilda in Z9 S9 lokalisiert.",
      place: { C: { row: 2, col: 0 }, H: { row: 8, col: 8 } },
    },
    {
      text: "Aziza, Georgina und Hilda sind das Trio im Flur, mit Aziza auf einem Teppich neben Zimmer 4 und Georgina irgendwo in Z8. Das platziert Frida in Zimmer 3, wo der einzige andere Tisch ist. Das lokalisiert Charles in Zimmer 1, allein mit Birgit.",
    },
    {
      text: "Z1 und Z2 sind von Birgit und jemandem im Flur besetzt, der nur Aziza auf dem Teppich in Z2 S6 sein kann. Das lokalisiert Birgit.",
      place: { A: { row: 1, col: 5 }, B: { row: 0, col: 2 } },
    },
    {
      text: "Georgina muss in S8 Z8 sein. Entweder Dean oder Ethan ist in Z6 S7, was Frida lokalisiert.",
      place: { G: { row: 7, col: 7 }, F: { row: 6, col: 4 } },
    },
    {
      text: "Nur Dean und Orson können in Zimmer 2 passen. Das lokalisiert Dean, Ethan und Orson. Dean ist der Mörder!",
      place: {
        D: { row: 4, col: 3 },
        E: { row: 5, col: 6 },
        O: { row: 3, col: 1 },
      },
    },
  ],
  solution: {
    A: { row: 1, col: 5 },
    B: { row: 0, col: 2 },
    C: { row: 2, col: 0 },
    D: { row: 4, col: 3 },
    E: { row: 5, col: 6 },
    F: { row: 6, col: 4 },
    G: { row: 7, col: 7 },
    H: { row: 8, col: 8 },
    O: { row: 3, col: 1 },
  },
};
