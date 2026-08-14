/**
 * Drives a game against computer partners from React.
 *
 * @module
 * @remarks
 * The one hook in this collection where the **clock** is the opponent. Every
 * other game asks the computer what to do; this one asks it *when*, and then
 * gets out of the way.
 *
 * Each computer seat holding cards gets a timer of its own, set to how long
 * that seat should sit on its lowest card
 * ({@link @/games/the-mind/engine/ai.botWaitMs}). Every change to the game
 * resets all of them - which is not a shortcut but the right behaviour: when a
 * card comes down, the gap to everybody else's lowest card shrinks, and so
 * does the time they should still be waiting.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { botMove, botWaitMs } from "@/games/the-mind/engine/ai";
import { applyMove } from "@/games/the-mind/engine/moves";
import { isMindGame } from "@/games/the-mind/engine/serialization";
import { createGame, soloSeats } from "@/games/the-mind/engine/setup";
import type { MindGame, MindMove } from "@/games/the-mind/engine/state";
import type { MindSettings } from "@/games/the-mind/settings/app-settings";
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
const GAME_ID: GameId = "the-mind";

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
const INITIAL_SEED = 20240707;

/** Partners the prerendered placeholder table shows. */
const DEFAULT_PARTNERS = 2;

/** The bookkeeping that travels with a saved game. */
type SessionMeta = {
  startedAt: number;
  playTimeMs: number;
  isOutcomeRecorded: boolean;
};

/** What the game screen needs from the hook. */
export type MindSession = {
  readonly game: MindGame;
  /** Which seat the human plays. */
  readonly mySeat: number;
  readonly play: (move: MindMove) => void;
  /** Deals a fresh game with the settings as they stand. */
  readonly newGame: () => void;
};

/**
 * Runs one game with computer partners.
 *
 * @param settings - how many play together
 * @returns the running game and the actions on it
 */
export function useMindGame(settings: MindSettings): MindSession {
  const [game, setGame] = useState<MindGame>(() =>
    createGame(soloSeats(HUMAN_NAME, DEFAULT_PARTNERS), INITIAL_SEED),
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
  const beginGame = useCallback((next: MindGame) => {
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
      const saved = loadSession(GAME_ID, isMindGame);
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
          // Cooperative: everybody wins together or nobody does.
          won: game.won,
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
   * One timer per computer partner, reset on every change.
   *
   * @remarks
   * A partner does not commit to a moment when it picks up its cards - it
   * keeps re-reading the table, exactly as a person does. When somebody plays
   * the 40, the one holding the 44 stops waiting nearly as long.
   *
   * A partner whose tab is hidden still plays: the timers are the game, not an
   * animation, and pausing them would hand the player a way to think for ever.
   */
  useEffect(() => {
    if (game.phase !== "playing") {
      return;
    }
    const timers = game.players.map((player, seat) => {
      const wait = player.isBot ? botWaitMs(game, seat) : null;
      return wait === null
        ? null
        : window.setTimeout(() => {
            setGame((current) =>
              current === game
                ? (applyMove(current, seat, botMove()) ?? current)
                : current,
            );
          }, wait);
    });
    return () => {
      for (const timer of timers) {
        if (timer !== null) {
          window.clearTimeout(timer);
        }
      }
    };
  }, [game]);

  const play = useCallback((move: MindMove) => {
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

  return { game, mySeat: MY_SEAT, play, newGame };
}
