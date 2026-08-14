/**
 * The computer players: what to keep, and where to write it.
 *
 * @module
 * @remarks
 * Two decisions, and the second is the one people get wrong.
 *
 * **What to keep** is a readable rule rather than a search: chase a straight
 * when four of a run are already there, otherwise keep the face that turns up
 * most - and among equal counts the higher one, because the upper half pays by
 * face.
 *
 * **Where to write it** is where the game is won. Taking the biggest number on
 * offer is wrong often enough to matter: twenty-two in the chance scores
 * twenty-two and throws away the one box that will take any roll later. So a
 * box is weighed by what it scores **now** against what it is usually worth
 * kept - and since a bad roll has to go somewhere, the cheapest box to give up
 * falls out of the same sum.
 *
 * Deliberately a plain function of the state, with no randomness of its own.
 */
import {
  BONUS_TARGET,
  DIE_FACES,
  UPPER,
  faceCounts,
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

/** A run this long is worth keeping for a straight. */
const STRAIGHT_FROM = 4;

/** Three of a face is what earns the upper half its bonus. */
const BONUS_PACE = 3;

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
 * @remarks
 * Keeping everything is also how the computer says it wants to stop: with
 * nothing left to throw, the next move is writing the roll down.
 */
function keepMask(game: KniffelGame, sheet: Sheet): readonly boolean[] {
  const counts = faceCounts(game.dice);
  const run = straightWanted(sheet, counts);
  let mask: readonly boolean[];
  if (run !== null) {
    // One die per face of the run - a second five adds nothing to a straight.
    const used = new Set<number>();
    mask = game.dice.map((die) => {
      const keep = run.includes(die) && !used.has(die);
      used.add(die);
      return keep;
    });
  } else {
    const face = bestFace(counts);
    mask = game.dice.map((die) => die === face);
  }
  return mask;
}

/**
 * The faces to keep for a straight, if one is worth chasing.
 *
 * @remarks
 * Only with four of a run already on the table and a straight box still free.
 * Chasing one from three dice is how a turn ends in a nought.
 */
function straightWanted(
  sheet: Sheet,
  counts: readonly number[],
): readonly number[] | null {
  const wants = sheet.kleineStrasse === null || sheet.grosseStrasse === null;
  let run: number[] = [];
  let best: number[] = [];
  for (let face = 1; face <= DIE_FACES; face++) {
    run = counts[face] > 0 ? [...run, face] : [];
    best = run.length > best.length ? run : best;
  }
  return wants && best.length >= STRAIGHT_FROM ? best : null;
}

/** The face worth collecting: the commonest, and the higher one on a tie. */
function bestFace(counts: readonly number[]): number {
  let best = 1;
  for (let face = 1; face <= DIE_FACES; face++) {
    const better =
      counts[face] > counts[best] ||
      (counts[face] === counts[best] && face > best);
    if (better) {
      best = face;
    }
  }
  return best;
}

/** Which box to write this roll into. */
function bestBox(game: KniffelGame, sheet: Sheet): Category {
  const free = freeBoxes(sheet);
  let best = free[0];
  let bestWorth = -Infinity;
  for (const category of free) {
    const points = scoreOf(game.dice, category);
    const worth =
      points - KEEPING_WORTH[category] + bonusPull(sheet, category, points);
    if (worth > bestWorth) {
      best = category;
      bestWorth = worth;
    }
  }
  return best;
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
