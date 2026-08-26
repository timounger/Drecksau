/**
 * Checking a game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so it survives a round trip unchanged - but what
 * comes back may be from an older version, hand-edited or simply broken. This
 * guard is the one place that decides whether to trust it.
 *
 * It checks shape, not legality. A game where somebody has grown two sorts on
 * one field is not this module's problem: the referee never produced it, and no
 * move will make it worse.
 */
import { BEANS, type Bean, type Card } from "./beans";
import type { BohnanzaGame, Offer, Phase, Player } from "./state";

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = ["plant", "trade", "settle", "gameOver"];

/**
 * Checks an unknown value really is a game of Bohnanza.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isBohnanzaGame(value: unknown): value is BohnanzaGame {
  const game = value as BohnanzaGame;
  const seats = Array.isArray(game?.players) ? game.players.length : 0;
  return (
    isObject(value) &&
    PHASES.includes(game.phase as Phase) &&
    seats > 0 &&
    game.players.every(isPlayer) &&
    isCards(game.deck) &&
    isCards(game.discard) &&
    isCards(game.spent) &&
    isCards(game.revealed) &&
    isSeat(game.active, seats) &&
    isSeat(game.starter, seats) &&
    Number.isInteger(game.planted) &&
    Number.isInteger(game.offers) &&
    Number.isInteger(game.emptied) &&
    Number.isInteger(game.turn) &&
    typeof game.ending === "boolean" &&
    isOffer(game.offer, seats) &&
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
    isCards(player.hand) &&
    isCards(player.pending) &&
    Array.isArray(player.fields) &&
    player.fields.every(isCards) &&
    Number.isInteger(player.coins)
  );
}

/** Whether a proposal on the table is one. */
function isOffer(value: unknown, seats: number): boolean {
  const offer = value as Offer;
  return (
    value === null ||
    (isObject(value) &&
      isSeat(offer.from, seats) &&
      isSeat(offer.to, seats) &&
      isCards(offer.give) &&
      Array.isArray(offer.want) &&
      offer.want.every(isBean))
  );
}

/** Whether this is a list of cards. */
function isCards(value: unknown): value is readonly Card[] {
  return Array.isArray(value) && value.every(isCard);
}

/** Whether this is a card. */
function isCard(value: unknown): value is Card {
  const card = value as Card;
  return isObject(value) && typeof card.id === "string" && isBean(card.bean);
}

/** Whether a value names one of the eight sorts. */
function isBean(value: unknown): value is Bean {
  return typeof value === "string" && BEANS.includes(value as Bean);
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
