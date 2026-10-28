/**
 * Where each picture sits on the sheet of Türchen 21 - Die Lichterkette.
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
  tile: [321, 0, 26, 26],
  cursor: [348, 0, 28, 28],
  socket: [377, 0, 22, 20],
  treeDark: [400, 0, 48, 68],
  treeLit: [449, 0, 48, 68],
  wire5: [0, 181, 26, 26],
  wire5Lit: [27, 181, 26, 26],
  wire10: [54, 181, 26, 26],
  wire10Lit: [81, 181, 26, 26],
  wire3: [108, 181, 26, 26],
  wire3Lit: [135, 181, 26, 26],
  wire6: [162, 181, 26, 26],
  wire6Lit: [189, 181, 26, 26],
  wire12: [216, 181, 26, 26],
  wire12Lit: [243, 181, 26, 26],
  wire9: [270, 181, 26, 26],
  wire9Lit: [297, 181, 26, 26],
  wire7: [324, 181, 26, 26],
  wire7Lit: [351, 181, 26, 26],
  wire14: [378, 181, 26, 26],
  wire14Lit: [405, 181, 26, 26],
  wire13: [432, 181, 26, 26],
  wire13Lit: [459, 181, 26, 26],
  wire11: [486, 181, 26, 26],
  wire11Lit: [0, 208, 26, 26],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
