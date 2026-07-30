/**
 * Tests for decoding the scanned Krakel boards.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  BOARD_ASPECT,
  KRAKEL_BOARD_COUNT,
  krakelBoard,
  snapToBoard,
} from "./boards";

/** The fewest dots a printed board is expected to carry. */
const MIN_DOTS = 1000;

/** Every board's id. */
const ALL_IDS = Array.from({ length: KRAKEL_BOARD_COUNT }, (_, i) => i);

describe("krakelBoard", () => {
  it("has all the scanned templates", () => {
    expect(KRAKEL_BOARD_COUNT).toBe(14);
  });

  it("decodes every board to dots inside the canvas", () => {
    for (const id of ALL_IDS) {
      const dots = krakelBoard(id);
      expect(dots.length).toBeGreaterThan(MIN_DOTS);
      for (const dot of dots) {
        expect(dot.x).toBeGreaterThanOrEqual(0);
        expect(dot.x).toBeLessThanOrEqual(1);
        expect(dot.y).toBeGreaterThanOrEqual(0);
        expect(dot.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it("spans the whole board, so nothing was cropped away", () => {
    for (const id of ALL_IDS) {
      const dots = krakelBoard(id);
      const xs = dots.map((dot) => dot.x);
      const ys = dots.map((dot) => dot.y);
      expect(Math.min(...xs)).toBeLessThan(0.05);
      expect(Math.max(...xs)).toBeGreaterThan(0.95);
      expect(Math.min(...ys)).toBeLessThan(0.05);
      expect(Math.max(...ys)).toBeGreaterThan(0.95);
    }
  });

  it("gives every board its own pattern", () => {
    const signatures = ALL_IDS.map((id) => {
      const dots = krakelBoard(id);
      return `${dots.length}:${dots[0].x.toFixed(4)}:${dots[0].y.toFixed(4)}`;
    });
    expect(new Set(signatures).size).toBe(KRAKEL_BOARD_COUNT);
  });

  it("returns the identical decoded board when asked again", () => {
    expect(krakelBoard(0)).toBe(krakelBoard(0));
  });

  it("wraps an id outside the range", () => {
    expect(krakelBoard(KRAKEL_BOARD_COUNT)).toBe(krakelBoard(0));
    expect(krakelBoard(-1)).toBe(krakelBoard(KRAKEL_BOARD_COUNT - 1));
  });

  it("matches the printed board's shape", () => {
    expect(BOARD_ASPECT).toBeGreaterThan(1.4);
    expect(BOARD_ASPECT).toBeLessThan(1.5);
  });
});

describe("snapToBoard", () => {
  const dots = krakelBoard(0);

  it("snaps onto the exact dot when the pen is right on it", () => {
    const target = dots[100];
    expect(snapToBoard(dots, { x: target.x, y: target.y }, 0.02)).toEqual(
      target,
    );
  });

  it("snaps onto the nearest dot when the pen is close", () => {
    const target = dots[100];
    const near = { x: target.x + 0.001, y: target.y + 0.001 };
    const snapped = snapToBoard(dots, near, 0.02);
    expect(snapped).not.toBeNull();
    expect(Math.hypot(snapped!.x - near.x, snapped!.y - near.y)).toBeLessThan(
      0.02,
    );
  });

  it("gives nothing back when the pen is off the lines", () => {
    const target = dots[100];
    expect(snapToBoard(dots, target, 0)).toEqual(target);
    expect(
      snapToBoard(dots, { x: target.x + 0.5, y: target.y }, 0.0001),
    ).toBeNull();
  });
});
