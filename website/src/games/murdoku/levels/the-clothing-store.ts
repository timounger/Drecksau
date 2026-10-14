/**
 * The Clothing Store: six changing rooms, the sales floor and the entrance,
 * with a murdered shopper.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Das Bekleidungsgeschäft/Das Bekleidungsgeschäft.png`,
 * solution on `Das Murdoku-Orginal/Lösungen 1-80/Lösung 25-28.JPG`).
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
  shapes: [
    [
      { row: 0, col: 6 },
      { row: 0, col: 7 },
      { row: 0, col: 8 },
      { row: 1, col: 8 },
    ],
  ],
  pieces: [
    { at: { row: 1, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 2 }, rows: 2, cols: 3 },
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
      text: "Dylan, Günther und Hanna müssen im Verkaufsraum sein, da es der einzige Raum ist, der drei Personen aufnehmen kann. Laut Brigittes Hinweis kann Carissa nicht auf dem Stuhl in Zeile 5 sein, also muss sie auch im Verkaufsraum sein.",
    },
    {
      text: "Die verbleibenden vier Verdächtigen müssen alle in verschiedenen Umkleidekabinen sein (da nur zwei leer sind), einer davon mit Ornella. Daher ist niemand im Eingang; schließe alle Felder im Eingang aus.",
      cross: [
        { row: 7, col: 3 },
        { row: 7, col: 4 },
        { row: 8, col: 2 },
        { row: 8, col: 3 },
        { row: 8, col: 4 },
      ],
    },
    {
      text: "Dylan muss auf dem Teppich in Zeile 6 sein, in Spalte 5 neben dem Regal laut Hannas Hinweis.",
      place: { D: { row: 5, col: 4 } },
    },
    {
      text: "Eleanor, die laut Felicitas' Hinweis in einer Umkleidekabine ist, aber nicht in Kabine 4, kann nur in Zeile 3, Spalte 3 sein.",
      place: { E: { row: 2, col: 2 } },
    },
    {
      text: "Das lokalisiert Felicitas, dann Günther und Carissa, dann Brigitte auf dem letzten Stuhl.",
      place: {
        F: { row: 1, col: 6 },
        G: { row: 6, col: 5 },
        C: { row: 4, col: 0 },
        B: { row: 0, col: 1 },
      },
    },
    {
      text: "Das lokalisiert Hanna und Adeline, dann Ornella. Adeline ist die Mörderin!",
      place: {
        H: { row: 3, col: 3 },
        A: { row: 7, col: 7 },
        O: { row: 8, col: 8 },
      },
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
