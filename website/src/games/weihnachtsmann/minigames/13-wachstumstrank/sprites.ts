/**
 * Where each picture sits on the sheet of Türchen 13 - Der Wachstumstrank.
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
  cauldron: [321, 0, 64, 44],
  glassBack: [386, 0, 28, 124],
  glassFront: [415, 0, 28, 124],
  bottleSnow: [444, 0, 14, 24],
  bottleStar: [459, 0, 14, 24],
  bottleFir: [474, 0, 14, 24],
  bottleMoon: [489, 0, 14, 24],
  bottleBerry: [0, 181, 14, 24],
  tree0: [15, 181, 64, 100],
  tree1: [80, 181, 64, 100],
  tree2: [145, 181, 64, 100],
  tree3: [210, 181, 64, 100],
  tree4: [275, 181, 64, 100],
  tree5: [340, 181, 64, 100],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
