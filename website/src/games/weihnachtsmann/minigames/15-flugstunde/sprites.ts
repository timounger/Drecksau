/**
 * Where each picture sits on the sheet of Türchen 15 - Trixis Flugstunde.
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
  mountains: [0, 181, 320, 70],
  forest: [0, 252, 320, 45],
  cloud: [321, 252, 48, 20],
  ringBack: [370, 252, 16, 40],
  ringFront: [387, 252, 16, 40],
  ringBackLit: [404, 252, 16, 40],
  ringFrontLit: [421, 252, 16, 40],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
