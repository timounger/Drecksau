/**
 * Tests for the settings model.
 *
 * @module
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultSettings,
  isAppSettings,
  prefersReducedMotion,
} from "./app-settings";

/** Pretends the system asks for reduced motion, or does not. */
function mockReducedMotion(matches: boolean): void {
  vi.stubGlobal("window", {
    matchMedia: (query: string) => ({
      matches: query.includes("reduce") && matches,
    }),
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("defaultSettings", () => {
  it("has animations on - the normal case", () => {
    mockReducedMotion(false);
    expect(defaultSettings().areAnimationsEnabled).toBe(true);
  });

  it("has animations off when the system asks for reduced motion", () => {
    mockReducedMotion(true);
    expect(defaultSettings().areAnimationsEnabled).toBe(false);
  });

  it("leaves the expansion off - the base game is what people expect", () => {
    mockReducedMotion(false);
    expect(defaultSettings().isExpansionEnabled).toBe(false);
    mockReducedMotion(true);
    expect(defaultSettings().isExpansionEnabled).toBe(false);
  });
});

describe("prefersReducedMotion", () => {
  it("is false when there is no window at all (prerender)", () => {
    vi.stubGlobal("window", undefined);
    expect(prefersReducedMotion()).toBe(false);
  });

  it("is false in browsers without matchMedia", () => {
    vi.stubGlobal("window", {});
    expect(prefersReducedMotion()).toBe(false);
  });

  it("follows the media query", () => {
    mockReducedMotion(true);
    expect(prefersReducedMotion()).toBe(true);
    mockReducedMotion(false);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe("isAppSettings", () => {
  it("accepts real settings", () => {
    expect(
      isAppSettings({ areAnimationsEnabled: true, isExpansionEnabled: false }),
    ).toBe(true);
    expect(
      isAppSettings({ areAnimationsEnabled: false, isExpansionEnabled: true }),
    ).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isAppSettings(null)).toBe(false);
    expect(isAppSettings({})).toBe(false);
    expect(isAppSettings({ areAnimationsEnabled: "ja" })).toBe(false);
    expect(isAppSettings("an")).toBe(false);
  });

  it("rejects settings stored before the expansion existed", () => {
    // Falls back to the defaults instead of running with a missing field.
    expect(isAppSettings({ areAnimationsEnabled: true })).toBe(false);
  });
});
