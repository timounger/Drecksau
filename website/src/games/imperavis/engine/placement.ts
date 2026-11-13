/**
 * The BuildingSystem's checks: may this building stand here, and if not,
 * why not - footprint, ground, slope, coast, collisions, territory, site
 * needs, unlocks and costs.
 *
 * @module
 */
import { BUILDING, WAREHOUSE_KINDS } from "./buildings-data";
import { roadAccess, siteFactor } from "./derived";
import { NO_ROAD } from "./logistics-data";
import {
  areaSlope,
  inBounds,
  isBuildableTerrain,
  seaAlong,
  terrainAt,
} from "./terrain";
import { buildOpen, cheatPays, guidedHolds } from "./cheat";
import { playerById } from "./players";
import type { Amounts, BuildingKind, Game, GoodId, Ship } from "./types";

/** Turns that bring a building back round. */
export const QUARTER_TURNS = 4;

/** Steepest a footprint may be, as corner height difference. */
export const MAX_SLOPE = 1.3;

/** Steepest a road tile may be. */
export const MAX_ROAD_SLOPE = 1.6;

/** A ship must lie this close to found a kontor, in tiles. */
export const FOUND_RANGE = 18;

/**
 * A ship counts as lying off an island when land of it is this close, in
 * tiles - close enough to offer settling it.
 */
export const SETTLE_REACH = 3;

/** Why a building may not stand somewhere. */
export type PlacementIssue =
  | "outside"
  | "water"
  | "terrain"
  | "slope"
  | "occupied"
  | "territory"
  | "coast"
  | "forest"
  | "deposit"
  | "fertility"
  | "fishing"
  | "locked"
  | "tutorial"
  | "gold"
  | "materials"
  | "noShip"
  | "shipCargo"
  | "notOwned"
  | "kontorExists"
  | "foreign";

/** The outcome of a placement check. */
export type Placement = {
  /** The first reason it cannot stand there, or null when it can. */
  readonly issue: PlacementIssue | null;
  /**
   * It may stand there and works, but no road touches it: carts reach it
   * over open land only, more slowly (producers and stores).
   */
  readonly noRoad: boolean;
  /** Footprint after rotation. */
  readonly w: number;
  readonly h: number;
  /** The ship that pays for a new kontor, or null. */
  readonly ship: Ship | null;
};

/**
 * What a kontor on a new island takes from the ship that founds it: its
 * cost without the gold, which comes from the treasury.
 */
export const KONTOR_KIT: Amounts = Object.fromEntries(
  Object.entries(BUILDING.kontor.cost).filter(([good]) => good !== "gold"),
) as Amounts;

/**
 * Footprint of a kind after rotation.
 *
 * @param kind - the building kind
 * @param rot - quarter turns
 * @returns width and height in tiles
 */
export function footprint(
  kind: BuildingKind,
  rot: number,
): { w: number; h: number } {
  const def = BUILDING[kind];
  return rot % 2 === 0 ? { w: def.w, h: def.h } : { w: def.h, h: def.w };
}

/**
 * Checks whether a building may be placed.
 *
 * @param game - the game
 * @param player - who wants to build
 * @param kind - what to build
 * @param x - left tile
 * @param y - top tile
 * @param rot - quarter turns
 * @param moving - the building being moved (ignored for collisions, costs nothing), or null
 * @returns the verdict
 */
export function checkPlacement(
  game: Game,
  player: number,
  kind: BuildingKind,
  x: number,
  y: number,
  rot: number,
  moving: number | null,
): Placement {
  const { w, h } = footprint(kind, rot);
  const world = game.world;
  const n = world.n;
  const def = BUILDING[kind];
  let issue: PlacementIssue | null = null;
  const island = inBounds(world, x, y) ? world.islandOf[y * n + x] : -1;
  const state = island >= 0 ? game.islands[island] : null;
  let ship: Ship | null = null;
  const set = (value: PlacementIssue) => {
    issue = issue ?? value;
  };
  const owner = playerById(game, player);
  if (owner === null || !buildOpen(game, player, kind)) {
    set("locked");
  } else if (moving === null && guidedHolds(game, player, kind)) {
    // The guided start holds it back a little longer (never the AI's, not
    // while the cheat is on).
    set("tutorial");
  }
  if (!inBounds(world, x, y) || !inBounds(world, x + w - 1, y + h - 1)) {
    set("outside");
  } else {
    for (let ty = y; ty < y + h; ty += 1) {
      for (let tx = x; tx < x + w; tx += 1) {
        const index = ty * n + tx;
        const ground = terrainAt(world, tx, ty);
        if (world.islandOf[index] !== island || world.islandOf[index] < 0) {
          set("water");
        } else if (!isBuildableTerrain(ground)) {
          set("terrain");
        }
        const taken = game.occupancy[index] - 1;
        if ((taken >= 0 && taken !== moving) || game.roads[index] !== NO_ROAD) {
          set("occupied");
        }
      }
    }
    if (areaSlope(world, x, y, w, h) > MAX_SLOPE) {
      set("slope");
    }
  }
  const isKontor = kind === "kontor";
  // A kontor founds a free island and is paid from a ship; each island holds
  // one kontor - the building area grows with warehouses and markets.
  const founding = isKontor && state !== null && state.owner < 0;
  if (issue === null && state !== null) {
    if (isKontor) {
      if (state.owner >= 0 && moving === null) {
        set(state.owner === player ? "kontorExists" : "foreign");
      }
    } else if (state.owner < 0) {
      set("notOwned");
    } else if (state.owner !== player) {
      set("foreign");
    } else if (!allInTerritory(game, x, y, w, h)) {
      set("territory");
    }
  }
  if (issue === null) {
    for (const need of def.needs) {
      if (need.type === "coast" && seaAlong(world, x, y, w, h) < 2) {
        set("coast");
      }
    }
    if (siteFactor(game, kind, x, y, w, h) <= 0) {
      const first = def.needs.find((need) => need.type !== "coast");
      const map: Record<string, PlacementIssue> = {
        forest: "forest",
        deposit: "deposit",
        fertility: "fertility",
        water: "fishing",
      };
      set(first !== undefined ? map[first.type] : "coast");
    }
  }
  if (issue === null && moving === null) {
    if ((owner?.gold ?? 0) < def.cost.gold) {
      set("gold");
    }
    if (founding) {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const near = shipInReach(game, player, cx, cy);
      ship = foundingShip(game, player, cx, cy, def.cost);
      if (ship === null && near !== null && cheatPays(game, player)) {
        // The cheat pays what the hold lacks; a ship must still lie there.
        ship = near;
      } else if (ship === null) {
        set(near === null ? "noShip" : "shipCargo");
      }
    } else if (state !== null && !hasAmounts(state.stock, def.cost)) {
      set("materials");
    }
  }
  const noRoad =
    issue === null &&
    (def.recipe !== null || WAREHOUSE_KINDS.includes(kind)) &&
    !touchesRoad(game, x, y, w, h);
  return { issue, noRoad, w, h, ship };
}

/**
 * Whether a store holds at least the given amounts (gold is ignored).
 *
 * @param stock - the goods at hand
 * @param amounts - what is needed
 * @returns true if all is there
 */
export function hasAmounts(
  stock: Amounts,
  amounts: Amounts & { gold?: number },
): boolean {
  return Object.entries(amounts).every(
    ([good, amount]) =>
      good === "gold" || (stock[good as GoodId] ?? 0) >= (amount as number),
  );
}

/**
 * Takes amounts out of a store (gold is ignored).
 *
 * @param stock - the goods at hand
 * @param amounts - what to take
 */
export function takeAmounts(
  stock: Amounts,
  amounts: Amounts & { gold?: number },
): void {
  for (const [good, amount] of Object.entries(amounts)) {
    if (good !== "gold") {
      stock[good as GoodId] = (stock[good as GoodId] ?? 0) - (amount as number);
    }
  }
}

/**
 * A ship of the player's close enough to a coast spot that carries what a
 * kontor costs.
 *
 * @param game - the game
 * @param player - whose ship
 * @param cx - spot, in tiles
 * @param cy - spot, in tiles
 * @param cost - the kontor's cost
 * @returns the ship or null
 */
export function foundingShip(
  game: Game,
  player: number,
  cx: number,
  cy: number,
  cost: Amounts,
): Ship | null {
  return (
    game.ships.find(
      (ship) =>
        ship.owner === player &&
        Math.hypot(ship.x - cx, ship.y - cy) <= FOUND_RANGE &&
        hasAmounts(ship.cargo, cost),
    ) ?? null
  );
}

/**
 * The player's ship nearest a coast spot within {@link FOUND_RANGE}, whatever
 * it carries.
 *
 * @param game - the game
 * @param player - whose ship
 * @param cx - spot, in tiles
 * @param cy - spot, in tiles
 * @returns the ship or null
 */
export function shipInReach(
  game: Game,
  player: number,
  cx: number,
  cy: number,
): Ship | null {
  let best: Ship | null = null;
  let bestDistance = FOUND_RANGE;
  for (const ship of game.ships) {
    const distance = Math.hypot(ship.x - cx, ship.y - cy);
    if (ship.owner === player && distance <= bestDistance) {
      best = ship;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * What a ship still lacks aboard to found a kontor.
 *
 * @param ship - the ship
 * @returns the missing goods and amounts (empty when it carries all)
 */
export function kontorShortfall(ship: Ship): Amounts {
  const missing: Amounts = {};
  for (const [good, amount] of Object.entries(KONTOR_KIT) as [
    GoodId,
    number,
  ][]) {
    const lack = amount - (ship.cargo[good] ?? 0);
    if (lack > 0) {
      missing[good] = lack;
    }
  }
  return missing;
}

/**
 * The free island whose land lies close to a spot at sea.
 *
 * @param game - the game
 * @param x - the spot, in tiles (a ship's position)
 * @param y - the spot, in tiles
 * @returns the island id, or -1 when no free land is within {@link SETTLE_REACH}
 */
export function freeCoastNear(game: Game, x: number, y: number): number {
  const world = game.world;
  const n = world.n;
  let island = -1;
  let best = Infinity;
  for (let dy = -SETTLE_REACH; dy <= SETTLE_REACH; dy += 1) {
    for (let dx = -SETTLE_REACH; dx <= SETTLE_REACH; dx += 1) {
      const tx = Math.floor(x) + dx;
      const ty = Math.floor(y) + dy;
      const distance = Math.hypot(dx, dy);
      const id = inBounds(world, tx, ty) ? world.islandOf[ty * n + tx] : -1;
      if (
        id >= 0 &&
        game.islands[id].owner < 0 &&
        distance <= SETTLE_REACH &&
        distance < best
      ) {
        best = distance;
        island = id;
      }
    }
  }
  return island;
}

/**
 * The spot for a kontor on an island closest to a ship: the first that the
 * usual checks allow (coast, free island, gold, the ship's cargo), so
 * settling from the ship's window follows the same rules as the build menu.
 *
 * @param game - the game
 * @param player - who settles
 * @param ship - the ship that carries the materials
 * @param island - the island to settle
 * @returns the top-left tile, or null when there is no allowed spot in reach
 */
export function settleSite(
  game: Game,
  player: number,
  ship: Ship,
  island: number,
): { x: number; y: number } | null {
  const world = game.world;
  const n = world.n;
  const size = BUILDING.kontor.w;
  let best: { x: number; y: number } | null = null;
  let bestDistance = Infinity;
  const left = Math.floor(ship.x - FOUND_RANGE);
  const top = Math.floor(ship.y - FOUND_RANGE);
  for (let y = top; y <= top + 2 * FOUND_RANGE; y += 1) {
    for (let x = left; x <= left + 2 * FOUND_RANGE; x += 1) {
      const distance = Math.hypot(x + size / 2 - ship.x, y + size / 2 - ship.y);
      // A cheap look at the corner first; the full check only for land of
      // the island that is nearer than the best spot so far.
      if (
        distance < bestDistance &&
        inBounds(world, x, y) &&
        world.islandOf[y * n + x] === island &&
        checkPlacement(game, player, "kontor", x, y, 0, null).issue === null
      ) {
        best = { x, y };
        bestDistance = distance;
      }
    }
  }
  return best;
}

/** Whether every tile of a rectangle is the player's land. */
function allInTerritory(
  game: Game,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  let result = true;
  const n = game.world.n;
  for (let ty = y; ty < y + h; ty += 1) {
    for (let tx = x; tx < x + w; tx += 1) {
      result = result && game.territory[ty * n + tx] === 1;
    }
  }
  return result;
}

/** Whether a road touches a rectangle from the side. */
function touchesRoad(
  game: Game,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  const probe = {
    id: -1,
    kind: "house" as const,
    x,
    y,
    rot: 0,
    w,
    h,
    island: -1,
    built: 0,
    complete: false,
    paused: false,
    prod: null,
    house: null,
    yard: null,
    drill: null,
    hp: 0,
    priority: false,
    level: 0,
    fire: 0,
    hitAt: 0,
    reload: 0,
  };
  return roadAccess(game, probe).length > 0;
}
