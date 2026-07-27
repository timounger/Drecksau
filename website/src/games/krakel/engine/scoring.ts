/**
 * How points are awarded in a round of Krakel Orakel.
 *
 * @module
 * @remarks
 * Guessing early is worth more than guessing late, so there is a reason to
 * shout the answer the moment it clicks. The drawer earns for every player they
 * get across the line, so a clear picture pays off too.
 */

/** Points the very first correct guess is worth. */
const GUESS_TOP = 5;

/** The fewest points a (late but) correct guess is still worth. */
const GUESS_FLOOR = 2;

/** Points the drawer earns for each player who guesses the term. */
const DRAWER_PER_GUESS = 2;

/**
 * Points for a correct guess, by how many already guessed before it.
 *
 * @param alreadyGuessed - how many players guessed correctly earlier this round
 * @returns the points for this guess - more the earlier it lands
 */
export function guesserPoints(alreadyGuessed: number): number {
  return Math.max(GUESS_FLOOR, GUESS_TOP - alreadyGuessed);
}

/**
 * Points the drawer earns for a correct guess.
 *
 * @returns the drawer's reward per player who guesses the term
 */
export function drawerPointsPerGuess(): number {
  return DRAWER_PER_GUESS;
}
