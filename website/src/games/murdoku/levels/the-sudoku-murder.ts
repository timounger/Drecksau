/**
 * Der Sudoku-Mord: a house of nine rooms, three by three like a sudoku, with
 * a man murdered with a very thick sudoku book.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/68. Der Sudoku-Mord.JPG`,
 * solution sheet in `Lösungen 1-80/Lösung 65-68.JPG`). The page has no rule
 * under the magnifier.
 * Okko is the victim; whoever was alone with him killed him.
 *
 * Every room is a block of three by three fields. The armchairs are the
 * chairs; they, the beds and the rugs can be stood on. The tables, the TVs
 * and the plants cannot - not even the plant standing on the big rug in the
 * entrance. The windows are in the outer walls; being in front of one means
 * being on the field right next to it. "A room with a man and a woman" means
 * exactly two others were in Adonis's room, one man and one woman.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  alone,
  cellsWhere,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level, WallWindow } from "../engine/types";

/** The windows in the outer walls, with the field in front of each. */
const WINDOWS: readonly WallWindow[] = [
  { at: { row: 1, col: 0 }, side: "left" },
  { at: { row: 3, col: 0 }, side: "left" },
  { at: { row: 1, col: 8 }, side: "right" },
  { at: { row: 2, col: 8 }, side: "right" },
  { at: { row: 4, col: 8 }, side: "right" },
];

/** How many fields a room is wide and high. */
const ROOM_SIZE = 3;

/** Whether a field lies right in front of a window. */
function byWindow(cell: Cell): boolean {
  return WINDOWS.some(
    (one) => one.at.row === cell.row && one.at.col === cell.col,
  );
}

/** Whether a field is the middle one of its three-by-three room. */
function inMiddle(cell: Cell): boolean {
  return cell.row % ROOM_SIZE === 1 && cell.col % ROOM_SIZE === 1;
}

/** Whether exactly two others shared the suspect's room: a man and a woman. */
function withAManAndAWoman(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  return (
    others.length === 2 &&
    others.some((id) => c.has(id, "man")) &&
    others.some((id) => c.has(id, "woman"))
  );
}

/** Whether exactly one person lay on a bed, two columns east of the suspect. */
function twoWestOfTheOneOnABed(c: Context): boolean {
  const onBeds = c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "bed");
  });
  const there = onBeds.length === 1 ? c.cellOf(onBeds[0] ?? "") : undefined;
  return there !== undefined && there.col === c.cell.col + 2;
}

/** Whether a woman other than the suspect stood in front of a window. */
function aWomanByAWindow(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      c.has(id, "woman") &&
      there !== undefined &&
      byWindow(there)
    );
  });
}

/** Whether a bed stands two columns east of a field, anywhere in that column. */
function bedTwoColumnsEast(c: Context): boolean {
  return Array.from({ length: c.rows }, (_, row) => ({
    row,
    col: c.cell.col + 2,
  })).some((cell) => c.inside(cell) && c.is(cell, "bed"));
}

/** Whether a TV stood in the suspect's column, in another room. */
function tvInColumnElsewhere(c: Context): boolean {
  const here = c.areaOf(c.cell);
  return Array.from({ length: c.rows }, (_, row) => ({
    row,
    col: c.cell.col,
  })).some((cell) => c.is(cell, "tv") && c.areaOf(cell) !== here);
}

/** How many people stood in somebody's room, or zero while they are not placed. */
function roomSize(c: Context, id: string): number {
  const there = c.cellOf(id);
  return there === undefined ? 0 : c.peopleIn(c.areaOf(there) ?? "").length;
}

/**
 * For the solver only: Adonis's room never holds more than three, Brandon's
 * never more than him, Okko's never more than two, and nobody but one lies
 * on a bed.
 */
function stillPossible(c: Context): boolean {
  const onBeds = c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "bed");
  });
  return (
    roomSize(c, "A") <= 3 &&
    roomSize(c, "B") <= 1 &&
    roomSize(c, "O") <= 2 &&
    onBeds.length <= 1
  );
}

/** The case. */
export const THE_SUDOKU_MURDER: Level = {
  id: "the-sudoku-murder",
  name: "Der Sudoku-Mord",
  series: { book: "original", number: 68 },
  story:
    "Ich weiß, was du denkst, aber der Name kommt daher, dass das Opfer mit Das extrem dicke Sudoku-Buch erschlagen wurde.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#d6e4dc",
      label: { row: 2, col: 0 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#d8eaf0",
      label: { row: 2, col: 3 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#e2ecf2",
      label: { row: 2, col: 6 },
    },
    {
      key: "N",
      name: "Eingangsbereich",
      at: "im Eingangsbereich",
      ground: "floor",
      tint: "#ece8dc",
      label: { row: 5, col: 0 },
    },
    {
      key: "A",
      name: "Arbeitszimmer",
      at: "im Arbeitszimmer",
      ground: "floor",
      tint: "#e6e2f0",
      label: { row: 5, col: 3 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#ead8ec",
      label: { row: 5, col: 7 },
      labelEnd: true,
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#e2d8ec",
      label: { row: 8, col: 0 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#e8eef0",
      label: { row: 8, col: 3 },
    },
    {
      key: "L",
      name: "Keller",
      at: "im Keller",
      ground: "floor",
      tint: "#d8d0e0",
      label: { row: 8, col: 7 },
      labelEnd: true,
    },
  ],
  areaMap: [
    "BBBGGGEEE",
    "BBBGGGEEE",
    "BBBGGGEEE",
    "NNNAAAKKK",
    "NNNAAAKKK",
    "NNNAAAKKK",
    "SSSWWWLLL",
    "SSSWWWLLL",
    "SSSWWWLLL",
  ],
  thingMap: [
    ".trbbvctc",
    "ctr.tcct.",
    ".........",
    ".rrp.c..r",
    "rpr..pt..",
    ".rr.....r",
    "p...vtr.c",
    "cbb..tr..",
    ".bbp.c..p",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    r: "rug",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 0, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 6 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 2 }, rows: 2, cols: 1 },
  ],
  // The entrance rug, reaching out to the left in its middle row; the plant
  // stands on it.
  shapes: [
    [
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 4, col: 0 },
      { row: 4, col: 1 },
      { row: 4, col: 2 },
      { row: 5, col: 1 },
      { row: 5, col: 2 },
    ],
  ],
  windows: WINDOWS,
  suspects: [
    {
      id: "A",
      name: "Adonis",
      pronoun: "er",
      clue: {
        text: "Er war in einem Raum mit einem Mann und einer Frau.",
        ...counting(withAManAndAWoman),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Brandon",
      pronoun: "er",
      clue: {
        text: "Er war entweder im Schlafzimmer oder im Gästezimmer. Er war allein.",
        ...all(inArea("S", "G"), alone()),
      },
      colour: "#15803d",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "C",
      name: "Cora",
      pronoun: "sie",
      clue: {
        text: "Sie war zwei Spalten westlich von der einzigen Person auf einem Bett.",
        ...all(own(bedTwoColumnsEast), counting(twoWestOfTheOneOnABed)),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Daisy",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Teppich.", ...on("rug") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Emiko",
      pronoun: "sie",
      clue: {
        text: "Sie war entweder in der obersten oder der untersten Zeile.",
        ...own((c) => c.cell.row === 0 || c.cell.row === c.rows - 1),
        glow: (level) =>
          cellsWhere(level, (cell) => cell.row === 0 || cell.row === 8),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Franklin",
      pronoun: "er",
      clue: {
        text: "Er war vor einem Fenster, genau wie eine Frau.",
        ...all(
          own((c) => byWindow(c.cell)),
          counting(aWomanByAWindow),
        ),
        glow: (level) => cellsWhere(level, byWindow),
      },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Genji",
      pronoun: "er",
      clue: {
        text: "In seiner Spalte war ein Fernseher, aber in einem anderen Raum.",
        ...own(tvInColumnElsewhere),
      },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Hiltrud",
      pronoun: "sie",
      clue: {
        text: "Sie war im mittleren Feld ihres Raumes.",
        ...own((c) => inMiddle(c.cell)),
        glow: (level) => cellsWhere(level, inMiddle),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Okko",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  hints: [
    {
      text: "Die einzige Frau, die laut Franklins Hinweis vor einem Fenster sein kann, ist Cora, in C1. Das setzt Franklin in C9 und platziert jemanden auf dem Bett in C3. Schließe den Rest von C3 aus.",
      cross: [
        { row: 0, col: 2 },
        { row: 1, col: 2 },
        { row: 2, col: 2 },
        { row: 3, col: 2 },
        { row: 4, col: 2 },
        { row: 5, col: 2 },
        { row: 6, col: 2 },
      ],
    },
    {
      text: "Laut Coras Hinweis ist dies die einzige Person auf einem Bett, also schließe die anderen Betten aus. Das lokalisiert jemanden in R1 C7. Das setzt Daisy in C2, im Eingangsbereich.",
      cross: [
        { row: 0, col: 3 },
        { row: 0, col: 4 },
        { row: 7, col: 1 },
        { row: 8, col: 1 },
      ],
    },
    {
      text: "Adonis ist in einem Raum mit zwei Personen. Wo auch immer dieser Raum ist, jeder Raum in einer horizontalen oder vertikalen Linie damit muss leer sein. Also, da Daisy im Eingang ist, kann das Trio nicht im Badezimmer, Arbeitszimmer, Küche oder Schlafzimmer sein. Sie können auch nicht im Eingangsbereich, Wohnzimmer oder Keller sein (jemand ist im Schlafzimmer) oder im Gästezimmer (jemand ist in R1 C7). Sie sind im Esszimmer.",
    },
    {
      text: "Emiko muss die Frau in Adonis' Raum sein, in R1 C7, und Franklin ist am Fenster, was Adonis lokalisiert.",
      place: {
        E: { row: 0, col: 6 },
        F: { row: 1, col: 8 },
        A: { row: 2, col: 7 },
      },
    },
    {
      text: "Das lokalisiert Cora, dann Daisy. Genji muss in R9 C6 sein (nicht R5 C5, sonst gibt es keinen Platz für Hiltrud), was Hiltrud im Arbeitszimmer lokalisiert und Brandon im Schlafzimmer, dann Okko. Genji ist der Mörder!",
      place: {
        C: { row: 3, col: 0 },
        D: { row: 5, col: 1 },
        G: { row: 8, col: 5 },
        H: { row: 4, col: 4 },
        B: { row: 7, col: 2 },
        O: { row: 6, col: 3 },
      },
    },
  ],
  prune: stillPossible,
  solution: {
    A: { row: 2, col: 7 },
    B: { row: 7, col: 2 },
    C: { row: 3, col: 0 },
    D: { row: 5, col: 1 },
    E: { row: 0, col: 6 },
    F: { row: 1, col: 8 },
    G: { row: 8, col: 5 },
    H: { row: 4, col: 4 },
    O: { row: 6, col: 3 },
  },
};
