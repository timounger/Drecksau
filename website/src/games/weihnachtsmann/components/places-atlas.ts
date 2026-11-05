/**
 * Where the pictures of the new places sit on their sheet.
 *
 * @module
 * @remarks
 * Written by the places generator together with `assets/places-2x.png`:
 * the hockey goals and bench, the snow castle's site, wall, towers and flag,
 * the balloon, the cable car with its stations, gondola and mountain, the
 * summit's telescope and ski rack, the lighthouse, the workshop station and
 * the little train. All of it is original pixel art drawn for this game.
 * Rectangles are in logical pixels; the sheet holds two art pixels per
 * logical pixel, like the others.
 */
import type { SpriteRect } from "./sprite-atlas";

/** The name of a picture on the places sheet. */
export type PlaceArtName =
  | "goalLeft"
  | "goalRight"
  | "bench"
  | "blockHeap"
  | "castleSite"
  | "wallPiece"
  | "towerLow"
  | "towerHigh"
  | "castleFlag"
  | "snowBlock"
  | "balloonPad"
  | "envelope"
  | "basket"
  | "basketFront"
  | "valleyStation"
  | "gondola"
  | "summitStation"
  | "panoramaScope"
  | "skiRack"
  | "lighthouse"
  | "stationHouse"
  | "engineSide"
  | "engineDown"
  | "engineUp"
  | "wagonSide"
  | "wagonSideFront"
  | "wagonDown"
  | "wagonDownFront"
  | "wagonUp"
  | "wagonUpFront"
  | "mountain";

/* eslint-disable @typescript-eslint/no-magic-numbers -- generated coordinates on the sheet */
/** Every picture on the places sheet. */
export const PLACE_ART: Readonly<Record<PlaceArtName, SpriteRect>> = {
  goalLeft: [0, 0, 18, 30],
  goalRight: [19, 0, 18, 30],
  bench: [38, 0, 48, 30],
  blockHeap: [87, 0, 32, 26],
  castleSite: [120, 0, 96, 52],
  wallPiece: [217, 0, 16, 22],
  towerLow: [234, 0, 20, 24],
  towerHigh: [255, 0, 20, 24],
  castleFlag: [276, 0, 14, 20],
  snowBlock: [291, 0, 10, 9],
  balloonPad: [302, 0, 80, 64],
  envelope: [383, 0, 52, 64],
  basket: [436, 0, 22, 16],
  basketFront: [459, 0, 22, 16],
  valleyStation: [0, 65, 80, 72],
  gondola: [81, 65, 22, 30],
  summitStation: [104, 65, 96, 64],
  panoramaScope: [201, 65, 16, 30],
  skiRack: [218, 65, 32, 28],
  lighthouse: [251, 65, 34, 108],
  stationHouse: [286, 65, 52, 56],
  engineSide: [339, 65, 40, 32],
  engineDown: [380, 65, 22, 34],
  engineUp: [403, 65, 22, 34],
  wagonSide: [426, 65, 34, 24],
  wagonSideFront: [461, 65, 34, 24],
  wagonDown: [0, 174, 22, 28],
  wagonDownFront: [23, 174, 22, 28],
  wagonUp: [46, 174, 22, 28],
  wagonUpFront: [69, 174, 22, 28],
  mountain: [0, 203, 480, 300],
};
/* eslint-enable @typescript-eslint/no-magic-numbers */
