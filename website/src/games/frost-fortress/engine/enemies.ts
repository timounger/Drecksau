/**
 * The six enemy types and how a wave scales them.
 *
 * @module
 */
import type { Cost, EnemyKind } from "./types";

/** One enemy type at wave one. */
export type EnemyDef = {
  readonly kind: EnemyKind;
  readonly hp: number;
  /** Flat damage taken off every hit. */
  readonly armor: number;
  /** Tiles per second. */
  readonly speed: number;
  readonly damage: number;
  /** Reach in tiles. */
  readonly range: number;
  /** Seconds between attacks. */
  readonly interval: number;
  /** Blast radius of its attack, in tiles (0 for a single target). */
  readonly splash: number;
  /** What it costs a wave's budget. */
  readonly points: number;
  /** First wave it may appear in. */
  readonly fromWave: number;
  /** Chance of leaving loot, and what. */
  readonly lootChance: number;
  readonly loot: Cost;
  /** Drawn radius in world units. */
  readonly radius: number;
  /** Prefers towers as targets. */
  readonly huntsTowers: boolean;
};

/** Every enemy type, by kind. */
export const ENEMIES: Readonly<Record<EnemyKind, EnemyDef>> = {
  raider: {
    kind: "raider",
    hp: 45,
    armor: 0,
    speed: 2.4,
    damage: 6,
    range: 0.75,
    interval: 0.8,
    splash: 0,
    points: 1,
    fromWave: 1,
    lootChance: 0.35,
    loot: { wood: 14, food: 8 },
    radius: 7,
    huntsTowers: false,
  },
  soldier: {
    kind: "soldier",
    hp: 95,
    armor: 1,
    speed: 1.35,
    damage: 7,
    range: 3.4,
    interval: 1.1,
    splash: 0,
    points: 2,
    fromWave: 1,
    lootChance: 0.25,
    loot: { iron: 10, wood: 8 },
    radius: 8,
    huntsTowers: false,
  },
  heavy: {
    kind: "heavy",
    hp: 340,
    armor: 3,
    speed: 0.85,
    damage: 22,
    range: 2.6,
    interval: 1.3,
    splash: 0,
    points: 6,
    fromWave: 4,
    lootChance: 0.5,
    loot: { iron: 25, stone: 15 },
    radius: 11,
    huntsTowers: false,
  },
  demolisher: {
    kind: "demolisher",
    hp: 80,
    armor: 0,
    speed: 1.9,
    damage: 230,
    range: 0.8,
    interval: 1,
    splash: 1.6,
    points: 4,
    fromWave: 6,
    lootChance: 0.3,
    loot: { fuel: 14 },
    radius: 8,
    huntsTowers: true,
  },
  siege: {
    kind: "siege",
    hp: 950,
    armor: 9,
    speed: 0.55,
    damage: 85,
    range: 8.5,
    interval: 4,
    splash: 1,
    points: 16,
    fromWave: 9,
    lootChance: 1,
    loot: { iron: 60, fuel: 30 },
    radius: 16,
    huntsTowers: true,
  },
  boss: {
    kind: "boss",
    hp: 2400,
    armor: 3,
    speed: 0.5,
    damage: 60,
    range: 3.2,
    interval: 2.5,
    splash: 1.4,
    points: 0,
    fromWave: 5,
    lootChance: 1,
    loot: { iron: 150, stone: 100, fuel: 60, energy: 60, wood: 120 },
    radius: 24,
    huntsTowers: false,
  },
};

/** The boss shakes the ground this often, this far, this hard. */
export const BOSS_SLAM = { interval: 9, radius: 3, damage: 40 };

/** And calls soldiers this often - one, and one more per so many waves. */
export const BOSS_SUMMON = { interval: 14, wavesPerSoldier: 10 };

/** A boss comes every so many waves. */
export const BOSS_EVERY = 5;

/** Boss hit points: share at wave 0, and growth per wave. */
const BOSS_BASE = 0.1;
const BOSS_GROWTH = 0.15;

/** Hit point growth per wave, and the extra growth after wave ten. */
const HP_GROWTH = 0.1;
const LATE_WAVE = 10;
const LATE_GROWTH = 1.04;

/** Damage growth per wave. */
const DAMAGE_GROWTH = 0.05;

/** Every enemy kind. */
export const ENEMY_KINDS: readonly EnemyKind[] = Object.keys(
  ENEMIES,
) as EnemyKind[];

/**
 * How much tougher enemies are in a wave.
 *
 * @param kind - which enemy
 * @param wave - the wave number
 * @returns the factor on hit points
 */
export function hpScale(kind: EnemyKind, wave: number): number {
  const general =
    (1 + HP_GROWTH * (wave - 1)) * LATE_GROWTH ** Math.max(0, wave - LATE_WAVE);
  return kind === "boss" ? BOSS_BASE + BOSS_GROWTH * wave : general;
}

/**
 * How much harder enemies hit in a wave.
 *
 * @param wave - the wave number
 * @returns the factor on damage
 */
export function damageScale(wave: number): number {
  return 1 + DAMAGE_GROWTH * (wave - 1);
}
