/**
 * Statistics of one game: counters, times and the pure updates on them.
 *
 * @module
 * @remarks
 * Deliberately independent of any concrete game - it only counts games,
 * outcomes and durations. A new game reuses this unchanged.
 */

/** What is tracked per game. All times are milliseconds, dates epoch millis. */
export type GameStats = {
  /** Every game ever begun, finished or not. */
  readonly startedGames: number;
  /** Games that reached a winner. */
  readonly finishedGames: number;
  /** Finished games the human won. */
  readonly wins: number;
  /** Finished games an opponent won. */
  readonly losses: number;
  /** Time actually spent playing, across all games. */
  readonly totalPlayTimeMs: number;
  /** Duration of the quickest win, or null if never won. */
  readonly fastestWinMs: number | null;
  /** When the game was last touched, or null if never. */
  readonly lastPlayedAt: number | null;
};

/** The state before anything has been played. */
export const EMPTY_STATS: GameStats = {
  startedGames: 0,
  finishedGames: 0,
  wins: 0,
  losses: 0,
  totalPlayTimeMs: 0,
  fastestWinMs: null,
  lastPlayedAt: null,
};

/** How a finished game ended. */
export type GameOutcome = {
  /** True if the human player won. */
  readonly won: boolean;
  /** How long the game took. */
  readonly durationMs: number;
  /** When it ended. */
  readonly finishedAt: number;
};

/**
 * Counts a newly begun game.
 *
 * @param stats - the statistics so far
 * @param startedAt - when the game began
 * @returns the updated statistics
 */
export function withGameStarted(
  stats: GameStats,
  startedAt: number,
): GameStats {
  return {
    ...stats,
    startedGames: stats.startedGames + 1,
    lastPlayedAt: startedAt,
  };
}

/**
 * Counts a game that reached a winner.
 *
 * @param stats - the statistics so far
 * @param outcome - how and when the game ended
 * @returns the updated statistics
 * @remarks
 * The play time is not added here - it is accumulated while playing, see
 * {@link withPlayTime}. Only the fastest win is derived from the duration.
 */
export function withGameFinished(
  stats: GameStats,
  outcome: GameOutcome,
): GameStats {
  return {
    ...stats,
    finishedGames: stats.finishedGames + 1,
    wins: stats.wins + (outcome.won ? 1 : 0),
    losses: stats.losses + (outcome.won ? 0 : 1),
    fastestWinMs: nextFastestWin(stats.fastestWinMs, outcome),
    lastPlayedAt: outcome.finishedAt,
  };
}

/**
 * Adds a span of time the player actually spent at the game.
 *
 * @param stats - the statistics so far
 * @param elapsedMs - the span to add; negative values are ignored
 * @param at - when the span ended
 * @returns the updated statistics
 */
export function withPlayTime(
  stats: GameStats,
  elapsedMs: number,
  at: number,
): GameStats {
  const safeElapsed = Math.max(0, elapsedMs);
  return {
    ...stats,
    totalPlayTimeMs: stats.totalPlayTimeMs + safeElapsed,
    lastPlayedAt: at,
  };
}

/**
 * Games that were begun but never finished.
 *
 * @param stats - the statistics
 * @returns the number of abandoned or still running games
 */
export function abandonedGames(stats: GameStats): number {
  return Math.max(0, stats.startedGames - stats.finishedGames);
}

/**
 * Share of finished games that were won.
 *
 * @param stats - the statistics
 * @returns a value between 0 and 1, or null if nothing was finished yet
 */
export function winRate(stats: GameStats): number | null {
  return stats.finishedGames === 0 ? null : stats.wins / stats.finishedGames;
}

/**
 * Average time of a finished game.
 *
 * @param stats - the statistics
 * @returns the average in milliseconds, or null if nothing was finished yet
 * @remarks
 * Based on the total play time, so time spent in games that were abandoned
 * flows into the average as well. It answers "how long does a game take me",
 * not "how long was the average finished game exactly".
 */
export function averagePlayTimeMs(stats: GameStats): number | null {
  return stats.finishedGames === 0
    ? null
    : Math.round(stats.totalPlayTimeMs / stats.finishedGames);
}

/**
 * Tells whether anything has been played at all.
 *
 * @param stats - the statistics
 * @returns true if not a single game was begun
 */
export function isEmptyStats(stats: GameStats): boolean {
  return stats.startedGames === 0;
}

/**
 * Checks that an unknown value really is a {@link GameStats}.
 *
 * @param value - the value to check, e.g. straight from storage
 * @returns true if every field has the expected type
 */
export function isGameStats(value: unknown): value is GameStats {
  const stats = value as GameStats;
  return (
    typeof value === "object" &&
    value !== null &&
    isCount(stats.startedGames) &&
    isCount(stats.finishedGames) &&
    isCount(stats.wins) &&
    isCount(stats.losses) &&
    isCount(stats.totalPlayTimeMs) &&
    isOptionalNumber(stats.fastestWinMs) &&
    isOptionalNumber(stats.lastPlayedAt)
  );
}

/** Keeps the quickest win, ignoring losses. */
function nextFastestWin(
  current: number | null,
  outcome: GameOutcome,
): number | null {
  let fastest = current;

  if (outcome.won) {
    fastest =
      current === null
        ? outcome.durationMs
        : Math.min(current, outcome.durationMs);
  }

  return fastest;
}

/** A non negative, finite number. */
function isCount(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** A finite number or null. */
function isOptionalNumber(value: unknown): boolean {
  return (
    value === null || (typeof value === "number" && Number.isFinite(value))
  );
}
