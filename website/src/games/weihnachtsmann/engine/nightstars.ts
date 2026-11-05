/**
 * Rudolf's red nose at night: it throws a circle of light round him, and in
 * the dark corners of the map it shows the night stars - little glowing
 * stars nobody else can see. Rudolf collects them by going to them; the
 * collection is kept.
 *
 * @module
 */
import { EXTRA_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { collect, steered } from "./achievements";
import { say, spawn, SPARKLE_TINTS } from "./effects";
import { NIGHT_STARS } from "./extras-data";
import { TILE } from "./map";
import { darkness } from "./sky";
import type { Character, GameState } from "./types";

/** From this darkness on, the nose shines and the night stars show. */
export const NOSE_DARK = 0.35;

/** How far the nose's light reaches, map px. */
export const NOSE_REACH = 64;

/** How near a night star Rudolf has to come to take it, map px. */
const TAKE_REACH = 16;

/** Where the nose sits from the feet: walking and flying, map px. */
const NOSE_FRONT = { x: 0, y: -16 } as const;
const NOSE_SIDE = { x: 9, y: -19 } as const;

/** Sparkles of a star taken. */
const TAKE_SPARKLES = 8;
const TAKE_SPRAY = 22;

/**
 * Where Rudolf's nose shines right now, if it does: outside, at night.
 *
 * @param state - the game
 * @returns the nose, map px, or null
 */
export function noseLight(state: GameState): { x: number; y: number } | null {
  const rudolf = state.chars.find((char) => char.id === "rudolf");
  let nose: { x: number; y: number } | null = null;
  if (
    rudolf !== undefined &&
    rudolf.area === "outdoors" &&
    state.viewArea === "outdoors" &&
    darkness(state) >= NOSE_DARK
  ) {
    const side = rudolf.dir === "left" || rudolf.dir === "right";
    const offset = side ? NOSE_SIDE : NOSE_FRONT;
    nose = {
      x: rudolf.x + offset.x * (rudolf.dir === "left" ? -1 : 1),
      y: rudolf.y + offset.y - rudolf.altitude,
    };
  }
  return nose;
}

/**
 * Lets the player's Rudolf take the night stars he reaches at night.
 *
 * @param state - the game
 */
export function updateNightStars(state: GameState): void {
  const rudolf = state.chars.find((char) => char.id === "rudolf");
  if (
    rudolf !== undefined &&
    steered(state, rudolf) &&
    rudolf.area === "outdoors" &&
    darkness(state) >= NOSE_DARK
  ) {
    for (const star of NIGHT_STARS) {
      if (
        !state.progress.nightStars.has(star.id) &&
        Math.hypot(rudolf.x - star.x * TILE, rudolf.y - star.y * TILE) <
          TAKE_REACH
      ) {
        take(state, rudolf, star.x * TILE, star.y * TILE, star.id);
      }
    }
  }
}

/** One night star taken: sparkles, a chime, the collection. */
function take(
  state: GameState,
  rudolf: Character,
  x: number,
  y: number,
  id: string,
): void {
  for (let k = 0; k < TAKE_SPARKLES; k += 1) {
    spawn(
      state,
      "sparkle",
      "outdoors",
      x,
      y,
      ((k / TAKE_SPARKLES) * 2 - 1) * TAKE_SPRAY,
      -TAKE_SPRAY,
      k % SPARKLE_TINTS,
    );
  }
  state.sounds.push("collect");
  collect(state, "nightStars", id);
  say(
    rudolf,
    EXTRA_TEXTS.nightStar
      .replace("{n}", String(state.progress.nightStars.size))
      .replace("{of}", String(NIGHT_STARS.length)),
  );
}
