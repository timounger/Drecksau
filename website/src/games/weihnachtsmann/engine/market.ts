/**
 * The Christmas market: three booths with punch, gingerbread and chestnuts,
 * a carousel to ride on and a music box tune for whoever strolls there.
 *
 * @module
 * @remarks
 * A rider sits on one of the carousel's four horses for a few seconds; the
 * engine leaves it alone meanwhile ({@link onCarousel}) and this module moves
 * it round. The golden bell hanging from the carousel's roof is caught on a
 * ride.
 */
import { EAST_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { collect, steered, unlock } from "./achievements";
import { collectBell } from "./bells";
import { pickUp } from "./carry";
import { say, spawn } from "./effects";
import { CAROUSEL, MARKET, stallAt } from "./east-data";
import { TILE, footprint, inBox } from "./map";
import { pick, randomIn } from "./random";
import type { Character, GameState, Spot } from "./types";

/** Horses on the carousel. */
export const SEATS = 4;

/** How long a ride lasts, seconds. */
const RIDE_SECONDS = 10;

/** How fast the carousel turns, radians per second. */
const SPIN = 1.3;

/** The ellipse the horses go round on, map px, and its middle above the footprint's bottom. */
export const RIDE_RX = 26;
export const RIDE_RY = 7;
export const RIDE_LIFT = 12;

/** Seconds between two plays of the tune: on the carousel, and strolling. */
const TUNE_RIDE = 3.4;
const TUNE_STROLL = 9;

/** A ride counts for the bell after this long, seconds. */
const BELL_AFTER = 2;

/** Steam over a booth: how many puffs, and how high over its front, map px. */
const STEAM_PUFFS = 3;
const STEAM_HIGH = 34;

/** Where a rider gets off: below the front of the carousel, map px. */
const STEP_OFF = 8;

/**
 * The talk key at a booth: a treat, a remark, and the booth counted. For an
 * errand the treat is taken along.
 *
 * @param state - the game
 * @param char - who stands there
 * @param spot - the booth's front
 */
export function useStall(state: GameState, char: Character, spot: Spot): void {
  const index = stallAt(spot.tx);
  const errand = state.world.east.errand;
  if (
    errand?.kind === "fetch" &&
    errand.stall === index &&
    steered(state, char)
  ) {
    if (pickUp(char, "treat", index)) {
      say(char, EAST_TEXTS.treatTaken);
    }
  } else {
    say(char, pick(state, EAST_TEXTS.stallLines[index]));
  }
  for (let k = 0; k < STEAM_PUFFS; k += 1) {
    spawn(
      state,
      "steam",
      "outdoors",
      (spot.tx + spot.w / 2) * TILE + randomIn(state, -TILE, TILE),
      (spot.ty + spot.h - 1) * TILE - STEAM_HIGH,
    );
  }
  state.sounds.push("munch");
  if (steered(state, char)) {
    collect(state, "stalls", String(index));
  }
}

/**
 * The talk key at the carousel: up onto a free horse.
 *
 * @param state - the game
 * @param char - who wants a ride
 */
export function rideCarousel(state: GameState, char: Character): void {
  const east = state.world.east;
  const who = state.chars.indexOf(char);
  const taken = new Set(east.riders.map((rider) => rider.seat));
  const seat = [...Array(SEATS).keys()].find((index) => !taken.has(index));
  if (char.flying || char.altitude > 1) {
    say(char, EAST_TEXTS.carouselNo);
  } else if (seat === undefined) {
    say(char, EAST_TEXTS.carouselFull);
  } else if (!onCarousel(state, char)) {
    east.riders.push({ who, seat, left: RIDE_SECONDS, tuneIn: 0 });
    char.vx = 0;
    char.vy = 0;
    say(char, pick(state, EAST_TEXTS.carouselOn));
    if (steered(state, char)) {
      unlock(state, "carousel");
    }
  }
}

/**
 * Whether somebody sits on the carousel.
 *
 * @param state - the game
 * @param char - the character
 * @returns true while riding
 */
export function onCarousel(state: GameState, char: Character): boolean {
  const who = state.chars.indexOf(char);
  return state.world.east.riders.some((rider) => rider.who === who);
}

/**
 * Turns the carousel: riders go round and get off at the end, the tune
 * plays, and the market's music plays for whoever strolls there.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateMarket(state: GameState, dt: number): void {
  const east = state.world.east;
  for (const rider of east.riders) {
    const char = state.chars[rider.who];
    rider.left -= dt;
    rider.tuneIn -= dt;
    const at = seatPoint(state, rider.seat);
    const next = seatPoint(state, rider.seat, dt);
    char.dir = next.x >= at.x ? "right" : "left";
    char.x = at.x;
    char.y = at.y;
    char.moving = false;
    if (rider.tuneIn <= 0 && steered(state, char)) {
      rider.tuneIn = TUNE_RIDE;
      state.sounds.push("carousel");
    }
    if (steered(state, char) && RIDE_SECONDS - rider.left > BELL_AFTER) {
      collectBell(state, "carousel", char);
    }
  }
  const done = east.riders.filter((rider) => rider.left <= 0);
  for (const rider of done) {
    getOff(state, state.chars[rider.who]);
  }
  const riding = east.riders.filter((rider) => rider.left > 0);
  east.riders.length = 0;
  east.riders.push(...riding);
  const char = state.chars[state.active];
  east.tuneIn -= dt;
  if (
    char.area === "outdoors" &&
    inBox(MARKET, char.x, char.y) &&
    !onCarousel(state, char) &&
    east.tuneIn <= 0
  ) {
    east.tuneIn = TUNE_STROLL;
    state.sounds.push("carousel");
  }
}

/**
 * Where a horse is right now, map px of the feet of its rider.
 *
 * @param state - the game
 * @param seat - which horse
 * @param ahead - seconds into the future
 * @returns the point on the ride's ellipse
 */
export function seatPoint(
  state: GameState,
  seat: number,
  ahead = 0,
): { x: number; y: number } {
  const middle = carouselMiddle();
  const angle = (state.time + ahead) * SPIN + (seat * Math.PI * 2) / SEATS;
  return {
    x: middle.x + Math.cos(angle) * RIDE_RX,
    y: middle.y + Math.sin(angle) * RIDE_RY,
  };
}

/**
 * The middle of the carousel's platform, map px.
 *
 * @returns the point the horses turn round
 */
export function carouselMiddle(): { x: number; y: number } {
  const size = footprint(CAROUSEL.kind);
  return {
    x: (CAROUSEL.tx + size.cols / 2) * TILE,
    y: (CAROUSEL.ty + size.rows) * TILE - RIDE_LIFT,
  };
}

/** Down from the horse, in front of the carousel. */
function getOff(state: GameState, char: Character): void {
  const size = footprint(CAROUSEL.kind);
  char.x = carouselMiddle().x;
  char.y = (CAROUSEL.ty + size.rows) * TILE + STEP_OFF;
  char.dir = "down";
  say(char, pick(state, EAST_TEXTS.carouselOff));
}
