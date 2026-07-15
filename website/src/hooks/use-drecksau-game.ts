/**
 * React state of a running game: human moves, target selection and AI turns.
 *
 * @module
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { chooseAiMove } from "@/game/ai";
import { applyMove } from "@/game/engine";
import { isBlocked, legalTargets, needsTarget } from "@/game/moves";
import { createGame, type PlayerSetup } from "@/game/setup";
import {
  currentPlayer,
  handCardById,
  type GameState,
  type PigId,
} from "@/game/state";
import { HUMAN_PLAYER_NAME } from "@/i18n/translations";

/** Names of the computer opponents, in seating order. */
const OPPONENT_NAMES = ["Berta", "Cleo", "Doris"];

/** Seed of the very first game - fixed so server and client render alike. */
const INITIAL_SEED = 20260715;

/** How long a computer opponent "thinks", in milliseconds. */
const AI_MOVE_DELAY_MS = 900;

/** What the hook exposes to the UI. */
export type DrecksauGame = {
  readonly state: GameState;
  /** True while it is the human player's turn and nobody has won. */
  readonly isHumanTurn: boolean;
  /** The hand card the human picked and still needs a target for. */
  readonly selectedCardId: string | null;
  /** Pigs the selected card may be played at. */
  readonly targetPigIds: readonly PigId[];
  /** True if none of the human's cards can be played. */
  readonly isHumanBlocked: boolean;
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
 * Drives a Drecksau game from React.
 *
 * @param playerCount - how many players the first game has
 * @returns the game state plus the actions the UI needs
 */
export function useDrecksauGame(playerCount: number): DrecksauGame {
  const [state, setState] = useState<GameState>(() =>
    createGame(buildSetups(playerCount), INITIAL_SEED),
  );
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const actor = currentPlayer(state);
  const isHumanTurn = actor.isHuman && state.winnerId === null;

  const startGame = useCallback((count: number) => {
    setSelectedCardId(null);
    setState(createGame(buildSetups(count), Date.now()));
  }, []);

  const clearSelection = useCallback(() => setSelectedCardId(null), []);

  const selectCard = useCallback(
    (cardId: string) => {
      if (isHumanTurn) {
        const card = handCardById(actor, cardId);
        if (needsTarget(card.type)) {
          setSelectedCardId(cardId);
        } else {
          // Rain hits the whole table - there is nothing to aim at.
          setState((current) =>
            applyMove(current, { kind: "playCard", cardId }),
          );
          setSelectedCardId(null);
        }
      }
    },
    [actor, isHumanTurn],
  );

  const playAtPig = useCallback(
    (pigId: PigId) => {
      if (isHumanTurn && selectedCardId !== null) {
        setState((current) =>
          applyMove(current, {
            kind: "playCard",
            cardId: selectedCardId,
            targetPigId: pigId,
          }),
        );
        setSelectedCardId(null);
      }
    },
    [isHumanTurn, selectedCardId],
  );

  const discard = useCallback(
    (cardId: string) => {
      if (isHumanTurn) {
        setState((current) =>
          applyMove(current, { kind: "discardCard", cardId }),
        );
        setSelectedCardId(null);
      }
    },
    [isHumanTurn],
  );

  const redraw = useCallback(() => {
    if (isHumanTurn) {
      setState((current) => applyMove(current, { kind: "redrawHand" }));
      setSelectedCardId(null);
    }
  }, [isHumanTurn]);

  // Let the computer opponents move, one after another, with a short pause so
  // the player can follow what happens.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (!actor.isHuman && state.winnerId === null) {
      timer = setTimeout(() => {
        setState((current) => {
          // The state may have been replaced by a new game in the meantime.
          const stillAiTurn =
            !currentPlayer(current).isHuman && current.winnerId === null;
          return stillAiTurn
            ? applyMove(current, chooseAiMove(current))
            : current;
        });
      }, AI_MOVE_DELAY_MS);
    }

    return () => clearTimeout(timer);
  }, [actor.isHuman, state]);

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
    isHumanTurn,
    selectedCardId,
    targetPigIds,
    isHumanBlocked,
    selectCard,
    clearSelection,
    playAtPig,
    discard,
    redraw,
    startGame,
  };
}

/** Builds the seating: the human first, then the computer opponents. */
function buildSetups(playerCount: number): PlayerSetup[] {
  const opponents = OPPONENT_NAMES.slice(0, playerCount - 1).map((name) => ({
    name,
    isHuman: false,
  }));
  return [{ name: HUMAN_PLAYER_NAME, isHuman: true }, ...opponents];
}
