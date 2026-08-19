/**
 * What the online layer asks this game to play for a seat - which is nothing.
 *
 * @module
 * @remarks
 * The Mind is played by feeling out how long the others are hesitating, so
 * there is nobody for a machine to stand in for: a computer partner would
 * either know every hand, and then it is not a game, or wait a made-up number
 * of seconds, which is the same thing with extra steps. That is why the game
 * is online only, and why this module is one function that declines.
 */
import type { MindMove } from "./state";

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
