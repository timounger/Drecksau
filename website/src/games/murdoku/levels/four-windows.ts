/**
 * Four Windows: a living room, a bedroom, a bathroom and a guest room, with a
 * murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Vier Fenster/Vier Fenster.png`, no
 * solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Olivia is the victim; whoever was alone with her killed her.
 *
 * The four windows sit in the side walls at the ends of the top and the bottom
 * row; standing in front of one means being on the corner field beside it.
 * The armchairs and the bed can be stood on; the TV, the plants and the dark
 * tables cannot. Sitting on a chair means being on an armchair. A field is
 * "beside a wall" when one of its sides lies on a room border or on the edge
 * of the map, and it is "in a corner" when two adjacent sides do.
 */
import { beside, on, own, victim } from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The case. */
export const FOUR_WINDOWS: Level = {
  id: "four-windows",
  name: "Vier Fenster",
  series: { book: "original", number: 4 },
  story:
    "Trotz all des Sonnenlichts geschahen hier zwielichtige Dinge. Olivia wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#f2cdb8",
      label: { row: 2, col: 1 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#eeeeb0",
      label: { row: 2, col: 3 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "stone",
      tint: "#f0cfa6",
      label: { row: 5, col: 1 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#f3d79a",
      label: { row: 5, col: 4 },
    },
  ],
  areaMap: ["WWWSSS", "WWWSSS", "WWWSSS", "BBBGGG", "BBBGGG", "BBBGGG"],
  thingMap: ["f....f", "cr.bbc", "..t...", "....p.", "tt..pc", "f.t..f"],
  things: {
    f: "window",
    c: "chair",
    r: "tv",
    b: "bed",
    t: "table",
    p: "plant",
  },
  extraThings: {
    window: { name: "Fenster", emoji: "\u{1FA9F}", standable: true },
  },
  suspects: [
    {
      id: "A",
      name: "Antonio",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke.",
        ...own((c) => isCorner(c, c.cell)),
      },
      colour: "#b91c1c",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "B",
      name: "Ben",
      pronoun: "er",
      traits: ["glasses"],
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Cathrin",
      pronoun: "sie",
      traits: ["glasses"],
      clue: { text: "Sie war vor einem Fenster.", ...on("window") },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Dahlia",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einer Wand.",
        ...own((c) => wallsOf(c, c.cell).length === 0),
      },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Emmy",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Pflanze.", ...beside("plant") },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "O",
      name: "Olivia",
      pronoun: "sie",
      traits: ["glasses"],
      clue: { text: "Sie war im letzten verbleibenden Feld.", ...victim() },
      colour: "#d97706",
      face: "\u{1F469}",
    },
  ],
  rules: [],
  hints: [
    {
      text: "Dahlia war nicht neben einer Wand. In jedem Zimmer liegt nur das mittlere Feld an keiner Wand: R2 C2 (Fernseher), R2 C5 (Bett), R5 C2 (Tisch) und R5 C5 (Pflanze). Nur auf das Bett kann man sich stellen - Dahlia war in R2 C5. Blockiere den Rest von R2 und C5.",
      place: { D: { row: 1, col: 4 } },
      cross: [
        { row: 1, col: 0 },
        { row: 1, col: 3 },
        { row: 1, col: 5 },
        { row: 0, col: 4 },
        { row: 2, col: 4 },
        { row: 5, col: 4 },
      ],
    },
    {
      text: "Ben saß auf einem Stuhl. Die Sessel in R2 C1 und R2 C6 liegen in der gesperrten R2, also saß Ben im Sessel in R5 C6. Blockiere den Rest von R5 und C6.",
      place: { B: { row: 4, col: 5 } },
      cross: [
        { row: 4, col: 2 },
        { row: 4, col: 3 },
        { row: 0, col: 5 },
        { row: 2, col: 5 },
        { row: 3, col: 5 },
        { row: 5, col: 5 },
      ],
    },
    {
      text: "Emmy war neben einer Pflanze. Neben den Pflanzen in R4 C5 und R5 C5 sind nur noch R4 C4 und R4 C6 frei, und C6 ist gesperrt: Emmy war in R4 C4. Blockiere den Rest von R4 und C4.",
      place: { E: { row: 3, col: 3 } },
      cross: [
        { row: 3, col: 0 },
        { row: 3, col: 1 },
        { row: 3, col: 2 },
        { row: 0, col: 3 },
        { row: 2, col: 3 },
        { row: 5, col: 3 },
      ],
    },
    {
      text: "Cathrin war vor einem Fenster. Die Fenster rechts liegen in der gesperrten C6, also bleiben R1 C1 und R6 C1. Frei sind nur noch die Reihen 1, 3 und 6 in C1 bis C3. Stünde Cathrin in R1 C1, blieben für Antonio und Olivia nur R3 und R6 in C2 und C3 - dort stehen in C3 Tische, und beide passen nicht in C2. Also steht Cathrin in R6 C1.",
      place: { C: { row: 5, col: 0 } },
      cross: [
        { row: 0, col: 0 },
        { row: 2, col: 0 },
        { row: 5, col: 1 },
      ],
    },
    {
      text: "Antonio war in einer Ecke. In R1 bleiben R1 C2 und R1 C3, und nur R1 C3 ist eine Ecke des Wohnzimmers - dort stand Antonio.",
      place: { A: { row: 0, col: 2 } },
    },
    {
      text: "Für Olivia bleibt das letzte Feld, R3 C2 im Wohnzimmer - allein mit Antonio. Antonio ist der Mörder!",
      place: { O: { row: 2, col: 1 } },
    },
  ],
  solution: {
    A: { row: 0, col: 2 },
    B: { row: 4, col: 5 },
    C: { row: 5, col: 0 },
    D: { row: 1, col: 4 },
    E: { row: 3, col: 3 },
    O: { row: 2, col: 1 },
  },
};

/**
 * The sides of a field that lie on a wall: a room border or the map's edge.
 *
 * @returns the steps towards those sides
 */
function wallsOf(c: Context, cell: Cell): readonly Cell[] {
  const steps: readonly Cell[] = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  return steps.filter((step) => {
    const next = { row: cell.row + step.row, col: cell.col + step.col };
    return !c.inside(next) || c.areaOf(next) !== c.areaOf(cell);
  });
}

/** Whether a field has walls on two adjacent sides - a corner of its room. */
function isCorner(c: Context, cell: Cell): boolean {
  const walls = wallsOf(c, cell);
  return (
    walls.some((step) => step.row !== 0) && walls.some((step) => step.col !== 0)
  );
}
