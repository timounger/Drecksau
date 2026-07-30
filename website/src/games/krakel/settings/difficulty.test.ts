/**
 * Tests for the remembered difficulty.
 *
 * @module
 * @remarks
 * Brings the smallest `window.localStorage` the store needs, like
 * {@link ./player-count.test.ts} - the suite runs in a plain Node environment.
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  DEFAULT_DIFFICULTY,
  loadDifficulty,
  saveDifficulty,
} from "./difficulty";
import { DIFFICULTIES } from "@/games/krakel/engine/types";

/** Where the setting is stored, for poking at it directly. */
const KEY = "drecksau-app/krakel/online-difficulty";

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

describe("loadDifficulty", () => {
  it("starts on the easy list", () => {
    expect(DEFAULT_DIFFICULTY).toBe("easy");
    expect(loadDifficulty()).toBe("easy");
  });

  it("gives back every difficulty that was stored", () => {
    for (const difficulty of DIFFICULTIES) {
      saveDifficulty(difficulty);
      expect(loadDifficulty()).toBe(difficulty);
    }
  });

  it("falls back when the stored list does not exist", () => {
    // An outdated or hand-edited entry must not select a missing word list.
    entries.set(KEY, JSON.stringify({ version: 1, data: "unmoeglich" }));
    expect(loadDifficulty()).toBe(DEFAULT_DIFFICULTY);
    entries.set(KEY, JSON.stringify({ version: 1, data: 2 }));
    expect(loadDifficulty()).toBe(DEFAULT_DIFFICULTY);
    entries.set(KEY, "kein json");
    expect(loadDifficulty()).toBe(DEFAULT_DIFFICULTY);
  });
});
