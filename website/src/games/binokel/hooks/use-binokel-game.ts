/**
 * React state of a Binokel game: human moves and timed computer turns.
 *
 * @module
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Suit } from "@/games/binokel/engine/cards";
import {
  chooseBid,
  chooseCard,
  chooseDiscard,
  chooseTrumpSuit,
} from "@/games/binokel/engine/ai";
import {
  applyBid,
  baseHandSize,
  beginTricks,
  chooseTrump,
  discard,
  nextRound,
  playCard,
} from "@/games/binokel/engine/moves";
import { createGame, type PlayerSetup } from "@/games/binokel/engine/setup";
import { loadBinokelSettings } from "@/games/binokel/settings/binokel-settings";
import type { GameState } from "@/games/binokel/engine/state";
import { legalPlays } from "@/games/binokel/engine/tricks";

/** The human plus two computer opponents. */
const SETUPS: readonly PlayerSetup[] = [
  { name: "Du", isHuman: true },
  { name: "Anna", isHuman: false },
  { name: "Berta", isHuman: false },
];

/** The human always sits first. */
const HUMAN_INDEX = 0;

/** Fixed seed of the first deal - server and client render it alike. */
const INITIAL_SEED = 20260718;

/** Points that end the match. */
const TARGET_SCORE = 1000;

/** Pause before a computer acts, so its turn is watchable. */
const AI_DELAY_MS = 750;

/** How long the melds stay up before trick play begins on its own. */
const MELD_REVIEW_MS = 2200;

/** How long the round result stays up before the next round is dealt. */
const ROUND_REVIEW_MS = 3800;

/** What the Binokel UI needs. */
export type BinokelGame = {
  readonly state: GameState;
  readonly withSevens: boolean;
  /** The cards the human may legally play right now (trick phase). */
  readonly legalCardIds: readonly string[];
  /** True while the game waits for the human to act. */
  readonly isHumanTurn: boolean;
  readonly bid: () => void;
  readonly pass: () => void;
  readonly confirmDiscard: (cardIds: readonly string[]) => void;
  readonly pickTrump: (suit: Suit) => void;
  readonly beginTrickPlay: () => void;
  readonly play: (cardId: string) => void;
  readonly nextRound: () => void;
  /** Starts a fresh match with the deck chosen in the Binokel settings. */
  readonly newMatch: () => void;
};

/**
 * The step that runs on its own next, or null if the game waits for the human.
 *
 * @param state - the game state
 * @returns a transition to apply, or null
 * @remarks
 * Besides the computer's own turns, this also advances the two review steps
 * that need no decision from anyone: showing the melds before trick play, and
 * showing the round result before the next deal. They run automatically after a
 * readable pause (see {@link stepDelay}), so the player never has to click to
 * keep the game moving; the panels still offer a button to skip the pause.
 */
function autoStep(state: GameState): ((s: GameState) => GameState) | null {
  const actor = state.players[state.currentPlayerIndex];
  const declarer =
    state.declarerIndex === null ? null : state.players[state.declarerIndex];
  let move: ((s: GameState) => GameState) | null = null;

  if (state.phase === "bidding" && !actor.isHuman) {
    move = (s) => applyBid(s, chooseBid(s));
  } else if (
    state.phase === "exchange" &&
    declarer !== null &&
    !declarer.isHuman
  ) {
    if (declarer.hand.length > baseHandSize(state)) {
      const need = declarer.hand.length - baseHandSize(state);
      move = (s) => discard(s, chooseDiscard(s, need));
    } else if (state.trump === null) {
      move = (s) => chooseTrump(s, chooseTrumpSuit(s));
    }
  } else if (state.phase === "melding") {
    move = (s) => beginTricks(s);
  } else if (state.phase === "trick" && !actor.isHuman) {
    move = (s) => playCard(s, chooseCard(s));
  } else if (state.phase === "roundEnd") {
    move = (s) => nextRound(s);
  }
  return move;
}

/**
 * How long to wait before the next automatic step, by phase.
 *
 * @param state - the game state
 * @returns the pause in milliseconds
 * @remarks
 * The review steps get a longer pause so the melds and the round result can be
 * read; a computer's own turn only needs a short, watchable beat.
 */
function stepDelay(state: GameState): number {
  let delay: number;
  switch (state.phase) {
    case "melding":
      delay = MELD_REVIEW_MS;
      break;
    case "roundEnd":
      delay = ROUND_REVIEW_MS;
      break;
    default:
      delay = AI_DELAY_MS;
  }
  return delay;
}

/**
 * Tells whether the game is waiting for the human.
 *
 * @param state - the game state
 * @returns true if the human must act
 */
function isHumanTurn(state: GameState): boolean {
  const declarerIsHuman = state.declarerIndex === HUMAN_INDEX;
  let waiting: boolean;
  switch (state.phase) {
    case "bidding":
      waiting =
        state.currentPlayerIndex === HUMAN_INDEX &&
        state.players[HUMAN_INDEX].bidding;
      break;
    case "exchange":
      waiting = declarerIsHuman;
      break;
    case "trick":
      waiting = state.currentPlayerIndex === HUMAN_INDEX;
      break;
    case "melding":
    case "roundEnd":
      waiting = false; // advances on its own after a short review pause
      break;
    case "matchEnd":
      waiting = true; // waits for the player to start a new match
      break;
    default:
      waiting = false;
  }
  return waiting;
}

/**
 * Drives a Binokel game from React.
 *
 * @returns the state and the actions the UI needs
 */
export function useBinokelGame(): BinokelGame {
  // The first match is dealt deterministically so the prerender and the client
  // agree; the chosen deck (settings) applies from the next match, as with the
  // Drecksau expansion.
  const [state, setState] = useState<GameState>(() =>
    createGame(SETUPS, {
      seed: INITIAL_SEED,
      withSevens: true,
      targetScore: TARGET_SCORE,
    }),
  );
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Drive the computer's turns and the review steps, each after its own pause.
  useEffect(() => {
    clearTimeout(timer.current);
    if (autoStep(state) !== null) {
      timer.current = setTimeout(() => {
        setState((current) => {
          const move = autoStep(current);
          return move === null ? current : move(current);
        });
      }, stepDelay(state));
    }
    return () => clearTimeout(timer.current);
  }, [state]);

  const bid = useCallback(
    () => setState((s) => applyBid(s, { kind: "bid" })),
    [],
  );
  const pass = useCallback(
    () => setState((s) => applyBid(s, { kind: "pass" })),
    [],
  );
  const confirmDiscard = useCallback(
    (cardIds: readonly string[]) => setState((s) => discard(s, cardIds)),
    [],
  );
  const pickTrump = useCallback(
    (suit: Suit) => setState((s) => chooseTrump(s, suit)),
    [],
  );
  const beginTrickPlay = useCallback(() => setState((s) => beginTricks(s)), []);
  const play = useCallback(
    (cardId: string) => setState((s) => playCard(s, cardId)),
    [],
  );
  const goNextRound = useCallback(() => setState((s) => nextRound(s)), []);
  const newMatch = useCallback(() => {
    setState(
      createGame(SETUPS, {
        seed: freshSeed(),
        withSevens: loadBinokelSettings().withSevens,
        targetScore: TARGET_SCORE,
      }),
    );
  }, []);

  const legalCardIds =
    state.phase === "trick" && state.currentPlayerIndex === HUMAN_INDEX
      ? legalPlays(
          state.players[HUMAN_INDEX].hand,
          state.currentTrick,
          state.trump,
        ).map((card) => card.id)
      : [];

  return {
    state,
    withSevens: state.withSevens,
    legalCardIds,
    isHumanTurn: isHumanTurn(state),
    bid,
    pass,
    confirmDiscard,
    pickTrump,
    beginTrickPlay,
    play,
    nextRound: goNextRound,
    newMatch,
  };
}

/** A fresh, unpredictable seed for a new match. */
function freshSeed(): number {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}
