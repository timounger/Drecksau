/**
 * Walking, sliding on ice, swimming and flying - moving one figure a step
 * without running through what blocks it.
 *
 * @module
 */
import { BIRD_HEIGHT, FLY_HEIGHT, profileOf, type MoveProfile } from "./cast";
import { fits, terrainUnder } from "./map";
import type { Character, Dir, GameMap } from "./types";

/** How quickly a figure with full grip reaches the speed it wants, per second. */
const ACCEL = 30;

/** Below this speed a figure counts as standing, map px per second. */
const STILL = 4;

/** Distance walked per frame of the walk cycle, map px. */
const STEP_PX = 5;

/** Frames in the walk cycle. */
export const WALK_FRAMES = 4;

/** How quickly a flyer rises or sinks to its height, per second. */
const LIFT_RATE = 6;

/** How far round a corner a blocked figure is nudged, map px. */
const CORNER_NUDGE = 4;

/**
 * How a character moves right now.
 *
 * @param char - the character
 * @returns its profile in force
 */
export function currentProfile(char: Character): MoveProfile {
  return profileOf(char.id, char.flying, char.form);
}

/**
 * Moves one character a step towards where it wants to go.
 *
 * @param map - the map
 * @param char - who moves; changed in place
 * @param wantX - wanted direction, -1 to 1
 * @param wantY - wanted direction, -1 to 1
 * @param dt - seconds
 * @param pace - share of full speed: below 1 a stroll, above 1 the steered one
 */
export function moveCharacter(
  map: GameMap,
  char: Character,
  wantX: number,
  wantY: number,
  dt: number,
  pace = 1,
): void {
  const profile = currentProfile(char);
  const length = Math.hypot(wantX, wantY);
  const nx = length > 1 ? wantX / length : wantX;
  const ny = length > 1 ? wantY / length : wantY;
  const ground = profile.flies ? "snow" : terrainUnder(map, char.x, char.y - 1);
  let factor = 1;
  let grip = 1;
  if (ground === "ice") {
    factor = profile.iceSpeed;
    grip = profile.grip;
  } else if (ground === "water") {
    factor = profile.waterSpeed;
  }
  char.onIce = ground === "ice";
  const goalX = nx * profile.speed * factor * pace;
  const goalY = ny * profile.speed * factor * pace;
  const k = 1 - Math.exp(-dt * ACCEL * grip);
  char.vx += (goalX - char.vx) * k;
  char.vy += (goalY - char.vy) * k;

  const startX = char.x;
  const startY = char.y;
  const dx = char.vx * dt;
  const dy = char.vy * dt;
  if (fits(map, profile, char.x + dx, char.y)) {
    char.x += dx;
  } else {
    char.vx = 0;
    nudge(map, profile, char, dx, 0);
  }
  if (fits(map, profile, char.x, char.y + dy)) {
    char.y += dy;
  } else {
    char.vy = 0;
    nudge(map, profile, char, 0, dy);
  }
  const moved = Math.hypot(char.x - startX, char.y - startY);
  char.moving = moved / Math.max(dt, Number.EPSILON) > STILL;
  if (length > 0) {
    char.dir = facing(nx, ny);
  }
  char.stride = char.moving ? (char.stride + moved / STEP_PX) % WALK_FRAMES : 0;
  const lift = profile.flies
    ? char.form === "vogel"
      ? BIRD_HEIGHT
      : FLY_HEIGHT
    : 0;
  char.altitude += (lift - char.altitude) * Math.min(1, dt * LIFT_RATE);
}

/**
 * Which way a movement looks.
 *
 * @param x - direction, -1 to 1
 * @param y - direction, -1 to 1
 * @returns the facing of the stronger axis
 */
export function facing(x: number, y: number): Dir {
  let dir: Dir;
  if (Math.abs(x) > Math.abs(y)) {
    dir = x > 0 ? "right" : "left";
  } else {
    dir = y > 0 ? "down" : "up";
  }
  return dir;
}

/**
 * Slips a figure past the corner of what blocked it, so it does not catch on
 * every edge it brushes.
 */
function nudge(
  map: GameMap,
  profile: MoveProfile,
  char: Character,
  dx: number,
  dy: number,
): void {
  let done = false;
  for (let k = 1; k <= CORNER_NUDGE && !done; k += 1) {
    for (const side of [-1, 1]) {
      const ox = dy !== 0 ? side * k : 0;
      const oy = dx !== 0 ? side * k : 0;
      if (
        !done &&
        fits(map, profile, char.x + ox, char.y + oy) &&
        fits(map, profile, char.x + ox + dx, char.y + oy + dy)
      ) {
        // Only a little per step: a slide round the corner, not a jump.
        char.x += Math.sign(ox) * Math.min(Math.abs(ox), 1);
        char.y += Math.sign(oy) * Math.min(Math.abs(oy), 1);
        done = true;
      }
    }
  }
}
