/**
 * Builds the "Krakel" - the random tangle of lines a drawing must stay on.
 *
 * @module
 * @remarks
 * Like the Ravensburger game, the drawer may not draw freely: the round gives a
 * fixed set of squiggly lines (the template) and the pen may only ink along
 * them. The same seed yields the same template on every client, so only the seed
 * crosses the wire. Each line is a smooth curve (a Catmull-Rom spline through a
 * short random walk), sampled densely so a pen can snap onto it
 * ({@link snapToTemplate}).
 */
import { createRandom, type Random } from "./random";
import type { Point } from "./types";

/** How many separate lines the template holds. */
const PATH_COUNT = 3;

/** How many control points shape each line. */
const CONTROL_POINTS = 6;

/** How many samples fill each span between two control points. */
const SAMPLES_PER_SPAN = 16;

/** The band of the canvas the lines stay within (keeps off the edges). */
const MARGIN = 0.1;
const SPAN = 1 - MARGIN * 2;

/** How far each step of a line's walk may move, as a fraction of the canvas. */
const STEP = 0.34;

/** Keeps a coordinate inside the drawable band. */
function clampToBand(value: number): number {
  return Math.max(MARGIN, Math.min(1 - MARGIN, value));
}

/** One random step of a coordinate, kept inside the band. */
function stepCoord(random: Random, from: number): number {
  return clampToBand(from + (random() * 2 - 1) * STEP);
}

/**
 * Builds the template's lines for a seed.
 *
 * @param seed - the round's krakel seed
 * @returns the lines, each a dense list of points on the normalised 0..1 canvas
 */
export function krakelTemplate(seed: number): Point[][] {
  const random = createRandom(seed);
  const paths: Point[][] = [];
  for (let p = 0; p < PATH_COUNT; p++) {
    paths.push(densify(controlWalk(random)));
  }
  return paths;
}

/** Flattens every line's points into one list, for snapping. */
export function templatePoints(paths: readonly Point[][]): Point[] {
  return paths.flat();
}

/**
 * Snaps a point onto the nearest template point, if it is close enough.
 *
 * @param points - the template's flattened points
 * @param target - the raw point to snap
 * @param tolerance - the largest distance that still counts as "on a line"
 * @returns the nearest template point within tolerance, or null if off the lines
 */
export function snapToTemplate(
  points: readonly Point[],
  target: Point,
  tolerance: number,
): Point | null {
  let best: Point | null = null;
  let bestDist = tolerance * tolerance;
  for (const point of points) {
    const dist = (point.x - target.x) ** 2 + (point.y - target.y) ** 2;
    if (dist <= bestDist) {
      bestDist = dist;
      best = point;
    }
  }
  return best;
}

/** A short random walk of control points across the canvas. */
function controlWalk(random: Random): Point[] {
  const points: Point[] = [];
  let x = MARGIN + random() * SPAN;
  let y = MARGIN + random() * SPAN;
  points.push({ x, y });
  for (let i = 1; i < CONTROL_POINTS; i++) {
    x = stepCoord(random, x);
    y = stepCoord(random, y);
    points.push({ x, y });
  }
  return points;
}

/** Samples a smooth Catmull-Rom curve through the control points. */
function densify(control: readonly Point[]): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < control.length - 1; i++) {
    const p0 = control[Math.max(0, i - 1)];
    const p1 = control[i];
    const p2 = control[i + 1];
    const p3 = control[Math.min(control.length - 1, i + 2)];
    for (let s = 0; s < SAMPLES_PER_SPAN; s++) {
      points.push(catmullRom(p0, p1, p2, p3, s / SAMPLES_PER_SPAN));
    }
  }
  points.push(control[control.length - 1]);
  return points;
}

/** One point on a Catmull-Rom spline segment at parameter t in [0, 1]. */
function catmullRom(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number,
): Point {
  return {
    x: onCanvas(spline(p0.x, p1.x, p2.x, p3.x, t)),
    y: onCanvas(spline(p0.y, p1.y, p2.y, p3.y, t)),
  };
}

/** Clamps a spline sample onto the canvas, since the curve can overshoot. */
function onCanvas(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** The Catmull-Rom basis for a single coordinate. */
function spline(a: number, b: number, c: number, d: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- fixed Catmull-Rom basis coefficients
  const basis =
    2 * b +
    (c - a) * t +
    (2 * a - 5 * b + 4 * c - d) * t2 +
    (-a + 3 * b - 3 * c + d) * t3;
  return HALF * basis;
}

/** The one-half factor of the Catmull-Rom basis. */
const HALF = 0.5;
