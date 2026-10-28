/**
 * The camera: where it wants to be, easing it there, and snapping it after a
 * jump to another place.
 *
 * @module
 */
import { CAST } from "./cast";
import { mapSize } from "./map";
import { isRiding } from "./sleigh";
import type { GameState } from "./types";

/** How quickly the camera follows: while gliding, and otherwise; per second. */
const GLIDE_RATE = 4;
const FOLLOW_RATE = 9;

/** Height of the sleigh the camera centres on, map px. */
const SLEIGH_MIDDLE = 12;

/**
 * Puts the camera straight onto the character the player steers.
 *
 * @param state - the game
 */
export function snapCamera(state: GameState): void {
  const goal = cameraGoal(state);
  state.camera.x = goal.x;
  state.camera.y = goal.y;
  state.glide = 0;
}

/**
 * Eases the camera towards the character the player steers; holds still
 * while a fade is running, since the picture is about to change.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function followCamera(state: GameState, dt: number): void {
  if (state.fade === null) {
    const goal = cameraGoal(state);
    const rate = state.glide > 0 ? GLIDE_RATE : FOLLOW_RATE;
    const k = 1 - Math.exp(-dt * rate);
    state.camera.x += (goal.x - state.camera.x) * k;
    state.camera.y += (goal.y - state.camera.y) * k;
  }
  state.glide = Math.max(0, state.glide - dt);
}

/**
 * Where the camera wants to be: the active character - or the sleigh it rides
 * in - in the middle, inside the map.
 */
function cameraGoal(state: GameState): { x: number; y: number } {
  const char = state.chars[state.active];
  const size = mapSize(state.maps[state.viewArea]);
  const view = state.view;
  let focusX = char.x;
  let focusY = char.y - char.altitude - CAST[char.id].walk.height / 2;
  const ride = state.sleigh;
  if (ride !== null && isRiding(state, char)) {
    focusX = ride.x;
    focusY = ride.y - ride.altitude - SLEIGH_MIDDLE;
  }
  const x = focusX - view.w / 2;
  const y = focusY - view.h / 2;
  // A view wider than the map keeps the map in its middle.
  return {
    x:
      size.w <= view.w
        ? (size.w - view.w) / 2
        : Math.max(0, Math.min(size.w - view.w, x)),
    y:
      size.h <= view.h
        ? (size.h - view.h) / 2
        : Math.max(0, Math.min(size.h - view.h, y)),
  };
}
