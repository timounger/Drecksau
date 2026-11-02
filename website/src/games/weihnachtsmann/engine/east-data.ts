/**
 * The places of the east land and the extras spread over the whole map: the
 * Christmas market with its carousel, the sledding slope, the snowball
 * meadow, the frozen waterfall with the ice cave behind it, the frozen lake,
 * the fir plantation, the mailbox by the workshop, the twelve golden bells,
 * where lost things turn up, where the wild animals live and where the snow
 * jetskis wait.
 *
 * @module
 * @remarks
 * Only data, like `map-data.ts`, which takes the big objects, doors and
 * spots from here; the rows of the map hold the fences, flags, light poles,
 * snowmen, the lake and the plantation's firs.
 */
import type {
  AreaId,
  BigObjectKind,
  CellBox,
  CritterKind,
  Dir,
  Door,
  PlacedObject,
  Spot,
} from "./types";

/** When a golden bell can be picked up. */
export type BellNeed =
  /** Lies there for anybody who gets there. */
  | "plain"
  /** Only glows - and can be found - at night. */
  | "night"
  /** Stuck in a fir top until Gilfi's magic brings it down. */
  | "fir"
  /** Inside a snowman until it is knocked over. */
  | "snowman"
  /** Hangs from the carousel's roof: only a rider reaches it. */
  | "carousel"
  /** Buried: the fox digs it up at its secret. */
  | "fox";

/** One of the twelve golden bells. */
export type BellSpot = {
  /** Saved once found. */
  readonly id: string;
  readonly area: AreaId;
  /** Its cell. */
  readonly tx: number;
  readonly ty: number;
  readonly need: BellNeed;
};

/** A place named on the view from the observatory. */
export type PlaceLabel = {
  readonly name: PlaceName;
  /** The cell the name is centred on. */
  readonly tx: number;
  readonly ty: number;
};

/** Where a snow jetski waits for a rider, and which way it points there. */
export type JetskiHome = {
  /** The middle of its runners, cells (fractions allowed). */
  readonly x: number;
  readonly y: number;
  readonly dir: Dir;
};

/** The places with a name on the view from the observatory. */
export type PlaceName =
  "market" | "slope" | "meadow" | "lake" | "plantation" | "mailbox";

/* eslint-disable @typescript-eslint/no-magic-numbers -- places on the map */
/** The Christmas market: its square, the booths and the carousel. */
export const MARKET: CellBox = { tx: 102, ty: 4, w: 21, h: 13 };

/** The three booths, punch, gingerbread and chestnuts, left to right. */
export const STALLS: readonly PlacedObject[] = [
  { kind: "stallPunch", tx: 104, ty: 5 },
  { kind: "stallGinger", tx: 110, ty: 5 },
  { kind: "stallChestnut", tx: 116, ty: 5 },
];

/** The carousel's footprint, top left. */
export const CAROUSEL: PlacedObject = { kind: "carousel", tx: 110, ty: 10 };

/** Strings of lights between two light poles, cells of the poles. */
export const LIGHT_STRINGS: readonly (readonly [
  number,
  number,
  number,
  number,
])[] = [
  [103, 8, 112, 8],
  [112, 8, 121, 8],
  [103, 15, 112, 15],
  [112, 15, 121, 15],
  [103, 8, 103, 15],
  [121, 8, 121, 15],
];

/** The sledding track between its fences: start at the top, finish below. */
export const SLOPE: CellBox = { tx: 103, ty: 24, w: 5, h: 33 };

/** Where a run starts, cells. */
export const SLED_START = { x: 105.5, y: 25.6 } as const;

/** The finish line, as a row of cells (fractions allowed). */
export const SLED_FINISH = 56.6;

/** The snowball meadow. */
export const MEADOW: CellBox = { tx: 110, ty: 20, w: 13, h: 9 };

/** The targets on the meadow. */
export const TARGETS: readonly PlacedObject[] = [
  { kind: "target", tx: 113, ty: 22 },
  { kind: "target", tx: 117, ty: 22 },
  { kind: "target", tx: 121, ty: 24 },
];

/** The frozen waterfall in its cliff; the cave mouth is its middle two cells. */
export const WATERFALL: PlacedObject = { kind: "waterfall", tx: 114, ty: 32 };

/** The doorway through the broken ice curtain. */
export const CURTAIN_DOOR: Door = {
  tx: 117,
  ty: 36,
  w: 2,
  h: 1,
  dir: "up",
  to: "iceCave",
  toX: 10,
  toY: 11.4,
  toDir: "up",
};

/** The crawl hole beside the cliff only the fox finds. */
export const HOLE_DOOR: Door = {
  tx: 113,
  ty: 35,
  w: 1,
  h: 1,
  dir: "up",
  to: "iceCave",
  toX: 10,
  toY: 11.4,
  toDir: "up",
};

/** The frozen lake for skating, and the island one skates round. */
export const RINK: CellBox = { tx: 109, ty: 38, w: 15, h: 20 };
export const ISLAND = { x: 116.5, y: 48 } as const;

/** The fir plantation: only its young firs can be felled. */
export const PLANTATION: CellBox = { tx: 89, ty: 41, w: 11, h: 15 };

/** Santa's mailbox by the workshop. */
export const MAILBOX: PlacedObject = { kind: "mailbox", tx: 16, ty: 13 };

/** Where the felled fir is set up in the workshop. */
export const TREE_STAND: PlacedObject = { kind: "treeStand", tx: 7, ty: 12 };

/** The twelve golden bells. */
export const BELLS: readonly BellSpot[] = [
  { id: "fox", area: "outdoors", tx: 56, ty: 16, need: "fox" },
  { id: "cave", area: "iceCave", tx: 10, ty: 7, need: "plain" },
  { id: "forest", area: "outdoors", tx: 125, ty: 30, need: "plain" },
  { id: "fence", area: "outdoors", tx: 90, ty: 23, need: "plain" },
  { id: "firTop", area: "outdoors", tx: 99, ty: 33, need: "fir" },
  { id: "drift", area: "outdoors", tx: 118, ty: 58, need: "plain" },
  { id: "pond", area: "outdoors", tx: 11, ty: 28, need: "plain" },
  { id: "market", area: "outdoors", tx: 119, ty: 5, need: "plain" },
  { id: "night", area: "outdoors", tx: 115, ty: 46, need: "night" },
  { id: "carousel", area: "outdoors", tx: 112, ty: 10, need: "carousel" },
  { id: "grantel", area: "grantelHouse", tx: 17, ty: 11, need: "plain" },
  { id: "snowman", area: "outdoors", tx: 120, ty: 27, need: "snowman" },
];

/** Where lost things turn up for an errand, cells outside. */
export const FIND_SPOTS: readonly (readonly [number, number])[] = [
  [24, 15],
  [58, 22],
  [70, 36],
  [50, 52],
  [94, 30],
  [6, 35],
  [66, 41],
  [100, 8],
  [36, 40],
  [112, 58],
];

/** Where each kind of wild animal lives, and how many there are. */
export const CRITTER_HOMES: Readonly<
  Record<CritterKind, { readonly box: CellBox; readonly count: number }>
> = {
  hare: { box: { tx: 88, ty: 21, w: 13, h: 20 }, count: 3 },
  penguin: { box: { tx: 110, ty: 39, w: 13, h: 17 }, count: 3 },
  owl: { box: { tx: 100, ty: 2, w: 22, h: 13 }, count: 2 },
};

/**
 * The snow jetskis, one per colour: at the pond's south shore, beside the
 * main road, west of the market and on the lake's west shore.
 */
export const JETSKI_HOMES: readonly JetskiHome[] = [
  { x: 11, y: 33.7, dir: "right" },
  { x: 53, y: 20.8, dir: "right" },
  { x: 96.5, y: 11, dir: "right" },
  { x: 110.5, y: 40.8, dir: "down" },
];

/** The names on the view from the observatory. */
export const PLACE_LABELS: readonly PlaceLabel[] = [
  { name: "market", tx: 112, ty: 4 },
  { name: "slope", tx: 105, ty: 22 },
  { name: "meadow", tx: 117, ty: 20 },
  { name: "lake", tx: 116, ty: 56 },
  { name: "plantation", tx: 94, ty: 40 },
  { name: "mailbox", tx: 16, ty: 15 },
];

/** The big objects of the east land and the mailbox, for the outdoor map. */
export const EAST_OBJECTS: readonly PlacedObject[] = [
  ...STALLS,
  CAROUSEL,
  WATERFALL,
  ...TARGETS,
  MAILBOX,
  { kind: "sledStack", tx: 109, ty: 22 },
  { kind: "startBanner", tx: 102, ty: 24 },
  { kind: "finishBanner", tx: 102, ty: 56 },
];

/** The doors into the ice cave, usable only while open (`cave.ts`). */
export const EAST_DOORS: readonly Door[] = [CURTAIN_DOOR, HOLE_DOOR];

/** What the talk key works on in the east land and at the mailbox. */
export const EAST_SPOTS: readonly Spot[] = [
  ...STALLS.map((stall) => ({
    kind: "stall" as const,
    tx: stall.tx,
    ty: stall.ty,
    w: 3,
    h: 3,
  })),
  { kind: "carousel", tx: 110, ty: 10, w: 5, h: 3 },
  { kind: "toboggan", tx: 109, ty: 22, w: 2, h: 2 },
  { kind: "curtain", tx: 117, ty: 35, w: 2, h: 2 },
  { kind: "mailbox", tx: 16, ty: 13, w: 1, h: 1 },
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * Which booth a spot or object belongs to.
 *
 * @param tx - the left cell of the booth
 * @returns its index in {@link STALLS}, or 0
 */
export function stallAt(tx: number): number {
  return Math.max(
    0,
    STALLS.findIndex((stall) => stall.tx === tx),
  );
}

/** The kinds of the three booths, to look them up by index. */
export const STALL_KINDS: readonly BigObjectKind[] = STALLS.map(
  (stall) => stall.kind,
);
