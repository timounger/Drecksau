/**
 * IMPERAVIS's own numbers: the largest city, the highest tier, islands
 * founded, buildings and ships built, goods traded.
 *
 * @module
 * @remarks
 * The shared statistics count games and play time for every game. What only
 * a city builder has lives here, in a card of its own on the statistics page.
 */
import { storageKey } from "@/lib/storage/local-store";
import {
  createStoredValue,
  type StoredValue,
} from "@/lib/storage/stored-value";

/** What is counted. */
export type ImperavisStats = {
  /** Most residents at once. */
  readonly peakPopulation: number;
  /** Highest tier reached, 0 for farmers. */
  readonly peakTier: number;
  /** Islands founded. */
  readonly founded: number;
  /** Buildings placed. */
  readonly built: number;
  /** Ships launched. */
  readonly shipsBuilt: number;
  /** Units bought and sold with the trader. */
  readonly traded: number;
};

/** Nothing played yet. */
export const EMPTY_IMPERAVIS_STATS: ImperavisStats = {
  peakPopulation: 0,
  peakTier: 0,
  founded: 0,
  built: 0,
  shipsBuilt: 0,
  traded: 0,
};

/** Schema version of the stored numbers. */
const VERSION = 1;

/** The stored numbers, readable by React. */
export const imperavisStatsStore: StoredValue<ImperavisStats> =
  createStoredValue(
    storageKey("imperavis", "city-stats"),
    VERSION,
    EMPTY_IMPERAVIS_STATS,
    isImperavisStats,
  );

/**
 * Adds what a game did since the last time.
 *
 * @param delta - counts to add (founded, built, ships, traded)
 * @param peaks - the game's peak population and tier
 */
export function addImperavisStats(
  delta: Pick<ImperavisStats, "founded" | "built" | "shipsBuilt" | "traded">,
  peaks: Pick<ImperavisStats, "peakPopulation" | "peakTier">,
): void {
  const stats = imperavisStatsStore.load();
  imperavisStatsStore.save({
    peakPopulation: Math.max(stats.peakPopulation, peaks.peakPopulation),
    peakTier: Math.max(stats.peakTier, peaks.peakTier),
    founded: stats.founded + delta.founded,
    built: stats.built + delta.built,
    shipsBuilt: stats.shipsBuilt + delta.shipsBuilt,
    traded: stats.traded + delta.traded,
  });
}

/** Whether a stored value still has the shape of the numbers. */
function isImperavisStats(value: unknown): value is ImperavisStats {
  const stats = value as ImperavisStats;
  return (
    typeof value === "object" &&
    value !== null &&
    [
      stats.peakPopulation,
      stats.peakTier,
      stats.founded,
      stats.built,
      stats.shipsBuilt,
      stats.traded,
    ].every((n) => Number.isInteger(n) && n >= 0)
  );
}
