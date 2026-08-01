/**
 * The numbers only Panzerkiste has: levels reached, aim, time per level.
 *
 * @module
 * @remarks
 * Kept apart from {@link ../../../lib/stats/game-stats}, which counts games,
 * wins and time for **every** game and knows nothing about any of them. Levels
 * and shells mean nothing to a card game, so they do not belong there; adding
 * them would make the shared model a drawer of other games' odds and ends.
 */

/** What Panzerkiste tracks on top of the shared statistics. */
export type MissionStats = {
  /** The highest level ever reached, counting from 1; zero if never played. */
  readonly bestLevel: number;
  /** Levels cleared in total, across every mission. */
  readonly levelsCleared: number;
  /** Time spent in the levels that were cleared, in milliseconds. */
  readonly clearedTimeMs: number;
  /** The quickest cleared level, in milliseconds, or null if none yet. */
  readonly fastestLevelMs: number | null;
  /** The furthest wave ever survived in the endless arena; zero if never there. */
  readonly bestWave: number;
  /** Ordinary shells fired, across every mission. */
  readonly shotsFired: number;
  /** How many of those destroyed an enemy. */
  readonly shotsHit: number;
};

/** Nothing played yet. */
export const EMPTY_MISSION_STATS: MissionStats = {
  bestLevel: 0,
  levelsCleared: 0,
  clearedTimeMs: 0,
  fastestLevelMs: null,
  bestWave: 0,
  shotsFired: 0,
  shotsHit: 0,
};

/**
 * Notes that a level was reached.
 *
 * @param stats - the statistics so far
 * @param level - the level number, counting from 1
 * @returns the updated statistics
 * @remarks
 * Reaching counts, not clearing: how far you got is the interesting number
 * even - especially - when the run ended there.
 */
export function withLevelReached(
  stats: MissionStats,
  level: number,
): MissionStats {
  return level <= stats.bestLevel
    ? stats
    : { ...stats, bestLevel: Math.floor(level) };
}

/**
 * Notes how far the endless arena was survived.
 *
 * @param stats - the statistics so far
 * @param wave - the wave that was reached, counting from 1
 * @returns the updated statistics
 */
export function withWaveReached(
  stats: MissionStats,
  wave: number,
): MissionStats {
  return wave <= stats.bestWave
    ? stats
    : { ...stats, bestWave: Math.floor(wave) };
}

/**
 * Notes a level that was cleared, and how long it took.
 *
 * @param stats - the statistics so far
 * @param tookMs - how long that level took; negative spans are ignored
 * @returns the updated statistics
 */
export function withLevelCleared(
  stats: MissionStats,
  tookMs: number,
): MissionStats {
  const span = Math.max(0, tookMs);
  return {
    ...stats,
    levelsCleared: stats.levelsCleared + 1,
    clearedTimeMs: stats.clearedTimeMs + span,
    fastestLevelMs:
      stats.fastestLevelMs === null
        ? span
        : Math.min(stats.fastestLevelMs, span),
  };
}

/**
 * Adds the shells of a finished mission.
 *
 * @param stats - the statistics so far
 * @param fired - shells fired in that mission
 * @param hit - how many of them destroyed an enemy
 * @returns the updated statistics
 * @remarks
 * Booked once at the end rather than shot by shot: the engine already carries
 * the running tally, and writing to storage on every trigger pull would be a
 * lot of writing for a number nobody reads mid-game.
 */
export function withShots(
  stats: MissionStats,
  fired: number,
  hit: number,
): MissionStats {
  const safeFired = Math.max(0, fired);
  return {
    ...stats,
    shotsFired: stats.shotsFired + safeFired,
    // A hit without a shell would be nonsense, so it is capped at what was fired.
    shotsHit: stats.shotsHit + Math.min(safeFired, Math.max(0, hit)),
  };
}

/**
 * Share of shells that found an enemy.
 *
 * @param stats - the statistics
 * @returns a value between 0 and 1, or null before a shot was fired
 */
export function accuracy(stats: MissionStats): number | null {
  return stats.shotsFired === 0 ? null : stats.shotsHit / stats.shotsFired;
}

/**
 * Average time of a cleared level.
 *
 * @param stats - the statistics
 * @returns the average in milliseconds, or null before a level was cleared
 */
export function averageLevelMs(stats: MissionStats): number | null {
  return stats.levelsCleared === 0
    ? null
    : Math.round(stats.clearedTimeMs / stats.levelsCleared);
}

/** Whether nothing has been recorded yet. */
export function isEmptyMissionStats(stats: MissionStats): boolean {
  return stats.bestLevel === 0 && stats.shotsFired === 0;
}

/**
 * Checks an unknown value really is a {@link MissionStats}.
 *
 * @param value - the value to check, e.g. straight from storage
 * @returns true if every field has the expected type
 */
export function isMissionStats(value: unknown): value is MissionStats {
  const stats = value as MissionStats;
  return (
    typeof value === "object" &&
    value !== null &&
    isCount(stats.bestLevel) &&
    isCount(stats.levelsCleared) &&
    isCount(stats.clearedTimeMs) &&
    isCount(stats.bestWave) &&
    isCount(stats.shotsFired) &&
    isCount(stats.shotsHit) &&
    (stats.fastestLevelMs === null || isCount(stats.fastestLevelMs))
  );
}

/** A non-negative, finite number. */
function isCount(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
