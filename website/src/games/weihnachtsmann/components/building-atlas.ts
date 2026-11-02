/**
 * Where each picture of the five new buildings sits on their sheet.
 *
 * @module
 * @remarks
 * Written by the buildings generator together with
 * `assets/buildings-2x.png`: the stable, the post office, the bakery, the
 * observatory and the gift store - outside and in - their furniture, the
 * parcel stacks, the reindeer and the small things one carries. All of it is
 * original pixel art drawn for this game. Rectangles are in logical pixels;
 * the sheet holds two art pixels per logical pixel, like the others.
 */
import type { SpriteRect } from "./sprite-atlas";

/* eslint-disable @typescript-eslint/no-magic-numbers -- generated coordinates on the sheet */
/** The pictures on the buildings sheet. */
export const BUILDINGS = {
  stableHouse: [0, 0, 96, 64],
  postHouse: [97, 0, 80, 84],
  bakeryHouse: [178, 0, 96, 88],
  observatory: [275, 0, 80, 140],
  storeHouse: [356, 0, 128, 100],
  stableRoom: [0, 141, 320, 208],
  postRoom: [0, 350, 320, 208],
  bakeryRoom: [0, 559, 320, 208],
  observatoryRoom: [0, 768, 288, 208],
  storeRoom: [0, 977, 448, 288],
  stableGate: [321, 141, 48, 24],
  carrotTrough: [370, 141, 32, 24],
  strawBed: [403, 141, 64, 32],
  hayBales: [321, 174, 48, 28],
  sortShelf: [321, 203, 160, 56],
  letterPile0: [321, 260, 48, 40],
  letterPile1: [370, 260, 48, 40],
  letterPile2: [419, 260, 48, 40],
  letterPile3: [321, 301, 48, 40],
  postDesk: [370, 301, 48, 32],
  mailSacks: [419, 301, 32, 24],
  oven: [321, 342, 64, 72],
  doughTable: [386, 342, 48, 30],
  trayTable: [435, 342, 48, 30],
  coolRack: [321, 415, 48, 44],
  flourSacks: [370, 415, 32, 26],
  bigTelescope: [403, 415, 64, 80],
  starDesk: [321, 496, 48, 32],
  globe: [370, 496, 16, 28],
  bookshelf: [387, 496, 32, 56],
  parcels0: [420, 496, 16, 30],
  parcels1: [437, 496, 16, 30],
  parcels2: [454, 496, 16, 30],
  parcels3: [471, 496, 16, 30],
  parcelGap: [488, 496, 16, 30],
  lostGift: [321, 553, 12, 12],
  dough: [334, 553, 10, 8],
  trayRaw: [345, 553, 16, 8],
  trayBaked: [362, 553, 16, 8],
  trayBurnt: [379, 553, 16, 8],
  letter: [396, 553, 8, 6],
  reindeer0: [405, 553, 40, 40],
  reindeer1: [446, 553, 40, 40],
  reindeerLight0: [321, 594, 40, 40],
  reindeerLight1: [362, 594, 40, 40],
  rudolfSleep: [403, 594, 44, 28],
} as const satisfies Record<string, SpriteRect>;

/** Where the oven's opening is on its picture, logical px from its top left. */
export const OVEN_MOUTH = { x: 16, y: 26, w: 32, h: 23 } as const;

/** Where trays stand on the cooling rack, logical px from its top. */
export const RACK_SHELVES: readonly number[] = [12, 25, 38];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One picture on the buildings sheet. */
export type BuildingName = keyof typeof BUILDINGS;
