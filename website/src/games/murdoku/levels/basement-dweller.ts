/**
 * Kellerbewohner: a dining room, a bedroom, a bathroom, a living room, a
 * kitchen and the basement around them, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/44. Kellerbewohner.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
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
      text: "Neun Personen in sechs Räumen, keiner ist leer. Georges Raum hat mindestens drei Personen (er und zwei Männer), Oksanas Raum genau zwei: 3 + 2 + 4 = 9. Also waren in Georges Raum genau drei, in Oksanas genau zwei und in jedem anderen Raum genau eine Person.",
    },
    {
      text: "Wäre Holger auf dem Teppich in der Küche, wären dort er und Damara zu zweit - ohne Oksana und ohne George. Also lag Holgers Teppich im Esszimmer, in R1. Damit saß Arne nicht in R1 C1, sondern auf einem Stuhl im Keller in R8, und Ethan war nicht am Fenster in R1.",
      cross: [
        { row: 0, col: 0 },
        { row: 4, col: 5 },
        { row: 5, col: 5 },
        { row: 6, col: 5 },
      ],
    },
    {
      text: "Auf dem Bett in R2 konnten nur Cosima, George oder Oksana sein. Wo war George mit zwei Männern? Im Wohnzimmer und in der Küche kann außer ihm höchstens ein Mann sein, im Badezimmer hat nur eine Person Platz (R4). Im Schlafzimmer kommen nur Brandon und Ethan in Frage, beide nur in C9. Im Esszimmer wären es Holger (R1) und Ethan (R3 C1) - dann bliebe George nur R2, die Reihe des Betts. George war also im Keller, mit Arne und genau einem von Brandon und Fabian.",
    },
    {
      text: "Im Badezimmer war genau eine Person in R4: Cosima oder Ethan. Wäre es Cosima, müsste Oksana auf dem Bett liegen, mit Brandon oder Ethan im Schlafzimmer. Das Wohnzimmer bekäme nur noch Fabian, also wäre Brandon im Keller - und Ethan im Schlafzimmer in C9, derselben Spalte wie Brandon. Also war Ethan im Badezimmer, am Fenster in R4 C1.",
      place: { E: { row: 3, col: 0 } },
    },
    {
      text: "Damara war in der Küche, nicht auf einem Teppich (der gehört Holger) und nicht in R4: R6 C7 oder R7 C7. Arne saß damit weder in C1 noch in C7 - auf dem Stuhl in R8 C4. Fabian war neben einem Fernseher: R6 C4, R8 C8 und R9 C7 sind blockiert, es bleiben R5 C3 und R7 C3 im Wohnzimmer.",
      place: { A: { row: 7, col: 3 } },
    },
    {
      text: "Fabian war nicht im Keller, also war Brandon der zweite Mann bei George: in C9 im Keller, ohne R8 nur R6 C9. Damara bleibt R7 C7, Fabian R5 C3.",
      place: {
        B: { row: 5, col: 8 },
        D: { row: 6, col: 6 },
        F: { row: 4, col: 2 },
      },
    },
    {
      text: "Holger lag auf dem Teppich in R1, C3 ist belegt: R1 C2. George war im Keller, R6 bis R8 sind belegt: in R9, und ohne C2 bleibt nur R9 C5.",
      place: { H: { row: 0, col: 1 }, G: { row: 8, col: 4 } },
    },
    {
      text: "Übrig sind R2 und R3 in C6 und C8. Auf dem Bett lag jemand, C7 ist belegt: R2 C8. Läge Oksana dort, wäre Cosima in R3 C6 - neben keiner Pflanze. Also lag Cosima auf dem Bett in R2 C8, Oksana war in R3 C6. Im Schlafzimmer war Oksana allein mit Cosima - Cosima ist die Mörderin!",
      place: { C: { row: 1, col: 7 }, O: { row: 2, col: 5 } },
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
