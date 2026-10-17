/**
 * Drives a game against the computer from React.
 *
 * @module
 * @remarks
 * You and one to seven computers. The computers' moves run here on a timer;
 * the game is saved after every move, and the statistics count a game as won
 * when you are the first with a full timeline.
 */
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { aiMove, botWaitMs } from "@/games/hitster/engine/ai";
import {
  applyMove,
  createGame,
  playerOnTurn,
} from "@/games/hitster/engine/rules";
import { isHitsterGame } from "@/games/hitster/engine/serialization";
import type { HitsterGame, HitsterMove } from "@/games/hitster/engine/state";
import type { HitsterSettings } from "@/games/hitster/settings/app-settings";
import { HITSTER_TEXTS as T } from "@/games/hitster/i18n/texts";
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
import { playerNameStore } from "@/online/player-name";

/** This game's id for storage and statistics. */
const GAME_ID: GameId = "hitster";

/** Longest gap counted as play time, so a tab left open does not inflate it. */
const MAX_COUNTED_PAUSE_MS = 60_000;

/**
 * The shuffle the very first render uses.
 *
 * @remarks
 * Fixed on purpose: the page is prerendered, and a random draw would differ
 * from the markup the browser gets. The real game replaces it on mount.
 */
const INITIAL_SEED = 20221001;

/** The bookkeeping that travels with a saved game. */
type SessionMeta = {
  startedAt: number;
  playTimeMs: number;
  isOutcomeRecorded: boolean;
};

/** What the game screen needs from the hook. */
export type HitsterSession = {
  readonly game: HitsterGame;
  /** The human's seat. */
  readonly mine: number;
  readonly play: (move: HitsterMove) => void;
  /** Starts a fresh game with the settings as they stand. */
  readonly newGame: () => void;
};

/**
 * Runs one game against the computer.
 *
 * @param settings - how many computers, how good, how many cards win
 * @returns the running game and the actions on it
 */
export function useHitsterGame(settings: HitsterSettings): HitsterSession {
  const [game, setGame] = useState<HitsterGame>(() =>
    fresh(settings, INITIAL_SEED),
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
  const beginGame = useCallback((next: HitsterGame) => {
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
      const saved = loadSession(GAME_ID, isHitsterGame);
      if (saved === null) {
        const next = fresh(settingsRef.current, Date.now() >>> 0);
        beginGame(next);
        setGame(next);
      } else {
        meta.current = {
          startedAt: saved.startedAt,
          playTimeMs: saved.playTimeMs,
          isOutcomeRecorded: saved.isOutcomeRecorded,
        };
        activeSince.current = saved.state.phase === "over" ? null : Date.now();
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
      if (game.phase === "over" && !meta.current.isOutcomeRecorded) {
        meta.current.isOutcomeRecorded = true;
        activeSince.current = null;
        recordGameFinished(GAME_ID, {
          won:
            game.winner !== null && game.players[game.winner]?.isBot === false,
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
        activeSince.current = game.phase === "over" ? null : now;
      } else {
        flushPlayTime(now);
        activeSince.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [game.phase, flushPlayTime]);

  // The player the table waits for, if the computer plays them.
  const waiting = playerOnTurn(game);
  const pending =
    waiting !== null && game.players[waiting]?.isBot === true ? waiting : -1;

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (pending >= 0) {
      const timer = setTimeout(() => {
        setGame((current) => {
          const move = aiMove(current);
          return (
            (move === null ? null : applyMove(current, pending, move)) ??
            current
          );
        });
      }, botWaitMs());
      cleanup = () => clearTimeout(timer);
    }
    return cleanup;
  }, [pending, game]);

  const play = useCallback((move: HitsterMove) => {
    setGame((current) => {
      const player = playerOnTurn(current);
      return player === null || current.players[player]?.isBot !== false
        ? current
        : (applyMove(current, player, move) ?? current);
    });
  }, []);

  const newGame = useCallback(() => {
    flushPlayTime(Date.now());
    clearSession(GAME_ID);
    const next = fresh(settingsRef.current, Date.now() >>> 0);
    beginGame(next);
    setGame(next);
  }, [flushPlayTime, beginGame]);

  // The human goes by the name of their player profile, the same in every
  // game - read live, so renaming it shows at once, saved games included.
  const profileName = useSyncExternalStore(
    playerNameStore.subscribe,
    playerNameStore.getSnapshot,
    playerNameStore.getServerSnapshot,
  ).trim();
  const named = useMemo(
    () => withHumanName(game, profileName === "" ? T.you : profileName),
    [game, profileName],
  );

  return {
    game: named,
    mine: Math.max(
      0,
      game.players.findIndex((player) => !player.isBot),
    ),
    play,
    newGame,
  };
}

/** A new game from the settings: you first, the computers after. */
function fresh(settings: HitsterSettings, seed: number): HitsterGame {
  return createGame(
    [
      { name: T.you, isBot: false },
      ...Array.from({ length: settings.computers }, (unused, index) => ({
        name: `${T.computer} ${String(index + 1)}`,
        isBot: true,
      })),
    ],
    settings.target,
    settings.difficulty,
    seed,
  );
}

/** The game with every human player called by the given name. */
function withHumanName(game: HitsterGame, name: string): HitsterGame {
  return game.players.every((player) => player.isBot || player.name === name)
    ? game
    : {
        ...game,
        players: game.players.map((player) =>
          player.isBot ? player : { ...player, name },
        ),
      };
}
