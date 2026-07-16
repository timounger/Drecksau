/**
 * Tests for the guard that protects the engine from stored rubbish.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { chooseAiMove } from "./ai";
import { applyMove } from "./engine";
import { isGameState } from "./serialization";
import { createGame } from "./setup";
import { makeState } from "./test-helpers";

/** A real state, round tripped through JSON like storage would do. */
function roundTrip(withExpansion = false): unknown {
  let state = createGame(
    [
      { name: "Du", isHuman: true },
      { name: "Berta", isHuman: false },
    ],
    { seed: 7, withExpansion },
  );
  for (let i = 0; i < 10 && state.winnerId === null; i++) {
    state = applyMove(state, chooseAiMove(state));
  }
  return JSON.parse(JSON.stringify(state));
}

describe("isGameState", () => {
  it("accepts a fresh game", () => {
    const state = createGame(
      [
        { name: "Du", isHuman: true },
        { name: "Berta", isHuman: false },
      ],
      { seed: 1, withExpansion: false },
    );
    expect(isGameState(JSON.parse(JSON.stringify(state)))).toBe(true);
  });

  it("accepts a game with the expansion", () => {
    expect(isGameState(roundTrip(true))).toBe(true);
  });

  it("accepts a game that has been played for a while", () => {
    expect(isGameState(roundTrip())).toBe(true);
  });

  it("accepts a finished game", () => {
    const state = {
      ...makeState([
        { pigs: [{ isDirty: true }], hand: ["mud"] },
        { pigs: [{}], hand: [] },
      ]),
      winnerId: "p0",
    };
    expect(isGameState(JSON.parse(JSON.stringify(state)))).toBe(true);
  });

  it("rejects values that are not a state at all", () => {
    expect(isGameState(null)).toBe(false);
    expect(isGameState(42)).toBe(false);
    expect(isGameState("Drecksau")).toBe(false);
    expect(isGameState({})).toBe(false);
    expect(isGameState([])).toBe(false);
  });

  it("rejects a table without players", () => {
    const state = roundTrip() as { players: unknown[] };
    state.players = [];
    expect(isGameState(state)).toBe(false);
  });

  it("rejects an active player index outside the table", () => {
    const state = roundTrip() as { currentPlayerIndex: number };
    state.currentPlayerIndex = 99;
    expect(isGameState(state)).toBe(false);
  });

  it("rejects a winner who is not at the table", () => {
    const state = roundTrip() as { winnerId: string };
    state.winnerId = "p99";
    expect(isGameState(state)).toBe(false);
  });

  it("rejects a card type this version does not know", () => {
    const state = roundTrip() as { drawPile: { type: string }[] };
    state.drawPile[0].type = "einhorn";
    expect(isGameState(state)).toBe(false);
  });

  it("rejects a rod without a stall - the rules cannot produce that", () => {
    const state = roundTrip() as {
      players: { pigs: { barn: unknown; lightningRod: unknown }[] }[];
    };
    state.players[0].pigs[0].barn = null;
    state.players[0].pigs[0].lightningRod = {
      id: "lightningRod-0",
      type: "lightningRod",
    };
    expect(isGameState(state)).toBe(false);
  });

  it("rejects a pig without an id", () => {
    const state = roundTrip() as { players: { pigs: { id?: string }[] }[] };
    delete state.players[0].pigs[0].id;
    expect(isGameState(state)).toBe(false);
  });

  it("rejects a missing random seed", () => {
    const state = roundTrip() as { random: unknown };
    state.random = {};
    expect(isGameState(state)).toBe(false);
  });
});
