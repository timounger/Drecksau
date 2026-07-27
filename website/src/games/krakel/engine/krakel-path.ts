/**
 * Builds the random "Krakel" - the squiggly base line every drawing starts from.
 *
 * @module
 * @remarks
 * The same seed yields the same squiggle on every client, so only the seed
 * crosses the wire. The line is a short random walk of control points in the
 * middle of the canvas; the renderer draws a smooth curve through them, faint,
 * as a hint the drawer is meant to work into the picture.
 */
import { createRandom, type Random } from "./random";
import type { Point } from "./types";

/** How many control points the squiggle has. */
const POINT_COUNT = 5;

/** The band of the canvas the squiggle stays within (keeps off the edges). */
const MARGIN = 0.2;
const SPAN = 1 - MARGIN * 2;

/** How far each step of the walk may move, as a fraction of the canvas. */
const STEP = 0.26;

/** Keeps a coordinate inside the drawable band. */
function clampToBand(value: number): number {
  return Math.max(MARGIN, Math.min(1 - MARGIN, value));
}

/** One random step of a coordinate, kept inside the band. */
function stepCoord(random: Random, from: number): number {
  return clampToBand(from + (random() * 2 - 1) * STEP);
}

/**
 * Builds the squiggle's control points for a seed.
 *
 * @param seed - the round's krakel seed
 * @returns the control points, in order, on the normalised 0..1 canvas
 * @remarks
 * Starts somewhere in the middle band and takes {@link POINT_COUNT} short
 * random steps, so the line wanders without leaving the canvas.
 */
export function krakelPath(seed: number): Point[] {
  const random = createRandom(seed);
  const points: Point[] = [];
  let x = MARGIN + random() * SPAN;
  let y = MARGIN + random() * SPAN;
  points.push({ x, y });
  for (let i = 1; i < POINT_COUNT; i++) {
    x = stepCoord(random, x);
    y = stepCoord(random, y);
    points.push({ x, y });
  }
  return points;
}
