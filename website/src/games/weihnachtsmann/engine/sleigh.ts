/**
 * Santa's sleigh: taking off from the painted fir, one big loop over the map
 * with Rudolf pulling, and landing back on the fir.
 *
 * @module
 * @remarks
 * Nobody steers the ride. Santa (and Rudolf, when he is outside) leave the
 * map while it lasts and are drawn in the sleigh; their places stay as they
 * were, so a save in the middle of a ride simply finds them standing by the
 * sleigh.
 */
import { BUBBLE_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { CAST } from "./cast";
import { say, snowPuff, spawn, SPARKLE_TINTS } from "./effects";
import { TILE, fits, footprint } from "./map";
import { nextRandom, pick, randomIn } from "./random";
import type { Character, CharacterId, GameState } from "./types";

/** How long the round takes, seconds. */
const RIDE_SECONDS = 11;

/** Half the width and the full height of the loop, map px. */
const LOOP_W = 300;
const LOOP_H = 170;

/** Highest the sleigh rises over its shadow, map px. */
const RIDE_HEIGHT = 46;

/** Seconds between two sparkles behind the sleigh. */
const SPARKLE_EVERY = 0.03;

/** How far round the runners sparkles appear, map px. */
const SPARKLE_SPREAD = 6;

/** How far above the runners sparkles may appear, map px. */
const SPARKLE_ABOVE = 2;

/** Where Rudolf stands after landing, from the sleigh's front, map px. */
const RUDOLF_AFTER = { x: 28, y: 4 } as const;

/**
 * Whether somebody sits in the flying sleigh (or pulls it).
 *
 * @param state - the game
 * @param char - the character
 * @returns true while it is off the map on the ride
 */
export function isRiding(state: GameState, char: Character): boolean {
  return state.sleigh !== null && state.sleigh.riders.includes(char.id);
}

/**
 * Where the sleigh stands when it is home on the painted fir.
 *
 * @param state - the game
 * @returns the middle of its runners, map px, or null when the map has none
 */
export function sleighHome(state: GameState): { x: number; y: number } | null {
  const object = state.maps.outdoors.objects.find(
    (candidate) => candidate.kind === "sleigh",
  );
  let home: { x: number; y: number } | null = null;
  if (object !== undefined) {
    const size = footprint("sleigh");
    home = {
      x: (object.tx + size.cols / 2) * TILE,
      y: (object.ty + size.rows) * TILE,
    };
  }
  return home;
}

/**
 * The talk key at the sleigh: Santa takes off, everybody else is told it is
 * his to fly.
 *
 * @param state - the game
 * @param char - who stands at the sleigh
 */
export function boardSleigh(state: GameState, char: Character): void {
  const home = sleighHome(state);
  if (char.id !== "santa") {
    say(
      char,
      char.id === "rudolf"
        ? BUBBLE_TEXTS.sleighRudolf
        : BUBBLE_TEXTS.sleighOnlySanta,
    );
  } else if (state.sleigh === null && home !== null) {
    const riders: CharacterId[] = ["santa"];
    const rudolf = state.chars.find((other) => other.id === "rudolf");
    if (rudolf !== undefined && rudolf.area === "outdoors") {
      riders.push("rudolf");
      rudolf.flying = false;
      rudolf.altitude = 0;
      rudolf.bubble = null;
    }
    state.sleigh = {
      elapsed: 0,
      riders,
      x: home.x,
      y: home.y,
      altitude: 0,
      dir: "right",
      sparkleIn: 0,
    };
    say(
      char,
      riders.length > 1
        ? pick(state, BUBBLE_TEXTS.sleighGo)
        : BUBBLE_TEXTS.sleighAlone,
    );
    snowPuff(state, "outdoors", home.x, home.y);
    state.sounds.push("sleighStart");
  }
}

/**
 * Flies the sleigh on along its loop, and lands it at the end.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateSleigh(state: GameState, dt: number): void {
  const ride = state.sleigh;
  const home = sleighHome(state);
  if (ride !== null && home !== null) {
    ride.elapsed += dt;
    const t = Math.min(1, ride.elapsed / RIDE_SECONDS);
    // Slow off the fir, fast round the loop, gently back down.
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- smoothstep
    const u = t * t * (3 - 2 * t);
    const turn = Math.PI * 2 * u;
    ride.x = home.x + LOOP_W * Math.sin(turn);
    ride.y = home.y - LOOP_H * (1 - Math.cos(turn));
    ride.altitude = RIDE_HEIGHT * Math.sin(Math.PI * u);
    ride.dir = Math.cos(turn) >= 0 ? "right" : "left";
    ride.sparkleIn -= dt;
    if (ride.sparkleIn <= 0 && ride.altitude > 2) {
      ride.sparkleIn = SPARKLE_EVERY;
      spawn(
        state,
        "sparkle",
        "outdoors",
        ride.x + randomIn(state, -SPARKLE_SPREAD, SPARKLE_SPREAD),
        ride.y -
          ride.altitude +
          randomIn(state, -SPARKLE_ABOVE, SPARKLE_SPREAD),
        0,
        randomIn(state, 0, SPARKLE_SPREAD),
        Math.floor(nextRandom(state) * SPARKLE_TINTS),
      );
    }
    if (t >= 1) {
      land(state, home);
    }
  }
}

/** Back on the fir: Rudolf steps out in front, Santa is pleased. */
function land(state: GameState, home: { x: number; y: number }): void {
  const riders = state.sleigh?.riders ?? [];
  state.sleigh = null;
  for (const char of state.chars) {
    if (char.id === "rudolf" && riders.includes("rudolf")) {
      const x = home.x + RUDOLF_AFTER.x;
      const y = home.y + RUDOLF_AFTER.y;
      if (fits(state.maps.outdoors, CAST.rudolf.walk, x, y)) {
        char.x = x;
        char.y = y;
        char.dir = "left";
      }
    }
    if (char.id === "santa") {
      say(char, BUBBLE_TEXTS.sleighLanded);
    }
  }
  snowPuff(state, "outdoors", home.x, home.y);
  state.sounds.push("sleighLand");
}
