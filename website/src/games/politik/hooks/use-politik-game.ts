/**
 * Drives a game against the computer from React.
 *
 * @module
 * @remarks
 * The player moves, the computer parties answer a beat later so the table can
 * be followed by eye. The game is saved after every move, so a reload continues
 * where it left off, and the statistics are written as the game runs - the same
 * bookkeeping the other single-player games use.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiMove } from "@/games/politik/engine/ai";
import { applyMove } from "@/games/politik/engine/moves";
import { createGame, soloSeats } from "@/games/politik/engine/setup";
import { isPolitikGame } from "@/games/politik/engine/serialization";
import {
  leaders,
  type PolitikGame,
  type PolitikMove,
} from "@/games/politik/engine/state";
import type { PolitikSettings } from "@/games/politik/settings/app-settings";
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
const GAME_ID: GameId = "politik";

/** How long a computer party pauses before its move, so it can be followed. */
const AI_MOVE_DELAY_MS = 800;

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
 * Fixed on purpose: the page is prerendered, and a random deal would differ
 * from the markup the browser gets. The real game replaces it on mount.
 */
const INITIAL_SEED = 20240514;

/**
 * Opponents the prerendered placeholder table shows.
 *
 * @remarks
 * The real number comes from the settings once the browser has them; this only
 * has to render, not to be played.
 */
const DEFAULT_OPPONENTS = 2;

/** The bookkeeping that travels with a saved game. */
type SessionMeta = {
  startedAt: number;
  playTimeMs: number;
  isOutcomeRecorded: boolean;
};

/** What the game screen needs from the hook. */
export type PolitikSession = {
  readonly game: PolitikGame;
  /** Which seat the human plays. */
  readonly mySeat: number;
  /** True while a computer party is on turn, so the board stays quiet. */
  readonly busy: boolean;
  readonly play: (move: PolitikMove) => void;
  /** Deals a fresh game with the settings as they stand. */
  readonly newGame: () => void;
};

/**
 * Runs one game against the computer.
 *
 * @param settings - how many parties sit at the table
 * @returns the running game and the actions on it
 * @remarks
 * Changing the settings does not disturb a running game: they are read when a
 * game is dealt, so the table is only resized on the next one.
 */
export function usePolitikGame(settings: PolitikSettings): PolitikSession {
  const [game, setGame] = useState<PolitikGame>(() =>
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
  const beginGame = useCallback((next: PolitikGame) => {
    const now = Date.now();
    meta.current = { startedAt: now, playTimeMs: 0, isOutcomeRecorded: false };
    activeSince.current = now;
    recordGameStarted(GAME_ID, now);
    invalidateStats();
    saveSession(GAME_ID, { state: next, ...meta.current });
  }, []);

  // Pull in the saved game once, after the first render matched the HTML.
  // Reading storage during that first render would make it differ from the
  // prerendered markup and break hydration.
  useEffect(() => {
    if (!isReady.current) {
      isReady.current = true;
      const saved = loadSession(GAME_ID, isPolitikGame);
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
          // Most victory points wins; a shared lead counts as a win.
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

  // The computer takes its turn, one move at a time.
  const botOnTurn =
    game.phase !== "gameOver" && game.players[game.turn]?.isBot === true;
  useEffect(() => {
    if (!botOnTurn) {
      return;
    }
    const timer = setTimeout(() => {
      setGame((current) => {
        const move = aiMove(current);
        const next =
          move === null ? null : applyMove(current, current.turn, move);
        return next ?? current;
      });
    }, AI_MOVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [botOnTurn, game]);

  const play = useCallback((move: PolitikMove) => {
    setGame((current) => {
      const mine =
        current.turn === MY_SEAT && current.players[MY_SEAT].isBot === false;
      return (mine ? applyMove(current, MY_SEAT, move) : null) ?? current;
    });
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

  return { game, mySeat: MY_SEAT, busy: botOnTurn, play, newGame };
}
