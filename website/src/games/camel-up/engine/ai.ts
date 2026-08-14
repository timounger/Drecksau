/**
 * The computer players: what they do on their turn.
 *
 * @module
 * @remarks
 * Deliberately a plain, deterministic function of the game state - no timers,
 * no randomness of its own. The dice are the game's; the decision is not.
 *
 * The reasoning is the same one a good human uses, and it is arithmetic rather
 * than instinct: rolling the pyramid is worth exactly one coin, so **any** bet
 * is only worth making if it is worth more than one coin. The odds come from
 * {@link ./odds}, which counts every way the leg can still end instead of
 * guessing, so a camel riding on top of a heap is valued for what it is.
 */
import { legOdds, type LegOdds } from "./odds";
import {
  CAMELS,
  LEG_SECOND,
  LEG_WRONG,
  RACE_BET_PAYOUTS,
  RACE_WRONG,
  ROLL_REWARD,
  TRACK_SPACES,
  canPlaceTile,
  standings,
  type CamelUpGame,
  type CamelUpMove,
} from "./state";

/**
 * How sure of the whole race the computer wants to be before laying a card.
 *
 * @remarks
 * An overall bet is spent for good and costs a coin if it is wrong, so it is
 * only laid on a camel that is clearly ahead of the field rather than merely
 * in front at this moment.
 */
const RACE_CONFIDENCE = 0.45;

/** How far ahead of the pack a tile is worth putting down, in spaces. */
const TILE_AHEAD = 2;

/**
 * What a well-placed desert tile is reckoned to be worth, in coins.
 *
 * @remarks
 * A little more than a roll, and that margin is the whole point: put just in
 * front of the field, a tile is usually landed on once or twice before the leg
 * is out, and each landing pays a coin. Valued at exactly a roll it would
 * never be chosen at all - a tie loses - and the computer would go a whole
 * race without ever touching one of the four actions.
 */
const TILE_WORTH = 1.5;

/**
 * The move the computer makes for the seat on turn.
 *
 * @param game - the current game
 * @returns the move, or null if there is nothing to do
 */
export function aiMove(game: CamelUpGame): CamelUpMove | null {
  let move: CamelUpMove | null = null;
  if (game.phase === "legOver") {
    move = { kind: "nextLeg" };
  } else if (game.phase === "racing") {
    move = decide(game, game.turn);
  }
  return move;
}

/**
 * Weighs the four actions against each other and takes the best.
 *
 * @remarks
 * Rolling is the floor: it always pays {@link ROLL_REWARD} and it always
 * happens, so nothing else is worth doing unless it beats that.
 */
function decide(game: CamelUpGame, seat: number): CamelUpMove {
  const odds = legOdds(game);
  const bet = bestLegBet(game, odds);
  const race = bestRaceBet(game, seat, odds);
  const tile = bestTile(game, seat);
  // Rolling is always available while the leg runs: the fifth die ends the
  // leg, so a racing game never has an empty pyramid.
  let move: CamelUpMove = { kind: "roll" };
  let best = ROLL_REWARD;
  for (const option of [bet, race, tile]) {
    if (option !== null && option.worth > best) {
      move = option.move;
      best = option.worth;
    }
  }
  return move;
}

/** One action and what it is worth in coins. */
type Weighed = {
  readonly move: CamelUpMove;
  readonly worth: number;
};

/**
 * The best leg bet on the table right now.
 *
 * @remarks
 * Worth is the plain expectation: the card's figure when the camel leads, a
 * coin when it is second, a coin off otherwise.
 */
function bestLegBet(game: CamelUpGame, odds: LegOdds): Weighed | null {
  let best: Weighed | null = null;
  for (const camel of CAMELS) {
    const stack = game.legBets[camel];
    if (stack.length > 0) {
      const chance = odds[camel];
      const worth =
        stack[0] * chance.first +
        LEG_SECOND * chance.second -
        LEG_WRONG * (1 - chance.first - chance.second);
      if (best === null || worth > best.worth) {
        best = { move: { kind: "legBet", camel }, worth };
      }
    }
  }
  return best;
}

/**
 * The best overall bet, if any camel is clear enough to be worth a card.
 *
 * @remarks
 * The leg odds stand in for the whole race, which is rough but not wrong: a
 * camel that keeps winning legs is the one that gets to the end first. What
 * stops it being reckless is {@link RACE_CONFIDENCE} - a card is spent for
 * good, so it is only laid on something well clear of the field.
 */
function bestRaceBet(
  game: CamelUpGame,
  seat: number,
  odds: LegOdds,
): Weighed | null {
  const mine = game.players[seat].raceCards;
  const order = standings(game.track);
  let best: Weighed | null = null;
  for (const camel of mine) {
    for (const side of ["winner", "loser"] as const) {
      const pile = side === "winner" ? game.winnerBets : game.loserBets;
      const payout =
        RACE_BET_PAYOUTS[pile.length] ??
        RACE_BET_PAYOUTS[RACE_BET_PAYOUTS.length - 1];
      // For the tail of the field the leg odds say little, so the standing
      // itself has to carry the judgement: last is last.
      const chance =
        side === "winner"
          ? odds[camel].first
          : camel === order[order.length - 1]
            ? RACE_CONFIDENCE
            : 0;
      const worth = payout * chance - RACE_WRONG * (1 - chance);
      if (chance >= RACE_CONFIDENCE && (best === null || worth > best.worth)) {
        best = { move: { kind: "raceBet", camel, side }, worth };
      }
    }
  }
  return best;
}

/**
 * Where a desert tile would earn its keep.
 *
 * @remarks
 * Just in front of the field, where the next few dice have to land. An oasis
 * rather than a mirage: both pay the same coin, and pushing the pack forward
 * ends the leg sooner, which suits somebody who has already placed their bets.
 */
function bestTile(game: CamelUpGame, seat: number): Weighed | null {
  const front = leadSpace(game);
  let best: Weighed | null = null;
  for (let step = 1; step <= TILE_AHEAD + 1; step++) {
    const space = front + step;
    if (
      best === null &&
      space < TRACK_SPACES &&
      canPlaceTile(game, seat, space)
    ) {
      // Only while it is still in front of them: picking a tile up and putting
      // it down again a space along is a whole turn for almost nothing.
      best = {
        move: { kind: "tile", space, tile: "oasis" },
        worth: game.players[seat].tileAt === null ? TILE_WORTH : 0,
      };
    }
  }
  return best;
}

/** The space the leading camel stands on. */
function leadSpace(game: CamelUpGame): number {
  const leader = standings(game.track)[0];
  let found = 0;
  game.track.forEach((stack, space) => {
    if (stack.includes(leader)) {
      found = space;
    }
  });
  return found;
}
