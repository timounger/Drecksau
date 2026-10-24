/**
 * Der Mammutsee: the plains with a mammoth, a lake, two huts and the camp,
 * and a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/52.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution). The
 * cards show no estates and no area has a crown.
 * Vlak is the victim; whoever was alone with him killed him.
 *
 * The marked fields - a fish for a fisher, an axe for a toolmaker, a berry
 * basket for a gatherer - can be stood on, and so can the beds. The legend
 * says there was one person of each role, so exactly one person stood on
 * the fields of each mark; having a task means standing on one of them. The
 * mammoth fills four fields; it, the bushes and the campfire cannot be stood
 * on.
 */
import {
  about,
  all,
  beside,
  column,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The marked fields: one person each of these roles, on its fields. */
const ROLES: readonly string[] = ["fishingSpot", "stoneAxe", "berries"];

/** How many people stand on a field of this thing. */
function standingOn(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  }).length;
}

/** Whether one stands on a marked field - has a task. */
function hasTask(c: Context): boolean {
  return ROLES.some((what) => c.is(c.cell, what));
}

/** Whether one stands in a lower row than somebody. */
function southOf(id: string): (c: Context) => boolean {
  return (c) => {
    const other = c.cellOf(id);
    return other !== undefined && c.cell.row > other.row;
  };
}

/** The case. */
export const MAMMOTH_LAKE: Level = {
  id: "mammoth-lake",
  name: "Der Mammutsee",
  series: { book: "timeTravel", number: 52 },
  story:
    "Die Tatwaffe im See zu verstecken ist leicht, wenn es sich um einen Stein handelt.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "L",
      name: "Ebene",
      at: "auf der Ebene",
      ground: "grass",
      tint: "#c7dcc0",
      label: { row: 4, col: 0 },
    },
    {
      key: "N",
      name: "Hütte Nord",
      at: "in der Hütte Nord",
      ground: "stone",
      tint: "#e2d6d6",
      label: { row: 1, col: 7 },
      labelEnd: true,
    },
    {
      key: "W",
      name: "See",
      at: "im See",
      ground: "water",
      tint: "#b9dcf0",
      label: { row: 5, col: 3 },
    },
    {
      key: "S",
      name: "Hütte Süd",
      at: "in der Hütte Süd",
      ground: "stone",
      tint: "#e2d6d6",
      label: { row: 7, col: 1 },
    },
    {
      key: "C",
      name: "Lager",
      at: "im Lager",
      ground: "grass",
      tint: "#c7dcc0",
      label: { row: 7, col: 6 },
    },
  ],
  areaMap: [
    "LLLLLLNN",
    "LLLLLLNN",
    "LLLLLLLN",
    "LLLWWWLL",
    "LLWWWWCC",
    "SSSWWCCC",
    "SSSCCCCC",
    "SSSCCCCC",
  ],
  thingMap: [
    "....u.dd",
    "kmm...a.",
    "umm....a",
    ".....f.u",
    "u..f..fk",
    ".....fu.",
    "a.k.fok.",
    "dd...a..",
  ],
  things: {
    a: "stoneAxe",
    d: "bed",
    f: "fishingSpot",
    k: "berries",
    m: "mammoth",
    o: "campfire",
    u: "shrub",
  },
  pieces: [
    { at: { row: 0, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 1 }, rows: 2, cols: 2 },
    { at: { row: 7, col: 0 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Ayko",
      pronoun: "sie",
      clue: {
        text: "Sie war neben dem Lagerfeuer. Sie war südlich von Elbu.",
        ...all(beside("campfire"), about(["E"], southOf("E"))),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Boku",
      pronoun: "er",
      clue: {
        text: "Er hatte eine Aufgabe: Er stand auf einem markierten Feld.",
        ...own(hasTask),
      },
      colour: "#1d4ed8",
      face: "\u{1F9D1}",
    },
    {
      id: "C",
      name: "Cag",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Bett.",
        ...all(
          on("bed"),
          counting((c) => standingOn(c, "bed") === 1),
        ),
      },
      colour: "#64748b",
      face: "\u{1F474}",
    },
    {
      id: "D",
      name: "Doka",
      pronoun: "sie",
      clue: { text: "Sie war in der Hütte Nord.", ...inArea("N") },
      colour: "#a16207",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Elbu",
      pronoun: "sie",
      clue: {
        text: "Sie hatte eine Aufgabe. Sie war südlich von Boku.",
        ...all(own(hasTask), about(["B"], southOf("B"))),
      },
      colour: "#15803d",
      face: "\u{1F467}",
    },
    {
      id: "F",
      name: "Freza",
      pronoun: "sie",
      clue: { text: "Sie war neben dem Mammut.", ...beside("mammoth") },
      colour: "#ca8a04",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Garok",
      pronoun: "er",
      clue: { text: "Er war in der ersten Spalte.", ...column(1) },
      colour: "#57534e",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Vlak",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
  ],
  rules: [
    {
      text: "Es gab genau einen Fischer, einen Werkzeugmacher und einen Sammler: Auf den Fischfeldern, den Axtfeldern und den Beerenkorb-Feldern stand jeweils genau eine Person.",
      // Search only: no role may be taken twice.
      prune: (c) => ROLES.every((what) => standingOn(c, what) <= 1),
      check: (c) => ROLES.every((what) => standingOn(c, what) === 1),
    },
  ],
  hints: [
    {
      text: "Ayko steht neben dem Lagerfeuer, und alle Felder dort sind markiert. Boku und Elbu haben ebenfalls eine Aufgabe. Jede der drei Rollen hatte genau eine Person - Ayko, Boku und Elbu teilen sie sich, alle anderen stehen auf keinem markierten Feld.",
    },
    {
      text: "Doka ist in der Hütte Nord. Auf einem Bett liegt nur Cag, und R2C7 und R3C8 sind Äxte - Doka steht in R2C8.",
      place: { D: { row: 1, col: 7 } },
    },
    {
      text: "Der Sammler: R2C1 ist Dokas Zeile, R5C8 ihre Spalte - er steht in Zeile 7. Der Werkzeugmacher: R2C7 und R3C8 sind gesperrt, R7C1 liegt in der Zeile des Sammlers - er steht in R8C6. Ayko ist südlich von Elbu und Elbu südlich von Boku: Ayko steht ganz unten, sie ist die Werkzeugmacherin in R8C6. Elbu ist die Sammlerin in Zeile 7, Boku der Fischer.",
      place: { A: { row: 7, col: 5 } },
    },
    {
      text: "Cag liegt allein auf einem Bett: R8C1 und R8C2 sind Aykos Zeile, R1C8 Dokas Spalte - er liegt in R1C7. Boku steht auf einem Fisch oberhalb von Zeile 7: R4C6 und R6C6 sind Aykos Spalte, R5C7 Cags - er steht in R5C4. Elbu bleibt der Beerenkorb in R7C3.",
      place: {
        C: { row: 0, col: 6 },
        B: { row: 4, col: 3 },
        E: { row: 6, col: 2 },
      },
    },
    {
      text: "Frei sind Zeile 3, 4 und 6 und Spalte 1, 2 und 5. Freza steht neben dem Mammut - das geht nur in R4C2. Garok ist in Spalte 1: R6C1.",
      place: { F: { row: 3, col: 1 }, G: { row: 5, col: 0 } },
    },
    {
      text: "Vlak steht auf dem letzten Feld, R3C5 auf der Ebene - allein mit Freza. Freza ist die Mörderin!",
      place: { V: { row: 2, col: 4 } },
    },
  ],
  solution: {
    A: { row: 7, col: 5 },
    B: { row: 4, col: 3 },
    C: { row: 0, col: 6 },
    D: { row: 1, col: 7 },
    E: { row: 6, col: 2 },
    F: { row: 3, col: 1 },
    G: { row: 5, col: 0 },
    V: { row: 2, col: 4 },
  },
};
