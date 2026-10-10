/**
 * The player's notes on a case: who they think might have stood where, who
 * they are sure of, and which fields they crossed out.
 *
 * @module
 * @remarks
 * Nothing here knows the answer. It is the pencil, not the referee - in two
 * strengths. **A pencil mark** ({@link noted}) is a small letter in a field:
 * "she could have been here", as many as one likes, for as many people as one
 * likes. **A pawn** ({@link placed}) is certainty: it wipes that person's marks
 * everywhere else and crosses out its whole row and column, which is what the
 * printed puzzle tells you to do by hand once a person is found.
 */
import type { Cell, Placement } from "./types";

/** What the player has written on the map. */
export type Board = {
  /** The people placed for certain. */
  readonly placement: Placement;
  /** The pencil marks: per field, as a key from {@link cellKey}, the ids noted in it. */
  readonly notes: Readonly<Record<string, readonly string[]>>;
  /** The crossed-out fields, as keys from {@link cellKey}. */
  readonly crosses: readonly string[];
};

/** A clean map. */
export const EMPTY_BOARD: Board = { placement: {}, notes: {}, crosses: [] };

/**
 * A field as a short key, for sets and storage.
 *
 * @param cell - the field
 * @returns e.g. "3:5"
 */
export function cellKey(cell: Cell): string {
  return `${String(cell.row)}:${String(cell.col)}`;
}

/**
 * Who stands on a field.
 *
 * @param board - the notes
 * @param cell - the field
 * @returns the person's id, or null
 */
export function standingOn(board: Board, cell: Cell): string | null {
  const found = Object.entries(board.placement).find(
    ([, there]) => there.row === cell.row && there.col === cell.col,
  );
  return found === undefined ? null : found[0];
}

/**
 * Pencils a person into a field, or rubs the mark out again.
 *
 * @param board - the notes
 * @param id - who
 * @param cell - where they might have been
 * @returns the notes with the mark toggled; a field with a pawn on it is left alone
 */
export function noted(board: Board, id: string, cell: Cell): Board {
  const key = cellKey(cell);
  const marks = board.notes[key] ?? [];
  let next = board;
  if (standingOn(board, cell) === null) {
    next = {
      ...board,
      notes: withMarks(
        board.notes,
        key,
        marks.includes(id) ? marks.filter((one) => one !== id) : [...marks, id],
      ),
      crosses: board.crosses.filter((one) => one !== key),
    };
  }
  return next;
}

/**
 * Puts a person down for certain.
 *
 * @param board - the notes
 * @param id - who
 * @param cell - where
 * @param size - how many fields a side of the map has
 * @param canStand - whether somebody could stand on a field - only those get a cross
 * @returns the notes with their pawn there: off wherever it stood before,
 *   whoever stood there taken off, their pencil marks gone everywhere, and
 *   every other field of the row and the column crossed out and cleared of marks
 */
export function placed(
  board: Board,
  id: string,
  cell: Cell,
  size: number,
  canStand: (cell: Cell) => boolean = () => true,
): Board {
  const there = standingOn(board, cell);
  const placement: Placement = {
    ...Object.fromEntries(
      Object.entries(board.placement).filter(
        ([one]) => one !== id && one !== there,
      ),
    ),
    [id]: cell,
  };
  const line: string[] = [];
  for (let at = 0; at < size; at += 1) {
    for (const one of [
      { row: cell.row, col: at },
      { row: at, col: cell.col },
    ]) {
      if (canStand(one)) {
        line.push(cellKey(one));
      }
    }
  }
  const own = cellKey(cell);
  const occupied = new Set(Object.values(placement).map(cellKey));
  const notes: Record<string, readonly string[]> = {};
  for (const [key, marks] of Object.entries(board.notes)) {
    const kept = marks.filter((one) => one !== id);
    if (!line.includes(key) && kept.length > 0) {
      notes[key] = kept;
    }
  }
  const crosses = new Set(board.crosses.filter((key) => key !== own));
  for (const key of line) {
    if (key !== own && !occupied.has(key)) {
      crosses.add(key);
    }
  }
  return { placement, notes, crosses: [...crosses] };
}

/**
 * Takes a person's pawn off the map - and the crosses it made.
 *
 * @param board - the notes
 * @param id - who
 * @returns the notes without their pawn and without the crosses in its row
 *   and column; a cross that also lies in the row or column of somebody still
 *   placed stays, because that person still rules the field out
 */
export function removed(board: Board, id: string): Board {
  const gone = board.placement[id];
  const placement: Placement = Object.fromEntries(
    Object.entries(board.placement).filter(([one]) => one !== id),
  );
  const others = Object.values(placement);
  const crosses =
    gone === undefined
      ? board.crosses
      : board.crosses.filter((key) => {
          const [row = 0, col = 0] = key.split(":").map(Number);
          const inLine = row === gone.row || col === gone.col;
          const stillRuled = others.some(
            (there) => there.row === row || there.col === col,
          );
          return !inLine || stillRuled;
        });
  return { ...board, placement, crosses };
}

/**
 * Crosses a field out, or wipes the cross off again.
 *
 * @param board - the notes
 * @param cell - the field
 * @returns the notes with the cross toggled; a field with somebody on it is left alone
 */
export function crossed(board: Board, cell: Cell): Board {
  const key = cellKey(cell);
  let next = board;
  if (standingOn(board, cell) === null) {
    next = {
      ...board,
      crosses: board.crosses.includes(key)
        ? board.crosses.filter((one) => one !== key)
        : [...board.crosses, key],
    };
  }
  return next;
}

/**
 * Wipes a field clean of the pencil: its marks and its cross.
 *
 * @param board - the notes
 * @param cell - the field
 * @returns the notes without anything written in that field; a pawn on it stays
 */
export function wiped(board: Board, cell: Cell): Board {
  const key = cellKey(cell);
  return {
    ...board,
    notes: withMarks(board.notes, key, []),
    crosses: board.crosses.filter((one) => one !== key),
  };
}

/** The pencil marks with one field's marks replaced - and dropped when empty. */
function withMarks(
  notes: Readonly<Record<string, readonly string[]>>,
  key: string,
  marks: readonly string[],
): Readonly<Record<string, readonly string[]>> {
  const rest = Object.fromEntries(
    Object.entries(notes).filter(([one]) => one !== key),
  );
  return marks.length === 0 ? rest : { ...rest, [key]: marks };
}
