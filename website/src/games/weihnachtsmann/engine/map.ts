/**
 * Turning the map rows into a walkable map, and asking it where one may go.
 *
 * @module
 */
import { FLY_HEIGHT, type MoveProfile } from "./cast";
import { GRANTEL_HOUSE, WORKSHOP } from "./interior-data";
import { OUTDOORS } from "./map-data";
import type {
  AreaData,
  AreaId,
  BigObjectKind,
  CellBox,
  Character,
  GameMap,
  GameState,
  Ground,
  PlacedObject,
  SmallObjectKind,
  Terrain,
} from "./types";

/** Size of a map cell, map px. */
export const TILE = 16;

/** How many cells wide an Advent gate's footprint is; it is one cell deep. */
export const GATE_WIDTH = 3;

/** Every place by id, as written in the data files. */
const AREAS: Readonly<Record<AreaId, AreaData>> = {
  outdoors: OUTDOORS,
  workshop: WORKSHOP,
  grantelHouse: GRANTEL_HOUSE,
};

/**
 * Footprint of each big object as rows of cells: `X` blocks, `.` stays free.
 * The picture stands centred on it, its bottom on the footprint's bottom.
 */
export const BIG_SHAPES: Readonly<Record<BigObjectKind, readonly string[]>> = {
  dome: [".XXXXXXXX.", "XXXXXXXXXX", "XXXXXXXXXX", ".XXXXXXXX."],
  paintedTree: Array.from({ length: 10 }, () => "........"),
  sleigh: ["XX"],
  grantelMain: ["XXXXX", "XXXXX", "XXXXX", "XXXXX"],
  grantelWing: ["XXX", "XXX", "XXX", "XXX", "XXX"],
  toyMachine: ["XXXXXXXX", "XXXXXXXX"],
  workbench: ["XXX"],
  toyShelf: ["XXX"],
  toyShelfLadder: ["XXX"],
  armchair: ["XX"],
  fireplace: ["XXX"],
  wishBoard: ["XX"],
  ampStack: ["XX"],
  drumKit: ["XXX"],
  guitarStand: ["X"],
  organ: ["XXXX"],
  candelabra: ["X"],
  creepyChair: ["XX"],
};

/** Big objects lying flat on the ground: drawn under everybody. */
export const FLAT_OBJECTS: ReadonlySet<BigObjectKind> = new Set([
  "paintedTree",
]);

/* eslint-disable @typescript-eslint/no-magic-numbers -- places matching the
   art of the big objects */
/**
 * Where smoke leaves each chimney, map px from the top left of the
 * footprint (the roof reaches above it).
 */
export const CHIMNEYS: Readonly<
  Partial<Record<BigObjectKind, readonly [number, number]>>
> = {
  grantelMain: [64, -50],
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** What each letter of the rows means. */
const LETTERS: Readonly<
  Record<
    string,
    {
      readonly terrain: Terrain;
      readonly ground: Ground;
      readonly small: SmallObjectKind | null;
    }
  >
> = {
  ".": { terrain: "snow", ground: "snow", small: null },
  ":": { terrain: "path", ground: "path", small: null },
  "~": { terrain: "ice", ground: "ice", small: null },
  w: { terrain: "water", ground: "water", small: null },
  T: { terrain: "tree", ground: "snow", small: "tree" },
  t: { terrain: "tree", ground: "snow", small: "smallTree" },
  b: { terrain: "thing", ground: "snow", small: "deadBush" },
  x: { terrain: "thing", ground: "snow", small: "crookedSign" },
  _: { terrain: "floor", ground: "floor", small: null },
  X: { terrain: "wall", ground: "floor", small: null },
  "#": { terrain: "fence", ground: "snow", small: null },
  o: { terrain: "rock", ground: "snow", small: "rock" },
  d: { terrain: "drift", ground: "snow", small: "drift" },
  s: { terrain: "thing", ground: "snow", small: "snowman" },
  l: { terrain: "thing", ground: "snow", small: "lamp" },
  g: { terrain: "thing", ground: "snow", small: "gifts" },
};

/** Ground everybody can walk on. */
const OPEN: ReadonlySet<Terrain> = new Set(["snow", "path", "ice", "floor"]);

/* eslint-disable @typescript-eslint/no-magic-numbers -- the four bits of a
   fence piece */
/** Fence neighbour bits: up, right, down, left. */
const FENCE_BITS: readonly (readonly [number, number, number])[] = [
  [0, -1, 1],
  [1, 0, 2],
  [0, 1, 4],
  [-1, 0, 8],
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * Builds every place from the data files.
 *
 * @returns the maps by place
 */
export function buildMaps(): Record<AreaId, GameMap> {
  return {
    outdoors: buildMap("outdoors"),
    workshop: buildMap("workshop"),
    grantelHouse: buildMap("grantelHouse"),
  };
}

/**
 * Builds one place from its rows, objects, doors, spots and gates.
 *
 * @param area - which place
 * @param data - what it is made of; by default from the data files
 * @returns the map
 */
export function buildMap(area: AreaId, data: AreaData = AREAS[area]): GameMap {
  const rows = data.rows;
  const objects: readonly PlacedObject[] = data.objects;
  const cols = rows[0]?.length ?? 0;
  const terrain: Terrain[] = [];
  const ground: Ground[] = [];
  const small: (SmallObjectKind | null)[] = [];
  const fence: number[] = [];
  rows.forEach((row) => {
    for (const letter of row) {
      const meaning = LETTERS[letter] ?? LETTERS["."];
      terrain.push(meaning.terrain);
      ground.push(meaning.ground);
      small.push(meaning.small);
    }
  });
  rows.forEach((row, ty) => {
    for (let tx = 0; tx < cols; tx += 1) {
      let bits = -1;
      if (row[tx] === "#") {
        bits = 0;
        for (const [dx, dy, bit] of FENCE_BITS) {
          if (rows[ty + dy]?.[tx + dx] === "#") {
            bits |= bit;
          }
        }
      }
      fence.push(bits);
    }
  });
  for (const object of objects) {
    BIG_SHAPES[object.kind].forEach((line, dy) => {
      const ty = object.ty + dy;
      [...line].forEach((cell, dx) => {
        const tx = object.tx + dx;
        if (
          cell === "X" &&
          tx >= 0 &&
          tx < cols &&
          ty >= 0 &&
          ty < rows.length
        ) {
          terrain[ty * cols + tx] = "building";
        }
      });
    });
  }
  for (const gate of data.gates) {
    for (let dx = 0; dx < GATE_WIDTH; dx += 1) {
      const tx = gate.tx + dx;
      if (tx >= 0 && tx < cols && gate.ty >= 0 && gate.ty < rows.length) {
        terrain[gate.ty * cols + tx] = "building";
      }
    }
  }
  return {
    area,
    cols,
    rows: rows.length,
    terrain,
    ground,
    small,
    fence,
    objects,
    doors: data.doors,
    spots: data.spots,
    gates: data.gates,
    shade: data.shade,
  };
}

/**
 * The size of a big object's footprint.
 *
 * @param kind - the object
 * @returns columns and rows of cells
 */
export function footprint(kind: BigObjectKind): {
  cols: number;
  rows: number;
} {
  const shape = BIG_SHAPES[kind];
  return { cols: shape[0]?.length ?? 0, rows: shape.length };
}

/**
 * The map of the place a character is in.
 *
 * @param state - the game
 * @param char - the character
 * @returns its map
 */
export function areaMap(state: GameState, char: Character): GameMap {
  return state.maps[char.area];
}

/**
 * Whether a point lies inside a box of cells, give or take some slack.
 *
 * @param box - the cells
 * @param x - map px
 * @param y - map px
 * @param slack - how far outside still counts, map px
 * @returns true when inside
 */
export function inBox(box: CellBox, x: number, y: number, slack = 0): boolean {
  return (
    x >= box.tx * TILE - slack &&
    x < (box.tx + box.w) * TILE + slack &&
    y >= box.ty * TILE - slack &&
    y < (box.ty + box.h) * TILE + slack
  );
}

/**
 * What a cell is made of.
 *
 * @param map - the map
 * @param tx - column
 * @param ty - row
 * @returns its terrain; outside the map counts as trees
 */
export function terrainAt(map: GameMap, tx: number, ty: number): Terrain {
  let result: Terrain = "tree";
  if (tx >= 0 && ty >= 0 && tx < map.cols && ty < map.rows) {
    result = map.terrain[ty * map.cols + tx];
  }
  return result;
}

/**
 * What lies under a point.
 *
 * @param map - the map
 * @param x - map px
 * @param y - map px
 * @returns the terrain of the cell holding it
 */
export function terrainUnder(map: GameMap, x: number, y: number): Terrain {
  return terrainAt(map, Math.floor(x / TILE), Math.floor(y / TILE));
}

/**
 * Whether a figure moving like this may be on this terrain.
 *
 * @param profile - how it moves
 * @param terrain - the ground
 * @returns true when it may enter
 */
export function mayEnter(profile: MoveProfile, terrain: Terrain): boolean {
  return profile.flies || OPEN.has(terrain) || profile.passes.includes(terrain);
}

/**
 * Whether a figure's feet fit at a place: inside the map and, unless it flies,
 * on ground it may enter.
 *
 * @param map - the map
 * @param profile - how it moves, for its foot box and what it may enter
 * @param x - feet, map px
 * @param y - feet, map px
 * @returns true when it can stand there
 */
export function fits(
  map: GameMap,
  profile: MoveProfile,
  x: number,
  y: number,
): boolean {
  const left = x - profile.footW / 2;
  const right = x + profile.footW / 2;
  const top = y - profile.footH;
  // Keep the whole figure on the map: a flyer's head rides higher still.
  const ceiling = profile.height + (profile.flies ? FLY_HEIGHT : 0);
  let free =
    left >= 0 &&
    y - ceiling >= 0 &&
    right <= map.cols * TILE &&
    y <= map.rows * TILE;
  if (free && !profile.flies) {
    const x0 = Math.floor(left / TILE);
    const x1 = Math.floor((right - 1) / TILE);
    const y0 = Math.floor(top / TILE);
    const y1 = Math.floor((y - 1) / TILE);
    for (let ty = y0; ty <= y1 && free; ty += 1) {
      for (let tx = x0; tx <= x1 && free; tx += 1) {
        free = mayEnter(profile, terrainAt(map, tx, ty));
      }
    }
  }
  return free;
}

/**
 * The map's size.
 *
 * @param map - the map
 * @returns width and height in map px
 */
export function mapSize(map: GameMap): { w: number; h: number } {
  return { w: map.cols * TILE, h: map.rows * TILE };
}
