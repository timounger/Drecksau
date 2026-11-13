/**
 * The kinds of land unit as data: what each is like in a fight, what it
 * costs and takes to train, and when it is open - the data side of the
 * troops in `troops.ts`.
 *
 * @module
 * @remarks
 * The old single soldier is the line infantry here (same values), so saves
 * from before keep their troops as they were. A unit is open to a player
 * when the player's houses have reached its tier (peak tier), its research
 * is done and the player owns a finished building of its kind where one is
 * named. Costs come from the island of the barracks when training starts.
 */
import type {
  Amounts,
  BuildingKind,
  ResearchId,
  UnitCategory,
  UnitKind,
} from "./types";

/** What a unit's special skill is. */
export type UnitAbility = "none" | "heal" | "repair" | "scout";

/** How a unit is drawn: on foot, on horseback, or a gun with its crew. */
export type UnitShape = "foot" | "rider" | "gun";

/** The fixed facts about a kind of land unit. */
export type UnitDef = {
  readonly kind: UnitKind;
  readonly category: UnitCategory;
  /** Hit points. */
  readonly hp: number;
  /** Damage of one blow or shot before armour. */
  readonly damage: number;
  /** Reach in tiles; above {@link MELEE_REACH} it fights from a distance. */
  readonly range: number;
  /** Seconds between two blows or shots. */
  readonly reload: number;
  /** Tiles per second on foot or horse. */
  readonly speed: number;
  /** Share of every hit it shrugs off, 0 to 1. */
  readonly armour: number;
  /** How far it notices enemies, tiles. */
  readonly sight: number;
  /** Gold and goods to train one. */
  readonly cost: { readonly gold: number } & Amounts;
  /** Seconds of training. */
  readonly train: number;
  /** Gold per minute while it serves. */
  readonly upkeep: number;
  /** Peak tier of the player's houses needed. */
  readonly tier: number;
  /** Research needed, or null. */
  readonly research: ResearchId | null;
  /** A finished building of this kind the player must own, or null. */
  readonly building: BuildingKind | null;
  /** Factor on its damage against buildings. */
  readonly vsBuilding: number;
  /** Factor on its damage against units that hold a position (dug in). */
  readonly vsEntrenched: number;
  /** Factor on its damage when an enemy stands in melee reach (ranged units). */
  readonly closeMalus: number;
  /** Radius its shots hurt around the target, tiles; 0 for a single target. */
  readonly splash: number;
  readonly ability: UnitAbility;
  /** Strength of the skill: hit points healed or mended per second. */
  readonly power: number;
  readonly shape: UnitShape;
};

/** Farther than this a unit fights from a distance, tiles. */
export const MELEE_REACH = 2;

/** Tiers by name. */
const FARMERS = 0;
const WORKERS = 1;
const CRAFTSMEN = 2;
const MERCHANTS = 3;

/** Every kind of unit, in the order of the barracks. */
export const UNITS: readonly UnitDef[] = [
  {
    kind: "militia",
    category: "infantry",
    hp: 60,
    damage: 6,
    range: 1.5,
    reload: 1.2,
    speed: 1.2,
    armour: 0,
    sight: 6,
    cost: { gold: 60, wood: 2 },
    train: 6,
    upkeep: 1,
    tier: FARMERS,
    research: null,
    building: null,
    vsBuilding: 0.4,
    vsEntrenched: 1,
    closeMalus: 1,
    splash: 0,
    ability: "none",
    power: 0,
    shape: "foot",
  },
  {
    kind: "line",
    category: "infantry",
    hp: 80,
    damage: 9,
    range: 1.6,
    reload: 1.2,
    speed: 1.1,
    armour: 0,
    sight: 6,
    cost: { gold: 120, tools: 1 },
    train: 13,
    upkeep: 2,
    tier: WORKERS,
    research: null,
    building: null,
    vsBuilding: 0.6,
    vsEntrenched: 1,
    closeMalus: 1,
    splash: 0,
    ability: "none",
    power: 0,
    shape: "foot",
  },
  {
    kind: "grenadier",
    category: "heavy",
    hp: 100,
    damage: 13,
    range: 2.2,
    reload: 1.6,
    speed: 1,
    armour: 0.15,
    sight: 6,
    cost: { gold: 220, tools: 1, weapons: 2 },
    train: 18,
    upkeep: 4,
    tier: CRAFTSMEN,
    research: null,
    building: null,
    vsBuilding: 2.4,
    vsEntrenched: 1.3,
    closeMalus: 1,
    splash: 0,
    ability: "none",
    power: 0,
    shape: "foot",
  },
  {
    kind: "elite",
    category: "heavy",
    hp: 170,
    damage: 16,
    range: 1.7,
    reload: 1.1,
    speed: 1.15,
    armour: 0.3,
    sight: 7,
    cost: { gold: 380, weapons: 2, clothing: 2 },
    train: 23,
    upkeep: 6,
    tier: MERCHANTS,
    research: "tactics",
    building: null,
    vsBuilding: 0.8,
    vsEntrenched: 1,
    closeMalus: 1,
    splash: 0,
    ability: "none",
    power: 0,
    shape: "foot",
  },
  {
    kind: "musketeer",
    category: "ranged",
    hp: 70,
    damage: 11,
    range: 4.5,
    reload: 2,
    speed: 1,
    armour: 0.05,
    sight: 7,
    cost: { gold: 160, weapons: 2 },
    train: 15,
    upkeep: 3,
    tier: CRAFTSMEN,
    research: null,
    building: null,
    vsBuilding: 0.5,
    vsEntrenched: 1,
    closeMalus: 0.5,
    splash: 0,
    ability: "none",
    power: 0,
    shape: "foot",
  },
  {
    kind: "sharpshooter",
    category: "ranged",
    hp: 60,
    damage: 30,
    range: 7.5,
    reload: 4,
    speed: 1,
    armour: 0,
    sight: 10,
    cost: { gold: 320, weapons: 2, tools: 2 },
    train: 20,
    upkeep: 5,
    tier: MERCHANTS,
    research: "tactics",
    building: null,
    vsBuilding: 0.3,
    vsEntrenched: 1,
    closeMalus: 0.4,
    splash: 0,
    ability: "none",
    power: 0,
    shape: "foot",
  },
  {
    kind: "artillery",
    category: "ranged",
    hp: 90,
    damage: 34,
    range: 6.5,
    reload: 5,
    speed: 0.55,
    armour: 0.1,
    sight: 8,
    cost: { gold: 420, cannons: 1, planks: 4 },
    train: 25,
    upkeep: 6,
    tier: CRAFTSMEN,
    research: "gunnery",
    building: null,
    vsBuilding: 3,
    vsEntrenched: 1.5,
    closeMalus: 0.3,
    splash: 1.6,
    ability: "none",
    power: 0,
    shape: "gun",
  },
  {
    kind: "cavalry",
    category: "special",
    hp: 120,
    damage: 13,
    range: 1.6,
    reload: 1.1,
    speed: 2.4,
    armour: 0.15,
    sight: 8,
    cost: { gold: 300, weapons: 1, grain: 6 },
    train: 20,
    upkeep: 5,
    tier: MERCHANTS,
    research: null,
    building: "grainFarm",
    vsBuilding: 0.5,
    vsEntrenched: 0.45,
    closeMalus: 1,
    splash: 0,
    ability: "none",
    power: 0,
    shape: "rider",
  },
  {
    kind: "pioneer",
    category: "special",
    hp: 80,
    damage: 7,
    range: 1.5,
    reload: 1.3,
    speed: 1.1,
    armour: 0.1,
    sight: 6,
    cost: { gold: 180, tools: 3, planks: 4 },
    train: 15,
    upkeep: 3,
    tier: CRAFTSMEN,
    research: "fortification",
    building: null,
    vsBuilding: 1.2,
    vsEntrenched: 1,
    closeMalus: 1,
    splash: 0,
    ability: "repair",
    power: 6,
    shape: "foot",
  },
  {
    kind: "medic",
    category: "special",
    hp: 60,
    damage: 3,
    range: 1.4,
    reload: 1.5,
    speed: 1.1,
    armour: 0,
    sight: 6,
    cost: { gold: 200, cloth: 4 },
    train: 15,
    upkeep: 3,
    tier: MERCHANTS,
    research: null,
    building: "doctor",
    vsBuilding: 0.2,
    vsEntrenched: 1,
    closeMalus: 1,
    splash: 0,
    ability: "heal",
    power: 4,
    shape: "foot",
  },
  {
    kind: "scout",
    category: "special",
    hp: 55,
    damage: 5,
    range: 1.5,
    reload: 1.2,
    speed: 2,
    armour: 0,
    sight: 14,
    cost: { gold: 90, tools: 1 },
    train: 8,
    upkeep: 2,
    tier: CRAFTSMEN,
    research: null,
    building: null,
    vsBuilding: 0.3,
    vsEntrenched: 1,
    closeMalus: 1,
    splash: 0,
    ability: "scout",
    power: 0,
    shape: "rider",
  },
];

/** Looking a unit kind up. */
export const UNIT: Readonly<Record<UnitKind, UnitDef>> = Object.fromEntries(
  UNITS.map((def) => [def.kind, def]),
) as Record<UnitKind, UnitDef>;

/** The kinds, in barracks order. */
export const UNIT_KINDS: readonly UnitKind[] = UNITS.map((def) => def.kind);

/** The shelves of the barracks, in order. */
export const UNIT_CATEGORIES: readonly UnitCategory[] = [
  "infantry",
  "ranged",
  "heavy",
  "special",
];

/** What the old single soldier of older saves becomes. */
export const OLD_SOLDIER: UnitKind = "line";

/** Units a barracks keeps on order at most, the one in training included. */
export const DRILL_ORDERS = 10;

/** Medics heal and pioneers mend this far around them, tiles. */
export const SKILL_RANGE = 3;

/** A scout shows enemy troops and ships this far on the maps, tiles. */
export const SCOUT_REVEAL = 16;

/**
 * Whether a value is a unit kind.
 *
 * @param value - anything
 * @returns true for a known kind
 */
export function isUnitKind(value: unknown): value is UnitKind {
  return typeof value === "string" && UNIT_KINDS.includes(value as UnitKind);
}
