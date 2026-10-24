/**
 * Die Schreibwerkstatt: the archive, the papyrus store, the copying room and
 * the writing room of an Egyptian scribes' workshop, with a murdered scribe.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/63.png`, no solution
 * sheet - the solved grid is pencilled in on the photographed page, and the
 * solver proves it is the only solution).
 * Veser is the victim; whoever was alone with him killed him.
 *
 * The cards show no estates and the map no crowns. The cat sits on the
 * corner between four fields; beside the cat is any of those four
 * ({@link CAT_CORNER}). Papyrus "cannot be occupied", as the legend says;
 * neither can the scroll baskets, the chest, the crate or the writing
 * tables. The rugs can be stood on.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import { beside, column, on, own, victim } from "../engine/clues";
import type { Cell, Level, Rule } from "../engine/types";

/** The four fields round the corner the cat sits on. */
const CAT_CORNER: readonly Cell[] = [
  { row: 4, col: 1 },
  { row: 4, col: 2 },
  { row: 5, col: 1 },
  { row: 5, col: 2 },
];

/** Whoever stood on an Anubis field was alone in their area. */
const ANUBIS: Rule = {
  text: "Wer auf einer Anubis-Hieroglyphe stand, war allein in seinem Bereich.",
  check: (c) =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return (
        there === undefined ||
        !c.is(there, "anubis") ||
        c.peopleIn(c.areaOf(there) ?? "").length === 1
      );
    }),
};

/** The case. */
export const THE_SCRIBES_WORKSHOP: Level = {
  id: "the-scribes-workshop",
  name: "Die Schreibwerkstatt",
  series: { book: "timeTravel", number: 63 },
  story:
    "Die erste Büroarbeit der Geschichte. Das erste Opfer von Stress am Arbeitsplatz.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Archiv",
      at: "im Archiv",
      ground: "stone",
      tint: "#e4e0d4",
      label: { row: 3, col: 0 },
    },
    {
      key: "P",
      name: "Papyruslager",
      at: "im Papyruslager",
      ground: "floor",
      tint: "#ecd5b8",
      label: { row: 2, col: 4 },
    },
    {
      key: "K",
      name: "Kopierraum",
      at: "im Kopierraum",
      ground: "stone",
      tint: "#e9e6da",
      label: { row: 5, col: 1 },
    },
    {
      key: "S",
      name: "Schreibraum",
      at: "im Schreibraum",
      ground: "stone",
      tint: "#e2e2d6",
      label: { row: 5, col: 4 },
    },
  ],
  areaMap: ["AAPPPP", "AAPPPP", "AAAPPP", "AAASSS", "KKKSSS", "KKKSSS"],
  thingMap: ["bb..pp", "rrp...", "b.apx.", ".ac.rt", "tr..rr", ".rrtrt"],
  things: {
    a: "anubis",
    b: "scrollBasket",
    c: "chest",
    p: "papyrus",
    r: "rug",
    t: "table",
    x: "woodCrate",
  },
  extraThings: {
    scrollBasket: {
      name: "Schriftrollenkorb",
      emoji: "\u{1F9FA}",
      standable: false,
    },
  },
  pieces: [{ at: { row: 1, col: 0 }, rows: 1, cols: 2 }],
  shapes: [
    [
      { row: 4, col: 1 },
      { row: 5, col: 1 },
      { row: 5, col: 2 },
    ],
    [
      { row: 3, col: 4 },
      { row: 4, col: 4 },
      { row: 5, col: 4 },
      { row: 4, col: 5 },
    ],
  ],
  corners: [{ at: { row: 4, col: 1 }, thing: "cat" }],
  suspects: [
    {
      id: "A",
      name: "Anhku",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Bata",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Teppich.", ...on("rug") },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Cheti",
      pronoun: "er",
      clue: {
        text: "Er war neben der Katze.",
        ...own((c) =>
          CAT_CORNER.some(
            (one) => one.row === c.cell.row && one.col === c.cell.col,
          ),
        ),
        glow: () => CAT_CORNER,
      },
      colour: "#0e7490",
      face: "\u{1F473}",
    },
    {
      id: "D",
      name: "Daenre",
      pronoun: "er",
      clue: { text: "Er war in der letzten Spalte.", ...column(6) },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Esi",
      pronoun: "sie",
      clue: { text: "Sie war neben der Truhe.", ...beside("chest") },
      colour: "#ea580c",
      face: "\u{1F9D5}",
    },
    {
      id: "V",
      name: "Veser",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F469}‍\u{1F9B0}",
    },
  ],
  rules: [ANUBIS],
  hints: [
    {
      text: "In Zeile 1 kann man nur auf R1C3 und R1C4 stehen - Körbe und Papyrus sind belegt. Dort passt keiner der Hinweise, also steht Veser in Zeile 1.",
    },
    {
      text: "Esi steht neben der Truhe: auf R3C3 oder R4C2, beides Anubis-Felder. Sie ist also allein im Archiv. Jede Spalte hat genau eine Person; in Spalte 1 bleibt außerhalb des Archivs und außerhalb von Zeile 1 nur R6C1 - neben dem Tisch in R5C1. Dort steht Anhku.",
      place: { A: { row: 5, col: 0 } },
    },
    {
      text: "Cheti steht neben der Katze, also in R5C2 oder R5C3 - Zeile 6 ist Anhkus. Bata steht auf einem Teppich, aber nicht im Archiv, nicht in Zeile 5 (Cheti) und nicht in Zeile 6 (Anhku): Es bleibt R4C5.",
      place: { B: { row: 3, col: 4 } },
    },
    {
      text: "R4C2 liegt in Batas Zeile - Esi steht in R3C3. Spalte 3 ist damit Esis, Cheti steht in R5C2.",
      place: { E: { row: 2, col: 2 }, C: { row: 4, col: 1 } },
    },
    {
      text: "Daenre steht in Spalte 6, frei ist nur noch Zeile 2: R2C6. Veser steht in R1C4 im Papyruslager - allein mit Daenre. Daenre ist der Mörder!",
      place: { D: { row: 1, col: 5 }, V: { row: 0, col: 3 } },
    },
  ],
  solution: {
    A: { row: 5, col: 0 },
    B: { row: 3, col: 4 },
    C: { row: 4, col: 1 },
    D: { row: 1, col: 5 },
    E: { row: 2, col: 2 },
    V: { row: 0, col: 3 },
  },
};
