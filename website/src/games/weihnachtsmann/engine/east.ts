/**
 * Everything of the east land and the extras across the map that runs by
 * itself: the market and its carousel, the snowballs, the ice cave, the
 * firs, the lake, the bells, the animals and the mailbox.
 *
 * @module
 * @remarks
 * Each attraction has its own module; this one only sets them up and runs
 * them on, once per step from `world.ts`. The sled run is moved by the engine
 * itself, since it takes the player's steering (`sled.ts`).
 */
import { updateBells } from "./bells";
import { updateCave } from "./cave";
import { createCritters, updateCritters } from "./critters";
import { updateErrands } from "./errands";
import { updateFirs } from "./firs";
import { updateMarket } from "./market";
import { updateRink } from "./rink";
import { updateSnowballs } from "./snowball";
import type { EastState, GameState } from "./types";

/**
 * The east land as it is on a new visit: the curtain whole, the hole snowed
 * over, a letter waiting in the mailbox.
 *
 * @returns its state
 */
export function createEast(): EastState {
  return {
    riders: [],
    tuneIn: 0,
    sled: null,
    snowballs: [],
    targetsHit: new Map(),
    curtain: 0,
    hole: 0,
    sniffIn: 0,
    felled: new Map(),
    xmasTree: 0,
    bellDown: 0,
    lapTurn: 0,
    lapAngle: null,
    critters: createCritters(),
    errand: null,
    letterIn: 0,
  };
}

/**
 * Runs the east land on.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateEast(state: GameState, dt: number): void {
  updateMarket(state, dt);
  updateSnowballs(state, dt);
  updateCave(state, dt);
  updateFirs(state, dt);
  updateRink(state, dt);
  updateBells(state, dt);
  updateCritters(state, dt);
  updateErrands(state, dt);
}
