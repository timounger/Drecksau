/**
 * Where each picture sits on the sheet of Türchen 25 - Die längste Nacht.
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
  hills: [0, 181, 320, 55],
  ground: [0, 237, 320, 14],
  house0: [321, 237, 78, 58],
  house0Lit: [400, 237, 78, 58],
  house1: [0, 296, 64, 66],
  house1Lit: [65, 296, 64, 66],
  house2: [130, 296, 92, 56],
  house2Lit: [223, 296, 92, 56],
  house3: [316, 296, 70, 76],
  house3Lit: [387, 296, 70, 76],
  chimney: [458, 296, 14, 40],
  smoke: [473, 296, 10, 8],
  presentRed: [484, 296, 8, 9],
  presentBlue: [493, 296, 8, 9],
  presentGreen: [502, 296, 8, 9],
  presentPurple: [0, 373, 8, 9],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
