/**
 * The Birthday Party: a bathroom, a guest room, a living room, a kitchen, a
 * bedroom and a dining room full of presents, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Die Geburtstagsparty/Die Geburtstagsparty.png`,
 * solution sheet `Das Murdoku-Orginal/Lösungen 1-80/Lösung 13-16.JPG`).
 * Odette is the victim; whoever was alone with her killed her.
 *
 * Chairs and beds can be stood on; tables, presents, plants and the TVs
 * cannot.
 */
import { about, all, beside, inArea, on, own, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_BIRTHDAY_PARTY: Level = {
  id: "the-birthday-party",
  name: "Die Geburtstagsparty",
  series: { book: "original", number: 14 },
  story:
    "Als ob ein Mord nicht schon erschreckend genug wäre - es ist auch noch ein Clown am Tatort?",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#e4e2ee",
      label: { row: 2, col: 0 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#f3d6cc",
      label: { row: 1, col: 2 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#ddd8ea",
      label: { row: 5, col: 3 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#f2dcdc",
      label: { row: 4, col: 7 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#f0d2c6",
      label: { row: 8, col: 1 },
    },
    {
      key: "Z",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "carpet",
      tint: "#efcfd2",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "BBGGGGKKK",
    "BBGGGGKKK",
    "BBWWWWKKK",
    "SSWWWWKKK",
    "SSWWWWKKK",
    "SSWWWWZZZ",
    "SSSSZZZZZ",
    "SSSSZZZZZ",
    "SSSSZZZZZ",
  ],
  thingMap: [
    "tt..ct.gt",
    "c.bb.t..t",
    "..v.....t",
    "g...tg...",
    "p.cct...t",
    "c..g..t.p",
    "......c.g",
    "tbb..cttt",
    "tt.v..pc.",
  ],
  things: {
    b: "bed",
    c: "chair",
    g: "present",
    p: "plant",
    t: "table",
    v: "tv",
  },
  extraThings: {
    present: { name: "Geschenk", emoji: "\u{1F381}", standable: false },
  },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 8 }, rows: 3, cols: 1 },
    { at: { row: 1, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 4 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 6 }, rows: 1, cols: 3 },
  ],
  suspects: [
    {
      id: "A",
      name: "Abraham",
      pronoun: "er",
      clue: {
        text: "Er war in der Küche, neben einem Tisch.",
        ...all(inArea("K"), beside("table")),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Björn",
      pronoun: "er",
      clue: {
        text: "Er war im Esszimmer mit Ella und Hopsy.",
        ...all(
          inArea("Z"),
          about(["E", "H"], (c) =>
            ["E", "H"].every((id) => {
              const cell = c.cellOf(id);
              return cell !== undefined && c.areaOf(cell) === "Z";
            }),
          ),
        ),
      },
      colour: "#15803d",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Coralie",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fernseher.", ...beside("tv") },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "D",
      name: "Diane",
      pronoun: "sie",
      clue: {
        text: "Ein Geschenk war in ihrer Spalte, im selben Raum.",
        ...own((c) => {
          const area = c.areaOf(c.cell);
          return (
            area !== null &&
            c
              .cellsOf(area)
              .some((cell) => cell.col === c.cell.col && c.is(cell, "present"))
          );
        }),
      },
      colour: "#6366f1",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "E",
      name: "Ella",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Felix",
      pronoun: "er",
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#ea580c",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Gerald",
      pronoun: "er",
      clue: { text: "Er war neben einem Geschenk.", ...beside("present") },
      colour: "#334155",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "H",
      name: "Hopsy",
      pronoun: "er",
      clue: { text: "Er war neben einem Geschenk.", ...beside("present") },
      colour: "#be185d",
      face: "\u{1F921}",
    },
    {
      id: "O",
      name: "Odette",
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
    { text: "Björn, Ella und Hopsy sind im Esszimmer." },
    {
      text: "Das lokalisiert Hopsy neben dem Geschenk.",
      place: { H: { row: 6, col: 7 } },
    },
    {
      text: "Das lokalisiert Ella auf dem letzten verfügbaren Stuhl im Esszimmer, dann Björn.",
      place: { E: { row: 7, col: 5 }, B: { row: 8, col: 4 } },
    },
    {
      text: "Das lokalisiert auch Abraham im letzten Feld neben einem Tisch in der Küche.",
      place: { A: { row: 3, col: 8 } },
    },
    {
      text: "Das lokalisiert Coralie neben dem Fernseher.",
      place: { C: { row: 2, col: 3 } },
    },
    {
      text: "Das lokalisiert Felix auf dem Bett.",
      place: { F: { row: 1, col: 2 } },
    },
    {
      text: "Das lokalisiert Gerald in der Küche und Diane in Spalte 1.",
      place: { G: { row: 0, col: 6 }, D: { row: 5, col: 0 } },
    },
    {
      text: "Das lokalisiert Odette, allein im Schlafzimmer mit Diane. Diane ist die Mörderin!",
      place: { O: { row: 4, col: 1 } },
    },
  ],
  solution: {
    A: { row: 3, col: 8 },
    B: { row: 8, col: 4 },
    C: { row: 2, col: 3 },
    D: { row: 5, col: 0 },
    E: { row: 7, col: 5 },
    F: { row: 1, col: 2 },
    G: { row: 0, col: 6 },
    H: { row: 6, col: 7 },
    O: { row: 4, col: 1 },
  },
};
