/**
 * Seeded random numbers for a minigame run, so a run can be replayed.
 *
 * @module
 */
import { nextRandom } from "@/games/weihnachtsmann/engine/random";

/** A source of random numbers. */
export type Random = {
  /** A number from 0 (inclusive) to 1 (exclusive). */
  next(): number;
  /** A number from low (inclusive) to high (exclusive). */
  range(low: number, high: number): number;
  /** A whole number from low (inclusive) to high (exclusive). */
  int(low: number, high: number): number;
  /** One element of a list; the list must not be empty. */
  pick<T>(list: readonly T[]): T;
  /** True with the given chance, 0 to 1. */
  chance(probability: number): boolean;
  /** A shuffled copy of a list. */
  shuffle<T>(list: readonly T[]): T[];
};

/**
 * Creates a random source.
 *
 * @param seed - where the sequence starts
 * @returns the source
 */
export function createRandom(seed: number): Random {
  const state = { seed };
  const next = (): number => nextRandom(state);
  const range = (low: number, high: number): number =>
    low + next() * (high - low);
  const int = (low: number, high: number): number =>
    Math.min(high - 1, Math.floor(range(low, high)));
  return {
    next,
    range,
    int,
    pick: <T>(list: readonly T[]): T => list[int(0, list.length)],
    chance: (probability: number): boolean => next() < probability,
    shuffle: <T>(list: readonly T[]): T[] => {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = int(0, i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  };
}
