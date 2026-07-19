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
  chooseTrump,
  collectTrick,
  concede,
  declareGame,
  discard,
  nextRound,
  playCard,
} from "@/games/binokel/engine/moves";
import {
  DEFAULT_DIFFICULTY,
  type Difficulty,
} from "@/games/binokel/engine/difficulty";
import {
  createGame,
  MIN_PLAYERS,
  type PlayerSetup,
} from "@/games/binokel/engine/setup";
import { loadBinokelSettings } from "@/games/binokel/settings/binokel-settings";
import type { GameState, GameType } from "@/games/binokel/engine/state";
import { legalPlays } from "@/games/binokel/engine/tricks";
import { pickOpponentNames } from "@/lib/names/opponent-names";

/** The human always sits first, under the neutral name. */
const HUMAN_INDEX = 0;

/** What the human player is called. */
const HUMAN_NAME = "Du";

/**
 * Builds the seating: the human plus enough computer opponents.
 *
 * @param playerCount - how many seats the table has
 * @param seed - the deal's seed; the opponents' names come out of it, so the
 *   prerendered first game stays stable and a game replays with the same table
 * @returns the seats, in turn order
 */
function buildSetups(playerCount: number, seed: number): PlayerSetup[] {
  return [
    { name: HUMAN_NAME, isHuman: true },
    ...pickOpponentNames(playerCount - 1, HUMAN_NAME, seed).map((name) => ({
      name,
      isHuman: false,
    })),
  ];
}

/** Fixed seed of the first deal - server and client render it alike. */
const INITIAL_SEED = 20260718;

/** Points that end the match. */
const TARGET_SCORE = 1000;

/** Pause before a computer acts, so its turn is watchable. */
const AI_DELAY_MS = 750;

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
  /** After melding, the declarer commits to a normal game or a Durch. */
  readonly declare: (gameType: GameType) => void;
  /** After melding, the declarer concedes (goes off) instead of playing. */
  readonly concede: () => void;
  readonly play: (cardId: string) => void;
  /** Gathers the completed trick and moves on - the player clicks to continue. */
  readonly collect: () => void;
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
 * Besides the computer's own turns, this also advances the round result to the
 * next deal after a readable pause (see {@link stepDelay}). The melds and a
 * completed trick are *not* advanced automatically - the player clicks (the
 * melds via "Weiter zum Stechen", a full trick anywhere) so they can look for
 * as long as they like.
 */
function autoStep(
  state: GameState,
  difficulty: Difficulty = DEFAULT_DIFFICULTY,
): ((s: GameState) => GameState) | null {
  const actor = state.players[state.currentPlayerIndex];
  const declarer =
    state.declarerIndex === null ? null : state.players[state.declarerIndex];
  let move: ((s: GameState) => GameState) | null = null;

  if (state.phase === "bidding" && !actor.isHuman) {
    move = (s) => applyBid(s, chooseBid(s, difficulty));
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
  } else if (
    state.phase === "trick" &&
    state.currentTrick.length < state.players.length &&
    !actor.isHuman
  ) {
    move = (s) => playCard(s, chooseCard(s, difficulty));
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
 * The round result gets a longer pause so it can be read; a computer's own turn
 * only needs a short, watchable beat.
 */
function stepDelay(state: GameState): number {
  return state.phase === "roundEnd" ? ROUND_REVIEW_MS : AI_DELAY_MS;
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
      // A full trick waits for the player to collect it; otherwise it is the
      // human's turn only when the play is on their seat.
      waiting =
        state.currentTrick.length === state.players.length ||
        state.currentPlayerIndex === HUMAN_INDEX;
      break;
    case "melding":
      waiting = true; // waits for the player to click "Weiter zum Stechen"
      break;
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
  // agree; the chosen deck and player count (settings) apply from the next
  // match, as with the Drecksau expansion.
  const [state, setState] = useState<GameState>(() =>
    createGame(buildSetups(MIN_PLAYERS, INITIAL_SEED), {
      seed: INITIAL_SEED,
      withSevens: true,
      targetScore: TARGET_SCORE,
    }),
  );
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The prerender's opening seat is fixed (deterministic seed). On the client,
  // deal the opening match afresh once so the first bidder is random, not always
  // the same seat. This runs after mount - prerender and hydration still agree -
  // and lands before the first computer turn, so it is not noticeable.
  const dealtOpening = useRef(false);
  useEffect(() => {
    if (dealtOpening.current) {
      return;
    }
    dealtOpening.current = true;
    const seed = freshSeed();
    setState(
      createGame(buildSetups(MIN_PLAYERS, seed), {
        seed,
        withSevens: true,
        targetScore: TARGET_SCORE,
      }),
    );
  }, []);

  // Drive the computer's turns and the round-result pause, each on its timer.
  useEffect(() => {
    clearTimeout(timer.current);
    if (autoStep(state) !== null) {
      timer.current = setTimeout(() => {
        // The difficulty is read live, so a change applies to this game at once.
        const difficulty = loadBinokelSettings().difficulty;
        setState((current) => {
          const move = autoStep(current, difficulty);
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
  const declare = useCallback(
    (gameType: GameType) => setState((s) => declareGame(s, gameType)),
    [],
  );
  const doConcede = useCallback(() => setState((s) => concede(s)), []);
  const play = useCallback(
    (cardId: string) => setState((s) => playCard(s, cardId)),
    [],
  );
  const collect = useCallback(() => setState((s) => collectTrick(s)), []);
  const goNextRound = useCallback(() => setState((s) => nextRound(s)), []);
  const newMatch = useCallback(() => {
    const settings = loadBinokelSettings();
    const seed = freshSeed();
    setState(
      createGame(buildSetups(settings.playerCount, seed), {
        seed,
        withSevens: settings.withSevens,
        withDabb: settings.withDabb,
        teams: settings.teams,
        targetScore: TARGET_SCORE,
      }),
    );
  }, []);

  const legalCardIds =
    state.phase === "trick" &&
    state.currentPlayerIndex === HUMAN_INDEX &&
    state.currentTrick.length < state.players.length
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
    declare,
    concede: doConcede,
    play,
    collect,
    nextRound: goNextRound,
    newMatch,
  };
}

/** A fresh, unpredictable seed for a new match. */
function freshSeed(): number {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}
