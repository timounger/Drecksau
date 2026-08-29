/**
 * Drives a game against the computer from React.
 *
 * @module
 * @remarks
 * The same shape as the other games of the collection: the engine is the
 * referee, and this only decides *when* the computer players move, keeping the
 * session, the play time and the statistics in order.
 *
 * A Monopoly turn is **a dozen moves** - roll, buy, build, build, offer, end -
 * so the effect fires once per move rather than once per turn. That is what
 * lets a player watch what an opponent did instead of finding the board
 * rearranged.
 *
 * The seat the effect waits for is {@link seatOnTurn}, not `active`, and in this
 * game those come apart constantly: an auction is answered by whoever has to
 * bid, a trade by whoever it was put to, and a debt by whoever owes it. None of
 * those need be the player whose turn it is.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiMove, botWaitMs } from "@/games/monopoly/engine/ai";
import { applyMove, seatOnTurn } from "@/games/monopoly/engine/moves";
import { isMonopolyGame } from "@/games/monopoly/engine/serialization";
import {
  SELF_NAME,
  createGame,
  soloSeats,
} from "@/games/monopoly/engine/setup";
import type { MonopolyGame, MonopolyMove } from "@/games/monopoly/engine/state";
import {
  loadSettings,
  type MonopolySettings,
} from "@/games/monopoly/settings/app-settings";
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
const GAME_ID: GameId = "monopoly";

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

/** Opponents the prerendered placeholder table shows. */
const DEFAULT_PARTNERS = 3;

/** What the test button pays out. */
const TEST_CASH = 1000;

/** The bookkeeping that travels with a saved game. */
type SessionMeta = {
  startedAt: number;
  playTimeMs: number;
  isOutcomeRecorded: boolean;
};

/** What the game screen needs from the hook. */
export type MonopolySession = {
  readonly game: MonopolyGame;
  /** Which seat the human plays. */
  readonly mySeat: number;
  readonly play: (move: MonopolyMove) => void;
  /** Shuffles a fresh game with the settings as they stand. */
  readonly newGame: () => void;
  /**
   * Pays the human {@link TEST_CASH} out of nowhere - for testing.
   *
   * @remarks
   * A game of Monopoly takes an hour to reach the interesting decisions, and
   * every one of them is about money. This is the shortcut to them, the way the
   * level buttons over the Panzerkiste field are: it belongs to the screen you
   * play against the computer on, and to nothing else. It is deliberately not
   * a move - a move would travel to the other seats online, and no table wants
   * a button that prints money.
   */
  readonly testCash: () => void;
};

/**
 * Runs one game against the computer.
 *
 * @param settings - how many sit at the table
 * @returns the running game and the actions on it
 */
export function useMonopolyGame(settings: MonopolySettings): MonopolySession {
  const [game, setGame] = useState<MonopolyGame>(() =>
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
  const beginGame = useCallback((next: MonopolyGame) => {
    const now = Date.now();
    meta.current = { startedAt: now, playTimeMs: 0, isOutcomeRecorded: false };
    activeSince.current = now;
    recordGameStarted(GAME_ID, now);
    invalidateStats();
    saveSession(GAME_ID, { state: next, ...meta.current });
  }, []);

  // Pull in the saved game once, after the first render matched the HTML.
  //
  // Setting state from an effect is what this one is for: the game on screen
  // during the prerender is a placeholder, and the real one lives in storage,
  // which exists only here. The rule cannot tell that apart, and the ref guard
  // keeps it to a single run.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isReady.current) {
      isReady.current = true;
      // Read storage rather than the ref. This runs during the very first
      // commit, and the settings arrive through an external store whose values
      // exist only in the browser: at this moment the ref may still hold the
      // defaults the prerender rendered with. A table set to six seats would
      // then deal four, and both house rules would come up switched on however
      // they were left. Every later game goes through the ref as before.
      const house = loadSettings();
      const saved = loadSession(GAME_ID, isMonopolyGame);
      if (saved === null) {
        const fresh = createGame(
          soloSeats(HUMAN_NAME, house.playerCount - 1),
          Date.now() >>> 0,
          house.parkingPot,
          house.doubleGo,
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
        // A game saved before the house rules existed carries none of these
        // fields; the settings fill them in, so an older state keeps
        // everything it does have and plays on under the rules on offer now.
        setGame({
          ...saved.state,
          pot: saved.state.pot ?? 0,
          parkingPot: saved.state.parkingPot ?? house.parkingPot,
          doubleGo: saved.state.doubleGo ?? house.doubleGo,
        });
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
          // A shared win - which the truce card's tie-break allows - counts.
          won: game.winners.includes(MY_SEAT),
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

  const play = useCallback((move: MonopolyMove) => {
    setGame((current) => applyMove(current, MY_SEAT, move) ?? current);
  }, []);

  const testCash = useCallback(() => {
    setGame((current) =>
      current.phase === "gameOver"
        ? current
        : {
            ...current,
            players: current.players.map((player, seat) =>
              seat === MY_SEAT
                ? { ...player, cash: player.cash + TEST_CASH }
                : player,
            ),
            log: [
              ...current.log,
              `${current.players[MY_SEAT].name}: nimmt ${TEST_CASH} € aus der Bank (Cheat).`,
            ],
          },
    );
  }, []);

  const newGame = useCallback(() => {
    flushPlayTime(Date.now());
    clearSession(GAME_ID);
    const fresh = createGame(
      soloSeats(HUMAN_NAME, settingsRef.current.playerCount - 1),
      Date.now() >>> 0,
      settingsRef.current.parkingPot,
      settingsRef.current.doubleGo,
    );
    beginGame(fresh);
    setGame(fresh);
  }, [flushPlayTime, beginGame]);

  return { game, mySeat: MY_SEAT, play, newGame, testCash };
}
