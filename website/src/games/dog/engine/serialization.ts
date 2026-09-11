/**
 * Checking a game and a move that come back from storage or off the wire.
 *
 * @module
 * @remarks
 * Shape, not legality. A board with two pieces on one field is not this
 * module's problem - the referee never produced one, and the referee is what
 * every move goes through anyway. What these guards insist on is that every
 * field is there and of the right kind, so that the rest of the game may read a
 * state without asking twice.
 */
import {
  HOME_DEPTH,
  MAX_SEATS,
  MIN_SEATS,
  piecesPerSeat,
  ringSize,
  type Piece,
} from "./board";
import { RANKS, type Card } from "./cards";
import {
  PHASES,
  type DogGame,
  type DogMove,
  type DogPlayer,
  type Step,
} from "./state";

/** The kinds of move there are. */
const MOVE_KINDS: readonly string[] = ["give", "play", "fold", "redraw"];

/** The kinds of act there are. */
const ACT_KINDS: readonly string[] = ["start", "walk", "swap", "seven", "none"];

/**
 * Checks an unknown value really is a game of Dog.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isDogGame(value: unknown): value is DogGame {
  const game = value as DogGame;
  const seats = game?.seats;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    Number.isInteger(seats) &&
    seats >= MIN_SEATS &&
    seats <= MAX_SEATS &&
    Array.isArray(game.players) &&
    game.players.length === seats &&
    game.players.every((player) => isPlayer(player)) &&
    Array.isArray(game.pieces) &&
    game.pieces.length === seats * piecesPerSeat(seats) &&
    game.pieces.every((piece) => isPiece(piece, seats)) &&
    areCards(game.deck) &&
    areCards(game.pile) &&
    isSeat(game.turn, seats) &&
    isSeat(game.dealer, seats) &&
    Number.isInteger(game.handSize) &&
    Number.isInteger(game.round) &&
    typeof game.redrew === "boolean" &&
    Array.isArray(game.given) &&
    game.given.length === seats &&
    game.given.every((card) => card === null || Number.isInteger(card)) &&
    Array.isArray(game.out) &&
    game.out.length === seats &&
    game.out.every((each) => typeof each === "boolean") &&
    Number.isFinite(game.rng) &&
    Array.isArray(game.log) &&
    Array.isArray(game.winners) &&
    game.winners.every((seat) => isSeat(seat, seats))
  );
}

/**
 * Checks an unknown value really is a move.
 *
 * @param value - the value that came in
 * @returns true if it is a move this game knows
 */
export function isDogMove(value: unknown): value is DogMove {
  const move = value as DogMove;
  return (
    isObject(value) &&
    MOVE_KINDS.includes(move.kind) &&
    (move.kind !== "give" || Number.isInteger(move.card)) &&
    (move.kind !== "redraw" || Number.isInteger(move.card)) &&
    (move.kind !== "play" ||
      (Number.isInteger(move.card) &&
        RANKS.includes(move.as) &&
        isAct(move.act)))
  );
}

/** Whether this is a player. */
function isPlayer(value: unknown): value is DogPlayer {
  const player = value as DogPlayer;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.isBot === "boolean" &&
    areCards(player.hand)
  );
}

/** Whether this is a piece standing somewhere it could stand. */
function isPiece(value: unknown, seats: number): value is Piece {
  const piece = value as Piece;
  const spot = piece?.spot;
  return (
    isObject(value) &&
    Number.isInteger(piece.id) &&
    isSeat(piece.seat, seats) &&
    isObject(spot) &&
    (spot.zone === "kennel" ||
      (spot.zone === "ring" &&
        Number.isInteger(spot.field) &&
        spot.field >= 0 &&
        spot.field < ringSize(seats)) ||
      (spot.zone === "home" &&
        Number.isInteger(spot.slot) &&
        spot.slot >= 0 &&
        spot.slot < HOME_DEPTH))
  );
}

/** Whether this is what a card does when it is played. */
function isAct(value: unknown): boolean {
  const act = value as { kind: string; parts?: readonly Step[] };
  return (
    isObject(value) &&
    ACT_KINDS.includes(act.kind) &&
    (act.kind !== "seven" ||
      (Array.isArray(act.parts) && act.parts.every((part) => isStep(part))))
  );
}

/** Whether this is one part of a seven. */
function isStep(value: unknown): value is Step {
  const step = value as Step;
  return (
    isObject(value) &&
    Number.isInteger(step.piece) &&
    Number.isInteger(step.steps) &&
    typeof step.home === "boolean"
  );
}

/** Whether this is a pile of cards. */
function areCards(value: unknown): value is readonly Card[] {
  return Array.isArray(value) && value.every((card) => isCard(card));
}

/** Whether this is a card of the pack. */
function isCard(value: unknown): value is Card {
  const card = value as Card;
  return (
    isObject(value) && Number.isInteger(card.id) && RANKS.includes(card.rank)
  );
}

/** Whether this is a seat at this table. */
function isSeat(value: unknown, seats: number): boolean {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) < seats
  );
}

/** Whether this is an object at all. */
function isObject(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}
