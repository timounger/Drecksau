/**
 * The Librarian's House: a kitchen, a dining room, a study, a living room, a
 * guest room, a bedroom and a bathroom full of bookshelves, with a murdered
 * librarian.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Das Haus der Bibliothekarin/Das Haus der Bibliothekarin.png`,
 * solution sheet
 * `game_instructions/Murdoku/Das Murdoku-Orginal/Lösungen 1-80/Lösung 17-20.JPG`).
 * Oriana is the victim; whoever was alone with her killed her.
 *
 * Chairs and beds can be stood on; shelves, tables, plants and the TV cannot.
 */
import { all, beside, counting, inArea, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_LIBRARIANS_HOUSE: Level = {
  id: "the-librarians-house",
  name: "Das Haus der Bibliothekarin",
  series: { book: "original", number: 20 },
  story: "Finden wir den Täter und beenden dieses düstere Kapitel.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#cfe8e4",
      label: { row: 2, col: 1 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#ecd3e0",
      label: { row: 3, col: 3 },
    },
    {
      key: "A",
      name: "Arbeitszimmer",
      at: "im Arbeitszimmer",
      ground: "floor",
      tint: "#d6e4f0",
      label: { row: 4, col: 6 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#d9c8e4",
      label: { row: 5, col: 2 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#cde6d6",
      label: { row: 8, col: 1 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#d8c4e0",
      label: { row: 8, col: 4 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "stone",
      tint: "#e4d8ee",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "KKEEEAAAA",
    "KKEEEAAAA",
    "KKEEEAAAA",
    "WWEEEAAAA",
    "WWWWWAAAA",
    "WWWWWSSBB",
    "GGSSSSSBB",
    "GGSSSSSBB",
    "GGGSSSSBB",
  ],
  thingMap: [
    "..sc.ss.s",
    ".tct....s",
    "tsct.c..s",
    "s.....ps.",
    "..ct...ts",
    "sc.fps...",
    "b......ps",
    "bc..bb..c",
    "s.....s..",
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
    { at: { row: 1, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 4 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Arwin",
      pronoun: "er",
      clue: { text: "Er war in der Küche.", ...inArea("K") },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Bastian",
      pronoun: "er",
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Callie",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Regal im Arbeitszimmer.",
        ...all(inArea("A"), beside("shelf")),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Daphne",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl im Esszimmer.",
        ...all(inArea("E"), on("chair")),
      },
      colour: "#7c3aed",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "E",
      name: "Enya",
      pronoun: "sie",
      clue: { text: "Sie war neben dem Fernseher.", ...beside("tv") },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Fritz",
      pronoun: "er",
      clue: { text: "Er war im Badezimmer.", ...inArea("B") },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gero",
      pronoun: "er",
      clue: {
        text: "Er war allein mit einer Frau.",
        ...counting((c) => {
          const here = c.peopleIn(c.areaOf(c.cell) ?? "");
          return (
            here.length === 2 &&
            here.some((id) => id !== c.self && c.has(id, "woman"))
          );
        }),
      },
      colour: "#334155",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Hudson",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#4338ca",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "O",
      name: "Oriana",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}",
    },
  ],
  hints: [
    {
      text: "Es gibt nur ein Feld, auf dem Enya sein kann, in Zeile 6, Spalte 3.",
      place: { E: { row: 5, col: 2 } },
    },
    {
      text: "Das lokalisiert Daphne auf dem Stuhl im Esszimmer in Zeile 1.",
      place: { D: { row: 0, col: 3 } },
    },
    {
      text: "Das lokalisiert Arwin in der Küche.",
      place: { A: { row: 1, col: 0 } },
    },
    { text: "Das setzt Bastian auf das Bett in Zeile 8." },
    {
      text: "Das lokalisiert Hudson auf dem letzten verfügbaren Stuhl.",
      place: { H: { row: 2, col: 5 } },
    },
    {
      text: "Das lokalisiert Bastian und lokalisiert auch Callie im letzten Feld neben einem Regal im Arbeitszimmer.",
      place: { B: { row: 7, col: 4 }, C: { row: 3, col: 8 } },
    },
    {
      text: "Das lokalisiert Fritz im Badezimmer. Gero kann nur allein mit Enya sein, das lokalisiert ihn in Zeile 5, Spalte 2.",
      place: { F: { row: 8, col: 7 }, G: { row: 4, col: 1 } },
    },
    {
      text: "Das lokalisiert Oriana, allein mit Bastian im Schlafzimmer. Bastian ist der Mörder!",
      place: { O: { row: 6, col: 6 } },
    },
  ],
  solution: {
    A: { row: 1, col: 0 },
    B: { row: 7, col: 4 },
    C: { row: 3, col: 8 },
    D: { row: 0, col: 3 },
    E: { row: 5, col: 2 },
    F: { row: 8, col: 7 },
    G: { row: 4, col: 1 },
    H: { row: 2, col: 5 },
    O: { row: 6, col: 6 },
  },
};
