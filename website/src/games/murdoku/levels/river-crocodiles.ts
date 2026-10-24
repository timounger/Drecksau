/**
 * Flusskrokodile: three huts, a berry island, the river and its two banks,
 * with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/58.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Veeka is the victim; whoever was alone with her killed her.
 *
 * The cards show no estates and the map no crowns. Instead three kinds of
 * fields are framed and marked: a fish (the fisher), a basket of berries (the
 * gatherer) and a spear (the hunter). Each trade was held by exactly one
 * person, who stood on a field of it; nobody else stood on a marked field
 * ({@link TRADES}). Who held which trade, the case does not say. The marked
 * fields can be stood on; the crocodiles, fires, bone piles, palms and bushes
 * cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  alone,
  all,
  beside,
  column,
  inArea,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The marked fields, one per trade. */
const TRADES: readonly string[] = ["fishingSpot", "berries", "spear"];

/** The huts. */
const HUTS: readonly string[] = ["A", "B", "C"];

/** The case. */
export const RIVER_CROCODILES: Level = {
  id: "river-crocodiles",
  name: "Flusskrokodile",
  series: { book: "timeTravel", number: 58 },
  story: "Der ganze Stamm trauert - aber jemand weint Krokodilstränen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Amkas Hütte",
      at: "in Amkas Hütte",
      ground: "floor",
      tint: "#f3ead8",
      label: { row: 1, col: 2 },
    },
    {
      key: "N",
      name: "Nordufer",
      at: "am Nordufer",
      ground: "grass",
      tint: "#9fcde6",
      label: { row: 2, col: 2 },
    },
    {
      key: "B",
      name: "Brakos Hütte",
      at: "in Brakos Hütte",
      ground: "floor",
      tint: "#f3ead8",
      label: { row: 3, col: 7 },
    },
    {
      key: "I",
      name: "Beereninsel",
      at: "auf der Beereninsel",
      ground: "grass",
      tint: "#cfe6e8",
      label: { row: 6, col: 0 },
    },
    {
      key: "R",
      name: "Fluss",
      at: "im Fluss",
      ground: "water",
      tint: "#dcf0f4",
      label: { row: 5, col: 5 },
    },
    {
      key: "C",
      name: "Clakus Hütte",
      at: "in Clakus Hütte",
      ground: "floor",
      tint: "#f3ead8",
      label: { row: 7, col: 5 },
    },
    {
      key: "S",
      name: "Südufer",
      at: "am Südufer",
      ground: "grass",
      tint: "#9fcde6",
      label: { row: 8, col: 5 },
    },
  ],
  areaMap: [
    "AAAAANNNN",
    "RAAANNNNN",
    "RRNNNRRBB",
    "IRRRRRRBB",
    "IIIRRRRRR",
    "IIRRRRRCS",
    "IIRRSCCCS",
    "RRRSSCCCS",
    "RRRSSSSSS",
  ],
  thingMap: [
    ".fkw...p.",
    "nkkkf.ds.",
    ".n...n..s",
    "r...n....",
    "krk.s....",
    "kr..n..np",
    "rk.n..w.k",
    ".dsp....p",
    "sn..p..s.",
  ],
  things: {
    d: "crocodile",
    f: "campfire",
    k: "berries",
    n: "fishingSpot",
    p: "palm",
    r: "shrub",
    s: "spear",
    w: "bonePile",
  },
  suspects: [
    {
      id: "A",
      name: "Amka",
      pronoun: "sie",
      clue: { text: "Sie war in ihrer eigenen Hütte.", ...inArea("A") },
      colour: "#b91c1c",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "B",
      name: "Brako",
      pronoun: "er",
      clue: { text: "Er war in seiner eigenen Hütte.", ...inArea("B") },
      colour: "#15803d",
      face: "\u{1F474}\u{1F3FD}",
    },
    {
      id: "C",
      name: "Claku",
      pronoun: "er",
      clue: { text: "Er war in seiner eigenen Hütte.", ...inArea("C") },
      colour: "#0e7490",
      face: "\u{1F468}\u{1F3FD}",
    },
    {
      id: "D",
      name: "Deema",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Hütte. Sie hatte ein Handwerk.",
        ...all(inArea(...HUTS), own(onTrade)),
      },
      colour: "#6366f1",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "E",
      name: "Ega",
      pronoun: "sie",
      clue: { text: "Sie war in der fünften Spalte.", ...column(5) },
      colour: "#a16207",
      face: "\u{1F469}\u{1F3FD}\u{200D}\u{1F9B1}",
    },
    {
      id: "F",
      name: "Frak",
      pronoun: "er",
      clue: {
        text: "Er war allein. Er hatte ein Handwerk.",
        ...all(alone(), own(onTrade)),
      },
      colour: "#be185d",
      face: "\u{1F9D4}\u{1F3FE}",
    },
    {
      id: "G",
      name: "Gamo",
      pronoun: "er",
      clue: { text: "Er war neben einem Feuer.", ...beside("campfire") },
      colour: "#57534e",
      face: "\u{1F468}\u{1F3FE}",
    },
    {
      id: "H",
      name: "Hako",
      pronoun: "er",
      clue: { text: "Er war neben einem Krokodil.", ...beside("crocodile") },
      colour: "#7c3aed",
      face: "\u{1F9D4}\u{1F3FD}",
    },
    {
      id: "V",
      name: "Veeka",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}\u{1F3FD}\u{200D}\u{1F9B0}",
    },
  ],
  rules: [
    {
      text: "Es gab einen Fischer, eine Person, die Beeren sammelte, und einen Jäger. Jeder von ihnen stand auf einem Feld seines Handwerks, sonst niemand auf einem solchen Feld.",
      check: (c) => TRADES.every((what) => peopleOn(c, what).length === 1),
      prune: (c) => TRADES.every((what) => peopleOn(c, what).length <= 1),
    },
  ],
  hints: [
    {
      text: "Ega steht in C5. Amka ist in ihrer Hütte, aber nicht in R1 C5 (Egas Spalte) - also in R1 oder R2. Gamo steht neben einem Feuer: R3 C5 liegt in C5, alle anderen Felder in R1 oder R2. Die Zeilen 1 und 2 gehören Amka und Gamo.",
    },
    {
      text: "Hako steht neben einem Krokodil, nicht in R1 oder R2 - also im Fluss: R8 C1, R8 C3 oder R9 C2. Deema ist in einer Hütte und hat ein Handwerk; Amkas Hütte liegt in R1 und R2, also ist sie die Jägerin in R3 C9 oder die Fischerin in R6 C8. Stünde sie in R6 C8, wäre Hako nicht auf dem Fisch R9 C2, sondern in Zeile 8, und Claku in R7 C6 (C8 wäre Deemas Spalte, R7 C7 ist ein Knochenhaufen). Amka steht in R1 C1 oder auf Beeren, Gamo in R1 C1, R2 C6 oder auf Beeren - R2 C6 wäre Clakus Spalte, also stünde einer von beiden auf Beeren und sammelte sie. Hako in R8 C1 nähme C1, dann stünden beide auf Beeren; Hako in R8 C3 wäre der Jäger, und für Frak bliebe kein Handwerk. Deema ist also die Jägerin in R3 C9, Brako steht in R4 C8.",
      place: { D: { row: 2, col: 8 }, B: { row: 3, col: 7 } },
    },
    {
      text: "R8 C3 ist ein Speer - der gehört der Jägerin. Hako steht also in R8 C1 oder R9 C2, auf jeden Fall im Fluss. Frak ist allein und hat ein Handwerk: Gejagt hat Deema, und die Fische, die noch frei sind, liegen im Fluss (R3 ist Deemas Zeile, C5 Egas und C8 Brakos Spalte) - dort steht Hako. Frak sammelte die Beeren. Amka und Gamo stehen also nicht auf Beerenkörben: Amka in R1 C1, Gamo in R2 C6.",
      place: { A: { row: 0, col: 0 }, G: { row: 1, col: 5 } },
    },
    {
      text: "C1 ist Amkas Spalte: Hako steht in R9 C2 und ist der Fischer. Claku steht in seiner Hütte in R8 C7 (C6 ist Gamos, C8 Brakos Spalte, R7 C7 ist ein Knochenhaufen). Ega steht weder auf dem Speer in R5 C5 noch auf dem Fisch in R6 C5, also in R7 C5.",
      place: {
        H: { row: 8, col: 1 },
        C: { row: 7, col: 6 },
        E: { row: 6, col: 4 },
      },
    },
    {
      text: "Frak sammelt allein Beeren in R5 oder R6, C3 oder C4: R5 C3 auf der Beereninsel. Veeka steht auf dem letzten Feld, R6 C4 im Fluss - allein mit Hako. Hako ist der Mörder!",
      place: { F: { row: 4, col: 2 }, V: { row: 5, col: 3 } },
    },
  ],
  solution: {
    A: { row: 0, col: 0 },
    B: { row: 3, col: 7 },
    C: { row: 7, col: 6 },
    D: { row: 2, col: 8 },
    E: { row: 6, col: 4 },
    F: { row: 4, col: 2 },
    G: { row: 1, col: 5 },
    H: { row: 8, col: 1 },
    V: { row: 5, col: 3 },
  },
};

/** Whether the suspect stood on a marked field. */
function onTrade(c: Context): boolean {
  return TRADES.some((what) => c.is(c.cell, what));
}

/** Everybody standing on a thing of this id. */
function peopleOn(c: Context, what: string): readonly string[] {
  return c.people().filter((one) => {
    const there = c.cellOf(one);
    return there !== undefined && c.is(there, what);
  });
}
