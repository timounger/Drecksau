/**
 * The Librarian's House: a kitchen, a dining room, a study, a living room, a
 * guest room, a bedroom and a bathroom full of bookshelves, with a murdered
 * librarian.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Das Haus der Bibliothekarin/Das Haus der Bibliothekarin.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Oriana is the victim; whoever was alone with her killed her.
 *
 * Chairs and beds can be stood on; shelves, tables, plants, the kitchen
 * counter and the TV cannot.
 */
import { all, beside, counting, inArea, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_LIBRARIANS_HOUSE: Level = {
  id: "the-librarians-house",
  name: "Das Haus der Bibliothekarin",
  series: { book: "original", number: 20 },
  story:
    "Finden wir den Täter und beenden dieses düstere Kapitel. Oriana wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
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
    "ksct.c..s",
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
    k: "counter",
    p: "plant",
    s: "shelf",
    t: "table",
  },
  extraThings: {
    counter: { name: "Herd", emoji: "\u{1F373}", standable: false },
  },
  suspects: [
    {
      id: "A",
      name: "Arwin",
      pronoun: "er",
      traits: ["glasses"],
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
      traits: ["glasses"],
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
      traits: ["glasses"],
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
      traits: ["glasses"],
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#4338ca",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "O",
      name: "Oriana",
      pronoun: "sie",
      traits: ["glasses"],
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
      text: "Enya war neben dem Fernseher in R6 C4. In R5 C4 steht ein Tisch, in R6 C5 eine Pflanze - Enya war in R6 C3. Blockiere den Rest von R6 und C3.",
      place: { E: { row: 5, col: 2 } },
      cross: [
        { row: 5, col: 0 },
        { row: 5, col: 1 },
        { row: 5, col: 3 },
        { row: 5, col: 4 },
        { row: 5, col: 5 },
        { row: 5, col: 6 },
        { row: 5, col: 7 },
        { row: 5, col: 8 },
        { row: 0, col: 2 },
        { row: 1, col: 2 },
        { row: 2, col: 2 },
        { row: 3, col: 2 },
        { row: 4, col: 2 },
        { row: 6, col: 2 },
        { row: 7, col: 2 },
        { row: 8, col: 2 },
      ],
    },
    {
      text: "Daphne saß auf einem Stuhl im Esszimmer: R1 C4, R2 C3 oder R3 C3. C3 ist gesperrt, also saß sie in R1 C4. Blockiere den Rest von R1 und C4.",
      place: { D: { row: 0, col: 3 } },
      cross: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 4 },
        { row: 0, col: 5 },
        { row: 0, col: 6 },
        { row: 0, col: 7 },
        { row: 0, col: 8 },
        { row: 1, col: 3 },
        { row: 2, col: 3 },
        { row: 3, col: 3 },
        { row: 4, col: 3 },
        { row: 5, col: 3 },
        { row: 6, col: 3 },
        { row: 7, col: 3 },
        { row: 8, col: 3 },
      ],
    },
    {
      text: "Arwin war in der Küche. Frei sind dort nur R1 C1, R1 C2 und R2 C1, und R1 ist gesperrt - Arwin war in R2 C1. Blockiere den Rest von R2 und C1.",
      place: { A: { row: 1, col: 0 } },
      cross: [
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
        { row: 1, col: 4 },
        { row: 1, col: 5 },
        { row: 1, col: 6 },
        { row: 1, col: 7 },
        { row: 1, col: 8 },
        { row: 0, col: 0 },
        { row: 2, col: 0 },
        { row: 3, col: 0 },
        { row: 4, col: 0 },
        { row: 5, col: 0 },
        { row: 6, col: 0 },
        { row: 7, col: 0 },
        { row: 8, col: 0 },
      ],
    },
    {
      text: "Callie war neben einem Regal im Arbeitszimmer - ohne R1 und R2 bleiben nur R3 C8 und R4 C9. Fritz war im Badezimmer, also in C8 oder C9: Callie und Fritz teilen sich C8 und C9. Bastian lag auf einem Bett; das Bett in C1 ist gesperrt, also lag er in R8. Hudson saß auf einem Stuhl: frei sind nur noch R3 C6, R8 C2 und R8 C9, und R8 gehört Bastian - Hudson saß in R3 C6.",
      place: { H: { row: 2, col: 5 } },
    },
    {
      text: "R3 ist besetzt, also war Callie in R4 C9 und Fritz in C8: R7 C8 ist eine Pflanze und R8 gehört Bastian - Fritz war in R9 C8. Bastians Bett liegt in R8 C5 und R8 C6, C6 ist Hudsons Spalte - Bastian lag in R8 C5.",
      place: {
        C: { row: 3, col: 8 },
        F: { row: 8, col: 7 },
        B: { row: 7, col: 4 },
      },
    },
    {
      text: "Für Gero und Oriana bleiben R5 und R7 in C2 und C7. Gero war allein mit einer Frau: In R7 C2 wäre er allein im Gästezimmer, in R7 C7 mit Bastian im Schlafzimmer, in R5 C7 mit Callie und Hudson im Arbeitszimmer. Also war Gero in R5 C2, im Wohnzimmer mit Enya.",
      place: { G: { row: 4, col: 1 } },
    },
    {
      text: "Oriana blieb R7 C7 im Schlafzimmer - allein mit Bastian. Bastian ist der Mörder!",
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
