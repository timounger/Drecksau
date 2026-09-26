/**
 * Writes events into the stored statistics: read, update, save.
 *
 * @module
 * @remarks
 * Two things go two ways from here: the span of play time, and the bare fact
 * that a game was begun. The statistics themselves stay in this browser, as
 * the statistics page promises; what travels is a number added to a shared
 * per-day total - the one the start page builds its "Beliebt" shelf on, and
 * the one the usage dashboard reads. Nothing identifies who played.
 */
import type { GameId } from "@/games/registry";
import { reportPlayTime } from "@/online/popularity";
import { reportStart } from "@/online/usage";
import {
  withGameFinished,
  withGameStarted,
  withPlayTime,
  type GameOutcome,
} from "./game-stats";
import { loadStats, saveStats } from "./stats-storage";

/**
 * Counts a newly begun game.
 *
 * @param gameId - which game
 * @param startedAt - when it began
 */
export function recordGameStarted(gameId: GameId, startedAt: number): void {
  saveStats(gameId, withGameStarted(loadStats(gameId), startedAt));
  // And one on the shared counter, which is how the collection knows what is
  // actually played rather than only opened - see ../../online/usage.
  reportStart(gameId);
}

/**
 * Counts a game that reached a winner.
 *
 * @param gameId - which game
 * @param outcome - how and when it ended
 */
export function recordGameFinished(gameId: GameId, outcome: GameOutcome): void {
  saveStats(gameId, withGameFinished(loadStats(gameId), outcome));
}

/**
 * Adds a span of time spent playing.
 *
 * @param gameId - which game
 * @param elapsedMs - the span to add
 * @param at - when the span ended
 */
export function recordPlayTime(
  gameId: GameId,
  elapsedMs: number,
  at: number,
): void {
  saveStats(gameId, withPlayTime(loadStats(gameId), elapsedMs, at));
  reportPlayTime(gameId, elapsedMs);
}
