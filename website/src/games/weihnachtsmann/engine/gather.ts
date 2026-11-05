/**
 * Everybody comes together: for Grantelbart's concert in front of the stage,
 * and on Christmas Eve round the gift tree. Whoever nobody steers walks
 * there, or - from far away or another place - pops up nearby out of sight;
 * once there they dance (at the concert) or wait and look on.
 *
 * @module
 * @remarks
 * Only characters on foot are called: nobody on a vehicle, in the sleigh, in
 * a hockey match or in the middle of a show. The gathering ends when its
 * event ends ({@link endGather}); everybody strolls on from where they are.
 */
import { hockeyHelper, vehicleOf } from "./aboard";
import { CAST } from "./cast";
import { poof, snowPuff } from "./effects";
import type { GatherKind, Point } from "./extras-types";
import { TILE, areaMap, fits } from "./map";
import { currentProfile, facing, moveCharacter } from "./movement";
import { randomIn } from "./random";
import { isRiding } from "./sleigh";
import type { Character, GameState } from "./types";
import { rest } from "./wander";

/** Farther than this from their spot, characters pop up close by, map px. */
const FAR = 260;

/** How close to the spot counts as there, map px. */
const THERE = 4;

/** Seconds of getting nowhere before one pops up at the spot. */
const STUCK_SECONDS = 2.5;

/** Seconds between two dance steps, and how long a hop lasts. */
const DANCE_BEAT = 0.5;
const HOP = 0.35;

/** Pace of the walk there, as a share of full speed. */
const PACE = 1;

/** How far from the spot somebody arriving from afar appears, map px. */
const APPEAR_NEAR = 70;

/** How far above the feet the poof of somebody popping up sits, map px. */
const POOF_LIFT = 10;

/** Places tried round the spot for somebody popping up. */
const APPEAR_TRIES = 8;

/** The ring round the spot is flatter than wide: depth counts more. */
const APPEAR_FLAT = 0.6;

/** Shortest and longest rest once the gathering is over, seconds. */
const AFTER_REST_MIN = 1;
const AFTER_REST_MAX = 3;

/** Share of a beat in which a dancer takes off, and the offset per dancer. */
const TAKE_OFF = 0.2;
const BEAT_SHIFT = 0.5;

/**
 * Calls everybody nobody steers to a place.
 *
 * @param state - the game
 * @param kind - why they come
 * @param spots - where they may stand, cells; one each, in order
 * @param look - where they look once there, cells
 * @param skip - indexes of characters who do not come
 */
export function callTogether(
  state: GameState,
  kind: GatherKind,
  spots: readonly (readonly [number, number])[],
  look: { readonly x: number; readonly y: number },
  skip: ReadonlySet<number>,
): void {
  const placed = new Map<number, Point>();
  let next = 0;
  state.chars.forEach((char, index) => {
    if (
      index !== state.active &&
      !skip.has(index) &&
      next < spots.length &&
      mayCome(state, char)
    ) {
      const [sx, sy] = spots[next];
      next += 1;
      placed.set(index, { x: sx * TILE, y: sy * TILE });
      char.show = null;
      if (char.flying) {
        char.flying = false;
      }
      fetchFromAfar(state, char, placed.get(index) ?? { x: 0, y: 0 });
    }
  });
  state.world.extras.gather = {
    kind,
    spots: placed,
    arrived: new Set(),
    look: { x: look.x * TILE, y: look.y * TILE },
    elapsed: 0,
  };
}

/**
 * Moves somebody called to the gathering a step: walking there, or dancing
 * and looking on once there.
 *
 * @param state - the game
 * @param char - the character
 * @param index - its index
 * @param dt - seconds
 * @returns true when the gathering moved it
 */
export function driveGathered(
  state: GameState,
  char: Character,
  index: number,
  dt: number,
): boolean {
  const gather = state.world.extras.gather;
  const spot = gather === null ? undefined : gather.spots.get(index);
  const taken =
    gather !== null &&
    spot !== undefined &&
    index !== state.active &&
    char.area === "outdoors";
  if (taken) {
    const map = areaMap(state, char);
    const dx = spot.x - char.x;
    const dy = spot.y - char.y;
    const distance = Math.hypot(dx, dy);
    if (gather.arrived.has(index) || distance < THERE) {
      gather.arrived.add(index);
      moveCharacter(map, char, 0, 0, dt);
      if (gather.kind === "concert") {
        dance(state, char, index);
      } else {
        char.dir = facing(gather.look.x - char.x, gather.look.y - char.y);
      }
    } else {
      const beforeX = char.x;
      const beforeY = char.y;
      moveCharacter(map, char, dx / distance, dy / distance, dt, PACE);
      const moved = Math.hypot(char.x - beforeX, char.y - beforeY);
      char.brain.stuck = moved < dt ? char.brain.stuck + dt : 0;
      if (char.brain.stuck > STUCK_SECONDS) {
        popUp(state, char, spot);
        gather.arrived.add(index);
      }
    }
  }
  return taken;
}

/**
 * Ends the gathering: everybody rests a moment and strolls on.
 *
 * @param state - the game
 */
export function endGather(state: GameState): void {
  const gather = state.world.extras.gather;
  if (gather !== null) {
    for (const index of gather.spots.keys()) {
      const char = state.chars[index];
      char.brain.stuck = 0;
      rest(char, randomIn(state, AFTER_REST_MIN, AFTER_REST_MAX));
    }
    state.world.extras.gather = null;
  }
}

/**
 * Runs the gathering's clock on.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateGather(state: GameState, dt: number): void {
  const gather = state.world.extras.gather;
  if (gather !== null) {
    gather.elapsed += dt;
    for (const index of gather.spots.keys()) {
      if (index === state.active) {
        // Taken over by the player: no longer one of the crowd.
        gather.spots.delete(index);
      }
    }
  }
}

/**
 * How many of those called have arrived.
 *
 * @param state - the game
 * @returns the count
 */
export function arrivedCount(state: GameState): number {
  return state.world.extras.gather?.arrived.size ?? 0;
}

/** Whether somebody is free to come along. */
function mayCome(state: GameState, char: Character): boolean {
  return (
    vehicleOf(state, char) === null &&
    !isRiding(state, char) &&
    !hockeyHelper(state, char) &&
    char.show?.kind !== "telescope"
  );
}

/**
 * Somebody far away or in another place pops up close to the spot, so the
 * gathering does not take forever; nearby ones walk.
 */
function fetchFromAfar(state: GameState, char: Character, spot: Point): void {
  const far =
    char.area !== "outdoors" ||
    Math.hypot(char.x - spot.x, char.y - spot.y) > FAR;
  if (far) {
    char.carry = char.carry?.kind === "present" ? char.carry : null;
    char.area = "outdoors";
    const map = state.maps.outdoors;
    const profile = currentProfile(char);
    let placed = false;
    for (let k = 0; k < APPEAR_TRIES && !placed; k += 1) {
      const angle = randomIn(state, 0, Math.PI * 2);
      const x = spot.x + Math.cos(angle) * APPEAR_NEAR;
      const y = spot.y + Math.sin(angle) * APPEAR_NEAR * APPEAR_FLAT;
      if (fits(map, profile, x, y)) {
        char.x = x;
        char.y = y;
        placed = true;
      }
    }
    if (!placed) {
      char.x = spot.x;
      char.y = spot.y;
    }
    snowPuff(state, "outdoors", char.x, char.y);
  }
}

/** Puts somebody stuck on the way straight at its spot. */
function popUp(state: GameState, char: Character, spot: Point): void {
  if (fits(areaMap(state, char), CAST[char.id].walk, spot.x, spot.y)) {
    char.x = spot.x;
    char.y = spot.y;
  }
  poof(state, char.area, char.x, char.y - POOF_LIFT);
}

/** A dance step: turning from side to side and hopping to the beat. */
function dance(state: GameState, char: Character, index: number): void {
  const count = state.time / DANCE_BEAT + index * BEAT_SHIFT;
  const beat = Math.floor(count);
  char.dir = beat % 2 === 0 ? "left" : "right";
  if (char.hop <= 0 && beat % 2 === 0 && count - beat < TAKE_OFF) {
    char.hop = HOP;
  }
}
