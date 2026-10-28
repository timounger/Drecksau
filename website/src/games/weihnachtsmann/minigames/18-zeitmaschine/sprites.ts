/**
 * Where each picture sits on the sheet of Türchen 18 - Jordis Zeitmaschine.
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
  frame: [321, 0, 142, 142],
  tile0: [464, 0, 44, 44],
  tile1: [0, 181, 44, 44],
  tile2: [45, 181, 44, 44],
  tile3: [90, 181, 44, 44],
  tile4: [135, 181, 44, 44],
  tile5: [180, 181, 44, 44],
  tile6: [225, 181, 44, 44],
  tile7: [270, 181, 44, 44],
  tile8: [315, 181, 44, 44],
  hole: [360, 181, 44, 44],
  preview: [405, 181, 46, 46],
  cursor: [452, 181, 48, 48],
  tube0: [501, 181, 8, 20],
  tube1: [0, 230, 8, 20],
  tube2: [9, 230, 8, 20],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
