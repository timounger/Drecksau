/**
 * The computer opponent.
 *
 * @module
 * @remarks
 * The whole game is one question - **do I dare draw?** - and everything the
 * machine does is an answer to it. It looks at what it knows about the top of
 * the pile, and if that is bad news it spends a card to avoid drawing; if it is
 * good news, or it knows nothing, it draws.
 *
 * One rule it keeps without exception: it never looks at anything it would not
 * be allowed to see. It reads its own hand, its own Blick in die Zukunft, the
 * discard pile and the **sizes** of the other hands - and nothing else. Where
 * it needs to know how likely a kitten is, it counts the way a player at the
 * table counts: kittens still unaccounted for, over cards still in the pile.
 */
import type { Card, CardKind } from "./cards";
import { comboOf } from "./moves";
import { createRandom, randomInt } from "./random";
import {
  COMBO_NAME,
  COMBO_STEAL,
  isAlive,
  livingSeats,
  type ExplodingKittensGame,
  type ExplodingKittensMove,
  type Player,
} from "./state";

/**
 * How dearly it holds each card, least precious first.
 *
 * @remarks
 * A cat card on its own is worth nothing, so it goes first when something has
 * to be handed over. An Entschärfung is worth more than anything else in the
 * deck, because it is the only card that answers the only question.
 */
const WORTH: Readonly<Record<CardKind, number>> = {
  tacocat: 1,
  rainbow: 1,
  melon: 1,
  potato: 1,
  beard: 1,
  shuffle: 3,
  future: 4,
  favor: 4,
  attack: 6,
  skip: 6,
  nope: 7,
  defuse: 10,
  kitten: 0,
};

/** Above this chance of a kitten, it would rather not draw at all. */
const SCARY = 0.34;

/** The hand size above which it starts spending cards on stealing. */
const RICH_HAND = 6;

/** The hand size at or below which it starts asking other people for cards. */
const THIN_HAND = 4;

/** How often it looks into the future when it has no idea what is coming. */
const PEEK_ONE_IN = 3;

/** How often it uses a Nö! it could use. */
const NOPE_ONE_IN = 2;

/** Where a defused kitten goes back: this many cards from the top, at most. */
const HIDE_DEPTH = 4;

/** The shortest the computer ever pauses before acting, in milliseconds. */
const MIN_WAIT_MS = 500;

/** How much longer it may take, so two moves never look mechanical. */
const WAIT_SPREAD_MS = 180;

/** How many pauses it picks between. */
const WAIT_STEPS = 4;

/**
 * The move the computer makes for the seat it is asked about.
 *
 * @param game - the current game
 * @param seat - the seat to play
 * @returns a move, or null when there is nothing for that seat to do
 */
export function aiMove(
  game: ExplodingKittensGame,
  seat: number,
): ExplodingKittensMove | null {
  let move: ExplodingKittensMove | null = null;
  if (game.phase === "nope") {
    move = answerWindow(game, seat);
  } else if (game.phase === "favor") {
    move = handOver(game, seat);
  } else if (game.phase === "insert") {
    move = hideKitten(game, seat);
  } else if (game.phase === "play" && game.active === seat) {
    move = takeTurn(game, seat);
  }
  return move;
}

/**
 * Its turn: dodge the pile if it looks bad, otherwise get on with it.
 *
 * @remarks
 * The order is the order of what the cards cost. Stealing and peeking are
 * cheap and only happen when there is room for them; the cards that end a turn
 * outright are spent only when drawing really does look like a bad idea.
 */
function takeTurn(
  game: ExplodingKittensGame,
  seat: number,
): ExplodingKittensMove {
  const player = game.players[seat];
  const danger = kittenChance(game, player);
  return (
    steal(game, seat) ??
    beg(game, seat) ??
    peek(game, player, danger) ??
    dodge(game, player, danger) ?? { kind: "draw" }
  );
}

/**
 * How likely the next card is a kitten, as far as this seat can tell.
 *
 * @remarks
 * A seen top card is certainty, in both directions: a kitten on top means
 * "dodge at any cost", and anything else on top means the next draw is free.
 * Without a peek it is the plain count a person at the table would do.
 */
function kittenChance(game: ExplodingKittensGame, player: Player): number {
  const seen = player.peek?.[0];
  let chance: number;
  if (seen !== undefined) {
    chance = seen.kind === "kitten" ? 1 : 0;
  } else if (game.draw.length === 0) {
    chance = 0;
  } else {
    // Kittens that have neither gone off nor been laid to rest are still in
    // there somewhere. Nothing here looks at the pile itself.
    const dead = game.players.filter((entry) => !isAlive(entry)).length;
    const left = Math.max(0, game.players.length - 1 - dead);
    chance = left / game.draw.length;
  }
  return chance;
}

/** Spend a pair or a triple, when the hand can afford it. */
function steal(
  game: ExplodingKittensGame,
  seat: number,
): ExplodingKittensMove | null {
  const player = game.players[seat];
  const victim = fattestOther(game, seat);
  const set = matchingSet(player.hand);
  let move: ExplodingKittensMove | null = null;
  if (
    victim !== null &&
    set !== null &&
    // Only out of a hand that can spare the cards; a thin hand needs every one
    // of them for the one question this game asks.
    player.hand.length > RICH_HAND &&
    game.players[victim].hand.length > 0
  ) {
    const ids = set.map((card) => card.id);
    move =
      comboOf(set) === "name"
        ? { kind: "combo", cardIds: ids, target: victim, want: "defuse" }
        : { kind: "combo", cardIds: ids, target: victim };
  }
  return move;
}

/**
 * The best set of same-named cards in a hand.
 *
 * @returns three of a kind if there is one, else a pair, else null
 * @remarks
 * Never made out of Entschärfungen. Trading two of the only card that saves
 * your life for one random card is a way to lose, not a combo.
 */
function matchingSet(hand: readonly Card[]): readonly Card[] | null {
  const kinds = [...new Set(hand.map((card) => card.kind))].filter(
    (kind) => kind !== "defuse" && kind !== "hidden",
  );
  const sets = kinds
    .map((kind) => hand.filter((card) => card.kind === kind))
    .filter((cards) => cards.length >= COMBO_STEAL)
    .sort((left, right) => right.length - left.length);
  const best = sets[0];
  return best === undefined
    ? null
    : best.slice(0, best.length >= COMBO_NAME ? COMBO_NAME : COMBO_STEAL);
}

/**
 * Ask somebody for a card, when the hand has got thin.
 *
 * @remarks
 * A Gefallen trades one card for one card, so it costs nothing but the card
 * itself - and the one it brings back might be an Entschärfung. Worth doing
 * when there is little left to lose, pointless when the hand is already full of
 * better answers.
 */
function beg(
  game: ExplodingKittensGame,
  seat: number,
): ExplodingKittensMove | null {
  const player = game.players[seat];
  const card = player.hand.find((entry) => entry.kind === "favor");
  const victim = fattestOther(game, seat);
  return card !== undefined &&
    victim !== null &&
    player.hand.length <= THIN_HAND &&
    game.players[victim].hand.length > 0
    ? { kind: "play", cardId: card.id, target: victim }
    : null;
}

/** Look at the pile when it has no idea and the odds are not comfortable. */
function peek(
  game: ExplodingKittensGame,
  player: Player,
  danger: number,
): ExplodingKittensMove | null {
  const card = player.hand.find((entry) => entry.kind === "future");
  const worth = player.peek === null && danger > 0 && danger < 1;
  return card !== undefined && worth && oneIn(game, PEEK_ONE_IN)
    ? { kind: "play", cardId: card.id }
    : null;
}

/**
 * Get out of drawing, if it is worth a card.
 *
 * @remarks
 * Angriff before Aussetzen, because it costs the same card and hands the next
 * player two turns instead of one. Mischen last: it only helps when the top
 * card is known to be bad, and it is the one dodge that does not end the turn -
 * after it, the seat is asked again and will usually just draw.
 */
function dodge(
  game: ExplodingKittensGame,
  player: Player,
  danger: number,
): ExplodingKittensMove | null {
  const find = (kind: CardKind) =>
    player.hand.find((card) => card.kind === kind);
  const shuffleOut = danger >= 1 ? find("shuffle") : undefined;
  const escape = find("attack") ?? find("skip");
  let move: ExplodingKittensMove | null = null;
  if (danger < SCARY) {
    move = null;
  } else if (escape !== undefined) {
    move = { kind: "play", cardId: escape.id };
  } else if (shuffleOut !== undefined) {
    move = { kind: "play", cardId: shuffleOut.id };
  }
  return move;
}

/**
 * Answering an open window.
 *
 * @remarks
 * It only ever nopes what is aimed at **it** - an Angriff about to land on its
 * turn, or a theft out of its own hand. A Nö! spent defending somebody else is
 * a Nö! that is not there when the Angriff comes.
 */
function answerWindow(
  game: ExplodingKittensGame,
  seat: number,
): ExplodingKittensMove {
  const pending = game.pending;
  const nope = game.players[seat].hand.find((card) => card.kind === "nope");
  let move: ExplodingKittensMove = { kind: "letThrough" };
  if (
    nope !== undefined &&
    pending !== null &&
    aimedAt(game, pending, seat) &&
    oneIn(game, NOPE_ONE_IN)
  ) {
    move = { kind: "nope", cardId: nope.id };
  }
  return move;
}

/** Whether the action on the table would hurt this seat in particular. */
function aimedAt(
  game: ExplodingKittensGame,
  pending: NonNullable<ExplodingKittensGame["pending"]>,
  seat: number,
): boolean {
  const action = pending.action;
  let mine: boolean;
  if (action.kind === "combo") {
    mine = action.target === seat;
  } else if (action.card.kind === "favor") {
    mine = action.target === seat;
  } else if (action.card.kind === "attack") {
    // The turns land on whoever comes after the attacker, which may be anybody.
    mine = nextAlive(game, pending.by) === seat;
  } else {
    mine = false;
  }
  return mine;
}

/** Answering a Gefallen: part with the least useful thing in the hand. */
function handOver(
  game: ExplodingKittensGame,
  seat: number,
): ExplodingKittensMove | null {
  const worst = [...game.players[seat].hand].sort(
    (left, right) => worthOf(left) - worthOf(right),
  )[0];
  return worst === undefined ? null : { kind: "give", cardId: worst.id };
}

/**
 * Putting a defused kitten back.
 *
 * @remarks
 * Near the top, where it will do some good, but not always on it. Always the
 * very top would be both the strongest play and an unbearable one to sit
 * across from: every defuse would kill the next player outright.
 */
function hideKitten(
  game: ExplodingKittensGame,
  seat: number,
): ExplodingKittensMove | null {
  const depth = Math.min(HIDE_DEPTH, game.draw.length);
  return game.active === seat
    ? { kind: "insert", at: randomInt(spread(game), depth + 1) }
    : null;
}

// ------------------------------------------------------------------ helpers

/** The living opponent with the most cards - the one worth robbing. */
function fattestOther(game: ExplodingKittensGame, seat: number): number | null {
  const others = livingSeats(game).filter((other) => other !== seat);
  const best = others.sort(
    (left, right) =>
      game.players[right].hand.length - game.players[left].hand.length,
  )[0];
  return best === undefined ? null : best;
}

/** The next living seat after this one. */
function nextAlive(game: ExplodingKittensGame, from: number): number {
  const count = game.players.length;
  let seat = from;
  let guard = 0;
  do {
    seat = (seat + 1) % count;
    guard++;
  } while (!isAlive(game.players[seat]) && guard <= count);
  return seat;
}

/** Roughly what a card is worth to the computer. */
function worthOf(card: Card): number {
  return card.kind === "hidden" ? 0 : WORTH[card.kind];
}

/** True about one time in `odds`, and differently each turn. */
function oneIn(game: ExplodingKittensGame, odds: number): boolean {
  return randomInt(spread(game), odds) === 0;
}

/**
 * A generator that has moved on since the last question.
 *
 * @remarks
 * Seeded from the log as well as the cursor. The cursor only turns when cards
 * are shuffled or stolen at random, so on its own it would answer several
 * questions in a row identically - and a machine that decides "shall I nope
 * this" the same way three times running is not deciding.
 */
function spread(game: ExplodingKittensGame) {
  return createRandom(game.rng + game.log.length);
}

/**
 * How long the computer waits before acting, in milliseconds.
 *
 * @param game - the game
 * @returns the pause, so a watcher can follow what happened
 */
export function botWaitMs(game: ExplodingKittensGame): number {
  return MIN_WAIT_MS + randomInt(spread(game), WAIT_STEPS) * WAIT_SPREAD_MS;
}
