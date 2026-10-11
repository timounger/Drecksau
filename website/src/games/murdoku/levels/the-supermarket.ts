/**
 * The Supermarket: the checkout, a store room, the fridges, the snacks and the
 * drinks aisles, with a murdered shopper.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Der Supermarkt/Der Supermarkt.png`, no
 * solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Ottilie is the victim; whoever was alone with her killed her.
 *
 * The four windows sit in the left wall; standing in front of one means being
 * on the field right beside it. The two green rugs can be stood on; the
 * shelves, the tables, the crates, the radios and the cash register cannot. A
 * field is "in a corner" when walls - an area border or the edge of the map -
 * run along two adjacent sides of it.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  beside,
  column,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The case. */
export const THE_SUPERMARKET: Level = {
  id: "the-supermarket",
  name: "Der Supermarkt",
  series: { book: "original", number: 15 },
  story: "Hier wirst du immer fündig ... oder ermordet.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Kasse",
      at: "an der Kasse",
      ground: "floor",
      tint: "#f4e2d6",
      label: { row: 2, col: 0 },
    },
    {
      key: "L",
      name: "Lagerraum",
      at: "im Lagerraum",
      ground: "stone",
      tint: "#d8d4d6",
      label: { row: 2, col: 5 },
    },
    {
      key: "R",
      name: "Kühlregale",
      at: "bei den Kühlregalen",
      ground: "stone",
      tint: "#b4c8ee",
      label: { row: 6, col: 7 },
    },
    {
      key: "S",
      name: "Snacks",
      at: "bei den Snacks",
      ground: "floor",
      tint: "#f6dcb8",
      label: { row: 8, col: 2 },
    },
    {
      key: "G",
      name: "Getränke",
      at: "bei den Getränken",
      ground: "floor",
      tint: "#f2d2c0",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "KKKKKLLLL",
    "KKKKKLLLL",
    "KKKKKLLRR",
    "SSSSSGGRR",
    "SSSSSGGRR",
    "SSSSSGGRR",
    "SSSSSGGRR",
    "SSSSSGGGG",
    "SSSSSGGGG",
  ],
  thingMap: [
    ".msst...x",
    ".....x...",
    "..tkt..ss",
    "..rr.....",
    "fs.rs.s.s",
    "fssrmrs.s",
    ".ttr.rrs.",
    "ft.r.rtts",
    "f.......x",
  ],
  things: {
    f: "window",
    k: "cashRegister",
    m: "radio",
    r: "rug",
    s: "shelf",
    t: "table",
    x: "crate",
  },
  extraThings: {
    window: { name: "Fenster", emoji: "\u{1FA9F}", standable: true },
    cashRegister: { name: "Kasse", emoji: "\u{1F4B5}", standable: false },
    radio: { name: "Radio", emoji: "\u{1F4FB}", standable: false },
  },
  shapes: [
    [
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 4, col: 3 },
      { row: 5, col: 3 },
      { row: 6, col: 3 },
      { row: 7, col: 3 },
    ],
    [
      { row: 6, col: 1 },
      { row: 6, col: 2 },
      { row: 7, col: 1 },
    ],
    [
      { row: 5, col: 5 },
      { row: 6, col: 5 },
      { row: 7, col: 5 },
      { row: 6, col: 6 },
    ],
  ],
  pieces: [{ at: { row: 7, col: 6 }, rows: 1, cols: 2 }],
  windows: [
    { at: { row: 4, col: 0 }, side: "left" },
    { at: { row: 5, col: 0 }, side: "left" },
    { at: { row: 7, col: 0 }, side: "left" },
    { at: { row: 8, col: 0 }, side: "left" },
  ],
  suspects: [
    {
      id: "A",
      name: "Anton",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Teppich.",
        ...all(
          on("rug"),
          counting(
            (c) =>
              c.people().filter((id) => {
                const at = c.cellOf(id);
                return at !== undefined && c.is(at, "rug");
              }).length === 1,
          ),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Bärbel",
      pronoun: "sie",
      clue: {
        text: "Sie war in der Snacks-Abteilung. Sie war neben einem Tisch.",
        ...all(inArea("S"), beside("table")),
      },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "C",
      name: "Camilla",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke.",
        ...own((c) => isCorner(c, c.cell)),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dylan",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einem Regal, einem Tisch oder einer Kiste.",
        ...all(
          not(beside("shelf")),
          not(beside("table")),
          not(beside("crate")),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Eileen",
      pronoun: "sie",
      clue: {
        text: "Sie war in der Getränke-Abteilung. Sie war nicht mit Anton zusammen.",
        ...all(inArea("G"), {
          uses: ["A"],
          check: (c: Context) => {
            const anton = c.cellOf("A");
            return anton === undefined || c.areaOf(anton) !== "G";
          },
        }),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Fred",
      pronoun: "er",
      clue: { text: "Er war in der letzten Spalte.", ...column(9) },
      colour: "#9f1239",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Gwen",
      pronoun: "sie",
      clue: { text: "Sie war vor einem Fenster.", ...on("window") },
      colour: "#ea580c",
      face: "\u{1F469}",
    },
    {
      id: "H",
      name: "Hanno",
      pronoun: "er",
      clue: { text: "Er war neben der Kasse.", ...beside("cashRegister") },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "O",
      name: "Ottilie",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}‍\u{1F9B1}",
    },
  ],
  rules: [],
  hints: [
    {
      text: "Hanno war neben der Kasse in R3 C4. Links und rechts davon stehen Tische, und R4 C4 gehört schon zu den Snacks. Hanno war in R2 C4. Blockiere den Rest von R2 und C4.",
      place: { H: { row: 1, col: 3 } },
      cross: [
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 4 },
        { row: 1, col: 5 },
        { row: 1, col: 6 },
        { row: 1, col: 7 },
        { row: 1, col: 8 },
        { row: 0, col: 3 },
        { row: 2, col: 3 },
        { row: 3, col: 3 },
        { row: 4, col: 3 },
        { row: 5, col: 3 },
        { row: 6, col: 3 },
        { row: 7, col: 3 },
        { row: 8, col: 3 },
      ],
    },
    {
      text: "Gwen war vor einem Fenster. Alle vier Fenster liegen in der linken Wand, vor R5 C1, R6 C1, R8 C1 und R9 C1. C1 gehört also Gwen - blockiere die übrigen Felder von C1.",
      cross: [
        { row: 0, col: 0 },
        { row: 2, col: 0 },
        { row: 3, col: 0 },
        { row: 6, col: 0 },
      ],
    },
    {
      text: "Anton war die einzige Person auf einem Teppich. Eileen war bei den Getränken, aber nicht mit Anton zusammen - Anton war also nicht auf dem Teppich bei den Getränken. Vom Teppich bei den Snacks ist nur R4 C3 nicht in der gesperrten C4: Dort war Anton. Blockiere den Rest von R4 und C3.",
      place: { A: { row: 3, col: 2 } },
      cross: [
        { row: 3, col: 1 },
        { row: 3, col: 4 },
        { row: 3, col: 5 },
        { row: 3, col: 6 },
        { row: 3, col: 7 },
        { row: 3, col: 8 },
        { row: 0, col: 2 },
        { row: 2, col: 2 },
        { row: 4, col: 2 },
        { row: 5, col: 2 },
        { row: 6, col: 2 },
        { row: 7, col: 2 },
        { row: 8, col: 2 },
      ],
    },
    {
      text: "Fred war in der letzten Spalte. In C9 stehen Kisten und Regale; frei sind nur R2 C9, R4 C9 und R7 C9, und R2 und R4 sind gesperrt. Fred war in R7 C9. Blockiere den Rest von R7 und C9.",
      place: { F: { row: 6, col: 8 } },
      cross: [
        { row: 6, col: 1 },
        { row: 6, col: 4 },
        { row: 6, col: 5 },
        { row: 6, col: 6 },
        { row: 6, col: 7 },
        { row: 0, col: 8 },
        { row: 2, col: 8 },
        { row: 4, col: 8 },
        { row: 5, col: 8 },
        { row: 7, col: 8 },
        { row: 8, col: 8 },
      ],
    },
    {
      text: "Bärbel war bei den Snacks neben einem Tisch. Neben den Tischen in R7 C2, R7 C3 und R8 C2 sind R7 C1 und R8 C1 in Gwens C1, R7 C4 und R8 C3 gesperrt. Bärbel war in R9 C2. Blockiere den Rest von R9 und C2.",
      place: { B: { row: 8, col: 1 } },
      cross: [
        { row: 8, col: 0 },
        { row: 8, col: 4 },
        { row: 8, col: 5 },
        { row: 8, col: 6 },
        { row: 8, col: 7 },
        { row: 0, col: 1 },
        { row: 2, col: 1 },
        { row: 4, col: 1 },
        { row: 5, col: 1 },
        { row: 7, col: 1 },
      ],
    },
    {
      text: "Eileen war bei den Getränken. Auf einen Teppich darf sie nicht, das ist Antons Platz. Frei bleibt nur R5 C6 - dort war Eileen. Blockiere den Rest von R5 und C6.",
      place: { E: { row: 4, col: 5 } },
      cross: [
        { row: 4, col: 0 },
        { row: 4, col: 4 },
        { row: 4, col: 6 },
        { row: 4, col: 7 },
        { row: 0, col: 5 },
        { row: 2, col: 5 },
        { row: 5, col: 5 },
        { row: 7, col: 5 },
      ],
    },
    {
      text: "In R3 ist nur noch R3 C7 im Lagerraum frei, also stand dort jemand - blockiere den Rest von C7. Damit bleibt in R1 nur R1 C8, ebenfalls im Lagerraum; blockiere den Rest von C8.",
      cross: [
        { row: 2, col: 4 },
        { row: 2, col: 7 },
        { row: 0, col: 6 },
        { row: 5, col: 6 },
        { row: 7, col: 6 },
        { row: 0, col: 4 },
        { row: 5, col: 7 },
        { row: 7, col: 7 },
      ],
    },
    {
      text: "Übrig sind R6 und R8 in C1 und C5. R6 C5 ist ein Radio, also stand jemand in R8 C5 und Gwen vor dem Fenster in R6 C1.",
      place: { G: { row: 5, col: 0 } },
    },
    {
      text: "Camilla war in einer Ecke: Von R1 C8, R3 C7 und R8 C5 ist nur R3 C7 eine Ecke. Dylan war neben keiner Kiste, also nicht in R1 C8 neben der Kiste in R1 C9 - er war in R8 C5. Ottilie blieb R1 C8 - im Lagerraum allein mit Camilla. Camilla ist die Mörderin!",
      place: {
        C: { row: 2, col: 6 },
        D: { row: 7, col: 4 },
        O: { row: 0, col: 7 },
      },
    },
  ],
  solution: {
    A: { row: 3, col: 2 },
    B: { row: 8, col: 1 },
    C: { row: 2, col: 6 },
    D: { row: 7, col: 4 },
    E: { row: 4, col: 5 },
    F: { row: 6, col: 8 },
    G: { row: 5, col: 0 },
    H: { row: 1, col: 3 },
    O: { row: 0, col: 7 },
  },
};

/**
 * The sides of a field that lie on a wall: an area border or the map's edge.
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

/** Whether a field has walls on two adjacent sides - a corner of its area. */
function isCorner(c: Context, cell: Cell): boolean {
  const walls = wallsOf(c, cell);
  return (
    walls.some((step) => step.row !== 0) && walls.some((step) => step.col !== 0)
  );
}
