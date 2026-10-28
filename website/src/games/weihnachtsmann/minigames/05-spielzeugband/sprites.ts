/**
 * Where each picture sits on the sheet of Türchen 5 - Das Spielzeugband.
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
  belt0: [321, 0, 16, 14],
  belt1: [338, 0, 16, 14],
  sackRed: [355, 0, 40, 38],
  sackBlue: [396, 0, 40, 38],
  sackGreen: [437, 0, 40, 38],
  crate: [478, 0, 24, 22],
  teddy: [0, 181, 18, 18],
  train: [19, 181, 18, 18],
  ball: [38, 181, 18, 18],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
