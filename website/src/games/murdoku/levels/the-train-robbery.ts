/**
 * Der Zugüberfall: a train of a cargo wagon, a passenger wagon, a dining
 * wagon and the locomotive, four outlaws on board and a murdered passenger.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/30.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Vincent is the victim; whoever was alone with him killed him. No estates
 * in this case.
 *
 * **Every wagon is a grid of its own**: four by four, one person per row
 * and column of the wagon, four people in each wagon and three in the
 * locomotive (its front corners are missing). The engine knows one grid
 * only, so the wagons are laid out corner to corner along the diagonal of a
 * sixteen by sixteen map: wagon 1 in rows and columns 1-4, wagon 2 in 5-8,
 * wagon 3 in 9-12, the locomotive in 13-16. Then one person per row and
 * column of the map is the same as one per row and column of each wagon,
 * and "north", "southwest" or "the bottom row of the wagon" mean the same
 * as on the page ({@link WAGON}).
 *
 * Exactly four suspects are outlaws, one in every wagon. Barney, Hector and
 * Margaret are outlaws, Vincent is not; the fourth follows from the clues
 * of Elena and Nicolas ({@link outlawsFit}). Nicolas is "with an outlaw",
 * so the outlaw in the kitchen is somebody else, never Nicolas himself.
 *
 * The cargo wagon's safe room is only its top-left two by two fields (the
 * safe, a sack and the two fields below them) - a thick wall runs between
 * its second and third column; the rest of the wagon is the luggage. The
 * yellow L-shaped piece in the passenger wagon's corridor is a rug, like the
 * one in the kitchen. Each compartment has a bed over two fields (top
 * right in A, bottom left in B). Chairs, beds and both rugs can be stood
 * on; the fire (as the legend says), sacks, the safe, crates, shelves,
 * plants, tables and the coal cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
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

/** The size of one wagon. */
const WAGON = 4;

/** The areas of the locomotive. */
const LOCOMOTIVE: readonly string[] = ["O", "L", "Z"];

/** The suspects the clues name as outlaws. */
const KNOWN_OUTLAWS: readonly string[] = ["B", "H", "M"];

/** The suspects who may be the fourth outlaw. */
const MAYBE_OUTLAWS: readonly string[] = [
  "A",
  "C",
  "D",
  "E",
  "F",
  "G",
  "I",
  "J",
  "K",
  "L",
];

/** Which wagon a field is in, from nought. */
function wagonOf(cell: Cell): number {
  return Math.floor(cell.row / WAGON);
}

/** Whether these four outlaws fit every clue about outlaws. */
function fourFit(c: Context, outlaws: readonly string[]): boolean {
  const cells = outlaws.map((id) => c.cellOf(id));
  const wagons = new Set(
    cells.map((cell) => (cell === undefined ? -1 : wagonOf(cell))),
  );
  const elena = c.cellOf("E");
  return (
    !wagons.has(-1) &&
    wagons.size === outlaws.length &&
    elena !== undefined &&
    cells.some(
      (cell) =>
        cell !== undefined &&
        wagonOf(cell) === wagonOf(elena) &&
        cell.row === elena.row + 1,
    ) &&
    outlaws.some((id) => id !== "N" && areaOfPerson(c, id) === "C")
  );
}

/** Whether a fourth outlaw can be found so that every clue holds. */
function outlawsFit(c: Context): boolean {
  return MAYBE_OUTLAWS.some((id) => fourFit(c, [...KNOWN_OUTLAWS, id]));
}

/** The area of somebody, or an empty string while not placed. */
function areaOfPerson(c: Context, id: string): string {
  const there = c.cellOf(id);
  return there === undefined ? "" : (c.areaOf(there) ?? "");
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

/** How many people stand on a thing of this id or in one of these areas. */
function countWhere(c: Context, test: (cell: Cell) => boolean): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && test(there);
  }).length;
}

/**
 * For the solver only: whether the case can still be finished - at most
 * three in the locomotive, one on a rug, nobody with Barney, nobody
 * crowding Vincent, and the known outlaws in different wagons.
 */
function stillPossible(c: Context): boolean {
  const barney = c.cellOf("B");
  const vincent = c.cellOf("V");
  const known = KNOWN_OUTLAWS.map((id) => c.cellOf(id)).filter(
    (cell): cell is Cell => cell !== undefined,
  );
  return (
    countWhere(c, (cell) => LOCOMOTIVE.includes(c.areaOf(cell) ?? "")) <= 3 &&
    countWhere(c, (cell) => c.is(cell, "rug")) <= 1 &&
    (barney === undefined || c.peopleIn(c.areaOf(barney) ?? "").length === 1) &&
    (vincent === undefined ||
      c.peopleIn(c.areaOf(vincent) ?? "").length <= 2) &&
    new Set(known.map(wagonOf)).size === known.length
  );
}

/** Whether three people were in the locomotive. */
function threeInLocomotive(c: Context): boolean {
  return (
    c.people().filter((id) => LOCOMOTIVE.includes(areaOfPerson(c, id)))
      .length === 3
  );
}

/** The case. */
export const THE_TRAIN_ROBBERY: Level = {
  id: "the-train-robbery",
  name: "Der Zugüberfall",
  series: { book: "timeTravel", number: 30 },
  story: "Es wird schwer, diesen Fall zu lösen, ohne dass er entgleist.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Tresorraum",
      at: "im Tresorraum des Güterwagens",
      ground: "floor",
      tint: "#e2d6d3",
      label: { row: 1, col: 0 },
    },
    {
      key: "Q",
      name: "Gepäck",
      at: "beim Gepäck des Güterwagens",
      ground: "floor",
      tint: "#e8dcd2",
      label: { row: 3, col: 0 },
    },
    {
      key: "A",
      name: "Abteil A",
      at: "in Abteil A des Personenwagens",
      ground: "floor",
      tint: "#ecebe4",
      label: { row: 4, col: 5 },
    },
    {
      key: "P",
      name: "Gang",
      at: "im Gang des Personenwagens",
      ground: "floor",
      tint: "#f3e7a6",
      label: { row: 6, col: 4 },
    },
    {
      key: "B",
      name: "Abteil B",
      at: "in Abteil B des Personenwagens",
      ground: "floor",
      tint: "#ecebe4",
      label: { row: 7, col: 5 },
    },
    {
      key: "D",
      name: "Speiseraum",
      at: "im Speiseraum des Speisewagens",
      ground: "floor",
      tint: "#f1efea",
      label: { row: 10, col: 10 },
    },
    {
      key: "C",
      name: "Küche",
      at: "in der Küche des Speisewagens",
      ground: "floor",
      tint: "#e6e4dc",
      label: { row: 11, col: 8 },
    },
    {
      key: "O",
      name: "Kohlenbunker",
      at: "im Kohlenbunker der Lokomotive",
      ground: "stone",
      tint: "#b9c2d6",
      label: { row: 13, col: 12 },
    },
    {
      key: "L",
      name: "Kessel",
      at: "am Kessel der Lokomotive",
      ground: "stone",
      tint: "#b8a99a",
      label: { row: 14, col: 14 },
    },
    {
      key: "Z",
      name: "Führerstand",
      at: "im Führerstand der Lokomotive",
      ground: "stone",
      tint: "#b3c3e3",
      label: { row: 15, col: 12 },
    },
  ],
  areaMap: [
    "KKQQ............",
    "KKQQ............",
    "QQQQ............",
    "QQQQ............",
    "....AAAA........",
    "....APPP........",
    "....PPPB........",
    "....BBBB........",
    "........DDDD....",
    "........DDDD....",
    "........CDDD....",
    "........CCCC....",
    "............OOO.",
    "............OOLL",
    "............ZZLL",
    "............ZZZ.",
  ],
  thingMap: [
    "sf.c............",
    "...s............",
    ".c..............",
    "c.c.............",
    "....ehbb........",
    ".....prr........",
    "....rrr.........",
    "....bbeh........",
    "........hthp....",
    "................",
    ".........hth....",
    ".........rr.....",
    "............ckk.",
    "............k..x",
    "...............x",
    ".............s..",
  ],
  things: {
    b: "bed",
    c: "woodCrate",
    e: "shelf",
    f: "safe",
    h: "chair",
    k: "coal",
    p: "plant",
    r: "rug",
    s: "sack",
    t: "table",
    x: "campfire",
  },
  extraThings: {
    safe: { name: "Tresor", emoji: "\u{1F512}", standable: false },
  },
  pieces: [
    { at: { row: 4, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 11, col: 9 }, rows: 1, cols: 2 },
  ],
  shapes: [
    [
      { row: 5, col: 6 },
      { row: 5, col: 7 },
      { row: 6, col: 6 },
      { row: 6, col: 5 },
      { row: 6, col: 4 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Amira",
      pronoun: "sie",
      clue: {
        text: "Sie war in der ersten Spalte ihres Wagens.",
        ...own((c) => c.cell.col % WAGON === 0),
      },
      colour: "#b91c1c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "B",
      name: "Barney",
      pronoun: "er",
      clue: {
        text: "Ein Gesetzloser. Er war allein in seinem Bereich.",
        ...all(
          counting((c) => c.peopleIn(c.areaOf(c.cell) ?? "").length === 1),
          counting(outlawsFit),
        ),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Cassandra",
      pronoun: "sie",
      clue: {
        text: "Sie war in der untersten Zeile ihres Wagens.",
        ...own((c) => c.cell.row % WAGON === WAGON - 1),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Danny",
      pronoun: "er",
      clue: {
        text: "Er war in der untersten Zeile der Lokomotive.",
        ...all(
          inArea(...LOCOMOTIVE),
          own((c) => c.cell.row % WAGON === WAGON - 1),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Elena",
      pronoun: "sie",
      clue: {
        text: "Sie war eine Zeile nördlich des Gesetzlosen ihres Wagens.",
        ...counting(outlawsFit),
      },
      colour: "#a16207",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "F",
      name: "Frankie",
      pronoun: "er",
      clue: {
        text: "Er war im selben Wagen wie Cassandra und Margaret.",
        ...about(["C", "M"], (c) =>
          ["C", "M"].every((id) => {
            const there = c.cellOf(id);
            return there !== undefined && wagonOf(there) === wagonOf(c.cell);
          }),
        ),
      },
      colour: "#be185d",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "G",
      name: "Glenda",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#7c3aed",
      face: "\u{1F475}",
    },
    {
      id: "H",
      name: "Hector",
      pronoun: "er",
      clue: {
        text: "Ein Gesetzloser. Er war neben dem Tresor.",
        ...all(beside("safe"), counting(outlawsFit)),
      },
      colour: "#0f766e",
      face: "\u{1F9D4}\u{1F3FB}",
    },
    {
      id: "I",
      name: "Ike",
      pronoun: "er",
      clue: { text: "Er war neben einem Sack.", ...beside("sack") },
      colour: "#9333ea",
      face: "\u{1F474}",
    },
    {
      id: "J",
      name: "Juan",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Teppich.",
        ...all(
          on("rug"),
          counting((c) => onlyOneOn(c, "rug")),
        ),
      },
      colour: "#78716c",
      face: "\u{1F9D4}",
    },
    {
      id: "K",
      name: "Kirk",
      pronoun: "er",
      clue: {
        text: "Er war im selben Bereich wie Glenda.",
        ...about(["G"], (c) => areaOfPerson(c, "G") === c.areaOf(c.cell)),
      },
      colour: "#ca8a04",
      face: "\u{1F920}",
    },
    {
      id: "L",
      name: "Lilianna",
      pronoun: "sie",
      clue: { text: "Sie war im Güterwagen.", ...inArea("K", "Q") },
      colour: "#db2777",
      face: "\u{1F469}\u{1F3FB}",
    },
    {
      id: "M",
      name: "Margaret",
      pronoun: "sie",
      clue: {
        text: "Eine Gesetzlose. Sie war südwestlich von Frankie.",
        ...all(
          about(["F"], (c) => {
            const frankie = c.cellOf("F");
            return (
              frankie !== undefined &&
              c.cell.row > frankie.row &&
              c.cell.col < frankie.col
            );
          }),
          counting(outlawsFit),
        ),
      },
      colour: "#1d4ed8",
      face: "\u{1F977}",
    },
    {
      id: "N",
      name: "Nicolas",
      pronoun: "er",
      clue: {
        text: "Er war in der Küche, mit einem Gesetzlosen.",
        ...all(inArea("C"), counting(outlawsFit)),
      },
      colour: "#4d7c0f",
      face: "\u{1F935}",
    },
    {
      id: "V",
      name: "Vincent",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Kein Gesetzloser. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F920}",
    },
  ],
  rules: [
    {
      text: "Jeder Wagen hat sein eigenes Raster: vier Personen in jedem Wagen, drei in der Lokomotive, eine pro Zeile und Spalte des Wagens.",
      check: threeInLocomotive,
    },
    {
      text: "Es gibt genau vier Gesetzlose, jeder in einem anderen Wagen.",
      note: true,
    },
  ],
  prune: stillPossible,
  hints: [
    {
      text: "Hector steht neben dem Tresor, im selben Bereich: R1 C1 ist ein Sack, R1 C3 gehört schon zum Gepäck - also R2 C2. Er ist der Gesetzlose des Güterwagens.",
      place: { H: { row: 1, col: 1 } },
    },
    {
      text: "Im Güterwagen gehören Zeile 2 und Spalte 2 Hector. In Zeile 1 ist nur R1 C3 frei, in Zeile 4 nur R4 C4, in Zeile 3 dann nur R3 C1 - alle drei im Gepäck. Ike ist also nicht im Güterwagen (keiner der drei Plätze liegt an einem Sack), Vincent auch nicht (im Gepäck wäre er mit zwei Personen zusammen).",
    },
    {
      text: "Nicolas ist in der Küche mit einem Gesetzlosen, dem des Speisewagens. Die Küche hat nur die Zeilen 11 und 12, mehr als die beiden passen nicht hinein: einer steht in R11 C9, der andere in Zeile 12.",
    },
    {
      text: "Margaret ist nicht im Güterwagen (Hectors Wagen), Frankie und Cassandra sind im selben Wagen wie sie. In der Lokomotive wären sie mit Danny vier. Im Speisewagen wäre Margaret die Gesetzlose in der Küche, und Cassandra stünde in Zeile 12, also auch in der Küche - eine zu viel. Die drei sind im Personenwagen. Barney ist allein in seinem Bereich, also nicht in der Küche: Er ist in der Lokomotive.",
    },
    {
      text: "Glenda sitzt auf einem Stuhl, Kirk ist im selben Bereich. Im Personenwagen ist nur noch ein Platz frei, für beide reicht er nicht. Im Speisewagen sind Zeile 11 und Spalte 9 durch R11 C9 belegt - es bleibt der Stuhl R9 C11. Kirk steht im Speiseraum in Zeile 10. Der Speisewagen ist damit voll.",
      place: { G: { row: 8, col: 10 } },
    },
    {
      text: "Übrig sind Amira, Elena, Ike, Juan und Vincent: zwei in den Güterwagen, einer als Gesetzloser in die Küche, je einer in den Personenwagen und die Lokomotive. Ike und Vincent passen nicht in den Güterwagen, Juan auch nicht (kein Teppich). Also Amira und Elena: Elena eine Zeile nördlich von Hector in R1 C3, Amira in der ersten Spalte R3 C1, Lilianna R4 C4.",
      place: {
        E: { row: 0, col: 2 },
        A: { row: 2, col: 0 },
        L: { row: 3, col: 3 },
      },
    },
    {
      text: "Der Gesetzlose in der Küche ist also Juan (Ike steht an einem Sack, Vincent ist kein Gesetzloser). Er steht auf dem Teppich in Zeile 12, Spalte 11 ist Glendas: R12 C10. Nicolas steht in R11 C9, Kirk in R10 C12.",
      place: {
        J: { row: 11, col: 9 },
        N: { row: 10, col: 8 },
        K: { row: 9, col: 11 },
      },
    },
    {
      text: "Ike ist in der Lokomotive, Vincent im Personenwagen. In der Lokomotive hat Zeile 13 keinen freien Platz; Danny braucht Zeile 16, Ike neben dem Sack also R15 C14. Barney in Zeile 14, Spalte 14 ist Ikes: R14 C15 am Kessel. Danny R16 C13.",
      place: {
        I: { row: 14, col: 13 },
        B: { row: 13, col: 14 },
        D: { row: 15, col: 12 },
      },
    },
    {
      text: "Juan ist der Einzige auf einem Teppich, im Gang steht also niemand. Im Personenwagen bleibt in Zeile 6 nur R6 C5, in Zeile 7 nur R7 C8. Margaret steht südwestlich von Frankie, also nicht in Spalte 8: R6 C5. Cassandra steht in Zeile 8, Frankie nördlich von Margaret in Zeile 5 - Vincent also in R7 C8.",
      place: {
        M: { row: 5, col: 4 },
        V: { row: 6, col: 7 },
      },
    },
    {
      text: "Cassandra: Spalte 5 ist Margarets, Spalte 8 Vincents - R8 C6. Frankie: Spalte 6 ist Cassandras - R5 C7. In Abteil B war Vincent allein mit Cassandra. Cassandra ist die Mörderin!",
      place: {
        C: { row: 7, col: 5 },
        F: { row: 4, col: 6 },
      },
    },
  ],
  solution: {
    A: { row: 2, col: 0 },
    B: { row: 13, col: 14 },
    C: { row: 7, col: 5 },
    D: { row: 15, col: 12 },
    E: { row: 0, col: 2 },
    F: { row: 4, col: 6 },
    G: { row: 8, col: 10 },
    H: { row: 1, col: 1 },
    I: { row: 14, col: 13 },
    J: { row: 11, col: 9 },
    K: { row: 9, col: 11 },
    L: { row: 3, col: 3 },
    M: { row: 5, col: 4 },
    N: { row: 10, col: 8 },
    V: { row: 6, col: 7 },
  },
};
