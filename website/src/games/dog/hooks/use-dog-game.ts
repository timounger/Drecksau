/**
 * Drives a game of Dog against the computer from React.
 *
 * @module
 * @remarks
 * The same shape as the other games of the collection: the engine is the
 * referee, and this only decides *when* the computer players move, keeping the
 * session, the play time and the statistics in order.
 *
 * The one thing Dog needs that a trick game does not is a second kind of
 * waiting: at the top of every round every seat pushes a card across at once,
 * so the bots have to be nudged while it is nobody's turn in particular. And
 * they do not pause to think - see botWaitMs in ./engine/ai.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiMove, botWaitMs } from "@/games/dog/engine/ai";
import { applyMove, seatOnTurn } from "@/games/dog/engine/moves";
import { isDogGame } from "@/games/dog/engine/serialization";
import { createGame, soloSeats } from "@/games/dog/engine/setup";
import type { DogGame, DogMove } from "@/games/dog/engine/state";
import {
  loadSettings,
  type DogSettings,
} from "@/games/dog/settings/app-settings";
import type { GameId } from "@/games/registry";
import {
  clearSession,
  loadSession,
  saveSession,
} from "@/lib/storage/game-session";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";
import { invalidateStats } from "@/lib/stats/stats-store";

/** This game's id for storage and statistics. */
const GAME_ID: GameId = "dog";

/** The human always sits first, and their partner sits across. */
const MY_SEAT = 0;

/** Longest gap counted as play time, so a tab left open does not inflate it. */
const MAX_COUNTED_PAUSE_MS = 60_000;

/**
 * The deal the very first render uses.
 *
 * @remarks
 * Fixed on purpose: the page is prerendered, and a random shuffle would differ
 * from the markup the browser gets. The real game replaces it on mount.
 */
const INITIAL_SEED = 20260911;

/** The bookkeeping that travels with a saved game. */
type SessionMeta = {
  startedAt: number;
  playTimeMs: number;
  isOutcomeRecorded: boolean;
};

/** What the game screen gets from the hook. */
export type DogSession = {
  readonly game: DogGame;
  /** Which seat the human plays. */
  readonly mySeat: number;
  readonly play: (move: DogMove) => void;
  /** Deals a fresh game with the settings as they stand. */
  readonly newGame: () => void;
};

/**
 * Runs one game against the computer.
 *
 * @param settings - what the player has chosen on the settings page
 * @returns the running game and the actions on it
 */
export function useDogGame(settings: DogSettings): DogSession {
  const [game, setGame] = useState<DogGame>(() =>
    createGame(soloSeats(settings.name, settings.playerCount), INITIAL_SEED),
  );
  // Read through a ref so a settings change never restarts the game by itself.
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  const meta = useRef<SessionMeta>({
    startedAt: 0,
    playTimeMs: 0,
    isOutcomeRecorded: false,
  });
  const activeSince = useRef<number | null>(null);
  const isReady = useRef(false);

  /** Books the time since the last flush, capped against long absences. */
  const flushPlayTime = useCallback((now: number) => {
    const since = activeSince.current;
    if (since !== null) {
      const elapsed = Math.min(now - since, MAX_COUNTED_PAUSE_MS);
      if (elapsed > 0) {
        meta.current.playTimeMs += elapsed;
        recordPlayTime(GAME_ID, elapsed, now);
        invalidateStats();
      }
      activeSince.current = now;
    }
  }, []);

  /** Starts counting a brand new game. */
  const beginGame = useCallback((next: DogGame) => {
    const now = Date.now();
    meta.current = { startedAt: now, playTimeMs: 0, isOutcomeRecorded: false };
    activeSince.current = now;
    recordGameStarted(GAME_ID, now);
    invalidateStats();
    saveSession(GAME_ID, { state: next, ...meta.current });
  }, []);

  // Pull in the saved game once, after the first render matched the HTML.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isReady.current) {
      isReady.current = true;
      const house = loadSettings();
      const saved = loadSession(GAME_ID, isDogGame);
      if (saved === null) {
        const fresh = createGame(
          soloSeats(house.name, house.playerCount),
          Date.now() >>> 0,
        );
        beginGame(fresh);
        setGame(fresh);
      } else {
        meta.current = {
          startedAt: saved.startedAt,
          playTimeMs: saved.playTimeMs,
          isOutcomeRecorded: saved.isOutcomeRecorded,
        };
        activeSince.current =
          saved.state.phase === "gameOver" ? null : Date.now();
        setGame(saved.state);
      }
    }
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Save after every change, and count the outcome exactly once.
  useEffect(() => {
    if (isReady.current) {
      const now = Date.now();
      flushPlayTime(now);
      if (game.phase === "gameOver" && !meta.current.isOutcomeRecorded) {
        meta.current.isOutcomeRecorded = true;
        activeSince.current = null;
        recordGameFinished(GAME_ID, {
          won: game.winners.includes(MY_SEAT),
          durationMs: meta.current.playTimeMs,
          finishedAt: now,
        });
        invalidateStats();
      }
      saveSession(GAME_ID, { state: game, ...meta.current });
    }
  }, [game, flushPlayTime]);

  // Time only counts while the tab is actually in front of the player.
  useEffect(() => {
    const onVisibility = () => {
      const now = Date.now();
      if (document.visibilityState === "visible") {
        activeSince.current = game.phase === "gameOver" ? null : now;
      } else {
        flushPlayTime(now);
        activeSince.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [game.phase, flushPlayTime]);

  // The seat the table is waiting for, if the computer plays it.
  const waiting = seatOnTurn(game);
  const pending =
    waiting !== null && (game.players[waiting]?.isBot ?? false) ? waiting : -1;

  useEffect(() => {
    if (pending < 0) {
      return;
    }
    // No thinking time: the computer answers as soon as it is asked. The
    // timeout is only there so that React is not asked to set state while it is
    // still rendering the move that led here.
    const timer = setTimeout(() => {
      setGame((current) => {
        const move = aiMove(current, pending);
        return (
          (move === null ? null : applyMove(current, pending, move)) ?? current
        );
      });
    }, botWaitMs());
    return () => clearTimeout(timer);
  }, [pending, game]);

  const play = useCallback((move: DogMove) => {
    setGame((current) => applyMove(current, MY_SEAT, move) ?? current);
  }, []);

  const newGame = useCallback(() => {
    flushPlayTime(Date.now());
    clearSession(GAME_ID);
    const house = loadSettings();
    const fresh = createGame(
      soloSeats(house.name, house.playerCount),
      Date.now() >>> 0,
    );
    beginGame(fresh);
    setGame(fresh);
  }, [flushPlayTime, beginGame]);

  return { game, mySeat: MY_SEAT, play, newGame };
}
