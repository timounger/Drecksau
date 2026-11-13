/**
 * The RoadSystem: planning a road between two tiles with A* (existing roads
 * are cheap to follow), laying it, and paving plain roads - the second
 * stage, on which carts drive fastest.
 *
 * @module
 */
import { spend } from "./economy";
import { NO_ROAD, PAVE_COST, PAVED_ROAD, PLAIN_ROAD } from "./logistics-data";
import { findPath } from "./pathfinding";
import { MAX_ROAD_SLOPE } from "./placement";
import { playerById } from "./players";
import { areaSlope, isBuildableTerrain } from "./terrain";
import type { Game, Terrain } from "./types";

/** Gold per new road tile. */
export const ROAD_COST = 3;

/** Following an existing road costs this share of a new tile. */
const EXISTING = 0.5;

/** Tiles a road search may expand. */
const ROAD_SEARCH = 20000;

/**
 * Whether a road may be laid on a tile.
 *
 * @param game - the game
 * @param player - who wants to lay it
 * @param index - the tile
 * @returns true if free, the player's and not too steep
 */
export function canLayRoad(game: Game, player: number, index: number): boolean {
  const world = game.world;
  const x = index % world.n;
  const y = Math.floor(index / world.n);
  return (
    game.territory[index] === 1 &&
    game.islands[world.islandOf[index]]?.owner === player &&
    game.occupancy[index] === 0 &&
    isBuildableTerrain(world.terrain[index] as Terrain) &&
    areaSlope(world, x, y, 1, 1) <= MAX_ROAD_SLOPE
  );
}

/**
 * Plans a road from one tile to another.
 *
 * @param game - the game
 * @param player - who plans it
 * @param from - start tile index
 * @param to - end tile index
 * @returns the tiles, or null when no road can join them
 */
export function planRoad(
  game: Game,
  player: number,
  from: number,
  to: number,
): number[] | null {
  const usable = (index: number) =>
    game.roads[index] !== NO_ROAD || canLayRoad(game, player, index);
  let result: number[] | null = null;
  if (usable(from) && usable(to)) {
    result = findPath({
      n: game.world.n,
      from: [from],
      isGoal: (index) => index === to,
      towards: to,
      cost: (index) =>
        game.roads[index] !== NO_ROAD
          ? EXISTING
          : canLayRoad(game, player, index)
            ? 1
            : Infinity,
      diagonal: false,
      limit: ROAD_SEARCH,
      minCost: EXISTING,
    });
  }
  return result;
}

/**
 * New tiles of a planned road and what they cost.
 *
 * @param game - the game
 * @param tiles - the planned tiles
 * @returns the tiles still without road, and their price
 */
export function roadPrice(
  game: Game,
  tiles: readonly number[],
): { fresh: number[]; gold: number } {
  const fresh = tiles.filter((index) => game.roads[index] === NO_ROAD);
  return { fresh, gold: fresh.length * ROAD_COST };
}

/**
 * Lays a road over tiles, as far as the gold reaches.
 *
 * @param game - the game
 * @param player - who pays
 * @param tiles - the tiles
 * @returns how many tiles were laid, or -1 when none could be
 */
export function layRoad(
  game: Game,
  player: number,
  tiles: readonly number[],
): number {
  const owner = playerById(game, player);
  let laid = 0;
  let blocked = false;
  for (const index of tiles) {
    if (game.roads[index] === NO_ROAD && canLayRoad(game, player, index)) {
      if (owner !== null && owner.gold >= ROAD_COST) {
        game.roads[index] = PLAIN_ROAD;
        game.cleared[index] = 1;
        spend(owner, ROAD_COST, "construction");
        laid += 1;
      } else {
        blocked = true;
      }
    }
  }
  if (laid > 0) {
    game.dirty = true;
  }
  return laid === 0 && blocked ? -1 : laid;
}

/**
 * Plans the stretch to pave between two road tiles: along the player's
 * roads only.
 *
 * @param game - the game
 * @param player - who plans it
 * @param from - start tile index
 * @param to - end tile index
 * @returns the road tiles, or null when no road joins them
 */
export function planPave(
  game: Game,
  player: number,
  from: number,
  to: number,
): number[] | null {
  const usable = (index: number) =>
    game.roads[index] !== NO_ROAD &&
    game.islands[game.world.islandOf[index]]?.owner === player;
  return usable(from) && usable(to)
    ? findPath({
        n: game.world.n,
        from: [from],
        isGoal: (index) => index === to,
        towards: to,
        cost: (index) => (usable(index) ? 1 : Infinity),
        diagonal: false,
        limit: ROAD_SEARCH,
        minCost: 1,
      })
    : null;
}

/**
 * Plain tiles of a stretch and what paving them costs.
 *
 * @param game - the game
 * @param tiles - the planned tiles
 * @returns the tiles still plain, their gold and their stone
 */
export function pavePrice(
  game: Game,
  tiles: readonly number[],
): { fresh: number[]; gold: number; stone: number } {
  const fresh = tiles.filter((index) => game.roads[index] === PLAIN_ROAD);
  return {
    fresh,
    gold: fresh.length * PAVE_COST.gold,
    stone: fresh.length * (PAVE_COST.stone ?? 0),
  };
}

/**
 * Paves plain road tiles of the player's, as far as gold and the stone of
 * each tile's island reach.
 *
 * @param game - the game
 * @param player - who pays
 * @param tiles - the tiles
 * @returns how many tiles were paved, or -1 when none could be for want of gold or stone
 */
export function paveRoad(
  game: Game,
  player: number,
  tiles: readonly number[],
): number {
  const owner = playerById(game, player);
  const stone = PAVE_COST.stone ?? 0;
  let paved = 0;
  let blocked = false;
  for (const index of tiles) {
    const island = game.islands[game.world.islandOf[index]];
    if (game.roads[index] === PLAIN_ROAD && island?.owner === player) {
      if (
        owner !== null &&
        owner.gold >= PAVE_COST.gold &&
        island.stock.stone >= stone
      ) {
        game.roads[index] = PAVED_ROAD;
        island.stock.stone -= stone;
        spend(owner, PAVE_COST.gold, "construction");
        paved += 1;
      } else {
        blocked = true;
      }
    }
  }
  if (paved > 0) {
    // The ways get faster: the logistics look again.
    game.dirty = true;
  }
  return paved === 0 && blocked ? -1 : paved;
}
