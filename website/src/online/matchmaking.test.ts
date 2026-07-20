/**
 * Tests for the pure matchmaking decisions (no network).
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  isOpenRoom,
  MATCH_TTL_MS,
  parseOpenRooms,
  pickRoom,
  roomMatchesWish,
  type OpenRoom,
  type Wish,
} from "./matchmaking";

const NOW = 1_000_000;
const WISH: Wish = { count: 4, expansion: true, defense: false };

/** Builds an open room, defaulting to the wished config and a fresh stamp. */
function room(over: Partial<OpenRoom> = {}): OpenRoom {
  return { code: "AAAA", ...WISH, ts: NOW - 1000, ...over };
}

describe("isOpenRoom", () => {
  it("accepts a well-formed room", () => {
    expect(isOpenRoom(room())).toBe(true);
  });

  it("rejects malformed or missing rooms", () => {
    for (const value of [
      null,
      42,
      { ...room(), code: "" },
      { ...room(), count: "4" },
      { ...room(), expansion: undefined },
      { code: "AAAA", ts: NOW },
    ]) {
      expect(isOpenRoom(value)).toBe(false);
    }
  });
});

describe("parseOpenRooms", () => {
  it("reads the well-formed rooms from the map", () => {
    const map = {
      AAAA: room({ code: "AAAA" }),
      BBBB: room({ code: "BBBB" }),
      junk: { nope: true },
    };
    expect(
      parseOpenRooms(map)
        .map((r) => r.code)
        .sort(),
    ).toEqual(["AAAA", "BBBB"]);
  });

  it("returns nothing for an empty or missing map", () => {
    expect(parseOpenRooms(null)).toEqual([]);
    expect(parseOpenRooms(undefined)).toEqual([]);
  });
});

describe("roomMatchesWish", () => {
  it("matches only when count, expansion and defence all agree", () => {
    expect(roomMatchesWish(room(), WISH)).toBe(true);
    expect(roomMatchesWish(room({ count: 3 }), WISH)).toBe(false);
    expect(roomMatchesWish(room({ expansion: false }), WISH)).toBe(false);
    expect(roomMatchesWish(room({ defense: true }), WISH)).toBe(false);
  });
});

describe("pickRoom", () => {
  it("returns null when there is nothing to join", () => {
    expect(pickRoom([], WISH, NOW, { allowAny: false })).toBeNull();
  });

  it("joins a fresh, matching room", () => {
    expect(
      pickRoom([room({ code: "AAAA" })], WISH, NOW, { allowAny: false }),
    ).toBe("AAAA");
  });

  it("ignores a stale room", () => {
    const stale = room({ ts: NOW - MATCH_TTL_MS });
    expect(pickRoom([stale], WISH, NOW, { allowAny: false })).toBeNull();
  });

  it("skips a non-matching room unless any is allowed", () => {
    const other = room({ code: "AAAA", count: 3 });
    expect(pickRoom([other], WISH, NOW, { allowAny: false })).toBeNull();
    expect(pickRoom([other], WISH, NOW, { allowAny: true })).toBe("AAAA");
  });

  it("skips the searcher's own room", () => {
    expect(
      pickRoom([room({ code: "AAAA" })], WISH, NOW, {
        allowAny: false,
        excludeCode: "AAAA",
      }),
    ).toBeNull();
  });

  it("only merges into a senior (lower-coded) room", () => {
    const senior = room({ code: "AAAA" });
    const junior = room({ code: "ZZZZ" });
    // From ZZZZ's view only AAAA is senior; from AAAA's view nothing is.
    expect(
      pickRoom([senior, junior], WISH, NOW, {
        allowAny: false,
        excludeCode: "ZZZZ",
        seniorTo: "ZZZZ",
      }),
    ).toBe("AAAA");
    expect(
      pickRoom([senior, junior], WISH, NOW, {
        allowAny: false,
        excludeCode: "AAAA",
        seniorTo: "AAAA",
      }),
    ).toBeNull();
  });

  it("prefers the oldest room, then the smaller code", () => {
    const older = room({ code: "ZZZZ", ts: NOW - 5000 });
    const newer = room({ code: "AAAA", ts: NOW - 1000 });
    expect(pickRoom([newer, older], WISH, NOW, { allowAny: false })).toBe(
      "ZZZZ",
    );
    const tieA = room({ code: "AAAA", ts: NOW - 2000 });
    const tieB = room({ code: "BBBB", ts: NOW - 2000 });
    expect(pickRoom([tieB, tieA], WISH, NOW, { allowAny: false })).toBe("AAAA");
  });
});
