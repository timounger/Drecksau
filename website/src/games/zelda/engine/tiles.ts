/**
 * The tile maps of every area and what their letters mean: which tiles
 * block, which can be cut, which a bomb can open - and how the temple is cut
 * into rooms of one screen each.
 *
 * @module
 */
import { DUNGEON_ROWS, HOUSE_ROWS, MINI_ROWS } from "./area-maps";
import type { AreaId } from "./types";
import { MAP_ROWS } from "./world-map";

/** Edge length of one tile in area pixels. */
export const TILE = 16;

/** One temple room (or house) is one screen: tiles across. */
export const ROOM_COLS = 15;

/** One temple room (or house) is one screen: tiles down. */
export const ROOM_ROWS = 10;

/** One area's map. */
export type AreaMap = {
  readonly rows: readonly string[];
  /** Width in tiles. */
  readonly cols: number;
  /** Height in tiles. */
  readonly rowCount: number;
  /** Width in pixels. */
  readonly width: number;
  /** Height in pixels. */
  readonly height: number;
  /** Cut into rooms of one screen: the camera stays in a room and scrolls between them. */
  readonly roomed: boolean;
};

/** Every area's map. */
export const AREAS: Readonly<Record<AreaId, AreaMap>> = {
  overworld: areaMap(MAP_ROWS, false),
  dungeon: areaMap(DUNGEON_ROWS, true),
  houses: areaMap(HOUSE_ROWS, true),
  mini: areaMap(MINI_ROWS, false),
};

/** Overworld width in pixels. */
export const WORLD_W = AREAS.overworld.width;

/** Overworld height in pixels. */
export const WORLD_H = AREAS.overworld.height;

/** Letters of the maps that matter to the rules. */
export const TILE_CHARS = {
  bush: "b",
  tallGrass: '"',
  crackedRock: "x",
  crackedWall: "X",
  sign: "S",
  water: "~",
  current: "c",
  ledge: "l",
  start: "@",
  container: "*",
  piece: "P",
  door: "d",
  templeGate: "e",
  exit: "E",
  mouseHole: "n",
  stump: "U",
  heavyRock: "R",
  chest: "C",
  lockedDoor: "L",
  bossDoor: "K",
  shutter: "Z",
  block: "B",
  plate: "v",
  torch: "i",
  brazier: "I",
  counter: "u",
  hookPost: "k",
  puddle: "V",
  fence: "f",
} as const;

/**
 * Letters a walker cannot enter.
 *
 * @remarks
 * Trees, houses, cliffs and low ledges (Link hops down those), fences, rocks, signs, graves, pillars, ruin walls,
 * the cave mouth, water and the strong current; indoors walls, statues, torches, chests,
 * furniture and the counter; in the root world grass blades, pebbles and
 * puddles; the hookshot's posts. Some block only until cleared - see
 * {@link isSolidTile}.
 */
const SOLID = new Set("TtQqHhMml<>OorfSgpw~cbxnRCW0LKZXiIyuaYJVk");

/** Letters a hop with the feather clears: water, current, puddles and fences. */
const HOP_OVER = new Set("~cVf");

/** Letters of soft ground the shovel bites into. */
const DIGGABLE = new Set(".,:=%@");

/** Letters of trees, which drop things when the boots run into them. */
const TREES = new Set("TtQq");

/** Letters that block walkers but not a shot flying over them. */
const LOW = new Set("~cV");

/** Letters that lead somewhere else when walked onto. */
const WARP_LETTERS = new Set("deEn");

/**
 * The letter at a tile, with everything outside the map counting as solid.
 *
 * @param area - which map
 * @param tx - tile column
 * @param ty - tile row
 * @returns the map letter
 */
export function tileAt(area: AreaId, tx: number, ty: number): string {
  const map = AREAS[area];
  let result = area === "overworld" ? "t" : "0";
  if (tx >= 0 && ty >= 0 && tx < map.cols && ty < map.rowCount) {
    result = map.rows[ty][tx];
  }
  return result;
}

/**
 * One number per tile, for sets and maps of changed tiles.
 *
 * @param area - which map
 * @param tx - tile column
 * @param ty - tile row
 * @returns the tile's index
 */
export function tileIndex(area: AreaId, tx: number, ty: number): number {
  return ty * AREAS[area].cols + tx;
}

/**
 * Whether a walker is blocked by a tile.
 *
 * @param letter - the map letter
 * @param cleared - true once the tile has been cut, opened or unlocked
 * @returns true when nobody can stand on it
 */
export function isSolidTile(letter: string, cleared: boolean): boolean {
  return SOLID.has(letter) && !cleared;
}

/**
 * Whether a tile stops things that fly low - arrows, rocks, the boomerang.
 *
 * @param letter - the map letter
 * @param cleared - true once the tile has been cut, opened or unlocked
 * @returns true when it blocks a shot
 */
export function blocksShots(letter: string, cleared: boolean): boolean {
  return (
    isSolidTile(letter, cleared) &&
    !LOW.has(letter) &&
    letter !== TILE_CHARS.brazier
  );
}

/**
 * Whether the sword, a bomb or the boomerang can cut this tile.
 *
 * @param letter - the map letter
 * @returns true for bushes and tall grass
 */
export function isCuttable(letter: string): boolean {
  return letter === TILE_CHARS.bush || letter === TILE_CHARS.tallGrass;
}

/**
 * Whether Link in the middle of a hop sails over a tile.
 *
 * @param letter - the map letter
 * @returns true for water, the current, puddles and fences
 */
export function isHopOver(letter: string): boolean {
  return HOP_OVER.has(letter);
}

/**
 * Whether the shovel can dig a tile.
 *
 * @param letter - the map letter
 * @returns true for grass, flowers, dirt paths and the field
 */
export function isDiggable(letter: string): boolean {
  return DIGGABLE.has(letter);
}

/**
 * Whether a tile is part of a tree.
 *
 * @param letter - the map letter
 * @returns true for both tree sizes
 */
export function isTree(letter: string): boolean {
  return TREES.has(letter);
}

/**
 * Whether walking onto a tile leads to another place.
 *
 * @param letter - the map letter
 * @returns true for doors, holes, the temple gate and stairs
 */
export function isWarpTile(letter: string): boolean {
  return WARP_LETTERS.has(letter);
}

/**
 * Every tile carrying a given letter, in reading order.
 *
 * @param area - which map
 * @param letter - the letter to look for
 * @returns tile positions
 */
export function findTiles(
  area: AreaId,
  letter: string,
): readonly { readonly tx: number; readonly ty: number }[] {
  const found: { tx: number; ty: number }[] = [];
  AREAS[area].rows.forEach((row, ty) => {
    for (let tx = 0; tx < row.length; tx++) {
      if (row[tx] === letter) {
        found.push({ tx, ty });
      }
    }
  });
  return found;
}

/**
 * The room a point lies in.
 *
 * @param area - which map
 * @param x - area pixels
 * @param y - area pixels
 * @returns the room number (row by row), or -1 in an open area
 */
export function roomAt(area: AreaId, x: number, y: number): number {
  const map = AREAS[area];
  let room = -1;
  if (map.roomed) {
    const perRow = map.cols / ROOM_COLS;
    const col = Math.min(
      perRow - 1,
      Math.max(0, Math.floor(x / (ROOM_COLS * TILE))),
    );
    const row = Math.min(
      map.rowCount / ROOM_ROWS - 1,
      Math.max(0, Math.floor(y / (ROOM_ROWS * TILE))),
    );
    room = row * perRow + col;
  }
  return room;
}

/**
 * The top-left corner of a room.
 *
 * @param area - which map
 * @param room - the room number
 * @returns its corner in area pixels
 */
export function roomOrigin(
  area: AreaId,
  room: number,
): { readonly x: number; readonly y: number } {
  const perRow = AREAS[area].cols / ROOM_COLS;
  return {
    x: (room % perRow) * ROOM_COLS * TILE,
    y: Math.floor(room / perRow) * ROOM_ROWS * TILE,
  };
}

/**
 * The middle of a tile.
 *
 * @param tx - tile column (may be fractional)
 * @param ty - tile row (may be fractional)
 * @returns the point in area pixels
 */
export function tileCentre(
  tx: number,
  ty: number,
): { readonly x: number; readonly y: number } {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

/** Measures one area's rows. */
function areaMap(rows: readonly string[], roomed: boolean): AreaMap {
  const cols = rows[0].length;
  return {
    rows,
    cols,
    rowCount: rows.length,
    width: cols * TILE,
    height: rows.length * TILE,
    roomed,
  };
}
