/**
 * The view from the big telescope in Gugor's observatory: the whole map at
 * once, with everybody, the gates and the buildings marked.
 *
 * @module
 * @remarks
 * Opening it sets {@link GameState.overview}; while it is open the character
 * steered stands still, the world goes on, and the talk key, the ability key,
 * Escape or a firm push on the stick close it again. Gugor sees farther than
 * anybody: through his own telescope up here (or at the big one) he also
 * spots what is hidden - the lost present in the gift store, the fox's secret
 * and the fish in the pond.
 */
import { steered, unlock } from "./achievements";
import type { Character, GameState, Input } from "./types";

/** How long the view stays open before a push on the stick closes it, seconds. */
const SETTLE = 0.5;

/** How firmly one has to push to close it, 0 to 1. */
const PUSH = 0.6;

/**
 * Opens the view over the whole map.
 *
 * @param state - the game
 * @param char - who looks; Gugor sees the hidden things too
 */
export function openOverview(state: GameState, char: Character): void {
  if (state.overview === null) {
    const eagle = char.id === "gugor";
    state.overview = { elapsed: 0, eagle };
    state.sounds.push("spyglass");
    if (steered(state, char)) {
      unlock(state, "overview");
      if (eagle && state.world.store.present === "hidden") {
        unlock(state, "gugorEagle");
      }
    }
  }
}

/**
 * Runs the view on; a firm push on the stick closes it.
 *
 * @param state - the game
 * @param input - the held controls
 * @param dt - seconds
 */
export function updateOverview(
  state: GameState,
  input: Input,
  dt: number,
): void {
  const overview = state.overview;
  if (overview !== null) {
    overview.elapsed += dt;
    if (
      overview.elapsed > SETTLE &&
      Math.hypot(input.moveX, input.moveY) > PUSH
    ) {
      state.overview = null;
    }
  }
}

/**
 * Closes the view, if it is open.
 *
 * @param state - the game
 */
export function closeOverview(state: GameState): void {
  state.overview = null;
}
