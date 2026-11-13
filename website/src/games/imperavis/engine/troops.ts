/**
 * Land troops: barracks train units of many kinds from a queue, ships carry
 * them, they land at an island and storm its kontor; units march, attack,
 * patrol, hold a position or fall back, in a line, a block or loosely, and
 * garrisons, towers, medics and pioneers do their part.
 *
 * @module
 * @remarks
 * Every kind's numbers are data in `units-data.ts`; this file only applies
 * them. A unit walks a land path found once per order and turns towards an
 * enemy in sight; blows and shots are rolled every combat round from the
 * game's random state, so troops stay deterministic and are saved like
 * everything else. What makes the kinds differ: reach (ranged units fight
 * from afar but badly in melee), splash (artillery hurts everyone near its
 * target), damage against buildings (grenadiers, artillery), against units
 * that hold a position (cavalry fares badly, artillery and grenadiers
 * well), armour, speed, and the skills of medics (heal), pioneers (mend
 * buildings in the field) and scouts (see far, show enemies on the maps).
 * A kontor stormed to 0 hit points passes to the attacker, as one shot to
 * pieces from the sea does. When two players make peace, units on the
 * other's land go home.
 */
import { BUILDING } from "./buildings-data";
import { cheatPays } from "./cheat";
import { BUILDING_REPAIR_GOLD, hitBuilding, hitShip, hostile } from "./combat";
import { trespass } from "./diplomacy";
import { spend } from "./economy";
import { findPath } from "./pathfinding";
import { hasAmounts, takeAmounts } from "./placement";
import { islandsOf, ownerOf, playerById } from "./players";
import { randomRange } from "./random";
import { SHIP } from "./ships-data";
import { berthOf, kontorOf, sailTo } from "./ships";
import { inBounds, isSea, TILE_CENTER } from "./terrain";
import { TICK } from "./time";
import {
  DRILL_ORDERS,
  MELEE_REACH,
  SKILL_RANGE,
  UNIT,
  UNIT_KINDS,
} from "./units-data";
import { addStock } from "./warehouse";
import {
  Terrain,
  type Amounts,
  type Building,
  type Formation,
  type Game,
  type GoodId,
  type Player,
  type Ship,
  type Soldier,
  type UnitKind,
} from "./types";

/** Seconds between two fighting rounds. */
const FIGHT_EVERY = 0.5;

/** Steps per fighting round. */
const FIGHT_STEPS = Math.round(FIGHT_EVERY / TICK);

/** A garrison goes after landed enemies this far, tiles. */
const DEFEND_RANGE = 20;

/** Blows vary between these shares of the damage. */
const HIT_LOW = 0.8;
const HIT_HIGH = 1.2;

/** A ship sets soldiers ashore on land at most this far, tiles. */
const LAND_REACH = 4;

/** Tiles a march search may expand. */
const MARCH_SEARCH = 6000;

/** Walking a mountain or fording a river costs this much more. */
const MOUNTAIN_COST = 3;

/** A waypoint counts as reached this close, tiles. */
const STEP_REACHED = 0.2;

/** Soldiers stand apart by this much when set down together, tiles. */
const SPREAD = 0.35;

/** Soldiers in a row before the next row starts, when set down. */
const ROW = 4;

/** A kontor's guards strike soldiers this close, for this much... */
const GUARD_RANGE = 3;
const GUARD_DAMAGE = 4;

/** Strength is counted in the same units as for guns. */
const STRENGTH_UNIT = 100;

/** A new unit appears at most this far around its barracks, tiles. */
const EXIT_REACH = 3;

/** A new unit needs this much room to the next one, tiles. */
const EXIT_ROOM = 0.6;

/** Ranged units stop this share of their reach before their target. */
const KEEP_DISTANCE = 0.85;

/** Units in a line formation stand this far apart, tiles... */
const LINE_GAP = 1;

/** ...and this many side by side before the next rank. */
const LINE_WIDTH = 7;

/** A loose formation stands this much wider than a block. */
const LOOSE_GAP = 2;

/** How far around its goal a block spreads out, in tiles. */
const BLOCK_REACH = 3;

/** Extra armour of a unit that holds its position (dug in). */
const HOLD_ARMOUR = 0.2;

/** Extra armour of a block against blows in melee. */
const BLOCK_ARMOUR = 0.15;

/** A loose formation takes this share of splash damage. */
const LOOSE_SPLASH = 0.5;

/** Ranged units shooting from a line hit this much harder. */
const LINE_VOLLEY = 1.15;

/** Splash hurts the others around the target with this share. */
const SPLASH_SHARE = 0.6;

/** Armour never takes off more than this share. */
const MOST_ARMOUR = 0.8;

/** A unit near an own tower, battery or kontor counts as dug in, tiles. */
const WORKS_REACH = 3;

/** Units near an own scout notice enemies as far as the scout, tiles. */
const SCOUT_COMPANY = 6;

/** A patrol counts a turning point as reached this close, tiles. */
const PATROL_REACHED = 1;

/**
 * A ship may take soldiers aboard when land of their island lies this close,
 * in tiles - lying off any coast is enough, no kontor needed.
 */
export const BOARD_REACH = 4;

/** Land counts as reachable from a landing spot this close, tiles. */
const SHORE_STEP = 2;

/** Share of what is not trained yet that cancelling the unit in training gives back. */
const RUNNING_REFUND = 0.5;

/** Why a unit cannot be trained yet. */
export type UnitLock = "tier" | "research" | "building";

/**
 * The places of a block around its goal, nearest first: the goal itself,
 * then the tiles around it in growing rings.
 */
const BLOCK: readonly (readonly [number, number])[] = blockOffsets();

/**
 * Whether a unit kind is open to a player: the tier its houses reached, the
 * research, and a finished building of the named kind (always under the
 * cheat for the human).
 *
 * @param game - the game
 * @param player - the player
 * @param kind - the unit
 * @returns null when open, else what is missing
 */
export function unitLocked(
  game: Game,
  player: Player,
  kind: UnitKind,
): UnitLock | null {
  const def = UNIT[kind];
  let reason: UnitLock | null = null;
  if (!cheatPays(game, player.id)) {
    if (player.stats.peakTier < def.tier) {
      reason = "tier";
    } else if (
      def.research !== null &&
      !player.research.done.includes(def.research)
    ) {
      reason = "research";
    } else if (
      def.building !== null &&
      !game.buildings.some(
        (b) =>
          b.kind === def.building &&
          b.complete &&
          ownerOf(game, b) === player.id,
      )
    ) {
      reason = "building";
    }
  }
  return reason;
}

/**
 * Orders units at a barracks, paying for them at once from its island.
 *
 * @param game - the game
 * @param player - who orders
 * @param id - the barracks
 * @param kind - which unit
 * @param count - how many
 * @returns null when ordered, else why not
 */
export function trainUnits(
  game: Game,
  player: number,
  id: number,
  kind: UnitKind,
  count: number,
): string | null {
  const barracks = game.buildings.find((b) => b.id === id);
  const owner = playerById(game, player);
  const wanted = Math.max(0, Math.floor(count));
  const def = UNIT_KINDS.includes(kind) ? UNIT[kind] : null;
  const cost = def === null ? { gold: 0 } : scaled(def.cost, wanted);
  let reason: string | null = null;
  if (
    barracks?.drill == null ||
    owner === null ||
    !barracks.complete ||
    ownerOf(game, barracks) !== player
  ) {
    reason = "missing";
  } else if (def === null) {
    reason = "unknown";
  } else if (unitLocked(game, owner, kind) !== null) {
    reason = `unit:${unitLocked(game, owner, kind)}`;
  } else if (
    wanted === 0 ||
    barracks.drill.queue.length + wanted > DRILL_ORDERS
  ) {
    reason = "queueFull";
  } else if (owner.gold < cost.gold) {
    reason = "gold";
  } else if (!hasAmounts(game.islands[barracks.island].stock, cost)) {
    reason = "materials";
  } else {
    spend(owner, cost.gold, "construction");
    takeAmounts(game.islands[barracks.island].stock, cost);
    for (let k = 0; k < wanted; k += 1) {
      barracks.drill.queue.push(kind);
    }
  }
  return reason;
}

/**
 * What cancelling a unit of a barracks gives back: half of what of the unit
 * in training is not trained yet, or the whole price of one still waiting.
 *
 * @param barracks - the barracks
 * @param index - 0 for the unit in training, then the queue in order
 * @returns gold and goods, or null when there is no such unit
 */
export function trainingRefund(
  barracks: Building,
  index: number,
): ({ gold: number } & Amounts) | null {
  const drill = barracks.drill;
  const kind = drill?.queue[index] ?? null;
  let result: ({ gold: number } & Amounts) | null = null;
  if (drill !== null && kind !== null) {
    const def = UNIT[kind];
    const share =
      index === 0
        ? RUNNING_REFUND * Math.max(0, 1 - drill.progress / def.train)
        : 1;
    result = floored(def.cost, share);
  }
  return result;
}

/**
 * Cancels a unit in training or waiting and gives back what
 * {@link trainingRefund} says: gold to the owner, goods to the island as
 * far as its stores hold them.
 *
 * @param game - the game
 * @param player - who asks
 * @param id - the barracks
 * @param index - 0 for the unit in training, then the queue in order
 * @returns null when cancelled, else why not
 */
export function cancelTraining(
  game: Game,
  player: number,
  id: number,
  index: number,
): string | null {
  const barracks = game.buildings.find((b) => b.id === id);
  const owner = playerById(game, player);
  const back = barracks === undefined ? null : trainingRefund(barracks, index);
  let reason: string | null = null;
  if (
    barracks?.drill == null ||
    owner === null ||
    ownerOf(game, barracks) !== player ||
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
        addStock(game, barracks.island, good, amount);
      }
    }
    barracks.drill.queue.splice(index, 1);
    if (index === 0) {
      barracks.drill.progress = 0;
    }
  }
  return reason;
}

/**
 * Pauses or resumes the training of a barracks.
 *
 * @param game - the game
 * @param player - who asks
 * @param id - the barracks
 * @param paused - the new state
 * @returns null when done, else why not
 */
export function pauseTraining(
  game: Game,
  player: number,
  id: number,
  paused: boolean,
): string | null {
  const barracks = game.buildings.find((b) => b.id === id);
  const ok = barracks?.drill != null && ownerOf(game, barracks) === player;
  if (ok && barracks?.drill != null) {
    barracks.drill.paused = paused;
  }
  return ok ? null : "missing";
}

/**
 * The island whose soldiers a ship can take aboard: the one of the kontor it
 * lies at, else the island whose land is nearest within {@link BOARD_REACH}.
 *
 * @param game - the game
 * @param ship - the ship
 * @returns the island id, or -1 when the ship lies off no coast
 */
export function shoreIslandOf(game: Game, ship: Ship): number {
  const kontor = game.buildings.find((b) => b.id === ship.docked);
  const world = game.world;
  const n = world.n;
  let island = -1;
  let best = Infinity;
  for (let dy = -BOARD_REACH; dy <= BOARD_REACH; dy += 1) {
    for (let dx = -BOARD_REACH; dx <= BOARD_REACH; dx += 1) {
      const tx = Math.floor(ship.x) + dx;
      const ty = Math.floor(ship.y) + dy;
      const id = inBounds(world, tx, ty) ? world.islandOf[ty * n + tx] : -1;
      const distance = Math.hypot(dx, dy);
      if (id >= 0 && distance <= BOARD_REACH && distance < best) {
        best = distance;
        island = id;
      }
    }
  }
  return kontor?.island ?? island;
}

/**
 * The player's soldiers that would board a ship now: on land of the island
 * the ship lies off, not storming anything, and - when given - only those.
 *
 * @param game - the game
 * @param player - whose soldiers
 * @param ship - the ship
 * @param only - the soldiers asked for, or null for all there
 * @returns the soldiers
 */
export function boardingSoldiers(
  game: Game,
  player: number,
  ship: Ship,
  only: readonly number[] | null,
): Soldier[] {
  const island = shoreIslandOf(game, ship);
  return island < 0
    ? []
    : game.soldiers.filter(
        (s) =>
          s.owner === player &&
          s.ship < 0 &&
          s.island === island &&
          s.target < 0 &&
          (only === null || only.includes(s.id)),
      );
}

/**
 * Lets the units waiting on the island a ship lies off board it, as many as
 * it has room for. The ship may lie at a kontor or off any coast.
 *
 * @param game - the game
 * @param player - whose ship
 * @param shipId - the ship
 * @param only - the soldiers to board, or null for all waiting there
 * @returns null when someone boarded, else why not
 */
export function embark(
  game: Game,
  player: number,
  shipId: number,
  only: readonly number[] | null = null,
): string | null {
  const ship = game.ships.find((s) => s.id === shipId && s.owner === player);
  let reason: string | null = null;
  if (ship === undefined || shoreIslandOf(game, ship) < 0) {
    reason = "notShore";
  } else {
    let room = SHIP[ship.kind].troops - aboard(game, ship);
    const waiting = boardingSoldiers(game, player, ship, only);
    for (const soldier of waiting) {
      if (room > 0) {
        soldier.ship = ship.id;
        soldier.island = -1;
        soldier.path = [];
        soldier.order = { type: "idle" };
        soldier.x = ship.x;
        soldier.y = ship.y;
        room -= 1;
      }
    }
    reason =
      waiting.length === 0
        ? "noSoldiers"
        : room === SHIP[ship.kind].troops
          ? "noRoom"
          : null;
  }
  return reason;
}

/**
 * Sends a ship with soldiers aboard to an island: its own, to set them
 * down, or an enemy's, to storm the kontor there.
 *
 * @param game - the game
 * @param player - whose ship
 * @param shipId - the ship
 * @param island - where to land
 * @returns null when under way, else why not
 */
export function landTroops(
  game: Game,
  player: number,
  shipId: number,
  island: number,
): string | null {
  const ship = game.ships.find((s) => s.id === shipId && s.owner === player);
  const kontor = kontorOf(game, island);
  const owner = game.islands[island]?.owner ?? -1;
  // Own islands and enemies are reached at the kontor (to storm it); any
  // other island - free, or a rival's at peace - at its nearest coast.
  const atKontor =
    kontor !== null && (owner === player || hostile(game, player, owner));
  const goal =
    ship === undefined
      ? -1
      : atKontor
        ? berthOf(game, kontor)
        : landingWater(game, island, ship);
  let reason: string | null = null;
  if (ship === undefined || aboard(game, ship) === 0) {
    reason = "noSoldiers";
  } else if (game.islands[island] === undefined || goal < 0) {
    reason = "noPath";
  } else if (!sailTo(game, ship, goal)) {
    reason = "noPath";
  } else {
    ship.order = { type: "land", island };
  }
  return reason;
}

/**
 * The water tile off an island nearest a ship, with land of the island
 * close enough to go ashore.
 *
 * @param game - the game
 * @param island - where to land
 * @param ship - the ship
 * @returns a tile index, or -1 when the island has no such coast
 */
function landingWater(game: Game, island: number, ship: Ship): number {
  const world = game.world;
  const n = world.n;
  const info = world.islands[island];
  let best = -1;
  let bestDistance = Infinity;
  if (info !== undefined) {
    for (let y = info.minY - LAND_REACH; y <= info.maxY + LAND_REACH; y += 1) {
      for (
        let x = info.minX - LAND_REACH;
        x <= info.maxX + LAND_REACH;
        x += 1
      ) {
        const distance = Math.hypot(x - ship.x, y - ship.y);
        if (
          distance < bestDistance &&
          inBounds(world, x, y) &&
          isSea(world.terrain[y * n + x] as Terrain) &&
          shoreWithin(game, island, x, y)
        ) {
          best = y * n + x;
          bestDistance = distance;
        }
      }
    }
  }
  return best;
}

/** Whether walkable land of an island lies near a water tile. */
function shoreWithin(
  game: Game,
  island: number,
  x: number,
  y: number,
): boolean {
  const world = game.world;
  const n = world.n;
  let found = false;
  for (let dy = -SHORE_STEP; dy <= SHORE_STEP && !found; dy += 1) {
    for (let dx = -SHORE_STEP; dx <= SHORE_STEP && !found; dx += 1) {
      const tx = x + dx;
      const ty = y + dy;
      found =
        inBounds(world, tx, ty) &&
        world.islandOf[ty * n + tx] === island &&
        walkable(world.terrain[ty * n + tx] as Terrain);
    }
  }
  return found;
}

/**
 * Sends a player's units on land to a tile of their island, in the
 * formation of the first of them. Any standing order ends.
 *
 * @param game - the game
 * @param player - whose units
 * @param ids - the units
 * @param x - the goal, in tiles
 * @param y - the goal, in tiles
 * @returns null when at least one is on its way, else why not
 */
export function marchSoldiers(
  game: Game,
  player: number,
  ids: readonly number[],
  x: number,
  y: number,
): string | null {
  const plan = movers(game, player, ids, x, y);
  let reason = plan.reason;
  if (reason === null) {
    const formation = plan.movers[0].formation;
    let walking = 0;
    plan.movers.forEach((soldier, k) => {
      const goal = formationTile(
        game,
        plan.island,
        plan.tx,
        plan.ty,
        k,
        formation,
      );
      const path = walkPath(game, soldier, plan.island, goal);
      if (path !== null) {
        soldier.path = path;
        soldier.target = -1;
        soldier.order = { type: "idle" };
        walking += 1;
      }
    });
    reason = walking === 0 ? "noWay" : null;
  }
  return reason;
}

/**
 * Sends a player's units after an enemy: a unit (they chase it), a
 * building (they storm it) or a ship near the shore (they walk to the
 * water's edge and fire on it while it is in reach).
 *
 * @param game - the game
 * @param player - whose units
 * @param ids - the units
 * @param target - what to attack
 * @returns null when at least one goes, else why not
 */
export function unitAttack(
  game: Game,
  player: number,
  ids: readonly number[],
  target: {
    readonly kind: "soldier" | "building" | "ship";
    readonly id: number;
  },
): string | null {
  const chosen = ownOnLand(game, player, ids);
  const place = attackPlace(game, target);
  let reason: string | null = null;
  if (chosen.length === 0) {
    reason = "noSoldiers";
  } else if (place === null || !hostile(game, player, place.owner)) {
    reason = "notHostile";
  } else {
    let going = 0;
    const n = game.world.n;
    const building =
      target.kind === "building"
        ? (game.buildings.find((b) => b.id === target.id) ?? null)
        : null;
    for (const soldier of chosen) {
      const goal = shoreTile(game, soldier.island, place.x, place.y);
      const from = Math.floor(soldier.y) * n + Math.floor(soldier.x);
      const path =
        building !== null
          ? marchPath(game, from, building)
          : goal < 0
            ? null
            : walkPath(game, soldier, soldier.island, goal);
      if (
        path !== null &&
        (place.island < 0 || place.island === soldier.island)
      ) {
        soldier.path = path;
        soldier.target = target.kind === "building" ? target.id : -1;
        soldier.order =
          target.kind === "soldier"
            ? { type: "attack", soldier: target.id }
            : target.kind === "ship"
              ? { type: "attackShip", ship: target.id }
              : { type: "idle" };
        going += 1;
      }
    }
    reason = going === 0 ? "otherIsland" : null;
  }
  return reason;
}

/**
 * Lets a player's units patrol from where they stand to a tile of their
 * island and back, again and again; they fight what they meet.
 *
 * @param game - the game
 * @param player - whose units
 * @param ids - the units
 * @param x - the far end, in tiles
 * @param y - the far end, in tiles
 * @returns null when at least one is on its way, else why not
 */
export function unitPatrol(
  game: Game,
  player: number,
  ids: readonly number[],
  x: number,
  y: number,
): string | null {
  const plan = movers(game, player, ids, x, y);
  let reason = plan.reason;
  if (reason === null) {
    const formation = plan.movers[0].formation;
    let walking = 0;
    plan.movers.forEach((soldier, k) => {
      const goal = formationTile(
        game,
        plan.island,
        plan.tx,
        plan.ty,
        k,
        formation,
      );
      const path = walkPath(game, soldier, plan.island, goal);
      if (path !== null) {
        const n = game.world.n;
        soldier.order = {
          type: "patrol",
          ax: Math.floor(soldier.x),
          ay: Math.floor(soldier.y),
          bx: goal % n,
          by: Math.floor(goal / n),
          leg: 0,
        };
        soldier.path = path;
        soldier.target = -1;
        walking += 1;
      }
    });
    reason = walking === 0 ? "noWay" : null;
  }
  return reason;
}

/**
 * Lets a player's units hold where they stand: they dig in (more armour,
 * a position cavalry fares badly against) and fight only in their reach.
 *
 * @param game - the game
 * @param player - whose units
 * @param ids - the units
 * @returns null when done, else why not
 */
export function unitHold(
  game: Game,
  player: number,
  ids: readonly number[],
): string | null {
  const chosen = ownOnLand(game, player, ids);
  for (const soldier of chosen) {
    soldier.order = { type: "hold", x: soldier.x, y: soldier.y };
    soldier.path = [];
    soldier.target = -1;
  }
  return chosen.length === 0 ? "noSoldiers" : null;
}

/**
 * Lets a player's units fall back to the nearest own barracks or kontor
 * on their island; they do not stop for enemies on the way.
 *
 * @param game - the game
 * @param player - whose units
 * @param ids - the units
 * @returns null when at least one falls back, else why not
 */
export function unitRetreat(
  game: Game,
  player: number,
  ids: readonly number[],
): string | null {
  const chosen = ownOnLand(game, player, ids);
  let going = 0;
  for (const soldier of chosen) {
    const haven = havenOf(game, soldier);
    const door = haven === null ? null : doorOf(game, haven);
    const n = game.world.n;
    const path =
      door === null
        ? null
        : walkPath(
            game,
            soldier,
            soldier.island,
            Math.floor(door.y) * n + Math.floor(door.x),
          );
    if (path !== null) {
      soldier.order = { type: "retreat" };
      soldier.path = path;
      soldier.target = -1;
      going += 1;
    }
  }
  return chosen.length === 0 ? "noSoldiers" : going === 0 ? "noRetreat" : null;
}

/**
 * Sets the formation of a player's units.
 *
 * @param game - the game
 * @param player - whose units
 * @param ids - the units
 * @param formation - line, block or loose
 * @returns null when done, else why not
 */
export function setFormation(
  game: Game,
  player: number,
  ids: readonly number[],
  formation: Formation,
): string | null {
  const chosen = game.soldiers.filter(
    (s) => s.owner === player && ids.includes(s.id),
  );
  const known =
    formation === "line" || formation === "block" || formation === "loose";
  if (known) {
    for (const soldier of chosen) {
      soldier.formation = formation;
    }
  }
  return chosen.length === 0 ? "noSoldiers" : known ? null : "unknown";
}

/**
 * Soldiers aboard a ship.
 *
 * @param game - the game
 * @param ship - the ship
 * @returns how many
 */
export function aboard(game: Game, ship: Ship): number {
  return game.soldiers.filter((s) => s.ship === ship.id).length;
}

/**
 * A player's land troops, as strength to compare with others.
 *
 * @param game - the game
 * @param player - the player id
 * @returns strength in the units of the guns
 */
export function troopStrength(game: Game, player: number): number {
  let sum = 0;
  for (const soldier of game.soldiers) {
    if (soldier.owner === player) {
      const def = UNIT[soldier.kind];
      sum += (def.hp * def.damage) / def.reload;
    }
  }
  return sum / STRENGTH_UNIT;
}

/**
 * Gold per minute a player's land troops cost.
 *
 * @param game - the game
 * @param player - the player id
 * @returns upkeep per minute
 */
export function troopUpkeep(game: Game, player: number): number {
  let sum = 0;
  for (const soldier of game.soldiers) {
    if (soldier.owner === player) {
      sum += UNIT[soldier.kind].upkeep;
    }
  }
  return sum;
}

/**
 * The nearest enemy soldier on land within a reach.
 *
 * @param game - the game
 * @param owner - whose enemies
 * @param x - from, in tiles
 * @param y - from, in tiles
 * @param range - reach in tiles
 * @returns the soldier or null
 */
export function nearestEnemySoldier(
  game: Game,
  owner: number,
  x: number,
  y: number,
  range: number,
): Soldier | null {
  let best: Soldier | null = null;
  let bestDistance = range;
  for (const other of game.soldiers) {
    const distance = Math.hypot(other.x - x, other.y - y);
    if (
      other.ship < 0 &&
      distance <= bestDistance &&
      hostile(game, owner, other.owner)
    ) {
      best = other;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Hits a soldier; its armour softens the blow, at 0 hit points it falls.
 *
 * @param game - the game
 * @param soldier - the target
 * @param damage - hit points before armour
 */
export function hitSoldier(game: Game, soldier: Soldier, damage: number): void {
  soldier.hp -= damage * (1 - UNIT[soldier.kind].armour);
  if (soldier.hp <= 0) {
    game.soldiers = game.soldiers.filter((s) => s !== soldier);
  }
}

/**
 * Where a player's scouts on land stand: around them enemy troops and
 * ships show on the maps.
 *
 * @param game - the game
 * @param player - the player id
 * @returns their positions
 */
export function scoutsOf(
  game: Game,
  player: number,
): { x: number; y: number }[] {
  return game.soldiers
    .filter(
      (s) =>
        s.owner === player && s.ship < 0 && UNIT[s.kind].ability === "scout",
    )
    .map((s) => ({ x: s.x, y: s.y }));
}

/**
 * Whether a unit counts as dug in: holding its position, or close to an own
 * tower, battery or kontor.
 *
 * @param game - the game
 * @param soldier - the unit
 * @returns true when entrenched
 */
export function entrenched(game: Game, soldier: Soldier): boolean {
  return (
    soldier.order.type === "hold" ||
    game.buildings.some(
      (b) =>
        (BUILDING[b.kind].guns !== null || b.kind === "kontor") &&
        b.complete &&
        b.island === soldier.island &&
        ownerOf(game, b) === soldier.owner &&
        edgeDistance(soldier.x, soldier.y, b) <= WORKS_REACH,
    )
  );
}

/**
 * The time a barracks still needs for the unit in training, or 0.
 *
 * @param barracks - the barracks
 * @returns seconds
 */
export function trainingLeft(barracks: Building): number {
  const drill = barracks.drill;
  const kind = drill?.queue[0];
  return drill === null || kind === undefined
    ? 0
    : Math.max(0, UNIT[kind].train - drill.progress);
}

/**
 * Where a barracks puts its next unit: a free walkable tile next to it, or
 * -1 while every place is taken.
 *
 * @param game - the game
 * @param barracks - the barracks
 * @returns the tile index or -1
 */
export function exitTile(game: Game, barracks: Building): number {
  const world = game.world;
  const n = world.n;
  let best = -1;
  let bestDistance = Infinity;
  const cx = barracks.x + barracks.w / 2;
  const cy = barracks.y + barracks.h / 2;
  for (
    let y = barracks.y - EXIT_REACH;
    y < barracks.y + barracks.h + EXIT_REACH;
    y += 1
  ) {
    for (
      let x = barracks.x - EXIT_REACH;
      x < barracks.x + barracks.w + EXIT_REACH;
      x += 1
    ) {
      const tile = y * n + x;
      const distance = Math.hypot(x + TILE_CENTER - cx, y + TILE_CENTER - cy);
      if (
        distance < bestDistance &&
        inBounds(world, x, y) &&
        world.islandOf[tile] === barracks.island &&
        walkable(world.terrain[tile] as Terrain) &&
        world.terrain[tile] !== Terrain.Mountain &&
        game.occupancy[tile] === 0 &&
        game.soldiers.every(
          (s) =>
            s.ship >= 0 ||
            Math.hypot(s.x - (x + TILE_CENTER), s.y - (y + TILE_CENTER)) >=
              EXIT_ROOM,
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
 * One step of the troops: training, landings, marching and - every
 * fighting round - blows, shots, healing, mending, stormed kontors and
 * units going home.
 *
 * @param game - the game
 */
export function stepTroops(game: Game): void {
  train(game);
  // Soldiers whose ship went down go down with it.
  game.soldiers = game.soldiers.filter(
    (s) => s.ship < 0 || game.ships.some((ship) => ship.id === s.ship),
  );
  for (const ship of game.ships) {
    if (ship.order.type === "land" && ship.path.length === 0) {
      setAshore(game, ship, ship.order.island);
    }
  }
  const scouts = new Map<number, { x: number; y: number }[]>();
  for (const soldier of game.soldiers) {
    if (soldier.ship >= 0) {
      const ship = game.ships.find((s) => s.id === soldier.ship) as Ship;
      soldier.x = ship.x;
      soldier.y = ship.y;
    } else {
      let own = scouts.get(soldier.owner);
      if (own === undefined) {
        own = scoutsOf(game, soldier.owner);
        scouts.set(soldier.owner, own);
      }
      march(game, soldier, own);
    }
  }
  if (game.tick % FIGHT_STEPS === 0) {
    for (const soldier of [...game.soldiers]) {
      soldier.reload = Math.max(0, soldier.reload - FIGHT_EVERY);
      if (soldier.ship < 0 && soldier.hp > 0) {
        fight(game, soldier);
        applySkill(game, soldier);
      }
    }
    guard(game);
    goHome(game);
  }
}

/** Barracks work through their queues, one unit at a time. */
function train(game: Game): void {
  for (const building of game.buildings) {
    const drill = building.drill;
    const owner = ownerOf(game, building);
    const kind = drill?.queue[0];
    if (
      drill !== null &&
      kind !== undefined &&
      !drill.paused &&
      building.complete &&
      owner >= 0
    ) {
      const def = UNIT[kind];
      drill.progress = Math.min(def.train, drill.progress + TICK);
      // A trained unit waits inside while there is no room at the door.
      const tile = drill.progress >= def.train ? exitTile(game, building) : -1;
      if (tile >= 0) {
        const n = game.world.n;
        drill.progress = 0;
        drill.queue.shift();
        game.soldiers.push({
          id: game.nextId,
          owner,
          kind,
          order: { type: "idle" },
          formation: "line",
          x: (tile % n) + TILE_CENTER,
          y: Math.floor(tile / n) + TILE_CENTER,
          hp: def.hp,
          reload: 0,
          ship: -1,
          island: building.island,
          target: -1,
          path: [],
        });
        game.nextId += 1;
      }
    }
  }
}

/** A ship that reached the island sets its soldiers down on the nearest land. */
function setAshore(game: Game, ship: Ship, island: number): void {
  const world = game.world;
  const n = world.n;
  let best = -1;
  let bestDistance = Infinity;
  const sx = Math.floor(ship.x);
  const sy = Math.floor(ship.y);
  for (let y = sy - LAND_REACH; y <= sy + LAND_REACH; y += 1) {
    for (let x = sx - LAND_REACH; x <= sx + LAND_REACH; x += 1) {
      const distance = Math.hypot(x - sx, y - sy);
      if (
        inBounds(world, x, y) &&
        world.islandOf[y * n + x] === island &&
        walkable(world.terrain[y * n + x] as Terrain) &&
        distance < bestDistance
      ) {
        best = y * n + x;
        bestDistance = distance;
      }
    }
  }
  if (best >= 0) {
    const owner = game.islands[island].owner;
    const kontor = kontorOf(game, island);
    // Only an enemy's kontor is stormed; elsewhere the soldiers just stand.
    const storm = kontor !== null && hostile(game, ship.owner, owner);
    const path = storm ? marchPath(game, best, kontor) : [];
    let k = 0;
    for (const soldier of game.soldiers) {
      if (soldier.ship === ship.id) {
        soldier.ship = -1;
        soldier.island = island;
        soldier.x = (best % n) + TILE_CENTER + (k % ROW) * SPREAD;
        soldier.y =
          Math.floor(best / n) + TILE_CENTER + Math.floor(k / ROW) * SPREAD;
        soldier.target = storm ? kontor.id : -1;
        soldier.order = { type: "idle" };
        soldier.path = [...path];
        k += 1;
      }
    }
    game.events.push({
      type: "landed",
      player: ship.owner,
      island,
      soldiers: k,
    });
    if (!storm && owner >= 0 && owner !== ship.owner) {
      // A rival at peace takes it ill.
      trespass(game, ship.owner, owner, k);
    }
  }
  ship.order = { type: "idle" };
}

/** The tiles from a landing place to the side of a kontor, or none. */
function marchPath(game: Game, from: number, kontor: Building): number[] {
  const world = game.world;
  const n = world.n;
  const island = kontor.island;
  const path = findPath({
    n,
    from: [from],
    isGoal: (index) => {
      const x = index % n;
      const y = Math.floor(index / n);
      return (
        x >= kontor.x - 1 &&
        x <= kontor.x + kontor.w &&
        y >= kontor.y - 1 &&
        y <= kontor.y + kontor.h
      );
    },
    towards: (kontor.y + 1) * n + kontor.x + 1,
    cost: (index) => landCost(game, island, index),
    diagonal: false,
    limit: MARCH_SEARCH,
    minCost: 1,
  });
  return path ?? [];
}

/** What it costs a soldier to step onto a tile of an island. */
function landCost(game: Game, island: number, index: number): number {
  const world = game.world;
  return world.islandOf[index] !== island
    ? Infinity
    : world.terrain[index] === Terrain.Mountain ||
        world.terrain[index] === Terrain.River
      ? MOUNTAIN_COST
      : walkable(world.terrain[index] as Terrain)
        ? 1
        : Infinity;
}

/** A player's units on land among some ids. */
function ownOnLand(
  game: Game,
  player: number,
  ids: readonly number[],
): Soldier[] {
  return game.soldiers.filter(
    (s) => s.owner === player && s.ship < 0 && ids.includes(s.id),
  );
}

/** The units that can walk to a tile, the island and the tile - or why not. */
function movers(
  game: Game,
  player: number,
  ids: readonly number[],
  x: number,
  y: number,
): {
  movers: Soldier[];
  island: number;
  tx: number;
  ty: number;
  reason: string | null;
} {
  const world = game.world;
  const n = world.n;
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  const island =
    inBounds(world, tx, ty) && walkable(world.terrain[ty * n + tx] as Terrain)
      ? world.islandOf[ty * n + tx]
      : -1;
  const chosen = ownOnLand(game, player, ids);
  const moving = chosen.filter((s) => s.island === island);
  const reason =
    chosen.length === 0
      ? "noSoldiers"
      : island < 0
        ? "notWalkable"
        : moving.length === 0
          ? "otherIsland"
          : null;
  return { movers: moving, island, tx, ty, reason };
}

/** Where an attack goes: the target's position, island and owner, or null. */
function attackPlace(
  game: Game,
  target: {
    readonly kind: "soldier" | "building" | "ship";
    readonly id: number;
  },
): { x: number; y: number; island: number; owner: number } | null {
  let place: { x: number; y: number; island: number; owner: number } | null =
    null;
  if (target.kind === "soldier") {
    const enemy = game.soldiers.find((s) => s.id === target.id && s.ship < 0);
    place =
      enemy === undefined
        ? null
        : { x: enemy.x, y: enemy.y, island: enemy.island, owner: enemy.owner };
  } else if (target.kind === "building") {
    const building = game.buildings.find((b) => b.id === target.id);
    place =
      building === undefined
        ? null
        : {
            x: building.x + building.w / 2,
            y: building.y + building.h / 2,
            island: building.island,
            owner: ownerOf(game, building),
          };
  } else {
    const ship = game.ships.find((s) => s.id === target.id);
    place =
      ship === undefined
        ? null
        : { x: ship.x, y: ship.y, island: -1, owner: ship.owner };
  }
  return place;
}

/**
 * The walkable tile of an island nearest a point: the point itself on
 * land, the water's edge before a ship.
 */
function shoreTile(game: Game, island: number, x: number, y: number): number {
  const world = game.world;
  const n = world.n;
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  let best = -1;
  let bestDistance = Infinity;
  for (let dy = -LAND_REACH; dy <= LAND_REACH; dy += 1) {
    for (let dx = -LAND_REACH; dx <= LAND_REACH; dx += 1) {
      const tile = (cy + dy) * n + cx + dx;
      const distance = Math.hypot(dx, dy);
      if (
        distance < bestDistance &&
        inBounds(world, cx + dx, cy + dy) &&
        landCost(game, island, tile) !== Infinity
      ) {
        best = tile;
        bestDistance = distance;
      }
    }
  }
  return best;
}

/** The nearest own barracks or kontor on a unit's island, or null. */
function havenOf(game: Game, soldier: Soldier): Building | null {
  let best: Building | null = null;
  let bestDistance = Infinity;
  for (const building of game.buildings) {
    const distance = edgeDistance(soldier.x, soldier.y, building);
    if (
      (building.kind === "barracks" || building.kind === "kontor") &&
      building.island === soldier.island &&
      ownerOf(game, building) === soldier.owner &&
      distance < bestDistance
    ) {
      best = building;
      bestDistance = distance;
    }
  }
  return best;
}

/** The tile the k-th unit of a marching group heads for, by formation. */
function formationTile(
  game: Game,
  island: number,
  x: number,
  y: number,
  k: number,
  formation: Formation,
): number {
  const world = game.world;
  const n = world.n;
  let dx: number;
  let dy: number;
  if (formation === "line") {
    // Side by side across, rank behind rank.
    const file = k % LINE_WIDTH;
    const side = file % 2 === 0 ? file / 2 : -(file + 1) / 2;
    dx = side * LINE_GAP;
    dy = Math.floor(k / LINE_WIDTH);
  } else {
    const [bx, by] = BLOCK[k % BLOCK.length];
    const gap = formation === "loose" ? LOOSE_GAP : 1;
    dx = bx * gap;
    dy = by * gap;
  }
  const fx = x + dx;
  const fy = y + dy;
  const fits =
    inBounds(world, fx, fy) && landCost(game, island, fy * n + fx) !== Infinity;
  return fits ? fy * n + fx : y * n + x;
}

/** The tiles a soldier walks to a goal on its island, or null. */
function walkPath(
  game: Game,
  soldier: Soldier,
  island: number,
  goal: number,
): number[] | null {
  const n = game.world.n;
  return findPath({
    n,
    from: [Math.floor(soldier.y) * n + Math.floor(soldier.x)],
    isGoal: (index) => index === goal,
    towards: goal,
    cost: (index) => landCost(game, island, index),
    diagonal: false,
    limit: MARCH_SEARCH,
    minCost: 1,
  });
}

/** The offsets of {@link BLOCK}, nearest first, in a fixed order. */
function blockOffsets(): [number, number][] {
  const offsets: [number, number][] = [];
  for (let dy = -BLOCK_REACH; dy <= BLOCK_REACH; dy += 1) {
    for (let dx = -BLOCK_REACH; dx <= BLOCK_REACH; dx += 1) {
      offsets.push([dx, dy]);
    }
  }
  return offsets.sort(
    (a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]),
  );
}

/**
 * A unit walks: towards the enemy it is sent after or one in sight (not
 * while falling back), else along its path; a patrol turns at its ends.
 */
function march(
  game: Game,
  soldier: Soldier,
  scouts: readonly { x: number; y: number }[],
): void {
  const def = UNIT[soldier.kind];
  const order = soldier.order;
  const enemy = enemyInSight(game, soldier, scouts);
  let goalX: number | null = null;
  let goalY: number | null = null;
  if (enemy !== null && enemy.island === soldier.island) {
    const distance = Math.hypot(enemy.x - soldier.x, enemy.y - soldier.y);
    const keep =
      def.range > MELEE_REACH
        ? def.range * KEEP_DISTANCE
        : def.range * (1 - STEP_REACHED);
    if (distance > keep && order.type !== "hold") {
      goalX = enemy.x;
      goalY = enemy.y;
    }
  } else if (soldier.path.length > 0) {
    const n = game.world.n;
    goalX = (soldier.path[0] % n) + TILE_CENTER;
    goalY = Math.floor(soldier.path[0] / n) + TILE_CENTER;
    if (Math.hypot(goalX - soldier.x, goalY - soldier.y) < STEP_REACHED) {
      soldier.path.shift();
    }
  } else {
    endOfPath(game, soldier);
  }
  if (goalX !== null && goalY !== null) {
    const dx = goalX - soldier.x;
    const dy = goalY - soldier.y;
    const distance = Math.hypot(dx, dy);
    const step = Math.min(distance, def.speed * TICK);
    const nx = soldier.x + (dx / Math.max(distance, STEP_REACHED)) * step;
    const ny = soldier.y + (dy / Math.max(distance, STEP_REACHED)) * step;
    const n = game.world.n;
    const tile = Math.floor(ny) * n + Math.floor(nx);
    // Never into the water or off its island.
    if (
      inBounds(game.world, Math.floor(nx), Math.floor(ny)) &&
      game.world.islandOf[tile] === soldier.island &&
      !isSea(game.world.terrain[tile] as Terrain)
    ) {
      soldier.x = nx;
      soldier.y = ny;
    }
  }
}

/**
 * The enemy a unit turns to: the one it is sent after, else the nearest in
 * sight (its own, a scout's nearby, or the garrison's on its own island);
 * none while falling back, and only those in reach while holding.
 */
function enemyInSight(
  game: Game,
  soldier: Soldier,
  scouts: readonly { x: number; y: number }[],
): Soldier | null {
  const def = UNIT[soldier.kind];
  const order = soldier.order;
  let enemy: Soldier | null = null;
  if (order.type === "attack") {
    enemy =
      game.soldiers.find((s) => s.id === order.soldier && s.ship < 0) ?? null;
    if (enemy === null || !hostile(game, soldier.owner, enemy.owner)) {
      soldier.order = { type: "idle" };
      enemy = null;
    }
  }
  if (enemy === null && order.type !== "retreat") {
    const scouted = scouts.some(
      (scout) =>
        Math.hypot(scout.x - soldier.x, scout.y - soldier.y) <= SCOUT_COMPANY,
    );
    const sight = Math.max(def.sight, scouted ? UNIT.scout.sight : 0);
    const reach =
      order.type === "hold"
        ? def.range
        : soldier.target >= 0 ||
            game.islands[soldier.island]?.owner !== soldier.owner
          ? sight
          : Math.max(sight, DEFEND_RANGE);
    enemy = nearestEnemySoldier(
      game,
      soldier.owner,
      soldier.x,
      soldier.y,
      reach,
    );
  }
  return enemy;
}

/** What a unit does when its path is walked: a patrol turns, a retreat ends. */
function endOfPath(game: Game, soldier: Soldier): void {
  const order = soldier.order;
  if (order.type === "retreat") {
    soldier.order = { type: "idle" };
  } else if (order.type === "patrol") {
    const gx = order.leg === 0 ? order.bx : order.ax;
    const gy = order.leg === 0 ? order.by : order.ay;
    if (
      Math.hypot(gx + TILE_CENTER - soldier.x, gy + TILE_CENTER - soldier.y) <=
      PATROL_REACHED
    ) {
      order.leg = 1 - order.leg;
    }
    const n = game.world.n;
    const nx = order.leg === 0 ? order.bx : order.ax;
    const ny = order.leg === 0 ? order.by : order.ay;
    const path = walkPath(game, soldier, soldier.island, ny * n + nx);
    if (path === null || path.length === 0) {
      soldier.order = { type: "idle" };
    } else {
      soldier.path = path;
    }
  }
}

/**
 * A unit strikes or fires: at the enemy unit it is after or the nearest in
 * reach, else at a ship it is sent after (ranged units at any enemy ship in
 * reach), else at the building it storms.
 */
function fight(game: Game, soldier: Soldier): void {
  const def = UNIT[soldier.kind];
  if (soldier.reload <= 0) {
    const order = soldier.order;
    const chosen =
      order.type === "attack"
        ? (game.soldiers.find((s) => s.id === order.soldier && s.ship < 0) ??
          null)
        : null;
    const enemy =
      chosen !== null &&
      Math.hypot(chosen.x - soldier.x, chosen.y - soldier.y) <= def.range
        ? chosen
        : nearestEnemySoldier(
            game,
            soldier.owner,
            soldier.x,
            soldier.y,
            def.range,
          );
    const ship = enemy === null ? shipInReach(game, soldier) : null;
    const target = game.buildings.find((b) => b.id === soldier.target);
    if (enemy !== null) {
      soldier.reload = def.reload;
      strike(game, soldier, enemy);
      shot(game, soldier, enemy.x, enemy.y);
    } else if (ship !== null) {
      soldier.reload = def.reload;
      hitShip(game, ship, blow(game, soldier), soldier.owner);
      shot(game, soldier, ship.x, ship.y);
    } else if (
      target !== undefined &&
      hostile(game, soldier.owner, ownerOf(game, target)) &&
      edgeDistance(soldier.x, soldier.y, target) <= def.range
    ) {
      soldier.reload = def.reload;
      hitBuilding(
        game,
        target,
        blow(game, soldier) * def.vsBuilding,
        soldier.owner,
      );
      shot(game, soldier, target.x + target.w / 2, target.y + target.h / 2);
    } else if (
      soldier.target >= 0 &&
      (target === undefined || ownerOf(game, target) === soldier.owner)
    ) {
      // Stormed or gone: the soldiers stay as the new garrison. A soldier
      // without a target keeps the way it was sent on.
      soldier.target = -1;
      soldier.path = [];
    }
  }
}

/** The enemy ship a unit fires on: the one it is after, or any for ranged units. */
function shipInReach(game: Game, soldier: Soldier): Ship | null {
  const def = UNIT[soldier.kind];
  const order = soldier.order;
  let found: Ship | null = null;
  for (const ship of game.ships) {
    const wanted =
      order.type === "attackShip"
        ? ship.id === order.ship
        : def.range > MELEE_REACH;
    if (
      found === null &&
      wanted &&
      hostile(game, soldier.owner, ship.owner) &&
      Math.hypot(ship.x - soldier.x, ship.y - soldier.y) <= def.range
    ) {
      found = ship;
    }
  }
  if (
    order.type === "attackShip" &&
    !game.ships.some((ship) => ship.id === order.ship)
  ) {
    soldier.order = { type: "idle" };
  }
  return found;
}

/**
 * One unit hits another: the kinds, the formations and positions decide how
 * hard; artillery hurts the others close to its target as well.
 */
function strike(game: Game, attacker: Soldier, target: Soldier): void {
  const def = UNIT[attacker.kind];
  const ranged = def.range > MELEE_REACH;
  const close =
    ranged &&
    nearestEnemySoldier(
      game,
      attacker.owner,
      attacker.x,
      attacker.y,
      MELEE_REACH,
    ) !== null;
  const dugIn = def.vsEntrenched !== 1 && entrenched(game, target);
  const factor =
    (dugIn ? def.vsEntrenched : 1) *
    (close ? def.closeMalus : 1) *
    (ranged && attacker.formation === "line" ? LINE_VOLLEY : 1);
  const damage = blow(game, attacker) * factor;
  wound(game, target, damage, ranged);
  if (def.splash > 0) {
    for (const other of [...game.soldiers]) {
      if (
        other !== target &&
        other.ship < 0 &&
        hostile(game, attacker.owner, other.owner) &&
        Math.hypot(other.x - target.x, other.y - target.y) <= def.splash
      ) {
        const loose = other.formation === "loose" ? LOOSE_SPLASH : 1;
        wound(game, other, damage * SPLASH_SHARE * loose, ranged);
      }
    }
  }
}

/** Damage to a unit after its armour, its position and its formation. */
function wound(
  game: Game,
  target: Soldier,
  damage: number,
  ranged: boolean,
): void {
  const armour = Math.min(
    MOST_ARMOUR,
    UNIT[target.kind].armour +
      (target.order.type === "hold" ? HOLD_ARMOUR : 0) +
      (!ranged && target.formation === "block" ? BLOCK_ARMOUR : 0),
  );
  target.hp -= damage * (1 - armour);
  if (target.hp <= 0) {
    game.soldiers = game.soldiers.filter((s) => s !== target);
  }
}

/** Tells the view and the sound that a blow or shot was struck. */
function shot(game: Game, soldier: Soldier, x: number, y: number): void {
  game.events.push({
    type: "shot",
    x1: soldier.x,
    y1: soldier.y,
    x2: x,
    y2: y,
  });
}

/**
 * The skills: a medic heals the most hurt ally near it, a pioneer mends the
 * most damaged own building near it (at the owner's cost, even under fire).
 */
function applySkill(game: Game, soldier: Soldier): void {
  const def = UNIT[soldier.kind];
  if (def.ability === "heal") {
    let worst: Soldier | null = null;
    for (const other of game.soldiers) {
      const missing = UNIT[other.kind].hp - other.hp;
      if (
        other.owner === soldier.owner &&
        other.ship < 0 &&
        missing > 0 &&
        Math.hypot(other.x - soldier.x, other.y - soldier.y) <= SKILL_RANGE &&
        (worst === null || missing > UNIT[worst.kind].hp - worst.hp)
      ) {
        worst = other;
      }
    }
    if (worst !== null) {
      worst.hp = Math.min(
        UNIT[worst.kind].hp,
        worst.hp + def.power * FIGHT_EVERY,
      );
    }
  } else if (def.ability === "repair") {
    const owner = playerById(game, soldier.owner);
    let worst: Building | null = null;
    for (const building of game.buildings) {
      const missing = BUILDING[building.kind].hp - building.hp;
      if (
        building.complete &&
        building.fire <= 0 &&
        missing > 0 &&
        building.island === soldier.island &&
        ownerOf(game, building) === soldier.owner &&
        edgeDistance(soldier.x, soldier.y, building) <= SKILL_RANGE &&
        (worst === null || missing > BUILDING[worst.kind].hp - worst.hp)
      ) {
        worst = building;
      }
    }
    if (worst !== null && owner !== null && owner.gold > 0) {
      const amount = Math.min(
        BUILDING[worst.kind].hp - worst.hp,
        def.power * FIGHT_EVERY,
      );
      worst.hp += amount;
      spend(owner, amount * BUILDING_REPAIR_GOLD, "payments");
    }
  }
}

/** Every kontor's guards strike the nearest enemy soldier at its walls. */
function guard(game: Game): void {
  for (const building of game.buildings) {
    const owner = ownerOf(game, building);
    if (building.kind === "kontor" && owner >= 0 && game.soldiers.length > 0) {
      const enemy = nearestEnemySoldier(
        game,
        owner,
        building.x + building.w / 2,
        building.y + building.h / 2,
        GUARD_RANGE + Math.max(building.w, building.h) / 2,
      );
      if (enemy !== null) {
        hitSoldier(game, enemy, GUARD_DAMAGE * FIGHT_EVERY);
      }
    }
  }
}

/** The force of one blow or shot of a unit, before what modifies it. */
function blow(game: Game, soldier: Soldier): number {
  return UNIT[soldier.kind].damage * randomRange(game, HIT_LOW, HIT_HIGH);
}

/** Distance from a point to the nearest edge of a building, tiles. */
function edgeDistance(x: number, y: number, building: Building): number {
  const dx = Math.max(building.x - x, 0, x - building.x - building.w);
  const dy = Math.max(building.y - y, 0, y - building.y - building.h);
  return Math.hypot(dx, dy);
}

/** A cost times a count. */
function scaled(
  cost: { readonly gold: number } & Amounts,
  count: number,
): { gold: number } & Amounts {
  const result: { gold: number } & Amounts = { gold: 0 };
  for (const [good, amount] of Object.entries(cost) as [
    GoodId | "gold",
    number,
  ][]) {
    result[good] = amount * count;
  }
  return result;
}

/** A share of a cost, rounded down. */
function floored(
  cost: { readonly gold: number } & Amounts,
  share: number,
): { gold: number } & Amounts {
  const result: { gold: number } & Amounts = { gold: 0 };
  for (const [good, amount] of Object.entries(cost) as [
    GoodId | "gold",
    number,
  ][]) {
    result[good] = Math.floor(amount * share);
  }
  return result;
}

/**
 * Soldiers that stormed a kontor of a player they are no longer at war with
 * go home to their own first island; with no island left they are
 * dismissed.
 */
function goHome(game: Game): void {
  // Only those storming a kontor whose owner is no enemy any more go home;
  // soldiers set down on a free or a peaceful rival's island stay there.
  const leaving = game.soldiers.filter((s) => {
    const owner = game.islands[s.island]?.owner ?? -1;
    return (
      s.ship < 0 &&
      s.target >= 0 &&
      owner !== s.owner &&
      !hostile(game, s.owner, owner)
    );
  });
  for (const soldier of leaving) {
    const home = islandsOf(game, soldier.owner)
      .map((id) => kontorOf(game, id))
      .find((k) => k !== null);
    if (home === undefined || home === null) {
      game.soldiers = game.soldiers.filter((s) => s !== soldier);
    } else {
      const door = doorOf(game, home);
      soldier.x = door.x;
      soldier.y = door.y;
      soldier.island = home.island;
      soldier.target = -1;
      soldier.order = { type: "idle" };
      soldier.path = [];
    }
  }
}

/** A land tile just outside a building, where soldiers appear. */
function doorOf(game: Game, building: Building): { x: number; y: number } {
  const world = game.world;
  const n = world.n;
  let door = {
    x: building.x + building.w / 2,
    y: building.y + building.h + TILE_CENTER,
  };
  let found = false;
  for (let x = building.x - 1; x <= building.x + building.w && !found; x += 1) {
    for (
      let y = building.y - 1;
      y <= building.y + building.h && !found;
      y += 1
    ) {
      const outside =
        x < building.x ||
        x >= building.x + building.w ||
        y < building.y ||
        y >= building.y + building.h;
      if (
        outside &&
        inBounds(world, x, y) &&
        world.islandOf[y * n + x] === building.island &&
        walkable(world.terrain[y * n + x] as Terrain)
      ) {
        door = { x: x + TILE_CENTER, y: y + TILE_CENTER };
        found = true;
      }
    }
  }
  return door;
}

/** Whether soldiers can walk a kind of ground. */
function walkable(terrain: Terrain): boolean {
  return !isSea(terrain);
}
