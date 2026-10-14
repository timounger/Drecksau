/**
 * Sommerurlaub: a holiday flat with two bedrooms, a hall, a living room, a
 * dining room and a kitchen, and a murdered holidaymaker.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/60. Sommerurlaub.JPG`,
 * solution sheet `Lösungen 1-80/Lösung 57-60.JPG`).
 * Oran is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the beds can be stood on. The
 * tables, the TVs and the plants cannot. The windows are the bars in the
 * outer walls; standing in front of one means being on the field right
 * beside it (one of them has a plant in front). A field is in a corner of
 * its room when the room's border runs along two of its sides that meet:
 * one above or below it, one to its left or right.
 */
import { all, alone, beside, counting, on, own, victim } from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The fields right in front of a window. */
const WINDOWS: readonly Cell[] = [
  { row: 0, col: 5 },
  { row: 3, col: 0 },
  { row: 7, col: 0 },
  { row: 8, col: 8 },
];

/** How many people were in Holger's room, he among them. */
const HOLGERS_COMPANY = 3;

/** Whether a field lies right in front of a window. */
function byWindow(cell: Cell): boolean {
  return WINDOWS.some((one) => one.row === cell.row && one.col === cell.col);
}

/** Whether the suspect's field lies in a corner of their area. */
function inCorner(c: Context): boolean {
  const area = c.areaOf(c.cell);
  const outside = (row: number, col: number): boolean =>
    c.areaOf({ row, col }) !== area;
  const vertical =
    outside(c.cell.row - 1, c.cell.col) || outside(c.cell.row + 1, c.cell.col);
  const horizontal =
    outside(c.cell.row, c.cell.col - 1) || outside(c.cell.row, c.cell.col + 1);
  return vertical && horizontal;
}

/** Whether exactly this many people, the suspect among them, share the area. */
function inCompanyOf(count: number): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.peopleIn(c.areaOf(c.cell) ?? "").length === count;
}

/**
 * Whether a male suspect in the suspect's area stood in front of a window.
 * The victim is no suspect: the book's solution names only Erik and Holger.
 */
function manByWindowInArea(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").some((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined &&
      c.has(id, "man") &&
      !isVictim(c, id) &&
      byWindow(there)
    );
  });
}

/** Whether the suspect's area has a window at all - what Betsy's clue needs first. */
function windowInArea(c: Context): boolean {
  return c.cellsOf(c.areaOf(c.cell) ?? "").some(byWindow);
}

/** Whether a person is the victim. */
function isVictim(c: Context, id: string): boolean {
  return c.level.suspects.some(
    (one) => one.id === id && one.clue.victim === true,
  );
}

/** Whether nobody but the suspect stood on a bed. */
function onlyOneOnABed(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "bed");
  });
}

/** Whether a TV stands in the suspect's area. */
function tvInArea(c: Context): boolean {
  return c.cellsOf(c.areaOf(c.cell) ?? "").some((cell) => c.is(cell, "tv"));
}

/** Whether at least one person sat on a chair. */
function somebodySeated(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "chair");
  });
}

/** How few and how many people each one's clue puts in their area, them among them. */
const ROOM_SIZES: Readonly<Record<string, readonly [number, number]>> = {
  A: [2, 2],
  B: [2, Infinity],
  D: [1, 1],
  H: [HOLGERS_COMPANY, HOLGERS_COMPANY],
  O: [2, 2],
};

/**
 * For the solver: whether nobody but one stands on a bed, and every room a
 * clue gives a size is neither too full already nor beyond filling up.
 */
function stillPossible(c: Context): boolean {
  const onBeds = c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "bed");
  }).length;
  return (
    onBeds <= 1 &&
    Object.entries(ROOM_SIZES).every(([id, [least, most]]) => {
      const there = c.cellOf(id);
      return (
        there === undefined ||
        roomCanHold(c, c.areaOf(there) ?? "", least, most)
      );
    })
  );
}

/** Whether an area holds no more than the most yet, and can still reach the least. */
function roomCanHold(
  c: Context,
  area: string,
  least: number,
  most: number,
): boolean {
  const placed = c.people();
  const cells = Object.values(c.placement);
  const inside = c.peopleIn(area).length;
  const freeRows = new Set(
    c
      .cellsOf(area)
      .filter(
        (cell) =>
          c.standable(cell) &&
          !cells.some((one) => one.row === cell.row || one.col === cell.col),
      )
      .map((cell) => cell.row),
  );
  const addable = Math.min(
    c.level.suspects.length - placed.length,
    freeRows.size,
  );
  return inside <= most && inside + addable >= least;
}

/** The case. */
export const SUMMER_HOLIDAY: Level = {
  id: "summer-holiday",
  name: "Sommerurlaub",
  series: { book: "original", number: 60 },
  story: "Balkonien wäre die bessere Alternative gewesen, hab ich recht?",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "1",
      name: "Schlafzimmer 1",
      at: "im Schlafzimmer 1",
      ground: "floor",
      tint: "#f3dccd",
      label: { row: 2, col: 5 },
    },
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "floor",
      tint: "#f3ecc4",
      label: { row: 8, col: 0 },
    },
    {
      key: "2",
      name: "Schlafzimmer 2",
      at: "im Schlafzimmer 2",
      ground: "floor",
      tint: "#f5eccc",
      label: { row: 5, col: 3 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#f2e8d8",
      label: { row: 6, col: 6 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#f0e6d6",
      label: { row: 8, col: 2 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#f2e8d8",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "111111111",
    "111111111",
    "FF1111111",
    "FF2222WWW",
    "FF2222WWW",
    "FF2222WWW",
    "FFEEEEWWW",
    "FFEEEKKKK",
    "FFEEKKKKK",
  ],
  thingMap: [
    "...c...c.",
    "c..bb.bb.",
    "t.pbbpbbt",
    "..t.tv...",
    ".pbbbb.v.",
    ".....t...",
    ".....c..p",
    "pt.tt.p..",
    ".t..vt...",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 1, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 1 }, rows: 2, cols: 1 },
  ],
  windows: [
    { at: { row: 0, col: 5 }, side: "top" },
    { at: { row: 3, col: 0 }, side: "left" },
    { at: { row: 7, col: 0 }, side: "left" },
    { at: { row: 8, col: 8 }, side: "right" },
  ],
  suspects: [
    {
      id: "A",
      name: "Artemis",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke ihres Raumes. Sie war allein mit einem anderen Verdächtigen.",
        ...all(own(inCorner), counting(inCompanyOf(2))),
      },
      colour: "#b91c1c",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "B",
      name: "Betsy",
      pronoun: "sie",
      clue: {
        text: "In ihrem Raum war ein männlicher Verdächtiger vor einem Fenster.",
        ...all(own(windowInArea), counting(manByWindowInArea)),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Carrie",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person auf einem Bett.",
        ...all(on("bed"), counting(onlyOneOnABed)),
      },
      colour: "#0e7490",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "D",
      name: "Dave",
      pronoun: "er",
      clue: { text: "Er war allein.", ...alone() },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Erik",
      pronoun: "er",
      clue: {
        text: "In seinem Raum war ein Fernseher.",
        ...own(tvInArea),
      },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Franzi",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Tisch und neben einer Pflanze.",
        ...all(beside("table"), beside("plant")),
      },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Gideon",
      pronoun: "er",
      clue: { text: "Er war neben einem Bett.", ...beside("bed") },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Holger",
      pronoun: "er",
      clue: {
        text: "Er war mit zwei anderen Verdächtigen zusammen.",
        ...counting(inCompanyOf(HOLGERS_COMPANY)),
      },
      colour: "#6d28d9",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Oran",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#be123c",
      face: "\u{1F468}\u{1F3FF}",
    },
  ],
  rules: [
    {
      text: "Mindestens eine Person saß auf einem Stuhl.",
      check: somebodySeated,
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Es gibt drei Felder, auf denen Franzi sein könnte, alle in R8 oder R9.",
    },
    {
      text: "Betsy ist mit einem männlichen Verdächtigen am Fenster. Er könnte Erik sein (in der Küche) oder Holger (im Schlafzimmer, wo Platz für drei ist). Wenn sie mit Erik in der Küche wäre, würden sie R8 und R9 besetzen, was unmöglich ist, da Franzi in einer dieser Zeilen ist, also ist Betsy mit Holger und Holger ist am Fenster in R1.",
      place: { H: { row: 0, col: 5 } },
    },
    {
      text: "Alle drei Zeilen des Schlafzimmers sind besetzt, und wer auch immer in R3 ist, ist auf einem Bett, also ist es Carrie. Wir können die anderen Betten ausschließen. Betsy muss in R2 C1 sein, auf dem letzten Stuhl (der besetzt sein muss).",
      place: { B: { row: 1, col: 0 } },
    },
    {
      text: "Das lokalisiert Franzi in der Küche.",
      place: { F: { row: 8, col: 6 } },
    },
    {
      text: "R5 C9, das letzte Feld in R5, muss besetzt sein, was Artemis in R6 C3 lokalisiert. (Nicht R7 C3, weil ein anderer Verdächtiger nicht passen würde.) Gideon muss mit ihr in R4 C4 sein. Es gibt jetzt ein Feld in C2; nur Dave kann darin sein.",
      place: {
        A: { row: 5, col: 2 },
        G: { row: 3, col: 3 },
        D: { row: 6, col: 1 },
      },
    },
    {
      text: "Carrie muss im letzten verbleibenden Feld in C5 sein. Oran kann nicht allein im Wohnzimmer sein, also ist Erik dort und Oran ist in der Küche. Franzi ist die Mörderin!",
      place: {
        C: { row: 2, col: 4 },
        E: { row: 4, col: 8 },
        O: { row: 7, col: 7 },
      },
    },
  ],
  solution: {
    A: { row: 5, col: 2 },
    B: { row: 1, col: 0 },
    C: { row: 2, col: 4 },
    D: { row: 6, col: 1 },
    E: { row: 4, col: 8 },
    F: { row: 8, col: 6 },
    G: { row: 3, col: 3 },
    H: { row: 0, col: 5 },
    O: { row: 7, col: 7 },
  },
};
