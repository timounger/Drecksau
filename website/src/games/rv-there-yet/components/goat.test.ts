/**
 * Tests for the goats on the first section.
 *
 * @module
 * @remarks
 * They are scenery and touch no rule, so what is worth pinning is where they
 * are allowed to be: on the first section and nowhere else, off the road, and
 * never in front of the one sign that says what the section is about.
 */
import { describe, expect, it } from "vitest";
import { goatsBetween } from "./goat";

/** A route whose first section runs from 16 m to 376 m, like the map's. */
const SECTIONS = [16, 376, 688, 888];

/** The whole of the first section, and then some. */
const FROM = 0;
const TO = 900;

describe("the herd on the first section", () => {
  it("grazes the same pasture every time", () => {
    // Worked out from the number of each goat, never remembered: a goat that
    // wandered between one glance and the next would be a bug, not a goat.
    expect(goatsBetween(FROM, TO, SECTIONS)).toEqual(
      goatsBetween(FROM, TO, SECTIONS),
    );
  });

  it("puts several of them out", () => {
    expect(goatsBetween(FROM, TO, SECTIONS).length).toBeGreaterThan(4);
  });

  it("keeps to the first section", () => {
    // The herd belongs to the pasture at the start of the drive. Further along
    // the road there is a bear, and no goat would stand about there.
    for (const goat of goatsBetween(FROM, TO, SECTIONS)) {
      expect(goat.at).toBeGreaterThanOrEqual(SECTIONS[0]);
      expect(goat.at).toBeLessThanOrEqual(SECTIONS[1]);
    }
  });

  it("has none at all on a route without sections to speak of", () => {
    expect(goatsBetween(FROM, TO, [])).toEqual([]);
    expect(goatsBetween(FROM, TO, [16])).toEqual([]);
  });

  it("comes in all sizes, from kid to old billy", () => {
    // The whole point of a herd rather than a goat.
    const sizes = goatsBetween(FROM, TO, SECTIONS).map((goat) => goat.size);
    expect(new Set(sizes.map((size) => size.toFixed(2))).size).toBe(
      sizes.length,
    );
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeGreaterThan(0.2);
  });

  it("stands them off the road, on both verges", () => {
    // The road is 6.4 m wide. A goat on it would be a goat in the way, and
    // nothing about a goat is in anybody's way.
    const herd = goatsBetween(FROM, TO, SECTIONS);
    for (const goat of herd) {
      expect(goat.out).toBeGreaterThan(4);
    }
    expect(herd.some((goat) => goat.side < 0)).toBe(true);
    expect(herd.some((goat) => goat.side > 0)).toBe(true);
  });

  it("leaves the notice boards to be read", () => {
    // The boards stand on the left verge ten metres past each section mark and
    // reach a good way out; a goat in front of one is a goat too many.
    for (const goat of goatsBetween(FROM, TO, SECTIONS)) {
      if (goat.side < 0) {
        expect(Math.abs(goat.at - (SECTIONS[0] + 10))).toBeGreaterThan(10);
      }
    }
  });

  it("asks for nothing outside the stretch it was asked about", () => {
    const near = goatsBetween(100, 200, SECTIONS);
    for (const goat of near) {
      expect(goat.at).toBeGreaterThanOrEqual(100);
      expect(goat.at).toBeLessThanOrEqual(200);
    }
    // And the ones it does give are the same goats as before, not new ones.
    for (const goat of near) {
      expect(goatsBetween(FROM, TO, SECTIONS)).toContainEqual(goat);
    }
  });
});
