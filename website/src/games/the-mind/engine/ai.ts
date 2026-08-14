/**
 * The computer partners: not what they play, but **when**.
 *
 * @module
 * @remarks
 * There is only ever one card a player can sensibly put down - their lowest.
 * So a computer partner has no choice to make at all; its whole contribution is
 * the timing, and the timing is the game.
 *
 * It waits in proportion to the **gap** between its lowest card and the one on
 * top of the pile, which is exactly what a human at the table does. Somebody
 * holding the 12 over a pile showing 9 puts it down almost at once; somebody
 * holding the 80 sits on their hands. Two players doing that independently is
 * enough to get the order right most of the time, and getting it wrong is what
 * makes the game worth playing.
 *
 * Deliberately a plain function of the state, with no randomness of its own:
 * the same position always produces the same wait, so a computer partner can be
 * reasoned about instead of merely endured.
 */
import { topCard, type MindGame, type MindMove } from "./state";

/**
 * How long one point of gap is worth waiting, in milliseconds.
 *
 * @remarks
 * The rule of thumb the game teaches is about a second for every ten points,
 * and this is that. Faster and the computer plays over the top of you; slower
 * and a level of high cards is a minute of watching nothing happen.
 */
const MS_PER_POINT = 95;

/** Nobody plays instantly, however small the gap. */
const MIN_WAIT_MS = 450;

/** Nor does anybody wait for ever on one card. */
const MAX_WAIT_MS = 9000;

/**
 * How long this computer partner sits on its lowest card.
 *
 * @param game - the current game
 * @param seat - the computer seat
 * @returns the wait in milliseconds, or null if it has nothing to play
 */
export function botWaitMs(game: MindGame, seat: number): number | null {
  const hand = game.players[seat]?.hand ?? [];
  let wait: number | null = null;
  if (game.phase === "playing" && hand.length > 0) {
    const gap = hand[0] - topCard(game);
    wait = Math.min(MAX_WAIT_MS, Math.max(MIN_WAIT_MS, gap * MS_PER_POINT));
  }
  return wait;
}

/**
 * The move a computer partner makes once its wait is up.
 *
 * @returns always the one move there is
 * @remarks
 * There is nothing to choose. The card is the lowest in hand, and which card
 * that is the referee works out for itself - the move does not name it, so a
 * move travelling over the wire gives nothing away.
 */
export function botMove(): MindMove {
  return { kind: "play" };
}

/**
 * The move the online layer would play for a seat on turn.
 *
 * @returns always null
 * @remarks
 * The layer calls this to hurry a slow player along or to play on for somebody
 * who has left. Neither applies here: this game has no turns, so it never
 * knows whose seat to play - and a machine that stepped in with the right
 * timing would be doing the one thing the players came to do themselves. What
 * happens when somebody leaves mid-level is in the game's README.
 */
export function aiMove(): MindMove | null {
  return null;
}
