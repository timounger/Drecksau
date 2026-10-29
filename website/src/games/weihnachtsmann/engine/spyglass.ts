/**
 * Gugor's telescope: the view shrinks to a round lens, goes looking for the
 * Weihnachtsmann - into another place if need be - watches him a while and
 * comes back.
 *
 * @module
 * @remarks
 * Only the view travels: nobody moves, nothing is saved differently. While it
 * lasts the steered Gugor stands still and commands wait (`engine.ts`). Is
 * the Weihnachtsmann in the same place, the camera glides over to him; is he
 * elsewhere, the lens closes, the view crosses to his place and the lens
 * opens again there - and the same way back.
 */
import { BUBBLE_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { unlock } from "./achievements";
import { snapCamera } from "./camera";
import { SHOWS } from "./cast";
import { pick } from "./random";
import { isRiding } from "./sleigh";
import type { AreaId, Character, GameState } from "./types";

/** How long the whole look takes, seconds - as long as Gugor's show. */
const SPY_SECONDS = SHOWS.telescope.seconds;

/** Raising the telescope: the view shrinks to the lens, seconds. */
export const LOOK_UP = 0.5;

/** Closing or opening the lens fully, to cross into another place, seconds. */
const IRIS = 0.3;

/** Lowering the telescope: the lens widens to the whole view, seconds. */
const LOOK_BACK = 0.5;

/** How long before lowering the camera starts to glide back, seconds. */
const GLIDE_BACK = 0.8;

/** Glide time kept up while the view travels, seconds - a slow, smooth camera. */
const GLIDE_HOLD = 0.5;

/** Lens value of the plain view: no lens at all. */
export const NO_LENS = 2;

/**
 * Gugor raises his telescope.
 *
 * @param state - the game
 * @param watcher - index of Gugor
 */
export function startSpy(state: GameState, watcher: number): void {
  const santa = santaOf(state);
  state.spy = {
    elapsed: 0,
    watcher,
    far: santa !== null && placeOf(state, santa) !== state.chars[watcher].area,
    watching: false,
  };
}

/**
 * Runs the look on: when to watch, crossing places, and the end.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateSpy(state: GameState, dt: number): void {
  const spy = state.spy;
  if (spy !== null) {
    spy.elapsed += dt;
    const t = spy.elapsed;
    const home = state.chars[spy.watcher].area;
    const santa = santaOf(state);
    const was = spy.watching;
    spy.watching = spy.far
      ? t >= LOOK_UP + IRIS && t < SPY_SECONDS - LOOK_BACK - IRIS
      : t >= LOOK_UP / 2 && t < SPY_SECONDS - LOOK_BACK - GLIDE_BACK;
    state.glide = Math.max(state.glide, GLIDE_HOLD);
    if (spy.far && was !== spy.watching) {
      state.viewArea =
        spy.watching && santa !== null ? placeOf(state, santa) : home;
      snapCamera(state);
    }
    if (spy.watching && santa !== null) {
      spotted(state, santa);
    }
    if (t >= SPY_SECONDS) {
      state.spy = null;
      if (state.viewArea !== home) {
        state.viewArea = home;
        snapCamera(state);
      }
    }
  }
}

/**
 * How far the lens is open right now.
 *
 * @param state - the game
 * @returns 0 (shut) to 1 (the round lens) to {@link NO_LENS} (the whole view)
 */
export function spyLens(state: GameState): number {
  const spy = state.spy;
  let open = NO_LENS;
  if (spy !== null) {
    const t = spy.elapsed;
    const back = SPY_SECONDS - LOOK_BACK;
    if (t < LOOK_UP) {
      open = NO_LENS - t / LOOK_UP;
    } else if (t >= back) {
      open = 1 + Math.min(1, (t - back) / LOOK_BACK);
    } else if (spy.far) {
      open = Math.min(
        1,
        Math.abs(t - LOOK_UP - IRIS) / IRIS,
        Math.abs(back - IRIS - t) / IRIS,
      );
    } else {
      open = 1;
    }
  }
  return open;
}

/**
 * Where the camera looks while Gugor watches: the Weihnachtsmann, or the
 * sleigh he flies.
 *
 * @param state - the game
 * @returns the point to centre on, map px, or null when not watching
 */
export function spyFocus(state: GameState): { x: number; y: number } | null {
  const santa = santaOf(state);
  const ride = state.sleigh;
  let focus: { x: number; y: number } | null = null;
  if (state.spy?.watching === true && santa !== null) {
    focus =
      ride !== null && isRiding(state, santa)
        ? { x: ride.x, y: ride.y - ride.altitude }
        : { x: santa.x, y: santa.y - santa.altitude };
  }
  return focus;
}

/**
 * What Gugor says about what he saw.
 *
 * @param state - the game
 * @returns his remark
 */
export function spyRemark(state: GameState): string {
  const santa = santaOf(state);
  let lines: readonly string[] = BUBBLE_TEXTS.spyIdle;
  if (santa === null) {
    lines = BUBBLE_TEXTS.spyIdle;
  } else if (isRiding(state, santa)) {
    lines = BUBBLE_TEXTS.spySleigh;
  } else if (santa.show?.kind === "wishes") {
    lines = BUBBLE_TEXTS.spyWishes;
  } else if (santa.area === "workshop") {
    lines = BUBBLE_TEXTS.spyWorkshop;
  } else if (santa.area === "grantelHouse") {
    lines = BUBBLE_TEXTS.spyGrantel;
  } else if (santa.moving) {
    lines = BUBBLE_TEXTS.spyWalking;
  }
  return pick(state, lines);
}

/**
 * What Gugor catches the Weihnachtsmann at: in the workshop, or flying the
 * sleigh. The telescope is only ever raised by the player.
 */
function spotted(state: GameState, santa: Character): void {
  if (isRiding(state, santa)) {
    unlock(state, "spySleigh");
  } else if (santa.area === "workshop") {
    unlock(state, "spyWorkshop");
  }
}

/** The Weihnachtsmann, if he is in the game. */
function santaOf(state: GameState): Character | null {
  return state.chars.find((char) => char.id === "santa") ?? null;
}

/** The place somebody is in; the sleigh only ever flies outside. */
function placeOf(state: GameState, char: Character): AreaId {
  return isRiding(state, char) ? "outdoors" : char.area;
}
