/**
 * Mörderburger: a burger restaurant with its drive-in, kitchen, store room,
 * serving hatch, counter, dining area, back yard, car park and terrace, with
 * a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/78. Mörderburger.JPG`,
 * solved on `Lösungen 1-80/Lösung 77-80.JPG`).
 * Oona is the victim; whoever was alone with her killed her.
 *
 * Every car covers two fields and faces east: its west field is the back
 * seat, its east field the front seat. Cars and the armchairs (the chairs)
 * can be stood on; the bins cannot (the page says so), nor the tables (the
 * counter among them), the shelves, the cash registers and the plants. The
 * windows are the bars in the walls; standing in front of one means being on
 * a field right beside it, on either side of the wall.
 */
import {
  about,
  all,
  beside,
  cellsWhere,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level, Suspect } from "../engine/types";

/** The fields right in front of a window, on both sides of its wall. */
const WINDOWS: readonly Cell[] = [
  { row: 1, col: 8 },
  { row: 1, col: 9 },
  { row: 2, col: 8 },
  { row: 2, col: 9 },
  { row: 4, col: 9 },
  { row: 4, col: 10 },
  { row: 9, col: 3 },
  { row: 9, col: 4 },
  { row: 9, col: 5 },
  { row: 9, col: 6 },
  { row: 10, col: 3 },
  { row: 10, col: 4 },
  { row: 10, col: 5 },
  { row: 10, col: 6 },
];

/** The cars, each as its two fields. */
const CARS: readonly (readonly Cell[])[] = [
  [
    { row: 0, col: 3 },
    { row: 0, col: 4 },
  ],
  [
    { row: 1, col: 1 },
    { row: 1, col: 2 },
  ],
  [
    { row: 1, col: 5 },
    { row: 1, col: 6 },
  ],
  [
    { row: 1, col: 8 },
    { row: 1, col: 9 },
  ],
  [
    { row: 8, col: 0 },
    { row: 8, col: 1 },
  ],
  [
    { row: 9, col: 0 },
    { row: 9, col: 1 },
  ],
];

/** The employees, by id. */
const EMPLOYEES: readonly string[] = ["A", "B", "C", "D"];

/** Whether two fields are the same. */
function same(one: Cell, other: Cell): boolean {
  return one.row === other.row && one.col === other.col;
}

/** Whether two fields lie side by side. */
function touching(one: Cell, other: Cell): boolean {
  return Math.abs(one.row - other.row) + Math.abs(one.col - other.col) === 1;
}

/** Whether a field lies right in front of a window. */
function byWindow(cell: Cell): boolean {
  return WINDOWS.some((one) => same(one, cell));
}

/** Whether a field is next to a car, in its area, that nobody sat in. */
function besideEmptyCar(c: Context): boolean {
  return CARS.some(
    (car) =>
      car.some(
        (field) =>
          touching(field, c.cell) && c.areaOf(field) === c.areaOf(c.cell),
      ) && car.every((field) => c.personAt(field) === null),
  );
}

/** Whether the suspect was the only one on a back seat. */
function onlyOneOnABackSeat(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "carBack");
  });
}

/** Whether the drive-in held the suspect and one man, both in a car. */
function withAManInACar(c: Context): boolean {
  const others = c.peopleIn("V").filter((id) => id !== c.self);
  const other = others.length === 1 ? c.cellOf(others[0]) : undefined;
  return other !== undefined && c.has(others[0], "man") && c.is(other, "car");
}

/** Whether somebody sat on a chair one column west of the suspect. */
function seatedOneColumnWest(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined &&
      there.col === c.cell.col - 1 &&
      c.is(there, "chair")
    );
  });
}

/** Whether a man stood one column east of the suspect, in another area. */
function manOneColumnEast(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined &&
      c.has(id, "man") &&
      there.col === c.cell.col + 1 &&
      c.areaOf(there) !== c.areaOf(c.cell)
    );
  });
}

/** Whether every employee stood north-west of the suspect. */
function employeesNorthWest(c: Context): boolean {
  return EMPLOYEES.every((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined && there.row < c.cell.row && there.col < c.cell.col
    );
  });
}

/** Whether every employee but the suspect stood beside a table. */
function othersBesideTables(c: Context): boolean {
  return EMPLOYEES.every((id) => {
    const there = c.cellOf(id);
    return id === c.self || (there !== undefined && c.beside(there, "table"));
  });
}

/** Whether an employee stood neither on a chair nor in a car. */
function employeeOnFoot(suspect: Suspect, c: Context): boolean {
  return (
    !EMPLOYEES.includes(suspect.id) ||
    !(c.is(c.cell, "chair") || c.is(c.cell, "car"))
  );
}

/** Whoever stands in a column, by the column: there is exactly one. */
function inColumn(c: Context, col: number): string | undefined {
  return c.people().find((id) => c.cellOf(id)?.col === col);
}

/**
 * For the solver only: whether a partial placement can still come right.
 * Each column holds exactly one person, so Fabian's and Ingrid's neighbours
 * are known as soon as somebody stands in that column.
 */
function stillPossible(c: Context): boolean {
  const fabian = c.cellOf("F");
  const ingrid = c.cellOf("I");
  const gordon = c.cellOf("G");
  const west = fabian === undefined ? undefined : inColumn(c, fabian.col - 1);
  const east = ingrid === undefined ? undefined : inColumn(c, ingrid.col + 1);
  const westCell = west === undefined ? undefined : c.cellOf(west);
  const eastCell = east === undefined ? undefined : c.cellOf(east);
  const backSeats = c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "carBack");
  });
  return (
    backSeats.length <= 1 &&
    c.peopleIn("V").length <= 2 &&
    (westCell === undefined || c.is(westCell, "chair")) &&
    (east === undefined ||
      eastCell === undefined ||
      (ingrid !== undefined &&
        c.has(east, "man") &&
        c.areaOf(eastCell) !== c.areaOf(ingrid))) &&
    (gordon === undefined ||
      CARS.some(
        (car) =>
          car.some(
            (field) =>
              touching(field, gordon) && c.areaOf(field) === c.areaOf(gordon),
          ) && car.every((field) => c.personAt(field) === null),
      )) &&
    ["A", "B", "C"].every((id) => {
      const there = c.cellOf(id);
      return there === undefined || c.beside(there, "table");
    })
  );
}

/** The case. */
export const MURDER_BURGER: Level = {
  id: "murder-burger",
  name: "Mörderburger",
  series: { book: "original", number: 78 },
  story: "Sieht aus, als wäre jemandes Meal alles andere als Happy gewesen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "V",
      name: "Drive-in",
      at: "im Drive-in",
      ground: "path",
      tint: "#8e8bb0",
      label: { row: 1, col: 3 },
    },
    {
      key: "F",
      name: "Blumenbeet",
      at: "im Blumenbeet",
      ground: "grass",
      tint: "#b5cf72",
      label: { row: 6, col: 0 },
      labelOverhang: true,
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#f1e2b0",
      label: { row: 5, col: 3 },
    },
    {
      key: "L",
      name: "Lager",
      at: "im Lager",
      ground: "stone",
      tint: "#a9a2a0",
      label: { row: 3, col: 5 },
    },
    {
      key: "A",
      name: "Ausgabefenster",
      at: "am Ausgabefenster",
      ground: "floor",
      tint: "#f2c99a",
      label: { row: 3, col: 7 },
    },
    {
      key: "H",
      name: "Hinterhof",
      at: "im Hinterhof",
      ground: "path",
      tint: "#8e8bb0",
      label: { row: 6, col: 10 },
    },
    {
      key: "T",
      name: "Theke",
      at: "an der Theke",
      ground: "floor",
      tint: "#f6e3b4",
      label: { row: 6, col: 6 },
    },
    {
      key: "E",
      name: "Essbereich",
      at: "im Essbereich",
      ground: "floor",
      tint: "#f6cfaa",
      label: { row: 9, col: 5 },
    },
    {
      key: "P",
      name: "Parkplatz",
      at: "auf dem Parkplatz",
      ground: "path",
      tint: "#8e8bb0",
      label: { row: 11, col: 3 },
    },
    {
      key: "X",
      name: "Außenterrasse",
      at: "auf der Außenterrasse",
      ground: "stone",
      tint: "#f3e3b0",
      label: { row: 11, col: 9 },
    },
  ],
  areaMap: [
    ".VVVVVVVVV..",
    ".VVVVVVVVV..",
    "FFKKLLLAAA..",
    "FFKKLLLAAAHH",
    "FFKKKTTTTTHH",
    "FFKKKTTTTTHH",
    "FFEEETTTTTHH",
    "PPEEEEEEEXXX",
    "PPEEEEEEEXXX",
    "PPEEEEEEEXXX",
    "PPPPPPPPXXXX",
    "PPPPPPPPXXXX",
  ],
  thingMap: [
    "...ba.......",
    ".ba..ba.ba..",
    "....ssst....",
    ".p.t......w.",
    "...t........",
    ".pw..k.k..w.",
    "..t.wttt..w.",
    ".p......wctc",
    "bact.tt..c..",
    "bapc...ct.tc",
    "........pc.c",
    "............",
  ],
  things: {
    a: "car",
    b: "carBack",
    c: "chair",
    k: "cashRegister",
    p: "plant",
    s: "shelf",
    t: "table",
    w: "bin",
  },
  extraThings: {
    carBack: {
      name: "Auto (Rücksitz)",
      emoji: "\u{1F697}",
      standable: true,
      kinds: ["car"],
    },
    cashRegister: { name: "Kasse", emoji: "\u{1F4B5}", standable: false },
    bin: { name: "Mülleimer", emoji: "\u{1F5D1}️", standable: false },
  },
  pieces: [
    { at: { row: 0, col: 3 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 1, col: 1 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 1, col: 5 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 1, col: 8 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 8, col: 0 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 9, col: 0 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 3, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 5 }, rows: 1, cols: 3 },
  ],
  windows: [
    { at: { row: 2, col: 8 }, side: "top" },
    { at: { row: 2, col: 9 }, side: "top" },
    { at: { row: 4, col: 9 }, side: "right" },
    { at: { row: 9, col: 3 }, side: "bottom" },
    { at: { row: 9, col: 4 }, side: "bottom" },
    { at: { row: 9, col: 5 }, side: "bottom" },
    { at: { row: 9, col: 6 }, side: "bottom" },
  ],
  suspects: [
    {
      id: "A",
      name: "Amelia",
      pronoun: "sie",
      clue: {
        text: "Sie war vor einem Fenster.",
        ...own((c) => byWindow(c.cell)),
        glow: (level) => cellsWhere(level, byWindow),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Benno",
      pronoun: "er",
      clue: { text: "Er war neben einem Mülleimer.", ...beside("bin") },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Charlotte",
      pronoun: "sie",
      clue: { text: "Sie war an der Theke.", ...inArea("T") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Daryl",
      pronoun: "er",
      clue: {
        text: "Er war der einzige Angestellte, der nicht neben einem Tisch war.",
        ...all(not(beside("table")), counting(othersBesideTables)),
      },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Evangeline",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit einem Mann im Drive-in. Beide waren in einem Auto.",
        ...all(inArea("V"), on("car"), counting(withAManInACar)),
      },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "F",
      name: "Fabian",
      pronoun: "er",
      clue: {
        text: "Eine Spalte westlich von ihm war jemand auf einem Stuhl.",
        ...counting(seatedOneColumnWest),
      },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gordon",
      pronoun: "er",
      clue: {
        text: "Er war neben einem leeren Auto. Er war nicht in einem Auto.",
        ...all(beside("car"), not(on("car")), counting(besideEmptyCar)),
      },
      colour: "#ea580c",
      face: "\u{1F474}",
    },
    {
      id: "H",
      name: "Heidi",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person auf dem Rücksitz eines Autos.",
        ...all(on("carBack"), counting(onlyOneOnABackSeat)),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "I",
      name: "Ingrid",
      pronoun: "sie",
      clue: {
        text: "Eine Spalte östlich von ihr war ein Mann in einem anderen Raum.",
        ...counting(manOneColumnEast),
      },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "J",
      name: "Jonah",
      pronoun: "er",
      clue: {
        text: "Alle Angestellten waren nordwestlich von ihm.",
        ...about(EMPLOYEES, employeesNorthWest),
      },
      colour: "#78716c",
      face: "\u{1F9D4}",
    },
    {
      id: "K",
      name: "Kai",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#8b5cf6",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "O",
      name: "Oona",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}",
    },
  ],
  rules: [
    {
      text: "Amelia, Benno, Charlotte und Daryl sind Angestellte.",
    },
    {
      text: "Keine Angestellten waren auf einem Stuhl oder in einem Auto.",
      unary: employeeOnFoot,
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Evangeline und ein Mann besetzen den Drive-in, also muss Heidi in S1 sein.",
    },
    {
      text: "Gordon, neben einem leeren Auto, kann nur in Z11 S2 sein. Da das Auto neben Gordon leer ist, lokalisiert das Heidi.",
      place: { G: { row: 10, col: 1 }, H: { row: 8, col: 0 } },
    },
    {
      text: "Der Mann mit Evangeline muss Fabian sein; beide waren laut Heidis Hinweis vorne in einem Auto. Fabian muss in Z1 S5 sein, dem einzigen Vordersitz mit einem Stuhl eine Spalte westlich. Dieser Stuhl, Z10 S4, ist von jemandem besetzt. Schließe den Rest von Z10 und S4 aus.",
      place: { F: { row: 0, col: 4 } },
    },
    {
      text: "Das lokalisiert Amelia und Benno, die laut Daryls Hinweis neben Tischen sein müssen.",
      place: { A: { row: 2, col: 8 }, B: { row: 4, col: 2 } },
    },
    {
      text: "Das lokalisiert Charlotte (auch neben einem Tisch), dann Evangeline im Drive-in. Jemand muss im einzigen Feld sein, das in Z7 übrig ist; schließe den Rest von S12 aus. Alle Stühle bis auf einen sind blockiert, also muss Kai die Person auf dem Stuhl in Z10 S4 sein.",
      place: {
        C: { row: 5, col: 6 },
        E: { row: 1, col: 9 },
        K: { row: 9, col: 3 },
      },
    },
    {
      text: "Ingrid kann nur in S11 sein (in Z12, dem einzigen übrigen Feld), um einen Mann eine Spalte östlich von ihr zu haben. Dieser Mann muss Jonah sein (was ihn im Hinterhof lokalisiert), was Daryl lokalisiert, nordwestlich von Jonah im Lager.",
      place: {
        I: { row: 11, col: 10 },
        J: { row: 6, col: 11 },
        D: { row: 3, col: 5 },
      },
    },
    {
      text: "Das lokalisiert Oona im Essbereich. Kai ist der Mörder!",
      place: { O: { row: 7, col: 7 } },
    },
  ],
  solution: {
    A: { row: 2, col: 8 },
    B: { row: 4, col: 2 },
    C: { row: 5, col: 6 },
    D: { row: 3, col: 5 },
    E: { row: 1, col: 9 },
    F: { row: 0, col: 4 },
    G: { row: 10, col: 1 },
    H: { row: 8, col: 0 },
    I: { row: 11, col: 10 },
    J: { row: 6, col: 11 },
    K: { row: 9, col: 3 },
    O: { row: 7, col: 7 },
  },
};
