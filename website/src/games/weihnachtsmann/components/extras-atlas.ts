/**
 * Where the pictures of part B sit on their sheet.
 *
 * @module
 * @remarks
 * Written by the generator `extras_art.py` together with
 * `assets/extras-2x.png`: Grantelbart's stage, the magic school's baskets
 * and sign, the air mail board and parcel, the snow angel and its pegs, the
 * photo posts, the snowman contest, the four visiting children, the
 * packing table, wrapped presents and the gift tree. All of it is
 * original pixel art drawn for this game. Rectangles are in logical
 * pixels; the sheet holds two art pixels per logical pixel, like the
 * others.
 */
import type { SpriteRect } from "./sprite-atlas";

/** The name of a picture on the extras sheet. */
export type ExtraArtName =
  | "stage"
  | "magicBasket"
  | "schoolSign"
  | "postBoard"
  | "angelSign"
  | "contestSign"
  | "parcel"
  | "angelPrint"
  | "angelPeg"
  | "photoPost"
  | "ballPile"
  | "carrotBox"
  | "hatStand"
  | "scarfRack"
  | "plot"
  | "partBallBig"
  | "partBallMid"
  | "partBallHead"
  | "partBallCarry"
  | "partNose"
  | "partHatTop"
  | "partHatBucket"
  | "partScarfRed"
  | "partScarfGreen"
  | "jury"
  | "packTable"
  | "wrapped0"
  | "wrapped1"
  | "wrapped2"
  | "wrapped3"
  | "giftTree"
  | "kid0Front"
  | "kid0FrontStep"
  | "kid0Side"
  | "kid0SideStep"
  | "kid1Front"
  | "kid1FrontStep"
  | "kid1Side"
  | "kid1SideStep"
  | "kid2Front"
  | "kid2FrontStep"
  | "kid2Side"
  | "kid2SideStep"
  | "kid3Front"
  | "kid3FrontStep"
  | "kid3Side"
  | "kid3SideStep";

/* eslint-disable @typescript-eslint/no-magic-numbers -- generated coordinates on the sheet */
/** Every picture on the extras sheet. */
export const EXTRA_ART: Readonly<Record<ExtraArtName, SpriteRect>> = {
  stage: [0, 0, 112, 64],
  magicBasket: [113, 0, 18, 18],
  schoolSign: [132, 0, 22, 30],
  postBoard: [155, 0, 22, 30],
  angelSign: [178, 0, 22, 30],
  contestSign: [201, 0, 22, 30],
  parcel: [224, 0, 10, 9],
  angelPrint: [0, 65, 24, 26],
  angelPeg: [25, 65, 8, 12],
  photoPost: [34, 65, 14, 26],
  ballPile: [49, 65, 30, 20],
  carrotBox: [80, 65, 18, 16],
  hatStand: [99, 65, 16, 28],
  scarfRack: [116, 65, 18, 24],
  plot: [135, 65, 28, 12],
  partBallBig: [164, 65, 23, 21],
  partBallMid: [188, 65, 18, 16],
  partBallHead: [207, 65, 14, 12],
  partBallCarry: [222, 65, 11, 10],
  partNose: [234, 65, 7, 4],
  partHatTop: [242, 65, 10, 9],
  partHatBucket: [0, 94, 10, 9],
  partScarfRed: [11, 94, 14, 9],
  partScarfGreen: [26, 94, 14, 9],
  jury: [41, 94, 34, 34],
  packTable: [76, 94, 34, 26],
  wrapped0: [111, 94, 12, 12],
  wrapped1: [124, 94, 12, 12],
  wrapped2: [137, 94, 12, 12],
  wrapped3: [150, 94, 12, 12],
  giftTree: [163, 94, 56, 84],
  kid0Front: [220, 94, 16, 24],
  kid0FrontStep: [237, 94, 16, 24],
  kid0Side: [0, 179, 16, 24],
  kid0SideStep: [17, 179, 16, 24],
  kid1Front: [34, 179, 16, 24],
  kid1FrontStep: [51, 179, 16, 24],
  kid1Side: [68, 179, 16, 24],
  kid1SideStep: [85, 179, 16, 24],
  kid2Front: [102, 179, 16, 24],
  kid2FrontStep: [119, 179, 16, 24],
  kid2Side: [136, 179, 16, 24],
  kid2SideStep: [153, 179, 16, 24],
  kid3Front: [170, 179, 16, 24],
  kid3FrontStep: [187, 179, 16, 24],
  kid3Side: [204, 179, 16, 24],
  kid3SideStep: [221, 179, 16, 24],
};
/* eslint-enable @typescript-eslint/no-magic-numbers */
