/**
 * Die Papageieninsel: an island with a beach, a forest, a clearing and a
 * cliff, a sloop and a frigate off its shores, a parrot repeating what it
 * heard and a murdered pirate.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/37.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Varren is the victim; whoever was alone with him killed him. No estates
 * in this case.
 *
 * The map is nine by nine. Harper's parrot repeats the clue of one other
 * suspect, and that clue holds for Harper; which one is part of the puzzle
 * ({@link parrotClue}). "South of" means in any row further down. Rafts
 * and hammocks can be stood on; rocks, chests, the crate, palms, bushes
 * and the rope cannot.
 */

import {
  about,
  all,
  beside,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The two boats. */
const BOATS: readonly string[] = ["L", "F"];

/** Whether a field is a corner of the map. */
function inCorner(c: Context, cell: Cell): boolean {
  return (
    (cell.row === 0 || cell.row === c.rows - 1) &&
    (cell.col === 0 || cell.col === c.cols - 1)
  );
}

/** Whether a field is on a raft south of Darling. */
function raftSouthOfDarling(c: Context, cell: Cell): boolean {
  const darling = c.cellOf("D");
  return c.is(cell, "raft") && darling !== undefined && cell.row > darling.row;
}

/**
 * Whether Harper's field meets the clue of one other suspect - the one her
 * parrot repeats.
 */
function parrotClue(c: Context): boolean {
  const area = c.areaOf(c.cell) ?? "";
  return (
    area === "P" ||
    raftSouthOfDarling(c, c.cell) ||
    c.beside(c.cell, "chest") ||
    BOATS.includes(area) ||
    c.beside(c.cell, "boulder") ||
    c.is(c.cell, "hammock") ||
    inCorner(c, c.cell)
  );
}

/** The case. */
export const PARROT_ISLAND: Level = {
  id: "parrot-island",
  name: "Die Papageieninsel",
  series: { book: "timeTravel", number: 37 },
  story: "Hier wiederholt jemand seine Untaten.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Wasser",
      at: "im Wasser",
      ground: "water",
      label: { row: 8, col: 2 },
    },
    {
      key: "L",
      name: "Schaluppe",
      at: "auf der Schaluppe",
      ground: "floor",
      tint: "#ddd3c2",
      label: { row: 0, col: 6 },
    },
    {
      key: "P",
      name: "Strand",
      at: "am Strand",
      ground: "sand",
      label: { row: 3, col: 1 },
    },
    {
      key: "B",
      name: "Wald",
      at: "im Wald",
      ground: "grass",
      tint: "#cfe3d6",
      label: { row: 5, col: 3 },
    },
    {
      key: "A",
      name: "Klippe",
      at: "auf der Klippe",
      ground: "stone",
      tint: "#c4d6e4",
      label: { row: 6, col: 5 },
    },
    {
      key: "C",
      name: "Lichtung",
      at: "auf der Lichtung",
      ground: "grass",
      label: { row: 7, col: 2 },
    },
    {
      key: "F",
      name: "Fregatte",
      at: "auf der Fregatte",
      ground: "floor",
      tint: "#ddd3c2",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "WWWWWWLLW",
    "WWPPPPAAW",
    "WPPPBBAAW",
    "WPBBBBAAW",
    "WCBBBBAAW",
    "WCCBBBAWW",
    "WCCCAAAWW",
    "WWCCCCFFF",
    "WWWWWWFFF",
  ],
  thingMap: [
    "..b.....c",
    ".r.hh..t.",
    ".....p...",
    "b.pt.....",
    ".....p...",
    "..s......",
    "rhh......",
    "....s..o.",
    "...b.....",
  ],
  things: {
    b: "boulder",
    c: "woodCrate",
    h: "hammock",
    o: "rope",
    p: "palm",
    r: "raft",
    s: "shrub",
    t: "chest",
  },
  pieces: [
    { at: { row: 1, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 1 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Aster",
      pronoun: "er",
      clue: { text: "Er war am Strand.", ...inArea("P") },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Barlow",
      pronoun: "er",
      clue: {
        text: "Er war auf einem Floß. Er war südlich von Darling.",
        ...all(
          on("raft"),
          about(["D"], (c) => raftSouthOfDarling(c, c.cell)),
        ),
      },
      colour: "#15803d",
      face: "\u{1F468}\u{1F3FE}",
    },
    {
      id: "C",
      name: "Cricket",
      pronoun: "er",
      clue: { text: "Er war neben einer Schatztruhe.", ...beside("chest") },
      colour: "#0e7490",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "D",
      name: "Darling",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Boot.", ...inArea(...BOATS) },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "E",
      name: "Eiko",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Felsen.", ...beside("boulder") },
      colour: "#a16207",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Fennick",
      pronoun: "er",
      clue: { text: "Er war in einer Hängematte.", ...on("hammock") },
      colour: "#be185d",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Galla",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke des Spielfelds.",
        ...own((c) => inCorner(c, c.cell)),
      },
      colour: "#7c3aed",
      face: "\u{1F469}\u{1F3FF}",
    },
    {
      id: "H",
      name: "Harper",
      pronoun: "sie",
      clue: {
        text: "„Aaaak!“ (Der Papagei wiederholt den Hinweis eines anderen Verdächtigen - für Harper.)",
        ...counting(parrotClue),
      },
      colour: "#0f766e",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "V",
      name: "Varren",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      text: "Harpers Papagei: Der Hinweis eines anderen Verdächtigen, vom Papagei wiederholt und auf Harper angewandt, führt schnell zur Lösung. Finde heraus, welcher Hinweis es ist.",
      note: true,
    },
  ],
  hints: [
    {
      text: "Darling ist auf einem Boot, Barlow auf einem Floß südlich von ihr. Beide Flöße (R2 C2 und R7 C1) liegen nördlich der Fregatte, also ist Darling auf der Schaluppe in Zeile 1. Galla steht in einer Ecke: R1 C1 ist Darlings Zeile, R1 C9 eine Kiste - sie steht in Zeile 9.",
    },
    {
      text: "Eiko steht neben einem Felsen: R1 C2 und R1 C4 liegen in Darlings Zeile, R9 C3 und R9 C5 in Gallas. Sie steht in R3 C1 oder R5 C1, Spalte 1 ist ihre. Damit steht Galla in R9 C9 und Barlow auf dem Floß in R2 C2.",
      place: { G: { row: 8, col: 8 }, B: { row: 1, col: 1 } },
    },
    {
      text: "Fennick liegt in einer Hängematte: Zeile 2 ist Barlows, R7 C2 Barlows Spalte - er liegt in R7 C3. Aster ist am Strand: Zeile 2 ist Barlows, Spalte 2 Barlows, Spalte 3 Fennicks - es bleibt R3 C4. Damit steht Eiko in R5 C1.",
      place: {
        F: { row: 6, col: 2 },
        A: { row: 2, col: 3 },
        E: { row: 4, col: 0 },
      },
    },
    {
      text: "Cricket steht neben einer Schatztruhe: R2 C7 ist Barlows Zeile, R3 C8 Asters, R5 C4 Eikos - er steht in R4 C5.",
      place: { C: { row: 3, col: 4 } },
    },
    {
      text: "Für Harper und Varren bleiben Zeile 6 und 8, Spalte 6 und eine von 7 und 8. Varren war mit genau einer Person in seinem Bereich: Auf der Klippe und der Fregatte wäre er allein, im Wasser zu dritt. Es bleiben R6 C6 im Wald (mit Cricket) und R8 C6 auf der Lichtung (mit Fennick) - Spalte 6 ist seine.",
    },
    {
      text: "Harper steht in Spalte 7 oder 8. In R6 C7 und R6 C8 passt kein Hinweis eines anderen auf sie, R8 C8 ist ein Seil - in R8 C7 auf der Fregatte passt Darlings Hinweis „auf einem Boot“. Harper steht in R8 C7, Darling in R1 C8 und Varren in R6 C6 im Wald, allein mit Cricket. Cricket ist der Mörder!",
      place: {
        H: { row: 7, col: 6 },
        D: { row: 0, col: 7 },
        V: { row: 5, col: 5 },
      },
    },
  ],
  solution: {
    A: { row: 2, col: 3 },
    B: { row: 1, col: 1 },
    C: { row: 3, col: 4 },
    D: { row: 0, col: 7 },
    E: { row: 4, col: 0 },
    F: { row: 6, col: 2 },
    G: { row: 8, col: 8 },
    H: { row: 7, col: 6 },
    V: { row: 5, col: 5 },
  },
};
