/**
 * Tests for the remembered volume of the other players' voices.
 *
 * @module
 * @remarks
 * The mechanics of a volume knob are tested once, in
 * {@link ../lib/storage/volume-store}. What is checked here is only what this
 * particular knob promises: where it writes, and that it arrives audible.
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_VOICE_VOLUME, voiceVolume } from "./voice-volume";
import { gameVolume } from "@/games/panzerkiste/settings/sound-volume";

/** Where the volume is stored, for poking at it directly. */
const VOICE_KEY = "drecksau-app/online/voice-volume";

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

describe("the volume of the other players", () => {
  it("starts fully audible, unlike the game's own noises", () => {
    // A voice you unmuted for on purpose is one you want to hear; arriving
    // quiet would read as a broken line rather than as a setting.
    expect(DEFAULT_VOICE_VOLUME).toBe(1);
    expect(voiceVolume.load()).toBe(DEFAULT_VOICE_VOLUME);
  });

  it("writes under one key for every game, not per game", () => {
    // The voice chat is the same everywhere, so it is set once and holds
    // wherever you play next.
    voiceVolume.save(0.4);
    expect(entries.get(VOICE_KEY)).toContain('"data":0.4');
    expect([...entries.keys()]).toEqual([VOICE_KEY]);
  });

  it("leaves the game's sounds alone", () => {
    voiceVolume.save(0);
    expect(gameVolume.load()).toBe(0.5);
  });
});
