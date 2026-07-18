/**
 * Tests for room code generation and cleanup.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
} from "./room-code";

describe("generateRoomCode", () => {
  it("makes a valid code of unambiguous characters", () => {
    for (let attempt = 0; attempt < 50; attempt++) {
      const code = generateRoomCode();
      expect(isValidRoomCode(code)).toBe(true);
      // No easily confused characters.
      expect(code).not.toMatch(/[O0I1]/);
    }
  });
});

describe("normalizeRoomCode", () => {
  it("uppercases and drops anything not in the alphabet", () => {
    expect(normalizeRoomCode("k7qf")).toBe("K7QF");
    expect(normalizeRoomCode(" a-b c ")).toBe("ABC");
    // Ambiguous characters are not part of the alphabet, so they fall out.
    expect(normalizeRoomCode("O0I1")).toBe("");
  });
});

describe("isValidRoomCode", () => {
  it("is true only at the full length", () => {
    expect(isValidRoomCode("ABCD")).toBe(true);
    expect(isValidRoomCode("ABC")).toBe(false);
    expect(isValidRoomCode("ABCDE")).toBe(false);
  });
});
