/**
 * Where each picture sits on the sheet of Türchen 14 - Ein neues Kostüm.
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
  easel: [321, 0, 80, 152],
  podium: [402, 0, 64, 14],
  body: [0, 181, 48, 96],
  beard: [49, 181, 48, 96],
  hat0: [98, 181, 48, 96],
  hat1: [147, 181, 48, 96],
  hat2: [196, 181, 48, 96],
  hat3: [245, 181, 48, 96],
  coat0: [294, 181, 48, 96],
  coat1: [343, 181, 48, 96],
  coat2: [392, 181, 48, 96],
  coat3: [441, 181, 48, 96],
  boots0: [0, 278, 48, 96],
  boots1: [49, 278, 48, 96],
  boots2: [98, 278, 48, 96],
  boots3: [147, 278, 48, 96],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
