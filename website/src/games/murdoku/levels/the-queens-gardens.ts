/**
 * Die Gärten der Königin: a dormitory, a refectory, a pantry, the pond, the
 * garden round it and the colonnade, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/66.png`, no solution
 * sheet - parts of the solved grid are pencilled in on the photographed
 * page, and the solver proves it is the only solution).
 * Vabira is the victim; whoever was alone with her killed her.
 *
 * The cards show no estates and the map no crowns. Some fields carry a
 * hieroglyph: whoever stood on Anubis was alone in the area, whoever stood
 * on Ra was not ({@link HIEROGLYPHS}). Flowers and water lilies "cannot be
 * occupied", as the legend says; neither can trees, tables, baskets, urns or
 * the cat statue. Beds, chairs and the pond can be stood on.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  alone,
  beside,
  cellsWhere,
  column,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level, Rule } from "../engine/types";

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
export const THE_QUEENS_GARDENS: Level = {
  id: "the-queens-gardens",
  name: "Die Gärten der Königin",
  series: { book: "timeTravel", number: 66 },
  story:
    "Alle Pflanzen hier sind essbar - manche allerdings nur ein einziges Mal.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "D",
      name: "Schlafsaal",
      at: "im Schlafsaal",
      ground: "floor",
      tint: "#ece4d6",
      label: { row: 4, col: 0 },
    },
    {
      key: "R",
      name: "Speisesaal",
      at: "im Speisesaal",
      ground: "floor",
      tint: "#ece4d6",
      label: { row: 1, col: 4 },
    },
    {
      key: "S",
      name: "Vorratskammer",
      at: "in der Vorratskammer",
      ground: "floor",
      tint: "#ece4d6",
      label: { row: 4, col: 8 },
      labelEnd: true,
    },
    {
      key: "P",
      name: "Teich",
      at: "im Teich",
      ground: "water",
      label: { row: 5, col: 5 },
    },
    {
      key: "G",
      name: "Garten",
      at: "im Garten",
      ground: "grass",
      tint: "#bfe0c8",
      label: { row: 7, col: 3 },
    },
    {
      key: "C",
      name: "Säulengang",
      at: "im Säulengang",
      ground: "stone",
      tint: "#e6dce8",
      label: { row: 8, col: 1 },
    },
  ],
  areaMap: [
    "DDDRRRRSS",
    "DDDRRRRSS",
    "DDGGGGGSS",
    "DDGPPPGSS",
    "DGGPPPGGS",
    "CGGPPPGGC",
    "CGGGPGGGC",
    "CCGGGGGCC",
    "CCCCCCCCC",
  ],
  thingMap: [
    "kr.tct.nk",
    "rb.ctc..n",
    ".bfr.p...",
    ".t.l..f..",
    "....lr.p.",
    "u..r.l..u",
    "nf.fr...n",
    "nn...p.nn",
    "u.....ksu",
  ],
  things: {
    b: "bed",
    c: "chair",
    f: "flowers",
    k: "basket",
    l: "waterLily",
    n: "anubis",
    p: "palm",
    r: "ra",
    s: "statue",
    t: "table",
    u: "urn",
  },
  extraThings: {
    waterLily: { name: "Seerose", emoji: "\u{1FAB7}", standable: false },
    urn: { name: "Urne", emoji: "\u{1F3FA}", standable: false },
  },
  pieces: [{ at: { row: 1, col: 1 }, rows: 2, cols: 1 }],
  suspects: [
    {
      id: "A",
      name: "Anippe",
      pronoun: "sie",
      clue: { text: "Sie war im Säulengang.", ...inArea("C") },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Betrest",
      pronoun: "sie",
      clue: { text: "Sie war in der fünften Spalte.", ...column(5) },
      colour: "#15803d",
      face: "\u{1F478}",
    },
    {
      id: "C",
      name: "Cahset",
      pronoun: "sie",
      clue: {
        text: "Jemand saß genau eine Spalte östlich von ihr auf einem Stuhl.",
        ...all(
          own((c) =>
            cellsWhere(c.level, (cell) => c.is(cell, "chair")).some(
              (cell) => cell.col === c.cell.col + 1,
            ),
          ),
          counting((c) =>
            c.people().some((id) => {
              const there = c.cellOf(id);
              return (
                there !== undefined &&
                there.col === c.cell.col + 1 &&
                c.is(there, "chair")
              );
            }),
          ),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "D",
      name: "Dedi",
      pronoun: "sie",
      clue: {
        text: "Sie war allein. Sie saß nicht auf einem Stuhl.",
        ...all(alone(), not(on("chair"))),
      },
      colour: "#7c3aed",
      face: "\u{1F467}",
    },
    {
      id: "E",
      name: "Esamun",
      pronoun: "er",
      clue: {
        text: "Er war auf einem Feld mit einer Hieroglyphe.",
        ...on("hieroglyph"),
      },
      colour: "#ea580c",
      face: "\u{1F482}",
    },
    {
      id: "F",
      name: "Fekah",
      pronoun: "sie",
      clue: {
        text: "Eine andere Frau war im selben Bereich wie sie.",
        ...counting((c) =>
          c
            .peopleIn(c.areaOf(c.cell) ?? "")
            .some((id) => id !== c.self && c.has(id, "woman")),
        ),
      },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Gilukhipa",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Korb.", ...beside("basket") },
      colour: "#4338ca",
      face: "\u{1F9D5}",
    },
    {
      id: "H",
      name: "Hankhef",
      pronoun: "er",
      clue: {
        text: "Er war im Garten. Er war nicht neben einem Baum.",
        ...all(inArea("G"), not(beside("tree"))),
      },
      colour: "#a16207",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "V",
      name: "Vabira",
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
      text: "Jede Zeile und jede Spalte hat genau eine Person. In Zeile 9 liegen nur Felder des Säulengangs - wer dort steht, ist bei Anippe im Säulengang. Stünde Anippe auf einer Anubis-Hieroglyphe, wäre sie also nicht allein. Darum steht Anippe in Zeile 9, und auf den Anubis-Feldern des Säulengangs steht niemand. Spalte 1 hat damit nur noch Felder im Schlafsaal, Spalte 9 nur noch Felder in der Vorratskammer.",
    },
    {
      text: "Gilukhipa steht neben einem Korb: R9C6 ist Anippes Zeile, und auf dem Anubis-Feld R1C8 wäre sie nicht allein - in Spalte 9 steht ja jemand in der Vorratskammer. Es bleiben R1C2, R2C1 und R2C9. Aus demselben Grund steht Esamun nicht auf R1C8 und nicht im Säulengang.",
    },
    {
      text: "Cahset steht in Spalte 3 oder 4, denn eine Spalte östlich muss jemand auf einem Stuhl sitzen und Spalte 5 ist Betrests. In Spalte 3 säße jemand auf R2C4; Gilukhipa bliebe nur R1C2 und Esamun nur R5C6 - und Anippe hätte in Zeile 9 keine freie Spalte mehr. Also steht Cahset in Spalte 4, und auf dem Stuhl in Spalte 5 sitzt Betrest: R1C5.",
      place: { B: { row: 0, col: 4 } },
    },
    {
      text: "Gilukhipa steht damit in Zeile 2 (R2C1 oder R2C9). Esamun bleibt nur R5C6 - eine Ra-Hieroglyphe, also ist noch jemand im Teich. Frei ist dort nur R6C4 in Cahsets Spalte: Cahset steht in R6C4.",
      place: { E: { row: 4, col: 5 }, C: { row: 5, col: 3 } },
    },
    {
      text: "Dedi ist allein: nicht im Garten (Hankhef), nicht im Säulengang (Anippe), und im Speisesaal und im Teich ist kein Feld mehr frei. Sie ist allein im Schlafsaal oder allein in der Vorratskammer, Gilukhipa im anderen Bereich. Im Schlafsaal stünde Gilukhipa allein in R2C9; Spalte 2 und 8 gingen nur noch mit R9C2 und R7C8, und Fekah, Hankhef und Vabira stünden alle im Garten - Vabira wäre nicht allein mit einer Person. Also ist Dedi in der Vorratskammer und Gilukhipa in R2C1.",
      place: { G: { row: 1, col: 0 } },
    },
    {
      text: "Gilukhipa steht auf Ra und braucht Gesellschaft: Im Schlafsaal ist nur noch R3C2 frei. Dedi steht damit in R4C9, Anippe in R9C3 (Spalte 2 ist belegt). Läge Vabira auf dem Bett, wäre Fekah mit Hankhef allein im Garten - ohne andere Frau. Also liegt Fekah in R3C2.",
      place: {
        D: { row: 3, col: 8 },
        A: { row: 8, col: 2 },
        F: { row: 2, col: 1 },
      },
    },
    {
      text: "Hankhef steht nicht neben einem Baum: R7C7 oder R7C8 (R8C7 liegt neben der Palme, R8C8 ist ein Anubis-Feld). In R7C7 bliebe Vabira nur R8C8. Also steht Hankhef in R7C8 und Vabira in R8C7 - allein mit ihm im Garten. Hankhef ist der Mörder!",
      place: { H: { row: 6, col: 7 }, V: { row: 7, col: 6 } },
    },
  ],
  solution: {
    A: { row: 8, col: 2 },
    B: { row: 0, col: 4 },
    C: { row: 5, col: 3 },
    D: { row: 3, col: 8 },
    E: { row: 4, col: 5 },
    F: { row: 2, col: 1 },
    G: { row: 1, col: 0 },
    H: { row: 6, col: 7 },
    V: { row: 7, col: 6 },
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

/**
 * For the solver: whether a partial placement can still be finished. Dedi
 * and whoever stands on Anubis stay alone, Vabira's area never holds more
 * than two, and whoever stands in the column east of Cahset sits on a chair
 * - there is exactly one person per column.
 */
function stillPossible(c: Context): boolean {
  const cahset = c.cellOf("C");
  return c.people().every((id) => {
    const there = c.cellOf(id);
    const count =
      there === undefined ? 0 : c.peopleIn(c.areaOf(there) ?? "").length;
    return (
      there === undefined ||
      (((id !== "D" && !c.is(there, "anubis")) || count === 1) &&
        (id !== "V" || count <= 2) &&
        (cahset === undefined ||
          there.col !== cahset.col + 1 ||
          c.is(there, "chair")))
    );
  });
}
