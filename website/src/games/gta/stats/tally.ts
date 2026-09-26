/**
 * Watching the city and writing down what happened.
 *
 * @module
 * @remarks
 * **Nothing in the engine reports anything.** There is no "a car was
 * destroyed" event and there should not be one: the engine's job is to say
 * what the city *is*, a frame at a time, and every listener it had to feed
 * would be a second thing to keep in step. So this is built exactly like the
 * ear in ../audio/mix - it remembers the last frame and calls the difference
 * news.
 *
 * **It hands out sums, not writes.** The counters are gathered here and taken
 * away in one go every few seconds by whoever is driving the loop; writing to
 * storage sixty times a second would be sixty writes for a number nobody is
 * looking at.
 */
import { JOBS_PER_DISTRICT, type GameState } from "@/games/gta/engine/types";
import {
  EMPTY_CITY,
  isEmptyCity,
  plusCity,
  type CityStats,
} from "@/games/gta/stats/city-stats";

/** The book-keeper. */
export type Tally = {
  /**
   * One look at the city.
   *
   * @param state - how it stands this frame
   */
  note(state: GameState): void;
  /**
   * Everything since the last time this was asked.
   *
   * @returns the counters, or null when nothing at all has happened
   */
  take(): CityStats | null;
  /** Forgets the last frame, for when a different city is put in front of it. */
  forget(): void;
};

/**
 * Builds a book-keeper.
 *
 * @returns something to hand the state to, once a frame
 * @remarks
 * **Only out in the street.** The jail, the bank and the printing works are
 * their own little worlds with their own people in them; the city stands still
 * meanwhile, and counting its traffic while one is in a cell would be counting
 * nothing. What happens in there counts where it belongs: the way out of the
 * bank leads back into the street, and the street is where this looks.
 */
export function createTally(): Tally {
  let sum = EMPTY_CITY;
  let where: { readonly x: number; readonly y: number } | null = null;
  let money: number | null = null;
  let jobs: number | null = null;
  let phase: GameState["phase"] | null = null;
  let downed = new Set<number>();
  let fallen = new Set<number>();
  let wrecks = new Set<number>();
  const forget = (): void => {
    where = null;
    money = null;
    jobs = null;
    phase = null;
    downed = new Set();
    fallen = new Set();
    wrecks = new Set();
  };
  return {
    forget,
    note(state: GameState): void {
      const before = phase;
      phase = state.phase;
      // **Losing is a moment, not a state**, and the state it leaves behind
      // stands there for as long as the overlay does. Counted on the way in.
      if (before !== null && before !== state.phase) {
        sum = plusCity(sum, {
          ...EMPTY_CITY,
          busted: state.phase === "busted" ? 1 : 0,
          wasted: state.phase === "wasted" ? 1 : 0,
        });
      }
      if (state.phase !== "playing") {
        // The little worlds have their own everything: forget where the man
        // was standing, or coming back out counts as a drive across the map.
        where = null;
        return;
      }
      const here = { x: state.player.x, y: state.player.y };
      const step =
        where === null ? 0 : Math.hypot(here.x - where.x, here.y - where.y);
      where = here;
      // A step longer than this is not a step: it is a respawn, a garage, or
      // the way out of a building, and none of those is a journey.
      const went = step > JUMP ? 0 : step;
      const aboard = state.player.car !== null || state.player.flying;
      const took = money === null ? 0 : state.player.money - money;
      money = state.player.money;
      const work = Object.values(state.districts).reduce(
        (all, one) => all + one.done + (one.owned ? JOBS_PER_DISTRICT : 0),
        0,
      );
      const delivered = jobs === null ? 0 : work - jobs;
      jobs = work;
      let people = 0;
      const lying = new Set<number>();
      for (const one of state.people) {
        if (one.mood !== "down") {
          continue;
        }
        lying.add(one.id);
        if (!downed.has(one.id)) {
          people += 1;
        }
      }
      downed = lying;
      let cops = 0;
      const still = new Set<number>();
      for (const one of state.cops) {
        if (one.stillUntil === null) {
          continue;
        }
        still.add(one.id);
        if (!fallen.has(one.id)) {
          cops += 1;
        }
      }
      fallen = still;
      let wrecked = 0;
      const broken = new Set<number>();
      for (const car of state.cars) {
        if (car.health > 0) {
          continue;
        }
        broken.add(car.id);
        if (!wrecks.has(car.id)) {
          wrecked += 1;
        }
      }
      wrecks = broken;
      sum = plusCity(sum, {
        ...EMPTY_CITY,
        driven: aboard ? went : 0,
        walked: aboard ? 0 : went,
        wrecked,
        people,
        cops,
        stars: state.player.stars,
        // Only what came in. Money spent is not money unearned, and a game in
        // which buying a pistol lowered one's lifetime takings would be a
        // strange game.
        earned: Math.max(0, took),
        jobs: Math.max(0, delivered),
        districts: Object.values(state.districts).filter((one) => one.owned)
          .length,
      });
    },
    take(): CityStats | null {
      const all = sum;
      sum = EMPTY_CITY;
      // Nothing at all is no news: a write that adds nought to every number
      // and takes the larger of two noughts is a write for nothing.
      return isEmptyCity(all) ? null : all;
    },
  };
}

/** How far the man may move in one frame before it stops being a step. */
const JUMP = 300;
