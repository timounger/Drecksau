/**
 * The rules of Murdoku: where somebody may stand, what a clue says about a
 * placement, who was alone with the victim - and the solver that proves a
 * case has one answer.
 *
 * @module
 * @remarks
 * Three rules hold for every case. **At most one person per row and per
 * column.** People stand only on the map and only where they can - on free
 * ground, in water, on a chair, never on a tree or an animal. **"Beside"
 * means the field to the left, right, above or below, and in the same
 * area.** The culprit is whoever was alone with the victim in the victim's
 * area. Everything else is the case's own clues and rules (see ./types).
 */
import { GROUNDS, THINGS } from "./catalog";
import type {
  Area,
  Cell,
  Context,
  GroundDef,
  Level,
  Placement,
  Suspect,
  ThingDef,
} from "./types";

/** What a clue says about a placement so far. */
export type Verdict = "holds" | "broken" | "open";

/** The four neighbours of a field. */
const STEPS: readonly Cell[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/** How many solutions the solver looks for - two is enough to know there is more than one. */
const ENOUGH = 2;

/**
 * How many rows and columns a case's map has.
 *
 * @param level - the case
 * @returns its rows and columns
 */
export function sizeOf(level: Level): { rows: number; cols: number } {
  return {
    rows: level.areaMap.length,
    cols: Math.max(...level.areaMap.map((line) => line.length)),
  };
}

/**
 * Whether a field is part of the map.
 *
 * @param level - the case
 * @param cell - the field
 * @returns false off the edges and on fields marked `.`
 */
export function isInside(level: Level, cell: Cell): boolean {
  const key = level.areaMap[cell.row]?.[cell.col];
  return key !== undefined && key !== ".";
}

/**
 * The area a field belongs to.
 *
 * @param level - the case
 * @param cell - the field
 * @returns its area, or null off the map
 */
export function areaAt(level: Level, cell: Cell): Area | null {
  const key = level.areaMap[cell.row]?.[cell.col] ?? ".";
  return level.areas.find((one) => one.key === key) ?? null;
}

/**
 * What stands on a field.
 *
 * @param level - the case
 * @param cell - the field
 * @returns the thing's id, or null for nothing
 */
export function thingAt(level: Level, cell: Cell): string | null {
  const key = level.thingMap[cell.row]?.[cell.col] ?? ".";
  return key === "." ? null : (level.things[key] ?? null);
}

/**
 * What a thing is.
 *
 * @param level - the case, for the things it brings itself
 * @param id - the thing's id
 * @returns its definition
 */
export function thingDef(level: Level, id: string): ThingDef {
  const def = level.extraThings?.[id] ?? THINGS[id];
  if (def === undefined) {
    throw new Error(`Unknown thing "${id}" in case ${level.id}`);
  }
  return def;
}

/**
 * A field's ground.
 *
 * @param level - the case
 * @param cell - the field
 * @returns the ground's id - from the ground map, or the area's own
 */
export function groundAt(level: Level, cell: Cell): string {
  const key = level.groundMap?.[cell.row]?.[cell.col];
  const mapped = key === undefined ? undefined : level.grounds?.[key];
  return mapped ?? areaAt(level, cell)?.ground ?? "floor";
}

/**
 * What a ground is.
 *
 * @param id - the ground's id
 * @returns its definition
 */
export function groundDef(id: string): GroundDef {
  return GROUNDS[id] ?? (GROUNDS.floor as GroundDef);
}

/**
 * Whether somebody may stand on a field.
 *
 * @param level - the case
 * @param cell - the field
 * @returns true on the map, where nothing stands or what stands can be stood on
 */
export function isStandable(level: Level, cell: Cell): boolean {
  const thing = thingAt(level, cell);
  return (
    isInside(level, cell) &&
    groundDef(groundAt(level, cell)).standable !== false &&
    (thing === null || thingDef(level, thing).standable)
  );
}

/**
 * The context a clue is checked against.
 *
 * @param level - the case
 * @param placement - where people stand
 * @param self - whose clue
 * @returns the helpers the clue's code uses
 */
export function contextOf(
  level: Level,
  placement: Placement,
  self: string,
): Context {
  const { rows, cols } = sizeOf(level);
  const inside = (cell: Cell) => isInside(level, cell);
  const areaOf = (cell: Cell) => areaAt(level, cell)?.key ?? null;
  const is = (cell: Cell, what: string) => {
    const thing = thingAt(level, cell);
    return (
      thing !== null &&
      (thing === what || (thingDef(level, thing).kinds ?? []).includes(what))
    );
  };
  const neighbours = (cell: Cell) =>
    STEPS.map((step) => ({
      row: cell.row + step.row,
      col: cell.col + step.col,
    })).filter((next) => inside(next) && areaOf(next) === areaOf(cell));
  const besideCount = (cell: Cell, what: string) =>
    neighbours(cell).filter((next) => is(next, what)).length;
  const personAt = (cell: Cell) =>
    Object.entries(placement).find(
      ([, there]) => there.row === cell.row && there.col === cell.col,
    )?.[0] ?? null;
  return {
    level,
    placement,
    self,
    cell: placement[self] ?? { row: -1, col: -1 },
    rows,
    cols,
    inside,
    areaOf,
    thingAt: (cell) => thingAt(level, cell),
    is,
    groundAt: (cell) => groundAt(level, cell),
    standable: (cell) => isStandable(level, cell),
    neighbours,
    besideCount,
    beside: (cell, what) => besideCount(cell, what) > 0,
    besideGround: (cell, ground) =>
      neighbours(cell).some((next) => groundAt(level, next) === ground),
    cellOf: (id) => placement[id],
    personAt,
    peopleIn: (area) =>
      Object.entries(placement)
        .filter(([, there]) => areaOf(there) === area)
        .map(([id]) => id),
    people: () => Object.keys(placement),
    has: (id, trait) => {
      const suspect = level.suspects.find((one) => one.id === id);
      return (
        suspect !== undefined &&
        ((trait === "woman" && suspect.pronoun === "sie") ||
          (trait === "man" && suspect.pronoun === "er") ||
          (suspect.traits ?? []).includes(trait))
      );
    },
    cellsOf: (area) => {
      const found: Cell[] = [];
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (areaOf({ row, col }) === area) {
            found.push({ row, col });
          }
        }
      }
      return found;
    },
  };
}

/**
 * What a suspect's clue says about where everybody stands so far.
 *
 * @param level - the case
 * @param suspect - whose clue
 * @param placement - where people stand, as far as placed
 * @returns "holds" when it is met, "broken" when it cannot be any more, and
 *   "open" when that depends on people not yet placed
 */
export function verdictOf(
  level: Level,
  suspect: Suspect,
  placement: Placement,
): Verdict {
  const cell = placement[suspect.id];
  const clue = suspect.clue;
  const all = level.suspects.every((one) => placement[one.id] !== undefined);
  let verdict: Verdict = "open";
  if (cell !== undefined) {
    const context = contextOf(level, placement, suspect.id);
    const unaryOk = clue.unary === undefined || clue.unary(context);
    const rulesOk = (level.rules ?? []).every(
      (rule) => rule.unary === undefined || rule.unary(suspect, context),
    );
    const company = context
      .peopleIn(context.areaOf(cell) ?? "")
      .filter((id) => id !== suspect.id).length;
    const ready = clue.global
      ? all
      : (clue.uses ?? []).every((id) => placement[id] !== undefined);
    if (!unaryOk || !rulesOk || (clue.victim === true && company > 1)) {
      verdict = "broken";
    } else if (clue.victim === true && !all) {
      verdict = "open";
    } else if (clue.victim === true) {
      verdict = company === 1 ? "holds" : "broken";
    } else if (clue.check === undefined) {
      verdict = "holds";
    } else if (ready) {
      verdict = clue.check(context) ? "holds" : "broken";
    }
  }
  return verdict;
}

/**
 * Who stands where they may not: in a row or column with somebody else, or on
 * a field nobody can stand on.
 *
 * @param level - the case
 * @param placement - where people stand
 * @returns the ids of everybody in such a spot
 */
export function clashesOf(
  level: Level,
  placement: Placement,
): ReadonlySet<string> {
  const placed = Object.entries(placement);
  const clashing = new Set<string>();
  for (const [id, cell] of placed) {
    const crowded = placed.some(
      ([other, there]) =>
        other !== id && (there.row === cell.row || there.col === cell.col),
    );
    if (crowded || !isStandable(level, cell)) {
      clashing.add(id);
    }
  }
  return clashing;
}

/**
 * Whether a placement meets everything: everybody placed, nobody clashing,
 * every clue and every rule of the case met.
 *
 * @param level - the case
 * @param placement - where people stand
 * @returns true when this is a solution
 */
export function isSolved(level: Level, placement: Placement): boolean {
  const context = contextOf(level, placement, level.suspects[0]?.id ?? "");
  return (
    level.suspects.every((one) => placement[one.id] !== undefined) &&
    clashesOf(level, placement).size === 0 &&
    level.suspects.every(
      (one) => verdictOf(level, one, placement) === "holds",
    ) &&
    (level.rules ?? []).every(
      (rule) => rule.check === undefined || rule.check(context),
    )
  );
}

/**
 * Who was alone with the victim.
 *
 * @param level - the case
 * @param placement - where people stand
 * @returns the culprit's id, or null when the victim is not alone with exactly one
 */
export function culpritOf(level: Level, placement: Placement): string | null {
  const victim = level.suspects.find((one) => one.clue.victim === true);
  const cell = victim === undefined ? undefined : placement[victim.id];
  const area = cell === undefined ? null : (areaAt(level, cell)?.key ?? null);
  const company =
    victim === undefined || area === null
      ? []
      : Object.entries(placement)
          .filter(
            ([id, there]) =>
              id !== victim.id && areaAt(level, there)?.key === area,
          )
          .map(([id]) => id);
  return company.length === 1 ? (company[0] ?? null) : null;
}

/**
 * The solution of a case, as its solution sheet has it.
 *
 * @param level - the case
 * @returns where everybody stood
 */
export function solutionOf(level: Level): Placement {
  return level.solution;
}

/**
 * Who stands where the solution has them.
 *
 * @param level - the case
 * @param placement - where people stand
 * @returns per suspect whether they stand on their field
 */
export function checked(
  level: Level,
  placement: Placement,
): Readonly<Record<string, boolean>> {
  return Object.fromEntries(
    level.suspects.map((one) => {
      const here = placement[one.id];
      const there = level.solution[one.id];
      return [
        one.id,
        here !== undefined &&
          there !== undefined &&
          here.row === there.row &&
          here.col === there.col,
      ];
    }),
  );
}

/**
 * The fields a clue points at - what lights up while its suspect is chosen.
 *
 * @param level - the case
 * @param suspect - whose clue
 * @returns the fields its clue names
 */
export function cluePoints(level: Level, suspect: Suspect): readonly Cell[] {
  return suspect.clue.glow?.(level) ?? [];
}

/**
 * Every solution of a case, up to two.
 *
 * @param level - the case
 * @returns the solutions found - exactly one for a fair case
 * @remarks
 * First, each suspect's own clue and the case's rules rule out what fields
 * they could be on at all. Then backtracking, always going on with the
 * suspect who has the fewest fields left in free rows and columns, and
 * checking every clue as soon as the people it names stand. Used to prove a
 * case fair when it is entered; the game itself checks against the solution
 * sheet.
 */
export function solve(level: Level): readonly Placement[] {
  const { rows, cols } = sizeOf(level);
  const domains = new Map<string, readonly Cell[]>();
  for (const suspect of level.suspects) {
    const cells: Cell[] = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const cell = { row, col };
        if (
          isStandable(level, cell) &&
          verdictOf(level, suspect, { [suspect.id]: cell }) !== "broken"
        ) {
          cells.push(cell);
        }
      }
    }
    domains.set(suspect.id, cells);
  }

  const found: Placement[] = [];
  const place = (placement: Placement) => {
    const taken = Object.values(placement);
    const free = (cell: Cell) =>
      !taken.some((there) => there.row === cell.row || there.col === cell.col);
    const left = level.suspects
      .filter((one) => placement[one.id] === undefined)
      .map((one) => ({
        suspect: one,
        cells: (domains.get(one.id) ?? []).filter(free),
      }));
    if (left.length === 0) {
      if (isSolved(level, placement)) {
        found.push(placement);
      }
    } else {
      const next = left.reduce((best, one) =>
        one.cells.length < best.cells.length ? one : best,
      );
      for (const cell of next.cells) {
        if (found.length < ENOUGH) {
          const tried = { ...placement, [next.suspect.id]: cell };
          const fits =
            level.suspects.every(
              (one) => verdictOf(level, one, tried) !== "broken",
            ) &&
            (level.rules ?? []).every(
              (rule) =>
                rule.prune === undefined ||
                rule.prune(contextOf(level, tried, next.suspect.id)),
            );
          if (fits) {
            place(tried);
          }
        }
      }
    }
  };
  place({});
  return found;
}
