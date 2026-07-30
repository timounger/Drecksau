/**
 * Tests for the remembered table size.
 *
 * @module
 * @remarks
 * The suite runs in a plain Node environment, so it brings the smallest
 * `window.localStorage` that {@link ../../../lib/storage/local-store} needs -
 * cheaper and more predictable than pulling a whole DOM in for four keys.
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  DEFAULT_PLAYER_COUNT,
  PLAYER_COUNTS,
  clampCount,
  loadPlayerCount,
  savePlayerCount,
} from "./player-count";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/krakel/engine/types";

/** Where the setting is stored, for poking at it directly. */
const KEY = "drecksau-app/krakel/online-player-count";

/** The in-memory stand-in for the browser's storage. */
const entries = new Map<string, string>();

beforeAll(() => {
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
    removeItem: (key: string) => void entries.delete(key),
    clear: () => entries.clear(),
    key: (index: number) => [...entries.keys()][index] ?? null,
    get length() {
      return entries.size;
    },
  };
  (globalThis as { window?: unknown }).window = { localStorage: storage };
});

afterEach(() => {
  entries.clear();
});

describe("PLAYER_COUNTS", () => {
  it("offers every seatable table size", () => {
    expect(PLAYER_COUNTS[0]).toBe(MIN_PLAYERS);
    expect(PLAYER_COUNTS[PLAYER_COUNTS.length - 1]).toBe(MAX_PLAYERS);
    expect(PLAYER_COUNTS).toEqual([2, 3, 4, 5, 6, 7, 8]);
  });

  it("defaults to a size that is on offer", () => {
    expect(PLAYER_COUNTS).toContain(DEFAULT_PLAYER_COUNT);
  });
});

describe("loadPlayerCount", () => {
  it("falls back to the default when nothing is stored", () => {
    expect(loadPlayerCount()).toBe(DEFAULT_PLAYER_COUNT);
  });

  it("gives back what was stored", () => {
    savePlayerCount(7);
    expect(loadPlayerCount()).toBe(7);
  });

  it("holds a stored value that is out of range inside it", () => {
    // A hand-edited or outdated entry must never seat an impossible table.
    entries.set(KEY, JSON.stringify({ version: 1, data: 99 }));
    expect(loadPlayerCount()).toBe(MAX_PLAYERS);
    entries.set(KEY, JSON.stringify({ version: 1, data: 0 }));
    expect(loadPlayerCount()).toBe(MIN_PLAYERS);
  });

  it("falls back when the entry is junk", () => {
    entries.set(KEY, "not json");
    expect(loadPlayerCount()).toBe(DEFAULT_PLAYER_COUNT);
    entries.set(KEY, JSON.stringify({ version: 1, data: "vier" }));
    expect(loadPlayerCount()).toBe(DEFAULT_PLAYER_COUNT);
  });
});

describe("clampCount", () => {
  it("keeps a count inside the seatable range", () => {
    expect(clampCount(MIN_PLAYERS - 1)).toBe(MIN_PLAYERS);
    expect(clampCount(MAX_PLAYERS + 1)).toBe(MAX_PLAYERS);
    expect(clampCount(5)).toBe(5);
    expect(clampCount(4.4)).toBe(4);
  });
});
