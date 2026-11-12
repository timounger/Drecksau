/**
 * Wurfduell's own numbers: how often you hit, where, with whom and with which
 * abilities.
 *
 * @module
 * @remarks
 * The shared statistics count matches, wins and play time for every game. What
 * only a throwing game has - throws, hits, head hits, a favourite fighter and
 * a favourite ability - lives here, in a card of its own on the statistics
 * page. Only the player at this screen is counted.
 */
import {
  ABILITY_IDS,
  CHARACTER_IDS,
} from "@/games/wurfduell/engine/characters";
import type { AbilityId, CharacterId } from "@/games/wurfduell/engine/types";
import { storageKey } from "@/lib/storage/local-store";
import {
  createStoredValue,
  type StoredValue,
} from "@/lib/storage/stored-value";

/** What is counted. */
export type DuelStats = {
  /** Throws made. */
  readonly throws: number;
  /** Throws that cost the other side life points. */
  readonly hits: number;
  /** Of those, the ones that hit the head. */
  readonly headHits: number;
  /** Matches finished. */
  readonly matches: number;
  /** Matches won. */
  readonly wins: number;
  /** Matches won without losing a single life point. */
  readonly flawless: number;
  /** Matches played with each fighter. */
  readonly fighters: Readonly<Partial<Record<CharacterId, number>>>;
  /** How often each ability was used. */
  readonly abilities: Readonly<Partial<Record<AbilityId, number>>>;
};

/** Nothing played yet. */
export const EMPTY_DUEL_STATS: DuelStats = {
  throws: 0,
  hits: 0,
  headHits: 0,
  matches: 0,
  wins: 0,
  flawless: 0,
  fighters: {},
  abilities: {},
};

/**
 * Schema version of the stored numbers.
 *
 * @remarks
 * Two since the abilities are counted; the hearts-era numbers of version one
 * are simply not read any more.
 */
const VERSION = 2;

/** The stored numbers, readable by React. */
export const duelStatsStore: StoredValue<DuelStats> = createStoredValue(
  storageKey("wurfduell", "duel-stats"),
  VERSION,
  EMPTY_DUEL_STATS,
  isDuelStats,
);

/**
 * Counts one throw of the player's.
 *
 * @param stats - the numbers so far
 * @param damage - life points it cost the other side
 * @param head - whether it hit the head
 * @param ability - the ability used with it, if any
 * @returns the updated numbers
 */
export function withThrow(
  stats: DuelStats,
  damage: number,
  head: boolean,
  ability: AbilityId | null,
): DuelStats {
  return {
    ...stats,
    throws: stats.throws + 1,
    hits: stats.hits + (damage > 0 ? 1 : 0),
    headHits: stats.headHits + (damage > 0 && head ? 1 : 0),
    abilities:
      ability === null
        ? stats.abilities
        : {
            ...stats.abilities,
            [ability]: (stats.abilities[ability] ?? 0) + 1,
          },
  };
}

/**
 * Counts one finished match.
 *
 * @param stats - the numbers so far
 * @param fighter - who the player was
 * @param won - whether they won
 * @param flawless - whether they won with every life point left
 * @returns the updated numbers
 */
export function withMatch(
  stats: DuelStats,
  fighter: CharacterId,
  won: boolean,
  flawless: boolean,
): DuelStats {
  return {
    ...stats,
    matches: stats.matches + 1,
    wins: stats.wins + (won ? 1 : 0),
    flawless: stats.flawless + (won && flawless ? 1 : 0),
    fighters: {
      ...stats.fighters,
      [fighter]: (stats.fighters[fighter] ?? 0) + 1,
    },
  };
}

/**
 * The fighter played most often.
 *
 * @param stats - the numbers
 * @returns that fighter, or null before any match
 */
export function favouriteFighter(stats: DuelStats): CharacterId | null {
  return mostOf(CHARACTER_IDS, stats.fighters);
}

/**
 * The ability used most often.
 *
 * @param stats - the numbers
 * @returns that ability, or null before any was used
 */
export function favouriteAbility(stats: DuelStats): AbilityId | null {
  return mostOf(ABILITY_IDS, stats.abilities);
}

/**
 * How many abilities were used altogether.
 *
 * @param stats - the numbers
 * @returns the sum over all abilities
 */
export function abilitiesUsed(stats: DuelStats): number {
  return Object.values(stats.abilities).reduce(
    (sum, count) => sum + (count ?? 0),
    0,
  );
}

/**
 * Updates the stored numbers.
 *
 * @param change - what to do to them
 */
export function updateDuelStats(change: (stats: DuelStats) => DuelStats): void {
  duelStatsStore.save(change(duelStatsStore.load()));
}

/** The id counted most often, or null when nothing was counted. */
function mostOf<K extends string>(
  ids: readonly K[],
  counts: Readonly<Partial<Record<K, number>>>,
): K | null {
  let best: K | null = null;
  let most = 0;
  for (const id of ids) {
    const count = counts[id] ?? 0;
    if (count > most) {
      most = count;
      best = id;
    }
  }
  return best;
}

/** Whether a stored value still has the shape of the numbers. */
function isDuelStats(value: unknown): value is DuelStats {
  const stats = value as DuelStats;
  return (
    typeof value === "object" &&
    value !== null &&
    [
      stats.throws,
      stats.hits,
      stats.headHits,
      stats.matches,
      stats.wins,
      stats.flawless,
    ].every((n) => Number.isInteger(n) && n >= 0) &&
    typeof stats.fighters === "object" &&
    stats.fighters !== null &&
    typeof stats.abilities === "object" &&
    stats.abilities !== null
  );
}
