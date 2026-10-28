/**
 * Going in and out of the houses: the doorways, the fade to black and back
 * (also into an Advent gate), and taking the view to a character in another
 * place.
 *
 * @module
 */
import { ANIMALS } from "./cast";
import { snapCamera } from "./camera";
import { poof } from "./effects";
import { TILE, areaMap, inBox } from "./map";
import type { Character, Dir, Door, GameState, Input } from "./types";

/** How long the whole fade takes, out and back in, seconds. */
const FADE_SECONDS = 0.6;

/** How firmly one has to push towards a door, 0 to 1. */
const PUSH = 0.5;

/** How far above the feet the poof sits when the bird turns back, map px. */
const POOF_LIFT = 8;

/** Which way each push points. */
const AXES: Readonly<Record<Dir, readonly [number, number]>> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/**
 * Starts going through a door when the character the player steers stands
 * in one and pushes its way.
 *
 * @param state - the game
 * @param char - the character steered
 * @param input - the held controls
 */
export function checkDoors(
  state: GameState,
  char: Character,
  input: Input,
): void {
  if (state.fade === null) {
    const door = areaMap(state, char).doors.find(
      (candidate) =>
        inBox(candidate, char.x, char.y - 1) &&
        input.moveX * AXES[candidate.dir][0] +
          input.moveY * AXES[candidate.dir][1] >
          PUSH,
    );
    if (door !== undefined) {
      startFade(state, door, state.active);
      state.sounds.push("door");
    }
  }
}

/**
 * Starts a fade; at its darkest moment somebody goes through the door, a
 * gate's minigame opens, or only the view moves to the character now steered.
 *
 * @param state - the game
 * @param door - the door, or null
 * @param who - index of who goes through
 * @param gate - the Advent gate entered, or null
 */
export function startFade(
  state: GameState,
  door: Door | null,
  who: number,
  gate: number | null = null,
): void {
  state.fade = { elapsed: 0, door, who, gate, switched: false };
}

/**
 * Runs the fade on.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateFade(state: GameState, dt: number): void {
  const fade = state.fade;
  if (fade !== null) {
    fade.elapsed += dt;
    if (!fade.switched && fade.elapsed >= FADE_SECONDS / 2) {
      fade.switched = true;
      if (fade.door !== null) {
        passThrough(state, state.chars[fade.who], fade.door);
      }
      if (fade.gate !== null) {
        state.gateOpen = fade.gate;
      }
      state.viewArea = state.chars[state.active].area;
      snapCamera(state);
    }
    if (fade.elapsed >= FADE_SECONDS) {
      state.fade = null;
    }
  }
}

/**
 * How dark the picture is right now.
 *
 * @param state - the game
 * @returns 0 (clear) to 1 (black)
 */
export function fadeDarkness(state: GameState): number {
  let dark = 0;
  if (state.fade !== null) {
    const half = FADE_SECONDS / 2;
    const t = state.fade.elapsed;
    dark = t < half ? t / half : Math.max(0, 1 - (t - half) / half);
  }
  return dark;
}

/**
 * Takes somebody to the other side of a door. Nobody flies indoors: flyers
 * land and the bird turns back into Jordi.
 */
function passThrough(state: GameState, char: Character, door: Door): void {
  char.area = door.to;
  char.x = door.toX * TILE;
  char.y = door.toY * TILE;
  char.dir = door.toDir;
  char.vx = 0;
  char.vy = 0;
  char.moving = false;
  if (door.to !== "outdoors") {
    char.flying = false;
    char.altitude = 0;
    if (char.form !== null && ANIMALS[char.form].flies) {
      char.form = null;
      poof(state, char.area, char.x, char.y - POOF_LIFT);
    }
  }
}
