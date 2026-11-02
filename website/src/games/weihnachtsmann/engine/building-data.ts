/**
 * The five buildings of the village one can enter: the reindeer stable, the
 * post office, the elves' bakery, Gugor's observatory and the gift store -
 * and the ice cave behind the frozen waterfall out east.
 *
 * @module
 * @remarks
 * Same format as `interior-data.ts`: rows of letters (`_` floor, `X` wall),
 * furniture by the top left cell of its footprint, the door back out and the
 * things the talk key works on. The gift store's rows are not written here:
 * its maze of parcel stacks is laid out anew now and then (`store.ts`); only
 * its size, door and what stays the same are.
 */
import type { AreaData, Door } from "./types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- places in the rooms */

/** The walls and floor of a 20 x 13 room with its door at the bottom middle. */
const ROOM_ROWS: readonly string[] = [
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
];

/**
 * The way out of a 20 x 13 room, back to a point outside.
 *
 * @param toX - where the feet arrive outside, cells
 * @param toY - where the feet arrive outside, cells
 * @returns the door
 */
function roomExit(toX: number, toY: number): Door {
  return {
    tx: 9,
    ty: 12,
    w: 2,
    h: 1,
    dir: "down",
    to: "outdoors",
    toX,
    toY,
    toDir: "down",
  };
}

/** The left column of each reindeer box; the reindeer stand behind its gate. */
export const STABLE_BOXES: readonly number[] = [2, 6, 10, 14];

/** The row of the box gates. */
export const STABLE_GATE_ROW = 5;

/** The reindeer stable: four boxes, a carrot crate, a bed of straw. */
export const STABLE: AreaData = {
  rows: [
    ...ROOM_ROWS.slice(0, 4),
    "XXXXXXXXXXXXXXXXXXXX",
    ...ROOM_ROWS.slice(5),
  ],
  objects: [
    ...STABLE_BOXES.map((tx) => ({
      kind: "stableGate" as const,
      tx,
      ty: STABLE_GATE_ROW,
    })),
    { kind: "carrotTrough", tx: 17, ty: 7 },
    { kind: "strawBed", tx: 2, ty: 9 },
    { kind: "hayBales", tx: 14, ty: 10 },
  ],
  doors: [roomExit(43, 37.4)],
  spots: [
    ...STABLE_BOXES.map((tx) => ({
      kind: "reindeer" as const,
      tx,
      ty: STABLE_GATE_ROW,
      w: 3,
      h: 1,
    })),
    { kind: "carrots", tx: 17, ty: 7, w: 2, h: 1 },
    { kind: "straw", tx: 2, ty: 9, w: 4, h: 3 },
  ],
  gates: [],
  shade: "rgba(40, 20, 0, 0.18)",
};

/** Where Rudolf lies down in the straw, cells. */
export const STRAW_BED = { x: 4, y: 10.6 } as const;

/** The left column of each compartment of the sorting shelf, by continent. */
export const SORT_SLOTS: readonly number[] = [5, 7, 9, 11, 13];

/** The row of the sorting shelf. */
export const SORT_ROW = 4;

/** The post office: the heap of letters and the sorting shelf. */
export const POST_OFFICE: AreaData = {
  rows: ROOM_ROWS,
  objects: [
    { kind: "sortShelf", tx: 5, ty: SORT_ROW },
    { kind: "letterPile", tx: 3, ty: 8 },
    { kind: "postDesk", tx: 15, ty: 8 },
    { kind: "mailSacks", tx: 16, ty: 5 },
  ],
  doors: [roomExit(38.5, 9.4)],
  spots: [
    ...SORT_SLOTS.map((tx) => ({
      kind: "slot" as const,
      tx,
      ty: SORT_ROW,
      w: 2,
      h: 1,
    })),
    { kind: "letters", tx: 3, ty: 8, w: 3, h: 2 },
  ],
  gates: [],
  shade: null,
};

/** The elves' bakery: dough, trays, the oven and the cooling rack. */
export const BAKERY: AreaData = {
  rows: ROOM_ROWS,
  objects: [
    { kind: "oven", tx: 8, ty: 4 },
    { kind: "doughTable", tx: 2, ty: 6 },
    { kind: "trayTable", tx: 4, ty: 9 },
    { kind: "coolRack", tx: 15, ty: 5 },
    { kind: "flourSacks", tx: 16, ty: 9 },
  ],
  doors: [roomExit(21, 10.4)],
  spots: [
    { kind: "dough", tx: 2, ty: 6, w: 3, h: 1 },
    { kind: "trays", tx: 4, ty: 9, w: 3, h: 1 },
    { kind: "oven", tx: 8, ty: 4, w: 4, h: 1 },
    { kind: "rack", tx: 15, ty: 5, w: 3, h: 1 },
  ],
  gates: [],
  shade: null,
};

/** Gugor's observatory: the big telescope under the open dome. */
export const OBSERVATORY: AreaData = {
  rows: [
    ...ROOM_ROWS.slice(0, -1).map((row) => row.slice(0, 17) + row.slice(19)),
    "XXXXXXXX__XXXXXXXX",
  ],
  objects: [
    { kind: "bigTelescope", tx: 7, ty: 5 },
    { kind: "starDesk", tx: 2, ty: 7 },
    { kind: "globe", tx: 14, ty: 6 },
    { kind: "bookshelf", tx: 15, ty: 4 },
  ],
  doors: [
    {
      tx: 8,
      ty: 12,
      w: 2,
      h: 1,
      dir: "down",
      to: "outdoors",
      toX: 55,
      toY: 11.4,
      toDir: "down",
    },
  ],
  spots: [{ kind: "telescope", tx: 7, ty: 5, w: 4, h: 2 }],
  gates: [],
  shade: "rgba(10, 16, 60, 0.3)",
};

/** The ice cave behind the frozen waterfall: crystals all round. */
export const ICE_CAVE: AreaData = {
  rows: ROOM_ROWS,
  objects: [
    { kind: "crystalBig", tx: 2, ty: 5 },
    { kind: "crystalViolet", tx: 6, ty: 4 },
    { kind: "crystalSmall", tx: 13, ty: 4 },
    { kind: "crystalBig", tx: 16, ty: 6 },
    { kind: "crystalViolet", tx: 4, ty: 10 },
    { kind: "crystalSmall", tx: 12, ty: 9 },
    { kind: "crystalViolet", tx: 17, ty: 10 },
  ],
  doors: [roomExit(118, 37.4)],
  spots: [],
  gates: [],
  shade: "rgba(20, 40, 110, 0.18)",
};

/** Size of the gift store, cells. */
export const STORE_COLS = 28;
export const STORE_ROWS = 18;

/** The maze of the gift store: rooms across and down, each two cells square. */
export const MAZE_W = 9;
export const MAZE_H = 5;

/** The first row of the maze; above it is the wall with the shelves. */
export const MAZE_TOP = 3;

/** The maze room the door opens into: the middle of the bottom row. */
export const MAZE_ENTRY = { x: 4, y: 4 } as const;

/**
 * The gift store's walls and floor without a single parcel stack.
 *
 * @returns one string per row
 */
export function storeHall(): string[] {
  const rows: string[] = [];
  for (let ty = 0; ty < STORE_ROWS; ty += 1) {
    let row = "";
    for (let tx = 0; tx < STORE_COLS; tx += 1) {
      const wall =
        ty < MAZE_TOP ||
        tx === 0 ||
        tx === STORE_COLS - 1 ||
        (ty === STORE_ROWS - 1 &&
          tx !== STORE_DOOR_X &&
          tx !== STORE_DOOR_X + 1);
      row += wall ? "X" : "_";
    }
    rows.push(row);
  }
  return rows;
}

/** The left cell of the gift store's door in its bottom wall. */
export const STORE_DOOR_X = 13;

/** The gift store as far as it stays the same: its door and its light. */
export const GIFT_STORE: AreaData = {
  rows: storeHall(),
  objects: [],
  doors: [
    {
      tx: STORE_DOOR_X,
      ty: STORE_ROWS - 1,
      w: 2,
      h: 1,
      dir: "down",
      to: "outdoors",
      toX: 96,
      toY: 19.4,
      toDir: "down",
    },
  ],
  spots: [],
  gates: [],
  shade: "rgba(30, 16, 0, 0.22)",
};
/* eslint-enable @typescript-eslint/no-magic-numbers */
