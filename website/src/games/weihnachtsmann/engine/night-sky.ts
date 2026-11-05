/**
 * The night sky over the open land: now and then a shooting star - quick,
 * press the talk key or the ability and make a wish (a shower of sparkles
 * and a little present) - and on New Year's Eve and the early morning of New
 * Year's Day fireworks over the whole map: rockets, bursts of sparks, bangs.
 *
 * @module
 * @remarks
 * Both live in view pixels, far away in the sky, so the camera moving under
 * them does not matter. The fireworks keep their sparks few (they fade fast
 * and the oldest go first), so the picture stays smooth.
 */
import { EXTRA_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { addCount, steered, unlock } from "./achievements";
import { vehicleOf } from "./aboard";
import { say, spawn, SPARKLE_TINTS } from "./effects";
import type { Fireworks } from "./extras-types";
import { nextRandom, pick, randomIn } from "./random";
import { darkness, openAir, stormStrength } from "./sky";
import type { GameState } from "./types";

/** From this darkness on, shooting stars fall. */
const STAR_DARK = 0.6;

/** Seconds between two shooting stars. */
const STAR_GAP_MIN = 22;
const STAR_GAP_MAX = 50;

/** How long a shooting star shows, and how long after it one may still wish, seconds. */
export const STAR_SECONDS = 1.8;
const WISH_SECONDS = 2.8;

/** How fast a shooting star flies, view px per second. */
const STAR_SPEED = 170;

/** Sparkles of a wish, and how far round the wisher they fall, map px. */
const WISH_SPARKLES = 26;
const WISH_SPREAD = 40;
const WISH_HEIGHT = 50;

/** The wrapping papers a wished-for present may have. */
const PAPERS = 4;

/** Darkness from which fireworks rise on New Year's Eve. */
const FIREWORK_DARK = 0.45;

/** On New Year's Day they go on until this time of day, 0 to 1. */
const NEW_YEAR_MORNING = 0.25;

/** Seconds between two rockets. */
const ROCKET_GAP_MIN = 0.45;
const ROCKET_GAP_MAX = 1.3;

/** How fast a rocket rises, view px per second. */
const ROCKET_SPEED = 120;

/** Sparks of a burst, their speed and gravity, view px per second. */
const BURST_SPARKS = 34;
const SPARK_SPEED_MIN = 28;
const SPARK_SPEED_MAX = 58;
const SPARK_FALL = 30;

/** How long a spark lives, seconds. */
export const SPARK_LIFE = 1.5;

/** Most sparks at once. */
const MAX_SPARKS = 420;

/** Colours of the fireworks. */
export const FIREWORK_TINTS = 5;

/** Bursts seen for the achievement. */
const BURSTS_SEEN = 3;

/** The months and days of the fireworks. */
const DECEMBER = 12;
const NEW_YEARS_EVE = 31;
const JANUARY = 1;

/**
 * A night sky with nothing going on.
 *
 * @returns the fireworks, none yet
 */
export function createFireworks(): Fireworks {
  return { rockets: [], sparks: [], nextIn: 0, seen: 0 };
}

/**
 * Runs the night sky on: shooting stars, fireworks.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateNightSky(state: GameState, dt: number): void {
  updateShootingStar(state, dt);
  updateFireworks(state, dt);
}

/**
 * The talk or ability key while a shooting star is still in the sky: a
 * wish.
 *
 * @param state - the game
 * @returns true when the key made a wish
 */
export function wishOnStar(state: GameState): boolean {
  const star = state.world.extras.shooting;
  const char = state.chars[state.active];
  const wish =
    star !== null &&
    !star.wished &&
    star.time < WISH_SECONDS &&
    openAir(char.area) &&
    char.area === state.viewArea &&
    vehicleOf(state, char) === null;
  if (wish) {
    star.wished = true;
    for (let k = 0; k < WISH_SPARKLES; k += 1) {
      spawn(
        state,
        "sparkle",
        char.area,
        char.x + randomIn(state, -WISH_SPREAD, WISH_SPREAD),
        char.y - WISH_HEIGHT + randomIn(state, -WISH_SPREAD / 2, 0),
        0,
        randomIn(state, 0, WISH_SPREAD / 2),
        k % SPARKLE_TINTS,
      );
    }
    state.sounds.push("wish");
    if (char.carry === null && char.form === null) {
      char.carry = {
        kind: "wrapped",
        tint: Math.floor(nextRandom(state) * PAPERS),
      };
      say(char, pick(state, EXTRA_TEXTS.starWishGift));
    } else {
      say(char, pick(state, EXTRA_TEXTS.starWish));
    }
    if (steered(state, char)) {
      addCount(state, "starWishes", "shootingStar");
      unlock(state, "shootingStar");
    }
  }
  return wish;
}

/**
 * Whether fireworks go up now: New Year's Eve after dark, or New Year's Day
 * until the early morning.
 *
 * @param state - the game
 * @returns true while they do
 */
export function fireworksNight(state: GameState): boolean {
  const { month, day } = state.today;
  const eve = month === DECEMBER && day === NEW_YEARS_EVE;
  const morning =
    month === JANUARY && day === 1 && state.world.sky.clock < NEW_YEAR_MORNING;
  return (eve || morning) && darkness(state) >= FIREWORK_DARK;
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- where in the sky
   shooting stars and rockets appear, shares of the view, and how much their
   speeds vary */
/** A shooting star now and then, at night. */
function updateShootingStar(state: GameState, dt: number): void {
  const extras = state.world.extras;
  const star = extras.shooting;
  if (star !== null) {
    star.time += dt;
    if (star.time > WISH_SECONDS) {
      extras.shooting = null;
    }
  } else if (
    darkness(state) >= STAR_DARK &&
    openAir(state.viewArea) &&
    stormStrength(state) <= 0
  ) {
    extras.shootIn -= dt;
    if (extras.shootIn <= 0) {
      extras.shootIn = randomIn(state, STAR_GAP_MIN, STAR_GAP_MAX);
      const view = state.view;
      const right = nextRandom(state) < 1 / 2;
      extras.shooting = {
        x: randomIn(state, view.w * 0.2, view.w * 0.8),
        y: randomIn(state, view.h * 0.05, view.h * 0.3),
        dx: (right ? 1 : -1) * STAR_SPEED,
        dy: STAR_SPEED * 0.45,
        time: 0,
        wished: false,
      };
      state.sounds.push("shootingStar");
    }
  }
}

/** Rockets rising and bursting, sparks falling and fading. */
function updateFireworks(state: GameState, dt: number): void {
  const fireworks = state.world.extras.fireworks;
  const view = state.view;
  if (fireworksNight(state) && openAir(state.viewArea)) {
    fireworks.nextIn -= dt;
    if (fireworks.nextIn <= 0) {
      fireworks.nextIn = randomIn(state, ROCKET_GAP_MIN, ROCKET_GAP_MAX);
      fireworks.rockets.push({
        x: randomIn(state, view.w * 0.1, view.w * 0.9),
        y: view.h,
        vy: -ROCKET_SPEED * randomIn(state, 0.85, 1.15),
        top: randomIn(state, view.h * 0.12, view.h * 0.45),
        tint: Math.floor(nextRandom(state) * FIREWORK_TINTS),
      });
      state.sounds.push("rocket");
    }
  }
  const flying = fireworks.rockets.filter((rocket) => {
    rocket.y += rocket.vy * dt;
    const burst = rocket.y <= rocket.top;
    if (burst) {
      explode(state, fireworks, rocket.x, rocket.y, rocket.tint);
    }
    return !burst;
  });
  fireworks.rockets.length = 0;
  fireworks.rockets.push(...flying);
  for (const spark of fireworks.sparks) {
    spark.age += dt;
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
    spark.vy += SPARK_FALL * dt;
    spark.vx *= 1 - dt;
  }
  const alive = fireworks.sparks.filter((spark) => spark.age < SPARK_LIFE);
  fireworks.sparks.length = 0;
  fireworks.sparks.push(...alive.slice(-MAX_SPARKS));
}

/** A rocket bursts into a ring of sparks, with a bang. */
function explode(
  state: GameState,
  fireworks: Fireworks,
  x: number,
  y: number,
  tint: number,
): void {
  const speed = randomIn(state, SPARK_SPEED_MIN, SPARK_SPEED_MAX);
  for (let k = 0; k < BURST_SPARKS; k += 1) {
    const angle = (k / BURST_SPARKS) * Math.PI * 2;
    const jitter = randomIn(state, 0.75, 1.1);
    fireworks.sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed * jitter,
      vy: Math.sin(angle) * speed * jitter,
      age: 0,
      tint: k % 3 === 0 ? (tint + 1) % FIREWORK_TINTS : tint,
    });
  }
  state.sounds.push("bang");
  fireworks.seen += 1;
  const char = state.chars[state.active];
  if (fireworks.seen >= BURSTS_SEEN && openAir(char.area)) {
    unlock(state, "fireworks");
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
