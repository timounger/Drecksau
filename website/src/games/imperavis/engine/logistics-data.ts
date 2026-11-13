/**
 * The numbers of the logistics in one place: how fast carts go on each kind
 * of ground, what paving a road costs and how far a store's carts look for
 * a way over open land.
 *
 * @module
 * @remarks
 * Speeds are shares of the cart's speed on a plain road
 * ({@link CART_SPEED} tiles per second): open land is slow, a forest slower
 * still, a paved road the fastest.
 */
import type { Amounts } from "./types";

/** Tiles per second a cart drives on a plain road. */
export const CART_SPEED = 3;

/** Value of a tile without road in the road grid. */
export const NO_ROAD = 0;

/** Value of a plain road tile. */
export const PLAIN_ROAD = 1;

/** Value of a paved road tile. */
export const PAVED_ROAD = 2;

/** Speed share on open land: meadow, beach, felled forest. */
export const LAND_SPEED = 0.4;

/** Speed share through standing forest. */
export const FOREST_SPEED = 0.25;

/**
 * Speed share on rock - building ground, where pits and mines stand; the
 * mountains above it are not crossable at all.
 */
export const ROCK_SPEED = 0.3;

/** Speed share on a plain road. */
export const ROAD_SPEED = 1;

/** Speed share on a paved road. */
export const PAVED_SPEED = 1.5;

/** What paving one road tile costs: gold from the treasury, stone from the island. */
export const PAVE_COST: Amounts & { readonly gold: number } = {
  gold: 5,
  stone: 1,
};

/**
 * Open land a store's carts may cross reaches this many tiles beyond the
 * store's reach, so a way may bend around a lake or a rock; roads count
 * wherever they lead.
 */
export const LAND_MARGIN = 6;

/** Tiles one store's search for ways may settle at most. */
export const WAY_SEARCH = 6000;

/** A cart fetches a producer's goods once this many wait. */
export const COLLECT_FROM = 2;
