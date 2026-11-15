/**
 * The TradeRouteManager: ships on a route sail from kontor to kontor and
 * load and unload there by the player's rules - least to leave, most to
 * fill, higher priorities first - and a route that cannot be sailed says why.
 *
 * @module
 * @remarks
 * A stop can also be the harbour of a foreign people or pirate band the
 * player trades with: there unloading sells and loading buys, at the
 * faction's prices; the limit is the least price to sell at and the most
 * to pay (0 for any price).
 */
import {
  askPrice,
  bidPrice,
  factionAction,
  factionOfIsland,
  homeOf,
  inHarbour,
  tradeRefusal,
} from "./factions";
import { berthOf, kontorOf, sailTo, transfer } from "./ships";
import { TICK } from "./time";
import type {
  Building,
  Game,
  RouteAction,
  RouteStop,
  Ship,
  TradeRoute,
} from "./types";

/** The middle of the three priorities. */
export const NORMAL_PRIORITY = 1;

/** Seconds a ship spends at a stop loading and unloading. */
export const STOP_SECONDS = 4;

/** Seconds before a blocked ship tries its way again. */
const RETRY_SECONDS = 5;

/**
 * Creates a route.
 *
 * @param game - the game
 * @param owner - whose route
 * @param name - its name
 * @param stops - its stops
 * @returns the route
 */
export function createRoute(
  game: Game,
  owner: number,
  name: string,
  stops: readonly RouteStop[],
): TradeRoute {
  const route: TradeRoute = {
    id: game.nextId,
    owner,
    name,
    stops: stops.map(copyStop),
    active: true,
    blocked: null,
    trips: 0,
  };
  game.nextId += 1;
  game.routes.push(route);
  return route;
}

/**
 * A deep copy of a stop, so commands never share arrays with the state.
 *
 * @param stop - the stop
 * @returns the copy
 */
export function copyStop(stop: RouteStop): RouteStop {
  return {
    island: stop.island,
    actions: stop.actions.map((action) => ({
      ...action,
      priority: Math.max(0, Math.min(2, Math.round(action.priority ?? 1))),
    })),
  };
}

/**
 * Puts a ship on a route, or takes it off.
 *
 * @param game - the game
 * @param ship - the ship
 * @param route - the route id, or null
 */
export function assignShip(game: Game, ship: Ship, route: number | null): void {
  ship.path = [];
  ship.order =
    route === null
      ? { type: "idle" }
      : { type: "route", route, stop: 0, wait: 0 };
}

/**
 * Runs every ship that sails a route.
 *
 * @param game - the game
 */
export function stepRoutes(game: Game): void {
  for (const route of game.routes) {
    const sailing = game.ships.some(
      (ship) => ship.order.type === "route" && ship.order.route === route.id,
    );
    const missing = route.stops.some((stop) => {
      const people = factionOfIsland(game, stop.island);
      return people === null
        ? ownKontor(game, route.owner, stop.island) === null
        : tradeRefusal(game, people, route.owner) !== null;
    });
    route.blocked = missing
      ? "noKontor"
      : !sailing
        ? "noShip"
        : route.blocked === "noPath"
          ? "noPath"
          : null;
  }
  for (const ship of game.ships) {
    const order = ship.order;
    if (order.type === "route" && ship.owner >= 0) {
      const route = game.routes.find((r) => r.id === order.route);
      if (route === undefined || route.owner !== ship.owner) {
        ship.order = { type: "idle" };
      } else if (
        route.active &&
        route.stops.length >= 2 &&
        route.blocked !== "noKontor"
      ) {
        sail(game, ship, route, order);
      }
    }
  }
}

/** One step of a ship on its route. */
function sail(
  game: Game,
  ship: Ship,
  route: TradeRoute,
  order: { route: number; stop: number; wait: number },
): void {
  const stop = route.stops[order.stop % route.stops.length];
  const kontor = ownKontor(game, route.owner, stop.island);
  const people = factionOfIsland(game, stop.island);
  if (people !== null) {
    if (inHarbour(game, people, ship)) {
      if (order.wait <= 0) {
        trade(game, ship, stop, people, route.owner);
        order.wait = STOP_SECONDS;
      }
      order.wait -= TICK;
      if (order.wait <= 0) {
        order.stop = (order.stop + 1) % route.stops.length;
        if (order.stop === 0) {
          route.trips += 1;
        }
        order.wait = 0;
        // Out of the harbour, so the next stop is sailed for.
        ship.path = [];
        const ok = sailTo(game, ship, nextBerth(game, route, order.stop));
        route.blocked = ok ? null : "noPath";
      }
    } else if (ship.path.length === 0) {
      if (order.wait > 0) {
        order.wait -= TICK;
      } else {
        const ok = sailTo(game, ship, homeOf(game, people).berth);
        route.blocked = ok ? null : "noPath";
        order.wait = ok ? 0 : RETRY_SECONDS;
      }
    }
  } else if (kontor !== null) {
    if (ship.docked === kontor.id) {
      if (order.wait <= 0) {
        handle(game, ship, stop);
        order.wait = STOP_SECONDS;
      }
      order.wait -= TICK;
      if (order.wait <= 0) {
        order.stop = (order.stop + 1) % route.stops.length;
        if (order.stop === 0) {
          route.trips += 1;
        }
        order.wait = 0;
        ship.docked = -1;
      }
    } else if (ship.path.length === 0) {
      if (order.wait > 0) {
        order.wait -= TICK;
      } else {
        const ok = sailTo(game, ship, berthOf(game, kontor));
        route.blocked = ok ? null : "noPath";
        order.wait = ok ? 0 : RETRY_SECONDS;
      }
    }
  }
}

/**
 * The kontor on an island if it is the given player's.
 *
 * @param game - the game
 * @param owner - the player id
 * @param island - the island id
 * @returns the kontor or null
 */
export function ownKontor(
  game: Game,
  owner: number,
  island: number,
): Building | null {
  return game.islands[island]?.owner === owner ? kontorOf(game, island) : null;
}

/** Unloads first, then loads, by the stop's rules and priorities. */
function handle(game: Game, ship: Ship, stop: RouteStop): void {
  const stock = game.islands[stop.island].stock;
  const ordered: RouteAction[] = [...stop.actions].sort(
    (a, b) => (b.priority ?? 1) - (a.priority ?? 1),
  );
  for (const action of ordered) {
    if (action.mode === "unload") {
      const room = Math.max(0, action.limit - stock[action.good]);
      const amount = Math.min(
        action.amount,
        room,
        ship.cargo[action.good] ?? 0,
      );
      if (amount > 0) {
        transfer(game, ship, action.good, -amount);
      }
    }
  }
  for (const action of ordered) {
    if (action.mode === "load") {
      const spare = Math.max(0, stock[action.good] - action.limit);
      const want = Math.max(0, action.amount - (ship.cargo[action.good] ?? 0));
      const amount = Math.min(spare, want);
      if (amount > 0) {
        transfer(game, ship, action.good, amount);
      }
    }
  }
}

/** The berth of a route's stop: a kontor's or a faction harbour's. */
function nextBerth(game: Game, route: TradeRoute, index: number): number {
  const stop = route.stops[index % route.stops.length];
  const people = factionOfIsland(game, stop.island);
  const kontor = people === null ? kontorOf(game, stop.island) : null;
  return people !== null
    ? homeOf(game, people).berth
    : kontor === null
      ? -1
      : berthOf(game, kontor);
}

/**
 * Trades at a faction's harbour by the stop's rules: unloading sells, at
 * no less than the limit per unit; loading buys, at no more (0 = any).
 */
function trade(
  game: Game,
  ship: Ship,
  stop: RouteStop,
  people: NonNullable<ReturnType<typeof factionOfIsland>>,
  owner: number,
): void {
  const ordered: RouteAction[] = [...stop.actions].sort(
    (a, b) => (b.priority ?? 1) - (a.priority ?? 1),
  );
  for (const action of ordered) {
    const have = ship.cargo[action.good] ?? 0;
    const price =
      action.mode === "unload"
        ? bidPrice(game, people, owner, action.good)
        : askPrice(game, people, owner, action.good);
    const fair =
      action.limit <= 0 ||
      (action.mode === "unload"
        ? price >= action.limit
        : price <= action.limit);
    const amount =
      action.mode === "unload"
        ? Math.min(action.amount, have)
        : Math.max(0, action.amount - have);
    if (fair && amount > 0) {
      factionAction(
        game,
        owner,
        people.id,
        {
          type: action.mode === "unload" ? "sell" : "buy",
          ship: ship.id,
          good: action.good,
          amount,
        },
        -1,
      );
    }
  }
}
