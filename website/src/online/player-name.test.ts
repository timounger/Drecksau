/**
 * Tests for the one name a player goes by online.
 *
 * @module
 * @remarks
 * The suite runs in a plain Node environment, so it brings the smallest
 * `window.localStorage` that {@link ../lib/storage/local-store} needs - cheaper
 * and more predictable than pulling a whole DOM in for one key.
 *
 * The point of the module is that there is exactly **one** key, so most of
 * what is worth testing is about the old per-game ones: that a name stored
 * before the change is taken over rather than lost, and that it is taken over
 * once and then left alone.
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { loadPlayerName, savePlayerName } from "./player-name";

/** Where the shared name lives, for poking at it directly. */
const SHARED_KEY = "drecksau-app/online/player-name";

/** Where the per-game names used to live. */
const OLD_BINOKEL = "drecksau-app/binokel/online-player-name";
const OLD_KRAKEL = "drecksau-app/krakel/online-player-name";
const OLD_SKYJO = "drecksau-app/skyjo/online-player-name";

/** The in-memory stand-in for the browser's storage. */
const entries = new Map<string, string>();

/** One stored entry, as the store writes them. */
function stored(name: unknown): string {
  return JSON.stringify({ version: 1, data: name });
}

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

describe("the shared online name", () => {
  it("is empty until one is stored", () => {
    expect(loadPlayerName()).toBe("");
  });

  it("gives back what was stored", () => {
    savePlayerName("Timo");
    expect(loadPlayerName()).toBe("Timo");
  });

  it("is one name for every game", () => {
    // The whole point: whatever wrote it, everybody reads the same key.
    savePlayerName("Timo");
    expect(entries.has(SHARED_KEY)).toBe(true);
    expect([...entries.keys()]).toEqual([SHARED_KEY]);
  });

  it("keeps a name as it was typed", () => {
    // Trimming on the way in would eat the space before a surname while it is
    // still being typed.
    savePlayerName("Timo ");
    expect(entries.get(SHARED_KEY)).toBe(stored("Timo "));
  });

  it("gives back nothing for a name of only spaces", () => {
    savePlayerName("   ");
    expect(loadPlayerName()).toBe("");
  });

  it("shrugs off an entry that is not a name at all", () => {
    entries.set(SHARED_KEY, "not json");
    expect(loadPlayerName()).toBe("");
    entries.set(SHARED_KEY, stored(42));
    expect(loadPlayerName()).toBe("");
  });
});

describe("the names the per-game keys left behind", () => {
  it("takes one over rather than losing it", () => {
    entries.set(OLD_KRAKEL, stored("Timo"));
    expect(loadPlayerName()).toBe("Timo");
  });

  it("adopts it, so it is read from the shared key from then on", () => {
    entries.set(OLD_KRAKEL, stored("Timo"));
    expect(loadPlayerName()).toBe("Timo");
    entries.delete(OLD_KRAKEL);
    expect(loadPlayerName()).toBe("Timo");
  });

  it("never overrules a name that is already shared", () => {
    savePlayerName("Neu");
    entries.set(OLD_BINOKEL, stored("Alt"));
    expect(loadPlayerName()).toBe("Neu");
  });

  it("skips the empty ones and takes the first real one", () => {
    entries.set(OLD_BINOKEL, stored(""));
    entries.set(OLD_KRAKEL, stored("   "));
    entries.set(OLD_SKYJO, stored("Timo"));
    expect(loadPlayerName()).toBe("Timo");
  });

  it("takes over none of them when none holds a name", () => {
    entries.set(OLD_BINOKEL, stored(""));
    expect(loadPlayerName()).toBe("");
    expect(entries.has(SHARED_KEY)).toBe(false);
  });
});
