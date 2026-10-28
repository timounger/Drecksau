/**
 * Where each picture sits on the sheet of Türchen 24 - Sebastians Wunschzettel.
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
  teddy: [321, 0, 16, 16],
  train: [338, 0, 16, 16],
  doll: [355, 0, 16, 16],
  ball: [372, 0, 16, 16],
  drum: [389, 0, 16, 16],
  rocket: [406, 0, 16, 16],
  slot: [423, 0, 16, 14],
  star: [440, 0, 6, 6],
  bell: [447, 0, 6, 6],
  dot: [454, 0, 6, 6],
  button: [461, 0, 26, 26],
  buttonOn: [0, 181, 26, 26],
  pencil: [27, 181, 30, 7],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
