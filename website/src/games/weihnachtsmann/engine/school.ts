/**
 * Gilfi's magic school in front of the mountain: at the sign a round of 40
 * seconds begins; a toy floats beside Gilfi, the ability throws it by magic
 * in the way he looks, and while it flies the stick steers it - into one of
 * the three baskets, as many times as he can.
 *
 * @module
 * @remarks
 * Only the player's Gilfi plays, on foot. While a toy is in the air Gilfi
 * stands still and the stick belongs to the toy ({@link driveSchool}).
 * Switching to somebody else or walking far off ends the round. The best
 * round is kept as `counts.schoolBest`.
 */
import { EXTRA_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import { vehicleOf } from "./aboard";
import { poof, say, spawn, SPARKLE_TINTS } from "./effects";
import { BASKETS, SCHOOL_FIELD } from "./extras-data";
import { TILE, areaMap } from "./map";
import { moveCharacter } from "./movement";
import { pick } from "./random";
import {
  TOY_KINDS,
  type Character,
  type Dir,
  type GameState,
  type Input,
} from "./types";

/** How long a round lasts, seconds. */
export const ROUND_SECONDS = 40;

/** Hits in one round for the achievement. */
export const SCHOOL_GOAL = 5;

/** How fast a thrown toy flies, and how fast the stick steers it, map px per second. */
const THROW_SPEED = 96;
const STEER_SPEED = 72;

/** How far a toy flies before it drops, map px. */
const THROW_RANGE = 130;

/** How near a basket's mouth a toy has to come, map px. */
const BASKET_REACH = 4;

/** How high above the basket's foot line its mouth is, map px. */
const BASKET_MOUTH = 10;

/** How high a floating or flying toy is, map px over its ground point. */
export const TOY_HEIGHT = 16;

/** How far the field reaches round its box before a round ends, map px. */
const FIELD_SLACK = 48;

/** Seconds a hit basket sparkles. */
const FLASH_SECONDS = 0.8;

/** Sparkles of a hit. */
const HIT_SPARKLES = 10;
const HIT_SPRAY = 30;

/** Which way each facing throws. */
const THROWS: Readonly<Record<Dir, readonly [number, number]>> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/**
 * The talk key at the school's sign: Gilfi starts a round; anybody else is
 * told whose school it is.
 *
 * @param state - the game
 * @param char - who is at the sign
 */
export function useSchool(state: GameState, char: Character): void {
  const extras = state.world.extras;
  if (char.id !== "gilfi") {
    say(char, EXTRA_TEXTS.schoolOnlyGilfi);
  } else if (extras.school !== null) {
    say(char, EXTRA_TEXTS.schoolRunning);
  } else {
    extras.school = {
      who: state.chars.indexOf(char),
      left: ROUND_SECONDS,
      hits: 0,
      item: 0,
      flight: null,
      flash: 0,
      flashBasket: -1,
    };
    state.sounds.push("magic");
    say(char, EXTRA_TEXTS.schoolStart);
  }
}

/**
 * The ability key during a round: the floating toy is thrown.
 *
 * @param state - the game
 * @returns true when the key was taken
 */
export function schoolAbility(state: GameState): boolean {
  const school = state.world.extras.school;
  const char = state.chars[state.active];
  const taken = school !== null && school.who === state.active;
  if (taken && school.flight === null) {
    const [dx, dy] = THROWS[char.dir];
    school.flight = {
      x: char.x + (dx * TILE) / 2,
      y: char.y + (dy * TILE) / 2,
      dx,
      dy,
      flown: 0,
    };
    state.sounds.push("whoosh");
  }
  return taken;
}

/**
 * Moves Gilfi while his toy flies: he stands still, the stick steers the toy.
 *
 * @param state - the game
 * @param char - the character
 * @param index - its index
 * @param input - the held controls
 * @param dt - seconds
 * @returns true while the toy is in the air
 */
export function driveSchool(
  state: GameState,
  char: Character,
  index: number,
  input: Input,
  dt: number,
): boolean {
  const school = state.world.extras.school;
  const flight = school?.flight ?? null;
  const held = school !== null && school.who === index && flight !== null;
  if (held) {
    moveCharacter(areaMap(state, char), char, 0, 0, dt);
    // Steer across the way it flies.
    const side = flight.dx === 0 ? input.moveX : input.moveY;
    const sx = flight.dx === 0 ? 1 : 0;
    const sy = flight.dx === 0 ? 0 : 1;
    flight.x += flight.dx * THROW_SPEED * dt + sx * side * STEER_SPEED * dt;
    flight.y += flight.dy * THROW_SPEED * dt + sy * side * STEER_SPEED * dt;
    flight.flown += THROW_SPEED * dt;
  }
  return held;
}

/**
 * Runs the round on: the clock, hits and misses, the end.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateSchool(state: GameState, dt: number): void {
  const school = state.world.extras.school;
  if (school !== null) {
    const char = state.chars[school.who];
    school.left -= dt;
    school.flash = Math.max(0, school.flash - dt);
    const flight = school.flight;
    if (flight !== null) {
      const hit = BASKETS.findIndex(
        (basket) =>
          Math.hypot(
            flight.x - (basket.tx + 1 / 2) * TILE,
            flight.y - TOY_HEIGHT - ((basket.ty + 1) * TILE - BASKET_MOUTH),
          ) <
          BASKET_REACH + TOY_HEIGHT / 2,
      );
      if (hit >= 0) {
        scored(state, hit);
      } else if (flight.flown >= THROW_RANGE) {
        poof(state, "outdoors", flight.x, flight.y - TOY_HEIGHT);
        school.flight = null;
        school.item = (school.item + 1) % TOY_KINDS.length;
      }
    }
    const away =
      !steered(state, char) ||
      char.area !== "outdoors" ||
      vehicleOf(state, char) !== null ||
      char.x < SCHOOL_FIELD.tx * TILE - FIELD_SLACK ||
      char.x > (SCHOOL_FIELD.tx + SCHOOL_FIELD.w) * TILE + FIELD_SLACK ||
      char.y < SCHOOL_FIELD.ty * TILE - FIELD_SLACK ||
      char.y > (SCHOOL_FIELD.ty + SCHOOL_FIELD.h) * TILE + FIELD_SLACK;
    if (away || (school.left <= 0 && school.flight === null)) {
      finish(state, !away);
    }
  }
}

/** A toy dropped into a basket. */
function scored(state: GameState, basket: number): void {
  const school = state.world.extras.school;
  if (school !== null) {
    school.hits += 1;
    school.flight = null;
    school.item = (school.item + 1) % TOY_KINDS.length;
    school.flash = FLASH_SECONDS;
    school.flashBasket = basket;
    const spot = BASKETS[basket];
    for (let k = 0; k < HIT_SPARKLES; k += 1) {
      spawn(
        state,
        "sparkle",
        "outdoors",
        (spot.tx + 1 / 2) * TILE,
        (spot.ty + 1) * TILE - BASKET_MOUTH,
        ((k / HIT_SPARKLES) * 2 - 1) * HIT_SPRAY,
        -HIT_SPRAY,
        k % SPARKLE_TINTS,
      );
    }
    state.sounds.push("ding");
  }
}

/** The round is over: the score, a new best, perhaps the achievement. */
function finish(state: GameState, full: boolean): void {
  const school = state.world.extras.school;
  if (school !== null) {
    const char = state.chars[school.who];
    state.world.extras.school = null;
    if (full) {
      const best = state.counts.schoolBest;
      state.counts.schoolBest = Math.max(best, school.hits);
      say(
        char,
        `${EXTRA_TEXTS.schoolEnd.replace("{n}", String(school.hits))}${school.hits > best ? ` ${EXTRA_TEXTS.schoolBest}` : ""}`,
      );
      if (school.hits >= SCHOOL_GOAL) {
        unlock(state, "magicSchool");
      }
      state.sounds.push(school.hits > 0 ? "cheer" : "thud");
    } else {
      say(char, pick(state, EXTRA_TEXTS.schoolAbort));
    }
  }
}
