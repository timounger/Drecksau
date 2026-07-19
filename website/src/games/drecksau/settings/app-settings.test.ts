/**
 * Tests for the settings model.
 *
 * @module
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultSettings,
  humanName,
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

  it("leaves the expansion and the defence cards off by default", () => {
    mockReducedMotion(false);
    expect(defaultSettings().isExpansionEnabled).toBe(false);
    expect(defaultSettings().areDefenseCardsEnabled).toBe(false);
    mockReducedMotion(true);
    expect(defaultSettings().isExpansionEnabled).toBe(false);
    expect(defaultSettings().areDefenseCardsEnabled).toBe(false);
  });

  it("starts without a name, so the game says 'Du'", () => {
    mockReducedMotion(false);
    expect(defaultSettings().playerName).toBe("");
    expect(humanName(defaultSettings())).toBe("Du");
  });

  it("starts on the Modern card design", () => {
    mockReducedMotion(false);
    expect(defaultSettings().cardTheme).toBe("modern");
  });

  it("starts on the Mittel difficulty", () => {
    mockReducedMotion(false);
    expect(defaultSettings().difficulty).toBe("mittel");
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
  const valid = {
    playerName: "Timo",
    areAnimationsEnabled: true,
    isExpansionEnabled: false,
    areDefenseCardsEnabled: false,
    cardTheme: "modern",
    difficulty: "mittel",
  };

  it("accepts real settings", () => {
    expect(isAppSettings(valid)).toBe(true);
    expect(isAppSettings({ ...valid, playerName: "" })).toBe(true);
    expect(isAppSettings({ ...valid, cardTheme: "klassisch" })).toBe(true);
  });

  it("rejects an unknown card theme", () => {
    expect(isAppSettings({ ...valid, cardTheme: "neon" })).toBe(false);
    expect(isAppSettings({ ...valid, cardTheme: 7 })).toBe(false);
  });

  it("rejects an unknown difficulty", () => {
    expect(isAppSettings({ ...valid, difficulty: "unmoeglich" })).toBe(false);
    expect(isAppSettings({ ...valid, difficulty: null })).toBe(false);
  });

  it("rejects anything else", () => {
    expect(isAppSettings(null)).toBe(false);
    expect(isAppSettings({})).toBe(false);
    expect(isAppSettings({ ...valid, areAnimationsEnabled: "ja" })).toBe(false);
    expect(isAppSettings("an")).toBe(false);
  });

  it("rejects a name that would break the layout", () => {
    expect(isAppSettings({ ...valid, playerName: "T".repeat(200) })).toBe(
      false,
    );
  });

  it("rejects settings stored before a field existed", () => {
    // Falls back to the defaults instead of running with a missing field.
    expect(isAppSettings({ areAnimationsEnabled: true })).toBe(false);
    const { playerName, ...withoutName } = valid;
    expect(playerName).toBe("Timo");
    expect(isAppSettings(withoutName)).toBe(false);
  });
});

describe("humanName", () => {
  const base = {
    areAnimationsEnabled: true,
    isExpansionEnabled: false,
    areDefenseCardsEnabled: false,
    cardTheme: "modern" as const,
    difficulty: "mittel" as const,
    playerCount: 3,
  };

  it("uses the chosen name", () => {
    expect(humanName({ ...base, playerName: "Timo" })).toBe("Timo");
  });

  it("falls back to 'Du' when no name was given", () => {
    expect(humanName({ ...base, playerName: "" })).toBe("Du");
  });

  it("treats blanks as no name", () => {
    expect(humanName({ ...base, playerName: "   " })).toBe("Du");
  });

  it("trims the name", () => {
    expect(humanName({ ...base, playerName: "  Timo  " })).toBe("Timo");
  });
});
