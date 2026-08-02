/**
 * Tests for the remembered volume of Panzerkiste's own sounds.
 *
 * @module
 * @remarks
 * The mechanics of a volume knob are tested once, in
 * {@link ../../../lib/storage/volume-store}. What is checked here is only what
 * this particular knob promises: where it writes, and how loud it is before
 * anybody has touched it.
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_VOLUME, gameVolume } from "./sound-volume";
import { voiceVolume } from "@/online/voice-volume";

/** Where the volume is stored, for poking at it directly. */
const VOLUME_KEY = "drecksau-app/panzerkiste/sound-volume";

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
  (globalThis as { window?: unknown }).window = {
    localStorage: storage,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
});

afterEach(() => {
  entries.clear();
});

describe("the volume of the game's own sounds", () => {
  it("starts at half, not at full blast", () => {
    expect(DEFAULT_VOLUME).toBe(0.5);
    expect(gameVolume.load()).toBe(DEFAULT_VOLUME);
  });

  it("writes under its own key, so it survives a visit", () => {
    gameVolume.save(0.25);
    expect(entries.get(VOLUME_KEY)).toContain('"data":0.25');
    expect(gameVolume.load()).toBe(0.25);
  });

  it("leaves the voice chat alone", () => {
    // The whole point of two knobs: turning the tanks off must not turn the
    // partner off with them.
    gameVolume.save(0);
    expect(voiceVolume.load()).toBe(1);
  });
});
