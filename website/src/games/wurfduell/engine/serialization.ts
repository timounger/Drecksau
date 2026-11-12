/**
 * Checking a match or a move that came off the wire.
 *
 * @module
 * @remarks
 * The online layer reads everything as untrusted JSON. These guards are the
 * one place that decides whether it is really a Wurfduell match or move; the
 * referee then decides whether the move is allowed.
 */
import { ABILITY_IDS, CHARACTER_IDS } from "./characters";
import type {
  AbilityId,
  CharacterId,
  Statuses,
  DuelGame,
  DuelMove,
  DuelPlayer,
  ThrowRecord,
} from "./types";

/** The phases a match may claim to be in. */
const PHASES: readonly string[] = ["pick", "throw", "over"];

/** The kinds of move a client may send. */
const MOVE_KINDS: readonly string[] = ["pick", "throw", "resign", "rematch"];

/** Whether a value names an ability, or is null for none. */
function isAbilityOrNull(value: unknown): boolean {
  return value === null || ABILITY_IDS.includes(value as AbilityId);
}

/**
 * Whether a value is a match.
 *
 * @param value - whatever was read
 * @returns true when every field has the expected shape
 */
export function isDuelGame(value: unknown): value is DuelGame {
  const game = value as DuelGame;
  return (
    isObject(value) &&
    Number.isFinite(game.seed) &&
    Number.isInteger(game.round) &&
    PHASES.includes(game.phase) &&
    Array.isArray(game.players) &&
    game.players.length === 2 &&
    game.players.every(isPlayer) &&
    (game.turn === 0 || game.turn === 1) &&
    Number.isInteger(game.wind) &&
    Number.isInteger(game.scenery) &&
    (game.lastThrow === null || isThrowRecord(game.lastThrow)) &&
    (game.winner === null || game.winner === 0 || game.winner === 1) &&
    (game.endReason === null ||
      game.endReason === "ko" ||
      game.endReason === "resign")
  );
}

/**
 * Whether a value is a move.
 *
 * @param value - whatever was read
 * @returns true when it is a move this game knows
 */
export function isDuelMove(value: unknown): value is DuelMove {
  const move = value as {
    kind?: unknown;
    character?: unknown;
    angle?: unknown;
    power?: unknown;
    ability?: unknown;
  };
  let valid = isObject(value) && MOVE_KINDS.includes(move.kind as string);
  if (valid && move.kind === "pick") {
    valid = CHARACTER_IDS.includes(move.character as CharacterId);
  } else if (valid && move.kind === "throw") {
    valid =
      Number.isFinite(move.angle) &&
      Number.isFinite(move.power) &&
      isAbilityOrNull(move.ability);
  }
  return valid;
}

/** Whether a value is one player. */
function isPlayer(value: unknown): value is DuelPlayer {
  const player = value as DuelPlayer;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    (player.character === null || CHARACTER_IDS.includes(player.character)) &&
    Number.isFinite(player.hp) &&
    Number.isFinite(player.maxHp) &&
    Array.isArray(player.used) &&
    player.used.every((id) => ABILITY_IDS.includes(id)) &&
    isStatuses(player.status) &&
    Number.isInteger(player.throws) &&
    Number.isInteger(player.hits) &&
    Number.isInteger(player.wins) &&
    typeof player.rematch === "boolean"
  );
}

/** Whether a value is the record of a throw. */
function isThrowRecord(value: unknown): value is ThrowRecord {
  const record = value as ThrowRecord;
  return (
    isObject(value) &&
    Number.isInteger(record.id) &&
    (record.by === 0 || record.by === 1) &&
    isObject(record.input) &&
    Number.isFinite(record.input.angle) &&
    Number.isFinite(record.input.power) &&
    isAbilityOrNull(record.input.ability) &&
    Number.isInteger(record.wind) &&
    Number.isFinite(record.damage) &&
    typeof record.shielded === "boolean" &&
    Number.isFinite(record.heal) &&
    Number.isFinite(record.burn) &&
    (record.burnSeat === null ||
      record.burnSeat === 0 ||
      record.burnSeat === 1) &&
    typeof record.frozen === "boolean" &&
    typeof record.knockout === "boolean" &&
    (record.best === null ||
      record.best === "head" ||
      record.best === "body") &&
    typeof record.auto === "boolean"
  );
}

/** Whether a value is a fighter's lingering effects. */
function isStatuses(value: unknown): value is Statuses {
  const status = value as Statuses;
  return (
    isObject(value) &&
    typeof status.shield === "boolean" &&
    typeof status.frozen === "boolean" &&
    typeof status.shaky === "boolean" &&
    typeof status.rooted === "boolean" &&
    typeof status.blind === "boolean" &&
    Number.isInteger(status.burn)
  );
}

/** Whether a value is a plain object. */
function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}
