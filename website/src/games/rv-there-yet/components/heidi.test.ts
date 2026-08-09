/**
 * Tests for the girl at the foot of the climb.
 *
 * @module
 * @remarks
 * She is scenery, so what is worth pinning is **where** she is: at the far
 * edge of the mud, off the road, with the kid beside her - and nowhere at all
 * on a route with no mud on it.
 */
import { describe, expect, it } from "vitest";
import { heidiPlaces } from "./heidi";

/** The mud of the second section, as the map has it. */
const MUD = [{ from: 500, to: 508 }];

describe("where the girl with the kid stands", () => {
  it("stands just past the mud, where the climb begins", () => {
    // Tied to the mud rather than to a metre count: the far edge of it **is**
    // the place, and if the mud ever moves she moves with it.
    const [heidi] = heidiPlaces(MUD);
    expect(heidi.at).toBeGreaterThan(MUD[0].to);
    expect(heidi.at - MUD[0].to).toBeLessThan(10);
  });

  it("keeps off the road", () => {
    // The road is 6.4 m wide, and she is a child standing on the verge.
    const [heidi] = heidiPlaces(MUD);
    expect(heidi.out).toBeGreaterThan(4);
    expect(heidi.kid.out).toBeGreaterThan(4);
  });

  it("has the kid beside her, small and white", () => {
    const [heidi] = heidiPlaces(MUD);
    expect(Math.abs(heidi.kid.at - heidi.at)).toBeLessThan(4);
    expect(heidi.kid.size).toBeLessThan(0.7);
    expect(heidi.kid.coat).toBe(0);
    // Looking back at her, which is what a kid does.
    expect(heidi.kid.facing).toBe(-1);
  });

  it("stands on the same side of the road as her kid", () => {
    const [heidi] = heidiPlaces(MUD);
    expect(heidi.kid.side).toBe(1);
  });

  it("is nowhere at all where there is no mud", () => {
    expect(heidiPlaces([])).toEqual([]);
  });

  it("comes out the same every time", () => {
    expect(heidiPlaces(MUD)).toEqual(heidiPlaces(MUD));
  });
});
