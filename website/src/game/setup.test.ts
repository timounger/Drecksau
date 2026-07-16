/**
 * Tests for dealing a new game.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { BASE_ACTION_CARD_COUNT, EXPANSION_CARD_COUNT } from "./cards";
import { createGame, pigsPerPlayer, type PlayerSetup } from "./setup";
import { HAND_SIZE } from "./state";

const SETUPS: PlayerSetup[] = [
  { name: "Du", isHuman: true },
  { name: "Berta", isHuman: false },
  { name: "Cleo", isHuman: false },
];

/** Shorthand: a base game with the given seed. */
const baseGame = (setups: readonly PlayerSetup[], seed: number) =>
  createGame(setups, { seed, withExpansion: false });

/** Shorthand: a game with the Sauschön cards mixed in. */
const expansionGame = (setups: readonly PlayerSetup[], seed: number) =>
  createGame(setups, { seed, withExpansion: true });

describe("pigsPerPlayer", () => {
  it("follows the base rulebook: 5, 4, 3", () => {
    expect(pigsPerPlayer(2, false)).toBe(5);
    expect(pigsPerPlayer(3, false)).toBe(4);
    expect(pigsPerPlayer(4, false)).toBe(3);
  });

  it("is always 3 with the expansion, whatever the table size", () => {
    expect(pigsPerPlayer(2, true)).toBe(3);
    expect(pigsPerPlayer(3, true)).toBe(3);
    expect(pigsPerPlayer(4, true)).toBe(3);
  });
});

describe("createGame", () => {
  it("gives every player their pigs, all clean and bare", () => {
    const state = baseGame(SETUPS, 42);
    for (const player of state.players) {
      expect(player.pigs).toHaveLength(4);
      expect(player.pigs.every((pig) => !pig.isDirty)).toBe(true);
      expect(player.pigs.every((pig) => pig.barn === null)).toBe(true);
      expect(player.pigs.every((pig) => pig.beauty === null)).toBe(true);
    }
  });

  it("deals three hand cards each and keeps the rest as draw pile", () => {
    const state = baseGame(SETUPS, 42);
    for (const player of state.players) {
      expect(player.hand).toHaveLength(HAND_SIZE);
    }
    const dealt = SETUPS.length * HAND_SIZE;
    expect(state.drawPile).toHaveLength(BASE_ACTION_CARD_COUNT - dealt);
    expect(state.discardPile).toHaveLength(0);
  });

  it("never deals the same card twice", () => {
    const state = baseGame(SETUPS, 7);
    const allCards = [
      ...state.players.flatMap((player) => player.hand),
      ...state.drawPile,
    ];
    expect(new Set(allCards.map((card) => card.id)).size).toBe(
      BASE_ACTION_CARD_COUNT,
    );
  });

  it("replays the same game for the same seed", () => {
    expect(baseGame(SETUPS, 99)).toEqual(baseGame(SETUPS, 99));
  });

  it("deals differently for different seeds", () => {
    const first = baseGame(SETUPS, 1).drawPile.map((card) => card.id);
    const second = baseGame(SETUPS, 2).drawPile.map((card) => card.id);
    expect(first).not.toEqual(second);
  });

  it("rejects unsupported table sizes", () => {
    expect(() => baseGame([{ name: "Allein", isHuman: true }], 1)).toThrow();
    expect(() =>
      baseGame(
        Array.from({ length: 5 }, (unused, index) => ({
          name: `S${index}`,
          isHuman: false,
        })),
        1,
      ),
    ).toThrow();
  });

  it("starts with the first player, no winner, nothing pending", () => {
    const state = baseGame(SETUPS, 42);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.winnerId).toBeNull();
    expect(state.pendingCardIds).toEqual([]);
    expect(state.hasExpansion).toBe(false);
  });
});

describe("createGame with the Sauschön expansion", () => {
  it("marks the game as an expansion game", () => {
    expect(expansionGame(SETUPS, 42).hasExpansion).toBe(true);
  });

  it("deals 3 pigs each, even though 3 players would get 4 in the base game", () => {
    for (const player of expansionGame(SETUPS, 42).players) {
      expect(player.pigs).toHaveLength(3);
    }
  });

  it("mixes both decks together", () => {
    const state = expansionGame(SETUPS, 42);
    const dealt = SETUPS.length * HAND_SIZE;
    expect(state.drawPile).toHaveLength(
      BASE_ACTION_CARD_COUNT + EXPANSION_CARD_COUNT - dealt,
    );
  });

  it("really shuffles them together rather than stacking them", () => {
    const state = expansionGame(SETUPS, 42);
    const expansionPositions = state.drawPile
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => card.type === "beauty")
      .map(({ index }) => index);
    // If they were merely appended, every Schönsau would sit in the last third.
    expect(Math.min(...expansionPositions)).toBeLessThan(
      state.drawPile.length / 3,
    );
  });
});
