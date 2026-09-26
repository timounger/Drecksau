/**
 * Where the city's numbers are kept, and how React hears about them.
 *
 * @module
 * @remarks
 * The same shape as `lib/stats/stats-store`, for the same reason: localStorage
 * does not exist while the page is prerendered, so reading it during a render
 * would make the first client render differ from the HTML.
 * `useSyncExternalStore` renders the server snapshot first and switches to the
 * real numbers right after hydration.
 */
import {
  readStored,
  removeStored,
  storageKey,
  writeStored,
} from "@/lib/storage/local-store";
import {
  EMPTY_CITY,
  isCityStats,
  plusCity,
  type CityStats,
} from "@/games/gta/stats/city-stats";

/** Schema version of the stored numbers - raise it on breaking changes. */
const CITY_VERSION = 1;

/** Where they live, beside the shared statistics of this game. */
const CITY_KEY = storageKey("gta", "city-stats");

/** Everyone currently listening. */
const listeners = new Set<() => void>();

/** The snapshot handed out until something changes - see {@link invalidate}. */
let cache: CityStats | null = null;

/**
 * Subscribes to changes.
 *
 * @param onChange - called whenever the numbers may have changed
 * @returns the unsubscribe function
 */
export function subscribeCity(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", invalidate);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", invalidate);
  };
}

/**
 * What has been counted so far, in the browser.
 *
 * @returns a stable snapshot until something is written
 */
export function getCitySnapshot(): CityStats {
  cache ??= readStored(CITY_KEY, CITY_VERSION, isCityStats) ?? EMPTY_CITY;
  return cache;
}

/**
 * What the prerender sees: no storage, so nothing has happened.
 *
 * @returns the empty set
 */
export function getServerCitySnapshot(): CityStats {
  return EMPTY_CITY;
}

/**
 * Adds what has happened since the last time.
 *
 * @param more - the counters of the last few seconds
 * @remarks
 * **Read, add, write**, rather than keeping the total in memory: another tab
 * may have been playing too, and the page one resets the numbers on is not
 * necessarily this one.
 */
export function addCity(more: CityStats): void {
  writeStored(CITY_KEY, CITY_VERSION, plusCity(getCitySnapshot(), more));
  invalidate();
}

/** Throws the lot away. */
export function resetCity(): void {
  removeStored(CITY_KEY);
  invalidate();
}

/** Drops the cached snapshot and tells everybody listening. */
export function invalidate(): void {
  cache = null;
  for (const listener of listeners) {
    listener();
  }
}
