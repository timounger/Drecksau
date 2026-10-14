/**
 * Der leere Raum: eight rooms of a house, one of them empty, with a murdered
 * woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/71. Der leere Raum.JPG`,
 * solution sheet `Lösungen 1-80/Lösung 69-72.JPG`).
 * Ottavia is the victim; whoever was alone with her killed her.
 *
 * The armchairs are the chairs; they, the two beds and the light rugs can be
 * stood on. The tables (the workbench in the basement among them), the
 * shelves, the TVs (the record players with the note) and the plants cannot.
 * There are three windows: two in the north wall of the guest room and the
 * bedroom, one in the west wall of the living room; being in front of one
 * means being on the field right behind it. A corner is a field with a room
 * border or the map's edge both above or below and left or right of it.
 */
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

/** The fields right in front of a window. */
const WINDOWS: readonly Cell[] = [
  { row: 0, col: 2 },
  { row: 0, col: 4 },
  { row: 5, col: 0 },
];

/** Whether a field lies right in front of a window. */
function beforeWindow(cell: Cell): boolean {
  return WINDOWS.some((one) => one.row === cell.row && one.col === cell.col);
}

/** Whether a field is in a corner of its room. */
function inCorner(c: Context, cell: Cell): boolean {
  const area = c.areaOf(cell);
  const outside = (row: number, col: number): boolean =>
    c.areaOf({ row, col }) !== area;
  const vertical =
    outside(cell.row - 1, cell.col) || outside(cell.row + 1, cell.col);
  const horizontal =
    outside(cell.row, cell.col - 1) || outside(cell.row, cell.col + 1);
  return vertical && horizontal;
}

/** Whether a TV stood in the room of a field. */
function tvInRoom(c: Context, cell: Cell): boolean {
  return c.cellsOf(c.areaOf(cell) ?? "").some((one) => c.is(one, "tv"));
}

/** Whether nobody but the suspect stood on a thing of this id. */
function onlyOneOn(what: string): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return id === c.self || there === undefined || !c.is(there, what);
    });
}

/** Whether the suspect was alone with exactly one man. */
function aloneWithAMan(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  return others.length === 1 && others.every((id) => c.has(id, "man"));
}

/** Whether the suspect stood north-west of Donna. */
function northWestOfDonna(c: Context): boolean {
  const there = c.cellOf("D");
  return (
    there !== undefined && c.cell.row < there.row && c.cell.col < there.col
  );
}

/** Whether exactly one room held nobody. */
function oneEmptyRoom(c: Context): boolean {
  return (
    c.level.areas.filter((area) => c.peopleIn(area.key).length === 0).length ===
    1
  );
}

/** Whether exactly one person sat on a chair. */
function oneOnAChair(c: Context): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, "chair");
    }).length === 1
  );
}

/** The case. */
export const THE_EMPTY_ROOM: Level = {
  id: "the-empty-room",
  name: "Der leere Raum",
  series: { book: "original", number: 71 },
  story: "Ich hoffe, du bist bereit, das Nichts zu kontemplieren.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#efe6d4",
      label: { row: 2, col: 1 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#f3ecd8",
      label: { row: 2, col: 4 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#f6efdc",
      label: { row: 3, col: 7 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#f1eadb",
      label: { row: 5, col: 0 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#f4ead0",
      label: { row: 6, col: 4 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#f6e7c4",
      label: { row: 8, col: 0 },
    },
    {
      key: "A",
      name: "Arbeitszimmer",
      at: "im Arbeitszimmer",
      ground: "floor",
      tint: "#efe4d0",
      label: { row: 8, col: 3 },
    },
    {
      key: "L",
      name: "Keller",
      at: "im Keller",
      ground: "stone",
      tint: "#e8e2d6",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "GGGGSSSKK",
    "GGGGSSSKK",
    "GGGGSSSKK",
    "WWWEEEEKK",
    "WWWEEEELL",
    "WWWEEEELL",
    "BBBEEEELL",
    "BBBAAAALL",
    "BBBAAAALL",
  ],
  thingMap: [
    ".b.c.v.ts",
    ".bp.p.btp",
    "......b..",
    "p.vr....t",
    "...r..ccv",
    "..t..t...",
    "r...ptc.t",
    "rctrr.s.t",
    "r.t..ps.t",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    r: "rug",
    s: "shelf",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 0, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 6 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 0 }, rows: 3, cols: 1 },
    { at: { row: 6, col: 8 }, rows: 3, cols: 1 },
    { at: { row: 7, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 3 }, rows: 1, cols: 2 },
  ],
  windows: [
    { at: { row: 0, col: 2 }, side: "top" },
    { at: { row: 0, col: 4 }, side: "top" },
    { at: { row: 5, col: 0 }, side: "left" },
  ],
  suspects: [
    {
      id: "A",
      name: "Arlo",
      pronoun: "er",
      clue: {
        text: "Er war allein mit einem Mann.",
        ...counting(aloneWithAMan),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Bruce",
      pronoun: "er",
      clue: {
        text: "Er war nordwestlich von Donna.",
        ...about(["D"], northWestOfDonna),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Caroline",
      pronoun: "sie",
      clue: {
        text: "Sie war vor einem Fenster.",
        ...own((c) => beforeWindow(c.cell)),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Donna",
      pronoun: "sie",
      clue: { text: "Sie war im Esszimmer.", ...inArea("E") },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "E",
      name: "Emil",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Teppich.",
        ...all(on("rug"), counting(onlyOneOn("rug"))),
      },
      colour: "#6d28d9",
      face: "\u{1F913}",
    },
    {
      id: "F",
      name: "Fritz",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Bett.",
        ...all(on("bed"), counting(onlyOneOn("bed"))),
      },
      colour: "#7f1d1d",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "G",
      name: "Grace",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Stuhl.", ...beside("chair") },
      colour: "#ea580c",
      face: "\u{1F469}",
    },
    {
      id: "H",
      name: "Hakim",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke. In seinem Raum war kein Fernseher.",
        ...own((c) => inCorner(c, c.cell) && !tvInRoom(c, c.cell)),
      },
      colour: "#1d4ed8",
      face: "\u{1F474}",
    },
    {
      id: "O",
      name: "Ottavia",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#be123c",
      face: "\u{1F469}‍\u{1F9B3}",
    },
  ],
  rules: [
    { text: "Es gab genau einen leeren Raum.", check: oneEmptyRoom },
    { text: "Genau eine Person saß auf einem Stuhl.", check: oneOnAChair },
  ],
  hints: [
    {
      text: "Der einzige Verdächtige, der im Keller sein könnte, ist Grace (Arlo kann nicht darin sein, da keiner der anderen Männer kann), aber wenn Grace im Keller ist, kann niemand in S9 passen. Daher muss der Keller der leere Raum sein.",
    },
    {
      text: "Zwei Personen müssen dann in der Küche sein. Die einzige Möglichkeit ist Hakim in Z4 S8, entweder mit Arlo oder mit Ottavia in Z3 S9.",
      place: { H: { row: 3, col: 7 } },
    },
    {
      text: "Alle anderen Räume müssen besetzt sein. Emil ist die einzige Person, die im Arbeitszimmer sein kann, auf dem Teppich. Schließe den Rest von Z8 und alle anderen Teppichfelder aus.",
      cross: [
        { row: 7, col: 0 },
        { row: 7, col: 1 },
        { row: 7, col: 7 },
        { row: 6, col: 0 },
        { row: 8, col: 0 },
        { row: 3, col: 3 },
        { row: 4, col: 3 },
      ],
    },
    {
      text: "Nur Grace kann im Badezimmer sein, in S2, neben dem Stuhl. Schließe den Rest von S2 aus. Das lokalisiert Fritz auf dem letzten Bettfeld.",
      place: { F: { row: 1, col: 6 } },
      cross: [
        { row: 0, col: 1 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
        { row: 3, col: 1 },
        { row: 4, col: 1 },
        { row: 5, col: 1 },
        { row: 7, col: 1 },
      ],
    },
    {
      text: "Da eine Person sitzt, muss jemand auf dem letzten Stuhl sein, in Z1 S4.",
      cross: [
        { row: 0, col: 0 },
        { row: 0, col: 2 },
        { row: 0, col: 4 },
        { row: 0, col: 6 },
      ],
    },
    {
      text: "Das lokalisiert Caroline (am Wohnzimmerfenster) und Emil, was Donna lokalisiert und Bruce als die Person auf dem Stuhl identifiziert und Arlo als die Person in S9 (da er allein mit einem Mann ist), dann Grace und Ottavia. Grace ist die Mörderin!",
      place: {
        A: { row: 2, col: 8 },
        B: { row: 0, col: 3 },
        C: { row: 5, col: 0 },
        D: { row: 4, col: 5 },
        E: { row: 7, col: 4 },
        G: { row: 8, col: 1 },
        O: { row: 6, col: 2 },
      },
    },
  ],
  solution: {
    A: { row: 2, col: 8 },
    B: { row: 0, col: 3 },
    C: { row: 5, col: 0 },
    D: { row: 4, col: 5 },
    E: { row: 7, col: 4 },
    F: { row: 1, col: 6 },
    G: { row: 8, col: 1 },
    H: { row: 3, col: 7 },
    O: { row: 6, col: 2 },
  },
};
