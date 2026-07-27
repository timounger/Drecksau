/**
 * Tests for the deterministic krakel template and pen snapping.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { krakelTemplate, snapToTemplate, templatePoints } from "./krakel-path";
import { SNAP_TOLERANCE } from "./types";

describe("krakelTemplate", () => {
  it("is deterministic for a seed and varies by seed", () => {
    expect(krakelTemplate(123)).toEqual(krakelTemplate(123));
    expect(krakelTemplate(123)).not.toEqual(krakelTemplate(124));
  });

  it("has several lines, all on the canvas", () => {
    const template = krakelTemplate(7);
    expect(template.length).toBeGreaterThanOrEqual(2);
    for (const point of templatePoints(template)) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(1);
    }
  });
});

describe("snapToTemplate", () => {
  it("snaps a point that sits on a line", () => {
    const points = templatePoints(krakelTemplate(42));
    const onLine = points[10];
    const snapped = snapToTemplate(points, onLine, SNAP_TOLERANCE);
    expect(snapped).not.toBeNull();
    expect(snapped).toEqual(onLine);
  });

  it("returns null for a point far from every line", () => {
    const points = templatePoints(krakelTemplate(42));
    // A corner is outside the lines' band, so nothing is within tolerance.
    expect(snapToTemplate(points, { x: 0, y: 0 }, SNAP_TOLERANCE)).toBeNull();
  });
});
