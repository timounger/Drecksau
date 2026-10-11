/**
 * K.O.!: a boxing gym with a training room, a store room, the ring, a
 * changing room, an entrance and showers, and a knocked-out boxer.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/K.O.!/K.O.!.png`, no solution sheet),
 * with the culprit pencilled in on the photographed page.
 * Orhan is the victim; whoever was alone with him killed him.
 *
 * The white armchairs are the chairs and the red mat of the ring is the rug;
 * both can be stood on. Lockers, punching bags, tables, TVs and plants cannot.
 * A field is in a corner of its room when the room's border runs along two of
 * its sides that meet: one above or below it, one to its left or right.
 */
import {
  about,
  all,
  alone,
  cellsWhere,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** Whether a field lies in a corner of its area, given the area of each field. */
function inCorner(areaOf: (cell: Cell) => string | null, cell: Cell): boolean {
  const area = areaOf(cell);
  const outside = (row: number, col: number): boolean =>
    areaOf({ row, col }) !== area;
  const vertical =
    outside(cell.row - 1, cell.col) || outside(cell.row + 1, cell.col);
  const horizontal =
    outside(cell.row, cell.col - 1) || outside(cell.row, cell.col + 1);
  return vertical && horizontal;
}

/** Whether nobody but the suspect sits on a chair. */
function onlyOneOnAChair(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "chair");
  });
}

/** Everybody else in the suspect's area, with their fields. */
function othersInRoom(c: Context): readonly { id: string; cell: Cell }[] {
  const area = c.areaOf(c.cell) ?? "";
  return c.peopleIn(area).flatMap((id) => {
    const cell = c.cellOf(id);
    return id === c.self || cell === undefined ? [] : [{ id, cell }];
  });
}

/** Whether a TV stands in the field's area. */
function tvInRoom(c: Context): boolean {
  return c.cellsOf(c.areaOf(c.cell) ?? "").some((cell) => c.is(cell, "tv"));
}

/** Whether one of two people is east of the other, by column. */
function eastOf(east: Cell | undefined, west: Cell | undefined): boolean {
  return east !== undefined && west !== undefined && east.col > west.col;
}

/** Whether one of two people is south of the other, by row. */
function southOf(south: Cell | undefined, north: Cell | undefined): boolean {
  return south !== undefined && north !== undefined && south.row > north.row;
}

/**
 * For the solver only: whether a partial placement can still be finished -
 * nobody but Annie on a chair, nobody with Grace, at most one with Orhan,
 * Bradley only in a room with a free field beside a locker, and Hector only
 * where Annie or Danika (Grace was alone) still can be.
 */
function stillPossible(c: Context): boolean {
  const placed = c.people().flatMap((id) => {
    const cell = c.cellOf(id);
    return cell === undefined ? [] : [{ id, area: c.areaOf(cell), cell }];
  });
  const company = (id: string): number => {
    const own = placed.find((one) => one.id === id);
    return own === undefined
      ? 0
      : placed.filter((one) => one.id !== id && one.area === own.area).length;
  };
  const area = (id: string): string | null | undefined =>
    placed.find((one) => one.id === id)?.area;
  const bradley = area("B");
  const hector = area("H");
  const women = c.level.suspects.filter(
    (one) => one.pronoun === "sie" && one.id !== "G",
  );
  return (
    (bradley === undefined ||
      c
        .cellsOf(bradley ?? "")
        .some((cell) => c.standable(cell) && c.beside(cell, "locker"))) &&
    (hector === undefined ||
      women.some((one) => {
        const there = area(one.id);
        return there === undefined || there === hector;
      })) &&
    placed.every((one) => one.id === "A" || !c.is(one.cell, "chair")) &&
    company("G") === 0 &&
    company("O") <= 1
  );
}

/** The case. */
export const KNOCKOUT: Level = {
  id: "knockout",
  name: "K.O.!",
  series: { book: "original", number: 28 },
  story: "Für diesen armen Kerl hat sich's ausgezählt.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "T",
      name: "Trainingsraum",
      at: "im Trainingsraum",
      ground: "floor",
      tint: "#d4d0e6",
      label: { row: 1, col: 1 },
    },
    {
      key: "U",
      name: "Umkleide",
      at: "in der Umkleide",
      ground: "stone",
      tint: "#f0c2b6",
      label: { row: 6, col: 7 },
    },
    {
      key: "L",
      name: "Lager",
      at: "im Lager",
      ground: "floor",
      tint: "#cdb9df",
      label: { row: 6, col: 0 },
    },
    {
      key: "B",
      name: "Boxring",
      at: "im Boxring",
      ground: "floor",
      tint: "#a9b8e3",
      label: { row: 6, col: 4 },
    },
    {
      key: "E",
      name: "Eingang",
      at: "im Eingang",
      ground: "stone",
      tint: "#f2b9b6",
      label: { row: 8, col: 0 },
    },
    {
      key: "D",
      name: "Duschen",
      at: "in den Duschen",
      ground: "stone",
      tint: "#cfcbe6",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "TTTTTTTUU",
    "TTTTTTTUU",
    "LLBBBBBUU",
    "LLBBBBBUU",
    "LLBBBBBUU",
    "LLBBBBBUU",
    "LLBBBBBUU",
    "EEEEEDDDD",
    "EEEEEDDDD",
  ],
  thingMap: [
    "c.k..k..c",
    "...f..k..",
    "......ts.",
    "...rrr...",
    ".t.rrr.s.",
    ".t.rrr...",
    ".s.....s.",
    "...fp....",
    "..cpc.t..",
  ],
  things: {
    c: "chair",
    f: "tv",
    k: "punchingBag",
    p: "plant",
    r: "rug",
    s: "locker",
    t: "table",
  },
  extraThings: {
    locker: { name: "Spind", emoji: "\u{1F5C4}️", standable: false },
    punchingBag: { name: "Boxsack", emoji: "\u{1F94A}", standable: false },
  },
  pieces: [
    { at: { row: 3, col: 3 }, rows: 3, cols: 3, plain: true },
    { at: { row: 4, col: 1 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Annie",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOnAChair)),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bradley",
      pronoun: "er",
      clue: {
        text: "In seinem Raum war eine weitere Person neben einem Spind.",
        ...counting((c) =>
          othersInRoom(c).some((other) => c.beside(other.cell, "locker")),
        ),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Christopher",
      pronoun: "er",
      clue: {
        text: "Er war nördlich von Danika und südlich von Annie.",
        ...about(
          ["A", "D"],
          (c) =>
            southOf(c.cellOf("D"), c.cell) && southOf(c.cell, c.cellOf("A")),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Danika",
      pronoun: "sie",
      clue: {
        text: "Sie war östlich von Annie und westlich von Grace.",
        ...about(
          ["A", "G"],
          (c) => eastOf(c.cell, c.cellOf("A")) && eastOf(c.cellOf("G"), c.cell),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Erich",
      pronoun: "er",
      clue: {
        text: "Er war im Boxring. Er war auf dem Teppich.",
        ...all(inArea("B"), on("rug")),
      },
      colour: "#7c3aed",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "F",
      name: "Freddy",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke seines Raumes.",
        ...own((c) => inCorner(c.areaOf, c.cell)),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#9f1239",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "G",
      name: "Grace",
      pronoun: "sie",
      clue: {
        text: "In ihrem Raum war ein Fernseher. Sie war allein im Raum.",
        ...all(own(tvInRoom), alone()),
      },
      colour: "#ea580c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "H",
      name: "Hector",
      pronoun: "er",
      clue: {
        text: "In seinem Raum war eine Frau.",
        ...counting((c) =>
          othersInRoom(c).some((other) => c.has(other.id, "woman")),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "O",
      name: "Orhan",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Annie saß als Einzige auf einem Stuhl: R1 C1, R1 C9, R9 C3 oder R9 C5. Danika war östlich von ihr, also nicht C9; Christopher war südlich von ihr, also nicht R9. Annie saß in R1 C1. Blockiere den Rest von R1 und C1.",
      place: { A: { row: 0, col: 0 } },
      cross: [
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
        { row: 0, col: 4 },
        { row: 0, col: 5 },
        { row: 0, col: 6 },
        { row: 0, col: 7 },
        { row: 0, col: 8 },
        { row: 1, col: 0 },
        { row: 2, col: 0 },
        { row: 3, col: 0 },
        { row: 4, col: 0 },
        { row: 5, col: 0 },
        { row: 6, col: 0 },
        { row: 7, col: 0 },
        { row: 8, col: 0 },
      ],
    },
    {
      text: "Grace war allein in einem Raum mit Fernseher. Im Trainingsraum ist Annie, also war Grace im Eingang - ohne Stuhl und nicht in C1: R8 C2, R8 C3 oder R9 C2. Danika war westlich von Grace und östlich von Annie, also kann Grace nicht in C2 sein. Grace war in R8 C3, Danika in C2. Blockiere den Rest von R8 und C3.",
      place: { G: { row: 7, col: 2 } },
      cross: [
        { row: 7, col: 0 },
        { row: 7, col: 1 },
        { row: 7, col: 3 },
        { row: 7, col: 4 },
        { row: 7, col: 5 },
        { row: 7, col: 6 },
        { row: 7, col: 7 },
        { row: 7, col: 8 },
        { row: 0, col: 2 },
        { row: 1, col: 2 },
        { row: 2, col: 2 },
        { row: 3, col: 2 },
        { row: 4, col: 2 },
        { row: 5, col: 2 },
        { row: 6, col: 2 },
        { row: 8, col: 2 },
      ],
    },
    {
      text: "Das Lager liegt nur in C1 und C2 - außer Danika war dort niemand. Hector war mit einer Frau in seinem Raum; Grace war allein, also war er bei Annie im Trainingsraum, in R2: R2 C5 oder R2 C6. Bradley brauchte jemanden neben einem Spind in seinem Raum - das geht nur noch in der Umkleide.",
    },
    {
      text: "Christopher war südlich von Annie und nördlich von Danika. R2 gehört Hector, also war Christopher in R3 und Danika weiter südlich in C2 - R5 C2 und R6 C2 sind ein Tisch, R7 C2 ein Spind, R9 C2 wäre bei Grace. Danika war in R4 C2.",
      place: { D: { row: 3, col: 1 } },
    },
    {
      text: "In R9 ist nur noch in den Duschen Platz: R9 C6, R9 C8 oder R9 C9 - wer dort steht, ist allein. Erich, Bradley, Hector und Christopher haben ihre Räume, Orhan war nicht allein. Also stand Freddy dort, in einer Ecke: R9 C6 oder R9 C9.",
    },
    {
      text: "In der Umkleide stand neben Bradley noch jemand neben einem Spind: Christopher (R3 C9) oder Orhan. Wäre es Orhan, belegten er und Bradley C8 und C9; Freddy müsste nach R9 C6, Hector nach R2 C5 - und für Christopher (dann in R3 im Boxring) und Erich bliebe zusammen nur C4. Also stand Christopher in R3 C9.",
      place: { C: { row: 2, col: 8 } },
    },
    {
      text: "Bradley war in der Umkleide in C8: R2 und R4 sind besetzt, R5 C8 und R7 C8 sind Spinde - er stand in R6 C8. Damit bleibt für Freddy R9 C6, für Hector R2 C5 und für Erich auf dem Teppich R5 C4.",
      place: {
        B: { row: 5, col: 7 },
        F: { row: 8, col: 5 },
        H: { row: 1, col: 4 },
        E: { row: 4, col: 3 },
      },
    },
    {
      text: "Orhan bleibt R7 C7 im Boxring. Dort war er allein mit Erich - Erich ist der Mörder!",
      place: { O: { row: 6, col: 6 } },
    },
  ],
  prune: stillPossible,
  solution: {
    A: { row: 0, col: 0 },
    B: { row: 5, col: 7 },
    C: { row: 2, col: 8 },
    D: { row: 3, col: 1 },
    E: { row: 4, col: 3 },
    F: { row: 8, col: 5 },
    G: { row: 7, col: 2 },
    H: { row: 1, col: 4 },
    O: { row: 6, col: 6 },
  },
};
