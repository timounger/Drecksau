/**
 * Tests for the pure matchmaking decisions (no network).
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  isFreshWaiting,
  MATCH_TTL_MS,
  nextWaiting,
  resolveMatch,
} from "./matchmaking";

const NOW = 1_000_000;

describe("isFreshWaiting", () => {
  it("accepts a well-formed, recent slot", () => {
    expect(isFreshWaiting({ code: "ABCD", ts: NOW - 1000 }, NOW)).toBe(true);
  });

  it("rejects a slot older than the time to live", () => {
    expect(isFreshWaiting({ code: "ABCD", ts: NOW - MATCH_TTL_MS }, NOW)).toBe(
      false,
    );
  });

  it("rejects malformed or missing slots", () => {
    for (const value of [
      null,
      undefined,
      42,
      "ABCD",
      { code: "ABCD" },
      { ts: NOW },
      { code: "", ts: NOW },
    ]) {
      expect(isFreshWaiting(value, NOW)).toBe(false);
    }
  });
});

describe("nextWaiting", () => {
  it("opens a new room when the slot is empty", () => {
    expect(nextWaiting(null, "WXYZ", NOW)).toEqual({ code: "WXYZ", ts: NOW });
  });

  it("opens a new room when the slot is stale", () => {
    const stale = { code: "OLD1", ts: NOW - MATCH_TTL_MS };
    expect(nextWaiting(stale, "WXYZ", NOW)).toEqual({ code: "WXYZ", ts: NOW });
  });

  it("steps aside (aborts) when a fresh room is already waiting", () => {
    const fresh = { code: "OPEN", ts: NOW - 500 };
    expect(nextWaiting(fresh, "WXYZ", NOW)).toBeUndefined();
  });
});

describe("resolveMatch", () => {
  it("hosts when the slot holds the offered code", () => {
    expect(resolveMatch({ code: "WXYZ", ts: NOW }, "WXYZ")).toEqual({
      code: "WXYZ",
      mode: "host",
    });
  });

  it("joins when the slot holds someone else's open room", () => {
    expect(resolveMatch({ code: "OPEN", ts: NOW }, "WXYZ")).toEqual({
      code: "OPEN",
      mode: "guest",
    });
  });

  it("hosts the offered code when the slot came back empty", () => {
    expect(resolveMatch(null, "WXYZ")).toEqual({ code: "WXYZ", mode: "host" });
  });
});
