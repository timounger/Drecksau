/**
 * The Pigsty: a farm with a muddy yard, a pasture and a pigsty, and a
 * murdered farmhand.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Der Schweinestall.png`, no solution
 * sheet; the solver proves the case has exactly one solution). Valerio is
 * the victim; whoever was alone with him killed him. The mud puddles can be
 * stood on, the pigs and the table cannot.
 */
import { beside, inArea, not, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_PIGSTY: Level = {
  id: "the-pigsty",
  name: "Der Schweinestall",
  difficulty: "veryEasy",
  series: { book: "online" },
  story:
    "Valerio wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "H",
      name: "Schlammiger Hof",
      at: "im schlammigen Hof",
      ground: "path",
      tint: "#e9c98f",
      label: { row: 2, col: 1 },
    },
    {
      key: "W",
      name: "Weide",
      at: "auf der Weide",
      ground: "grass",
      tint: "#f0d78a",
      label: { row: 4, col: 1 },
    },
    {
      key: "S",
      name: "Schweinestall",
      at: "im Schweinestall",
      ground: "floor",
      tint: "#dfbcb0",
      label: { row: 4, col: 3 },
    },
  ],
  areaMap: ["HHHHH", "HHHHH", "WHHSS", "WWWSS", "WWWSS"],
  thingMap: ["..m..", "pmm.m", ".....", "p.p.p", "....t"],
  things: { m: "mud", p: "pig", t: "table" },
  extraThings: {
    pig: {
      name: "Schwein",
      emoji: "\u{1F416}",
      standable: false,
      kinds: ["animal"],
    },
  },
  suspects: [
    {
      id: "A",
      name: "Andy",
      pronoun: "er",
      clue: { text: "Er war im Schweinestall.", ...inArea("S") },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Brent",
      pronoun: "er",
      clue: {
        text: "Er war nicht auf einer Schlammpfütze.",
        ...not(on("mud")),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Carissa",
      pronoun: "sie",
      clue: { text: "Sie war neben dem Tisch.", ...beside("table") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dolores",
      pronoun: "sie",
      clue: { text: "Sie war auf der Weide.", ...inArea("W") },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "V",
      name: "Valerio",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Über dem Tisch steht ein Schwein, also gibt es neben dem Tisch nur ein freies Feld: Carissa muss auf R5 C4 sein. Blockiere ihre Reihe und Spalte.",
      place: { C: { row: 4, col: 3 } },
    },
    {
      text: "Im Schweinestall bleibt für Andy nur noch R3 C5, denn auf R4 C5 steht ein Schwein. Blockiere seine Reihe und Spalte.",
      place: { A: { row: 2, col: 4 } },
    },
    {
      text: "Auf der Weide stehen auf R4 C1 und R4 C3 Schweine, R3 und R5 sind blockiert. Für Dolores bleibt nur R4 C2.",
      place: { D: { row: 3, col: 1 } },
    },
    {
      text: "Übrig sind R1 und R2 in C1 und C3. R1 C3 und R2 C3 sind Schlammpfützen, auf R2 C1 steht ein Schwein. Brent muss auf R1 C1 sein.",
      place: { B: { row: 0, col: 0 } },
    },
    {
      text: "Damit bleibt für Valerio nur R2 C3 im schlammigen Hof. Er war allein mit Brent, Brent ist der Mörder!",
      place: { V: { row: 1, col: 2 } },
    },
  ],
  solution: {
    A: { row: 2, col: 4 },
    B: { row: 0, col: 0 },
    C: { row: 4, col: 3 },
    D: { row: 3, col: 1 },
    V: { row: 1, col: 2 },
  },
};
