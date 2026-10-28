/**
 * Where each picture sits on the sheet of Türchen 23 - Balbos Schlittenrennen.
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
  slope: [0, 0, 320, 180],
  sledBack: [321, 0, 28, 36],
  sledFront: [350, 0, 28, 36],
  ramp: [379, 0, 38, 23],
  log: [418, 0, 30, 11],
  flagRed: [449, 0, 8, 20],
  flagBlue: [458, 0, 8, 20],
  giftRed: [467, 0, 12, 12],
  giftBlue: [480, 0, 12, 12],
  giftGreen: [493, 0, 12, 12],
  track: [0, 181, 20, 4],
  finish: [21, 181, 300, 40],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
