/**
 * Scoring a finished round.
 *
 * @module
 * @remarks
 * Each player scores the Augen of their won cards (the declarer's discarded
 * cards count as won by them), rounded to tens, plus their melds if they took a
 * trick, plus 10 for the last trick. The declarer must reach the bid or "goes
 * off" for double the bid. See `docs/games/binokel/game-rules.md`.
 */
import { cardValue } from "./cards";
import type { GameState } from "./state";

/** Extra points for the last trick. */
const LAST_TRICK_BONUS = 10;

/** Trick points are rounded to this. */
const ROUND_TO = 10;

/** The declarer loses this many times the bid on going off. */
const BETE_FACTOR = 2;

/** One player's result for the round. */
export type PlayerRoundResult = {
  /** Card points from tricks, rounded, incl. the last-trick bonus. */
  readonly trickPoints: number;
  /** Meld points that counted (0 if the player took no trick). */
  readonly meldPoints: number;
  /** What is added to the player's score (negative if the declarer went off). */
  readonly delta: number;
};

/** The whole round's result. */
export type RoundResult = {
  readonly perPlayer: readonly PlayerRoundResult[];
  /** The last trick's winner - they get the bonus. */
  readonly lastTrickWinnerIndex: number;
  /** True if the declarer reached the bid. */
  readonly declarerMadeBid: boolean;
};

/** Rounds Augen to the nearest ten - 5 and up rounds up. */
function roundToTen(augen: number): number {
  return Math.round(augen / ROUND_TO) * ROUND_TO;
}

/**
 * Works out what every player scores for the finished round.
 *
 * @param state - the state at the end of trick play
 * @returns the per-player results and who won the last trick
 * @remarks
 * The last trick's winner is the current leader - the winner of a trick leads
 * the next, and after the final trick there is no next.
 */
export function roundResult(state: GameState): RoundResult {
  const declarer = state.declarerIndex ?? 0;
  const lastTrickWinnerIndex = state.leaderIndex;

  const raw = state.players.map((player, index) => {
    const augen =
      player.won.reduce((sum, card) => sum + cardValue(card), 0) +
      (index === lastTrickWinnerIndex ? LAST_TRICK_BONUS : 0);
    return {
      trickPoints: roundToTen(augen),
      meldPoints: player.hasTrick ? player.meldPoints : 0,
    };
  });

  const declarerTotal = raw[declarer].trickPoints + raw[declarer].meldPoints;
  const declarerMadeBid = declarerTotal >= state.highestBid;

  const perPlayer = raw.map((result, index) => {
    let delta: number;
    if (index === declarer) {
      delta = declarerMadeBid
        ? result.trickPoints + result.meldPoints
        : -(BETE_FACTOR * state.highestBid);
    } else {
      delta = result.trickPoints + result.meldPoints;
    }
    return { ...result, delta };
  });

  return { perPlayer, lastTrickWinnerIndex, declarerMadeBid };
}
