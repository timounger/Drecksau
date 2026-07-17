/**
 * Tests for the persisted host lobby settings.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  defaultOnlineHostSettings,
  isOnlineHostSettings,
} from "./online-host-settings";

describe("online host settings", () => {
  it("defaults to base game with a 30 second auto-play", () => {
    expect(defaultOnlineHostSettings).toEqual({
      withExpansion: false,
      withDefense: false,
      autoPlayMs: 30_000,
    });
  });

  it("accepts valid settings, including auto-play off", () => {
    expect(isOnlineHostSettings(defaultOnlineHostSettings)).toBe(true);
    expect(
      isOnlineHostSettings({
        withExpansion: true,
        withDefense: true,
        autoPlayMs: null,
      }),
    ).toBe(true);
  });

  it("rejects malformed settings", () => {
    expect(isOnlineHostSettings(null)).toBe(false);
    expect(
      isOnlineHostSettings({ withExpansion: true, withDefense: false }),
    ).toBe(false);
    // A zero or negative timeout is not a real choice.
    expect(
      isOnlineHostSettings({
        withExpansion: false,
        withDefense: false,
        autoPlayMs: 0,
      }),
    ).toBe(false);
  });
});
