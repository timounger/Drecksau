/**
 * The sledding slope: take a sled at the top, whizz down between the fences,
 * steer round the slalom flags and rocks, and the clock stops at the finish
 * line. The best time is kept.
 *
 * @module
 * @remarks
 * While somebody sleds the engine hands its steering to {@link updateSled}:
 * the sled gathers speed by itself, left and right steer, up brakes. Hitting
 * a flag or a rock throws one off the speed - snow flies, the clock runs on.
 * The best time is kept in tenths of a second as the count `sledBest`.
 */
import { EAST_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import { noteTask } from "./daily";
import { CAST } from "./cast";
import { say, snowPuff } from "./effects";
import { SLED_FINISH, SLED_START } from "./east-data";
import { TILE, areaMap, fits } from "./map";
import { pick, randomIn } from "./random";
import type { Character, GameState, Input } from "./types";

/** Speed at the start, top speed, and how fast it grows, map px per second. */
const START_SPEED = 30;
const TOP_SPEED = 150;
const ACCEL = 60;

/** How much up on the stick brakes, map px per second squared, and the least speed. */
const BRAKE = 120;
const SLOWEST = 20;

/** Speed after hitting something, map px per second. */
const CRASH_SPEED = 12;

/** How fast left and right steer, map px per second. */
const STEER = 80;

/** How far a crash bounces one back, map px. */
const BOUNCE = 2;

/** Time it takes for the achievement, seconds. */
export const SLED_GOAL = 7;

/** Tenths in a second: the best time is kept in tenths. */
const TENTHS = 10;

/** How far sideways the snow sprays behind the sled, map px. */
const SPRAY_SPREAD = 2;

/** Seconds between two sprays of snow behind the sled. */
const SPRAY_EVERY = 0.08;

/**
 * The talk key at the sleds: on one, at the top of the slope.
 *
 * @param state - the game
 * @param char - who wants to sled
 */
export function startSled(state: GameState, char: Character): void {
  const east = state.world.east;
  if (char.form !== null || char.flying) {
    say(char, EAST_TEXTS.sledNo);
  } else if (east.sled === null) {
    char.x = SLED_START.x * TILE;
    char.y = SLED_START.y * TILE;
    char.dir = "down";
    char.vx = 0;
    char.vy = 0;
    east.sled = {
      who: state.chars.indexOf(char),
      time: 0,
      speed: START_SPEED,
      done: false,
    };
    say(char, pick(state, EAST_TEXTS.sledGo));
    state.sounds.push("whoosh");
  }
}

/**
 * Whether somebody sits on the sled.
 *
 * @param state - the game
 * @param char - the character
 * @returns true during a run
 */
export function sledding(state: GameState, char: Character): boolean {
  const sled = state.world.east.sled;
  return sled !== null && state.chars[sled.who] === char;
}

/**
 * One step down the slope for the one on the sled: speed, steering, crashes
 * and the finish.
 *
 * @param state - the game
 * @param char - who sleds; the character steered
 * @param input - the held controls
 * @param dt - seconds
 */
export function updateSled(
  state: GameState,
  char: Character,
  input: Input,
  dt: number,
): void {
  const sled = state.world.east.sled;
  if (sled !== null) {
    const map = areaMap(state, char);
    const walk = CAST[char.id].walk;
    sled.time += dt;
    sled.speed =
      input.moveY < -1 / 2
        ? Math.max(SLOWEST, sled.speed - BRAKE * dt)
        : Math.min(TOP_SPEED, sled.speed + ACCEL * dt);
    const dx = input.moveX * STEER * dt;
    if (fits(map, walk, char.x + dx, char.y)) {
      char.x += dx;
    }
    const dy = sled.speed * dt;
    if (fits(map, walk, char.x, char.y + dy)) {
      char.y += dy;
    } else {
      crash(state, char);
    }
    char.dir = "down";
    char.moving = false;
    char.vx = 0;
    char.vy = sled.speed;
    if (
      Math.floor(sled.time / SPRAY_EVERY) !==
      Math.floor((sled.time - dt) / SPRAY_EVERY)
    ) {
      snowPuff(
        state,
        char.area,
        char.x + randomIn(state, -SPRAY_SPREAD, SPRAY_SPREAD),
        char.y,
      );
    }
    if (char.y >= SLED_FINISH * TILE) {
      finish(state, char);
    }
  }
}

/**
 * Ends a run early, when the player switches to somebody else.
 *
 * @param state - the game
 */
export function dropSled(state: GameState): void {
  const sled = state.world.east.sled;
  if (sled !== null && sled.who !== state.active) {
    state.chars[sled.who].vy = 0;
    state.world.east.sled = null;
  }
}

/**
 * A time in seconds as shown, one decimal with a comma.
 *
 * @param tenths - the time in tenths of a second
 * @returns e.g. "7,4 s"
 */
export function sledTime(tenths: number): string {
  return `${(tenths / TENTHS).toFixed(1).replace(".", ",")} ${EAST_TEXTS.seconds}`;
}

/**
 * The run so far in tenths of a second.
 *
 * @param state - the game
 * @returns tenths, or null when nobody sleds
 */
export function sledTenths(state: GameState): number | null {
  const sled = state.world.east.sled;
  return sled === null ? null : Math.floor(sled.time * TENTHS);
}

/** Into a flag or a rock: snow flies, the speed is gone. */
function crash(state: GameState, char: Character): void {
  const sled = state.world.east.sled;
  if (sled !== null && sled.speed > CRASH_SPEED * 2) {
    snowPuff(state, char.area, char.x, char.y);
    snowPuff(state, char.area, char.x, char.y - TILE / 2);
    say(char, pick(state, EAST_TEXTS.sledCrash));
    state.sounds.push("thud");
    char.y -= BOUNCE;
  }
  if (sled !== null) {
    sled.speed = CRASH_SPEED;
  }
}

/** Over the finish line: the time, perhaps a new best, perhaps the achievement. */
function finish(state: GameState, char: Character): void {
  const sled = state.world.east.sled;
  if (sled !== null) {
    const tenths = Math.round(sled.time * TENTHS);
    const best = state.counts.sledBest;
    const record = steered(state, char) && (best <= 0 || tenths < best);
    if (record) {
      state.counts.sledBest = tenths;
    }
    say(
      char,
      `${EAST_TEXTS.sledFinish} ${sledTime(tenths)}${record ? ` - ${EAST_TEXTS.sledBest}` : ""}`,
    );
    state.sounds.push("ding");
    noteTask(state, char, "sled");
    if (steered(state, char) && sled.time < SLED_GOAL) {
      unlock(state, "sledFast");
    }
    char.vy = 0;
    state.world.east.sled = null;
  }
}
