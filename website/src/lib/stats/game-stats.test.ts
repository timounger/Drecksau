/**
 * Tests for the statistics model.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  abandonedGames,
  averagePlayTimeMs,
  EMPTY_STATS,
  isEmptyStats,
  isGameStats,
  winRate,
  withGameFinished,
  withGameStarted,
  withPlayTime,
  type GameStats,
} from "./game-stats";

const MINUTE = 60_000;

describe("withGameStarted", () => {
  it("counts the game and remembers when it began", () => {
    const stats = withGameStarted(EMPTY_STATS, 1000);
    expect(stats.startedGames).toBe(1);
    expect(stats.lastPlayedAt).toBe(1000);
    // Nothing else moves yet.
    expect(stats.finishedGames).toBe(0);
    expect(stats.wins).toBe(0);
  });

  it("does not touch the previous numbers", () => {
    const before: GameStats = { ...EMPTY_STATS, wins: 3, finishedGames: 4 };
    const after = withGameStarted(before, 1);
    expect(after.wins).toBe(3);
    expect(after.finishedGames).toBe(4);
  });
});

describe("withGameFinished", () => {
  it("counts a win", () => {
    const stats = withGameFinished(EMPTY_STATS, {
      won: true,
      durationMs: 5 * MINUTE,
      finishedAt: 99,
    });
    expect(stats.finishedGames).toBe(1);
    expect(stats.wins).toBe(1);
    expect(stats.losses).toBe(0);
    expect(stats.fastestWinMs).toBe(5 * MINUTE);
    expect(stats.lastPlayedAt).toBe(99);
  });

  it("counts a loss and leaves the fastest win alone", () => {
    const before = withGameFinished(EMPTY_STATS, {
      won: true,
      durationMs: 2 * MINUTE,
      finishedAt: 1,
    });
    const after = withGameFinished(before, {
      won: false,
      durationMs: 1000,
      finishedAt: 2,
    });
    expect(after.wins).toBe(1);
    expect(after.losses).toBe(1);
    // A quick loss is not a quick win.
    expect(after.fastestWinMs).toBe(2 * MINUTE);
  });

  it("keeps only the quickest win", () => {
    let stats = withGameFinished(EMPTY_STATS, {
      won: true,
      durationMs: 9 * MINUTE,
      finishedAt: 1,
    });
    stats = withGameFinished(stats, {
      won: true,
      durationMs: 3 * MINUTE,
      finishedAt: 2,
    });
    stats = withGameFinished(stats, {
      won: true,
      durationMs: 7 * MINUTE,
      finishedAt: 3,
    });
    expect(stats.fastestWinMs).toBe(3 * MINUTE);
  });

  it("does not add play time - that is counted while playing", () => {
    const stats = withGameFinished(EMPTY_STATS, {
      won: true,
      durationMs: 5 * MINUTE,
      finishedAt: 1,
    });
    expect(stats.totalPlayTimeMs).toBe(0);
  });
});

describe("withPlayTime", () => {
  it("adds up spans", () => {
    let stats = withPlayTime(EMPTY_STATS, 1000, 10);
    stats = withPlayTime(stats, 2000, 20);
    expect(stats.totalPlayTimeMs).toBe(3000);
    expect(stats.lastPlayedAt).toBe(20);
  });

  it("ignores negative spans, e.g. after a clock change", () => {
    const stats = withPlayTime(
      { ...EMPTY_STATS, totalPlayTimeMs: 500 },
      -9000,
      1,
    );
    expect(stats.totalPlayTimeMs).toBe(500);
  });
});

describe("derived numbers", () => {
  it("counts abandoned games", () => {
    const stats: GameStats = {
      ...EMPTY_STATS,
      startedGames: 5,
      finishedGames: 2,
    };
    expect(abandonedGames(stats)).toBe(3);
  });

  it("never reports negative abandoned games", () => {
    const stats: GameStats = {
      ...EMPTY_STATS,
      startedGames: 1,
      finishedGames: 4,
    };
    expect(abandonedGames(stats)).toBe(0);
  });

  it("computes the win rate", () => {
    const stats: GameStats = { ...EMPTY_STATS, finishedGames: 4, wins: 3 };
    expect(winRate(stats)).toBe(0.75);
  });

  it("has no win rate before the first finished game", () => {
    expect(winRate(EMPTY_STATS)).toBeNull();
  });

  it("computes the average play time", () => {
    const stats: GameStats = {
      ...EMPTY_STATS,
      finishedGames: 4,
      totalPlayTimeMs: 10_000,
    };
    expect(averagePlayTimeMs(stats)).toBe(2500);
  });

  it("has no average before the first finished game", () => {
    expect(
      averagePlayTimeMs({ ...EMPTY_STATS, totalPlayTimeMs: 500 }),
    ).toBeNull();
  });

  it("knows when nothing was played", () => {
    expect(isEmptyStats(EMPTY_STATS)).toBe(true);
    expect(isEmptyStats({ ...EMPTY_STATS, startedGames: 1 })).toBe(false);
  });
});

describe("isGameStats", () => {
  it("accepts real statistics", () => {
    expect(isGameStats(EMPTY_STATS)).toBe(true);
    expect(
      isGameStats(
        withGameFinished(withGameStarted(EMPTY_STATS, 1), {
          won: true,
          durationMs: 10,
          finishedAt: 2,
        }),
      ),
    ).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isGameStats(null)).toBe(false);
    expect(isGameStats("kaputt")).toBe(false);
    expect(isGameStats({})).toBe(false);
    expect(isGameStats({ ...EMPTY_STATS, wins: -1 })).toBe(false);
    expect(isGameStats({ ...EMPTY_STATS, wins: "drei" })).toBe(false);
    expect(isGameStats({ ...EMPTY_STATS, totalPlayTimeMs: NaN })).toBe(false);
    expect(isGameStats({ ...EMPTY_STATS, fastestWinMs: "schnell" })).toBe(
      false,
    );
  });
});
