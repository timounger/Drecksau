/**
 * A player wins the instant their board is complete - even when it was an
 * opponent's move that completed it, not their own.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { applyMove } from "./engine";
import { handCardId, makeState } from "./test-helpers";

describe("winning through an opponent's move", () => {
  it("declares the human the winner when a rival's dust-off completes their board", () => {
    // The human's three pigs are all dirty, but one is covered by a Schönsau,
    // so it does not yet count as a win (a mixture wins nothing). It is the
    // opponent's turn, and the opponent holds a dust-off.
    const state = makeState(
      [
        {
          isHuman: true,
          pigs: [
            { isDirty: true },
            { isDirty: true },
            { isDirty: true, hasBeauty: true },
          ],
          hand: [],
        },
        { pigs: [{}], hand: ["dustOff"] },
      ],
      { currentPlayerIndex: 1, hasExpansion: true },
    );

    // The opponent dusts the Schönsau off the human's third pig - now every pig
    // shows a Drecksau, so the human wins at once, without moving again.
    const next = applyMove(state, {
      kind: "playCard",
      cardId: handCardId(state, 1, "dustOff"),
      targetPigId: "p0-pig2",
    });

    expect(next.winnerId).toBe("p0");
  });

  it("still lets the mover win on their own completing move", () => {
    // A regression guard: the ordinary case - you win on your own turn.
    const state = makeState(
      [
        {
          isHuman: true,
          pigs: [{ isDirty: true }, { isDirty: true }, {}],
          hand: ["mud"],
        },
        { pigs: [{}], hand: [] },
      ],
      { currentPlayerIndex: 0 },
    );

    const next = applyMove(state, {
      kind: "playCard",
      cardId: handCardId(state, 0, "mud"),
      targetPigId: "p0-pig2",
    });

    expect(next.winnerId).toBe("p0");
  });
});
