/**
 * Der Saloon: three rooms upstairs, the gallery, the stairs, the bar and the
 * main hall, outlaws hiding among the guests and a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/29.png`, no solution
 * sheet - part of the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves the only solution). Viggo is the
 * victim; whoever was alone with him killed him. The case plays in the Wild
 * West, so there are no estates.
 *
 * **Who the outlaws are - and how many - is not printed; it is part of the
 * puzzle.** No outlaw was alone, every outlaw was in another area, Viggo is
 * none of them and nobody in Clara's area is one. Brienna stood exactly one
 * row south of an outlaw in another area, Flora exactly one column east of
 * an outlaw in the gallery, and Gail was in the main hall with an outlaw
 * beside the piano. The clues about the outlaws hold when some choice of
 * them fits them all ({@link someGang}).
 *
 * A field is in a corner of its area when the area's border runs along two
 * of its sides that meet. Chairs, beds and rugs can be stood on; tables,
 * shelves, plants, barrels and the piano cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  alone,
  all,
  cellsWhere,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** Who may be an outlaw: everybody but Viggo and Clara. */
const MAYBE_OUTLAWS: readonly string[] = [
  "A",
  "B",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
];

/** Every choice of outlaws, at least one. */
const GANGS: readonly (readonly string[])[] = Array.from(
  { length: 2 ** MAYBE_OUTLAWS.length - 1 },
  (_, at) => MAYBE_OUTLAWS.filter((_one, bit) => ((at + 1) >> bit) % 2 === 1),
);

/** The fields of the main hall beside the piano. */
const PIANO_SIDES: readonly Cell[] = [
  { row: 7, col: 0 },
  { row: 6, col: 1 },
];

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

/** Whether every clue about the outlaws holds for this choice of them. */
function fits(c: Context, gang: readonly string[]): boolean {
  const areaOfId = (id: string) => {
    const there = c.cellOf(id);
    return there === undefined ? null : c.areaOf(there);
  };
  const areas = gang.map(areaOfId);
  const brienna = c.cellOf("B");
  const flora = c.cellOf("F");
  return (
    brienna !== undefined &&
    flora !== undefined &&
    new Set(areas).size === gang.length &&
    areas.every((area) => c.peopleIn(area ?? "").length > 1) &&
    !areas.includes(areaOfId("C")) &&
    gang.some(
      (id) =>
        c.cellOf(id)?.row === brienna.row - 1 && areaOfId(id) !== areaOfId("B"),
    ) &&
    gang.some(
      (id) => c.cellOf(id)?.col === flora.col - 1 && areaOfId(id) === "P",
    ) &&
    gang.some((id) => {
      const there = c.cellOf(id);
      return (
        id !== "G" &&
        there !== undefined &&
        c.areaOf(there) === "M" &&
        c.beside(there, "piano")
      );
    })
  );
}

/** Whether some choice of the outlaws fits every clue about them. */
function someGang(c: Context): boolean {
  return GANGS.some((gang) => fits(c, gang));
}

/** Whether Albert shares his area with exactly one person, on a rug. */
function withOneOnRug(c: Context): boolean {
  const company = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  const other = company.length === 1 ? c.cellOf(company[0] ?? "") : undefined;
  return other !== undefined && c.is(other, "rug");
}

/**
 * For the solver: whether nobody yet shares Emilia's area, who was alone,
 * and nobody but one shares Viggo's or Albert's.
 *
 * @param c - the context, with the people placed so far
 * @returns false when the placement can no longer be finished
 */
function stillPossible(c: Context): boolean {
  const crowd = (id: string) => {
    const there = c.cellOf(id);
    return there === undefined ? 0 : c.peopleIn(c.areaOf(there) ?? "").length;
  };
  const brienna = c.cellOf("B");
  const flora = c.cellOf("F");
  return (
    crowd("E") <= 1 &&
    crowd("V") <= 2 &&
    crowd("A") <= 2 &&
    columnLeft(c, "G", "D", 4) &&
    columnLeft(c, "D", "G", -4) &&
    PIANO_SIDES.some((cell) => stillOpen(c, cell, "M")) &&
    (brienna === undefined ||
      Array.from({ length: c.cols }, (_, col) => ({
        row: brienna.row - 1,
        col,
      })).some(
        (cell) =>
          c.areaOf(cell) !== c.areaOf(brienna) &&
          stillOpen(c, cell, c.areaOf(cell) ?? ""),
      )) &&
    (flora === undefined ||
      [3, 4].some((row) => stillOpen(c, { row, col: flora.col - 1 }, "P")))
  );
}

/**
 * For the solver: once one of Gail and Dudley stands, the column the other
 * needs must still be on the map and free.
 *
 * @param c - the context, with the people placed so far
 * @param placed - who stands
 * @param other - who is still to come
 * @param step - how many columns from the one to the other
 * @returns false when the other can no longer be placed
 */
function columnLeft(
  c: Context,
  placed: string,
  other: string,
  step: number,
): boolean {
  const there = c.cellOf(placed);
  const col = there === undefined ? 0 : there.col + step;
  return (
    there === undefined ||
    c.cellOf(other) !== undefined ||
    (col >= 0 &&
      col < c.cols &&
      c.people().every((id) => c.cellOf(id)?.col !== col))
  );
}

/**
 * For the solver: whether a possible outlaw stands on a field of this area,
 * or somebody still could - its row and column free and the field standable.
 *
 * @param c - the context, with the people placed so far
 * @param cell - the field
 * @param area - the area the field must lie in
 * @returns false when no outlaw can stand there any more
 */
function stillOpen(c: Context, cell: Cell, area: string): boolean {
  const here = c.inside(cell) ? c.personAt(cell) : null;
  const free = c.people().every((id) => {
    const there = c.cellOf(id);
    return (
      there === undefined || (there.row !== cell.row && there.col !== cell.col)
    );
  });
  return (
    c.inside(cell) &&
    c.areaOf(cell) === area &&
    (here === null ? free && c.standable(cell) : MAYBE_OUTLAWS.includes(here))
  );
}

/** The case. */
export const THE_SALOON: Level = {
  id: "the-saloon",
  name: "Der Saloon",
  series: { book: "timeTravel", number: 29 },
  story:
    "Ganz ehrlich: Wenn bei einer Saloonschlägerei nur eine Person stirbt, nehme ich das als Sieg.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Zimmer A",
      at: "in Zimmer A",
      ground: "floor",
      tint: "#d9c6dc",
      label: { row: 4, col: 0 },
      labelOverhang: true,
    },
    {
      key: "B",
      name: "Zimmer B",
      at: "in Zimmer B",
      ground: "floor",
      tint: "#d4c4e0",
      label: { row: 2, col: 4 },
    },
    {
      key: "C",
      name: "Zimmer C",
      at: "in Zimmer C",
      ground: "floor",
      tint: "#d9c6dc",
      label: { row: 2, col: 7 },
    },
    {
      key: "P",
      name: "Galerie",
      at: "auf der Galerie",
      ground: "floor",
      tint: "#c8c6e6",
      label: { row: 4, col: 4 },
    },
    {
      key: "S",
      name: "Treppe",
      at: "auf der Treppe",
      ground: "floor",
      tint: "#e2dccb",
      label: { row: 6, col: 8 },
    },
    {
      key: "R",
      name: "Bar",
      at: "an der Bar",
      ground: "floor",
      tint: "#c8c6e6",
      label: { row: 7, col: 7 },
    },
    {
      key: "M",
      name: "Hauptsaal",
      at: "im Hauptsaal",
      ground: "floor",
      tint: "#d6bfcc",
      label: { row: 9, col: 6 },
    },
  ],
  areaMap: [
    "AAABBBBCCC",
    "AAABBBBCCC",
    "AAABBBBCCC",
    "AAPPPPPPPP",
    "AAPPPPPPSS",
    "MMMMMRRRSS",
    "MMMMMRRRSS",
    "MMMMMRRRRM",
    "MMMMMMMMMM",
    "MMMMMMMMMM",
  ],
  thingMap: [
    "btl.hb.btt",
    "bg.c.btbgg",
    "hg.......l",
    "c.c.ttggg.",
    "..........",
    "l.cc.khh..",
    "n.ttct..k.",
    ".cttgtt...",
    "...cgcc..c",
    ".lct.t..lt",
  ],
  things: {
    b: "bed",
    c: "chair",
    g: "rug",
    h: "shelf",
    k: "barrel",
    l: "plant",
    n: "piano",
    t: "table",
  },
  extraThings: {
    piano: { name: "Klavier", emoji: "\u{1F3B9}", standable: false },
  },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 8 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 8 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 6 }, rows: 1, cols: 3 },
    { at: { row: 6, col: 2 }, rows: 2, cols: 2 },
    { at: { row: 7, col: 4 }, rows: 2, cols: 1 },
  ],
  // The bar counter, round a corner.
  shapes: [
    [
      { row: 6, col: 5 },
      { row: 7, col: 5 },
      { row: 7, col: 6 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Albert",
      pronoun: "er",
      clue: {
        text: "Er war allein mit jemandem, der auf einem Teppich stand.",
        ...counting(withOneOnRug),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Brienna",
      pronoun: "sie",
      clue: {
        text: "Sie war genau eine Zeile südlich eines Gesetzlosen, der in einem anderen Bereich war.",
        ...counting(someGang),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Clara",
      pronoun: "sie",
      clue: {
        text: "Sie war in Zimmer A, B oder C. In ihrem Bereich war kein Gesetzloser.",
        ...all(inArea("A", "B", "C"), counting(someGang)),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "D",
      name: "Dudley",
      pronoun: "er",
      clue: {
        text: "Er war genau vier Spalten östlich von Gail.",
        ...about(["G"], (c) => {
          const gail = c.cellOf("G");
          return gail !== undefined && c.cell.col === gail.col + 4;
        }),
      },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Emilia",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl. Sie war allein.",
        ...all(on("chair"), alone()),
      },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Flora",
      pronoun: "sie",
      clue: {
        text: "Sie war genau eine Spalte östlich eines Gesetzlosen, der auf der Galerie war.",
        ...counting(someGang),
      },
      colour: "#9f1239",
      face: "\u{1F483}",
    },
    {
      id: "G",
      name: "Gail",
      pronoun: "sie",
      clue: {
        text: "Sie war im Hauptsaal bei einem Gesetzlosen, der neben dem Klavier war.",
        ...all(inArea("M"), counting(someGang)),
      },
      colour: "#a16207",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "H",
      name: "Hudson",
      pronoun: "er",
      clue: { text: "Er lag auf einem Bett.", ...on("bed") },
      colour: "#57534e",
      face: "\u{1F920}",
    },
    {
      id: "I",
      name: "Ignatius",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke seines Bereichs.",
        ...own((c) => inCorner(c.areaOf, c.cell)),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#334155",
      face: "\u{1F474}",
    },
    {
      id: "V",
      name: "Viggo",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Kein Gesetzloser. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F935}",
    },
  ],
  rules: [
    {
      text: "Kein Gesetzloser war allein. Alle Gesetzlosen waren in verschiedenen Bereichen.",
      check: someGang,
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Die Galerie liegt nur in R4 und R5. Flora braucht dort einen Gesetzlosen, und kein Gesetzloser war allein: Auf der Galerie stehen genau zwei, in R4 und R5. Emilia saß allein auf einem Stuhl - nicht auf der Galerie, nicht in R4 (R4 C1) und nicht im Hauptsaal, wo Gail mit einem Gesetzlosen ist. Emilia sitzt in R2 C4 in Zimmer B.",
      place: { E: { row: 1, col: 3 } },
    },
    {
      text: "Hudson liegt auf einem Bett, nicht in Emilias Zimmer B und nicht in ihrer Zeile: R1 C1 oder R1 C8. Clara ist in Zimmer A oder C, aber R1, R2, R4 und R5 sind vergeben - sie steht in R3. R9 und R10 gehören ganz zum Hauptsaal: Dort stehen zwei Leute, dazu der Gesetzlose neben dem Klavier (R8 C1 oder R7 C2) - mindestens drei.",
    },
    {
      text: "Wer ist der Gesetzlose neben dem Klavier? Nicht Gail, Viggo oder Clara; Albert war mit nur einer Person allein, Dudley steht vier Spalten östlich von Gail (frühestens C5), Flora hätte westlich keinen Galerie-Gesetzlosen, und die beiden Felder sind keine Ecken für Ignatius. Es ist Brienna. Albert kann weder im vollen Hauptsaal noch in R1 bis R3 stehen: Er ist auf der Galerie, und sein Gegenüber steht auf dem Teppich in R4 - Albert steht in R5.",
    },
    {
      text: "In R6 bis R10 stehen Brienna, die zwei aus R9 und R10 und ein Paar an der Bar oder auf der Treppe (der dritte Gesetzlose und seine Begleitung) in zwei der Zeilen R6 bis R8. Mit Brienna in R7 C2 bräuchte das Paar R6 und R8 - kein Bereich hat dort beides frei. Brienna steht in R8 C1, das Paar auf der Treppe in R6 C9 und R7 C10, der Gesetzlose eine Zeile über Brienna in R7 C10. Ignatius steht in einer Ecke: R10 C1 und R10 C10 liegen in besetzten Spalten - er ist der Gesetzlose in R7 C10.",
      place: { B: { row: 7, col: 0 }, I: { row: 6, col: 9 } },
    },
    {
      text: "C1 ist Briennas Spalte, also liegt Hudson in R1 C8. Der Teppich-Platz auf der Galerie ist R4 C7 (C8 Hudson, C9 die Treppe), und Clara steht in R3 C2 oder R3 C3. Wäre die Person in R4 C7 eine Gesetzlose, wäre es Dudley - dann stünde Flora in C8, Hudsons Spalte. Also ist Albert der Galerie-Gesetzlose. Viggo in R4 C7: Albert in R5 C5, Flora in C6 im Hauptsaal, Dudley in R6 C9 und Gail in C5 - Alberts Spalte. Flora in R4 C7: Dudley und Gail fänden in C2, C3 und C5 keinen Abstand von vier. Dudley steht in R4 C7, Gail in C3, Clara in R3 C2.",
      place: {
        H: { row: 0, col: 7 },
        D: { row: 3, col: 6 },
        C: { row: 2, col: 1 },
      },
    },
    {
      text: "Übrig sind C5 und C6: Albert steht in R5 C5, Flora eine Spalte östlich im Hauptsaal - R10 C6 ist ein Tisch, also sitzt sie in R9 C6, und Gail sitzt in R10 C3. Viggo steht in R6 C9 auf der Treppe, allein mit Ignatius. Ignatius ist der Mörder!",
      place: {
        A: { row: 4, col: 4 },
        F: { row: 8, col: 5 },
        G: { row: 9, col: 2 },
        V: { row: 5, col: 8 },
      },
    },
  ],
  solution: {
    A: { row: 4, col: 4 },
    B: { row: 7, col: 0 },
    C: { row: 2, col: 1 },
    D: { row: 3, col: 6 },
    E: { row: 1, col: 3 },
    F: { row: 8, col: 5 },
    G: { row: 9, col: 2 },
    H: { row: 0, col: 7 },
    I: { row: 6, col: 9 },
    V: { row: 5, col: 8 },
  },
};
