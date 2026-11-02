/**
 * Time of day and weather outside: a day passes in six minutes, at dusk the
 * lamps and windows glow, at night it is dark and now and then the northern
 * lights shine; every few minutes a snowstorm blows for a while.
 *
 * @module
 * @remarks
 * Only the picture outside changes ({@link darkness}, {@link stormStrength},
 * {@link auroraStrength}); rooms and minigames are drawn as ever. Nothing of
 * it is saved: every visit starts in the morning.
 */
import { EAST_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import { say } from "./effects";
import { nextRandom, randomIn } from "./random";
import type { GameState, SkyState } from "./types";

/** Seconds of play a whole day takes. */
export const DAY_SECONDS = 360;

/** Hours in a day, for the clock in the address. */
const HOURS = 24;

/** Where the clock stands on a new visit: morning. */
const FIRST_CLOCK = 0.33;

/** Full night before this and after {@link DUSK_END}; full day in between. */
const DAWN_START = 0.2;
const DAWN_END = 0.3;
const DUSK_START = 0.7;
const DUSK_END = 0.82;

/** Seconds until the first storm, and between two storms. */
const FIRST_STORM = 150;
const STORM_GAP_MIN = 160;
const STORM_GAP_MAX = 320;

/** How long a storm blows, and how long it takes to rise and calm. */
const STORM_SECONDS = 40;
const STORM_RAMP = 5;

/** Chance of northern lights in a night, and how long they shine. */
const AURORA_CHANCE = 0.6;
const AURORA_SECONDS = 75;
const AURORA_RAMP = 6;

/** How dark it must be for the night's draw, and light enough to forget it. */
const NIGHT_DRAW = 0.95;
const DAY_RESET = 0.05;

/** Northern lights count as seen when at least this strong. */
export const AURORA_SEEN = 0.3;

/** Seconds of walking through one storm the achievement takes. */
export const STORM_WALK_GOAL = 20;

/**
 * The sky on a new visit: morning, calm.
 *
 * @returns the sky
 */
export function createSky(): SkyState {
  return {
    clock: FIRST_CLOCK,
    stormIn: FIRST_STORM,
    storm: 0,
    aurora: 0,
    auroraDrawn: false,
    stormWalked: 0,
  };
}

/**
 * Runs the clock and the weather on.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateSky(state: GameState, dt: number): void {
  const sky = state.world.sky;
  sky.clock = (sky.clock + dt / DAY_SECONDS) % 1;
  const dark = darkness(state);
  if (dark >= NIGHT_DRAW && !sky.auroraDrawn) {
    sky.auroraDrawn = true;
    if (nextRandom(state) < AURORA_CHANCE) {
      sky.aurora = AURORA_SECONDS;
    }
  } else if (dark <= DAY_RESET) {
    sky.auroraDrawn = false;
  }
  sky.aurora = Math.max(0, sky.aurora - dt);
  updateStorm(state, dt);
}

/**
 * How dark it is outside.
 *
 * @param state - the game
 * @returns 0 by day to 1 at night
 */
export function darkness(state: GameState): number {
  const clock = state.world.sky.clock;
  let dark = 1;
  if (clock >= DAWN_END && clock <= DUSK_START) {
    dark = 0;
  } else if (clock > DAWN_START && clock < DAWN_END) {
    dark = 1 - smooth((clock - DAWN_START) / (DAWN_END - DAWN_START));
  } else if (clock > DUSK_START && clock < DUSK_END) {
    dark = smooth((clock - DUSK_START) / (DUSK_END - DUSK_START));
  }
  return dark;
}

/**
 * How hard the snowstorm blows right now.
 *
 * @param state - the game
 * @returns 0 when calm to 1 at its height
 */
export function stormStrength(state: GameState): number {
  const storm = state.world.sky.storm;
  return storm <= 0
    ? 0
    : Math.min(1, storm / STORM_RAMP, (STORM_SECONDS - storm) / STORM_RAMP);
}

/**
 * How brightly the northern lights shine right now.
 *
 * @param state - the game
 * @returns 0 (none) to 1
 */
export function auroraStrength(state: GameState): number {
  const left = state.world.sky.aurora;
  const ramp =
    left <= 0
      ? 0
      : Math.min(1, left / AURORA_RAMP, (AURORA_SECONDS - left) / AURORA_RAMP);
  return Math.max(0, ramp) * darkness(state);
}

/**
 * Sets the sky from the address, to try the night and the weather:
 * `?uhr=22`, `?wetter=sturm` or `?wetter=polarlicht`.
 *
 * @param state - the game
 * @param hour - the hour to start at, or null to keep the morning
 * @param weather - "sturm", "polarlicht" or null
 */
export function trySky(
  state: GameState,
  hour: number | null,
  weather: string | null,
): void {
  const sky = state.world.sky;
  if (hour !== null) {
    sky.clock = (((hour % HOURS) + HOURS) % HOURS) / HOURS;
  }
  if (weather === "sturm") {
    sky.storm = STORM_SECONDS;
  } else if (weather === "polarlicht") {
    sky.aurora = AURORA_SECONDS;
    sky.auroraDrawn = true;
  }
}

/** Storms come and go; walking through one counts towards its achievement. */
function updateStorm(state: GameState, dt: number): void {
  const sky = state.world.sky;
  const char = state.chars[state.active];
  if (sky.storm > 0) {
    sky.storm = Math.max(0, sky.storm - dt);
    if (char.area === "outdoors" && char.moving && steered(state, char)) {
      sky.stormWalked += dt;
      if (sky.stormWalked >= STORM_WALK_GOAL) {
        unlock(state, "stormWalk");
      }
    }
    if (sky.storm <= 0) {
      sky.stormWalked = 0;
      sky.stormIn = randomIn(state, STORM_GAP_MIN, STORM_GAP_MAX);
    }
  } else {
    sky.stormIn -= dt;
    if (sky.stormIn <= 0) {
      sky.storm = STORM_SECONDS;
      if (char.area === "outdoors") {
        say(char, EAST_TEXTS.stormStart);
      }
    }
  }
}

/** Smoothstep: an easy start and end of a share from 0 to 1. */
function smooth(t: number): number {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- smoothstep
  return t * t * (3 - 2 * t);
}
