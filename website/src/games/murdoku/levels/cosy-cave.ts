/**
 * Die Kuschelhöhle: a cave with a taming room, a bedroom and a carving room,
 * the forest in front of it with a sabre-tooth tiger, and a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/48.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution). The
 * cards show no estates and no area has a crown.
 * Varn is the victim; whoever was alone with him killed him.
 *
 * The marked fields - a berry basket for a gatherer, an axe for a
 * toolmaker, a wolf for a wolf tamer - can be stood on, and so can the beds.
 * The legend says there was one person of each role, so exactly one person
 * stood on the fields of each mark. Rocks, bushes and the tiger cannot be
 * stood on. South of the tiger means in a lower
 * row.
 */
import { alone, inArea, not, on, own, victim } from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The tiger's row, counted from nought. */
const TIGER_ROW = 3;

/** The marked fields: one person each of these roles, on its fields. */
const ROLES: readonly string[] = ["berries", "stoneAxe", "wolf"];

/** How many people stand on a field of this thing. */
function standingOn(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  }).length;
}

/** The case. */
export const COSY_CAVE: Level = {
  id: "cosy-cave",
  name: "Die Kuschelhöhle",
  series: { book: "timeTravel", number: 48 },
  story:
    "Säbelzahntiger haben keinen Zutritt. Viel Glück beim Versuch, das dem Tiger zu sagen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "M",
      name: "Zähmraum",
      at: "im Zähmraum",
      ground: "stone",
      tint: "#ddd3dd",
      label: { row: 1, col: 0 },
    },
    {
      key: "R",
      name: "Schlafraum",
      at: "im Schlafraum",
      ground: "stone",
      tint: "#d9cdd9",
      label: { row: 1, col: 4 },
    },
    {
      key: "T",
      name: "Schnitzraum",
      at: "im Schnitzraum",
      ground: "stone",
      tint: "#e3d9d9",
      label: { row: 3, col: 1 },
    },
    {
      key: "W",
      name: "Wald",
      at: "im Wald",
      ground: "grass",
      tint: "#d4ead2",
      label: { row: 5, col: 3 },
    },
  ],
  areaMap: ["MMMRRR", "MMMWRR", "TTTWWR", "TTTWWW", "TTWWWW", "TWWWWW"],
  thingMap: ["k..dd.", "ddw..d", ".a...d", "arku.x", "ra.t..", "a.u.u."],
  things: {
    a: "stoneAxe",
    d: "bed",
    k: "berries",
    r: "boulder",
    u: "shrub",
    t: "tree",
    w: "wolf",
    x: "sabreTooth",
  },
  pieces: [
    { at: { row: 0, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 5 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Arka",
      pronoun: "sie",
      clue: {
        text: "Die Wolfszähmerin: Sie stand auf dem Feld mit dem Wolf.",
        ...on("wolf"),
      },
      colour: "#57534e",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Baruk",
      pronoun: "er",
      clue: { text: "Er war allein.", ...alone() },
      colour: "#a16207",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Claku",
      pronoun: "er",
      clue: { text: "Er war nicht im Wald.", ...not(inArea("W")) },
      colour: "#0e7490",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "D",
      name: "Dodo",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Bett.", ...on("bed") },
      colour: "#7c3aed",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Esha",
      pronoun: "sie",
      clue: {
        text: "Sie war südlich des Säbelzahntigers.",
        ...own((c) => c.cell.row > TIGER_ROW),
      },
      colour: "#15803d",
      face: "\u{1F467}",
    },
    {
      id: "V",
      name: "Varn",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#9f1239",
      face: "\u{1F468}‍\u{1F9B1}",
    },
  ],
  rules: [
    {
      text: "Es gab genau einen Sammler, einen Werkzeugmacher und eine Wolfszähmerin: Auf den Beerenkorb-Feldern, den Axt-Feldern und dem Wolfsfeld stand jeweils genau eine Person.",
      // Search only: no role may be taken twice.
      prune: (c) => ROLES.every((what) => standingOn(c, what) <= 1),
      check: (c) => ROLES.every((what) => standingOn(c, what) === 1),
    },
  ],
  hints: [
    {
      text: "Arka ist die Wolfszähmerin und steht auf dem einzigen Wolfsfeld, R2C3.",
      place: { A: { row: 1, col: 2 } },
    },
    {
      text: "Es gab genau einen Sammler. Der Beerenkorb in R4C3 liegt in Arkas Spalte, also steht jemand auf R1C1. Dodo liegt auf einem Bett: R1C4 und R1C5 liegen in Zeile 1, R2C1, R2C2 und R2C6 in Arkas Zeile - sie liegt in R3C6.",
      place: { D: { row: 2, col: 5 } },
    },
    {
      text: "Es gab genau einen Werkzeugmacher. R3C2 ist Dodos Zeile, R4C1 und R6C1 liegen in der Spalte von R1C1 - jemand steht auf der Axt in R5C2. Frei bleiben Zeile 4 und 6 und Spalte 4 und 5: R4C5 und R6C4, beide im Wald.",
    },
    {
      text: "Baruk war allein - im Wald wäre er zu zweit, auf R1C1 bei Arka. Er steht in R5C2. Claku war nicht im Wald, also steht er auf R1C1.",
      place: { B: { row: 4, col: 1 }, C: { row: 0, col: 0 } },
    },
    {
      text: "Esha ist südlich des Säbelzahntigers: R6C4. Varn steht in R4C5 im Wald - allein mit Esha. Esha ist der Mörder!",
      place: { E: { row: 5, col: 3 }, V: { row: 3, col: 4 } },
    },
  ],
  solution: {
    A: { row: 1, col: 2 },
    B: { row: 4, col: 1 },
    C: { row: 0, col: 0 },
    D: { row: 2, col: 5 },
    E: { row: 5, col: 3 },
    V: { row: 3, col: 4 },
  },
};
