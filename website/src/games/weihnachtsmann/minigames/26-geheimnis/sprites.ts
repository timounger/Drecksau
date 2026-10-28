/**
 * Where each picture sits on the sheet of Türchen 26 - Das Geheimnis des Weihnachtsmanns.
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
  floor0: [0, 0, 16, 16],
  floor1: [17, 0, 16, 16],
  floor2: [34, 0, 16, 16],
  creak: [51, 0, 16, 16],
  rug: [68, 0, 16, 16],
  rugEdge: [85, 0, 16, 16],
  rugSide: [102, 0, 16, 16],
  wallTop: [119, 0, 16, 16],
  wallFace0: [136, 0, 16, 16],
  wallFace1: [153, 0, 16, 16],
  wallFace2: [170, 0, 16, 16],
  bench0: [187, 0, 16, 16],
  bench1: [204, 0, 16, 16],
  bench2: [221, 0, 16, 16],
  shelf: [238, 0, 16, 16],
  crate: [255, 0, 16, 16],
  giftPile: [272, 0, 16, 20],
  key: [289, 0, 12, 12],
  doorShut: [302, 0, 32, 32],
  doorOpen: [335, 0, 32, 32],
  lanternPost: [368, 0, 16, 24],
  handLantern: [385, 0, 7, 9],
  secretRoom: [0, 33, 320, 180],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the sheet. */
export type SpriteName = keyof typeof SPRITES;
