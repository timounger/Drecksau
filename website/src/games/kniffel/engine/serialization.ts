/**
 * Checking a game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so it survives a round trip unchanged - but what
 * comes back may be from an older version, hand-edited or simply broken. This
 * guard is the one place that decides whether to trust it.
 *
 * Nothing in Kniffel is secret: the dice are on the table and every sheet is
 * read out loud. So this checks the real thing rather than a redacted one.
 */
import {
  CATEGORIES,
  DICE_COUNT,
  DIE_FACES,
  ROLLS_PER_TURN,
  type Category,
  type KniffelGame,
  type Player,
  type Sheet,
} from "./state";

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = ["turn", "gameOver"];

/**
 * Checks an unknown value really is a game of Kniffel.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isKniffelGame(value: unknown): value is KniffelGame {
  const game = value as KniffelGame;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    Array.isArray(game.players) &&
    game.players.length > 0 &&
    game.players.every(isPlayer) &&
    isIndex(game.active, game.players.length) &&
    Array.isArray(game.dice) &&
    game.dice.length === DICE_COUNT &&
    game.dice.every(isFace) &&
    Array.isArray(game.held) &&
    game.held.length === DICE_COUNT &&
    game.held.every((keep) => typeof keep === "boolean") &&
    isCount(game.rollsLeft) &&
    game.rollsLeft < ROLLS_PER_TURN &&
    isCount(game.round) &&
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
    isSheet(player.sheet)
  );
}

/** Checks one sheet: every box present, and holding a number or nothing. */
function isSheet(value: unknown): value is Sheet {
  const sheet = value as Record<Category, unknown>;
  return (
    isObject(value) &&
    CATEGORIES.every(
      (category) => sheet[category] === null || isCount(sheet[category]),
    )
  );
}

/** Whether a value is a die face. */
function isFace(value: unknown): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= DIE_FACES
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

/** Whether a value is a non-negative whole number. */
function isCount(value: unknown): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/** Whether a value is a non-null object. */
function isObject(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}
