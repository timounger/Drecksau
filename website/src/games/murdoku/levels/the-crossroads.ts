/**
 * Die Wegkreuzung: a hill, a cobbled path, a wheat field and a cottage below
 * the lord's mansion, estate and pond, with a murdered knight.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/7.png`, no solution
 * sheet - the culprit is pencilled in on the photographed page, and the
 * solver proves it is the only solution). Ortlieb is the victim; whoever
 * was alone with him killed him.
 *
 * The map is nine by nine with fields missing at three corners. Beds,
 * chairs and the water of the pond can be stood on; trees, shrubs, boars,
 * barrels and the rock cannot. A field is on the edge of the grid when one
 * of its sides borders a field that is not part of the map ({@link onEdge}),
 * as the book's legend shows.
 *
 * The book's estates: nobles (purple cards: Alfred, Balthasar, Cäcilia)
 * only in the crowned mansion, estate and pond, villagers (wooden cards:
 * Diana, Emma) only in the other areas, knights (grey shields: Friedrich,
 * Gottfried, Hugo, Ortlieb) anywhere.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  alone,
  all,
  counting,
  inArea,
  own,
  ranks,
  row,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The nobles, whom Friedrich was north of. */
const NOBLES: readonly string[] = ["A", "B", "C"];

/** The women, for Emma's clue. */
const WOMEN: readonly string[] = ["C", "D", "E"];

/** The knights, for Gottfried's clue. */
const KNIGHTS: readonly string[] = ["F", "G", "H", "O"];

/** The four sides of a field. */
const STEPS: readonly Cell[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/** The fields on either side of a field, on the map or not. */
function sidesOf(cell: Cell): readonly Cell[] {
  return STEPS.map((step) => ({
    row: cell.row + step.row,
    col: cell.col + step.col,
  }));
}

/** Whether a field borders a field that is not part of the map. */
function onEdge(c: Context): boolean {
  return sidesOf(c.cell).some((side) => !c.inside(side));
}

/** Whether a field outside the path borders a field of the path. */
function besideThePath(c: Context): boolean {
  return (
    c.areaOf(c.cell) !== "P" &&
    sidesOf(c.cell).some((side) => c.inside(side) && c.areaOf(side) === "P")
  );
}

/** Whether a woman stands exactly this many rows from the suspect. */
function womanRowsAway(c: Context, rows: number): boolean {
  return WOMEN.some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self && there !== undefined && there.row === c.cell.row + rows
    );
  });
}

/** Whether exactly one other person shares the area, and is a knight. */
function aloneWithAKnight(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  const other = others[0];
  return others.length === 1 && other !== undefined && KNIGHTS.includes(other);
}

/** The case. */
export const THE_CROSSROADS: Level = {
  id: "the-crossroads",
  name: "Die Wegkreuzung",
  series: { book: "timeTravel", number: 7 },
  story:
    "Der Weg ins Grab ist mit wirklich hübschem Kopfsteinpflaster gepflastert.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "L",
      name: "Hügel",
      at: "auf dem Hügel",
      ground: "grass",
      tint: "#cfe3d8",
      label: { row: 3, col: 1 },
    },
    {
      key: "P",
      name: "Straße",
      at: "auf der Straße",
      ground: "path",
      tint: "#efe0b0",
      label: { row: 4, col: 1 },
    },
    {
      key: "T",
      name: "Weizenfeld",
      at: "im Weizenfeld",
      ground: "sand",
      tint: "#f3e7b8",
      label: { row: 6, col: 2 },
    },
    {
      key: "K",
      name: "Haus",
      at: "im Haus",
      ground: "floor",
      tint: "#e2ddd6",
      label: { row: 8, col: 3 },
    },
    {
      key: "H",
      name: "Herrengut",
      at: "im Herrengut",
      ground: "stone",
      tint: "#a99ad8",
      label: { row: 5, col: 6 },
    },
    {
      key: "M",
      name: "Herrenhaus",
      at: "im Herrenhaus",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 3, col: 7 },
    },
    {
      key: "E",
      name: "Herrenteich",
      at: "im Herrenteich",
      ground: "water",
      tint: "#b5d8f2",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    ".LLPPHHH.",
    "LLLPHHHMM",
    "LLLPHHMMM",
    "LLLPHHHMM",
    "PPPPPHHHH",
    "TTTTPHHHH",
    "TTTTPPHEE",
    "TTKKKPHEE",
    ".TKKKPPEE",
  ],
  thingMap: [
    "..t....s.",
    "..o.s.s.b",
    "t.....c.b",
    "..t......",
    "........o",
    "........s",
    "k.k......",
    "..bc..s..",
    "..b.....r",
  ],
  things: {
    b: "bed",
    c: "chair",
    k: "barrel",
    o: "boar",
    r: "boulder",
    s: "shrub",
    t: "tree",
  },
  pieces: [
    { at: { row: 1, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 2 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      traits: ["noble"],
      name: "Alfred",
      pronoun: "er",
      clue: {
        text: "Er war allein im Herrenhaus.",
        ...all(inArea("M"), alone()),
      },
      colour: "#7c3aed",
      face: "\u{1F474}",
    },
    {
      id: "B",
      traits: ["noble"],
      name: "Balthasar",
      pronoun: "er",
      clue: {
        text: "Er war am Rand des Rasters.",
        ...own(onEdge),
      },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      traits: ["noble"],
      name: "Cäcilia",
      pronoun: "sie",
      clue: {
        text: "Ihr Feld lag direkt neben der Straße, in einem anderen Bereich.",
        ...own(besideThePath),
      },
      colour: "#be185d",
      face: "\u{1F478}",
    },
    {
      id: "D",
      traits: ["villager"],
      name: "Diana",
      pronoun: "sie",
      clue: {
        text: "Sie war auf derselben Diagonale wie Alfred.",
        ...about(["A"], (c) => {
          const alfred = c.cellOf("A");
          return (
            alfred !== undefined &&
            alfred.row !== c.cell.row &&
            Math.abs(alfred.row - c.cell.row) ===
              Math.abs(alfred.col - c.cell.col)
          );
        }),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "E",
      traits: ["villager"],
      name: "Emma",
      pronoun: "sie",
      clue: {
        text: "Eine Zeile nördlich und eine Zeile südlich von ihr war jeweils eine Frau.",
        ...counting((c) => womanRowsAway(c, -1) && womanRowsAway(c, 1)),
      },
      colour: "#a16207",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "F",
      traits: ["knight"],
      name: "Friedrich",
      pronoun: "er",
      clue: {
        text: "Er war nördlich von jedem Adligen.",
        ...about(NOBLES, (c) =>
          NOBLES.every((id) => {
            const there = c.cellOf(id);
            return there !== undefined && c.cell.row < there.row;
          }),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "G",
      traits: ["knight"],
      name: "Gottfried",
      pronoun: "er",
      clue: {
        text: "Er war allein mit einem anderen Ritter.",
        ...counting(aloneWithAKnight),
      },
      colour: "#15803d",
      face: "\u{1F482}",
    },
    {
      id: "H",
      traits: ["knight"],
      name: "Hugo",
      pronoun: "er",
      clue: { text: "Er war in der fünften Zeile.", ...row(5) },
      colour: "#57534e",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "O",
      traits: ["knight"],
      name: "Ortlieb",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#334155",
      face: "\u{1F468}‍\u{1F9B1}",
    },
  ],
  rules: [
    ranks(
      "Adlige (\u{1F451}) waren nur im Herrenhaus, im Herrengut oder im Herrenteich, Dorfbewohner nur in den anderen Bereichen, Ritter überall.",
      ["M", "H", "E"],
    ),
    {
      text: "Kein Bereich war leer.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length > 0),
    },
    {
      text: "Es gab genau eine Person auf einem Stuhl.",
      check: (c) =>
        c.people().filter((id) => {
          const there = c.cellOf(id);
          return there !== undefined && c.is(there, "chair");
        }).length === 1,
    },
  ],
  hints: [
    {
      text: "Balthasar ist adlig und steht am Rand: im Herrengut nur R1 C6 oder R1 C7, im Herrenteich R7 C9, R8 C9 oder R9 C8. Friedrich steht nördlich aller Adligen, also ist Balthasar nicht in R1 - er ist im Herrenteich, in R7 bis R9. Alfred ist allein im Herrenhaus (R2 bis R4), Friedrich also in R1 bis R3.",
    },
    {
      text: "Emma hat eine Frau eine Zeile über und eine unter sich. In R2 oder R3 stünden Cäcilia, Diana und Emma in R1 bis R4 - mit Alfred und Friedrich fünf Personen in vier Zeilen. In R4 oder R6 bräuchte sie eine Frau in R5, Hugos Zeile. In R8 stünden die Frauen in R7 und R9, und für Balthasar bliebe keine Zeile. Emma steht in R7.",
    },
    {
      text: "Cäcilia und Diana stehen also in R6 und R8. Cäcilia ist adlig und neben der Straße: In R8 geht das nicht (R8 C7 ist ein Strauch), in R6 nur R6 C6. Diana steht in R8, Balthasar damit in R9 C8.",
      place: { C: { row: 5, col: 5 }, B: { row: 8, col: 7 } },
    },
    {
      text: "In C9 muss jemand stehen: R7 C9 und R8 C9 liegen in Emmas und Dianas Zeile, also steht Alfred in C9 des Herrenhauses. Genau eine Person sitzt auf einem Stuhl - der im Herrenhaus (R3 C7) ist für Alfred in C9 tabu, also sitzt Diana in R8 C4. Auf ihrer Diagonale steht Alfred in R3 C9.",
      place: { D: { row: 7, col: 3 }, A: { row: 2, col: 8 } },
    },
    {
      text: "Emma steht in R7: R7 C1 und R7 C3 sind Fässer, C4 ist Dianas Spalte - sie steht in R7 C2.",
      place: { E: { row: 6, col: 1 } },
    },
    {
      text: "Frei sind R1, R2, R4, R5 und C1, C3, C5, C7. In R2 ist nur R2 C1 betretbar - das letzte Feld auf dem Hügel, der nicht leer sein darf. Wer dort steht, ist allein: nicht Gottfried, nicht Ortlieb und nicht Hugo (R5). Friedrich steht in R2 C1.",
      place: { F: { row: 1, col: 0 } },
    },
    {
      text: "Im Herrengut steht Cäcilia, also kann Gottfried dort nicht allein mit einem Ritter sein. In R4 gibt es nur Felder des Herrenguts - Gottfried steht in R1 C5 auf der Straße, und Hugo ist der zweite Ritter dort: R5 C3. Ortlieb steht in R4 C7, allein mit Cäcilia im Herrengut. Cäcilia ist die Mörderin!",
      place: {
        G: { row: 0, col: 4 },
        H: { row: 4, col: 2 },
        O: { row: 3, col: 6 },
      },
    },
  ],
  solution: {
    A: { row: 2, col: 8 },
    B: { row: 8, col: 7 },
    C: { row: 5, col: 5 },
    D: { row: 7, col: 3 },
    E: { row: 6, col: 1 },
    F: { row: 1, col: 0 },
    G: { row: 0, col: 4 },
    H: { row: 4, col: 2 },
    O: { row: 3, col: 6 },
  },
};
