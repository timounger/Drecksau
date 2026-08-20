/**
 * The computer opponent.
 *
 * @module
 * @remarks
 * Its plan is the one this game rewards: **get rid of the cheap cards and keep
 * the expensive ones**. So it lays the lowest card that will do while the table
 * is going up, the highest that will do once a 5 has turned it round, and it
 * only reaches for an action card when no number of its own fits.
 *
 * One rule it keeps without exception: it never looks at anything it would not
 * be allowed to see. It reads its own hand, its own open row, the pot and the
 * piles' sizes - and it plays a covered card by naming a **slot**, exactly like
 * a person reaching for one face down. Everything else in the state is there
 * because the state is the whole table, not because this is allowed to use it.
 *
 * It plays one move at a time and is asked again, exactly like a person - so
 * the same function serves the game against the computer and a seat online
 * whose player has gone.
 */
import { HIGHEST_VALUE, type ActionKind, type Card } from "./cards";
import { canPlayValue, jumpInIds, playableUp, topRun } from "./moves";
import { createRandom, randomInt } from "./random";
import {
  filled,
  freedSlots,
  type JammerlappenGame,
  type JammerlappenMove,
  type Player,
} from "./state";

/**
 * How dearly the computer holds each action card, least precious first.
 *
 * @remarks
 * "Dein Problem!" buys nothing but a card fewer, so it goes first. "Weg damit!"
 * makes a whole pot vanish and is the card you want in your hand when the pot
 * has grown to twenty - so it goes last, and often not at all.
 */
const ACTION_WORTH: Readonly<Record<ActionKind, number>> = {
  problem: 1,
  skip: 2,
  reverse: 3,
  restart: 4,
  burn: 5,
};

/** What an action card is worth next to a number, when choosing what to keep. */
const ACTION_BASE = 20;

/**
 * How often it lays its second choice instead of its first - one turn in this
 * many.
 *
 * @remarks
 * Not a flourish. Two machines that answer every position exactly the same way
 * will, once the draw pile is empty, quite happily pass the same four cards
 * back and forth until the browser is closed - the rules have no move that
 * forces progress and nothing in the state has to change. A player who now and
 * then lays the eight instead of the seven cannot fall into that, and neither
 * can a table of them.
 */
const WOBBLE_ONE_IN = 6;

/** The shortest the computer ever pauses before acting, in milliseconds. */
const MIN_WAIT_MS = 450;

/** How much longer it may take, so two moves never look mechanical. */
const WAIT_SPREAD_MS = 150;

/** How many pauses it picks between. */
const WAIT_STEPS = 4;

/**
 * How fast the computer is off the mark when it can throw in out of turn.
 *
 * @remarks
 * Deliberately not instant. Zwischenschmeißen is a race - "du musst jedoch
 * schnell sein" - and a computer that always won it would turn a rule about
 * reflexes into a rule about being a computer.
 */
const JUMP_MIN_MS = 700;

/** How much slower off the mark it may be. */
const JUMP_SPREAD_MS = 500;

/**
 * The move the computer makes for the seat it is asked about.
 *
 * @param game - the current game
 * @param seat - the seat to play
 * @returns a move, or null when there is nothing for that seat to do
 */
export function aiMove(
  game: JammerlappenGame,
  seat: number,
): JammerlappenMove | null {
  let move: JammerlappenMove | null = null;
  if (game.phase === "swap") {
    move = swapMove(game, seat);
  } else if (game.phase === "play") {
    move =
      seat === game.active ? turnMove(game, seat) : throwInMove(game, seat);
  }
  return move;
}

/**
 * The one swap before the first card.
 *
 * @remarks
 * The open cards are played last, when the pot is at its most dangerous and
 * there is nothing left to choose from - so the best card goes up there and the
 * worst comes down into the hand, where there is still time to get rid of it.
 */
function swapMove(
  game: JammerlappenGame,
  seat: number,
): JammerlappenMove | null {
  const player = game.players[seat];
  const best = strongest(player.hand);
  const worst = weakest(filled(player.up));
  let move: JammerlappenMove | null = null;
  if (player.ready) {
    move = null;
  } else if (best !== null && worst !== null && worth(best) > worth(worst)) {
    move = { kind: "swap", handId: best.id, upId: worst.id };
  } else {
    move = { kind: "ready" };
  }
  return move;
}

/** Its turn: hand first, then the open row, then a covered card, then the pot. */
function turnMove(
  game: JammerlappenGame,
  seat: number,
): JammerlappenMove | null {
  const player = game.players[seat];
  return player.hand.length > 0
    ? fromHand(game, player)
    : fromTable(game, player);
}

/** Playing out of the hand, or giving up and taking the pot. */
function fromHand(game: JammerlappenGame, player: Player): JammerlappenMove {
  const quartet = finisher(game, player.hand);
  const numbers = cheapestNumbers(game, player.hand);
  const action = cheapestAction(player.hand);
  let move: JammerlappenMove;
  if (quartet !== null) {
    // A quartet takes the whole pot out of the game - nothing else is worth
    // more, whatever it costs in cards.
    move = { kind: "play", cardIds: quartet };
  } else if (numbers !== null) {
    move = { kind: "play", cardIds: numbers };
  } else if (action !== null) {
    // Laying anything beats taking the pot: the object of the game is to be
    // rid of cards, and the pot is the only thing that hands them back.
    move = { kind: "play", cardIds: [action.id] };
  } else {
    move = { kind: "takePot" };
  }
  return move;
}

/** Hand empty: an open card if one fits, else a gamble, else the forced lay. */
function fromTable(
  game: JammerlappenGame,
  player: Player,
): JammerlappenMove | null {
  const open = filled(player.up);
  const quartet = finisher(game, open);
  const numbers = cheapestNumbers(game, open);
  const action = cheapestAction(playableUp(game, player));
  const blind = freedSlots(player);
  const stuck = open[0];
  let move: JammerlappenMove | null;
  if (quartet !== null) {
    move = { kind: "play", cardIds: quartet };
  } else if (numbers !== null) {
    move = { kind: "play", cardIds: numbers };
  } else if (action !== null) {
    move = { kind: "play", cardIds: [action.id] };
  } else if (blind.length > 0) {
    // A blind card might fit; an open card that does not fit certainly costs
    // the pot. The gamble is the better of the two every time.
    move = { kind: "playDown", slot: blind[0] };
  } else if (stuck !== undefined) {
    // Nothing fits and nothing is left to turn over: lay one anyway and take
    // the pot with it, which is what the rules say has to happen.
    move = { kind: "play", cardIds: [stuck.id] };
  } else {
    // No cards anywhere - this seat is already home and should not be on turn.
    move = null;
  }
  return move;
}

/** Throwing in out of turn, when the quartet is there for the taking. */
function throwInMove(
  game: JammerlappenGame,
  seat: number,
): JammerlappenMove | null {
  const ids = jumpInIds(game, seat);
  return ids === null ? null : { kind: "play", cardIds: ids };
}

/**
 * The cards that would finish the quartet on the pot, out of this set.
 *
 * @param game - the current game
 * @param cards - the cards available to lay
 * @returns the ids to lay, or null when the quartet is out of reach
 */
function finisher(
  game: JammerlappenGame,
  cards: readonly Card[],
): readonly string[] | null {
  const run = topRun(game);
  let ids: readonly string[] | null = null;
  if (run !== null && run.length < game.copies) {
    const need = game.copies - run.length;
    const matches = cards.filter(
      (card) => card.kind === "number" && card.value === run.value,
    );
    ids =
      matches.length >= need
        ? matches.slice(0, need).map((card) => card.id)
        : null;
  }
  return ids;
}

/**
 * The least useful legal number, and every copy of it worth laying with it.
 *
 * @param game - the current game
 * @param cards - the cards available to lay
 * @returns the ids to lay, or null when no number fits
 * @remarks
 * Which number is "least useful" turns around with the table: while the pot is
 * climbing, a 2 is the card you cannot get rid of later, and once a 5 has sent
 * it downwards it is the 11 that has become worthless.
 *
 * Copies only go down together once the draw pile is empty. Before that, laying
 * three sevens buys nothing - the hand is topped straight back up to three -
 * while keeping them is a quartet somebody may hand you later.
 */
function cheapestNumbers(
  game: JammerlappenGame,
  cards: readonly Card[],
): readonly string[] | null {
  const legal = cards.filter(
    (card) => card.kind === "number" && canPlayValue(game, card.value),
  );
  // Going down, a low card is the treasure and a high one the dead weight - so
  // what counts as cheap is turned round with the table.
  const cost = (card: Card) =>
    card.kind === "number" && game.descending
      ? HIGHEST_VALUE - card.value
      : worth(card);
  const values = [...new Set(legal.map((card) => cost(card)))].sort(
    (left, right) => left - right,
  );
  const wanted = values[wobbles(game) && values.length > 1 ? 1 : 0];
  const chosen = legal.find((card) => cost(card) === wanted) ?? null;
  let ids: readonly string[] | null = null;
  if (chosen !== null && chosen.kind === "number") {
    const value = chosen.value;
    const copies = legal.filter(
      (card) => card.kind === "number" && card.value === value,
    );
    ids = game.draw.length === 0 ? copies.map((card) => card.id) : [chosen.id];
  }
  return ids;
}

/** The action card it would part with most easily, out of this set. */
function cheapestAction(cards: readonly Card[]): Card | null {
  return cards
    .filter((card) => card.kind === "action")
    .reduce<Card | null>(
      (best, card) =>
        best === null || worth(card) < worth(best) ? card : best,
      null,
    );
}

/** The card it would most like to have lying face up. */
function strongest(cards: readonly Card[]): Card | null {
  return cards.reduce<Card | null>(
    (best, card) => (best === null || worth(card) > worth(best) ? card : best),
    null,
  );
}

/** The card it would most like to be rid of. */
function weakest(cards: readonly Card[]): Card | null {
  return cards.reduce<Card | null>(
    (best, card) => (best === null || worth(card) < worth(best) ? card : best),
    null,
  );
}

/**
 * Roughly what a card is worth to the computer.
 *
 * @param card - the card
 * @returns the higher the number, the longer it wants to keep it
 * @remarks
 * Every action card outranks every number, because an action card is the one
 * thing that can always be laid - and being unable to lay is the only way to
 * lose ground in this game.
 */
function worth(card: Card): number {
  let value: number;
  if (card.kind === "action") {
    value = ACTION_BASE + ACTION_WORTH[card.action];
  } else if (card.kind === "number") {
    value = card.value;
  } else {
    // A card back never reaches the computer - it only ever plays its own.
    value = 0;
  }
  return value;
}

/**
 * How long the computer waits before acting, in milliseconds.
 *
 * @param game - the game
 * @returns the pause, so a watcher can follow what happened
 */
export function botWaitMs(game: JammerlappenGame): number {
  return MIN_WAIT_MS + step(game) * WAIT_SPREAD_MS;
}

/**
 * How long the computer takes to spot a Zwischenschmeiß, in milliseconds.
 *
 * @param game - the game
 * @returns the pause before it throws in
 */
export function jumpWaitMs(game: JammerlappenGame): number {
  return JUMP_MIN_MS + step(game) * JUMP_SPREAD_MS;
}

/**
 * A small number that varies with the game, so two pauses differ.
 *
 * @remarks
 * The log length is mixed in on purpose. The generator's cursor only moves when
 * cards are actually drawn, and once the Aufnahmestapel is empty it never moves
 * again - from which point every pause would be exactly the same length.
 */
function step(game: JammerlappenGame): number {
  return randomInt(createRandom(game.rng + game.log.length), WAIT_STEPS);
}

/**
 * Whether this turn is one of the ones it plays a little differently.
 *
 * @remarks
 * Counted off the log rather than the generator, for the same reason: the
 * generator stops moving when the last card is drawn, and it is exactly after
 * that point that a table of identical machines has to stop being identical.
 */
function wobbles(game: JammerlappenGame): boolean {
  return (
    randomInt(createRandom(game.rng + game.log.length), WOBBLE_ONE_IN) === 0
  );
}
