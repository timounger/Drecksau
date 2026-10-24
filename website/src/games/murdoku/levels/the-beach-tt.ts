/**
 * Am Strand: the sea, a stone-age beach with a campfire and giant shells,
 * the jungle and two huts, and a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/50.png`, no solution
 * sheet - part of the solved grid is pencilled in on the photographed page,
 * and the solver proves the rest). The cards show no estates and no area has
 * a crown.
 * Vlyk is the victim; whoever was alone with him killed him.
 *
 * The marked fields - a berry basket for a gatherer, a wolf for a wolf
 * tamer, a fish for a fisher - can be stood on, and so can the bed. The
 * legend says there was one person of each role, so exactly one person stood
 * on the fields of each mark. The shells, the campfire, the palms and the
 * bushes cannot be stood on.
 */
import { about, all, beside, inArea, not, on, victim } from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The marked fields: one person each of these roles, on its fields. */
const ROLES: readonly string[] = ["berries", "wolf", "fishingSpot"];

/** How many people stand on a field of this thing. */
function standingOn(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  }).length;
}

/** The case. */
export const THE_BEACH_TT: Level = {
  id: "the-beach-tt",
  name: "Am Strand",
  series: { book: "timeTravel", number: 50 },
  story:
    "Riesenmuscheln! Großartig zum Dekorieren, zum Tauschen oder zum Zuschlagen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "M",
      name: "Meer",
      at: "im Meer",
      ground: "water",
      tint: "#cfcbe6",
      label: { row: 7, col: 0 },
    },
    {
      key: "P",
      name: "Strand",
      at: "am Strand",
      ground: "sand",
      tint: "#f3efd6",
      label: { row: 7, col: 2 },
    },
    {
      key: "S",
      name: "Dschungel",
      at: "im Dschungel",
      ground: "grass",
      tint: "#ddd2ea",
      label: { row: 6, col: 4 },
    },
    {
      key: "N",
      name: "Hütte Nord",
      at: "in der Hütte Nord",
      ground: "stone",
      tint: "#d4d0da",
      label: { row: 2, col: 7 },
      labelEnd: true,
    },
    {
      key: "Z",
      name: "Hütte Süd",
      at: "in der Hütte Süd",
      ground: "stone",
      tint: "#d4d0da",
      label: { row: 7, col: 5 },
    },
  ],
  areaMap: [
    "MMMPPSNN",
    "MPPPSSNN",
    "MPPPSSSN",
    "MMPPSSSS",
    "MMPSSSSS",
    "MPPSSSSS",
    "MPPPSSZZ",
    "MMPPPZZZ",
  ],
  thingMap: [
    "..f..kh.",
    "f.h.wu.w",
    ".wo.p...",
    ".f....p.",
    "....uk.u",
    "fh.p...k",
    "......dd",
    ".f.h..k.",
  ],
  things: {
    d: "bed",
    f: "fishingSpot",
    h: "shell",
    k: "berries",
    o: "campfire",
    p: "palm",
    u: "shrub",
    w: "wolf",
  },
  extraThings: {
    shell: { name: "Muschel", emoji: "\u{1F41A}", standable: false },
  },
  pieces: [{ at: { row: 6, col: 6 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Abak",
      pronoun: "er",
      clue: {
        text: "Er war allein mit Fyko. Er war neben einem Baum.",
        ...all(
          beside("tree"),
          about(["F"], (c) => {
            const fyko = c.cellOf("F");
            return fyko !== undefined && c.areaOf(fyko) === c.areaOf(c.cell);
          }),
          {
            global: true,
            check: (c) => c.peopleIn(c.areaOf(c.cell) ?? "").length === 2,
          },
        ),
      },
      colour: "#57534e",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Brana",
      pronoun: "sie",
      clue: { text: "Sie war neben dem Lagerfeuer.", ...beside("campfire") },
      colour: "#be185d",
      face: "\u{1F475}",
    },
    {
      id: "C",
      name: "Ceryo",
      pronoun: "er",
      clue: {
        text: "Der Wolfszähmer: Er stand auf einem Feld mit einem Wolf.",
        ...on("wolf"),
      },
      colour: "#64748b",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "D",
      name: "Dor",
      pronoun: "er",
      clue: {
        text: "Der Fischer: Er stand auf einem Feld mit einem Fisch.",
        ...on("fishingSpot"),
      },
      colour: "#1d4ed8",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "E",
      name: "Elkya",
      pronoun: "sie",
      clue: { text: "Sie war in einer Hütte.", ...inArea("N", "Z") },
      colour: "#a16207",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Fyko",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Baum. Er war nicht neben einem Strauch.",
        ...all(beside("tree"), not(beside("shrub"))),
      },
      colour: "#15803d",
      face: "\u{1F466}",
    },
    {
      id: "G",
      name: "Gwik",
      pronoun: "er",
      clue: { text: "Er war am Strand.", ...inArea("P") },
      colour: "#ca8a04",
      face: "\u{1F468}",
    },
    {
      id: "V",
      name: "Vlyk",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#9f1239",
      face: "\u{1F468}‍\u{1F9B0}",
    },
  ],
  rules: [
    {
      text: "Es gab genau einen Sammler, einen Wolfszähmer und einen Fischer: Auf den Beerenkorb-Feldern, den Wolfsfeldern und den Fischfeldern stand jeweils genau eine Person.",
      // Search only: no role may be taken twice.
      prune: (c) => ROLES.every((what) => standingOn(c, what) <= 1),
      check: (c) => ROLES.every((what) => standingOn(c, what) === 1),
    },
  ],
  hints: [
    {
      text: "Abak und Fyko sind allein in einem Bereich, beide neben einem Baum - also im Dschungel. Ceryo, der Wolfszähmer, kann darum nicht auf dem Wolf in R2C5 stehen. Brana steht neben dem Lagerfeuer, aber nicht auf dem Wolf in R3C2 (es gibt nur einen Wolfszähmer): R3C4 oder R4C3. Fyko bleibt neben einem Baum und ohne Strauch nur R3C7 oder R4C6. Brana und Fyko teilen sich also Zeile 3 und 4, und Ceryo steht in R2C8.",
      place: { C: { row: 1, col: 7 } },
    },
    {
      text: "Es gab genau einen Sammler. Die Beerenkörbe im Dschungel liegen nicht neben einem Baum, dort stehen aber nur Abak und Fyko; R6C8 ist Ceryos Spalte. Der Sammler steht also auf R8C7 in der Hütte Süd. Elkya ist in einer Hütte: Die Hütte Nord sperrt Ceryo, in der Hütte Süd liegen alle übrigen Felder in Zeile 8, Spalte 7 oder Ceryos Spalte. Elkya ist selbst die Sammlerin in R8C7.",
      place: { E: { row: 7, col: 6 } },
    },
    {
      text: "R3C7 ist Elkyas Spalte, also steht Fyko in R4C6 und Brana in R3C4. Abak steht im Dschungel neben einem Baum: R5C4 ist Branas Spalte, R5C7 Elkyas - er steht in R6C5.",
      place: {
        F: { row: 3, col: 5 },
        B: { row: 2, col: 3 },
        A: { row: 5, col: 4 },
      },
    },
    {
      text: "Frei sind noch Zeile 1, 5 und 7 und Spalte 1 bis 3. Dor ist der Fischer, und dort hat nur R1C3 einen Fisch. Gwik ist am Strand: Es bleibt R7C2.",
      place: { D: { row: 0, col: 2 }, G: { row: 6, col: 1 } },
    },
    {
      text: "Vlyk steht auf dem letzten Feld, R5C1 im Meer - allein mit Dor. Dor ist der Mörder!",
      place: { V: { row: 4, col: 0 } },
    },
  ],
  solution: {
    A: { row: 5, col: 4 },
    B: { row: 2, col: 3 },
    C: { row: 1, col: 7 },
    D: { row: 0, col: 2 },
    E: { row: 7, col: 6 },
    F: { row: 3, col: 5 },
    G: { row: 6, col: 1 },
    V: { row: 4, col: 0 },
  },
};
