/**
 * Tests that the difficulty levels change how the AI bids and plays.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { chooseBid, chooseCard, chooseDiscard, chooseTrumpSuit } from "./ai";
import { cardValue } from "./cards";
import {
  applyBid,
  baseHandSize,
  chooseTrump,
  declareGame,
  discard,
} from "./moves";
import { createGame, type PlayerSetup } from "./setup";
import type { GameState } from "./state";
import { legalPlays } from "./tricks";

const SETUPS: readonly PlayerSetup[] = [
  { name: "Du", isHuman: true },
  { name: "Anna", isHuman: false },
  { name: "Berta", isHuman: false },
];

/** A fresh bidding state with a fixed dealer, so player 1 opens. */
function bidding(seed: number): GameState {
  return createGame(SETUPS, {
    seed,
    withSevens: true,
    targetScore: 1_000_000,
    dealerIndex: 0,
  });
}

/** Drives a game to the trick phase, where the leader is about to play. */
function toTrickLead(seed: number): GameState {
  let state = bidding(seed);
  while (state.phase === "bidding") {
    state = applyBid(state, chooseBid(state));
  }
  const declarer = state.players[state.declarerIndex ?? 0];
  const need = declarer.hand.length - baseHandSize(state);
  if (need > 0) {
    state = discard(state, chooseDiscard(state, need));
  }
  state = chooseTrump(state, chooseTrumpSuit(state));
  return declareGame(state, "normal");
}

describe("chooseBid by difficulty", () => {
  it("bids more boldly the harder the level (never less)", () => {
    let leicht = 0;
    let mittel = 0;
    let schwer = 0;
    for (let seed = 0; seed < 40; seed++) {
      const state = bidding(seed);
      const isBid = (level: "leicht" | "mittel" | "schwer") =>
        chooseBid(state, level).kind === "bid";
      // A bolder level bids whenever a timider one does - the threshold drops.
      expect(!isBid("leicht") || isBid("mittel")).toBe(true);
      expect(!isBid("mittel") || isBid("schwer")).toBe(true);
      leicht += isBid("leicht") ? 1 : 0;
      mittel += isBid("mittel") ? 1 : 0;
      schwer += isBid("schwer") ? 1 : 0;
    }
    // Bolder overall, and the levels really differ (not one threshold).
    expect(schwer).toBeGreaterThanOrEqual(mittel);
    expect(mittel).toBeGreaterThanOrEqual(leicht);
    expect(schwer).toBeGreaterThan(leicht);
  });
});

describe("chooseCard by difficulty", () => {
  it("leads the strongest card on schwer and the weakest on mittel", () => {
    const state = toTrickLead(2);
    expect(state.phase).toBe("trick");
    expect(state.currentTrick).toHaveLength(0);

    const actor = state.players[state.currentPlayerIndex];
    const legal = legalPlays(actor.hand, state.currentTrick, state.trump);
    const values = legal.map(cardValue);
    const valueOf = (id: string) =>
      cardValue(actor.hand.find((card) => card.id === id)!);

    expect(valueOf(chooseCard(state, "schwer"))).toBe(Math.max(...values));
    expect(valueOf(chooseCard(state, "mittel"))).toBe(Math.min(...values));
  });

  it("always plays a legal card, even on leicht", () => {
    const state = toTrickLead(2);
    const actor = state.players[state.currentPlayerIndex];
    const legal = legalPlays(actor.hand, state.currentTrick, state.trump);
    for (const level of ["leicht", "mittel", "schwer"] as const) {
      const id = chooseCard(state, level);
      expect(legal.some((card) => card.id === id)).toBe(true);
    }
  });
});
