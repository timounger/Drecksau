/**
 * The Clothing Store: six changing rooms, the sales floor and the entrance,
 * with a murdered shopper.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Das Bekleidungsgeschäft/Das Bekleidungsgeschäft.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Ornella is the victim; whoever was alone with her killed her.
 *
 * The big rug on the sales floor and the doormat at the entrance can be stood
 * on; the armchair on the big rug is a chair. The dark tables - long or square,
 * some with folded clothes on them - the shelves and the plants cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  alone,
  beside,
  counting,
  inArea,
  not,
  on,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The keys of the six changing rooms. */
const CHANGING_ROOMS = ["1", "2", "3", "4", "5", "6"];

/** The people standing in the suspect's own area, the suspect among them. */
function roommates(c: Context): readonly string[] {
  return c.peopleIn(c.areaOf(c.cell) ?? "");
}

/** The case. */
export const THE_CLOTHING_STORE: Level = {
  id: "the-clothing-store",
  name: "Das Bekleidungsgeschäft",
  series: { book: "original", number: 26 },
  story: "Halte Ausschau nach jemandem, der todschick angezogen ist.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "1",
      name: "Umkleide 1",
      at: "in Umkleide 1",
      ground: "floor",
      tint: "#ecd9e4",
      label: { row: 2, col: 0 },
    },
    {
      key: "2",
      name: "Umkleide 2",
      at: "in Umkleide 2",
      ground: "floor",
      tint: "#e6dcea",
      label: { row: 0, col: 2 },
    },
    {
      key: "3",
      name: "Umkleide 3",
      at: "in Umkleide 3",
      ground: "floor",
      tint: "#ecd9e4",
      label: { row: 2, col: 4 },
    },
    {
      key: "4",
      name: "Umkleide 4",
      at: "in Umkleide 4",
      ground: "floor",
      tint: "#e6dcea",
      label: { row: 2, col: 7 },
    },
    {
      key: "5",
      name: "Umkleide 5",
      at: "in Umkleide 5",
      ground: "floor",
      tint: "#ecd9e4",
      label: { row: 5, col: 7 },
    },
    {
      key: "6",
      name: "Umkleide 6",
      at: "in Umkleide 6",
      ground: "floor",
      tint: "#e6dcea",
      label: { row: 8, col: 7 },
    },
    {
      key: "V",
      name: "Verkaufsraum",
      at: "im Verkaufsraum",
      ground: "stone",
      tint: "#f3e4ec",
      label: { row: 6, col: 2 },
    },
    {
      key: "E",
      name: "Eingang",
      at: "im Eingang",
      ground: "stone",
      tint: "#e9d4e0",
      label: { row: 8, col: 3 },
    },
  ],
  areaMap: [
    "112233444",
    "112233444",
    "112233444",
    "VVVVVVV55",
    "VVVVVVV55",
    "VVVVVVV55",
    "VVVVVVV66",
    "VVEEEVV66",
    "VVEEEVV66",
  ],
  thingMap: [
    ".ctt.cttt",
    ".t.c.t.ct",
    ".t...t...",
    "......p..",
    ".srcrt.ct",
    ".trrrs..t",
    "......sct",
    ".sp......",
    "..rrr..t.",
  ],
  things: { c: "chair", p: "plant", r: "rug", s: "shelf", t: "table" },
  pieces: [
    { at: { row: 1, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 8, col: 2 }, rows: 1, cols: 3 },
  ],
  suspects: [
    {
      id: "A",
      name: "Adeline",
      pronoun: "sie",
      clue: {
        text: "Sie war in Umkleide 1 oder 6. Sie war neben einem Stuhl.",
        ...all(inArea("1", "6"), beside("chair")),
      },
      colour: "#b91c1c",
      face: "\u{1F475}",
    },
    {
      id: "B",
      name: "Brigitte",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(
          on("chair"),
          counting(
            (c) =>
              c.people().filter((id) => {
                const at = c.cellOf(id);
                return at !== undefined && c.is(at, "chair");
              }).length === 1,
          ),
        ),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Carissa",
      pronoun: "sie",
      clue: { text: "Sie war in der fünften Zeile.", ...row(5) },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Dylan",
      pronoun: "er",
      clue: { text: "Er war auf einem Teppich.", ...on("rug") },
      colour: "#6366f1",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "E",
      name: "Eleanor",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einem Tisch oder neben einem Stuhl.",
        ...all(not(beside("table")), not(beside("chair"))),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Felicitas",
      pronoun: "sie",
      clue: {
        text: "Sie war allein in Umkleide 4.",
        ...all(inArea("4"), alone()),
      },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Günther",
      pronoun: "er",
      clue: {
        text: "In seinem Raum war er die Person, die am weitesten östlich stand.",
        ...counting((c) =>
          roommates(c).every(
            (id) => id === c.self || (c.cellOf(id)?.col ?? 0) < c.cell.col,
          ),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Hanna",
      pronoun: "sie",
      clue: {
        text: "In ihrem Raum waren zwei Männer, die neben einem Regal waren.",
        ...counting(
          (c) =>
            roommates(c).filter((id) => {
              const at = c.cellOf(id);
              return (
                at !== undefined && c.has(id, "man") && c.beside(at, "shelf")
              );
            }).length === 2,
        ),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Ornella",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}",
    },
  ],
  rules: [
    {
      text: "Es gab genau zwei leere Umkleiden.",
      check: (c) =>
        CHANGING_ROOMS.filter((key) => c.peopleIn(key).length === 0).length ===
        2,
    },
  ],
  hints: [
    {
      text: "Felicitas war allein in Umkleide 4. Die einzigen Männer sind Dylan und Günther, und Regale stehen nur im Verkaufsraum: Hanna, Dylan und Günther waren also im Verkaufsraum. Carissa war in R5 - dort sind nur Stühle und Felder des Verkaufsraums frei, und auf einem Stuhl saß nur Brigitte. Auch Carissa war im Verkaufsraum.",
    },
    {
      text: "Genau zwei Umkleiden waren leer, also waren vier besetzt. Dafür bleiben nur Adeline, Brigitte, Eleanor, Felicitas und Ornella. Ornella war mit genau einer weiteren Person zusammen (nicht im vollen Verkaufsraum), Felicitas allein in Umkleide 4 - vier Umkleiden werden nur voll, wenn alle fünf in Umkleiden standen. Eleanor war also in einer Umkleide. Nicht neben einem Tisch oder Stuhl ist dort nur R3 C3 in Umkleide 2. Blockiere den Rest von R3 und C3.",
      place: { E: { row: 2, col: 2 } },
      cross: [
        { row: 2, col: 0 },
        { row: 2, col: 3 },
        { row: 2, col: 4 },
        { row: 2, col: 6 },
        { row: 2, col: 7 },
        { row: 2, col: 8 },
        { row: 1, col: 2 },
        { row: 3, col: 2 },
        { row: 4, col: 2 },
        { row: 5, col: 2 },
        { row: 6, col: 2 },
        { row: 8, col: 2 },
      ],
    },
    {
      text: "Dylan war auf dem großen Teppich im Verkaufsraum, in R6 (R5 gehört Carissa), und neben einem Regal. Nur R6 C5 liegt neben dem Regal in R6 C6. Blockiere den Rest von R6 und C5.",
      place: { D: { row: 5, col: 4 } },
      cross: [
        { row: 5, col: 0 },
        { row: 5, col: 3 },
        { row: 5, col: 6 },
        { row: 5, col: 7 },
        { row: 0, col: 4 },
        { row: 1, col: 4 },
        { row: 3, col: 4 },
        { row: 4, col: 4 },
        { row: 6, col: 4 },
        { row: 7, col: 4 },
        { row: 8, col: 4 },
      ],
    },
    {
      text: "In Umkleide 4 ist R3 gesperrt; frei bleibt für Felicitas nur R2 C7. Blockiere den Rest von R2 und C7.",
      place: { F: { row: 1, col: 6 } },
      cross: [
        { row: 1, col: 0 },
        { row: 1, col: 3 },
        { row: 1, col: 7 },
        { row: 4, col: 6 },
        { row: 7, col: 6 },
        { row: 8, col: 6 },
      ],
    },
    {
      text: "Günther stand in seinem Raum am weitesten östlich, also östlich von Dylan, und neben einem Regal: R7 C6 oder R8 C7. C7 ist gesperrt - Günther war in R7 C6. Blockiere den Rest von R7 und C6.",
      place: { G: { row: 6, col: 5 } },
      cross: [
        { row: 6, col: 0 },
        { row: 6, col: 1 },
        { row: 6, col: 3 },
        { row: 6, col: 7 },
        { row: 0, col: 5 },
        { row: 3, col: 5 },
        { row: 7, col: 5 },
        { row: 8, col: 5 },
      ],
    },
    {
      text: "Brigitte saß auf einem Stuhl. Die Stühle in R2 und R7 sind gesperrt, die in R5 liegen in Carissas Reihe und der in R1 C6 in der gesperrten C6: Brigitte saß in R1 C2. Adeline war neben einem Stuhl in Umkleide 1 oder 6, also in R1 C1 oder R8 C8; R1 ist besetzt, darum R8 C8. Blockiere die Reihen und Spalten der beiden.",
      place: { B: { row: 0, col: 1 }, A: { row: 7, col: 7 } },
      cross: [
        { row: 0, col: 0 },
        { row: 3, col: 1 },
        { row: 8, col: 1 },
        { row: 7, col: 0 },
        { row: 7, col: 3 },
        { row: 7, col: 8 },
        { row: 3, col: 7 },
        { row: 4, col: 7 },
      ],
    },
    {
      text: "Carissa war in R5: frei ist dort nur noch R5 C1. Blockiere den Rest von R5 und C1.",
      place: { C: { row: 4, col: 0 } },
      cross: [
        { row: 4, col: 3 },
        { row: 3, col: 0 },
        { row: 8, col: 0 },
      ],
    },
    {
      text: "Übrig sind R4 und R9 in C4 und C9. Hanna war im Verkaufsraum, also in R4 C4. Ornella blieb R9 C9 - in Umkleide 6 allein mit Adeline. Adeline ist die Mörderin!",
      place: { H: { row: 3, col: 3 }, O: { row: 8, col: 8 } },
    },
  ],

  solution: {
    A: { row: 7, col: 7 },
    B: { row: 0, col: 1 },
    C: { row: 4, col: 0 },
    D: { row: 5, col: 4 },
    E: { row: 2, col: 2 },
    F: { row: 1, col: 6 },
    G: { row: 6, col: 5 },
    H: { row: 3, col: 3 },
    O: { row: 8, col: 8 },
  },
};
