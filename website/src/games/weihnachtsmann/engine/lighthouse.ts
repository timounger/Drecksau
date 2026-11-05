/**
 * The lighthouse on the lake's south-west shore: the talk key at its door
 * climbs up and switches the light on (or off); at night its beam sweeps
 * round over the lake and the land.
 *
 * @module
 * @remarks
 * The light burns for a few minutes, then goes out by itself - like every
 * change in the world it is not saved. The beam is only a picture
 * (`render-places.ts`); here it turns and keeps time.
 */
import { PLACES_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import { say, spawn, SPARKLE_TINTS } from "./effects";
import { TILE, footprint } from "./map";
import { LIGHTHOUSE } from "./places-data";
import { pick, randomIn } from "./random";
import { darkness } from "./sky";
import type { Character, GameState, LighthouseState } from "./types";

/** Seconds the light burns once switched on. */
const BURNS = 240;

/** How fast the beam turns, radians per second. */
export const BEAM_SPIN = 0.9;

/** How dark it must be for the achievement. */
const NIGHT = 0.5;

/** How high over the foot of the tower the lamp sits, map px. */
export const LAMP_HIGH = 86;

/** Sparkles round the lamp when it lights up, and how fast they fly. */
const SPARKLES = 8;
const SPRAY = 18;

/**
 * The lighthouse on a new visit: dark.
 *
 * @returns its state
 */
export function createLighthouse(): LighthouseState {
  return { on: 0, angle: 0 };
}

/**
 * Where the lamp sits, map px.
 *
 * @returns the lamp's middle
 */
export function lampPoint(): { x: number; y: number } {
  const size = footprint(LIGHTHOUSE.kind);
  return {
    x: (LIGHTHOUSE.tx + size.cols / 2) * TILE,
    y: (LIGHTHOUSE.ty + size.rows) * TILE - LAMP_HIGH,
  };
}

/**
 * The talk key at the door: up the stairs, the light on - or off again.
 *
 * @param state - the game
 * @param char - who climbs up
 */
export function useLighthouse(state: GameState, char: Character): void {
  const light = state.world.places.lighthouse;
  const lamp = lampPoint();
  if (light.on > 0) {
    light.on = 0;
    say(char, PLACES_TEXTS.lighthouseOff);
  } else {
    light.on = BURNS;
    const night = darkness(state) >= NIGHT;
    say(
      char,
      night
        ? pick(state, PLACES_TEXTS.lighthouseNight)
        : PLACES_TEXTS.lighthouseDay,
    );
    for (let k = 0; k < SPARKLES; k += 1) {
      spawn(
        state,
        "sparkle",
        "outdoors",
        lamp.x,
        lamp.y,
        randomIn(state, -SPRAY, SPRAY),
        randomIn(state, -SPRAY, SPRAY),
        k % SPARKLE_TINTS,
      );
    }
    if (night && steered(state, char)) {
      unlock(state, "lighthouse");
    }
  }
  state.sounds.push("lamp");
}

/**
 * Turns the beam and lets the light go out after a while.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateLighthouse(state: GameState, dt: number): void {
  const light = state.world.places.lighthouse;
  if (light.on > 0) {
    light.on = Math.max(0, light.on - dt);
    light.angle = (light.angle + BEAM_SPIN * dt) % (Math.PI * 2);
  }
}
