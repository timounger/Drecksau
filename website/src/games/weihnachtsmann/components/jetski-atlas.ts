/**
 * Where the pictures of the four snow jetskis sit on their sheet.
 *
 * @module
 * @remarks
 * Written by the jetski generator together with `assets/jetski-2x.png`:
 * per colour the side view (nose right), the view from the front and from
 * behind, each whole and as its front part alone, which is drawn over the
 * rider's legs. All of it is original pixel art drawn for this game.
 * Rectangles are in logical pixels; the sheet holds two art pixels per
 * logical pixel, like the others.
 */
import type { SpriteRect } from "./sprite-atlas";

/** One jetski's pictures: whole, and the part in front of the rider. */
export type JetskiArt = {
  readonly side: SpriteRect;
  readonly sideFront: SpriteRect;
  readonly down: SpriteRect;
  readonly downFront: SpriteRect;
  readonly up: SpriteRect;
  readonly upFront: SpriteRect;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- generated coordinates on the sheet */
/** The pictures of each jetski, by its colour. */
export const JETSKI_ART: readonly JetskiArt[] = [
  {
    side: [0, 0, 40, 20],
    sideFront: [41, 0, 40, 20],
    down: [82, 0, 28, 30],
    downFront: [123, 0, 28, 30],
    up: [164, 0, 28, 26],
    upFront: [205, 0, 28, 26],
  },
  {
    side: [0, 31, 40, 20],
    sideFront: [41, 31, 40, 20],
    down: [82, 31, 28, 30],
    downFront: [123, 31, 28, 30],
    up: [164, 31, 28, 26],
    upFront: [205, 31, 28, 26],
  },
  {
    side: [0, 62, 40, 20],
    sideFront: [41, 62, 40, 20],
    down: [82, 62, 28, 30],
    downFront: [123, 62, 28, 30],
    up: [164, 62, 28, 26],
    upFront: [205, 62, 28, 26],
  },
  {
    side: [0, 93, 40, 20],
    sideFront: [41, 93, 40, 20],
    down: [82, 93, 28, 30],
    downFront: [123, 93, 28, 30],
    up: [164, 93, 28, 26],
    upFront: [205, 93, 28, 26],
  },
];
/* eslint-enable @typescript-eslint/no-magic-numbers */
