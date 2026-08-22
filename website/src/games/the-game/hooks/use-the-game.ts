/**
 * Drives a game against the computer from React.
 *
 * @module
 * @remarks
 * The same shape as the other games of the collection: the engine is the
 * referee, and this only decides *when* the computer partners move, keeping the
 * session, the play time and the statistics in order.
 *
 * The one thing worth knowing is that a partner's turn is **several moves** -
 * it lays a card, then another, then perhaps a marker, then passes - so the
 * effect fires once per move rather than once per turn. That is what makes a
 * partner's turn readable: each card lands where the last one left the row.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiMove, botWaitMs } from "@/games/the-game/engine/ai";
import { applyMove, seatOnTurn } from "@/games/the-game/engine/moves";
import { isTheGame } from "@/games/the-game/engine/serialization";
import {
  SELF_NAME,
  createGame,
  soloSeats,
} from "@/games/the-game/engine/setup";
import type { TheGame, TheGameMove } from "@/games/the-game/engine/state";
import type { TheGameSettings } from "@/games/the-game/settings/app-settings";
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
const GAME_ID: GameId = "the-game";

/** The human always sits first. */
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

/** Partners the prerendered placeholder table shows. */
const DEFAULT_PARTNERS = 2;

/** The bookkeeping that travels with a saved game. */
type SessionMeta = {
  startedAt: number;
  playTimeMs: number;
  isOutcomeRecorded: boolean;
};

/** What the game screen needs from the hook. */
export type TheGameSession = {
  readonly game: TheGame;
  /** Which seat the human plays. */
  readonly mySeat: number;
  readonly play: (move: TheGameMove) => void;
  /** Shuffles a fresh game with the settings as they stand. */
  readonly newGame: () => void;
};

/**
 * Runs one game against the computer.
 *
 * @param settings - how many sit at the table
 * @returns the running game and the actions on it
 */
export function useTheGame(settings: TheGameSettings): TheGameSession {
  const [game, setGame] = useState<TheGame>(() =>
    createGame(soloSeats(HUMAN_NAME, DEFAULT_PARTNERS), "normal", INITIAL_SEED),
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
  const beginGame = useCallback((next: TheGame) => {
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
      const saved = loadSession(GAME_ID, isTheGame);
      if (saved === null) {
        const fresh = createGame(
          soloSeats(HUMAN_NAME, settingsRef.current.playerCount - 1),
          settingsRef.current.variant,
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
          saved.state.phase !== "playing" ? null : Date.now();
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
      if (game.phase !== "playing" && !meta.current.isOutcomeRecorded) {
        meta.current.isOutcomeRecorded = true;
        activeSince.current = null;
        recordGameFinished(GAME_ID, {
          // Nobody wins this alone. A win is all 98 cards down, which is what
          // the box means by beating it - anything else is a result, not a win.
          won: game.phase === "won",
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
        activeSince.current = game.phase !== "playing" ? null : now;
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
    }, botWaitMs(game));
    return () => clearTimeout(timer);
  }, [pending, game]);

  const play = useCallback((move: TheGameMove) => {
    setGame((current) => applyMove(current, MY_SEAT, move) ?? current);
  }, []);

  const newGame = useCallback(() => {
    flushPlayTime(Date.now());
    clearSession(GAME_ID);
    const fresh = createGame(
      soloSeats(HUMAN_NAME, settingsRef.current.playerCount - 1),
      settingsRef.current.variant,
      Date.now() >>> 0,
    );
    beginGame(fresh);
    setGame(fresh);
  }, [flushPlayTime, beginGame]);

  return { game, mySeat: MY_SEAT, play, newGame };
}
