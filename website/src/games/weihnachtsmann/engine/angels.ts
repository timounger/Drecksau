/**
 * Balbo's snow angels: on the field in the middle of the south land pegs
 * mark the five points of a star and its middle. Where Balbo falls (his
 * ability) on a peg, a snow angel stays in the snow; with all six at once
 * the star shines - from up close, from the balloon and in the view from
 * the observatory. The wind blows each angel away after a while.
 *
 * @module
 */
import { EXTRA_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import { say, spawn, SPARKLE_TINTS } from "./effects";
import { ANGEL_POINTS } from "./extras-data";
import { TILE } from "./map";
import { FALL_IMPACT } from "./shows";
import type { Character, Dir, GameState } from "./types";

/** How long an angel lies in the snow, seconds. */
export const ANGEL_SECONDS = 150;

/** Over the last seconds of its time an angel fades away. */
export const ANGEL_FADE = 20;

/** How near a peg the middle of Balbo's fall has to land, map px. */
const PEG_REACH = 13;

/** How far ahead of his feet the middle of Balbo lies when he falls, map px. */
const BODY_AHEAD = 5;

/** Sparkles when the star is complete, per angel. */
const STAR_SPARKLES = 5;
const STAR_SPRAY = 20;

/** Which way each facing points. */
const AHEAD: Readonly<Record<Dir, readonly [number, number]>> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/**
 * Leaves an angel where Balbo falls on a peg, and lets the angels fade.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateAngels(state: GameState, dt: number): void {
  const extras = state.world.extras;
  const angels = extras.angels;
  angels.forEach((left, index) => {
    angels[index] = Math.max(0, left - dt);
  });
  const balbo = state.chars.find((char) => char.id === "balbo");
  const falling = balbo?.show?.kind === "fall";
  if (balbo === undefined || !falling) {
    extras.stamped = false;
  } else if (
    !extras.stamped &&
    (balbo.show?.elapsed ?? 0) >= FALL_IMPACT &&
    balbo.area === "outdoors"
  ) {
    extras.stamped = true;
    stamp(state, balbo);
  }
}

/**
 * Whether all six angels lie in the snow: the star shines.
 *
 * @param state - the game
 * @returns true while the star is complete
 */
export function starShines(state: GameState): boolean {
  return state.world.extras.angels.every((left) => left > 0);
}

/**
 * How many angels lie in the snow now.
 *
 * @param state - the game
 * @returns 0 to 6
 */
export function angelCount(state: GameState): number {
  return state.world.extras.angels.filter((left) => left > 0).length;
}

/**
 * The talk key at the angel field's sign: how many are still missing.
 *
 * @param state - the game
 * @param char - who reads it
 */
export function readAngelSign(state: GameState, char: Character): void {
  const missing = ANGEL_POINTS.length - angelCount(state);
  say(
    char,
    missing === 0
      ? EXTRA_TEXTS.angelsComplete
      : EXTRA_TEXTS.angelsMissing.replace("{n}", String(missing)),
  );
}

/** Balbo lands on the field: an angel at the peg he hit, if any. */
function stamp(state: GameState, balbo: Character): void {
  const [ax, ay] = AHEAD[balbo.dir];
  const x = balbo.x + ax * BODY_AHEAD;
  const y = balbo.y + ay * BODY_AHEAD;
  const before = starShines(state);
  ANGEL_POINTS.forEach(([px, py], index) => {
    if (Math.hypot(px * TILE - x, py * TILE - y) < PEG_REACH) {
      state.world.extras.angels[index] = ANGEL_SECONDS;
      state.sounds.push("magic");
      say(balbo, EXTRA_TEXTS.angelMade);
    }
  });
  if (!before && starShines(state)) {
    for (const [px, py] of ANGEL_POINTS) {
      for (let k = 0; k < STAR_SPARKLES; k += 1) {
        spawn(
          state,
          "sparkle",
          "outdoors",
          px * TILE,
          py * TILE,
          ((k / STAR_SPARKLES) * 2 - 1) * STAR_SPRAY,
          -STAR_SPRAY,
          k % SPARKLE_TINTS,
        );
      }
    }
    say(balbo, EXTRA_TEXTS.angelStar);
    state.sounds.push("cheer");
    if (steered(state, balbo)) {
      unlock(state, "angelStar");
    }
  }
}
