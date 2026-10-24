/**
 * Der Dorfplatz: a village square with its well, a cottage, a tavern, a
 * chapel, two noble houses, a garden and a workshop round it - and a
 * murdered knight.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/14.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Viviana is the victim; whoever was alone with her killed her.
 *
 * The book's estates: nobles (purple cards: Anna, Betsy, Clarence, Dean)
 * only in the crowned areas - Anna's house and Betsy's house - villagers
 * (wooden cards: Eli, Floretia, Gideon, Harriet) only in the others, knights
 * (grey shields: Isolde, Jerome, Katharina, Viviana) anywhere. Anna, Betsy
 * and Gideon were each in the area named after them.
 *
 * The doors sit in the walls between two areas; a field is in front of a
 * door when the door lies on one of its sides - on either side of the wall
 * ({@link DOORS}). Beds, rugs, chairs and the horses can be stood on; the
 * well cannot (the legend says so), nor can pots, the barrel, tables and
 * flowers.
 */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  own,
  ranks,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The crowned areas: Anna's house and Betsy's house. */
const CROWNED: readonly string[] = ["A", "B"];

/** The nobles, one of whom stood a row north of Eli. */
const NOBLES: readonly string[] = ["A", "B", "C", "D"];

/** Who stood in the area named after them, and its key. */
const OWNERS: Readonly<Record<string, string>> = { A: "A", B: "B", G: "G" };

/** The doors: the two fields on either side of each. */
const DOORS: readonly (readonly [Cell, Cell])[] = [
  [
    { row: 2, col: 3 },
    { row: 3, col: 3 },
  ],
  [
    { row: 3, col: 8 },
    { row: 4, col: 8 },
  ],
  [
    { row: 5, col: 2 },
    { row: 5, col: 3 },
  ],
  [
    { row: 6, col: 9 },
    { row: 6, col: 10 },
  ],
  [
    { row: 7, col: 6 },
    { row: 8, col: 6 },
  ],
  [
    { row: 7, col: 8 },
    { row: 8, col: 8 },
  ],
];

/** Whether a door lies on one of a field's sides. */
function beforeDoor(cell: Cell): boolean {
  return DOORS.some((door) =>
    door.some((one) => one.row === cell.row && one.col === cell.col),
  );
}

/** Whether exactly one person stood on a thing of this id. */
function onlyOneOn(c: Context, what: string): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, what);
    }).length === 1
  );
}

/** Whether a field is a corner of the whole map. */
function mapCorner(c: Context, cell: Cell): boolean {
  return (
    (cell.row === 0 || cell.row === c.rows - 1) &&
    (cell.col === 0 || cell.col === c.cols - 1)
  );
}

/** The case. */
export const THE_VILLAGE_SQUARE: Level = {
  id: "the-village-square",
  name: "Der Dorfplatz",
  series: { book: "timeTravel", number: 14 },
  story:
    "Ruf den Ausrufer: Es hat einen Mord gegeben! Ach, er hat es schon überall ausgerufen. Na ja, das ergibt Sinn.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "C",
      name: "Häuschen",
      at: "im Häuschen",
      ground: "floor",
      tint: "#b8b4ae",
      label: { row: 2, col: 1 },
    },
    {
      key: "T",
      name: "Taverne",
      at: "in der Taverne",
      ground: "floor",
      tint: "#c4beb4",
      label: { row: 3, col: 6 },
    },
    {
      key: "K",
      name: "Kapelle",
      at: "in der Kapelle",
      ground: "floor",
      tint: "#e2dcd8",
      label: { row: 6, col: 10 },
    },
    {
      key: "P",
      name: "Dorfplatz",
      at: "auf dem Dorfplatz",
      ground: "stone",
      tint: "#e6e2dc",
      label: { row: 8, col: 9 },
    },
    {
      key: "A",
      name: "Annas Haus",
      at: "in Annas Haus",
      ground: "floor",
      tint: "#c8b8d4",
      label: { row: 8, col: 0 },
    },
    {
      key: "G",
      name: "Gideons Garten",
      at: "in Gideons Garten",
      ground: "grass",
      tint: "#c4dc9c",
      label: { row: 11, col: 0 },
    },
    {
      key: "B",
      name: "Betsys Haus",
      at: "in Betsys Haus",
      ground: "floor",
      tint: "#d4c4dc",
      label: { row: 11, col: 5 },
    },
    {
      key: "W",
      name: "Werkstatt",
      at: "in der Werkstatt",
      ground: "floor",
      tint: "#e4e2e0",
      label: { row: 11, col: 9 },
    },
  ],
  areaMap: [
    "CCCCCTTTTTTT",
    "CCCCCTTTTTTT",
    "PCCCCCTTTTTT",
    "PPPPPPTTTKKK",
    "AAPPPPPPPKKK",
    "AAAPPPPPPKKK",
    "AAAPPPPPPPKK",
    "AAAPPPPPPPPP",
    "AAAGGPBBWPPP",
    "GGGGGBBBWWWW",
    "GGGGGBBBWWWW",
    "GGGGGBBBWWWW",
  ],
  thingMap: [
    "..bbpc.cbbk.",
    ".crr..ttcrr.",
    ".........ttp",
    "....h.rr.rr.",
    "c....h.....t",
    "b....ww.hc.c",
    "b.p..ww....c",
    "..b.h.......",
    "..b....b....",
    "....ft.br..c",
    ".f...c.pr...",
    "f..fft..t.bb",
  ],
  things: {
    b: "bed",
    c: "chair",
    f: "flowers",
    h: "horse",
    k: "barrel",
    p: "pot",
    r: "rug",
    t: "table",
    w: "well",
  },
  extraThings: {
    well: { name: "Brunnen", emoji: "\u{26F2}", standable: false },
  },
  pieces: [
    { at: { row: 0, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 8 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 9 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 9 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 9 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 5 }, rows: 2, cols: 2 },
    { at: { row: 7, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 8, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 9, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 11, col: 10 }, rows: 1, cols: 2 },
  ],
  // The doors, drawn in the walls between the areas.
  windows: [
    { at: { row: 2, col: 3 }, side: "bottom", door: true },
    { at: { row: 3, col: 8 }, side: "bottom", door: true },
    { at: { row: 5, col: 2 }, side: "right", door: true },
    { at: { row: 6, col: 9 }, side: "right", door: true },
    { at: { row: 7, col: 6 }, side: "bottom", door: true },
    { at: { row: 7, col: 8 }, side: "bottom", door: true },
  ],
  suspects: [
    {
      id: "A",
      name: "Anna",
      pronoun: "sie",
      traits: ["noble"],
      clue: {
        text: "Sie war die einzige Person auf einem Bett.",
        ...all(
          on("bed"),
          counting((c) => onlyOneOn(c, "bed")),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "B",
      name: "Betsy",
      pronoun: "sie",
      traits: ["noble"],
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#7c3aed",
      face: "\u{1F475}",
    },
    {
      id: "C",
      name: "Clarence",
      pronoun: "er",
      traits: ["noble"],
      clue: { text: "Er saß nicht auf einem Stuhl.", ...not(on("chair")) },
      colour: "#0e7490",
      face: "\u{1F474}",
    },
    {
      id: "D",
      name: "Dean",
      pronoun: "er",
      traits: ["noble"],
      clue: {
        text: "Er stand vor einer Tür.",
        ...own((c) => beforeDoor(c.cell)),
      },
      colour: "#ca8a04",
      face: "\u{1F934}",
    },
    {
      id: "E",
      name: "Eli",
      pronoun: "er",
      traits: ["villager"],
      clue: {
        text: "Genau eine Reihe nördlich von ihm war ein Adliger.",
        ...about(NOBLES, (c) =>
          NOBLES.some((id) => c.cellOf(id)?.row === c.cell.row - 1),
        ),
      },
      colour: "#57534e",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Floretia",
      pronoun: "sie",
      traits: ["villager"],
      clue: {
        text: "Sie war die einzige Person auf einem Teppich.",
        ...all(
          on("rug"),
          counting((c) => onlyOneOn(c, "rug")),
        ),
      },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "G",
      name: "Gideon",
      pronoun: "er",
      traits: ["villager"],
      clue: {
        text: "Er war genau eine Spalte westlich von Katharina.",
        ...about(["K"], (c) => c.cellOf("K")?.col === c.cell.col + 1),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Harriet",
      pronoun: "sie",
      traits: ["villager"],
      clue: {
        text: "Sie war in einer Ecke des Spielfelds.",
        ...own((c) => mapCorner(c, c.cell)),
      },
      colour: "#ea580c",
      face: "\u{1F9D5}",
    },
    {
      id: "I",
      name: "Isolde",
      pronoun: "sie",
      traits: ["knight"],
      clue: { text: "Sie ritt auf einem Pferd.", ...on("horse") },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "J",
      name: "Jerome",
      pronoun: "er",
      traits: ["knight"],
      clue: {
        text: "Er war in der Kapelle oder in Gideons Garten.",
        ...inArea("K", "G"),
      },
      colour: "#0f766e",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "K",
      name: "Katharina",
      pronoun: "sie",
      traits: ["knight"],
      clue: { text: "Sie war neben dem Brunnen.", ...beside("well") },
      colour: "#a16207",
      face: "\u{1F469}",
    },
    {
      id: "V",
      name: "Viviana",
      pronoun: "sie",
      traits: ["knight"],
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#78716c",
      face: "\u{1F469}‍\u{1F9B1}",
    },
  ],
  rules: [
    ranks(
      "Adlige (\u{1F451}) waren nur in Annas und Betsys Haus, Dorfbewohner nur in den anderen Bereichen, Ritter überall.",
      CROWNED,
    ),
    {
      text: "Anna, Betsy und Gideon waren jeweils in ihrem eigenen Bereich.",
      unary: (suspect, c) =>
        OWNERS[suspect.id] === undefined ||
        c.areaOf(c.cell) === OWNERS[suspect.id],
    },
  ],
  hints: [
    {
      text: "Betsy ist in ihrem eigenen Haus und sitzt auf einem Stuhl - dort gibt es nur den Stuhl in R11 C6.",
      place: { B: { row: 10, col: 5 } },
    },
    {
      text: "Katharina steht neben dem Brunnen, Gideon eine Spalte westlich von ihr in seinem Garten (C1 bis C5). Katharina ist also höchstens in C6 - und C6 ist Betsys Spalte. Sie steht in C5 (R6 C5 oder R7 C5), Gideon in C4. Isolde reitet ein Pferd: R4 C5 und R8 C5 liegen in Katharinas Spalte, R5 C6 in Betsys. Isolde reitet in R6 C9, und Katharina steht in R7 C5.",
      place: { I: { row: 5, col: 8 }, K: { row: 6, col: 4 } },
    },
    {
      text: "Die Adligen sind nur in den beiden Häusern, frühestens in R5 - Eli kann also nicht in R1 bis R4 stehen. In R3 gibt es weder Teppich, Pferd, Bett noch Ecke, und Kapelle und Garten beginnen erst in R4 und R9: Dort passt nur Viviana. In R2 bleibt dann nur Floretia auf einem Teppich, in R1 nur Harriet in einer Ecke. In R4 passt nur noch Jerome in der Kapelle - auf R4 C12, denn die Teppiche gehören Floretia allein.",
      place: { J: { row: 3, col: 11 } },
    },
    {
      text: "In R5 kann nur Clarence stehen, in Annas Haus und nicht auf dem Stuhl: R5 C2.",
      place: { C: { row: 4, col: 1 } },
    },
    {
      text: "R6 ist Isoldes Zeile, also steht Dean nicht vor der Tür in R6 C3, sondern vor der Tür in R9 C7. Anna liegt allein auf einem Bett in ihrem Haus: R6 C1 und R7 C1 liegen in Isoldes und Katharinas Zeile, R9 C3 in Deans - sie liegt in R8 C3. Gideon steht in R10 C4 (R9 ist Deans Zeile).",
      place: {
        D: { row: 8, col: 6 },
        A: { row: 7, col: 2 },
        G: { row: 9, col: 3 },
      },
    },
    {
      text: "Für Eli bleibt nur R12, mit Betsy eine Reihe nördlich. C2 und C3 sind besetzt, Betsys Haus ist für Dorfbewohner verboten, und auf dem Bett liegt nur Anna: Eli steht in R12 C10. Harriet steht in R1 C1 (C12 ist Jeromes Spalte), Floretia auf dem Teppich in R2 C11, und Viviana bleibt C8: R3 C8 in der Taverne, allein mit Floretia. Floretia ist die Mörderin!",
      place: {
        E: { row: 11, col: 9 },
        H: { row: 0, col: 0 },
        F: { row: 1, col: 10 },
        V: { row: 2, col: 7 },
      },
    },
  ],
  solution: {
    A: { row: 7, col: 2 },
    B: { row: 10, col: 5 },
    C: { row: 4, col: 1 },
    D: { row: 8, col: 6 },
    E: { row: 11, col: 9 },
    F: { row: 1, col: 10 },
    G: { row: 9, col: 3 },
    H: { row: 0, col: 0 },
    I: { row: 5, col: 8 },
    J: { row: 3, col: 11 },
    K: { row: 6, col: 4 },
    V: { row: 2, col: 7 },
  },
};
