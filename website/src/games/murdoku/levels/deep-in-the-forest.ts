/**
 * Tief im Wald: the northern and the southern forest, a cave, a meadow and a
 * ritual site, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/60.png`, no solution
 * sheet - the solved grid is pencilled in on the photographed page, the
 * culprit left blank, and the solver proves it is the only solution).
 * Vlaka is the victim; whoever was alone with her killed her.
 *
 * The cards show no estates and the map no crowns. Instead two kinds of
 * fields are framed and marked: a basket of berries (the gatherer) and a
 * spear (the hunter). Each trade was held by exactly one person, who stood on
 * a field of it; nobody else stood on a marked field ({@link TRADES}). Who
 * held which trade, the case does not say. The bed and the marked fields can
 * be stood on; trees, bushes, boulders, boars and the fires cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  column,
  counting,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The marked fields, one per trade. */
const TRADES: readonly string[] = ["berries", "spear"];

/** The case. */
export const DEEP_IN_THE_FOREST: Level = {
  id: "deep-in-the-forest",
  name: "Tief im Wald",
  series: { book: "timeTravel", number: 60 },
  story:
    "Eine goldene Regel: Wer einen Ritualplatz besucht, sollte vorher wissen, welche Riten dort gepflegt werden.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "N",
      name: "Nordwald",
      at: "im Nordwald",
      ground: "grass",
      tint: "#8fb9b4",
      label: { row: 2, col: 1 },
    },
    {
      key: "C",
      name: "Höhle",
      at: "in der Höhle",
      ground: "stone",
      tint: "#c3bde8",
      label: { row: 3, col: 7 },
    },
    {
      key: "R",
      name: "Ritualplatz",
      at: "auf dem Ritualplatz",
      ground: "stone",
      tint: "#a9d2e6",
      label: { row: 5, col: 3 },
    },
    {
      key: "S",
      name: "Südwald",
      at: "im Südwald",
      ground: "grass",
      tint: "#b4dcd8",
      label: { row: 8, col: 3 },
    },
    {
      key: "P",
      name: "Wiese",
      at: "auf der Wiese",
      ground: "grass",
      tint: "#d4f0ec",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "NNNNNCCCC",
    "NNNNCCCCC",
    "NNNNRRCCC",
    "NNRRRRCCC",
    "NRRRRRCPP",
    "SRRRRSSPP",
    "SSRRSSSPP",
    "SSSSSSPPP",
    "SSSSSSPPP",
  ],
  thingMap: [
    ".s.s.....",
    "ttrt...f.",
    ".u.r...bb",
    "..oou....",
    "to.....r.",
    ".of.osr.k",
    "t..o.t.kr",
    "s.ut.r..u",
    ".tt..t.k.",
  ],
  things: {
    b: "bed",
    f: "campfire",
    k: "berries",
    o: "boulder",
    r: "shrub",
    s: "spear",
    t: "tree",
    u: "boar",
  },
  pieces: [{ at: { row: 2, col: 7 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Atok",
      pronoun: "er",
      clue: { text: "Er war in der fünften Spalte.", ...column(5) },
      colour: "#b91c1c",
      face: "\u{1F468}\u{1F3FE}\u{200D}\u{1F9B3}",
    },
    {
      id: "B",
      name: "Brol",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Wildschwein. Er war nördlich von Enga.",
        ...all(
          beside("boar"),
          about(["E"], (c) => {
            const enga = c.cellOf("E");
            return enga !== undefined && c.cell.row < enga.row;
          }),
        ),
      },
      colour: "#15803d",
      face: "\u{1F468}\u{1F3FF}\u{200D}\u{1F9B2}",
    },
    {
      id: "C",
      name: "Cala",
      pronoun: "sie",
      clue: {
        text: "Sie hatte kein Handwerk. Sie war südlich von Gomak.",
        ...all(
          not(own(onTrade)),
          about(["G"], (c) => {
            const gomak = c.cellOf("G");
            return gomak !== undefined && c.cell.row > gomak.row;
          }),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "D",
      name: "Dova",
      pronoun: "sie",
      clue: { text: "Sie war auf dem Bett.", ...on("bed") },
      colour: "#6366f1",
      face: "\u{1F469}\u{1F3FE}\u{200D}\u{1F9B0}",
    },
    {
      id: "E",
      name: "Enga",
      pronoun: "sie",
      clue: {
        text: "Die Person, die Beeren sammelte, war genau eine Spalte östlich von ihr.",
        ...counting((c) =>
          peopleOn(c, "berries").some(
            (one) => c.cellOf(one)?.col === c.cell.col + 1,
          ),
        ),
      },
      colour: "#a16207",
      face: "\u{1F467}\u{1F3FE}",
    },
    {
      id: "F",
      name: "Fleku",
      pronoun: "er",
      clue: { text: "Er war neben einem Feuer.", ...beside("campfire") },
      colour: "#be185d",
      face: "\u{1F9D4}\u{1F3FD}",
    },
    {
      id: "G",
      name: "Gomak",
      pronoun: "er",
      clue: { text: "Er war nicht neben einem Baum.", ...not(beside("tree")) },
      colour: "#57534e",
      face: "\u{1F9D4}\u{1F3FF}",
    },
    {
      id: "H",
      name: "Hrog",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke des Spielfelds.",
        ...own(
          (c) =>
            (c.cell.row === 0 || c.cell.row === c.rows - 1) &&
            (c.cell.col === 0 || c.cell.col === c.cols - 1),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F9D3}\u{1F3FD}",
    },
    {
      id: "V",
      name: "Vlaka",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}\u{1F3FD}\u{200D}\u{1F9B1}",
    },
  ],
  rules: [
    {
      text: "Es gab eine Person, die Beeren sammelte, und einen Jäger. Jeder von ihnen stand auf einem Feld seines Handwerks, sonst niemand auf einem solchen Feld.",
      check: (c) => TRADES.every((what) => peopleOn(c, what).length === 1),
      prune: (c) => TRADES.every((what) => peopleOn(c, what).length <= 1),
    },
  ],
  hints: [
    {
      text: "Beerenkörbe gibt es nur auf der Wiese in C8 und C9, und Enga stand genau eine Spalte westlich der Person, die Beeren sammelte. Sammelte sie in C9 (R6 C9), stünde Enga in C8 - und Dova hätte für das Bett (R3 C8/R3 C9) keine Spalte mehr. Also wird in C8 gesammelt (R7 C8 oder R9 C8), Enga steht in C7, Dova auf dem Bett in R3 C9.",
      place: { D: { row: 2, col: 8 } },
    },
    {
      text: "Der Jäger steht auf einem Speer: R1 C2, R1 C4, R6 C6 oder R8 C1 - jeder davon liegt neben einem Baum, also nicht Gomak. Cala hat kein Handwerk, und alle anderen außer Vlaka passen auf keinen Speer (Spalte, Bett, Feuer, Ecke, Wildschwein). Vlaka ist die Jägerin, Gomak sammelte die Beeren. Cala steht südlich von ihm, also steht Gomak in R7 C8.",
      place: { G: { row: 6, col: 7 } },
    },
    {
      text: "Hrog steht in einer Ecke, nicht in C9: R1 C1 oder R9 C1. Brol steht neben einem Wildschwein, nicht in R3, C5, C8 oder C9: R4 C2, R4 C6 oder R8 C2. Cala steht südlich von Gomak im Südwald: R8 C2 oder R9 C4. Stünde Hrog in R9 C1, müsste Cala nach R8 C2, Brol nach R4 C6 und Vlaka nach R1 C4 - allein im Nordwald. Also steht Hrog in R1 C1.",
      place: { H: { row: 0, col: 0 } },
    },
    {
      text: "Vlaka bleibt nur der Speer in R6 C6, Fleku neben dem Feuer nur R5 C3. Im Südwald ist auch Cala - sonst darf dort niemand sein: Brol steht in R4 C2, Cala damit in R9 C4, Atok in R2 C5 (nicht R8 C5) und Enga in R8 C7. Vlaka war allein mit Cala. Cala ist die Mörderin!",
      place: {
        V: { row: 5, col: 5 },
        F: { row: 4, col: 2 },
        B: { row: 3, col: 1 },
        C: { row: 8, col: 3 },
        A: { row: 1, col: 4 },
        E: { row: 7, col: 6 },
      },
    },
  ],
  solution: {
    A: { row: 1, col: 4 },
    B: { row: 3, col: 1 },
    C: { row: 8, col: 3 },
    D: { row: 2, col: 8 },
    E: { row: 7, col: 6 },
    F: { row: 4, col: 2 },
    G: { row: 6, col: 7 },
    H: { row: 0, col: 0 },
    V: { row: 5, col: 5 },
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
