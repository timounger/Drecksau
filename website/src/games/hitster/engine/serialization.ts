/**
 * Checks that a stored or received value really is a game of Hitster.
 *
 * @module
 */
import type { HitsterGame } from "./state";

/** The phases a game may be in. */
const PHASES: readonly string[] = ["place", "challenge", "reveal", "over"];

/**
 * Whether a value is a game of Hitster.
 *
 * @param value - what was read or received
 * @returns true when it has the shape of a game
 */
export function isHitsterGame(value: unknown): value is HitsterGame {
  const game = value as Partial<Record<keyof HitsterGame, unknown>> | null;
  return (
    typeof game === "object" &&
    game !== null &&
    typeof game.phase === "string" &&
    PHASES.includes(game.phase) &&
    typeof game.song === "number" &&
    typeof game.active === "number" &&
    typeof game.target === "number" &&
    Array.isArray(game.deck) &&
    Array.isArray(game.challenges) &&
    Array.isArray(game.players) &&
    game.players.every(isPlayer)
  );
}

/** Whether a value is a player. */
function isPlayer(value: unknown): boolean {
  const player = value as Partial<Record<string, unknown>> | null;
  return (
    typeof player === "object" &&
    player !== null &&
    typeof player.name === "string" &&
    typeof player.tokens === "number" &&
    Array.isArray(player.timeline)
  );
}
