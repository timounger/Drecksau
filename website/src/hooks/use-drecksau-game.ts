/**
 * React state of a running game: human moves, target selection, AI turns,
 * plus saving the game and feeding the statistics.
 *
 * @module
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EFFECT_DURATIONS_MS,
  type CardEffect,
} from "@/components/action-effect-overlay";
import { chooseAiMove } from "@/game/ai";
import { applyMove } from "@/game/engine";
import { isBlocked, legalTargets, needsTarget } from "@/game/moves";
import { isGameState } from "@/game/serialization";
import { createGame, type PlayerSetup } from "@/game/setup";
import { humanName, loadSettings } from "@/lib/settings/app-settings";
import {
  currentPlayer,
  handCardById,
  type GameState,
  type Move,
  type PigId,
} from "@/game/state";
import type { GameId } from "@/games/registry";
import { loadSession, saveSession } from "@/lib/storage/game-session";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";
import { pickOpponentNames } from "@/i18n/player-names";
import { HUMAN_PLAYER_NAME } from "@/i18n/translations";

/** Which game this hook drives - the key for saved state and statistics. */
const GAME_ID: GameId = "drecksau";

/** Seed of the very first game - fixed so server and client render alike. */
const INITIAL_SEED = 20260715;

/** How long a computer opponent "thinks", in milliseconds. */
const AI_MOVE_DELAY_MS = 900;

/**
 * Longest pause that still counts as play time.
 *
 * @remarks
 * A tab left open all night would otherwise add hours to the statistics. Only
 * up to this much is counted per span, which keeps thinking pauses in and
 * leaves "went away" out.
 */
const MAX_COUNTED_PAUSE_MS = 120_000;

/** Session facts that ride along with the state but never trigger a render. */
type SessionMeta = {
  startedAt: number;
  playTimeMs: number;
  isOutcomeRecorded: boolean;
};

/** What the hook exposes to the UI. */
export type DrecksauGame = {
  readonly state: GameState;
  /** Players at the table - follows a restored game, not the last selection. */
  readonly playerCount: number;
  /** True while it is the human player's turn and nobody has won. */
  readonly isHumanTurn: boolean;
  /** The hand card the human picked and still needs a target for. */
  readonly selectedCardId: string | null;
  /** Pigs the selected card may be played at. */
  readonly targetPigIds: readonly PigId[];
  /** True if none of the human's cards can be played. */
  readonly isHumanBlocked: boolean;
  /** The card effect currently being animated, or null. */
  readonly effect: CardEffect | null;
  /** Picks a hand card - plays it at once if it needs no target. */
  readonly selectCard: (cardId: string) => void;
  /** Drops the current selection. */
  readonly clearSelection: () => void;
  /** Plays the selected card at a pig. */
  readonly playAtPig: (pigId: PigId) => void;
  /** Puts a hand card on the discard pile unused. */
  readonly discard: (cardId: string) => void;
  /** Blockade rule: swap the whole hand. */
  readonly redraw: () => void;
  /** Starts a fresh game with the given number of players. */
  readonly startGame: (playerCount: number) => void;
};

/**
 * Drives a Drecksau game from React and keeps it across reloads.
 *
 * @param initialPlayerCount - table size of the very first game
 * @returns the game state plus the actions the UI needs
 * @remarks
 * The first render must match the prerendered HTML, so the saved game is only
 * pulled in afterwards, on mount. Until then the deterministic starting game
 * from {@link INITIAL_SEED} is shown.
 */
export function useDrecksauGame(initialPlayerCount: number): DrecksauGame {
  // The prerender must not read localStorage, so the very first game is always
  // the base game under the neutral name; the saved game and the settings
  // arrive on mount.
  const [state, setState] = useState<GameState>(() =>
    createGame(
      buildSetups(initialPlayerCount, HUMAN_PLAYER_NAME, INITIAL_SEED),
      { seed: INITIAL_SEED, withExpansion: false },
    ),
  );
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [effect, setEffect] = useState<CardEffect | null>(null);

  // Rises with every effect so the same card twice restarts the animation.
  const effectCounter = useRef(0);
  const session = useRef<SessionMeta>({
    startedAt: 0,
    playTimeMs: 0,
    isOutcomeRecorded: false,
  });
  // Start of the span currently being counted, or null while nothing counts.
  const activeSince = useRef<number | null>(null);
  const isReady = useRef(false);

  const actor = currentPlayer(state);
  const isHumanTurn = actor.isHuman && state.winnerId === null;

  /** Books the time since the last flush, capped against long absences. */
  const flushPlayTime = useCallback((now: number) => {
    const since = activeSince.current;
    if (since !== null) {
      const elapsed = Math.min(now - since, MAX_COUNTED_PAUSE_MS);
      if (elapsed > 0) {
        session.current.playTimeMs += elapsed;
        recordPlayTime(GAME_ID, elapsed, now);
      }
      activeSince.current = now;
    }
  }, []);

  const beginGame = useCallback((next: GameState) => {
    const now = Date.now();
    session.current = {
      startedAt: now,
      playTimeMs: 0,
      isOutcomeRecorded: false,
    };
    activeSince.current = now;
    recordGameStarted(GAME_ID, now);
    saveSession(GAME_ID, { state: next, ...session.current });
  }, []);

  // Pull in the saved game once, after the first render matched the HTML.
  //
  // The setState below is deliberate and cannot move into the initialiser:
  // localStorage does not exist while the page is prerendered, so reading it
  // during the first render would make that render differ from the shipped
  // HTML and break hydration. The guard makes sure it happens exactly once,
  // also under React's double invoked effects in development.
  useEffect(() => {
    if (!isReady.current) {
      isReady.current = true;
      const saved = loadSession(GAME_ID, isGameState);

      if (saved === null) {
        // Nothing saved: the prerendered game only stands if it matches the
        // settings. A chosen name or the expansion means dealing a proper one.
        const settings = loadSettings();
        const name = humanName(settings);
        const matchesPrerender =
          !settings.isExpansionEnabled &&
          !settings.areDefenseCardsEnabled &&
          name === HUMAN_PLAYER_NAME;
        const seed = Date.now();
        const fresh = matchesPrerender
          ? state
          : createGame(buildSetups(initialPlayerCount, name, seed), {
              seed,
              withExpansion: settings.isExpansionEnabled,
              withDefense: settings.areDefenseCardsEnabled,
            });

        beginGame(fresh);
        if (fresh !== state) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
          setState(fresh);
        }
      } else {
        session.current = {
          startedAt: saved.startedAt,
          playTimeMs: saved.playTimeMs,
          isOutcomeRecorded: saved.isOutcomeRecorded,
        };
        activeSince.current = saved.state.winnerId === null ? Date.now() : null;
        setState(saved.state);
      }
    }
    // Runs once on mount; `state` is only read to seed a brand new session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save after every change, and count the outcome exactly once.
  useEffect(() => {
    if (isReady.current) {
      const now = Date.now();
      flushPlayTime(now);

      if (state.winnerId !== null && !session.current.isOutcomeRecorded) {
        session.current.isOutcomeRecorded = true;
        activeSince.current = null;
        recordGameFinished(GAME_ID, {
          won: state.winnerId === state.players[0].id,
          durationMs: session.current.playTimeMs,
          finishedAt: now,
        });
      }

      saveSession(GAME_ID, { state, ...session.current });
    }
  }, [state, flushPlayTime]);

  // Time only counts while the tab is actually in front of the player.
  useEffect(() => {
    const handleVisibility = () => {
      const now = Date.now();
      if (document.visibilityState === "visible") {
        activeSince.current = state.winnerId === null ? now : null;
      } else {
        flushPlayTime(now);
        activeSince.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [state.winnerId, flushPlayTime]);

  const startGame = useCallback(
    (count: number) => {
      setSelectedCardId(null);
      setEffect(null);
      // Read the settings here, not at render: a game keeps the deck and the
      // names it was dealt with, so changes only affect the next game.
      const settings = loadSettings();
      const seed = Date.now();
      const next = createGame(buildSetups(count, humanName(settings), seed), {
        seed,
        withExpansion: settings.isExpansionEnabled,
        withDefense: settings.areDefenseCardsEnabled,
      });
      beginGame(next);
      setState(next);
    },
    [beginGame],
  );

  const clearSelection = useCallback(() => setSelectedCardId(null), []);

  /** Announces the animation for a move - for every player, not just the human. */
  const triggerEffect = useCallback((from: GameState, move: Move) => {
    if (move.kind === "playCard") {
      const card = currentPlayer(from).hand.find(
        (candidate) => candidate.id === move.cardId,
      );
      if (card !== undefined) {
        effectCounter.current += 1;
        setEffect({ type: card.type, id: effectCounter.current });
      }
    }
  }, []);

  /** Runs a move of the human player and animates it. */
  const play = useCallback(
    (move: Move) => {
      triggerEffect(state, move);
      setState((current) => applyMove(current, move));
      setSelectedCardId(null);
    },
    [state, triggerEffect],
  );

  const selectCard = useCallback(
    (cardId: string) => {
      if (isHumanTurn) {
        const card = handCardById(actor, cardId);
        if (needsTarget(card.type)) {
          setSelectedCardId(cardId);
        } else {
          // Rain hits the whole table - there is nothing to aim at.
          play({ kind: "playCard", cardId });
        }
      }
    },
    [actor, isHumanTurn, play],
  );

  const playAtPig = useCallback(
    (pigId: PigId) => {
      if (isHumanTurn && selectedCardId !== null) {
        play({ kind: "playCard", cardId: selectedCardId, targetPigId: pigId });
      }
    },
    [isHumanTurn, play, selectedCardId],
  );

  const discard = useCallback(
    (cardId: string) => {
      if (isHumanTurn) {
        // No animation: an unused card has no effect to show.
        play({ kind: "discardCard", cardId });
      }
    },
    [isHumanTurn, play],
  );

  const redraw = useCallback(() => {
    if (isHumanTurn) {
      play({ kind: "redrawHand" });
    }
  }, [isHumanTurn, play]);

  // Let the computer opponents move, one after another, with a short pause so
  // the player can follow what happens.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (!actor.isHuman && state.winnerId === null) {
      timer = setTimeout(() => {
        // Pick the move out here: the animation has to be announced before the
        // state changes, and a state updater must stay free of side effects.
        const move = chooseAiMove(state);
        triggerEffect(state, move);
        setState((current) =>
          // Skip if a new game replaced the state while we were waiting.
          current === state ? applyMove(current, move) : current,
        );
      }, AI_MOVE_DELAY_MS);
    }

    return () => clearTimeout(timer);
  }, [actor.isHuman, state, triggerEffect]);

  // Take the effect off screen once it has played.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (effect !== null) {
      timer = setTimeout(
        () => setEffect(null),
        EFFECT_DURATIONS_MS[effect.type],
      );
    }

    return () => clearTimeout(timer);
  }, [effect]);

  const targetPigIds = useMemo(() => {
    let targets: PigId[] = [];
    if (isHumanTurn && selectedCardId !== null) {
      const card = actor.hand.find(
        (candidate) => candidate.id === selectedCardId,
      );
      if (card !== undefined) {
        targets = legalTargets(state, actor.id, card.type);
      }
    }
    return targets;
  }, [actor, isHumanTurn, selectedCardId, state]);

  const isHumanBlocked = isHumanTurn && isBlocked(state, actor.id);

  return {
    state,
    playerCount: state.players.length,
    isHumanTurn,
    selectedCardId,
    targetPigIds,
    isHumanBlocked,
    effect,
    selectCard,
    clearSelection,
    playAtPig,
    discard,
    redraw,
    startGame,
  };
}

/**
 * Builds the seating: the human first, then the computer opponents.
 *
 * @param playerCount - how many sit at the table
 * @param humanName - what the human is called, "Du" if they gave no name
 * @param seed - the game's seed; the opponents' names come out of it
 * @returns the seats, in turn order
 */
function buildSetups(
  playerCount: number,
  humanName: string,
  seed: number,
): PlayerSetup[] {
  const opponents = pickOpponentNames(playerCount - 1, humanName, seed).map(
    (name) => ({ name, isHuman: false }),
  );

  return [{ name: humanName, isHuman: true }, ...opponents];
}
