/**
 * Drives a landing against the computer from React.
 *
 * @module
 * @remarks
 * Which seat you fly is a setting, not a given: the pilot has the gear and the
 * brakes, the co-pilot the flaps, and they are different games. So the human
 * seat is whichever the settings say, and the computer takes the other.
 *
 * The computer is handed the whole state, dice and all, and its own code never
 * reads the other side's - see `engine/ai.ts`. Offline that is an honour
 * system, and it is the only one available: both seats live in one browser.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiMove, botWaitMs } from "@/games/flash-point/engine/ai";
import { applyMove, seatOnTurn } from "@/games/flash-point/engine/moves";
import { isFlashPointGame } from "@/games/flash-point/engine/serialization";
import {
  SELF_NAME,
  createGame,
  soloSeats,
} from "@/games/flash-point/engine/setup";
import type {
  FlashPointGame,
  FlashPointMove,
} from "@/games/flash-point/engine/state";
import type { FlashPointSettings } from "@/games/flash-point/settings/app-settings";
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
const GAME_ID: GameId = "flash-point";

/** The human is always the first of the crew. */
const MY_SEAT = 0;

/** What the human seat is called at the table. */
const HUMAN_NAME = SELF_NAME;

/** Longest gap counted as play time, so a tab left open does not inflate it. */
const MAX_COUNTED_PAUSE_MS = 60_000;

/**
 * The deal the very first render uses.
 *
 * @remarks
 * Fixed on purpose: the page is prerendered, and a random shuffle would differ
 * from the markup the browser gets. The real game replaces it on mount.
 */
const INITIAL_SEED = 20240823;

/** The bookkeeping that travels with a saved game. */
type SessionMeta = {
  startedAt: number;
  playTimeMs: number;
  isOutcomeRecorded: boolean;
};

/** What the game screen needs from the hook. */
export type FlashPointSession = {
  readonly game: FlashPointGame;
  /** Which seat the human plays. */
  readonly mySeat: number;
  readonly play: (move: FlashPointMove) => void;
  /** Shuffles a fresh game with the settings as they stand. */
  readonly newGame: () => void;
};

/**
 * Runs one game against the computer.
 *
 * @param settings - how many sit at the table
 * @returns the running game and the actions on it
 */
export function useFlashPointGame(
  settings: FlashPointSettings,
): FlashPointSession {
  const [game, setGame] = useState<FlashPointGame>(() =>
    createGame(soloSeats(HUMAN_NAME, 2), INITIAL_SEED),
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
  const beginGame = useCallback((next: FlashPointGame) => {
    const now = Date.now();
    meta.current = { startedAt: now, playTimeMs: 0, isOutcomeRecorded: false };
    activeSince.current = now;
    recordGameStarted(GAME_ID, now);
    invalidateStats();
    saveSession(GAME_ID, { state: next, ...meta.current });
  }, []);

  // Pull in the saved game once, after the first render matched the HTML.
  useEffect(() => {
    if (!isReady.current) {
      isReady.current = true;
      const saved = loadSession(GAME_ID, isFlashPointGame);
      if (saved === null) {
        const fresh = createGame(
          soloSeats(HUMAN_NAME, settingsRef.current.crew - 1),
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
          saved.state.stage === "won" || saved.state.stage === "lost"
            ? null
            : Date.now();
        setGame(saved.state);
      }
    }
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save after every change, and count the outcome exactly once.
  useEffect(() => {
    if (isReady.current) {
      const now = Date.now();
      flushPlayTime(now);
      if (
        (game.stage === "won" || game.stage === "lost") &&
        !meta.current.isOutcomeRecorded
      ) {
        meta.current.isOutcomeRecorded = true;
        activeSince.current = null;
        recordGameFinished(GAME_ID, {
          // Cooperative: either you both land it or nobody does.
          won: game.stage === "won",
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
        activeSince.current =
          game.stage === "won" || game.stage === "lost" ? null : now;
      } else {
        flushPlayTime(now);
        activeSince.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [game.stage, flushPlayTime]);

  // The seat the table is waiting for, if the computer plays it.
  const waiting = seatOnTurn(game);
  const pending =
    waiting !== null && game.players[waiting].isBot ? waiting : -1;

  useEffect(() => {
    if (pending < 0) {
      return;
    }
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

  const play = useCallback((move: FlashPointMove) => {
    setGame((current) => applyMove(current, MY_SEAT, move) ?? current);
  }, []);

  const newGame = useCallback(() => {
    flushPlayTime(Date.now());
    clearSession(GAME_ID);
    const fresh = createGame(
      soloSeats(HUMAN_NAME, settingsRef.current.crew - 1),
      Date.now() >>> 0,
    );
    beginGame(fresh);
    setGame(fresh);
  }, [flushPlayTime, beginGame]);

  return { game, mySeat: MY_SEAT, play, newGame };
}
