/**
 * Placing, moving, upgrading, repairing and tearing down - and the builders
 * who do the work.
 *
 * @module
 */
import { LOG, STRUCTURE_NAMES } from "@/games/frost-fortress/i18n/texts";
import {
  addCost,
  canAfford,
  pay,
  receive,
  scaleCost,
  siteYield,
} from "./economy";
import {
  hqCentre,
  isBuildable,
  MAP_COLS,
  MAP_ROWS,
  TILE,
  terrainAt,
} from "./map";
import {
  buildRadius,
  builders,
  buildSpeed,
  hasResearch,
  hqLevel,
  levelCap,
  maxHp,
  maxLevelOf,
  repairShare,
} from "./modifiers";
import { markDirty, structureAt } from "./runtime";
import {
  LUMBER_MIN_TREES,
  MINE_CHARGES,
  MINE_REARM,
  levelCost,
  levelTime,
  STRUCTURES,
  upgradeCost,
  upgradeTime,
  WORKSHOP_REPAIR,
} from "./structures";
import type { Cost, Game, Structure, StructureKind } from "./types";
import { pushMessage } from "./log";

/** Why a structure cannot go somewhere. */
export type PlaceProblem =
  | "outside"
  | "terrain"
  | "occupied"
  | "radius"
  | "deposit"
  | "trees"
  | "enemies"
  | "cost"
  | "locked";

/** Half a tile, to measure from the middle of the headquarters. */
const HALF = 0.5;

/** Hit points a new site starts with, as a share. */
const SITE_HP = 0.15;

/** Enemies closer than this to a footprint block building, in tiles. */
const ENEMY_CLEARANCE = 1.5;

/** Share of the cost given back when a finished structure is torn down. */
const DEMOLISH_REFUND = 0.5;

/** Share of its hit points a paid repair restores per second. */
const REPAIR_PACE = 0.12;

/** A workshop's repair is faster with field repair. */
const FIELD_REPAIR_BONUS = 1.5;

/** Seconds a structure must be left alone before the workshop repairs it. */
const REPAIR_CALM = 3;

/**
 * Whether a structure can be unlocked at all right now.
 *
 * @param game - the game
 * @param kind - which structure
 * @returns true if headquarters level and research allow it
 */
export function isUnlocked(game: Game, kind: StructureKind): boolean {
  const def = STRUCTURES[kind];
  const research = def.needsResearch;
  return (
    kind !== "hq" &&
    (game.cheat || hqLevel(game) >= def.needsHq) &&
    (research === undefined || hasResearch(game, research))
  );
}

/**
 * Checks a placement.
 *
 * @param game - the game
 * @param kind - what is to be placed
 * @param col - left column
 * @param row - top row
 * @param moving - id of a site being moved, which does not block itself
 * @param level - the level it is to be built at
 * @returns the first problem, or null if it can go there
 */
export function placeProblem(
  game: Game,
  kind: StructureKind,
  col: number,
  row: number,
  moving = 0,
  level = 1,
): PlaceProblem | null {
  const def = STRUCTURES[kind];
  let problem: PlaceProblem | null = null;
  if (
    col < 0 ||
    row < 0 ||
    col + def.width > MAP_COLS ||
    row + def.height > MAP_ROWS
  ) {
    problem = "outside";
  } else if (!isUnlocked(game, kind) || level > levelCap(game, kind)) {
    problem = "locked";
  } else {
    problem = footprintProblem(game, kind, col, row, moving);
  }
  if (
    problem === null &&
    moving === 0 &&
    !canAfford(game.res, levelCost(kind, level))
  ) {
    problem = "cost";
  }
  return problem;
}

/**
 * Places a new structure as a building site and pays for it.
 *
 * @param game - the game, changed
 * @param kind - what to build
 * @param col - left column
 * @param row - top row
 * @param level - the level it is built at, paying for every upgrade on the way
 * @returns the site, or null if it could not go there
 */
export function placeStructure(
  game: Game,
  kind: StructureKind,
  col: number,
  row: number,
  level = 1,
): Structure | null {
  let site: Structure | null = null;
  if (placeProblem(game, kind, col, row, 0, level) === null) {
    pay(game.res, levelCost(kind, level));
    site = makeStructure(game, kind, col, row, false, level);
    game.events.push({ type: "placed", x: col * TILE, y: row * TILE });
    finishIfCheating(game, site);
  }
  return site;
}

/**
 * Creates a structure and puts it on the map without any checks.
 *
 * @param game - the game, changed
 * @param kind - what
 * @param col - left column
 * @param row - top row
 * @param built - true for a finished one
 * @param level - its level
 * @returns the new structure
 */
export function makeStructure(
  game: Game,
  kind: StructureKind,
  col: number,
  row: number,
  built: boolean,
  level = 1,
): Structure {
  const structure: Structure = {
    id: game.nextId,
    kind,
    col,
    row,
    level,
    hp: 1,
    built,
    progress: built ? 1 : 0,
    upgrading: false,
    cooldown: 0,
    target: 0,
    aim: -Math.PI / 2,
    charges: kind === "minefield" ? MINE_CHARGES + level - 1 : 0,
    repairing: 0,
    firing: 0,
    hitAgo: 99,
  };
  game.nextId += 1;
  structure.hp = maxHp(game, structure) * (built ? 1 : SITE_HP);
  game.structures.push(structure);
  markDirty(game);
  return structure;
}

/**
 * Moves a building site that is not finished yet.
 *
 * @param game - the game, changed
 * @param id - the site
 * @param col - new left column
 * @param row - new top row
 * @returns true if it moved
 */
export function moveSite(
  game: Game,
  id: number,
  col: number,
  row: number,
): boolean {
  const site = game.structures.find((entry) => entry.id === id);
  const movable = site !== undefined && !site.built && !site.upgrading;
  const free = movable && placeProblem(game, site.kind, col, row, id) === null;
  if (free) {
    site.col = col;
    site.row = row;
    markDirty(game);
    game.events.push({ type: "placed", x: col * TILE, y: row * TILE });
  }
  return free;
}

/**
 * What the next level of a structure costs, or why there is none.
 *
 * @param game - the game
 * @param structure - the structure
 * @returns the price, or "max" at the top, "capped" when the HQ holds it back
 */
export function nextLevel(
  game: Game,
  structure: Structure,
): Cost | "max" | "capped" {
  const top = maxLevelOf(game, structure.kind);
  let result: Cost | "max" | "capped";
  if (structure.level >= top) {
    result = "max";
  } else if (structure.level >= levelCap(game, structure.kind)) {
    result = "capped";
  } else {
    result = upgradeCost(structure.kind, structure.level);
  }
  return result;
}

/**
 * Starts the upgrade of a finished structure.
 *
 * @param game - the game, changed
 * @param id - the structure
 * @returns true if the upgrade began
 */
export function startUpgrade(game: Game, id: number): boolean {
  const structure = game.structures.find((entry) => entry.id === id);
  const price = structure === undefined ? "max" : nextLevel(game, structure);
  const ok =
    structure !== undefined &&
    structure.built &&
    !structure.upgrading &&
    typeof price === "object" &&
    canAfford(game.res, price);
  if (ok) {
    pay(game.res, price);
    structure.upgrading = true;
    structure.progress = 0;
    finishIfCheating(game, structure);
  }
  return ok;
}

/**
 * Whether a structure could be upgraded right now - the arrow on the map.
 *
 * @param game - the game
 * @param structure - the structure
 * @returns true if it is finished, not upgrading, below its cap and affordable
 */
export function upgradeReady(game: Game, structure: Structure): boolean {
  const price =
    structure.built && !structure.upgrading
      ? nextLevel(game, structure)
      : "max";
  return typeof price === "object" && canAfford(game.res, price);
}

/**
 * What a full repair would cost.
 *
 * @param game - the game
 * @param structure - the structure
 * @returns the price (empty when nothing is to be done)
 */
export function repairCost(game: Game, structure: Structure): Cost {
  const missing = Math.max(
    0,
    maxHp(game, structure) - structure.hp - structure.repairing,
  );
  const share = missing / maxHp(game, structure);
  let cost =
    share > 0
      ? scaleCost(STRUCTURES[structure.kind].cost, share * repairShare(game))
      : {};
  if (structure.kind === "minefield") {
    const empty = MINE_CHARGES + structure.level - 1 - structure.charges;
    cost = addCost(cost, scaleCost(MINE_REARM, empty));
  }
  return cost;
}

/**
 * Whether a structure has anything to repair.
 *
 * @param game - the game
 * @param structure - the structure
 * @returns true if it is damaged (or a minefield is not full)
 */
export function needsRepair(game: Game, structure: Structure): boolean {
  const damaged =
    structure.hp + structure.repairing < maxHp(game, structure) - 1;
  const empty =
    structure.kind === "minefield" &&
    structure.charges < MINE_CHARGES + structure.level - 1;
  return structure.built && (damaged || empty);
}

/**
 * Pays for a repair; the hit points then come back over a few seconds.
 *
 * @param game - the game, changed
 * @param id - the structure
 * @returns true if the repair began
 */
export function repair(game: Game, id: number): boolean {
  const structure = game.structures.find((entry) => entry.id === id);
  const cost = structure === undefined ? {} : repairCost(game, structure);
  const ok =
    structure !== undefined &&
    needsRepair(game, structure) &&
    canAfford(game.res, cost);
  if (ok) {
    pay(game.res, cost);
    structure.repairing = maxHp(game, structure) - structure.hp;
    if (structure.kind === "minefield") {
      structure.charges = MINE_CHARGES + structure.level - 1;
    }
  }
  return ok;
}

/**
 * Repairs everything that can be afforded, most damaged first.
 *
 * @param game - the game, changed
 * @returns how many repairs began
 */
export function repairAll(game: Game): number {
  const damaged = game.structures
    .filter((entry) => needsRepair(game, entry))
    .sort((a, b) => a.hp / maxHp(game, a) - b.hp / maxHp(game, b));
  let count = 0;
  for (const structure of damaged) {
    count += repair(game, structure.id) ? 1 : 0;
  }
  return count;
}

/**
 * Tears a structure down, or cancels a site (which gives everything back).
 *
 * @param game - the game, changed
 * @param id - the structure
 * @returns true if it went
 */
export function demolish(game: Game, id: number): boolean {
  const structure = game.structures.find((entry) => entry.id === id);
  const ok = structure !== undefined && structure.kind !== "hq";
  if (ok) {
    const share = structure.built ? DEMOLISH_REFUND : 1;
    receive(game, levelCost(structure.kind, structure.level), share);
    removeStructure(game, structure);
  }
  return ok;
}

/**
 * Takes a structure off the map.
 *
 * @param game - the game, changed
 * @param structure - the structure
 */
export function removeStructure(game: Game, structure: Structure): void {
  const index = game.structures.indexOf(structure);
  if (index >= 0) {
    game.structures.splice(index, 1);
  }
  game.defenders = game.defenders.filter((unit) => unit.home !== structure.id);
  markDirty(game);
}

/**
 * The sites and upgrades that builders are working on right now.
 *
 * @param game - the game
 * @returns their ids
 */
export function busySites(game: Game): Set<number> {
  const sites = game.structures.filter(
    (entry) => !entry.built || entry.upgrading,
  );
  return new Set(sites.slice(0, builders(game)).map((entry) => entry.id));
}

/**
 * Lets the builders work, repairs run and workshops mend.
 *
 * @param game - the game, changed
 * @param dt - seconds
 */
export function construct(game: Game, dt: number): void {
  const busy = busySites(game);
  const speed = buildSpeed(game);
  for (const structure of game.structures) {
    structure.hitAgo += dt;
    if (game.cheat) {
      finishIfCheating(game, structure);
    } else if (busy.has(structure.id)) {
      advanceSite(game, structure, dt * speed);
    }
    if (structure.repairing > 0) {
      const amount = Math.min(
        structure.repairing,
        maxHp(game, structure) * REPAIR_PACE * dt,
      );
      structure.repairing -= amount;
      structure.hp = Math.min(maxHp(game, structure), structure.hp + amount);
    }
  }
  workshopRepair(game, dt);
}

/** With the cheat on, a site or upgrade is done at once. */
function finishIfCheating(game: Game, structure: Structure): void {
  if (game.cheat && (!structure.built || structure.upgrading)) {
    advanceSite(game, structure, Number.POSITIVE_INFINITY);
  }
}

/** Moves one site or upgrade forward. */
function advanceSite(game: Game, structure: Structure, work: number): void {
  const def = STRUCTURES[structure.kind];
  const time = structure.upgrading
    ? upgradeTime(structure.kind, structure.level)
    : levelTime(structure.kind, structure.level);
  const step = Math.min(1 - structure.progress, work / time);
  structure.progress += step;
  if (!structure.upgrading) {
    structure.hp = Math.min(
      maxHp(game, structure),
      structure.hp + maxHp(game, structure) * (1 - SITE_HP) * step,
    );
  }
  if (structure.progress >= 1) {
    const centre = {
      x: (structure.col + def.width / 2) * TILE,
      y: (structure.row + def.height / 2) * TILE,
    };
    if (structure.upgrading) {
      const before = maxHp(game, structure);
      structure.level += 1;
      structure.upgrading = false;
      structure.hp += maxHp(game, structure) - before;
      if (structure.kind === "minefield") {
        structure.charges += 1;
      }
      pushMessage(
        game,
        LOG.upgraded(STRUCTURE_NAMES[structure.kind], structure.level),
        "good",
      );
      game.events.push({ type: "upgraded", ...centre });
    } else {
      structure.built = true;
      structure.hp = maxHp(game, structure);
      game.stats.built += 1;
      // Walls come by the dozen; the log would show nothing else.
      if (structure.kind !== "wall") {
        pushMessage(game, LOG.built(STRUCTURE_NAMES[structure.kind]), "good");
      }
      game.events.push({ type: "built", ...centre });
    }
    markDirty(game);
  }
}

/** Workshops mend everything around them that is not under fire. */
function workshopRepair(game: Game, dt: number): void {
  const bonus = hasResearch(game, "fieldRepair") ? FIELD_REPAIR_BONUS : 1;
  for (const shop of game.structures) {
    if (shop.kind === "workshop" && shop.built) {
      const def = STRUCTURES.workshop;
      const reach = (def.aura ?? 0) * TILE;
      const sx = (shop.col + def.width / 2) * TILE;
      const sy = (shop.row + def.height / 2) * TILE;
      for (const other of game.structures) {
        const odef = STRUCTURES[other.kind];
        const ox = (other.col + odef.width / 2) * TILE;
        const oy = (other.row + odef.height / 2) * TILE;
        const top = maxHp(game, other);
        const due =
          other.built &&
          other.hp < top &&
          other.hitAgo > REPAIR_CALM &&
          Math.hypot(ox - sx, oy - sy) <= reach;
        if (due) {
          other.hp = Math.min(
            top,
            other.hp + WORKSHOP_REPAIR * shop.level * bonus * dt,
          );
        }
      }
    }
  }
}

/** Terrain, room, radius and special needs of a footprint. */
function footprintProblem(
  game: Game,
  kind: StructureKind,
  col: number,
  row: number,
  moving: number,
): PlaceProblem | null {
  const def = STRUCTURES[kind];
  const centre = hqCentre();
  const cx = col + def.width / 2;
  const cy = row + def.height / 2;
  let problem: PlaceProblem | null = null;
  for (let r = row; r < row + def.height && problem === null; r += 1) {
    for (let c = col; c < col + def.width && problem === null; c += 1) {
      const terrain = terrainAt(game.seed, c, r);
      const other = structureAt(game, c, r);
      if (!isBuildable(terrain)) {
        problem = "terrain";
      } else if (other !== undefined && other.id !== moving) {
        problem = "occupied";
      }
    }
  }
  const ore = siteYield(game.seed, "mine", col, row);
  const deposit = ore.iron + ore.stone > 0;
  if (
    problem === null &&
    Math.hypot(cx - centre.col - HALF, cy - centre.row - HALF) >
      buildRadius(game)
  ) {
    problem = "radius";
  } else if (problem === null && kind === "mine" && !deposit) {
    problem = "deposit";
  } else if (
    problem === null &&
    kind === "lumberCamp" &&
    siteYield(game.seed, kind, col, row).trees < LUMBER_MIN_TREES
  ) {
    problem = "trees";
  } else if (
    problem === null &&
    enemiesNear(game, cx * TILE, cy * TILE, def.width)
  ) {
    problem = "enemies";
  }
  return problem;
}

/** Whether any enemy stands close to a footprint. */
function enemiesNear(game: Game, x: number, y: number, size: number): boolean {
  const reach = (ENEMY_CLEARANCE + size / 2) * TILE;
  return game.enemies.some(
    (enemy) => enemy.alive && Math.hypot(enemy.x - x, enemy.y - y) < reach,
  );
}
