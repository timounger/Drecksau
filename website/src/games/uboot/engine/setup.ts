/**
 * Starting a dive: which course, in which boat, and where it sits.
 *
 * @module
 */
import { buildCourse, type Course } from "./course";
import { DEFAULT_GRADE, heldGrade } from "./grades";
import { LEVELS, LEVEL_COUNT } from "./levels";
import type { GameState } from "./types";
import { STOCK_GEAR, type Gear } from "./upgrades";

/** Nothing has been blown out of a fresh course. */
const NOTHING_GONE: ReadonlySet<number> = new Set<number>();

/** Und angeschlagen ist zu Beginn auch nichts. */
const NO_DENTS: ReadonlyMap<number, number> = new Map<number, number>();

/**
 * The course of one level, laid out.
 *
 * @param level - which one, counted from zero
 * @param grade - auf welcher Schwierigkeit, von null an
 * @returns the course, ready to dive
 * @remarks
 * A level number from somewhere else - stored progress, a button pressed twice
 * - is held inside the courses that exist rather than trusted. Dasselbe gilt
 * für die Schwierigkeit.
 */
export function courseFor(level: number, grade = DEFAULT_GRADE): Course {
  return buildCourse(LEVELS[heldLevel(level)], heldGrade(grade));
}

/**
 * A fresh dive at the start of a course.
 *
 * @param level - which course, counted from zero
 * @param gear - the boat, as the upgrades leave it
 * @param grade - auf welcher Schwierigkeit, von null an
 * @returns the world as it stands before the first frame
 */
export function startDive(
  level: number,
  gear: Gear = STOCK_GEAR,
  grade = DEFAULT_GRADE,
): GameState {
  const chosen = heldLevel(level);
  const hard = heldGrade(grade);
  const course = courseFor(chosen, hard);
  return {
    level: chosen,
    phase: "diving",
    sub: { x: course.start.x, y: course.start.y, vx: 0, vy: 0 },
    // Behind the boat, so the first thing the window does is catch up rather
    // than shove: the game should start by being looked at.
    window: 0,
    shoved: false,
    time: 0,
    hit: null,
    gear,
    air: gear.air,
    hull: gear.hull,
    hurt: 0,
    shots: [],
    blasts: [],
    gone: NOTHING_GONE,
    dents: NO_DENTS,
    // Die Startaufstellung des Gewässers: Jeder Tauchgang trifft dieselben
    // Tiere an denselben Stellen an, und genau deshalb kann man ihn lernen.
    wash: 0,
    spin: 0,
    beasts: course.beasts,
    grade: hard,
    boss: null,
    inks: [],
    loaded: 0,
    laid: 0,
    fired: 0,
  };
}

/**
 * The next course after this one, or null when that was the last.
 *
 * @param level - the course just finished
 * @returns the following course, or null
 */
export function nextLevel(level: number): number | null {
  const next = heldLevel(level) + 1;
  return next < LEVEL_COUNT ? next : null;
}

/** A level number held inside the courses there actually are. */
function heldLevel(level: number): number {
  return Math.max(0, Math.min(LEVEL_COUNT - 1, Math.floor(level)));
}
