/**
 * The stored statistics as an external store React can subscribe to.
 *
 * @module
 * @remarks
 * localStorage does not exist while the page is prerendered, so reading it
 * during render would make the first client render differ from the HTML.
 * `useSyncExternalStore` solves exactly this: it renders the server snapshot
 * first and switches to the real values right after hydration.
 */
import { GAMES, type GameId } from "@/games/registry";
import { EMPTY_STATS, type GameStats } from "./game-stats";
import { loadStats } from "./stats-storage";

/** Statistics of every registered game, keyed by id. */
export type StatsByGame = Readonly<Record<GameId, GameStats>>;

/** Everyone currently listening for changes. */
const listeners = new Set<() => void>();

/**
 * The snapshot handed out until something changes.
 *
 * @remarks
 * `useSyncExternalStore` compares snapshots by identity and would loop forever
 * if a fresh object were built on every call - hence the cache.
 */
let cache: StatsByGame | null = null;

/** What the prerender sees: no storage, so nothing played. */
const SERVER_SNAPSHOT: StatsByGame = buildSnapshot(() => EMPTY_STATS);

/**
 * Subscribes to changes of the statistics.
 *
 * @param onChange - called whenever the numbers may have changed
 * @returns the unsubscribe function
 * @remarks
 * Also listens for the `storage` event, so resetting in another tab updates
 * this one.
 */
export function subscribeStats(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", invalidateStats);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", invalidateStats);
  };
}

/**
 * Current statistics of every game, in the browser.
 *
 * @returns a stable snapshot until {@link invalidateStats} is called
 */
export function getStatsSnapshot(): StatsByGame {
  if (cache === null) {
    cache = buildSnapshot(loadStats);
  }
  return cache;
}

/**
 * Statistics during prerender, where no storage exists.
 *
 * @returns empty statistics for every game
 */
export function getServerStatsSnapshot(): StatsByGame {
  return SERVER_SNAPSHOT;
}

/**
 * Drops the cached snapshot and notifies every listener.
 *
 * @remarks
 * Call after writing to storage, e.g. after a reset.
 */
export function invalidateStats(): void {
  cache = null;
  for (const listener of listeners) {
    listener();
  }
}

/** Builds one entry per registered game. */
function buildSnapshot(read: (gameId: GameId) => GameStats): StatsByGame {
  return Object.fromEntries(
    GAMES.map((game) => [game.id, read(game.id)]),
  ) as StatsByGame;
}
