/**
 * Die Belagerung: a harbour town under siege - shore, tavern, dock and an
 * island, three ships in the water between them - with a murdered pirate.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/43.png`, no
 * solution sheet and no culprit on the photographed page, only a few
 * pencilled marks - the solver proves the solution is the only one).
 * Virgil is the victim; whoever was alone with him killed him. No estates
 * in this case.
 *
 * The map is ten by ten. The sea is the water with the three ships on it;
 * the land is the shore, the tavern, the dock and the island. Chairs can be
 * stood on; barrels, crates, cannons, ropes, the chest, the table, palms and
 * boulders cannot.
 */
import {
  about,
  alone,
  all,
  beside,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The three ships. */
const SHIPS: readonly string[] = ["A", "B", "G"];

/** The sea: the water and the ships on it. */
const SEA: readonly string[] = ["W", ...SHIPS];

/** The land. */
const LAND: readonly string[] = ["O", "T", "M", "I"];

/** The women of the case. */
const WOMEN: readonly string[] = ["A", "C", "G", "H"];

/** Whether somebody stood in the sea. */
function atSea(c: Context, id: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && SEA.includes(c.areaOf(there) ?? "");
}

/** Whether a woman stood on a ship exactly one row north of the suspect. */
function womanAboardNorth(c: Context): boolean {
  return WOMEN.some((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined &&
      there.row === c.cell.row - 1 &&
      SHIPS.includes(c.areaOf(there) ?? "")
    );
  });
}

/** Whether Hilda was the only woman beside a rope. */
function onlyWomanByRope(c: Context): boolean {
  return WOMEN.every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.beside(there, "rope");
  });
}

/** Whether somebody stood exactly one column east of another. */
function oneColumnEastOf(c: Context, other: string): boolean {
  const there = c.cellOf(other);
  return there !== undefined && c.cell.col === there.col + 1;
}

/**
 * For the solver: whether a partial placement can still be finished - El
 * Sable is still alone, no other woman is beside a rope, and a woman can
 * still stand on a ship one row north of Florent.
 */
function stillPossible(c: Context): boolean {
  const sable = c.cellOf("E");
  const hilda = c.cellOf("H");
  const florent = c.cellOf("F");
  const ropeWomen = WOMEN.filter((id) => {
    const there = c.cellOf(id);
    return id !== "H" && there !== undefined && c.beside(there, "rope");
  });
  const northRow = florent === undefined ? -1 : florent.row - 1;
  const rowTaken = c.people().some((id) => c.cellOf(id)?.row === northRow);
  return (
    (sable === undefined || c.peopleIn(c.areaOf(sable) ?? "").length === 1) &&
    (hilda === undefined || ropeWomen.length === 0) &&
    (florent === undefined || !rowTaken || womanAboardNorthOf(c, northRow))
  );
}

/** Whether a woman stood on a ship in this row. */
function womanAboardNorthOf(c: Context, row: number): boolean {
  return WOMEN.some((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined &&
      there.row === row &&
      SHIPS.includes(c.areaOf(there) ?? "")
    );
  });
}

/** The case. */
export const THE_SIEGE: Level = {
  id: "the-siege",
  name: "Die Belagerung",
  series: { book: "timeTravel", number: 43 },
  story:
    "Nichts ärgert einen Piraten so sehr wie ein Rum-Embargo. Na ja - es ärgert ihn noch mehr, als er es ohnehin schon ist.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Fregatte A",
      at: "auf Fregatte A",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 2, col: 1 },
    },
    {
      key: "O",
      name: "Ufer",
      at: "am Ufer",
      ground: "sand",
      tint: "#f3dc8e",
      label: { row: 1, col: 4 },
    },
    {
      key: "T",
      name: "Taverne",
      at: "in der Taverne",
      ground: "floor",
      tint: "#ead7e6",
      label: { row: 3, col: 8 },
    },
    {
      key: "B",
      name: "Fregatte B",
      at: "auf Fregatte B",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 5, col: 6 },
    },
    {
      key: "M",
      name: "Steg",
      at: "auf dem Steg",
      ground: "floor",
      tint: "#e6d2d6",
      label: { row: 7, col: 6 },
    },
    {
      key: "G",
      name: "Galeone",
      at: "auf der Galeone",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 8, col: 3 },
    },
    {
      key: "I",
      name: "Insel",
      at: "auf der Insel",
      ground: "sand",
      tint: "#e9c7a6",
      label: { row: 9, col: 0 },
    },
    {
      key: "W",
      name: "Wasser",
      at: "im Wasser",
      ground: "water",
      label: { row: 9, col: 5 },
    },
  ],
  areaMap: [
    "WAAOOOTTTT",
    "WAAWOOOTTT",
    "WAAWWOOTTT",
    "WWWWWWBBTT",
    "IWWWWWBBMM",
    "IWGGGWBBMM",
    "IWGGGWMMMM",
    "IIGGGWMMMM",
    "IIGGGWWWMM",
    "IIIWWWWWWM",
  ],
  thingMap: [
    ".....b..hb",
    "..n.....kh",
    "b.t.......",
    "....r....c",
    "p.....o.c.",
    "..........",
    "..c......c",
    "....n....o",
    "op..n.b...",
    "....r.....",
  ],
  things: {
    b: "barrel",
    c: "woodCrate",
    h: "chair",
    k: "table",
    n: "cannon",
    o: "rope",
    p: "palm",
    r: "boulder",
    t: "chest",
  },
  suspects: [
    {
      id: "A",
      name: "Addison",
      pronoun: "sie",
      clue: {
        text: "Entweder sie oder Bones war im Meer; die andere Person war an Land.",
        ...about(["B"], (c) => atSea(c, c.self) !== atSea(c, "B")),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bones",
      pronoun: "er",
      clue: { text: "Er war neben einer Kiste.", ...beside("woodCrate") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Cass",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fass.", ...beside("barrel") },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Dreg",
      pronoun: "er",
      clue: { text: "Er war neben einer Kanone.", ...beside("cannon") },
      colour: "#6366f1",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "E",
      name: "El Sable",
      pronoun: "er",
      clue: {
        text: "Er war allein. Er war genau eine Spalte östlich von Grit.",
        ...all(
          alone(),
          about(["G"], (c) => oneColumnEastOf(c, "G")),
        ),
      },
      colour: "#a16207",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "F",
      name: "Florent",
      pronoun: "er",
      clue: {
        text: "Er war an Land. Genau eine Zeile nördlich von ihm war eine Frau, die auf einem Boot war.",
        ...all(inArea(...LAND), counting(womanAboardNorth)),
      },
      colour: "#be185d",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "G",
      name: "Grit",
      pronoun: "sie",
      clue: {
        text: "Sie war genau eine Spalte östlich von Bones.",
        ...about(["B"], (c) => oneColumnEastOf(c, "B")),
      },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "H",
      name: "Hilda",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Frau neben einem Seil.",
        ...all(beside("rope"), counting(onlyWomanByRope)),
      },
      colour: "#334155",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "I",
      name: "Irving",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#ea580c",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "V",
      name: "Virgil",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F474}",
    },
  ],
  prune: stillPossible,
  hints: [
    {
      text: "Bones steht neben einer Kiste, Grit genau eine Spalte östlich von ihm und El Sable noch eine weiter - Bones steht also höchstens in C8. Neben den Kisten in der Taverne und am Steg liegen nur Felder in C9 und C10, bleibt die Kiste auf der Galeone: Bones steht in R6 C3, R7 C4 oder R8 C3, im Meer. Addison ist also an Land. Grit steht in C4 oder C5, El Sable in C5 oder C6.",
    },
    {
      text: "Dreg steht neben einer Kanone: auf Fregatte A in R1 C3 oder R2 C2, oder auf der Galeone in R7 C5, R8 C4 oder R9 C4. C4 und C5 brauchen aber Bones, Grit und El Sable (C3 bis C5 oder C4 bis C6). Dreg steht also auf Fregatte A in Zeile 1 oder 2, und Irving sitzt auf einem Stuhl in der anderen dieser beiden Zeilen.",
    },
    {
      text: "Cass steht neben einem Fass - außerhalb der Zeilen 1 und 2 nur noch im Wasser. El Sable war allein: nicht auf der Galeone bei Bones und nicht im Wasser bei Cass. In C5 oder C6 bleibt ihm nur R3 C6 am Ufer. Damit steht Bones in C4, also in R7 C4, und Grit in C5: R5 C5 oder R6 C5.",
      place: { E: { row: 2, col: 5 }, B: { row: 6, col: 3 } },
    },
    {
      text: "Florent ist an Land, eine Zeile nördlich von ihm eine Frau auf einem Schiff: Addison ist an Land, Cass im Wasser - also Grit oder Hilda. Grit auf der Galeone (R6 C5) bräuchte Florent in Bones' Zeile 7. Hilda steht auf Fregatte B neben dem Seil: R6 C7 hätte dasselbe Problem, und mit R5 C8 stünde Florent in Zeile 6, und Grit hätte keine Zeile mehr. Hilda steht in R4 C7, Florent in Zeile 5 an Land: R5 C10. Grit steht in R6 C5.",
      place: {
        H: { row: 3, col: 6 },
        F: { row: 4, col: 9 },
        G: { row: 5, col: 4 },
      },
    },
    {
      text: "Irving sitzt in R1 C9 (C10 ist Florents Spalte), Dreg steht in R2 C2. Cass steht im Wasser neben einem Fass: R4 C1 liegt in Hildas Zeile, R9 C6 in El Sables und R10 C7 in Hildas Spalte - sie steht in R9 C8.",
      place: {
        I: { row: 0, col: 8 },
        D: { row: 1, col: 1 },
        C: { row: 8, col: 7 },
      },
    },
    {
      text: "Addison und Virgil bleiben die Zeilen 8 und 10 und die Spalten 1 und 3. Addison ist an Land, aber nicht neben dem Seil in R9 C1 (Hilda ist dort die einzige Frau), und R8 C3 liegt auf der Galeone - sie steht in R10 C3, Virgil in R8 C1 auf der Insel, allein mit Addison. Addison ist die Mörderin!",
      place: { A: { row: 9, col: 2 }, V: { row: 7, col: 0 } },
    },
  ],
  solution: {
    A: { row: 9, col: 2 },
    B: { row: 6, col: 3 },
    C: { row: 8, col: 7 },
    D: { row: 1, col: 1 },
    E: { row: 2, col: 5 },
    F: { row: 4, col: 9 },
    G: { row: 5, col: 4 },
    H: { row: 3, col: 6 },
    I: { row: 0, col: 8 },
    V: { row: 7, col: 0 },
  },
};
