/**
 * A remembered volume knob, as an external store.
 *
 * @module
 * @remarks
 * There is more than one knob on the site - the game's own noises and the voice
 * chat are set apart from each other on purpose - and each needs the same
 * careful handling: a value clamped into a range an audio element accepts, a
 * stable snapshot for `useSyncExternalStore`, and a fallback for the prerender,
 * where localStorage does not exist yet.
 *
 * Two knobs never share a store. Turning the tanks down must not turn a
 * partner down with them, so each one gets its own key and its own listeners.
 */
import { readStored, writeStored } from "@/lib/storage/local-store";

/** Schema version of a stored volume - raise it on breaking changes. */
const VOLUME_VERSION = 1;

/** One remembered volume, ready for `useSyncExternalStore`. */
export type VolumeStore = {
  /** What is used when nothing usable is stored. */
  readonly fallback: number;
  /** Holds any value inside the range an audio element accepts. */
  readonly clamp: (value: unknown) => number;
  /** Reads the stored volume, or the fallback. */
  readonly load: () => number;
  /** Stores a volume for next time and tells everyone listening. */
  readonly save: (value: number) => void;
  /** Subscribes to changes; returns the unsubscribe function. */
  readonly subscribe: (onChange: () => void) => () => void;
  /** A snapshot that stays identical until the volume actually changes. */
  readonly getSnapshot: () => number;
  /** What the prerender sees: no storage, so the fallback. */
  readonly getServerSnapshot: () => number;
};

/**
 * Creates a volume that is remembered between visits.
 *
 * @param key - the full storage key, from `storageKey`
 * @param fallback - the volume before anybody touches the knob
 * @returns the store
 */
export function createVolumeStore(key: string, fallback: number): VolumeStore {
  const listeners = new Set<() => void>();
  /** The snapshot handed out until something changes. */
  let cache: number | null = null;

  const clamp = (value: unknown): number =>
    typeof value === "number" && Number.isFinite(value)
      ? Math.min(1, Math.max(0, value))
      : fallback;

  const load = (): number => clamp(readStored(key, VOLUME_VERSION, isNumber));

  const changed = (): void => {
    cache = null;
    for (const listener of listeners) {
      listener();
    }
  };

  return {
    fallback,
    clamp,
    load,
    save(value: number): void {
      writeStored(key, VOLUME_VERSION, clamp(value));
      changed();
    },
    subscribe(onChange: () => void): () => void {
      listeners.add(onChange);
      // Another tab may move the same knob. One window listener serves all of
      // them: attached with the first subscriber, dropped with the last, so a
      // left page is not woken up forever and a second subscriber does not
      // silence the first by leaving.
      if (listeners.size === 1) {
        window.addEventListener("storage", changed);
      }
      return () => {
        listeners.delete(onChange);
        if (listeners.size === 0) {
          window.removeEventListener("storage", changed);
        }
      };
    },
    getSnapshot(): number {
      cache ??= load();
      return cache;
    },
    getServerSnapshot(): number {
      return fallback;
    },
  };
}

/** Whether a stored value is a usable number. */
function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
