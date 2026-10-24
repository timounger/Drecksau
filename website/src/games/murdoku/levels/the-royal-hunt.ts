/**
 * Die königliche Jagd: the royal woods and hunting lodge above a stream, a
 * path, an apothecary and a clearing, with a murdered villager.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/8.png`, no solution
 * sheet - the culprit is pencilled in on the photographed page, and the
 * solver proves it is the only solution). Virgilius is the victim; whoever
 * was alone with him killed him.
 *
 * The map is nine by nine. The path runs through the stream and the
 * clearing, yet each of them is one area, as the book notes. Chairs, horses
 * and the water of the stream can be stood on; trees, shrubs, boars, pots
 * and tables cannot.
 *
 * The book's estates: nobles (purple cards: Amelia, Benoit, Cedric) only in
 * the crowned woods and lodge, villagers (wooden cards: Felicia, Glory,
 * Humphrey, Virgilius) only in the other areas, knights (grey shields: Dean,
 * Everett) anywhere.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  alone,
  all,
  inArea,
  own,
  ranks,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether a boar stands in the suspect's row or column. */
function boarIn(c: Context, line: "row" | "col"): boolean {
  let found = false;
  for (let at = 0; at < (line === "row" ? c.cols : c.rows); at += 1) {
    const cell =
      line === "row"
        ? { row: c.cell.row, col: at }
        : { row: at, col: c.cell.col };
    if (c.inside(cell) && c.is(cell, "boar")) {
      found = true;
    }
  }
  return found;
}

/** Whether the suspect stands east of somebody. */
function eastOf(c: Context, id: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && c.cell.col > there.col;
}

/** The case. */
export const THE_ROYAL_HUNT: Level = {
  id: "the-royal-hunt",
  name: "Die königliche Jagd",
  series: { book: "timeTravel", number: 8 },
  story: "Eigentlich sollte ein Hirsch erlegt werden - kein Knecht.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Königlicher Wald",
      at: "im königlichen Wald",
      ground: "grass",
      tint: "#b9a8dc",
      label: { row: 3, col: 6 },
    },
    {
      key: "K",
      name: "Königliche Hütte",
      at: "in der königlichen Hütte",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 2, col: 3 },
    },
    {
      key: "A",
      name: "Bach",
      at: "im Bach",
      ground: "water",
      tint: "#b5d8f2",
      label: { row: 5, col: 1 },
    },
    {
      key: "P",
      name: "Weg",
      at: "auf dem Weg",
      ground: "path",
      tint: "#efe0b0",
      label: { row: 8, col: 4 },
    },
    {
      key: "O",
      name: "Apotheke",
      at: "in der Apotheke",
      ground: "stone",
      tint: "#c9ced8",
      label: { row: 6, col: 6 },
    },
    {
      key: "C",
      name: "Lichtung",
      at: "auf der Lichtung",
      ground: "grass",
      tint: "#cfe3c8",
      label: { row: 8, col: 1 },
    },
  ],
  areaMap: [
    "WWWWWWWWW",
    "WWKKKWWWW",
    "WWKKKWWWW",
    "WWWWWWWWW",
    "WAAPAAAAA",
    "AAAPAAOOO",
    "CCCPCCOOO",
    "CCCPPCCCC",
    "CCCCPCCCC",
  ],
  thingMap: [
    "...t.o.h.",
    "..ddc.t..",
    "........t",
    "t.t.h.t.o",
    ".........",
    "......pd.",
    "s.......p",
    ".s......s",
    ".......ss",
  ],
  things: {
    c: "chair",
    d: "table",
    h: "horse",
    o: "boar",
    p: "pot",
    s: "shrub",
    t: "tree",
  },
  pieces: [{ at: { row: 1, col: 2 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      traits: ["noble"],
      name: "Amelia",
      pronoun: "sie",
      clue: {
        text: "In ihrer Spalte war ein Wildschwein.",
        ...own((c) => boarIn(c, "col")),
      },
      colour: "#be185d",
      face: "\u{1F478}",
    },
    {
      id: "B",
      traits: ["noble"],
      name: "Benoit",
      pronoun: "er",
      clue: {
        text: "Er saß auf einem Stuhl oder ritt auf einem Pferd.",
        ...own((c) => c.is(c.cell, "chair") || c.is(c.cell, "horse")),
      },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      traits: ["noble"],
      name: "Cedric",
      pronoun: "er",
      clue: {
        text: "In seiner Zeile war ein Wildschwein. Er war östlich von Glory.",
        ...all(
          own((c) => boarIn(c, "row")),
          about(["G"], (c) => eastOf(c, "G")),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F934}",
    },
    {
      id: "D",
      traits: ["knight"],
      name: "Dean",
      pronoun: "er",
      clue: {
        text: "Er war in der königlichen Hütte oder in der Apotheke.",
        ...inArea("K", "O"),
      },
      colour: "#57534e",
      face: "\u{1F482}",
    },
    {
      id: "E",
      traits: ["knight"],
      name: "Everett",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Baum oder einem Strauch.",
        ...own((c) => c.beside(c.cell, "tree") || c.beside(c.cell, "shrub")),
      },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "F",
      traits: ["villager"],
      name: "Felicia",
      pronoun: "sie",
      clue: {
        text: "Sie war östlich von Benoit.",
        ...about(["B"], (c) => eastOf(c, "B")),
      },
      colour: "#ea580c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      traits: ["villager"],
      name: "Glory",
      pronoun: "sie",
      clue: {
        text: "Sie war allein im Bach.",
        ...all(inArea("A"), alone()),
      },
      colour: "#a16207",
      face: "\u{1F469}",
    },
    {
      id: "H",
      traits: ["villager"],
      name: "Humphrey",
      pronoun: "er",
      clue: { text: "Er war in der untersten Zeile.", ...row(9) },
      colour: "#15803d",
      face: "\u{1F474}",
    },
    {
      id: "V",
      traits: ["villager"],
      name: "Virgilius",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#334155",
      face: "\u{1F468}‍\u{1F9B1}",
    },
  ],
  rules: [
    ranks(
      "Adlige (\u{1F451}) waren nur im königlichen Wald oder in der königlichen Hütte, Dorfbewohner nur in den anderen Bereichen, Ritter überall.",
      ["W", "K"],
    ),
    {
      text: "Kein Bereich war leer.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length > 0),
    },
  ],
  hints: [
    {
      text: "Felicia, Glory, Humphrey und Virgilius sind Dorfbewohner, also nicht in Wald oder Hütte - sie stehen in R5 bis R9. Dort ist Platz für genau eine weitere Person. Ein Adliger kann es nicht sein: Der einzige Waldplatz dort ist R5 C1, ohne Wildschwein in Zeile oder Spalte und ohne Stuhl oder Pferd. Also steht Dean oder Everett unten, die anderen vier in R1 bis R4.",
    },
    {
      text: "Unten ist Glory allein im Bach. Weg, Apotheke und Lichtung dürfen nicht leer sein, und für sie bleiben vier Personen: Felicia, Humphrey, Virgilius und der Ritter. Genau ein Bereich hat also zwei Personen - der von Virgilius, der mit dem Mörder allein war.",
    },
    {
      text: "Stünde Dean unten, müsste trotzdem jemand in der königlichen Hütte sein: Cedric (R1 oder R4), Amelia (C6 oder C9) und Everett (kein Baum in der Hütte) können nicht, also säße Benoit in R2 C5. Humphrey stünde dann auf der Lichtung (R9 C5 läge in Benoits Spalte), Felicia östlich von Benoit nie auf dem Weg, sondern bei Dean oder Humphrey - und Virgilius bliebe allein auf dem Weg. Also steht Everett unten, neben einem Strauch auf der Lichtung, und Dean ist in der Hütte.",
    },
    {
      text: "Stünde Humphrey auch auf der Lichtung, teilte er sie mit Everett ohne Virgilius. Also steht er auf dem Weg: R9 C5. Benoit kann nicht in C5 sitzen oder reiten - er reitet in R1 C8. Felicia steht östlich von ihm in C9: Dort ist nur R6 C9 in der Apotheke frei.",
      place: {
        H: { row: 8, col: 4 },
        B: { row: 0, col: 7 },
        F: { row: 5, col: 8 },
      },
    },
    {
      text: "Cedric hat ein Wildschwein in seiner Zeile; R1 ist Benoits Zeile, also steht er in R4. Dean ist in der Hütte: R2 C3 und R2 C4 sind Tische, C5 ist Humphreys Spalte - Dean steht in R3. Amelia bleibt R2, mit einem Wildschwein in der Spalte und C9 besetzt: R2 C6.",
      place: { A: { row: 1, col: 5 } },
    },
    {
      text: "Glory steht im Bach, R6 ist Felicias Zeile - also R5. Cedric steht in R4 östlich von ihr: R4 C6 und R4 C8 sind besetzte Spalten, in R4 C2 müsste Glory in C1 stehen. Cedric steht in R4 C4, Dean in R3 C3 und Glory in R5 C2.",
      place: {
        C: { row: 3, col: 3 },
        D: { row: 2, col: 2 },
        G: { row: 4, col: 1 },
      },
    },
    {
      text: "Übrig sind R7, R8 und C1, C7. Everett steht neben einem Strauch auf der Lichtung: R8 C1. Virgilius steht in R7 C7 in der Apotheke - allein mit Felicia. Felicia ist die Mörderin!",
      place: { E: { row: 7, col: 0 }, V: { row: 6, col: 6 } },
    },
  ],
  solution: {
    A: { row: 1, col: 5 },
    B: { row: 0, col: 7 },
    C: { row: 3, col: 3 },
    D: { row: 2, col: 2 },
    E: { row: 7, col: 0 },
    F: { row: 5, col: 8 },
    G: { row: 4, col: 1 },
    H: { row: 8, col: 4 },
    V: { row: 6, col: 6 },
  },
};
