/**
 * The ShipManager: ships sailing the sea with A*, turning, keeping apart,
 * docking at kontors, loading and unloading, and shipyards building new ones
 * from a queue of paid orders.
 *
 * @module
 * @remarks
 * A shipyard takes an order only when the ship is open to the player (tier
 * and research) and the island's stores hold its cost; it pays at once. The
 * ship on the slip grows with the yard's workers. A finished ship is put on
 * free water before the yard, clear of other ships; while there is no such
 * place the yard waits with the ship ready. Cancelling gives back half of
 * what of the ship on the slip is not built yet, and all of a waiting order.
 */
import { BUILDING } from "./buildings-data";
import { cheatPays } from "./cheat";
import { spend } from "./economy";
import { findPath } from "./pathfinding";
import { hasAmounts, takeAmounts } from "./placement";
import { ownerOf, PIRATES, playerById, TRADER } from "./players";
import {
  BUILDABLE_SHIPS,
  RUNNING_REFUND,
  SHIP,
  YARD_ORDERS,
} from "./ships-data";
import { DIRS4, DIRS8, inBounds, isSea, TILE_CENTER } from "./terrain";
import { TICK, WEATHER_EFFECT } from "./time";
import { addStock, capacityOf } from "./warehouse";
import {
  Terrain,
  type Amounts,
  type Building,
  type Game,
  type GoodId,
  type Player,
  type Ship,
  type ShipKind,
  type World,
} from "./types";

/** A ship lies at a kontor when this close to its berth, in tiles. */
export const DOCK_RANGE = 2.5;

/** A waypoint counts as reached this close. */
const WAYPOINT_REACHED = 0.35;

/** Tiles a sea search may expand. */
const SEA_SEARCH = 90000;

/** Sailing right along the shore costs this much more. */
const SHORE_COST = 1.6;

/** Ships closer than this push each other apart, in tiles. */
const PERSONAL_SPACE = 1.4;

/** How hard they push, tiles per second. */
const PUSH = 0.6;

/** Slowest share of speed while turning hard. */
const TURN_SLOW = 0.35;

/** Steps when testing a straight line for land, per tile. */
const LINE_SAMPLES = 3;

/** Names for the player's ships - made up for this game. */
const SHIP_NAMES = [
  "Aurelia",
  "Seewind",
  "Morgenstern",
  "Fortuna",
  "Albatros",
  "Nordlicht",
  "Silberfisch",
  "Brise",
  "Kranich",
  "Perle",
  "Sturmvogel",
  "Abendrot",
] as const;

/** Each player's ships start at a different place in the list of names. */
const SHIP_OFFSET = 4;

/** A badly damaged ship sails at no less than this share of its speed. */
const DAMAGED_SPEED = 0.5;

/** A new ship is put this far from the berth at most, tiles. */
const LAUNCH_REACH = 5;

/** A new ship keeps at least this far from every other ship, tiles. */
const LAUNCH_CLEARANCE = 1.6;

/** Tiles between two ships of a formation. */
export const SHIP_SPACING = 2.5;

/** Rings of places a formation of ships spreads over. */
const FORMATION_RINGS = 2;

/** The places of a ship formation around its goal, nearest first. */
const SHIP_FORMATION: readonly (readonly [number, number])[] =
  formationOffsets();

/** Why a ship cannot be ordered: not open yet, or something else. */
export type ShipRefusal =
  "noYard" | "unknown" | "tier" | "research" | "busy" | "gold" | "materials";

/** Sea cost per tile, cached per world. */
const seaCosts = new WeakMap<World, Float32Array>();

/** Which stretch of water each tile belongs to (-1 on land), per world. */
const seaParts = new WeakMap<World, Int32Array>();

/**
 * Makes a ship.
 *
 * @param game - the game
 * @param owner - the player, {@link TRADER} or {@link PIRATES}
 * @param kind - which kind
 * @param x - tile column
 * @param y - tile row
 * @returns the ship, already added to the game
 */
export function createShip(
  game: Game,
  owner: number,
  kind: ShipKind,
  x: number,
  y: number,
): Ship {
  const own = game.ships.filter((ship) => ship.owner === owner).length;
  const ship: Ship = {
    id: game.nextId,
    kind,
    owner,
    name:
      owner < 0
        ? ""
        : SHIP_NAMES[(own + owner * SHIP_OFFSET) % SHIP_NAMES.length],
    x: x + TILE_CENTER,
    y: y + TILE_CENTER,
    heading: 0,
    path: [],
    cargo: {},
    order: { type: "idle" },
    docked: -1,
    stuck: false,
    hp: SHIP[kind].hp,
    reload: 0,
    hitAt: 0,
  };
  game.nextId += 1;
  game.ships.push(ship);
  return ship;
}

/**
 * The sea tile where ships berth at a coastal building.
 *
 * @param game - the game
 * @param building - a kontor or shipyard
 * @returns the tile index, or -1
 */
export function berthOf(game: Game, building: Building): number {
  const world = game.world;
  const n = world.n;
  const cx = building.x + building.w / 2;
  const cy = building.y + building.h / 2;
  let best = -1;
  let bestDistance = Infinity;
  for (let y = building.y - 2; y <= building.y + building.h + 1; y += 1) {
    for (let x = building.x - 2; x <= building.x + building.w + 1; x += 1) {
      const distance = Math.hypot(x + TILE_CENTER - cx, y + TILE_CENTER - cy);
      if (
        inBounds(world, x, y) &&
        isSea(world.terrain[y * n + x] as Terrain) &&
        distance < bestDistance
      ) {
        bestDistance = distance;
        best = y * n + x;
      }
    }
  }
  return best;
}

/**
 * The kontor on an island.
 *
 * @param game - the game
 * @param island - the island id
 * @returns it or null
 */
export function kontorOf(game: Game, island: number): Building | null {
  return (
    game.buildings.find((b) => b.kind === "kontor" && b.island === island) ??
    null
  );
}

/**
 * Sends a ship towards a tile.
 *
 * @param game - the game
 * @param ship - the ship
 * @param target - the tile index to reach
 * @returns true if a way was found
 */
export function sailTo(game: Game, ship: Ship, target: number): boolean {
  const n = game.world.n;
  const costs = seaCostsOf(game.world);
  const start = Math.floor(ship.y) * n + Math.floor(ship.x);
  const tx = target % n;
  const ty = Math.floor(target / n);
  // Water that is not joined to the ship's never needs a search.
  const near =
    Math.abs((start % n) - tx) <= 1 &&
    Math.abs(Math.floor(start / n) - ty) <= 1;
  const path =
    !near && !sameWater(game.world, start, target)
      ? null
      : findPath({
          n,
          from: [start],
          isGoal: (index) =>
            Math.abs((index % n) - tx) <= 1 &&
            Math.abs(Math.floor(index / n) - ty) <= 1,
          towards: target,
          // The start tile is always allowed, in case a ship lies close to land.
          cost: (index) => (index === start ? 1 : costs[index]),
          diagonal: true,
          limit: SEA_SEARCH,
          minCost: 1,
        });
  ship.docked = -1;
  ship.stuck = path === null;
  ship.path = path === null ? [] : smooth(game.world, costs, path);
  if (path !== null && ship.path.length === 0) {
    // Already there.
    arrived(game, ship);
  }
  return path !== null;
}

/**
 * Moves every ship one step and docks those that arrived.
 *
 * @param game - the game
 */
export function stepShips(game: Game): void {
  const weather = WEATHER_EFFECT[game.weather].ships;
  const costs = seaCostsOf(game.world);
  const n = game.world.n;
  const pace = fleetPace(game);
  for (const ship of game.ships) {
    const def = SHIP[ship.kind];
    const fleet = ship.order.type === "move" ? ship.order.fleet : undefined;
    const top =
      fleet === undefined ? def.speed : (pace.get(fleet) ?? def.speed);
    if (ship.path.length >= 2) {
      const wx = ship.path[0] + TILE_CENTER;
      const wy = ship.path[1] + TILE_CENTER;
      const dx = wx - ship.x;
      const dy = wy - ship.y;
      const distance = Math.hypot(dx, dy);
      const wanted = Math.atan2(dy, dx);
      let turn = wanted - ship.heading;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      const maxTurn = def.turn * TICK;
      ship.heading += Math.max(-maxTurn, Math.min(maxTurn, turn));
      const slow = Math.max(TURN_SLOW, Math.cos(turn));
      const health =
        DAMAGED_SPEED + (1 - DAMAGED_SPEED) * Math.min(1, ship.hp / def.hp);
      const step = Math.min(distance, top * weather * slow * health * TICK);
      if (distance > 0) {
        ship.x += (dx / distance) * step;
        ship.y += (dy / distance) * step;
      }
      if (distance - step < WAYPOINT_REACHED) {
        ship.path.splice(0, 2);
        if (ship.path.length === 0) {
          arrived(game, ship);
        }
      }
    }
    keepApart(game, ship, costs, n);
  }
}

/**
 * Lets every shipyard work on the ship on its slip, launch it on free water
 * and take the next order from its queue.
 *
 * @param game - the game
 */
export function stepShipyards(game: Game): void {
  for (const building of game.buildings) {
    const yard = building.yard;
    if (
      yard !== null &&
      yard.building !== null &&
      building.complete &&
      !building.paused
    ) {
      const seconds = SHIP[yard.building].buildSeconds;
      yard.progress = Math.min(
        seconds,
        yard.progress + TICK * yardLabour(game, building),
      );
      // A finished ship waits on the slip until there is room on the water.
      const spot = yard.progress >= seconds ? launchSpot(game, building) : -1;
      if (spot >= 0) {
        const n = game.world.n;
        const owner = ownerOf(game, building);
        const ship = createShip(
          game,
          owner,
          yard.building,
          spot % n,
          Math.floor(spot / n),
        );
        yard.building = yard.queue.shift() ?? null;
        yard.progress = 0;
        const player = playerById(game, owner);
        if (player !== null) {
          player.stats.shipsBuilt += 1;
        }
        game.events.push({ type: "shipBuilt", player: owner, ship: ship.id });
      }
    }
  }
}

/**
 * The share of its workers a shipyard has: the yard builds at this pace.
 *
 * @param game - the game
 * @param yard - the shipyard
 * @returns 0 (no one at work) to 1
 */
export function yardLabour(game: Game, yard: Building): number {
  const tier = BUILDING.shipyard.workers?.tier ?? 0;
  return Math.min(1, game.labour[yard.island]?.[tier] ?? 0);
}

/**
 * Whether a ship is open to a player as far as unlocks go: the tier its
 * houses reached and the research (always under the cheat for the human).
 *
 * @param game - the game
 * @param player - the player
 * @param kind - the ship
 * @returns null when open, else "tier" or "research"
 */
export function shipLocked(
  game: Game,
  player: Player,
  kind: ShipKind,
): "tier" | "research" | null {
  const def = SHIP[kind];
  let reason: "tier" | "research" | null = null;
  if (!cheatPays(game, player.id)) {
    if (player.stats.peakTier < def.tier) {
      reason = "tier";
    } else if (
      def.research !== null &&
      !player.research.done.includes(def.research)
    ) {
      reason = "research";
    }
  }
  return reason;
}

/**
 * Orders a ship from a shipyard, paying for it from the island at once. It
 * goes on the slip when the slip is free, else into the yard's queue.
 *
 * @param game - the game
 * @param player - who pays
 * @param yardId - the shipyard
 * @param kind - which ship
 * @returns null when ordered, else why not
 */
export function orderShip(
  game: Game,
  player: number,
  yardId: number,
  kind: ShipKind,
): ShipRefusal | null {
  const building = game.buildings.find((b) => b.id === yardId);
  const def = SHIP[kind];
  const owner = playerById(game, player);
  let reason: ShipRefusal | null = null;
  if (
    building?.yard == null ||
    !building.complete ||
    owner === null ||
    ownerOf(game, building) !== player
  ) {
    reason = "noYard";
  } else if (!BUILDABLE_SHIPS.includes(kind)) {
    reason = "unknown";
  } else if (shipLocked(game, owner, kind) !== null) {
    reason = shipLocked(game, owner, kind);
  } else if (yardOrders(building) >= YARD_ORDERS) {
    reason = "busy";
  } else if (owner.gold < def.cost.gold) {
    reason = "gold";
  } else if (!hasAmounts(game.islands[building.island].stock, def.cost)) {
    reason = "materials";
  } else {
    spend(owner, def.cost.gold, "construction");
    takeAmounts(game.islands[building.island].stock, def.cost);
    if (building.yard.building === null) {
      building.yard.building = kind;
      building.yard.progress = 0;
    } else {
      building.yard.queue.push(kind);
    }
  }
  return reason;
}

/**
 * Ships a yard has on order: the one on the slip and those waiting.
 *
 * @param yard - the shipyard
 * @returns how many
 */
export function yardOrders(yard: Building): number {
  return (
    (yard.yard?.building === null ? 0 : 1) + (yard.yard?.queue.length ?? 0)
  );
}

/**
 * What cancelling an order gives back: half of the part of the ship on the
 * slip not built yet, or the whole price of an order still waiting.
 *
 * @param yard - the shipyard
 * @param index - 0 for the ship on the slip, then the queue in order
 * @returns gold and goods, or null when there is no such order
 */
export function shipRefund(
  yard: Building,
  index: number,
): ({ gold: number } & Amounts) | null {
  const state = yard.yard;
  const kind =
    state === null
      ? null
      : index === 0
        ? state.building
        : (state.queue[index - 1] ?? null);
  let result: ({ gold: number } & Amounts) | null = null;
  if (state !== null && kind !== null) {
    const def = SHIP[kind];
    const share =
      index === 0
        ? RUNNING_REFUND * Math.max(0, 1 - state.progress / def.buildSeconds)
        : 1;
    const back: { gold: number } & Amounts = { gold: 0 };
    for (const [good, amount] of Object.entries(def.cost) as [
      GoodId | "gold",
      number,
    ][]) {
      back[good] = Math.floor(amount * share);
    }
    result = back;
  }
  return result;
}

/**
 * Cancels an order of a shipyard and gives back what {@link shipRefund}
 * says: gold to the owner, goods to the island as far as its stores hold
 * them. Cancelling the ship on the slip moves the next order up.
 *
 * @param game - the game
 * @param player - who asks
 * @param yardId - the shipyard
 * @param index - 0 for the ship on the slip, then the queue in order
 * @returns null when cancelled, else why not
 */
export function cancelShip(
  game: Game,
  player: number,
  yardId: number,
  index: number,
): string | null {
  const building = game.buildings.find((b) => b.id === yardId);
  const owner = playerById(game, player);
  const back = building === undefined ? null : shipRefund(building, index);
  let reason: string | null = null;
  if (
    building?.yard == null ||
    owner === null ||
    ownerOf(game, building) !== player ||
    back === null
  ) {
    reason = "missing";
  } else {
    spend(owner, -back.gold, "construction");
    for (const [good, amount] of Object.entries(back) as [
      GoodId | "gold",
      number,
    ][]) {
      if (good !== "gold") {
        addStock(game, building.island, good, amount);
      }
    }
    if (index === 0) {
      building.yard.building = building.yard.queue.shift() ?? null;
      building.yard.progress = 0;
    } else {
      building.yard.queue.splice(index - 1, 1);
    }
  }
  return reason;
}

/**
 * Where a finished ship goes in: the free sea tile nearest the yard's berth,
 * joined to its water and clear of every other ship.
 *
 * @param game - the game
 * @param yard - the shipyard
 * @returns the tile index, or -1 while there is no room
 */
export function launchSpot(game: Game, yard: Building): number {
  const world = game.world;
  const n = world.n;
  const costs = seaCostsOf(world);
  const berth = berthOf(game, yard);
  const bx = berth % n;
  const by = Math.floor(berth / n);
  let best = -1;
  let bestDistance = Infinity;
  for (let dy = -LAUNCH_REACH; dy <= LAUNCH_REACH && berth >= 0; dy += 1) {
    for (let dx = -LAUNCH_REACH; dx <= LAUNCH_REACH; dx += 1) {
      const x = bx + dx;
      const y = by + dy;
      const tile = y * n + x;
      const distance = Math.hypot(dx, dy);
      if (
        distance < bestDistance &&
        distance <= LAUNCH_REACH &&
        inBounds(world, x, y) &&
        costs[tile] < Infinity &&
        sameWater(world, berth, tile) &&
        game.ships.every(
          (ship) =>
            Math.hypot(
              ship.x - (x + TILE_CENTER),
              ship.y - (y + TILE_CENTER),
            ) >= LAUNCH_CLEARANCE,
        )
      ) {
        best = tile;
        bestDistance = distance;
      }
    }
  }
  return best;
}

/**
 * The goals of ships sailing as a formation to a water tile: each its own
 * place around it, {@link SHIP_SPACING} apart; where a place is no water the
 * ship heads for the tile itself.
 *
 * @param game - the game
 * @param count - how many ships
 * @param x - the goal, tile column
 * @param y - the goal, tile row
 * @returns one goal per ship, in order
 */
export function formationGoals(
  game: Game,
  count: number,
  x: number,
  y: number,
): { x: number; y: number }[] {
  const world = game.world;
  const n = world.n;
  const goals: { x: number; y: number }[] = [];
  for (let k = 0; k < count; k += 1) {
    const [dx, dy] = SHIP_FORMATION[k % SHIP_FORMATION.length];
    const fx = Math.round(x + dx);
    const fy = Math.round(y + dy);
    const fits =
      inBounds(world, fx, fy) && isSea(world.terrain[fy * n + fx] as Terrain);
    goals.push(fits ? { x: fx, y: fy } : { x, y });
  }
  return goals;
}

/**
 * Units of a good a ship can still take.
 *
 * @param ship - the ship
 * @param good - the good
 * @returns the room
 */
export function roomFor(ship: Ship, good: GoodId): number {
  const def = SHIP[ship.kind];
  let usedOther = 0;
  for (const [other, amount] of Object.entries(ship.cargo) as [
    GoodId,
    number,
  ][]) {
    if (other !== good && amount > 0) {
      usedOther += Math.ceil(amount / def.slotSize);
    }
  }
  return Math.max(
    0,
    (def.slots - usedOther) * def.slotSize - (ship.cargo[good] ?? 0),
  );
}

/**
 * Moves goods between a docked ship and its kontor's island.
 *
 * @param game - the game
 * @param ship - the ship
 * @param good - the good
 * @param amount - positive loads onto the ship, negative unloads
 * @returns units moved (signed like amount)
 */
export function transfer(
  game: Game,
  ship: Ship,
  good: GoodId,
  amount: number,
): number {
  const kontor = game.buildings.find((b) => b.id === ship.docked);
  let moved = 0;
  if (kontor !== undefined) {
    const stock = game.islands[kontor.island].stock;
    if (amount > 0) {
      moved = Math.floor(Math.min(amount, stock[good], roomFor(ship, good)));
      stock[good] -= moved;
      ship.cargo[good] = (ship.cargo[good] ?? 0) + moved;
    } else {
      const want = Math.min(-amount, ship.cargo[good] ?? 0);
      const room = Math.max(0, capacityOf(game, kontor.island) - stock[good]);
      const put = Math.floor(Math.min(want, room));
      addStock(game, kontor.island, good, put);
      ship.cargo[good] = (ship.cargo[good] ?? 0) - put;
      moved = -put;
    }
    if ((ship.cargo[good] ?? 0) <= 0) {
      delete ship.cargo[good];
    }
  }
  return moved;
}

/**
 * Whether a ship may lie at a kontor: its own owner's, or any for the free
 * trader; pirates dock nowhere.
 *
 * @param game - the game
 * @param ship - the ship
 * @param kontor - the kontor
 * @returns true if it may dock there
 */
export function mayDock(game: Game, ship: Ship, kontor: Building): boolean {
  return (
    ship.owner !== PIRATES &&
    (ship.owner === TRADER || ownerOf(game, kontor) === ship.owner)
  );
}

/**
 * The pace of each fleet on the move: the slowest of its ships that sail
 * with it, so that the fleet keeps together.
 */
function fleetPace(game: Game): Map<number, number> {
  const pace = new Map<number, number>();
  for (const ship of game.ships) {
    if (ship.order.type === "move" && ship.order.fleet !== undefined) {
      const speed = SHIP[ship.kind].speed;
      pace.set(
        ship.order.fleet,
        Math.min(pace.get(ship.order.fleet) ?? speed, speed),
      );
    }
  }
  return pace;
}

/** The offsets of {@link SHIP_FORMATION}, nearest first. */
function formationOffsets(): [number, number][] {
  const offsets: [number, number][] = [];
  for (let dy = -FORMATION_RINGS; dy <= FORMATION_RINGS; dy += 1) {
    for (let dx = -FORMATION_RINGS; dx <= FORMATION_RINGS; dx += 1) {
      offsets.push([dx * SHIP_SPACING, dy * SHIP_SPACING]);
    }
  }
  return offsets.sort(
    (a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]),
  );
}

/** A ship that ran out of waypoints docks if a kontor it may use is near. */
function arrived(game: Game, ship: Ship): void {
  let docked = -1;
  for (const building of game.buildings) {
    if (
      building.kind === "kontor" &&
      docked < 0 &&
      mayDock(game, ship, building)
    ) {
      const berth = berthOf(game, building);
      const n = game.world.n;
      if (
        berth >= 0 &&
        Math.hypot(
          (berth % n) + TILE_CENTER - ship.x,
          Math.floor(berth / n) + TILE_CENTER - ship.y,
        ) <= DOCK_RANGE
      ) {
        docked = building.id;
      }
    }
  }
  ship.docked = docked;
  // Only a ship sent by hand reports; route ships dock all the time.
  if (docked >= 0 && ship.owner >= 0 && ship.order.type === "move") {
    const kontor = game.buildings.find((b) => b.id === docked) as Building;
    game.events.push({
      type: "docked",
      player: ship.owner,
      ship: ship.id,
      island: kontor.island,
    });
  }
  if (ship.order.type === "move") {
    ship.order = { type: "idle" };
  }
}

/** Pushes ships that come too close apart, never onto land. */
function keepApart(
  game: Game,
  ship: Ship,
  costs: Float32Array,
  n: number,
): void {
  for (const other of game.ships) {
    if (other !== ship) {
      const dx = ship.x - other.x;
      const dy = ship.y - other.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0 && distance < PERSONAL_SPACE) {
        const push =
          (PUSH * TICK * (PERSONAL_SPACE - distance)) / PERSONAL_SPACE;
        const nx = ship.x + (dx / distance) * push;
        const ny = ship.y + (dy / distance) * push;
        const tile = Math.floor(ny) * n + Math.floor(nx);
        if (costs[tile] < Infinity) {
          ship.x = nx;
          ship.y = ny;
        }
      }
    }
  }
}

/**
 * Builds the sea tables of a world ahead of time - the cost of each tile
 * and the stretches of joined water - so that the first voyage does not
 * pay for them inside a simulation step.
 *
 * @param world - the world
 */
export function prepareSea(world: World): void {
  seaCostsOf(world);
  seaPartsOf(world);
}

/**
 * Whether a ship at one tile can reach the tiles around another at all.
 * A ship may lie on a shore tile, so its neighbours count as its water.
 */
function sameWater(world: World, from: number, to: number): boolean {
  const parts = seaPartsOf(world);
  const n = world.n;
  const around = (index: number): Set<number> => {
    const found = new Set<number>();
    const x = index % n;
    const y = Math.floor(index / n);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (inBounds(world, x + dx, y + dy)) {
          const part = parts[(y + dy) * n + x + dx];
          if (part >= 0) {
            found.add(part);
          }
        }
      }
    }
    return found;
  };
  const mine = around(from);
  return [...around(to)].some((part) => mine.has(part));
}

/** Labels each joined stretch of sea (four neighbours), land is -1. */
function seaPartsOf(world: World): Int32Array {
  let parts = seaParts.get(world);
  if (parts === undefined) {
    const n = world.n;
    const costs = seaCostsOf(world);
    const labels = new Int32Array(n * n).fill(-1);
    const queue = new Int32Array(n * n);
    let next = 0;
    for (let seed = 0; seed < n * n; seed += 1) {
      if (labels[seed] < 0 && costs[seed] < Infinity) {
        let head = 0;
        let tail = 0;
        labels[seed] = next;
        queue[tail] = seed;
        tail += 1;
        while (head < tail) {
          const tile = queue[head];
          head += 1;
          const x = tile % n;
          const y = Math.floor(tile / n);
          for (const [dx, dy] of DIRS4) {
            const other = (y + dy) * n + x + dx;
            if (
              inBounds(world, x + dx, y + dy) &&
              labels[other] < 0 &&
              costs[other] < Infinity
            ) {
              labels[other] = next;
              queue[tail] = other;
              tail += 1;
            }
          }
        }
        next += 1;
      }
    }
    parts = labels;
    seaParts.set(world, parts);
  }
  return parts;
}

/** Cost of sailing each tile: open sea 1, along the shore more, land never. */
function seaCostsOf(world: World): Float32Array {
  let costs = seaCosts.get(world);
  if (costs === undefined) {
    const n = world.n;
    costs = new Float32Array(n * n);
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        const index = y * n + x;
        if (!isSea(world.terrain[index] as Terrain)) {
          costs[index] = Infinity;
        } else {
          let shore = false;
          for (const [dx, dy] of DIRS8) {
            const nx = x + dx;
            const ny = y + dy;
            if (
              inBounds(world, nx, ny) &&
              !isSea(world.terrain[ny * n + nx] as Terrain)
            ) {
              shore = true;
            }
          }
          costs[index] = shore ? SHORE_COST : 1;
        }
      }
    }
    seaCosts.set(world, costs);
  }
  return costs;
}

/** Cuts a tile path down to the waypoints a ship needs, as [x, y] pairs. */
function smooth(
  world: World,
  costs: Float32Array,
  path: readonly number[],
): number[] {
  const n = world.n;
  const points: number[] = [];
  let anchor = 0;
  while (anchor < path.length - 1) {
    let next = anchor + 1;
    for (
      let candidate = path.length - 1;
      candidate > anchor + 1;
      candidate -= 1
    ) {
      if (clearLine(costs, n, path[anchor], path[candidate])) {
        next = candidate;
        break;
      }
    }
    points.push(path[next] % n, Math.floor(path[next] / n));
    anchor = next;
  }
  return points;
}

/** Whether a straight line between two tiles stays at sea. */
function clearLine(
  costs: Float32Array,
  n: number,
  from: number,
  to: number,
): boolean {
  const ax = (from % n) + TILE_CENTER;
  const ay = Math.floor(from / n) + TILE_CENTER;
  const bx = (to % n) + TILE_CENTER;
  const by = Math.floor(to / n) + TILE_CENTER;
  const samples = Math.ceil(Math.hypot(bx - ax, by - ay) * LINE_SAMPLES);
  let clear = true;
  for (let i = 1; i < samples && clear; i += 1) {
    const t = i / samples;
    const tile =
      Math.floor(ay + (by - ay) * t) * n + Math.floor(ax + (bx - ax) * t);
    clear = costs[tile] === 1 || (costs[tile] < Infinity && costs[tile] > 0);
  }
  return clear;
}
