/**
 * The CombatManager: armed ships and defences find enemies in reach and
 * fire, hits cost hit points after armour, ships sink, buildings burn down,
 * a kontor shot to pieces is taken over - and ships and buildings mend.
 *
 * @module
 * @remarks
 * Only enemies fight: players at war with each other, and pirates against
 * everyone. A kontor at 0 hit points passes with its island, its buildings
 * and its goods to the attacking player (conquest); pirates instead plunder
 * it and sail off. Any other building at 0 hit points is destroyed.
 * War ships also follow standing orders here: an attack on one ship or
 * building (chased until it is gone), a patrol between two points and an
 * escort of an own ship (see `fleets.ts` for the commands).
 */
import { BUILDING } from "./buildings-data";
import { hasOtherKontor, removeBuilding } from "./buildings";
import { atWar, remember } from "./diplomacy";
import { spend } from "./economy";
import { pruneFleets, warShipOf } from "./fleets";
import { islandsOf, ownerOf, PIRATES, playerById, TRADER } from "./players";
import { randomRange } from "./random";
import { SHIP } from "./ships-data";
import { berthOf, kontorOf, sailTo } from "./ships";
import { inBounds, isSea, TILE_CENTER } from "./terrain";
import { TICK } from "./time";
import { hitSoldier, nearestEnemySoldier, troopStrength } from "./troops";
import {
  Terrain,
  type Building,
  type Game,
  type GoodId,
  type Guns,
  type Ship,
} from "./types";

/** Seconds between two looks for targets. */
export const COMBAT_EVERY = 0.5;

/** Steps per combat round. */
const ROUND_STEPS = Math.round(COMBAT_EVERY / TICK);

/** Hits vary between these shares of the gun's damage. */
const HIT_LOW = 0.8;
const HIT_HIGH = 1.2;

/** An idle armed ship goes after enemies this close, in tiles. */
export const CHASE_RANGE = 12;

/** A chaser stops closing in at this share of its reach. */
const HALF_RANGE = 0.6;

/** Seconds between two new courses while chasing. */
const CHASE_EVERY = 3;

/** Steps between two new courses while chasing. */
const CHASE_STEPS = Math.round(CHASE_EVERY / TICK);

/** An escort stays within this distance of its charge, tiles. */
const ESCORT_DISTANCE = 3;

/** A patrol counts a turning point as reached this close, tiles. */
const PATROL_REACHED = 2;

/** Water near a point is looked for this far around it, tiles. */
const WATER_REACH = 4;

/** A ship mends this share of its hit points per second in its own port. */
export const SHIP_REPAIR_RATE = 0.04;

/** Gold per hit point mended on a ship. */
export const SHIP_REPAIR_GOLD = 0.5;

/** A ship before its owner's shipyard mends this share per second. */
export const YARD_REPAIR_RATE = 0.1;

/** A ship counts as lying before a shipyard this close to its berth, tiles. */
export const YARD_REACH = 6;

/** A building mends this share of its hit points per second. */
const BUILDING_REPAIR_RATE = 0.01;

/** Gold per hit point mended on a building. */
export const BUILDING_REPAIR_GOLD = 0.2;

/** Seconds after a hit before mending starts: ships... */
const SHIP_CALM = 5;

/** ...and buildings. */
const BUILDING_CALM = 20;

/** A conquered kontor keeps this share of its hit points... */
const CAPTURED_HP = 0.3;

/** ...a plundered one this share. */
const PLUNDERED_HP = 0.25;

/** Pirates take this share of every good. */
export const PLUNDER_SHARE = 0.4;

/** A conquered island keeps this share of its residents. */
const CAPTURED_RESIDENTS = 0.5;

/** Each hit costs the relation between the two this much... */
const HIT_RELATION = -1;

/** ...a sunk ship this much more. */
const SINK_RELATION = -8;

/** A conquered island weighs on the relation this much. */
const CONQUEST_MEMORY = -15;

/** Strength is counted in these units of hit points times damage per second. */
const STRENGTH_UNIT = 100;

/**
 * Whether two owners fight each other.
 *
 * @param game - the game
 * @param a - one owner (player id, {@link TRADER} or {@link PIRATES})
 * @param b - the other
 * @returns true if they are enemies
 */
export function hostile(game: Game, a: number, b: number): boolean {
  let result: boolean;
  if (a === b || a === TRADER || b === TRADER) {
    result = false;
  } else if (a === PIRATES || b === PIRATES) {
    result = !game.settings.peaceful;
  } else {
    result = atWar(game, a, b);
  }
  return result;
}

/**
 * A player's fighting strength: armed ships, defences and soldiers.
 *
 * @param game - the game
 * @param player - the player id
 * @returns a number to compare with others
 */
export function strengthOf(game: Game, player: number): number {
  let sum = 0;
  for (const ship of game.ships) {
    const guns = SHIP[ship.kind].guns;
    if (ship.owner === player && guns !== null) {
      sum += (ship.hp * guns.damage) / guns.reload;
    }
  }
  for (const building of game.buildings) {
    const guns = BUILDING[building.kind].guns;
    if (
      guns !== null &&
      building.complete &&
      ownerOf(game, building) === player
    ) {
      sum += (building.hp * guns.damage) / guns.reload;
    }
  }
  return sum / STRENGTH_UNIT + troopStrength(game, player);
}

/**
 * One step of combat: reloading, targets, shots, chases and repairs.
 *
 * @param game - the game
 */
export function stepCombat(game: Game): void {
  if (game.tick % ROUND_STEPS === 0) {
    for (const ship of [...game.ships]) {
      const guns = SHIP[ship.kind].guns;
      if (guns !== null && ship.hp > 0) {
        ship.reload = Math.max(0, ship.reload - COMBAT_EVERY);
        shipFires(game, ship, guns);
        stepShipOrder(game, ship, guns);
      }
    }
    pruneFleets(game);
    for (const building of [...game.buildings]) {
      const guns = BUILDING[building.kind].guns;
      if (guns !== null && building.complete && building.hp > 0) {
        building.reload = Math.max(0, building.reload - COMBAT_EVERY);
        towerFires(game, building, guns);
      }
    }
    mend(game);
  }
}

/**
 * Hits a ship: armour softens it, at 0 it sinks.
 *
 * @param game - the game
 * @param ship - the target
 * @param damage - hit points before armour
 * @param attacker - who fired, or {@link PIRATES}
 */
export function hitShip(
  game: Game,
  ship: Ship,
  damage: number,
  attacker: number,
): void {
  ship.hp -= damage * (1 - SHIP[ship.kind].armour);
  ship.hitAt = game.time;
  remember(game, attacker, ship.owner, "attacked", HIT_RELATION);
  if (ship.hp <= 0) {
    sink(game, ship, attacker);
  }
}

/**
 * Sends a war ship of the player's after an enemy ship or building: it
 * chases the target and fires on it first while it is in reach.
 *
 * @param game - the game
 * @param player - whose ship
 * @param shipId - the ship
 * @param target - the enemy ship or building
 * @param building - true when the target is a building
 * @returns null when under way, else why not
 */
export function orderAttack(
  game: Game,
  player: number,
  shipId: number,
  target: number,
  building: boolean,
): string | null {
  const ship = warShipOf(game, player, shipId);
  const goal = ship === null ? null : targetOf(game, target, building);
  let reason: string | null = null;
  if (ship === null) {
    reason = "noGuns";
  } else if (goal === null || !hostile(game, player, goal.owner)) {
    reason = "notHostile";
  } else {
    ship.order = { type: "attack", target, building };
    ship.path = [];
    const water = seaNear(game, goal.x, goal.y, WATER_REACH);
    if (water >= 0) {
      sailTo(game, ship, water);
    }
  }
  return reason;
}

/**
 * Lets a war ship of the player's patrol from where it is to a point at sea
 * and back, again and again, fighting enemies that come near.
 *
 * @param game - the game
 * @param player - whose ship
 * @param shipId - the ship
 * @param x - the far end, tile column
 * @param y - the far end, tile row
 * @returns null when under way, else why not
 */
export function orderPatrol(
  game: Game,
  player: number,
  shipId: number,
  x: number,
  y: number,
): string | null {
  const ship = warShipOf(game, player, shipId);
  const water = seaNear(game, x, y, WATER_REACH);
  let reason: string | null = null;
  if (ship === null) {
    reason = "noGuns";
  } else if (water < 0 || !sailTo(game, ship, water)) {
    reason = "noPath";
  } else {
    const n = game.world.n;
    ship.order = {
      type: "patrol",
      ax: Math.floor(ship.x),
      ay: Math.floor(ship.y),
      bx: water % n,
      by: Math.floor(water / n),
      leg: 0,
    };
  }
  return reason;
}

/**
 * Lets a war ship of the player's escort another of the player's ships: it
 * keeps close and goes for every enemy that comes near its charge.
 *
 * @param game - the game
 * @param player - whose ships
 * @param shipId - the escort
 * @param charge - the ship to guard
 * @returns null when under way, else why not
 */
export function orderEscort(
  game: Game,
  player: number,
  shipId: number,
  charge: number,
): string | null {
  const ship = warShipOf(game, player, shipId);
  const guarded = game.ships.find(
    (other) => other.id === charge && other.owner === player,
  );
  let reason: string | null = null;
  if (ship === null) {
    reason = "noGuns";
  } else if (guarded === undefined || guarded === ship) {
    reason = "missing";
  } else {
    ship.order = { type: "escort", ship: charge };
    ship.path = [];
  }
  return reason;
}

/** An armed ship fires at its target, the nearest enemy ship, or a building. */
function shipFires(game: Game, ship: Ship, guns: Guns): void {
  if (ship.reload <= 0) {
    const order = ship.order;
    const target =
      order.type === "attack"
        ? targetOf(game, order.target, order.building)
        : null;
    const aimed =
      target !== null &&
      Math.hypot(target.x - ship.x, target.y - ship.y) <=
        guns.range + target.size / 2;
    const enemy = aimed
      ? null
      : nearestEnemyShip(game, ship.owner, ship.x, ship.y, guns.range);
    if (aimed && target !== null) {
      shoot(game, ship.x, ship.y, target.x, target.y);
      ship.reload = guns.reload;
      if (target.ship !== null) {
        hitShip(game, target.ship, roll(game, guns), ship.owner);
      } else if (target.building !== null) {
        hitBuilding(game, target.building, roll(game, guns), ship.owner);
      }
    } else if (enemy !== null) {
      shoot(game, ship.x, ship.y, enemy.x, enemy.y);
      ship.reload = guns.reload;
      hitShip(game, enemy, roll(game, guns), ship.owner);
    } else {
      const target = enemyBuilding(
        game,
        ship.owner,
        ship.x,
        ship.y,
        guns.range,
      );
      if (target !== null) {
        const cx = target.x + target.w / 2;
        const cy = target.y + target.h / 2;
        shoot(game, ship.x, ship.y, cx, cy);
        ship.reload = guns.reload;
        hitBuilding(game, target, roll(game, guns), ship.owner);
      }
    }
  }
}

/** A tower or battery fires at the nearest enemy ship. */
function towerFires(game: Game, building: Building, guns: Guns): void {
  const owner = ownerOf(game, building);
  const cx = building.x + building.w / 2;
  const cy = building.y + building.h / 2;
  if (building.reload <= 0 && owner >= 0) {
    const enemy = nearestEnemyShip(game, owner, cx, cy, guns.range);
    const soldier =
      enemy === null
        ? nearestEnemySoldier(game, owner, cx, cy, guns.range)
        : null;
    if (enemy !== null) {
      shoot(game, cx, cy, enemy.x, enemy.y);
      building.reload = guns.reload;
      hitShip(game, enemy, roll(game, guns), owner);
    } else if (soldier !== null) {
      // Towers also fire on soldiers who landed.
      shoot(game, cx, cy, soldier.x, soldier.y);
      building.reload = guns.reload;
      hitSoldier(game, soldier, roll(game, guns));
    }
  }
}

/** The damage of one shot. */
function roll(game: Game, guns: Guns): number {
  return guns.damage * randomRange(game, HIT_LOW, HIT_HIGH);
}

/** Tells the view and the sound that a gun went off. */
function shoot(game: Game, x1: number, y1: number, x2: number, y2: number) {
  game.events.push({ type: "shot", x1, y1, x2, y2 });
}

/**
 * The nearest enemy ship within a reach.
 *
 * @param game - the game
 * @param owner - whose enemies
 * @param x - from, in tiles
 * @param y - from, in tiles
 * @param range - reach in tiles
 * @returns the ship or null
 */
export function nearestEnemyShip(
  game: Game,
  owner: number,
  x: number,
  y: number,
  range: number,
): Ship | null {
  let best: Ship | null = null;
  let bestDistance = range;
  for (const other of game.ships) {
    const distance = Math.hypot(other.x - x, other.y - y);
    if (distance <= bestDistance && hostile(game, owner, other.owner)) {
      best = other;
      bestDistance = distance;
    }
  }
  return best;
}

/** The best enemy building in reach: defences first, then the kontor. */
function enemyBuilding(
  game: Game,
  owner: number,
  x: number,
  y: number,
  range: number,
): Building | null {
  let best: Building | null = null;
  let bestScore = -Infinity;
  for (const building of game.buildings) {
    const cx = building.x + building.w / 2;
    const cy = building.y + building.h / 2;
    const distance = Math.hypot(cx - x, cy - y);
    if (
      distance <= range + Math.max(building.w, building.h) / 2 &&
      hostile(game, owner, ownerOf(game, building))
    ) {
      const def = BUILDING[building.kind];
      const score =
        (def.guns !== null ? 2 : building.kind === "kontor" ? 1 : 0) -
        distance / range;
      if (score > bestScore) {
        best = building;
        bestScore = score;
      }
    }
  }
  return best;
}

/**
 * Hits a building: armour softens it, at 0 it falls or changes hands.
 *
 * @param game - the game
 * @param building - the target
 * @param damage - hit points before armour
 * @param attacker - who struck, or {@link PIRATES}
 */
export function hitBuilding(
  game: Game,
  building: Building,
  damage: number,
  attacker: number,
): void {
  const def = BUILDING[building.kind];
  const owner = ownerOf(game, building);
  building.hp -= damage * (1 - def.armour);
  building.hitAt = game.time;
  remember(game, attacker, owner, "attacked", HIT_RELATION);
  if (building.hp <= 0) {
    // Only the island's last kontor is plundered or taken (games saved while
    // a second kontor per island was allowed may hold two).
    if (building.kind === "kontor" && !hasOtherKontor(game, building)) {
      if (attacker === PIRATES) {
        plunder(game, building);
      } else {
        capture(game, building, attacker);
      }
    } else {
      removeBuilding(game, building, false);
      game.events.push({
        type: "destroyed",
        player: owner,
        kind: building.kind,
        x: building.x,
        y: building.y,
      });
    }
  }
}

/** A ship goes down. */
function sink(game: Game, ship: Ship, attacker: number): void {
  game.ships = game.ships.filter((other) => other.id !== ship.id);
  const winner = playerById(game, attacker);
  if (winner !== null) {
    winner.stats.sunk += 1;
  }
  remember(game, attacker, ship.owner, "attacked", SINK_RELATION);
  game.events.push({
    type: "sunk",
    player: ship.owner,
    kind: ship.kind,
    x: ship.x,
    y: ship.y,
  });
  checkAlive(game, ship.owner);
}

/** The attacker takes the island, its buildings and goods. */
function capture(game: Game, kontor: Building, attacker: number): void {
  const island = game.islands[kontor.island];
  const from = island.owner;
  island.owner = attacker;
  island.orders = {};
  // A conquest counts as a new settlement: the old home stays home.
  island.foundedAt = game.time;
  // The loser remembers; the winner has reached its war goal.
  remember(game, attacker, from, "conquest", CONQUEST_MEMORY);
  kontor.hp = BUILDING.kontor.hp * CAPTURED_HP;
  for (const building of game.buildings) {
    if (building.island === kontor.island && building.house !== null) {
      building.house.residents = Math.floor(
        building.house.residents * CAPTURED_RESIDENTS,
      );
    }
  }
  game.carts = game.carts.filter((cart) => {
    const home = game.buildings.find((b) => b.id === cart.home);
    return home === undefined || home.island !== kontor.island;
  });
  for (const ship of game.ships) {
    if (ship.docked === kontor.id) {
      ship.docked = -1;
    }
  }
  const owner = playerById(game, attacker);
  if (owner !== null) {
    owner.stats.founded += 1;
  }
  game.events.push({
    type: "captured",
    island: kontor.island,
    from,
    to: attacker,
  });
  game.dirty = true;
  checkAlive(game, from);
}

/** Pirates empty part of the stores and leave the kontor standing. */
function plunder(game: Game, kontor: Building): void {
  const island = game.islands[kontor.island];
  kontor.hp = BUILDING.kontor.hp * PLUNDERED_HP;
  for (const good of Object.keys(island.stock) as GoodId[]) {
    island.stock[good] = Math.floor(island.stock[good] * (1 - PLUNDER_SHARE));
  }
  for (const incident of game.incidents) {
    if (incident.kind === "pirates") {
      // The loot is aboard; the pirates head home.
      incident.until = Math.min(incident.until, game.time);
    }
  }
  game.events.push({
    type: "plundered",
    island: kontor.island,
    player: island.owner,
  });
}

/** A player with neither islands nor ships is out of the game. */
function checkAlive(game: Game, id: number): void {
  const player = playerById(game, id);
  if (
    player !== null &&
    islandsOf(game, id).length === 0 &&
    !game.ships.some((ship) => ship.owner === id)
  ) {
    player.alive = false;
  }
}

/**
 * What a target of an attack is: where it lies, how big it is, whose it is.
 * Null when it is gone.
 */
function targetOf(
  game: Game,
  id: number,
  building: boolean,
): {
  x: number;
  y: number;
  size: number;
  owner: number;
  ship: Ship | null;
  building: Building | null;
} | null {
  let result: ReturnType<typeof targetOf> = null;
  if (building) {
    const found = game.buildings.find((b) => b.id === id);
    if (found !== undefined) {
      result = {
        x: found.x + found.w / 2,
        y: found.y + found.h / 2,
        size: Math.max(found.w, found.h),
        owner: ownerOf(game, found),
        ship: null,
        building: found,
      };
    }
  } else {
    const found = game.ships.find((ship) => ship.id === id);
    if (found !== undefined) {
      result = {
        x: found.x,
        y: found.y,
        size: 0,
        owner: found.owner,
        ship: found,
        building: null,
      };
    }
  }
  return result;
}

/**
 * The sea tile nearest a point within a reach, or -1.
 *
 * @param game - the game
 * @param x - the point, in tiles
 * @param y - the point, in tiles
 * @param reach - how far to look, tiles
 * @returns the tile index or -1
 */
export function seaNear(
  game: Game,
  x: number,
  y: number,
  reach: number,
): number {
  const world = game.world;
  const n = world.n;
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  let best = -1;
  let bestDistance = Infinity;
  for (let dy = -reach; dy <= reach; dy += 1) {
    for (let dx = -reach; dx <= reach; dx += 1) {
      const distance = Math.hypot(dx, dy);
      if (
        distance < bestDistance &&
        inBounds(world, cx + dx, cy + dy) &&
        isSea(world.terrain[(cy + dy) * n + cx + dx] as Terrain)
      ) {
        best = (cy + dy) * n + cx + dx;
        bestDistance = distance;
      }
    }
  }
  return best;
}

/**
 * A war ship carries out its order once a round: an attack chases its
 * target, a patrol sails its legs, an escort keeps to its charge; an idle
 * ship (and a patrol) goes after enemies close by.
 */
function stepShipOrder(game: Game, ship: Ship, guns: Guns): void {
  const order = ship.order;
  const n = game.world.n;
  const now = game.tick % CHASE_STEPS < ROUND_STEPS;
  if (order.type === "attack") {
    const target = targetOf(game, order.target, order.building);
    if (target === null || !hostile(game, ship.owner, target.owner)) {
      ship.order = { type: "idle" };
      ship.path = [];
    } else if (
      (now || ship.path.length === 0) &&
      Math.hypot(target.x - ship.x, target.y - ship.y) >
        guns.range * HALF_RANGE + target.size / 2
    ) {
      const water = seaNear(game, target.x, target.y, WATER_REACH);
      if (water >= 0) {
        sailTo(game, ship, water);
      }
    }
  } else if (order.type === "escort") {
    const charge = game.ships.find((other) => other.id === order.ship);
    const threat =
      charge === undefined
        ? null
        : nearestEnemyShip(game, ship.owner, charge.x, charge.y, CHASE_RANGE);
    if (charge === undefined || charge.owner !== ship.owner) {
      ship.order = { type: "idle" };
    } else if (threat !== null && now) {
      sailTo(game, ship, Math.floor(threat.y) * n + Math.floor(threat.x));
    } else if (
      threat === null &&
      now &&
      Math.hypot(charge.x - ship.x, charge.y - ship.y) > ESCORT_DISTANCE
    ) {
      sailTo(game, ship, Math.floor(charge.y) * n + Math.floor(charge.x));
    }
  } else if (order.type === "patrol") {
    if (!chase(game, ship, guns) && ship.path.length === 0) {
      const gx = order.leg === 0 ? order.bx : order.ax;
      const gy = order.leg === 0 ? order.by : order.ay;
      if (Math.hypot(gx - ship.x, gy - ship.y) < PATROL_REACHED) {
        order.leg = 1 - order.leg;
      }
      const nx = order.leg === 0 ? order.bx : order.ax;
      const ny = order.leg === 0 ? order.by : order.ay;
      sailTo(game, ship, ny * n + nx);
    }
  } else if (
    order.type === "idle" &&
    ship.owner >= 0 &&
    ship.path.length === 0
  ) {
    chase(game, ship, guns);
  }
}

/**
 * A ship goes after an enemy close by, every few seconds.
 *
 * @returns true when there is an enemy to go after
 */
function chase(game: Game, ship: Ship, guns: Guns): boolean {
  const enemy = nearestEnemyShip(game, ship.owner, ship.x, ship.y, CHASE_RANGE);
  if (
    enemy !== null &&
    game.tick % CHASE_STEPS < ROUND_STEPS &&
    Math.hypot(enemy.x - ship.x, enemy.y - ship.y) > guns.range * HALF_RANGE
  ) {
    const n = game.world.n;
    sailTo(game, ship, Math.floor(enemy.y) * n + Math.floor(enemy.x));
  }
  return enemy !== null;
}

/**
 * Whether a ship lies before a finished shipyard of its owner.
 *
 * @param game - the game
 * @param ship - the ship
 * @returns true when a yard can mend it
 */
export function atOwnYard(game: Game, ship: Ship): boolean {
  const n = game.world.n;
  return game.buildings.some((building) => {
    const berth =
      building.kind === "shipyard" &&
      building.complete &&
      ownerOf(game, building) === ship.owner
        ? berthOf(game, building)
        : -1;
    return (
      berth >= 0 &&
      Math.hypot(
        (berth % n) + TILE_CENTER - ship.x,
        Math.floor(berth / n) + TILE_CENTER - ship.y,
      ) <= YARD_REACH
    );
  });
}

/**
 * Ships before their own shipyard or in their own port and calm buildings
 * mend, at their owner's cost; the yard mends faster.
 */
function mend(game: Game): void {
  for (const ship of game.ships) {
    const def = SHIP[ship.kind];
    const owner = playerById(game, ship.owner);
    const damaged =
      owner !== null &&
      ship.hp < def.hp &&
      game.time - ship.hitAt > SHIP_CALM &&
      owner.gold > 0;
    // The yard is looked for only for a damaged ship, which is rare.
    const rate = !damaged
      ? 0
      : atOwnYard(game, ship)
        ? YARD_REPAIR_RATE
        : ship.docked >= 0
          ? SHIP_REPAIR_RATE
          : 0;
    if (owner !== null && rate > 0) {
      const amount = Math.min(def.hp - ship.hp, def.hp * rate * COMBAT_EVERY);
      ship.hp += amount;
      spend(owner, amount * SHIP_REPAIR_GOLD, "payments");
    }
  }
  for (const building of game.buildings) {
    const def = BUILDING[building.kind];
    const owner = playerById(game, ownerOf(game, building));
    if (
      owner !== null &&
      building.complete &&
      building.fire <= 0 &&
      building.hp < def.hp &&
      game.time - building.hitAt > BUILDING_CALM &&
      owner.gold > 0
    ) {
      const amount = Math.min(
        def.hp - building.hp,
        def.hp * BUILDING_REPAIR_RATE * COMBAT_EVERY,
      );
      building.hp += amount;
      spend(owner, amount * BUILDING_REPAIR_GOLD, "payments");
    }
  }
}

/**
 * Sends an armed ship to fire on an enemy kontor.
 *
 * @param game - the game
 * @param ship - the ship
 * @param island - the island whose kontor to attack
 * @returns true if a way was found
 */
export function attackIsland(game: Game, ship: Ship, island: number): boolean {
  const kontor = kontorOf(game, island);
  const n = game.world.n;
  let ok = false;
  if (kontor !== null) {
    const berth = berthOf(game, kontor);
    ship.order = {
      type: "move",
      x: berth % n,
      y: Math.floor(berth / n),
    };
    ok = sailTo(game, ship, berth);
  }
  return ok;
}
