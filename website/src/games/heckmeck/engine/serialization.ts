/**
 * Checking a game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so it survives a round trip unchanged - but what
 * comes back may be from an older version, hand-edited or simply broken. This
 * guard is the one place that decides whether to trust it.
 *
 * Nothing in Heckmeck is secret - the dice are on the table and the piles are
 * face up - so this checks the real thing rather than a redacted one.
 */
import {
  HIGHEST_TILE,
  LOWEST_TILE,
  WORM,
  type HeckmeckGame,
  type Outcome,
  type Player,
} from "./state";

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = ["pick", "decide", "gameOver"];

/**
 * Checks an unknown value really is a game of Heckmeck.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isHeckmeckGame(value: unknown): value is HeckmeckGame {
  const game = value as HeckmeckGame;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    Array.isArray(game.players) &&
    game.players.length > 0 &&
    game.players.every(isPlayer) &&
    isIndex(game.active, game.players.length) &&
    isTiles(game.grill) &&
    isTiles(game.burnt) &&
    isFaces(game.dice) &&
    isFaces(game.kept) &&
    (game.lastOutcome === null ||
      isOutcome(game.lastOutcome, game.players.length)) &&
    typeof game.seed === "number" &&
    typeof game.rng === "number" &&
    Array.isArray(game.log) &&
    game.log.every((line) => typeof line === "string")
  );
}

/** Checks one player. */
function isPlayer(value: unknown): value is Player {
  const player = value as Player;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.isBot === "boolean" &&
    isTiles(player.stack)
  );
}

/** Checks what a finished turn came to. */
function isOutcome(value: unknown, seats: number): value is Outcome {
  const outcome = value as Outcome;
  return (
    isObject(value) &&
    isIndex(outcome.seat, seats) &&
    (outcome.tile === null || isTile(outcome.tile)) &&
    (outcome.from === null || isIndex(outcome.from, seats)) &&
    typeof outcome.bust === "boolean" &&
    (outcome.burnt === null || isTile(outcome.burnt))
  );
}

/** Whether a value is a list of tiles. */
function isTiles(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isTile);
}

/** Whether a value is a tile number. */
function isTile(value: unknown): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= LOWEST_TILE &&
    value <= HIGHEST_TILE
  );
}

/** Whether a value is a list of die faces. */
function isFaces(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every((face) => Number.isInteger(face) && face >= 1 && face <= WORM)
  );
}

/** Whether a value is a seat index of a table that size. */
function isIndex(value: unknown, size: number): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < size
  );
}

/** Whether a value is a non-null object. */
function isObject(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}
