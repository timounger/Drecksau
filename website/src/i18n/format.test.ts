/**
 * Tests for the German formatting of durations and shares.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { formatDuration, formatPercent } from "./format";

describe("formatDuration", () => {
  it("shows seconds below a minute", () => {
    expect(formatDuration(0)).toBe("0 s");
    expect(formatDuration(42_000)).toBe("42 s");
  });

  it("shows minutes with padded seconds", () => {
    expect(formatDuration(195_000)).toBe("3:15 min");
    expect(formatDuration(63_000)).toBe("1:03 min");
  });

  it("shows hours and minutes", () => {
    expect(formatDuration(4_320_000)).toBe("1 h 12 min");
  });

  it("never shows a negative duration", () => {
    expect(formatDuration(-5000)).toBe("0 s");
  });
});

describe("formatPercent", () => {
  it("rounds to whole percent", () => {
    expect(formatPercent(0)).toBe("0 %");
    expect(formatPercent(0.75)).toBe("75 %");
    expect(formatPercent(1)).toBe("100 %");
    expect(formatPercent(1 / 3)).toBe("33 %");
  });
});
