/**
 * The ground under the wheels: how high it is, and how steeply it rises.
 *
 * @module
 * @remarks
 * A route is a handful of height points every {@link ROUTE_STEP} metres. Driving
 * over those as straight ramps would jolt the motorhome at every point, so they
 * are smoothed: between two points the ground follows a curve that leaves each
 * one level. That is what makes hilltops round and valley floors flat.
 *
 * {@link slopeAt} is the derivative of that same curve rather than a difference
 * measured a metre apart - the slope a wheel feels is the slope the physics has
 * to use, or the motorhome would climb what it cannot hold.
 */
import { ROUTE_STEP, SNOW_FROM, SNOW_FULL, type Route } from "./types";

/** Factors of the smoothstep curve `t*t*(3 - 2t)` and of its derivative. */
const SMOOTH_TOP = 3;
const SLOPE_FACTOR = 6;

/**
 * How high the ground is at a point of the route.
 *
 * @param route - the route being driven
 * @param x - how far along it, in metres
 * @returns the height in metres; flat beyond either end
 */
export function heightAt(route: Route, x: number): number {
  const { low, high, t } = span(route, x);
  return low + (high - low) * t * t * (SMOOTH_TOP - 2 * t);
}

/**
 * How steeply the ground rises at a point of the route.
 *
 * @param route - the route being driven
 * @param x - how far along it, in metres
 * @returns metres of rise per metre travelled; positive climbs
 */
export function slopeAt(route: Route, x: number): number {
  const { low, high, t } = span(route, x);
  return ((high - low) * SLOPE_FACTOR * t * (1 - t)) / ROUTE_STEP;
}

/**
 * How long the route is.
 *
 * @param route - the route being driven
 * @returns the distance from the start to the last height point, in metres
 */
export function routeLength(route: Route): number {
  return (route.heights.length - 1) * ROUTE_STEP;
}

/**
 * How snowed in a piece of ground is.
 *
 * @param height - how high it lies, in metres
 * @returns 0 for bare ground, 1 for full snow, and the fade in between
 */
export function snowShare(height: number): number {
  const span = SNOW_FULL - SNOW_FROM;
  return Math.min(1, Math.max(0, (height - SNOW_FROM) / span));
}

/** The two height points around `x`, and how far between them it lies. */
function span(route: Route, x: number) {
  const last = route.heights.length - 1;
  const clamped = Math.min(routeLength(route), Math.max(0, x));
  const index = Math.min(last - 1, Math.floor(clamped / ROUTE_STEP));
  return {
    low: route.heights[index],
    high: route.heights[index + 1],
    t: clamped / ROUTE_STEP - index,
  };
}
