/**
 * Tests for the forgiving guess matching.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { isCorrectGuess, normalizeGuess } from "./guess";

describe("normalizeGuess", () => {
  it("folds case, spaces, punctuation and umlauts", () => {
    expect(normalizeGuess("  Graue KATZE! ")).toBe("grauekatze");
    expect(normalizeGuess("Bär")).toBe("baer");
    expect(normalizeGuess("Fuß")).toBe("fuss");
    expect(normalizeGuess("Öl-Krug")).toBe("oelkrug");
  });
});

describe("isCorrectGuess", () => {
  it("accepts the exact term regardless of case and spacing", () => {
    expect(isCorrectGuess("elefant", "Elefant")).toBe(true);
    expect(isCorrectGuess("  SCHNECKE ", "Schnecke")).toBe(true);
  });

  it("accepts the umlaut and ae/oe/ue spellings alike", () => {
    expect(isCorrectGuess("baer", "Bär")).toBe(true);
    expect(isCorrectGuess("Bär", "Baer")).toBe(true);
  });

  it("forgives a single typo in a longer word", () => {
    expect(isCorrectGuess("elefent", "Elefant")).toBe(true);
    expect(isCorrectGuess("rakete", "Raket")).toBe(true);
  });

  it("does not forgive a typo in a short word", () => {
    expect(isCorrectGuess("haut", "Haus")).toBe(false);
  });

  it("rejects a wrong or empty guess", () => {
    expect(isCorrectGuess("hund", "Katze")).toBe(false);
    expect(isCorrectGuess("   ", "Katze")).toBe(false);
  });
});
