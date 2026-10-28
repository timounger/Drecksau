/**
 * Where each picture sits on the sheet of Türchen 7 - Die magische Perle.
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
  swim0: [321, 0, 26, 18],
  swim1: [348, 0, 26, 18],
  swim2: [375, 0, 26, 18],
  oysterOpen: [402, 0, 18, 14],
  oysterShut: [421, 0, 18, 14],
  pearl: [440, 0, 7, 7],
  jelly0: [448, 0, 18, 22],
  jelly1: [467, 0, 18, 22],
  weed0: [486, 0, 10, 30],
  weed1: [497, 0, 10, 30],
  fish: [0, 181, 10, 6],
  bubbleSmall: [11, 181, 3, 3],
  bubbleBig: [15, 181, 5, 5],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
