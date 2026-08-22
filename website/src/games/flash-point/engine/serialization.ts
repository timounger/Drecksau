/**
 * Checking a fire read back from storage or off the wire.
 *
 * @module
 * @remarks
 * Shape, not legality. A board with fire in a room nobody could have reached is
 * not this module's problem - the referee never produced it, and no move will
 * make it worse. What matters is that nothing here throws on a value from an
 * older version, a hand-edited entry or another player's browser.
 */
import type { Cell } from "./board";
import type { FlashPointGame } from "./state";

/** The stages a stored fire may claim to be in. */
const STAGES: readonly string[] = ["acting", "won", "lost"];

/** What it may claim went wrong. */
const FAILURES: readonly string[] = ["deaths", "collapse"];

/** What may be burning. */
const BLAZES: readonly string[] = ["smoke", "fire"];

/** What a marker may be. */
const POIS: readonly string[] = ["victim", "falseAlarm"];

/** What a door may be doing. */
const DOORS: readonly string[] = ["closed", "open", "gone"];

/**
 * Checks an unknown value really is a fire.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isFlashPointGame(value: unknown): value is FlashPointGame {
  const game = value as FlashPointGame;
  return (
    isObject(value) &&
    STAGES.includes(game.stage) &&
    (game.failure === null || FAILURES.includes(game.failure)) &&
    Array.isArray(game.players) &&
    game.players.length > 0 &&
    game.players.every(isPlayer) &&
    Number.isInteger(game.active) &&
    Number.isInteger(game.turn) &&
    isMapOf(game.blaze, (each) => BLAZES.includes(each as string)) &&
    isMapOf(game.pois, isMarker) &&
    isMapOf(game.damage, (each) => Number.isInteger(each)) &&
    isMapOf(game.doors, (each) => DOORS.includes(each as string)) &&
    Number.isInteger(game.cubes) &&
    Number.isInteger(game.rescued) &&
    Number.isInteger(game.dead) &&
    Array.isArray(game.bag) &&
    game.bag.every((each) => POIS.includes(each)) &&
    Array.isArray(game.log) &&
    Number.isFinite(game.rng) &&
    Number.isFinite(game.seed)
  );
}

/** Whether this is a firefighter. */
function isPlayer(value: unknown): boolean {
  const player = value as {
    name?: unknown;
    isBot?: unknown;
    at?: unknown;
    ap?: unknown;
    saved?: unknown;
    carrying?: unknown;
  };
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.isBot === "boolean" &&
    isCell(player.at) &&
    Number.isInteger(player.ap) &&
    Number.isInteger(player.saved) &&
    typeof player.carrying === "boolean"
  );
}

/** Whether this is a marker. */
function isMarker(value: unknown): boolean {
  const marker = value as { kind?: unknown; revealed?: unknown };
  return (
    isObject(value) &&
    POIS.includes(marker.kind as string) &&
    typeof marker.revealed === "boolean"
  );
}

/** Whether this is a square. */
function isCell(value: unknown): value is Cell {
  const cell = value as Cell;
  return (
    isObject(value) && Number.isInteger(cell.row) && Number.isInteger(cell.col)
  );
}

/** Whether this is a plain map whose values all pass. */
function isMapOf(value: unknown, ok: (each: unknown) => boolean): boolean {
  return isObject(value) && Object.values(value).every(ok);
}

/** Whether this is an object at all. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
