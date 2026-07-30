/**
 * How the team scores in a round of Krakel Orakel.
 *
 * @module
 * @remarks
 * Krakel Orakel is cooperative: there is one shared score, not a score per
 * player. Striking a word nobody drew earns the team points; striking a word
 * that somebody really did draw costs them - the drawing was there to be read,
 * and the team misread it.
 */
import { DECOY_COUNT, TOTAL_ROUNDS } from "./types";

/** Points the team earns for striking a word nobody drew. */
const DECOY_POINTS = 3;

/** Points the team loses for striking a word somebody really drew. */
const REAL_PENALTY = 2;

/** The share of the maximum needed for each rating, best band first. */
const RATING_BANDS: readonly {
  readonly share: number;
  readonly name: string;
}[] = [
  { share: 1, name: "Hellseher" },
  { share: 0.8, name: "Orakel" },
  { share: 0.5, name: "Gute Spürnasen" },
  { share: 0.2, name: "Ahnungsvoll" },
  { share: 0, name: "Blindgänger" },
];

/**
 * Points an exclusion is worth to the team.
 *
 * @param wasDecoy - whether the struck word was one nobody drew
 * @returns the points to add - positive for a decoy, negative for a real term
 */
export function exclusionPoints(wasDecoy: boolean): number {
  return wasDecoy ? DECOY_POINTS : -REAL_PENALTY;
}

/**
 * The best score a team can reach over a whole game.
 *
 * @returns every decoy struck in every round, and no real term lost
 */
export function maxScore(): number {
  return TOTAL_ROUNDS * DECOY_COUNT * DECOY_POINTS;
}

/**
 * Whether a finished game counts as won.
 *
 * @param score - the team's final score
 * @returns true only for a flawless game
 * @remarks
 * Krakel Orakel is cooperative, so there is no opponent to beat - the team
 * plays against the board. A game counts as won only when nothing at all went
 * wrong: every decoy struck in every round, and not one drawn word mistaken for
 * a decoy. Anything less is a loss, which keeps the statistics' "won" column
 * meaning something.
 */
export function isPerfectGame(score: number): boolean {
  return score >= maxScore();
}

/**
 * The team's title for a final score.
 *
 * @param score - the team's final score
 * @returns the German rating the end screen shows
 */
export function teamRating(score: number): string {
  const share = score / maxScore();
  return (
    RATING_BANDS.find((band) => share >= band.share)?.name ??
    RATING_BANDS[RATING_BANDS.length - 1].name
  );
}
