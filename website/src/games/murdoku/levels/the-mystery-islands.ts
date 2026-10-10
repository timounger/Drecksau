/**
 * The Mystery Islands: five islands in a shark-filled sea, and a murdered man.
 *
 * @module
 * @remarks
 * After the expert case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Expert/TheMysteryIslands.png`, solution
 * beside it). Vincent is the victim; whoever was alone with him killed him.
 * The sand tiles, the grass of the islands, the path of Town Island and the
 * paving of Empty Island are grounds; only houses and sand are named on the
 * legend as fields to stand on, the plain island ground counts as well.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  onGround,
  own,
  victim,
} from "../engine/clues";
import { contextOf, verdictOf } from "../engine/rules";
import type { Cell, Context, Level, Placement } from "../engine/types";

/** The islands, by area key. */
const ISLANDS: readonly string[] = ["D", "F", "T", "L", "E"];

/** Whether a field is on an island. */
function onIsland(c: Context): boolean {
  return ISLANDS.includes(c.areaOf(c.cell) ?? "");
}

/** Whether somebody stands on the same island as the suspect. */
function sameIsland(c: Context, id: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && c.areaOf(there) === c.areaOf(c.cell);
}

/** The fields of a row in the suspect's own area that people can stand on. */
function rowOf(c: Context, row: number): readonly Cell[] {
  const found: Cell[] = [];
  for (let col = 0; col < c.cols; col += 1) {
    const cell = { row, col };
    if (
      c.inside(cell) &&
      c.standable(cell) &&
      c.areaOf(cell) === c.areaOf(c.cell)
    ) {
      found.push(cell);
    }
  }
  return found;
}

/** How many people of a trait stand in an area. */
function peopleOf(c: Context, area: string, trait: string | null): number {
  return c.peopleIn(area).filter((id) => trait === null || c.has(id, trait))
    .length;
}

/** The rows and columns taken, per placement. */
const takenLines = new WeakMap<
  Placement,
  { rows: ReadonlySet<number>; cols: ReadonlySet<number> }
>();

/** Whether a field's row or column is taken already. */
function blocked(c: Context, cell: Cell): boolean {
  let lines = takenLines.get(c.placement);
  if (lines === undefined) {
    const placed = Object.values(c.placement);
    lines = {
      rows: new Set(placed.map((one) => one.row)),
      cols: new Set(placed.map((one) => one.col)),
    };
    takenLines.set(c.placement, lines);
  }
  return lines.rows.has(cell.row) || lines.cols.has(cell.col);
}

/** The fields people can stand on, per case and area. */
const standableIn = new WeakMap<Level, Map<string, readonly Cell[]>>();

/** The fields of an area people can stand on. */
function groundOf(c: Context, area: string): readonly Cell[] {
  let known = standableIn.get(c.level);
  if (known === undefined) {
    known = new Map();
    standableIn.set(c.level, known);
  }
  let cells = known.get(area);
  if (cells === undefined) {
    cells = c.cellsOf(area).filter((cell) => c.standable(cell));
    known.set(area, cells);
  }
  return cells;
}

/** Each suspect's own fields, per case, suspect and area. */
const ownFieldsIn = new WeakMap<Level, Map<string, readonly Cell[]>>();

/** The fields of an area a suspect's own clue allows on an empty map. */
function fieldsIn(c: Context, id: string, area: string): readonly Cell[] {
  let known = ownFieldsIn.get(c.level);
  if (known === undefined) {
    known = new Map();
    ownFieldsIn.set(c.level, known);
  }
  const key = `${id}:${area}`;
  let cells = known.get(key);
  if (cells === undefined) {
    cells = fieldsOf(c, id).filter((cell) => c.areaOf(cell) === area);
    known.set(key, cells);
  }
  return cells;
}

/**
 * Whether somebody not placed yet could still stand on a field, as far as
 * the people placed allow: a free row and column, no house once Kent stands
 * (the only one in a house), not south of Fred on Town Island.
 */
function stillFree(c: Context, cell: Cell): boolean {
  const fred = c.cellOf("F");
  return (
    !blocked(c, cell) &&
    c.standable(cell) &&
    !(c.cellOf("K") !== undefined && c.is(cell, "house")) &&
    !(fred !== undefined && c.areaOf(cell) === "T" && cell.row > fred.row)
  );
}

/**
 * How many more people of a trait could still come into an area: no more
 * than are not placed yet and have a free field there their own clue
 * allows, and no more than the free rows and free columns that still have a
 * free field there.
 */
function openIn(
  c: Context,
  area: string,
  trait: string | null,
  final = 0,
): number {
  const rows = new Set<number>();
  const cols = new Set<number>();
  for (const cell of groundOf(c, area)) {
    if (stillFree(c, cell)) {
      rows.add(cell.row);
      cols.add(cell.col);
    }
  }
  // The victim was alone with one other: never in an area of two already,
  // nor in one that ends up with more than two.
  const crowded = c.peopleIn(area).length >= 2 || final > 2;
  const waiting = c.level.suspects.filter(
    (one) =>
      c.placement[one.id] === undefined &&
      (trait === null || c.has(one.id, trait)) &&
      !(crowded && one.clue.victim === true) &&
      fieldsIn(c, one.id, area).some((cell) => stillFree(c, cell)),
  ).length;
  return Math.min(waiting, rows.size, cols.size);
}

/** Whether a count can still come out exactly so: not too high, not out of reach. */
function stillExactly(
  c: Context,
  wanted: number,
  area: string,
  trait: string | null,
  options: { final?: number; light?: boolean } = {},
): boolean {
  const now = peopleOf(c, area, trait);
  return (
    now <= wanted &&
    (options.light === true ||
      now + openIn(c, area, trait, options.final) >= wanted)
  );
}

/**
 * Whether the people placed so far still leave somebody's count clue
 * possible - lightly: only whether a count is too high already.
 */
const COUNTS_SO_FAR: Readonly<
  Record<string, (c: Context, at: Cell, light: boolean) => boolean>
> = {
  B: (c) => peopleOf(c, "D", "man") <= 1,
  C: (c, _at, light) => stillExactly(c, 2, "S", null, { light }),
  F: (c, at) =>
    c.peopleIn("T").every((id) => (c.cellOf(id)?.row ?? 0) <= at.row),
  K: (c) =>
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, "house");
    }).length <= 1,
  L: (c, at, light) =>
    stillExactly(c, 3, c.areaOf(at) ?? "", "woman", { final: 4, light }) &&
    stillExactly(c, 1, c.areaOf(at) ?? "", "man", { final: 4, light }),
  // One person per row: exactly two people south of her puts her in the
  // third row from the bottom.
  O: (c, at) => at.row === c.rows - 3,
};

/** The range a count can still end up in. */
type Range = { readonly low: number; readonly high: number };

/**
 * Whether different numbers, one from each range, can add up to a total.
 *
 * @param ranges - what is left to choose
 * @param total - what they must add up to
 * @param used - the numbers chosen already
 */
function distinctSum(
  ranges: readonly Range[],
  total: number,
  used: ReadonlySet<number>,
): boolean {
  const [first, ...rest] = ranges;
  let fits = first === undefined && total === 0;
  const lows = rest.reduce((sum, one) => sum + one.low, 0);
  const highs = rest.reduce((sum, one) => sum + one.high, 0);
  if (first !== undefined) {
    for (let value = first.low; value <= first.high && !fits; value += 1) {
      fits =
        !used.has(value) &&
        total - value >= lows &&
        total - value <= highs &&
        distinctSum(rest, total - value, new Set([...used, value]));
    }
  }
  return fits;
}

/**
 * Whether the islands can still each end up with a number of people of
 * their own: each island's count lies between the people on it now and
 * that plus what could still come (Lyra's island ends with four, the
 * victim's area with two), and as Cassius was in the sea with just one
 * other, the islands hold everybody but two.
 */
function countsCanDiffer(c: Context): boolean {
  const lyra = c.cellOf("L");
  const victimId = c.level.suspects.find((one) => one.clue.victim === true)?.id;
  const victimAt = victimId === undefined ? undefined : c.cellOf(victimId);
  const ranges = ISLANDS.map((key) => {
    const now = peopleOf(c, key, null);
    const fixed =
      lyra !== undefined && c.areaOf(lyra) === key
        ? 4
        : victimAt !== undefined && c.areaOf(victimAt) === key
          ? 2
          : null;
    const high = now + openIn(c, key, null);
    return fixed === null
      ? { low: now, high }
      : { low: Math.max(now, fixed), high: Math.min(high, fixed) };
  });
  return (
    ranges.every((range) => range.low <= range.high) &&
    distinctSum(ranges, c.level.suspects.length - 2, new Set())
  );
}

/** Each suspect's fields their own clue allows on an empty map, per case. */
const ownFields = new WeakMap<Level, ReadonlyMap<string, readonly Cell[]>>();

/** The fields a suspect's own clue allows on an empty map. */
function fieldsOf(c: Context, id: string): readonly Cell[] {
  let known = ownFields.get(c.level);
  if (known === undefined) {
    const found = new Map<string, readonly Cell[]>();
    for (const suspect of c.level.suspects) {
      const cells: Cell[] = [];
      for (let row = 0; row < c.rows; row += 1) {
        for (let col = 0; col < c.cols; col += 1) {
          const cell = { row, col };
          if (
            c.standable(cell) &&
            verdictOf(c.level, suspect, { [suspect.id]: cell }) !== "broken"
          ) {
            cells.push(cell);
          }
        }
      }
      found.set(suspect.id, cells);
    }
    ownFields.set(c.level, found);
    known = found;
  }
  return known.get(id) ?? [];
}

/** Whether the count clues of everybody placed can still come out right. */
function countsFit(c: Context, light: boolean): boolean {
  return Object.entries(COUNTS_SO_FAR).every(([id, test]) => {
    const at = c.cellOf(id);
    return at === undefined || test(c, at, light);
  });
}

/**
 * Whether everybody not placed yet still has a free field their own clue
 * allows, next to the people placed: the clues that name them hold, and no
 * count is too high yet (their own count must still be reachable).
 */
function everyoneHasRoom(c: Context): boolean {
  return c.level.suspects.every(
    (suspect) =>
      c.placement[suspect.id] !== undefined ||
      fieldsOf(c, suspect.id).some((cell) => {
        const tried = { ...c.placement, [suspect.id]: cell };
        const there = contextOf(c.level, tried, suspect.id);
        const ownCount = COUNTS_SO_FAR[suspect.id];
        return (
          !blocked(c, cell) &&
          c.level.suspects.every(
            (other) =>
              (other.id !== suspect.id &&
                !(other.clue.uses ?? []).includes(suspect.id)) ||
              verdictOf(c.level, other, tried) !== "broken",
          ) &&
          countsFit(there, true) &&
          (ownCount === undefined || ownCount(there, cell, false))
        );
      }),
  );
}

/** Whether a field is beside neither a tree nor a cactus. */
function clear(c: Context, cell: Cell): boolean {
  return !c.beside(cell, "tree") && !c.beside(cell, "cactus");
}

/**
 * Whether Denise and Helena can still stand together, both clear of trees
 * and cacti, with Denise northeast of Ayla once Ayla stands - and not in
 * the sea.
 */
function togetherFits(c: Context): boolean {
  const ayla = c.cellOf("A");
  const denise = c.cellOf("D");
  const helena = c.cellOf("H");
  const forDenise =
    denise === undefined
      ? fieldsOf(c, "D").filter(
          (cell) =>
            stillFree(c, cell) &&
            (ayla === undefined ||
              (cell.row < ayla.row && cell.col > ayla.col)),
        )
      : [denise];
  // Cassius was in the sea with just one other: no room for both of them.
  return forDenise.some(
    (cell) =>
      c.areaOf(cell) !== "S" &&
      clear(c, cell) &&
      (helena === undefined
        ? fieldsOf(c, "H").some(
            (other) =>
              other.row !== cell.row &&
              other.col !== cell.col &&
              stillFree(c, other) &&
              c.areaOf(other) === c.areaOf(cell),
          )
        : c.areaOf(helena) === c.areaOf(cell)),
  );
}

/**
 * The solver's look ahead: whether a partial placement can still be
 * finished - the count clues of those placed, the islands' numbers, and a
 * free field for everybody else.
 */
function canFinish(c: Context): boolean {
  return (
    countsFit(c, false) &&
    countsCanDiffer(c) &&
    togetherFits(c) &&
    everyoneHasRoom(c)
  );
}

/** The case. */
export const THE_MYSTERY_ISLANDS: Level = {
  id: "the-mystery-islands",
  name: "Die geheimnisvollen Inseln",
  difficulty: "expert",
  story:
    "Vincent wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "D",
      name: "Wüsteninsel",
      at: "auf der Wüsteninsel",
      ground: "sand",
      island: true,
      tint: "#f3e3b0",
      label: { row: 0, col: 8 },
    },
    {
      key: "F",
      name: "Waldinsel",
      at: "auf der Waldinsel",
      ground: "grass",
      island: true,
      tint: "#9cc5bd",
      label: { row: 6, col: 5 },
    },
    {
      key: "T",
      name: "Stadtinsel",
      at: "auf der Stadtinsel",
      ground: "grass",
      island: true,
      tint: "#c8eab0",
      label: { row: 13, col: 6 },
    },
    {
      key: "L",
      name: "Einsame Insel",
      at: "auf der Einsamen Insel",
      ground: "grass",
      island: true,
      tint: "#b4e3c6",
      label: { row: 15, col: 2 },
    },
    {
      key: "E",
      name: "Leere Insel",
      at: "auf der Leeren Insel",
      ground: "sand",
      island: true,
      tint: "#e5ddc5",
      label: { row: 14, col: 12 },
    },
    {
      key: "S",
      name: "Meer",
      at: "im Meer",
      ground: "water",
      label: { row: 15, col: 9 },
    },
  ],
  areaMap: [
    "SSSSSSSSDDDDDDDD",
    "SSFFFSSSSDDDDDDD",
    "SFFFFFSSSSDDDDDS",
    "SFFFFFFFSSDDDDDS",
    "FFFFFFFFFSSDDDDS",
    "FFFFFFFFFSSDDDSS",
    "FFFFFFFFSSSSDDSS",
    "FFFFFSSSSSSSSSSS",
    "FFFFSSTTTTSSSESS",
    "FFFSSTTTTTTSEEES",
    "FFSSSTTTTTTSEEES",
    "SSSSSTTTTTSSEEES",
    "LLLSSTTTTTSEEEES",
    "LLLLSSTTTSSEEEES",
    "LLLLLSSSSSSSEESS",
    "LLLLLLSSSSSSSSSS",
  ],
  groundMap: [
    "WWWWWWWWSSSSSSSS",
    "WWSSSWWWWSSSSSSS",
    "WSSGGSWWWWSSSSSW",
    "WSGGGGSSWWSSSSSW",
    "SGGGGGGGSWWSSSSW",
    "GGGGGGGGSWWSSSWW",
    "GGGGGSSSWWWWSSWW",
    "GGGGSWWWWWWWWWWW",
    "GGGSWWSSSSWWWSWW",
    "GGSWWSGGGGSWSRSW",
    "SSWWWSPPGGSWSRSW",
    "WWWWWSGPGSWWSRSW",
    "SSSWWSGPGSWSRRSW",
    "GGGSWWSSSWWSRRSW",
    "GGGGSWWWWWWWSSWW",
    "GGGGGSWWWWWWWWWW",
  ],
  grounds: {
    W: "water",
    S: "sand",
    G: "grass",
    P: "path",
    R: "stone",
  },
  thingMap: [
    "...........c....",
    ".......k..c.hc.c",
    "..ht......c.c.c.",
    "..t..t..........",
    ".t..tt.t...c.c..",
    "..tth.t.....c...",
    "tt..........h..k",
    "...t..........k.",
    ".t..............",
    ".t....hth..k....",
    "........t.......",
    "k.....h.h......k",
    "................",
    "b...............",
    ".hb.............",
    "tb........k.....",
  ],
  things: {
    h: "house",
    t: "tree",
    c: "cactus",
    k: "shark",
    b: "shrub",
  },
  suspects: [
    {
      id: "A",
      name: "Ayla",
      pronoun: "sie",
      clue: {
        text: "Sie war auf der Leeren Insel oder der Wüsteninsel. In ihrer Reihe war ein Hai.",
        ...all(
          inArea("E", "D"),
          own((c) => {
            let shark = false;
            for (let col = 0; col < c.cols; col += 1) {
              shark ||= c.is({ row: c.cell.row, col }, "shark");
            }
            return shark;
          }),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bastian",
      pronoun: "er",
      clue: {
        text: "Er war der einzige Mann auf der Wüsteninsel. Er war neben genau zwei Kakteen.",
        ...all(
          inArea("D"),
          own((c) => c.besideCount(c.cell, "cactus") === 2),
          counting(
            (c) =>
              c.peopleIn("D").filter((id) => c.has(id, "man")).length === 1,
          ),
        ),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Cassius",
      pronoun: "er",
      clue: {
        text: "Er war allein mit jemandem im Meer. Er war östlich von Olivia.",
        ...all(
          inArea("S"),
          about(["O"], (c) => (c.cellOf("O")?.col ?? c.cols) < c.cell.col),
          counting((c) => c.peopleIn("S").length === 2),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F474}",
    },
    {
      id: "D",
      name: "Denise",
      pronoun: "sie",
      clue: {
        text: "Sie war nordöstlich von Ayla.",
        ...about(["A"], (c) => {
          const ayla = c.cellOf("A");
          return (
            ayla !== undefined && c.cell.row < ayla.row && c.cell.col > ayla.col
          );
        }),
      },
      colour: "#6366f1",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "E",
      name: "Emma",
      pronoun: "sie",
      clue: { text: "Sie war auf einer Sandfläche.", ...onGround("sand") },
      colour: "#7c3aed",
      face: "\u{1F475}",
    },
    {
      id: "F",
      name: "Fred",
      pronoun: "er",
      clue: {
        text: "Er war die südlichste Person auf der Stadtinsel.",
        ...all(
          inArea("T"),
          counting((c) =>
            c
              .peopleIn("T")
              .every((id) => (c.cellOf(id)?.row ?? 0) <= c.cell.row),
          ),
        ),
      },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Graham",
      pronoun: "er",
      clue: {
        text: "Er war sechs Reihen südlich von Joseph, der auf derselben Insel war.",
        ...all(
          own(onIsland),
          // Somewhere for Joseph, six rows further north on this island.
          own((c) => rowOf(c, c.cell.row - 6).length > 0),
          about(
            ["J"],
            (c) => sameIsland(c, "J") && c.cellOf("J")?.row === c.cell.row - 6,
          ),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Helena",
      pronoun: "sie",
      clue: {
        text: "Sie war mit Denise zusammen. Beide waren nicht neben einem Baum oder Kaktus.",
        ...all(
          not(beside("tree")),
          not(beside("cactus")),
          about(["D"], (c) => {
            const denise = c.cellOf("D");
            return (
              denise !== undefined &&
              c.areaOf(denise) === c.areaOf(c.cell) &&
              !c.beside(denise, "tree") &&
              !c.beside(denise, "cactus")
            );
          }),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "I",
      name: "Irene",
      pronoun: "sie",
      clue: {
        text: "Sie war nördlich von Nikita und auf derselben Insel.",
        ...all(
          own(onIsland),
          about(
            ["N"],
            (c) => sameIsland(c, "N") && (c.cellOf("N")?.row ?? 0) > c.cell.row,
          ),
        ),
      },
      colour: "#0f766e",
      face: "\u{1F469}",
    },
    {
      id: "J",
      name: "Joseph",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Baum und östlich von Lyra.",
        ...all(
          beside("tree"),
          about(["L"], (c) => (c.cellOf("L")?.col ?? c.cols) < c.cell.col),
        ),
      },
      colour: "#a16207",
      face: "\u{1F468}\u{1F3FE}",
    },
    {
      id: "K",
      name: "Kent",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person in einem Haus.",
        ...all(
          on("house"),
          counting(
            (c) =>
              c.people().filter((id) => {
                const there = c.cellOf(id);
                return there !== undefined && c.is(there, "house");
              }).length === 1,
          ),
        ),
      },
      colour: "#be185d",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "L",
      name: "Lyra",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Baum, auf einer Insel mit vier Personen, darunter genau drei Frauen.",
        ...all(
          beside("tree"),
          own(onIsland),
          counting((c) => {
            const here = c.peopleIn(c.areaOf(c.cell) ?? "");
            return (
              here.length === 4 &&
              here.filter((id) => c.has(id, "woman")).length === 3
            );
          }),
        ),
      },
      colour: "#1d4ed8",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "M",
      name: "Michael",
      pronoun: "er",
      clue: {
        text: "In seiner Spalte war mindestens ein Hai. Er war auf einer Insel.",
        ...all(
          own(onIsland),
          own((c) => {
            let shark = false;
            for (let row = 0; row < c.rows; row += 1) {
              shark ||= c.is({ row, col: c.cell.col }, "shark");
            }
            return shark;
          }),
        ),
      },
      colour: "#65a30d",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "N",
      name: "Nikita",
      pronoun: "sie",
      clue: {
        text: "Sie war südlich von Irene und auf derselben Insel.",
        ...all(
          own(onIsland),
          about(
            ["I"],
            (c) =>
              sameIsland(c, "I") && (c.cellOf("I")?.row ?? c.rows) < c.cell.row,
          ),
        ),
      },
      colour: "#c2410c",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "O",
      name: "Olivia",
      pronoun: "sie",
      clue: {
        text: "Genau zwei Personen waren südlich von ihr.",
        ...counting(
          (c) =>
            c.people().filter((id) => (c.cellOf(id)?.row ?? 0) > c.cell.row)
              .length === 2,
        ),
      },
      colour: "#7e22ce",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "V",
      name: "Vincent",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F468}‍\u{1F9B3}",
    },
  ],
  rules: [
    {
      text: "Auf jeder Insel war eine andere Anzahl von Personen (0 ist möglich).",
      prune: canFinish,
      check: (c: Context): boolean => {
        const counts = ISLANDS.map((key) => c.peopleIn(key).length);
        return new Set(counts).size === counts.length;
      },
    },
  ],
  hints: [
    {
      text: "Joseph und Graham sind auf derselben Insel. Nur auf der Waldinsel kann Joseph neben einem Baum stehen und Graham sechs Reihen südlich davon. Lyra steht westlich von Joseph auf einer Insel mit einem Baum, drei Frauen und einem Mann - also nicht auf der Waldinsel. Auf der Einsamen Insel auch nicht, denn dort hätte kein Mann Platz (sie würde Michaels einziges mögliches Feld blockieren). Lyra ist also auf der Stadtinsel. Da Lyra und Joseph beide neben einem Baum stehen und Lyra westlich von Joseph ist, steht Lyra in Spalte 8 - und Joseph steht damit fest.",
      place: { J: { row: 4, col: 8 } },
    },
    {
      text: "Damit steht Graham entweder in Reihe 11, Spalte 1 oder in Reihe 11, Spalte 2.",
    },
    {
      text: "Damit bleibt für Lyra nur noch ein Feld.",
      place: { L: { row: 8, col: 7 } },
    },
    {
      text: "Nach ihrem Hinweis steht Olivia in Reihe 14. Fred ist die südlichste Person auf der Stadtinsel, also ist Olivia nicht dort. Fred steht in Reihe 13. Auf der Stadtinsel sind vier Personen: Streiche auch den Rest der Reihen 10 und 12.",
    },
    {
      text: "Die einzigen Reihen mit einem Hai, in denen Ayla stehen kann, sind Reihe 2 und Reihe 7 auf der Wüsteninsel. Denise ist nordöstlich von Ayla, also sind Denise und Helena ebenfalls auf der Wüsteninsel. Wo Ayla auch steht: Das einzige Feld für Denise, das nicht neben einem Kaktus liegt, ist Reihe 1, Spalte 15.",
      place: { D: { row: 0, col: 14 } },
    },
    {
      text: "Damit bleibt für Helena nur noch das letzte Feld auf der Wüsteninsel, das nicht neben einem Kaktus liegt.",
      place: { H: { row: 6, col: 13 } },
    },
    {
      text: "Bastian ist der einzige Mann auf der Wüsteninsel, und Kent ist die einzige Person in einem Haus - streiche alle Häuser auf der Wüsteninsel. Alle Felder neben genau zwei Kakteen liegen in Spalte 12, also steht Bastian in Spalte 12. Damit bleibt für Ayla nur noch das letzte Feld in Reihe 2 auf der Wüsteninsel.",
      place: { B: { row: 5, col: 11 }, A: { row: 1, col: 9 } },
    },
    {
      text: "Nur Irene und Nikita können die beiden übrigen Frauen auf der Stadtinsel sein (nach Lyras Hinweis), und sie stehen nicht in einem Haus (nach Kents Hinweis). Irene ist nördlich von Nikita. Damit stehen Irene, Nikita und Fred auf den übrigen Feldern der Stadtinsel.",
      place: {
        I: { row: 9, col: 10 },
        N: { row: 11, col: 5 },
        F: { row: 12, col: 6 },
      },
    },
    {
      text: "Auf der Wüsteninsel können nicht vier Personen sein wie auf der Stadtinsel (nach der allgemeinen Regel), also müssen es fünf sein. Emma ist die einzige mögliche fünfte Person - damit bleibt ihr nur das letzte mögliche Feld, Reihe 4, Spalte 13.",
      place: { E: { row: 3, col: 12 } },
    },
    {
      text: "Michael kann nur in Spalte 1 stehen - damit steht auch Graham fest.",
      place: { G: { row: 10, col: 1 } },
    },
    {
      text: "Joseph, Graham und Kent sind auf der Waldinsel. Dort können nicht vier oder fünf Personen sein (nach der allgemeinen Regel). Damit bleibt für Michael nur ein Feld auf der Einsamen Insel.",
      place: { M: { row: 14, col: 0 } },
    },
    {
      text: "Cassius muss im Meer östlich von Olivia stehen, und er ist dort allein mit jemandem. Das einzige andere übrige Feld im Meer ist Reihe 14, Spalte 5 - dort steht Olivia. Damit stehen nacheinander Olivia, Kent und Cassius fest.",
      place: {
        O: { row: 13, col: 4 },
        K: { row: 2, col: 2 },
        C: { row: 7, col: 15 },
      },
    },
    {
      text: "Für Vincent bleibt das letzte Feld. Er ist allein mit Michael auf der Einsamen Insel. Michael ist der Mörder!",
      place: { V: { row: 15, col: 3 } },
    },
  ],
  solution: {
    A: { row: 1, col: 9 },
    B: { row: 5, col: 11 },
    C: { row: 7, col: 15 },
    D: { row: 0, col: 14 },
    E: { row: 3, col: 12 },
    F: { row: 12, col: 6 },
    G: { row: 10, col: 1 },
    H: { row: 6, col: 13 },
    I: { row: 9, col: 10 },
    J: { row: 4, col: 8 },
    K: { row: 2, col: 2 },
    L: { row: 8, col: 7 },
    M: { row: 14, col: 0 },
    N: { row: 11, col: 5 },
    O: { row: 13, col: 4 },
    V: { row: 15, col: 3 },
  },
};
