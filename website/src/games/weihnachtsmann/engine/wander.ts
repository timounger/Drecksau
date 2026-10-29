/**
 * What the characters do when nobody steers them: stand about, stroll to a
 * free spot nearby, chat now and then, land when they were left flying, and
 * now and then show off their ability (Balbo trips, Grantelbart strums).
 *
 * @module
 */
import { linesOf } from "./abilities";
import { CAST } from "./cast";
import { say, snowPuff } from "./effects";
import { areaMap, fits } from "./map";
import { currentProfile, moveCharacter } from "./movement";
import { nextRandom, pick, randomIn } from "./random";
import { showOffMaybe } from "./shows";
import type { Character, GameState } from "./types";

/** Strolling speed, as a share of full speed. */
const STROLL = 0.55;

/** Nearest and farthest a stroll goes, map px. */
const MIN_TRIP = 20;
const MAX_TRIP = 90;

/** Shortest and longest rest, seconds. */
const MIN_REST = 1.2;
const MAX_REST = 4.5;

/** A stroll is given up after this long, seconds. */
const MAX_WALK = 6;

/** Close enough to the target, map px. */
const ARRIVED = 3;

/** Stuck this long, seconds, and the stroll is given up. */
const GIVE_UP = 0.5;

/** Moving less than this per second counts as stuck, map px. */
const STUCK_SPEED = 6;

/** How many places are tried when picking a target. */
const TRIES = 6;

/** Points checked along the way to a target. */
const SAMPLES = 6;

/** Chance of saying something when arriving. */
const CHAT_CHANCE = 0.12;

/** Short rest after getting stuck, seconds. */
const STUCK_REST = 0.6;

/**
 * Lets one character act on its own for a step.
 *
 * @param state - the game
 * @param char - the character; changed in place
 * @param dt - seconds
 */
export function wander(state: GameState, char: Character, dt: number): void {
  const brain = char.brain;
  const map = areaMap(state, char);
  if (char.flying && char.form === null) {
    // Left in the air: come down as soon as there is room.
    if (fits(map, CAST[char.id].walk, char.x, char.y)) {
      char.flying = false;
      snowPuff(state, char.area, char.x, char.y);
    }
  }
  showOffMaybe(state, char, dt);
  if (brain.mode === "rest") {
    moveCharacter(map, char, 0, 0, dt);
    brain.timer -= dt;
    if (brain.timer <= 0) {
      planTrip(state, char);
    }
  } else {
    const dx = brain.targetX - char.x;
    const dy = brain.targetY - char.y;
    const distance = Math.hypot(dx, dy);
    const beforeX = char.x;
    const beforeY = char.y;
    moveCharacter(map, char, dx / distance, dy / distance, dt, STROLL);
    const speed = Math.hypot(char.x - beforeX, char.y - beforeY) / dt;
    brain.stuck = speed < STUCK_SPEED ? brain.stuck + dt : 0;
    brain.timer -= dt;
    if (distance < ARRIVED) {
      rest(char, randomIn(state, MIN_REST, MAX_REST));
      if (nextRandom(state) < CHAT_CHANCE && char.bubble === null) {
        say(char, pick(state, linesOf(char)));
      }
    } else if (brain.stuck > GIVE_UP || brain.timer <= 0) {
      rest(char, STUCK_REST);
    }
  }
}

/**
 * Sends a character resting for a while, as when the player switches away.
 *
 * @param char - the character
 * @param seconds - how long
 */
export function rest(char: Character, seconds: number): void {
  char.brain.mode = "rest";
  char.brain.timer = seconds;
  char.brain.stuck = 0;
}

/** Picks a free place nearby with a clear way there and starts walking. */
function planTrip(state: GameState, char: Character): void {
  const profile = currentProfile(char);
  let found = false;
  for (let k = 0; k < TRIES && !found; k += 1) {
    const angle = randomIn(state, 0, Math.PI * 2);
    const trip = randomIn(state, MIN_TRIP, MAX_TRIP);
    const x = char.x + Math.cos(angle) * trip;
    const y = char.y + Math.sin(angle) * trip;
    let clear = true;
    for (let s = 1; s <= SAMPLES && clear; s += 1) {
      const t = s / SAMPLES;
      clear = fits(
        areaMap(state, char),
        profile,
        char.x + (x - char.x) * t,
        char.y + (y - char.y) * t,
      );
    }
    if (clear) {
      found = true;
      char.brain.mode = "walk";
      char.brain.targetX = x;
      char.brain.targetY = y;
      char.brain.timer = MAX_WALK;
      char.brain.stuck = 0;
    }
  }
  if (!found) {
    rest(char, STUCK_REST);
  }
}
