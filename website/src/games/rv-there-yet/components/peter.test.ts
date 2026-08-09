/**
 * Tests for the boy flying over the ditch.
 *
 * @module
 * @remarks
 * He is scenery, so what is worth pinning is **where** he hangs: over the
 * middle of the hole, high enough to clear the motorhome that is stuck in front
 * of it - and nowhere at all on a route with no hole in it.
 */
import { describe, expect, it } from "vitest";
import {
  PETER_LONG,
  PETER_OUT,
  PETER_REACH,
  hoverOver,
  peterPlaces,
} from "./peter";

/** The ditch of the third section, as the map has it. */
const PITS = [{ from: 900, to: 906 }];

describe("where the flying boy hangs", () => {
  it("hangs over the middle of the ditch", () => {
    // Tied to the hole rather than to a metre count: if the hole ever moves he
    // moves with it, because hanging over **it** is the whole joke.
    const [peter] = peterPlaces(PITS);
    expect(peter.at).toBeGreaterThan(PITS[0].from);
    expect(peter.at).toBeLessThan(PITS[0].to);
  });

  it("hangs well over the roof of a motorhome", () => {
    // The motorhome is about 3 m tall; a boy floating at head height would
    // read as standing on something rather than as flying.
    const [peter] = peterPlaces(PITS);
    expect(peter.up).toBeGreaterThan(4);
  });

  it("reaches higher than he hangs, cap and all", () => {
    const [peter] = peterPlaces(PITS);
    expect(PETER_REACH).toBeGreaterThan(peter.up);
    expect(PETER_REACH).toBe(peter.up + PETER_LONG);
  });

  it("floats off to the side, not over the middle of the road", () => {
    expect(PETER_OUT).toBeGreaterThan(0);
  });

  it("is nowhere at all where there is no ditch", () => {
    expect(peterPlaces([])).toEqual([]);
  });

  it("takes every ditch there is, in the order they come", () => {
    const two = peterPlaces([
      { from: 100, to: 110 },
      { from: 900, to: 906 },
    ]);
    expect(two).toHaveLength(2);
    expect(two[0].at).toBeLessThan(two[1].at);
  });

  it("hangs over the lips of the hole, not over its floor", () => {
    // Reckoned from the bottom he would float down inside the ditch, level
    // with the very thing nobody down there can get across.
    // Reckoned from the last whole field of road on each side: the edges of
    // the hole are already halfway down into it.
    const [peter] = peterPlaces(PITS);
    expect(peter.rim[0]).toBeLessThan(PITS[0].from);
    expect(peter.rim[1]).toBeGreaterThan(PITS[0].to);
    const lips = [3, 5] as const;
    expect(hoverOver(peter, lips)).toBe(Math.max(...lips) + peter.up);
    expect(hoverOver(peter, [5, 3])).toBe(hoverOver(peter, lips));
  });

  it("comes out the same every time", () => {
    expect(peterPlaces(PITS)).toEqual(peterPlaces(PITS));
  });
});
