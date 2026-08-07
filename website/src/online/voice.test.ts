/**
 * Tests for the decisions the voice chat makes.
 *
 * @module
 * @remarks
 * The connections themselves need a real browser and are checked there. What
 * lives here is everything that can go wrong without one: two sides both
 * waiting for the other to call, a peer that left and is still being talked to,
 * and a broken line dressed up as a working one.
 */
import { describe, expect, it } from "vitest";
import { callsFirst, clampVolume, linkOf, peerChanges } from "./voice";

describe("who calls whom", () => {
  it("makes exactly one side of a pair the caller", () => {
    const pairs = [
      ["a", "b"],
      ["seat-1", "seat-2"],
      ["zz", "aa"],
    ] as const;
    for (const [one, other] of pairs) {
      // Both run the same code; if they agreed, nobody would call - and if they
      // disagreed, both would.
      expect(callsFirst(one, other)).not.toBe(callsFirst(other, one));
    }
  });

  it("gives the same answer however often it is asked", () => {
    expect(callsFirst("a", "b")).toBe(callsFirst("a", "b"));
  });
});

describe("what a connection state means", () => {
  it("only calls a line live once it really carries", () => {
    expect(linkOf("connected")).toBe("live");
  });

  it("does not dress a dead line up as one that is still trying", () => {
    // A failed call never recovers by itself; showing "connecting" would leave
    // someone waiting for a voice that is not coming.
    expect(linkOf("failed")).toBe("lost");
    expect(linkOf("closed")).toBe("lost");
    expect(linkOf("disconnected")).toBe("lost");
  });

  it("treats everything on the way there as connecting", () => {
    expect(linkOf("new")).toBe("connecting");
    expect(linkOf("connecting")).toBe("connecting");
  });
});

describe("keeping up with who is there", () => {
  it("calls everybody present that is not already on a line", () => {
    const changes = peerChanges(["b"], ["me", "b", "c"], "me");
    expect(changes.call).toEqual(["c"]);
    expect(changes.drop).toEqual([]);
  });

  it("hangs up on whoever has gone", () => {
    const changes = peerChanges(["b", "c"], ["me", "b"], "me");
    expect(changes.call).toEqual([]);
    expect(changes.drop).toEqual(["c"]);
  });

  it("calls everybody in the room, not merely one of them", () => {
    // The voice room is a **mesh**: each browser holds one connection per
    // other player, so eight at a table hear all seven of the others. Nothing
    // here caps it at a pair - the two-player limit some games have is theirs,
    // not the microphone's.
    const table = ["me", "b", "c", "d", "e", "f", "g", "h"];
    const changes = peerChanges([], table, "me");
    expect(new Set(changes.call)).toEqual(new Set(table.slice(1)));
    expect(changes.call).toHaveLength(table.length - 1);
  });

  it("never calls itself", () => {
    const changes = peerChanges([], ["me"], "me");
    expect(changes.call).toEqual([]);
  });

  it("leaves a settled room alone", () => {
    const changes = peerChanges(["b", "c"], ["me", "b", "c"], "me");
    expect(changes.call).toEqual([]);
    expect(changes.drop).toEqual([]);
  });

  it("handles a full turnover in one go", () => {
    const changes = peerChanges(["b"], ["me", "c", "d"], "me");
    expect(new Set(changes.call)).toEqual(new Set(["c", "d"]));
    expect(changes.drop).toEqual(["b"]);
  });
});

describe("how loud the others are", () => {
  it("passes a wanted volume through untouched", () => {
    expect(clampVolume(0.4)).toBe(0.4);
    expect(clampVolume(0)).toBe(0);
  });

  it("holds a value inside what an audio element accepts", () => {
    // An element throws on anything outside 0..1, which would take the whole
    // room down over a slider.
    expect(clampVolume(4)).toBe(1);
    expect(clampVolume(-2)).toBe(0);
  });

  it("stays audible when handed something unusable", () => {
    // Silence is the wrong guess here: a broken value must not quietly cut
    // everybody off with no way to tell why.
    expect(clampVolume(Number.NaN)).toBe(1);
  });
});
