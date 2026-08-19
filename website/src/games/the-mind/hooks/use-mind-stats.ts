/**
 * Records an online game of The Mind in the collection's statistics.
 *
 * @module
 * @remarks
 * The other games keep their statistics from the game against the computer, and
 * The Mind has none - it is played online or not at all. So the online table
 * does the recording itself, the way Krakel Orakel does, and the statistics
 * page keeps meaning something.
 *
 * Counted from the reader's own screen, so it is *your* record of *your*
 * evenings rather than the table's. That is what a local statistic can honestly
 * be: everybody's browser sees the same game and each keeps its own tally.
 */
"use client";

import { useEffect, useRef } from "react";
import type { MindGame } from "@/games/the-mind/engine/state";
import type { GameId } from "@/games/registry";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";
import { invalidateStats } from "@/lib/stats/stats-store";

/** This game's id in the statistics. */
const GAME_ID: GameId = "the-mind";

/** How often the time at the table is written away, in ms. */
const FLUSH_MS = 15_000;

/**
 * Keeps the statistics for the game on screen.
 *
 * @param game - the game as this client sees it, or null before it starts
 * @remarks
 * A game is counted once when it appears and once when it ends. The play time
 * is added in spans while the game runs, so closing the tab mid-level loses at
 * most one span instead of the whole evening.
 */
export function useMindStats(game: MindGame | null): void {
  // What has already been counted, so a re-render cannot count it twice.
  const seen = useRef<{ started: boolean; finished: boolean }>({
    started: false,
    finished: false,
  });
  const since = useRef<number | null>(null);
  // When this game began, so its length is the real one and not a nought.
  const began = useRef<number | null>(null);

  const running = game !== null;
  const over = game !== null && game.phase === "gameOver";
  const won = game?.won ?? false;

  useEffect(() => {
    if (!running || seen.current.started) {
      return;
    }
    seen.current.started = true;
    const now = Date.now();
    since.current = now;
    began.current = now;
    recordGameStarted(GAME_ID, now);
    invalidateStats();
  }, [running]);

  // Time at the table, in spans - and one last span when the game ends or the
  // screen goes away, so the tail of a level is not simply dropped.
  useEffect(() => {
    if (!running || over) {
      return;
    }
    const flush = () => {
      const from = since.current;
      if (from !== null) {
        const now = Date.now();
        since.current = now;
        recordPlayTime(GAME_ID, now - from, now);
        invalidateStats();
      }
    };
    const timer = setInterval(flush, FLUSH_MS);
    return () => {
      clearInterval(timer);
      flush();
    };
  }, [running, over]);

  useEffect(() => {
    if (!over || seen.current.finished) {
      return;
    }
    seen.current.finished = true;
    const now = Date.now();
    recordGameFinished(GAME_ID, {
      won,
      durationMs: began.current === null ? 0 : now - began.current,
      finishedAt: now,
    });
    invalidateStats();
  }, [over, won]);
}
