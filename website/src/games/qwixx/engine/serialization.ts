/**
 * Checking a game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so it survives a round trip unchanged - but what
 * comes back may be from an older version, hand-edited or simply broken. This
 * guard is the one place that decides whether to trust it.
 *
 * Nothing in Qwixx is secret: every sheet lies face up on the table. So this
 * checks the real thing rather than a redacted one, and it may be strict about
 * it - crosses have to be places that exist, in order, without repeats.
 */
import {
  DIE_FACES,
  ROWS,
  ROW_LENGTH,
  type Player,
  type QwixxGame,
  type Row,
  type Sheet,
} from "./state";

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = ["white", "colour", "gameOver"];

/** How many white dice there are. */
const WHITE_DICE = 2;

/**
 * Checks an unknown value really is a game of Qwixx.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isQwixxGame(value: unknown): value is QwixxGame {
  const game = value as QwixxGame;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    Array.isArray(game.players) &&
    game.players.length > 0 &&
    game.players.every(isPlayer) &&
    isIndex(game.active, game.players.length) &&
    isDice(game.dice) &&
    isRowFlags(game.locked) &&
    Array.isArray(game.decided) &&
    game.decided.length === game.players.length &&
    game.decided.every((done) => typeof done === "boolean") &&
    typeof game.activeCrossed === "boolean" &&
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

/** Checks one sheet: places that exist, ascending, without repeats. */
function isSheet(value: unknown): value is Sheet {
  const sheet = value as Sheet;
  return (
    isObject(value) &&
    isObject(sheet.crosses) &&
    ROWS.every((row) => isCrossList(sheet.crosses[row])) &&
    isCount(sheet.penalties)
  );
}

/** Checks the crosses of one row. */
function isCrossList(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (place, index) =>
        Number.isInteger(place) &&
        place >= 0 &&
        place < ROW_LENGTH &&
        (index === 0 || place > value[index - 1]),
    )
  );
}

/** Checks the dice on the table. */
function isDice(value: unknown): boolean {
  const dice = value as QwixxGame["dice"];
  return (
    isObject(value) &&
    Array.isArray(dice.white) &&
    dice.white.length === WHITE_DICE &&
    dice.white.every(isFace) &&
    isObject(dice.colours) &&
    ROWS.every((row) => dice.colours[row] === null || isFace(dice.colours[row]))
  );
}

/** Checks a record with one flag per row. */
function isRowFlags(value: unknown): boolean {
  const flags = value as Record<Row, unknown>;
  return (
    isObject(value) && ROWS.every((row) => typeof flags[row] === "boolean")
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
