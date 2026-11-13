/**
 * The free trader: a neutral merchant ship that sails in from the open sea,
 * visits every kontor with trade orders - the human's and the AI players'
 * alike - buys and sells at prices that follow supply and demand, and sails
 * off again.
 *
 * @module
 */
import { earn, spend } from "./economy";
import { GOOD, GOOD_IDS, perGood } from "./goods";
import { nextRandom, randomRange } from "./random";
import { playerById, TRADER } from "./players";
import { berthOf, createShip, kontorOf, sailTo } from "./ships";
import { TICK } from "./time";
import { addStock } from "./warehouse";
import type { Game, GoodId, Player, Ship, TraderState } from "./types";

/** How strongly pressure moves the price: price = value x (1 + this x pressure). */
export const PRICE_SWING = 0.6;

/** The trader pays this share of the price... */
export const SELL_SHARE = 0.8;

/** ...and asks this much over it. */
export const BUY_SHARE = 1.15;

/** Units traded move pressure by 1 / this. */
const PRESSURE_UNITS = 80;

/** Pressure fades by this share per second. */
const PRESSURE_FADE = 0.004;

/** Most units of one good per visit. */
export const VISIT_LIMIT = 40;

/** What the trader carries of each good at most, and refills towards. */
const TRADER_STOCK = 30;

/** Units per second the trader's stock refills. */
const REFILL = 0.12;

/** Seconds between voyages. */
const VISIT_MIN = 100;
const VISIT_MAX = 170;

/** Seconds the trader stays at a kontor. */
const STAY = 5;

/** First visit after this many seconds. */
const FIRST_VISIT = 90;

/** The map has four corners to sail in from. */
const MAP_CORNERS = 4;

/** How far in from the map's corner the trader appears, in tiles. */
const EDGE_IN = 2;

/**
 * A trader with full stock and neutral prices.
 *
 * @returns the state
 */
export function createTrader(): TraderState {
  return {
    pressure: perGood(0),
    stock: perGood(TRADER_STOCK),
    nextVisit: FIRST_VISIT,
    queue: [],
    lastDeal: null,
  };
}

/**
 * The price of a good right now, before the trader's margin.
 *
 * @param game - the game
 * @param good - the good
 * @returns gold per unit
 */
export function priceOf(game: Game, good: GoodId): number {
  return GOOD[good].value * (1 + PRICE_SWING * game.trader.pressure[good]);
}

/**
 * Gold the trader pays for one unit.
 *
 * @param game - the game
 * @param good - the good
 * @returns gold
 */
export function sellPrice(game: Game, good: GoodId): number {
  return priceOf(game, good) * SELL_SHARE;
}

/**
 * Gold the trader asks for one unit.
 *
 * @param game - the game
 * @param good - the good
 * @returns gold
 */
export function buyPrice(game: Game, good: GoodId): number {
  return priceOf(game, good) * BUY_SHARE;
}

/**
 * One step of the trader: prices settle, stock refills, the ship comes and goes.
 *
 * @param game - the game
 */
export function stepTrader(game: Game): void {
  const trader = game.trader;
  for (const good of GOOD_IDS) {
    trader.pressure[good] *= 1 - PRESSURE_FADE * TICK;
    if (trader.stock[good] < TRADER_STOCK) {
      trader.stock[good] = Math.min(
        TRADER_STOCK,
        trader.stock[good] + REFILL * TICK,
      );
    }
  }
  const ship = game.ships.find((s) => s.id === game.traderShip) ?? null;
  if (ship === null) {
    trader.nextVisit -= TICK;
    if (trader.nextVisit <= 0) {
      setOut(game);
    }
  } else {
    voyage(game, ship);
  }
}

/** Starts a voyage if any kontor has orders. */
function setOut(game: Game): void {
  const trader = game.trader;
  trader.queue = game.islands
    .filter(
      (island) => island.owner >= 0 && Object.keys(island.orders).length > 0,
    )
    .map((island) => island.id);
  if (trader.queue.length > 0) {
    const n = game.world.n;
    const corner = Math.floor(nextRandom(game) * MAP_CORNERS);
    const x = corner % 2 === 0 ? EDGE_IN : n - 1 - EDGE_IN;
    const y = corner < 2 ? EDGE_IN : n - 1 - EDGE_IN;
    const ship = createShip(game, TRADER, "trader", x, y);
    ship.order = { type: "route", route: -1, stop: 0, wait: 0 };
    game.traderShip = ship.id;
  } else {
    trader.nextVisit = randomRange(game, VISIT_MIN, VISIT_MAX);
  }
}

/** Sails from kontor to kontor, then home over the edge of the map. */
function voyage(game: Game, ship: Ship): void {
  const trader = game.trader;
  const order = ship.order.type === "route" ? ship.order : null;
  if (order !== null && ship.path.length === 0) {
    const island = trader.queue[0];
    const kontor = island === undefined ? null : kontorOf(game, island);
    if (island === undefined) {
      // Gone home.
      game.ships = game.ships.filter((s) => s.id !== ship.id);
      game.traderShip = -1;
      trader.nextVisit = randomRange(game, VISIT_MIN, VISIT_MAX);
    } else if (kontor === null) {
      trader.queue.shift();
    } else if (ship.docked === kontor.id) {
      if (order.wait <= 0) {
        deal(game, island);
        order.wait = STAY;
      }
      order.wait -= TICK;
      if (order.wait <= 0) {
        order.wait = 0;
        trader.queue.shift();
        leave(game, ship);
      }
    } else if (!sailTo(game, ship, berthOf(game, kontor))) {
      trader.queue.shift();
    }
  }
}

/** After the last stop the trader heads for the nearest map corner. */
function leave(game: Game, ship: Ship): void {
  ship.docked = -1;
  if (game.trader.queue.length === 0) {
    const n = game.world.n;
    const x = ship.x < n / 2 ? EDGE_IN : n - 1 - EDGE_IN;
    const y = ship.y < n / 2 ? EDGE_IN : n - 1 - EDGE_IN;
    if (!sailTo(game, ship, y * n + x)) {
      ship.path = [];
    }
    // Once this path is sailed, an empty queue sends it away.
  }
}

/** Buys and sells at one kontor by its orders, if somebody owns it. */
function deal(game: Game, islandId: number): void {
  const owner = playerById(game, game.islands[islandId].owner);
  if (owner !== null) {
    dealWith(game, owner, islandId);
  }
}

/** Buys and sells at one owned kontor. */
function dealWith(game: Game, owner: Player, islandId: number): void {
  const trader = game.trader;
  const island = game.islands[islandId];
  let bought = 0;
  let sold = 0;
  for (const [good, order] of Object.entries(island.orders) as [
    GoodId,
    NonNullable<(typeof island.orders)[GoodId]>,
  ][]) {
    if (order.sellAbove !== null && island.stock[good] > order.sellAbove) {
      const units = Math.floor(
        Math.min(island.stock[good] - order.sellAbove, VISIT_LIMIT),
      );
      if (units > 0) {
        const gold = units * sellPrice(game, good);
        island.stock[good] -= units;
        trader.stock[good] += units;
        trader.pressure[good] = Math.max(
          -1,
          trader.pressure[good] - units / PRESSURE_UNITS,
        );
        earn(owner, gold, "sales");
        sold += gold;
        owner.stats.traded += units;
        owner.stats.sold += units;
      }
    }
    if (order.buyBelow !== null && island.stock[good] < order.buyBelow) {
      const price = buyPrice(game, good);
      const affordable = Math.max(0, Math.floor(owner.gold / price));
      const units = Math.floor(
        Math.min(
          order.buyBelow - island.stock[good],
          VISIT_LIMIT,
          trader.stock[good],
          affordable,
        ),
      );
      if (units > 0) {
        const put = addStock(game, islandId, good, units);
        trader.stock[good] -= put;
        trader.pressure[good] = Math.min(
          1,
          trader.pressure[good] + put / PRESSURE_UNITS,
        );
        spend(owner, put * price, "purchases");
        bought += put * price;
        owner.stats.traded += put;
      }
    }
  }
  trader.lastDeal = {
    island: islandId,
    bought: Math.round(bought),
    sold: Math.round(sold),
  };
  game.events.push({
    type: "trader",
    player: owner.id,
    island: islandId,
    bought: Math.round(bought),
    sold: Math.round(sold),
  });
}
