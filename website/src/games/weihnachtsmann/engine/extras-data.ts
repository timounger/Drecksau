/**
 * Where part B lies on the map: Grantelbart's stage between the balloon and
 * the cable car, Gilfi's magic school in front of the mountain, the air mail
 * board at the post office and the roofs it serves, the snow angel field in
 * the middle of the south land, Rudolf's night stars in the dark corners,
 * the waiting places of the visiting children, the snowman contest in the
 * south west, the ten photo points, the packing table in the workshop and
 * the gift tree south of the pond.
 *
 * @module
 * @remarks
 * Only data, like `places-data.ts`: `map-data.ts`, `interior-data.ts` and
 * `places-data.ts` take the big objects and spots from here. Everything
 * stands in the free areas listed in the README, clear of the track, the
 * platforms, the paths and the other places.
 */
import type { AreaId, CellBox, PlacedObject, Spot } from "./types";

/** A place with a name in the texts, cells. */
export type NamedPoint = {
  readonly id: string;
  readonly x: number;
  readonly y: number;
};

/** A photo point: the post with the camera, and what it looks at. */
export type PhotoPoint = {
  readonly id: PhotoId;
  readonly area: AreaId;
  /** The post's cell. */
  readonly tx: number;
  readonly ty: number;
};

/** The photo points. */
export type PhotoId =
  | "workshop"
  | "grantel"
  | "market"
  | "slope"
  | "waterfall"
  | "lake"
  | "stage"
  | "castle"
  | "angels"
  | "summit";

/** The signs of part B. */
export type ExtraSignId =
  | "stage"
  | "school"
  | "airMail"
  | "angels"
  | "contest"
  | "packTable"
  | "giftTree";

/** A sign of part B: where it hangs, how near one must come, in which place. */
export type ExtraSign = {
  readonly id: ExtraSignId;
  readonly area: AreaId;
  /** The point the sign hangs below, cells. */
  readonly x: number;
  readonly y: number;
  /** How near the character steered must come, cells. */
  readonly near: number;
};

/** A roof the air mail delivers to: the building's footprint, cells. */
export type Roof = CellBox & { readonly id: RoofId };

/** The roofs of the air mail. */
export type RoofId =
  | "dome"
  | "grantel"
  | "bakery"
  | "cinema"
  | "observatory"
  | "stable"
  | "store"
  | "station"
  | "valley"
  | "lighthouse";

/* eslint-disable @typescript-eslint/no-magic-numbers -- places on the map */
/** Grantelbart's stage; its back row and the speakers block, the floor not. */
export const STAGE: PlacedObject = { kind: "stage", tx: 55, ty: 69 };

/** Where one stands on the stage: the floor between the speakers, map px. */
export const STAGE_FLOOR = {
  left: 56 * 16,
  right: 62 * 16,
  top: 70 * 16,
  bottom: 71.7 * 16,
} as const;

/** Where the crowd stands in front of the stage, cells. */
export const AUDIENCE: readonly (readonly [number, number])[] = [
  [55.5, 73.6],
  [57.8, 74.3],
  [60.2, 74.3],
  [62.5, 73.6],
  [56.5, 76],
  [59, 76.4],
  [61.5, 76],
];

/** The middle of the stage, where the crowd looks, cells. */
export const STAGE_MIDDLE = { x: 58.5, y: 70.6 } as const;

/** Gilfi's magic school: the three baskets, cells. */
export const BASKETS: readonly PlacedObject[] = [
  { kind: "magicBasket", tx: 78, ty: 79 },
  { kind: "magicBasket", tx: 82, ty: 78 },
  { kind: "magicBasket", tx: 85, ty: 80 },
];

/** The practice field drawn on the snow, cells. */
export const SCHOOL_FIELD: CellBox = { tx: 77, ty: 77, w: 10, h: 9 };

/** The school's sign, where a round starts. */
export const SCHOOL_SIGN: PlacedObject = { kind: "schoolSign", tx: 86, ty: 84 };

/** The air mail board beside the post office. */
export const POST_BOARD: PlacedObject = { kind: "postBoard", tx: 40, ty: 9 };

/** The roofs the air mail serves: the footprints of the buildings. */
export const ROOFS: readonly Roof[] = [
  { id: "dome", tx: 8, ty: 7, w: 10, h: 4 },
  { id: "grantel", tx: 44, ty: 8, w: 5, h: 4 },
  { id: "bakery", tx: 18, ty: 6, w: 6, h: 3 },
  { id: "cinema", tx: 30, ty: 5, w: 6, h: 3 },
  { id: "observatory", tx: 53, ty: 6, w: 4, h: 4 },
  { id: "stable", tx: 40, ty: 33, w: 6, h: 3 },
  { id: "store", tx: 92, ty: 14, w: 8, h: 4 },
  { id: "station", tx: 5, ty: 14, w: 3, h: 2 },
  { id: "valley", tx: 71, ty: 70, w: 5, h: 3 },
  { id: "lighthouse", tx: 109, ty: 57, w: 2, h: 2 },
];

/**
 * The snow angel field: the five points of a star and its middle, cells.
 * The first five are the star's points, clockwise from the top.
 */
export const ANGEL_POINTS: readonly (readonly [number, number])[] = [
  [53, 80.8],
  [57, 83.7],
  [55.5, 88.4],
  [50.5, 88.4],
  [49, 83.7],
  [53, 85.2],
];

/** The sign at the angel field. */
export const ANGEL_SIGN: PlacedObject = { kind: "angelSign", tx: 47, ty: 86 };

/** Rudolf's night stars, hidden in the dark corners of the map, cells. */
export const NIGHT_STARS: readonly NamedPoint[] = [
  { id: "westWood", x: 1.6, y: 40.5 },
  { id: "pondWood", x: 1.8, y: 26 },
  { id: "marketWood", x: 125.6, y: 9 },
  { id: "eastEdge", x: 126.4, y: 30.5 },
  { id: "forestBelt", x: 87.5, y: 62.5 },
  { id: "middleBelt", x: 50, y: 62.6 },
  { id: "southWest", x: 1.6, y: 90.5 },
  { id: "southEast", x: 125.5, y: 93.6 },
];

/** Where the visiting children wait, by the main road, cells. */
export const KID_SPOTS: readonly (readonly [number, number])[] = [
  [6, 20.8],
  [11.5, 20.8],
  [16.5, 20.8],
  [23.5, 20.7],
];

/** The snowman contest in the south west. */
export const CONTEST_OBJECTS: readonly PlacedObject[] = [
  { kind: "ballPile", tx: 13, ty: 84 },
  { kind: "carrotBox", tx: 16, ty: 84 },
  { kind: "hatStand", tx: 18, ty: 84 },
  { kind: "scarfRack", tx: 20, ty: 84 },
  { kind: "snowmanPlot", tx: 17, ty: 87 },
  { kind: "jury", tx: 22, ty: 87 },
  { kind: "contestSign", tx: 12, ty: 88 },
];

/** The plot the contest snowman stands on. */
export const CONTEST_PLOT = { tx: 17, ty: 87 } as const;

/** The photo points. */
export const PHOTO_POINTS: readonly PhotoPoint[] = [
  { id: "workshop", area: "outdoors", tx: 17, ty: 15 },
  { id: "grantel", area: "outdoors", tx: 50, ty: 15 },
  { id: "market", area: "outdoors", tx: 102, ty: 16 },
  { id: "slope", area: "outdoors", tx: 110, ty: 30 },
  { id: "waterfall", area: "outdoors", tx: 121, ty: 37 },
  { id: "lake", area: "outdoors", tx: 114, ty: 60 },
  { id: "stage", area: "outdoors", tx: 64, ty: 71 },
  { id: "castle", area: "outdoors", tx: 29, ty: 73 },
  { id: "angels", area: "outdoors", tx: 59, ty: 80 },
  { id: "summit", area: "summit", tx: 22, ty: 9 },
];

/** The packing table in the workshop. */
export const PACK_TABLE: PlacedObject = { kind: "packTable", tx: 14, ty: 11 };

/** The decorated gift tree south of the pond. */
export const GIFT_TREE: PlacedObject = { kind: "giftTree", tx: 15, ty: 34 };

/** Where the presents lie in front of the gift tree, map px from its foot. */
export const PILE_SPOTS: readonly (readonly [number, number])[] = [
  [-14, 2],
  [12, 3],
  [-2, 5],
  [-24, 0],
  [22, 1],
  [4, 9],
  [-12, 9],
  [16, 10],
  [-28, 7],
  [28, 7],
  [-6, -2],
  [8, -1],
  [-20, 12],
  [24, 13],
  [0, 13],
  [-32, 2],
  [33, 2],
  [12, 15],
];

/** Where everybody stands round the gift tree on Christmas Eve, cells. */
export const EVE_SPOTS: readonly (readonly [number, number])[] = [
  [12.6, 35.6],
  [14, 36.6],
  [16.8, 36.6],
  [19.6, 36.6],
  [21.6, 35.8],
  [13.4, 33.4],
  [24, 35.6],
];

/** Where Santa stands to hand out the presents, cells. */
export const EVE_SANTA = { x: 18.8, y: 35.4 } as const;

/** The middle of the gift tree's foot, cells. */
export const TREE_FOOT = { x: 16.5, y: 35 } as const;

/** The signs of part B. */
export const EXTRA_SIGNS: readonly ExtraSign[] = [
  { id: "stage", area: "outdoors", x: 58.5, y: 72.6, near: 3 },
  { id: "school", area: "outdoors", x: 86.5, y: 85.4, near: 2.4 },
  { id: "airMail", area: "outdoors", x: 40.5, y: 10.4, near: 2.2 },
  { id: "angels", area: "outdoors", x: 47.5, y: 87.4, near: 2.4 },
  { id: "contest", area: "outdoors", x: 12.5, y: 89.4, near: 2.4 },
  { id: "giftTree", area: "outdoors", x: 16.5, y: 36.2, near: 2.6 },
  { id: "packTable", area: "workshop", x: 15, y: 12.4, near: 2 },
];

/** The big objects of part B on the outdoor map. */
export const EXTRA_OBJECTS: readonly PlacedObject[] = [
  STAGE,
  ...BASKETS,
  SCHOOL_SIGN,
  POST_BOARD,
  ANGEL_SIGN,
  ...CONTEST_OBJECTS,
  GIFT_TREE,
  ...PHOTO_POINTS.filter((point) => point.area === "outdoors").map((point) => ({
    kind: "photoPost" as const,
    tx: point.tx,
    ty: point.ty,
  })),
];

/** What the talk key works on at part B outside. */
export const EXTRA_SPOTS: readonly Spot[] = [
  { kind: "school", tx: 86, ty: 84, w: 1, h: 1 },
  { kind: "airMail", tx: 40, ty: 9, w: 1, h: 1 },
  { kind: "angels", tx: 47, ty: 86, w: 1, h: 1 },
  { kind: "partBalls", tx: 13, ty: 84, w: 2, h: 1 },
  { kind: "partCarrots", tx: 16, ty: 84, w: 1, h: 1 },
  { kind: "partHats", tx: 18, ty: 84, w: 1, h: 1 },
  { kind: "partScarves", tx: 20, ty: 84, w: 1, h: 1 },
  { kind: "snowmanPlot", tx: 17, ty: 87, w: 1, h: 1 },
  { kind: "jury", tx: 22, ty: 87, w: 2, h: 1 },
  { kind: "giftTree", tx: 15, ty: 34, w: 3, h: 1 },
  ...PHOTO_POINTS.filter((point) => point.area === "outdoors").map((point) => ({
    kind: "photo" as const,
    tx: point.tx,
    ty: point.ty,
    w: 1,
    h: 1,
  })),
];

/** The photo post on the summit, as an object and a spot. */
export const SUMMIT_PHOTO: PlacedObject = { kind: "photoPost", tx: 22, ty: 9 };
export const SUMMIT_PHOTO_SPOT: Spot = {
  kind: "photo",
  tx: 22,
  ty: 9,
  w: 1,
  h: 1,
};

/** The packing table's spot in the workshop. */
export const PACK_SPOT: Spot = {
  kind: "packTable",
  tx: 14,
  ty: 11,
  w: 2,
  h: 1,
};

/** The names on the view from the observatory. */
export const EXTRA_LABELS: readonly NamedPoint[] = [
  { id: "stage", x: 58, y: 68 },
  { id: "school", x: 81, y: 76 },
  { id: "angels", x: 53, y: 91 },
  { id: "contest", x: 17, y: 82 },
  { id: "giftTree", x: 16, y: 32 },
];
/* eslint-enable @typescript-eslint/no-magic-numbers */
