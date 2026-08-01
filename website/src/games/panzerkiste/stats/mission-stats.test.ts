/**
 * Tests for Panzerkiste's own statistics.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  accuracy,
  averageLevelMs,
  EMPTY_MISSION_STATS,
  isEmptyMissionStats,
  isMissionStats,
  withLevelCleared,
  withLevelReached,
  withShots,
} from "./mission-stats";

describe("the level reached", () => {
  it("keeps the highest ever, not the latest", () => {
    let stats = withLevelReached(EMPTY_MISSION_STATS, 7);
    expect(stats.bestLevel).toBe(7);
    stats = withLevelReached(stats, 3);
    expect(stats.bestLevel, "ein Rueckschritt zaehlt nicht").toBe(7);
    stats = withLevelReached(stats, 8);
    expect(stats.bestLevel).toBe(8);
  });

  it("leaves the record untouched when nothing improved", () => {
    const stats = withLevelReached(EMPTY_MISSION_STATS, 5);
    expect(withLevelReached(stats, 5)).toBe(stats);
  });
});

describe("cleared levels", () => {
  it("counts them and adds up the time", () => {
    let stats = withLevelCleared(EMPTY_MISSION_STATS, 30_000);
    stats = withLevelCleared(stats, 10_000);
    expect(stats.levelsCleared).toBe(2);
    expect(stats.clearedTimeMs).toBe(40_000);
    expect(averageLevelMs(stats)).toBe(20_000);
  });

  it("keeps the quickest one", () => {
    let stats = withLevelCleared(EMPTY_MISSION_STATS, 30_000);
    expect(stats.fastestLevelMs).toBe(30_000);
    stats = withLevelCleared(stats, 12_000);
    expect(stats.fastestLevelMs).toBe(12_000);
    stats = withLevelCleared(stats, 40_000);
    expect(stats.fastestLevelMs, "der langsamere ersetzt ihn nicht").toBe(
      12_000,
    );
  });

  it("ignores a negative span rather than counting time backwards", () => {
    const stats = withLevelCleared(EMPTY_MISSION_STATS, -5000);
    expect(stats.clearedTimeMs).toBe(0);
    expect(stats.levelsCleared).toBe(1);
  });

  it("has no average before anything was cleared", () => {
    expect(averageLevelMs(EMPTY_MISSION_STATS)).toBeNull();
  });
});

describe("shots", () => {
  it("adds them up across missions", () => {
    let stats = withShots(EMPTY_MISSION_STATS, 20, 6);
    stats = withShots(stats, 10, 4);
    expect(stats.shotsFired).toBe(30);
    expect(stats.shotsHit).toBe(10);
    expect(accuracy(stats)).toBeCloseTo(1 / 3, 6);
  });

  it("has no rate before a shot was fired", () => {
    expect(accuracy(EMPTY_MISSION_STATS)).toBeNull();
  });

  it("never counts more hits than shells", () => {
    // A hit without a shell would be nonsense however it got here.
    const stats = withShots(EMPTY_MISSION_STATS, 5, 9);
    expect(stats.shotsHit).toBe(5);
    expect(accuracy(stats)).toBe(1);
  });

  it("ignores negative counts", () => {
    const stats = withShots(EMPTY_MISSION_STATS, -3, -1);
    expect(stats.shotsFired).toBe(0);
    expect(stats.shotsHit).toBe(0);
  });
});

describe("isEmptyMissionStats", () => {
  it("is true only before anything happened", () => {
    expect(isEmptyMissionStats(EMPTY_MISSION_STATS)).toBe(true);
    expect(isEmptyMissionStats(withLevelReached(EMPTY_MISSION_STATS, 1))).toBe(
      false,
    );
    expect(isEmptyMissionStats(withShots(EMPTY_MISSION_STATS, 1, 0))).toBe(
      false,
    );
  });
});

describe("isMissionStats", () => {
  it("accepts what was stored and refuses junk", () => {
    expect(isMissionStats(EMPTY_MISSION_STATS)).toBe(true);
    expect(
      isMissionStats(JSON.parse(JSON.stringify(EMPTY_MISSION_STATS))),
    ).toBe(true);
    expect(isMissionStats({ ...EMPTY_MISSION_STATS, bestLevel: -1 })).toBe(
      false,
    );
    expect(isMissionStats({ ...EMPTY_MISSION_STATS, shotsHit: "viele" })).toBe(
      false,
    );
    expect(isMissionStats(null)).toBe(false);
    expect(isMissionStats("nope")).toBe(false);
  });
});
