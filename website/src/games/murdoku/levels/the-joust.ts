/**
 * Das Lanzenstechen: the lists between the royal box, the royal armoury, the
 * royal chambers, the stables and the stand, with a murdered knight.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/12.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Vincent is the victim; whoever was alone with him killed him.
 *
 * The map is nine rows by eleven columns with two corners missing. Chairs,
 * horses, rugs and mud puddles can be stood on; weapon racks, barrels and the
 * tilt barrier cannot - as the blank grid of the page
 * shows. Two columns stay empty, and every noble stood directly left of one.
 *
 * The book's estates: nobles (purple cards: Ella, Francis) only in the
 * crowned royal box, armoury and chambers, villagers (wooden cards: Aldous,
 * Bridget, Christian, Diana) only in the other areas, knights (grey shields:
 * Grace, Hagan, Vincent) anywhere.
 */
import {
  about,
  alone,
  all,
  beside,
  counting,
  on,
  own,
  ranks,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The nobles, each directly left of an empty column. */
const NOBLES: readonly string[] = ["E", "F"];

/** The women, for Aldous's clue. */
const WOMEN: readonly string[] = ["B", "D", "E", "G"];

/** The two boxes. */
const BOXES: readonly string[] = ["P", "S"];

/** The columns, counted from nought, where nobody stood. */
function emptyColumns(c: Context): readonly number[] {
  const taken = new Set(
    c.people().flatMap((id) => {
      const there = c.cellOf(id);
      return there === undefined ? [] : [there.col];
    }),
  );
  return Array.from({ length: c.cols }, (_, col) => col).filter(
    (col) => !taken.has(col),
  );
}

/** Whether two columns stayed empty, each directly right of a noble. */
function noblesLeftOfTheEmptyColumns(c: Context): boolean {
  const empty = emptyColumns(c);
  return (
    empty.length === 2 &&
    NOBLES.every((id) => {
      const there = c.cellOf(id);
      return there !== undefined && empty.includes(there.col + 1);
    })
  );
}

/** Whether the suspect is in a box together with a woman. */
function inABoxWithAWoman(c: Context): boolean {
  const area = c.areaOf(c.cell) ?? "";
  return (
    BOXES.includes(area) &&
    c.peopleIn(area).some((id) => id !== c.self && WOMEN.includes(id))
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

/** The case. */
export const THE_JOUST: Level = {
  id: "the-joust",
  name: "Das Lanzenstechen",
  series: { book: "timeTravel", number: 12 },
  story:
    "Für die drei Meter lange Lanze brauchen wir einen größeren Beweismittelbeutel.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "P",
      name: "Königliche Loge",
      at: "in der königlichen Loge",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 1, col: 4 },
    },
    {
      key: "A",
      name: "Königliche Waffenkammer",
      at: "in der königlichen Waffenkammer",
      ground: "floor",
      tint: "#d3c3ea",
      label: { row: 5, col: 0 },
    },
    {
      key: "K",
      name: "Turnierplatz",
      at: "auf dem Turnierplatz",
      ground: "sand",
      tint: "#e6e2da",
      label: { row: 6, col: 4 },
    },
    {
      key: "E",
      name: "Ställe",
      at: "in den Ställen",
      ground: "floor",
      tint: "#d6d3cc",
      label: { row: 6, col: 9 },
    },
    {
      key: "Q",
      name: "Königliche Gemächer",
      at: "in den königlichen Gemächern",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 8, col: 1 },
      labelOverhang: true,
    },
    {
      key: "S",
      name: "Tribüne",
      at: "auf der Tribüne",
      ground: "floor",
      tint: "#e2ddd6",
      label: { row: 8, col: 5 },
    },
  ],
  areaMap: [
    ".PPPPPPPPPP",
    "AAAPPPPPPPE",
    "AAKKKKKKKEE",
    "AAKKKKKKKEE",
    "AAKKKKKKKEE",
    "AAKKKKKKKEE",
    "QQKKKKKKKEE",
    "QQQSSSSSSSE",
    ".QQSSSSSSSS",
  ],
  thingMap: [
    "..c.c..cc..",
    "..w.rrrr.c.",
    ".w.......o.",
    "....h.....h",
    ".w.fffff.mh",
    "ow.om......",
    ".r.h......o",
    "wrr..m....m",
    "..wc.c.oc..",
  ],
  things: {
    c: "chair",
    f: "barrier",
    h: "horse",
    m: "mud",
    o: "barrel",
    r: "rug",
    w: "weaponRack",
  },
  extraThings: {
    barrier: { name: "Schranke", emoji: "\u{1F6A7}", standable: false },
  },
  pieces: [
    { at: { row: 1, col: 4 }, rows: 1, cols: 4 },
    { at: { row: 4, col: 3 }, rows: 1, cols: 5 },
  ],
  shapes: [
    [
      { row: 6, col: 1 },
      { row: 7, col: 1 },
      { row: 7, col: 2 },
    ],
  ],
  suspects: [
    {
      id: "A",
      traits: ["villager"],
      name: "Aldous",
      pronoun: "er",
      clue: {
        text: "Er war in einer Loge, zusammen mit einer Frau.",
        ...counting(inABoxWithAWoman),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      traits: ["villager"],
      name: "Bridget",
      pronoun: "sie",
      clue: { text: "Sie ritt auf einem Pferd.", ...on("horse") },
      colour: "#15803d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "C",
      traits: ["villager"],
      name: "Christian",
      pronoun: "er",
      clue: { text: "Er war neben einem Fass.", ...beside("barrel") },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      traits: ["villager"],
      name: "Diana",
      pronoun: "sie",
      clue: { text: "Sie war in einer Schlammpfütze.", ...on("mud") },
      colour: "#a16207",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "E",
      traits: ["noble"],
      name: "Ella",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl. Aldous saß auf einem Stuhl östlich von ihr.",
        ...all(
          on("chair"),
          about(["A"], (c) => {
            const aldous = c.cellOf("A");
            return (
              aldous !== undefined &&
              aldous.col > c.cell.col &&
              c.is(aldous, "chair")
            );
          }),
        ),
      },
      colour: "#be185d",
      face: "\u{1F478}",
    },
    {
      id: "F",
      traits: ["noble"],
      name: "Francis",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Teppich.",
        ...all(
          on("rug"),
          counting((c) => onlyOneOn(c, "rug")),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F934}",
    },
    {
      id: "G",
      traits: ["knight"],
      name: "Grace",
      pronoun: "sie",
      clue: {
        text: "Sie war in der ersten oder in der letzten Spalte.",
        ...own((c) => c.cell.col === 0 || c.cell.col === c.cols - 1),
      },
      colour: "#57534e",
      face: "\u{1F482}‍♀️",
    },
    {
      id: "H",
      traits: ["knight"],
      name: "Hagan",
      pronoun: "er",
      clue: { text: "Er war allein.", ...alone() },
      colour: "#334155",
      face: "\u{1F482}",
    },
    {
      id: "V",
      traits: ["knight"],
      name: "Vincent",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#6b7280",
      face: "\u{1F468}‍\u{1F9B1}",
    },
  ],
  rules: [
    ranks(
      "Adlige (\u{1F451}) waren nur in der königlichen Loge, der königlichen Waffenkammer oder den königlichen Gemächern, Dorfbewohner nur in den anderen Bereichen, Ritter überall.",
      ["P", "A", "Q"],
    ),
    {
      text: "Zwei Spalten waren leer. Jeder Adlige stand direkt links neben einer leeren Spalte.",
      check: noblesLeftOfTheEmptyColumns,
    },
  ],
  hints: [
    {
      text: "Aldous ist Dorfbewohner und sitzt auf einem Stuhl: Außerhalb der gekrönten Bereiche stehen Stühle nur auf der Tribüne in R9 - Aldous ist in R9. Mit ihm ist eine Frau auf der Tribüne: Bridget fände dort kein Pferd, Ella ist adlig, Grace müsste in R9 C11 stehen. Es ist Diana in der Schlammpfütze R8 C6.",
      place: { D: { row: 7, col: 5 } },
    },
    {
      text: "Zwei Spalten sind leer, und rechts neben jedem Adligen liegt eine leere Spalte. Ella sitzt in der Loge, Aldous auf einem Stuhl östlich von ihr in einer besetzten Spalte. In R1 C5 wäre Dianas Spalte leer, in R1 C8 die von Aldous (R9 C9), und östlich von R1 C9 oder R2 C10 gibt es keinen Stuhl auf der Tribüne. Ella sitzt in R1 C3, C4 ist leer, Aldous sitzt in R9 C9.",
      place: { E: { row: 0, col: 2 }, A: { row: 8, col: 8 } },
    },
    {
      text: "Francis ist der Einzige auf einem Teppich, adlig. R7 C2 und R8 C2 würden Ellas Spalte leeren, R8 C3 liegt in ihr; in der Loge würde R2 C5 Dianas Spalte leeren, R2 C6 liegt in ihr, R2 C8 würde die Spalte von Aldous leeren. Francis steht in R2 C7, C8 ist leer.",
      place: { F: { row: 1, col: 6 } },
    },
    {
      text: "Frei sind R3 bis R7 und C1, C2, C5, C10, C11 - jede davon ist besetzt, denn nur C4 und C8 sind leer. In C2 bleibt nur R4 C2 - dort steht Hagan oder Vincent. Bridget reitet: R4 C5 und R4 C11 liegen in R4, R7 C4 in der leeren C4 - sie reitet in R5 C11. Grace steht damit in C1. Christian steht neben einem Fass: R3 C11 und R6 C11 liegen in Bridgets Spalte, R4 C10 in R4 - er steht in R7 C10.",
      place: { B: { row: 4, col: 10 }, C: { row: 6, col: 9 } },
    },
    {
      text: "Übrig sind R3 und R6 sowie C1 und C5. Grace in C1: R6 C1 ist ein Fass, also R3 C1 in der Waffenkammer. Der letzte Ritter steht in R6 C5 auf dem Turnierplatz.",
      place: { G: { row: 2, col: 0 } },
    },
    {
      text: "In R4 C2 wäre Hagan nicht allein - Grace ist mit in der Waffenkammer. Also steht Hagan allein in R6 C5 und Vincent in R4 C2, allein mit Grace. Grace ist die Mörderin!",
      place: { H: { row: 5, col: 4 }, V: { row: 3, col: 1 } },
    },
  ],
  solution: {
    A: { row: 8, col: 8 },
    B: { row: 4, col: 10 },
    C: { row: 6, col: 9 },
    D: { row: 7, col: 5 },
    E: { row: 0, col: 2 },
    F: { row: 1, col: 6 },
    G: { row: 2, col: 0 },
    H: { row: 5, col: 4 },
    V: { row: 3, col: 1 },
  },
};
