/**
 * Inseln abseits der Karte: four nameless islands, two sloops and the sea,
 * with a murdered pirate - and nobody knows which island is which.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/39.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Vera is the victim; whoever was alone with her killed her. No estates in
 * this case.
 *
 * The map is eight by eight. The four islands have lost their names: they
 * are the coconut island, the desert island, the island of mercy and the
 * island of whispers, one each, and the clues that name one only say that
 * those people stood on different islands ({@link namesFit}). Sand can be
 * stood on, and so can the rafts; palms, the chest, sharks and the boulder
 * cannot.
 */
import {
  all,
  beside,
  counting,
  inArea,
  on,
  onGround,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The four islands without a name. */
const ISLANDS: readonly string[] = ["1", "2", "3", "4"];

/** The two sloops. */
const SLOOPS: readonly string[] = ["S", "T"];

/** Whether exactly one person stood on sand. */
function onlyOneOnSand(c: Context): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.groundAt(there) === "sand";
    }).length === 1
  );
}

/** Whether a field is a corner of the map. */
function inCorner(c: Context): boolean {
  return (
    (c.cell.row === 0 || c.cell.row === c.rows - 1) &&
    (c.cell.col === 0 || c.cell.col === c.cols - 1)
  );
}

/**
 * Whether the islands can be named so that Briggs is on the coconut island,
 * Cross on the island of whispers and Flora on the island of mercy - that
 * is, the three stood on three different islands.
 */
function namesFit(c: Context): boolean {
  const islands = ["B", "C", "F"].map((id) => {
    const there = c.cellOf(id);
    return there === undefined ? null : c.areaOf(there);
  });
  return (
    islands.every((key) => key !== null && ISLANDS.includes(key)) &&
    new Set(islands).size === islands.length
  );
}

/** The case. */
export const ISLANDS_OFF_THE_MAP: Level = {
  id: "islands-off-the-map",
  name: "Inseln abseits der Karte",
  series: { book: "timeTravel", number: 39 },
  story:
    "Um zu diesen Inseln zu gelangen, musst du einem Gerät mit GPS vertrauen: Ganz Pures Schwein.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "1",
      name: "???",
      at: "auf der unbekannten Insel im Nordwesten",
      ground: "grass",
      island: true,
      label: { row: 2, col: 1 },
    },
    {
      key: "2",
      name: "???",
      at: "auf der unbekannten Insel im Nordosten",
      ground: "grass",
      island: true,
      label: { row: 1, col: 6 },
    },
    {
      key: "3",
      name: "???",
      at: "auf der unbekannten Insel in der Mitte",
      ground: "grass",
      island: true,
      label: { row: 6, col: 3 },
    },
    {
      key: "4",
      name: "???",
      at: "auf der unbekannten Insel im Südosten",
      ground: "grass",
      island: true,
      label: { row: 7, col: 7 },
      labelEnd: true,
    },
    {
      key: "S",
      name: "Schaluppe A",
      at: "auf Schaluppe A",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 6, col: 1 },
    },
    {
      key: "T",
      name: "Schaluppe B",
      at: "auf Schaluppe B",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 3, col: 4 },
    },
    {
      key: "W",
      name: "Wasser",
      at: "im Wasser",
      ground: "water",
      label: { row: 7, col: 4 },
    },
  ],
  areaMap: [
    "111WW222",
    "111WWW22",
    "W11WWWW2",
    "WWWWTTWW",
    "WWWWWW44",
    "WW33W444",
    "WSS3W444",
    "WWWWWW44",
  ],
  groundMap: [
    "gggwwggg",
    "ssgwwwgg",
    "wsswwwwg",
    "wwwwffww",
    "wwwwwwgg",
    "wwggwggg",
    "wffgwggs",
    "wwwwwwss",
  ],
  grounds: { f: "floor", g: "grass", s: "sand", w: "water" },
  thingMap: [
    "...k....",
    "..p..r..",
    "........",
    "........",
    "k...o...",
    "..pt....",
    ".....p..",
    "r.......",
  ],
  things: {
    k: "shark",
    o: "boulder",
    p: "palm",
    r: "raft",
    t: "chest",
  },
  suspects: [
    {
      id: "A",
      name: "Alaric",
      pronoun: "er",
      clue: { text: "Er war auf einem Boot.", ...inArea(...SLOOPS) },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Briggs",
      pronoun: "er",
      clue: {
        text: "Er war auf der Kokosinsel, neben einem Baum.",
        ...all(inArea(...ISLANDS), beside("tree")),
      },
      colour: "#15803d",
      face: "\u{1F474}",
    },
    {
      id: "C",
      name: "Cross",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person im Sand. Sie war auf der Flüsterinsel.",
        ...all(onGround("sand"), inArea(...ISLANDS), counting(onlyOneOnSand)),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Drift",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Floß.", ...on("raft") },
      colour: "#6366f1",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "E",
      name: "Edda",
      pronoun: "sie",
      clue: {
        text: "Sie war im Wasser, neben einem Hai.",
        ...all(inArea("W"), beside("shark")),
      },
      colour: "#a16207",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "F",
      name: "Flora",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke des Spielfelds. Sie war auf der Gnadeninsel.",
        ...all(own(inCorner), inArea(...ISLANDS)),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "G",
      name: "Greer",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Felsen oder auf einer Insel.",
        ...own(
          (c) =>
            c.beside(c.cell, "boulder") ||
            ISLANDS.includes(c.areaOf(c.cell) ?? ""),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F469}\u{1F3FF}",
    },
    {
      id: "V",
      name: "Vera",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F469}‍\u{1F9B1}",
    },
  ],
  rules: [
    {
      text: "Die vier Inseln heißen Kokosinsel, Wüsteninsel, Gnadeninsel und Flüsterinsel - aber welche ist welche? Finde es heraus.",
      check: namesFit,
    },
  ],
  hints: [
    {
      text: "Briggs steht auf einer Insel neben einem Baum, aber nicht auf Sand (der gehört Cross allein): R1 C3 auf der Insel im Nordwesten oder R6 C6 und R7 C7 auf der Insel im Südosten. Flora steht in einer Ecke auf einer Insel: R1 C1 oder R1 C8 (R8 C8 ist Sand, R8 C1 ein Floß im Wasser). In R1 C1 nähme sie Briggs die Zeile 1, und Briggs und Cross (Sand gibt es nur im Nordwesten und Südosten) müssten beide auf die Insel im Südosten - doch sie stehen auf verschiedenen Inseln. Flora steht in R1 C8, Briggs auf der Insel im Südosten, Cross auf dem Sand im Nordwesten.",
      place: { F: { row: 0, col: 7 } },
    },
    {
      text: "Vera war allein mit ihrem Mörder. Im Wasser stehen Edda und Drift (die Flöße liegen im Wasser) - zu dritt wären sie zu viele. Auf einer Schaluppe stünde sie mit Alaric in einer Zeile oder allein. Im Nordwesten bliebe ihr nur Sand oder Floras Zeile, auf der mittleren Insel stünde sie allein. Bleiben die Insel im Nordosten bei Flora (dort nur R2 C7) und die Insel im Südosten bei Briggs.",
    },
    {
      text: "Stünde Vera bei Briggs im Südosten, belegten die beiden C6 und C7 und die Zeilen 5 und 6 oder 6 und 7. Drift müsste auf das Floß in R8 C1. Greer dürfte nicht zu Vera und nicht in C7 zu Flora: Ihr blieben R5 C4 oder R6 C5 neben dem Felsen oder R7 C4 auf der mittleren Insel; Edda bliebe R2 C4 oder R5 C2. Ist Zeile 7 frei, steht Greer in R7 C4 und Edda in R2 C4; ist Zeile 5 frei, steht Greer in R5 C4 und Edda wieder in R2 C4 - beide in C4. Vera steht also in R2 C7.",
      place: { V: { row: 1, col: 6 } },
    },
    {
      text: "Zeile 2 ist Veras, also steht Drift auf dem Floß in R8 C1. Edda steht im Wasser neben einem Hai: R1 C5 ist Floras, R2 C4 Veras Zeile, R4 C1 und R6 C1 Drifts Spalte - sie steht in R5 C2. Cross steht auf dem Sand im Nordwesten in Zeile 3, nicht in Eddas Spalte: R3 C3.",
      place: {
        D: { row: 7, col: 0 },
        E: { row: 4, col: 1 },
        C: { row: 2, col: 2 },
      },
    },
    {
      text: "Briggs steht in R6 C6, denn R7 C7 liegt in Veras Spalte. Frei sind nur noch die Zeilen 4 und 7 und die Spalten 4 und 5: Alaric steht auf der Schaluppe in R4 C5, Greer auf der mittleren Insel in R7 C4. Vera war allein mit Flora. Flora ist die Mörderin!",
      place: {
        B: { row: 5, col: 5 },
        A: { row: 3, col: 4 },
        G: { row: 6, col: 3 },
      },
    },
  ],
  solution: {
    A: { row: 3, col: 4 },
    B: { row: 5, col: 5 },
    C: { row: 2, col: 2 },
    D: { row: 7, col: 0 },
    E: { row: 4, col: 1 },
    F: { row: 0, col: 7 },
    G: { row: 6, col: 3 },
    V: { row: 1, col: 6 },
  },
};
