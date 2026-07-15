/**
 * Tests for the German log phrasing.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { dativeName, HUMAN_PLAYER_NAME, LOG_TEXTS } from "./translations";

describe("dativeName", () => {
  it("inflects the human player - not 'von Du'", () => {
    expect(dativeName(HUMAN_PLAYER_NAME)).toBe("dir");
  });

  it("leaves opponent names alone", () => {
    expect(dativeName("Berta")).toBe("Berta");
  });
});

describe("log texts", () => {
  it("reads correctly when the human is the victim", () => {
    expect(LOG_TEXTS.lightning(HUMAN_PLAYER_NAME)).toBe(
      "Blitz! Der Stall von dir brennt ab.",
    );
    expect(LOG_TEXTS.farmerScrubs(HUMAN_PLAYER_NAME)).toBe(
      "Der Bauer schrubbt eine Drecksau von dir.",
    );
  });

  it("reads correctly when an opponent is the victim", () => {
    expect(LOG_TEXTS.lightning("Berta")).toBe(
      "Blitz! Der Stall von Berta brennt ab.",
    );
  });

  it("uses singular and plural for rain", () => {
    expect(LOG_TEXTS.rain(1)).toContain("1 Drecksau wurde");
    expect(LOG_TEXTS.rain(3)).toContain("3 Drecksäue wurden");
  });
});
