/**
 * Everything that changes a number depending on the state: research, the
 * headquarters' level, day and night, the blizzard, random events.
 *
 * @module
 */
import {
  hpFactor,
  isDefense,
  outputFactor,
  STRUCTURES,
  weaponFactors,
} from "./structures";
import type { Game, Structure, StructureKind } from "./types";

/** Seconds of one day and night. */
export const DAY_LENGTH = 360;

/** When dusk begins, night is full, dawn begins, all in seconds of the day. */
const DUSK = 220;
const NIGHT = 250;
const DAWN = 320;

/** How much the night shortens a tower's reach - without and with lights. */
const NIGHT_RANGE = 0.3;
const NIGHT_RANGE_LIT = 0.08;

/** How much a full blizzard shortens a tower's reach - without and with optics. */
const STORM_RANGE = 0.4;
const STORM_RANGE_THERMAL = 0.18;

/** How much a full blizzard slows production - without and with insulation. */
const STORM_OUTPUT = 0.3;
const STORM_OUTPUT_INSULATED = 0.12;

/** Production during a cold snap - without and with insulation. */
const COLD_OUTPUT = 0.7;
const COLD_OUTPUT_INSULATED = 0.85;

/** How much a blizzard slows enemies. */
const STORM_SLOW = 0.15;

/** Bonuses of research. */
const PRODUCTION_BONUS = 1.25;
const AMMO_BONUS = 0.15;
const RAPID_BONUS = 1.2;
const ARMOR_BONUS = 0.25;
const BUILD_BONUS = 1.5;
const REPAIR_SHARE = 0.5;
const REPAIR_SHARE_FIELD = 0.3;
const AURORA_RESEARCH = 2;

/** Builders at the start, and more per two headquarters levels. */
const BASE_BUILDERS = 2;
const HQ_LEVELS_PER_BUILDER = 2;

/** Build radius around the headquarters in tiles, and growth per level. */
const BASE_RADIUS = 10;
const RADIUS_STEP = 3;
const OUTPOST_RADIUS = 5;

/** Storage before any building, and per headquarters level. */
const BASE_STORAGE = 300;

/** What every store holds while the cheat is on. */
export const CHEAT_STOCK = 99999;

/** A full blizzard and full night reduce sight to this share of the screen. */
const NIGHT_DARKNESS = 0.82;

/** Energy consumption growth per level. */
const ENERGY_STEP = 0.3;

/**
 * Whether a project is researched.
 *
 * @param game - the game
 * @param id - the project
 * @returns true once done
 */
export function hasResearch(game: Game, id: string): boolean {
  return game.research.done.includes(id);
}

/**
 * The headquarters, if it still stands.
 *
 * @param game - the game
 * @returns it, or undefined
 */
export function headquarters(game: Game): Structure | undefined {
  return game.structures.find((entry) => entry.kind === "hq");
}

/**
 * The headquarters' level.
 *
 * @param game - the game
 * @returns its level, 1 if it is gone
 */
export function hqLevel(game: Game): number {
  return headquarters(game)?.level ?? 1;
}

/**
 * Full hit points of a structure.
 *
 * @param game - the game, for research
 * @param structure - the structure
 * @returns its maximum
 */
export function maxHp(game: Game, structure: Structure): number {
  const def = STRUCTURES[structure.kind];
  let armor = 1;
  if (isDefense(structure.kind)) {
    armor += hasResearch(game, "armor1") ? ARMOR_BONUS : 0;
    armor += hasResearch(game, "armor2") ? ARMOR_BONUS : 0;
  }
  return Math.round(def.hp * hpFactor(structure.kind, structure.level) * armor);
}

/**
 * The highest level a structure may reach right now.
 *
 * @param game - the game
 * @param kind - which structure
 * @returns the level cap
 * @remarks
 * Nothing may outgrow the headquarters, and fortress building lifts the cap
 * of the defences by one.
 */
export function levelCap(game: Game, kind: StructureKind): number {
  const extra = isDefense(kind) && hasResearch(game, "fortress") ? 1 : 0;
  const own = maxLevelOf(game, kind);
  return kind === "hq" || game.cheat
    ? own
    : Math.min(own, hqLevel(game) + extra);
}

/**
 * The highest level a kind can ever reach in this game.
 *
 * @param game - the game, for research
 * @param kind - which structure
 * @returns its top level
 */
export function maxLevelOf(game: Game, kind: StructureKind): number {
  const extra = isDefense(kind) && hasResearch(game, "fortress") ? 1 : 0;
  return STRUCTURES[kind].maxLevel + extra;
}

/**
 * How dark it is.
 *
 * @param game - the game
 * @returns 0 by day, 1 at full night
 */
export function darkness(game: Game): number {
  const clock = game.weather.clock;
  let dark = 0;
  if (clock >= DUSK && clock < NIGHT) {
    dark = (clock - DUSK) / (NIGHT - DUSK);
  } else if (clock >= NIGHT && clock < DAWN) {
    dark = 1;
  } else if (clock >= DAWN) {
    dark = 1 - (clock - DAWN) / (DAY_LENGTH - DAWN);
  }
  return dark;
}

/**
 * How far the eye reaches, as a share: 1 by clear day.
 *
 * @param game - the game
 * @returns the factor on every tower's reach
 */
export function sightFactor(game: Game): number {
  const night = hasResearch(game, "floodlights")
    ? NIGHT_RANGE_LIT
    : NIGHT_RANGE;
  const storm = hasResearch(game, "thermal")
    ? STORM_RANGE_THERMAL
    : STORM_RANGE;
  return (1 - night * darkness(game)) * (1 - storm * game.weather.storm);
}

/**
 * How much of the screen the dark and the snow hide, for drawing.
 *
 * @param game - the game
 * @returns 0 (clear) to about 0.9
 */
export function gloom(game: Game): number {
  return Math.min(
    1,
    darkness(game) * NIGHT_DARKNESS + game.weather.storm * (1 - NIGHT_DARKNESS),
  );
}

/**
 * The factor on all production.
 *
 * @param game - the game
 * @returns 1 normally, more with research, less in storms and cold
 */
export function outputMultiplier(game: Game): number {
  const insulated = hasResearch(game, "insulation");
  let factor = hasResearch(game, "production") ? PRODUCTION_BONUS : 1;
  factor *=
    1 -
    (insulated ? STORM_OUTPUT_INSULATED : STORM_OUTPUT) * game.weather.storm;
  if (game.effects.some((effect) => effect.kind === "coldSnap")) {
    factor *= insulated ? COLD_OUTPUT_INSULATED : COLD_OUTPUT;
  }
  return factor;
}

/**
 * The factor on enemy pace from the weather.
 *
 * @param game - the game
 * @returns 1 in clear weather, less in a blizzard
 */
export function enemyPace(game: Game): number {
  return 1 - STORM_SLOW * game.weather.storm;
}

/**
 * A tower's weapon numbers right now.
 *
 * @param game - the game
 * @param structure - the tower
 * @returns damage per shot, reach in tiles, seconds between shots
 */
export function weaponStats(
  game: Game,
  structure: Structure,
): { damage: number; range: number; interval: number } {
  const weapon = STRUCTURES[structure.kind].weapon;
  const factors = weaponFactors(structure.level);
  let damage = (weapon?.damage ?? 0) * factors.damage;
  damage *= 1 + (hasResearch(game, "ammo1") ? AMMO_BONUS : 0);
  damage *= 1 + (hasResearch(game, "ammo2") ? AMMO_BONUS : 0);
  const rate = factors.rate * (hasResearch(game, "rapid") ? RAPID_BONUS : 1);
  const field = structure.kind === "minefield";
  const sight = field ? 1 : sightFactor(game);
  const boost = field ? 1 : game.rangeBoost;
  return {
    damage,
    range: (weapon?.range ?? 0) * factors.range * sight * boost,
    interval: (weapon?.interval ?? 1) / rate,
  };
}

/**
 * How many structures are built at once.
 *
 * @param game - the game
 * @returns the number of builders
 */
export function builders(game: Game): number {
  return (
    BASE_BUILDERS +
    Math.floor((hqLevel(game) - 1) / HQ_LEVELS_PER_BUILDER) +
    (hasResearch(game, "machinery") ? 1 : 0)
  );
}

/**
 * The factor on building speed.
 *
 * @param game - the game
 * @returns 1, or more with machinery
 */
export function buildSpeed(game: Game): number {
  return hasResearch(game, "machinery") ? BUILD_BONUS : 1;
}

/**
 * How far from the headquarters one may build.
 *
 * @param game - the game
 * @returns radius in tiles
 */
export function buildRadius(game: Game): number {
  return (
    BASE_RADIUS +
    RADIUS_STEP * (hqLevel(game) - 1) +
    (hasResearch(game, "outposts") ? OUTPOST_RADIUS : 0)
  );
}

/**
 * The storage limit of every resource.
 *
 * @param game - the game
 * @returns the most of each that can be kept
 */
export function storageLimit(game: Game): number {
  let limit = game.cheat ? CHEAT_STOCK : BASE_STORAGE;
  for (const structure of game.structures) {
    const per = STRUCTURES[structure.kind].storage;
    if (per !== undefined && structure.built) {
      limit += per * structure.level;
    }
  }
  return limit;
}

/**
 * What a repair costs, as a share of the build price per hit point share.
 *
 * @param game - the game
 * @returns the share
 */
export function repairShare(game: Game): number {
  return hasResearch(game, "fieldRepair") ? REPAIR_SHARE_FIELD : REPAIR_SHARE;
}

/**
 * Research points per second.
 *
 * @param game - the game
 * @returns the speed, 0 without a finished lab
 */
export function researchSpeed(game: Game): number {
  let speed = 0;
  for (const structure of game.structures) {
    if (structure.kind === "lab" && structure.built) {
      speed += outputFactor(structure.level);
    }
  }
  const aurora = game.effects.some((effect) => effect.kind === "aurora");
  return speed * (aurora ? AURORA_RESEARCH : 1);
}

/**
 * Energy a structure uses per second.
 *
 * @param structure - the structure
 * @returns its draw
 */
export function energyDraw(structure: Structure): number {
  const base = STRUCTURES[structure.kind].consume?.energy ?? 0;
  return structure.built ? base * (1 + ENERGY_STEP * (structure.level - 1)) : 0;
}
