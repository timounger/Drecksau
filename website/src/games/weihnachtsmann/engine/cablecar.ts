/**
 * The cable car: from the valley station in the south land a gondola climbs
 * its cable to the top of the mountain - the summit, a place of its own with
 * a viewing platform, a telescope over the whole map and a long ski run back
 * down to the valley.
 *
 * @module
 * @remarks
 * The rider sits hidden in the gondola while it rides ({@link inGondola}),
 * the camera following it up the cable; at the top the picture fades to the
 * summit. Going down works the other way round. On the summit the talk key
 * at the rack straps on skis: the engine hands the steering to
 * {@link updateSki} (the pattern of the sled run) - left and right steer, up
 * brakes, firs, rocks and slalom flags throw one off the speed - and over
 * the finish line the picture fades back to the valley. The best time is
 * kept in tenths of a second as the count `skiBest`.
 */
import { PLACES_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import { CAST } from "./cast";
import { startFade } from "./doors";
import { say, snowPuff } from "./effects";
import { TILE, areaMap, fits } from "./map";
import { openOverview } from "./overview";
import {
  SKI_FINISH,
  SKI_START,
  SUMMIT_ARRIVAL,
  SUMMIT_EXIT,
  VALLEY_FRONT,
} from "./places-data";
import { pick, randomIn } from "./random";
import type { CableState, Character, Door, GameState, Input } from "./types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the cable's ends, matching the pictures */
/** The ground under the gondola at the valley station and at the summit, map px. */
export const CABLE_LOW = { x: 73.5 * TILE, y: 72.4 * TILE } as const;
export const CABLE_HIGH = { x: 103 * TILE, y: 88 * TILE } as const;

/** How high the gondola hangs at the valley station and at the summit, map px. */
export const LOW_HANG = 40;
export const HIGH_HANG = 174;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** How far the cable sags in the middle, map px. */
export const SAG = 26;

/** How long a ride up or down takes, seconds. */
const RIDE_SECONDS = 12;

/** Ski run: speed at the start, top speed and how fast it grows, map px per second. */
const START_SPEED = 35;
const TOP_SPEED = 175;
const ACCEL = 70;

/** How much up on the stick brakes, and the least speed. */
const BRAKE = 130;
const SLOWEST = 22;

/** Speed after hitting something, and how far it throws one back, map px. */
const CRASH_SPEED = 14;
const BOUNCE = 2;

/** How fast left and right steer, map px per second. */
const STEER = 110;

/** Tenths in a second: the best time is kept in tenths. */
const TENTHS = 10;

/** Seconds between two sprays of snow behind the skis, and how wide. */
const SPRAY_EVERY = 0.07;
const SPRAY_SPREAD = 3;

/** Where the rider arrives on the summit: in front of the mountain station. */
const UP_DOOR: Door = {
  tx: 0,
  ty: 0,
  w: 0,
  h: 0,
  dir: "down",
  to: "summit",
  toX: SUMMIT_ARRIVAL.x,
  toY: SUMMIT_ARRIVAL.y,
  toDir: "down",
};

/** Into the gondola at the top: the rider is outdoors again, high on the cable. */
const DOWN_DOOR: Door = {
  tx: 0,
  ty: 0,
  w: 0,
  h: 0,
  dir: "down",
  to: "outdoors",
  toX: CABLE_HIGH.x / TILE,
  toY: CABLE_HIGH.y / TILE,
  toDir: "down",
};

/**
 * The cable car and the ski run on a new visit: the gondola at the valley
 * station, nobody skiing.
 *
 * @returns its state
 */
export function createCable(): CableState {
  return { ride: null, ski: null };
}

/**
 * Where the gondola hangs a share of the way up.
 *
 * @param t - 0 at the valley station, 1 at the summit
 * @returns the ground under it, and how high it hangs, map px
 */
export function gondolaPoint(t: number): {
  x: number;
  y: number;
  altitude: number;
} {
  return {
    x: CABLE_LOW.x + (CABLE_HIGH.x - CABLE_LOW.x) * t,
    y: CABLE_LOW.y + (CABLE_HIGH.y - CABLE_LOW.y) * t,
    altitude:
      LOW_HANG + (HIGH_HANG - LOW_HANG) * t - SAG * Math.sin(Math.PI * t),
  };
}

/**
 * How far up the cable the gondola is right now.
 *
 * @param state - the game
 * @returns 0 at the valley station to 1 at the summit
 */
export function gondolaShare(state: GameState): number {
  const ride = state.world.places.cable.ride;
  return ride === null ? 0 : easeRide(ride.t);
}

/**
 * The talk key at the valley station: into the gondola and up.
 *
 * @param state - the game
 * @param char - who wants to go up
 */
export function rideUp(state: GameState, char: Character): void {
  const cable = state.world.places.cable;
  if (char.flying || char.altitude >= 1) {
    say(char, PLACES_TEXTS.cableFlying);
  } else if (char.form !== null) {
    say(char, PLACES_TEXTS.cableAnimal);
  } else if (cable.ride !== null) {
    say(char, PLACES_TEXTS.cableBusy);
  } else {
    cable.ride = { who: state.chars.indexOf(char), t: 0, up: true };
    char.vx = 0;
    char.vy = 0;
    state.menu = null;
    say(char, pick(state, PLACES_TEXTS.cableUp));
    state.sounds.push("gondola");
  }
}

/**
 * The talk key at the mountain station: into the gondola and down.
 *
 * @param state - the game
 * @param char - who wants to go down
 */
export function rideDown(state: GameState, char: Character): void {
  const cable = state.world.places.cable;
  if (cable.ride !== null) {
    say(char, PLACES_TEXTS.cableBusy);
  } else {
    const who = state.chars.indexOf(char);
    cable.ride = { who, t: 1, up: false };
    state.sounds.push("gondola");
    startFade(state, DOWN_DOOR, who);
  }
}

/**
 * The talk key at the telescope on the summit: the view over the whole map.
 *
 * @param state - the game
 * @param char - who looks; Gugor sees the hidden things too
 */
export function usePanorama(state: GameState, char: Character): void {
  openOverview(state, char);
}

/**
 * The talk key at the ski rack: skis on, at the top of the run.
 *
 * @param state - the game
 * @param char - who wants to ski
 */
export function startSki(state: GameState, char: Character): void {
  const cable = state.world.places.cable;
  if (char.form !== null || char.flying) {
    say(char, PLACES_TEXTS.skiNo);
  } else if (cable.ski === null) {
    char.x = SKI_START.x * TILE;
    char.y = SKI_START.y * TILE;
    char.dir = "down";
    char.vx = 0;
    char.vy = 0;
    cable.ski = {
      who: state.chars.indexOf(char),
      time: 0,
      speed: START_SPEED,
    };
    say(char, pick(state, PLACES_TEXTS.skiGo));
    state.sounds.push("whoosh");
  }
}

/**
 * One step down the ski run: speed, steering, crashes and the finish.
 *
 * @param state - the game
 * @param char - who skis; the character steered
 * @param input - the held controls
 * @param dt - seconds
 */
export function updateSki(
  state: GameState,
  char: Character,
  input: Input,
  dt: number,
): void {
  const ski = state.world.places.cable.ski;
  if (ski !== null) {
    const map = areaMap(state, char);
    const walk = CAST[char.id].walk;
    ski.time += dt;
    ski.speed =
      input.moveY < -1 / 2
        ? Math.max(SLOWEST, ski.speed - BRAKE * dt)
        : Math.min(TOP_SPEED, ski.speed + ACCEL * dt);
    const dx = input.moveX * STEER * dt;
    if (fits(map, walk, char.x + dx, char.y)) {
      char.x += dx;
    }
    const dy = ski.speed * dt;
    if (fits(map, walk, char.x, char.y + dy)) {
      char.y += dy;
    } else {
      crash(state, char);
    }
    char.dir = "down";
    char.moving = false;
    char.vx = 0;
    char.vy = ski.speed;
    if (
      Math.floor(ski.time / SPRAY_EVERY) !==
      Math.floor((ski.time - dt) / SPRAY_EVERY)
    ) {
      snowPuff(
        state,
        char.area,
        char.x + randomIn(state, -SPRAY_SPREAD, SPRAY_SPREAD),
        char.y,
      );
    }
    if (char.y >= SKI_FINISH * TILE) {
      finish(state, char);
    }
  }
}

/**
 * Ends a ski run early, when the player switches to somebody else.
 *
 * @param state - the game
 */
export function dropSki(state: GameState): void {
  const cable = state.world.places.cable;
  if (cable.ski !== null && cable.ski.who !== state.active) {
    state.chars[cable.ski.who].vy = 0;
    cable.ski = null;
  }
}

/**
 * The ski run so far in tenths of a second.
 *
 * @param state - the game
 * @returns tenths, or null when nobody skis
 */
export function skiTenths(state: GameState): number | null {
  const ski = state.world.places.cable.ski;
  return ski === null ? null : Math.floor(ski.time * TENTHS);
}

/**
 * Runs the gondola on its cable: the rider rides hidden in it, and at the
 * end of the way the picture fades to the summit or the rider steps out at
 * the valley station.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateCable(state: GameState, dt: number): void {
  const cable = state.world.places.cable;
  const ride = cable.ride;
  if (ride !== null) {
    const char = state.chars[ride.who];
    if (char.area === "outdoors") {
      ride.t = Math.max(
        0,
        Math.min(1, ride.t + ((ride.up ? 1 : -1) * dt) / RIDE_SECONDS),
      );
      const at = gondolaPoint(easeRide(ride.t));
      char.x = at.x;
      char.y = at.y;
      char.altitude = at.altitude;
      char.vx = 0;
      char.vy = 0;
      char.moving = false;
      char.dir = "down";
      if (ride.up && ride.t >= 1) {
        reachTop(state, char, ride.who);
      } else if (!ride.up && ride.t <= 0) {
        reachValley(state, char);
      }
    } else if (char.area === "summit" && ride.up) {
      // The fade has taken the rider up: out of the gondola.
      cable.ride = null;
      char.altitude = 0;
      say(char, pick(state, PLACES_TEXTS.cableTop));
      if (steered(state, char)) {
        unlock(state, "summit");
      }
    }
  }
}

/** At the top: the picture fades over to the summit. */
function reachTop(state: GameState, char: Character, who: number): void {
  if (steered(state, char)) {
    if (state.fade === null) {
      startFade(state, UP_DOOR, who);
    }
  } else {
    char.area = "summit";
    char.x = SUMMIT_ARRIVAL.x * TILE;
    char.y = SUMMIT_ARRIVAL.y * TILE;
    char.altitude = 0;
    state.world.places.cable.ride = null;
  }
}

/** Down at the valley station: out of the gondola. */
function reachValley(state: GameState, char: Character): void {
  state.world.places.cable.ride = null;
  char.x = VALLEY_FRONT.x * TILE;
  char.y = VALLEY_FRONT.y * TILE;
  char.altitude = 0;
  say(char, pick(state, PLACES_TEXTS.cableDown));
}

/** Into a tree, a rock or a flag: snow flies, the speed is gone. */
function crash(state: GameState, char: Character): void {
  const ski = state.world.places.cable.ski;
  if (ski !== null && ski.speed > CRASH_SPEED * 2) {
    snowPuff(state, char.area, char.x, char.y);
    snowPuff(state, char.area, char.x, char.y - TILE / 2);
    say(char, pick(state, PLACES_TEXTS.skiCrash));
    state.sounds.push("thud");
    char.y -= BOUNCE;
  }
  if (ski !== null) {
    ski.speed = CRASH_SPEED;
  }
}

/** Over the finish line: the time, perhaps a new best, and down into the valley. */
function finish(state: GameState, char: Character): void {
  const cable = state.world.places.cable;
  const ski = cable.ski;
  if (ski !== null) {
    const tenths = Math.round(ski.time * TENTHS);
    const best = state.counts.skiBest;
    const record = steered(state, char) && (best <= 0 || tenths < best);
    if (record) {
      state.counts.skiBest = tenths;
    }
    const time = `${(tenths / TENTHS).toFixed(1).replace(".", ",")} ${PLACES_TEXTS.seconds}`;
    say(
      char,
      `${PLACES_TEXTS.skiFinish} ${time}${record ? ` - ${PLACES_TEXTS.skiBest}` : ""}`,
    );
    state.sounds.push("ding");
    if (steered(state, char)) {
      unlock(state, "skiRun");
      startFade(state, SUMMIT_EXIT, state.chars.indexOf(char));
    }
    char.vy = 0;
    cable.ski = null;
  }
}

/** A gentle start and stop of the gondola. */
function easeRide(t: number): number {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- smoothstep
  return t * t * (3 - 2 * t);
}
