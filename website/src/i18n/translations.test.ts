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

  it("leaves a chosen player name alone - 'von Timo' is already correct", () => {
    expect(dativeName("Timo")).toBe("Timo");
    expect(LOG_TEXTS.lightning("Timo")).toBe(
      "Blitz! Der Stall von Timo brennt ab.",
    );
    expect(LOG_TEXTS.farmerScrubs("Timo")).toBe(
      "Der Bauer schrubbt eine Drecksau von Timo.",
    );
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

  it("phrases rain that hit nobody without a bare zero", () => {
    // "0 Drecksäue wurden sauber" is not how anyone would say it.
    expect(LOG_TEXTS.rain(0)).not.toContain("0");
    expect(LOG_TEXTS.rain(0)).toBe(
      "Regen! Aber es war keine Drecksau im Freien.",
    );
  });
});
