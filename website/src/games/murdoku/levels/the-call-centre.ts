/**
 * Das Callcenter: six booths, the manager's office, a toilet, a break room
 * and a meeting room, with a murdered caller.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/53. Das Callcenter.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page). The two rules under the
 * magnifier are cut off in the photo; their wording is from the printed page.
 * Odessa is the victim; whoever was alone with her killed her.
 *
 * The armchairs are the chairs; they and the light green rugs (the L in the
 * manager's office among them) can be stood on. The tables (the desks among
 * them), the shelves, the TVs and the plants cannot. A field is beside a wall
 * when one of its sides lies on a room border or on the edge of the map.
 */
import {
  about,
  alone,
  all,
  beside,
  column,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** Whether a field has a wall on any side: a room border or the map's edge. */
function besideWall(c: Context, cell: Cell): boolean {
  const steps: readonly Cell[] = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  return steps.some((step) => {
    const next = { row: cell.row + step.row, col: cell.col + step.col };
    return !c.inside(next) || c.areaOf(next) !== c.areaOf(cell);
  });
}

/** Whether nobody but the suspect stood on a rug. */
function onlyOneOnARug(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "rug");
  });
}

/** Whether the suspect stood east of somebody, by id. */
function eastOf(id: string): (c: Context) => boolean {
  return (c: Context): boolean => {
    const there = c.cellOf(id);
    return there !== undefined && c.cell.col > there.col;
  };
}

/** The keys of the six booths. */
const BOOTHS: readonly string[] = ["1", "2", "3", "4", "5", "6"];

/** How many booths held nobody. */
const EMPTY_BOOTHS = 2;

/** How many people sat on chairs. */
const SEATED = 4;

/** Whether exactly two booths held nobody. */
function twoEmptyBooths(c: Context): boolean {
  return (
    BOOTHS.filter((key) => c.peopleIn(key).length === 0).length === EMPTY_BOOTHS
  );
}

/** Whether exactly four people sat on chairs. */
function fourOnChairs(c: Context): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, "chair");
    }).length === SEATED
  );
}

/** The case. */
export const THE_CALL_CENTRE: Level = {
  id: "the-call-centre",
  name: "Das Callcenter",
  series: { book: "original", number: 53 },
  story:
    "Ich dachte eher, dass sich jemand in der Warteschleife zu Tode aufregt.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "1",
      name: "Kabine 1",
      at: "in Kabine 1",
      ground: "floor",
      tint: "#d9c6ec",
      label: { row: 2, col: 0 },
    },
    {
      key: "2",
      name: "Kabine 2",
      at: "in Kabine 2",
      ground: "floor",
      tint: "#f3e8c8",
      label: { row: 2, col: 2 },
    },
    {
      key: "M",
      name: "Büro des Managers",
      at: "im Büro des Managers",
      ground: "floor",
      tint: "#efe4dc",
      label: { row: 2, col: 6 },
    },
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "floor",
      tint: "#d4c2ea",
      label: { row: 4, col: 5 },
      labelEnd: true,
    },
    {
      key: "3",
      name: "Kabine 3",
      at: "in Kabine 3",
      ground: "floor",
      tint: "#e6f0d6",
      label: { row: 5, col: 0 },
    },
    {
      key: "P",
      name: "Pausenraum",
      at: "im Pausenraum",
      ground: "floor",
      tint: "#e7e0d6",
      label: { row: 6, col: 3 },
    },
    {
      key: "B",
      name: "Besprechungsraum",
      at: "im Besprechungsraum",
      ground: "floor",
      tint: "#cdb8e6",
      label: { row: 6, col: 6 },
    },
    {
      key: "4",
      name: "Kabine 4",
      at: "in Kabine 4",
      ground: "floor",
      tint: "#ece8dc",
      label: { row: 8, col: 0 },
    },
    {
      key: "5",
      name: "Kabine 5",
      at: "in Kabine 5",
      ground: "floor",
      tint: "#f2e2e2",
      label: { row: 8, col: 4 },
    },
    {
      key: "6",
      name: "Kabine 6",
      at: "in Kabine 6",
      ground: "floor",
      tint: "#f2d6d0",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "11122MMMM",
    "11122MMMM",
    "11222TMMM",
    "33PPTTTMM",
    "33PPTTBBB",
    "33PPPBBBB",
    "44PPPBBBB",
    "444555666",
    "444555666",
  ],
  thingMap: [
    "vttctpttv",
    "c...v.rc.",
    "t...tcrr.",
    "vtsrctcs.",
    "ctcr..cc.",
    "..s...ttc",
    ".ptt...rr",
    ".ctt..tc.",
    ".vttvctv.",
  ],
  things: {
    c: "chair",
    p: "plant",
    r: "rug",
    s: "shelf",
    t: "table",
    v: "tv",
  },
  shapes: [
    [
      { row: 1, col: 6 },
      { row: 2, col: 6 },
      { row: 2, col: 7 },
    ],
  ],
  pieces: [
    { at: { row: 0, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 7 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 6 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Aljosha",
      pronoun: "er",
      clue: {
        text: "Er war östlich von Elizabeth.",
        ...about(["E"], eastOf("E")),
      },
      colour: "#b91c1c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "B",
      name: "Briggs",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einer Wand.",
        ...own((c) => !besideWall(c, c.cell)),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Caitlin",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Fernseher. Sie war allein.",
        ...all(beside("tv"), alone()),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Denise",
      pronoun: "sie",
      clue: { text: "Sie war in der ersten Spalte.", ...column(1) },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Elizabeth",
      pronoun: "sie",
      clue: { text: "Sie war im Pausenraum.", ...inArea("P") },
      colour: "#7c3aed",
      face: "\u{1F9D1}",
    },
    {
      id: "F",
      name: "Fabian",
      pronoun: "er",
      clue: {
        text: "Er saß auf einem Stuhl. Er war östlich von Aljosha.",
        ...all(on("seat"), about(["A"], eastOf("A"))),
      },
      colour: "#9f1239",
      face: "\u{1F9D4}",
    },
    {
      id: "G",
      name: "Gregory",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Teppich.",
        ...all(on("rug"), counting(onlyOneOnARug)),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Herbert",
      pronoun: "er",
      clue: {
        text: "Er war allein in der Toilette.",
        ...all(inArea("T"), alone()),
      },
      colour: "#4338ca",
      face: "\u{1F474}",
    },
    {
      id: "O",
      name: "Odessa",
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
    { text: "Es gab genau zwei leere Kabinen.", check: twoEmptyBooths },
    { text: "Genau vier Personen saßen auf Stühlen.", check: fourOnChairs },
  ],
  hints: [
    {
      text: "In R1 kann man nur auf dem Stuhl R1 C4 in Kabine 2 stehen - dort stand jemand, und sonst niemand in C4. Neben einem Fernseher ist R1 C4 nicht, also war es Aljosha oder Odessa: Fabian braucht Aljosha und Elizabeth westlich von sich. In C3 bleiben nur R2 C3, R3 C3 und R5 C3, und dort passen nur Elizabeth (R5 C3) oder Odessa. Steht Aljosha in R1 C4, ist Elizabeth westlich von ihm in C3; steht Odessa dort, bleibt C3 für Elizabeth. Elizabeth war in R5 C3.",
      place: { E: { row: 4, col: 2 } },
      cross: [
        { row: 1, col: 3 },
        { row: 2, col: 3 },
        { row: 3, col: 3 },
        { row: 4, col: 3 },
        { row: 5, col: 3 },
      ],
    },
    {
      text: "Herbert war in der Toilette, und außerhalb von R5 sind dort nur Stühle frei (R3 C6, R4 C5, R4 C7) - er saß. Mit der Person in R1 C4, Elizabeth und Fabian sind das schon vier Sitzende: Sonst saß niemand. Briggs war nicht neben einer Wand: R2 C8 und R8 C2 sind Stühle, R2 C7 und R3 C8 Teppiche für Gregory allein, R6 C4 liegt in C4. Briggs stand in R2 C2.",
      place: { B: { row: 1, col: 1 } },
    },
    {
      text: "Wäre Odessa in R1 C4, wäre sie in Kabine 2 allein: R2 C4 und R3 C4 liegen in C4, R3 C3 in Elizabeths Spalte. Also stand Aljosha in R1 C4.",
      place: { A: { row: 0, col: 3 } },
    },
    {
      text: "Caitlin war allein neben einem Fernseher und saß nicht. R2 und R5 sind belegt, C1 gehört Denise, die übrigen Felder neben Fernsehern sind Stühle - es bleiben R8 C5 und R9 C9. In R9 C9 fände Fabian keinen Stuhl östlich von Aljosha mehr: R8 C8 wäre bei Caitlin in Kabine 6, R6 C9 in ihrer Spalte, R9 C6 in ihrer Zeile, die übrigen liegen in R2, R5 oder in der Toilette. Caitlin war in R8 C5.",
      place: { C: { row: 7, col: 4 } },
    },
    {
      text: "Fabian: R8 C8 liegt in Caitlins Zeile, R9 C6 wäre bei ihr in Kabine 5 - er saß in R6 C9. In R4 bleibt nur R4 C7 in der Toilette (R4 C5 und R4 C9 sind in belegten Spalten): Herbert. In R3 bleibt dann nur der Teppich R3 C8 - Gregory.",
      place: {
        F: { row: 5, col: 8 },
        H: { row: 3, col: 6 },
        G: { row: 2, col: 7 },
      },
    },
    {
      text: "Übrig sind R7 und R9, C1 und C6. Denise steht in C1, Odessa also in C6 - und R9 C6 ist ein Stuhl, auf dem niemand mehr saß. Odessa war in R7 C6, Denise in R9 C1.",
      place: { O: { row: 6, col: 5 }, D: { row: 8, col: 0 } },
    },
    {
      text: "Odessa war im Besprechungsraum allein mit Fabian - Fabian ist der Mörder!",
    },
  ],
  solution: {
    A: { row: 0, col: 3 },
    B: { row: 1, col: 1 },
    C: { row: 7, col: 4 },
    D: { row: 8, col: 0 },
    E: { row: 4, col: 2 },
    F: { row: 5, col: 8 },
    G: { row: 2, col: 7 },
    H: { row: 3, col: 6 },
    O: { row: 6, col: 5 },
  },
};
