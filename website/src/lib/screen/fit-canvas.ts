/**
 * Draws a canvas at the resolution of the screen rather than at its own.
 *
 * @module
 * @remarks
 * A game is drawn in a fixed grid of logical pixels, because that is how the
 * drawing code stays readable and how the same picture comes out on every
 * machine. Shown larger than that grid - full screen, or simply on a big
 * display - the browser blows the picture up afterwards, and everything in it
 * goes soft.
 *
 * The way out is to keep the logical grid but give the canvas **more pixels to
 * put it on**: the picture is then drawn at the size it is really shown at, and
 * every line lands where it belongs. The drawing code notices nothing - one
 * transform scales the whole thing.
 */
"use client";

/**
 * How much finer than its logical grid a canvas may be drawn.
 *
 * @remarks
 * A cap, because the memory a canvas takes grows with the square of this: on a
 * phone with three device pixels to the point, a picture stretched over the
 * whole screen would otherwise ask for a bitmap of some tens of megabytes.
 */
const MOST = 3;

/**
 * Sizes a canvas's pixels to how large it is actually shown.
 *
 * @param canvas - the canvas being drawn on
 * @param wide - the logical width the drawing code works in
 * @param high - the logical height it works in
 * @returns how many canvas pixels one logical pixel is worth
 * @remarks
 * Call it every frame and hand the result to `setTransform`: the size only
 * changes when the window does, and setting the same size again would clear
 * the canvas for nothing, so it is only written when it really differs.
 */
export function fitCanvas(
  canvas: HTMLCanvasElement,
  wide: number,
  high: number,
): number {
  const dots = window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
  const shown = canvas.clientWidth;
  const want =
    shown > 0 ? Math.min(MOST, Math.max(1, (shown * dots) / wide)) : 1;
  const pixels = Math.round(wide * want);
  const lines = Math.round(high * want);
  if (canvas.width !== pixels || canvas.height !== lines) {
    canvas.width = pixels;
    canvas.height = lines;
  }
  // From what the canvas ended up with rather than from what was asked for:
  // the two differ by the rounding, and a transform that is off by that much
  // leaves a seam down the right-hand edge.
  return canvas.width / wide;
}
