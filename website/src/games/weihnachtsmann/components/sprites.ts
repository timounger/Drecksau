/**
 * Loading the two sprite sheets and blitting pictures off them.
 *
 * @module
 * @remarks
 * All pictures are original pixel art made for this game by a generator:
 * `figures-2x.png` holds the characters, Jordi's animals and the effects,
 * `world-2x.png` the ground tiles and everything standing on the map. Both are
 * drawn at {@link SHEET_DENSITY} art pixels per logical pixel; the caller
 * works in logical pixels on a buffer scaled by that much, so every art pixel
 * lands on exactly one buffer pixel.
 */
import figuresImage from "@/games/weihnachtsmann/assets/figures-2x.png";
import worldImage from "@/games/weihnachtsmann/assets/world-2x.png";
import { SHEET_DENSITY, type SpriteRect } from "./sprite-atlas";

/** The loaded sheets. */
export type Art = {
  readonly figures: HTMLImageElement;
  readonly world: HTMLImageElement;
};

/**
 * Starts loading the sheets.
 *
 * @returns the images; they draw nothing until loaded
 */
export function loadArt(): Art {
  return { figures: image(figuresImage.src), world: image(worldImage.src) };
}

/**
 * Whether both sheets have arrived.
 *
 * @param art - the sheets
 * @returns true once they can be drawn
 */
export function artReady(art: Art): boolean {
  return [art.figures, art.world].every(
    (picture) => picture.complete && picture.naturalWidth > 0,
  );
}

/**
 * Draws one picture with its top left corner at a point.
 *
 * @param ctx - where to draw, scaled to logical pixels
 * @param sheet - which sheet
 * @param rect - where the picture sits on it, logical px
 * @param x - left edge, logical px
 * @param y - top edge, logical px
 * @param mirror - flip it left to right
 */
export function blit(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  rect: SpriteRect,
  x: number,
  y: number,
  mirror = false,
): void {
  const [sx, sy, w, h] = rect;
  const k = SHEET_DENSITY;
  const left = snap(x);
  const top = snap(y);
  if (mirror) {
    ctx.save();
    ctx.translate(left + w, top);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet, sx * k, sy * k, w * k, h * k, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(sheet, sx * k, sy * k, w * k, h * k, left, top, w, h);
  }
}

/**
 * Rounds a logical position to the nearest art pixel.
 *
 * @param value - logical px
 * @returns the value on the art pixel grid
 */
export function snap(value: number): number {
  return Math.round(value * SHEET_DENSITY) / SHEET_DENSITY;
}

/** One picture, loading. */
function image(src: string): HTMLImageElement {
  const picture = new Image();
  picture.src = src;
  return picture;
}
