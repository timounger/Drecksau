/**
 * Tests for the cooperative scoring and the win condition.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  exclusionPoints,
  isPerfectGame,
  maxScore,
  teamRating,
} from "./scoring";
import { DECOY_COUNT, TOTAL_ROUNDS } from "./types";

describe("exclusionPoints", () => {
  it("pays for a decoy and charges for a drawn word", () => {
    expect(exclusionPoints(true)).toBeGreaterThan(0);
    expect(exclusionPoints(false)).toBeLessThan(0);
  });
});

describe("maxScore", () => {
  it("is every decoy in every round", () => {
    expect(maxScore()).toBe(TOTAL_ROUNDS * DECOY_COUNT * exclusionPoints(true));
  });
});

describe("isPerfectGame", () => {
  it("counts only a flawless game as won", () => {
    expect(isPerfectGame(maxScore())).toBe(true);
    // One decoy missed and a drawn word struck instead - not a win.
    expect(isPerfectGame(maxScore() - 1)).toBe(false);
  });

  it("does not call a merely good game a win", () => {
    expect(isPerfectGame(Math.round(maxScore() * 0.8))).toBe(false);
    expect(isPerfectGame(0)).toBe(false);
    expect(isPerfectGame(-6)).toBe(false);
  });
});

describe("teamRating", () => {
  it("names the top band only for the full score", () => {
    expect(teamRating(maxScore())).toBe("Hellseher");
  });

  it("gives every score a rating, however bad", () => {
    for (const score of [-99, -1, 0, 5, 12, 20, maxScore()]) {
      expect(teamRating(score).length).toBeGreaterThan(0);
    }
  });

  it("never rates a worse score higher than a better one", () => {
    const seen = new Set<string>();
    let previous = "";
    for (let score = maxScore(); score >= -maxScore(); score--) {
      const rating = teamRating(score);
      if (rating !== previous) {
        // Each band must be entered once and never come back.
        expect(seen.has(rating)).toBe(false);
        seen.add(rating);
        previous = rating;
      }
    }
  });
});
