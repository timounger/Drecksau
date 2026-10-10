/**
 * The rules of Murdoku: where somebody may stand, what a clue means, who was
 * alone with the victim - and the solver that proves a case has one answer.
 *
 * @module
 * @remarks
 * Three rules and the clues. **One person per row and per column.** People
 * stand only on free fields, in a house or on a boat - never on a tree, a
 * rock or an animal. **"Beside" means the field to the left, right, above or
 * below, and in the same area**: a house across the water is not beside
 * anybody on the shore. And the culprit is whoever was alone with the victim
 * in the victim's area.
 */
import { THING_KEYS } from "./levels";
import type {
  Area,
  Cell,
  Clue,
  Level,
  Placement,
  Suspect,
  Thing,
} from "./types";

/** What a clue says about a placement so far. */
export type Verdict = "holds" | "broken" | "open";

/** The things somebody may stand on. */
const STANDABLE: ReadonlySet<Thing> = new Set<Thing>(["house", "boat"]);

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
 * The area a field belongs to.
 *
 * @param level - the case
 * @param cell - the field
 * @returns its area
 */
export function areaAt(level: Level, cell: Cell): Area {
  const key = level.areaMap[cell.row]?.[cell.col] ?? "";
  const area = level.areas.find((one) => one.key === key);
  if (area === undefined) {
    throw new Error(`No area "${key}" in case ${level.id}`);
  }
  return area;
}

/**
 * What stands on a field.
 *
 * @param level - the case
 * @param cell - the field
 * @returns the thing, or null for a free field
 */
export function thingAt(level: Level, cell: Cell): Thing | null {
  const key = level.thingMap[cell.row]?.[cell.col] ?? ".";
  return THING_KEYS[key] ?? null;
}

/**
 * Whether somebody may stand on a field.
 *
 * @param level - the case
 * @param cell - the field
 * @returns true on a free field, in a house or on a boat
 */
export function isStandable(level: Level, cell: Cell): boolean {
  const thing = thingAt(level, cell);
  return thing === null || STANDABLE.has(thing);
}

/**
 * The kinds of thing beside a field - next to it and in the same area.
 *
 * @param level - the case
 * @param cell - the field
 * @returns every kind found on the up to four fields around it
 */
export function thingsBeside(level: Level, cell: Cell): ReadonlySet<Thing> {
  const home = areaAt(level, cell).key;
  const found = new Set<Thing>();
  for (const step of STEPS) {
    const next = { row: cell.row + step.row, col: cell.col + step.col };
    if (inside(level, next) && areaAt(level, next).key === home) {
      const thing = thingAt(level, next);
      if (thing !== null) {
        found.add(thing);
      }
    }
  }
  return found;
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
  return cell === undefined
    ? "open"
    : judge(level, suspect.clue, cell, suspect.id, placement);
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
 * Whether the case is solved: everybody placed, nobody clashing, every clue met.
 *
 * @param level - the case
 * @param placement - where people stand
 * @returns true when this is the solution
 */
export function isSolved(level: Level, placement: Placement): boolean {
  return (
    level.suspects.every((one) => placement[one.id] !== undefined) &&
    clashesOf(level, placement).size === 0 &&
    level.suspects.every((one) => verdictOf(level, one, placement) === "holds")
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
  const victim = level.suspects.find((one) => one.clue.kind === "victim");
  const cell = victim === undefined ? undefined : placement[victim.id];
  const company =
    victim === undefined || cell === undefined
      ? []
      : sharing(level, cell, victim.id, placement);
  return company.length === 1 ? (company[0] ?? null) : null;
}

/**
 * Every solution of a case, up to two.
 *
 * @param level - the case
 * @returns the solutions found - exactly one for a fair case
 * @remarks
 * Backtracking, one suspect at a time, onto every free row and column whose
 * field the suspect's own clue does not already rule out. Nine people on a
 * board of nine is done in well under a second.
 */
export function solve(level: Level): readonly Placement[] {
  const found: Placement[] = [];
  const cells: Cell[] = [];
  for (let row = 0; row < level.size; row += 1) {
    for (let col = 0; col < level.size; col += 1) {
      if (isStandable(level, { row, col })) {
        cells.push({ row, col });
      }
    }
  }

  const place = (at: number, placement: Placement) => {
    const suspect = level.suspects[at];
    if (suspect === undefined) {
      if (isSolved(level, placement)) {
        found.push(placement);
      }
    } else {
      const taken = Object.values(placement);
      for (const cell of cells) {
        const free = !taken.some(
          (there) => there.row === cell.row || there.col === cell.col,
        );
        if (free && found.length < ENOUGH) {
          const next = { ...placement, [suspect.id]: cell };
          const fits = level.suspects
            .slice(0, at + 1)
            .every((one) => verdictOf(level, one, next) !== "broken");
          if (fits) {
            place(at + 1, next);
          }
        }
      }
    }
  };
  place(0, {});
  return found;
}

/** The solution of every case worked out so far, by case. */
const solutions = new Map<string, Placement | null>();

/**
 * The one solution of a case.
 *
 * @param level - the case
 * @returns where everybody stood, or null if the case has none or several
 */
export function solutionOf(level: Level): Placement | null {
  let known = solutions.get(level.id);
  if (known === undefined) {
    const all = solve(level);
    known = all.length === 1 ? (all[0] ?? null) : null;
    solutions.set(level.id, known);
  }
  return known;
}

/**
 * The fields a clue points at - what lights up while its suspect is chosen.
 *
 * @param level - the case
 * @param suspect - whose clue
 * @param placement - where people stand, for a clue about somebody else
 * @returns every house for "in a house", every shrub for "beside a shrub" -
 *   the things themselves, even where one can only stand next to them - the
 *   whole area, row or column for those, and nothing for a clue about numbers
 *   of people
 */
export function cluePoints(
  level: Level,
  suspect: Suspect,
  placement: Placement,
): readonly Cell[] {
  const clue = suspect.clue;
  const all: Cell[] = [];
  for (let row = 0; row < level.size; row += 1) {
    for (let col = 0; col < level.size; col += 1) {
      all.push({ row, col });
    }
  }
  let points: readonly Cell[];
  switch (clue.kind) {
    case "on":
    case "beside":
      points = all.filter((cell) => thingAt(level, cell) === clue.thing);
      break;
    case "in":
      points = all.filter((cell) => areaAt(level, cell).key === clue.area);
      break;
    case "column":
      points = all.filter((cell) => cell.col === clue.col);
      break;
    case "row":
      points = all.filter((cell) => cell.row === clue.row);
      break;
    case "besideSame": {
      // What the other one stands beside - once they stand somewhere.
      const there = placement[clue.other];
      const kinds =
        there === undefined ? new Set<Thing>() : thingsBeside(level, there);
      points = all.filter((cell) => {
        const thing = thingAt(level, cell);
        return thing !== null && kinds.has(thing);
      });
      break;
    }
    default:
      points = [];
  }
  return points;
}

/** Whether a field lies on the map. */
function inside(level: Level, cell: Cell): boolean {
  return (
    cell.row >= 0 &&
    cell.col >= 0 &&
    cell.row < level.size &&
    cell.col < level.size
  );
}

/** Everybody else standing in the same area as this field. */
function sharing(
  level: Level,
  cell: Cell,
  self: string,
  placement: Placement,
): readonly string[] {
  const home = areaAt(level, cell).key;
  return Object.entries(placement)
    .filter(([id, there]) => id !== self && areaAt(level, there).key === home)
    .map(([id]) => id);
}

/** What one clue says about a suspect standing on this field. */
function judge(
  level: Level,
  clue: Clue,
  cell: Cell,
  self: string,
  placement: Placement,
): Verdict {
  const all = level.suspects.every((one) => placement[one.id] !== undefined);
  let verdict: Verdict;
  switch (clue.kind) {
    case "on":
      verdict = said(thingAt(level, cell) === clue.thing);
      break;
    case "in":
      verdict = said(areaAt(level, cell).key === clue.area);
      break;
    case "beside":
      verdict = said(thingsBeside(level, cell).has(clue.thing));
      break;
    case "column":
      verdict = said(cell.col === clue.col);
      break;
    case "row":
      verdict = said(cell.row === clue.row);
      break;
    case "besideSame": {
      const there = placement[clue.other];
      const mine = thingsBeside(level, cell);
      verdict =
        there === undefined
          ? said(mine.size > 0, "open")
          : said([...thingsBeside(level, there)].some((one) => mine.has(one)));
      break;
    }
    case "crowd": {
      const company = sharing(level, cell, self, placement).length;
      const island = areaAt(level, cell).island;
      verdict =
        !island || company > clue.others
          ? "broken"
          : all
            ? said(company === clue.others)
            : "open";
      break;
    }
    default: {
      const company = sharing(level, cell, self, placement).length;
      verdict = company > 1 ? "broken" : all ? said(company === 1) : "open";
    }
  }
  return verdict;
}

/** A yes or no as a verdict - with what a yes means, when it is not final. */
function said(yes: boolean, ifYes: Verdict = "holds"): Verdict {
  return yes ? ifYes : "broken";
}
