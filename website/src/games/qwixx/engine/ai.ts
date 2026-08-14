/**
 * The computer players: what they cross, and what they let go.
 *
 * @module
 * @remarks
 * Qwixx has one real decision and the computer makes it the same way a good
 * human does: **what does this cross burn?** Taking the 9 in a row standing at
 * 4 does not cost you the 9, it costs you the 5, 6, 7 and 8 - and they never
 * come back.
 *
 * So a cross is weighed as one point of progress against the places it gives
 * up, and the price of giving up goes down as the game runs out. Early on, four
 * burnt numbers is a disaster; with two rows nearly shut it is the last chance
 * anybody is going to get.
 *
 * Deliberately a plain function of the state, with no randomness of its own.
 */
import { legalMoves, skipped, untilLock } from "./moves";
import {
  LOCKS_TO_END,
  LOCK_AT,
  PENALTY_COST,
  ROWS,
  lockCount,
  placeOf,
  rowScore,
  whiteSum,
  type QwixxGame,
  type QwixxMove,
  type Row,
  type Sheet,
} from "./state";

/**
 * What one burnt number costs while the game is still young.
 *
 * @remarks
 * More than the cross itself is worth, which is why a computer player passes
 * on a wide jump early. The figure is in the same units as {@link rowScore}
 * grows in, so the two can simply be subtracted.
 */
const BURN_COST = 1.15;

/** How much cheaper burning gets once the table is closing down. */
const ENDGAME_RELIEF = 0.55;

/** What shutting a row is worth beyond the cross itself. */
const LOCK_BONUS = 4;

/**
 * The move the computer makes.
 *
 * @param game - the current game
 * @param seat - the seat to play for
 * @returns the move, or null if there is nothing to do
 * @remarks
 * The seat matters: during the white step every player answers for
 * themselves, so this is asked once per computer seat rather than once per
 * turn.
 */
export function aiMove(game: QwixxGame, seat: number): QwixxMove | null {
  const moves = legalMoves(game, seat);
  const sheet = game.players[seat]?.sheet;
  let best: QwixxMove | null = null;
  let bestWorth = 0;
  if (sheet !== undefined) {
    for (const move of moves) {
      const worth = worthOf(game, sheet, move, seat);
      if (best === null || worth > bestWorth) {
        best = move;
        bestWorth = worth;
      }
    }
  }
  return best;
}

/** What one move is worth to this seat, in points. */
function worthOf(
  game: QwixxGame,
  sheet: Sheet,
  move: QwixxMove,
  seat: number,
): number {
  let worth: number;
  if (move.kind === "pass") {
    // Passing is free - unless it is the active player's last chance this turn
    // and they have crossed nothing, in which case it costs a penalty.
    const penalty =
      game.phase === "colour" && seat === game.active && !game.activeCrossed;
    worth = penalty ? -PENALTY_COST : 0;
  } else {
    const row = move.row;
    const place = placeAimedAt(game, move);
    worth = place < 0 ? -Infinity : crossWorth(game, sheet, row, place);
  }
  return worth;
}

/** Where a move would put its cross. */
function placeAimedAt(game: QwixxGame, move: QwixxMove): number {
  let place = -1;
  if (move.kind === "white") {
    place = placeOf(move.row, whiteSum(game.dice));
  } else if (move.kind === "colour") {
    const die = game.dice.colours[move.row];
    const white = game.dice.white[move.white];
    place = die === null ? -1 : placeOf(move.row, die + white);
  }
  return place;
}

/**
 * What crossing a place is worth: the growth it buys, less what it burns.
 *
 * @remarks
 * The gain is the real one - a row's score grows faster the fuller it is, so
 * the same cross is worth more in a long row than in an empty one. That falls
 * out of {@link rowScore} without having to be said.
 */
function crossWorth(
  game: QwixxGame,
  sheet: Sheet,
  row: Row,
  place: number,
): number {
  const held = sheet.crosses[row].length;
  const gain = rowScore(held + 1) - rowScore(held);
  const burn = skipped(sheet, row, place) * burnCost(game);
  const lock = place === LOCK_AT ? LOCK_BONUS : 0;
  // A row nobody can finish is worth less; one cross short of the lock is
  // worth pushing for.
  const nearLock = untilLock(sheet, row) === 0 && place === LOCK_AT ? 1 : 0;
  return gain - burn + lock + nearLock;
}

/** What one burnt number costs right now. */
function burnCost(game: QwixxGame): number {
  const shutting = lockCount(game.locked) >= LOCKS_TO_END - 1;
  const desperate = game.players.some(
    (player) => player.sheet.penalties >= LOCKS_TO_END,
  );
  return shutting || desperate ? BURN_COST * ENDGAME_RELIEF : BURN_COST;
}

/**
 * Which rows still have room worth having.
 *
 * @param sheet - the sheet to look at
 * @returns the rows with more than one place left
 * @remarks
 * Exported because the screen shows the same thing: a row with nothing useful
 * left in it is not a choice, it is a dead end.
 */
export function openRows(sheet: Sheet): readonly Row[] {
  return ROWS.filter((row) => untilLock(sheet, row) >= 0);
}
