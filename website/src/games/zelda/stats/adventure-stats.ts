/**
 * The numbers only this adventure keeps: monsters beaten, rupees found,
 * fainting spells and cut bushes.
 *
 * @module
 */
import type { EnemyKind } from "@/games/zelda/engine/types";

/** The monsters counted by kind - the temple's two guardians are not. */
export type CountedKind = Exclude<EnemyKind, "beetle" | "golem">;

/** What is counted, across every adventure in this browser. */
export type AdventureStats = {
  /** Monsters beaten, by kind. */
  readonly kills: Readonly<Record<CountedKind, number>>;
  /** Rupees picked up, by value. */
  readonly rupees: number;
  /** Times Link fainted. */
  readonly deaths: number;
  /** Bushes and tufts cut. */
  readonly cuts: number;
};

/** Nothing counted yet. */
export const EMPTY_ADVENTURE: AdventureStats = {
  kills: { octorok: 0, chuchu: 0, keese: 0, moblin: 0, tektite: 0, darknut: 0 },
  rupees: 0,
  deaths: 0,
  cuts: 0,
};

/** What a stretch of play adds. */
export type AdventureDelta = {
  readonly kills: readonly EnemyKind[];
  readonly rupees: number;
  readonly deaths: number;
  readonly cuts: number;
};

/**
 * Adds a stretch of play to the totals.
 *
 * @param stats - the totals so far
 * @param delta - what happened since
 * @returns the new totals
 */
export function plusAdventure(
  stats: AdventureStats,
  delta: AdventureDelta,
): AdventureStats {
  const kills = { ...stats.kills };
  for (const kind of delta.kills) {
    if (kind in kills) {
      kills[kind as CountedKind] += 1;
    }
  }
  return {
    kills,
    rupees: stats.rupees + delta.rupees,
    deaths: stats.deaths + delta.deaths,
    cuts: stats.cuts + delta.cuts,
  };
}

/**
 * All monsters beaten, whatever kind.
 *
 * @param stats - the totals
 * @returns the sum
 */
export function totalKills(stats: AdventureStats): number {
  return Object.values(stats.kills).reduce((sum, count) => sum + count, 0);
}

/**
 * The kind of monster beaten most often.
 *
 * @param stats - the totals
 * @returns that kind, or null when none was beaten yet
 */
export function favouritePrey(stats: AdventureStats): CountedKind | null {
  let best: CountedKind | null = null;
  for (const [kind, count] of Object.entries(stats.kills) as [
    CountedKind,
    number,
  ][]) {
    if (count > 0 && (best === null || count > stats.kills[best])) {
      best = kind;
    }
  }
  return best;
}

/**
 * Tells whether nothing was counted yet.
 *
 * @param stats - the totals
 * @returns true when all are zero
 */
export function isEmptyAdventure(stats: AdventureStats): boolean {
  return (
    totalKills(stats) === 0 &&
    stats.rupees === 0 &&
    stats.deaths === 0 &&
    stats.cuts === 0
  );
}

/**
 * Checks that a stored value really is {@link AdventureStats}.
 *
 * @param value - straight from storage
 * @returns true when it has the right shape
 */
export function isAdventureStats(value: unknown): value is AdventureStats {
  const stats = value as AdventureStats;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof stats.kills === "object" &&
    stats.kills !== null &&
    Object.keys(EMPTY_ADVENTURE.kills).every(
      (kind) => typeof stats.kills[kind as CountedKind] === "number",
    ) &&
    typeof stats.rupees === "number" &&
    typeof stats.deaths === "number" &&
    typeof stats.cuts === "number"
  );
}
