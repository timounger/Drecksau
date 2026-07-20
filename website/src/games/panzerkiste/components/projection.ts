/**
 * The tilted 2.5D projection: turns flat world coordinates into screen ones.
 *
 * @module
 * @remarks
 * The simulation stays a flat top-down grid. For the look, the field is drawn as
 * if seen from above and in front: depth (world y) is squashed by {@link DEPTH}
 * and height (world z, up off the floor) lifts a point straight up the screen.
 * Walls and tanks are then boxes with a visible top and front face. The renderer
 * and the input hook share this module so aiming lands on the right floor spot.
 */
import { TILE } from "@/games/panzerkiste/engine/types";

/** How much world depth (y) is squashed on screen - the tilt. */
export const DEPTH = 0.82;

/** Height of a wall/crate block in screen pixels. */
export const WALL_HEIGHT = 15;

/** Height of a tank body in screen pixels. */
export const BODY_HEIGHT = 9;

/** How far a shell floats above the floor in screen pixels. */
export const BULLET_HEIGHT = 5;

/** Space above the tallest back-edge block, so it does not clip the top. */
const TOP_MARGIN = 14;

/** Top margin, so raised blocks near the back edge do not clip. */
export const OFFSET_Y = WALL_HEIGHT + TOP_MARGIN;

/** Bottom margin below the front edge. */
const MARGIN_BOTTOM = 12;

/** A projected screen point. */
export type Screen = {
  readonly x: number;
  readonly y: number;
};

/**
 * Projects a world point (with optional height) to the screen.
 *
 * @param x - world x (unchanged on screen)
 * @param y - world y (depth into the field)
 * @param z - height above the floor, default 0
 * @returns the screen point
 */
export function project(x: number, y: number, z = 0): Screen {
  return { x, y: OFFSET_Y + y * DEPTH - z };
}

/**
 * Inverts {@link project} for a point on the floor (z = 0).
 *
 * @param sx - screen x
 * @param sy - screen y
 * @returns the world point on the floor under that screen point
 */
export function unprojectFloor(
  sx: number,
  sy: number,
): { x: number; y: number } {
  return { x: sx, y: (sy - OFFSET_Y) / DEPTH };
}

/** Canvas width for a field that many cells wide. */
export function canvasWidth(cols: number): number {
  return cols * TILE;
}

/** Canvas height for a field that many cells tall, with the tilt applied. */
export function canvasHeight(rows: number): number {
  return OFFSET_Y + rows * TILE * DEPTH + MARGIN_BOTTOM;
}
