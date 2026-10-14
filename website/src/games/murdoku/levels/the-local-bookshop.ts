/**
 * The Local Bookshop: crime, romance, non-fiction and bestseller sections and a
 * till, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Der örtliche Buchladen/Der örtliche Buchladen.png`,
 * solution sheet
 * `game_instructions/Murdoku/Das Murdoku-Orginal/Lösungen 1-80/Lösung 05-08.JPG`).
 * Olga is the victim; whoever was alone with her killed her.
 *
 * The shelves, the table and the till cannot be stood on. "South of" means
 * any row further down, not necessarily in the same area.
 */
import { about, beside, inArea, not, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_LOCAL_BOOKSHOP: Level = {
  id: "the-local-bookshop",
  name: "Der örtliche Buchladen",
  series: { book: "original", number: 6 },
  story:
    "Ein gebrochener Rücken ist immer furchtbar, nicht nur bei einem Buch.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Krimis",
      at: "bei den Krimis",
      ground: "floor",
      tint: "#dcebd6",
      label: { row: 1, col: 1 },
    },
    {
      key: "L",
      name: "Liebesromane",
      at: "bei den Liebesromanen",
      ground: "floor",
      tint: "#ece4ec",
      label: { row: 2, col: 4 },
    },
    {
      key: "S",
      name: "Sachbücher",
      at: "bei den Sachbüchern",
      ground: "floor",
      tint: "#ecebc4",
      label: { row: 3, col: 1 },
    },
    {
      key: "B",
      name: "Bestseller",
      at: "bei den Bestsellern",
      ground: "floor",
      tint: "#f0dcc4",
      label: { row: 5, col: 2 },
    },
    {
      key: "X",
      name: "Kasse",
      at: "an der Kasse",
      ground: "floor",
      tint: "#d4cce6",
      label: { row: 5, col: 4 },
    },
  ],
  areaMap: ["KKKLLL", "KKKLLL", "SSSSLL", "SSSSXX", "BBBBXX", "BBBBXX"],
  thingMap: [".rtr..", ".....r", "...r.r", "r.r...", ".r.r.k", "rr.r.r"],
  things: { r: "shelf", t: "table", k: "cashRegister" },
  extraThings: {
    cashRegister: { name: "Kasse", emoji: "\u{1F4B5}", standable: false },
  },
  suspects: [
    {
      id: "A",
      name: "Aria",
      pronoun: "sie",
      clue: { text: "Sie war in der Bestseller-Abteilung.", ...inArea("B") },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Benno",
      pronoun: "er",
      clue: { text: "Er war neben dem Tisch.", ...beside("table") },
      colour: "#15803d",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "C",
      name: "Calvin",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einem Regal.",
        ...not(beside("shelf")),
      },
      colour: "#0e7490",
      face: "\u{1F474}",
    },
    {
      id: "D",
      name: "Damian",
      pronoun: "er",
      clue: {
        text: "Er war südlich von Aria.",
        ...about(["A"], (c) => {
          const aria = c.cellOf("A");
          return aria !== undefined && c.cell.row > aria.row;
        }),
      },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Ekaterina",
      pronoun: "sie",
      clue: { text: "Sie war in der Liebesromane-Abteilung.", ...inArea("L") },
      colour: "#334155",
      face: "\u{1F475}",
    },
    {
      id: "O",
      name: "Olga",
      pronoun: "sie",
      clue: {
        text: "Sie war im letzten verbleibenden Feld, allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F471}‍♀️",
    },
  ],
  rules: [
    {
      text: "Südlich von (a): in einer Zeile unter (a), aber nicht unbedingt im selben Raum.",
    },
  ],
  hints: [
    {
      text: "Es gibt nur ein Feld neben einem Tisch für Benno: Zeile 2, Spalte 3.",
      place: { B: { row: 1, col: 2 } },
      cross: [
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 3 },
        { row: 1, col: 4 },
        { row: 0, col: 2 },
        { row: 2, col: 2 },
        { row: 3, col: 2 },
        { row: 4, col: 2 },
        { row: 5, col: 2 },
      ],
    },
    {
      text: "Das lokalisiert Aria, dann Damian.",
      place: { A: { row: 4, col: 0 }, D: { row: 5, col: 4 } },
      cross: [
        { row: 4, col: 4 },
        { row: 0, col: 0 },
        { row: 2, col: 0 },
        { row: 0, col: 4 },
        { row: 2, col: 4 },
        { row: 3, col: 4 },
      ],
    },
    {
      text: "Das lokalisiert Ekaterina bei den Liebesromanen.",
      place: { E: { row: 0, col: 5 } },
    },
    {
      text: "Das lokalisiert Calvin im letzten Feld, das nicht neben einem Regal ist.",
      place: { C: { row: 2, col: 1 } },
    },
    {
      text: "Das lokalisiert Olga.",
      place: { O: { row: 3, col: 3 } },
    },
    {
      text: "Calvin war allein mit der ermordeten Person im Sachbuchbereich. Calvin ist der Mörder!",
    },
  ],
  solution: {
    A: { row: 4, col: 0 },
    B: { row: 1, col: 2 },
    C: { row: 2, col: 1 },
    D: { row: 5, col: 4 },
    E: { row: 0, col: 5 },
    O: { row: 3, col: 3 },
  },
};
