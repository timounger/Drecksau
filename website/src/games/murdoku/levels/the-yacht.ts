/**
 * Die Yacht: a sun deck with a whirlpool and a helipad, a dining room, a
 * great saloon, the crew quarters, the galley, the master cabin and the
 * bridge, with a murdered captain.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/74. Die Yacht.JPG`,
 * solution in `Lösungen 1-80/Lösung 73-76.JPG`).
 * Olav is the victim; whoever was alone with him killed him.
 *
 * The map has nine rows and twelve columns, so three columns stay empty;
 * the last column holds only consoles and a TV. The armchairs are the
 * chairs; they, the beds, the rugs and the whirlpool can be stood on. The
 * tables (the dining table, the consoles, the night tables and the sideboards
 * among them), the shelves, the TVs, the crates on the helipad and the plants
 * cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  beside,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** How many people stood on a thing of this id. */
function countOn(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  }).length;
}

/** Whether nobody stood in a column, counted from nought. */
function emptyColumn(c: Context, col: number): boolean {
  return c.people().every((id) => c.cellOf(id)?.col !== col);
}

/** Whether exactly two people were in the suspect's area, the other a woman. */
function aloneWithAWoman(c: Context): boolean {
  const there = c.peopleIn(c.areaOf(c.cell) ?? "");
  return (
    there.length === 2 &&
    there.every((id) => id === c.self || c.has(id, "woman"))
  );
}

/** The case. */
export const THE_YACHT: Level = {
  id: "the-yacht",
  name: "Die Yacht",
  series: { book: "original", number: 74 },
  story: "Hier ist etwas gewaltig aus dem Ruder gelaufen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "S",
      name: "Sonnendeck",
      at: "auf dem Sonnendeck",
      ground: "floor",
      tint: "#f6dcb4",
      label: { row: 8, col: 0 },
    },
    {
      key: "W",
      name: "Whirlpool",
      at: "im Whirlpool",
      ground: "water",
      label: { row: 1, col: 1 },
    },
    {
      key: "H",
      name: "Helipad",
      at: "auf dem Helipad",
      ground: "stone",
      label: { row: 7, col: 1 },
    },
    {
      key: "E",
      name: "Speisesaal",
      at: "im Speisesaal",
      ground: "floor",
      tint: "#ddd0ea",
      label: { row: 3, col: 3 },
    },
    {
      key: "G",
      name: "Großer Salon",
      at: "im Großen Salon",
      ground: "floor",
      tint: "#e9e2c8",
      label: { row: 8, col: 3 },
    },
    {
      key: "M",
      name: "Mannschaftsquartier",
      at: "im Mannschaftsquartier",
      ground: "floor",
      tint: "#f1ebc8",
      label: { row: 2, col: 6 },
      labelOverhang: true,
    },
    {
      key: "K",
      name: "Kombüse",
      at: "in der Kombüse",
      ground: "floor",
      tint: "#ecdcea",
      label: { row: 5, col: 7 },
    },
    {
      key: "C",
      name: "Hauptkabine",
      at: "in der Hauptkabine",
      ground: "floor",
      tint: "#e2d6ea",
      label: { row: 8, col: 6 },
      labelOverhang: true,
    },
    {
      key: "B",
      name: "Brücke",
      at: "auf der Brücke",
      ground: "floor",
      tint: "#f6d3a4",
      label: { row: 7, col: 9 },
      labelOverhang: true,
    },
  ],
  areaMap: [
    "SSSEEEMM....",
    "SWWEEEMMMB..",
    "SSSEEEMMMBB.",
    "SSSEEEKKKKBB",
    "SSSGGGKKKKBB",
    "SSSGGGKKKKBB",
    "SHHGGGCCCBB.",
    "SHHGGGCCCB..",
    "SSSGGGCC....",
  ],
  thingMap: [
    ".cc.cpbb....",
    "c..ctc.b....",
    "...ctctb..t.",
    ".cc..cstts.t",
    "...s.p.rrr.v",
    ".ccc.v.....t",
    "cxxtrcb.t...",
    "....rtb.p...",
    "t.c..ttt....",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    r: "rug",
    s: "shelf",
    t: "table",
    v: "tv",
    x: "crate",
  },
  pieces: [
    { at: { row: 0, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 6 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 4 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 7 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 8, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 7 }, rows: 1, cols: 3 },
    { at: { row: 6, col: 4 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Aria",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Pflanze.", ...beside("plant") },
      colour: "#b45309",
      face: "\u{1F475}",
    },
    {
      id: "B",
      name: "Bruna",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Stuhl.", ...beside("chair") },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Corinna",
      pronoun: "sie",
      clue: {
        text: "Sie war auf der Brücke. Sie war genau eine Zeile südlich von Hubert.",
        ...all(inArea("B"), {
          uses: ["H"],
          check: (c) => c.cell.row === (c.cellOf("H")?.row ?? -2) + 1,
        }),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Deborah",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#4f46e5",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Elke",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fernseher.", ...beside("tv") },
      colour: "#6b21a8",
      face: "\u{1F467}",
    },
    {
      id: "F",
      name: "Fernando",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Bett.",
        ...all(
          on("bed"),
          counting((c) => countOn(c, "bed") === 1),
        ),
      },
      colour: "#9f1239",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "G",
      name: "Gregor",
      pronoun: "er",
      clue: {
        text: "Er war im Großen Salon, allein mit einer Frau.",
        ...all(inArea("G"), counting(aloneWithAWoman)),
      },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Hubert",
      pronoun: "er",
      clue: {
        text: "Er war nicht in Spalte 1 oder 11. Beide Spalten neben ihm waren leer.",
        ...all(
          own((c) => c.cell.col !== 0 && c.cell.col !== 10),
          counting(
            (c) =>
              emptyColumn(c, c.cell.col - 1) && emptyColumn(c, c.cell.col + 1),
          ),
        ),
      },
      colour: "#3730a3",
      face: "\u{1F9D4}",
    },
    {
      id: "O",
      name: "Olav",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#be123c",
      face: "\u{1F474}",
    },
  ],
  rules: [
    {
      text: "Genau eine Person saß auf einem Stuhl.",
      check: (c) => countOn(c, "chair") === 1,
    },
    {
      text: "Genau eine Person war auf einem Teppich.",
      check: (c) => countOn(c, "rug") === 1,
    },
  ],
  hints: [
    {
      text: "Genau zwei Spalten (außer S12) sind leer; Hubert ist zwischen ihnen. Hubert kann nicht in S5 sein (er würde Gregor blockieren) oder in S7 (er würde Fernando blockieren). Daher muss S6 besetzt sein.",
    },
    {
      text: "Die einzige Person auf einem Stuhl muss in S6 sein. Schließe alle anderen Stühle aus.",
    },
    {
      text: "Jemand ist auf einem der beiden Teppiche; schließe das sich überschneidende Feld bei Z5 S5 aus.",
      cross: [{ row: 4, col: 4 }],
    },
    {
      text: "Deborah muss neben einem der beiden Regale in Z5 sein. Schließe den Rest von Z5 aus.",
    },
    {
      text: "Elke, neben einem Fernseher, muss die Frau im Großen Salon mit Gregor sein, in Z6 S5 oder Z7 S6. Schließe das sich überschneidende Feld bei Z7 S5 aus.",
      cross: [{ row: 6, col: 4 }],
    },
    {
      text: "Wenn Gregor auf dem Teppich in Z8 S5 wäre, würden Elke und Gregor jedes Feld neben einer Pflanze blockieren, sodass Aria nirgends sein könnte. Also ist dieses Feld leer und Deborah ist auf dem letzten Teppichfeld in Z5 S10.",
      place: { D: { row: 4, col: 9 } },
      cross: [{ row: 7, col: 4 }],
    },
    {
      text: "Hubert muss in S2 oder S3 sein, da jede andere Spalte einen anderen Verdächtigen blockieren würde. (In S8 würde er Fernando blockieren.) Corinna, auf der Brücke eine Zeile südlich von Hubert, muss in Z4 S11 sein mit Hubert in Z3. Schließe den Rest von Z3 aus und den Rest von S2 und S3. Gregor muss in einem der letzten beiden Felder in Z9 sein.",
      place: { C: { row: 3, col: 10 } },
    },
    {
      text: "Nur zwei Stühle sind in S6, in Z2 und Z7. Wenn Z2 S6 besetzt ist, ist Elke in Z6 S5, was keinen Platz für jemanden in S9 lässt. Das lokalisiert Elke in Z7 S6 (und wir können Z6 S5 ausschließen), dann Aria in Z8 S8 im letzten Feld neben einer Pflanze, dann Fernando auf dem letzten Bett.",
      place: {
        E: { row: 6, col: 5 },
        A: { row: 7, col: 7 },
        F: { row: 0, col: 6 },
      },
    },
    {
      text: "Das lokalisiert Bruna in Z6 S1 neben einem Stuhl, dann Hubert, dann Gregor, dann Olav. Fernando ist der Mörder!",
      place: {
        B: { row: 5, col: 0 },
        H: { row: 2, col: 2 },
        G: { row: 8, col: 4 },
        O: { row: 1, col: 8 },
      },
    },
  ],
  solution: {
    A: { row: 7, col: 7 },
    B: { row: 5, col: 0 },
    C: { row: 3, col: 10 },
    D: { row: 4, col: 9 },
    E: { row: 6, col: 5 },
    F: { row: 0, col: 6 },
    G: { row: 8, col: 4 },
    H: { row: 2, col: 2 },
    O: { row: 1, col: 8 },
  },
};
