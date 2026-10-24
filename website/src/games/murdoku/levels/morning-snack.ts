/**
 * Der Morgenimbiss: a stone-age hut, a pond and a field with berry baskets,
 * and a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/47.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution). The
 * cards show no estates and no area has a crown.
 * Vazyk is the victim; whoever was alone with her killed her.
 *
 * The marked fields with a berry basket are where a gatherer stands, the
 * marked field with a fish is where a fisher stands; both can be stood on,
 * and so can the bed. The legend says there was one gatherer and one
 * fisher, so exactly one person stood on the fields of each mark. The
 * bushes cannot be stood on.
 */
import { beside, not, on, victim } from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The marked fields: one person each of these roles, on its fields. */
const ROLES: readonly string[] = ["berries", "fishingSpot"];

/** How many people stand on a field of this thing. */
function standingOn(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  }).length;
}

/** The case. */
export const MORNING_SNACK: Level = {
  id: "morning-snack",
  name: "Der Morgenimbiss",
  series: { book: "timeTravel", number: 47 },
  story: "Jemand wollte die Beeren und den Fisch auf keinen Fall teilen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "H",
      name: "Hütte",
      at: "in der Hütte",
      ground: "stone",
      tint: "#ddd6d2",
      label: { row: 1, col: 2 },
    },
    {
      key: "T",
      name: "Teich",
      at: "am Teich",
      ground: "water",
      tint: "#cfe6f2",
      label: { row: 4, col: 0 },
    },
    {
      key: "F",
      name: "Feld",
      at: "auf dem Feld",
      ground: "grass",
      tint: "#bfe0c4",
      label: { row: 4, col: 3 },
    },
  ],
  areaMap: ["FHHHH", "FFHHF", "FFFFF", "TTFFF", "TTFFF"],
  thingMap: ["..dd.", "uk...", "..k.u", ".zu.k", "....u"],
  things: { d: "bed", k: "berries", u: "shrub", z: "fishingSpot" },
  pieces: [{ at: { row: 0, col: 2 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Aduk",
      pronoun: "er",
      clue: {
        text: "Der Fischer: Er stand auf dem Feld mit dem Fisch.",
        ...on("fishingSpot"),
      },
      colour: "#57534e",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Balo",
      pronoun: "er",
      clue: {
        text: "Der Sammler: Er stand auf einem Feld mit einem Beerenkorb.",
        ...on("berries"),
      },
      colour: "#15803d",
      face: "\u{1F474}",
    },
    {
      id: "C",
      name: "Celya",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einem Strauch.",
        ...not(beside("shrub")),
      },
      colour: "#b91c1c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Druka",
      pronoun: "sie",
      clue: { text: "Sie war im Bett.", ...on("bed") },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "V",
      name: "Vazyk",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#ca8a04",
      face: "\u{1F471}‍♀️",
    },
  ],
  rules: [
    {
      text: "Es gab genau einen Sammler und einen Fischer: Auf den Beerenkorb-Feldern und dem Fischfeld stand jeweils genau eine Person.",
      // Search only: no role may be taken twice.
      prune: (c) => ROLES.every((what) => standingOn(c, what) <= 1),
      check: (c) => ROLES.every((what) => standingOn(c, what) === 1),
    },
  ],
  hints: [
    {
      text: "Aduk ist der Fischer - es gibt nur ein Feld mit Fisch: Er steht in R4C2.",
      place: { A: { row: 3, col: 1 } },
    },
    {
      text: "Balo steht auf einem Beerenkorb: R2C2 ist Aduks Spalte, R4C5 Aduks Zeile - er steht in R3C3.",
      place: { B: { row: 2, col: 2 } },
    },
    {
      text: "Druka ist im Bett: R1C3 ist Balos Spalte, also R1C4.",
      place: { D: { row: 0, col: 3 } },
    },
    {
      text: "Frei sind noch Zeile 2 und 5 und Spalte 1 und 5. R2C1 und R5C5 sind Sträucher, R2C5 liegt neben dem Strauch in R3C5 - Celya steht in R5C1 am Teich.",
      place: { C: { row: 4, col: 0 } },
    },
    {
      text: "Vazyk steht auf dem letzten Feld, R2C5 auf dem Feld - allein mit Balo. Balo ist der Mörder!",
      place: { V: { row: 1, col: 4 } },
    },
  ],
  solution: {
    A: { row: 3, col: 1 },
    B: { row: 2, col: 2 },
    C: { row: 4, col: 0 },
    D: { row: 0, col: 3 },
    V: { row: 1, col: 4 },
  },
};
