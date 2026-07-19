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
import { teamCount, teamOf, type GameState } from "./state";

/** Extra points for the last trick. */
const LAST_TRICK_BONUS = 10;

/** Trick points are rounded to this. */
const ROUND_TO = 10;

/** The declarer loses this many times the bid on going off. */
const BETE_FACTOR = 2;

/** A Durch (winning every trick) is worth this, won or lost. */
const DURCH_VALUE = 1000;

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
  const declarerTeam = teamOf(state, declarer);
  const lastTrickWinnerIndex = state.leaderIndex;
  const teams = teamCount(state);
  const bete = -(BETE_FACTOR * state.highestBid);

  // The declarer's team conceded before playing: they go off, nobody else scores.
  if (state.conceded) {
    const perPlayer = state.players.map((_, index) => ({
      trickPoints: 0,
      meldPoints: 0,
      delta: teamOf(state, index) === declarerTeam ? bete : 0,
    }));
    return { perPlayer, lastTrickWinnerIndex, declarerMadeBid: false };
  }

  // Pool each team's captured Augen, melds and whether it took any trick.
  const augen = new Array<number>(teams).fill(0);
  const meldRaw = new Array<number>(teams).fill(0);
  const tookTrick = new Array<boolean>(teams).fill(false);
  state.players.forEach((player, index) => {
    const team = teamOf(state, index);
    augen[team] +=
      player.won.reduce((sum, card) => sum + cardValue(card), 0) +
      (index === lastTrickWinnerIndex ? LAST_TRICK_BONUS : 0);
    meldRaw[team] += player.meldPoints;
    if (player.hasTrick) {
      tookTrick[team] = true;
    }
  });
  const trickPoints = augen.map(roundToTen);
  const meldPoints = meldRaw.map((meld, team) => (tookTrick[team] ? meld : 0));
  const total = trickPoints.map((points, team) => points + meldPoints[team]);

  // A Durch: the declarer's team wins or loses a flat value on taking every trick.
  const wonAll =
    state.gameType === "durch" &&
    state.players.every(
      (player, index) =>
        teamOf(state, index) === declarerTeam || !player.hasTrick,
    );
  const declarerMadeBid =
    state.gameType === "durch"
      ? wonAll
      : total[declarerTeam] >= state.highestBid;

  const teamDelta = total.map((teamTotal, team) => {
    let delta: number;
    if (team !== declarerTeam) {
      delta = teamTotal;
    } else if (state.gameType === "durch") {
      delta = wonAll ? DURCH_VALUE : -DURCH_VALUE;
    } else {
      delta = declarerMadeBid ? teamTotal : bete;
    }
    return delta;
  });

  const perPlayer = state.players.map((_, index) => {
    const team = teamOf(state, index);
    return {
      trickPoints: trickPoints[team],
      meldPoints: meldPoints[team],
      delta: teamDelta[team],
    };
  });

  return { perPlayer, lastTrickWinnerIndex, declarerMadeBid };
}
