/**
 * The computer players: which card they lay down, and what they push across.
 *
 * @module
 * @remarks
 * No search tree. Dog is a game about a handful of decisions - get a piece out,
 * hit somebody, close the gap in the home - and each of those is worth a
 * different amount at a different moment. So every legal move is played out one
 * ply and the board that comes of it is scored: how far one's own side has
 * come, how far the others have, and what the card it cost was worth.
 *
 * That last term is what makes the bots feel like players rather than like a
 * hill climber: a joker spent on two fields is a joker gone, and a start card
 * kept while the kennel is full is a start card wasted. Both are in the price,
 * not in a special case.
 *
 * They do not pretend to think. A computer player that sits on its hands for a
 * second is a computer player that makes the human wait for nothing - the pause
 * belongs to a table, not to a screen.
 */
import {
  HOME_DEPTH,
  giftSeat,
  homeOf,
  ringSize,
  teamOf,
  teamPlay,
} from "./board";
import type { Rank } from "./cards";
import { applyMove, legalMoves, progressOf } from "./moves";
import type { DogGame, DogMove } from "./state";

/** What a piece safely home is worth, over and above how far it walked. */
const HOME_WORTH = 90;

/** What everybody else's progress counts against one's own. */
const THEIR_SHARE = 0.7;

/** What a piece still in the kennel costs, so getting out is worth something. */
const KENNEL_COST = 12;

/** What it is worth to stand on one's own start field and hold the door. */
const GUARD_WORTH = 6;

/** What each rank is worth kept in hand rather than spent. */
const KEEP: Readonly<Record<Rank, number>> = {
  joker: 34,
  A: 16,
  K: 14,
  "7": 18,
  J: 10,
  "4": 8,
  "2": 1,
  "3": 1,
  "5": 2,
  "6": 2,
  "8": 3,
  "9": 3,
  "10": 4,
  Q: 5,
};

/**
 * What the computer plays.
 *
 * @param game - the game as it stands
 * @param seat - the seat the computer sits in
 * @returns the move it makes, or null when it has none
 */
export function aiMove(game: DogGame, seat: number): DogMove | null {
  const moves = legalMoves(game, seat);
  let best: DogMove | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const move of moves) {
    const score = scoreOf(game, seat, move);
    if (score > bestScore) {
      best = move;
      bestScore = score;
    }
  }
  return best;
}

/**
 * How long the table waits before the computer moves.
 *
 * @returns nothing at all - it plays the moment it is asked
 * @remarks
 * Kept as a function rather than deleted, because the screen asks the game how
 * long to wait and a number that is nought is a clearer answer than a missing
 * one.
 */
export function botWaitMs(): number {
  return 0;
}

/** What one move is worth to the seat making it. */
function scoreOf(game: DogGame, seat: number, move: DogMove): number {
  let score = 0;
  if (move.kind === "give") {
    score = giveScore(game, seat, move.card);
  } else if (move.kind === "redraw") {
    // Nothing can be played, so the only question is which card to let go of:
    // the one that is worth least in hand.
    score = -KEEP[rankOf(game, seat, move.card)];
  } else {
    const after = applyMove(game, seat, move);
    const spent = move.kind === "play" ? KEEP[move.as] : 0;
    score =
      after === null
        ? Number.NEGATIVE_INFINITY
        : boardScore(after, seat) - boardScore(game, seat) - spent;
  }
  return score;
}

/**
 * How the board stands for one side.
 *
 * @param game - the board to judge
 * @param seat - whose side to judge it from
 * @returns a number that grows as that side gets closer to being home
 */
function boardScore(game: DogGame, seat: number): number {
  const ring = ringSize(game.seats);
  let ours = 0;
  let theirs = 0;
  for (const piece of game.pieces) {
    const worth =
      piece.spot.zone === "home"
        ? ring + HOME_WORTH + (HOME_DEPTH - piece.spot.slot)
        : piece.spot.zone === "kennel"
          ? -KENNEL_COST
          : progressOf(piece, ring) + guard(game, piece.id, ring);
    if (sameSide(game, piece.seat, seat)) {
      ours += worth;
    } else {
      theirs += worth;
    }
  }
  return ours - theirs * THEIR_SHARE;
}

/** Whether two seats are playing for the same side. */
function sameSide(game: DogGame, one: number, other: number): boolean {
  return teamPlay(game.seats)
    ? teamOf(one, game.seats) === teamOf(other, game.seats)
    : one === other;
}

/** What standing on one's own start field is worth. */
function guard(game: DogGame, id: number, ring: number): number {
  const piece = game.pieces.find((each) => each.id === id) ?? null;
  return piece !== null &&
    piece.spot.zone === "ring" &&
    progressOf(piece, ring) === 0
    ? GUARD_WORTH
    : 0;
}

/** What rank a card of a hand has. */
function rankOf(game: DogGame, seat: number, card: number): Rank {
  return game.players[seat]?.hand.find((each) => each.id === card)?.rank ?? "2";
}

/**
 * What pushing one card across is worth.
 *
 * @remarks
 * At a table with partners this is the only help the rules allow, and there is
 * one thing worth saying with it: a partner whose pieces are all in the kennel
 * needs a start card and nothing else. Where everybody plays alone the card
 * goes to a neighbour who is *not* on one's side - so it is simply the card one
 * wants least.
 */
function giveScore(game: DogGame, seat: number, card: number): number {
  const rank = rankOf(game, seat, card);
  const mate = giftSeat(seat, game.seats);
  const friendly = sameSide(game, mate, seat);
  const stuck = game.pieces
    .filter((piece) => piece.seat === mate)
    .every((piece) => piece.spot.zone === "kennel");
  const opensDoor = rank === "A" || rank === "K" || rank === "joker";
  const iNeedIt = game.pieces
    .filter((piece) => piece.seat === seat)
    .every((piece) => piece.spot.zone === "kennel");
  let score = -KEEP[rank];
  if (friendly && stuck && opensDoor && !iNeedIt) {
    // Their kennel is full and mine is not: the card is worth more over there.
    score = KEEP[rank];
  } else if (friendly && homeOf(game.pieces, mate) >= HOME_DEPTH) {
    // Everything of theirs is in; whatever they get, they play for me.
    score = -KEEP[rank] / 2;
  }
  return score;
}
