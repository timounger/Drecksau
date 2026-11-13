/**
 * The BuildingSystem's actions: placing, moving, raising and tearing down
 * buildings, and building sites growing into finished buildings.
 *
 * @module
 */
import {
  BUILDING,
  LEVEL_COST,
  LEVEL_GOLD,
  LEVEL_KINDS,
  WAREHOUSE_KINDS,
} from "./buildings-data";
import { buildingAt, markOccupied } from "./derived";
import { NO_ROAD } from "./logistics-data";
import { spend } from "./economy";
import {
  checkPlacement,
  hasAmounts,
  QUARTER_TURNS,
  takeAmounts,
  type PlacementIssue,
} from "./placement";
import { ownerOf, playerById } from "./players";
import { createHouse } from "./population";
import { createProducer } from "./production";
import { capacityOf } from "./warehouse";
import type { Amounts, Building, BuildingKind, Game, GoodId } from "./types";

/** Share of the materials a torn-down building gives back. */
export const REFUND = 0.5;

/**
 * Gold per missing hit point of an immediate repair: twice what the slow
 * mending after a fight costs (`BUILDING_REPAIR_GOLD` in combat).
 */
export const INSTANT_REPAIR_GOLD = 0.4;

/**
 * Places a new building, paying for it.
 *
 * @param game - the game
 * @param player - who builds
 * @param kind - what to build
 * @param x - left tile
 * @param y - top tile
 * @param rot - quarter turns
 * @returns null when placed, else why not
 */
export function placeBuilding(
  game: Game,
  player: number,
  kind: BuildingKind,
  x: number,
  y: number,
  rot: number,
): PlacementIssue | null {
  const check = checkPlacement(game, player, kind, x, y, rot, null);
  const owner = playerById(game, player);
  if (check.issue === null && owner !== null) {
    const def = BUILDING[kind];
    const island = game.world.islandOf[y * game.world.n + x];
    // A kontor stands only on a free island, which it founds.
    const founds = kind === "kontor" && game.islands[island].owner < 0;
    spend(owner, def.cost.gold, "construction");
    if (check.ship !== null) {
      // Under the cheat a ship with too little aboard may found it; then
      // the cheat's endless stores pay the materials.
      if (hasAmounts(check.ship.cargo, def.cost)) {
        takeAmounts(check.ship.cargo, def.cost);
      }
    } else {
      takeAmounts(game.islands[island].stock, def.cost);
    }
    const building: Building = {
      id: game.nextId,
      kind,
      x,
      y,
      rot: rot % QUARTER_TURNS,
      w: check.w,
      h: check.h,
      island,
      built: 0,
      complete: false,
      paused: false,
      prod: def.recipe !== null ? createProducer() : null,
      house: kind === "house" ? createHouse() : null,
      yard:
        kind === "shipyard" ? { building: null, progress: 0, queue: [] } : null,
      drill:
        kind === "barracks" ? { queue: [], progress: 0, paused: false } : null,
      hp: def.hp,
      priority: false,
      level: 0,
      fire: 0,
      hitAt: 0,
      reload: 0,
    };
    game.nextId += 1;
    game.buildings.push(building);
    // Taken at once, so a second site placed before the next step (in
    // pause, with the build mode still on) cannot overlap this one.
    markOccupied(game, building);
    clearTrees(game, building);
    if (founds) {
      found(game, player, building, check.ship?.cargo ?? null);
    }
    // Buildings have no building time: it stands at once.
    completeBuilding(game, building);
    owner.stats.built += 1;
    game.events.push({ type: "placed", player, kind, x, y });
    game.dirty = true;
  }
  return check.issue;
}

/**
 * Moves a building to a new spot, free of charge.
 *
 * @param game - the game
 * @param player - who asks
 * @param id - the building
 * @param x - new left tile
 * @param y - new top tile
 * @param rot - new quarter turns
 * @returns null when moved, else why not
 */
export function relocateBuilding(
  game: Game,
  player: number,
  id: number,
  x: number,
  y: number,
  rot: number,
): PlacementIssue | "missing" | "fixed" | null {
  const building = game.buildings.find((b) => b.id === id);
  let result: PlacementIssue | "missing" | "fixed" | null;
  if (building === undefined || ownerOf(game, building) !== player) {
    result = "missing";
  } else if (building.kind === "kontor") {
    result = "fixed";
  } else {
    const island = game.world.islandOf[y * game.world.n + x];
    const check = checkPlacement(game, player, building.kind, x, y, rot, id);
    result = check.issue ?? (island !== building.island ? "notOwned" : null);
    if (result === null) {
      building.x = x;
      building.y = y;
      building.rot = rot % QUARTER_TURNS;
      building.w = check.w;
      building.h = check.h;
      clearTrees(game, building);
      game.carts = game.carts.filter(
        (cart) => cart.target !== id && cart.home !== id,
      );
      game.dirty = true;
    }
  }
  return result;
}

/**
 * Tears down the player's building or road on a tile.
 *
 * @param game - the game
 * @param player - who asks
 * @param x - tile column
 * @param y - tile row
 * @returns null when something was removed, else why not
 */
export function demolishAt(
  game: Game,
  player: number,
  x: number,
  y: number,
): "nothing" | "kontorLast" | "foreign" | null {
  const n = game.world.n;
  const building = buildingAt(game, x, y);
  let result: "nothing" | "kontorLast" | "foreign" | null = null;
  const inside = x >= 0 && y >= 0 && x < n && y < n;
  if (building !== null) {
    const others = game.buildings.some(
      (b) => b.island === building.island && b.id !== building.id,
    );
    if (ownerOf(game, building) !== player) {
      result = "foreign";
    } else if (
      building.kind === "kontor" &&
      others &&
      !hasOtherKontor(game, building)
    ) {
      result = "kontorLast";
    } else {
      removeBuilding(game, building, true);
    }
  } else if (inside && game.roads[y * n + x] !== NO_ROAD) {
    if (game.islands[game.world.islandOf[y * n + x]]?.owner !== player) {
      result = "foreign";
    } else {
      game.roads[y * n + x] = 0;
      game.dirty = true;
      game.events.push({ type: "removed", x, y });
    }
  } else {
    result = "nothing";
  }
  return result;
}

/**
 * Raises a building to its second stage.
 *
 * @param game - the game
 * @param player - who pays
 * @param id - the building
 * @returns null when raised, else why not
 */
export function levelUp(game: Game, player: number, id: number): string | null {
  const building = game.buildings.find((b) => b.id === id);
  const owner = playerById(game, player);
  let reason: string | null = null;
  if (
    building === undefined ||
    owner === null ||
    ownerOf(game, building) !== player
  ) {
    reason = "missing";
  } else if (!LEVEL_KINDS.includes(building.kind) || building.level > 0) {
    reason = "maxLevel";
  } else if (!building.complete) {
    reason = "notComplete";
  } else {
    const gold = levelGold(building.kind);
    const stock = game.islands[building.island].stock;
    if (owner.gold < gold) {
      reason = "gold";
    } else if (!hasAmounts(stock, LEVEL_COST)) {
      reason = "materials";
    } else {
      spend(owner, gold, "construction");
      takeAmounts(stock, LEVEL_COST);
      building.level = 1;
      building.hp = BUILDING[building.kind].hp;
      game.events.push({
        type: "levelUp",
        player,
        kind: building.kind,
        x: building.x,
        y: building.y,
      });
      game.dirty = true;
    }
  }
  return reason;
}

/**
 * Gold the second stage of a kind costs.
 *
 * @param kind - the building kind
 * @returns gold
 */
export function levelGold(kind: BuildingKind): number {
  return Math.round(BUILDING[kind].cost.gold * LEVEL_GOLD);
}

/**
 * Gold an immediate repair of a building costs, for every missing hit
 * point {@link INSTANT_REPAIR_GOLD}.
 *
 * @param building - the building
 * @returns gold, 0 when it is whole
 */
export function repairGold(building: Building): number {
  const missing = Math.max(0, BUILDING[building.kind].hp - building.hp);
  return Math.ceil(missing * INSTANT_REPAIR_GOLD);
}

/**
 * Mends a building at once, for gold.
 *
 * @param game - the game
 * @param player - who pays
 * @param id - the building
 * @returns null when mended, else why not
 */
export function repairNow(
  game: Game,
  player: number,
  id: number,
): string | null {
  const building = game.buildings.find((b) => b.id === id);
  const owner = playerById(game, player);
  let reason: string | null = null;
  if (
    building === undefined ||
    owner === null ||
    ownerOf(game, building) !== player
  ) {
    reason = "missing";
  } else if (!building.complete) {
    reason = "notComplete";
  } else if (building.fire > 0) {
    reason = "burning";
  } else if (building.hp >= BUILDING[building.kind].hp) {
    reason = "whole";
  } else {
    const gold = repairGold(building);
    if (owner.gold < gold) {
      reason = "gold";
    } else {
      spend(owner, gold, "payments");
      building.hp = BUILDING[building.kind].hp;
    }
  }
  return reason;
}

/**
 * Gives a producer's carts priority, or takes it away.
 *
 * @param game - the game
 * @param player - whose building
 * @param id - the building
 * @param priority - the new setting
 * @returns null when set, else why not
 */
export function setPriority(
  game: Game,
  player: number,
  id: number,
  priority: boolean,
): string | null {
  const building = game.buildings.find((b) => b.id === id);
  let reason: string | null = null;
  if (building === undefined || ownerOf(game, building) !== player) {
    reason = "missing";
  } else if (building.prod === null) {
    reason = "unknown";
  } else {
    building.priority = priority;
  }
  return reason;
}

/**
 * Lets building sites progress and finishes them.
 *
 * @param game - the game
 */
export function stepConstruction(game: Game): void {
  // Buildings stand at once; only sites from older saves are left to finish.
  for (const building of game.buildings) {
    if (!building.complete) {
      completeBuilding(game, building);
    }
  }
}

/**
 * Finishes a building: buildings have no building time, so a new one stands
 * the moment it is placed.
 *
 * @param game - the game
 * @param building - the building, changed
 */
function completeBuilding(game: Game, building: Building): void {
  building.built = BUILDING[building.kind].buildSeconds;
  building.complete = true;
  if (building.house !== null) {
    building.house.residents = 1;
  }
  game.events.push({
    type: "built",
    player: ownerOf(game, building),
    kind: building.kind,
    x: building.x,
    y: building.y,
  });
  game.dirty = true;
}

/**
 * Removes a building; torn down by its owner, part of its materials come back.
 *
 * @param game - the game
 * @param building - the building
 * @param refund - whether materials come back (not for ruins)
 */
export function removeBuilding(
  game: Game,
  building: Building,
  refund: boolean,
): void {
  const def = BUILDING[building.kind];
  game.buildings = game.buildings.filter((b) => b.id !== building.id);
  game.carts = game.carts.filter(
    (cart) => cart.home !== building.id && cart.target !== building.id,
  );
  const island = game.islands[building.island];
  // The island is given up only with its last kontor (games saved while a
  // second kontor per island was allowed may hold two).
  if (building.kind === "kontor" && !hasOtherKontor(game, building)) {
    island.owner = -1;
    island.orders = {};
    for (const good of Object.keys(island.stock) as GoodId[]) {
      island.stock[good] = 0;
    }
  } else {
    if (refund) {
      const back: Amounts = {};
      for (const [good, amount] of Object.entries(def.cost)) {
        if (good !== "gold") {
          back[good as GoodId] = Math.floor((amount as number) * REFUND);
        }
      }
      for (const [good, amount] of Object.entries(back) as [GoodId, number][]) {
        island.stock[good] += amount;
      }
    }
    // A smaller warehouse may now hold less than is stored.
    if (WAREHOUSE_KINDS.includes(building.kind)) {
      const cap = capacityOf(game, building.island);
      for (const good of Object.keys(island.stock) as GoodId[]) {
        island.stock[good] = Math.min(island.stock[good], cap);
      }
    }
  }
  game.events.push({ type: "removed", x: building.x, y: building.y });
  game.dirty = true;
}

/** Fells the trees under a footprint. */
function clearTrees(game: Game, building: Building): void {
  const n = game.world.n;
  for (let y = building.y; y < building.y + building.h; y += 1) {
    for (let x = building.x; x < building.x + building.w; x += 1) {
      game.cleared[y * n + x] = 1;
    }
  }
}

/**
 * Whether the island of a kontor holds another kontor besides it.
 *
 * @param game - the game
 * @param kontor - the kontor
 * @returns true when one more stands there
 */
export function hasOtherKontor(game: Game, kontor: Building): boolean {
  return game.buildings.some(
    (b) =>
      b.kind === "kontor" && b.island === kontor.island && b.id !== kontor.id,
  );
}

/** A new kontor makes its island the player's; the ship unloads into it. */
function found(
  game: Game,
  player: number,
  kontor: Building,
  cargo: Amounts | null,
): void {
  const island = game.islands[kontor.island];
  island.owner = player;
  island.foundedAt = game.time;
  const owner = playerById(game, player);
  if (owner !== null) {
    owner.stats.founded += 1;
  }
  if (cargo !== null) {
    const cap = BUILDING.kontor.storage;
    for (const [good, amount] of Object.entries(cargo) as [GoodId, number][]) {
      const moved = Math.min(amount, cap - island.stock[good]);
      island.stock[good] += moved;
      cargo[good] = amount - moved;
      if ((cargo[good] ?? 0) <= 0) {
        delete cargo[good];
      }
    }
  }
  game.events.push({ type: "founded", player, island: kontor.island });
}
