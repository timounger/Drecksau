/**
 * The new places together: setting them up, running them on, and what the
 * talk key and the ability key do while one rides the balloon, the gondola
 * or the train, skis, or plays a hockey match.
 *
 * @module
 * @remarks
 * Each place has its own module (`hockey.ts`, `castle.ts`, `balloon.ts`,
 * `cablecar.ts`, `lighthouse.ts`, `railway.ts`); this one only starts them
 * and runs them on, once per step from `world.ts`, and tells the engine
 * which keys the vehicles take.
 */
import { inBalloon, inGondola, skiing, trainSeat } from "./aboard";
import {
  createBalloon,
  fireBurner,
  landBalloon,
  updateBalloon,
} from "./balloon";
import { createCable, updateCable } from "./cablecar";
import { createCastle, updateCastle } from "./castle";
import { createHockey, shoot, shotReady, updateHockey } from "./hockey";
import { createLighthouse, updateLighthouse } from "./lighthouse";
import { createTrain, trainTalk, trainWhistle, updateTrain } from "./railway";
import type { GameState, PlacesState } from "./types";

/**
 * The new places as they are on a new visit.
 *
 * @returns their state
 */
export function createPlaces(): PlacesState {
  return {
    hockey: createHockey(),
    castle: createCastle(),
    balloon: createBalloon(),
    cable: createCable(),
    lighthouse: createLighthouse(),
    train: createTrain(),
  };
}

/**
 * Runs the new places on.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updatePlaces(state: GameState, dt: number): void {
  updateHockey(state, dt);
  updateCastle(state, dt);
  updateBalloon(state, dt);
  updateCable(state, dt);
  updateLighthouse(state, dt);
  updateTrain(state, dt);
}

/**
 * The talk key for the character steered while it rides or plays: lands the
 * balloon, gets off the train (or asks to), shoots the puck; in the gondola
 * and on skis it does nothing.
 *
 * @param state - the game
 * @returns true when the key was taken
 */
export function placeTalk(state: GameState): boolean {
  const char = state.chars[state.active];
  let taken = true;
  if (inBalloon(state, char)) {
    landBalloon(state, char);
  } else if (trainSeat(state, char) !== null) {
    trainTalk(state, char);
  } else if (inGondola(state, char) || skiing(state, char)) {
    // Sitting in the cabin or racing down: nothing to use.
  } else if (shotReady(state)) {
    shoot(state, char);
  } else {
    taken = false;
  }
  return taken;
}

/**
 * The ability key for the character steered while it rides or plays: the
 * balloon's burner, the engine's whistle, a shot in a hockey match.
 *
 * @param state - the game
 * @returns true when the key was taken
 */
export function placeAbility(state: GameState): boolean {
  const char = state.chars[state.active];
  const match = state.world.places.hockey.match;
  let taken = true;
  if (inBalloon(state, char)) {
    fireBurner(state, char);
  } else if (trainSeat(state, char) !== null) {
    trainWhistle(state, char);
  } else if (inGondola(state, char) || skiing(state, char)) {
    // Nothing to do but enjoy the ride.
  } else if (match !== null && match.player === state.active) {
    shoot(state, char);
  } else {
    taken = false;
  }
  return taken;
}
