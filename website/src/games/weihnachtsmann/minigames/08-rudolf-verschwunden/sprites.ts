/**
 * Where each picture sits on the sheet of Türchen 8 - Rudolf ist verschwunden.
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
  bush: [321, 0, 42, 28],
  holly: [364, 0, 42, 28],
  drift: [407, 0, 46, 22],
  rock: [454, 0, 38, 24],
  log: [0, 181, 44, 18],
  rudolf: [45, 181, 24, 27],
  rudolfBlink: [70, 181, 24, 27],
  deerA: [95, 181, 24, 27],
  deerABlink: [120, 181, 24, 27],
  deerB: [145, 181, 24, 27],
  deerBBlink: [170, 181, 24, 27],
  deerC: [195, 181, 24, 27],
  deerCBlink: [220, 181, 24, 27],
  standA0: [245, 181, 40, 36],
  standA1: [286, 181, 40, 36],
  standB0: [327, 181, 40, 36],
  standB1: [368, 181, 40, 36],
  lens: [409, 181, 26, 26],
  puff: [436, 181, 14, 10],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
