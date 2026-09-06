/**
 * Laying out Los Santos: streets, blocks, the beach and the four districts.
 *
 * @module
 * @remarks
 * A grid city, because a grid is what a top-down car game needs: every corner
 * is a decision, and a chase has somewhere to go. The blocks between the
 * streets are buildings with a pavement around them, so a person on foot always
 * has a way past and a car always has a kerb to mount.
 *
 * The city is the same every time. A city that reshuffled itself would take
 * away the one thing that makes an open world an open world - that after an
 * hour you know where you are.
 */
import {
  BLOCK_TILES,
  CITY_TILES,
  TILE,
  type Cell,
  type District,
  type Vec,
} from "./types";
import { buildingAt, type BuildingKind } from "./buildings";

/** How many cells of a block are pavement on each side. */
const WALK_RING = 1;

/** Where the door of a block is, across it: the middle of its three houses. */
const DOOR_ACROSS = 3.5;

/** And down: the pavement south of the front wall. */
const DOOR_DOWN = 5.5;

/** How wide the beach strip along the bottom is, in cells. */
const BEACH_TILES = 5;

/** How deep the water beyond the beach is, in cells. */
const WATER_TILES = 3;

/** Every third block is a park rather than houses, on this rhythm. */
const PARK_EVERY = 3;

/**
 * Builds the city floor.
 *
 * @returns one cell per grid square, row by row
 */
export function createCity(): readonly Cell[] {
  const cells: Cell[] = [];
  for (let row = 0; row < CITY_TILES; row += 1) {
    for (let col = 0; col < CITY_TILES; col += 1) {
      cells.push(cellAt(col, row));
    }
  }
  return cells;
}

/** What one square of the city is. */
function cellAt(col: number, row: number): Cell {
  const fromBottom = CITY_TILES - row;
  let cell: Cell;
  if (fromBottom <= WATER_TILES) {
    cell = "water";
  } else if (fromBottom <= WATER_TILES + BEACH_TILES) {
    cell = "park";
  } else if (isRoad(col) || isRoad(row)) {
    cell = "road";
  } else if (nextToRoad(col) || nextToRoad(row)) {
    cell = "walk";
  } else if (isParkBlock(col, row)) {
    cell = "park";
  } else {
    cell = "building";
  }
  return cell;
}

/** Whether this line of the grid is a street. */
function isRoad(at: number): boolean {
  return at % BLOCK_TILES === 0;
}

/** Whether this line is the pavement beside a street. */
function nextToRoad(at: number): boolean {
  const into = at % BLOCK_TILES;
  return into <= WALK_RING || into >= BLOCK_TILES - WALK_RING;
}

/** Whether the block at this square is a green one rather than houses. */
function isParkBlock(col: number, row: number): boolean {
  const blockX = Math.floor(col / BLOCK_TILES);
  const blockY = Math.floor(row / BLOCK_TILES);
  return (
    (blockX + blockY * 2) % PARK_EVERY === 0 && (blockX + blockY) % 2 === 0
  );
}

/**
 * The cell at a point in the city.
 *
 * @param cells - the city floor
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns what is under it; outside the city counts as water
 */
export function cellUnder(cells: readonly Cell[], x: number, y: number): Cell {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  const inside = col >= 0 && row >= 0 && col < CITY_TILES && row < CITY_TILES;
  return inside ? cells[row * CITY_TILES + col] : "water";
}

/**
 * Whether a point can be stood on at all.
 *
 * @param cells - the city floor
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns true for anything but a building or the sea
 */
export function isOpen(cells: readonly Cell[], x: number, y: number): boolean {
  const cell = cellUnder(cells, x, y);
  return cell !== "building" && cell !== "water";
}

/**
 * Whether a point is on the tarmac.
 *
 * @param cells - the city floor
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns true on a street
 */
export function isRoadAt(
  cells: readonly Cell[],
  x: number,
  y: number,
): boolean {
  return cellUnder(cells, x, y) === "road";
}

/**
 * The middle of the nearest street crossing.
 *
 * @param x - a point in the city, in pixels
 * @param y - a point in the city, in pixels
 * @returns the crossing a car would aim for
 */
export function nearestCrossing(x: number, y: number): Vec {
  const step = BLOCK_TILES * TILE;
  return {
    x: Math.round(x / step) * step + TILE / 2,
    y: Math.round(y / step) * step + TILE / 2,
  };
}

/**
 * The pavement in front of every building of one sort.
 *
 * @param kind - the sort of building to look for
 * @returns one point per block, on the street side of its door
 * @remarks
 * The city plan is the same every time, so this is a fixed list rather than a
 * search that has to be repeated: whoever wants to stand outside the night club
 * asks once at the start and remembers the answer.
 */
export function doorsOf(kind: BuildingKind): readonly Vec[] {
  const blocks = CITY_TILES / BLOCK_TILES;
  const doors: Vec[] = [];
  for (let blockY = 0; blockY < blocks; blockY += 1) {
    for (let blockX = 0; blockX < blocks; blockX += 1) {
      if (buildingAt(blockX, blockY).kind === kind) {
        // The middle of the block, one cell south of its front wall: the
        // pavement people would actually stand on.
        doors.push({
          x: (blockX * BLOCK_TILES + DOOR_ACROSS) * TILE,
          y: (blockY * BLOCK_TILES + DOOR_DOWN) * TILE,
        });
      }
    }
  }
  return doors;
}

/**
 * Which district a point belongs to.
 *
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns the quarter of town it lies in
 * @remarks
 * Four quarters, cut down the middle of the map: the beach along the south
 * belongs to whichever half it lies under, because a strip of sand is not a
 * neighbourhood anybody fights over.
 */
export function districtAt(x: number, y: number): District {
  const half = (CITY_TILES * TILE) / 2;
  let district: District;
  if (y > half) {
    district = x < half ? "beach" : "vagos";
  } else {
    district = x < half ? "grove" : "ballas";
  }
  return district;
}

/**
 * A point somewhere in the middle of a district.
 *
 * @param district - which quarter
 * @returns a point a marker can be put near
 */
export function districtCentre(district: District): Vec {
  const half = (CITY_TILES * TILE) / 2;
  const quarter = half / 2;
  const spots: Readonly<Record<District, Vec>> = {
    grove: { x: quarter, y: quarter },
    ballas: { x: half + quarter, y: quarter },
    beach: { x: quarter, y: half + quarter },
    vagos: { x: half + quarter, y: half + quarter },
  };
  return spots[district];
}
