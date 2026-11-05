/**
 * The places of the south land and round it - the ice hockey rink, the snow
 * castle building site, the hot-air balloon's field, the cable car with its
 * valley station, the mountain and the summit with the ski run, the
 * lighthouse by the lake and the narrow-gauge railway with its stations.
 *
 * @module
 * @remarks
 * Only data, like `east-data.ts`: `map-data.ts` takes the big objects and
 * spots of the outdoor map from here, `map.ts` the summit as a place of its
 * own. The rows of the outdoor map hold the rink's boards and ice and the
 * paths; the track is no part of the rows - it is drawn over the ground and
 * blocks nothing.
 */
import { SUMMIT_PHOTO, SUMMIT_PHOTO_SPOT } from "./extras-data";
import type { AreaData, CellBox, Door, PlacedObject, Spot } from "./types";

/** The five stations of the railway, in the order the train calls at them. */
export type StationId =
  "workshop" | "observatory" | "market" | "lighthouse" | "south";

/** One station of the railway. */
export type Station = {
  /** Its name in the texts. */
  readonly id: StationId;
  /** Where the middle wagon stops: the cell on the track (fractions allowed). */
  readonly x: number;
  readonly y: number;
  /** The platform one boards from. */
  readonly platform: CellBox;
};

/** A level crossing: where a path crosses the track. */
export type Crossing = {
  /** The middle of the crossing, cells. */
  readonly x: number;
  readonly y: number;
  /** Whether the path runs across the picture, so the barriers stand upright. */
  readonly across: boolean;
};

/** The places that have a sign. */
export type PlaceSignId =
  | "hockey"
  | "castle"
  | "blocks"
  | "cableCar"
  | "lighthouse"
  | "summitStation"
  | "skis"
  | "panorama";

/** A sign at one of the new places: where it hangs and how near one must come. */
export type PlaceSign = {
  readonly id: PlaceSignId;
  /** The point the sign hangs below, cells. */
  readonly x: number;
  readonly y: number;
  /** How near the character steered must come, cells. */
  readonly near: number;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- places on the map */
/** The rink's ice inside its boards. */
export const HOCKEY_ICE: CellBox = { tx: 6, ty: 71, w: 20, h: 10 };

/** The two goals, at the left and the right end of the ice. */
export const HOCKEY_GOALS: readonly PlacedObject[] = [
  { kind: "hockeyGoalLeft", tx: 6, ty: 75 },
  { kind: "hockeyGoalRight", tx: 25, ty: 75 },
];

/** The bench with the scoreboard at the rink's gate. */
export const HOCKEY_BENCH: PlacedObject = {
  kind: "hockeyBench",
  tx: 18,
  ty: 68,
};

/** The snow castle's building site, and the heap of snow blocks beside it. */
export const CASTLE_SITE: PlacedObject = { kind: "castleSite", tx: 35, ty: 75 };
export const BLOCK_HEAP: PlacedObject = { kind: "blockHeap", tx: 31, ty: 75 };

/** The balloon's field, and where the balloon stands on it, cells. */
export const BALLOON_PAD: PlacedObject = { kind: "balloonPad", tx: 48, ty: 72 };
export const BALLOON_HOME = { x: 50.5, y: 75 } as const;

/** The cable car's valley station, and the mountain the cable climbs. */
export const VALLEY_STATION: PlacedObject = {
  kind: "valleyStation",
  tx: 71,
  ty: 70,
};
export const MOUNTAIN: PlacedObject = { kind: "mountain", tx: 88, ty: 78 };

/** The top of the mountain where the cable ends, cells: on the small map. */
export const CABLE_TOP_CELL = { x: 103, y: 80 } as const;

/** Where one steps out in front of the valley station, cells. */
export const VALLEY_FRONT = { x: 73.5, y: 75.4 } as const;

/** The lighthouse on the lake's south-west shore. */
export const LIGHTHOUSE: PlacedObject = { kind: "lighthouse", tx: 109, ty: 57 };

/** The station house of the workshop station. */
export const STATION_HOUSE: PlacedObject = {
  kind: "stationHouse",
  tx: 5,
  ty: 14,
};

/**
 * The corners of the railway's loop, cells; the track runs straight from
 * one corner's middle to the next and from the last back to the first. The
 * train goes this way round: up the west, along the north, down the east and
 * back along the south land.
 */
export const TRACK_CORNERS: readonly (readonly [number, number])[] = [
  [3, 65],
  [3, 3],
  [44, 3],
  [44, 4],
  [100, 4],
  [100, 65],
];

/** The stations, in the order the train calls at them. */
export const STATIONS: readonly Station[] = [
  { id: "workshop", x: 3, y: 15, platform: { tx: 4, ty: 13, w: 1, h: 4 } },
  {
    id: "observatory",
    x: 59.5,
    y: 4,
    platform: { tx: 57, ty: 5, w: 5, h: 1 },
  },
  { id: "market", x: 94.5, y: 4, platform: { tx: 92, ty: 5, w: 5, h: 1 } },
  {
    id: "lighthouse",
    x: 100,
    y: 57.5,
    platform: { tx: 101, ty: 56, w: 1, h: 4 },
  },
  { id: "south", x: 44.5, y: 65, platform: { tx: 42, ty: 64, w: 5, h: 1 } },
];

/** Where paths cross the track: the main road, and the path to the south land. */
export const CROSSINGS: readonly Crossing[] = [
  { x: 100.5, y: 19, across: true },
  { x: 31, y: 65.5, across: false },
];

/** The signs at the new places outside. */
export const PLACE_SIGNS: readonly PlaceSign[] = [
  { id: "hockey", x: 19.5, y: 70, near: 3 },
  { id: "blocks", x: 32, y: 77.2, near: 2.2 },
  { id: "castle", x: 38, y: 80, near: 2.6 },
  { id: "cableCar", x: 73.5, y: 75.2, near: 2.6 },
  { id: "lighthouse", x: 110, y: 60.2, near: 2.6 },
];

/** The signs on the summit. */
export const SUMMIT_SIGNS: readonly PlaceSign[] = [
  { id: "summitStation", x: 5, y: 6.2, near: 2.6 },
  { id: "skis", x: 13, y: 10.2, near: 2.4 },
  { id: "panorama", x: 19.5, y: 6.2, near: 2.4 },
];

/**
 * Where the roof of the gift store hides its secret, seen only from the
 * balloon: a golden arrow pointing to the bell in the eastern forest. Map px.
 */
export const ROOF_SECRET = { x: 96 * 16, y: 11.5 * 16 } as const;

/** The big objects of the south land and the lake shore, for the outdoor map. */
export const PLACE_OBJECTS: readonly PlacedObject[] = [
  ...HOCKEY_GOALS,
  HOCKEY_BENCH,
  CASTLE_SITE,
  BLOCK_HEAP,
  BALLOON_PAD,
  VALLEY_STATION,
  MOUNTAIN,
  LIGHTHOUSE,
  STATION_HOUSE,
];

/** What the talk key works on at the new places outside. */
export const PLACE_SPOTS: readonly Spot[] = [
  { kind: "hockey", tx: 18, ty: 68, w: 3, h: 1 },
  { kind: "blocks", tx: 31, ty: 75, w: 2, h: 2 },
  { kind: "castle", tx: 35, ty: 75, w: 6, h: 3 },
  { kind: "cableCar", tx: 71, ty: 70, w: 5, h: 4 },
  { kind: "lighthouse", tx: 109, ty: 57, w: 2, h: 2 },
  ...STATIONS.map((station) => ({
    kind: "platform" as const,
    ...station.platform,
  })),
];

/** Where the gondola arrives on the summit, and where the ski run starts, cells. */
export const SUMMIT_ARRIVAL = { x: 5, y: 6.6 } as const;
export const SKI_START = { x: 13, y: 12.6 } as const;

/** The finish line of the ski run, a row of the summit (fractions allowed). */
export const SKI_FINISH = 86.4;

/** The way off the mountain at the foot of the ski run, down to the valley. */
export const SUMMIT_EXIT: Door = {
  tx: 10,
  ty: 90,
  w: 6,
  h: 1,
  dir: "down",
  to: "outdoors",
  toX: VALLEY_FRONT.x,
  toY: VALLEY_FRONT.y,
  toDir: "down",
};

/**
 * The summit: the platform with the mountain station, the telescope and the
 * ski rack behind its railing, and the long winding ski run down between
 * firs and rocks, slalom flags on the way.
 */
export const SUMMIT: AreaData = {
  rows: [
    "ttTTTTtoTTTtToTToTttTTtoTT",
    "TTTToTTTtTToTTtoTtToTTooTo",
    "T........................T",
    "T........................o",
    "T........................t",
    "o........................T",
    "t........................o",
    "T........................o",
    "T........................T",
    "t........................T",
    "T........................o",
    "t######............######o",
    "TotTott............tTttttT",
    "otTTtTT.............tTtTtT",
    "TTToTtTT............TTTTtT",
    "TtTTTToT..............toTT",
    "ottTtotTT.............tTtT",
    "otTTTToTt.............tTto",
    "TTtTtoToot.............tTT",
    "TTTTTottT..............oot",
    "TtTTtttotot........f...TTT",
    "TotTTtToTTt.............TT",
    "TTTtTtTtTTo..............T",
    "TtoTTTTToTt..............T",
    "otttTTTTTTTT............to",
    "ottTTttTttTT............tt",
    "TTTTtTTToTt.............To",
    "oTtToTToTtot..f...o.....Tt",
    "toToToototT.............Tt",
    "oTTTottTtTo.............oT",
    "TTttTTTtTtT.............To",
    "TtTtToTtotT............toT",
    "TtTTTTtTtt.............TtT",
    "TTttttoTTT.............TtT",
    "TTTTtTtTT.........f...tttT",
    "TttTTooTTT............tTTo",
    "TTTttTtTT............ToTTT",
    "oTTooTTTT............otttt",
    "oToTtoTo............tTooto",
    "ooTtTTt.............otTtTT",
    "oTTTtoT............TTtTtot",
    "ttTott...f.........totttTT",
    "tTtTTT.............TTTttTt",
    "TTTtT..............TtttTTt",
    "tttTt.............oTttTTto",
    "oToT.............ooTtToToo",
    "ttot............ttTTtTTtTo",
    "tT..............ttTTTTotTT",
    "tt.....o...f....TtTTTttTTT",
    "ToT............otoTTTTTTTT",
    "tT.............TTtTTotttTT",
    "TT.............TTTTTtttoTT",
    "T.............TTTTtTTtTtTT",
    "TT............TtttToToTtTt",
    "T.............TTTtTTTtTTTt",
    "T...f.........tooTTTotTTto",
    "To............TtttooTTtTtt",
    "TT............TTTttttttoot",
    "ot.............TtTooTttTTT",
    "TT.............TtTtoTToTto",
    "TtT............tttTtTTToTo",
    "oT.............tttTTtTtTtT",
    "oot....o....f...TtTTtoottT",
    "ToTT............TtTTTtToTT",
    "ottT..............TtTTttTT",
    "TtTTo............TTTTttTtt",
    "tToTT.............oTTtToTT",
    "TtTtt.............oTTTtTTT",
    "TTooot.............oTtttTo",
    "TTtTtT...f.........TTTttTT",
    "oTtotTtt............TTtTTT",
    "ttTtToTT.............TTTot",
    "oTToTToTo............TTTTT",
    "TtTTTTtTT..............TTo",
    "otTTTtTTTo............ooTo",
    "TtTTooTotT.............TTo",
    "TtTTTTtTto....o....f....tT",
    "tToottTotTt............TTt",
    "tttoTTTtTTT.............To",
    "TtttoTTTtTT.............Tt",
    "TttTtooTTTo.............tt",
    "tTtTTtootTT.............tT",
    "ToTtoooTTTtt............Tt",
    "ToTTtTTtTtTT............Tt",
    "oTtoTTtTttTT............tt",
    "ttTtTttTTTtt............to",
    "TTt.......::::::.......TTT",
    "ott.......::::::.......ttT",
    "ttT.......::::::.......TTt",
    "TTt.......::::::.......ttT",
    "ttT.......::::::.......tTo",
    "oTTtTTTTTTTTTTttTTtTTTTTTo",
  ],
  objects: [
    { kind: "summitStation", tx: 2, ty: 2 },
    { kind: "panoramaScope", tx: 19, ty: 4 },
    { kind: "skiRack", tx: 12, ty: 8 },
    { kind: "finishBanner", tx: 13, ty: 85 },
    SUMMIT_PHOTO,
  ],
  doors: [SUMMIT_EXIT],
  spots: [
    { kind: "summitStation", tx: 2, ty: 2, w: 6, h: 3 },
    { kind: "panorama", tx: 19, ty: 4, w: 1, h: 1 },
    { kind: "skis", tx: 12, ty: 8, w: 2, h: 1 },
    SUMMIT_PHOTO_SPOT,
  ],
  gates: [],
  shade: null,
};
/* eslint-enable @typescript-eslint/no-magic-numbers */
