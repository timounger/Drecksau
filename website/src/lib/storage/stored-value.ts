/**
 * A remembered value that React may read without breaking hydration.
 *
 * @module
 * @remarks
 * The pages here are exported as static files, so the HTML that arrives was
 * rendered without a browser and knows nothing of what is in storage. Reading
 * storage while rendering - even in a lazy `useState` initialiser - therefore
 * produces a first render that disagrees with the HTML, and React throws the
 * whole subtree away and builds it again.
 *
 * `useSyncExternalStore` is the way out: it takes a **separate** snapshot for
 * the server, so the first client render deliberately matches the HTML and the
 * stored value arrives immediately afterwards, with no error and no flash worth
 * the name.
 *
 * The snapshot is cached because the hook demands it: handing back a fresh
 * value each call makes React think the store changed on every render, and it
 * loops.
 */
import { readStored, writeStored } from "@/lib/storage/local-store";

/** One remembered value, ready for `useSyncExternalStore`. */
export type StoredValue<T> = {
  /** Reads the stored value, or the fallback. */
  readonly load: () => T;
  /** Stores a value for next time and tells everyone listening. */
  readonly save: (value: T) => void;
  /** Subscribes to changes; returns the unsubscribe function. */
  readonly subscribe: (onChange: () => void) => () => void;
  /** A snapshot that stays identical until the value actually changes. */
  readonly getSnapshot: () => T;
  /** What the prerender sees: no storage, so the fallback. */
  readonly getServerSnapshot: () => T;
};

/**
 * Creates a value that is remembered between visits.
 *
 * @param key - the full storage key, from `storageKey`
 * @param version - the schema version of the payload
 * @param fallback - what to use when nothing usable is stored
 * @param isValid - guard that checks a stored value still has the wanted shape
 * @returns the store
 */
export function createStoredValue<T>(
  key: string,
  version: number,
  fallback: T,
  isValid: (value: unknown) => value is T,
): StoredValue<T> {
  const listeners = new Set<() => void>();
  /** The snapshot handed out until something changes. */
  let cache: T | null = null;

  const load = (): T => readStored(key, version, isValid) ?? fallback;

  const save = (value: T): void => {
    writeStored(key, version, value);
    cache = null;
    for (const listener of listeners) {
      listener();
    }
  };

  const subscribe = (onChange: () => void): (() => void) => {
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  };

  const getSnapshot = (): T => {
    cache ??= load();
    return cache;
  };

  return {
    load,
    save,
    subscribe,
    getSnapshot,
    getServerSnapshot: () => fallback,
  };
}
