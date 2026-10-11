/**
 * Das Callcenter: six booths, the manager's office, a toilet, a break room
 * and a meeting room, with a murdered caller.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/53. Das Callcenter.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Odessa is the victim; whoever was alone with her killed her.
 *
 * The armchairs are the chairs; they and the light green rugs (the L in the
 * manager's office among them) can be stood on. The tables (the desks among
 * them), the shelves, the TVs and the plant cannot. A field is beside a wall
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
      label: { row: 3, col: 7 },
    },
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "floor",
      tint: "#d4c2ea",
      label: { row: 4, col: 5 },
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
  hints: [],
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
