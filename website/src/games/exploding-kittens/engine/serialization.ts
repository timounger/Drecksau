/**
 * Checking a game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so it survives a round trip unchanged - but what
 * comes back may be from an older version, hand-edited or simply broken. This
 * guard is the one place that decides whether to trust it.
 *
 * It checks shape, not legality. A game where somebody holds thirty cards is
 * not this module's problem: the referee never produced it, and no move will
 * make it worse.
 */
import { KINDS, type Card } from "./cards";
import type { Action, ExplodingKittensGame, Pending, Player } from "./state";

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = [
  "play",
  "nope",
  "favor",
  "insert",
  "gameOver",
];

/**
 * Checks an unknown value really is a game of Exploding Kittens.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isExplodingKittensGame(
  value: unknown,
): value is ExplodingKittensGame {
  const game = value as ExplodingKittensGame;
  const seats = Array.isArray(game?.players) ? game.players.length : 0;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    seats > 0 &&
    game.players.every((player) => isPlayer(player, seats)) &&
    isSeat(game.active, seats) &&
    Number.isInteger(game.turnsOwed) &&
    game.turnsOwed >= 1 &&
    typeof game.underAttack === "boolean" &&
    isCards(game.draw) &&
    isCards(game.discard) &&
    isPending(game.pending, seats) &&
    isDemand(game.demand, seats) &&
    (game.kitten === null || isCard(game.kitten)) &&
    Number.isFinite(game.rng) &&
    Number.isFinite(game.seed) &&
    Array.isArray(game.log)
  );
}

/** Whether this is a player. */
function isPlayer(value: unknown, seats: number): value is Player {
  const player = value as Player;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.isBot === "boolean" &&
    isCards(player.hand) &&
    (player.peek === null || isCards(player.peek)) &&
    (player.place === null || isSeat(player.place, seats))
  );
}

/** Whether a waiting action makes sense. */
function isPending(value: unknown, seats: number): boolean {
  const pending = value as Pending;
  return (
    value === null ||
    (isObject(value) &&
      isAction(pending.action, seats) &&
      isSeat(pending.by, seats) &&
      isSeat(pending.lastBy, seats) &&
      Number.isInteger(pending.nopes) &&
      Array.isArray(pending.passed) &&
      pending.passed.every((seat) => isSeat(seat, seats)))
  );
}

/** Whether this is something somebody could have played. */
function isAction(value: unknown, seats: number): boolean {
  const action = value as Action;
  let ok = false;
  if (isObject(value) && action.kind === "card") {
    ok =
      isCard(action.card) &&
      (action.target === undefined || isSeat(action.target, seats));
  } else if (isObject(value) && action.kind === "combo") {
    ok =
      isCards(action.cards) &&
      isSeat(action.target, seats) &&
      (action.want === undefined || KINDS.includes(action.want));
  }
  return ok;
}

/** Whether an open Gefallen names two real seats. */
function isDemand(value: unknown, seats: number): boolean {
  const demand = value as NonNullable<ExplodingKittensGame["demand"]>;
  return (
    value === null ||
    (isObject(value) &&
      isSeat(demand.by, seats) &&
      isSeat(demand.target, seats))
  );
}

/** Whether this is a list of cards. */
function isCards(value: unknown): value is readonly Card[] {
  return Array.isArray(value) && value.every(isCard);
}

/** Whether this is a card. */
function isCard(value: unknown): value is Card {
  const card = value as Card;
  return (
    isObject(value) &&
    typeof card.id === "string" &&
    (card.kind === "hidden" || KINDS.includes(card.kind))
  );
}

/** Whether this is a seat number at this table. */
function isSeat(value: unknown, seats: number): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) < seats
  );
}

/** Whether this is an object at all. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
