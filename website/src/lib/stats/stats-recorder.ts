/**
 * Writes events into the stored statistics: read, update, save.
 *
 * @module
 * @remarks
 * Play time goes two ways from here, and only play time. The statistics
 * themselves stay in this browser, as the statistics page promises; what also
 * travels is the bare span, added to a shared per-day total that decides which
 * games the start page calls popular. Nothing identifies who played.
 */
import type { GameId } from "@/games/registry";
import { reportPlayTime } from "@/online/popularity";
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
