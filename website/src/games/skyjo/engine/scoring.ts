/**
 * Scoring a Skyjo round, and deciding when the game is over.
 *
 * @module
 * @remarks
 * Low is good: every card still lying in front of a player counts against them,
 * and the game is won by whoever has the fewest points once somebody passes the
 * limit. The one twist is the penalty on the player who ended the round.
 */
import { POINT_LIMIT, layoutValue, type Player, type SkyjoGame } from "./state";

/** What the ending player's score is multiplied by when the gamble fails. */
const PENALTY_FACTOR = 2;

/**
 * Scores the finished round and moves the game on.
 *
 * @param game - the game whose round has just ended
 * @returns the game with every card turned up, totals updated and the next
 * phase set
 */
export function scoreRound(game: SkyjoGame): SkyjoGame {
  // Everything is turned face up before counting.
  const revealed = game.players.map((player) => ({
    ...player,
    grid: player.grid.map((slot) =>
      slot.state === "down" ? { ...slot, state: "up" as const } : slot,
    ),
  }));
  const raw = revealed.map(layoutValue);
  const scores = raw.map((value, index) =>
    index === game.endedBy && isPenalised(raw, index)
      ? value * PENALTY_FACTOR
      : value,
  );
  const players = revealed.map((player, index) => ({
    ...player,
    roundScore: scores[index],
    total: player.total + scores[index],
  }));
  const over = players.some((player) => player.total >= POINT_LIMIT);
  return {
    ...game,
    phase: over ? "gameOver" : "roundOver",
    players,
    drawn: null,
    turn: game.endedBy ?? 0,
    log: [...game.log, ...scoreNotes(players, scores, raw, game.endedBy)],
  };
}

/**
 * Whether the player who ended the round has to take their points twice.
 *
 * @param raw - every player's unpenalised round score, in seat order
 * @param ender - the seat that ended the round
 * @returns true if the gamble failed and the score doubles
 * @remarks
 * Ending the round is a bet: only paying off if nobody else is as low. Somebody
 * matching the score is enough to lose the bet - being lowest *alone* is what
 * counts. A score of zero or less is never doubled, because doubling it would
 * be a reward rather than a penalty.
 */
export function isPenalised(raw: readonly number[], ender: number): boolean {
  const mine = raw[ender];
  const beatenOrMatched = raw.some(
    (value, index) => index !== ender && value <= mine,
  );
  return mine > 0 && beatenOrMatched;
}

/**
 * Who is winning, or has won.
 *
 * @param game - the game
 * @returns the seat indexes with the fewest points, usually just one
 */
export function leaders(game: SkyjoGame): readonly number[] {
  const best = Math.min(...game.players.map((player) => player.total));
  const found: number[] = [];
  game.players.forEach((player, index) => {
    if (player.total === best) {
      found.push(index);
    }
  });
  return found;
}

/**
 * The players in the order the result table lists them.
 *
 * @param game - the game
 * @returns the seat indexes, fewest points first
 */
export function standings(game: SkyjoGame): readonly number[] {
  return game.players
    .map((_, index) => index)
    .sort(
      (a, b) =>
        game.players[a].total - game.players[b].total ||
        game.players[a].roundScore - game.players[b].roundScore ||
        a - b,
    );
}

/** The log lines a scored round adds. */
function scoreNotes(
  players: readonly Player[],
  scores: readonly number[],
  raw: readonly number[],
  ender: number | null,
): string[] {
  const notes = players.map(
    (player, index) => `${player.name}: ${scores[index]} Punkte.`,
  );
  if (ender !== null && scores[ender] !== raw[ender]) {
    notes.push(
      `${players[ender].name} war nicht allein am niedrigsten - doppelte Punkte.`,
    );
  }
  return notes;
}
