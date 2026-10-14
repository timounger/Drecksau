/**
 * K.O.!: a boxing gym with a training room, a store room, the ring, a
 * changing room, an entrance and showers, and a knocked-out boxer.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/K.O.!/K.O.!.png`,
 * solution on `Das Murdoku-Orginal/Lösungen 1-80/Lösung 25-28.JPG`).
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
      text: "Annie war nördlich von Christopher und westlich von Danika, also kann sie nur in Zeile 1, Spalte 1 sitzen. Schließe die anderen Stühle aus.",
      place: { A: { row: 0, col: 0 } },
      cross: [
        { row: 0, col: 8 },
        { row: 8, col: 2 },
        { row: 8, col: 4 },
      ],
    },
    {
      text: "Grace war allein, also muss sie im Eingang sein. Danika ist westlich von ihr; das lokalisiert Grace in Spalte 3 und setzt Danika in Spalte 2.",
      place: { G: { row: 7, col: 2 } },
    },
    {
      text: "Danika muss im Lager sein, sonst wäre es unmöglich, dass Hector einen Raum mit einer Frau teilt. Hector muss mit Annie zusammen sein, irgendwo in Zeile 2 im Trainingsraum.",
    },
    {
      text: "Christopher ist nördlich von Danika. Das setzt Christopher in Zeile 3 und lokalisiert Danika in Zeile 4.",
      place: { D: { row: 3, col: 1 } },
    },
    {
      text: "Bradley ist in der Umkleide mit jemandem. Einer von ihnen muss in Zeile 6, Spalte 8 sein und der andere in Spalte 9. Das lässt nur ein Feld in Zeile 9, in den Duschen, wo nur Freddy sein kann, das lokalisiert ihn in Spalte 6.",
      place: { F: { row: 8, col: 5 } },
    },
    {
      text: "Das lokalisiert Hector, dann Erich, dann Christopher, Bradley und Orhan. Erich ist der Mörder!",
      place: {
        H: { row: 1, col: 4 },
        E: { row: 4, col: 3 },
        C: { row: 2, col: 8 },
        B: { row: 5, col: 7 },
        O: { row: 6, col: 6 },
      },
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
