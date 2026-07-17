/**
 * Tests for the card theme registry.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { CARD_THEMES, DEFAULT_CARD_THEME, isCardTheme } from "./themes";

describe("card themes", () => {
  it("offers Modern and Klassisch", () => {
    expect(CARD_THEMES).toEqual(["modern", "klassisch"]);
  });

  it("defaults to Modern", () => {
    expect(DEFAULT_CARD_THEME).toBe("modern");
    expect(CARD_THEMES).toContain(DEFAULT_CARD_THEME);
  });

  it("accepts a known theme and rejects the rest", () => {
    expect(isCardTheme("modern")).toBe(true);
    expect(isCardTheme("klassisch")).toBe(true);
    expect(isCardTheme("neon")).toBe(false);
    expect(isCardTheme(null)).toBe(false);
    expect(isCardTheme(3)).toBe(false);
  });
});
