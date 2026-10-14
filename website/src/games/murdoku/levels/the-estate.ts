/**
 * Das Anwesen: a garden, a bedroom, a kitchen, a storeroom, a study, a hall,
 * a dining room, a guest room, a bathroom and a living room, with a murdered
 * guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/76. Das Anwesen.JPG`,
 * solution in `Lösungen 1-80/Lösung 73-76.JPG`).
 * Orfeo is the victim; whoever was alone with him killed him.
 *
 * The doors are drawn on the walls between two rooms. A field is beside a
 * door when the door lies on one of its sides - the fields on both sides of
 * the wall ({@link DOORS}). The map has no drawing for a door in the wall, so
 * each door shows as a door sign on one of its two fields (the one without a
 * rug); the sign is only the look, the clues read the list.
 *
 * The armchairs are the chairs; they, the beds, the rugs (the cross in the
 * hall among them) and the door signs can be stood on. The tables, the
 * shelves, the TVs, the statues and the plants cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  alone,
  beside,
  column,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The doors: the two fields on either side of each, from the top left. */
const DOORS: readonly (readonly [Cell, Cell])[] = [
  [
    { row: 1, col: 4 },
    { row: 1, col: 5 },
  ],
  [
    { row: 2, col: 6 },
    { row: 3, col: 6 },
  ],
  [
    { row: 1, col: 8 },
    { row: 1, col: 9 },
  ],
  [
    { row: 2, col: 10 },
    { row: 3, col: 10 },
  ],
  [
    { row: 5, col: 1 },
    { row: 6, col: 1 },
  ],
  [
    { row: 6, col: 3 },
    { row: 6, col: 4 },
  ],
  [
    { row: 6, col: 7 },
    { row: 6, col: 8 },
  ],
  [
    { row: 8, col: 10 },
    { row: 9, col: 10 },
  ],
  [
    { row: 10, col: 1 },
    { row: 11, col: 1 },
  ],
  [
    { row: 10, col: 3 },
    { row: 10, col: 4 },
  ],
  [
    { row: 11, col: 7 },
    { row: 11, col: 8 },
  ],
];

/** Whether a door lies on one of a field's sides. */
function besideDoor(cell: Cell): boolean {
  return DOORS.some((door) =>
    door.some((one) => one.row === cell.row && one.col === cell.col),
  );
}

/** Whether exactly one person stood on a thing of this id. */
function onlyOneOn(c: Context, what: string): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, what);
    }).length === 1
  );
}

/** Whether a field is one of the four corners of the grid. */
function inGridCorner(c: Context): boolean {
  const { row, col } = c.cell;
  return (row === 0 || row === c.rows - 1) && (col === 0 || col === c.cols - 1);
}

/** Hugo's clue: a male suspect in the hall, exactly four rows south of him - the victim is no suspect. */
function manInHallBelow(c: Context): boolean {
  return c.peopleIn("H").some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      id !== "O" &&
      c.has(id, "man") &&
      there !== undefined &&
      there.row === c.cell.row + 4
    );
  });
}

/** How many people placed so far stand on a thing of this id. */
function countOn(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  }).length;
}

/**
 * For the solver only: whether the people placed so far can still fit the
 * counts, Hugo's row, and the company Orfeo and Fabrice need - somebody with
 * them already or a free field left in their room.
 */
function stillPossible(c: Context): boolean {
  const hugo = c.cellOf("H");
  const carola = c.cellOf("C");
  const orfeo = c.cellOf("O");
  const placed = c.people();
  const rows = new Set(placed.map((id) => c.cellOf(id)?.row));
  const cols = new Set(placed.map((id) => c.cellOf(id)?.col));
  // Whether somebody else is in an area, or can still come to a free field there.
  const company = (area: string): boolean =>
    c.peopleIn(area).length > 1 ||
    (placed.length < c.level.suspects.length &&
      c
        .cellsOf(area)
        .some(
          (cell) =>
            !rows.has(cell.row) && !cols.has(cell.col) && c.standable(cell),
        ));
  const below =
    hugo === undefined
      ? undefined
      : c.people().find((id) => c.cellOf(id)?.row === hugo.row + 4);
  return (
    countOn(c, "chair") <= 1 &&
    countOn(c, "bed") <= 1 &&
    (orfeo === undefined ||
      (c.peopleIn(c.areaOf(orfeo) ?? "").length <= 2 &&
        company(c.areaOf(orfeo) ?? ""))) &&
    (!placed.includes("F") || company("W")) &&
    (carola === undefined || c.peopleIn(c.areaOf(carola) ?? "").length === 1) &&
    (below === undefined ||
      (below !== "O" && c.has(below, "man") && c.peopleIn("H").includes(below)))
  );
}

/** The case. */
export const THE_ESTATE: Level = {
  id: "the-estate",
  name: "Das Anwesen",
  series: { book: "original", number: 76 },
  story: "Wow, dieser Ort ist riesig. Versuch, dich hier nicht zu verlaufen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "G",
      name: "Garten",
      at: "im Garten",
      ground: "grass",
      tint: "#5fae9a",
      label: { row: 2, col: 2 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#c9b2de",
      label: { row: 2, col: 6 },
      labelOverhang: true,
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#a9d6d2",
      label: { row: 2, col: 9 },
    },
    {
      key: "L",
      name: "Lagerraum",
      at: "im Lagerraum",
      ground: "floor",
      tint: "#e2dce8",
      label: { row: 4, col: 0 },
      labelOverhang: true,
    },
    {
      key: "A",
      name: "Arbeitszimmer",
      at: "im Arbeitszimmer",
      ground: "floor",
      tint: "#8f9ad8",
      label: { row: 7, col: 1 },
      labelOverhang: true,
    },
    {
      key: "H",
      name: "Halle",
      at: "in der Halle",
      ground: "floor",
      tint: "#8fcac4",
      label: { row: 11, col: 6 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#d9b8e2",
      label: { row: 8, col: 8 },
    },
    {
      key: "T",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#bfdfee",
      label: { row: 9, col: 2 },
      labelOverhang: true,
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#cdb2d8",
      label: { row: 11, col: 0 },
      labelOverhang: true,
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#c4a4dc",
      label: { row: 11, col: 9 },
      labelOverhang: true,
    },
  ],
  areaMap: [
    "GGGGGSSSSKKK",
    "GGGGGSSSSKKK",
    "GGGGGSSSSKKK",
    "GGAAHHHHEEEE",
    "LLAAHHHHEEEE",
    "LLAAHHHHEEEE",
    "LAAAHHHHEEEE",
    "LAAAHHHHEEEE",
    "TTTTHHHHEEEW",
    "TTTTHHHHWWWW",
    "TTBBHHHHWWWW",
    "BBBBHHHHWWWW",
  ],
  thingMap: [
    "..pp.pbrvtts",
    "p....dbr.d.t",
    "....c.drt.rr",
    "p.cs.rr...ds",
    "s..s.rr..t.s",
    "sdct.prx..t.",
    "...drrrrdtcs",
    "..ssrrrr.c..",
    "ttbbxrrs..dp",
    ".prr.rr.scr.",
    ".d.d.rr.t.rv",
    "..c..rr.d...",
  ],
  things: {
    b: "bed",
    c: "chair",
    d: "door",
    p: "plant",
    r: "rug",
    s: "shelf",
    t: "table",
    v: "tv",
    x: "statue",
  },
  extraThings: {
    door: { name: "Tür", emoji: "\u{1F6AA}", standable: true },
  },
  pieces: [
    { at: { row: 0, col: 6 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 7 }, rows: 3, cols: 1 },
    { at: { row: 0, col: 9 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 10 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 9 }, rows: 3, cols: 1 },
    { at: { row: 8, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 8, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 9, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 9, col: 10 }, rows: 2, cols: 1 },
  ],
  shapes: [
    [
      { row: 3, col: 5 },
      { row: 3, col: 6 },
      { row: 4, col: 5 },
      { row: 4, col: 6 },
      { row: 5, col: 5 },
      { row: 5, col: 6 },
      { row: 6, col: 4 },
      { row: 6, col: 5 },
      { row: 6, col: 6 },
      { row: 6, col: 7 },
      { row: 7, col: 4 },
      { row: 7, col: 5 },
      { row: 7, col: 6 },
      { row: 7, col: 7 },
      { row: 8, col: 5 },
      { row: 8, col: 6 },
      { row: 9, col: 5 },
      { row: 9, col: 6 },
      { row: 10, col: 5 },
      { row: 10, col: 6 },
      { row: 11, col: 5 },
      { row: 11, col: 6 },
    ],
  ],
  // The doors, drawn in the walls between the rooms.
  windows: [
    { at: { row: 1, col: 4 }, side: "right", door: true },
    { at: { row: 2, col: 6 }, side: "bottom", door: true },
    { at: { row: 1, col: 8 }, side: "right", door: true },
    { at: { row: 2, col: 10 }, side: "bottom", door: true },
    { at: { row: 5, col: 1 }, side: "bottom", door: true },
    { at: { row: 6, col: 3 }, side: "right", door: true },
    { at: { row: 6, col: 7 }, side: "right", door: true },
    { at: { row: 8, col: 10 }, side: "bottom", door: true },
    { at: { row: 10, col: 1 }, side: "bottom", door: true },
    { at: { row: 10, col: 3 }, side: "right", door: true },
    { at: { row: 11, col: 7 }, side: "right", door: true },
  ],
  suspects: [
    {
      id: "A",
      name: "Amira",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Teppich.", ...on("rug") },
      colour: "#9f1239",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Berit",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Bett. Sie war nicht mit Edith zusammen.",
        ...all(
          beside("bed"),
          about(["E"], (c) => {
            const edith = c.cellOf("E");
            return edith === undefined || c.areaOf(edith) !== c.areaOf(c.cell);
          }),
        ),
      },
      colour: "#15803d",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "C",
      name: "Carola",
      pronoun: "sie",
      clue: {
        text: "Sie war allein und neben einer Tür.",
        ...all(
          alone(),
          own((c) => besideDoor(c.cell)),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Dexter",
      pronoun: "er",
      clue: { text: "Er war neben einem Stuhl.", ...beside("chair") },
      colour: "#4f46e5",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Edith",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person auf einem Bett.",
        ...all(
          on("bed"),
          counting((c) => onlyOneOn(c, "bed")),
        ),
      },
      colour: "#6b21a8",
      face: "\u{1F475}",
    },
    {
      id: "F",
      name: "Fabrice",
      pronoun: "er",
      clue: {
        text: "Er war im Wohnzimmer. Er war nicht allein.",
        ...all(
          inArea("W"),
          counting((c) => c.peopleIn("W").length > 1),
        ),
      },
      colour: "#7f1d1d",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Giovanni",
      pronoun: "er",
      clue: {
        text: "Er war in einer der vier Ecken des Gitters.",
        ...own(inGridCorner),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Hugo",
      pronoun: "er",
      clue: {
        text: "Vier Zeilen südlich von ihm war ein männlicher Verdächtiger in der Halle.",
        ...all(
          own((c) => c.cellsOf("H").some((one) => one.row === c.cell.row + 4)),
          counting(manInHallBelow),
        ),
      },
      colour: "#3730a3",
      face: "\u{1F474}",
    },
    {
      id: "I",
      name: "Isaak",
      pronoun: "er",
      clue: {
        text: "Er war im Schlafzimmer. Er war nicht neben einer Tür.",
        ...all(inArea("S"), not(own((c) => besideDoor(c.cell)))),
      },
      colour: "#be123c",
      face: "\u{1F9D4}\u{1F3FF}",
    },
    {
      id: "J",
      name: "Jasmina",
      pronoun: "sie",
      clue: { text: "Sie war in der letzten Spalte.", ...column(12) },
      colour: "#a16207",
      face: "\u{1F475}",
    },
    {
      id: "K",
      name: "Karsten",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#57534e",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Orfeo",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  rules: [
    {
      text: "Genau eine Person saß auf einem Stuhl.",
      check: (c) => onlyOneOn(c, "chair"),
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Jasmina ist in S12, also ist Giovanni in S1, in einer der Ecken. Schließe den Rest von S1 aus.",
    },
    {
      text: "Edith ist auf einem Bett; schließe Z9 S7 aus, wo sich die Betten überschneiden. Der männliche Verdächtige in der Halle, der in Hugos Hinweis erwähnt wird, kann nur Karsten sein; das setzt Karsten in S8, in Z8 oder Z10.",
      cross: [{ row: 8, col: 6 }],
    },
    {
      text: "Das lokalisiert Isaak (der laut Ediths Hinweis nicht auf einem Bett ist), was Berit in Z10 neben dem Bett setzt, was Karsten lokalisiert und Edith auf das Bett in S7 setzt. Schließe das Bett in Z9 aus.",
      place: { I: { row: 2, col: 5 }, K: { row: 7, col: 7 } },
      cross: [
        { row: 8, col: 2 },
        { row: 8, col: 3 },
      ],
    },
    {
      text: "Fabrice ist mit jemand anderem im Wohnzimmer. Sie besetzen Z11 und Z12; schließe alle Felder außerhalb des Wohnzimmers in diesen Zeilen aus. Das lokalisiert Giovanni, dann Edith.",
      place: { G: { row: 0, col: 0 }, E: { row: 1, col: 6 } },
    },
    {
      text: "Zwei verfügbare Teppichfelder bleiben. Schließe das überschneidende Feld bei Z7 S11 aus.",
      cross: [{ row: 6, col: 10 }],
    },
    {
      text: "Die verbleibenden Stühle sind beide in S3. Einer ist besetzt; schließe den Rest von S3 aus. Das lokalisiert Berit.",
      place: { B: { row: 9, col: 3 } },
    },
    {
      text: "Das Wohnzimmer macht zwei Personen in S9-S12 aus; die anderen zwei müssen im Esszimmer sein, also kann Carola nur allein im Lagerraum sein. Das lokalisiert Carola neben der Lagertür, dann Hugo auf dem letzten Stuhl (vier Zeilen nördlich von Karsten), dann Jasmina.",
      place: {
        C: { row: 5, col: 1 },
        H: { row: 3, col: 2 },
        J: { row: 11, col: 11 },
      },
    },
    {
      text: "Dexter muss neben dem Stuhl im Esszimmer sein. Das lokalisiert Fabrice, dann Amira, dann Orfeo. Dexter ist der Mörder!",
      place: {
        D: { row: 8, col: 9 },
        F: { row: 10, col: 10 },
        A: { row: 6, col: 4 },
        O: { row: 4, col: 8 },
      },
    },
  ],
  solution: {
    A: { row: 6, col: 4 },
    B: { row: 9, col: 3 },
    C: { row: 5, col: 1 },
    D: { row: 8, col: 9 },
    E: { row: 1, col: 6 },
    F: { row: 10, col: 10 },
    G: { row: 0, col: 0 },
    H: { row: 3, col: 2 },
    I: { row: 2, col: 5 },
    J: { row: 11, col: 11 },
    K: { row: 7, col: 7 },
    O: { row: 4, col: 8 },
  },
};
