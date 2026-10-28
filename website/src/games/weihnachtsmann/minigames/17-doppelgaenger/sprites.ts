/**
 * Where each picture sits on the sheet of Türchen 17 - Gugors Doppelgänger.
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
  mound: [321, 0, 24, 7],
  cursor: [346, 0, 22, 32],
  plain0: [369, 0, 40, 40],
  plain1: [410, 0, 40, 40],
  back0: [451, 0, 40, 40],
  back1: [0, 181, 40, 40],
  side0: [41, 181, 40, 40],
  side1: [82, 181, 40, 40],
  hatRed0: [123, 181, 40, 40],
  hatRed1: [164, 181, 40, 40],
  coatBlue0: [205, 181, 40, 40],
  coatBlue1: [246, 181, 40, 40],
  scarf0: [287, 181, 40, 40],
  scarf1: [328, 181, 40, 40],
  bobble0: [369, 181, 40, 40],
  bobble1: [410, 181, 40, 40],
  hatGrey0: [451, 181, 40, 40],
  hatGrey1: [0, 222, 40, 40],
  hatOlive0: [41, 222, 40, 40],
  hatOlive1: [82, 222, 40, 40],
  coatTeal0: [123, 222, 40, 40],
  coatTeal1: [164, 222, 40, 40],
  noBelt0: [205, 222, 40, 40],
  noBelt1: [246, 222, 40, 40],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
