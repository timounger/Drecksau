/**
 * Drives a game against the computer from React.
 *
 * @module
 * @remarks
 * A computer turn is not one move but a run of them - set a value aside, throw
 * again, set another aside, stop - so the effect fires repeatedly for the same
 * seat with a pause between. Watching the dice come off the table one value at
 * a time is most of the fun of somebody else's turn.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiMove } from "@/games/heckmeck/engine/ai";
import { applyMove } from "@/games/heckmeck/engine/moves";
import { isHeckmeckGame } from "@/games/heckmeck/engine/serialization";
import { createGame, soloSeats } from "@/games/heckmeck/engine/setup";
import {
  leaders,
  type HeckmeckGame,
  type HeckmeckMove,
} from "@/games/heckmeck/engine/state";
import type { HeckmeckSettings } from "@/games/heckmeck/settings/app-settings";
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
const GAME_ID: GameId = "heckmeck";

/** How long a computer player pauses before answering, so it can be followed. */
const AI_MOVE_DELAY_MS = 750;

/** The human always sits first. */
const MY_SEAT = 0;

/** What the human seat is called at the table. */
const HUMAN_NAME = "Du";

/** Longest gap counted as play time, so a tab left open does not inflate it. */
const MAX_COUNTED_PAUSE_MS = 60_000;

/**
 * The deal the very first render uses.
 *
 * @remarks
 * Fixed on purpose: the page is prerendered, and a random roll would differ
 * from the markup the browser gets. The real game replaces it on mount.
 */
const INITIAL_SEED = 20240808;

/** Opponents the prerendered placeholder table shows. */
const DEFAULT_OPPONENTS = 2;

/** The bookkeeping that travels with a saved game. */
type SessionMeta = {
  startedAt: number;
  playTimeMs: number;
  isOutcomeRecorded: boolean;
};

/** What the game screen needs from the hook. */
export type HeckmeckSession = {
  readonly game: HeckmeckGame;
  /** Which seat the human plays. */
  readonly mySeat: number;
  readonly play: (move: HeckmeckMove) => void;
  /** Deals a fresh game with the settings as they stand. */
  readonly newGame: () => void;
};

/**
 * Runs one game against the computer.
 *
 * @param settings - how many roll
 * @returns the running game and the actions on it
 */
export function useHeckmeckGame(settings: HeckmeckSettings): HeckmeckSession {
  const [game, setGame] = useState<HeckmeckGame>(() =>
    createGame(soloSeats(HUMAN_NAME, DEFAULT_OPPONENTS), INITIAL_SEED),
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
  const beginGame = useCallback((next: HeckmeckGame) => {
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
      const saved = loadSession(GAME_ID, isHeckmeckGame);
      if (saved === null) {
        const fresh = createGame(
          soloSeats(HUMAN_NAME, settingsRef.current.playerCount - 1),
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

  // Save after every change, and count the outcome exactly once.
  useEffect(() => {
    if (isReady.current) {
      const now = Date.now();
      flushPlayTime(now);
      if (game.phase === "gameOver" && !meta.current.isOutcomeRecorded) {
        meta.current.isOutcomeRecorded = true;
        activeSince.current = null;
        recordGameFinished(GAME_ID, {
          // Most worms wins; a shared best counts as a win.
          won: leaders(game).includes(MY_SEAT),
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

  /**
   * The computer seat that is on turn, or -1.
   *
   * @remarks
   * A whole turn is several moves - set aside, roll, set aside, stop - so this
   * fires again and again for the same seat until the turn is over. The pause
   * between them is what makes a computer turn something you can follow.
   */
  const pending =
    game.phase !== "gameOver" && game.players[game.active].isBot
      ? game.active
      : -1;

  useEffect(() => {
    if (pending < 0) {
      return;
    }
    const timer = setTimeout(() => {
      setGame((current) => {
        const move = aiMove(current);
        return (
          (move === null ? null : applyMove(current, pending, move)) ?? current
        );
      });
    }, AI_MOVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pending, game]);

  const play = useCallback((move: HeckmeckMove) => {
    setGame((current) => applyMove(current, MY_SEAT, move) ?? current);
  }, []);

  const newGame = useCallback(() => {
    flushPlayTime(Date.now());
    clearSession(GAME_ID);
    const fresh = createGame(
      soloSeats(HUMAN_NAME, settingsRef.current.playerCount - 1),
      Date.now() >>> 0,
    );
    beginGame(fresh);
    setGame(fresh);
  }, [flushPlayTime, beginGame]);

  // No "busy" flag on purpose: during the white step the human may answer
  // while computer players are still thinking, so blocking the sheet would be
  // wrong. What the human may do is decided by the legal moves alone.
  return { game, mySeat: MY_SEAT, play, newGame };
}
