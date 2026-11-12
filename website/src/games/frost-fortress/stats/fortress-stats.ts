/**
 * Frost Fortress's own numbers: the highest wave, enemies and bosses beaten,
 * what was built and how many fortresses fell.
 *
 * @module
 * @remarks
 * The shared statistics count games and play time for every game. What only
 * a survival game has lives here, in a card of its own on the statistics page.
 */
import { storageKey } from "@/lib/storage/local-store";
import {
  createStoredValue,
  type StoredValue,
} from "@/lib/storage/stored-value";

/** What is counted. */
export type FortressStats = {
  /** The highest wave reached. */
  readonly bestWave: number;
  /** Enemies beaten. */
  readonly kills: number;
  /** Bosses beaten. */
  readonly bosses: number;
  /** Structures finished. */
  readonly built: number;
  /** Waves survived. */
  readonly waves: number;
  /** Headquarters lost. */
  readonly fallen: number;
};

/** Nothing played yet. */
export const EMPTY_FORTRESS_STATS: FortressStats = {
  bestWave: 0,
  kills: 0,
  bosses: 0,
  built: 0,
  waves: 0,
  fallen: 0,
};

/** Schema version of the stored numbers. */
const VERSION = 1;

/** The stored numbers, readable by React. */
export const fortressStatsStore: StoredValue<FortressStats> = createStoredValue(
  storageKey("frost-fortress", "fortress-stats"),
  VERSION,
  EMPTY_FORTRESS_STATS,
  isFortressStats,
);

/**
 * Adds to the stored numbers.
 *
 * @param delta - what came in since the last time
 * @param wave - the wave the game is at
 * @param fell - true when the headquarters just fell
 */
export function addFortressStats(
  delta: Pick<FortressStats, "kills" | "bosses" | "built" | "waves">,
  wave: number,
  fell: boolean,
): void {
  const stats = fortressStatsStore.load();
  fortressStatsStore.save({
    bestWave: Math.max(stats.bestWave, wave),
    kills: stats.kills + delta.kills,
    bosses: stats.bosses + delta.bosses,
    built: stats.built + delta.built,
    waves: stats.waves + delta.waves,
    fallen: stats.fallen + (fell ? 1 : 0),
  });
}

/** Whether a stored value still has the shape of the numbers. */
function isFortressStats(value: unknown): value is FortressStats {
  const stats = value as FortressStats;
  return (
    typeof value === "object" &&
    value !== null &&
    [
      stats.bestWave,
      stats.kills,
      stats.bosses,
      stats.built,
      stats.waves,
      stats.fallen,
    ].every((n) => Number.isInteger(n) && n >= 0)
  );
}
