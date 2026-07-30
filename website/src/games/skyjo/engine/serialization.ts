/**
 * Checking a Skyjo game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so it survives a round trip unchanged - but anything
 * coming back may be from an older version, hand-edited or simply corrupt. The
 * guard here is the one place that decides whether to trust it.
 */
import { GRID_SIZE, MAX_VALUE, MIN_VALUE } from "./cards";
import type { Player, SkyjoGame, Slot } from "./state";

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = ["flip", "turn", "roundOver", "gameOver"];

/** The states a stored slot may claim. */
const SLOT_STATES: readonly string[] = ["down", "up", "gone"];

/**
 * Checks an unknown value really is a Skyjo game.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isSkyjoGame(value: unknown): value is SkyjoGame {
  const game = value as SkyjoGame;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    Array.isArray(game.players) &&
    game.players.length > 0 &&
    game.players.every(isPlayer) &&
    isIndex(game.turn, game.players.length) &&
    isCount(game.round) &&
    isCardList(game.deck) &&
    isCardList(game.discard) &&
    (game.drawn === null || isCard(game.drawn)) &&
    (game.endedBy === null || isIndex(game.endedBy, game.players.length)) &&
    typeof game.seed === "number" &&
    Array.isArray(game.log) &&
    game.log.every((line) => typeof line === "string")
  );
}

/** Checks one player entry. */
function isPlayer(value: unknown): value is Player {
  const player = value as Player;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    Array.isArray(player.grid) &&
    player.grid.length === GRID_SIZE &&
    player.grid.every(isSlot) &&
    typeof player.total === "number" &&
    Number.isFinite(player.total) &&
    typeof player.roundScore === "number" &&
    Number.isFinite(player.roundScore) &&
    typeof player.isBot === "boolean"
  );
}

/** Checks one slot of a layout. */
function isSlot(value: unknown): value is Slot {
  const slot = value as Slot;
  return (
    isObject(value) && SLOT_STATES.includes(slot.state) && isCard(slot.value)
  );
}

/** Whether a value is a card value the deck actually holds. */
function isCard(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_VALUE &&
    value <= MAX_VALUE
  );
}

/** Whether a value is a list of card values. */
function isCardList(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isCard);
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
