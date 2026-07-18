/**
 * Tests for the computer opponent.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { chooseAiMove } from "./ai";
import { applyMove } from "./engine";
import { createGame } from "./setup";
import { handCardId, makeState } from "./test-helpers";
import type { GameState } from "./state";

describe("chooseAiMove", () => {
  it("takes the winning move when it has one", () => {
    const state = makeState(
      [
        {
          pigs: [{ isDirty: true }, { isDirty: true }, {}],
          hand: ["mud", "barn", "rain"],
        },
        { pigs: [{ isDirty: true }], hand: [] },
      ],
      { drawPile: ["mud", "mud"] },
    );
    const move = chooseAiMove(state);

    expect(move).toEqual({
      kind: "playCard",
      cardId: handCardId(state, 0, "mud"),
      targetPigId: "p0-pig2",
    });
    expect(applyMove(state, move).winnerId).toBe("p0");
  });

  it("does not play rain when it would clean more of its own pigs", () => {
    const state = makeState(
      [
        {
          pigs: [{ isDirty: true }, { isDirty: true }, {}],
          hand: ["rain", "barn", "barn"],
        },
        { pigs: [{ isDirty: true }], hand: [] },
      ],
      { drawPile: ["mud", "mud"] },
    );
    const move = chooseAiMove(state);
    expect(move).not.toEqual(
      expect.objectContaining({ cardId: handCardId(state, 0, "rain") }),
    );
  });

  it("plays rain when it only hurts the opponents", () => {
    // The own Drecksau sits safely in a stall, three opponent pigs do not.
    const state = makeState(
      [
        {
          pigs: [{ isDirty: true, hasBarn: true }, {}],
          hand: ["rain", "barn", "barn"],
        },
        { pigs: [{ isDirty: true }, { isDirty: true }], hand: [] },
        { pigs: [{ isDirty: true }, {}], hand: [] },
      ],
      { drawPile: ["mud", "mud"] },
    );
    const move = chooseAiMove(state);
    expect(move).toEqual({
      kind: "playCard",
      cardId: handCardId(state, 0, "rain"),
    });
  });

  it("prefers dirtying a pig that already stands in a stall", () => {
    const state = makeState(
      [
        { pigs: [{}, { hasBarn: true }, {}], hand: ["mud", "rain", "rain"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["mud", "mud"] },
    );
    expect(chooseAiMove(state)).toEqual({
      kind: "playCard",
      cardId: handCardId(state, 0, "mud"),
      targetPigId: "p0-pig1",
    });
  });

  it("attacks the player closest to winning", () => {
    const state = makeState(
      [
        { pigs: [{}, {}], hand: ["farmerScrubs", "lightningRod", "barnDoor"] },
        { pigs: [{ isDirty: true }, {}, {}, {}], hand: [] },
        {
          pigs: [{ isDirty: true }, { isDirty: true }, { isDirty: true }, {}],
          hand: [],
        },
      ],
      { drawPile: ["mud", "mud"] },
    );
    const move = chooseAiMove(state);

    expect(move.kind).toBe("playCard");
    // Player 2 is one pig away from winning, so the farmer goes there.
    expect(move.kind === "playCard" && move.targetPigId).toMatch(/^p2-/);
  });

  it("swaps a fully blocked hand", () => {
    const state = makeState(
      [
        {
          pigs: [{ isDirty: true }],
          hand: ["lightningRod", "barnDoor", "lightning"],
        },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["mud", "mud", "mud"] },
    );
    expect(chooseAiMove(state)).toEqual({ kind: "redrawHand" });
  });

  it("refuses to move once the game is over", () => {
    const state = {
      ...makeState([
        { pigs: [{ isDirty: true }], hand: ["mud"] },
        { pigs: [{}], hand: [] },
      ]),
      winnerId: "p0",
    };
    expect(() => chooseAiMove(state)).toThrow();
  });
});

describe("difficulty levels", () => {
  it("takes a winning move on every level, even the easy one", () => {
    // p0 is one mud from winning (last clean pig).
    const state = makeState(
      [
        { pigs: [{ isDirty: true }, {}], hand: ["mud", "barn", "rain"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["mud", "mud"] },
    );
    for (const difficulty of ["leicht", "mittel", "schwer"] as const) {
      const move = chooseAiMove(state, difficulty);
      expect(applyMove(state, move).winnerId).toBe("p0");
    }
  });

  it("Schwer blocks an opponent one pig from winning", () => {
    // p1 is one scrub away from being blocked: 2 of 3 pigs already dirty.
    // Advancing p0's own goal (mud) scores ~50; blocking should beat it.
    const state = makeState(
      [
        { pigs: [{}, {}, {}], hand: ["farmerScrubs", "mud", "rain"] },
        { pigs: [{ isDirty: true }, { isDirty: true }, {}], hand: [] },
      ],
      { drawPile: ["mud", "mud"] },
    );

    const move = chooseAiMove(state, "schwer");
    expect(move.kind).toBe("playCard");
    // The scrub goes to one of p1's dirty pigs, pushing them back from a win.
    expect(move.kind === "playCard" && move.targetPigId).toMatch(/^p1-/);
    expect(
      move.kind === "playCard" &&
        applyMove(state, move).players[1].pigs.filter((p) => p.isDirty).length,
    ).toBe(1);
  });

  it("Mittel does not go out of its way to block - it tends its own goal", () => {
    // Same board: without the block bonus, the AI prefers its own mud (50)
    // over the scrub (~30 + small lead weight).
    const state = makeState(
      [
        { pigs: [{}, {}, {}], hand: ["farmerScrubs", "mud", "rain"] },
        { pigs: [{ isDirty: true }, { isDirty: true }, {}], hand: [] },
      ],
      { drawPile: ["mud", "mud"] },
    );
    const move = chooseAiMove(state, "mittel");
    expect(move).toEqual({
      kind: "playCard",
      cardId: handCardId(state, 0, "mud"),
      targetPigId: expect.stringMatching(/^p0-/),
    });
  });

  it("full games between computer players reach a winner on every level", () => {
    for (const difficulty of ["leicht", "mittel", "schwer"] as const) {
      for (let seed = 0; seed < 15; seed++) {
        let state: GameState = createGame(
          [
            { name: "Anna", isHuman: false },
            { name: "Berta", isHuman: false },
          ],
          { seed, withExpansion: false },
        );
        let turns = 0;
        const maxTurns = 800;
        while (state.winnerId === null && turns < maxTurns) {
          state = applyMove(state, chooseAiMove(state, difficulty));
          turns++;
        }
        expect(state.winnerId).not.toBeNull();
      }
    }
  });
});

describe("full games between computer players", () => {
  it.each([
    { label: "Grundspiel", withExpansion: false, withDefense: false },
    { label: "mit Sauschön", withExpansion: true, withDefense: false },
    {
      label: "mit Verteidigungskarten",
      withExpansion: false,
      withDefense: true,
    },
    { label: "Drecksau total", withExpansion: true, withDefense: true },
  ])(
    "always reach a winner within a sane number of turns ($label)",
    ({ withExpansion, withDefense }) => {
      for (let seed = 0; seed < 25; seed++) {
        let state: GameState = createGame(
          [
            { name: "Anna", isHuman: false },
            { name: "Berta", isHuman: false },
            { name: "Cleo", isHuman: false },
          ],
          { seed, withExpansion, withDefense },
        );

        let turns = 0;
        const maxTurns = 600;
        while (state.winnerId === null && turns < maxTurns) {
          state = applyMove(state, chooseAiMove(state));
          turns++;
        }

        expect(state.winnerId).not.toBeNull();
      }
    },
  );
});
