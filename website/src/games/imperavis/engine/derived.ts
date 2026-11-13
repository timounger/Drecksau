/**
 * Grids derived from the buildings and roads: which tile is taken, where
 * the player may build, which houses public buildings reach, which store's
 * carts serve which producer and on what way, and how well each site suits
 * its work.
 *
 * @module
 * @remarks
 * Rebuilt only when something was built, moved or torn down, never per step.
 */
import { BUILDING, DECOR_KINDS, SERVICE_KINDS } from "./buildings-data";
import { NO_ROAD } from "./logistics-data";
import { assignLinks, sideTiles } from "./logistics";
import { countAround, inBounds, isSea, TILE_CENTER } from "./terrain";
import {
  Terrain,
  type Building,
  type BuildingKind,
  type Game,
  type SiteNeed,
} from "./types";

/**
 * Rebuilds all derived grids if something changed.
 *
 * @param game - the game
 */
export function refreshDerived(game: Game): void {
  if (game.dirty) {
    game.dirty = false;
    game.version += 1;
    rebuildOccupancy(game);
    rebuildTerritory(game);
    rebuildCoverage(game);
    assignLinks(game);
    rateSites(game);
  }
}

/**
 * Marks a new building's tiles as taken at once, so that further sites
 * checked before the next full refresh do not overlap it. The full refresh
 * (the game stays dirty) writes the same values.
 *
 * @param game - the game
 * @param building - the building just placed
 */
export function markOccupied(game: Game, building: Building): void {
  const n = game.world.n;
  for (let y = building.y; y < building.y + building.h; y += 1) {
    for (let x = building.x; x < building.x + building.w; x += 1) {
      game.occupancy[y * n + x] = building.id + 1;
    }
  }
}

/**
 * Centre of a building in tiles.
 *
 * @param building - the building
 * @returns its centre
 */
export function centerOf(building: Building): { x: number; y: number } {
  return { x: building.x + building.w / 2, y: building.y + building.h / 2 };
}

/**
 * Road tiles that touch a building from the side.
 *
 * @param game - the game
 * @param building - the building
 * @returns tile indices
 */
export function roadAccess(game: Game, building: Building): number[] {
  return sideTiles(game, building).filter(
    (index) => game.roads[index] !== NO_ROAD,
  );
}

/**
 * The building standing on a tile.
 *
 * @param game - the game
 * @param x - tile column
 * @param y - tile row
 * @returns the building or null
 */
export function buildingAt(game: Game, x: number, y: number): Building | null {
  let result: Building | null = null;
  if (inBounds(game.world, x, y)) {
    const id = game.occupancy[y * game.world.n + x] - 1;
    result = id >= 0 ? (game.buildings.find((b) => b.id === id) ?? null) : null;
  }
  return result;
}

/**
 * How well a site suits a building's work, 0 to 1.
 *
 * @param game - the game
 * @param kind - the building kind
 * @param x - left tile
 * @param y - top tile
 * @param w - width
 * @param h - height
 * @returns the factor; 0 means it cannot work there
 */
export function siteFactor(
  game: Game,
  kind: BuildingKind,
  x: number,
  y: number,
  w: number,
  h: number,
): number {
  const world = game.world;
  let factor = 1;
  for (const need of BUILDING[kind].needs) {
    factor = Math.min(factor, needFactor(game, need, x, y, w, h));
  }
  // An island that is not fertile grows nothing, wherever the farm stands.
  const island = world.islandOf[y * world.n + x];
  for (const need of BUILDING[kind].needs) {
    if (need.type === "fertility" && island >= 0) {
      factor = world.islands[island].fertile[need.crop] ? factor : 0;
    }
  }
  return factor;
}

/** How well one site need is met. */
function needFactor(
  game: Game,
  need: SiteNeed,
  x: number,
  y: number,
  w: number,
  h: number,
): number {
  const world = game.world;
  let result = 1;
  switch (need.type) {
    case "forest": {
      const trees = countAround(
        world,
        x,
        y,
        w,
        h,
        need.radius,
        (index) =>
          world.terrain[index] === Terrain.Forest &&
          game.cleared[index] === 0 &&
          game.occupancy[index] === 0 &&
          game.roads[index] === 0,
      );
      // Half the wanted trees still keep it going, slowly.
      result = trees < need.min / 2 ? 0 : Math.min(1, trees / (need.min * 2));
      break;
    }
    case "deposit": {
      const found = countAround(
        world,
        x,
        y,
        w,
        h,
        need.radius,
        (index) => world.deposits[index] === need.deposit,
      );
      result = found > 0 ? 1 : 0;
      break;
    }
    case "water": {
      const water = countAround(world, x, y, w, h, need.radius, (index) =>
        isSea(world.terrain[index] as Terrain),
      );
      result = water < need.min ? 0 : Math.min(1, water / (need.min * 2));
      break;
    }
    default:
      result = 1;
  }
  return result;
}

/** Marks every tile a building stands on. */
function rebuildOccupancy(game: Game): void {
  const n = game.world.n;
  game.occupancy.fill(0);
  for (const building of game.buildings) {
    for (let y = building.y; y < building.y + building.h; y += 1) {
      for (let x = building.x; x < building.x + building.w; x += 1) {
        game.occupancy[y * n + x] = building.id + 1;
      }
    }
  }
}

/** Marks the land claimed by kontors and markets. */
function rebuildTerritory(game: Game): void {
  const world = game.world;
  const n = world.n;
  game.territory.fill(0);
  for (const building of game.buildings) {
    const radius = BUILDING[building.kind].influence;
    if (radius > 0) {
      paintCircle(game, building, radius, game.territory, true);
    }
  }
  // Water and other islands are never the player's land.
  for (let i = 0; i < n * n; i += 1) {
    if (world.islandOf[i] < 0) {
      game.territory[i] = 0;
    }
  }
}

/** Marks the tiles each public building and each decoration reaches. */
function rebuildCoverage(game: Game): void {
  const n = game.world.n;
  // The grids are reused: cleared, not made anew, to spare the memory.
  const coverage: Partial<Record<BuildingKind, Uint8Array>> = {};
  for (const kind of [...SERVICE_KINDS, ...DECOR_KINDS]) {
    const old = game.coverage[kind];
    coverage[kind] =
      old?.length === n * n ? old.fill(0) : new Uint8Array(n * n);
  }
  for (const building of game.buildings) {
    const grid = coverage[building.kind];
    if (grid !== undefined && building.complete) {
      paintCircle(game, building, BUILDING[building.kind].radius, grid, true);
    }
  }
  game.coverage = coverage;
}

/** Sets 1 on tiles of the building's island within a radius of its centre. */
function paintCircle(
  game: Game,
  building: Building,
  radius: number,
  grid: Uint8Array,
  sameIsland: boolean,
): void {
  const world = game.world;
  const n = world.n;
  const { x: cx, y: cy } = centerOf(building);
  for (let y = Math.floor(cy - radius); y <= cy + radius; y += 1) {
    for (let x = Math.floor(cx - radius); x <= cx + radius; x += 1) {
      const dx = x + TILE_CENTER - cx;
      const dy = y + TILE_CENTER - cy;
      if (
        inBounds(world, x, y) &&
        dx * dx + dy * dy <= radius * radius &&
        (!sameIsland || world.islandOf[y * n + x] === building.island)
      ) {
        grid[y * n + x] = 1;
      }
    }
  }
}

/** Updates how well each producer's site suits it. */
function rateSites(game: Game): void {
  for (const building of game.buildings) {
    if (building.prod !== null) {
      building.prod.site = siteFactor(
        game,
        building.kind,
        building.x,
        building.y,
        building.w,
        building.h,
      );
    }
  }
}
