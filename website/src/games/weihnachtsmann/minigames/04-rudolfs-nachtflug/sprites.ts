/**
 * Where each picture sits on the sheet of Türchen 4 - Rudolfs Nachtflug.
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
  sky: [0, 0, 320, 180],
  mountains: [0, 181, 320, 60],
  roofs: [0, 242, 320, 50],
  chimneyTop: [321, 242, 22, 11],
  chimneyPart: [344, 242, 20, 8],
  cloudA: [365, 242, 40, 22],
  cloudB: [406, 242, 40, 22],
  star0: [447, 242, 12, 12],
  star1: [460, 242, 12, 12],
  northPole: [473, 242, 32, 70],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
