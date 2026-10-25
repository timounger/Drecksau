/**
 * All puzzles of the collection, the parts of the book and the ways to find
 * one puzzle and the ones beside it.
 *
 * @module
 */
import { CUNNING } from "@/games/sherlock/puzzles/cunning";
import { ELEMENTARY } from "@/games/sherlock/puzzles/elementary";
import { FIENDISH } from "@/games/sherlock/puzzles/fiendish";
import { STRAIGHTFORWARD } from "@/games/sherlock/puzzles/straightforward";
import type { Part, Puzzle } from "@/games/sherlock/engine/types";

/** The parts of the book, easiest first - the order of the chips and the stats. */
export const PART_ORDER: readonly Part[] = [
  "elementary",
  "straightforward",
  "cunning",
  "fiendish",
];

/** Every puzzle, by its running number. */
export const PUZZLES: readonly Puzzle[] = [
  ...ELEMENTARY,
  ...STRAIGHTFORWARD,
  ...CUNNING,
  ...FIENDISH,
].toSorted((left, right) => left.number - right.number);

/**
 * One puzzle by its id.
 *
 * @param id - the puzzle's id
 * @returns the puzzle, or null when there is none of that id
 */
export function byId(id: string): Puzzle | null {
  return PUZZLES.find((one) => one.id === id) ?? null;
}

/**
 * The puzzles before and after one, in number order.
 *
 * @param puzzle - the puzzle
 * @returns the one before and the one after, undefined at either end
 */
export function neighbours(
  puzzle: Puzzle,
): readonly [Puzzle | undefined, Puzzle | undefined] {
  const at = PUZZLES.findIndex((one) => one.id === puzzle.id);
  return [PUZZLES[at - 1], PUZZLES[at + 1]];
}
