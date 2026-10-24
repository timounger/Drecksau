/**
 * Der Hafen: farm, house, market, town square, garden and dock of a small
 * port town, a frigate, a galleon and two sloops in the water, with a
 * murdered pirate.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/44.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Viper Tom is the victim; whoever was alone with him killed him. No
 * estates in this case.
 *
 * The map is eleven by eleven. The sea is the water with the four ships on
 * it; the land is everything else. Chairs and the bed can be stood on;
 * pigs (as the legend says), barrels, crates, ropes, shelves, flowers and
 * tables (one is the market counter) cannot.
 */
import {
  alone,
  all,
  beside,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The four ships. */
const SHIPS: readonly string[] = ["S", "G", "A", "B"];

/** The sea: the water and the ships on it. */
const SEA: readonly string[] = ["W", ...SHIPS];

/** The women of the case. */
const WOMEN: readonly string[] = ["D", "E", "F", "H", "I"];

/** Whether Bran's area held exactly him and one woman. */
function aloneWithAWoman(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  return others.length === 1 && WOMEN.includes(others[0] ?? "");
}

/** Whether somebody stood on land exactly one row south of the suspect. */
function landOneRowSouth(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined &&
      there.row === c.cell.row + 1 &&
      !SEA.includes(c.areaOf(there) ?? "")
    );
  });
}

/** How many people stand in somebody's area, them included; 0 while not placed. */
function crowdOf(c: Context, id: string): number {
  const there = c.cellOf(id);
  return there === undefined ? 0 : c.peopleIn(c.areaOf(there) ?? "").length;
}

/** Whether Bran's company so far is at most one woman. */
function branStillFits(c: Context): boolean {
  const bran = c.cellOf("B");
  const others =
    bran === undefined
      ? []
      : c.peopleIn(c.areaOf(bran) ?? "").filter((id) => id !== "B");
  return others.length <= 1 && others.every((id) => WOMEN.includes(id));
}

/** Whether the row south of Deena is still free or holds somebody on land. */
function deenaStillFits(c: Context): boolean {
  const deena = c.cellOf("D");
  return (
    deena === undefined ||
    c.people().every((id) => {
      const there = c.cellOf(id);
      return (
        there === undefined ||
        there.row !== deena.row + 1 ||
        !SEA.includes(c.areaOf(there) ?? "")
      );
    })
  );
}

/**
 * For the solver: whether a partial placement can still be finished - the
 * ones who were alone still are, Bran's company still fits, and so does the
 * row south of Deena.
 */
function stillPossible(c: Context): boolean {
  return (
    crowdOf(c, "A") <= 1 &&
    crowdOf(c, "F") <= 1 &&
    branStillFits(c) &&
    deenaStillFits(c)
  );
}

/** The case. */
export const THE_HARBOUR_TOWN: Level = {
  id: "the-harbour-town",
  name: "Der Hafen",
  series: { book: "timeTravel", number: 44 },
  story: "Willkommen in Port City, elf Einwohner. Korrektur: eher zehn.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "N",
      name: "Bauernhof",
      at: "auf dem Bauernhof",
      ground: "grass",
      label: { row: 1, col: 3 },
    },
    {
      key: "H",
      name: "Haus",
      at: "im Haus",
      ground: "floor",
      tint: "#e2d4ee",
      label: { row: 2, col: 9 },
    },
    {
      key: "K",
      name: "Markt",
      at: "auf dem Markt",
      ground: "floor",
      tint: "#dcdcf2",
      label: { row: 5, col: 2 },
    },
    {
      key: "P",
      name: "Dorfplatz",
      at: "auf dem Dorfplatz",
      ground: "stone",
      tint: "#ece8e0",
      label: { row: 5, col: 5 },
    },
    {
      key: "S",
      name: "Fregatte",
      at: "auf der Fregatte",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 5, col: 0 },
    },
    {
      key: "J",
      name: "Garten",
      at: "im Garten",
      ground: "grass",
      tint: "#cfe6d6",
      label: { row: 7, col: 9 },
    },
    {
      key: "M",
      name: "Steg",
      at: "auf dem Steg",
      ground: "floor",
      tint: "#e6d2d6",
      label: { row: 9, col: 6 },
    },
    {
      key: "G",
      name: "Galeone",
      at: "auf der Galeone",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 9, col: 3 },
    },
    {
      key: "A",
      name: "Schaluppe A",
      at: "auf Schaluppe A",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 9, col: 8 },
    },
    {
      key: "B",
      name: "Schaluppe B",
      at: "auf Schaluppe B",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 10, col: 6 },
    },
    {
      key: "W",
      name: "Wasser",
      at: "im Wasser",
      ground: "water",
      label: { row: 10, col: 2 },
    },
  ],
  areaMap: [
    "NNNNNNNHHHH",
    "NNNNNNPHHHH",
    "NNKKKPPHHHH",
    "SSKKKPPHPPH",
    "SSKKKPPPPPJ",
    "SSKKPPPPPPJ",
    "WWMMMMMPPJJ",
    "WWGGGGMPJJJ",
    "WWGGGGMMMMW",
    "WWGGGGMMAAW",
    "WWWWWWBBWWW",
  ],
  thingMap: [
    "...p...h.kd",
    ".p.....th.d",
    "...bk.....k",
    ".obtt.c...k",
    "p...t......",
    "..c.....c.f",
    "...b..b...b",
    "...o.c...f.",
    "...........",
    "b....o.....",
    "...........",
  ],
  things: {
    b: "barrel",
    c: "woodCrate",
    d: "bed",
    f: "flowers",
    h: "chair",
    k: "shelf",
    o: "rope",
    p: "pig",
    t: "table",
  },
  // The bed over two fields; the market counter round a corner.
  pieces: [{ at: { row: 0, col: 10 }, rows: 2, cols: 1 }],
  shapes: [
    [
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 4, col: 4 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Archibald",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Fass. Er war allein.",
        ...all(beside("barrel"), alone()),
      },
      colour: "#b91c1c",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Bran",
      pronoun: "er",
      clue: {
        text: "Er war im Meer. Er war allein mit einer Frau.",
        ...all(inArea(...SEA), counting(aloneWithAWoman)),
      },
      colour: "#15803d",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "C",
      name: "Caldas",
      pronoun: "er",
      clue: { text: "Er war auf dem Steg.", ...inArea("M") },
      colour: "#0e7490",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "D",
      name: "Deena",
      pronoun: "sie",
      clue: {
        text: "Sie war im Meer. Sie war genau eine Zeile nördlich von jemandem an Land.",
        ...all(inArea(...SEA), counting(landOneRowSouth)),
      },
      colour: "#6366f1",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "E",
      name: "Eira",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Schwein.", ...beside("pig") },
      colour: "#a16207",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Faye",
      pronoun: "sie",
      clue: {
        text: "Sie war allein auf einem Boot.",
        ...all(inArea(...SHIPS), alone()),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "G",
      name: "Gouverneur Smith",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#7c3aed",
      face: "\u{1F935}",
    },
    {
      id: "H",
      name: "Harmony",
      pronoun: "sie",
      clue: { text: "Sie war im Garten.", ...inArea("J") },
      colour: "#334155",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "I",
      name: "Isabella",
      pronoun: "sie",
      clue: { text: "Sie war auf dem Markt.", ...inArea("K") },
      colour: "#ea580c",
      face: "\u{1F475}",
    },
    {
      id: "J",
      name: "Jacobson",
      pronoun: "er",
      clue: { text: "Er war neben einer Kiste.", ...beside("woodCrate") },
      colour: "#0f766e",
      face: "\u{1F9D1}‍\u{1F9B1}",
    },
    {
      id: "V",
      name: "Viper Tom",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F9D4}",
    },
  ],
  prune: stillPossible,
  hints: [
    {
      text: "Archibald war allein und stand neben einem Fass. Auf dem Markt ist Isabella, auf dem Steg Caldas, im Garten Harmony - er steht also im Wasser, in R9 C1, R10 C2 oder R11 C1, und sonst ist niemand im Wasser. Er braucht C1 oder C2.",
    },
    {
      text: "Die Fregatte liegt nur in C1 und C2 - neben Archibald passt dort höchstens eine Person. Die Schaluppen liegen je in einer Zeile. Bran war mit einer Frau allein: zu zweit geht das nur auf der Galeone, und dorthin kann von den Frauen nur Deena (Eira steht neben einem Schwein, Faye allein, Harmony im Garten, Isabella auf dem Markt). Auf der Galeone stehen genau Bran und Deena.",
    },
    {
      text: "Deena steht auf der Galeone in R8 oder R9, genau eine Zeile über jemandem an Land - in den Zeilen 9 und 10 ist das nur der Steg. Bran, Deena und diese Person füllen die Zeilen 8 bis 10. Archibald steht damit in R11 C1. Faye ist nicht auf einer Schaluppe (Zeile 10 und 11 sind besetzt): Sie steht allein auf der Fregatte, in C2 - R5 C2 oder R6 C2. Eira steht also auf dem Bauernhof, in R1 C3, R1 C5, R2 C3 oder R2 C4.",
      place: { A: { row: 10, col: 0 } },
    },
    {
      text: "C3 bis C6 gehören Bran und Deena (Galeone), Eira (C3 bis C5) und Isabella (Markt, C3 oder C4). Caldas kann nicht in Zeile 7 stehen (der Steg liegt dort in C3 bis C7, R7 C7 ist ein Fass) - er ist die Person in Zeile 9 oder 10 unter Deena. Zeile 4 bleibt außerhalb von C1 bis C6 nur R4 C8, R4 C9 und R4 C10, und dort passt nur Viper Tom.",
    },
    {
      text: "In C11 kann nur Harmony stehen: R5 C11. Damit steht Faye in R6 C2. Eira und der Gouverneur füllen die Zeilen 1 und 2, für Isabella und Jacobson bleiben Zeile 3 und 7: Isabella steht in R3 C3, Jacobson in R7 C9.",
      place: {
        H: { row: 4, col: 10 },
        F: { row: 5, col: 1 },
        I: { row: 2, col: 2 },
        J: { row: 6, col: 8 },
      },
    },
    {
      text: "Der Gouverneur sitzt in R1 C8 (C9 ist Jacobsons Spalte), Eira steht in R2 C4. Viper Tom steht in R4 C10. Caldas bleibt C7: In R9 C7 stünde Deena in R8 C5, und Bran fände in C6 kein Feld - also steht Caldas in R10 C7, Bran in R8 C5 und Deena in R9 C6. Viper Tom war auf dem Dorfplatz allein mit Jacobson. Jacobson ist der Mörder!",
      place: {
        G: { row: 0, col: 7 },
        E: { row: 1, col: 3 },
        V: { row: 3, col: 9 },
        C: { row: 9, col: 6 },
        B: { row: 7, col: 4 },
        D: { row: 8, col: 5 },
      },
    },
  ],
  solution: {
    A: { row: 10, col: 0 },
    B: { row: 7, col: 4 },
    C: { row: 9, col: 6 },
    D: { row: 8, col: 5 },
    E: { row: 1, col: 3 },
    F: { row: 5, col: 1 },
    G: { row: 0, col: 7 },
    H: { row: 4, col: 10 },
    I: { row: 2, col: 2 },
    J: { row: 6, col: 8 },
    V: { row: 3, col: 9 },
  },
};
