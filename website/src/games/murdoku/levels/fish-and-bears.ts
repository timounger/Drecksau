/**
 * Fische und Bären: two caves, a river, two forests and a bear den, with a
 * murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/55.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Vlaku is the victim; whoever was alone with him killed him.
 *
 * The cards show no estates and the map no crowns. Instead two kinds of
 * fields are framed and marked: a fish (the fisher) and a spear (the hunter).
 * The hunter is Egrul; who the fisher is, the case does not say. Exactly one
 * person stood on a fish field - the fisher - and only Egrul on a spear field
 * ({@link MARKED}). Beds and the marked fields can be stood on; the fires,
 * boulders, trees and the bears cannot.
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
  victim,
} from "../engine/clues";
import type { Context, Level, Rule } from "../engine/types";

/** The rules of the marked fields. */
const MARKED: readonly Rule[] = [
  {
    text: "Es gab eine Person, die fischte: Sie stand auf einem Fisch-Feld, und niemand sonst stand auf einem.",
    check: (c) => peopleOn(c, "fishingSpot") === 1,
  },
  {
    text: "Der Jäger stand auf einem Speer-Feld - und nur er.",
    unary: (suspect, c) =>
      c.is(c.cell, "spear") === (suspect.traits ?? []).includes("hunter"),
  },
];

/** The case. */
export const FISH_AND_BEARS: Level = {
  id: "fish-and-bears",
  name: "Fische und Bären",
  series: { book: "timeTravel", number: 55 },
  story: "Sich tot zu stellen mag einen Bären täuschen, aber keinen Mörder.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Westhöhle",
      at: "in der Westhöhle",
      ground: "stone",
      tint: "#d8d0ea",
      label: { row: 2, col: 0 },
    },
    {
      key: "E",
      name: "Osthöhle",
      at: "in der Osthöhle",
      ground: "stone",
      tint: "#d8d0ea",
      label: { row: 1, col: 5 },
    },
    {
      key: "R",
      name: "Fluss",
      at: "im Fluss",
      ground: "water",
      tint: "#d6e6f7",
      label: { row: 6, col: 6 },
    },
    {
      key: "S",
      name: "Ostwald",
      at: "im Ostwald",
      ground: "grass",
      tint: "#8fbf9a",
      label: { row: 4, col: 6 },
    },
    {
      key: "F",
      name: "Westwald",
      at: "im Westwald",
      ground: "grass",
      tint: "#8fbf9a",
      label: { row: 7, col: 1 },
    },
    {
      key: "O",
      name: "Bärenhöhle",
      at: "in der Bärenhöhle",
      ground: "stone",
      tint: "#a9b3c9",
      label: { row: 8, col: 0 },
    },
  ],
  areaMap: [
    "WWWRRREEE",
    "WWRRREEEE",
    "WWRRRSSSS",
    "FFRRRSSSS",
    "FFFRRRSSS",
    "FFFRRRRRR",
    "FFFFRRRRR",
    "OFFFFFFRR",
    "OOOFFFFFF",
  ],
  thingMap: [
    "bf...nfbb",
    "b...n....",
    "..nkn.t.t",
    ".t...t..t",
    "s.t..n.u.",
    "ttkn..k..",
    "t..tn...k",
    ".t..t..n.",
    ".u.t.stt.",
  ],
  things: {
    b: "bed",
    f: "campfire",
    k: "boulder",
    n: "fishingSpot",
    s: "spear",
    t: "tree",
    u: "bear",
  },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 7 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Ayka",
      pronoun: "sie",
      clue: {
        text: "Sie war allein in der Ost- oder der Westhöhle.",
        ...all(inArea("E", "W"), alone()),
      },
      colour: "#b91c1c",
      face: "\u{1F469}\u{200D}\u{1F9B0}",
    },
    {
      id: "B",
      name: "Bak",
      pronoun: "sie",
      clue: {
        text: "Sie war im Fluss. Sie war nicht die Fischerin.",
        ...all(inArea("R"), not(on("fishingSpot"))),
      },
      colour: "#15803d",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "C",
      name: "Civo",
      pronoun: "sie",
      clue: { text: "Sie war in der letzten Spalte.", ...column(9) },
      colour: "#0e7490",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "D",
      name: "Deku",
      pronoun: "er",
      clue: {
        text: "Er war allein. Er war genau eine Zeile nördlich von Hima.",
        ...all(
          alone(),
          about(["H"], (c) => {
            const hima = c.cellOf("H");
            return hima !== undefined && c.cell.row === hima.row - 1;
          }),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F466}\u{1F3FD}",
    },
    {
      id: "E",
      name: "Egrul",
      pronoun: "er",
      traits: ["hunter"],
      clue: { text: "Der Jäger.", ...on("spear") },
      colour: "#a16207",
      face: "\u{1F9D4}\u{1F3FD}",
    },
    {
      id: "F",
      name: "Falu",
      pronoun: "er",
      clue: {
        text: "In seinem Bereich war ein Bär.",
        ...inArea("S", "O"),
      },
      colour: "#be185d",
      face: "\u{1F9D4}\u{1F3FE}",
    },
    {
      id: "G",
      name: "Grak",
      pronoun: "er",
      clue: { text: "Er war neben einem Feuer.", ...beside("campfire") },
      colour: "#57534e",
      face: "\u{1F468}\u{1F3FE}",
    },
    {
      id: "H",
      name: "Hima",
      pronoun: "sie",
      clue: {
        text: "In ihrem Bereich war kein Mann.",
        ...counting((c) =>
          c.peopleIn(c.areaOf(c.cell) ?? "").every((one) => !c.has(one, "man")),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F469}\u{200D}\u{1F9B0}",
    },
    {
      id: "V",
      name: "Vlaku",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}\u{1F3FD}",
    },
  ],
  rules: MARKED,
  hints: [
    {
      text: "Beide Speer-Felder liegen im Westwald - dort ist Egrul. Ayka ist allein in einer Höhle, Grak (neben einem Feuer) in der anderen. Deku ist allein, also weder im Westwald noch in einer Höhle noch im Fluss (Bak): Er ist im Ostwald oder in der Bärenhöhle - und Falu, in dessen Bereich ein Bär war, im jeweils anderen. In Himas Bereich war kein Mann: Ihr bleibt nur der Fluss.",
    },
    {
      text: "Deku steht genau eine Zeile nördlich von Hima. Aus der Bärenhöhle (R8 oder R9) käme Hima in R9 oder darunter - dort fließt kein Fluss. Deku ist also im Ostwald (R3-R5), Falu in der Bärenhöhle. Im Fluss stehen nur Frauen; Bak fischt nicht, und auf Civos Flussfeldern in C9 gibt es keinen Fisch. Hima ist die Fischerin: R5 C6 oder R6 C4 (aus R3 käme Deku in R2).",
    },
    {
      text: "Stünde Egrul in R5 C1, müsste Hima nach R6 C4 und Deku in R5 - Egruls Zeile. Egrul steht in R9 C6. Damit ist R5 C6 seine Spalte: Hima steht in R6 C4. Falu steht in der Bärenhöhle nicht in R9: R8 C1.",
      place: {
        E: { row: 8, col: 5 },
        H: { row: 5, col: 3 },
        F: { row: 7, col: 0 },
      },
    },
    {
      text: "Civo steht in C9: R6, R8 und R9 sind besetzt, also in der Osthöhle. Deku steht deshalb in R5 C7, nicht in C9. Ayka ist allein, also in der Westhöhle, und Grak bei Civo in der Osthöhle neben einem Feuer: R2 C7 ist Dekus Spalte - Grak steht in R1 C8, Civo in R2 C9. Ayka bleibt in der Westhöhle nur R3 C2.",
      place: {
        D: { row: 4, col: 6 },
        G: { row: 0, col: 7 },
        C: { row: 1, col: 8 },
        A: { row: 2, col: 1 },
      },
    },
    {
      text: "Frei sind noch R4 und R7, C3 und C5. Bak steht im Fluss, aber nicht auf dem Fisch in R7 C5 - sie steht in R4 C3 oder R4 C5. Vlaku steht in R7, auf R7 C5 darf er nicht (nur Hima fischt): R7 C3, also Bak in R4 C5. Vlaku ist im Westwald allein mit Egrul. Egrul ist der Mörder!",
      place: { B: { row: 3, col: 4 }, V: { row: 6, col: 2 } },
    },
  ],
  solution: {
    A: { row: 2, col: 1 },
    B: { row: 3, col: 4 },
    C: { row: 1, col: 8 },
    D: { row: 4, col: 6 },
    E: { row: 8, col: 5 },
    F: { row: 7, col: 0 },
    G: { row: 0, col: 7 },
    H: { row: 5, col: 3 },
    V: { row: 6, col: 2 },
  },
};

/** How many people stood on a thing of this id. */
function peopleOn(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  }).length;
}
