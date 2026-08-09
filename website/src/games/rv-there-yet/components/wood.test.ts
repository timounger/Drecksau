/**
 * Tests for the wood along the road.
 *
 * @module
 * @remarks
 * Two things matter about a scatter of trees and neither is visible in a
 * picture: that the same stretch of road always grows the **same** wood, and
 * that no tree of it ever stands where something with a job stands. A wood
 * that rearranged itself behind you would be worse than no wood, and a tree in
 * front of a notice board is a notice board nobody reads.
 */
import { describe, expect, it } from "vitest";
import { conifersBetween } from "./wood";

/** A stretch of route long enough to hold a good many trees. */
const FROM = 1200;
const TO = 1400;

/** The furthest out anything with a job stands, in metres. */
const SIGNS = 12.5;

describe("the wood along the road", () => {
  it("grows the same trees on the same stretch every time", () => {
    // Worked out from the number of the slot, never remembered: the drawing
    // happens sixty times a second and has to come out the same each time.
    expect(conifersBetween(FROM, TO)).toEqual(conifersBetween(FROM, TO));
  });

  it("grows the same trees whatever stretch is asked for", () => {
    // A tree belongs to the road, not to the question: asking about a wider
    // stretch has to give the same trees back, with more of them around.
    const some = conifersBetween(FROM, TO);
    const more = conifersBetween(FROM - 100, TO + 100);
    for (const tree of some) {
      expect(more).toContainEqual(tree);
    }
  });

  it("puts plenty of them there", () => {
    // "A few trees" is a park. Two rows a side, one every seven metres or so.
    const trees = conifersBetween(FROM, TO);
    expect(trees.length).toBeGreaterThan((TO - FROM) / 3);
  });

  it("stands them on both verges", () => {
    const trees = conifersBetween(FROM, TO);
    expect(trees.some((tree) => tree.side < 0)).toBe(true);
    expect(trees.some((tree) => tree.side > 0)).toBe(true);
  });

  it("keeps every one of them clear of the road and the signs", () => {
    // The road is 6.4 m wide, the markers stand at 5.5 m and the notice
    // boards reach out to 12.5 m. A tree in front of any of those is a tree
    // that costs somebody the section.
    for (const tree of conifersBetween(FROM, TO)) {
      expect(tree.out).toBeGreaterThan(SIGNS);
    }
  });

  it("makes no two of them alike", () => {
    // A row of identical trees at identical spacing is a fence.
    const trees = conifersBetween(FROM, TO);
    const heights = new Set(trees.map((tree) => tree.tall.toFixed(2)));
    const gaps = new Set(
      trees
        .slice(1)
        .map((tree, index) => (tree.at - trees[index].at).toFixed(2)),
    );
    expect(heights.size).toBeGreaterThan(trees.length / 2);
    expect(gaps.size).toBeGreaterThan(trees.length / 2);
  });

  it("asks for nothing outside the stretch it was asked about", () => {
    for (const tree of conifersBetween(FROM, TO)) {
      expect(tree.at).toBeGreaterThanOrEqual(FROM);
      expect(tree.at).toBeLessThanOrEqual(TO);
    }
  });
});
