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
import type { Card, CardKind } from "./cards";
import type { Flip7Game, Forced, Pending, Player } from "./state";

/** The stages a stored game may claim to be in. */
const STAGES: readonly string[] = ["deal", "turn", "roundEnd", "gameOver"];

/** How a player may claim to stand. */
const STANDINGS: readonly string[] = ["in", "stayed", "busted"];

/** The sorts of card there are. */
const KINDS: readonly string[] = [
  "number",
  "plus",
  "times",
  "freeze",
  "flip3",
  "second",
];

/**
 * Checks an unknown value really is a game of Flip 7.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isFlip7Game(value: unknown): value is Flip7Game {
  const game = value as Flip7Game;
  const seats = Array.isArray(game?.players) ? game.players.length : 0;
  return (
    isObject(value) &&
    STAGES.includes(game.stage) &&
    seats > 0 &&
    game.players.every(isPlayer) &&
    isSeat(game.active, seats) &&
    isSeat(game.dealer, seats) &&
    Number.isInteger(game.dealt) &&
    isCards(game.deck) &&
    isCards(game.discard) &&
    isPending(game.pending, seats) &&
    isForced(game.forced, seats) &&
    (game.flipped === null || isSeat(game.flipped, seats)) &&
    Number.isInteger(game.round) &&
    Number.isFinite(game.rng) &&
    Number.isFinite(game.seed) &&
    Array.isArray(game.log)
  );
}

/** Whether this is a player. */
function isPlayer(value: unknown): value is Player {
  const player = value as Player;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.isBot === "boolean" &&
    isCards(player.numbers) &&
    isCards(player.modifiers) &&
    (player.second === null || isCard(player.second)) &&
    STANDINGS.includes(player.standing) &&
    Number.isInteger(player.score) &&
    Number.isInteger(player.roundScore)
  );
}

/** Whether an action card is waiting for a target. */
function isPending(value: unknown, seats: number): boolean {
  const pending = value as Pending;
  return (
    value === null ||
    (isObject(value) && isCard(pending.card) && isSeat(pending.by, seats))
  );
}

/** Whether a Dreimal in progress makes sense. */
function isForced(value: unknown, seats: number): boolean {
  const forced = value as Forced;
  return (
    value === null ||
    (isObject(value) &&
      isSeat(forced.at, seats) &&
      Number.isInteger(forced.left) &&
      forced.left >= 0 &&
      isCards(forced.deferred))
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
    KINDS.includes(card.kind as CardKind) &&
    Number.isInteger(card.value)
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
