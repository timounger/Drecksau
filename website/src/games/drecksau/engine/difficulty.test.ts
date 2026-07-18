/**
 * Tests for the difficulty registry.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_DIFFICULTY, DIFFICULTIES, isDifficulty } from "./difficulty";

describe("difficulty", () => {
  it("offers three levels", () => {
    expect(DIFFICULTIES).toEqual(["leicht", "mittel", "schwer"]);
  });

  it("defaults to Mittel", () => {
    expect(DEFAULT_DIFFICULTY).toBe("mittel");
    expect(DIFFICULTIES).toContain(DEFAULT_DIFFICULTY);
  });

  it("accepts known levels and rejects the rest", () => {
    expect(isDifficulty("leicht")).toBe(true);
    expect(isDifficulty("schwer")).toBe(true);
    expect(isDifficulty("unmoeglich")).toBe(false);
    expect(isDifficulty(2)).toBe(false);
    expect(isDifficulty(null)).toBe(false);
  });
});
