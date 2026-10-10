/**
 * Die Bushaltestelle: a bus stop with a courtyard, a kiosk, a pavement and
 * the street, and a murdered passer-by.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Die Bushaltestelle.png`, no solution
 * sheet - the solver proves the single solution). The bus stands on the
 * street over three fields. Vala is the victim; whoever was alone with her
 * killed her.
 */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether somebody stands in a car exactly one column west of the suspect. */
function eastOfSomebodyInACar(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      there !== undefined &&
      c.is(there, "car") &&
      there.col === c.cell.col - 1
    );
  });
}

/** Whether a car stands anywhere in the column west of the suspect. */
function carInColumnWest(c: Context): boolean {
  const col = c.cell.col - 1;
  return Array.from({ length: c.rows }, (_, row) => ({ row, col })).some(
    (cell) => c.inside(cell) && c.is(cell, "car"),
  );
}

/** Whether the suspect stands in the same area as somebody else. */
function sameAreaAs(id: string): (c: Context) => boolean {
  return (c) => {
    const there = c.cellOf(id);
    return there !== undefined && c.areaOf(there) === c.areaOf(c.cell);
  };
}

/** The case. */
export const THE_BUS_STOP: Level = {
  id: "the-bus-stop",
  name: "Die Bushaltestelle",
  difficulty: "easy",
  story:
    "Vala wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "H",
      name: "Hof",
      at: "im Hof",
      ground: "grass",
      tint: "#9fd884",
      label: { row: 3, col: 2 },
    },
    {
      key: "K",
      name: "Kiosk",
      at: "im Kiosk",
      ground: "floor",
      tint: "#b6ebe6",
      label: { row: 3, col: 4 },
    },
    {
      key: "B",
      name: "Bushaltestelle",
      at: "an der Bushaltestelle",
      ground: "floor",
      tint: "#c9a2cc",
      label: { row: 4, col: 0 },
    },
    {
      key: "G",
      name: "Gehweg",
      at: "auf dem Gehweg",
      ground: "stone",
      tint: "#c4c3df",
      label: { row: 4, col: 3 },
    },
    {
      key: "S",
      name: "Straße",
      at: "auf der Straße",
      ground: "stone",
      tint: "#9d9bb5",
      label: { row: 6, col: 2 },
    },
  ],
  areaMap: [
    "HHHHKKG",
    "HHHKKKG",
    "HHHKKKG",
    "BBHKKKG",
    "BBGGGGG",
    "SSSSSSS",
    "SSSSSSS",
  ],
  thingMap: [
    "..t..d.",
    "...s...",
    "t.t..s.",
    "c....s.",
    ".......",
    "bbb..aa",
    "...aa..",
  ],
  things: { t: "tree", d: "table", s: "shelf", c: "chair", a: "car", b: "bus" },
  extraThings: {
    bus: { name: "Bus", emoji: "\u{1F68C}", standable: true },
  },
  suspects: [
    {
      id: "A",
      name: "Adonis",
      pronoun: "er",
      clue: {
        text: "Er war genau eine Spalte östlich von jemandem in einem Auto.",
        ...all(own(carInColumnWest), counting(eastOfSomebodyInACar)),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Briar",
      pronoun: "sie",
      clue: { text: "Sie war im Bus.", ...on("bus") },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "C",
      name: "Colby",
      pronoun: "er",
      clue: {
        text: "Er war im Hof. Er war nicht neben einem Baum.",
        ...all(inArea("H"), not(beside("tree"))),
      },
      colour: "#0e7490",
      face: "\u{1F474}",
    },
    {
      id: "D",
      name: "Don",
      pronoun: "er",
      clue: {
        text: "Er war zusammen mit Colby.",
        ...about(["C"], sameAreaAs("C")),
      },
      colour: "#6366f1",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "E",
      name: "Elliot",
      pronoun: "er",
      clue: { text: "Er saß auf dem Stuhl.", ...on("chair") },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Giovanna",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht zusammen mit Adonis.",
        ...about(["A"], (c) => !sameAreaAs("A")(c)),
      },
      colour: "#9f1239",
      face: "\u{1F469}",
    },
    {
      id: "V",
      name: "Vala",
      pronoun: "sie",
      clue: { text: "Das Opfer. Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F471}‍♀️",
    },
  ],
  hints: [
    {
      text: "E sitzt auf dem einzigen Stuhl, in R4 C1. Sperre den Rest von R4 und C1.",
      place: { E: { row: 3, col: 0 } },
    },
    {
      text: "Im Hof gibt es nur zwei Felder, die nicht neben einem Baum liegen: R1 C1 und R2 C2. R1 C1 ist gesperrt, also ist C in R2 C2.",
      place: { C: { row: 1, col: 1 } },
    },
    {
      text: "D muss zusammen mit Colby im Hof sein. Das einzige freie Feld im Hof ist R1 C4.",
      place: { D: { row: 0, col: 3 } },
    },
    {
      text: "Vom Bus ist nur noch R6 C3 frei, also ist B dort. Damit ist R6 gesperrt.",
      place: { B: { row: 5, col: 2 } },
    },
    {
      text: "Das einzige freie Feld in einem Auto ist jetzt R7 C5. A muss genau eine Spalte östlich davon sein, in C6. Dort ist nur R5 C6 frei.",
      place: { A: { row: 4, col: 5 } },
    },
    {
      text: "Übrig sind R7 C5 und R3 C7. G darf nicht zusammen mit Adonis auf dem Gehweg sein, also ist G im Auto in R7 C5 und V in R3 C7. V war allein mit A auf dem Gehweg, Adonis ist der Mörder!",
      place: { G: { row: 6, col: 4 }, V: { row: 2, col: 6 } },
    },
  ],
  solution: {
    A: { row: 4, col: 5 },
    B: { row: 5, col: 2 },
    C: { row: 1, col: 1 },
    D: { row: 0, col: 3 },
    E: { row: 3, col: 0 },
    G: { row: 6, col: 4 },
    V: { row: 2, col: 6 },
  },
};
