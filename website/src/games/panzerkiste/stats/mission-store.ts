/**
 * Storing Panzerkiste's own statistics, and a store React can subscribe to.
 *
 * @module
 * @remarks
 * Same shape as the shared statistics store, and for the same reason:
 * localStorage does not exist while the page is prerendered, so reading it
 * during render would make the first client render differ from the HTML.
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
  EMPTY_MISSION_STATS,
  isMissionStats,
  withLevelCleared,
  withLevelReached,
  withShots,
  withWaveReached,
  type MissionStats,
} from "./mission-stats";

/** Schema version of the stored numbers - raise it on breaking changes. */
const MISSION_STATS_VERSION = 1;

/** Where the numbers live. */
const MISSION_STATS_KEY = storageKey("panzerkiste", "mission-stats");

/** Everyone currently listening for changes. */
const listeners = new Set<() => void>();

/** The snapshot handed out until something changes. */
let cache: MissionStats | null = null;

/**
 * Loads the stored numbers.
 *
 * @returns what was stored, or empty statistics if nothing usable is there
 */
export function loadMissionStats(): MissionStats {
  const stored = readStored(
    MISSION_STATS_KEY,
    MISSION_STATS_VERSION,
    isMissionStats,
  );
  return stored ?? EMPTY_MISSION_STATS;
}

/** Throws away everything recorded. */
export function resetMissionStats(): void {
  removeStored(MISSION_STATS_KEY);
  invalidate();
}

/**
 * Notes the highest level reached.
 *
 * @param level - the level number, counting from 1
 */
export function recordLevelReached(level: number): void {
  update((stats) => withLevelReached(stats, level));
}

/**
 * Notes how far the endless arena was survived.
 *
 * @param wave - the wave reached, counting from 1
 */
export function recordWaveReached(wave: number): void {
  update((stats) => withWaveReached(stats, wave));
}

/**
 * Notes a cleared level and how long it took.
 *
 * @param tookMs - how long that level took, in milliseconds
 */
export function recordLevelCleared(tookMs: number): void {
  update((stats) => withLevelCleared(stats, tookMs));
}

/**
 * Adds the shells of a finished mission.
 *
 * @param fired - shells fired
 * @param hit - how many destroyed an enemy
 */
export function recordShots(fired: number, hit: number): void {
  update((stats) => withShots(stats, fired, hit));
}

/**
 * Subscribes to changes.
 *
 * @param onChange - called whenever the numbers may have changed
 * @returns the unsubscribe function
 */
export function subscribeMissionStats(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", invalidate);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", invalidate);
  };
}

/**
 * The current numbers in the browser.
 *
 * @returns a stable snapshot until something changes
 */
export function getMissionStatsSnapshot(): MissionStats {
  if (cache === null) {
    cache = loadMissionStats();
  }
  return cache;
}

/**
 * What the prerender sees: no storage, so nothing played.
 *
 * @returns empty statistics
 */
export function getServerMissionStatsSnapshot(): MissionStats {
  return EMPTY_MISSION_STATS;
}

/** Reads, changes and writes the numbers, then tells every listener. */
function update(change: (stats: MissionStats) => MissionStats): void {
  writeStored(
    MISSION_STATS_KEY,
    MISSION_STATS_VERSION,
    change(loadMissionStats()),
  );
  invalidate();
}

/** Drops the cached snapshot and notifies every listener. */
function invalidate(): void {
  cache = null;
  for (const listener of listeners) {
    listener();
  }
}
