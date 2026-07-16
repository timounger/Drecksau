/**
 * Persists the statistics of each game.
 *
 * @module
 */
import type { GameId } from "@/games/registry";
import {
  readStored,
  removeStored,
  storageKey,
  writeStored,
} from "@/lib/storage/local-store";
import { EMPTY_STATS, isGameStats, type GameStats } from "./game-stats";

/** Schema version of the stored statistics - raise it on breaking changes. */
const STATS_VERSION = 1;

/** Key part identifying the statistics entry. */
const STATS_KEY = "stats";

/**
 * Loads the statistics of a game.
 *
 * @param gameId - which game
 * @returns the stored statistics, or empty ones if nothing usable is stored
 */
export function loadStats(gameId: GameId): GameStats {
  const stored = readStored(
    storageKey(gameId, STATS_KEY),
    STATS_VERSION,
    isGameStats,
  );
  return stored ?? EMPTY_STATS;
}

/**
 * Stores the statistics of a game.
 *
 * @param gameId - which game
 * @param stats - the statistics to store
 */
export function saveStats(gameId: GameId, stats: GameStats): void {
  writeStored(storageKey(gameId, STATS_KEY), STATS_VERSION, stats);
}

/**
 * Deletes the statistics of a game.
 *
 * @param gameId - which game
 */
export function resetStats(gameId: GameId): void {
  removeStored(storageKey(gameId, STATS_KEY));
}
