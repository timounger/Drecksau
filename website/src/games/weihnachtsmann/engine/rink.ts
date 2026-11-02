/**
 * The frozen lake: its ice is smoother than the pond's - everybody glides
 * further - laps round the island are counted, and Balbo can hardly stay on
 * his paws there.
 *
 * @module
 */
import { steered, unlock } from "./achievements";
import { ISLAND, RINK } from "./east-data";
import { ridingJetski } from "./jetski";
import { TILE, inBox, terrainUnder } from "./map";
import { nextRandom } from "./random";
import { startShow } from "./shows";
import type { Character, GameMap, GameState } from "./types";

/** Grip on the lake's ice, as a share of the grip on other ice. */
export const RINK_GRIP = 0.7;

/** Speed on the lake's ice, as a share of the speed on other ice. */
export const RINK_SPEED = 1.25;

/** Laps round the island for the achievement. */
export const LAPS = 3;

/** Chance per second that Balbo slips while moving on the lake. */
const BALBO_SLIP = 0.35;

/**
 * Whether a point is on the lake's ice.
 *
 * @param map - the map
 * @param x - map px
 * @param y - map px
 * @returns true on the rink
 */
export function onRink(map: GameMap, x: number, y: number): boolean {
  return (
    map.area === "outdoors" &&
    inBox(RINK, x, y) &&
    terrainUnder(map, x, y - 1) === "ice"
  );
}

/**
 * Counts the laps of the character steered and lets Balbo slip.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateRink(state: GameState, dt: number): void {
  const east = state.world.east;
  const map = state.maps.outdoors;
  const char = state.chars[state.active];
  // Laps on a jetski do not count: skating is the thing.
  if (
    char.area === "outdoors" &&
    !char.flying &&
    !ridingJetski(state, char) &&
    onRink(map, char.x, char.y)
  ) {
    const angle = Math.atan2(
      char.y - ISLAND.y * TILE,
      char.x - ISLAND.x * TILE,
    );
    if (east.lapAngle !== null) {
      let turn = angle - east.lapAngle;
      if (turn > Math.PI) {
        turn -= Math.PI * 2;
      } else if (turn < -Math.PI) {
        turn += Math.PI * 2;
      }
      east.lapTurn += turn;
    }
    east.lapAngle = angle;
    if (Math.abs(east.lapTurn) >= LAPS * Math.PI * 2 && steered(state, char)) {
      unlock(state, "skater");
    }
  } else {
    east.lapTurn = 0;
    east.lapAngle = null;
  }
  for (const other of state.chars) {
    if (slips(state, other) && nextRandom(state) < BALBO_SLIP * dt) {
      startShow(state, other, "fall");
    }
  }
}

/**
 * Laps done round the island so far.
 *
 * @param state - the game
 * @returns whole laps
 */
export function lapsDone(state: GameState): number {
  return Math.floor(Math.abs(state.world.east.lapTurn) / (Math.PI * 2));
}

/** Whether somebody is Balbo gliding over the lake, ready to slip. */
function slips(state: GameState, char: Character): boolean {
  return (
    char.id === "balbo" &&
    char.area === "outdoors" &&
    char.moving &&
    char.show === null &&
    char.cooldown <= 0 &&
    onRink(state.maps.outdoors, char.x, char.y)
  );
}
