/**
 * Die Kornspeicher: the threshing floor, the courtyard, the field, two
 * granaries and the house, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/70.png`, no solution
 * sheet - parts of the solved grid are pencilled in on the photographed
 * page, and the solver proves it is the only solution).
 * Veserkaf is the victim; whoever was alone with him killed him.
 *
 * The cards show no estates and the map no crowns. Some fields carry the
 * Anubis hieroglyph: whoever stood on one was alone in the area
 * ({@link ANUBIS}). The two cats sit on corners between four fields; beside
 * a cat is any of those four ({@link CAT_CORNERS}). Grain "cannot be
 * occupied", as the legend says; neither can baskets or shrubs. The bed can
 * be stood on.
 */
import {
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
import type { Cell, Context, Level, Rule } from "../engine/types";

/** The fields round the two corners the cats sit on. */
const CAT_CORNERS: readonly Cell[] = [
  { row: 4, col: 1 },
  { row: 4, col: 2 },
  { row: 5, col: 1 },
  { row: 5, col: 2 },
  { row: 5, col: 5 },
  { row: 5, col: 6 },
  { row: 6, col: 5 },
  { row: 6, col: 6 },
];

/** Whoever stood on an Anubis field was alone in their area. */
const ANUBIS: Rule = {
  text: "Wer auf einer Anubis-Hieroglyphe stand, war allein in seinem Bereich.",
  check: (c) =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return (
        there === undefined ||
        !c.is(there, "anubis") ||
        c.peopleIn(c.areaOf(there) ?? "").length === 1
      );
    }),
};

/** The case. */
export const THE_GRANARIES: Level = {
  id: "the-granaries",
  name: "Die Kornspeicher",
  series: { book: "timeTravel", number: 70 },
  story: "Die Arbeit hier zermahlt einen buchstäblich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "T",
      name: "Dreschplatz",
      at: "auf dem Dreschplatz",
      ground: "stone",
      tint: "#d5dccb",
      label: { row: 2, col: 2 },
    },
    {
      key: "P",
      name: "Hof",
      at: "im Hof",
      ground: "sand",
      tint: "#ecd3cc",
      label: { row: 3, col: 1 },
    },
    {
      key: "F",
      name: "Feld",
      at: "auf dem Feld",
      ground: "grass",
      tint: "#ece2b4",
      label: { row: 4, col: 6 },
    },
    {
      key: "A",
      name: "Kornspeicher A",
      at: "in Kornspeicher A",
      ground: "floor",
      tint: "#ecebd8",
      label: { row: 7, col: 0 },
    },
    {
      key: "H",
      name: "Haus",
      at: "im Haus",
      ground: "floor",
      tint: "#ddcfe2",
      label: { row: 7, col: 3 },
    },
    {
      key: "B",
      name: "Kornspeicher B",
      at: "in Kornspeicher B",
      ground: "floor",
      tint: "#ecebd8",
      label: { row: 7, col: 6 },
    },
  ],
  areaMap: [
    "TTTTTFFF",
    "TTTTTFFF",
    "PTTTTFFF",
    "PPPPPFFF",
    "AAAPPFFF",
    "AAAPPBBB",
    "AAHHHBBB",
    "AAHHHBBB",
  ],
  thingMap: [
    "...g.a.k",
    "..g.a...",
    ".a..g.k.",
    "k...s...",
    "g.g.....",
    "g.gs...g",
    ".a..k.gg",
    "g.ee.g.a",
  ],
  things: {
    a: "anubis",
    e: "bed",
    g: "grain",
    k: "basket",
    s: "shrub",
  },
  extraThings: {
    grain: { name: "Korn", emoji: "\u{1F33E}", standable: false },
  },
  pieces: [{ at: { row: 7, col: 2 }, rows: 1, cols: 2 }],
  corners: [
    { at: { row: 4, col: 1 }, thing: "cat" },
    { at: { row: 5, col: 5 }, thing: "cat" },
  ],
  suspects: [
    {
      id: "A",
      name: "Ahmose",
      pronoun: "sie",
      clue: {
        text: "Sie war in einem Kornspeicher oder auf dem Feld.",
        ...inArea("A", "B", "F"),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bes",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Feld mit einer Hieroglyphe.",
        ...beside("hieroglyph"),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Cahra",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einer Katze.",
        ...own((c) =>
          CAT_CORNERS.some(
            (one) => one.row === c.cell.row && one.col === c.cell.col,
          ),
        ),
        glow: () => CAT_CORNERS,
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "D",
      name: "Deyet",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Korb.", ...beside("basket") },
      colour: "#7c3aed",
      face: "\u{1F9D5}",
    },
    {
      id: "E",
      name: "Eram",
      pronoun: "er",
      clue: { text: "Er war in der obersten Zeile.", ...row(1) },
      colour: "#ea580c",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "F",
      name: "Fayeb",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einem Strauch.",
        ...not(beside("shrub")),
      },
      colour: "#be185d",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "G",
      name: "Gusor",
      pronoun: "er",
      clue: {
        text: "Er war eine von genau zwei Personen auf einem Feld mit einer Hieroglyphe.",
        ...all(
          on("hieroglyph"),
          counting(
            (c) =>
              c.people().filter((id) => {
                const there = c.cellOf(id);
                return there !== undefined && c.is(there, "hieroglyph");
              }).length === 2,
          ),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "V",
      name: "Veserkaf",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F474}",
    },
  ],
  rules: [ANUBIS],
  prune: stillPossible,
  hints: [
    {
      text: "Gusor und genau eine weitere Person stehen auf Anubis-Feldern, jede allein in ihrem Bereich - Veserkaf nie, er ist ja nicht allein. R1C6 käme nur für Eram in Frage; dann stünde sonst niemand auf dem Feld, Spalte 8 ginge nur über R8C8 (allein in Kornspeicher B), und für Spalte 7 bliebe nur Kornspeicher B. Also stehen die beiden in zwei der Bereiche Dreschplatz, Kornspeicher A und Kornspeicher B.",
    },
    {
      text: "Cahra steht neben einer Katze, also in einem Kornspeicher - dort steht niemand allein. Der Dreschplatz und der andere Kornspeicher haben darum je genau eine Person, auf ihrem Anubis-Feld. Eram steht damit nicht auf dem Dreschplatz: Er steht in R1C7.",
      place: { E: { row: 0, col: 6 } },
    },
    {
      text: "Stünde Cahra in Kornspeicher B, wäre in Kornspeicher A nur die Person auf R7C2. Spalte 1 bliebe nur R3C1, die Person auf dem Dreschplatz stünde in R2C5, Cahra in R6C6 - und für Bes, der neben einer Hieroglyphe steht, bliebe kein Feld. Also ist Cahra in Kornspeicher A, und auf R8C8 steht jemand allein in Kornspeicher B.",
    },
    {
      text: "Cahra steht in Spalte 2, also steht die Person auf dem Dreschplatz in R2C5. In Zeile 6 bleibt nur R6C2: Dort steht Cahra. Bes steht neben einer Hieroglyphe - es bleibt R7C1.",
      place: { C: { row: 5, col: 1 }, B: { row: 6, col: 0 } },
    },
    {
      text: "Deyet steht neben einem Korb: Alle Felder außer R3C6 liegen in belegten Zeilen oder Spalten. Deyet steht in R3C6.",
      place: { D: { row: 2, col: 5 } },
    },
    {
      text: "Zeile 4 und 5 bleiben mit Spalte 3 und 4: R4C3 und R5C4, beide im Hof. Ahmose steht in einem Kornspeicher oder auf dem Feld - für sie bleibt nur R8C8. Gusor steht in R2C5. R5C4 liegt neben dem Strauch, also steht Fayeb in R4C3 und Veserkaf in R5C4 - allein mit ihm. Fayeb ist der Mörder!",
      place: {
        A: { row: 7, col: 7 },
        G: { row: 1, col: 4 },
        F: { row: 3, col: 2 },
        V: { row: 4, col: 3 },
      },
    },
  ],
  solution: {
    A: { row: 7, col: 7 },
    B: { row: 6, col: 0 },
    C: { row: 5, col: 1 },
    D: { row: 2, col: 5 },
    E: { row: 0, col: 6 },
    F: { row: 3, col: 2 },
    G: { row: 1, col: 4 },
    V: { row: 4, col: 3 },
  },
};

/**
 * For the solver: whether a partial placement can still be finished.
 * Whoever stands on Anubis stays alone, no more than two stand on
 * hieroglyphs, and Veserkaf's area never holds more than two.
 */
function stillPossible(c: Context): boolean {
  const onGlyph = c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "hieroglyph");
  });
  return (
    onGlyph.length <= 2 &&
    c.people().every((id) => {
      const there = c.cellOf(id);
      const count =
        there === undefined ? 0 : c.peopleIn(c.areaOf(there) ?? "").length;
      return (
        there === undefined ||
        ((!c.is(there, "anubis") || count === 1) && (id !== "V" || count <= 2))
      );
    })
  );
}
