/**
 * Tests for the phase-based online auto-play timeout.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import type { GameState } from "@/games/binokel/engine/state";
import { binokelTurnTimeoutMs } from "./adapter";

/** A stand-in game with just the phase the timeout reads. */
function atPhase(phase: GameState["phase"]): GameState {
  return { phase } as GameState;
}

/** The host's configured timeout used in these tests: 30 seconds. */
const CONFIGURED = 30_000;

/** The fixed timeout the slow screens must use: 3 minutes. */
const FIXED = 180_000;

describe("binokelTurnTimeoutMs", () => {
  it("keeps the host's value for bidding and trick play", () => {
    expect(binokelTurnTimeoutMs(atPhase("bidding"), CONFIGURED)).toBe(
      CONFIGURED,
    );
    expect(binokelTurnTimeoutMs(atPhase("trick"), CONFIGURED)).toBe(CONFIGURED);
  });

  it("forces a fixed 3 minutes on discard and end-of-round", () => {
    expect(binokelTurnTimeoutMs(atPhase("exchange"), CONFIGURED)).toBe(FIXED);
    expect(binokelTurnTimeoutMs(atPhase("roundEnd"), CONFIGURED)).toBe(FIXED);
  });

  it("stays off in every phase when auto-play is off", () => {
    expect(binokelTurnTimeoutMs(atPhase("bidding"), null)).toBeNull();
    expect(binokelTurnTimeoutMs(atPhase("exchange"), null)).toBeNull();
    expect(binokelTurnTimeoutMs(atPhase("roundEnd"), null)).toBeNull();
  });
});
