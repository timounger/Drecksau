/**
 * Tests for the ground: its height and the slope a wheel feels.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { heightAt, routeLength, slopeAt, snowShare } from "./terrain";
import { ROUTE_STEP, SNOW_FROM, SNOW_FULL, type Route } from "./types";

/** A route that climbs one step and levels out again. */
const HILL: Route = {
  name: "Test",
  heights: [0, 0, 6, 6],
  anchors: [],
  pits: [],
  items: [],
  bear: null,
  fog: null,
  bridges: [],
  chasms: [],
  fellTree: null,
  sections: [],
};

describe("the height of the ground", () => {
  it("hits every height point exactly", () => {
    for (const [index, height] of HILL.heights.entries()) {
      expect(heightAt(HILL, index * ROUTE_STEP)).toBeCloseTo(height);
    }
  });

  it("is halfway up in the middle of a climb", () => {
    expect(heightAt(HILL, ROUTE_STEP * 1.5)).toBeCloseTo(3);
  });

  it("stays flat beyond either end", () => {
    expect(heightAt(HILL, -50)).toBeCloseTo(0);
    expect(heightAt(HILL, routeLength(HILL) + 50)).toBeCloseTo(6);
  });
});

describe("the slope", () => {
  it("is level at every height point", () => {
    // The whole reason for the smoothing: without it a hilltop would be a
    // corner, and the motorhome would feel a kick at every eighth metre.
    for (const [index] of HILL.heights.entries()) {
      expect(slopeAt(HILL, index * ROUTE_STEP)).toBeCloseTo(0);
    }
  });

  it("is steepest in the middle of a climb", () => {
    const middle = slopeAt(HILL, ROUTE_STEP * 1.5);
    expect(middle).toBeGreaterThan(slopeAt(HILL, ROUTE_STEP * 1.2));
    expect(middle).toBeGreaterThan(slopeAt(HILL, ROUTE_STEP * 1.8));
  });

  it("matches how the height actually changes", () => {
    // Measured against the height a hand's width away: a slope that does not
    // describe the ground under the wheels would let the physics climb walls.
    const x = ROUTE_STEP * 1.3;
    const gap = 0.01;
    const measured =
      (heightAt(HILL, x + gap) - heightAt(HILL, x - gap)) / (2 * gap);
    expect(slopeAt(HILL, x)).toBeCloseTo(measured, 3);
  });

  it("points downwards on a descent", () => {
    const down: Route = {
      name: "ab",
      heights: [6, 0],
      anchors: [],
      pits: [],
      items: [],
      bear: null,
      fog: null,
      bridges: [],
      chasms: [],
      fellTree: null,
      sections: [],
    };
    expect(slopeAt(down, ROUTE_STEP / 2)).toBeLessThan(0);
  });
});

describe("the snow line", () => {
  it("leaves the valley bare and covers the tops", () => {
    expect(snowShare(0)).toBe(0);
    expect(snowShare(SNOW_FROM)).toBe(0);
    expect(snowShare(SNOW_FULL)).toBe(1);
    expect(snowShare(SNOW_FULL * 2)).toBe(1);
  });

  it("fades between the two rather than drawing a line", () => {
    // A hard edge at one height looks painted on.
    const middle = snowShare((SNOW_FROM + SNOW_FULL) / 2);
    expect(middle).toBeGreaterThan(0);
    expect(middle).toBeLessThan(1);
    expect(middle).toBeGreaterThan(snowShare(SNOW_FROM + 0.1));
  });
});
