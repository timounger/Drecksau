/**
 * Where each picture sits on the sheet of Türchen 22 - Die Flaschenpost.
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
  rod: [321, 0, 22, 24],
  hook: [344, 0, 6, 8],
  bottleGreen: [351, 0, 8, 15],
  bottleBlue: [360, 0, 8, 15],
  boot: [369, 0, 13, 13],
  fishOrange0: [383, 0, 14, 9],
  fishOrange1: [398, 0, 14, 9],
  fishSilver0: [413, 0, 14, 9],
  fishSilver1: [428, 0, 14, 9],
  bubble: [443, 0, 4, 4],
  letter: [448, 0, 13, 10],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
