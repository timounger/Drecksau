/**
 * The Chess Tournament: a tournament hall with three boards, the spectators'
 * seats around it, a lounge and the referees' desk, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/38. Das Schachturnier.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
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
      text: "In der Turnierhalle waren Chantal und genau zwei Männer. Fabiano nicht (dort steht keine Pflanze), Omid auch nicht (er war mit nur einer Person allein). Es waren also zwei von Anatoly, Boris und Efim. Omid war weder dort noch im Zuschauerbereich, wo Dina allein war - er war in der Lounge oder am Schiedsrichtertisch.",
    },
    {
      text: "Anatoly war als Einziger auf einem Teppich, Boris eine Spalte westlich und zwei Zeilen nördlich von ihm. Auf R1 oder R3 fände Boris keinen Platz. In der Lounge (R7) stünde Boris in R5 der Turnierhalle, mit ihm Efim; Omid müsste mit Fabiano an den Schiedsrichtertisch - Fabiano in R8 C7, Omid in R6 C8 - und Gaja bliebe in der Lounge keine Zeile. Anatoly war also in R4 der Turnierhalle, Boris in R2.",
    },
    {
      text: "Mit Anatoly, Boris und Chantal ist die Turnierhalle voll. Efim, Fabiano, Gaja und Omid waren in der Lounge oder am Schiedsrichtertisch (R5 bis R8), also besetzen Chantal und Dina R1 und R3. Chantal war in R3 der Turnierhalle: Dort ist nur R3 C2 kein Schachtisch und kein Teppich. Dina war in R1.",
      place: { C: { row: 2, col: 1 } },
    },
    {
      text: "In R5 ist nur R5 C8 frei, dort stand jemand - Efim oder Omid, denn dort ist keine Pflanze für Fabiano. Dina saß in R1 auf einem Stuhl. In R1 C8 wäre niemand östlich von ihr, in R1 C7 bliebe Fabiano nur R7 C8 - in C8, wie R5 C8. Dina war in R1 C1.",
      place: { D: { row: 0, col: 0 } },
    },
    {
      text: "Stünde Anatoly in R4 C4 und Boris in R2 C3, wäre Efim in R5 C8 auf keiner Diagonale mit ihnen, also wäre Omid dort. Fabiano bliebe nur R8 C7 neben der Pflanze, und für Efim und Gaja blieben C5 und C6 in R6 und R7 - in C6 steht dort der Tisch. Also war Anatoly in R4 C6 und Boris in R2 C5.",
      place: { A: { row: 3, col: 5 }, B: { row: 1, col: 4 } },
    },
    {
      text: "Frei sind noch C3, C4 und C7 in R6 bis R8. Stünde Omid in R5 C8, wäre Efim auf einer Diagonale mit Anatoly nur in R6 C4 - und Fabiano müsste zu Omid an den Schiedsrichtertisch nach R8 C7, Gaja auf den Teppich in R7 C3. Also stand Efim in R5 C8, auf einer Diagonale mit Boris.",
      place: { E: { row: 4, col: 7 } },
    },
    {
      text: "Stünde Fabiano in R8 C7, blieben Gaja und Omid nur R6 und R7 in C3 und C4 - R7 C3 und R7 C4 sind Teppiche. Fabiano war in R8 C3 neben der Pflanze, Gaja in R6 C4 und Omid auf dem Stuhl in R7 C7. Am Schiedsrichtertisch war Omid allein mit Efim - Efim ist der Mörder!",
      place: {
        F: { row: 7, col: 2 },
        G: { row: 5, col: 3 },
        O: { row: 6, col: 6 },
      },
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
