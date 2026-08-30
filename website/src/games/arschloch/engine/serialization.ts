/**
 * Checking a game and a move that come back from storage or off the wire.
 *
 * @module
 * @remarks
 * Shape, not legality. A hand holding the same card twice is not this module's
 * problem - the referee never produced it, and no move will make it worse. What
 * these guards insist on is that every field is there and of the right kind, so
 * the rest of the game can read the state without asking.
 */
import { RANKS, SUITS, type Card } from "./cards";
import {
  MOVE_KINDS,
  PHASES,
  type ArschlochGame,
  type ArschlochMove,
  type ArschlochPlayer,
  type Handover,
} from "./state";

/**
 * Checks an unknown value really is a game of Arschloch.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isArschlochGame(value: unknown): value is ArschlochGame {
  const game = value as ArschlochGame;
  const seats = Array.isArray(game?.players) ? game.players.length : 0;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    seats > 0 &&
    game.players.every((player) => isPlayer(player)) &&
    isSeat(game.active, seats) &&
    Array.isArray(game.pile) &&
    game.pile.every((card) => isCard(card)) &&
    (game.lead === null || isSeat(game.lead, seats)) &&
    Array.isArray(game.out) &&
    game.out.every((seat) => isSeat(seat, seats)) &&
    Number.isInteger(game.round) &&
    Number.isInteger(game.rounds) &&
    Array.isArray(game.owed) &&
    game.owed.every((owed) => isHandover(owed, seats)) &&
    Array.isArray(game.winners) &&
    game.winners.every((seat) => isSeat(seat, seats)) &&
    Number.isFinite(game.rng) &&
    Number.isFinite(game.seed) &&
    Array.isArray(game.log)
  );
}

/**
 * Checks an unknown value really is a move.
 *
 * @param value - the value that came in
 * @returns true if it is a move this game knows
 */
export function isArschlochMove(value: unknown): value is ArschlochMove {
  const move = value as ArschlochMove;
  return (
    isObject(value) &&
    MOVE_KINDS.includes(move.kind) &&
    (move.kind !== "play" || areIds(move.cards)) &&
    (move.kind !== "give" || areIds(move.cards))
  );
}

/** Whether this is a player. */
function isPlayer(value: unknown): value is ArschlochPlayer {
  const player = value as ArschlochPlayer;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.isBot === "boolean" &&
    Array.isArray(player.hand) &&
    player.hand.every((card) => isCard(card)) &&
    (player.title === null || typeof player.title === "string") &&
    Number.isFinite(player.score) &&
    typeof player.passed === "boolean"
  );
}

/** Whether this is a card of the pack. */
function isCard(value: unknown): value is Card {
  const card = value as Card;
  return (
    isObject(value) &&
    typeof card.id === "string" &&
    SUITS.includes(card.suit) &&
    RANKS.includes(card.rank)
  );
}

/** Whether this is a handover that names two seats. */
function isHandover(value: unknown, seats: number): value is Handover {
  const owed = value as Handover;
  return (
    isObject(value) &&
    isSeat(owed.from, seats) &&
    isSeat(owed.to, seats) &&
    Number.isInteger(owed.count) &&
    owed.count > 0
  );
}

/** Whether this is a list of card ids. */
function areIds(value: unknown): boolean {
  return (
    Array.isArray(value) && value.every((each) => typeof each === "string")
  );
}

/** Whether this is a seat number at this table. */
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
