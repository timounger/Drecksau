/**
 * Die Händler am Fluss: the river, the jetty, a corridor and the stalls of
 * the fish, spice and papyrus merchants, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/68.png`, no solution
 * sheet - parts of the solved grid are pencilled in on the photographed
 * page, and the solver proves it is the only solution).
 * Vaneferu is the victim; whoever was alone with her killed her.
 *
 * The cards show no estates and the map no crowns. Some fields carry a
 * hieroglyph: whoever stood on Anubis was alone in the area, whoever stood
 * on Ra was not ({@link HIEROGLYPHS}). The two cats sit on corners between
 * four fields; beside a cat is any of those four ({@link CAT_CORNERS}). The
 * market is the three merchants' stalls. Boats and the river can be stood
 * on; baskets, bowls, chests, tables, papyrus stacks and statues cannot.
 */
import {
  about,
  all,
  beside,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level, Rule } from "../engine/types";

/** The fields round the two corners the cats sit on. */
const CAT_CORNERS: readonly Cell[] = [
  { row: 0, col: 1 },
  { row: 0, col: 2 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 3, col: 4 },
  { row: 3, col: 5 },
  { row: 4, col: 4 },
  { row: 4, col: 5 },
];

/** The market: the stalls of the three merchants. */
const MARKET: readonly string[] = ["F", "S", "P"];

/** The two hieroglyphs: alone on Anubis, never alone on Ra. */
const HIEROGLYPHS: readonly Rule[] = [
  {
    text: "Wer auf einer Anubis-Hieroglyphe stand, war allein in seinem Bereich.",
    check: (c) => everyOn(c, "anubis", (count) => count === 1),
  },
  {
    text: "Wer auf einer Ra-Hieroglyphe stand, war nicht allein in seinem Bereich.",
    check: (c) => everyOn(c, "ra", (count) => count > 1),
  },
];

/** The case. */
export const RIVERSIDE_MERCHANTS: Level = {
  id: "riverside-merchants",
  name: "Die Händler am Fluss",
  series: { book: "timeTravel", number: 68 },
  story:
    "Kunden, die nach dem Beschwerdebuch fragen, werden hier offenbar nicht besonders freundlich behandelt.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "R",
      name: "Fluss",
      at: "im Fluss",
      ground: "water",
      label: { row: 6, col: 2 },
    },
    {
      key: "J",
      name: "Steg",
      at: "auf dem Steg",
      ground: "floor",
      tint: "#d4dbe6",
      label: { row: 5, col: 4 },
    },
    {
      key: "C",
      name: "Gang",
      at: "im Gang",
      ground: "floor",
      tint: "#dedcd8",
      label: { row: 4, col: 7 },
    },
    {
      key: "F",
      name: "Fischhändler",
      at: "beim Fischhändler",
      ground: "water",
      tint: "#b7d3ee",
      label: { row: 3, col: 7 },
    },
    {
      key: "S",
      name: "Gewürzhändler",
      at: "beim Gewürzhändler",
      ground: "floor",
      tint: "#b9d9d6",
      label: { row: 8, col: 2 },
    },
    {
      key: "P",
      name: "Papyrushändler",
      at: "beim Papyrushändler",
      ground: "floor",
      tint: "#c9d6cf",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "RCCCCFFFF",
    "RCCCCCFFF",
    "RJJJCCFFF",
    "RRRJCCCFF",
    "RRJJCCCCC",
    "RRRJJCPPC",
    "RRRSSSPPP",
    "RSSSSSPPP",
    "RSSSSSPPP",
  ],
  thingMap: [
    "..aba.f.f",
    "o.ca..t..",
    "......tfr",
    "..o.ca.rf",
    ".o.b.....",
    "...x..tt.",
    "....ttp..",
    ".xs.a....",
    "...s...pp",
  ],
  things: {
    a: "anubis",
    b: "basket",
    c: "chest",
    f: "fishBasket",
    o: "boat",
    p: "papyrusStack",
    r: "ra",
    s: "spiceBowl",
    t: "table",
    x: "statue",
  },
  extraThings: {
    fishBasket: {
      name: "Fischkorb",
      emoji: "\u{1F41F}",
      standable: false,
      kinds: ["basket"],
    },
    spiceBowl: { name: "Gewürzschale", emoji: "\u{1F963}", standable: false },
    papyrusStack: {
      name: "Papyrusstapel",
      emoji: "\u{1F4DC}",
      standable: false,
    },
  },
  pieces: [
    { at: { row: 1, col: 6 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 4 }, rows: 1, cols: 2 },
  ],
  corners: [
    { at: { row: 0, col: 1 }, thing: "cat" },
    { at: { row: 3, col: 4 }, thing: "cat" },
  ],
  suspects: [
    {
      id: "A",
      name: "Ashayet",
      pronoun: "er",
      clue: { text: "Er war im Gang.", ...inArea("C") },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Baktet",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einer Katze. Sie war nördlich von Gurot.",
        ...all(
          own((c) =>
            CAT_CORNERS.some(
              (one) => one.row === c.cell.row && one.col === c.cell.col,
            ),
          ),
          about(["G"], (c) => {
            const gurot = c.cellOf("G");
            return gurot !== undefined && c.cell.row < gurot.row;
          }),
        ),
        glow: () => CAT_CORNERS,
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Camoses",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#0e7490",
      face: "\u{1F473}",
    },
    {
      id: "D",
      name: "Djehut",
      pronoun: "sie",
      clue: { text: "Sie war beim Fischhändler.", ...inArea("F") },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Emun",
      pronoun: "er",
      clue: {
        text: "Er war östlich von Ashayet.",
        ...about(["A"], (c) => {
          const ashayet = c.cellOf("A");
          return ashayet !== undefined && c.cell.col > ashayet.col;
        }),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "F",
      name: "Fenet",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke ihres Bereichs.",
        ...own((c) => isCorner(c)),
      },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Gurot",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Korb. Sie war nicht auf dem Markt.",
        ...all(beside("basket"), not(inArea(...MARKET))),
      },
      colour: "#4338ca",
      face: "\u{1F478}",
    },
    {
      id: "H",
      name: "Horemheb",
      pronoun: "er",
      clue: { text: "Er war in einem Boot.", ...on("boat") },
      colour: "#a16207",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "V",
      name: "Vaneferu",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F469}‍\u{1F9B3}",
    },
  ],
  rules: HIEROGLYPHS,
  prune: stillPossible,
  hints: [
    {
      text: "Gurot steht neben einem Korb, aber nicht auf dem Markt: auf R1C3, R1C5 oder R2C4 (Anubis-Felder im Gang) oder auf R4C4 oder R5C3 am Steg. Baktet steht nördlich von ihr - in Zeile 1 gäbe es kein Nördlich, und zu R2C4 bliebe Baktet nur Zeile 1 im Gang: Gurot wäre auf Anubis nicht allein. Gurot steht also auf dem Steg, in R4C4 oder R5C3.",
    },
    {
      text: "Ashayet steht immer im Gang, also steht sonst niemand auf einer Anubis-Hieroglyphe im Gang. Baktet steht neben einer Katze und nördlich von Gurot: Von R1C2, R1C3, R2C2 und R4C6 sind R1C3 und R4C6 Anubis-Felder im Gang. Baktet steht in Spalte 2.",
    },
    {
      text: "Horemheb steht in einem Boot. R5C2 liegt in Baktets Spalte; in R4C3 bliebe Gurot nur R5C3 - dieselbe Spalte. Horemheb steht in R2C1, Baktet damit in R1C2.",
      place: { H: { row: 1, col: 0 }, B: { row: 0, col: 1 } },
    },
    {
      text: "Djehut ist beim Fischhändler. Zeile 1 und 2 sind belegt, es bleiben die Ra-Felder R3C9 und R4C8. Auf Ra ist sie nicht allein: Auf dem anderen Ra-Feld steht noch jemand. Zeile 3 und 4 sind damit voll, Gurot steht in R5C3.",
      place: { G: { row: 4, col: 2 } },
    },
    {
      text: "Ashayet steht im Gang, aber Zeile 1-5 sind belegt: R6C6 oder R6C9 - Spalte 9 gehört der Person auf R3C9. Ashayet steht in R6C6.",
      place: { A: { row: 5, col: 5 } },
    },
    {
      text: "Für Camoses, Emun, Fenet und Vabira bleiben das zweite Ra-Feld sowie Zeile 7-9 mit Spalte 4, 5 und 7. Camoses steht neben einem Tisch: R7C4 oder R8C5. Das Feld in Spalte 4 kann nur R7C4 sein, beim Gewürzhändler - auf dem Anubis-Feld R8C5 wäre Camoses also nicht allein. Er steht in R7C4.",
      place: { C: { row: 6, col: 3 } },
    },
    {
      text: "Das Anubis-Feld R8C5 scheidet aus, es bleiben R9C5 und R8C7 - keines davon ist eine Ecke. Fenet steht also auf der Ecke R4C8, Djehut in R3C9. Emun steht östlich von Ashayet: R8C7. Vabira steht in R9C5 - allein mit Camoses. Camoses ist der Mörder!",
      place: {
        F: { row: 3, col: 7 },
        D: { row: 2, col: 8 },
        E: { row: 7, col: 6 },
        V: { row: 8, col: 4 },
      },
    },
  ],
  solution: {
    A: { row: 5, col: 5 },
    B: { row: 0, col: 1 },
    C: { row: 6, col: 3 },
    D: { row: 2, col: 8 },
    E: { row: 7, col: 6 },
    F: { row: 3, col: 7 },
    G: { row: 4, col: 2 },
    H: { row: 1, col: 0 },
    V: { row: 8, col: 4 },
  },
};

/** Whether the head count of the area holds for everybody on a thing of this id. */
function everyOn(
  c: Context,
  thing: string,
  test: (count: number) => boolean,
): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return (
      there === undefined ||
      !c.is(there, thing) ||
      test(c.peopleIn(c.areaOf(there) ?? "").length)
    );
  });
}

/** Whether the suspect's field is a corner of its area: the edge on two sides that meet. */
function isCorner(c: Context): boolean {
  const area = c.areaOf(c.cell);
  const out = (row: number, col: number) =>
    c.areaOf({ row: c.cell.row + row, col: c.cell.col + col }) !== area;
  return (out(-1, 0) || out(1, 0)) && (out(0, -1) || out(0, 1));
}

/**
 * For the solver: whether a partial placement can still be finished.
 * Whoever stands on Anubis stays alone, and Vaneferu's area never holds more
 * than two.
 */
function stillPossible(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    const count =
      there === undefined ? 0 : c.peopleIn(c.areaOf(there) ?? "").length;
    return (
      there === undefined ||
      ((!c.is(there, "anubis") || count === 1) && (id !== "V" || count <= 2))
    );
  });
}
