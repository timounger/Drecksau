/**
 * Drives a game against the computer from React.
 *
 * @module
 * @remarks
 * The effect that plays for the computer asks the engine **who the table is
 * waiting for**, not whose turn it is - and here those are different more often
 * than in any other game of the collection. An open Nö! window is answered by
 * whoever holds a Nö!, a Gefallen by its victim, and neither of them is the
 * player on turn. Asking {@link seatOnTurn} rather than reading `active` is
 * what keeps the table from waiting on somebody who is not allowed to move.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiMove, botWaitMs } from "@/games/exploding-kittens/engine/ai";
import { applyMove, seatOnTurn } from "@/games/exploding-kittens/engine/moves";
import { isExplodingKittensGame } from "@/games/exploding-kittens/engine/serialization";
import { createGame, soloSeats } from "@/games/exploding-kittens/engine/setup";
import {
  SELF_NAME,
  survivor,
  type ExplodingKittensGame,
  type ExplodingKittensMove,
} from "@/games/exploding-kittens/engine/state";
import type { ExplodingKittensSettings } from "@/games/exploding-kittens/settings/app-settings";
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
const GAME_ID: GameId = "exploding-kittens";

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
 * Fixed on purpose: the page is prerendered, and a random deal would differ
 * from the markup the browser gets. The real game replaces it on mount.
 */
const INITIAL_SEED = 20240821;

/** Opponents the prerendered placeholder table shows. */
const DEFAULT_OPPONENTS = 3;

/** The bookkeeping that travels with a saved game. */
type SessionMeta = {
  startedAt: number;
  playTimeMs: number;
  isOutcomeRecorded: boolean;
};

/** What the game screen needs from the hook. */
export type ExplodingKittensSession = {
  readonly game: ExplodingKittensGame;
  /** Which seat the human plays. */
  readonly mySeat: number;
  readonly play: (move: ExplodingKittensMove) => void;
  /** Deals a fresh game with the settings as they stand. */
  readonly newGame: () => void;
};

/**
 * Runs one game against the computer.
 *
 * @param settings - the table size and whether the faster game is on
 * @returns the running game and the actions on it
 */
export function useExplodingKittensGame(
  settings: ExplodingKittensSettings,
): ExplodingKittensSession {
  const [game, setGame] = useState<ExplodingKittensGame>(() =>
    createGame(
      soloSeats(HUMAN_NAME, DEFAULT_OPPONENTS),
      { fastGame: false },
      INITIAL_SEED,
    ),
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

  /** Deals a game the way the settings say. */
  const deal = useCallback(
    () =>
      createGame(
        soloSeats(HUMAN_NAME, settingsRef.current.playerCount - 1),
        { fastGame: settingsRef.current.fastGame },
        Date.now() >>> 0,
      ),
    [],
  );

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
  const beginGame = useCallback((next: ExplodingKittensGame) => {
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
      const saved = loadSession(GAME_ID, isExplodingKittensGame);
      if (saved === null) {
        const fresh = createGame(
          soloSeats(HUMAN_NAME, settingsRef.current.playerCount - 1),
          { fastGame: settingsRef.current.fastGame },
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
          // Surviving is the whole of winning here, and only one seat does.
          won: survivor(game) === MY_SEAT,
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

  const play = useCallback((move: ExplodingKittensMove) => {
    setGame((current) => applyMove(current, MY_SEAT, move) ?? current);
  }, []);

  const newGame = useCallback(() => {
    flushPlayTime(Date.now());
    clearSession(GAME_ID);
    const fresh = deal();
    beginGame(fresh);
    setGame(fresh);
  }, [flushPlayTime, beginGame, deal]);

  return { game, mySeat: MY_SEAT, play, newGame };
}
