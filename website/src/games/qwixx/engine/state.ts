/**
 * The game state of Qwixx and the moves that change it.
 *
 * @module
 * @remarks
 * A roll-and-write: six dice, four rows of numbers, and one sheet each. What
 * makes it a game rather than a lottery is that a row may only be crossed from
 * left to right - every number you take burns the ones you skipped over, for
 * good.
 *
 * The two white dice belong to **everybody**, which is why a turn is not one
 * person acting while the rest watch: the whole table decides on that sum, and
 * only then does the active player get their second, private choice.
 */

/** The four rows of a score sheet. */
export type Row = "rot" | "gelb" | "gruen" | "blau";

/** The rows in the order they are printed. */
export const ROWS: readonly Row[] = ["rot", "gelb", "gruen", "blau"];

/** German label of every row. */
export const ROW_LABELS: Readonly<Record<Row, string>> = {
  rot: "Rot",
  gelb: "Gelb",
  gruen: "Grün",
  blau: "Blau",
};

/** The ink each row is drawn with. */
export const ROW_INK: Readonly<Record<Row, string>> = {
  rot: "#dc2626",
  gelb: "#eab308",
  gruen: "#16a34a",
  blau: "#2563eb",
};

/**
 * Which way a row runs.
 *
 * @remarks
 * Red and yellow count up from 2, green and blue count down from 12. That is
 * the whole reason a colour die is worth having twice on the table: the same
 * roll is early in one row and late in another.
 */
export const ROW_ASCENDS: Readonly<Record<Row, boolean>> = {
  rot: true,
  gelb: true,
  gruen: false,
  blau: false,
};

/** Fewest and most players a game seats. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 5;

/** How many numbers a row holds, before the lock. */
export const ROW_LENGTH = 11;

/** The highest number a row holds - where a descending row starts. */
export const TOP_NUMBER = 12;

/** The last place in a row - the one that locks it. */
export const LOCK_AT = ROW_LENGTH - 1;

/** How many crosses a row needs before its last number may be taken. */
export const CROSSES_BEFORE_LOCK = 5;

/** Locked rows that end the game. */
export const LOCKS_TO_END = 2;

/** Penalties that end the game. */
export const PENALTIES_TO_END = 4;

/** What one penalty costs, in points. */
export const PENALTY_COST = 5;

/** Faces of one die. */
export const DIE_FACES = 6;

/** One player's sheet. */
export type Sheet = {
  /**
   * The places crossed in each row, ascending.
   *
   * @remarks
   * Places, not numbers: place 0 is the left-hand end of the row whichever way
   * that row runs, so "further right than everything so far" is the same test
   * in all four. The number printed there comes from {@link numberAt}.
   */
  readonly crosses: Readonly<Record<Row, readonly number[]>>;
  readonly penalties: number;
};

/** One player. */
export type Player = {
  readonly name: string;
  /** True if the computer plays this seat. */
  readonly isBot: boolean;
  readonly sheet: Sheet;
};

/** What the dice show; a locked row's die has been taken off the table. */
export type Dice = {
  readonly white: readonly number[];
  readonly colours: Readonly<Record<Row, number | null>>;
};

/** How far the turn has got. */
export type QwixxPhase =
  /** Everybody may take the sum of the two white dice. */
  | "white"
  /** The active player may add one white die to one colour die. */
  | "colour"
  /** Two rows locked, or somebody collected their fourth penalty. */
  | "gameOver";

/** A move a seat can make. */
export type QwixxMove =
  /** Take the white sum in a row. */
  | { readonly kind: "white"; readonly row: Row }
  /** Take a white die plus a colour die in that colour's row. */
  | { readonly kind: "colour"; readonly row: Row; readonly white: number }
  /** Take nothing this step. */
  | { readonly kind: "pass" };

/** The whole game at one instant. */
export type QwixxGame = {
  readonly phase: QwixxPhase;
  readonly players: readonly Player[];
  /** The seat whose turn it is - public knowledge, as at a real table. */
  readonly active: number;
  readonly dice: Dice;
  /** Which rows are shut for everybody. */
  readonly locked: Readonly<Record<Row, boolean>>;
  /** Who has answered the white dice this turn. */
  readonly decided: readonly boolean[];
  /** True once the active player has crossed something this turn. */
  readonly activeCrossed: boolean;
  readonly seed: number;
  readonly rng: number;
  readonly log: readonly string[];
};

/**
 * The number printed at a place in a row.
 *
 * @param row - which row
 * @param place - the place, 0 at the left-hand end
 * @returns the number to cross off there
 */
export function numberAt(row: Row, place: number): number {
  return ROW_ASCENDS[row] ? place + 2 : TOP_NUMBER - place;
}

/**
 * Where a number sits in a row.
 *
 * @param row - which row
 * @param value - the number rolled
 * @returns its place, or -1 if the row does not hold it
 */
export function placeOf(row: Row, value: number): number {
  const place = ROW_ASCENDS[row] ? value - 2 : TOP_NUMBER - value;
  return place >= 0 && place < ROW_LENGTH ? place : -1;
}

/** The rightmost place already crossed in a row, or -1. */
export function lastCross(sheet: Sheet, row: Row): number {
  const crosses = sheet.crosses[row];
  return crosses.length === 0 ? -1 : crosses[crosses.length - 1];
}

/**
 * Whether a place may be crossed.
 *
 * @param sheet - the player's sheet
 * @param row - the row
 * @param place - the place they want
 * @param locked - which rows are shut
 * @returns true if the cross is legal
 * @remarks
 * Three rules in one: the row must be open, the place must lie to the right of
 * everything already crossed there, and the last place needs five crosses
 * behind it - you do not get to lock a row you have barely touched.
 */
export function canCross(
  sheet: Sheet,
  row: Row,
  place: number,
  locked: Readonly<Record<Row, boolean>>,
): boolean {
  return (
    place >= 0 &&
    place < ROW_LENGTH &&
    !locked[row] &&
    place > lastCross(sheet, row) &&
    (place !== LOCK_AT || sheet.crosses[row].length >= CROSSES_BEFORE_LOCK)
  );
}

/**
 * What a row is worth.
 *
 * @param crosses - how many crosses it holds, the lock counted as one
 * @returns the points, which grow as one, three, six, ten and so on
 * @remarks
 * The triangular numbers. Crossing twice as often is worth four times as much,
 * which is why chasing one row is a strategy and spreading yourself thin is
 * not.
 */
export function rowScore(crosses: number): number {
  return (crosses * (crosses + 1)) / 2;
}

/**
 * What one sheet is worth all told.
 *
 * @param sheet - the sheet to add up
 * @param locked - which rows are shut, for the lock's extra cross
 * @returns the score, penalties already taken off
 */
export function sheetScore(
  sheet: Sheet,
  locked: Readonly<Record<Row, boolean>>,
): number {
  const rows = ROWS.reduce((sum, row) => {
    const crosses = sheet.crosses[row];
    // The lock counts as one more cross, but only for whoever crossed it.
    const lock = crosses.includes(LOCK_AT) && locked[row] ? 1 : 0;
    return sum + rowScore(crosses.length + lock);
  }, 0);
  return rows - sheet.penalties * PENALTY_COST;
}

/** The sum of the two white dice. */
export function whiteSum(dice: Dice): number {
  return dice.white.reduce((sum, die) => sum + die, 0);
}

/** How many rows are shut. */
export function lockCount(locked: Readonly<Record<Row, boolean>>): number {
  return ROWS.filter((row) => locked[row]).length;
}

/**
 * Whether the game has run out.
 *
 * @param game - the current game
 * @returns true once two rows are shut or somebody has four penalties
 */
export function isOver(game: QwixxGame): boolean {
  return (
    lockCount(game.locked) >= LOCKS_TO_END ||
    game.players.some((player) => player.sheet.penalties >= PENALTIES_TO_END)
  );
}

/**
 * The players with the highest score.
 *
 * @param game - the current game
 * @returns every seat sharing the best sheet
 */
export function leaders(game: QwixxGame): readonly number[] {
  const scores = game.players.map((player) =>
    sheetScore(player.sheet, game.locked),
  );
  const best = scores.reduce((most, score) => Math.max(most, score), -Infinity);
  return scores
    .map((score, seat) => (score === best ? seat : -1))
    .filter((seat) => seat >= 0);
}
