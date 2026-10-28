/**
 * Where each picture sits on the sheet of Türchen 12 - Der Zauberstab.
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
  pedestal: [321, 0, 32, 12],
  wand: [354, 0, 10, 42],
  crystalRed: [365, 0, 24, 30],
  crystalRedLit: [390, 0, 24, 30],
  crystalBlue: [415, 0, 24, 30],
  crystalBlueLit: [440, 0, 24, 30],
  crystalGreen: [465, 0, 24, 30],
  crystalGreenLit: [0, 181, 24, 30],
  crystalYellow: [25, 181, 24, 30],
  crystalYellowLit: [50, 181, 24, 30],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
