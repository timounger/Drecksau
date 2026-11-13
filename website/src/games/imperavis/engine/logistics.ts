/**
 * The logistics: which ground a store's carts may cross and how fast they
 * go there, the way from each store to every producer it serves - by road
 * where there is one, over open land where not - and how a producer's
 * transport stands, for the screen.
 *
 * @module
 * @remarks
 * Production does not wait for roads: a producer works into its own store
 * and stops only when that is full. Roads make the carts that empty it and
 * bring its inputs faster. The ways are searched once per store whenever
 * buildings or roads change (with the other derived grids, never per step)
 * and kept in {@link Game.links}; carts take them from there.
 */
import { BUILDING, OUTPUT_CAPACITY, WAREHOUSE_KINDS } from "./buildings-data";
import {
  CART_SPEED,
  COLLECT_FROM,
  FOREST_SPEED,
  LAND_MARGIN,
  LAND_SPEED,
  NO_ROAD,
  PAVED_ROAD,
  PAVED_SPEED,
  ROAD_SPEED,
  ROCK_SPEED,
  WAY_SEARCH,
} from "./logistics-data";
import { explore } from "./pathfinding";
import { inBounds, TILE_CENTER } from "./terrain";
import { Terrain, type Building, type Game, type LinkKind } from "./types";

/** How the transport of a producer stands. */
export type TransportState =
  /** No store's carts can reach it. */
  | "noWay"
  /** Its store of goods is full: it waits for a cart and does not work. */
  | "full"
  /** A cart is on its way there or back. */
  | "underway"
  /** Goods wait for a cart. */
  | "waiting"
  /** Nothing to fetch yet. */
  | "idle";

/**
 * Tiles that touch a building from the side (not the corners), in a fixed
 * order: column by column, from the left.
 *
 * @param game - the game
 * @param building - the building (or a footprint shaped like one)
 * @returns tile indices on the map
 */
export function sideTiles(
  game: Game,
  building: Pick<Building, "x" | "y" | "w" | "h">,
): number[] {
  const n = game.world.n;
  const result: number[] = [];
  for (let x = building.x - 1; x <= building.x + building.w; x += 1) {
    for (let y = building.y - 1; y <= building.y + building.h; y += 1) {
      const side =
        (x === building.x - 1 || x === building.x + building.w) !==
        (y === building.y - 1 || y === building.y + building.h);
      if (side && inBounds(game.world, x, y)) {
        result.push(y * n + x);
      }
    }
  }
  return result;
}

/**
 * Speed share of a cart on a tile: paved or plain road, standing forest,
 * rock or open land (see `logistics-data.ts`).
 *
 * @param game - the game
 * @param index - the tile
 * @returns the share of {@link CART_SPEED}
 */
export function tileSpeed(game: Game, index: number): number {
  const road = game.roads[index];
  let speed = LAND_SPEED;
  if (road === PAVED_ROAD) {
    speed = PAVED_SPEED;
  } else if (road !== NO_ROAD) {
    speed = ROAD_SPEED;
  } else if (
    game.world.terrain[index] === Terrain.Forest &&
    game.cleared[index] === 0
  ) {
    speed = FOREST_SPEED;
  } else if (game.world.terrain[index] === Terrain.Rock) {
    speed = ROCK_SPEED;
  }
  return speed;
}

/**
 * Seconds a cart needs along a way without traffic.
 *
 * @param game - the game
 * @param path - the tiles
 * @returns the seconds
 */
export function travelSeconds(game: Game, path: readonly number[]): number {
  let seconds = 0;
  for (const index of path) {
    seconds += 1 / (CART_SPEED * tileSpeed(game, index));
  }
  return seconds;
}

/**
 * Finds, for every producer, the store whose carts reach it fastest and
 * the way they take; sets each producer's store and fills
 * {@link Game.links}.
 *
 * @param game - the game
 * @remarks
 * A store serves the producers of its island whose centre lies within its
 * reach plus half their size, as before; new is that its carts may cross
 * open land (meadow, beach, forest and rock, the building grounds; not
 * mountains, rivers, water or buildings) within that reach plus
 * {@link LAND_MARGIN}, and roads anywhere. One search per store; ties go to
 * the store that comes first. Islands are apart, so only the islands where
 * a road, a building or a finished store changed since the last time are
 * searched again; the others keep their ways, which come out the same.
 */
export function assignLinks(game: Game): void {
  const changed = changedIslands(game);
  const stores = game.buildings.filter(
    (b) =>
      WAREHOUSE_KINDS.includes(b.kind) && b.complete && changed.has(b.island),
  );
  const byId = new Map(game.buildings.map((b) => [b.id, b]));
  const kept = new Map(
    [...game.links].filter(([id]) => {
      const building = byId.get(id);
      return building !== undefined && !changed.has(building.island);
    }),
  );
  game.links.clear();
  for (const [id, link] of kept) {
    game.links.set(id, link);
  }
  const producers = game.buildings.filter(
    (b) => b.prod !== null && changed.has(b.island),
  );
  const sides = producers.map((building) => sideTiles(game, building));
  const best = producers.map(() => Number.POSITIVE_INFINITY);
  for (const store of stores) {
    searchFrom(game, store, producers, sides, best);
  }
  for (const building of producers) {
    if (building.prod !== null) {
      building.prod.warehouse = game.links.get(building.id)?.warehouse ?? -1;
    }
  }
}

/**
 * How a building is joined to its store.
 *
 * @param game - the game
 * @param building - a producer
 * @returns road, land or none
 */
export function linkKind(game: Game, building: Building): LinkKind {
  return game.links.get(building.id)?.kind ?? "none";
}

/**
 * How the transport of a producer stands right now.
 *
 * @param game - the game
 * @param building - a producer
 * @returns its state
 */
export function transportState(game: Game, building: Building): TransportState {
  const prod = building.prod;
  const recipe = BUILDING[building.kind].recipe;
  let state: TransportState = "idle";
  if (!game.links.has(building.id)) {
    state = "noWay";
  } else if (game.carts.some((cart) => cart.target === building.id)) {
    state = "underway";
  } else if (
    prod !== null &&
    recipe !== null &&
    prod.output + recipe.amount > OUTPUT_CAPACITY
  ) {
    state = "full";
  } else if (prod !== null && prod.output >= COLLECT_FROM) {
    state = "waiting";
  }
  return state;
}

/** What the ways were found on: roads, buildings and finished stores. */
type Snapshot = {
  readonly roads: Uint8Array;
  readonly occupancy: Int32Array;
  /** The finished stores of each island, as a list of ids. */
  readonly stores: Map<number, string>;
};

/** The last snapshot of each game (derived, never saved). */
const snapshots = new WeakMap<Game, Snapshot>();

/**
 * The islands whose roads, buildings or finished stores changed since the
 * last search (all of them the first time), and a fresh snapshot.
 */
function changedIslands(game: Game): Set<number> {
  const world = game.world;
  const last = snapshots.get(game);
  const stores = new Map<number, string>();
  for (const b of game.buildings) {
    if (WAREHOUSE_KINDS.includes(b.kind) && b.complete) {
      stores.set(b.island, `${stores.get(b.island) ?? ""},${b.id}`);
    }
  }
  const changed = new Set<number>();
  for (const island of world.islands) {
    if (
      last === undefined ||
      last.stores.get(island.id) !== stores.get(island.id)
    ) {
      changed.add(island.id);
    }
  }
  if (last !== undefined) {
    for (let i = 0; i < game.roads.length; i += 1) {
      if (
        (last.roads[i] !== game.roads[i] ||
          last.occupancy[i] !== game.occupancy[i]) &&
        world.islandOf[i] >= 0
      ) {
        changed.add(world.islandOf[i]);
      }
    }
  }
  snapshots.set(game, {
    roads: game.roads.slice(),
    occupancy: game.occupancy.slice(),
    stores,
  });
  return changed;
}

/**
 * Whether a cart of a store may cross a tile: any road, or open land of the
 * store's island near enough to it.
 */
function crossable(
  game: Game,
  index: number,
  island: number,
  cx: number,
  cy: number,
  reach: number,
): boolean {
  const world = game.world;
  const n = world.n;
  const dx = (index % n) + TILE_CENTER - cx;
  const dy = Math.floor(index / n) + TILE_CENTER - cy;
  const ground = world.terrain[index] as Terrain;
  return (
    game.roads[index] !== NO_ROAD ||
    (world.islandOf[index] === island &&
      game.occupancy[index] === 0 &&
      (ground === Terrain.Meadow ||
        ground === Terrain.Beach ||
        ground === Terrain.Forest ||
        ground === Terrain.Rock) &&
      dx * dx + dy * dy <= reach * reach)
  );
}

/** One store's search: improves the links of the producers it reaches. */
function searchFrom(
  game: Game,
  store: Building,
  producers: readonly Building[],
  sides: readonly number[][],
  best: number[],
): void {
  const cx = store.x + store.w / 2;
  const cy = store.y + store.h / 2;
  const radius = BUILDING[store.kind].radius;
  const land = radius + LAND_MARGIN;
  const cost = (index: number) =>
    crossable(game, index, store.island, cx, cy, land)
      ? 1 / (CART_SPEED * tileSpeed(game, index))
      : Number.POSITIVE_INFINITY;
  const starts = sideTiles(game, store).filter(
    (index) => cost(index) < Number.POSITIVE_INFINITY,
  );
  const spread = explore({
    n: game.world.n,
    from: starts,
    cost,
    diagonal: false,
    limit: WAY_SEARCH,
  });
  producers.forEach((building, index) => {
    const px = building.x + building.w / 2;
    const py = building.y + building.h / 2;
    const near =
      starts.length > 0 &&
      building.island === store.island &&
      Math.hypot(px - cx, py - cy) <=
        radius + Math.max(building.w, building.h) / 2;
    let tile = -1;
    for (const side of near ? sides[index] : []) {
      const seconds = spread.costTo(side);
      if (seconds < best[index]) {
        best[index] = seconds;
        tile = side;
      }
    }
    if (tile >= 0) {
      const path = spread.pathTo(tile);
      game.links.set(building.id, {
        warehouse: store.id,
        path,
        seconds: travelSeconds(game, path),
        kind: path.every((at) => game.roads[at] !== NO_ROAD) ? "road" : "land",
      });
    }
  });
}
