/**
 * Die Goldmine: a ranch, a house, a store, an office and a gold mine with a
 * caved-in tunnel, four outlaws among the suspects and a murdered miner.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/31.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Virgilio is the victim; whoever was alone with him killed him. No estates
 * in this case.
 *
 * Exactly four suspects are outlaws, each in a different area. Daryl and
 * Gerald are outlaws; Colin, Ingrid and Virgilio are not. Who the other two
 * are follows from the clues of Anya, Eugene and Honora
 * ({@link outlawsFit}). "West of" means in a column further left. The map
 * is twelve by twelve. Mine carts and chairs can be stood on; gold veins
 * (as the legend says), dynamite, rocks, sacks, hay bales, cows, cacti and
 * tables cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
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
import type { Context, Level } from "../engine/types";

/** The suspects the clues name as outlaws. */
const KNOWN_OUTLAWS: readonly string[] = ["D", "G"];

/** The suspects who may or may not be outlaws. */
const MAYBE_OUTLAWS: readonly string[] = ["A", "B", "E", "F", "H", "J", "K"];

/** Every pair of the suspects who may be outlaws. */
const PAIRS: readonly (readonly string[])[] = MAYBE_OUTLAWS.flatMap((one, at) =>
  MAYBE_OUTLAWS.slice(at + 1).map((other) => [one, other]),
);

/** The area of somebody, or an empty string while not placed. */
function areaOfPerson(c: Context, id: string): string {
  const there = c.cellOf(id);
  return there === undefined ? "" : (c.areaOf(there) ?? "");
}

/** Whether the suspect's area holds a thing of this id at all. */
function areaHas(c: Context, what: string): boolean {
  return c.cellsOf(c.areaOf(c.cell) ?? "").some((cell) => c.is(cell, what));
}

/** Whether an outlaw other than somebody stood beside a thing of this id in their area. */
function outlawBesideIn(
  c: Context,
  outlaws: readonly string[],
  who: string,
  what: string,
): boolean {
  const area = areaOfPerson(c, who);
  return outlaws.some((id) => {
    const there = c.cellOf(id);
    return (
      id !== who &&
      there !== undefined &&
      c.areaOf(there) === area &&
      c.beside(there, what)
    );
  });
}

/** Whether these four outlaws fit every clue about outlaws. */
function fourFit(c: Context, outlaws: readonly string[]): boolean {
  const areas = new Set(outlaws.map((id) => areaOfPerson(c, id)));
  const honora = c.cellOf("H");
  return (
    areas.size === outlaws.length &&
    outlawBesideIn(c, outlaws, "A", "dynamite") &&
    outlawBesideIn(c, outlaws, "E", "goldVein") &&
    honora !== undefined &&
    outlaws.some((id) => c.cellOf(id)?.row === honora.row + 1)
  );
}

/** Whether two more outlaws can be found so that every clue holds. */
function outlawsFit(c: Context): boolean {
  return PAIRS.some((pair) => fourFit(c, [...KNOWN_OUTLAWS, ...pair]));
}

/**
 * Whether these four outlaws may still fit, as far as people stand: no two
 * of them placed in one area, and the clues about them met once everybody
 * they need stands.
 */
function fourMayFit(c: Context, outlaws: readonly string[]): boolean {
  const placed = outlaws.filter((id) => c.cellOf(id) !== undefined);
  const areas = new Set(placed.map((id) => areaOfPerson(c, id)));
  const ready = (who: string): boolean =>
    placed.length === outlaws.length && c.cellOf(who) !== undefined;
  const honora = c.cellOf("H");
  return (
    areas.size === placed.length &&
    (!ready("A") || outlawBesideIn(c, outlaws, "A", "dynamite")) &&
    (!ready("E") || outlawBesideIn(c, outlaws, "E", "goldVein")) &&
    (!ready("H") ||
      outlaws.some((id) => c.cellOf(id)?.row === (honora?.row ?? -2) + 1))
  );
}

/**
 * For the solver only: whether the case can still be finished - nobody
 * with Kenneth, nobody crowding Virgilio, and still two outlaws to find.
 */
function stillPossible(c: Context): boolean {
  const vince = c.cellOf("V");
  const withVince =
    vince === undefined ? [] : c.peopleIn(c.areaOf(vince) ?? "");
  return (
    c.peopleIn("O").length <= 1 &&
    withVince.length <= 2 &&
    PAIRS.some((pair) => fourMayFit(c, [...KNOWN_OUTLAWS, ...pair]))
  );
}

/** The case. */
export const THE_GOLD_MINE: Level = {
  id: "the-gold-mine",
  name: "Die Goldmine",
  series: { book: "timeTravel", number: 31 },
  story: "Leider nimmt das Goldfieber manchmal ein tödliches Ende.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "P",
      name: "Ebene",
      at: "in der Ebene",
      ground: "sand",
      tint: "#f1ebc0",
      label: { row: 5, col: 9 },
    },
    {
      key: "H",
      name: "Haus",
      at: "im Haus",
      ground: "floor",
      tint: "#d9d2ea",
      label: { row: 1, col: 6 },
    },
    {
      key: "R",
      name: "Ranch",
      at: "auf der Ranch",
      ground: "floor",
      tint: "#e9c9a9",
      label: { row: 3, col: 9 },
    },
    {
      key: "X",
      name: "Sprengstoff",
      at: "beim Sprengstoff",
      ground: "floor",
      tint: "#bfaaa3",
      label: { row: 6, col: 0 },
      labelOverhang: true,
    },
    {
      key: "S",
      name: "Lager",
      at: "im Lager",
      ground: "floor",
      tint: "#d8d4d4",
      label: { row: 7, col: 5 },
    },
    {
      key: "O",
      name: "Büro",
      at: "im Büro",
      ground: "floor",
      tint: "#d8d0dc",
      label: { row: 7, col: 8 },
    },
    {
      key: "T",
      name: "Eingestürzter Stollen",
      at: "im eingestürzten Stollen",
      ground: "stone",
      tint: "#a9aed8",
      label: { row: 9, col: 2 },
      labelOverhang: true,
    },
    {
      key: "E",
      name: "Eingang",
      at: "am Eingang",
      ground: "stone",
      tint: "#b9d3ea",
      label: { row: 10, col: 10 },
    },
    {
      key: "M",
      name: "Goldmine",
      at: "in der Goldmine",
      ground: "stone",
      tint: "#9fb6d8",
      label: { row: 11, col: 6 },
    },
  ],
  areaMap: [
    "PPPPHHHRRRRR",
    "PPPPHHHRRRRR",
    "PPPPPPPRRRRR",
    "XXPPPPPPPRRR",
    "XXPPPPPPPPPP",
    "XXSSSSSPPPPE",
    "XXMMSSSOOOEE",
    "MMMMSSSOOOEE",
    "MMMTTTTTTEEE",
    "MMTTTTTTEEEE",
    "MMMMMMMMMMEE",
    "MMMMMMMMMMMM",
  ],
  thingMap: [
    "......c.h.w.",
    "k....t.whh..",
    "....k......w",
    "d......k..h.",
    "....h.......",
    "dd...s......",
    "...gs..ctt..",
    ".m..s.s..s..",
    "g..s.gr....r",
    ".....r.g....",
    "......m....s",
    "gm.rdg...r..",
  ],
  things: {
    c: "chair",
    d: "dynamite",
    g: "goldVein",
    h: "hay",
    k: "cactus",
    m: "mineCart",
    r: "boulder",
    s: "sack",
    t: "table",
    w: "cow",
  },
  extraThings: {
    goldVein: { name: "Goldader", emoji: "\u{1FA99}", standable: false },
    mineCart: { name: "Lore", emoji: "\u{1F6D2}", standable: true },
  },
  pieces: [{ at: { row: 6, col: 8 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Anya",
      pronoun: "sie",
      clue: {
        text: "In ihrem Bereich war ein Gesetzloser neben Dynamit.",
        ...all(
          own((c) => areaHas(c, "dynamite")),
          counting(outlawsFit),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Blake",
      pronoun: "er",
      clue: { text: "Er war in einer Lore.", ...on("mineCart") },
      colour: "#15803d",
      face: "\u{1F9D4}\u{1F3FF}",
    },
    {
      id: "C",
      name: "Colin",
      pronoun: "er",
      clue: {
        text: "Kein Gesetzloser. Er war in der Goldmine oder am Eingang.",
        ...inArea("M", "E"),
      },
      colour: "#0e7490",
      face: "\u{1F477}",
    },
    {
      id: "D",
      name: "Daryl",
      pronoun: "er",
      clue: {
        text: "Ein Gesetzloser. Er war neben einem Heuballen.",
        ...all(beside("hay"), counting(outlawsFit)),
      },
      colour: "#6366f1",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "E",
      name: "Eugene",
      pronoun: "er",
      clue: {
        text: "In seinem Bereich war ein Gesetzloser neben einer Goldader.",
        ...all(
          own((c) => areaHas(c, "goldVein")),
          counting(outlawsFit),
        ),
      },
      colour: "#a16207",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Faith",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einer Kuh oder einem Sack.",
        ...own((c) => c.beside(c.cell, "cow") || c.beside(c.cell, "sack")),
      },
      colour: "#be185d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "Gerald",
      pronoun: "er",
      clue: { text: "Ein Gesetzloser.", ...counting(outlawsFit) },
      colour: "#7c3aed",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "H",
      name: "Honora",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl. Sie war eine Zeile nördlich eines Gesetzlosen.",
        ...all(on("chair"), counting(outlawsFit)),
      },
      colour: "#0f766e",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "I",
      name: "Ingrid",
      pronoun: "sie",
      clue: {
        text: "Keine Gesetzlose. Sie war westlich von Virgilio.",
        ...about(["V"], (c) => c.cell.col < (c.cellOf("V")?.col ?? -1)),
      },
      colour: "#9333ea",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "J",
      name: "Joe",
      pronoun: "er",
      clue: { text: "Er war neben einem Felsen.", ...beside("boulder") },
      colour: "#78716c",
      face: "\u{1F474}",
    },
    {
      id: "K",
      name: "Kenneth",
      pronoun: "er",
      clue: {
        text: "Er war allein im Büro.",
        ...all(
          inArea("O"),
          counting((c) => c.peopleIn("O").length === 1),
        ),
      },
      colour: "#ca8a04",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Virgilio",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Kein Gesetzloser. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F477}",
    },
  ],
  rules: [
    {
      text: "Unter den Verdächtigen sind genau vier Gesetzlose, alle in verschiedenen Bereichen.",
      note: true,
    },
  ],
  prune: stillPossible,
  hints: [
    {
      text: "Kenneth war allein im Büro, Honora sitzt also nicht auf dem Bürostuhl R7 C8, sondern auf dem Stuhl im Haus: R1 C7. Damit steht ein Gesetzloser in Zeile 2. Blakes Lore in R11 C7 liegt in Honoras Spalte - er steht in Spalte 2, in R8 C2 oder R12 C2.",
      place: { H: { row: 0, col: 6 } },
    },
    {
      text: "Neben Dynamit passt als Gesetzloser nur Gerald oder Eugene. Eugene stünde dort in R11 C5 in der Mine - und sein eigener Gesetzloser neben einer Goldader ebenfalls in der Mine: zwei Gesetzlose in einem Bereich. Also steht Gerald neben Dynamit, in Anyas Bereich. Beim Sprengstoff bräuchten die beiden die Spalten 1 und 2, aber Spalte 2 ist Blakes - Gerald steht in R11 C5 in der Goldmine, Anya auch in der Mine.",
      place: { G: { row: 10, col: 4 } },
    },
    {
      text: "Eugene ist in einem Bereich mit Goldadern, sein Gesetzloser steht dort neben einer - nicht in der Mine, dort ist schon Gerald. Im Stollen sind das R9 C5, R9 C8 und R10 C7. Faith passt nur in R9 C5 (neben einem Sack) - Geralds Spalte; Joe passt in R9 C8 und R10 C7 (neben einem Felsen) - R10 C7 ist Honoras Spalte. Joe ist also Gesetzloser in R9 C8, und Eugene steht im Stollen in Zeile 10.",
      place: { J: { row: 8, col: 7 } },
    },
    {
      text: "Kenneth im Büro: R7 C8 und R8 C8 liegen in Joes Spalte - R8 C9. Blake steht damit in R12 C2. Anya in der Mine: Die Zeilen 8 bis 12 sind besetzt, es bleibt R7 C3. Eugene in Zeile 10: R10 C3 ist Anyas, R10 C5 Geralds, R10 C7 Honoras Spalte, R10 C6 ein Felsen, R10 C8 eine Goldader - R10 C4.",
      place: {
        K: { row: 7, col: 8 },
        B: { row: 11, col: 1 },
        A: { row: 6, col: 2 },
        E: { row: 9, col: 3 },
      },
    },
    {
      text: "Frei sind die Zeilen 2 bis 6. Colin ist in der Mine oder am Eingang - dort liegt in diesen Zeilen nur R6 C12. Faith neben einer Kuh oder einem Sack: In den freien Zeilen und Spalten bleiben R2 C11 und R3 C11. Der Gesetzlose in Zeile 2 ist Daryl (R2 C11) oder Faith - Daryl in R2 C11 nähme Faith ihre Spalte. Also sitzt Faith als Gesetzlose in R2 C11.",
      place: { C: { row: 5, col: 11 }, F: { row: 1, col: 10 } },
    },
    {
      text: "Die vier Gesetzlosen sind Daryl, Gerald, Joe und Faith, alle in verschiedenen Bereichen. Daryl ist also nicht auf Faiths Ranch, sondern neben dem Heuballen in der Ebene: R4 C5 ist Geralds, R5 C4 Eugenes Spalte - R5 C6.",
      place: { D: { row: 4, col: 5 } },
    },
    {
      text: "Ingrid und Virgilio bleiben Zeile 3 und 4, Spalte 1 und 10. Ingrid steht westlich, also in Spalte 1: R4 C1 ist Dynamit, sie steht in R3 C1. Virgilio steht in R4 C10 auf der Ranch, allein mit Faith. Faith ist der Mörder!",
      place: { I: { row: 2, col: 0 }, V: { row: 3, col: 9 } },
    },
  ],
  solution: {
    A: { row: 6, col: 2 },
    B: { row: 11, col: 1 },
    C: { row: 5, col: 11 },
    D: { row: 4, col: 5 },
    E: { row: 9, col: 3 },
    F: { row: 1, col: 10 },
    G: { row: 10, col: 4 },
    H: { row: 0, col: 6 },
    I: { row: 2, col: 0 },
    J: { row: 8, col: 7 },
    K: { row: 7, col: 8 },
    V: { row: 3, col: 9 },
  },
};
