/**
 * Tests for dealing a round.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { createGame } from "./setup";

const SETUPS = [
  { name: "Du", isHuman: true },
  { name: "Anna", isHuman: false },
  { name: "Berta", isHuman: false },
];

describe("createGame", () => {
  it("deals 15 + 3 with Sevens, all 48 cards distinct", () => {
    const state = createGame(SETUPS, {
      seed: 1,
      withSevens: true,
      targetScore: 1000,
    });
    expect(state.players.map((p) => p.hand.length)).toEqual([15, 15, 15]);
    expect(state.dabb).toHaveLength(3);
    const ids = new Set([
      ...state.players.flatMap((p) => p.hand.map((c) => c.id)),
      ...state.dabb.map((c) => c.id),
    ]);
    expect(ids.size).toBe(48);
  });

  it("deals 12 + 4 without Sevens", () => {
    const state = createGame(SETUPS, {
      seed: 1,
      withSevens: false,
      targetScore: 1000,
    });
    expect(state.players.map((p) => p.hand.length)).toEqual([12, 12, 12]);
    expect(state.dabb).toHaveLength(4);
  });

  it("starts bidding to the dealer's right", () => {
    const state = createGame(SETUPS, {
      seed: 1,
      withSevens: false,
      targetScore: 1000,
      dealerIndex: 0,
    });
    expect(state.phase).toBe("bidding");
    // The forehand (player 1) holds the deal; player 2 challenges first.
    expect(state.currentPlayerIndex).toBe(2);
  });

  it("varies the opening bidder across seeds", () => {
    const forehands = new Set(
      Array.from(
        { length: 30 },
        (_, seed) =>
          createGame(SETUPS, { seed, withSevens: true, targetScore: 1000 })
            .currentPlayerIndex,
      ),
    );
    // Over many seeds every seat opens the bidding at least once - it is random.
    expect(forehands).toEqual(new Set([0, 1, 2]));
  });

  it("honours an explicit dealer over the random draw", () => {
    for (let dealer = 0; dealer < SETUPS.length; dealer++) {
      const state = createGame(SETUPS, {
        seed: 1,
        withSevens: true,
        targetScore: 1000,
        dealerIndex: dealer,
      });
      // The first challenger is the player after the forehand (dealer + 2).
      expect(state.currentPlayerIndex).toBe((dealer + 2) % SETUPS.length);
    }
  });

  it("replays the same deal from the same seed", () => {
    const a = createGame(SETUPS, {
      seed: 42,
      withSevens: true,
      targetScore: 1000,
    });
    const b = createGame(SETUPS, {
      seed: 42,
      withSevens: true,
      targetScore: 1000,
    });
    expect(a.players[0].hand.map((c) => c.id)).toEqual(
      b.players[0].hand.map((c) => c.id),
    );
  });

  it("rejects a table that is not three players", () => {
    expect(() =>
      createGame(SETUPS.slice(0, 2), {
        seed: 1,
        withSevens: true,
        targetScore: 1000,
      }),
    ).toThrow();
  });
});
