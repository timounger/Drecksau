/**
 * Where each picture sits on the sheet of Türchen 10 - Der fliegende Teppich.
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
  depths: [0, 0, 320, 180],
  carpet0: [321, 0, 30, 40],
  carpet1: [352, 0, 30, 40],
  carpet2: [383, 0, 30, 40],
  crystal: [414, 0, 14, 16],
  fir: [429, 0, 20, 20],
  rock: [450, 0, 15, 12],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
