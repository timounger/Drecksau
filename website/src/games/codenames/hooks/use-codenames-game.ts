/**
 * Drives a game against the computer from React.
 *
 * @module
 * @remarks
 * Three of the four seats are played by the machine, and they take turns
 * without anybody pressing anything - a spymaster says a word, its operatives
 * guess one card at a time, and then the other side does the same. So the
 * effect fires again and again for whichever seat the engine names, with a
 * pause between, because what happens on screen here is a word being read out
 * and a card being turned over, and both need a moment.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiMove, botWaitMs } from "@/games/codenames/engine/ai";
import { applyMove, seatOnTurn } from "@/games/codenames/engine/moves";
import { isCodenamesGame } from "@/games/codenames/engine/serialization";
import { createGame, soloSeats } from "@/games/codenames/engine/setup";
import type {
  CodenamesGame,
  CodenamesMove,
} from "@/games/codenames/engine/state";
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
const GAME_ID: GameId = "codenames";

/** What the human seat is called at the table. */
const HUMAN_NAME = "Du";

/** Longest gap counted as play time, so a tab left open does not inflate it. */
const MAX_COUNTED_PAUSE_MS = 60_000;

/**
 * The deal the very first render uses.
 *
 * @remarks
 * Fixed on purpose: the page is prerendered, and a random board would differ
 * from the markup the browser gets. The real game replaces it on mount.
 */
const INITIAL_SEED = 20240822;

/** The bookkeeping that travels with a saved game. */
type SessionMeta = {
  startedAt: number;
  playTimeMs: number;
  isOutcomeRecorded: boolean;
};

/** What the game screen needs from the hook. */
export type CodenamesSession = {
  readonly game: CodenamesGame;
  /** The seat the human plays - always the one that is not a machine. */
  readonly mySeat: number;
  readonly play: (move: CodenamesMove) => void;
  /** Lays out a fresh board. */
  readonly newGame: () => void;
};

/** Deals a table with one person at it. */
function deal(seed: number): CodenamesGame {
  return createGame(soloSeats(HUMAN_NAME, seed), seed);
}

/**
 * Runs one game against the computer.
 *
 * @returns the running game and the actions on it
 */
export function useCodenamesGame(): CodenamesSession {
  const [game, setGame] = useState<CodenamesGame>(() => deal(INITIAL_SEED));
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
  const beginGame = useCallback((next: CodenamesGame) => {
    const now = Date.now();
    meta.current = { startedAt: now, playTimeMs: 0, isOutcomeRecorded: false };
    activeSince.current = now;
    recordGameStarted(GAME_ID, now);
    invalidateStats();
    saveSession(GAME_ID, { state: next, ...meta.current });
  }, []);

  // The human is whichever seat is not a machine - there is exactly one.
  const mySeat = Math.max(
    0,
    game.seats.findIndex((seat) => !seat.isBot),
  );

  // Pull in the saved game once, after the first render matched the HTML.
  //
  // Setting state from an effect is normally a smell, and here it is the only
  // way: the board a player left behind lives in localStorage, which does not
  // exist while the page is being prerendered. So the first render has to show
  // a fixed board and this has to replace it - once, behind a ref guard.
  /* eslint-disable react-hooks/set-state-in-effect -- see above */
  useEffect(() => {
    if (!isReady.current) {
      isReady.current = true;
      const saved = loadSession(GAME_ID, isCodenamesGame);
      if (saved === null) {
        const seed = Date.now() >>> 0;
        const fresh = createGame(soloSeats(HUMAN_NAME, seed), seed);
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
          // A win belongs to a side, not to a person - and the person is on one.
          won: game.winner === game.seats[mySeat]?.team,
          durationMs: meta.current.playTimeMs,
          finishedAt: now,
        });
        invalidateStats();
      }
      saveSession(GAME_ID, { state: game, ...meta.current });
    }
  }, [game, mySeat, flushPlayTime]);

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
  const pending = waiting !== null && game.seats[waiting].isBot ? waiting : -1;

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

  const play = useCallback(
    (move: CodenamesMove) => {
      setGame((current) => applyMove(current, mySeat, move) ?? current);
    },
    [mySeat],
  );

  const newGame = useCallback(() => {
    flushPlayTime(Date.now());
    clearSession(GAME_ID);
    const fresh = deal(Date.now() >>> 0);
    beginGame(fresh);
    setGame(fresh);
  }, [flushPlayTime, beginGame]);

  return { game, mySeat, play, newGame };
}
