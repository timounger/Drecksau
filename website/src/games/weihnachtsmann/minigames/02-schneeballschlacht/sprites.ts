/**
 * Where each picture sits on the sheet of Türchen 2 - Schneeballschlacht.
 *
 * @module
 * @remarks
 * Written by this minigame's art generator together with `sprites-2x.png`;
 * every picture is original pixel art. Rectangles are in logical pixels; the
 * sheet holds two art pixels per logical pixel. Regenerate both together.
 */
import type { SpriteRect } from "@/games/weihnachtsmann/components/sprite-atlas";
import sheetImage from "./sprites-2x.png";

/** Address of the sheet, for `loadSheet`. */
export const SHEET_SRC: string = sheetImage.src;

/* eslint-disable @typescript-eslint/no-magic-numbers -- generated coordinates on the sheet */
/** Every picture on the sheet. */
export const SPRITES = {
  backdrop: [0, 0, 320, 180],
  wallA: [321, 0, 62, 26],
  wallB: [384, 0, 62, 26],
  snowball: [447, 0, 6, 6],
  splat0: [454, 0, 16, 12],
  splat1: [471, 0, 16, 12],
  splat2: [488, 0, 16, 12],
  crosshair: [0, 181, 16, 16],
  crosshairHot: [17, 181, 16, 16],
  pile: [34, 181, 24, 15],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
