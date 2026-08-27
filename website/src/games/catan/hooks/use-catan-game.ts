/**
 * Drives a game against the computer from React.
 *
 * @module
 * @remarks
 * The same shape as the other games of the collection: the engine is the
 * referee, and this only decides *when* the computer players move, keeping the
 * session, the play time and the statistics in order.
 *
 * A Catan turn is **a dozen moves** - roll, build, trade, build again, end - so
 * the effect fires once per move rather than once per turn. That is what lets a
 * player watch what an opponent did instead of finding the island rearranged.
 * It also means the computer moves for seats that are not on turn: a seven puts
 * everybody over the limit into a discard queue, and an offer puts everybody
 * into an answering one. {@link seatOnTurn} is the single answer to "who now",
 * and this hook simply asks it.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiMove, botWaitMs } from "@/games/catan/engine/ai";
import { applyMove, seatOnTurn } from "@/games/catan/engine/moves";
import {
  isCatanGame,
  reviveCatanGame,
} from "@/games/catan/engine/serialization";
import { createGame, soloSeats } from "@/games/catan/engine/setup";
import type { CatanGame, CatanMove } from "@/games/catan/engine/state";
import type { CatanSettings } from "@/games/catan/settings/app-settings";
import { getSettingsSnapshot } from "@/games/catan/settings/settings-store";
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
const GAME_ID: GameId = "catan";

/** The human always sits first. */
const MY_SEAT = 0;

/** Longest gap counted as play time, so a tab left open does not inflate it. */
const MAX_COUNTED_PAUSE_MS = 60_000;

/**
 * The deal the very first render uses.
 *
 * @remarks
 * Fixed on purpose: the page is prerendered, and a random island would differ
 * from the markup the browser gets. The real game replaces it on mount.
 */
const INITIAL_SEED = 20260823;

/** Seats the prerendered placeholder island shows. */
const DEFAULT_SEATS = 3;

/** The bookkeeping that travels with a saved game. */
type SessionMeta = {
  startedAt: number;
  playTimeMs: number;
  isOutcomeRecorded: boolean;
};

/** What the game screen needs from the hook. */
export type CatanSession = {
  readonly game: CatanGame;
  /** Which seat the human plays. */
  readonly mySeat: number;
  readonly play: (move: CatanMove) => void;
  /** Deals a fresh island with the settings as they stand. */
  readonly newGame: () => void;
};

/**
 * Runs one game against the computer.
 *
 * @param settings - how many sit at the table and how many points win
 * @returns the running game and the actions on it
 */
export function useCatanGame(settings: CatanSettings): CatanSession {
  const [game, setGame] = useState<CatanGame>(() =>
    createGame(soloSeats(DEFAULT_SEATS), INITIAL_SEED),
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
  const beginGame = useCallback((next: CatanGame) => {
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
      const stored = loadSession(GAME_ID, isCatanGame);
      // Filled out, because a session stored before CATAN für Zwei knows
      // nothing of its fields and the referee counts with them.
      const saved =
        stored === null
          ? null
          : { ...stored, state: reviveCatanGame(stored.state) };
      let opening: CatanGame;
      if (saved === null) {
        // Read live rather than through the ref. The ref is seeded from the
        // first render, and on that render the settings store is still handing
        // back its **server** snapshot so the markup matches - so the very
        // first game after changing a setting was built from the defaults, and
        // picking a table of two or of six did nothing until you pressed
        // "Neues Spiel".
        const chosen = getSettingsSnapshot();
        opening = createGame(
          soloSeats(chosen.playerCount),
          Date.now() >>> 0,
          chosen.target,
          chosen.variants,
          chosen.mode,
        );
        beginGame(opening);
      } else {
        meta.current = {
          startedAt: saved.startedAt,
          playTimeMs: saved.playTimeMs,
          isOutcomeRecorded: saved.isOutcomeRecorded,
        };
        activeSince.current =
          saved.state.phase === "gameOver" ? null : Date.now();
        opening = saved.state;
      }
      setGame(opening);
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
          won: game.winner === MY_SEAT,
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
  const pending = waiting !== null && game.players[waiting].bot ? waiting : -1;

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

  const play = useCallback((move: CatanMove) => {
    setGame((current) => applyMove(current, MY_SEAT, move) ?? current);
  }, []);

  const newGame = useCallback(() => {
    flushPlayTime(Date.now());
    clearSession(GAME_ID);
    const fresh = createGame(
      soloSeats(settingsRef.current.playerCount),
      Date.now() >>> 0,
      settingsRef.current.target,
      settingsRef.current.variants,
      settingsRef.current.mode,
    );
    beginGame(fresh);
    setGame(fresh);
  }, [flushPlayTime, beginGame]);

  return { game, mySeat: MY_SEAT, play, newGame };
}
