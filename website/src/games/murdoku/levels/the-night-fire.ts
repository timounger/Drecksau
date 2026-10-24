/**
 * Am nächtlichen Lagerfeuer: a stone-age camp with two huts, a big hut, a
 * pantry, the fire and the forest round it, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/54.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Varka is the victim; whoever was alone with her killed her.
 *
 * The cards show no estates and the map no crowns. Instead three kinds of
 * fields are framed and marked: a basket of berries (the gatherer), a stone
 * axe (the toolmaker) and a wolf (the wolf tamer). Each of the three stood
 * on a field of their own trade, and nobody else stood on one ({@link TRADES}). Beds and the marked fields can be
 * stood on; boulders, bushes, trees, the fire and the bone piles cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  counting,
  inArea,
  not,
  on,
  own,
  beside,
  alone,
  victim,
} from "../engine/clues";
import type { Context, Level, Rule } from "../engine/types";

/** The fire area's corners. */
const FIRE_CORNERS: readonly (readonly [number, number])[] = [
  [3, 3],
  [3, 5],
  [5, 3],
  [5, 5],
];

/** The marked fields: the thing on them and the trade of whoever stood there. */
const TRADES: readonly Rule[] = [
  trade(
    "Die Sammlerin stand auf einem Beerenkorb - und nur sie.",
    "berries",
    "gatherer",
  ),
  trade(
    "Der Werkzeugmacher stand auf einer Steinaxt - und nur er.",
    "stoneAxe",
    "toolmaker",
  ),
  trade(
    "Der Wolfsbändiger stand bei einem Wolf - und nur er.",
    "wolf",
    "wolfTamer",
  ),
];

/** The case. */
export const THE_NIGHT_FIRE: Level = {
  id: "the-night-fire",
  name: "Am nächtlichen Lagerfeuer",
  series: { book: "timeTravel", number: 54 },
  story:
    "Das ist eine dieser Geschichten, die eines Tages jemand am Feuer erzählen wird. Hoffentlich spricht man unsere Namen richtig aus.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Westhütte",
      at: "in der Westhütte",
      ground: "floor",
      tint: "#e2cdee",
      label: { row: 2, col: 0 },
    },
    {
      key: "E",
      name: "Osthütte",
      at: "in der Osthütte",
      ground: "floor",
      tint: "#e2cdee",
      label: { row: 1, col: 4 },
    },
    {
      key: "F",
      name: "Feuer",
      at: "am Feuer",
      ground: "sand",
      tint: "#f3dc8e",
      label: { row: 5, col: 4 },
    },
    {
      key: "B",
      name: "Wald",
      at: "im Wald",
      ground: "grass",
      tint: "#b7cfd9",
      label: { row: 8, col: 4 },
    },
    {
      key: "D",
      name: "Vorratskammer",
      at: "in der Vorratskammer",
      ground: "floor",
      tint: "#d4b8e6",
      label: { row: 8, col: 2 },
    },
    {
      key: "G",
      name: "Große Hütte",
      at: "in der Großen Hütte",
      ground: "floor",
      tint: "#e2cdee",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "WWWBEEEEB",
    "WWBBEEEBB",
    "WWBBBBBBB",
    "BBBFFFBBB",
    "BBBFFFBBB",
    "BBBFFFBGG",
    "BBBBBBBGG",
    "BBBDBBBGG",
    "BBDDBBGGG",
  ],
  thingMap: [
    "bbk.wkbb.",
    "lk.s..l..",
    "k.s....t.",
    ".o..l.ts.",
    "o...f...s",
    "..s..w.kk",
    ".a...s.k.",
    "atak...bl",
    "sakkst.b.",
  ],
  things: {
    a: "stoneAxe",
    b: "bed",
    f: "campfire",
    k: "berries",
    l: "wolf",
    o: "boulder",
    s: "shrub",
    t: "tree",
    w: "bonePile",
  },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 7 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Arko",
      pronoun: "er",
      clue: {
        text: "Er war im selben Bereich wie Grol.",
        ...about(["G"], (c) => {
          const grol = c.cellOf("G");
          return grol !== undefined && c.areaOf(grol) === c.areaOf(c.cell);
        }),
      },
      colour: "#b91c1c",
      face: "\u{1F9D1}\u{1F3FE}",
    },
    {
      id: "B",
      name: "Braka",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke des Feuers.",
        ...own((c) =>
          FIRE_CORNERS.some(([r, k]) => c.cell.row === r && c.cell.col === k),
        ),
      },
      colour: "#15803d",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "C",
      name: "Clago",
      pronoun: "er",
      clue: { text: "Er war neben einem Felsen.", ...beside("boulder") },
      colour: "#0e7490",
      face: "\u{1F468}\u{1F3FE}",
    },
    {
      id: "D",
      name: "Dagu",
      pronoun: "sie",
      clue: {
        text: "Sie war in keiner Hütte.",
        ...not(inArea("W", "E", "G")),
      },
      colour: "#6366f1",
      face: "\u{1F475}\u{1F3FD}",
    },
    {
      id: "E",
      name: "Eknu",
      pronoun: "er",
      traits: ["toolmaker"],
      clue: { text: "Der Werkzeugmacher.", ...own(() => true) },
      colour: "#a16207",
      face: "\u{1F468}\u{1F3FD}\u{200D}\u{1F9B1}",
    },
    {
      id: "F",
      name: "Fiwi",
      pronoun: "sie",
      traits: ["gatherer"],
      clue: { text: "Die Sammlerin. Sie war allein.", ...alone() },
      colour: "#be185d",
      face: "\u{1F467}\u{1F3FD}",
    },
    {
      id: "G",
      name: "Grol",
      pronoun: "er",
      traits: ["wolfTamer"],
      clue: { text: "Der Wolfsbändiger.", ...own(() => true) },
      colour: "#57534e",
      face: "\u{1F9D4}\u{1F3FE}",
    },
    {
      id: "H",
      name: "Haku",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Bett.",
        ...all(
          on("bed"),
          counting((c) => onlyOneOn(c, "bed")),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F474}\u{1F3FE}",
    },
    {
      id: "V",
      name: "Varka",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}\u{1F3FE}",
    },
  ],
  rules: TRADES,
  hints: [
    {
      text: "Grol steht als Wolfsbändiger bei einem Wolf, und Arko ist im selben Bereich. In der Westhütte (R2 C1) stünde Arko in C1 oder C2 - dann bliebe für Clago (C1-C3, neben einem Felsen) und Eknu (Steinaxt, C1-C3) nur C3. In der Osthütte (R2 C7) hat Arko kein Feld: Beerenkorb und Bett sind vergeben, R2 ist Grols Zeile. Am Feuer (R4 C5) müssten Braka in R6 C4 und Arko in R5 C6 stehen - dann hat Clago keine Zeile mehr. Grol steht in R8 C9.",
      place: { G: { row: 7, col: 8 } },
    },
    {
      text: "Arko ist in der Großen Hütte: Beerenkörbe sind der Sammlerin vorbehalten, Betten Haku, C9 und R8 sind Grols. Es bleibt R9 C7. Eknu steht auf einer Steinaxt - R8 und R9 sind besetzt, also R7 C2.",
      place: { A: { row: 8, col: 6 }, E: { row: 6, col: 1 } },
    },
    {
      text: "Haku ist allein auf einem Bett: R1 C2 ist Eknus Spalte, R1 C7 Arkos, R8 und R9 sind besetzt - also R1 C1 oder R1 C8. In R1 C1 bliebe Clago nur R4 C3, Braka R6 C4, und Fiwi hätte keinen freien Beerenkorb mehr. Haku liegt in R1 C8.",
      place: { H: { row: 0, col: 7 } },
    },
    {
      text: "Fiwi steht als Sammlerin auf einem Beerenkorb: R1 ist Hakus Zeile, C8 seine Spalte, R7 bis R9 sind besetzt - es bleibt R3 C1, allein in der Westhütte. Clago steht neben einem Felsen, nicht in C1 oder C2: R4 C3. Braka steht in einer Ecke des Feuers, nicht in R4: R6 C4.",
      place: {
        F: { row: 2, col: 0 },
        C: { row: 3, col: 2 },
        B: { row: 5, col: 3 },
      },
    },
    {
      text: "Frei sind nur noch R2 und R5, C5 und C6. Dagu ist in keiner Hütte, also nicht in R2; R5 C5 ist das Feuer - sie steht in R5 C6. Varka steht in R2 C5 in der Osthütte - allein mit Haku. Haku ist der Mörder!",
      place: { D: { row: 4, col: 5 }, V: { row: 1, col: 4 } },
    },
  ],
  solution: {
    A: { row: 8, col: 6 },
    B: { row: 5, col: 3 },
    C: { row: 3, col: 2 },
    D: { row: 4, col: 5 },
    E: { row: 6, col: 1 },
    F: { row: 2, col: 0 },
    G: { row: 7, col: 8 },
    H: { row: 0, col: 7 },
    V: { row: 1, col: 4 },
  },
};

/** A rule: somebody of this trade stood on a field with this thing, and nobody else did. */
function trade(text: string, thing: string, job: string): Rule {
  return {
    text,
    unary: (suspect, c) =>
      c.is(c.cell, thing) === (suspect.traits ?? []).includes(job),
  };
}

/** Whether exactly one person stood on a thing of this id. */
function onlyOneOn(c: Context, what: string): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, what);
    }).length === 1
  );
}
