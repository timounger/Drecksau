/**
 * Tests for the one line that tells the player what to do next.
 *
 * @module
 * @remarks
 * These exist because of a real bug: after picking the hammer up, the line went
 * straight back to "Wohnmobil kaputt - Hammer suchen". Picking up had worked;
 * the sentence said it had not, so the player went looking for a thing already
 * in their hand and reported the key as broken.
 *
 * The substance here is the **order** of the branches, and order is exactly
 * what a canvas test cannot see.
 */
import { describe, expect, it } from "vitest";
import { doingText } from "./board";
import { hudOf } from "@/games/rv-there-yet/hooks/hud";
import { startAt } from "@/games/rv-there-yet/engine/setup";
import type { Hud } from "@/games/rv-there-yet/hooks/hud";
import { RV_TEXTS } from "@/games/rv-there-yet/i18n/texts";

/** The heads-up facts of a fresh drive, with anything overridden. */
function hud(over: Partial<Hud> = {}): Hud {
  const base = hudOf(startAt(0), {
    ready: -1,
    candidate: -1,
    running: true,
    me: 0,
  });
  return { ...base, ...over };
}

describe("what the line says while the motorhome is wrecked", () => {
  it("sends you off to find the hammer while you have none", () => {
    expect(doingText(hud({ damaged: true, inside: false }))).toBe(
      RV_TEXTS.wrecked,
    );
  });

  it("stops saying that the moment the hammer is in hand", () => {
    // The bug. One frame after the pick-up the line still read "go and find
    // the hammer", which is how a working key comes to be reported as broken.
    const carrying = hud({
      damaged: true,
      inside: false,
      carrying: ["hammer"],
    });
    expect(doingText(carrying)).not.toBe(RV_TEXTS.wrecked);
    expect(doingText(carrying)).toBe(RV_TEXTS.wreckedGotHammer);
  });

  it("offers the hammering once you are back at the motorhome", () => {
    expect(
      doingText(
        hud({
          damaged: true,
          inside: false,
          carrying: ["hammer"],
          canMend: true,
        }),
      ),
    ).toBe(RV_TEXTS.wreckedWithHammer);
  });

  it("says nothing about hammers from behind the wheel", () => {
    expect(doingText(hud({ damaged: true, inside: true }))).not.toBe(
      RV_TEXTS.wrecked,
    );
  });
});

describe("what the line says about a thing in reach", () => {
  it("names what lies there, and what to press", () => {
    expect(doingText(hud({ inside: false, pickUp: "hammer" }))).toBe(
      RV_TEXTS.pickUpHammer,
    );
    expect(doingText(hud({ inside: false, pickUp: "tyres" }))).toBe(
      RV_TEXTS.pickUpTyres,
    );
    expect(doingText(hud({ inside: false, pickUp: "spray" }))).toBe(
      RV_TEXTS.pickUpSpray,
    );
  });

  it("beats the wrecked-motorhome line, so the pick-up is what you read", () => {
    expect(
      doingText(hud({ damaged: true, inside: false, pickUp: "hammer" })),
    ).toBe(RV_TEXTS.pickUpHammer);
  });

  it("sends you back to the motorhome once the tyres are in hand", () => {
    expect(doingText(hud({ inside: false, carrying: ["tyres"] }))).toBe(
      RV_TEXTS.gotTyres,
    );
  });
});

describe("what the line says about the bear", () => {
  /** A bear standing at a given remove from this player. */
  const bear = (over: Partial<NonNullable<Hud["bear"]>>) => ({
    coming: false,
    canSpray: false,
    armed: false,
    sprayed: 0,
    danger: 0,
    ...over,
  });

  it("puts the spraying ahead of the mauling", () => {
    // It reaches you **while** you spray. The number worth reading then is the
    // one that says "keep holding"; that it has you is already in the colour.
    const both = hud({
      inside: false,
      bear: bear({ canSpray: true, armed: true, sprayed: 0.5, danger: 0.3 }),
    });
    expect(doingText(both)).toContain("Sprüht");
  });

  it("beats everything else on the screen", () => {
    const alsoWrecked = hud({
      damaged: true,
      inside: false,
      pickUp: "hammer",
      bear: bear({ coming: true }),
    });
    expect(doingText(alsoWrecked)).toBe(RV_TEXTS.bearComing);
  });

  it("tells the armed and the empty-handed different things", () => {
    expect(
      doingText(hud({ inside: false, bear: bear({ coming: true }) })),
    ).toBe(RV_TEXTS.bearComing);
    expect(
      doingText(
        hud({ inside: false, bear: bear({ coming: true, armed: true }) }),
      ),
    ).toBe(RV_TEXTS.bearComingArmed);
  });
});
