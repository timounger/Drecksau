/**
 * Shopping Mall: an office, a toilet, an alley, a storeroom, a bed shop and a
 * shoe shop, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/36. Einkaufszentrum.png`,
 * no solution sheet), with the culprit pencilled in on the photographed page.
 * Otmar is the victim; whoever was alone with him killed him.
 *
 * The armchairs (the toilet among them) are the chairs; they, the beds and the
 * rugs (the framed mats in the shoe shop and the storeroom among them) can be
 * stood on. The blue boxes are crates; they, the tables, the shelves and the
 * plants cannot. "South-east of" means in a later row and a later column,
 * however far.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  alone,
  all,
  beside,
  column,
  counting,
  inArea,
  not,
  on,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether everybody in the suspect's room stood on a bed. */
function allOnBeds(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").every((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "bed");
  });
}

/** Whether nobody but the suspect stands on a rug. */
function onlyOneOnARug(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "rug");
  });
}

/** Whether the suspect stood in a row north of Andreas. */
function northOfAndreas(c: Context): boolean {
  const andreas = c.cellOf("A");
  return andreas !== undefined && c.cell.row < andreas.row;
}

/** Whether the suspect stood south-east of Andreas, in his room. */
function southEastOfAndreas(c: Context): boolean {
  const andreas = c.cellOf("A");
  return (
    andreas !== undefined &&
    c.cell.row > andreas.row &&
    c.cell.col > andreas.col &&
    c.areaOf(andreas) === c.areaOf(c.cell)
  );
}

/** The case. */
export const SHOPPING_MALL: Level = {
  id: "shopping-mall",
  name: "Einkaufszentrum",
  series: { book: "original", number: 36 },
  story:
    "Ich habe gehört, dass der Einzelhandel stirbt, aber das ist lächerlich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "B",
      name: "Büro",
      at: "im Büro",
      ground: "stone",
      tint: "#dbe7ef",
      label: { row: 2, col: 0 },
    },
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "stone",
      tint: "#e6eef2",
      label: { row: 2, col: 3 },
    },
    {
      key: "G",
      name: "Gasse",
      at: "in der Gasse",
      ground: "path",
      tint: "#c9c7cc",
      label: { row: 8, col: 4 },
    },
    {
      key: "L",
      name: "Lager",
      at: "im Lager",
      ground: "floor",
      tint: "#e6cfe0",
      label: { row: 3, col: 7 },
    },
    {
      key: "E",
      name: "Bettengeschäft",
      at: "im Bettengeschäft",
      ground: "stone",
      tint: "#d5e6ec",
      label: { row: 8, col: 0 },
    },
    {
      key: "S",
      name: "Schuhgeschäft",
      at: "im Schuhgeschäft",
      ground: "stone",
      tint: "#e2d4e8",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "BBBGGLLLL",
    "BBBTGLLLL",
    "BBBTGLLLL",
    "EEEEGLLLL",
    "EEEEGSSSS",
    "EEEEGSSSS",
    "EEEEGSSSS",
    "EEEEGGSSS",
    "EEEGGGSSS",
  ],
  thingMap: [
    ".ck.k.kpk",
    ".t.c.kk.k",
    "..p......",
    "bb.b.krrk",
    "t..b.pss.",
    "bb.bkrsrs",
    "bbrb....s",
    "..r...rrp",
    "bbr...rr.",
  ],
  things: {
    b: "bed",
    c: "chair",
    k: "crate",
    p: "plant",
    r: "rug",
    s: "shelf",
    t: "table",
  },
  pieces: [
    { at: { row: 3, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 8, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 2 }, rows: 3, cols: 1 },
    { at: { row: 3, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 6 }, rows: 2, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Andreas",
      pronoun: "er",
      clue: {
        text: "Alle in seinem Raum waren auf einem Bett, einschließlich ihm selbst.",
        ...all(on("bed"), counting(allOnBeds)),
      },
      colour: "#b91c1c",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "B",
      name: "Bernardo",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Chloe",
      pronoun: "sie",
      clue: {
        text: "Sie war allein im Büro.",
        ...all(inArea("B"), alone()),
      },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Dahlia",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person auf einem Teppich.",
        ...all(on("rug"), counting(onlyOneOnARug)),
      },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Emilia",
      pronoun: "sie",
      clue: {
        text: "Sie war in der zweiten Spalte. Sie war nördlich von Andreas.",
        ...all(column(2), about(["A"], northOfAndreas)),
      },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "F",
      name: "Franklin",
      pronoun: "er",
      clue: {
        text: "Er war südöstlich von Andreas, im selben Raum.",
        ...about(["A"], southEastOfAndreas),
      },
      colour: "#9f1239",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "G",
      name: "Gilbert",
      pronoun: "er",
      clue: { text: "Er war in der fünften Zeile.", ...row(5) },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Howard",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einer Kiste.",
        ...not(beside("crate")),
      },
      colour: "#4338ca",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "O",
      name: "Otmar",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Betten gibt es nur im Bettengeschäft: Dort war Andreas, und alle dort lagen auf einem Bett. Emilia war in C2 - nicht im Büro, wo Chloe allein war, also im Bettengeschäft auf einem Bett. Franklin war südöstlich von Andreas im selben Raum, also auch auf einem Bett, östlich von ihm. C2 gehört Emilia, und östlich von C4 liegt kein Bett mehr - Andreas war in C1.",
    },
    {
      text: "Emilia war nördlich von Andreas, Franklin südlich. In R4 C1 bliebe Emilia nur das Büro, in R7 C1 oder R9 C1 bliebe Franklin kein Bett (C2 gehört Emilia, C3 ist ein Teppich, R9 C4 liegt in der Gasse). Andreas lag in R6 C1. Südöstlich davon bleibt Franklin nur das Bett in R7 C4 (R7 C2 und R9 C2 liegen in Emilias Spalte), und Emilia lag nördlich in R4 C2.",
      place: {
        A: { row: 5, col: 0 },
        F: { row: 6, col: 3 },
        E: { row: 3, col: 1 },
      },
    },
    {
      text: "Chloe war allein im Büro. C1 und C2 sind besetzt, in C3 sind R1 C3 eine Kiste und R3 C3 eine Pflanze - Chloe war in R2 C3.",
      place: { C: { row: 1, col: 2 } },
    },
    {
      text: "Bernardo war neben einer Pflanze. Bei der Pflanze in R1 C8 stehen Kisten, und R2 ist besetzt. Die im Büro gehört Chloe allein. Neben der in R5 C6 liegt nur R6 C6 im selben Raum, und R6 ist besetzt. Bei der in R8 C9 liegen ein Regal, ein Teppich (dort war nur Dahlia) und R9 C9. Bernardo war in R9 C9.",
      place: { B: { row: 8, col: 8 } },
    },
    {
      text: "Gilbert war in R5: R5 C1 ist ein Tisch, C2 und C4 sind besetzt, R5 C3 ist kein Bett, R5 C6 eine Pflanze, R5 C7 und R5 C8 sind Regale, C9 gehört Bernardo. Gilbert war in R5 C5 in der Gasse. Dahlia war die Einzige auf einem Teppich: Im Bettengeschäft lagen alle auf Betten, R4 und R6 sind besetzt - es bleiben R8 C7 und R8 C8.",
      place: { G: { row: 4, col: 4 } },
    },
    {
      text: "Frei sind noch R1 und R3 in C6 bis C8. In R1 ist nur R1 C6 frei, und dort liegen Kisten daneben - Howard war nicht neben einer Kiste, also stand Otmar in R1 C6. Howard war in R3, aber nicht in R3 C7 neben der Kiste in R2 C7: in R3 C8. Dahlia blieb R8 C7. Im Lager war Otmar allein mit Howard - Howard ist der Mörder!",
      place: {
        O: { row: 0, col: 5 },
        H: { row: 2, col: 7 },
        D: { row: 7, col: 6 },
      },
    },
  ],
  solution: {
    A: { row: 5, col: 0 },
    B: { row: 8, col: 8 },
    C: { row: 1, col: 2 },
    D: { row: 7, col: 6 },
    E: { row: 3, col: 1 },
    F: { row: 6, col: 3 },
    G: { row: 4, col: 4 },
    H: { row: 2, col: 7 },
    O: { row: 0, col: 5 },
  },
};
