/**
 * Drives a game against the computer from React.
 *
 * @module
 * @remarks
 * You play one side, the computer the other: Mister X against your
 * detectives, or your Mister X against its detectives. Both live in the one
 * browser, so the game holds Mister X's real position - but whenever you play
 * the detectives, the screen is handed {@link viewFor} instead and the
 * computer's detectives read only the redacted game (see `engine/ai.ts`).
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
import { aiMove, botWaitMs } from "@/games/scotland-yard/engine/ai";
import { applyMove, playerOnTurn } from "@/games/scotland-yard/engine/moves";
import { isScotlandYardGame } from "@/games/scotland-yard/engine/serialization";
import { createGame, soloPlayers } from "@/games/scotland-yard/engine/setup";
import type {
  Role,
  ScotlandYardGame,
  ScotlandYardMove,
} from "@/games/scotland-yard/engine/state";
import type { ScotlandYardSettings } from "@/games/scotland-yard/settings/app-settings";
import { SCOTLAND_YARD_TEXTS as T } from "@/games/scotland-yard/i18n/texts";
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
const GAME_ID: GameId = "scotland-yard";

/** Longest gap counted as play time, so a tab left open does not inflate it. */
const MAX_COUNTED_PAUSE_MS = 60_000;

/**
 * The start cards the very first render uses.
 *
 * @remarks
 * Fixed on purpose: the page is prerendered, and a random draw would differ
 * from the markup the browser gets. The real game replaces it on mount.
 */
const INITIAL_SEED = 20240658;

/** The bookkeeping that travels with a saved game. */
type SessionMeta = {
  startedAt: number;
  playTimeMs: number;
  isOutcomeRecorded: boolean;
};

/** What the game screen needs from the hook. */
export type ScotlandYardSession = {
  /** The full game - render it only through `viewFor`. */
  readonly game: ScotlandYardGame;
  /** The side the human plays in this game. */
  readonly role: Role;
  /** The players the human moves, by index. */
  readonly mine: readonly number[];
  readonly play: (move: ScotlandYardMove) => void;
  /** Starts a fresh game with the settings as they stand. */
  readonly newGame: () => void;
};

/**
 * Runs one game against the computer.
 *
 * @param settings - side, table size, variant and name
 * @returns the running game and the actions on it
 */
export function useScotlandYardGame(
  settings: ScotlandYardSettings,
): ScotlandYardSession {
  const [game, setGame] = useState<ScotlandYardGame>(() =>
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
  const beginGame = useCallback((next: ScotlandYardGame) => {
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
      const saved = loadSession(GAME_ID, isScotlandYardGame);
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
          won: game.winner === humanRole(game),
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

  const play = useCallback((move: ScotlandYardMove) => {
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
    role: humanRole(game),
    mine: game.players.flatMap((player, index) =>
      player.isBot ? [] : [index],
    ),
    play,
    newGame,
  };
}

/** A new game from the settings. */
function fresh(settings: ScotlandYardSettings, seed: number): ScotlandYardGame {
  return createGame(
    soloPlayers(T.you, settings.role, settings.players),
    { variant: settings.variant, misterXName: settings.misterXName },
    seed,
  );
}

/** The game with every human player called by the given name. */
function withHumanName(game: ScotlandYardGame, name: string): ScotlandYardGame {
  return game.players.every((player) => player.isBot || player.name === name)
    ? game
    : {
        ...game,
        players: game.players.map((player) =>
          player.isBot ? player : { ...player, name },
        ),
      };
}

/** The side the human plays in a game against the computer. */
function humanRole(game: ScotlandYardGame): Role {
  return game.players.find((player) => !player.isBot)?.role ?? "detectives";
}
