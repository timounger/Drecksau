/**
 * Beach Restaurant: a toilet, a dining room, a kitchen, a terrace, a VIP area
 * and the sea, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Strandrestaurant/Strandrestaurant.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Olena is the victim; whoever was alone with her killed her.
 *
 * The chairs, the rugs and the sea can be stood on; the plants, the shelves,
 * the tables and the kitchen counter (a table) cannot. Sitting means being on
 * a chair.
 */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether nobody but the suspect stood on a rug. */
function onlyOneOnARug(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "rug");
  });
}

/** The case. */
export const BEACH_RESTAURANT: Level = {
  id: "beach-restaurant",
  name: "Strandrestaurant",
  series: { book: "original", number: 27 },
  story:
    "Wir sind hier auf uns allein gestellt ... die Zeugen stecken alle den Kopf in den Sand. Olena wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "floor",
      tint: "#e6dcef",
      label: { row: 1, col: 0 },
    },
    {
      key: "S",
      name: "Speiseraum",
      at: "im Speiseraum",
      ground: "floor",
      tint: "#ece4f2",
      label: { row: 4, col: 3 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#e2dcea",
      label: { row: 3, col: 7 },
    },
    {
      key: "R",
      name: "Terrasse",
      at: "auf der Terrasse",
      ground: "stone",
      tint: "#e8e2ee",
      label: { row: 7, col: 4 },
    },
    {
      key: "V",
      name: "VIP-Bereich",
      at: "im VIP-Bereich",
      ground: "stone",
      tint: "#ddd3ea",
      label: { row: 8, col: 0 },
    },
    {
      key: "M",
      name: "Meer",
      at: "im Meer",
      ground: "water",
      label: { row: 8, col: 5 },
    },
  ],
  areaMap: [
    "TTTSSKKKK",
    "TTTSSKKKK",
    "SSSSSSSKK",
    "SSSSSSSKK",
    "SSSSSSSRR",
    "RRRRRRRRR",
    "RRRRRRRRR",
    "VVVVRRRMM",
    "VVVVMMMMM",
  ],
  thingMap: [
    "pctrrhht.",
    "rrr.....h",
    "c.c..cr.t",
    "tcttctrtt",
    "p.......p",
    ".c.crrc..",
    "cttctctt.",
    "tc.......",
    "..tc.....",
  ],
  things: {
    c: "chair",
    h: "shelf",
    p: "plant",
    r: "rug",
    t: "table",
  },
  suspects: [
    {
      id: "A",
      name: "Arwin",
      pronoun: "er",
      clue: {
        text: "Er war auf der Terrasse. Er saß nicht.",
        ...all(inArea("R"), not(on("seat"))),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Briana",
      pronoun: "sie",
      traits: ["glasses"],
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Cleo",
      pronoun: "sie",
      traits: ["glasses"],
      clue: {
        text: "Sie saß auf einem Stuhl im Speiseraum.",
        ...all(on("chair"), inArea("S")),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Deena",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einem Tisch.",
        ...not(beside("table")),
      },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Eugen",
      pronoun: "er",
      clue: { text: "Er war in der Toilette.", ...inArea("T") },
      colour: "#334155",
      face: "\u{1F474}",
    },
    {
      id: "F",
      name: "Fabrice",
      pronoun: "er",
      clue: {
        text: "Er war südlich von Deena.",
        ...about(["D"], (c) => {
          const deena = c.cellOf("D");
          return deena !== undefined && c.cell.row > deena.row;
        }),
      },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gabriel",
      pronoun: "er",
      clue: {
        text: "Er war mit Briana zusammen.",
        ...about(["B"], (c) => {
          const briana = c.cellOf("B");
          return briana !== undefined && c.areaOf(briana) === c.areaOf(c.cell);
        }),
      },
      colour: "#a16207",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Hope",
      pronoun: "sie",
      traits: ["glasses"],
      clue: {
        text: "Sie war die einzige Person auf einem Teppich.",
        ...all(on("rug"), counting(onlyOneOnARug)),
      },
      colour: "#be185d",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "O",
      name: "Olena",
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
      text: "Eugen war in der Toilette. Dort sind nur der Stuhl in R1 C2 und der Teppich in R2 frei - und auf einem Teppich war nur Hope. Eugen war in R1 C2.",
      place: { E: { row: 0, col: 1 } },
    },
    {
      text: "Alle Regale stehen in der Küche, und R1 ist besetzt: Briana war in R2 C6, R2 C7 oder R2 C8. Gabriel war mit ihr in der Küche - R1 und R2 sind vergeben, die Theke steht in R3 C9, R4 C8 und R4 C9. Gabriel war in R3 C8.",
      place: { G: { row: 2, col: 7 } },
    },
    {
      text: "Cleo saß auf einem Stuhl im Speiseraum. R3 ist besetzt, R4 C2 liegt in C2 - Cleo saß in R4 C5.",
      place: { C: { row: 3, col: 4 } },
    },
    {
      text: "Hope war auf einem Teppich. R1, R2 und R4 sind besetzt, R6 C5 liegt in C5 - Hope war in R6 C6. Damit blieb für Briana nur R2 C7.",
      place: { H: { row: 5, col: 5 }, B: { row: 1, col: 6 } },
    },
    {
      text: "Arwin war auf der Terrasse und saß nicht. In R5 ist C8 besetzt und in C9 steht eine Pflanze, R6 ist besetzt, in R8 liegt die Terrasse in C5 bis C7, alle besetzt. In R7 sind nur C1, C3, C4 und C9 frei - Stuhl, Tisch, Stuhl: Arwin war in R7 C9.",
      place: { A: { row: 6, col: 8 } },
    },
    {
      text: "Deena, Fabrice und Olena bleiben R5, R8 und R9 in C1, C3 und C4. Fabrice war südlich von Deena, also war Deena nicht in R9; in R5 C3 und R5 C4 wäre sie neben dem Tisch. In R8 steht in C1 ein Tisch, R8 C3 liegt neben dem Tisch in R9 C3 - Deena war in R8 C4. Fabrice war in R9, also in R9 C1.",
      place: { D: { row: 7, col: 3 }, F: { row: 8, col: 0 } },
    },
    {
      text: "Olena blieb das letzte Feld, R5 C3. Im Speiseraum war sie allein mit Cleo - Cleo ist die Mörderin!",
      place: { O: { row: 4, col: 2 } },
    },
  ],
  solution: {
    A: { row: 6, col: 8 },
    B: { row: 1, col: 6 },
    C: { row: 3, col: 4 },
    D: { row: 7, col: 3 },
    E: { row: 0, col: 1 },
    F: { row: 8, col: 0 },
    G: { row: 2, col: 7 },
    H: { row: 5, col: 5 },
    O: { row: 4, col: 2 },
  },
};
