/**
 * The deduction grid: its blocks as the book prints them, the marks in it,
 * and what a tap does.
 *
 * @module
 * @remarks
 * **The layout follows the printed page.** Across the top stand the suspects,
 * then the motives (where the case has them), then the places; down the side
 * the weapons, then the places, then the motives. Each row of blocks is one
 * shorter than the one above it, so every pair of categories meets exactly
 * once - the staircase of the book.
 */
import type { Case, Category, HintMark, World } from "./types";

/** What one square holds: nothing, a cross or a tick. */
export type Mark = "x" | "check";

/** The marks of a grid, by {@link cellKey}; an empty square is missing. */
export type Marks = Readonly<Record<string, Mark>>;

/** One block of the grid: the categories of its rows and its columns. */
export type Block = {
  readonly rows: Category;
  readonly cols: Category;
};

/** One row of blocks, side by side. */
export type BlockRow = readonly Block[];

/** One square of the grid: a row item and a column item. */
export type Square = {
  readonly block: Block;
  readonly row: string;
  readonly col: string;
};

/** Every category there is, to look an item up. */
const ALL_CATEGORIES: readonly Category[] = [
  "suspects",
  "weapons",
  "locations",
  "motives",
];

/** The empty grid. */
export const NO_MARKS: Marks = {};

/**
 * The categories across the top of a case's grid, left to right.
 *
 * @param kase - the case
 * @returns them
 */
export function topCategories(kase: Case): readonly Category[] {
  return kase.motives === undefined
    ? ["suspects", "locations"]
    : ["suspects", "motives", "locations"];
}

/**
 * The categories down the side of a case's grid, top to bottom.
 *
 * @param kase - the case
 * @returns them
 */
export function sideCategories(kase: Case): readonly Category[] {
  return kase.motives === undefined
    ? ["weapons", "locations"]
    : ["weapons", "locations", "motives"];
}

/**
 * The blocks of a case's grid, row by row - each row one block shorter.
 *
 * @param kase - the case
 * @returns the rows of blocks
 */
export function blocksOf(kase: Case): readonly BlockRow[] {
  const top = topCategories(kase);
  return sideCategories(kase).map((rows, at) =>
    top.slice(0, top.length - at).map((cols) => ({ rows, cols })),
  );
}

/**
 * The ids of a category's items in a case, in the printed order.
 *
 * @param kase - the case
 * @param category - which items
 * @returns their ids
 */
export function idsOf(kase: Case, category: Category): readonly string[] {
  return itemsOf(kase, category).map((one) => one.id);
}

/**
 * A category's items in a case, with what the grid shows of them.
 *
 * @param kase - the case
 * @param category - which items
 * @returns them, in the printed order
 */
export function itemsOf(
  kase: Case,
  category: Category,
): readonly {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
}[] {
  let items: readonly {
    readonly id: string;
    readonly name: string;
    readonly icon: string;
  }[];
  switch (category) {
    case "suspects":
      items = kase.suspects;
      break;
    case "weapons":
      items = kase.weapons;
      break;
    case "locations":
      items = kase.locations;
      break;
    default:
      items = kase.motives ?? [];
  }
  return items;
}

/**
 * The key of one square.
 *
 * @param row - the row item's id
 * @param col - the column item's id
 * @returns the key
 */
export function cellKey(row: string, col: string): string {
  return `${row}|${col}`;
}

/**
 * The marks after a tap: empty becomes a cross, a cross a tick, a tick empty
 * again. A new tick crosses out the rest of its row and column within its
 * block, if asked to - squares already marked stay as they are.
 *
 * @param kase - the case
 * @param marks - the marks before
 * @param square - the square tapped
 * @param autoCross - whether a tick crosses out its row and column
 * @returns the marks after
 */
export function tapped(
  kase: Case,
  marks: Marks,
  square: Square,
  autoCross: boolean,
): Marks {
  return markSet(
    kase,
    marks,
    square,
    nextMark(marks[cellKey(square.row, square.col)]),
    autoCross,
  );
}

/**
 * What a tap turns a square into: empty to cross, cross to tick, tick to
 * empty.
 *
 * @param before - the mark now, or undefined for an empty square
 * @returns the mark after, or null for empty
 */
export function nextMark(before: Mark | undefined): Mark | null {
  let next: Mark | null;
  switch (before) {
    case undefined:
      next = "x";
      break;
    case "x":
      next = "check";
      break;
    default:
      next = null;
  }
  return next;
}

/**
 * The marks with one square set to what is wanted - stated as the result,
 * not as a toggle, so two players setting the same square at once both get
 * what they meant. A new tick crosses out the free squares of its row and
 * column within its block, if asked to.
 *
 * @param kase - the case
 * @param marks - the marks before
 * @param square - the square
 * @param mark - what it should hold, or null for empty
 * @param autoCross - whether a tick crosses out its row and column
 * @returns the marks after
 */
export function markSet(
  kase: Case,
  marks: Marks,
  square: Square,
  mark: Mark | null,
  autoCross: boolean,
): Marks {
  const key = cellKey(square.row, square.col);
  let next: Marks;
  if (mark === null) {
    next = Object.fromEntries(
      Object.entries(marks).filter(([one]) => one !== key),
    );
  } else {
    next = { ...marks, [key]: mark };
    if (mark === "check" && autoCross) {
      next = crossedAround(kase, next, square);
    }
  }
  return next;
}

/**
 * The square two items meet in, whichever of them heads the row.
 *
 * @param kase - the case
 * @param a - one item's id
 * @param b - the other's
 * @returns the square, or null when they are of the same category or unknown
 */
export function squareOf(kase: Case, a: string, b: string): Square | null {
  const categoryOf = (id: string) =>
    ALL_CATEGORIES.find((category) => idsOf(kase, category).includes(id));
  const ofA = categoryOf(a);
  const ofB = categoryOf(b);
  const block = blocksOf(kase)
    .flat()
    .find(
      (one) =>
        (one.rows === ofA && one.cols === ofB) ||
        (one.rows === ofB && one.cols === ofA),
    );
  return block === undefined
    ? null
    : block.rows === ofA
      ? { block, row: a, col: b }
      : { block, row: b, col: a };
}

/**
 * The marks after a step of help is carried out: each of its squares set,
 * a tick crossing out its row and column if asked to.
 *
 * @param kase - the case
 * @param marks - the marks before
 * @param hintMarks - what the step concludes
 * @param autoCross - whether a tick crosses out its row and column
 * @returns the marks after
 */
export function stepped(
  kase: Case,
  marks: Marks,
  hintMarks: readonly HintMark[],
  autoCross: boolean,
): Marks {
  return hintMarks.reduce((before, one) => {
    const square = squareOf(kase, one.a, one.b);
    return square === null
      ? before
      : markSet(
          kase,
          before,
          square,
          one.value === "check" ? "check" : "x",
          autoCross,
        );
  }, marks);
}

/**
 * The marks of the solved grid: a tick on every true pair, a cross on the
 * rest.
 *
 * @param kase - the case
 * @param world - the solution
 * @returns the full grid
 */
export function solvedMarks(kase: Case, world: World): Marks {
  const facts = factsOf(world);
  const marks: Record<string, Mark> = {};
  for (const block of blocksOf(kase).flat()) {
    for (const row of idsOf(kase, block.rows)) {
      for (const col of idsOf(kase, block.cols)) {
        marks[cellKey(row, col)] = facts.has(cellKey(row, col)) ? "check" : "x";
      }
    }
  }
  return marks;
}

/**
 * The marks with every empty square in the row and column of a tick crossed
 * out, within its block.
 */
function crossedAround(kase: Case, marks: Marks, square: Square): Marks {
  const next: Record<string, Mark> = { ...marks };
  const cross = (row: string, col: string) => {
    const key = cellKey(row, col);
    if (next[key] === undefined) {
      next[key] = "x";
    }
  };
  for (const col of idsOf(kase, square.block.cols)) {
    if (col !== square.col) {
      cross(square.row, col);
    }
  }
  for (const row of idsOf(kase, square.block.rows)) {
    if (row !== square.row) {
      cross(row, square.col);
    }
  }
  return next;
}

/**
 * Every pair that belongs together in a solution, both ways round.
 */
function factsOf(world: World): ReadonlySet<string> {
  const facts = new Set<string>();
  for (const [suspect, own] of Object.entries(world)) {
    const items = [suspect, own.weapon, own.location, own.motive].filter(
      (one): one is string => one !== undefined,
    );
    for (const one of items) {
      for (const other of items) {
        facts.add(cellKey(one, other));
      }
    }
  }
  return facts;
}
