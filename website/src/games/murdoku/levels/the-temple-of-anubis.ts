/**
 * Der Tempel des Anubis: the sanctuary, the treasury, the great hall, the
 * crypt, the priest's chamber and the desert outside, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/69.png`, no solution
 * sheet - most of the solved grid is pencilled in on the photographed page,
 * and the solver proves it is the only solution).
 * Varekh is the victim; whoever was alone with him killed him.
 *
 * The cards show no estates and the map no crowns. Some fields carry the
 * Anubis hieroglyph: whoever stood on one was alone in the area
 * ({@link ANUBIS}). Rugs and the bed can be stood on; statues, pillars,
 * chests, basins, the sarcophagus and the obelisk cannot.
 */
import {
  all,
  beside,
  cellsWhere,
  column,
  counting,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level, Rule } from "../engine/types";

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
export const THE_TEMPLE_OF_ANUBIS: Level = {
  id: "the-temple-of-anubis",
  name: "Der Tempel des Anubis",
  series: { book: "timeTravel", number: 69 },
  story:
    "Der schakalköpfige Gott des Todes sieht sogar noch mehr Leichen als wir.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "S",
      name: "Heiligtum",
      at: "im Heiligtum",
      ground: "stone",
      tint: "#d9d4ee",
      label: { row: 1, col: 3 },
    },
    {
      key: "T",
      name: "Schatzkammer",
      at: "in der Schatzkammer",
      ground: "stone",
      tint: "#d9d4ee",
      label: { row: 2, col: 7 },
    },
    {
      key: "H",
      name: "Saal",
      at: "im Saal",
      ground: "stone",
      tint: "#c9c2e2",
      label: { row: 6, col: 4 },
    },
    {
      key: "C",
      name: "Krypta",
      at: "in der Krypta",
      ground: "stone",
      tint: "#d9d4ee",
      label: { row: 7, col: 1 },
    },
    {
      key: "P",
      name: "Priesterkammer",
      at: "in der Priesterkammer",
      ground: "stone",
      tint: "#d9d4ee",
      label: { row: 7, col: 6 },
    },
    {
      key: "D",
      name: "Wüste",
      at: "in der Wüste",
      ground: "sand",
      tint: "#b9daf0",
      label: { row: 8, col: 3 },
    },
  ],
  areaMap: [
    "SSSSSTTTT",
    "SSSSSTTTT",
    "SSHHHHHTT",
    "SSHHHHHPP",
    "CCHHHHHPP",
    "CCHHHHHPP",
    "CCHHHHHPP",
    "CCCDDDPPP",
    "DDDDDDDDD",
  ],
  thingMap: [
    "xrrx.kaka",
    "rb....rrk",
    "rxp..kpa.",
    "....a...x",
    "k..axa.e.",
    "....a..e.",
    "ssprrkp.b",
    "a......a.",
    ".....o.a.",
  ],
  things: {
    a: "anubis",
    b: "basin",
    e: "bed",
    k: "chest",
    o: "obelisk",
    p: "pillar",
    r: "rug",
    s: "sarcophagus",
    x: "statue",
  },
  extraThings: {
    basin: { name: "Korb", emoji: "\u{1F9FA}", standable: false },
    obelisk: { name: "Obelisk", emoji: "\u{1F5FC}", standable: false },
    pillar: { name: "Säule", emoji: "\u{1F3DB}\u{FE0F}", standable: false },
  },
  pieces: [
    { at: { row: 0, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 3 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Akheru",
      pronoun: "er",
      clue: {
        text: "Jemand stand genau eine Zeile nördlich von ihm auf einer Hieroglyphe.",
        ...all(
          own((c) =>
            cellsWhere(c.level, (cell) => c.is(cell, "hieroglyph")).some(
              (cell) => cell.row === c.cell.row - 1,
            ),
          ),
          counting((c) =>
            c.people().some((id) => {
              const there = c.cellOf(id);
              return (
                there !== undefined &&
                there.row === c.cell.row - 1 &&
                c.is(there, "hieroglyph")
              );
            }),
          ),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Buneb",
      pronoun: "er",
      clue: { text: "Er war in der ersten Spalte.", ...column(1) },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Cenura",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Truhe.", ...beside("chest") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dahmun",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Korb.", ...beside("basin") },
      colour: "#7c3aed",
      face: "\u{1F478}",
    },
    {
      id: "E",
      name: "Emhab",
      pronoun: "er",
      clue: { text: "Er war auf einem Teppich.", ...on("rug") },
      colour: "#ea580c",
      face: "\u{1F43A}",
    },
    {
      id: "F",
      name: "Farakh",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Statue.", ...beside("statue") },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "G",
      name: "Gebu",
      pronoun: "er",
      clue: { text: "Er war neben einer Säule.", ...beside("pillar") },
      colour: "#4338ca",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "H",
      name: "Hanira",
      pronoun: "sie",
      clue: { text: "Sie war neben dem Obelisken.", ...beside("obelisk") },
      colour: "#a16207",
      face: "\u{1F467}",
    },
    {
      id: "V",
      name: "Varekh",
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
      text: "Gebu steht neben einer Säule - alle diese Felder liegen im Saal. Auf einer Anubis-Hieroglyphe im Saal wäre also niemand allein. Varekh steht nie auf einer Anubis-Hieroglyphe: Dort wäre er allein, nicht allein mit dem Mörder.",
    },
    {
      text: "Wer eine Zeile nördlich von Akheru steht, steht auf einer Hieroglyphe und ist allein. Das kann nur Cenura auf R1C7 oder R1C9 sein (Akheru in Zeile 2) oder Buneb auf R8C1 (Akheru in Zeile 9). Im zweiten Fall hätte Hanira, die neben dem Obelisken in Zeile 8 oder 9 steht, keine freie Zeile. Cenura steht also allein in der Schatzkammer in Zeile 1, Akheru in Zeile 2 im Heiligtum.",
    },
    {
      text: "Emhab steht auf einem Teppich, nicht in Zeile 1 oder 2 und nicht in der Schatzkammer. R3C1 liegt in Spalte 1, die Buneb braucht. Emhab steht in Zeile 7, auf R7C4 oder R7C5.",
    },
    {
      text: "Spalte 2 kann nur Farakh (R4C2) oder Varekh füllen, Spalte 6 nur Hanira (R8C6) oder Varekh, Zeile 5 nur Farakh (R5C9) oder Varekh. Stünde Varekh in Spalte 6, müsste Farakh in R4C2 und Varekh zugleich in Zeile 5 stehen - R5C6 ist ein Anubis-Feld. Also steht Hanira in R8C6, und Dahmun neben dem Korb in R6C9 (R7C8 und R8C9 liegen in belegten Zeilen).",
      place: { H: { row: 7, col: 5 }, D: { row: 5, col: 8 } },
    },
    {
      text: "R5C9 liegt in Dahmuns Spalte, also steht Varekh in Zeile 5. Im Saal wäre er mit Gebu und Emhab; in R5C2 bräuchte er Buneb in der Krypta - R6C1 liegt in Dahmuns Zeile, R8C1 ist ein Anubis-Feld. Varekh steht in R5C8, und Spalte 2 füllt Farakh in R4C2.",
      place: { V: { row: 4, col: 7 }, F: { row: 3, col: 1 } },
    },
    {
      text: "Gebu und Buneb bleiben Zeile 3 und 9: Gebu steht neben der Säule in R3C4, Buneb in R9C1. Emhab: R7C4 liegt in Gebus Spalte, also R7C5. Akheru steht in R2C3, Cenura in R1C7 (Spalte 9 ist Dahmuns).",
      place: {
        G: { row: 2, col: 3 },
        B: { row: 8, col: 0 },
        E: { row: 6, col: 4 },
        A: { row: 1, col: 2 },
        C: { row: 0, col: 6 },
      },
    },
    {
      text: "Varekh steht in der Priesterkammer - allein mit Dahmun. Dahmun ist die Mörderin!",
    },
  ],
  solution: {
    A: { row: 1, col: 2 },
    B: { row: 8, col: 0 },
    C: { row: 0, col: 6 },
    D: { row: 5, col: 8 },
    E: { row: 6, col: 4 },
    F: { row: 3, col: 1 },
    G: { row: 2, col: 3 },
    H: { row: 7, col: 5 },
    V: { row: 4, col: 7 },
  },
};

/**
 * For the solver: whether a partial placement can still be finished.
 * Whoever stands on Anubis stays alone, Varekh's area never holds more than
 * two, and whoever stands in the row above Akheru stands on a hieroglyph -
 * there is exactly one person per row.
 */
function stillPossible(c: Context): boolean {
  const akheru = c.cellOf("A");
  return c.people().every((id) => {
    const there = c.cellOf(id);
    const count =
      there === undefined ? 0 : c.peopleIn(c.areaOf(there) ?? "").length;
    return (
      there === undefined ||
      ((!c.is(there, "anubis") || count === 1) &&
        (id !== "V" || count <= 2) &&
        (akheru === undefined ||
          there.row !== akheru.row - 1 ||
          c.is(there, "hieroglyph")))
    );
  });
}
