/**
 * End-to-end tests: a full round and a full match driven by the AI.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { cardValue } from "./cards";
import { chooseBid, chooseCard, chooseDiscard, chooseTrumpSuit } from "./ai";
import {
  applyBid,
  beginTricks,
  chooseTrump,
  discard,
  nextRound,
  playCard,
} from "./moves";
import { createGame, type PlayerSetup } from "./setup";
import type { GameState } from "./state";

const SETUPS: readonly PlayerSetup[] = [
  { name: "Du", isHuman: true },
  { name: "Anna", isHuman: false },
  { name: "Berta", isHuman: false },
];

/** Plays one round to its end, every seat driven by the AI. */
function driveRound(start: GameState): GameState {
  let state = start;
  let guard = 0;
  while (state.phase === "bidding" && guard++ < 30) {
    state = applyBid(state, chooseBid(state));
  }
  const base = state.withSevens ? 15 : 12;
  const need = state.players[state.declarerIndex ?? 0].hand.length - base;
  state = discard(state, chooseDiscard(state, need));
  state = chooseTrump(state, chooseTrumpSuit(state));
  state = beginTricks(state);
  guard = 0;
  while (state.phase === "trick" && guard++ < 300) {
    state = playCard(state, chooseCard(state));
  }
  return state;
}

/** Total Augen sitting in the players' won piles. */
function capturedAugen(state: GameState): number {
  return state.players.reduce(
    (sum, player) => sum + player.won.reduce((s, c) => s + cardValue(c), 0),
    0,
  );
}

describe("a full round", () => {
  it("reaches scoring with every card captured", () => {
    const state = driveRound(
      createGame(SETUPS, { seed: 7, withSevens: true, targetScore: 1000 }),
    );
    expect(["roundEnd", "matchEnd"]).toContain(state.phase);
    expect(state.players.every((p) => p.hand.length === 0)).toBe(true);
    // Every card's Augen ends up captured (tricks plus the discarded cards).
    expect(capturedAugen(state)).toBe(240);
  });

  it("names a declarer at 150 or more", () => {
    let state = createGame(SETUPS, {
      seed: 3,
      withSevens: false,
      targetScore: 1000,
    });
    while (state.phase === "bidding") {
      state = applyBid(state, chooseBid(state));
    }
    expect(state.declarerIndex).not.toBeNull();
    expect(state.highestBid).toBeGreaterThanOrEqual(150);
  });

  it("plays whole rounds for many seeds without an illegal move", () => {
    for (let seed = 0; seed < 15; seed++) {
      const state = driveRound(
        createGame(SETUPS, {
          seed,
          withSevens: seed % 2 === 0,
          targetScore: 100000,
        }),
      );
      expect(["roundEnd", "matchEnd"]).toContain(state.phase);
      expect(capturedAugen(state)).toBe(240);
    }
  });
});

describe("a full match", () => {
  it("runs rounds until someone reaches the target", () => {
    let state = createGame(SETUPS, {
      seed: 11,
      withSevens: true,
      targetScore: 200,
    });
    let guard = 0;
    while (state.phase !== "matchEnd" && guard++ < 60) {
      state = driveRound(state);
      if (state.phase === "roundEnd") {
        state = nextRound(state);
      }
    }
    expect(state.phase).toBe("matchEnd");
    expect(state.matchWinnerId).not.toBeNull();
  });
});
