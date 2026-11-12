/**
 * Every building and defence: size, price, hit points, what it makes, what it
 * needs and how it fights.
 *
 * @module
 * @remarks
 * The balance lives in these tables and nowhere else. Values are for level
 * one; the level curves below scale them.
 */
import type {
  BuildingKind,
  Cost,
  DefenseKind,
  MenuGroup,
  StructureKind,
} from "./types";

/** How a tower chooses among the enemies in reach. */
export type Targeting = "first" | "strongest" | "nearest";

/** The weapon of a defence. */
export type WeaponDef = {
  /** Reach in tiles. */
  readonly range: number;
  /** Damage per shot (per tick for the flamethrower). */
  readonly damage: number;
  /** Seconds between shots. */
  readonly interval: number;
  readonly targeting: Targeting;
  /** Radius of the blast in tiles, for splash weapons. */
  readonly splash?: number;
  /** How many enemies a lightning jumps to. */
  readonly chain?: number;
  /** Burning damage per second and its duration. */
  readonly burnDps?: number;
  readonly burnTime?: number;
  /** Seconds a hit stuns. */
  readonly stun?: number;
  /** What one shot uses up. */
  readonly ammo?: Cost;
  /** Opening of the flame cone, radians. */
  readonly cone?: number;
};

/** One kind of structure. */
export type StructureDef = {
  readonly kind: StructureKind;
  readonly group: MenuGroup;
  /** Footprint in tiles. */
  readonly width: number;
  readonly height: number;
  readonly cost: Cost;
  /** Seconds to build with one builder. */
  readonly buildTime: number;
  readonly hp: number;
  readonly maxLevel: number;
  /** Headquarters level needed to build it. */
  readonly needsHq: number;
  /** Research needed to build it. */
  readonly needsResearch?: string;
  /** Made per second at level one. */
  readonly produce?: Cost;
  /** Used per second at level one (energy included). */
  readonly consume?: Cost;
  /** Added to every storage limit per level. */
  readonly storage?: number;
  /** Radius of its light in tiles. */
  readonly light: number;
  readonly weapon?: WeaponDef;
  /** Radius in tiles of a support effect (repair, healing, guarding). */
  readonly aura?: number;
};

/** Every structure, by kind. */
export const STRUCTURES: Readonly<Record<StructureKind, StructureDef>> = {
  hq: {
    kind: "hq",
    group: "base",
    width: 3,
    height: 3,
    cost: { wood: 260, iron: 180, stone: 220 },
    buildTime: 40,
    hp: 2600,
    maxLevel: 5,
    needsHq: 99,
    produce: { wood: 0.7, stone: 0.4, iron: 0.4, food: 0.9, energy: 1.2 },
    storage: 250,
    light: 7,
  },
  warehouse: {
    kind: "warehouse",
    group: "base",
    width: 2,
    height: 2,
    cost: { wood: 80, stone: 40 },
    buildTime: 18,
    hp: 700,
    maxLevel: 4,
    needsHq: 1,
    storage: 400,
    light: 3,
  },
  barracks: {
    kind: "barracks",
    group: "base",
    width: 2,
    height: 2,
    cost: { wood: 120, iron: 60, stone: 60, food: 40 },
    buildTime: 28,
    hp: 850,
    maxLevel: 4,
    needsHq: 2,
    consume: { energy: 0.4 },
    light: 3,
    aura: 7,
  },
  workshop: {
    kind: "workshop",
    group: "production",
    width: 2,
    height: 2,
    cost: { wood: 120, iron: 80, stone: 60 },
    buildTime: 28,
    hp: 650,
    maxLevel: 4,
    needsHq: 2,
    produce: { fuel: 0.7 },
    consume: { wood: 0.8, energy: 0.6 },
    light: 3,
    aura: 6,
  },
  generator: {
    kind: "generator",
    group: "production",
    width: 2,
    height: 2,
    cost: { wood: 60, iron: 60, stone: 30 },
    buildTime: 18,
    hp: 500,
    maxLevel: 4,
    needsHq: 1,
    produce: { energy: 3 },
    light: 5,
  },
  mine: {
    kind: "mine",
    group: "production",
    width: 2,
    height: 2,
    cost: { wood: 70, iron: 20 },
    buildTime: 18,
    hp: 600,
    maxLevel: 4,
    needsHq: 1,
    produce: { iron: 1.5, stone: 1.6 },
    consume: { energy: 0.4 },
    light: 3,
  },
  lumberCamp: {
    kind: "lumberCamp",
    group: "production",
    width: 2,
    height: 2,
    cost: { wood: 50 },
    buildTime: 14,
    hp: 450,
    maxLevel: 4,
    needsHq: 1,
    produce: { wood: 2.2, food: 0.45 },
    light: 3,
  },
  lab: {
    kind: "lab",
    group: "base",
    width: 2,
    height: 2,
    cost: { wood: 100, iron: 100, stone: 80 },
    buildTime: 28,
    hp: 550,
    maxLevel: 4,
    needsHq: 2,
    consume: { energy: 1 },
    light: 4,
  },
  infirmary: {
    kind: "infirmary",
    group: "base",
    width: 2,
    height: 2,
    cost: { wood: 100, iron: 60, stone: 60, food: 30 },
    buildTime: 28,
    hp: 500,
    maxLevel: 3,
    needsHq: 3,
    consume: { energy: 0.5 },
    light: 3,
    aura: 7,
  },
  machineGun: {
    kind: "machineGun",
    group: "defense",
    width: 2,
    height: 2,
    cost: { wood: 60, iron: 40 },
    buildTime: 12,
    hp: 450,
    maxLevel: 4,
    needsHq: 1,
    light: 3,
    weapon: { range: 5.5, damage: 8, interval: 0.2, targeting: "first" },
  },
  cannon: {
    kind: "cannon",
    group: "defense",
    width: 2,
    height: 2,
    cost: { wood: 80, iron: 110, stone: 60 },
    buildTime: 18,
    hp: 520,
    maxLevel: 4,
    needsHq: 1,
    needsResearch: "ballistics",
    light: 3,
    weapon: {
      range: 6.5,
      damage: 58,
      interval: 1.7,
      targeting: "first",
      splash: 1.4,
    },
  },
  sniper: {
    kind: "sniper",
    group: "defense",
    width: 2,
    height: 2,
    cost: { wood: 60, iron: 140 },
    buildTime: 18,
    hp: 300,
    maxLevel: 4,
    needsHq: 1,
    needsResearch: "optics",
    light: 2,
    weapon: { range: 11, damage: 130, interval: 2.3, targeting: "strongest" },
  },
  tesla: {
    kind: "tesla",
    group: "defense",
    width: 2,
    height: 2,
    cost: { iron: 150, stone: 80, energy: 50 },
    buildTime: 20,
    hp: 380,
    maxLevel: 4,
    needsHq: 1,
    needsResearch: "highVoltage",
    light: 4,
    weapon: {
      range: 4.6,
      damage: 34,
      interval: 1.1,
      targeting: "nearest",
      chain: 4,
      stun: 0.3,
      ammo: { energy: 2 },
    },
  },
  flamethrower: {
    kind: "flamethrower",
    group: "defense",
    width: 2,
    height: 2,
    cost: { iron: 110, stone: 40, fuel: 30 },
    buildTime: 16,
    hp: 620,
    maxLevel: 4,
    needsHq: 1,
    needsResearch: "thermo",
    light: 4,
    weapon: {
      range: 3.3,
      damage: 5,
      interval: 0.1,
      targeting: "nearest",
      burnDps: 10,
      burnTime: 3,
      cone: 0.55,
      ammo: { fuel: 0.04 },
    },
  },
  minefield: {
    kind: "minefield",
    group: "defense",
    width: 2,
    height: 2,
    cost: { iron: 50, stone: 20 },
    buildTime: 8,
    hp: 120,
    maxLevel: 4,
    needsHq: 1,
    needsResearch: "explosives",
    light: 0,
    weapon: {
      range: 1.2,
      damage: 180,
      interval: 0.6,
      targeting: "nearest",
      splash: 1.7,
    },
  },
  wall: {
    kind: "wall",
    group: "defense",
    width: 1,
    height: 1,
    cost: { stone: 12, wood: 4 },
    buildTime: 4,
    hp: 700,
    maxLevel: 4,
    needsHq: 1,
    light: 0,
  },
};

/** The build menu, in the order it is shown. */
export const MENU: Readonly<Record<MenuGroup, readonly StructureKind[]>> = {
  base: ["warehouse", "barracks", "lab", "infirmary"],
  production: ["lumberCamp", "mine", "generator", "workshop"],
  defense: [
    "machineGun",
    "wall",
    "cannon",
    "minefield",
    "sniper",
    "flamethrower",
    "tesla",
  ],
};

/** Mines in a minefield at level one, and one more per level. */
export const MINE_CHARGES = 3;

/** What one mine costs to lay again. */
export const MINE_REARM: Cost = { iron: 12, stone: 4 };

/** Soldiers a barracks keeps at level one, one more per level. */
export const BARRACKS_SOLDIERS = 2;

/** Seconds to train one soldier, and what it costs. */
export const SOLDIER_TRAIN_TIME = 16;
export const SOLDIER_COST: Cost = { food: 20 };

/** A soldier's hit points, damage, reach (tiles), interval and pace. */
export const SOLDIER = {
  hp: 130,
  damage: 10,
  range: 4,
  interval: 0.9,
  speed: 1.8,
};

/** Food each soldier eats per second. */
export const SOLDIER_FOOD = 0.03;

/** Hit points per second the workshop repairs per level. */
export const WORKSHOP_REPAIR = 5;

/** Hit points per second the infirmary heals per level. */
export const INFIRMARY_HEAL = 9;

/** Research points per second of a lab at level one. */
export const LAB_SPEED = 1;

/** Trees within this many tiles feed a lumber camp. */
export const LUMBER_REACH = 4;

/** Trees for full output, and the least output a camp makes. */
export const LUMBER_FULL = 12;
export const LUMBER_MIN_TREES = 3;

/** Every building kind (not the defences). */
export const BUILDING_KINDS: readonly BuildingKind[] = [
  "hq",
  "warehouse",
  "barracks",
  "workshop",
  "generator",
  "mine",
  "lumberCamp",
  "lab",
  "infirmary",
];

/** Every defence kind. */
export const DEFENSE_KINDS: readonly DefenseKind[] =
  MENU.defense as readonly DefenseKind[];

/** Every kind there is. */
export const STRUCTURE_KINDS: readonly StructureKind[] = Object.keys(
  STRUCTURES,
) as StructureKind[];

/** Growth of output per level. */
const OUTPUT_STEP = 0.6;

/** Growth of hit points per level (walls grow faster). */
const HP_STEP = 0.4;
const WALL_HP_STEP = 0.75;

/** Growth of weapon damage, reach and pace per level. */
const DAMAGE_STEP = 0.4;
const RANGE_STEP = 0.08;
const PACE_STEP = 0.1;

/** How much dearer each upgrade is than the last. */
const UPGRADE_GROWTH = 1.55;

/** First upgrade price, as a share of the build price. */
const UPGRADE_SHARE = 0.85;

/** Upgrade time growth per level. */
const UPGRADE_TIME_STEP = 0.5;

/**
 * Output factor of a level.
 *
 * @param level - the structure's level
 * @returns the factor on its production
 */
export function outputFactor(level: number): number {
  return 1 + OUTPUT_STEP * (level - 1);
}

/**
 * Hit point factor of a level.
 *
 * @param kind - which structure
 * @param level - its level
 * @returns the factor on its hit points
 */
export function hpFactor(kind: StructureKind, level: number): number {
  return 1 + (kind === "wall" ? WALL_HP_STEP : HP_STEP) * (level - 1);
}

/**
 * Weapon factors of a level.
 *
 * @param level - the tower's level
 * @returns factors on damage, range and fire rate
 */
export function weaponFactors(level: number): {
  damage: number;
  range: number;
  rate: number;
} {
  return {
    damage: 1 + DAMAGE_STEP * (level - 1),
    range: 1 + RANGE_STEP * (level - 1),
    rate: 1 + PACE_STEP * (level - 1),
  };
}

/**
 * What it costs to take a structure from one level to the next.
 *
 * @param kind - which structure
 * @param level - its current level
 * @returns the price
 */
export function upgradeCost(kind: StructureKind, level: number): Cost {
  const factor = UPGRADE_SHARE * UPGRADE_GROWTH ** (level - 1);
  const result: Partial<Record<keyof Cost, number>> = {};
  for (const [res, amount] of Object.entries(STRUCTURES[kind].cost)) {
    result[res as keyof Cost] = Math.round((amount ?? 0) * factor);
  }
  return result;
}

/**
 * Seconds an upgrade from a level takes with one builder.
 *
 * @param kind - which structure
 * @param level - its current level
 * @returns the time
 */
export function upgradeTime(kind: StructureKind, level: number): number {
  return STRUCTURES[kind].buildTime * (1 + UPGRADE_TIME_STEP * level);
}

/**
 * What a structure costs when it is built right away at a level - the build
 * price and every upgrade up to there.
 *
 * @param kind - which structure
 * @param level - the level it is to have
 * @returns the price
 */
export function levelCost(kind: StructureKind, level: number): Cost {
  const result: Partial<Record<keyof Cost, number>> = {
    ...STRUCTURES[kind].cost,
  };
  for (let from = 1; from < level; from += 1) {
    for (const [res, amount] of Object.entries(upgradeCost(kind, from))) {
      const id = res as keyof Cost;
      result[id] = (result[id] ?? 0) + (amount ?? 0);
    }
  }
  return result;
}

/**
 * Seconds a site takes with one builder when it is built right away at a
 * level - the build time and every upgrade up to there.
 *
 * @param kind - which structure
 * @param level - the level it is to have
 * @returns the seconds
 */
export function levelTime(kind: StructureKind, level: number): number {
  let time = STRUCTURES[kind].buildTime;
  for (let from = 1; from < level; from += 1) {
    time += upgradeTime(kind, from);
  }
  return time;
}

/**
 * Whether a kind is a defence.
 *
 * @param kind - which structure
 * @returns true for towers, minefields and walls
 */
export function isDefense(kind: StructureKind): boolean {
  return STRUCTURES[kind].group === "defense";
}
