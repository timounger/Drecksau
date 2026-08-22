/**
 * The computer players: what to keep, and where to write it.
 *
 * @module
 * @remarks
 * Two decisions, and **both of them are decisions about the sheet**, not about
 * the dice. That is the whole of Kniffel: five sixes are worth fifty in the
 * Kniffel box, thirty in the sixes, and nothing at all if both are already
 * filled in.
 *
 * The first version got this half right. Where to write a roll weighed the free
 * boxes; what to **keep** did not look at the sheet at all - it kept whichever
 * face turned up most, plus a hand-written exception for straights. So it went
 * on collecting sixes after the sixes were gone, and hoarded a pair nothing on
 * the sheet could use. Which is precisely what it looks like from the other side
 * of the table: a player who is not paying attention to what they still need.
 *
 * Now both decisions run through the same question - **what is this turn still
 * worth?** - and the answer is worked out rather than guessed:
 *
 * - {@link boxWorth} prices one box for one hand: what it scores now, less what
 *   the box is usually worth kept for a better roll, plus what the upper bonus
 *   has to say. Taking the biggest number on offer is wrong often enough to
 *   matter - twenty-two in the chance scores twenty-two and throws away the one
 *   box that will take any roll later.
 * - {@link keepMask} tries **every** way of keeping dice, rolls the rest in its
 *   head, and takes the one whose expected best box is highest. The straight
 *   exception disappeared with it: keeping four of a run wins on its own merits
 *   once somebody actually counts the sixth of a chance of completing it.
 *
 * Deliberately a plain function of the state, with no randomness of its own.
 */
import {
  BONUS_TARGET,
  DICE_COUNT,
  DIE_FACES,
  UPPER,
  freeBoxes,
  scoreOf,
  upperSum,
  type Category,
  type KniffelGame,
  type KniffelMove,
  type Sheet,
} from "./state";

/**
 * What each box is usually worth if it is kept for a better roll.
 *
 * @remarks
 * Not a maximum and not the average of a random throw, but roughly what a
 * player with throws still to come can expect out of it. Only the order
 * matters - the figures exist to be compared with one another.
 */
const KEEPING_WORTH: Readonly<Record<Category, number>> = {
  einser: 2,
  zweier: 4,
  dreier: 6,
  vierer: 8,
  fuenfer: 10,
  sechser: 12,
  dreierpasch: 18,
  viererpasch: 12,
  fullHouse: 12,
  kleineStrasse: 18,
  grosseStrasse: 10,
  kniffel: 3,
  chance: 21,
};

/** Three of a face is what earns the upper half its bonus. */
const BONUS_PACE = 3;

/** One way the rerolled dice could land, and how likely that is. */
type Outcome = {
  readonly faces: readonly number[];
  readonly chance: number;
};

/** The outcome tables, worked out once per number of dice thrown. */
const OUTCOMES = new Map<number, readonly Outcome[]>();

/**
 * The move the computer makes.
 *
 * @param game - the current game
 * @returns the move, or null if there is nothing to do
 * @remarks
 * One step at a time - hold a die, throw, hold, write - because watching
 * somebody decide what to keep is half of Kniffel.
 */
export function aiMove(game: KniffelGame): KniffelMove | null {
  const sheet = game.players[game.active]?.sheet;
  let move: KniffelMove | null = null;
  if (sheet !== undefined) {
    const wanted = keepMask(game, sheet);
    const wrong = game.held.findIndex((held, index) => held !== wanted[index]);
    if (game.rollsLeft > 0 && wrong >= 0) {
      move = { kind: "hold", index: wrong };
    } else if (game.rollsLeft > 0 && wanted.some((keep) => !keep)) {
      move = { kind: "roll" };
    } else {
      move = { kind: "enter", category: bestBox(game, sheet) };
    }
  }
  return move;
}

/**
 * Which dice to keep.
 *
 * @param game - the current game
 * @param sheet - the sheet the roll has to go onto
 * @returns one flag per die
 * @remarks
 * Every way of keeping dice is tried - there are at most thirty-two, and far
 * fewer once duplicate faces are folded together - and each is judged by what
 * the turn would be **expected** to be worth after throwing the rest once.
 *
 * One throw of lookahead, even with two throws left. Two would mean weighing a
 * thousand outcomes against a thousand more, and the first throw's answer is
 * close enough that nobody at the table would play the difference. What matters
 * is that the sheet is in the sum at all.
 *
 * Keeping everything is also how the computer says it wants to stop: with
 * nothing left to throw, the next move is writing the roll down.
 */
function keepMask(game: KniffelGame, sheet: Sheet): readonly boolean[] {
  let best: readonly number[] = game.dice;
  let bestWorth = -Infinity;
  for (const kept of keepOptions(game.dice)) {
    const worth = worthOfKeeping(sheet, kept, DICE_COUNT - kept.length);
    if (worth > bestWorth) {
      best = kept;
      bestWorth = worth;
    }
  }
  return maskFor(game.dice, best);
}

/**
 * Every distinct hand that could be kept from this roll.
 *
 * @param dice - the five dice as they lie
 * @returns each keepable hand, faces sorted, without repeats
 * @remarks
 * By **faces**, not by dice: keeping the first four or the second four of four
 * fours is the same decision, and folding them together takes thirty-two
 * candidates down to a handful on a roll with pairs in it.
 */
function keepOptions(dice: readonly number[]): readonly (readonly number[])[] {
  const seen = new Map<string, readonly number[]>();
  const total = 1 << dice.length;
  for (let mask = 0; mask < total; mask += 1) {
    const kept = dice
      .filter((unused, at) => (mask & (1 << at)) !== 0)
      .sort((left, right) => left - right);
    seen.set(kept.join(","), kept);
  }
  return [...seen.values()];
}

/**
 * What a turn is worth if these faces are kept and the rest thrown again.
 *
 * @param sheet - the sheet the roll has to go onto
 * @param kept - the faces being held
 * @param rerolls - how many dice are thrown again
 * @returns the expected value of the best box afterwards
 */
function worthOfKeeping(
  sheet: Sheet,
  kept: readonly number[],
  rerolls: number,
): number {
  let expected = 0;
  for (const outcome of rollOutcomes(rerolls)) {
    expected += outcome.chance * bestWorth(sheet, [...kept, ...outcome.faces]);
  }
  return expected;
}

/**
 * Every way a number of dice could land, with how likely each is.
 *
 * @param count - how many dice are thrown
 * @returns each distinct set of faces and its probability
 * @remarks
 * As **multisets**, not as ordered throws: 6^5 is 7776 orderings of five dice
 * and only 252 hands, and a hand is all Kniffel can tell apart. Each carries
 * the number of orderings that produce it, which is what makes the weighted sum
 * come out as a real expectation.
 */
function rollOutcomes(count: number): readonly Outcome[] {
  const known = OUTCOMES.get(count);
  let table: readonly Outcome[];
  if (known === undefined) {
    table = buildOutcomes(count);
    OUTCOMES.set(count, table);
  } else {
    table = known;
  }
  return table;
}

/** Walks every multiset of `count` faces, counting the orderings of each. */
function buildOutcomes(count: number): readonly Outcome[] {
  const all: Outcome[] = [];
  const faces: number[] = [];
  const orderings = Math.pow(DIE_FACES, count);
  const walk = (face: number, left: number, ways: number): void => {
    if (face > DIE_FACES) {
      if (left === 0) {
        all.push({ faces: [...faces], chance: ways / orderings });
      }
    } else {
      for (let take = 0; take <= left; take += 1) {
        for (let one = 0; one < take; one += 1) {
          faces.push(face);
        }
        walk(face + 1, left - take, ways * choose(left, take));
        faces.length -= take;
      }
    }
  };
  walk(1, count, 1);
  return all;
}

/** How many ways to choose some of a number of things. */
function choose(from: number, take: number): number {
  let ways = 1;
  for (let step = 0; step < take; step += 1) {
    ways = (ways * (from - step)) / (step + 1);
  }
  return Math.round(ways);
}

/** The boolean flags that keep exactly these faces out of these dice. */
function maskFor(
  dice: readonly number[],
  kept: readonly number[],
): readonly boolean[] {
  const wanted = [...kept];
  return dice.map((die) => {
    const at = wanted.indexOf(die);
    if (at >= 0) {
      wanted.splice(at, 1);
    }
    return at >= 0;
  });
}

/** Which box to write this roll into. */
function bestBox(game: KniffelGame, sheet: Sheet): Category {
  const free = freeBoxes(sheet);
  let best = free[0];
  let bestSoFar = -Infinity;
  for (const category of free) {
    const worth = boxWorth(sheet, game.dice, category);
    if (worth > bestSoFar) {
      best = category;
      bestSoFar = worth;
    }
  }
  return best;
}

/**
 * The best any free box could do with this hand.
 *
 * @param sheet - the sheet the roll has to go onto
 * @param dice - the hand
 * @returns the worth of the box the computer would pick
 * @remarks
 * Negative when every remaining box is a bad home for this hand, and that is
 * the point: a roll has to go **somewhere**, so the cheapest box to give up
 * falls out of the same sum that picks the best one.
 */
function bestWorth(sheet: Sheet, dice: readonly number[]): number {
  let best = -Infinity;
  for (const category of freeBoxes(sheet)) {
    best = Math.max(best, boxWorth(sheet, dice, category));
  }
  return best;
}

/** What one box is worth for one hand: what it scores, less what it costs. */
function boxWorth(
  sheet: Sheet,
  dice: readonly number[],
  category: Category,
): number {
  const points = scoreOf(dice, category);
  return points - KEEPING_WORTH[category] + bonusPull(sheet, category, points);
}

/**
 * How much the bonus argues for putting this roll in the upper half.
 *
 * @remarks
 * Only while the bonus is still reachable, and only for a box that is pulling
 * its weight - three of that face or better. Two sixes in the sixes is exactly
 * how the bonus quietly slips away.
 */
function bonusPull(sheet: Sheet, category: Category, points: number): number {
  const face = UPPER.indexOf(category) + 1;
  const short = BONUS_TARGET - upperSum(sheet);
  return face > 0 && short > 0 && points >= BONUS_PACE * face
    ? KEEPING_WORTH[category]
    : 0;
}
