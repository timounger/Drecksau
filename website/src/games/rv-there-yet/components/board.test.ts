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
      holding: "hammer",
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
          holding: "hammer",
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
    expect(
      doingText(hud({ inside: false, carrying: ["tyres"], holding: "tyres" })),
    ).toBe(RV_TEXTS.gotTyres);
  });

  it("sends you back with it whatever is in the hand", () => {
    // Carrying it is enough now: the thing puts itself in the hand when you
    // get where it is wanted, so a line telling somebody to choose it first
    // would be sending them to a menu for nothing.
    expect(
      doingText(hud({ inside: false, carrying: ["tyres"], holding: "remote" })),
    ).toBe(RV_TEXTS.gotTyres);
    expect(
      doingText(
        hud({
          damaged: true,
          inside: false,
          carrying: ["hammer"],
          holding: "remote",
        }),
      ),
    ).toBe(RV_TEXTS.wreckedGotHammer);
  });
});

describe("what the line says about the bear", () => {
  /** A bear standing at a given remove from this player. */
  const bear = (over: Partial<NonNullable<Hud["bear"]>>) => ({
    coming: false,
    canSpray: false,
    armed: false,
    inBag: false,
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

describe("what the line says while you stand about in the fog", () => {
  /** How far the count has run, as the screen keeps it: 0 to 1. */
  const HALF = 0.5;

  it("says nothing while you keep moving", () => {
    expect(doingText(hud({ still: 0 }))).not.toContain("stehen");
  });

  it("warns as soon as the count is running", () => {
    const warned = doingText(hud({ still: HALF }));
    expect(warned).toBe(RV_TEXTS.standingStill(50));
    // With a number on it: a warning that never moves reads as scenery.
    expect(doingText(hud({ still: HALF }))).not.toBe(
      doingText(hud({ still: 1 })),
    );
  });

  it("warns even over the bear standing in front of you", () => {
    // The bear you can see coming; this you cannot. Everything else waits.
    const cornered = hud({
      still: HALF,
      inside: false,
      bear: {
        coming: true,
        canSpray: true,
        armed: false,
        inBag: false,
        sprayed: 0,
        danger: 0,
      },
    });
    expect(doingText(cornered)).toBe(RV_TEXTS.standingStill(50));
  });

  it("warns even while the motorhome is wrecked and you have the hammer", () => {
    const busy = hud({
      still: HALF,
      damaged: true,
      inside: false,
      carrying: ["hammer"],
      holding: "hammer",
      canMend: true,
    });
    expect(doingText(busy)).toBe(RV_TEXTS.standingStill(50));
  });
});

describe("what the line says about the handbrake", () => {
  it("says nothing while it is off", () => {
    expect(doingText(hud({ inside: true, brake: false }))).not.toBe(
      RV_TEXTS.parked,
    );
  });

  it("says so while it is held", () => {
    // Otherwise a braked vehicle reads as one that has stopped working.
    const held = doingText(hud({ inside: true, brake: true }));
    expect(held).toBe(RV_TEXTS.parked);
    expect(held).toContain("Handbremse");
  });

  it("says it before anything else about driving", () => {
    const busy = hud({
      inside: true,
      brake: true,
      damaged: true,
      gear: 0,
    });
    expect(doingText(busy)).toBe(RV_TEXTS.parked);
  });

  it("keeps quiet about it out of the cab", () => {
    // Out there the bar is a jump, and the vehicle is parked anyway.
    expect(doingText(hud({ inside: false, brake: true }))).not.toBe(
      RV_TEXTS.parked,
    );
  });
});

describe("what the line says at the bridge", () => {
  it("reads the sign out while one of you is driving", () => {
    // The sign is a red triangle: what it warns of has to be in words
    // somewhere, and this is the only somewhere there is.
    expect(doingText(hud({ bridge: true, aboard: 1, inside: true }))).toBe(
      RV_TEXTS.bridgeSign,
    );
  });

  it("says who has to get out while both of you are in it", () => {
    const both = doingText(hud({ bridge: true, aboard: 2, inside: true }));
    expect(both).toBe(RV_TEXTS.bridgeAlone);
    expect(both).not.toBe(RV_TEXTS.bridgeSign);
  });

  it("says nothing about bridges anywhere else", () => {
    expect(doingText(hud({ bridge: false, aboard: 2, inside: true }))).not.toBe(
      RV_TEXTS.bridgeAlone,
    );
  });

  it("says it over anything else about driving", () => {
    // By the time it matters the wheels are already on the timber.
    const busy = hud({ bridge: true, aboard: 2, inside: true, gear: 0 });
    expect(doingText(busy)).toBe(RV_TEXTS.bridgeAlone);
  });

  it("keeps quiet while the handbrake is the news", () => {
    // Standing still on the approach with the lever pulled: nothing is about
    // to break, and the pedals doing nothing is the thing to explain.
    const held = hud({ bridge: true, aboard: 2, inside: true, brake: true });
    expect(doingText(held)).toBe(RV_TEXTS.parked);
  });
});

describe("what the line says at the chasm", () => {
  /** The heads-up facts at the gap, with anything overridden. */
  function atGap(over: Partial<Hud> = {}) {
    return hud({ chasm: true, inside: false, ...over });
  }

  it("tells the driver the road stops here", () => {
    expect(doingText(atGap({ inside: true }))).toBe(RV_TEXTS.chasm);
  });

  it("says what closes it while you are still on this side", () => {
    expect(doingText(atGap())).toBe(RV_TEXTS.chasmNeedAxe);
  });

  it("points at the ladder when you are standing at it", () => {
    expect(doingText(atGap({ ladder: true }))).toBe(RV_TEXTS.chasmLadder);
  });

  it("says what the roof is for once you are up there", () => {
    expect(doingText(atGap({ roof: true }))).toBe(RV_TEXTS.chasmRoof);
  });

  it("sends you to the tree once the axe is in the bag", () => {
    expect(doingText(atGap({ carrying: ["axe"] }))).toBe(RV_TEXTS.chasmAxe);
  });

  it("counts the chopping out loud", () => {
    const half = 0.5;
    expect(doingText(atGap({ job: "fell", repair: half }))).toBe(
      RV_TEXTS.felling(50),
    );
  });

  it("says the way is open once the tree is down", () => {
    expect(doingText(atGap({ felled: true }))).toBe(RV_TEXTS.felled);
  });

  it("says nothing about chasms anywhere else", () => {
    expect(doingText(hud({ chasm: false, ladder: true }))).not.toBe(
      RV_TEXTS.chasmLadder,
    );
  });
});
