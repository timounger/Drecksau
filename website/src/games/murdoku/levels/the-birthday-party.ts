/**
 * The Birthday Party: a bathroom, a guest room, a living room, a kitchen, a
 * bedroom and a dining room full of presents, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Die Geburtstagsparty/Die Geburtstagsparty.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
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
    {
      text: "Laut Björn waren Ella und Hopsy im Esszimmer. Hopsy war neben einem Geschenk - das einzige Geschenk dort steht in R7 C9; daneben sind eine Pflanze und ein Tisch, also steht Hopsy in R7 C8.",
      place: { H: { row: 6, col: 7 } },
    },
    {
      text: "Ella saß im Esszimmer auf einem Stuhl: R7 C7, R8 C6 oder R9 C8. R7 und C8 sind vergeben, also sitzt sie in R8 C6.",
      place: { E: { row: 7, col: 5 } },
    },
    {
      text: "Abraham war in der Küche neben einem Tisch: R2 C8, R3 C8, R4 C9 oder R5 C8. C8 ist vergeben, also steht er in R4 C9.",
      place: { A: { row: 3, col: 8 } },
    },
    {
      text: "Björn war im Esszimmer. In R6 ist C7 ein Tisch, C8 vergeben und C9 eine Pflanze; R7 und R8 sind vergeben, in R9 ist C7 eine Pflanze und C9 vergeben: Björn steht in R9 C5.",
      place: { B: { row: 8, col: 4 } },
    },
    {
      text: "Coralie war neben einem Fernseher: R3 C4, R4 C3, R8 C4 oder R9 C3. R4, R8 und R9 sind vergeben, also steht sie in R3 C4. Felix war auf einem Bett - R8 und C4 sind vergeben, also liegt er in R2 C3.",
      place: { C: { row: 2, col: 3 }, F: { row: 1, col: 2 } },
    },
    {
      text: "Frei sind noch R1, R5 und R6 in C1, C2 und C7. Gerald war neben einem Geschenk - nur R1 C7 neben dem Geschenk in R1 C8 passt.",
      place: { G: { row: 0, col: 6 } },
    },
    {
      text: "Diane braucht ein Geschenk in ihrer Spalte im selben Raum: R6 C1 unter dem Geschenk in R4 C1 im Schlafzimmer. Für Odette bleibt R5 C2 im Schlafzimmer - allein mit Diane. Diane ist die Mörderin!",
      place: { D: { row: 5, col: 0 }, O: { row: 4, col: 1 } },
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
