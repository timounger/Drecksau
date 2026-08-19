/**
 * The table sizes The Mind can be played at.
 *
 * @module
 * @remarks
 * Short, because there is nothing to configure: the game is online only, and
 * the table size is agreed in the lobby rather than set beforehand. What is
 * left is the list of sizes the online screen offers and the clamp that keeps a
 * value read back from storage inside what the game can actually seat.
 */
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/the-mind/engine/state";

/** Table size the online screen starts from. */
export const DEFAULT_PLAYER_COUNT = 3;

/** The table sizes on offer, derived from the engine limits. */
export const PLAYER_COUNTS: readonly number[] = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (unused, index) => MIN_PLAYERS + index,
);

/**
 * Holds a table size inside what the game can actually seat.
 *
 * @param count - the value read back from storage or a control
 * @returns a seatable table size
 */
export function clampPlayers(count: unknown): number {
  return typeof count === "number" && Number.isFinite(count)
    ? Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.round(count)))
    : DEFAULT_PLAYER_COUNT;
}
