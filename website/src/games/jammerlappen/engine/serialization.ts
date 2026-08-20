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
 *
 * The one thing it is strict about is the two table rows. They are three slots
 * long with holes in them, and the whole pairing of an open card with the
 * covered card beneath it rests on that - a row that came back one entry short
 * would silently move every covered card under the wrong neighbour.
 */
import { ACTIONS, type Card } from "./cards";
import { TABLE_SLOTS, type JammerlappenGame, type Player } from "./state";

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = ["swap", "play", "gameOver"];

/**
 * Checks an unknown value really is a game of Jammerlappen.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isJammerlappenGame(value: unknown): value is JammerlappenGame {
  const game = value as JammerlappenGame;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    Array.isArray(game.players) &&
    game.players.length > 0 &&
    game.players.every((player) => isPlayer(player, game.players.length)) &&
    isSeat(game.active, game.players.length) &&
    (game.direction === 1 || game.direction === -1) &&
    isCards(game.draw) &&
    isCards(game.pot) &&
    Number.isInteger(game.burned) &&
    typeof game.free === "boolean" &&
    typeof game.descending === "boolean" &&
    Number.isInteger(game.copies) &&
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
    isRow(player.up) &&
    isRow(player.down) &&
    typeof player.ready === "boolean" &&
    (player.place === null || isSeat(player.place, seats))
  );
}

/** Whether this is a row of three slots, each a card or a hole. */
function isRow(value: unknown): value is readonly (Card | null)[] {
  return (
    Array.isArray(value) &&
    value.length === TABLE_SLOTS &&
    value.every((entry) => entry === null || isCard(entry))
  );
}

/** Whether this is a list of cards. */
function isCards(value: unknown): value is readonly Card[] {
  return Array.isArray(value) && value.every(isCard);
}

/** Whether this is a card. */
function isCard(value: unknown): value is Card {
  const card = value as Card;
  let ok = false;
  if (isObject(value) && typeof card.id === "string") {
    if (card.kind === "number") {
      ok = Number.isInteger(card.value);
    } else if (card.kind === "action") {
      ok = ACTIONS.includes(card.action);
    } else {
      ok = card.kind === "hidden";
    }
  }
  return ok;
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
