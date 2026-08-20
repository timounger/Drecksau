/**
 * Drives a game against the computer from React.
 *
 * @module
 * @remarks
 * Two clocks run here, not one, because this game has two ways for a computer
 * player to act. One is its turn - the ordinary case every other game has. The
 * other is Zwischenschmeißen: a seat that is **not** on turn racing to finish
 * the quartet of the card just laid.
 *
 * Both are armed at the same time and the first to fire wins, which is what
 * makes it a race rather than a rule. The jumping seat is given the longer,
 * more variable pause of the two, so a human at the table has a real chance of
 * being quicker - "du musst jedoch schnell sein" is the whole point of the
 * card, and it stops being a game if the machine always wins it.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiMove, botWaitMs, jumpWaitMs } from "@/games/jammerlappen/engine/ai";
import {
  applyMove,
  jumpInIds,
  seatOnTurn,
} from "@/games/jammerlappen/engine/moves";
import { isJammerlappenGame } from "@/games/jammerlappen/engine/serialization";
import { createGame, soloSeats } from "@/games/jammerlappen/engine/setup";
import {
  SELF_NAME,
  jammerlappen,
  type JammerlappenGame,
  type JammerlappenMove,
} from "@/games/jammerlappen/engine/state";
import type { JammerlappenSettings } from "@/games/jammerlappen/settings/app-settings";
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
const GAME_ID: GameId = "jammerlappen";

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
const INITIAL_SEED = 20240820;

/** Opponents the prerendered placeholder table shows. */
const DEFAULT_OPPONENTS = 3;

/** The bookkeeping that travels with a saved game. */
type SessionMeta = {
  startedAt: number;
  playTimeMs: number;
  isOutcomeRecorded: boolean;
};

/** What the game screen needs from the hook. */
export type JammerlappenSession = {
  readonly game: JammerlappenGame;
  /** Which seat the human plays. */
  readonly mySeat: number;
  readonly play: (move: JammerlappenMove) => void;
  /** Deals a fresh round with the settings as they stand. */
  readonly newGame: () => void;
};

/**
 * Runs one game against the computer.
 *
 * @param settings - how many sit at the table
 * @returns the running game and the actions on it
 */
export function useJammerlappenGame(
  settings: JammerlappenSettings,
): JammerlappenSession {
  const [game, setGame] = useState<JammerlappenGame>(() =>
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
  const beginGame = useCallback((next: JammerlappenGame) => {
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
      const saved = loadSession(GAME_ID, isJammerlappenGame);
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
          // There is nothing to win here - getting out at all is the win, and
          // being the last one holding cards is the only way to lose.
          won: jammerlappen(game) !== MY_SEAT,
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

  /** Plays one seat's move, ignoring it if the referee turns it down. */
  const playAs = useCallback((seat: number) => {
    setGame((current) => {
      const move = aiMove(current, seat);
      return (move === null ? null : applyMove(current, seat, move)) ?? current;
    });
  }, []);

  /**
   * The computer seat the table is waiting for, or -1 when it is the human's.
   *
   * @remarks
   * Asked of the engine rather than worked out here, because who is being
   * waited for is a rule: during the swap it is everybody in turn, which is not
   * the player whose turn it is.
   */
  const waiting = seatOnTurn(game);
  const onTurn = waiting !== null && game.players[waiting].isBot ? waiting : -1;

  useEffect(() => {
    if (onTurn < 0) {
      return;
    }
    const timer = setTimeout(() => playAs(onTurn), botWaitMs(game));
    return () => clearTimeout(timer);
  }, [onTurn, game, playAs]);

  // The other clock: a computer seat that is not on turn but can finish the
  // quartet lying on the pot.
  const jumper = firstJumper(game);

  useEffect(() => {
    if (jumper < 0) {
      return;
    }
    const timer = setTimeout(() => playAs(jumper), jumpWaitMs(game));
    return () => clearTimeout(timer);
  }, [jumper, game, playAs]);

  const play = useCallback((move: JammerlappenMove) => {
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

  // No "busy" flag on purpose: while a computer player is thinking, the human
  // may still throw in - that is exactly the move this game is built around.
  return { game, mySeat: MY_SEAT, play, newGame };
}

/**
 * The first computer seat that could throw in right now.
 *
 * @param game - the current game
 * @returns the seat, or -1 when nobody can
 */
function firstJumper(game: JammerlappenGame): number {
  return game.players.findIndex(
    (player, seat) => player.isBot && jumpInIds(game, seat) !== null,
  );
}
