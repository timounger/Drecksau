/**
 * The fir plantation and the Christmas tree: Santa or an elf fells a young
 * fir, carries it to the workshop and sets it up in the stand, where it
 * stands decorated for a few minutes. A stump is left in the plantation
 * until a new young fir has grown.
 *
 * @module
 */
import { EAST_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import { carries, pickUp } from "./carry";
import { poof, say, snowPuff, spawn, SPARKLE_TINTS } from "./effects";
import { PLANTATION, TREE_STAND } from "./east-data";
import { TILE, inBox } from "./map";
import { pick, randomIn } from "./random";
import type { Character, GameMap, GameState, Spot } from "./types";

/** Seconds until a young fir has grown where one was felled. */
const REGROW_SECONDS = 150;

/** How long the decorated tree stands in the workshop, seconds. */
const TREE_SECONDS = 240;

/** Sparkles round the tree when it is set up, and how fast they fly. */
const SPARKLES = 12;
const SPRAY = 24;

/** How tall the decorated tree is, map px. */
const TREE_HEIGHT = 60;

/**
 * A young fir of the plantation as a spot for the talk key.
 *
 * @param state - the game
 * @param map - the map
 * @param x - the point reached, map px
 * @param y - the point reached, map px
 * @returns the spot, or null
 */
export function firSpot(
  state: GameState,
  map: GameMap,
  x: number,
  y: number,
): Spot | null {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  const cell = ty * map.cols + tx;
  const found =
    map.area === "outdoors" &&
    inBox(PLANTATION, x, y) &&
    map.small[cell] === "smallTree" &&
    !state.world.east.felled.has(cell);
  return found ? { kind: "fellFir", tx, ty, w: 1, h: 1 } : null;
}

/**
 * Fells a young fir and takes it along - only Santa and the elves.
 *
 * @param state - the game
 * @param char - who stands at it
 * @param spot - the fir
 */
export function fellFir(state: GameState, char: Character, spot: Spot): void {
  const feller =
    char.form === null &&
    (char.id === "santa" ||
      char.id === "jordi" ||
      char.id === "trixi" ||
      char.id === "gilfi");
  if (!feller) {
    say(char, EAST_TEXTS.fellNo);
  } else if (pickUp(char, "fir")) {
    const cell = spot.ty * state.maps.outdoors.cols + spot.tx;
    state.world.east.felled.set(cell, REGROW_SECONDS);
    const x = (spot.tx + 1 / 2) * TILE;
    const y = (spot.ty + 1) * TILE;
    snowPuff(state, "outdoors", x, y);
    snowPuff(state, "outdoors", x, y - TILE);
    say(char, pick(state, EAST_TEXTS.fellOk));
    state.sounds.push("chop");
  }
}

/**
 * The talk key at the tree stand in the workshop: up goes the fir, decorated.
 *
 * @param state - the game
 * @param char - who stands at it
 */
export function useStand(state: GameState, char: Character): void {
  const east = state.world.east;
  if (east.xmasTree > 0) {
    say(char, EAST_TEXTS.standBusy);
  } else if (carries(char, "fir")) {
    char.carry = null;
    east.xmasTree = TREE_SECONDS;
    const x = (TREE_STAND.tx + 1 / 2) * TILE;
    const y = (TREE_STAND.ty + 1) * TILE;
    for (let k = 0; k < SPARKLES; k += 1) {
      spawn(
        state,
        "sparkle",
        "workshop",
        x + randomIn(state, -TILE, TILE),
        y - randomIn(state, 0, TREE_HEIGHT),
        randomIn(state, -SPRAY, SPRAY),
        randomIn(state, -SPRAY, 0),
        k % SPARKLE_TINTS,
      );
    }
    say(char, pick(state, EAST_TEXTS.standDone));
    state.sounds.push("ding");
    if (steered(state, char)) {
      unlock(state, "firTree");
    }
  } else {
    say(char, EAST_TEXTS.standEmpty);
  }
}

/**
 * Young firs grow back; the decorated tree goes after a while.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateFirs(state: GameState, dt: number): void {
  const east = state.world.east;
  const cols = state.maps.outdoors.cols;
  for (const [cell, left] of east.felled) {
    if (left - dt <= 0) {
      east.felled.delete(cell);
      spawn(
        state,
        "sparkle",
        "outdoors",
        ((cell % cols) + 1 / 2) * TILE,
        Math.floor(cell / cols) * TILE,
      );
    } else {
      east.felled.set(cell, left - dt);
    }
  }
  if (east.xmasTree > 0) {
    east.xmasTree = Math.max(0, east.xmasTree - dt);
    if (east.xmasTree <= 0) {
      poof(
        state,
        "workshop",
        (TREE_STAND.tx + 1 / 2) * TILE,
        TREE_STAND.ty * TILE,
      );
    }
  }
}
