/**
 * The twelve golden bells hidden all over the map: most lie where only a
 * flyer, the mouse, the bear or the penguin gets, one glows only at night,
 * one is stuck in a fir top until Gilfi's magic brings it down, one hides in
 * a snowman, one hangs from the carousel and one is the fox's buried secret.
 *
 * @module
 * @remarks
 * A bell found is kept for good ({@link GameState.progress}`.bells`); it is
 * picked up by walking (or flying, swimming) onto it. Nothing here shows on
 * the view from the observatory.
 */
import { carried, inBalloon } from "./aboard";
import { EAST_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { collect, steered } from "./achievements";
import { say, spawn, SPARKLE_TINTS } from "./effects";
import { BELLS, type BellSpot } from "./east-data";
import { TILE } from "./map";
import { randomIn } from "./random";
import { darkness } from "./sky";
import type { Character, GameState } from "./types";
import { snowmanStands } from "./world";

/** How close the feet have to come to a bell, map px. */
const REACH = 11;

/** How dark it has to be for the night bell to glow. */
const NIGHT_GLOW = 0.6;

/** How long the bell knocked from the fir top lies in the snow, seconds. */
const DOWN_SECONDS = 90;

/** How far round Gilfi her magic reaches the fir top, map px. */
const MAGIC_REACH = 90;

/** How high in the fir top the bell hangs, map px above the cell's top. */
const FIR_TOP = 6;

/** Where a bell lies in its cell, as a share of the cell from its top. */
const LIE = 0.75;

/** Sparkles when a bell is found, and how fast they fly, map px per second. */
const FOUND_SPARKLES = 10;
const FOUND_SPRAY = 20;

/** The snowman the bell hides in: the cell above the bell. */
const SNOWMAN_ABOVE = 1;

/**
 * Picks up a bell, once: a jingle, sparkles and the count.
 *
 * @param state - the game
 * @param id - which bell
 * @param char - who found it; only the character steered counts
 */
export function collectBell(
  state: GameState,
  id: string,
  char: Character,
): void {
  const bells = state.progress.bells;
  if (!bells.has(id) && steered(state, char)) {
    collect(state, "bells", id);
    say(
      char,
      `${EAST_TEXTS.bellFound} (${String(bells.size)}/${String(BELLS.length)})`,
    );
    state.sounds.push("bell");
    for (let k = 0; k < FOUND_SPARKLES; k += 1) {
      spawn(
        state,
        "sparkle",
        char.area,
        char.x,
        char.y - TILE,
        randomIn(state, -FOUND_SPRAY, FOUND_SPRAY),
        randomIn(state, -FOUND_SPRAY, 0),
        k % SPARKLE_TINTS,
      );
    }
  }
}

/**
 * Picks up the bells the character steered walks onto, and lets the one
 * from the fir top lie in the snow for a while.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateBells(state: GameState, dt: number): void {
  const east = state.world.east;
  east.bellDown = Math.max(0, east.bellDown - dt);
  const char = state.chars[state.active];
  for (const bell of BELLS) {
    const at = bellPoint(state, bell);
    if (
      bell.area === char.area &&
      !inBalloon(state, char) &&
      !carried(state, char) &&
      bellShows(state, bell) &&
      reachable(bell, state) &&
      Math.hypot(char.x - at.x, char.y - at.y) < REACH
    ) {
      collectBell(state, bell.id, char);
    }
  }
}

/**
 * Whether a bell is to be seen right now.
 *
 * @param state - the game
 * @param bell - which
 * @returns true when not found yet and not hidden
 */
export function bellShows(state: GameState, bell: BellSpot): boolean {
  let shows = !state.progress.bells.has(bell.id);
  switch (bell.need) {
    case "night":
      shows &&= darkness(state) >= NIGHT_GLOW;
      break;
    case "snowman":
      shows &&= !snowmanStands(
        state,
        (bell.ty - SNOWMAN_ABOVE) * state.maps.outdoors.cols + bell.tx,
      );
      break;
    case "fox":
    case "carousel":
      shows = false;
      break;
    default:
      break;
  }
  return shows;
}

/**
 * Where a bell is drawn, map px: in its cell, or high in the fir top.
 *
 * @param state - the game
 * @param bell - which
 * @returns the point of the bell's bottom
 */
export function bellPoint(
  state: GameState,
  bell: BellSpot,
): { x: number; y: number } {
  const x = (bell.tx + 1 / 2) * TILE;
  let y = (bell.ty + LIE) * TILE;
  if (bell.need === "fir") {
    y =
      state.world.east.bellDown > 0
        ? (bell.ty + 1 + LIE) * TILE
        : bell.ty * TILE - FIR_TOP;
  }
  return { x, y };
}

/**
 * Gilfi's magic near the fir top shakes its bell loose.
 *
 * @param state - the game
 * @param char - Gilfi
 */
export function shakeFirTop(state: GameState, char: Character): void {
  const bell = BELLS.find((candidate) => candidate.need === "fir");
  if (
    bell !== undefined &&
    char.area === bell.area &&
    !state.progress.bells.has(bell.id) &&
    state.world.east.bellDown <= 0
  ) {
    const top = bellPoint(state, bell);
    if (Math.hypot(char.x - top.x, char.y - top.y) < MAGIC_REACH) {
      state.world.east.bellDown = DOWN_SECONDS;
      for (let k = 0; k < FOUND_SPARKLES; k += 1) {
        spawn(
          state,
          "sparkle",
          bell.area,
          top.x,
          top.y,
          randomIn(state, -FOUND_SPRAY, FOUND_SPRAY),
          randomIn(state, 0, FOUND_SPRAY),
          k % SPARKLE_TINTS,
        );
      }
    }
  }
}

/** Whether a bell lies on the ground where feet can reach it. */
function reachable(bell: BellSpot, state: GameState): boolean {
  return bell.need !== "fir" || state.world.east.bellDown > 0;
}
