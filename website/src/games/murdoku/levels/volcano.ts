/**
 * Vulkan!: a volcano with its lava, the jungle, a hut, the beach and the
 * sea, and a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/53.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution). The
 * cards show no estates and no area has a crown.
 * Vella is the victim; whoever was alone with her killed her.
 *
 * The map is nine by nine; the volcano's slopes leave two fields missing at
 * each top corner of the first row and one at each end of the second. The
 * marked fields - a berry basket for a gatherer, an axe for a toolmaker, a
 * fish for a fisher - can be stood on, and so can the bed. The legend says
 * there was one person of each role, so exactly one person stood on the
 * fields of each mark; having a task means standing on one of them. The
 * lava, rocks, palms and bushes cannot be stood on.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  own,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The marked fields: one person each of these roles, on its fields. */
const ROLES: readonly string[] = ["berries", "stoneAxe", "fishingSpot"];

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

/** Whether somebody else on a berry field stands in one's own area. */
function withTheGatherer(c: Context): boolean {
  const here = c.areaOf(c.cell);
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      there !== undefined &&
      c.areaOf(there) === here &&
      c.is(there, "berries")
    );
  });
}

/** The case. */
export const VOLCANO: Level = {
  id: "volcano",
  name: "Vulkan!",
  series: { book: "timeTravel", number: 53 },
  story: "Ich glaube, das Opfer ist nicht mehr aktiv.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "V",
      name: "Vulkan",
      at: "im Vulkan",
      ground: "stone",
      tint: "#c9c9d6",
      label: { row: 5, col: 3 },
    },
    {
      key: "S",
      name: "Dschungel",
      at: "im Dschungel",
      ground: "grass",
      tint: "#a9d9a9",
      label: { row: 5, col: 0 },
    },
    {
      key: "H",
      name: "Hütte",
      at: "in der Hütte",
      ground: "stone",
      tint: "#ddd2d2",
      label: { row: 6, col: 0 },
    },
    {
      key: "P",
      name: "Strand",
      at: "am Strand",
      ground: "sand",
      tint: "#f1efd8",
      label: { row: 8, col: 0 },
    },
    {
      key: "M",
      name: "Meer",
      at: "im Meer",
      ground: "water",
      tint: "#b9dcf0",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "..VVVVV..",
    ".VVVVVVV.",
    "SVVVVVVVV",
    "SSVVVVVVV",
    "SSVVVVVVV",
    "SSSVVVVVV",
    "HHSSVVVVM",
    "PPPPPMMMM",
    "PPPPPPMMM",
  ],
  thingMap: [
    "..a......",
    ".a.lll.r.",
    "kralll...",
    "uk.llr.r.",
    "..r.lll..",
    "..p...l..",
    "dd..r.llf",
    "..a......",
    ".apu.ff..",
  ],
  things: {
    a: "stoneAxe",
    d: "bed",
    f: "fishingSpot",
    k: "berries",
    l: "lava",
    p: "palm",
    r: "boulder",
    u: "shrub",
  },
  pieces: [{ at: { row: 6, col: 0 }, rows: 1, cols: 2 }],
  // The lava, drawn as one glowing field per flow.
  shapes: [
    [
      { row: 1, col: 3 },
      { row: 1, col: 4 },
      { row: 1, col: 5 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 4, col: 4 },
      { row: 4, col: 5 },
      { row: 4, col: 6 },
      { row: 5, col: 6 },
      { row: 6, col: 6 },
      { row: 6, col: 7 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Akmok",
      pronoun: "er",
      clue: {
        text: "Er war nördlich von Cama.",
        ...about(["C"], (c) => {
          const cama = c.cellOf("C");
          return cama !== undefined && c.cell.row < cama.row;
        }),
      },
      colour: "#64748b",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Baka",
      pronoun: "sie",
      clue: {
        text: "Sie war mit dem Sammler zusammen.",
        ...counting(withTheGatherer),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Cama",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Felsen. Sie war nicht neben der Lava.",
        ...all(beside("boulder"), not(beside("lava"))),
      },
      colour: "#ca8a04",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "D",
      name: "Durok",
      pronoun: "er",
      clue: {
        text: "Er war im Vulkan, neben der Lava.",
        ...all(inArea("V"), beside("lava")),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Emek",
      pronoun: "sie",
      clue: {
        text: "Sie hatte eine Aufgabe. Sie war nicht am Strand.",
        ...all(own(hasTask), not(inArea("P"))),
      },
      colour: "#a16207",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Faya",
      pronoun: "sie",
      clue: { text: "Sie war in der untersten Zeile.", ...row(9) },
      colour: "#be185d",
      face: "\u{1F467}",
    },
    {
      id: "G",
      name: "Gweka",
      pronoun: "sie",
      clue: {
        text: "Die Fischerin: Sie stand auf einem Feld mit einem Fisch.",
        ...on("fishingSpot"),
      },
      colour: "#1d4ed8",
      face: "\u{1F475}",
    },
    {
      id: "H",
      name: "Heda",
      pronoun: "sie",
      clue: {
        text: "Sie hatte eine Aufgabe. Sie war genau eine Zeile nördlich von Baka.",
        ...all(
          own(hasTask),
          about(["B"], (c) => c.cellOf("B")?.row === c.cell.row + 1),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "V",
      name: "Vella",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B3}",
    },
  ],
  rules: [
    {
      text: "Es gab genau einen Sammler, einen Werkzeugmacher und eine Fischerin: Auf den Beerenkorb-Feldern, den Axtfeldern und den Fischfeldern stand jeweils genau eine Person.",
      // Search only: no role may be taken twice.
      prune: (c) => ROLES.every((what) => standingOn(c, what) <= 1),
      check: (c) => ROLES.every((what) => standingOn(c, what) === 1),
    },
  ],
  hints: [
    {
      text: "Gweka ist die Fischerin. Emek und Heda haben auch eine Aufgabe - sie sind der Sammler und der Werkzeugmacher, denn jede Rolle gab es nur einmal. Alle anderen stehen auf keinem markierten Feld.",
    },
    {
      text: "Baka ist beim Sammler, und beide Beerenkörbe liegen im Dschungel: Baka steht dort auf einem unmarkierten Feld, in Zeile 5 bis 7. Heda ist eine Zeile nördlich von ihr, in Zeile 4 bis 6 - dort gibt es keine Axt, also ist Heda die Sammlerin. In R3C1 müsste Baka in Zeile 4 stehen, wo nur ein Strauch ist. Heda steht in R4C2, Baka in R5C1.",
      place: { H: { row: 3, col: 1 }, B: { row: 4, col: 0 } },
    },
    {
      text: "Cama steht neben einem Felsen, nicht neben der Lava und nicht auf der Axt in R2C2: R3C8 oder R4C9 - R4C9 ist Hedas Zeile, also R3C8. Emek ist die Werkzeugmacherin und nicht am Strand: R2C2 ist Hedas Spalte, R3C3 Camas Zeile - sie steht in R1C3.",
      place: { C: { row: 2, col: 7 }, E: { row: 0, col: 2 } },
    },
    {
      text: "Akmok ist nördlich von Cama, also in Zeile 2: R2C2 ist eine Axt, R2C3 Emeks Spalte, R2C8 ein Felsen - er steht in R2C7. Gweka steht auf einem Fisch: R9C7 ist Akmoks Spalte, und Zeile 9 gehört Faya - Gweka steht in R7C9.",
      place: { A: { row: 1, col: 6 }, G: { row: 6, col: 8 } },
    },
    {
      text: "Faya bleibt in Zeile 9 nur R9C5. Durok steht im Vulkan neben der Lava: R6C5 ist Fayas Spalte, R7C6 Gwekas Zeile - er steht in R6C6.",
      place: { F: { row: 8, col: 4 }, D: { row: 5, col: 5 } },
    },
    {
      text: "Vella steht auf dem letzten Feld, R8C4 am Strand - allein mit Faya. Faya ist die Mörderin!",
      place: { V: { row: 7, col: 3 } },
    },
  ],
  solution: {
    A: { row: 1, col: 6 },
    B: { row: 4, col: 0 },
    C: { row: 2, col: 7 },
    D: { row: 5, col: 5 },
    E: { row: 0, col: 2 },
    F: { row: 8, col: 4 },
    G: { row: 6, col: 8 },
    H: { row: 3, col: 1 },
    V: { row: 7, col: 3 },
  },
};
