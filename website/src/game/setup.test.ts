/**
 * Tests for dealing a new game.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { ACTION_CARD_COUNT } from "./cards";
import { createGame, pigsPerPlayer, type PlayerSetup } from "./setup";
import { HAND_SIZE } from "./state";

const SETUPS: PlayerSetup[] = [
  { name: "Du", isHuman: true },
  { name: "Berta", isHuman: false },
  { name: "Cleo", isHuman: false },
];

describe("createGame", () => {
  it("deals the pig count from the rulebook", () => {
    expect(pigsPerPlayer(2)).toBe(5);
    expect(pigsPerPlayer(3)).toBe(4);
    expect(pigsPerPlayer(4)).toBe(3);
  });

  it("gives every player their pigs, all clean", () => {
    const state = createGame(SETUPS, 42);
    for (const player of state.players) {
      expect(player.pigs).toHaveLength(4);
      expect(player.pigs.every((pig) => !pig.isDirty)).toBe(true);
      expect(player.pigs.every((pig) => pig.barn === null)).toBe(true);
    }
  });

  it("deals three hand cards each and keeps the rest as draw pile", () => {
    const state = createGame(SETUPS, 42);
    for (const player of state.players) {
      expect(player.hand).toHaveLength(HAND_SIZE);
    }
    const dealt = SETUPS.length * HAND_SIZE;
    expect(state.drawPile).toHaveLength(ACTION_CARD_COUNT - dealt);
    expect(state.discardPile).toHaveLength(0);
  });

  it("never deals the same card twice", () => {
    const state = createGame(SETUPS, 7);
    const allCards = [
      ...state.players.flatMap((player) => player.hand),
      ...state.drawPile,
    ];
    expect(new Set(allCards.map((card) => card.id)).size).toBe(
      ACTION_CARD_COUNT,
    );
  });

  it("replays the same game for the same seed", () => {
    expect(createGame(SETUPS, 99)).toEqual(createGame(SETUPS, 99));
  });

  it("deals differently for different seeds", () => {
    const first = createGame(SETUPS, 1).drawPile.map((card) => card.id);
    const second = createGame(SETUPS, 2).drawPile.map((card) => card.id);
    expect(first).not.toEqual(second);
  });

  it("rejects unsupported table sizes", () => {
    expect(() => createGame([{ name: "Allein", isHuman: true }], 1)).toThrow();
    expect(() =>
      createGame(
        Array.from({ length: 5 }, (unused, index) => ({
          name: `S${index}`,
          isHuman: false,
        })),
        1,
      ),
    ).toThrow();
  });

  it("starts with the first player and no winner", () => {
    const state = createGame(SETUPS, 42);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.winnerId).toBeNull();
  });
});
