/**
 * The hot-air balloon: it waits on its field in the south land; with the
 * talk key one climbs into the basket and floats slowly over the whole map,
 * over trees, houses and water, the wind pushing it along - from up there
 * one sees what is hidden below, and the camera shows more of the map.
 *
 * @module
 * @remarks
 * While somebody stands in the basket the engine hands the steering to
 * {@link updateBalloonRider}: the stick pushes the balloon gently, the wind
 * drifts it (harder in a snowstorm), and it ignores everything on the
 * ground. The talk key lands it - only where there is room, never on water
 * or the railway - and the rider steps out beside it. The ability key fires
 * the burner. Left standing somewhere, the balloon lifts off by itself after
 * a while and floats home to its field. Nothing of it is saved.
 */
import { PLACES_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import { inBalloon } from "./aboard";
import type { MoveProfile } from "./cast";
import { poof, say, snowPuff, spawn } from "./effects";
import { TILE, areaMap, fits, terrainUnder } from "./map";
import { currentProfile, facing } from "./movement";
import { BALLOON_HOME, ROOF_SECRET } from "./places-data";
import { onTrack } from "./railway";
import { pick, randomIn } from "./random";
import { stormStrength } from "./sky";
import type { Balloon, Character, GameState, Input, Spot } from "./types";

/** How high the balloon floats while one flies it, map px. */
export const CRUISE = 84;

/** How high it floats home by itself, map px. */
const RETURN_HIGH = 60;

/** How much higher the burner lifts it, map px. */
const BURNER_LIFT = 18;

/** How fast it rises and sinks, map px per second. */
const RISE = 34;
const SINK = 28;

/** How quickly the stick pushes it, its top speed, and how fast it slows. */
const PUSH = 60;
const TOP = 58;
const DRAG = 0.8;

/** How fast the wind drifts it, and how much harder in a storm. */
const WIND = 9;
const STORM_WIND = 2.5;

/** How fast the wind turns, radians per second. */
const WIND_TURN = 0.15;

/** How fast it floats home by itself, map px per second. */
const HOME_SPEED = 70;

/** How near home counts as there, map px. */
const HOME_NEAR = 3;

/** Seconds it stands away from its field before it floats home. */
export const BALLOON_RETURN = 45;

/** How high the rider stands over the basket's bottom, map px. */
export const BASKET_FLOOR = 3;

/** How close the talk key has to come to the basket, map px. */
const REACH = 22;

/** How long the burner's flame burns, seconds. */
const BURNER = 0.9;

/** How high counts as high up for the achievement and the zoom, map px. */
export const HIGH = 40;

/** Seconds high up in one flight for "Über den Wolken". */
const AIR_GOAL = 12;

/** How near over the roof's secret the balloon has to float, map px. */
const SECRET_NEAR = 64;

/** How far beside the basket the rider steps out, map px. */
const STEP_OUT = 20;

/** How far from the map's edge the balloon keeps, map px. */
const EDGE = 2 * TILE;

/** How quickly the camera zooms out and back in, per second. */
const ZOOM_RATE = 1.6;

/** Below this the balloon counts as standing on the ground, map px. */
const GROUNDED = 0.5;

/** The basket's foot on the ground: where it may land. */
const LANDING: MoveProfile = {
  speed: 0,
  passes: [],
  flies: false,
  grip: 1,
  iceSpeed: 1,
  waterSpeed: 1,
  footW: 22,
  footH: 10,
  height: 30,
};

/**
 * The balloon on a new visit: on its field.
 *
 * @returns its state
 */
export function createBalloon(): Balloon {
  return {
    x: BALLOON_HOME.x * TILE,
    y: BALLOON_HOME.y * TILE,
    vx: 0,
    vy: 0,
    altitude: 0,
    rider: -1,
    mode: "home",
    idle: 0,
    burner: 0,
    airTime: 0,
    wind: 1,
  };
}

/**
 * The balloon as a spot for the talk key, when it stands within reach.
 *
 * @param state - the game
 * @param char - who looks
 * @param x - the point the talk key reaches, map px
 * @param y - the point the talk key reaches, map px
 * @returns the spot, or null
 */
export function balloonSpot(
  state: GameState,
  char: Character,
  x: number,
  y: number,
): Spot | null {
  const balloon = state.world.places.balloon;
  const near =
    char.area === "outdoors" &&
    balloon.altitude < GROUNDED &&
    Math.min(
      Math.hypot(balloon.x - x, balloon.y - y),
      Math.hypot(balloon.x - char.x, balloon.y - char.y),
    ) < REACH;
  return near
    ? {
        kind: "balloon",
        tx: Math.floor(balloon.x / TILE),
        ty: Math.floor(balloon.y / TILE),
        w: 1,
        h: 1,
      }
    : null;
}

/**
 * The talk key at the balloon: into the basket and up.
 *
 * @param state - the game
 * @param char - who wants to fly
 */
export function boardBalloon(state: GameState, char: Character): void {
  const balloon = state.world.places.balloon;
  if (char.flying || char.altitude >= 1) {
    say(char, PLACES_TEXTS.balloonFlying);
  } else if (char.form !== null) {
    say(char, PLACES_TEXTS.balloonAnimal);
  } else if (balloon.rider >= 0 || balloon.mode === "returning") {
    say(char, PLACES_TEXTS.balloonTaken);
  } else {
    balloon.rider = state.chars.indexOf(char);
    balloon.mode = "flying";
    balloon.idle = 0;
    balloon.airTime = 0;
    balloon.burner = BURNER;
    char.vx = 0;
    char.vy = 0;
    char.carry = null;
    state.menu = null;
    say(char, pick(state, PLACES_TEXTS.balloonUp));
    state.sounds.push("burner");
  }
}

/**
 * The talk key in the basket: down it goes, if there is room below.
 *
 * @param state - the game
 * @param char - the rider
 */
export function landBalloon(state: GameState, char: Character): void {
  const balloon = state.world.places.balloon;
  if (balloon.mode === "flying") {
    if (landable(state, balloon.x, balloon.y)) {
      balloon.mode = "landing";
      say(char, pick(state, PLACES_TEXTS.balloonDown));
    } else {
      say(char, PLACES_TEXTS.balloonNoLand);
    }
  }
}

/**
 * The ability key in the basket: the burner roars and the balloon rises.
 *
 * @param state - the game
 * @param char - the rider
 */
export function fireBurner(state: GameState, char: Character): void {
  const balloon = state.world.places.balloon;
  if (balloon.burner <= 0 && balloon.mode === "flying") {
    balloon.burner = BURNER;
    state.sounds.push("burner");
    say(char, pick(state, PLACES_TEXTS.burner));
  }
}

/**
 * One step for the one in the basket: the stick pushes, the wind drifts,
 * the balloon rises to its height; the rider goes along.
 *
 * @param state - the game
 * @param char - the rider
 * @param input - the held controls; nothing for a rider the player left
 * @param dt - seconds
 */
export function updateBalloonRider(
  state: GameState,
  char: Character,
  input: Input,
  dt: number,
): void {
  const balloon = state.world.places.balloon;
  if (balloon.mode === "flying") {
    balloon.vx += input.moveX * PUSH * dt;
    balloon.vy += input.moveY * PUSH * dt;
    const speed = Math.hypot(balloon.vx, balloon.vy);
    if (speed > TOP) {
      balloon.vx *= TOP / speed;
      balloon.vy *= TOP / speed;
    }
    const high = CRUISE + (balloon.burner > 0 ? BURNER_LIFT : 0);
    balloon.altitude =
      balloon.altitude < high
        ? Math.min(high, balloon.altitude + RISE * dt)
        : Math.max(high, balloon.altitude - SINK * dt);
    drift(state, balloon, dt);
    countAir(state, char, balloon, dt);
  }
  char.x = balloon.x;
  char.y = balloon.y;
  char.vx = balloon.vx;
  char.vy = balloon.vy;
  char.altitude = balloon.altitude + BASKET_FLOOR;
  char.moving = false;
  char.stride = 0;
  char.onIce = false;
  if (Math.abs(balloon.vx) > 1) {
    char.dir = facing(balloon.vx, 0);
  }
}

/**
 * Runs the balloon on when nobody steers it: it comes down to land, floats
 * home by itself, and the camera zooms out for the one flying it.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateBalloon(state: GameState, dt: number): void {
  const balloon = state.world.places.balloon;
  balloon.burner = Math.max(0, balloon.burner - dt);
  balloon.wind += randomIn(state, -WIND_TURN, WIND_TURN) * dt;
  const rider = balloon.rider >= 0 ? state.chars[balloon.rider] : undefined;
  switch (balloon.mode) {
    case "landing":
      balloon.altitude = Math.max(0, balloon.altitude - SINK * dt);
      if (balloon.altitude <= 0) {
        touchDown(state, balloon, rider);
      }
      break;
    case "parked":
      balloon.idle += dt;
      if (balloon.idle >= BALLOON_RETURN) {
        balloon.mode = "returning";
        state.sounds.push("burner");
      }
      break;
    case "returning":
      floatHome(state, balloon, dt);
      break;
    default:
      break;
  }
  if (rider !== undefined && balloon.mode === "landing") {
    keepInBasket(rider, balloon);
  }
  const char = state.chars[state.active];
  const target = inBalloon(state, char) && balloon.altitude > HIGH ? 1 : 0;
  state.zoom += (target - state.zoom) * Math.min(1, dt * ZOOM_RATE);
}

/**
 * The flame of the burner, for its picture.
 *
 * @param state - the game
 * @returns 0 for none to 1 at full roar
 */
export function burnerFlame(state: GameState): number {
  return Math.min(1, state.world.places.balloon.burner / BURNER);
}

/** Keeps the rider standing in the basket while it comes down. */
function keepInBasket(rider: Character, balloon: Balloon): void {
  rider.x = balloon.x;
  rider.y = balloon.y;
  rider.altitude = balloon.altitude + BASKET_FLOOR;
}

/** The wind's push, and the map's edges. */
function drift(state: GameState, balloon: Balloon, dt: number): void {
  const map = state.maps.outdoors;
  const blow = WIND * (1 + STORM_WIND * stormStrength(state));
  balloon.vx *= Math.exp(-DRAG * dt);
  balloon.vy *= Math.exp(-DRAG * dt);
  balloon.x += (balloon.vx + Math.cos(balloon.wind) * blow) * dt;
  balloon.y += (balloon.vy + Math.sin(balloon.wind) * blow) * dt;
  balloon.x = Math.max(EDGE, Math.min(map.cols * TILE - EDGE, balloon.x));
  balloon.y = Math.max(
    EDGE + CRUISE,
    Math.min(map.rows * TILE - EDGE, balloon.y),
  );
}

/** High up for a while: "Über den Wolken"; over the gift store's roof: its secret. */
function countAir(
  state: GameState,
  char: Character,
  balloon: Balloon,
  dt: number,
): void {
  if (balloon.altitude > HIGH && steered(state, char)) {
    balloon.airTime += dt;
    if (balloon.airTime >= AIR_GOAL) {
      unlock(state, "balloonRide");
    }
    const over =
      Math.hypot(balloon.x - ROOF_SECRET.x, balloon.y - ROOF_SECRET.y) <
      SECRET_NEAR;
    if (over && !state.achieved.has("roofSecret")) {
      say(char, PLACES_TEXTS.roofSecret);
      unlock(state, "roofSecret");
    }
  }
}

/** Whether the basket may come down here. */
function landable(state: GameState, x: number, y: number): boolean {
  const map = state.maps.outdoors;
  return (
    fits(map, LANDING, x, y) &&
    terrainUnder(map, x, y - 1) !== "water" &&
    !onTrack(x, y)
  );
}

/** On the ground: the rider steps out, the balloon stays, or is home again. */
function touchDown(
  state: GameState,
  balloon: Balloon,
  rider: Character | undefined,
): void {
  const home = { x: BALLOON_HOME.x * TILE, y: BALLOON_HOME.y * TILE };
  const atHome = Math.hypot(balloon.x - home.x, balloon.y - home.y) < TILE;
  snowPuff(state, "outdoors", balloon.x, balloon.y);
  balloon.vx = 0;
  balloon.vy = 0;
  balloon.idle = 0;
  if (rider === undefined) {
    balloon.mode = atHome ? "home" : "parked";
  } else {
    const spot = stepOutSpot(state, rider, balloon);
    if (spot === null) {
      balloon.mode = "flying";
      say(rider, PLACES_TEXTS.balloonNoRoom);
    } else {
      rider.x = spot.x;
      rider.y = spot.y;
      rider.altitude = 0;
      rider.vx = 0;
      rider.vy = 0;
      balloon.rider = -1;
      balloon.mode = atHome ? "home" : "parked";
      say(rider, pick(state, PLACES_TEXTS.balloonLanded));
    }
  }
}

/** Where the rider steps out: beside the basket, or in front of it. */
function stepOutSpot(
  state: GameState,
  rider: Character,
  balloon: Balloon,
): { x: number; y: number } | null {
  const map = areaMap(state, rider);
  const profile = currentProfile(rider);
  const tries: readonly (readonly [number, number])[] = [
    [STEP_OUT, 0],
    [-STEP_OUT, 0],
    [0, STEP_OUT / 2],
    [0, -STEP_OUT / 2],
  ];
  const found = tries
    .map(([dx, dy]) => ({ x: balloon.x + dx, y: balloon.y + dy }))
    .find((spot) => fits(map, profile, spot.x, spot.y));
  return found ?? null;
}

/** Floats home by itself, high over everything, and comes down on its field. */
function floatHome(state: GameState, balloon: Balloon, dt: number): void {
  const home = { x: BALLOON_HOME.x * TILE, y: BALLOON_HOME.y * TILE };
  balloon.altitude = Math.min(RETURN_HIGH, balloon.altitude + RISE * dt);
  const dx = home.x - balloon.x;
  const dy = home.y - balloon.y;
  const distance = Math.hypot(dx, dy);
  if (balloon.altitude >= RETURN_HIGH / 2) {
    const step = Math.min(distance, HOME_SPEED * dt);
    balloon.x += (dx / Math.max(distance, 1)) * step;
    balloon.y += (dy / Math.max(distance, 1)) * step;
  }
  if (distance < HOME_NEAR) {
    balloon.x = home.x;
    balloon.y = home.y;
    balloon.mode = "landing";
    poof(state, "outdoors", balloon.x, balloon.y - balloon.altitude);
  }
  if (Math.floor(state.time) !== Math.floor(state.time - dt)) {
    spawn(state, "smoke", "outdoors", balloon.x, balloon.y - balloon.altitude);
  }
}
