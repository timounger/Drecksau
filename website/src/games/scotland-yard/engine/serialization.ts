/**
 * Checks that a stored or received value really is a game of Scotland Yard.
 *
 * @module
 * @remarks
 * A saved game is read back from the browser and a snapshot arrives from
 * another player's device, so neither can be trusted to have the right shape.
 * This looks at enough of it that the screens can rely on the rest.
 */
import type { ScotlandYardGame } from "./state";

/** The variants a game may be. */
const VARIANTS: readonly string[] = ["standard", "intro"];

/** The phases a game may be in. */
const PHASES: readonly string[] = ["misterX", "detectives", "over"];

/**
 * Whether a value is a game of Scotland Yard.
 *
 * @param value - what was read or received
 * @returns true when it has the shape of a game
 */
export function isScotlandYardGame(value: unknown): value is ScotlandYardGame {
  const game = value as Partial<Record<keyof ScotlandYardGame, unknown>>;
  const misterX = game?.misterX as Partial<Record<string, unknown>> | undefined;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof game.variant === "string" &&
    VARIANTS.includes(game.variant) &&
    typeof game.phase === "string" &&
    PHASES.includes(game.phase) &&
    typeof game.round === "number" &&
    Array.isArray(game.players) &&
    Array.isArray(game.detectives) &&
    Array.isArray(game.log) &&
    Array.isArray(game.moved) &&
    Array.isArray(game.lastTo) &&
    game.detectives.length === game.moved.length &&
    typeof game.supply === "object" &&
    game.supply !== null &&
    typeof misterX === "object" &&
    misterX !== null &&
    typeof misterX.controller === "number" &&
    (misterX.position === null || typeof misterX.position === "number") &&
    game.detectives.every(isDetective)
  );
}

/** Whether a value is a detective piece. */
function isDetective(value: unknown): boolean {
  const piece = value as Partial<Record<string, unknown>> | null;
  return (
    typeof piece === "object" &&
    piece !== null &&
    typeof piece.position === "number" &&
    typeof piece.controller === "number" &&
    typeof piece.name === "string"
  );
}
