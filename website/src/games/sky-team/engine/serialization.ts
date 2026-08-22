/**
 * Checking a landing read back from storage or off the wire.
 *
 * @module
 * @remarks
 * Shape, not legality. A cockpit with the flaps out in the wrong order is not
 * this module's problem: the referee never produced it, and no move will make
 * it worse. What matters is that nothing here throws on a value from an older
 * version, a hand-edited entry or another player's browser.
 */
import type { Seat } from "./spaces";
import type { Failure, Player, SkyTeamGame, Stage } from "./state";

/** The stages a stored landing may claim to be in. */
const STAGES: readonly string[] = ["placing", "roundEnd", "won", "lost"];

/** The ways it may claim to have gone wrong. */
const FAILURES: readonly string[] = [
  "spin",
  "collision",
  "overshoot",
  "short",
  "duty",
  "landing",
];

/** Seats there are. */
const SEATS = 2;

/**
 * Checks an unknown value really is a landing.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isSkyTeamGame(value: unknown): value is SkyTeamGame {
  const game = value as SkyTeamGame;
  return (
    isObject(value) &&
    STAGES.includes(game.stage as Stage) &&
    (game.failure === null || FAILURES.includes(game.failure as Failure)) &&
    Array.isArray(game.players) &&
    game.players.length === SEATS &&
    game.players.every(isPlayer) &&
    isSeat(game.active) &&
    isSeat(game.opener) &&
    Number.isInteger(game.round) &&
    Number.isInteger(game.altitude) &&
    Number.isInteger(game.position) &&
    isNumbers(game.traffic) &&
    Number.isInteger(game.axis) &&
    isFlags(game.gear) &&
    isFlags(game.flaps) &&
    isFlags(game.brakes) &&
    Number.isInteger(game.coffee) &&
    Number.isInteger(game.rerolls) &&
    isNumbers(game.rerollLeft) &&
    isCockpit(game.placed) &&
    (game.speed === null || Number.isInteger(game.speed)) &&
    Array.isArray(game.log) &&
    Number.isFinite(game.rng) &&
    Number.isFinite(game.seed)
  );
}

/** Whether this is a player at the controls. */
function isPlayer(value: unknown): value is Player {
  const player = value as Player;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.isBot === "boolean" &&
    isNumbers(player.dice)
  );
}

/** Whether this is what lies on the cockpit spaces. */
function isCockpit(value: unknown): boolean {
  return (
    isObject(value) &&
    Object.values(value).every(
      (entry) => entry === null || Number.isInteger(entry),
    )
  );
}

/** Whether this is a list of whole numbers. */
function isNumbers(value: unknown): value is readonly number[] {
  return Array.isArray(value) && value.every((each) => Number.isInteger(each));
}

/** Whether this is a list of switches. */
function isFlags(value: unknown): value is readonly boolean[] {
  return (
    Array.isArray(value) && value.every((each) => typeof each === "boolean")
  );
}

/** Whether this is one of the two seats. */
function isSeat(value: unknown): value is Seat {
  return value === 0 || value === 1;
}

/** Whether this is an object at all. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
