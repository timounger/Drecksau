/**
 * Tests for the card effects and the turn flow.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { applyMove } from "./engine";
import { createGame } from "./setup";
import { legalMoves } from "./moves";
import { HAND_SIZE, type GameState } from "./state";
import { handCardId, makeState, totalCardCount } from "./test-helpers";

/** Plays a card of a type at an optional target, for the active player. */
function play(
  state: GameState,
  type: Parameters<typeof handCardId>[2],
  targetPigId?: string,
): GameState {
  return applyMove(state, {
    kind: "playCard",
    cardId: handCardId(state, state.currentPlayerIndex, type),
    targetPigId,
  });
}

describe("mud", () => {
  it("turns an own clean pig into a Drecksau", () => {
    const state = makeState(
      [
        { pigs: [{}, {}], hand: ["mud"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["barn"] },
    );
    const next = play(state, "mud", "p0-pig0");
    expect(next.players[0].pigs[0].isDirty).toBe(true);
    expect(next.players[0].pigs[1].isDirty).toBe(false);
  });

  it("goes to the discard pile after use", () => {
    const state = makeState(
      [
        { pigs: [{}, {}], hand: ["mud", "rain", "rain"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["barn"] },
    );
    const next = play(state, "mud", "p0-pig0");
    expect(next.discardPile.map((card) => card.type)).toEqual(["mud"]);
  });
});

describe("rain", () => {
  it("cleans every dirty pig without a stall, including the player's own", () => {
    const state = makeState(
      [
        {
          pigs: [{ isDirty: true }, { isDirty: true, hasBarn: true }],
          hand: ["rain"],
        },
        {
          pigs: [{ isDirty: true }, { isDirty: true, hasBarn: true }],
          hand: [],
        },
      ],
      { drawPile: ["barn"] },
    );
    const next = play(state, "rain");
    expect(next.players[0].pigs[0].isDirty).toBe(false);
    expect(next.players[0].pigs[1].isDirty).toBe(true);
    expect(next.players[1].pigs[0].isDirty).toBe(false);
    expect(next.players[1].pigs[1].isDirty).toBe(true);
  });

  it("leaves clean pigs untouched", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["rain"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["barn"] },
    );
    expect(play(state, "rain").players[0].pigs[0].isDirty).toBe(false);
  });

  it("keeps a dirty pig in a stall dirty, lightning rod and all", () => {
    // The exact online report: a dirty pig in a stall with a lightning rod must
    // survive the rain - the rod is irrelevant here, the stall does the work.
    const state = makeState(
      [
        {
          pigs: [{ isDirty: true, hasBarn: true, hasLightningRod: true }],
          hand: ["rain"],
        },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["barn"] },
    );
    const pig = play(state, "rain").players[0].pigs[0];
    expect(pig.isDirty).toBe(true);
    expect(pig.barn).not.toBeNull();
    expect(pig.lightningRod).not.toBeNull();
  });
});

describe("barn", () => {
  it("stays attached to the pig instead of going to the discard pile", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["barn"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["mud"] },
    );
    const next = play(state, "barn", "p0-pig0");
    expect(next.players[0].pigs[0].barn).not.toBeNull();
    expect(next.discardPile).toHaveLength(0);
  });
});

describe("lightning", () => {
  it("burns the stall down and discards it together with the door", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["lightning", "rain", "rain"] },
        {
          pigs: [{ isDirty: true, hasBarn: true, hasBarnDoor: true }],
          hand: [],
        },
      ],
      { drawPile: ["mud"] },
    );
    const next = play(state, "lightning", "p1-pig0");
    const victim = next.players[1].pigs[0];

    expect(victim.barn).toBeNull();
    expect(victim.barnDoor).toBeNull();
    // The pig itself keeps its state - only the protection is gone.
    expect(victim.isDirty).toBe(true);
    expect(next.discardPile.map((card) => card.type).sort()).toEqual(
      ["barn", "barnDoor", "lightning"].sort(),
    );
  });

  it("cannot hit a stall with a lightning rod", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["lightning"] },
        { pigs: [{ hasBarn: true, hasLightningRod: true }], hand: [] },
      ],
      { drawPile: ["mud"] },
    );
    expect(() =>
      applyMove(state, {
        kind: "playCard",
        cardId: handCardId(state, 0, "lightning"),
        targetPigId: "p1-pig0",
      }),
    ).toThrow();
  });
});

describe("farmerScrubs", () => {
  it("cleans a dirty opponent pig even inside a stall", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["farmerScrubs"] },
        { pigs: [{ isDirty: true, hasBarn: true }], hand: [] },
      ],
      { drawPile: ["mud"] },
    );
    const next = play(state, "farmerScrubs", "p1-pig0");
    expect(next.players[1].pigs[0].isDirty).toBe(false);
    // The stall survives the scrubbing.
    expect(next.players[1].pigs[0].barn).not.toBeNull();
  });
});

describe("the luckiest Drecksau", () => {
  it("is immune to rain, lightning and the farmer", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["rain", "lightning", "farmerScrubs"] },
        {
          pigs: [
            {
              isDirty: true,
              hasBarn: true,
              hasLightningRod: true,
              hasBarnDoor: true,
            },
          ],
          hand: [],
        },
      ],
      { drawPile: ["mud", "mud", "mud"] },
    );

    const targets = legalMoves(state)
      .filter((move) => move.kind === "playCard")
      .map((move) => (move.kind === "playCard" ? move.targetPigId : undefined));
    expect(targets).not.toContain("p1-pig0");

    // Rain is the only one of the three that can be played at all.
    const afterRain = play(state, "rain");
    expect(afterRain.players[1].pigs[0].isDirty).toBe(true);
  });
});

describe("turn flow", () => {
  it("refills the hand to three cards and passes the turn on", () => {
    const state = makeState(
      [
        { pigs: [{}, {}], hand: ["mud", "mud", "mud"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["barn", "rain"] },
    );
    const next = play(state, "mud", "p0-pig0");
    expect(next.players[0].hand).toHaveLength(HAND_SIZE);
    expect(next.currentPlayerIndex).toBe(1);
  });

  it("wraps around to the first player", () => {
    const state = makeState(
      [
        { pigs: [{}, {}], hand: ["mud"] },
        { pigs: [{}, {}], hand: ["mud"] },
      ],
      { drawPile: ["barn", "barn"], currentPlayerIndex: 1 },
    );
    expect(play(state, "mud", "p1-pig0").currentPlayerIndex).toBe(0);
  });

  it("rejects an illegal move", () => {
    const state = makeState([
      { pigs: [{ isDirty: true }], hand: ["mud"] },
      { pigs: [{}], hand: [] },
    ]);
    expect(() =>
      applyMove(state, {
        kind: "playCard",
        cardId: handCardId(state, 0, "mud"),
        targetPigId: "p1-pig0",
      }),
    ).toThrow();
  });
});

describe("discard and blockade", () => {
  it("discards a card unused", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["lightning", "rain", "rain"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["mud"] },
    );
    const next = applyMove(state, {
      kind: "discardCard",
      cardId: handCardId(state, 0, "lightning"),
    });
    expect(next.discardPile.map((card) => card.type)).toEqual(["lightning"]);
    expect(next.players[0].hand.map((card) => card.type)).toEqual([
      "rain",
      "rain",
      "mud",
    ]);
  });

  it("swaps the whole hand when blocked", () => {
    const state = makeState(
      [
        {
          pigs: [{ isDirty: true }],
          hand: ["lightningRod", "barnDoor", "lightning"],
        },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["mud", "rain", "barn"] },
    );
    const next = applyMove(state, { kind: "redrawHand" });
    expect(next.players[0].hand.map((card) => card.type)).toEqual([
      "mud",
      "rain",
      "barn",
    ]);
    expect(next.discardPile).toHaveLength(3);
  });
});

describe("draw pile", () => {
  it("reshuffles the discard pile when it runs empty", () => {
    const state = makeState(
      [
        { pigs: [{}, {}], hand: ["mud", "rain", "rain"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: [], discardPile: ["rain", "barn"] },
    );
    const next = play(state, "mud", "p0-pig0");

    // The played mud joins the discard pile, then all three cards are
    // shuffled into a new draw pile and one of them is drawn.
    expect(next.players[0].hand).toHaveLength(HAND_SIZE);
    expect(next.discardPile).toHaveLength(0);
    expect(next.drawPile).toHaveLength(2);
    expect(totalCardCount(next)).toBe(totalCardCount(state));
  });

  it("stops drawing when no card is left anywhere", () => {
    const state = makeState(
      [
        { pigs: [{}, {}], hand: ["mud"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: [], discardPile: [] },
    );
    const next = play(state, "mud", "p0-pig0");

    // The played mud is the only card there is - it lands on the discard
    // pile, gets reshuffled and drawn again. Nothing more is available.
    expect(next.players[0].hand).toHaveLength(1);
    expect(next.drawPile).toHaveLength(0);
  });

  it("does not lose or duplicate cards over a whole game", () => {
    let state = createGame(
      [
        { name: "Du", isHuman: true },
        { name: "Berta", isHuman: false },
      ],
      { seed: 2026, withExpansion: false },
    );
    const expected = totalCardCount(state);

    for (let turn = 0; turn < 200 && state.winnerId === null; turn++) {
      const moves = legalMoves(state);
      state = applyMove(state, moves[turn % moves.length]);
      expect(totalCardCount(state)).toBe(expected);
    }
  });
});

describe("winning", () => {
  it("ends the game once every own pig is dirty", () => {
    const state = makeState(
      [
        { pigs: [{ isDirty: true }, {}], hand: ["mud"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["barn"] },
    );
    const next = play(state, "mud", "p0-pig1");

    expect(next.winnerId).toBe("p0");
    // The winner stays the active player, the turn is not passed on.
    expect(next.currentPlayerIndex).toBe(0);
    expect(legalMoves(next)).toHaveLength(0);
  });

  it("does not end while a clean pig is left", () => {
    const state = makeState(
      [
        { pigs: [{ isDirty: true }, {}, {}], hand: ["mud"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["barn"] },
    );
    expect(play(state, "mud", "p0-pig1").winnerId).toBeNull();
  });
});
