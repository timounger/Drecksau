/**
 * Tests for move legality - which card may target which pig.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  isBlocked,
  isCardPlayable,
  legalMoves,
  legalTargets,
  needsTarget,
} from "./moves";
import { makeState } from "./test-helpers";

describe("mud", () => {
  it("targets own clean pigs only", () => {
    const state = makeState([
      { pigs: [{}, { isDirty: true }], hand: ["mud"] },
      { pigs: [{}], hand: [] },
    ]);
    expect(legalTargets(state, "p0", "mud")).toEqual(["p0-pig0"]);
  });

  it("may dirty a clean pig that already stands in a stall", () => {
    const state = makeState([
      { pigs: [{ hasBarn: true }], hand: ["mud"] },
      { pigs: [{}], hand: [] },
    ]);
    expect(legalTargets(state, "p0", "mud")).toEqual(["p0-pig0"]);
  });

  it("is unplayable without a clean pig", () => {
    const state = makeState([
      { pigs: [{ isDirty: true }], hand: ["mud"] },
      { pigs: [{}], hand: [] },
    ]);
    expect(isCardPlayable(state, "p0", "mud")).toBe(false);
  });
});

describe("rain", () => {
  it("needs no target and is always playable", () => {
    const state = makeState([
      { pigs: [{}], hand: ["rain"] },
      { pigs: [{}], hand: [] },
    ]);
    expect(needsTarget("rain")).toBe(false);
    expect(isCardPlayable(state, "p0", "rain")).toBe(true);
  });
});

describe("barn", () => {
  it("targets own pigs without a stall, clean or dirty", () => {
    const state = makeState([
      { pigs: [{}, { isDirty: true }, { hasBarn: true }], hand: ["barn"] },
      { pigs: [{}], hand: [] },
    ]);
    expect(legalTargets(state, "p0", "barn")).toEqual(["p0-pig0", "p0-pig1"]);
  });
});

describe("lightning", () => {
  it("targets opponent stalls without a rod", () => {
    const state = makeState([
      { pigs: [{ hasBarn: true }], hand: ["lightning"] },
      {
        pigs: [{ hasBarn: true }, { hasBarn: true, hasLightningRod: true }],
        hand: [],
      },
    ]);
    expect(legalTargets(state, "p0", "lightning")).toEqual(["p1-pig0"]);
  });

  it("never targets an own stall", () => {
    const state = makeState([
      { pigs: [{ hasBarn: true }], hand: ["lightning"] },
      { pigs: [{}], hand: [] },
    ]);
    expect(isCardPlayable(state, "p0", "lightning")).toBe(false);
  });
});

describe("lightningRod", () => {
  it("targets an own stall that has no rod yet", () => {
    const state = makeState([
      {
        pigs: [{ hasBarn: true }, {}, { hasBarn: true, hasLightningRod: true }],
        hand: ["lightningRod"],
      },
      { pigs: [{ hasBarn: true }], hand: [] },
    ]);
    expect(legalTargets(state, "p0", "lightningRod")).toEqual(["p0-pig0"]);
  });
});

describe("farmerScrubs", () => {
  it("targets dirty opponent pigs, even inside a stall", () => {
    const state = makeState([
      { pigs: [{ isDirty: true }], hand: ["farmerScrubs"] },
      { pigs: [{ isDirty: true, hasBarn: true }, {}], hand: [] },
    ]);
    expect(legalTargets(state, "p0", "farmerScrubs")).toEqual(["p1-pig0"]);
  });

  it("is blocked by a nailed door", () => {
    const state = makeState([
      { pigs: [{}], hand: ["farmerScrubs"] },
      { pigs: [{ isDirty: true, hasBarn: true, hasBarnDoor: true }], hand: [] },
    ]);
    expect(isCardPlayable(state, "p0", "farmerScrubs")).toBe(false);
  });
});

describe("barnDoor", () => {
  it("needs an own stall with a Drecksau in it", () => {
    const state = makeState([
      {
        pigs: [
          { isDirty: true, hasBarn: true },
          { isDirty: true },
          { hasBarn: true },
        ],
        hand: ["barnDoor"],
      },
      { pigs: [{}], hand: [] },
    ]);
    expect(legalTargets(state, "p0", "barnDoor")).toEqual(["p0-pig0"]);
  });
});

describe("blockade rule", () => {
  it("applies when no hand card can be played", () => {
    const state = makeState([
      {
        pigs: [{ isDirty: true }],
        hand: ["lightningRod", "barnDoor", "lightning"],
      },
      { pigs: [{}], hand: [] },
    ]);
    expect(isBlocked(state, "p0")).toBe(true);
    expect(legalMoves(state)).toContainEqual({ kind: "redrawHand" });
  });

  it("does not apply while a card is playable", () => {
    const state = makeState([
      { pigs: [{}], hand: ["lightningRod", "barnDoor", "mud"] },
      { pigs: [{}], hand: [] },
    ]);
    expect(isBlocked(state, "p0")).toBe(false);
    expect(legalMoves(state)).not.toContainEqual({ kind: "redrawHand" });
  });

  it("never applies while a rain card is held", () => {
    const state = makeState([
      { pigs: [{ isDirty: true }], hand: ["rain", "barnDoor", "lightning"] },
      { pigs: [{}], hand: [] },
    ]);
    expect(isBlocked(state, "p0")).toBe(false);
  });
});

describe("legalMoves", () => {
  it("always offers discarding every hand card", () => {
    const state = makeState([
      { pigs: [{}], hand: ["mud", "rain"] },
      { pigs: [{}], hand: [] },
    ]);
    const discards = legalMoves(state).filter(
      (move) => move.kind === "discardCard",
    );
    expect(discards).toHaveLength(2);
  });

  it("offers nothing once the game is won", () => {
    const state = {
      ...makeState([
        { pigs: [{ isDirty: true }], hand: ["mud"] },
        { pigs: [{}], hand: [] },
      ]),
      winnerId: "p0",
    };
    expect(legalMoves(state)).toHaveLength(0);
  });
});
