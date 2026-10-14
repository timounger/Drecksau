/**
 * Banktresor: a break room, a toilet, the entrance, an office, the vault and
 * the hall of a bank, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/69. Banktresor.JPG`,
 * solution sheet in `Lösungen 1-80/Lösung 69-72.JPG`).
 * Othmar is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the rugs can be stood on. The
 * tables, the TVs and the plants cannot. The windows are in the outer walls,
 * two at the top of the office and two at the bottom of the hall; being in
 * front of one means being on the field right next to it. Othmar, the
 * victim, is no suspect: "another suspect beside a TV" in Elizabeth's room
 * cannot be him.
 */
import {
  about,
  all,
  alone,
  beside,
  cellsWhere,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level, WallWindow } from "../engine/types";

/** The windows in the outer walls, with the field in front of each. */
const WINDOWS: readonly WallWindow[] = [
  { at: { row: 0, col: 4 }, side: "top" },
  { at: { row: 0, col: 6 }, side: "top" },
  { at: { row: 8, col: 4 }, side: "bottom" },
  { at: { row: 8, col: 6 }, side: "bottom" },
];

/** Whether a field lies right in front of a window. */
function byWindow(cell: Cell): boolean {
  return WINDOWS.some(
    (one) => one.at.row === cell.row && one.at.col === cell.col,
  );
}

/** How many people stood on a field that passes a test. */
function countWhere(c: Context, test: (cell: Cell) => boolean): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && test(there);
  }).length;
}

/** Whether exactly one other was in the suspect's room: a woman on a rug. */
function aloneWithAWomanOnARug(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  const other = others.length === 1 ? (others[0] ?? "") : "";
  const there = c.cellOf(other);
  return there !== undefined && c.has(other, "woman") && c.is(there, "rug");
}

/**
 * Whether another suspect in the suspect's room stood beside a TV - the
 * victim is no suspect.
 */
function anotherBesideATv(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").some((id) => {
    const there = c.cellOf(id);
    const suspect = c.level.suspects.find((one) => one.id === id);
    return (
      id !== c.self &&
      suspect?.clue.victim !== true &&
      there !== undefined &&
      c.beside(there, "tv")
    );
  });
}

/** Whether the suspect stood east of somebody, by id. */
function eastOf(id: string): (c: Context) => boolean {
  return (c: Context): boolean => {
    const there = c.cellOf(id);
    return there !== undefined && c.cell.col > there.col;
  };
}

/** Whether the suspect's room holds a thing of this id somewhere. */
function roomHas(what: string): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.cellsOf(c.areaOf(c.cell) ?? "").some((cell) => c.is(cell, what));
}

/** How many people stood in somebody's room, or zero while they are not placed. */
function roomSize(c: Context, id: string): number {
  const there = c.cellOf(id);
  return there === undefined ? 0 : c.peopleIn(c.areaOf(there) ?? "").length;
}

/** How many rooms nobody stands in yet. */
function emptyRooms(c: Context): number {
  return c.level.areas.filter((area) => c.peopleIn(area.key).length === 0)
    .length;
}

/** Whether everybody so far in Celia's room besides her is one woman on a rug. */
function celiaKeepsCompany(c: Context): boolean {
  const there = c.cellOf("C");
  const others =
    there === undefined
      ? []
      : c.peopleIn(c.areaOf(there) ?? "").filter((id) => id !== "C");
  return (
    others.length <= 1 &&
    others.every((id) => {
      const spot = c.cellOf(id);
      return c.has(id, "woman") && spot !== undefined && c.is(spot, "rug");
    })
  );
}

/** The most people Othmar's room ever holds. */
const PAIR = 2;

/**
 * For the solver only: Ferdinand's room never holds more than him, Celia's
 * nobody but one woman on a rug, Othmar's never more than two, nobody but one sits on a chair or
 * stands in front of a window, and there are enough people left for the
 * empty rooms.
 */
function stillPossible(c: Context): boolean {
  return (
    roomSize(c, "F") <= 1 &&
    celiaKeepsCompany(c) &&
    roomSize(c, "O") <= PAIR &&
    countWhere(c, (cell) => c.is(cell, "chair")) <= 1 &&
    countWhere(c, byWindow) <= 1 &&
    emptyRooms(c) <= c.level.suspects.length - c.people().length
  );
}

/** The case. */
export const THE_BANK_VAULT: Level = {
  id: "the-bank-vault",
  name: "Banktresor",
  series: { book: "original", number: 69 },
  story: "Diesen Fall zu verfolgen könnte sich auszahlen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "P",
      name: "Pausenraum",
      at: "im Pausenraum",
      ground: "floor",
      tint: "#c9dcb4",
      label: { row: 4, col: 0 },
      labelOverhang: true,
    },
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "floor",
      tint: "#dcebe6",
      label: { row: 6, col: 2 },
    },
    {
      key: "E",
      name: "Eingang",
      at: "im Eingang",
      ground: "floor",
      tint: "#dfeed6",
      label: { row: 8, col: 0 },
    },
    {
      key: "B",
      name: "Büro",
      at: "im Büro",
      ground: "floor",
      tint: "#e6d8ee",
      label: { row: 3, col: 4 },
    },
    {
      key: "S",
      name: "Tresor",
      at: "im Tresor",
      ground: "floor",
      tint: "#c4d6bc",
      label: { row: 6, col: 6 },
      labelEnd: true,
    },
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "floor",
      tint: "#dcefe6",
      label: { row: 8, col: 8 },
      labelEnd: true,
    },
  ],
  areaMap: [
    "PPPPBBBFF",
    "PPPPBBBFF",
    "PPTTBBBFF",
    "PPTTBBBFF",
    "PPTTSSSFF",
    "EETTSSSFF",
    "EETTSSSFF",
    "EEEEFFFFF",
    "EEEEFFFFF",
  ],
  thingMap: [
    ".......c.",
    "c....t...",
    "..cc.t..c",
    "cvr..cp..",
    "..rt...r.",
    "r.rtr..rp",
    "rpcc...r.",
    "r......c.",
    "..vp...tt",
  ],
  things: {
    c: "chair",
    p: "plant",
    r: "rug",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 1, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 2 }, rows: 3, cols: 1 },
    { at: { row: 4, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 7 }, rows: 3, cols: 1 },
    { at: { row: 5, col: 0 }, rows: 3, cols: 1 },
    { at: { row: 8, col: 7 }, rows: 1, cols: 2 },
  ],
  windows: WINDOWS,
  suspects: [
    {
      id: "A",
      name: "Aaron",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person, die auf einem Stuhl saß.",
        ...all(
          on("chair"),
          counting((c) => countWhere(c, (cell) => c.is(cell, "chair")) === 1),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "B",
      name: "Bastian",
      pronoun: "er",
      clue: { text: "Er war in der Toilette.", ...inArea("T") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Celia",
      pronoun: "sie",
      clue: {
        text: "Sie war allein in einem Raum mit einer Frau, die auf einem Teppich war.",
        ...all(own(roomHas("rug")), counting(aloneWithAWomanOnARug)),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Deena",
      pronoun: "sie",
      clue: { text: "Sie war im Tresor oder im Flur.", ...inArea("S", "F") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Elizabeth",
      pronoun: "sie",
      clue: {
        text: "Ein anderer Verdächtiger war neben einem Fernseher in ihrem Raum.",
        ...all(own(roomHas("tv")), counting(anotherBesideATv)),
      },
      colour: "#7c3aed",
      face: "\u{1F475}",
    },
    {
      id: "F",
      name: "Ferdinand",
      pronoun: "er",
      clue: {
        text: "Er war allein. Er war östlich von Aaron.",
        ...all(alone(), about(["A"], eastOf("A"))),
      },
      colour: "#9f1239",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Gavin",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Herbert",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person vor einem Fenster.",
        ...all(
          own((c) => byWindow(c.cell)),
          counting((c) => countWhere(c, byWindow) === 1),
        ),
        glow: (level) => cellsWhere(level, byWindow),
      },
      colour: "#4338ca",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "O",
      name: "Othmar",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      text: "Es gab keinen leeren Raum.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length > 0),
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Kein Raum ist leer. In C1 bis C4 muss Elizabeth einen Raum mit einem anderen Verdächtigen besetzen. Die zwei anderen Räume haben nur eine Person, also ist Bastian allein in der Toilette.",
    },
    {
      text: "Elizabeth ist mit einem Verdächtigen zusammen, entweder Aaron oder Celia. Wenn Elizabeth und Celia im Eingang wären, könnte niemand allein im Pausenraum sein (Elizabeth müsste auf dem Teppich sein und würde die Stühle blockieren, auf denen Aaron sonst sitzen könnte). Also ist die einzige Möglichkeit, dass Elizabeth mit Aaron im Pausenraum ist. Das lokalisiert Aaron auf dem Stuhl neben dem Fernseher. Schließe alle anderen Stühle aus.",
      place: { A: { row: 3, col: 0 } },
      cross: [
        { row: 0, col: 7 },
        { row: 1, col: 0 },
        { row: 2, col: 2 },
        { row: 2, col: 3 },
        { row: 2, col: 8 },
        { row: 3, col: 5 },
        { row: 6, col: 2 },
        { row: 6, col: 3 },
        { row: 7, col: 7 },
      ],
    },
    {
      text: "Nur Ferdinand kann jetzt im Eingang sein, in C2 oder C4. Deena muss die Frau mit Celia sein, und da weder Gavin noch Herbert im Tresor sein können, müssen Celia und Deena dort sein.",
    },
    {
      text: "Das lokalisiert Deena auf dem Teppich, dann Bastian. Herbert muss in C7 sein, was Celia lokalisiert.",
      place: {
        D: { row: 5, col: 4 },
        B: { row: 4, col: 2 },
        C: { row: 6, col: 5 },
      },
    },
    {
      text: "Das lokalisiert Gavin im letzten Feld neben einem Tisch, dann Ferdinand, dann Herbert, dann Elizabeth, dann Othmar. Gavin ist der Mörder!",
      place: {
        G: { row: 7, col: 8 },
        F: { row: 8, col: 1 },
        H: { row: 0, col: 6 },
        E: { row: 1, col: 3 },
        O: { row: 2, col: 7 },
      },
    },
  ],
  solution: {
    A: { row: 3, col: 0 },
    B: { row: 4, col: 2 },
    C: { row: 6, col: 5 },
    D: { row: 5, col: 4 },
    E: { row: 1, col: 3 },
    F: { row: 8, col: 1 },
    G: { row: 7, col: 8 },
    H: { row: 0, col: 6 },
    O: { row: 2, col: 7 },
  },
};
