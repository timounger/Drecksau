/**
 * Where each picture of the east land and its attractions sits on its sheet.
 *
 * @module
 * @remarks
 * Written by the outdoor generator together with `assets/outdoor-2x.png`:
 * the market booths, the carousel, the frozen waterfall and its ice cave,
 * the toboggan run, targets, fir trees, animals, the mailbox and the small
 * things one carries. All of it is original pixel art drawn for this game.
 * Rectangles are in logical pixels; the sheet holds two art pixels per
 * logical pixel, like the others.
 */
import type { SpriteRect } from "./sprite-atlas";

/* eslint-disable @typescript-eslint/no-magic-numbers -- generated coordinates on the sheet */
/** The pictures on the outdoor sheet. */
export const OUTDOOR = {
  stallPunch: [0, 209, 48, 56],
  stallGinger: [49, 209, 48, 56],
  stallChestnut: [98, 209, 48, 56],
  carouselBase: [142, 266, 80, 28],
  carouselPole: [491, 0, 6, 60],
  carouselRoof: [373, 209, 88, 40],
  horseWhite0: [308, 266, 24, 22],
  horseWhite1: [333, 266, 24, 22],
  horseBrown0: [358, 266, 24, 22],
  horseBrown1: [383, 266, 24, 22],
  lightPole: [495, 209, 6, 40],
  waterfall: [321, 0, 128, 112],
  curtain: [0, 266, 32, 34],
  curtainThin: [33, 266, 32, 34],
  shards: [17, 301, 40, 12],
  foxHole: [110, 301, 20, 12],
  iceCaveRoom: [0, 0, 320, 208],
  crystalBig: [462, 209, 32, 40],
  crystalSmall: [273, 266, 16, 24],
  crystalViolet: [256, 266, 16, 28],
  sled: [87, 301, 22, 12],
  sledStack: [223, 266, 32, 28],
  startBanner: [147, 209, 112, 44],
  finishBanner: [260, 209, 112, 44],
  flagRed: [290, 266, 8, 24],
  flagBlue: [299, 266, 8, 24],
  target: [66, 266, 18, 30],
  targetHit: [85, 266, 18, 30],
  stump: [131, 301, 16, 12],
  firCarried: [58, 301, 28, 12],
  xmasTree: [450, 0, 40, 64],
  treeStand: [159, 301, 16, 10],
  bell: [148, 301, 10, 11],
  hareSit: [495, 266, 16, 14],
  hareHop: [0, 301, 16, 14],
  penguin0: [408, 266, 14, 16],
  penguin1: [423, 266, 14, 16],
  owlSit: [438, 266, 14, 16],
  owlFly0: [453, 266, 20, 14],
  owlFly1: [474, 266, 20, 14],
  mailbox: [104, 266, 18, 30],
  mailboxFlag: [123, 266, 18, 30],
  mitten: [176, 301, 10, 10],
  scarf: [187, 301, 10, 10],
  glasses: [198, 301, 10, 10],
  punchCup: [209, 301, 10, 10],
  gingerHeart: [220, 301, 10, 10],
  chestnutBag: [231, 301, 10, 10],
  iceLight: [242, 301, 6, 6],
} as const satisfies Record<string, SpriteRect>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the outdoor sheet. */
export type OutdoorName = keyof typeof OUTDOOR;
