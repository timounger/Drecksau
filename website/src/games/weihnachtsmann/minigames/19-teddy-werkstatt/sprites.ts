/**
 * Where each picture sits on the sheet of Türchen 19 - Ein Bär für Pablo.
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
  belt0: [321, 0, 16, 13],
  belt1: [338, 0, 16, 13],
  belt2: [355, 0, 16, 13],
  belt3: [372, 0, 16, 13],
  sack: [389, 0, 38, 36],
  teddyBrown0: [428, 0, 26, 30],
  teddyBrown1: [455, 0, 26, 30],
  teddyBrown2: [482, 0, 26, 30],
  teddyBrown3: [0, 181, 26, 30],
  teddyBrown4: [27, 181, 26, 30],
  teddyHoney0: [54, 181, 26, 30],
  teddyHoney1: [81, 181, 26, 30],
  teddyHoney2: [108, 181, 26, 30],
  teddyHoney3: [135, 181, 26, 30],
  teddyHoney4: [162, 181, 26, 30],
  teddyCream0: [189, 181, 26, 30],
  teddyCream1: [216, 181, 26, 30],
  teddyCream2: [243, 181, 26, 30],
  teddyCream3: [270, 181, 26, 30],
  teddyCream4: [297, 181, 26, 30],
  key: [324, 181, 16, 17],
  keyDone: [341, 181, 16, 17],
  keyBad: [358, 181, 16, 17],
  pad: [375, 181, 28, 23],
  padDown: [404, 181, 28, 23],
  arrowUp: [433, 181, 10, 10],
  arrowLeft: [444, 181, 10, 10],
  arrowDown: [455, 181, 10, 10],
  arrowRight: [466, 181, 10, 10],
  bigArrowUp: [477, 181, 16, 16],
  bigArrowLeft: [494, 181, 16, 16],
  bigArrowDown: [0, 212, 16, 16],
  bigArrowRight: [17, 212, 16, 16],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
