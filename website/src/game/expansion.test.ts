/**
 * Tests for the Sauschön expansion - the new cards and how they interact
 * with the base game.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { applyMove } from "./engine";
import { isCardPlayable, legalMoves, legalTargets } from "./moves";
import { hasWon, type GameState } from "./state";
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

describe("Schönsau", () => {
  it("may go on any pig - own or not, clean or dirty", () => {
    const state = makeState(
      [
        { pigs: [{}, { isDirty: true }], hand: ["beauty"] },
        { pigs: [{ isDirty: true }], hand: [] },
      ],
      { hasExpansion: true },
    );
    expect(legalTargets(state, "p0", "beauty").sort()).toEqual(
      ["p0-pig0", "p0-pig1", "p1-pig0"].sort(),
    );
  });

  it("cannot go on a pig that already has one", () => {
    const state = makeState(
      [
        { pigs: [{ hasBeauty: true }], hand: ["beauty"] },
        { pigs: [{ hasBeauty: true }], hand: [] },
      ],
      { hasExpansion: true },
    );
    expect(isCardPlayable(state, "p0", "beauty")).toBe(false);
  });

  it("cannot go on a Drecksau behind a nailed door", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["beauty"] },
        {
          pigs: [{ isDirty: true, hasBarn: true, hasBarnDoor: true }],
          hand: [],
        },
      ],
      { hasExpansion: true },
    );
    expect(legalTargets(state, "p0", "beauty")).toEqual(["p0-pig0"]);
  });

  it("covers the pig without changing what is underneath", () => {
    const state = makeState(
      [
        { pigs: [{ isDirty: true }, {}], hand: ["beauty", "mud", "mud"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["mud"], hasExpansion: true },
    );
    const next = play(state, "beauty", "p0-pig0");
    const pig = next.players[0].pigs[0];

    expect(pig.beauty).not.toBeNull();
    // Still a Drecksau underneath - the Aus-dem-Staub would uncover it.
    expect(pig.isDirty).toBe(true);
  });
});

describe("a Schönsau shields the pig", () => {
  it("survives the rain, unlike a bare Drecksau", () => {
    const state = makeState(
      [
        {
          pigs: [{ isDirty: true, hasBeauty: true }, { isDirty: true }],
          hand: ["rain", "mud", "mud"],
        },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["mud"], hasExpansion: true },
    );
    const next = play(state, "rain");

    expect(next.players[0].pigs[0].beauty).not.toBeNull();
    expect(next.players[0].pigs[0].isDirty).toBe(true);
    // The pig without a Schönsau got washed.
    expect(next.players[0].pigs[1].isDirty).toBe(false);
  });

  it("cannot be muddied", () => {
    const state = makeState(
      [
        { pigs: [{ hasBeauty: true }, {}], hand: ["mud"] },
        { pigs: [{}], hand: [] },
      ],
      { hasExpansion: true },
    );
    expect(legalTargets(state, "p0", "mud")).toEqual(["p0-pig1"]);
  });

  it("cannot be scrubbed by the farmer", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["farmerScrubs"] },
        {
          pigs: [{ isDirty: true, hasBeauty: true }, { isDirty: true }],
          hand: [],
        },
      ],
      { hasExpansion: true },
    );
    expect(legalTargets(state, "p0", "farmerScrubs")).toEqual(["p1-pig1"]);
  });

  it("blocks the barn door", () => {
    const state = makeState(
      [
        {
          pigs: [
            { isDirty: true, hasBarn: true, hasBeauty: true },
            { isDirty: true, hasBarn: true },
          ],
          hand: ["barnDoor"],
        },
        { pigs: [{}], hand: [] },
      ],
      { hasExpansion: true },
    );
    expect(legalTargets(state, "p0", "barnDoor")).toEqual(["p0-pig1"]);
  });

  it("survives lightning burning the stall down", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["lightning", "mud", "mud"] },
        { pigs: [{ hasBarn: true, hasBeauty: true }], hand: [] },
      ],
      { drawPile: ["mud"], hasExpansion: true },
    );
    const next = play(state, "lightning", "p1-pig0");

    expect(next.players[1].pigs[0].barn).toBeNull();
    // The Schönsau lies on the pig, not in the stall.
    expect(next.players[1].pigs[0].beauty).not.toBeNull();
  });
});

describe("Aus dem Staub", () => {
  it("targets every Schönsau on the table, own or not", () => {
    const state = makeState(
      [
        { pigs: [{ hasBeauty: true }, {}], hand: ["dustOff"] },
        { pigs: [{ hasBeauty: true }], hand: [] },
      ],
      { hasExpansion: true },
    );
    expect(legalTargets(state, "p0", "dustOff").sort()).toEqual(
      ["p0-pig0", "p1-pig0"].sort(),
    );
  });

  it("is unplayable while no Schönsau lies out", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["dustOff"] },
        { pigs: [{ isDirty: true }], hand: [] },
      ],
      { hasExpansion: true },
    );
    expect(isCardPlayable(state, "p0", "dustOff")).toBe(false);
  });

  it("uncovers the Drecksau that was hiding underneath", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["dustOff", "mud", "mud"] },
        { pigs: [{ isDirty: true, hasBeauty: true }], hand: [] },
      ],
      { drawPile: ["mud"], hasExpansion: true },
    );
    const next = play(state, "dustOff", "p1-pig0");

    expect(next.players[1].pigs[0].beauty).toBeNull();
    expect(next.players[1].pigs[0].isDirty).toBe(true);
  });

  it("uncovers a clean pig just the same", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["dustOff", "mud", "mud"] },
        { pigs: [{ isDirty: false, hasBeauty: true }], hand: [] },
      ],
      { drawPile: ["mud"], hasExpansion: true },
    );
    const next = play(state, "dustOff", "p1-pig0");
    expect(next.players[1].pigs[0].isDirty).toBe(false);
  });

  it("sends both cards to the discard pile", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["dustOff", "mud", "mud"] },
        { pigs: [{ hasBeauty: true }], hand: [] },
      ],
      { drawPile: ["mud"], hasExpansion: true },
    );
    const next = play(state, "dustOff", "p1-pig0");
    expect(next.discardPile.map((card) => card.type).sort()).toEqual([
      "beauty",
      "dustOff",
    ]);
  });
});

describe("Glücksvogel", () => {
  it("keeps the turn open until both other cards are used", () => {
    const state = makeState(
      [
        { pigs: [{}, {}], hand: ["luckyBird", "mud", "barn"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["mud", "rain", "barn"], hasExpansion: true },
    );

    const afterBird = play(state, "luckyBird");
    expect(afterBird.pendingCardIds).toHaveLength(2);
    // Nobody else moves and nothing is drawn yet.
    expect(afterBird.currentPlayerIndex).toBe(0);
    expect(afterBird.players[0].hand).toHaveLength(2);

    const afterMud = play(afterBird, "mud", "p0-pig0");
    expect(afterMud.pendingCardIds).toHaveLength(1);
    expect(afterMud.currentPlayerIndex).toBe(0);

    const afterBarn = play(afterMud, "barn", "p0-pig1");
    // Both used: hand back to three, turn passed on.
    expect(afterBarn.pendingCardIds).toHaveLength(0);
    expect(afterBarn.players[0].hand).toHaveLength(3);
    expect(afterBarn.currentPlayerIndex).toBe(1);
  });

  it("allows only the two pending cards while it runs", () => {
    const state = makeState(
      [
        { pigs: [{}, {}], hand: ["luckyBird", "mud", "barn"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["mud", "rain", "barn"], hasExpansion: true },
    );
    const afterBird = play(state, "luckyBird");

    // The drawn cards are not in hand yet, so only mud and barn are offered.
    const offered = new Set(
      afterBird.players[0].hand
        .filter((card) => afterBird.pendingCardIds.includes(card.id))
        .map((card) => card.type),
    );
    expect(offered).toEqual(new Set(["mud", "barn"]));
  });

  it("drops a second Glücksvogel unused and draws three fresh cards", () => {
    const state = makeState(
      [
        { pigs: [{}, {}], hand: ["luckyBird", "luckyBird", "mud"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["rain", "barn", "mud"], hasExpansion: true },
    );

    const afterBird = play(state, "luckyBird");
    // Only the mud is pending - the second bird is not playable.
    expect(afterBird.pendingCardIds).toHaveLength(1);

    const afterMud = play(afterBird, "mud", "p0-pig0");
    expect(afterMud.players[0].hand).toHaveLength(3);
    // The unused bird went to the discard pile rather than staying in hand.
    expect(afterMud.players[0].hand.some((c) => c.type === "luckyBird")).toBe(
      false,
    );
    expect(
      afterMud.discardPile.filter((c) => c.type === "luckyBird"),
    ).toHaveLength(2);
    expect(afterMud.currentPlayerIndex).toBe(1);
  });

  it("ends the turn at once when both other cards are Glücksvögel", () => {
    const state = makeState(
      [
        { pigs: [{}, {}], hand: ["luckyBird", "luckyBird", "luckyBird"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["rain", "barn", "mud"], hasExpansion: true },
    );
    const next = play(state, "luckyBird");

    expect(next.pendingCardIds).toHaveLength(0);
    expect(next.players[0].hand).toHaveLength(3);
    expect(next.currentPlayerIndex).toBe(1);
  });

  it("never traps the player with an unplayable pending card", () => {
    // The feared dead end: the bird hands over a card that has no legal
    // target, and nothing may be drawn until the turn is done.
    const state = makeState(
      [
        // No own stall, so the rod has nowhere to go.
        { pigs: [{}, {}], hand: ["luckyBird", "mud", "lightningRod"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["rain", "barn", "mud"], hasExpansion: true },
    );

    const afterBird = play(state, "luckyBird");
    const afterMud = play(afterBird, "mud", "p0-pig0");

    // The rod is stuck - but discarding it is always allowed.
    expect(isCardPlayable(afterMud, "p0", "lightningRod")).toBe(false);
    const moves = legalMoves(afterMud);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((move) => move.kind === "discardCard")).toBe(true);

    const afterDiscard = applyMove(afterMud, moves[0]);
    expect(afterDiscard.pendingCardIds).toHaveLength(0);
    expect(afterDiscard.players[0].hand).toHaveLength(3);
    expect(afterDiscard.currentPlayerIndex).toBe(1);
  });

  it("leaves a move even when both pending cards are stuck", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["luckyBird", "lightningRod", "barnDoor"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["rain", "barn", "mud"], hasExpansion: true },
    );

    let current = play(state, "luckyBird");
    expect(current.pendingCardIds).toHaveLength(2);

    // Two discards get the turn done - no dead end at any point.
    for (let step = 0; step < 2; step++) {
      const moves = legalMoves(current);
      expect(moves.length).toBeGreaterThan(0);
      current = applyMove(current, moves[0]);
    }

    expect(current.pendingCardIds).toHaveLength(0);
    expect(current.players[0].hand).toHaveLength(3);
    expect(current.currentPlayerIndex).toBe(1);
  });

  it("can win the game on the second of its two cards", () => {
    const state = makeState(
      [
        {
          pigs: [{ isDirty: true }, {}],
          hand: ["luckyBird", "barn", "mud"],
        },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["rain", "barn", "mud"], hasExpansion: true },
    );

    const afterBird = play(state, "luckyBird");
    const afterBarn = play(afterBird, "barn", "p0-pig1");
    expect(afterBarn.winnerId).toBeNull();

    const afterMud = play(afterBarn, "mud", "p0-pig1");
    expect(afterMud.winnerId).toBe("p0");
  });
});

describe("the two ways to win", () => {
  it("wins with nothing but Drecksäue", () => {
    const state = makeState(
      [{ pigs: [{ isDirty: true }, { isDirty: true }], hand: [] }],
      { hasExpansion: true },
    );
    expect(hasWon(state.players[0])).toBe(true);
  });

  it("wins with nothing but Schönsäue", () => {
    const state = makeState(
      [{ pigs: [{ hasBeauty: true }, { hasBeauty: true }], hand: [] }],
      { hasExpansion: true },
    );
    expect(hasWon(state.players[0])).toBe(true);
  });

  it("a Drecksau under a Schönsau counts for the beauty win, not the mud one", () => {
    const state = makeState(
      [
        {
          pigs: [{ isDirty: true, hasBeauty: true }, { isDirty: true }],
          hand: [],
        },
      ],
      { hasExpansion: true },
    );
    // One shows a Schönsau, one a Drecksau - a mixture wins nothing.
    expect(hasWon(state.players[0])).toBe(false);
  });

  it("a mixture of Drecksäue and Schönsäue wins nothing", () => {
    const state = makeState(
      [{ pigs: [{ isDirty: true }, { hasBeauty: true }], hand: [] }],
      { hasExpansion: true },
    );
    expect(hasWon(state.players[0])).toBe(false);
  });

  it("ends the game when the last pig gets its Schönsau", () => {
    const state = makeState(
      [
        { pigs: [{ hasBeauty: true }, {}], hand: ["beauty", "mud", "mud"] },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["mud"], hasExpansion: true },
    );
    expect(play(state, "beauty", "p0-pig1").winnerId).toBe("p0");
  });
});

describe("card conservation with the expansion", () => {
  it("does not lose or duplicate cards, Schönsäue included", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["dustOff", "mud", "mud"] },
        { pigs: [{ hasBeauty: true }], hand: [] },
      ],
      { drawPile: ["mud", "beauty"], hasExpansion: true },
    );
    const before = totalCardCount(state);
    expect(totalCardCount(play(state, "dustOff", "p1-pig0"))).toBe(before);
  });
});
