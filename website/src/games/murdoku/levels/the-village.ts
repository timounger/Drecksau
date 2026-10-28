/**
 * Das Dorf: a village at Adwari, Uganda - the village square, a clearing, a
 * shop and four houses, each a grid of its own - with a murdered villager.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 3 - Auf Weltreise/20. Das Dorf.png`,
 * no solution sheet - the solver proves the solution is the only one).
 * Opio is the victim; whoever was alone with him killed him.
 *
 * **Every grid is a map of its own**: one person per row and column of the
 * grid. The engine knows one map only, so the six grids are laid out corner
 * to corner along the diagonal of an eighteen by eighteen map, in the order
 * of the page ({@link GRIDS}): Haus A over the village square in rows and
 * columns 1-4, the shop in 5-7, the clearing in rows 8-10 and columns 8-9,
 * Haus B in 10-12 (rows 11-13), Haus C in rows 14-15 and columns 13-15, and
 * Haus D in 16-18. Then one person per row and column of the map is the
 * same as one per row and column of each grid, and "south" means the same
 * as on the page.
 *
 * The figures beside each grid say how many people fit into it: four into
 * Haus A with the village square, two into every other grid - as many as
 * its free rows and columns allow. Each grid is empty or full, and two are
 * empty ({@link emptyOrFull}).
 *
 * Beds and chairs can be stood on. The canisters, chickens, tables, shelves
 * and the bush cannot, as the empty grids on the page grey them out.
 */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The grids, by their first row and the row after their last, and how many fit in. */
const GRIDS: readonly {
  readonly from: number;
  readonly to: number;
  readonly capacity: number;
}[] = [
  { from: 0, to: 4, capacity: 4 },
  { from: 4, to: 7, capacity: 2 },
  { from: 7, to: 10, capacity: 2 },
  { from: 10, to: 13, capacity: 2 },
  { from: 13, to: 15, capacity: 2 },
  { from: 15, to: 18, capacity: 2 },
];

/** How many grids stay empty. */
const EMPTY_GRIDS = 2;

/** The houses. */
const HOUSES: readonly string[] = ["A", "B", "C", "D"];

/** Whether every grid is empty or full, and exactly two are empty. */
function emptyOrFull(c: Context): boolean {
  const counts = GRIDS.map(
    (grid) =>
      c.people().filter((id) => {
        const there = c.cellOf(id);
        return (
          there !== undefined && there.row >= grid.from && there.row < grid.to
        );
      }).length,
  );
  return (
    counts.every((count, at) => count === 0 || count === GRIDS[at].capacity) &&
    counts.filter((count) => count === 0).length === EMPTY_GRIDS
  );
}

/** How many people sat on a chair. */
function onChairs(c: Context): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "chair");
  }).length;
}

/** Whether a woman stood in the suspect's area, south of the suspect. */
function withAWomanSouth(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      c.has(id, "woman") &&
      there !== undefined &&
      there.row > c.cell.row
    );
  });
}

/** Whether somebody stood in the same area as the suspect. */
function together(id: string): (c: Context) => boolean {
  return (c) => {
    const there = c.cellOf(id);
    return there !== undefined && c.areaOf(there) === c.areaOf(c.cell);
  };
}

/** The case. */
export const THE_VILLAGE: Level = {
  id: "the-village",
  name: "Das Dorf",
  series: { book: "worldTravel", number: 20 },
  story: "Diesmal müssen wir uns beim Durchsuchen des Geländes aufteilen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Haus A",
      at: "in Haus A",
      ground: "floor",
      tint: "#d9b9a0",
      label: { row: 1, col: 2 },
    },
    {
      key: "P",
      name: "Dorfplatz",
      at: "auf dem Dorfplatz",
      ground: "sand",
      tint: "#e6c99a",
      label: { row: 3, col: 1 },
    },
    {
      key: "L",
      name: "Laden",
      at: "im Laden",
      ground: "floor",
      tint: "#d2b48c",
      label: { row: 6, col: 5 },
    },
    {
      key: "I",
      name: "Lichtung",
      at: "auf der Lichtung",
      ground: "grass",
      tint: "#9cc56f",
      label: { row: 9, col: 7 },
    },
    {
      key: "B",
      name: "Haus B",
      at: "in Haus B",
      ground: "floor",
      tint: "#d9b9a0",
      label: { row: 12, col: 10 },
    },
    {
      key: "C",
      name: "Haus C",
      at: "in Haus C",
      ground: "floor",
      tint: "#d9b9a0",
      label: { row: 14, col: 13 },
    },
    {
      key: "D",
      name: "Haus D",
      at: "in Haus D",
      ground: "floor",
      tint: "#d9b9a0",
      label: { row: 17, col: 16 },
    },
  ],
  areaMap: [
    "AAAA..............",
    "AAAA..............",
    "PPPP..............",
    "PPPP..............",
    "....LLL...........",
    "....LLL...........",
    "....LLL...........",
    ".......II.........",
    ".......II.........",
    ".......II.........",
    ".........BB.......",
    ".........BBB......",
    ".........BBB......",
    "............CCC...",
    "............CCC...",
    "...............DDD",
    "...............DDD",
    "................DD",
  ],
  thingMap: [
    "bt................",
    "bs................",
    ".k.h..............",
    "..h...............",
    "....kc............",
    "....ttk...........",
    "....s.............",
    "..................",
    "..................",
    ".......kw.........",
    ".........ks.......",
    ".........bct......",
    ".........b.s......",
    "............sb....",
    "............tbc...",
    "...............tsk",
    "...............k..",
    "................bb",
  ],
  things: {
    b: "bed",
    c: "chair",
    h: "chicken",
    k: "canister",
    s: "shelf",
    t: "table",
    w: "shrub",
  },
  extraThings: {
    canister: { name: "Kanister", emoji: "\u{1FAD9}", standable: false },
    chicken: {
      name: "Huhn",
      emoji: "\u{1F414}",
      standable: false,
      kinds: ["animal"],
    },
  },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 11, col: 9 }, rows: 2, cols: 1 },
    { at: { row: 13, col: 13 }, rows: 2, cols: 1 },
    { at: { row: 17, col: 16 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Akello",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Kanister.", ...beside("canister") },
      colour: "#ca8a04",
      face: "\u{1F469}\u{1F3FF}",
    },
    {
      id: "B",
      name: "Bbosa",
      pronoun: "er",
      clue: { text: "Er war nicht in einem Haus.", ...not(inArea(...HOUSES)) },
      colour: "#c2410c",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "C",
      name: "Catherine",
      pronoun: "sie",
      clue: {
        text: "Sie war mit Godfrey zusammen.",
        ...about(["G"], together("G")),
      },
      colour: "#15803d",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "D",
      name: "Deo",
      pronoun: "er",
      clue: {
        text: "Er war auf dem Dorfplatz. Er war nicht neben einem Huhn.",
        ...all(inArea("P"), not(beside("chicken"))),
      },
      colour: "#1d4ed8",
      face: "\u{1F60E}",
    },
    {
      id: "E",
      name: "Eseza",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Regal und neben einem Tisch.",
        ...all(beside("shelf"), beside("table")),
      },
      colour: "#0e7490",
      face: "\u{1F469}\u{1F3FF}\u{200D}\u{1F9B1}",
    },
    {
      id: "F",
      name: "Fred",
      pronoun: "er",
      clue: {
        text: "Er war mit einer Frau zusammen, die südlich von ihm war.",
        ...counting(withAWomanSouth),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}\u{1F3FE}",
    },
    {
      id: "G",
      name: "Godfrey",
      pronoun: "er",
      clue: {
        text: "Er war auf einem Bett und neben einem Regal.",
        ...all(on("bed"), beside("shelf")),
      },
      colour: "#16a34a",
      face: "\u{1F468}\u{1F3FF}\u{200D}\u{1F9B1}",
    },
    {
      id: "H",
      name: "Henry",
      pronoun: "er",
      clue: {
        text: "Er war mit Eseza zusammen.",
        ...about(["E"], together("E")),
      },
      colour: "#78716c",
      face: "\u{1F9D1}\u{1F3FF}",
    },
    {
      id: "I",
      name: "Illa",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Tisch.", ...beside("table") },
      colour: "#65a30d",
      face: "\u{1F469}\u{1F3FE}\u{200D}\u{1F9B1}",
    },
    {
      id: "O",
      name: "Opio",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}\u{1F3FF}",
    },
  ],
  rules: [
    {
      text: "Es saß genau eine Person auf einem Stuhl.",
      check: (c) => onChairs(c) === 1,
      prune: (c) => onChairs(c) <= 1,
    },
    {
      text: "Leere Raster: Diese zehn Personen verteilen sich auf sechs Raster. Zwei Raster sind leer.",
      check: emptyOrFull,
    },
    {
      note: true,
      text: "Die Anzahl der Symbole zeigt an, wie viele Personen in jedes Raster passen. Jedes Raster ist entweder leer oder komplett gefüllt.",
    },
  ],
  hints: [
    {
      text: "Haus A mit dem Dorfplatz (R1 bis R4) ist voll: Wäre es leer, müssten die zehn Personen alle fünf übrigen Raster füllen - dann wäre nur eines leer. Also sind dort vier Personen und von den fünf kleinen Rastern genau drei voll.",
    },
    {
      text: "Deo steht auf dem Dorfplatz, nicht neben einem Huhn: nur R3 C1 oder R4 C1. In C2 ist in Haus A und auf dem Dorfplatz nur R4 C2 frei - dort muss jemand stehen, also steht Deo in R3 C1. Die anderen beiden stehen in Haus A in R1 und R2, in C3 und C4.",
      place: { D: { row: 2, col: 0 } },
    },
    {
      text: "Godfrey war auf einem Bett neben einem Regal: Das Bett in Haus A liegt in Deos Spalte, an den Betten in Haus B und Haus D steht kein Regal, auch nicht an R15 C14 - es bleibt R14 C14 in Haus C. Catherine war mit ihm zusammen: Im vollen Haus C bleibt R15 C15, der Stuhl. Da nur eine Person auf einem Stuhl saß, bleiben die Stühle in R5 C6 und R12 C11 leer.",
      place: { G: { row: 13, col: 13 }, C: { row: 14, col: 14 } },
    },
    {
      text: "Eseza war neben einem Regal und einem Tisch. Das gilt nur für R7 C6 im Laden (und den leeren Stuhl in R12 C11). Henry war mit ihr zusammen: Im Laden bleibt ihm R5 C7.",
      place: { E: { row: 6, col: 5 }, H: { row: 4, col: 6 } },
    },
    {
      text: "Illa war neben einem Tisch. Außer Esezas Feld und den leeren Stühlen liegt nur R1 C3 in Haus A neben einem Tisch - dort steht Illa.",
      place: { I: { row: 0, col: 2 } },
    },
    {
      text: "Fred war mit einer Frau zusammen, die südlich von ihm war. In Haus A wäre Illa nördlich von ihm, auf dem Dorfplatz ist nur Deo. Fred füllt also das dritte kleine Raster mit Akello südlich von ihm, neben einem Kanister: In Haus B und Haus D liegt das südliche Feld an keinem Kanister, auf der Lichtung ist es R9 C8. Akello steht dort, Fred in R8 C9.",
      place: { A: { row: 8, col: 7 }, F: { row: 7, col: 8 } },
    },
    {
      text: "Bbosa war nicht in einem Haus: Er steht in R4 C2 auf dem Dorfplatz. Für Opio bleibt R2 C4 in Haus A - allein mit Illa. Illa ist die Mörderin!",
      place: { B: { row: 3, col: 1 }, O: { row: 1, col: 3 } },
    },
  ],
  solution: {
    A: { row: 8, col: 7 },
    B: { row: 3, col: 1 },
    C: { row: 14, col: 14 },
    D: { row: 2, col: 0 },
    E: { row: 6, col: 5 },
    F: { row: 7, col: 8 },
    G: { row: 13, col: 13 },
    H: { row: 4, col: 6 },
    I: { row: 0, col: 2 },
    O: { row: 1, col: 3 },
  },
};
