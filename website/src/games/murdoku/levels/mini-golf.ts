/**
 * Minigolf: a mini golf course with a desert, a barrel lane, an island, a
 * winding walkway and the entrance, and a murdered player.
 *
 * @module
 * @remarks
 * After the hard case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Schwer/Minigolf/Minigolf.png`, no solution
 * sheet and no hints - the solver proves the single solution). Valeria is
 * the victim; whoever was alone with her killed her. Flags and chairs can be
 * stood on, and so can sand tiles, path fields and the water; cacti, flowers,
 * tables, barrels and the potted plant cannot. A corner is a field whose area
 * ends (or the map does) on two sides that meet.
 */
import {
  all,
  beside,
  counting,
  inArea,
  on,
  onGround,
  own,
  row,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** How many people stand on a field that passes a test. */
function countWhere(c: Context, test: (cell: Cell) => boolean): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && test(there);
  }).length;
}

/** Whether nobody but the suspect stands on a field that passes a test. */
function nobodyElse(c: Context, test: (cell: Cell) => boolean): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !test(there);
  });
}

/** Whether a field's area ends on two sides of it that meet. */
function isCorner(c: Context, cell: Cell): boolean {
  const area = c.areaOf(cell);
  const ends = (rowStep: number, colStep: number): boolean =>
    c.areaOf({ row: cell.row + rowStep, col: cell.col + colStep }) !== area;
  const north = ends(-1, 0);
  const south = ends(1, 0);
  const west = ends(0, -1);
  const east = ends(0, 1);
  return (north || south) && (west || east);
}

/** Whether somebody on a flag stands exactly one row north of the suspect. */
function southOfFlagPerson(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      there !== undefined &&
      c.is(there, "flag") &&
      there.row === c.cell.row - 1
    );
  });
}

/** Whether a flag stands anywhere in the row north of the suspect. */
function flagInRowNorth(c: Context): boolean {
  const north = c.cell.row - 1;
  return Array.from({ length: c.cols }, (_, col) => ({ row: north, col })).some(
    (cell) => c.inside(cell) && c.is(cell, "flag"),
  );
}

/** The case. */
export const MINI_GOLF: Level = {
  id: "mini-golf",
  name: "Minigolf",
  difficulty: "hard",
  story:
    "Valeria wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Die Wüste",
      at: "in der Wüste",
      ground: "grass",
      tint: "#a8dca0",
      label: { row: 3, col: 0 },
    },
    {
      key: "G",
      name: "Gehweg",
      at: "auf dem Gehweg",
      ground: "grass",
      tint: "#7cc56f",
      label: { row: 8, col: 4 },
    },
    {
      key: "F",
      name: "Die Fässer",
      at: "bei den Fässern",
      ground: "grass",
      tint: "#a4dca0",
      label: { row: 5, col: 6 },
    },
    {
      key: "I",
      name: "Die Insel",
      at: "auf der Insel",
      ground: "grass",
      island: true,
      tint: "#a8dca4",
      label: { row: 8, col: 2 },
    },
    {
      key: "E",
      name: "Eingang",
      at: "am Eingang",
      ground: "stone",
      tint: "#e2ddd0",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "WWWWWGGGGG",
    "WWWWWGGGGG",
    "WWGGGGGGGG",
    "WWGGGFFFFG",
    "GGGGGFFFFF",
    "GGGGGFFFFF",
    "IIIGGGEEEE",
    "IIIIGEEEEE",
    "IIIIGEEEEE",
    "IIIIGGEEEE",
  ],
  groundMap: [
    "gggggppggg",
    "gssggpppgg",
    "ssggggppgg",
    "gggggggggg",
    "ppgggggggg",
    "ppggggssgg",
    "wwwppprrrr",
    "wgggprrrrr",
    "gggwgrrrrr",
    "ggwwggrrrr",
  ],
  grounds: { g: "grass", s: "sand", p: "path", w: "water", r: "stone" },
  thingMap: [
    "....c..ttb",
    "....f.....",
    "...h......",
    ".c.....a..",
    "........a.",
    "..b..f....",
    ".........t",
    ".......ttt",
    "f........p",
    ".....bhh..",
  ],
  things: {
    a: "barrel",
    b: "flowers",
    c: "cactus",
    f: "flag",
    h: "chair",
    p: "plant",
    t: "table",
  },
  extraThings: {
    flag: { name: "Fahne", emoji: "\u{1F6A9}", standable: true },
  },
  suspects: [
    {
      id: "A",
      name: "Albert",
      pronoun: "er",
      clue: {
        text: "Er war genau eine Reihe südlich von jemandem auf einer Fahne.",
        ...all(own(flagInRowNorth), counting(southOfFlagPerson)),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Burma",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("seat") },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Craig",
      pronoun: "er",
      clue: {
        text: "Er war nicht in einer Ecke.",
        ...own((c) => !isCorner(c, c.cell)),
      },
      colour: "#0e7490",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "D",
      name: "Duncan",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Wegfeld.",
        ...all(
          onGround("path"),
          own((c) => nobodyElse(c, (cell) => c.groundAt(cell) === "path")),
          counting(
            (c) => countWhere(c, (cell) => c.groundAt(cell) === "path") === 1,
          ),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Elyana",
      pronoun: "sie",
      clue: { text: "Sie war auf einer Sandkachel.", ...onGround("sand") },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "F",
      name: "Faith",
      pronoun: "sie",
      clue: {
        text: "Sie war allein.",
        ...counting((c) => c.peopleIn(c.areaOf(c.cell) ?? "").length === 1),
      },
      colour: "#9f1239",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "Ginny",
      pronoun: "sie",
      clue: { text: "Sie war in der obersten Reihe.", ...row(1) },
      colour: "#ea580c",
      face: "\u{1F475}",
    },
    {
      id: "H",
      name: "Hugo",
      pronoun: "er",
      clue: { text: "Er war neben ein paar Blumen.", ...beside("flowers") },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "I",
      name: "Idril",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit jemandem in der Wüste.",
        ...all(
          inArea("W"),
          counting((c) => c.peopleIn("W").length === 2),
        ),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "V",
      name: "Valeria",
      pronoun: "sie",
      clue: { text: "Das Opfer. Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F469}",
    },
  ],
  rules: [
    {
      text: "Genau eine Person war neben einem Tisch.",
      check: (c) => countWhere(c, (cell) => c.beside(cell, "table")) === 1,
    },
    {
      text: "Genau eine Person war neben einem Fass.",
      check: (c) => countWhere(c, (cell) => c.beside(cell, "barrel")) === 1,
    },
  ],
  hints: [
    {
      text: "G steht in R1. Die Felder dort sind entweder Wüste oder Wegfelder (die nur D betreten darf), also ist G in der Wüste. I war allein mit jemandem in der Wüste - das ist G, sonst niemand. Damit ist E auf einer Sandkachel bei den Fässern, in R6 C7 oder R6 C8. Blockiere den Rest von R6.",
      cross: [
        { row: 5, col: 0 },
        { row: 5, col: 1 },
        { row: 5, col: 3 },
        { row: 5, col: 4 },
        { row: 5, col: 5 },
        { row: 5, col: 8 },
        { row: 5, col: 9 },
      ],
    },
    {
      text: "H kann neben Blumen nur in R2 C10, R5 C3 oder R10 C5 sein - alle auf dem Gehweg, wie auch jedes Wegfeld für D. Also sind F (allein) und V nicht auf dem Gehweg. Die Felder neben einem Fass (R4 C7, R4 C9, R5 C8, R5 C10) liegen bei den Fässern; dort kann nur C oder V stehen. Und weil auf der Fahne in R6 niemand steht, ist A in R3 oder R10.",
    },
    {
      text: "In R7, R8 und R9 können nur C, D, F und V stehen. Einer von C und V ist neben einem Fass in R4 oder R5, also sind R7 bis R9 mit D, F und dem anderen besetzt. D steht auf einem Wegfeld in R7 oder R8, und die einzige Person neben einem Tisch ist am Eingang in C7, C8 oder C9.",
    },
    {
      text: "Säße B auf einem Stuhl in R10, belegten B und E die Spalten C7 und C8. Die Person neben dem Tisch müsste in C9 stehen und die Person neben einem Fass in R5 C10 - dann hätte H kein Feld mehr. Also sitzt B auf dem Stuhl in R3 C4, und A ist in R10, südlich von jemandem auf der Fahne in R9 C1.",
      place: { B: { row: 2, col: 3 } },
    },
    {
      text: "C1 gehört der Person auf der Fahne in R9 C1, also ist I in R2 und H in R5 C3. Damit bleibt für G nur R1 C2 und für I nur die Fahne in R2 C5.",
      place: {
        H: { row: 4, col: 2 },
        G: { row: 0, col: 1 },
        I: { row: 1, col: 4 },
      },
    },
    {
      text: "D bleibt nur das Wegfeld in R7 C6. In R8 ist nur noch R8 C7 frei, neben dem Tisch - also ist E in R6 C8, die Person neben einem Fass in R4 C9, und A in R10 C10.",
      place: {
        D: { row: 6, col: 5 },
        E: { row: 5, col: 7 },
        A: { row: 9, col: 9 },
      },
    },
    {
      text: "R4 C9 ist eine Ecke, also steht dort nicht C, sondern V. F war allein, also nicht mit A am Eingang: F steht auf der Fahne in R9 C1 und C in R8 C7. V war allein mit E bei den Fässern, Elyana ist die Mörderin!",
      place: {
        V: { row: 3, col: 8 },
        F: { row: 8, col: 0 },
        C: { row: 7, col: 6 },
      },
    },
  ],
  solution: {
    A: { row: 9, col: 9 },
    B: { row: 2, col: 3 },
    C: { row: 7, col: 6 },
    D: { row: 6, col: 5 },
    E: { row: 5, col: 7 },
    F: { row: 8, col: 0 },
    G: { row: 0, col: 1 },
    H: { row: 4, col: 2 },
    I: { row: 1, col: 4 },
    V: { row: 3, col: 8 },
  },
};
