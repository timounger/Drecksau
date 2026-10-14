/**
 * The Chess Tournament: a tournament hall with three boards, the spectators'
 * seats around it, a lounge and the referees' desk, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/38. Das Schachturnier.png`,
 * solution sheet `Lösungen 1-80/Lösung 37-40.JPG`).
 * Omid is the victim; whoever was alone with him killed him.
 *
 * The armchairs and the rugs (the long blue mats) can be stood on; the chess
 * tables, the side tables, the referees' desk and the plants cannot. Two
 * people are on the same diagonal when they are as many rows apart as
 * columns.
 */
import {
  about,
  all,
  alone,
  beside,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether nobody but the suspect stood on a rug. */
function onlyOneOnARug(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "rug");
  });
}

/** Whether the suspect stands on one diagonal with Anatoly or with Boris. */
function diagonalWithAOrB(c: Context): boolean {
  return ["A", "B"].some((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined &&
      Math.abs(there.row - c.cell.row) === Math.abs(there.col - c.cell.col)
    );
  });
}

/** The case. */
export const THE_CHESS_TOURNAMENT: Level = {
  id: "the-chess-tournament",
  name: "Das Schachturnier",
  series: { book: "original", number: 38 },
  story: "Für ihn heißt es jetzt: Schachmatt.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "Z",
      name: "Zuschauerbereich",
      at: "im Zuschauerbereich",
      ground: "floor",
      tint: "#e4e2dc",
      label: { row: 0, col: 4 },
    },
    {
      key: "T",
      name: "Turnierhalle",
      at: "in der Turnierhalle",
      ground: "stone",
      tint: "#dce8f2",
      label: { row: 4, col: 4 },
    },
    {
      key: "L",
      name: "Lounge",
      at: "in der Lounge",
      ground: "stone",
      tint: "#cfdbe8",
      label: { row: 7, col: 0 },
    },
    {
      key: "S",
      name: "Schiedsrichtertisch",
      at: "am Schiedsrichtertisch",
      ground: "stone",
      tint: "#b9c6d2",
      label: { row: 7, col: 5 },
    },
  ],
  areaMap: [
    "ZZZZZZZZ",
    "ZTTTTTTZ",
    "ZTTTTTTZ",
    "ZTTTTTTZ",
    "LTTTTTTS",
    "LLLLLSSS",
    "LLLLLSSS",
    "LLLLLSSS",
  ],
  thingMap: [
    "ccrrrrcc",
    "..c.c.c.",
    "c.brbrbc",
    "..crcrc.",
    "t.......",
    "p....tt.",
    "c.rr.tc.",
    ".p.t...p",
  ],
  things: {
    b: "chessTable",
    c: "chair",
    p: "plant",
    r: "rug",
    t: "table",
  },
  extraThings: {
    chessTable: {
      name: "Schachtisch",
      emoji: "\u{265F}\u{FE0F}",
      standable: false,
      kinds: ["furniture"],
    },
  },
  shapes: [
    [
      { row: 5, col: 5 },
      { row: 5, col: 6 },
      { row: 6, col: 5 },
    ],
  ],
  pieces: [
    { at: { row: 0, col: 2 }, rows: 1, cols: 4 },
    { at: { row: 2, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 2 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Anatoly",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Teppich.",
        ...all(on("rug"), counting(onlyOneOnARug)),
      },
      colour: "#b91c1c",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "B",
      name: "Boris",
      pronoun: "er",
      clue: {
        text: "Er war eine Spalte westlich und zwei Zeilen nördlich von Anatoly.",
        ...about(["A"], (c) => {
          const anatoly = c.cellOf("A");
          return (
            anatoly === undefined ||
            (c.cell.col === anatoly.col - 1 && c.cell.row === anatoly.row - 2)
          );
        }),
      },
      colour: "#15803d",
      face: "\u{1F474}",
    },
    {
      id: "C",
      name: "Chantal",
      pronoun: "sie",
      clue: {
        text: "Sie war allein in der Turnierhalle mit genau zwei Männern.",
        ...all(
          inArea("T"),
          counting((c) => {
            const others = c.peopleIn("T").filter((id) => id !== c.self);
            return (
              others.length === 2 && others.every((id) => c.has(id, "man"))
            );
          }),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "D",
      name: "Dina",
      pronoun: "sie",
      clue: {
        text: "Sie war allein im Zuschauerbereich.",
        ...all(inArea("Z"), alone()),
      },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Efim",
      pronoun: "er",
      clue: {
        text: "Er war in derselben diagonalen Linie wie Anatoly oder Boris.",
        ...about(["A", "B"], diagonalWithAOrB),
      },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Fabiano",
      pronoun: "er",
      clue: {
        text: "Er war neben einer Pflanze. Er war östlich von Dina.",
        ...all(
          beside("plant"),
          about(["D"], (c) => {
            const dina = c.cellOf("D");
            return dina === undefined || c.cell.col > dina.col;
          }),
        ),
      },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gaja",
      pronoun: "sie",
      clue: { text: "Sie war in der Lounge.", ...inArea("L") },
      colour: "#ea580c",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Omid",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}\u{1F3FD}",
    },
  ],
  hints: [
    {
      text: "Jemand muss in Z1 sein; das kann nur Dina sein. Sie kann laut Anatolys Hinweis nicht auf einem Teppich sein. Sie ist allein, also schließe den Rest des Zuschauerbereichs in S1 und S8 aus.",
      cross: [
        { row: 1, col: 0 },
        { row: 2, col: 0 },
        { row: 3, col: 0 },
        { row: 1, col: 7 },
        { row: 2, col: 7 },
        { row: 3, col: 7 },
      ],
    },
    {
      text: "Z2, Z3 und Z4 in der Turnierhalle sind von Chantal und zwei Männern besetzt. Niemand sonst war in der Turnierhalle. Das lokalisiert jemanden in Z5 S8.",
      cross: [
        { row: 4, col: 1 },
        { row: 4, col: 2 },
        { row: 4, col: 3 },
        { row: 4, col: 4 },
        { row: 4, col: 5 },
        { row: 4, col: 6 },
      ],
    },
    {
      text: "Da Z5 in der Turnierhalle unbesetzt ist, kann Anatoly nicht auf dem Teppich in Z7 sein, also müssen Anatoly und Boris zusammen in der Turnierhalle sein, mit Anatoly auf einem Teppich in Z4 und Boris auf einem Stuhl in Z2. Schließe die anderen Teppiche aus; das lokalisiert Chantal in Z3.",
      place: { C: { row: 2, col: 1 } },
      cross: [
        { row: 0, col: 2 },
        { row: 0, col: 3 },
        { row: 0, col: 4 },
        { row: 0, col: 5 },
        { row: 2, col: 3 },
        { row: 2, col: 5 },
        { row: 6, col: 2 },
        { row: 6, col: 3 },
      ],
    },
    {
      text: "Fabiano ist östlich von Dina, also muss Fabiano in Z8 sein.",
    },
    {
      text: "Das lokalisiert Dina in S1.",
      place: { D: { row: 0, col: 0 } },
    },
    {
      text: "Das lokalisiert Anatoly in S6 im letzten verfügbaren Feld, dann Boris.",
      place: { A: { row: 3, col: 5 }, B: { row: 1, col: 4 } },
    },
    {
      text: "Das lokalisiert Gaja im letzten verfügbaren Feld in S4, dann Fabiano im letzten verfügbaren Feld in S3.",
      place: { G: { row: 5, col: 3 }, F: { row: 7, col: 2 } },
    },
    {
      text: "Das lokalisiert Efim (in derselben diagonalen Linie wie Boris), dann Omid. Efim ist der Mörder!",
      place: { E: { row: 4, col: 7 }, O: { row: 6, col: 6 } },
    },
  ],
  solution: {
    A: { row: 3, col: 5 },
    B: { row: 1, col: 4 },
    C: { row: 2, col: 1 },
    D: { row: 0, col: 0 },
    E: { row: 4, col: 7 },
    F: { row: 7, col: 2 },
    G: { row: 5, col: 3 },
    O: { row: 6, col: 6 },
  },
};
