/**
 * The computer players.
 *
 * @module
 * @remarks
 * Arschloch is a game of holding on and letting go, and a bot that only ever
 * plays its weakest legal answer would be a bot that never wins a trick when it
 * matters. So it plays the cheapest answer it has, with two exceptions it can
 * see from its own hand alone: it takes an empty table with its longest set of
 * weak cards, and it lets a small pile run rather than break up a pair to beat
 * it. Nothing here looks at anybody else's cards.
 */
import { sortHand, strengthOf, type Card, type Rank } from "./cards";
import { canPass, canPlay, seatOnTurn } from "./moves";
import {
  isOut,
  wishableIds,
  type ArschlochGame,
  type ArschlochMove,
} from "./state";

/** How long the computer appears to think, in milliseconds. */
const THINK_MS = 700;

/** Faster for the small steps: handing cards back and dealing the next round. */
const QUICK_MS = 260;

/**
 * How long to wait before playing the computer's move.
 *
 * @param game - the game
 * @returns the pause in milliseconds
 */
export function botWaitMs(game: ArschlochGame): number {
  return game.phase === "playing" ? THINK_MS : QUICK_MS;
}

/**
 * The computer's move for one seat.
 *
 * @param game - the game
 * @param seat - the seat to play for
 * @returns the move, or null when there is nothing to do
 */
export function aiMove(
  game: ArschlochGame,
  seat: number,
): ArschlochMove | null {
  let move: ArschlochMove | null = null;
  if (seatOnTurn(game) === seat) {
    switch (game.phase) {
      case "passing":
        move = beforeRound(game, seat);
        break;
      case "roundOver":
        move = { kind: "next" };
        break;
      case "playing":
        move = playing(game, seat);
        break;
      default:
        move = null;
    }
  }
  return move;
}

/**
 * The three things that happen before a round is played.
 *
 * @remarks
 * All three are the same decision seen from different sides: keep the good
 * cards. Dropped and handed back go the weakest, wished for the strongest the
 * other hand still has to offer.
 */
function beforeRound(game: ArschlochGame, seat: number): ArschlochMove {
  const owed = game.owed[0];
  const count = owed === undefined ? 0 : owed.count;
  let move: ArschlochMove;
  if (owed === undefined) {
    move = { kind: "pass" };
  } else if (owed.kind === "wish") {
    move = { kind: "wish", cards: bestOf(game, owed.to, count) };
  } else {
    move = { kind: owed.kind, cards: worstCards(game, seat, count) };
  }
  return move;
}

/**
 * The weakest cards of a hand.
 *
 * @remarks
 * What goes away when something has to: the leftovers of the deal, and the
 * cards handed back to the loser. Giving anything better away would be a
 * present, and this game has no room for those.
 */
function worstCards(
  game: ArschlochGame,
  seat: number,
  count: number,
): readonly string[] {
  return sortHand(game.players[seat].hand)
    .slice(0, count)
    .map((card) => card.id);
}

/**
 * The best cards a wish may take out of somebody else hand.
 *
 * @remarks
 * Only what the rules leave open: three of a rank are safe, and the referee
 * turns a wish for them down. What is left, the computer takes the top of -
 * this is the one moment in the game where it may simply help itself.
 */
function bestOf(
  game: ArschlochGame,
  seat: number,
  count: number,
): readonly string[] {
  const may = new Set(wishableIds(game, seat));
  return sortHand(game.players[seat].hand)
    .filter((card) => may.has(card.id))
    .slice(-count)
    .map((card) => card.id);
}

/** Playing a trick: answer if it is cheap, otherwise let it go. */
function playing(game: ArschlochGame, seat: number): ArschlochMove {
  const options = playable(game, seat);
  let move: ArschlochMove;
  if (options.length === 0) {
    move = canPass(game) ? { kind: "pass" } : { kind: "play", cards: [] };
  } else if (game.pile.length === 0) {
    move = { kind: "play", cards: opening(game, seat) };
  } else {
    const cheapest = options[0];
    move =
      worthIt(game, seat, cheapest) || !canPass(game)
        ? { kind: "play", cards: cheapest.map((card) => card.id) }
        : { kind: "pass" };
  }
  return move;
}

/**
 * Every legal answer, weakest first.
 *
 * @remarks
 * Sets of equal cards, built from the hand and filtered through the referee, so
 * the computer can never want something the rules do not allow.
 */
function playable(
  game: ArschlochGame,
  seat: number,
): readonly (readonly Card[])[] {
  const groups = byRank(game.players[seat].hand);
  const sets: (readonly Card[])[] = [];
  for (const group of groups) {
    for (let size = 1; size <= group.length; size += 1) {
      const cards = group.slice(0, size);
      if (canPlay(game, seat, idsOf(cards))) {
        sets.push(cards);
      }
    }
  }
  return sets.sort(
    (left, right) =>
      strengthOf(left[0].rank) - strengthOf(right[0].rank) ||
      left.length - right.length,
  );
}

/**
 * What to lead with on an empty table.
 *
 * @remarks
 * The longest set of the weakest rank it holds. Leading a set is the one moment
 * a player decides how the trick is played, and getting three low cards away in
 * one go is worth more than getting one away three times.
 */
function opening(game: ArschlochGame, seat: number): readonly string[] {
  const groups = byRank(game.players[seat].hand);
  const best = [...groups].sort(
    (left, right) =>
      right.length - left.length ||
      strengthOf(left[0].rank) - strengthOf(right[0].rank),
  )[0];
  return idsOf(best ?? []);
}

/**
 * Whether an answer is worth the cards it costs.
 *
 * @remarks
 * Two reasons to hold back, and both are about what is left afterwards: an Ass
 * spent on a Sieben is an Ass gone, and a pair broken up to beat a single card
 * is a pair gone. Late in a round neither matters any more - whoever is nearly
 * out plays whatever gets them out.
 */
function worthIt(
  game: ArschlochGame,
  seat: number,
  cards: readonly Card[],
): boolean {
  const hand = game.players[seat].hand;
  const nearlyOut = hand.length <= cards.length + 1;
  const breaksASet =
    hand.filter((card) => card.rank === cards[0].rank).length > cards.length;
  const tooGood =
    strengthOf(cards[0].rank) - strengthOf(game.pile[0].rank) > GAP;
  return nearlyOut || (!breaksASet && !tooGood);
}

/** How far above the pile a card may be before the bot keeps it. */
const GAP = 2;

/** The hand grouped by rank, each group weakest rank first. */
function byRank(hand: readonly Card[]): readonly (readonly Card[])[] {
  const groups = new Map<Rank, Card[]>();
  for (const card of sortHand(hand)) {
    groups.set(card.rank, [...(groups.get(card.rank) ?? []), card]);
  }
  return [...groups.values()];
}

/** The ids of a set of cards. */
function idsOf(cards: readonly Card[]): readonly string[] {
  return cards.map((card) => card.id);
}

/**
 * Whether a seat is played by the computer and still in the round.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns true when the computer should be asked for a move
 */
export function isBotTurn(game: ArschlochGame, seat: number): boolean {
  return game.players[seat].isBot && !isOut(game, seat);
}
