/**
 * The Golf Course: eight holes, sand pits and ponds, and a murdered golfer.
 *
 * @module
 * @remarks
 * After the expert case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Expert/TheGolfCourse.png`, solution beside it).
 * Each hole is an area, keyed by its number. Its ponds cannot be stood on,
 * and each hole holds an even or odd number of people, as its number is.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data:
   rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  besideGround,
  counting,
  inArea,
  on,
  onGround,
  own,
  row,
  victim,
} from "../engine/clues";
import { isSolved, isStandable, sizeOf, verdictOf } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** Which hole each field belongs to. */
const AREAS: readonly string[] = [
  "2222222233333333",
  "2222222233333333",
  "2222222777333333",
  "2222227777333444",
  "2227777778884444",
  "2277777788884444",
  "1177777888884444",
  "1177778888884444",
  "1117778888844444",
  "1111778888844444",
  "1111778888844444",
  "1111777885555444",
  "1111666665555444",
  "1116666665555555",
  "1116666665555555",
  "1116666665555555",
];

/** What each field is underfoot: grass, sand or a pond. */
const GROUNDS: readonly string[] = [
  "sssggggggggggwww",
  "ssgggsgggggggggw",
  "sggggsssggwwgggg",
  "sggssssgggwwwggg",
  "gggssssggggggggg",
  "gggggggggggggggg",
  "gggggsssgggggggg",
  "ggggssssgggggggg",
  "gggggssggggggggg",
  "ggggggggggggsggg",
  "ggggggwwgggsssgg",
  "gggggwwwwgssssgg",
  "ggggggwwgggssggg",
  "gggggggggggggggg",
  "ggggggggwwwggggg",
  "ggggggwwwwwwgggg",
];

/** What stands on each field: trees, tees, flags and carts. */
const THINGS: readonly string[] = [
  "...t...tte..t...",
  "......fttt....t.",
  ".t.......t....f.",
  "........f.......",
  ".e......tt....e.",
  ".tt....tt..e.c..",
  ".ttt.......t..t.",
  "f.t.....c.tt.ttt",
  "..tt......tt..tt",
  "t..t......t.....",
  "t...e...f.......",
  "c..c.....f....ft",
  "...tft..........",
  ".e.t..t.e.......",
  "..tt.........c.e",
  "ttt..t..........",
];

/** The holes with an even number. */
const EVEN_HOLES: readonly string[] = ["2", "4", "6", "8"];

/** The holes with an odd number. */
const ODD_HOLES: readonly string[] = ["1", "3", "5", "7"];

/** The width of the map, for numbering its fields row by row. */
const WIDTH = 16;

/** The hole of each field, numbered row by row. */
const HOLE_AT: readonly number[] = AREAS.flatMap((line) =>
  line.split("").map(Number),
);

/** What stands on each field, numbered row by row. */
const THING_AT: readonly string[] = THINGS.flatMap((line) => line.split(""));

/** The fields with a cart, numbered row by row. */
const CARTS: readonly number[] = THING_AT.flatMap((thing, spot) =>
  thing === "c" ? [spot] : [],
);

/**
 * The look ahead's view of a case: the suspects in order, their fields
 * when alone, and who is a woman or a man.
 */
type Search = {
  readonly level: Level;
  readonly ids: readonly string[];
  readonly at: Readonly<Record<string, number>>;
  readonly women: readonly boolean[];
  readonly men: readonly boolean[];
  readonly fields: readonly (readonly number[])[];
};

/** A placement in the look ahead's terms: each suspect's field, or -1. */
type Spots = readonly number[];

/** The look ahead's view, per case. */
const SEARCHES = new WeakMap<Level, Search>();

/** Placements found to be dead ends, as keys. */
const DEAD_ENDS = new Set<string>();

/** Complete placements found that meet everything. */
const FINISHED: Spots[] = [];

/**
 * Whether a partial placement can still be finished - for the solver only.
 * A small search of its own, over the suspects' fields and the case's
 * clues and rule as plain numbers, always going on with the suspect who has
 * the fewest fields left. Dead ends and finished placements are kept.
 */
function stillFinishable(c: Context): boolean {
  const search = searchOf(c.level);
  return finishable(
    search,
    search.ids.map((id) => {
      const cell = c.placement[id];
      return cell === undefined ? -1 : cell.row * WIDTH + cell.col;
    }),
  );
}

/** The look ahead's view of a case, made once. */
function searchOf(level: Level): Search {
  const known = SEARCHES.get(level);
  const { rows, cols } = sizeOf(level);
  const made: Search = known ?? {
    level,
    ids: level.suspects.map((one) => one.id),
    at: Object.fromEntries(level.suspects.map((one, at) => [one.id, at])),
    women: level.suspects.map((one) => one.pronoun === "sie"),
    men: level.suspects.map((one) => one.pronoun === "er"),
    fields: level.suspects.map((one) =>
      Array.from({ length: rows * cols }, (_, spot) => spot).filter((spot) => {
        const cell = { row: Math.floor(spot / WIDTH), col: spot % WIDTH };
        return (
          isStandable(level, cell) &&
          verdictOf(level, one, { [one.id]: cell }) !== "broken"
        );
      }),
    ),
  };
  SEARCHES.set(level, made);
  return made;
}

/** Whether a placement can be finished, remembering the answer. */
function finishable(search: Search, spots: Spots): boolean {
  const key = spots.join(",");
  const answer =
    FINISHED.some((done) =>
      spots.every((spot, at) => spot < 0 || spot === done[at]),
    ) ||
    (!DEAD_ENDS.has(key) && searchOn(search, spots));
  if (!answer) {
    DEAD_ENDS.add(key);
  }
  return answer;
}

/** The search behind {@link finishable}. */
function searchOn(search: Search, spots: Spots): boolean {
  const waiting = spots.flatMap((spot, at) => (spot < 0 ? [at] : []));
  const options = waiting.map((at) => ({
    at,
    spots: search.fields[at].filter(
      (spot) => isFree(spots, spot) && fits(search, withSpot(spots, at, spot)),
    ),
  }));
  const next = options.reduce<(typeof options)[number] | undefined>(
    (best, one) =>
      best === undefined || one.spots.length < best.spots.length ? one : best,
    undefined,
  );
  const open =
    fits(search, spots) &&
    options.every((one) => one.spots.length > 0) &&
    fitsApart(
      options.map((one) => one.spots.map((spot) => Math.floor(spot / WIDTH))),
    ) &&
    fitsApart(options.map((one) => one.spots.map((spot) => spot % WIDTH))) &&
    countsCanWork(spots, options);
  const done = open && next === undefined && solvedBy(search, spots);
  if (done) {
    FINISHED.push([...spots]);
  }
  return (
    done ||
    (open &&
      next !== undefined &&
      next.spots.some((spot) =>
        finishable(search, withSpot(spots, next.at, spot)),
      ))
  );
}

/**
 * Whether everybody can get a line of their own - each list holds the rows
 * (or columns) one person could take. A matching, grown one person at a time.
 */
function fitsApart(choices: readonly (readonly number[])[]): boolean {
  const owner = new Map<number, number>();
  const grow = (who: number, seen: Set<number>): boolean =>
    choices[who].some((line) => {
      const fresh = !seen.has(line);
      seen.add(line);
      const holder = owner.get(line);
      const free = fresh && (holder === undefined || grow(holder, seen));
      if (free) {
        owner.set(line, who);
      }
      return free;
    });
  return choices.every((_, who) => grow(who, new Set()));
}

/** Whether a field shares no row and no column with anybody placed. */
function isFree(spots: Spots, spot: number): boolean {
  return spots.every(
    (there) =>
      there < 0 ||
      (Math.floor(there / WIDTH) !== Math.floor(spot / WIDTH) &&
        there % WIDTH !== spot % WIDTH),
  );
}

/** A placement with one more suspect on a field. */
function withSpot(spots: Spots, at: number, spot: number): Spots {
  return spots.map((was, who) => (who === at ? spot : was));
}

/** Whether a complete placement meets everything, by the engine's own test. */
function solvedBy(search: Search, spots: Spots): boolean {
  return isSolved(
    search.level,
    Object.fromEntries(
      spots.map((spot, at) => [
        search.ids[at],
        { row: Math.floor(spot / WIDTH), col: spot % WIDTH },
      ]),
    ),
  );
}

/**
 * Whether the hole counts can still come out even or odd, as the holes'
 * numbers are: a hole that is one short needs somebody left who could go
 * there, and the people left must fit what the holes can take.
 */
function countsCanWork(
  spots: Spots,
  options: readonly { readonly spots: readonly number[] }[],
): boolean {
  const bounds = [...EVEN_HOLES, ...ODD_HOLES].map(Number).map((hole) => {
    const now = spots.filter(
      (spot) => spot >= 0 && HOLE_AT[spot] === hole,
    ).length;
    const short = now % 2 === hole % 2 ? 0 : 1;
    const there = options.map((one) =>
      one.spots.filter((spot) => HOLE_AT[spot] === hole),
    );
    const all = there.flat();
    const could = Math.min(
      there.filter((one) => one.length > 0).length,
      new Set(all.map((spot) => Math.floor(spot / WIDTH))).size,
      new Set(all.map((spot) => spot % WIDTH)).size,
    );
    return { least: short, most: could - ((could - short) % 2) };
  });
  return (
    bounds.every((one) => one.most >= one.least) &&
    bounds.reduce((sum, one) => sum + one.least, 0) <= options.length &&
    bounds.reduce((sum, one) => sum + one.most, 0) >= options.length &&
    paritiesReachable(spots, options)
  );
}

/**
 * Whether the people left can go to holes so that every hole ends up even
 * or odd as its number is - rows and columns aside. Each hole's oddness is
 * one bit; each person left flips the bit of the hole they go to.
 */
function paritiesReachable(
  spots: Spots,
  options: readonly { readonly spots: readonly number[] }[],
): boolean {
  const bit = (hole: number) => 1 << (hole - 1);
  const target = spots.reduce(
    (flags, spot) => (spot < 0 ? flags : flags ^ bit(HOLE_AT[spot])),
    ODD_HOLES.map(Number).reduce((flags, hole) => flags | bit(hole), 0),
  );
  const reachable = options.reduce(
    (states, one) => {
      const holes = [...new Set(one.spots.map((spot) => HOLE_AT[spot]))];
      return new Set(
        [...states].flatMap((state) => holes.map((hole) => state ^ bit(hole))),
      );
    },
    new Set([0]),
  );
  return reachable.has(target);
}

/**
 * Whether the clues that name other people still hold among those placed:
 * the hole numbers of Berta, Lars and Flor, Iris north-west of Flor, Kent
 * with Mona, Gerald the only man on a tee, Vinny with at most one other,
 * and a cart in Harry's hole that holds a woman or still could.
 */
function fits(search: Search, spots: Spots): boolean {
  const spot = (id: string) => spots[search.at[id]];
  const hole = (id: string) => HOLE_AT[spot(id)];
  const both = (one: string, other: string) =>
    spot(one) >= 0 && spot(other) >= 0;
  const row = (id: string) => Math.floor(spot(id) / WIDTH);
  const col = (id: string) => spot(id) % WIDTH;
  const vinnyCompany = () =>
    spots.filter(
      (there, at) =>
        there >= 0 && search.ids[at] !== "V" && HOLE_AT[there] === hole("V"),
    ).length;
  return (
    (!both("B", "H") || hole("B") > hole("H")) &&
    (!both("L", "N") || hole("L") > hole("N")) &&
    (!both("F", "N") || hole("F") !== hole("N") - 1) &&
    (!both("I", "F") ||
      (row("I") < row("F") &&
        col("I") < col("F") &&
        hole("I") === hole("F"))) &&
    (!both("K", "M") || hole("K") === hole("M")) &&
    (spot("G") < 0 ||
      spots.every(
        (there, at) =>
          there < 0 ||
          search.ids[at] === "G" ||
          !search.men[at] ||
          THING_AT[there] !== "e",
      )) &&
    (spot("V") < 0 || vinnyCompany() <= 1) &&
    (spot("H") < 0 || cartStillWorks(search, spots, hole("H")))
  );
}

/** Whether a cart of a hole holds a woman, or is free for a woman left. */
function cartStillWorks(search: Search, spots: Spots, hole: number): boolean {
  return CARTS.some((cart) => {
    const holder = spots.indexOf(cart);
    return (
      HOLE_AT[cart] === hole &&
      ((holder >= 0 && search.women[holder]) ||
        (holder < 0 &&
          isFree(spots, cart) &&
          spots.some(
            (there, at) =>
              there < 0 && search.women[at] && search.fields[at].includes(cart),
          )))
    );
  });
}

/** Whether no man but the suspect stands on a tee. */
function noOtherManOnTee(c: Context): boolean {
  return c.people().every((one) => {
    const cell = c.cellOf(one);
    return (
      one === c.self ||
      !c.has(one, "man") ||
      cell === undefined ||
      !c.is(cell, "tee")
    );
  });
}

/** The number of the hole a field belongs to. */
function holeOf(c: Context, cell: Cell | undefined): number {
  return cell === undefined ? 0 : Number(c.areaOf(cell) ?? "0");
}

/** Every field of a row, counted from 0. */
function wholeRow(index: number): readonly Cell[] {
  return AREAS[index].split("").map((_, col) => ({ row: index, col }));
}

/** The case. */
export const THE_GOLF_COURSE: Level = {
  id: "the-golf-course",
  name: "Der Golfplatz",
  difficulty: "expert",
  story:
    "Vinny wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer auf einer Bahn.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "1",
      name: "Bahn 1",
      at: "auf Bahn 1",
      ground: "grass",
      tint: "#b9e4b0",
      label: { row: 12, col: 1 },
    },
    {
      key: "2",
      name: "Bahn 2",
      at: "auf Bahn 2",
      ground: "grass",
      tint: "#8fcf96",
      label: { row: 4, col: 0 },
    },
    {
      key: "3",
      name: "Bahn 3",
      at: "auf Bahn 3",
      ground: "grass",
      tint: "#a8dca4",
      label: { row: 0, col: 10 },
    },
    {
      key: "4",
      name: "Bahn 4",
      at: "auf Bahn 4",
      ground: "grass",
      tint: "#b6e2b4",
      label: { row: 4, col: 15 },
    },
    {
      key: "5",
      name: "Bahn 5",
      at: "auf Bahn 5",
      ground: "grass",
      tint: "#a4d9a6",
      label: { row: 14, col: 14 },
    },
    {
      key: "6",
      name: "Bahn 6",
      at: "auf Bahn 6",
      ground: "grass",
      tint: "#94d19c",
      label: { row: 13, col: 7 },
    },
    {
      key: "7",
      name: "Bahn 7",
      at: "auf Bahn 7",
      ground: "grass",
      tint: "#a0d8a0",
      label: { row: 9, col: 4 },
    },
    {
      key: "8",
      name: "Bahn 8",
      at: "auf Bahn 8",
      ground: "grass",
      tint: "#86c690",
      label: { row: 5, col: 10 },
    },
  ],
  areaMap: AREAS,
  groundMap: GROUNDS,
  grounds: { g: "grass", s: "sand", w: "pond" },
  thingMap: THINGS,
  things: { t: "tree", e: "tee", f: "flag", c: "cart" },
  extraThings: {
    tee: { name: "Abschlag", emoji: "\u{1F7E2}", standable: true },
    flag: { name: "Fahne", emoji: "\u{1F6A9}", standable: true },
    cart: { name: "Golfwagen", emoji: "\u{1F6FA}", standable: true },
  },
  suspects: [
    {
      id: "A",
      name: "Anna",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Wasserfeld.",
        ...besideGround("pond"),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Berta",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Baum auf Bahn 4. Ihre Bahnnummer war höher als die von Harry.",
        ...all(
          inArea("4"),
          beside("tree"),
          about(["H"], (c) => holeOf(c, c.cell) > holeOf(c, c.cellOf("H"))),
        ),
      },
      colour: "#15803d",
      face: "\u{1F475}",
    },
    {
      id: "C",
      name: "Carson",
      pronoun: "er",
      clue: {
        text: "Er war nicht in der ersten oder der letzten Spalte.",
        ...own((c) => c.cell.col !== 0 && c.cell.col !== c.cols - 1),
      },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Drew",
      pronoun: "er",
      clue: { text: "Er war neben einer Fahne.", ...beside("flag") },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Edna",
      pronoun: "sie",
      clue: {
        text: "Sie stand auf der Fahne einer Bahn mit gerader Nummer.",
        ...all(
          on("flag"),
          own((c) => EVEN_HOLES.includes(c.areaOf(c.cell) ?? "")),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Flor",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht auf der Bahn direkt vor Naomis Bahn.",
        ...about(
          ["N"],
          (c) => holeOf(c, c.cell) !== holeOf(c, c.cellOf("N")) - 1,
        ),
      },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Gerald",
      pronoun: "er",
      clue: {
        text: "Er war der einzige Mann auf einem Abschlag.",
        ...all(
          on("tee"),
          // Checked as people come, and once more when all stand.
          own(noOtherManOnTee),
          counting(noOtherManOnTee),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F474}",
    },
    {
      id: "H",
      name: "Harry",
      pronoun: "er",
      clue: {
        text: "Auf seiner Bahn war eine Frau in einem Golfwagen.",
        ...all(
          // A hole without a cart can never have a woman in one.
          own((c) =>
            c
              .cellsOf(c.areaOf(c.cell) ?? "")
              .some((cell) => c.is(cell, "cart")),
          ),
          counting((c) =>
            c.peopleIn(c.areaOf(c.cell) ?? "").some((one) => {
              const cell = c.cellOf(one);
              return (
                c.has(one, "woman") && cell !== undefined && c.is(cell, "cart")
              );
            }),
          ),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "I",
      name: "Iris",
      pronoun: "sie",
      clue: {
        text: "Sie war nordwestlich von Flor, und auf derselben Bahn.",
        ...about(["F"], (c) => {
          const flor = c.cellOf("F");
          return (
            flor !== undefined &&
            c.cell.row < flor.row &&
            c.cell.col < flor.col &&
            c.areaOf(c.cell) === c.areaOf(flor)
          );
        }),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "J",
      name: "Jana",
      pronoun: "sie",
      clue: {
        text: "Sie stand auf dem Abschlag von Bahn 6, 7 oder 8.",
        ...all(on("tee"), inArea("6", "7", "8")),
      },
      colour: "#a16207",
      face: "\u{1F469}",
    },
    {
      id: "K",
      name: "Kent",
      pronoun: "er",
      clue: {
        text: "Er war auf derselben Bahn wie Mona.",
        ...about(["M"], (c) => {
          const mona = c.cellOf("M");
          return mona !== undefined && c.areaOf(c.cell) === c.areaOf(mona);
        }),
      },
      colour: "#334155",
      face: "\u{1F468}",
    },
    {
      id: "L",
      name: "Lars",
      pronoun: "er",
      clue: {
        text: "Seine Bahnnummer war höher als die von Naomi.",
        ...about(["N"], (c) => holeOf(c, c.cell) > holeOf(c, c.cellOf("N"))),
      },
      colour: "#7e22ce",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "M",
      name: "Mona",
      pronoun: "sie",
      clue: {
        text: "Sie stand auf der Fahne von Bahn 3, 4 oder 5.",
        ...all(on("flag"), inArea("3", "4", "5")),
      },
      colour: "#65a30d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "N",
      name: "Naomi",
      pronoun: "sie",
      clue: { text: "Sie war in einem Sandbunker.", ...onGround("sand") },
      colour: "#0f766e",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "O",
      name: "Oscar",
      pronoun: "er",
      clue: {
        text: "Er war in der nördlichsten Reihe und neben einem Baum.",
        ...all(row(1), beside("tree")),
      },
      colour: "#1d4ed8",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Vinny",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F471}‍♂️",
    },
  ],
  rules: [
    {
      text: "Bahnen mit gerader Nummer hatten eine gerade Anzahl Personen (auch keine), Bahnen mit ungerader Nummer eine ungerade.",
      // Search only: give up on placements that cannot be finished.
      prune: stillFinishable,
      check: (c) =>
        EVEN_HOLES.every((hole) => c.peopleIn(hole).length % 2 === 0) &&
        ODD_HOLES.every((hole) => c.peopleIn(hole).length % 2 === 1),
    },
  ],
  hints: [
    {
      text: "Nach Bertas Hinweis kann Harry nur auf Bahn 1 sein, zusammen mit einer noch unbekannten Frau in einem Golfwagen - entweder in Reihe 12, Spalte 1 oder in Reihe 12, Spalte 4. Streiche den Rest von Reihe 12.",
      cross: wholeRow(11).filter((cell) => cell.col !== 0 && cell.col !== 3),
    },
    {
      text: "Damit bleibt für Mona nur die Fahne von Bahn 3. Kent muss mit Mona auf Bahn 3 sein, in Reihe 2.",
      place: { M: { row: 2, col: 14 } },
    },
    {
      text: "Bahn 3 hat eine ungerade Nummer, also braucht sie drei Personen. Oscar ist in Reihe 1 und kann nach Geralds Hinweis nicht auf einem Abschlag stehen - damit bleibt ihm nur Reihe 1, Spalte 12.",
      place: { O: { row: 0, col: 11 } },
    },
    {
      text: "Jana steht entweder in Reihe 11, Spalte 5 oder in Reihe 14, Spalte 9 - streiche die Felder, die beide gemeinsam blockieren. Damit bleibt für Edna nur die Fahne von Bahn 6, und danach für Jana nur ein Abschlag.",
      place: { E: { row: 12, col: 4 }, J: { row: 13, col: 8 } },
    },
    {
      text: "Bahn 4 braucht zwei Personen (gerade Nummer), Bahn 5 eine (ungerade Nummer). Kent kann nicht in den Spalten 13 bis 16 sein - damit steht er in Reihe 2, Spalte 11.",
      place: { K: { row: 1, col: 10 } },
    },
    {
      text: "Weil jemand auf Bahn 5 in Reihe 15 oder 16 steht, kann Bahn 6 keine vier Personen haben. Sie braucht zwei (gerade Nummer): Edna und Jana. Streiche den Rest von Bahn 6. Wer in Reihe 16 steht, muss die Person auf Bahn 5 sein - streiche den Rest von Bahn 5. Wer in Reihe 15 steht, ist auf Bahn 1.",
    },
    {
      text: "Damit bleibt für Gerald nur der letzte Abschlag, und danach muss jemand in Reihe 15, Spalte 1 stehen.",
      place: { G: { row: 4, col: 1 } },
    },
    {
      text: "Die Frau im Golfwagen muss Flor sein, mit Iris in Spalte 3. Harry steht in Reihe 15, Spalte 1.",
      place: { F: { row: 11, col: 3 }, H: { row: 14, col: 0 } },
    },
    {
      text: "Weil Bahn 2 eine gerade Nummer hat, braucht Gerald dort Gesellschaft. Diese Person muss in Reihe 4, Spalte 6 stehen.",
    },
    {
      text: "Damit bleibt für Drew nur das letzte Feld neben einer Fahne, und danach für Iris.",
      place: { D: { row: 10, col: 9 }, I: { row: 9, col: 2 } },
    },
    {
      text: "Damit bleibt für Anna nur das letzte Feld neben Wasser.",
      place: { A: { row: 15, col: 12 } },
    },
    {
      text: "Naomi kann nicht auf Bahn 2 sein (Flors Hinweis) und nicht auf Bahn 8 (Lars' Hinweis). Damit bleibt ihr nur das letzte Sandfeld auf Bahn 7.",
      place: { N: { row: 6, col: 6 } },
    },
    {
      text: "Damit bleibt für Berta nur ein Feld, und danach für Lars eines auf Bahn 8.",
      place: { B: { row: 8, col: 13 }, L: { row: 7, col: 7 } },
    },
    {
      text: "Carson kann nicht in Spalte 16 sein, also muss er mit Gerald auf Bahn 2 sein.",
      place: { C: { row: 3, col: 5 } },
    },
    {
      text: "Für Vinny bleibt das letzte Feld, allein mit Berta auf Bahn 4. Berta ist die Mörderin!",
      place: { V: { row: 5, col: 15 } },
    },
  ],
  solution: {
    A: { row: 15, col: 12 },
    B: { row: 8, col: 13 },
    C: { row: 3, col: 5 },
    D: { row: 10, col: 9 },
    E: { row: 12, col: 4 },
    F: { row: 11, col: 3 },
    G: { row: 4, col: 1 },
    H: { row: 14, col: 0 },
    I: { row: 9, col: 2 },
    J: { row: 13, col: 8 },
    K: { row: 1, col: 10 },
    L: { row: 7, col: 7 },
    M: { row: 2, col: 14 },
    N: { row: 6, col: 6 },
    O: { row: 0, col: 11 },
    V: { row: 5, col: 15 },
  },
};
