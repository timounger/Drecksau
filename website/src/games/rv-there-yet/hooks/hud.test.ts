/**
 * Tests for the facts the screen shows around the canvas.
 *
 * @module
 * @remarks
 * Small but worth having: the heads-up values are read from the world by hand,
 * one field at a time, and a field that quietly reports the wrong thing looks
 * exactly like one that reports the right thing.
 */
import { describe, expect, it } from "vitest";
import { hudOf, sameHud } from "./hud";
import { startAt, theMap } from "@/games/rv-there-yet/engine/setup";
import { SECTION_COUNT } from "@/games/rv-there-yet/engine/map";
import { routeLength } from "@/games/rv-there-yet/engine/terrain";
import { STILL_SECONDS } from "@/games/rv-there-yet/engine/types";
import { RV_TEXTS } from "@/games/rv-there-yet/i18n/texts";

/** How far before the bridge the warning is up, and a distance well past it. */
const WARNING_FROM = 30;
const FAR_OFF = 120;

/** The heads-up facts at a section, from the first player's seat. */
function at(section: number) {
  return hudOf(startAt(section), {
    ready: -1,
    candidate: -1,
    running: true,
    me: 0,
  });
}

describe("which section the screen says you are in", () => {
  it("counts them and names them", () => {
    expect(at(0).sections).toBe(SECTION_COUNT);
    expect(at(0).section).toBe(0);
    expect(at(0).sectionName).toBe(RV_TEXTS.sectionNames[0]);
  });

  it("gives each one its own name", () => {
    const names = Array.from(
      { length: SECTION_COUNT },
      (_each, index) => at(index).sectionName,
    );
    expect(names).toEqual([...RV_TEXTS.sectionNames]);
    // No two the same, or the name says nothing about where you are.
    expect(new Set(names).size).toBe(SECTION_COUNT);
  });

  it("leaves none of them blank", () => {
    for (let section = 0; section < SECTION_COUNT; section++) {
      expect(at(section).sectionName.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("what else the screen reads out of the world", () => {
  it("starts every section with a full tank and a still vehicle", () => {
    expect(at(0).fuel).toBe(1);
    expect(at(0).speed).toBe(0);
  });

  it("knows the section it was given, not merely the first one", () => {
    const last = SECTION_COUNT - 1;
    expect(at(last).section).toBe(last);
    expect(at(last).sectionName).toBe(RV_TEXTS.sectionNames[last]);
  });

  it("has the driver outside and beside the motorhome", () => {
    // Every section begins on foot: that the door has to be opened at all is
    // the first thing the game teaches.
    expect(at(0).inside).toBe(false);
    expect(at(0).atDoor).toBe(true);
  });

  it("puts the last section short of the flag", () => {
    // Otherwise starting there would be arriving there.
    const map = theMap();
    expect(startAt(SECTION_COUNT - 1).rv.x).toBeLessThan(routeLength(map));
  });
});

describe("the standing-still count in the fog", () => {
  /** How far along the count a half-run one is, on screen. */
  const HALF = 0.5;

  /** The heads-up facts after standing about for that many seconds. */
  function stood(seconds: number) {
    return hudOf(
      { ...startAt(SECTION_COUNT - 1), still: seconds },
      { ready: -1, candidate: -1, running: true, me: 0 },
    );
  }

  it("starts at nothing", () => {
    expect(stood(0).still).toBe(0);
  });

  it("passes the count on as a share of the time left", () => {
    expect(stood(STILL_SECONDS * HALF).still).toBe(HALF);
    expect(stood(STILL_SECONDS).still).toBe(1);
  });

  it("never reads over full, however long the last frame ran", () => {
    expect(stood(STILL_SECONDS * 2).still).toBe(1);
  });
});

describe("the handbrake on the screen", () => {
  /** The heads-up facts with the handbrake in that position. */
  function pulled(on: boolean) {
    return hudOf(
      { ...startAt(0), brake: on },
      { ready: -1, candidate: -1, running: true, me: 0 },
    );
  }

  it("passes it on either way", () => {
    // Without this the line could never say why the pedals do nothing.
    expect(pulled(true).brake).toBe(true);
    expect(pulled(false).brake).toBe(false);
  });

  it("starts every section with it off", () => {
    expect(at(0).brake).toBe(false);
  });

  it("is worth a redraw on its own", () => {
    // Pulled while standing still, nothing else on the screen changes - so if
    // the handbrake alone did not count as a change, the line would go on
    // saying "Am Steuer" while the pedals did nothing.
    expect(sameHud(pulled(false), pulled(true))).toBe(false);
    expect(sameHud(pulled(true), pulled(true))).toBe(true);
  });
});

describe("the bridge on the screen", () => {
  /** The heads-up facts with the motorhome at that metre. */
  function at(x: number) {
    const base = startAt(SECTION_COUNT - 1);
    return hudOf(
      { ...base, rv: { x, v: 0 } },
      { ready: -1, candidate: -1, running: true, me: 0 },
    );
  }

  /** The timber on the real map. */
  const BRIDGE = theMap().bridges[0];

  it("warns before the bridge, not once the wheels are on it", () => {
    // The sign stands back from the timber, and so does the line: a warning
    // that arrives with the planks is a report.
    expect(at(BRIDGE.from - 1).bridge).toBe(true);
    expect(at(BRIDGE.from - WARNING_FROM).bridge).toBe(true);
  });

  it("goes on saying it for the whole crossing", () => {
    expect(at(BRIDGE.from).bridge).toBe(true);
    expect(at(BRIDGE.to).bridge).toBe(true);
  });

  it("says nothing well before it or once it is behind you", () => {
    expect(at(BRIDGE.from - FAR_OFF).bridge).toBe(false);
    expect(at(BRIDGE.to + 1).bridge).toBe(false);
  });

  it("counts how many are riding", () => {
    const alone = startAt(SECTION_COUNT - 1);
    const both = {
      ...alone,
      people: [
        { ...alone.people[0], inside: true },
        { ...alone.people[0], inside: true },
      ],
    };
    const view = { ready: -1, candidate: -1, running: true, me: 0 };
    expect(hudOf(alone, view).aboard).toBe(0);
    expect(hudOf(both, view).aboard).toBe(2);
  });
});
