/**
 * Tests for the difficulty levels.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_DIFFICULTY, DIFFICULTIES, isDifficulty } from "./difficulty";

describe("difficulty", () => {
  it("ships three levels with the middle one as default", () => {
    expect(DIFFICULTIES).toEqual(["leicht", "mittel", "schwer"]);
    expect(DEFAULT_DIFFICULTY).toBe("mittel");
    expect(DIFFICULTIES).toContain(DEFAULT_DIFFICULTY);
  });

  it("accepts the known levels and rejects anything else", () => {
    for (const level of DIFFICULTIES) {
      expect(isDifficulty(level)).toBe(true);
    }
    for (const value of ["", "hard", "Leicht", 1, null, undefined, {}]) {
      expect(isDifficulty(value)).toBe(false);
    }
  });
});
