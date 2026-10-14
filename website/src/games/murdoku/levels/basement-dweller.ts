/**
 * Kellerbewohner: a dining room, a bedroom, a bathroom, a living room, a
 * kitchen and the basement around them, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/44. Kellerbewohner.png`,
 * solution sheet `Lösungen 1-80/Lösung 41-44.JPG`).
 * Oksana is the victim; whoever was alone with her killed her.
 *
 * The armchairs, the bed and the rugs can be stood on; the tables, the TVs
 * and the plants cannot. Sitting on a chair means being on an armchair. The
 * windows are the bars in the outer walls; being beside one means being on
 * the field right next to it. "In a room with two men" means exactly two of
 * the others in George's room were men.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  beside,
  cellsWhere,
  column,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The fields right next to a window. */
const WINDOWS: readonly Cell[] = [
  { row: 0, col: 3 },
  { row: 0, col: 5 },
  { row: 2, col: 0 },
  { row: 3, col: 0 },
  { row: 2, col: 8 },
  { row: 3, col: 8 },
];

/** Whether a field lies right next to a window. */
function byWindow(cell: Cell): boolean {
  return WINDOWS.some((one) => one.row === cell.row && one.col === cell.col);
}

/** Whether nobody but the suspect stood on a thing of this id. */
function onlyOneOn(what: string): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return id === c.self || there === undefined || !c.is(there, what);
    });
}

/** The case. */
export const BASEMENT_DWELLER: Level = {
  id: "basement-dweller",
  name: "Kellerbewohner",
  series: { book: "original", number: 44 },
  story:
    "Uff, der Wäschehaufen da unten sollte als biologischer Gefahrenstoff eingestuft werden.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#d7dde6",
      label: { row: 2, col: 3 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#d9dcef",
      label: { row: 2, col: 5 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#d6e6f2",
      label: { row: 4, col: 0 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#cfe0ee",
      label: { row: 6, col: 2 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#f1ecc8",
      label: { row: 6, col: 5 },
    },
    {
      key: "L",
      name: "Keller",
      at: "im Keller",
      ground: "stone",
      tint: "#e2d3e6",
      label: { row: 8, col: 3 },
    },
  ],
  areaMap: [
    "EEEEESSSS",
    "EEEEESSSS",
    "EEEEESSSS",
    "BBWWWKKSS",
    "BBWWWKKSS",
    "LLWWWKKLL",
    "LLWWWKKLL",
    "LLLLLLLLL",
    "LLLLLLLLL",
  ],
  thingMap: [
    "crr......",
    "t..t..bbp",
    ".p.......",
    ".........",
    "pp.tprtp.",
    "..v..r...",
    ".....r..t",
    "ct.c..c..",
    ".....t.vt",
  ],
  things: { b: "bed", c: "chair", p: "plant", r: "rug", t: "table", v: "tv" },
  pieces: [
    { at: { row: 0, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 5 }, rows: 3, cols: 1 },
  ],
  windows: [
    { at: { row: 0, col: 3 }, side: "top" },
    { at: { row: 0, col: 5 }, side: "top" },
    { at: { row: 2, col: 0 }, side: "left" },
    { at: { row: 3, col: 0 }, side: "left" },
    { at: { row: 2, col: 8 }, side: "right" },
    { at: { row: 3, col: 8 }, side: "right" },
  ],
  suspects: [
    {
      id: "A",
      name: "Arne",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOn("chair"))),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Brandon",
      pronoun: "er",
      clue: { text: "Er war in der letzten Spalte.", ...column(9) },
      colour: "#15803d",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "C",
      name: "Cosima",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Pflanze.", ...beside("plant") },
      colour: "#0e7490",
      face: "\u{1F475}",
    },
    {
      id: "D",
      name: "Damara",
      pronoun: "sie",
      clue: { text: "Sie war in der Küche.", ...inArea("K") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Ethan",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Fenster.",
        ...own((c) => byWindow(c.cell)),
        glow: (level) => cellsWhere(level, byWindow),
      },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Fabian",
      pronoun: "er",
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#9f1239",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "G",
      name: "George",
      pronoun: "er",
      clue: {
        text: "Er war in einem Raum mit zwei Männern.",
        ...counting((c) => {
          const others = c
            .peopleIn(c.areaOf(c.cell) ?? "")
            .filter((id) => id !== c.self);
          return others.filter((id) => c.has(id, "man")).length === 2;
        }),
      },
      colour: "#ea580c",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "H",
      name: "Holger",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Teppich.",
        ...all(on("rug"), counting(onlyOneOn("rug"))),
      },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "O",
      name: "Oksana",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F471}‍♀️",
    },
  ],
  rules: [
    {
      text: "Es gab keinen leeren Raum.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length > 0),
    },
    {
      text: "Jemand war auf dem Bett.",
      check: (c) =>
        c.people().some((id) => {
          const there = c.cellOf(id);
          return there !== undefined && c.is(there, "bed");
        }),
    },
  ],
  hints: [
    {
      text: "Jemand ist auf dem Bett in Z2. Schließe den Rest der Zeile aus.",
      cross: [
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 4 },
        { row: 1, col: 5 },
      ],
    },
    {
      text: "Kein Raum ist leer, also ist jemand im Badezimmer; schließe den Rest von Z4 aus.",
      cross: [
        { row: 3, col: 2 },
        { row: 3, col: 3 },
        { row: 3, col: 4 },
        { row: 3, col: 5 },
        { row: 3, col: 6 },
        { row: 3, col: 7 },
        { row: 3, col: 8 },
      ],
    },
    {
      text: "Damara ist in der Küche, aber laut Holgers Hinweis nicht auf dem Teppich, was sie in S7 setzt.",
    },
    {
      text: "Die Person auf dem Bett muss dann in S8 sein. Schließe den Rest der Spalte aus.",
      cross: [
        { row: 0, col: 7 },
        { row: 2, col: 7 },
        { row: 5, col: 7 },
        { row: 6, col: 7 },
        { row: 7, col: 7 },
      ],
    },
    {
      text: "Ethan muss am Fenster in Z1 oder S1 sein (nicht S9, die von Brandon besetzt ist). So oder so ist der Stuhl in Z1 S1 leer, also muss Arne in Z8 sein.",
      cross: [{ row: 0, col: 0 }],
    },
    {
      text: "Ethan kann nicht in Z1 S6 sein, da er jedes Teppichfeld blockieren würde, auf dem Holger sein könnte. Es ist also unmöglich, dass drei Männer im Schlafzimmer sind, also kann der Raum mit George und zwei anderen Männern nur der Keller sein. Arne in Z8 ist einer der anderen Männer, und nur Brandon kann der andere sein, in Z6 S9. (Es kann nicht Fabian sein, da jedes Feld neben dem Keller-Fernseher blockiert ist.)",
      place: { B: { row: 5, col: 8 } },
    },
    {
      text: "Das lokalisiert Damara, dann Fabian, dann Holger. Das setzt Ethan in S1, was Arne lokalisiert, dann George. Cosima, neben einer Pflanze, ist nicht in S1, also muss sie auf dem Bett sein. Das lokalisiert Ethan und Oksana. Cosima ist die Mörderin!",
      place: {
        D: { row: 6, col: 6 },
        F: { row: 4, col: 2 },
        H: { row: 0, col: 1 },
        E: { row: 3, col: 0 },
        A: { row: 7, col: 3 },
        G: { row: 8, col: 4 },
        C: { row: 1, col: 7 },
        O: { row: 2, col: 5 },
      },
    },
  ],
  solution: {
    A: { row: 7, col: 3 },
    B: { row: 5, col: 8 },
    C: { row: 1, col: 7 },
    D: { row: 6, col: 6 },
    E: { row: 3, col: 0 },
    F: { row: 4, col: 2 },
    G: { row: 8, col: 4 },
    H: { row: 0, col: 1 },
    O: { row: 2, col: 5 },
  },
};
