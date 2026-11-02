/**
 * The snowball meadow: the talk key scoops up snow and throws a ball the way
 * one looks. Targets wobble, snowmen fall over, friends complain - and every
 * hit on a target or a snowman counts.
 *
 * @module
 */
import { EAST_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { addCount, steered } from "./achievements";
import { say, snowPuff } from "./effects";
import { MEADOW, TARGETS } from "./east-data";
import { TILE, inBox, terrainUnder } from "./map";
import { pick } from "./random";
import type { Character, Dir, GameState, Spot } from "./types";
import { knockSnowman } from "./world";

/** How fast a snowball flies, map px per second, and how long, seconds. */
const SPEED = 170;
export const SNOWBALL_LIFE = 0.6;

/** How high a snowball arcs over its way, and from what height it leaves the hand, map px. */
const ARC = 8;
const HAND = 10;

/** How far in front of the feet it leaves the hand, map px. */
const AHEAD_PX = 6;

/** How close it has to pass somebody to hit, map px. */
const HIT_REACH = 7;

/** How long a hit target wobbles, seconds. */
export const WOBBLE = 0.8;

/** Most snowballs in the air at once. */
const MAX_BALLS = 6;

/** How long a startled jump lasts, seconds. */
const HOP = 0.35;

/** Which way each facing points. */
const AHEAD: Readonly<Record<Dir, readonly [number, number]>> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/**
 * The meadow as a spot for the talk key, when the character steered can
 * throw here.
 *
 * @param state - the game
 * @param char - the character steered
 * @returns a spot under its feet, or null
 */
export function meadowSpot(state: GameState, char: Character): Spot | null {
  const here =
    char.area === "outdoors" &&
    char.form === null &&
    !char.flying &&
    inBox(MEADOW, char.x, char.y);
  return here
    ? {
        kind: "snowball",
        tx: Math.floor(char.x / TILE),
        ty: Math.floor(char.y / TILE),
        w: 1,
        h: 1,
      }
    : null;
}

/**
 * Scoops up snow and throws a ball the way somebody looks.
 *
 * @param state - the game
 * @param char - who throws
 */
export function throwSnowball(state: GameState, char: Character): void {
  const balls = state.world.east.snowballs;
  const [ax, ay] = AHEAD[char.dir];
  if (balls.length >= MAX_BALLS) {
    balls.shift();
  }
  balls.push({
    x: char.x + ax * AHEAD_PX,
    y: char.y - 1 + ay * AHEAD_PX,
    vx: ax * SPEED,
    vy: ay * SPEED,
    age: 0,
    thrower: state.chars.indexOf(char),
  });
  snowPuff(state, char.area, char.x, char.y);
  if (char.bubble === null) {
    say(char, pick(state, EAST_TEXTS.throwLines));
  }
  state.sounds.push("throw");
}

/**
 * Moves the snowballs on and finds what they hit.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateSnowballs(state: GameState, dt: number): void {
  const east = state.world.east;
  for (const [cell, left] of east.targetsHit) {
    if (left - dt <= 0) {
      east.targetsHit.delete(cell);
    } else {
      east.targetsHit.set(cell, left - dt);
    }
  }
  const flying = east.snowballs.filter((ball) => {
    ball.age += dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    const over = hit(state, ball.x, ball.y, ball.thrower);
    if (over || ball.age >= SNOWBALL_LIFE) {
      snowPuff(state, "outdoors", ball.x, ball.y);
    }
    return !over && ball.age < SNOWBALL_LIFE;
  });
  east.snowballs.length = 0;
  east.snowballs.push(...flying);
}

/**
 * How high a snowball is over the ground right now.
 *
 * @param age - seconds since it was thrown
 * @returns map px
 */
export function snowballHeight(age: number): number {
  const t = age / SNOWBALL_LIFE;
  return HAND * (1 - t) + ARC * Math.sin(Math.PI * t);
}

/** What a snowball runs into here, if anything; true when it is gone. */
function hit(state: GameState, x: number, y: number, thrower: number): boolean {
  const map = state.maps.outdoors;
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  const cell = ty * map.cols + tx;
  const target = TARGETS.some((spot) => spot.tx === tx && spot.ty === ty);
  let gone = false;
  if (target) {
    state.world.east.targetsHit.set(cell, WOBBLE);
    score(state, thrower);
    gone = true;
  } else if (knockSnowman(state, cell)) {
    score(state, thrower);
    gone = true;
  } else {
    const other = state.chars.find(
      (char, index) =>
        index !== thrower &&
        char.area === "outdoors" &&
        char.altitude < 1 &&
        Math.abs(char.x - x) < HIT_REACH &&
        y > char.y - HIT_REACH &&
        y < char.y + HIT_REACH / 2,
    );
    if (other !== undefined) {
      other.hop = HOP;
      say(other, pick(state, EAST_TEXTS.hitMe));
      state.sounds.push("hit");
      gone = true;
    } else {
      const ground = terrainUnder(map, x, y);
      gone = ground !== "snow" && ground !== "path" && ground !== "ice";
    }
  }
  return gone;
}

/** A hit on a target or a snowman: counted for the one steered. */
function score(state: GameState, thrower: number): void {
  const char = state.chars[thrower];
  state.sounds.push("hit");
  if (steered(state, char)) {
    addCount(state, "hits", "snowballs");
    say(
      char,
      `${pick(state, EAST_TEXTS.hitLines)} ${String(state.counts.hits)}`,
    );
  }
}
