/**
 * Tests for {@link actingIndex}: who may act in each phase.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import type { GameState } from "./state";
import { actingIndex } from "./turn";

/** A minimal state carrying just the fields {@link actingIndex} reads. */
function state(partial: Partial<GameState>): GameState {
  return {
    players: [{}, {}, {}],
    currentTrick: [],
    trump: null,
    declarerIndex: null,
    dealerIndex: 0,
    currentPlayerIndex: 0,
    ...partial,
  } as unknown as GameState;
}

describe("actingIndex", () => {
  it("follows the player on turn while bidding", () => {
    expect(
      actingIndex(state({ phase: "bidding", currentPlayerIndex: 2 })),
    ).toBe(2);
  });

  it("gives the exchange and melding to the declarer", () => {
    expect(actingIndex(state({ phase: "exchange", declarerIndex: 1 }))).toBe(1);
    expect(actingIndex(state({ phase: "melding", declarerIndex: 2 }))).toBe(2);
  });

  it("follows the player on turn mid-trick", () => {
    expect(actingIndex(state({ phase: "trick", currentPlayerIndex: 1 }))).toBe(
      1,
    );
  });

  it("hands a full trick to its winner", () => {
    const trick = [
      { playerIndex: 0, card: { id: "a", suit: "eichel", rank: "daus" } },
      { playerIndex: 1, card: { id: "b", suit: "eichel", rank: "zehn" } },
      { playerIndex: 2, card: { id: "c", suit: "eichel", rank: "koenig" } },
    ] as unknown as GameState["currentTrick"];
    // Highest card of the led suit (the Daus) wins, so player 0 collects.
    expect(
      actingIndex(
        state({ phase: "trick", currentTrick: trick, trump: "herz" }),
      ),
    ).toBe(0);
  });

  it("advances the forehand between rounds and nobody at the end", () => {
    expect(actingIndex(state({ phase: "roundEnd", dealerIndex: 1 }))).toBe(2);
    expect(actingIndex(state({ phase: "matchEnd" }))).toBeNull();
  });
});
