/**
 * Where each picture sits on the sheet of Türchen 1 - Geschenkeregen.
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
  sack: [321, 0, 32, 26],
  sackSquash: [354, 0, 32, 26],
  giftRed: [387, 0, 14, 15],
  giftBlue: [402, 0, 14, 15],
  giftGreen: [417, 0, 14, 15],
  giftPurple: [432, 0, 14, 15],
  coal: [447, 0, 12, 11],
  star: [460, 0, 14, 14],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
