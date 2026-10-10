/**
 * What the player's actions do to the notes on a case - the part both the
 * game at one screen and the game online share.
 *
 * @module
 * @remarks
 * ./board is the pencil and knows nothing of the case. These know it: where
 * somebody can stand, how big the map is, what a step of the way concludes.
 */
import {
  cellKey,
  crossed,
  noted,
  placed,
  standingOn,
  type Board,
} from "./board";
import { isStandable, sizeOf } from "./rules";
import type { Cell, Hint, Level } from "./types";

/** The longer side of a case's map - every row and column lies within it. */
function sideOf(level: Level): number {
  const { rows, cols } = sizeOf(level);
  return Math.max(rows, cols);
}

/**
 * Puts a person down for certain, crossing out their row and column.
 *
 * @param level - the case
 * @param board - the notes
 * @param id - who
 * @param cell - where
 * @returns the notes with them there - or unchanged where nobody can stand
 */
export function settled(
  level: Level,
  board: Board,
  id: string,
  cell: Cell,
): Board {
  return isStandable(level, cell)
    ? placed(board, id, cell, sideOf(level), (one) => isStandable(level, one))
    : board;
}

/**
 * Carries out a step of the way to the solution.
 *
 * @param level - the case
 * @param board - the notes
 * @param step - the step
 * @returns the notes with whoever it names put down and the fields it rules
 *   out crossed - all in one go
 */
export function stepped(level: Level, board: Board, step: Hint): Board {
  let next = board;
  for (const [id, cell] of Object.entries(step.place ?? {})) {
    next = settled(level, next, id, cell);
  }
  const crosses = new Set(next.crosses);
  for (const cell of step.cross ?? []) {
    if (isStandable(level, cell) && standingOn(next, cell) === null) {
      crosses.add(cellKey(cell));
    }
  }
  return { ...next, crosses: [...crosses] };
}

/**
 * Sets a person's pencil mark in a field to a wanted state.
 *
 * @param level - the case
 * @param board - the notes
 * @param id - who
 * @param cell - where
 * @param on - whether the mark should be there afterwards
 * @returns the notes with the mark as wanted
 * @remarks
 * A state rather than a toggle: online, two players tapping the same field at
 * once would otherwise switch it on and straight off again.
 */
export function markSet(
  level: Level,
  board: Board,
  id: string,
  cell: Cell,
  on: boolean,
): Board {
  const has = (board.notes[cellKey(cell)] ?? []).includes(id);
  return has === on || !isStandable(level, cell)
    ? board
    : noted(board, id, cell);
}

/**
 * Sets the cross in a field to a wanted state.
 *
 * @param level - the case
 * @param board - the notes
 * @param cell - the field
 * @param on - whether the cross should be there afterwards
 * @returns the notes with the cross as wanted
 */
export function crossSet(
  level: Level,
  board: Board,
  cell: Cell,
  on: boolean,
): Board {
  const has = board.crosses.includes(cellKey(cell));
  return has === on || !isStandable(level, cell) ? board : crossed(board, cell);
}
