/**
 * The Movie Studio: six film sets, a walkway between them, and a murder.
 *
 * @module
 * @remarks
 * After the expert case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Expert/TheMovieStudio.png`, solution beside it).
 * Vaughn is the victim; whoever was alone with him killed him.
 *
 * A "set" is an area whose printed name contains "Set". A field is "beside a
 * wall" when at least one of its four sides lies on an area border or on the
 * edge of the map, and it is "in a corner" when two adjacent sides do.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  beside,
  column,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The keys of the movie sets. */
const SETS: readonly string[] = ["W", "R", "E", "H", "S", "X"];

/** The case. */
export const THE_MOVIE_STUDIO: Level = {
  id: "the-movie-studio",
  name: "Das Filmstudio",
  difficulty: "expert",
  story:
    "Vaughn wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Western-Set",
      at: "im Western-Set",
      ground: "sand",
      tint: "#f1e2b8",
      label: { row: 5, col: 1 },
    },
    {
      key: "R",
      name: "Romantik-Set",
      at: "im Romantik-Set",
      ground: "grass",
      tint: "#b9eab0",
      label: { row: 4, col: 5 },
    },
    {
      key: "E",
      name: "Epos-Set",
      at: "im Epos-Set",
      ground: "grass",
      tint: "#8fbf86",
      label: { row: 5, col: 11 },
    },
    {
      key: "K",
      name: "Gang",
      at: "im Gang",
      ground: "floor",
      tint: "#dfe3f5",
      label: { row: 7, col: 6 },
    },
    {
      key: "M",
      name: "Maske",
      at: "in der Maske",
      ground: "floor",
      tint: "#f0e8ee",
      label: { row: 10, col: 0 },
    },
    {
      key: "D",
      name: "Schnitt",
      at: "im Schnitt",
      ground: "stone",
      tint: "#a9b8c2",
      label: { row: 11, col: 6 },
    },
    {
      key: "H",
      name: "Horror-Set",
      at: "im Horror-Set",
      ground: "stone",
      tint: "#8e91b3",
      label: { row: 9, col: 12 },
    },
    {
      key: "C",
      name: "Kostüme",
      at: "in den Kostümen",
      ground: "floor",
      tint: "#b9dcea",
      label: { row: 12, col: 1 },
    },
    {
      key: "T",
      name: "Star-Wohnwagen",
      at: "im Star-Wohnwagen",
      ground: "floor",
      tint: "#cfe8f2",
      label: { row: 15, col: 0 },
    },
    {
      key: "S",
      name: "Sci-Fi-Set",
      at: "im Sci-Fi-Set",
      ground: "floor",
      tint: "#9ee8cc",
      label: { row: 15, col: 9 },
    },
    {
      key: "X",
      name: "Kriegs-Set",
      at: "im Kriegs-Set",
      ground: "stone",
      tint: "#b39aa8",
      label: { row: 15, col: 13 },
    },
  ],
  areaMap: [
    "WWWWWRRRREEEEEEE",
    "WWWWWRRRREEEEEEE",
    "WWWWWRRRREEEEEEE",
    "WWWWWRRRREEEEEEE",
    "WWWWWRRRREEEEEEE",
    "WWWWWKKKKEEEEEEE",
    "MMMKKKKKKKKHHHHH",
    "MMMKKKKKKKKHHHHH",
    "MMMKKDDDDKKHHHHH",
    "MMMKKDDDDKKHHHHH",
    "MMMKKDDDDKKKXXXX",
    "CCCCKDDDDKKKXXXX",
    "CCCCKKSSSSSSXXXX",
    "TTTTKKSSSSSSXXXX",
    "TTTTKKSSSSSSXXXX",
    "TTTTKKSSSSSSXXXX",
  ],
  thingMap: [
    "..m.c...f...r.r.",
    "tc.bt.fT..kr...T",
    "t...t.hhf.......",
    "m.k.tk...T..p.T.",
    ".b..b.....pT..p.",
    "...c......T.T...",
    ".ht........sdd..",
    "..s..........tth",
    ".ht..t..v..vkh..",
    ".....v.ht..ss...",
    ".ht..t.hv...r...",
    "hssh.v..v....r.k",
    "......tt...v..m.",
    "...s...t.v..r...",
    "t.d...h..v....r.",
    "..d...t.k..v..rr",
  ],
  things: {
    m: "mud",
    h: "chair",
    d: "bed",
    b: "barrel",
    r: "rubble",
    p: "catapult",
    k: "camera",
    c: "cactus",
    T: "tree",
    f: "flowers",
    t: "table",
    s: "shelf",
    v: "tv",
  },
  suspects: [
    {
      id: "A",
      name: "Antonio",
      pronoun: "er",
      clue: {
        text: "Er war neben einer Kamera, direkt links von ihr.",
        ...own((c) => {
          const right = { row: c.cell.row, col: c.cell.col + 1 };
          return c.areaOf(right) === c.areaOf(c.cell) && c.is(right, "camera");
        }),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Belah",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fernseher.", ...beside("tv") },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Cornelius",
      pronoun: "er",
      clue: { text: "Er war in der sechsten Spalte.", ...column(6) },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Damara",
      pronoun: "sie",
      clue: { text: "Sie war neben Blumen.", ...beside("flowers") },
      colour: "#6366f1",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "E",
      name: "Erik",
      pronoun: "er",
      clue: {
        text: "Er war an einem Set. Er war neben einer Wand.",
        ...all(
          inArea(...SETS),
          own((c) => wallsOf(c, c.cell).length > 0),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Falcon",
      pronoun: "er",
      clue: { text: "Er war neben einem Kaktus.", ...beside("cactus") },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gilbert",
      pronoun: "er",
      clue: {
        text: "Eine Frau in seinem Raum war neben der Kamera.",
        ...all(
          own((c) =>
            c
              .cellsOf(c.areaOf(c.cell) ?? "")
              .some((cell) => c.is(cell, "camera")),
          ),
          counting((c) =>
            c.peopleIn(c.areaOf(c.cell) ?? "").some((id) => {
              const there = c.cellOf(id);
              return (
                there !== undefined &&
                c.has(id, "woman") &&
                c.beside(there, "camera")
              );
            }),
          ),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Hadako",
      pronoun: "sie",
      clue: { text: "Sie war im Horror-Set.", ...inArea("H") },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "I",
      name: "Idris",
      pronoun: "er",
      clue: { text: "Er war auf einer Schlammpfütze.", ...on("mud") },
      colour: "#0f766e",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "J",
      name: "Johnny",
      pronoun: "er",
      clue: {
        text: "Er war nicht in einer Ecke des Raums.",
        ...own((c) => !isCorner(c, c.cell)),
      },
      colour: "#a16207",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "K",
      name: "Kobe",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke eines Sets.",
        ...all(
          inArea(...SETS),
          own((c) => isCorner(c, c.cell)),
        ),
      },
      colour: "#be185d",
      face: "\u{1F468}",
    },
    {
      id: "L",
      name: "Leeroy",
      pronoun: "er",
      clue: { text: "Er war neben Schutt.", ...beside("rubble") },
      colour: "#1d4ed8",
      face: "\u{1F9D4}",
    },
    {
      id: "M",
      name: "Mason",
      pronoun: "er",
      clue: { text: "Er war neben einem Katapult.", ...beside("catapult") },
      colour: "#65a30d",
      face: "\u{1F9D1}",
    },
    {
      id: "N",
      name: "Natalia",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Bett.", ...on("bed") },
      colour: "#c2410c",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Olivia",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#7e22ce",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "V",
      name: "Vaughn",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      text: "An jedem Filmset war genau eine Person neben der Kamera.",
      // Early pruning: no second person beside a set's camera, and nobody
      // blocks the last free field beside a camera nobody stands beside.
      prune: (c) =>
        SETS.every(
          (set) =>
            !(
              cameraSitters(c, set).length > 1 ||
              (cameraSitters(c, set).length === 0 &&
                cameraFields(c, set).some(
                  (cell) => cell.row === c.cell.row || cell.col === c.cell.col,
                ) &&
                cameraFields(c, set).every((cell) =>
                  c.people().some((id) => {
                    const there = c.cellOf(id);
                    return (
                      there !== undefined &&
                      (there.row === cell.row || there.col === cell.col)
                    );
                  }),
                ))
            ),
        ),
      check: (c) => SETS.every((set) => cameraSitters(c, set).length === 1),
    },
  ],
  hints: [
    {
      text: "Laut der allgemeinen Regel steht neben jeder Kamera genau eine Person. In Reihe 1 bis 6 stehen also drei Personen neben Kameras. Außerdem müssen in Reihe 1 bis 6 Falcon neben einem Kaktus, Damara neben Blumen und Mason neben einem Katapult stehen. Damit sind alle Personen in Reihe 1 bis 6 vergeben. Für Idris bleibt nur die letzte Schlammpfütze.",
      place: { I: { row: 12, col: 14 } },
    },
    {
      text: "Damit bleibt für die Person neben der Kamera im Kriegs-Set nur Reihe 11, Spalte 16 (laut der allgemeinen Regel).",
      place: { K: { row: 10, col: 15 } },
    },
    {
      text: "In Spalte 13 und 14 steht jemand neben der Kamera im Horror-Set, dazu Leeroy irgendwo neben Schutt. Streiche den Rest von Spalte 13 und 14. Damit liegt Natalia auf dem Bett in Spalte 3.",
    },
    {
      text: "Damit steht die Person neben der Kamera im Western-Set in Reihe 4. Für Mason bleibt nur das letzte Feld neben einem Katapult.",
      place: { M: { row: 4, col: 9 } },
    },
    {
      text: "Damit bleibt für Cornelius nur das Feld neben der Kamera im Romantik-Set.",
      place: { C: { row: 2, col: 5 } },
    },
    {
      text: "Damit steht die Person neben der Kamera im Epos-Set in Reihe 1, Spalte 11 - und für Damara bleiben nur die letzten Blumen.",
      place: { D: { row: 1, col: 8 } },
    },
    {
      text: "Damit steht die Person neben der Kamera im Sci-Fi-Set fest, und dann Natalia.",
      place: { N: { row: 14, col: 2 } },
    },
    {
      text: "Damit bleibt für Falcon nur das letzte Feld neben einem Kaktus.",
      place: { F: { row: 5, col: 4 } },
    },
    {
      text: "Hadako ist die einzige Frau, die zugleich neben einer Kamera und allein mit Gilbert sein kann. Hadako und Leeroy müssen in Spalte 13 oder 14 stehen (siehe Schritt 3). Damit steht Gilbert in Spalte 12, dann Hadako, dann Leeroy.",
      place: {
        G: { row: 7, col: 11 },
        H: { row: 8, col: 13 },
        L: { row: 11, col: 12 },
      },
    },
    {
      text: "Damit bleibt für Olivia nur der letzte Stuhl und für Belah das letzte Feld neben einem Fernseher.",
      place: { O: { row: 6, col: 1 }, B: { row: 9, col: 6 } },
    },
    {
      text: "Antonio muss der Kameramann im Sci-Fi-Set sein und Erik der Kameramann im Epos-Set.",
      place: { A: { row: 15, col: 7 }, E: { row: 0, col: 10 } },
    },
    {
      text: "Damit bleibt für Johnny nur das letzte Feld, das an keiner Wand liegt, dann für Vaughn. Vaughn war allein mit Natalia im Star-Wohnwagen - Natalia ist die Mörderin!",
      place: { J: { row: 3, col: 3 }, V: { row: 13, col: 0 } },
    },
  ],
  solution: {
    A: { row: 15, col: 7 },
    B: { row: 9, col: 6 },
    C: { row: 2, col: 5 },
    D: { row: 1, col: 8 },
    E: { row: 0, col: 10 },
    F: { row: 5, col: 4 },
    G: { row: 7, col: 11 },
    H: { row: 8, col: 13 },
    I: { row: 12, col: 14 },
    J: { row: 3, col: 3 },
    K: { row: 10, col: 15 },
    L: { row: 11, col: 12 },
    M: { row: 4, col: 9 },
    N: { row: 14, col: 2 },
    O: { row: 6, col: 1 },
    V: { row: 13, col: 0 },
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

/** Who stands beside the camera of a set. */
function cameraSitters(c: Context, set: string): readonly string[] {
  return c.peopleIn(set).filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.beside(there, "camera");
  });
}

/** The fields beside the camera of a set that somebody could stand on. */
function cameraFields(c: Context, set: string): readonly Cell[] {
  return c
    .cellsOf(set)
    .filter((cell) => c.standable(cell) && c.beside(cell, "camera"));
}

/** Whether a field has walls on two adjacent sides - a corner of its area. */
function isCorner(c: Context, cell: Cell): boolean {
  const walls = wallsOf(c, cell);
  return (
    walls.some((step) => step.row !== 0) && walls.some((step) => step.col !== 0)
  );
}
