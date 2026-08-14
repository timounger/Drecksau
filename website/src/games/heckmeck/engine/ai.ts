/**
 * The computer players: when to take the worm, and when to stop.
 *
 * @module
 * @remarks
 * Two decisions, and they are the same two a person agonises over.
 *
 * **Which value to set aside** is mostly arithmetic - the face that brings the
 * most, counting how many of them there are - with one exception that is not:
 * without a worm nothing counts at all, so a worm is worth taking well before
 * it looks worth taking.
 *
 * **When to stop** is judgement, and the rule here is the one that keeps
 * players out of trouble: stop when rolling on cannot realistically reach
 * anything better. Chasing a tile four higher with two dice left is how piles
 * get handed back.
 *
 * Deliberately a plain function of the state, with no randomness of its own.
 */
import { legalMoves } from "./moves";
import {
  WORM,
  canStop,
  faceValue,
  grillOffer,
  hasWorm,
  pickable,
  stealable,
  total,
  wormsOn,
  type HeckmeckGame,
  type HeckmeckMove,
} from "./state";

/**
 * What the first worm is worth on top of its face value.
 *
 * @remarks
 * Large on purpose. A turn without a worm is worth nothing whatever else is
 * set aside, so the first one is not five points, it is the difference between
 * a turn and a wasted one.
 */
const FIRST_WORM_BONUS = 9;

/** What walking into a certain bust is worth - nothing anybody wants. */
const BUST_COST = 100;

/** With this many dice or fewer left, rolling on is a gamble not a plan. */
const FEW_DICE = 3;

/**
 * How far one more die can be counted on to carry, in points.
 *
 * @remarks
 * Not five. A die is only worth its face if that face is still free **and**
 * shows up, so reckoning the reach at the maximum is how a player talks
 * themselves into one roll too many. Four is the honest figure, and one die is
 * discounted entirely as the price of getting there.
 */
const SAFE_PER_DIE = 4;

/**
 * The move the computer makes.
 *
 * @param game - the current game
 * @returns the move, or null if there is nothing to do
 */
export function aiMove(game: HeckmeckGame): HeckmeckMove | null {
  let move: HeckmeckMove | null = null;
  if (game.phase === "pick") {
    move = bestPick(game);
  } else if (game.phase === "decide") {
    move = bestDecision(game);
  }
  return move;
}

/** Which value to set aside. */
function bestPick(game: HeckmeckGame): HeckmeckMove | null {
  let best: HeckmeckMove | null = null;
  let bestWorth = -Infinity;
  for (const face of pickable(game)) {
    const worth = pickWorth(game, face);
    if (worth > bestWorth) {
      best = { kind: "pick", face };
      bestWorth = worth;
    }
  }
  return best;
}

/** What setting a face aside is worth. */
function pickWorth(game: HeckmeckGame, face: number): number {
  const count = game.dice.filter((die) => die === face).length;
  const gained = count * faceValue(face);
  const firstWorm = face === WORM && !hasWorm(game.kept) ? FIRST_WORM_BONUS : 0;
  const left = game.dice.length - count;
  const after = total(game.kept) + gained;
  const wormAfter = hasWorm(game.kept) || face === WORM;
  // Two ways this pick kills the turn, and they are worth the same to avoid.
  // Either it uses the last die and leaves nothing to take, or it leaves so
  // few dice that the lowest tile on the grill is out of reach whatever they
  // show. The second one is the quiet killer: the turn looks alive for another
  // roll or two and was already lost.
  const stranded =
    lowestTile(game) - after > left * faceValue(WORM) ||
    (!wormAfter && left === 0);
  const dead = stranded ? BUST_COST : 0;
  return gained + firstWorm - dead;
}

/** Stop, steal, or throw the rest. */
function bestDecision(game: HeckmeckGame): HeckmeckMove | null {
  const moves = legalMoves(game, game.active);
  const steal = stealable(game);
  const offer = grillOffer(game);
  let move: HeckmeckMove | null = null;
  if (steal.length > 0 && hasWorm(game.kept)) {
    // Stealing takes a tile off somebody else as well as adding one here, so
    // it is worth roughly twice what the same tile is worth off the grill.
    move = { kind: "steal", seat: richest(game, steal) };
  } else if (canStop(game) && offer !== null && !worthRolling(game, offer)) {
    move = { kind: "take" };
  } else {
    move = moves.find((entry) => entry.kind === "roll") ?? null;
    // Nothing to roll and nothing worth stopping for: take what there is.
    move = move ?? moves.find((entry) => entry.kind === "take") ?? null;
  }
  return move;
}

/**
 * Whether throwing again could plausibly beat what is already on offer.
 *
 * @remarks
 * Three reasons to stop, and they are the ones a player learns the hard way:
 * the offer is already the best tile there is; there are too few dice left to
 * gamble; or the next tile up is further away than the remaining dice can
 * carry, so rolling on can only lose what is in hand.
 */
function worthRolling(game: HeckmeckGame, offer: number): boolean {
  const better = game.grill.filter((tile) => tile > offer);
  const reach = (game.dice.length - 1) * SAFE_PER_DIE;
  const gap = better.length === 0 ? Infinity : better[0] - total(game.kept);
  return (
    game.dice.length > FEW_DICE &&
    better.length > 0 &&
    gap <= reach &&
    // Chasing a fatter tile is only worth the risk if it really is fatter.
    wormsOn(better[0]) > wormsOn(offer)
  );
}

/** Of the seats that can be robbed, the one whose tile is worth most. */
function richest(game: HeckmeckGame, seats: readonly number[]): number {
  return seats.reduce((best, seat) => (seat > best ? best : seat), seats[0]);
}

/** The smallest tile still on the grill, or a number nothing can reach. */
function lowestTile(game: HeckmeckGame): number {
  return game.grill.length === 0 ? Infinity : game.grill[0];
}
