/**
 * Where each picture sits on the sheet of Türchen 6 - Grantelbarts Riff.
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
  gemLeft: [321, 0, 14, 10],
  gemDown: [336, 0, 14, 10],
  gemUp: [351, 0, 14, 10],
  gemRight: [366, 0, 14, 10],
  targetLeft: [381, 0, 16, 12],
  targetDown: [398, 0, 16, 12],
  targetUp: [415, 0, 16, 12],
  targetRight: [432, 0, 16, 12],
  guitar: [449, 0, 28, 14],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
