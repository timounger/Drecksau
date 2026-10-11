/**
 * The Bandit Raid: two royal coaches on a road between two fields, bandits
 * hiding among the travellers and a murdered escort.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Der Banditenüberfall/Der Banditenüberfall.png`,
 * no solution sheet). The book's rule for crowned areas (nobles - the purple
 * cards - only there) makes it unique, with the culprit
 * pencilled in on the photographed page.
 * Ortimer is the victim; whoever was alone with him killed him. The map has
 * nine rows but only seven people, so two rows stay empty.
 *
 * Every seat in the coaches is a chair. A field is in a corner of its area
 * when the area's border runs along two of its sides that meet: one above or
 * below it, one to its left or right. Chairs and the horses can be stood on;
 * pots, crates, trees, bushes and boulders cannot.
 */
import {
  about,
  all,
  beside,
  cellsWhere,
  counting,
  nobility,
  on,
  own,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** Whether a field lies in a corner of its area, given the area of each field. */
function inCorner(areaOf: (cell: Cell) => string | null, cell: Cell): boolean {
  const area = areaOf(cell);
  const outside = (row: number, col: number): boolean =>
    areaOf({ row, col }) !== area;
  const vertical =
    outside(cell.row - 1, cell.col) || outside(cell.row + 1, cell.col);
  const horizontal =
    outside(cell.row, cell.col - 1) || outside(cell.row, cell.col + 1);
  return vertical && horizontal;
}

/** Whether nobody but the suspect sits on a chair. */
function onlyOneOnAChair(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "chair");
  });
}

/** The case. */
export const THE_BANDIT_RAID: Level = {
  id: "the-bandit-raid",
  name: "Der Banditenüberfall",
  series: { book: "timeTravel", number: 2 },
  story:
    "Kann man denn nicht mal mehr in Ruhe mit königlichem Geleit über Land reisen?",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Westfeld",
      at: "im Westfeld",
      ground: "grass",
      tint: "#a9cf8e",
      label: { row: 8, col: 1 },
    },
    {
      key: "R",
      name: "Straße",
      at: "auf der Straße",
      ground: "stone",
      tint: "#d8c3a2",
      label: { row: 8, col: 4 },
    },
    {
      key: "N",
      name: "Nördliche Kutsche",
      at: "in der nördlichen Kutsche",
      ground: "floor",
      tint: "#c9b2e6",
      label: { row: 2, col: 2 },
    },
    {
      key: "S",
      name: "Südliche Kutsche",
      at: "in der südlichen Kutsche",
      ground: "floor",
      tint: "#c9b2e6",
      label: { row: 6, col: 3 },
    },
    {
      key: "O",
      name: "Ostfeld",
      at: "im Ostfeld",
      ground: "grass",
      tint: "#b5d69b",
      label: { row: 3, col: 4 },
    },
  ],
  areaMap: [
    "WRNNOOO",
    "WRNNOOO",
    "WRNNOOO",
    "WRRROOO",
    "WWRSSOO",
    "WWRSSOO",
    "WWRSSOO",
    "WWRRRRO",
    "WWWRRRO",
  ],
  thingMap: [
    "..pc..b",
    "..k....",
    "h.cctu.",
    "...h...",
    "..hcp..",
    "tu....b",
    "...k...",
    "b...h..",
    "......b",
  ],
  things: {
    b: "boulder",
    c: "chair",
    h: "horse",
    k: "crate",
    p: "pot",
    t: "tree",
    u: "bush",
  },
  extraThings: {
    horse: {
      name: "Pferd",
      emoji: "\u{1F40E}",
      standable: true,
      kinds: ["seat", "animal"],
    },
    pot: { name: "Topf", emoji: "\u{1F3FA}", standable: false },
    bush: {
      name: "Busch",
      emoji: "\u{1F33F}",
      standable: false,
      kinds: ["plant"],
    },
  },
  suspects: [
    {
      id: "A",
      name: "Arthur",
      pronoun: "er",
      clue: { text: "Er war auf einem Pferd.", ...on("horse") },
      colour: "#b91c1c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "B",
      name: "Baldwin",
      pronoun: "er",
      clue: { text: "Er war neben einem Baum.", ...beside("tree") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Cyril",
      pronoun: "er",
      clue: { text: "Er war neben einem Busch.", ...beside("bush") },
      colour: "#0e7490",
      face: "\u{1F474}",
    },
    {
      id: "D",
      name: "Dorothea",
      pronoun: "sie",
      clue: {
        text: "Sie war nördlich von Cyril.",
        ...about(["C"], (c) => {
          const cyril = c.cellOf("C");
          return cyril !== undefined && c.cell.row < cyril.row;
        }),
      },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Eleonore",
      pronoun: "sie",
      traits: ["noble"],
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOnAChair)),
      },
      colour: "#7c3aed",
      face: "\u{1F478}",
    },
    {
      id: "F",
      name: "Fulbert",
      pronoun: "er",
      traits: ["noble"],
      clue: {
        text: "Er war in einer Ecke seines Bereichs.",
        ...own((c) => inCorner(c.areaOf, c.cell)),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#9f1239",
      face: "\u{1F934}",
    },
    {
      id: "O",
      name: "Ortimer",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  rules: [
    nobility("Adlige (\u{1F451}) waren nur in den Kutschen.", ["N", "S"]),
    {
      note: true,
      text: "Dieser Tatort ist wirklich weitläufig. Das liegt daran, dass es zwei leere Reihen gibt.",
    },
  ],
  hints: [
    {
      text: "Eleonore und Fulbert sind adlig, also in den Kutschen. Eleonore ist die Einzige auf einem Stuhl, also steht Fulbert in einer Kutschen-Ecke ohne Stuhl. Das ist nur R7 C5.",
      place: { F: { row: 6, col: 4 } },
    },
    {
      text: "In C7 können nur Cyril, Dorothea oder Ortimer stehen, in C2 und C6 nur sie oder Fulbert - und Fulbert ist in C5. Also füllen Cyril, Dorothea und Ortimer C2, C6 und C7. Für Baldwin bleibt nur C1: R5 C1 neben dem Baum.",
      place: { B: { row: 4, col: 0 } },
    },
    {
      text: "Arthur kann nicht mehr auf R3 C1, R5 C3 oder R8 C5 - er steht auf dem Pferd in R4 C4. Damit sitzt Eleonore auf dem Stuhl in R3 C3.",
      place: { A: { row: 3, col: 3 }, E: { row: 2, col: 2 } },
    },
    {
      text: "Neben einem Busch bleibt für Cyril nur R2 C6. Dorothea muss nördlich von ihm sein, also in R1 - auf R1 C2.",
      place: { C: { row: 1, col: 5 }, D: { row: 0, col: 1 } },
    },
    {
      text: "Für Ortimer bleibt nur R8 C7 im Ostfeld. Er war allein mit Cyril - Cyril ist der Mörder!",
      place: { O: { row: 7, col: 6 } },
    },
  ],
  solution: {
    A: { row: 3, col: 3 },
    B: { row: 4, col: 0 },
    C: { row: 1, col: 5 },
    D: { row: 0, col: 1 },
    E: { row: 2, col: 2 },
    F: { row: 6, col: 4 },
    O: { row: 7, col: 6 },
  },
};
