/**
 * The two houses one can enter: the round workshop under Santa's glass dome
 * with the toy machine, and Grantelbart's gloomy music room.
 *
 * @module
 * @remarks
 * Same format as the outdoor map in `map-data.ts`: rows of letters (`_` is
 * floor, `X` wall), furniture by the top left cell of its footprint, the
 * doors back out and the things the talk key works on. The floor, walls and
 * what hangs on them come with the room picture; the rows only say where one
 * can walk, so they have to match it.
 */
import type { AreaData } from "./types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- places in the rooms
   and on the machine's picture */
/** The workshop hall under the glass dome. */
export const WORKSHOP: AreaData = {
  rows: [
    "XXXXXXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXX______XXXXXXXXX",
    "XXXXX______________XXXXX",
    "XXX__________________XXX",
    "XX____________________XX",
    "X______________________X",
    "X______________________X",
    "X______________________X",
    "XX____________________XX",
    "XXX__________________XXX",
    "XXXXX______________XXXXX",
    "XXXXXXXXXXX__XXXXXXXXXXX",
  ],
  objects: [
    { kind: "toyMachine", tx: 8, ty: 5 },
    { kind: "toyShelf", tx: 5, ty: 6 },
    { kind: "toyShelfLadder", tx: 16, ty: 6 },
    { kind: "fireplace", tx: 2, ty: 8 },
    { kind: "armchair", tx: 5, ty: 9 },
    { kind: "workbench", tx: 16, ty: 9 },
    { kind: "workbench", tx: 17, ty: 11 },
    { kind: "wishBoard", tx: 20, ty: 8 },
  ],
  doors: [
    {
      tx: 11,
      ty: 14,
      w: 2,
      h: 1,
      dir: "down",
      to: "outdoors",
      toX: 13,
      toY: 12.4,
      toDir: "down",
    },
  ],
  spots: [
    { kind: "machine", tx: 8, ty: 5, w: 8, h: 2 },
    { kind: "wishes", tx: 20, ty: 8, w: 2, h: 1 },
    { kind: "armchair", tx: 5, ty: 9, w: 2, h: 1 },
  ],
  gates: [],
  shade: null,
};

/** Grantelbart's house: guitars, amplifiers, an organ and candles. */
export const GRANTEL_HOUSE: AreaData = {
  rows: [
    "XXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXXXX",
    "X__________________X",
    "X__________________X",
    "X__________________X",
    "X__________________X",
    "X__________________X",
    "X__________________X",
    "X__________________X",
    "X__________________X",
    "XXXXXXXXX__XXXXXXXXX",
  ],
  objects: [
    { kind: "organ", tx: 2, ty: 4 },
    { kind: "ampStack", tx: 13, ty: 4 },
    { kind: "ampStack", tx: 16, ty: 4 },
    { kind: "drumKit", tx: 14, ty: 6 },
    { kind: "guitarStand", tx: 11, ty: 5 },
    { kind: "candelabra", tx: 1, ty: 6 },
    { kind: "candelabra", tx: 18, ty: 9 },
    { kind: "creepyChair", tx: 6, ty: 8 },
  ],
  doors: [
    {
      tx: 9,
      ty: 12,
      w: 2,
      h: 1,
      dir: "down",
      to: "outdoors",
      toX: 46.5,
      toY: 13.4,
      toDir: "down",
    },
  ],
  spots: [
    { kind: "organ", tx: 2, ty: 4, w: 4, h: 1 },
    { kind: "amp", tx: 13, ty: 4, w: 2, h: 1 },
    { kind: "amp", tx: 16, ty: 4, w: 2, h: 1 },
    { kind: "drums", tx: 14, ty: 6, w: 3, h: 1 },
    { kind: "guitar", tx: 11, ty: 5, w: 1, h: 1 },
    // The two guitars hanging on the wall.
    { kind: "guitar", tx: 7, ty: 2, w: 3, h: 2 },
    { kind: "portrait", tx: 10, ty: 2, w: 2, h: 2 },
  ],
  gates: [],
  shade: "rgba(30, 8, 46, 0.4)",
};

/**
 * Where the toy machine's parts are on its picture, map px from the bottom
 * left corner of the picture (y counts up as negative).
 */
export const MACHINE_PARTS = {
  /** Mouth of the funnel, where a made toy pops out. */
  funnel: [44, -100],
  /** Opening of the sack at the end of the belt. */
  sack: [119, -20],
  /** Top of the belt, from the hatch to its end. */
  beltY: -19,
  beltFrom: 80,
  beltTo: 112,
  /** Mouth of the steam pipe. */
  steam: [79, -89],
} as const;
/* eslint-enable @typescript-eslint/no-magic-numbers */
