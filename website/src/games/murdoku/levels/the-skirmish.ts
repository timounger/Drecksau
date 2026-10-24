/**
 * Das Gefecht: a pirate ship boarding a merchant ship between two islands,
 * and a boatswain nobody stood up for.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/36.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Vakham is the victim; whoever was alone with him killed him. No estates
 * in this case.
 *
 * The map is eight by eight. A ship's bottom row is its southernmost row of
 * fields. Blood puddles and rafts can be stood on; barrels, the crate,
 * cannons, the rope, palms and sharks cannot.
 */

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

/** The two ships. */
const SHIPS: readonly string[] = ["M", "P"];

/** Whether exactly one person stood on a thing of this id. */
function onlyOneOn(c: Context, what: string): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, what);
    }).length === 1
  );
}

/** Whether somebody stood on a raft exactly one row north of the suspect. */
function raftOneRowNorth(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined && there.row === c.cell.row - 1 && c.is(there, "raft")
    );
  });
}

/** Whether a field is in the bottom row of a ship. */
function bottomOfShip(c: Context): boolean {
  const area = c.areaOf(c.cell) ?? "";
  return (
    SHIPS.includes(area) &&
    c.areaOf({ row: c.cell.row + 1, col: c.cell.col }) !== area
  );
}

/** The case. */
export const THE_SKIRMISH: Level = {
  id: "the-skirmish",
  name: "Das Gefecht",
  series: { book: "timeTravel", number: 36 },
  story:
    "Wie ich vermutet hatte: Niemand hat sich für den Bootsmann eingesetzt.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "N",
      name: "Nordinsel",
      at: "auf der Nordinsel",
      ground: "grass",
      label: { row: 1, col: 0 },
    },
    {
      key: "W",
      name: "Wasser",
      at: "im Wasser",
      ground: "water",
      label: { row: 4, col: 7 },
    },
    {
      key: "M",
      name: "Handelsschiff",
      at: "auf dem Handelsschiff",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 3, col: 5 },
    },
    {
      key: "P",
      name: "Piratenschiff",
      at: "auf dem Piratenschiff",
      ground: "floor",
      tint: "#e6d2cf",
      label: { row: 6, col: 2 },
    },
    {
      key: "S",
      name: "Südinsel",
      at: "auf der Südinsel",
      ground: "grass",
      label: { row: 7, col: 4 },
    },
  ],
  areaMap: [
    "NNNWWWWW",
    "NNWMMMMW",
    "WWWMMMMW",
    "WWWMMMMW",
    "WWPPPPWW",
    "WWPPPPWS",
    "WWPPPPSS",
    "WSSSSSSS",
  ],
  thingMap: [
    ".p...k..",
    "...d..d.",
    "dr.bc.b.",
    ".....bb.",
    "...on...",
    "k..d....",
    "r...n...",
    ".p....p.",
  ],
  things: {
    b: "barrel",
    c: "woodCrate",
    d: "blood",
    k: "shark",
    n: "cannon",
    o: "rope",
    p: "palm",
    r: "raft",
  },
  suspects: [
    {
      id: "A",
      name: "Ashford",
      pronoun: "er",
      clue: {
        text: "Jemand war auf einem Floß genau eine Zeile nördlich von ihm.",
        ...counting(raftOneRowNorth),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Bart",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person in einer Blutlache.",
        ...all(
          on("blood"),
          counting((c) => onlyOneOn(c, "blood")),
        ),
      },
      colour: "#15803d",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Clara",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Kanone.", ...beside("cannon") },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "D",
      name: "Dorian",
      pronoun: "er",
      clue: { text: "Er war auf einer Insel.", ...inArea("N", "S") },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Esme",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Hai.", ...beside("shark") },
      colour: "#a16207",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "F",
      name: "Freya",
      pronoun: "sie",
      clue: {
        text: "Sie war in der untersten Zeile eines Schiffs.",
        ...own(bottomOfShip),
      },
      colour: "#be185d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "Gideon",
      pronoun: "er",
      clue: { text: "Er war neben einem Fass.", ...beside("barrel") },
      colour: "#7c3aed",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "V",
      name: "Vakham",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Ashford steht eine Zeile südlich eines besetzten Floßes, also in Zeile 4 oder 8. Auf das Floß in R3 C2 passt nur Vakham. Stünde Ashford in Zeile 4, wäre Zeile 3 Vakhams - dann bliebe Zeile 8 nur für Dorian, Zeile 2 nur für Bart, Zeile 1 nur für Esme und Zeile 5 nur für Clara, und Gideon (nur Zeile 3 oder 4) hätte keinen Platz. Also steht Ashford in Zeile 8, und auf dem Floß in R7 C1 steht jemand.",
    },
    {
      text: "Gideon steht neben einem Fass, aber nicht in einer Blutlache (die gehört Bart allein): R3 C6, R4 C4 oder R4 C5. Freya steht in der untersten Zeile eines Schiffs; Zeile 7 gehört der Person auf dem Floß, also R4 C4 oder R4 C5. Zeile 4 ist damit Freyas, und Gideon steht in R3 C6.",
      place: { G: { row: 2, col: 5 } },
    },
    {
      text: "Clara steht neben einer Kanone: R5 C6 ist Gideons Spalte, Zeile 7 die des Floßes - sie steht in R6 C5. Damit steht Freya in R4 C4.",
      place: { C: { row: 5, col: 4 }, F: { row: 3, col: 3 } },
    },
    {
      text: "Bart steht in einer Blutlache: R2 C4 ist Freyas Spalte, R3 C1 Gideons Zeile, R6 C4 Claras Zeile - er steht in R2 C7.",
      place: { B: { row: 1, col: 6 } },
    },
    {
      text: "Dorian steht auf einer Insel: Die Südinsel liegt in Claras, der Floß- und Ashfords Zeile, Zeile 2 ist Barts - also Zeile 1, und Spalte 1 gehört der Person auf dem Floß: R1 C3. Ashford in Zeile 8: R8 C1 liegt in der Spalte des Floßes, R8 C2 ist eine Palme, R8 C3 bis R8 C7 sind besetzte Spalten oder eine Palme - er steht in R8 C8.",
      place: { D: { row: 0, col: 2 }, A: { row: 7, col: 7 } },
    },
    {
      text: "Esme und Vakham bleiben Zeile 5 und 7, Spalte 1 und 2: einer auf dem Floß in R7 C1, der andere in R5 C2. In R5 C2 wäre Esme nicht neben einem Hai - sie steht auf dem Floß, Vakham in R5 C2 im Wasser, allein mit Esme. Esme ist der Mörder!",
      place: { E: { row: 6, col: 0 }, V: { row: 4, col: 1 } },
    },
  ],
  solution: {
    A: { row: 7, col: 7 },
    B: { row: 1, col: 6 },
    C: { row: 5, col: 4 },
    D: { row: 0, col: 2 },
    E: { row: 6, col: 0 },
    F: { row: 3, col: 3 },
    G: { row: 2, col: 5 },
    V: { row: 4, col: 1 },
  },
};
