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
import { callsFirst, linkOf, peerChanges } from "./voice";

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
