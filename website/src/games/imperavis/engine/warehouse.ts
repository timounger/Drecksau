/**
 * The WarehouseManager: island stock and its capacity, and the carts that
 * fetch goods from producers and bring them their inputs - along the ways
 * of the logistics (`logistics.ts`), fast on roads, slow over open land,
 * and slower where many carts share the same road.
 *
 * @module
 */
import {
  BUILDING,
  INPUT_CAPACITY,
  LEVEL_STORAGE,
  OUTPUT_CAPACITY,
  WAREHOUSE_KINDS,
} from "./buildings-data";
import { CART_SPEED, COLLECT_FROM } from "./logistics-data";
import { tileSpeed } from "./logistics";
import { TICK } from "./time";
import type { Building, Cart, Game, GoodId } from "./types";

/** Units a cart carries. */
export const CART_LOAD = 4;

/**
 * Score a producer with priority gets on top when a warehouse picks its next
 * job: more than any job of the others can reach, so it is served first.
 */
const PRIORITY_SCORE = 3;

/** Seconds between two rounds of sending carts out. */
const DISPATCH_EVERY = 0.5;

/** Steps per dispatch round. */
const DISPATCH_STEPS = Math.round(DISPATCH_EVERY / TICK);

/** A road tile carries this many carts at full speed... */
export const FREE_FLOW = 1;

/** ...each cart more slows everyone on it by this share. */
export const CONGESTION = 0.3;

/** From this many planned carts a road counts as busy (drawn in colour). */
export const BUSY_ROAD = 4;

/**
 * Speed factor of carts on a tile with a given traffic.
 *
 * @param traffic - carts planning to use the tile
 * @returns 1 at free flow, less when crowded
 */
export function trafficFactor(traffic: number): number {
  return 1 / (1 + CONGESTION * Math.max(0, traffic - FREE_FLOW));
}

/**
 * Units a store building holds of each good.
 *
 * @param building - a kontor or warehouse
 * @returns its room per good
 */
export function storageOf(building: Building): number {
  const base = BUILDING[building.kind].storage;
  return building.level > 0 ? Math.round(base * LEVEL_STORAGE) : base;
}

/**
 * Carts a store building sends out.
 *
 * @param building - a kontor or warehouse
 * @returns how many
 */
export function cartsOf(building: Building): number {
  return BUILDING[building.kind].carts + (building.level > 0 ? 1 : 0);
}

/**
 * How much of each good an island can hold.
 *
 * @param game - the game
 * @param island - the island id
 * @returns units per good
 */
export function capacityOf(game: Game, island: number): number {
  let sum = 0;
  for (const building of game.buildings) {
    // A kontor holds goods from the first day, even while still being built.
    const counts = building.kind === "kontor" || building.complete;
    if (building.island === island && counts) {
      sum += storageOf(building);
    }
  }
  return sum;
}

/**
 * Puts goods into an island's warehouses, as much as fits.
 *
 * @param game - the game
 * @param island - the island id
 * @param good - which good
 * @param amount - how much
 * @returns how much went in
 */
export function addStock(
  game: Game,
  island: number,
  good: GoodId,
  amount: number,
): number {
  const stock = game.islands[island].stock;
  const room = Math.max(0, capacityOf(game, island) - stock[good]);
  const taken = Math.min(room, amount);
  stock[good] += taken;
  return taken;
}

/**
 * Sends idle carts out and drives the ones on the road.
 *
 * @param game - the game
 */
export function stepCarts(game: Game): void {
  if (game.tick % DISPATCH_STEPS === 0) {
    dispatch(game);
  }
  countTraffic(game);
  const step = CART_SPEED * TICK;
  const done: Cart[] = [];
  for (const cart of game.carts) {
    const tile =
      cart.path[Math.min(cart.path.length - 1, Math.floor(cart.pos))];
    // Each tile sets the pace: paved, plain road, forest or open land.
    cart.pos +=
      step * tileSpeed(game, tile) * trafficFactor(game.traffic[tile] ?? 0);
    if (cart.target >= 0 && cart.pos >= cart.turn) {
      arrive(game, cart);
    }
    if (cart.pos >= cart.path.length - 1) {
      done.push(cart);
    }
  }
  for (const cart of done) {
    comeHome(game, cart);
  }
  if (done.length > 0) {
    game.carts = game.carts.filter((cart) => !done.includes(cart));
  }
}

/** Counts, per road tile, the carts whose way still leads over it. */
function countTraffic(game: Game): void {
  const traffic = game.traffic;
  traffic.fill(0);
  for (const cart of game.carts) {
    const from = Math.floor(cart.pos);
    // Each tile once per cart, though the way leads there and back.
    const end = Math.max(from + 1, cart.turn + 1);
    for (let i = from; i < end && i < cart.path.length; i += 1) {
      traffic[cart.path[i]] += 1;
    }
  }
}

/** Gives every warehouse with a free cart its most pressing job. */
function dispatch(game: Game): void {
  for (const home of game.buildings) {
    if (WAREHOUSE_KINDS.includes(home.kind) && home.complete) {
      const busy = game.carts.filter((cart) => cart.home === home.id).length;
      if (busy < cartsOf(home)) {
        sendOne(game, home);
      }
    }
  }
}

/** Picks and starts one job for a warehouse. */
function sendOne(game: Game, home: Building): void {
  const stock = game.islands[home.island].stock;
  const capacity = capacityOf(game, home.island);
  let best: {
    building: Building;
    task: "collect" | "deliver";
    good: GoodId;
    amount: number;
    score: number;
  } | null = null;
  for (const building of game.buildings) {
    const prod = building.prod;
    const recipe = BUILDING[building.kind].recipe;
    if (
      prod !== null &&
      recipe !== null &&
      building.complete &&
      prod.warehouse === home.id
    ) {
      const collecting = game.carts.some(
        (cart) => cart.target === building.id && cart.task === "collect",
      );
      if (
        !collecting &&
        prod.output >= COLLECT_FROM &&
        stock[recipe.output] < capacity
      ) {
        const score = prod.output / OUTPUT_CAPACITY + priorityOf(building);
        if (best === null || score > best.score) {
          best = {
            building,
            task: "collect",
            good: recipe.output,
            amount: Math.min(CART_LOAD, Math.floor(prod.output)),
            score,
          };
        }
      }
      for (const input of recipe.inputs) {
        const coming = game.carts
          .filter(
            (cart) =>
              cart.target === building.id &&
              cart.task === "deliver" &&
              cart.good === input.good,
          )
          .reduce((sum, cart) => sum + cart.load, 0);
        const have = (prod.input[input.good] ?? 0) + coming;
        const want = Math.min(
          CART_LOAD,
          INPUT_CAPACITY - have,
          Math.floor(stock[input.good]),
        );
        if (!building.paused && want >= 1 && have < INPUT_CAPACITY - 1) {
          // An empty input is more urgent than a filling output.
          const score =
            1 -
            have / INPUT_CAPACITY +
            (have < input.amount ? 1 : 0) +
            priorityOf(building);
          if (best === null || score > best.score) {
            best = {
              building,
              task: "deliver",
              good: input.good,
              amount: want,
              score,
            };
          }
        }
      }
    }
  }
  if (best !== null) {
    const link = game.links.get(best.building.id);
    if (link !== undefined && link.warehouse === home.id) {
      const there = [...link.path];
      const back = there.slice(0, -1).reverse();
      const cart: Cart = {
        id: game.nextId,
        home: home.id,
        path: [...there, ...back],
        pos: 0,
        turn: there.length - 1,
        target: best.building.id,
        task: best.task,
        good: best.good,
        load: 0,
        amount: best.amount,
      };
      game.nextId += 1;
      if (best.task === "deliver") {
        stock[best.good] -= best.amount;
        cart.load = best.amount;
      }
      game.carts.push(cart);
    }
  }
}

/** Extra score of a producer whose carts come first. */
function priorityOf(building: Building): number {
  return building.priority === true ? PRIORITY_SCORE : 0;
}

/** A cart reaches its producer: it loads or unloads there. */
function arrive(game: Game, cart: Cart): void {
  const target = game.buildings.find((b) => b.id === cart.target);
  if (target?.prod) {
    if (cart.task === "collect") {
      const taken = Math.min(cart.amount, Math.floor(target.prod.output));
      target.prod.output -= taken;
      cart.load = taken;
    } else {
      target.prod.input[cart.good] =
        (target.prod.input[cart.good] ?? 0) + cart.load;
      cart.load = 0;
    }
  }
  cart.target = -1;
}

/** A cart is back: whatever it carries goes into the warehouse. */
function comeHome(game: Game, cart: Cart): void {
  const home = game.buildings.find((b) => b.id === cart.home);
  if (home !== undefined && cart.load > 0) {
    addStock(game, home.island, cart.good, cart.load);
  }
}
