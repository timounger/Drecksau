/**
 * Tests for the deterministic krakel squiggle.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { krakelPath } from "./krakel-path";

describe("krakelPath", () => {
  it("is deterministic for a seed and varies by seed", () => {
    expect(krakelPath(123)).toEqual(krakelPath(123));
    expect(krakelPath(123)).not.toEqual(krakelPath(124));
  });

  it("stays on the canvas", () => {
    for (const seed of [1, 2, 999, 123456]) {
      for (const point of krakelPath(seed)) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(1);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it("has several control points", () => {
    expect(krakelPath(7).length).toBeGreaterThanOrEqual(3);
  });
});
