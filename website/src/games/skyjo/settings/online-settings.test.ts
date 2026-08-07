/**
 * Tests for what the online entry screen remembers.
 *
 * @module
 * @remarks
 * The suite runs in a plain Node environment, so it brings the smallest
 * `window.localStorage` that {@link ../../../lib/storage/local-store} needs -
 * cheaper and more predictable than pulling a whole DOM in for two keys.
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { loadMatchCount, saveMatchCount } from "./online-settings";
import { DEFAULT_PLAYER_COUNT, saveSettings } from "./app-settings";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/games/skyjo/engine/state";
import { DEFAULT_DIFFICULTY } from "@/games/skyjo/engine/difficulty";

/** Where the wished count is stored, for poking at it directly. */
const COUNT_KEY = "drecksau-app/skyjo/online-player-count";

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

describe("the wished table size", () => {
  it("falls back to the default when nothing is stored", () => {
    expect(loadMatchCount()).toBe(DEFAULT_PLAYER_COUNT);
  });

  it("gives back what was stored", () => {
    saveMatchCount(7);
    expect(loadMatchCount()).toBe(7);
  });

  it("holds a stored value that is out of range inside it", () => {
    // A hand-edited or outdated entry must never seat an impossible table.
    entries.set(COUNT_KEY, JSON.stringify({ version: 1, data: 99 }));
    expect(loadMatchCount()).toBe(MAX_PLAYERS);
    entries.set(COUNT_KEY, JSON.stringify({ version: 1, data: 0 }));
    expect(loadMatchCount()).toBe(MIN_PLAYERS);
  });

  it("falls back when the entry is junk", () => {
    entries.set(COUNT_KEY, "not json");
    expect(loadMatchCount()).toBe(DEFAULT_PLAYER_COUNT);
    entries.set(COUNT_KEY, JSON.stringify({ version: 1, data: "vier" }));
    expect(loadMatchCount()).toBe(DEFAULT_PLAYER_COUNT);
  });

  it("is not the table size of the game against the computer", () => {
    // Both live in storage; changing one may not drag the other along.
    saveMatchCount(8);
    saveSettings({ playerCount: 2, difficulty: DEFAULT_DIFFICULTY });
    expect(loadMatchCount()).toBe(8);
  });
});
