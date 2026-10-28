/**
 * Where each picture sits on the sheet of Türchen 20 - Weihnachtspost auf Abwegen.
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
  wall0: [321, 0, 16, 22],
  wall1: [338, 0, 16, 22],
  wall2: [355, 0, 16, 22],
  driftSmall: [372, 0, 16, 16],
  drift: [389, 0, 16, 16],
  swirl0: [406, 0, 16, 16],
  swirl1: [423, 0, 16, 16],
  swirl2: [440, 0, 16, 16],
  mailboxRed: [457, 0, 16, 24],
  mailboxBlue: [474, 0, 16, 24],
  mailboxGreen: [491, 0, 16, 24],
  mailboxYellow: [0, 181, 16, 24],
  letterRed: [17, 181, 11, 8],
  letterBlue: [29, 181, 11, 8],
  letterGreen: [41, 181, 11, 8],
  letterYellow: [53, 181, 11, 8],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
