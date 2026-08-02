/**
 * Tests for a remembered volume knob.
 *
 * @module
 * @remarks
 * The suite runs in a plain Node environment, so it brings the smallest
 * `window` the store needs: a `localStorage` and the two listener methods used
 * to notice another tab moving the same knob.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createVolumeStore } from "./volume-store";

/** The key the store under test writes to. */
const KEY = "test/volume";

/** The in-memory stand-in for the browser's storage. */
const entries = new Map<string, string>();

/** Listeners the store registered on the fake window, by event name. */
const bound = new Map<string, Set<() => void>>();

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
    addEventListener: (name: string, fn: () => void) => {
      const set = bound.get(name) ?? new Set<() => void>();
      set.add(fn);
      bound.set(name, set);
    },
    removeEventListener: (name: string, fn: () => void) =>
      void bound.get(name)?.delete(fn),
  };
});

afterEach(() => {
  entries.clear();
  bound.clear();
});

/** Fires the browser's cross-tab storage event at whatever is listening. */
function otherTabWrote(): void {
  for (const fn of [...(bound.get("storage") ?? [])]) {
    fn();
  }
}

/** A fresh store for one test, so no cache is carried between them. */
function store(fallback = 0.5): ReturnType<typeof createVolumeStore> {
  return createVolumeStore(KEY, fallback);
}

describe("what is stored", () => {
  it("falls back to the given value when nothing is stored", () => {
    expect(store(0.5).load()).toBe(0.5);
    expect(store(1).load()).toBe(1);
  });

  it("gives back what was stored", () => {
    const knob = store();
    knob.save(0.25);
    expect(knob.load()).toBe(0.25);
  });

  it("remembers silence rather than treating it as nothing stored", () => {
    // Zero is falsy, so a sloppy fallback would hand half a volume back to
    // somebody who deliberately turned the sound off.
    const knob = store();
    knob.save(0);
    expect(knob.load()).toBe(0);
  });

  it("holds a stored value that is out of range inside it", () => {
    entries.set(KEY, JSON.stringify({ version: 1, data: 4 }));
    expect(store().load()).toBe(1);
    entries.set(KEY, JSON.stringify({ version: 1, data: -3 }));
    expect(store().load()).toBe(0);
  });

  it("falls back when the stored value is junk", () => {
    entries.set(KEY, JSON.stringify({ version: 1, data: "laut" }));
    expect(store().load()).toBe(0.5);
    entries.set(KEY, "not json at all");
    expect(store().load()).toBe(0.5);
  });

  it("clamps what it is given before storing it", () => {
    store().save(9);
    expect(entries.get(KEY)).toContain('"data":1');
  });
});

describe("clamping", () => {
  it("passes a value in range through untouched", () => {
    expect(store().clamp(0.3)).toBe(0.3);
  });

  it("turns anything that is not a finite number into the fallback", () => {
    const knob = store(0.5);
    expect(knob.clamp(Number.NaN)).toBe(0.5);
    expect(knob.clamp(Number.POSITIVE_INFINITY)).toBe(0.5);
    expect(knob.clamp(null)).toBe(0.5);
    expect(knob.clamp("0.4")).toBe(0.5);
  });
});

describe("the snapshots React reads", () => {
  it("shows the fallback during the prerender, where storage does not exist", () => {
    const knob = store(0.5);
    knob.save(0.9);
    expect(knob.getServerSnapshot()).toBe(0.5);
  });

  it("hands out the same snapshot until something changes", () => {
    // React re-renders forever if the snapshot is a fresh value each call, so
    // this must not go back to storage on every read.
    const knob = store();
    const stop = knob.subscribe(() => undefined);
    knob.save(0.35);
    const first = knob.getSnapshot();
    entries.set(KEY, JSON.stringify({ version: 1, data: 0.8 }));
    expect(knob.getSnapshot()).toBe(first);
    otherTabWrote();
    expect(knob.getSnapshot()).toBe(0.8);
    stop();
  });
});

describe("who is told about a change", () => {
  it("tells listeners when the volume was saved", () => {
    const knob = store();
    const heard = vi.fn();
    const stop = knob.subscribe(heard);
    knob.save(0.2);
    expect(heard).toHaveBeenCalledTimes(1);
    expect(knob.getSnapshot()).toBe(0.2);
    stop();
    knob.save(0.7);
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it("also listens for another tab moving the same knob", () => {
    const knob = store();
    const heard = vi.fn();
    const stop = knob.subscribe(heard);
    otherTabWrote();
    expect(heard).toHaveBeenCalledTimes(1);
    stop();
    // Unsubscribing must take the window listener away too, or a left page
    // keeps being woken up for as long as it exists.
    expect(bound.get("storage")?.size ?? 0).toBe(0);
  });

  it("keeps serving the rest when one of several listeners leaves", () => {
    // One window listener serves them all, so dropping it with the first
    // unsubscribe would leave the others deaf to other tabs.
    const knob = store();
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = knob.subscribe(first);
    const stopSecond = knob.subscribe(second);
    stopFirst();
    otherTabWrote();
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    stopSecond();
    expect(bound.get("storage")?.size ?? 0).toBe(0);
  });

  it("keeps two knobs apart", () => {
    // The game's noises and the voice chat are separate on purpose: turning one
    // down must leave the other exactly where it was.
    const game = createVolumeStore("test/game", 0.5);
    const voice = createVolumeStore("test/voice", 1);
    const heardVoice = vi.fn();
    const stop = voice.subscribe(heardVoice);
    game.save(0);
    expect(voice.load()).toBe(1);
    expect(voice.getSnapshot()).toBe(1);
    expect(heardVoice).not.toHaveBeenCalled();
    stop();
  });
});
