/**
 * Der Oregon Trail: two forts, the west bank, the river and the east bank,
 * two outlaws hiding among the travellers and a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/27.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Viviana is the victim; whoever was alone with her killed her. The case
 * plays in the Wild West, so there are no estates.
 *
 * **Who the outlaws are is not printed - it is part of the puzzle.** There
 * are exactly two, Viviana is none of them, and both stood beside a wagon.
 * Exactly one outlaw stood beside the wagon Alice was on. The clues about
 * the outlaws hold when some pair fits them all ({@link someGang}).
 *
 * The map is twelve columns wide for nine people, so three columns stay
 * empty. Each wagon covers two fields; a field is beside a wagon when it is
 * next to one of them in the same area, the wagon's own fields not counted
 * ({@link besideWagon}). Hayes was beside a fort: next to a field of one of
 * the forts. Wagons can be stood on; buffaloes, oxen, trees, bushes,
 * boulders, crates and the shelves cannot.
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
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The three wagons, two fields each. */
const WAGONS: readonly (readonly Cell[])[] = [
  [
    { row: 1, col: 5 },
    { row: 1, col: 6 },
  ],
  [
    { row: 3, col: 9 },
    { row: 3, col: 10 },
  ],
  [
    { row: 5, col: 1 },
    { row: 5, col: 2 },
  ],
];

/** The keys of the two forts. */
const FORTS: readonly string[] = ["L", "K"];

/** Who may be an outlaw: everybody but Viviana. */
const MAYBE_OUTLAWS: readonly string[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
];

/** Every pair of outlaws. */
const GANGS: readonly (readonly string[])[] = MAYBE_OUTLAWS.flatMap(
  (first, at) => MAYBE_OUTLAWS.slice(at + 1).map((second) => [first, second]),
);

/** Whether two fields are the same. */
function same(one: Cell, other: Cell): boolean {
  return one.row === other.row && one.col === other.col;
}

/** Whether a field is next to a field of this wagon, in its area, but not on it. */
function besideThisWagon(
  c: Context,
  cell: Cell,
  wagon: readonly Cell[],
): boolean {
  return (
    !wagon.some((part) => same(part, cell)) &&
    c.neighbours(cell).some((next) => wagon.some((part) => same(part, next)))
  );
}

/** Whether a field is beside any wagon. */
function besideWagon(c: Context, cell: Cell): boolean {
  return WAGONS.some((wagon) => besideThisWagon(c, cell, wagon));
}

/** Whether every clue about the outlaws holds for this pair. */
function fits(c: Context, gang: readonly string[]): boolean {
  const alice = c.cellOf("A");
  const wagon = WAGONS.find((one) =>
    one.some((part) => alice !== undefined && same(part, alice)),
  );
  const cells = gang.flatMap((id) => {
    const there = c.cellOf(id);
    return there === undefined ? [] : [there];
  });
  return (
    wagon !== undefined &&
    cells.length === gang.length &&
    cells.every((there) => besideWagon(c, there)) &&
    cells.filter((there) => besideThisWagon(c, there, wagon)).length === 1
  );
}

/** Whether some pair of outlaws fits every clue about them. */
function someGang(c: Context): boolean {
  return GANGS.some((gang) => fits(c, gang));
}

/** Whether a field has a field of a fort next to it, in any area. */
function besideFort(c: Context): boolean {
  return [
    { row: c.cell.row - 1, col: c.cell.col },
    { row: c.cell.row + 1, col: c.cell.col },
    { row: c.cell.row, col: c.cell.col - 1 },
    { row: c.cell.row, col: c.cell.col + 1 },
  ].some((next) => FORTS.includes(c.areaOf(next) ?? ""));
}

/** Whether somebody else stands in Buck's area. */
function notAlone(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").length > 1;
}

/**
 * For the solver: whether nobody but one yet shares Viviana's area, and
 * enough people are left to stand beside a wagon as the two outlaws.
 *
 * @param c - the context, with the people placed so far
 * @returns false when the placement can no longer be finished
 */
function stillPossible(c: Context): boolean {
  const placed = c.people();
  const viviana = c.cellOf("V");
  const crowd =
    viviana === undefined ? 0 : c.peopleIn(c.areaOf(viviana) ?? "").length;
  const open = MAYBE_OUTLAWS.filter((id) => !placed.includes(id)).length;
  const besides = MAYBE_OUTLAWS.filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && besideWagon(c, there);
  }).length;
  return crowd <= 2 && besides + open >= 2;
}

/** The case. */
export const THE_OREGON_TRAIL: Level = {
  id: "the-oregon-trail",
  name: "Der Oregon Trail",
  series: { book: "timeTravel", number: 27 },
  story: "Immerhin ist niemand an der Ruhr gestorben!",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "L",
      name: "Fort Laramie",
      at: "in Fort Laramie",
      ground: "floor",
      tint: "#e6cfc3",
      label: { row: 2, col: 1 },
      labelOverhang: true,
    },
    {
      key: "W",
      name: "Westufer",
      at: "am Westufer",
      ground: "grass",
      tint: "#b9d39a",
      label: { row: 8, col: 0 },
    },
    {
      key: "R",
      name: "Fluss",
      at: "im Fluss",
      ground: "water",
      tint: "#b3d4ea",
      label: { row: 8, col: 6 },
    },
    {
      key: "E",
      name: "Ostufer",
      at: "am Ostufer",
      ground: "grass",
      tint: "#9fbf8a",
      label: { row: 4, col: 7 },
    },
    {
      key: "K",
      name: "Fort Kearny",
      at: "in Fort Kearny",
      ground: "floor",
      tint: "#e6cfc3",
      label: { row: 8, col: 9 },
    },
  ],
  areaMap: [
    "LLLWWWRREEEE",
    "LLLWRRRREEEE",
    "WLWWRRREEEEE",
    "WWWWRRREEEEE",
    "WWWWRRREEEEK",
    "WWWWRRRREEKK",
    "WWWWRRRREKKK",
    "WWWWWRRREKKK",
    "WWWWWRRREKKK",
  ],
  thingMap: [
    "xx...u......",
    "h...owg....t",
    "u..b....k...",
    ".u......oww.",
    "...........x",
    "oww.u...t...",
    ".....l......",
    "..b....l..h.",
    "...u.....hx.",
  ],
  things: {
    b: "buffalo",
    g: "wagon",
    h: "shelf",
    k: "barrel",
    l: "boulder",
    o: "ox",
    t: "tree",
    u: "shrub",
    w: "wagon",
    x: "woodCrate",
  },
  extraThings: {
    wagon: { name: "Planwagen", emoji: "\u{1F6FB}", standable: true },
    buffalo: {
      name: "Büffel",
      emoji: "\u{1F9AC}",
      standable: false,
      kinds: ["animal"],
    },
    ox: {
      name: "Ochse",
      emoji: "\u{1F402}",
      standable: false,
      kinds: ["animal"],
    },
  },
  pieces: [
    { at: { row: 1, col: 5 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 9 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 1 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Alice",
      pronoun: "sie",
      clue: {
        text: "Sie war auf einem Planwagen. Genau ein Gesetzloser war neben dem Planwagen.",
        ...all(on("wagon"), counting(someGang)),
      },
      colour: "#b91c1c",
      face: "\u{1F475}",
    },
    {
      id: "B",
      name: "Buck",
      pronoun: "er",
      clue: {
        text: "Er war in einem der Forts. Er war nicht allein.",
        ...all(inArea(...FORTS), counting(notAlone)),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Corianna",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Baum oder einem Strauch.",
        ...beside("plant"),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Diane",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Ochsen.", ...beside("ox") },
      colour: "#6366f1",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "E",
      name: "Enid",
      pronoun: "sie",
      clue: {
        text: "Sie war südlich von Buck. Sie war nicht im Fluss.",
        ...all(
          not(inArea("R")),
          about(["B"], (c) => {
            const buck = c.cellOf("B");
            return buck !== undefined && c.cell.row > buck.row;
          }),
        ),
      },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "F",
      name: "Fabian",
      pronoun: "er",
      clue: { text: "Er war neben einem Büffel.", ...beside("buffalo") },
      colour: "#a16207",
      face: "\u{1F482}",
    },
    {
      id: "G",
      name: "Gordon",
      pronoun: "er",
      clue: { text: "Er war neben einem Felsen.", ...beside("boulder") },
      colour: "#57534e",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Hayes",
      pronoun: "er",
      clue: {
        text: "Er war an einem der Ufer und neben einem Fort.",
        ...all(inArea("W", "E"), own(besideFort)),
      },
      colour: "#7c3aed",
      face: "\u{1F46E}",
    },
    {
      id: "V",
      name: "Viviana",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Keine Gesetzlose. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}‍\u{1F9B0}",
    },
  ],
  rules: [
    {
      text: "Es gab genau zwei Gesetzlose. Beide waren neben einem Planwagen.",
      check: someGang,
      prune: stillPossible,
    },
    {
      note: true,
      text: "Nichts hält so fit wie ein fast hundert Kilometer langer Tatort. Und dieser hat auch noch drei leere Spalten. - Chief Williams",
    },
  ],
  hints: [
    {
      text: "Neben den Planwagen im Fluss kann niemand außer Viviana und Alice stehen: Diane, Gordon und die anderen haben dort kein Feld, Enid ist nie im Fluss. Die beiden Gesetzlosen stehen also neben den Wagen am Ostufer (R4) und am Westufer (R6) - je einer, denn neben Alices Wagen steht genau einer. Neben dem Ostwagen kommen nur Hayes (R4 C12, R5 C11) oder Enid in Frage, neben dem Westwagen nur Corianna (R5 C2), Fabian (R7 C3) oder Enid. Alice sitzt auf einem dieser beiden Wagen. Und Buck hat in seinem Fort nur Enid oder Viviana zur Gesellschaft - sonst passt niemand in ein Fort.",
    },
    {
      text: "Säße Alice auf dem Ostwagen: Ist Hayes der Gesetzlose in R5 C11, sitzt Alice in R4 C10 - in Fort Kearny sind dann C10 und C11 belegt, für Buck und Gesellschaft bleibt dort nur C12. In Fort Laramie bräuchten sie C2 und C3, doch dort steht der Gesetzlose vom Westwagen (R7 C2 oder R7 C3, denn R5 ist Hayes' Zeile). Ist Enid die Gesetzlose am Ostwagen, ist Viviana Bucks Gesellschaft; Buck steht nördlich von Enid (R3 oder R5), also in Fort Laramie in C2 und C3 mit Viviana - und weder Corianna (R5 C2) noch Fabian (R7 C3) hätten noch Platz. Alice sitzt also auf dem Westwagen.",
    },
    {
      text: "In R6 C2 stünde der Gesetzlose vom Westwagen in C3 (R5 C3 oder R7 C3), Fort Laramie hätte für Buck nur noch C2 - Buck stünde mit Gesellschaft in Fort Kearny in R7 bis R9, dazu Gordon in R7 bis R9. Der Gesetzlose stünde dann in R5 C3, wo nur Enid stehen kann - nördlich von Buck. Alice sitzt in R6 C3.",
      place: { A: { row: 5, col: 2 } },
    },
    {
      text: "Der Gesetzlose am Westwagen steht jetzt in C2 (R5 C2 oder R7 C2), Fort Laramie bleibt ohne freie Spalte für Buck: Er ist in Fort Kearny. Wäre Enid eine Gesetzlose, wäre Viviana Bucks Gesellschaft, und Enid müsste in R8 oder R9 stehen - dort steht kein Gesetzloser. Also sind Corianna (R5 C2) und Hayes die Gesetzlosen; Hayes steht nicht in Coriannas Zeile, also in R4 C12.",
      place: { C: { row: 4, col: 1 }, H: { row: 3, col: 11 } },
    },
    {
      text: "In Fort Kearny bleiben für Buck und seine Gesellschaft R7 C10, R7 C11 und R8 C10 - zusammen passen nur R7 C11 und R8 C10. Mit Viviana dort bliebe Enid südlich von Buck kein Platz, denn Gordon braucht auch eine Zeile in R7 bis R9. Buck steht in R7 C11, Enid in R8 C10, Gordon neben einem Felsen in R9 C8.",
      place: {
        B: { row: 6, col: 10 },
        E: { row: 7, col: 9 },
        G: { row: 8, col: 7 },
      },
    },
    {
      text: "Fabian steht neben einem Büffel: R8 C4 ist Enids Zeile, also R2 C4. Diane steht neben einem Ochsen: R3 C5. Viviana steht in R1: R1 C7 im Fluss hätte zwei andere bei sich, also R1 C9 am Ostufer - allein mit Hayes. Hayes ist der Mörder!",
      place: {
        F: { row: 1, col: 3 },
        D: { row: 2, col: 4 },
        V: { row: 0, col: 8 },
      },
    },
  ],
  solution: {
    A: { row: 5, col: 2 },
    B: { row: 6, col: 10 },
    C: { row: 4, col: 1 },
    D: { row: 2, col: 4 },
    E: { row: 7, col: 9 },
    F: { row: 1, col: 3 },
    G: { row: 8, col: 7 },
    H: { row: 3, col: 11 },
    V: { row: 0, col: 8 },
  },
};
