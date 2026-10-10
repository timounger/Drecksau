/**
 * Ready-made pieces for clues: the common ones, built once.
 *
 * @module
 * @remarks
 * A case writes its clue as its German sentence plus one of these - or a
 * few of them joined with {@link all} - and only reaches for its own code
 * where a clue is unusual. Each piece knows what lights up for it, and puts
 * whatever only depends on the suspect's own field into `unary`, where the
 * solver can use it early.
 *
 * Rows and columns are counted from 1 here, as they are printed.
 */
import { areaAt, groundAt, isInside, sizeOf, thingAt, thingDef } from "./rules";
import type { Cell, Clue, Context, Level } from "./types";

/** A clue without its sentence - what the pieces build. */
export type ClueParts = Omit<Clue, "text">;

/**
 * Standing on a thing of this id or kind - a car, a chair, any "seat".
 *
 * @param what - the thing's id, or a kind
 * @returns the clue's parts
 */
export function on(what: string): ClueParts {
  return {
    unary: (c) => c.is(c.cell, what),
    glow: (level) => cellsWhere(level, (cell) => isThing(level, cell, what)),
  };
}

/**
 * Standing on this ground - in water, on a carpet.
 *
 * @param ground - the ground's id
 * @returns the clue's parts
 */
export function onGround(ground: string): ClueParts {
  return {
    unary: (c) => c.groundAt(c.cell) === ground,
    glow: (level) =>
      cellsWhere(level, (cell) => groundAt(level, cell) === ground),
  };
}

/**
 * Next to a thing of this id or kind, in the same area.
 *
 * @param what - the thing's id, or a kind
 * @returns the clue's parts
 */
export function beside(what: string): ClueParts {
  return {
    unary: (c) => c.beside(c.cell, what),
    glow: (level) => cellsWhere(level, (cell) => isThing(level, cell, what)),
  };
}

/**
 * Next to this ground, in the same area.
 *
 * @param ground - the ground's id
 * @returns the clue's parts
 */
export function besideGround(ground: string): ClueParts {
  return {
    unary: (c) => c.besideGround(c.cell, ground),
  };
}

/**
 * In one of these areas.
 *
 * @param keys - the areas' keys
 * @returns the clue's parts
 */
export function inArea(...keys: readonly string[]): ClueParts {
  return {
    unary: (c) => keys.includes(c.areaOf(c.cell) ?? ""),
    glow: (level) =>
      cellsWhere(level, (cell) =>
        keys.includes(areaAt(level, cell)?.key ?? ""),
      ),
  };
}

/**
 * In this column, counted from 1.
 *
 * @param number - the column, as printed
 * @returns the clue's parts
 */
export function column(number: number): ClueParts {
  return {
    unary: (c) => c.cell.col === number - 1,
    glow: (level) => cellsWhere(level, (cell) => cell.col === number - 1),
  };
}

/**
 * In this row, counted from 1.
 *
 * @param number - the row, as printed
 * @returns the clue's parts
 */
export function row(number: number): ClueParts {
  return {
    unary: (c) => c.cell.row === number - 1,
    glow: (level) => cellsWhere(level, (cell) => cell.row === number - 1),
  };
}

/**
 * Alone in one's area.
 *
 * @returns the clue's parts
 */
export function alone(): ClueParts {
  return {
    global: true,
    check: (c) => c.peopleIn(c.areaOf(c.cell) ?? "").length === 1,
  };
}

/**
 * The victim: alone with exactly one other - the culprit.
 *
 * @returns the clue's parts
 */
export function victim(): ClueParts {
  return { victim: true };
}

/**
 * A check that needs other people placed.
 *
 * @param uses - whose places it needs
 * @param check - the check
 * @returns the clue's parts
 */
export function about(
  uses: readonly string[],
  check: (c: Context) => boolean,
): ClueParts {
  return { uses, check };
}

/**
 * A check that needs everybody placed - for counts of people.
 *
 * @param check - the check
 * @returns the clue's parts
 */
export function counting(check: (c: Context) => boolean): ClueParts {
  return { global: true, check };
}

/**
 * A check of the suspect's own field alone.
 *
 * @param unary - the check
 * @returns the clue's parts
 */
export function own(unary: (c: Context) => boolean): ClueParts {
  return { unary };
}

/**
 * Several pieces at once: all of them must hold.
 *
 * @param parts - the pieces
 * @returns the joined clue's parts
 */
export function all(...parts: readonly ClueParts[]): ClueParts {
  const unaries = parts.flatMap((one) =>
    one.unary === undefined ? [] : [one.unary],
  );
  const checks = parts.flatMap((one) =>
    one.check === undefined ? [] : [one.check],
  );
  const glows = parts.flatMap((one) =>
    one.glow === undefined ? [] : [one.glow],
  );
  return {
    victim: parts.some((one) => one.victim === true) || undefined,
    unary:
      unaries.length === 0 ? undefined : (c) => unaries.every((one) => one(c)),
    check:
      checks.length === 0 ? undefined : (c) => checks.every((one) => one(c)),
    uses: [...new Set(parts.flatMap((one) => one.uses ?? []))],
    global: parts.some((one) => one.global === true) || undefined,
    glow:
      glows.length === 0
        ? undefined
        : (level) => glows.flatMap((one) => one(level)),
  };
}

/**
 * The opposite of a piece about the suspect's own field.
 *
 * @param part - a piece with only a field check
 * @returns the piece turned round
 */
export function not(part: ClueParts): ClueParts {
  const unary = part.unary;
  if (unary === undefined || part.check !== undefined) {
    throw new Error("not() only turns round a check of one's own field");
  }
  return { unary: (c) => !unary(c) };
}

/**
 * Every field of a case's map that passes a test.
 *
 * @param level - the case
 * @param test - the test
 * @returns the fields
 */
export function cellsWhere(
  level: Level,
  test: (cell: Cell) => boolean,
): readonly Cell[] {
  const { rows, cols } = sizeOf(level);
  const found: Cell[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = { row: r, col: c };
      if (isInside(level, cell) && test(cell)) {
        found.push(cell);
      }
    }
  }
  return found;
}

/** Whether a field holds a thing of this id or kind. */
function isThing(level: Level, cell: Cell, what: string): boolean {
  const thing = thingAt(level, cell);
  return (
    thing !== null &&
    (thing === what || (thingDef(level, thing).kinds ?? []).includes(what))
  );
}
