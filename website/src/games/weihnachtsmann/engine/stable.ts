/**
 * The reindeer stable: carrots from the crate for the four reindeer in their
 * boxes, who get hungry again after a while, and Rudolf's nap in the straw.
 *
 * @module
 * @remarks
 * Which reindeer is full lives in {@link StableState}; it is not saved, and a
 * fed reindeer is hungry again after {@link FULL_SECONDS}. Rudolf's nap is a
 * show ("nap", `shows.ts`): he lies in the straw, snores and gets up again.
 */
import { TOWN_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import { STABLE_BOXES, STABLE_GATE_ROW, STRAW_BED } from "./building-data";
import { carries, pickUp } from "./carry";
import { say, spawn, SPARKLE_TINTS } from "./effects";
import { TILE } from "./map";
import { pick, randomIn } from "./random";
import { startShow } from "./shows";
import type { Character, GameState, Spot, StableState } from "./types";

/** How long a fed reindeer stays full, seconds. */
export const FULL_SECONDS = 90;

/** How long a reindeer munches its carrot, seconds. */
export const MUNCH_SECONDS = 2.4;

/** Sparkles round a reindeer that was fed, and how fast they fly. */
const FED_SPARKLES = 8;
const FED_SPRAY = 16;

/** How far above the gate a fed reindeer's sparkles start, map px. */
const HEAD_LIFT = 26;

/**
 * The stable as it is on a new game: every reindeer hungry.
 *
 * @returns the stable
 */
export function createStable(): StableState {
  return {
    full: STABLE_BOXES.map(() => 0),
    munch: STABLE_BOXES.map(() => 0),
  };
}

/**
 * Counts the reindeer's fullness down: a while after their carrot they are
 * hungry again.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateStable(state: GameState, dt: number): void {
  const stable = state.world.stable;
  stable.full.forEach((left, index) => {
    stable.full[index] = Math.max(0, left - dt);
  });
  stable.munch.forEach((left, index) => {
    stable.munch[index] = Math.max(0, left - dt);
  });
}

/**
 * The talk key at the carrot crate: a carrot into the hands.
 *
 * @param state - the game
 * @param char - who takes it
 */
export function takeCarrot(state: GameState, char: Character): void {
  if (carries(char, "carrot")) {
    say(char, TOWN_TEXTS.carrotHave);
  } else if (pickUp(char, "carrot")) {
    say(char, pick(state, TOWN_TEXTS.carrotTaken));
    state.sounds.push("collect");
  }
}

/**
 * The talk key at a reindeer's box: a carrot for it, if it is hungry and one
 * is at hand. All four full at once unlocks "stableFed".
 *
 * @param state - the game
 * @param char - who stands at the box
 * @param spot - the box's gate
 */
export function feedReindeer(
  state: GameState,
  char: Character,
  spot: Spot,
): void {
  const stable = state.world.stable;
  const index = Math.max(0, STABLE_BOXES.indexOf(spot.tx));
  const name = TOWN_TEXTS.reindeerNames[index];
  if (stable.full[index] > 0) {
    say(char, `${name} ${TOWN_TEXTS.reindeerFull}`);
  } else if (!carries(char, "carrot")) {
    say(char, `${name} ${TOWN_TEXTS.reindeerHungry}`);
  } else {
    char.carry = null;
    stable.full[index] = FULL_SECONDS;
    stable.munch[index] = MUNCH_SECONDS;
    say(char, `${name} ${pick(state, TOWN_TEXTS.reindeerFed)}`);
    state.sounds.push("munch");
    const x = (spot.tx + spot.w / 2) * TILE;
    const y = STABLE_GATE_ROW * TILE - HEAD_LIFT;
    for (let k = 0; k < FED_SPARKLES; k += 1) {
      spawn(
        state,
        "sparkle",
        char.area,
        x,
        y,
        randomIn(state, -FED_SPRAY, FED_SPRAY),
        randomIn(state, -FED_SPRAY, 0),
        k % SPARKLE_TINTS,
      );
    }
    if (steered(state, char) && stable.full.every((left) => left > 0)) {
      unlock(state, "stableFed");
    }
  }
}

/**
 * How many reindeer are full right now.
 *
 * @param state - the game
 * @returns 0 to 4
 */
export function fedCount(state: GameState): number {
  return state.world.stable.full.filter((left) => left > 0).length;
}

/**
 * The talk key at the straw: Rudolf lies down for a nap; the others only
 * remark on it.
 *
 * @param state - the game
 * @param char - who stands at it
 */
export function useStraw(state: GameState, char: Character): void {
  if (char.id === "rudolf" && char.form === null && char.show === null) {
    char.x = STRAW_BED.x * TILE;
    char.y = STRAW_BED.y * TILE;
    char.dir = "right";
    char.vx = 0;
    char.vy = 0;
    char.cooldown = 0;
    startShow(state, char, "nap");
    if (steered(state, char)) {
      unlock(state, "rudolfNap");
    }
  } else if (char.id !== "rudolf") {
    say(char, TOWN_TEXTS.strawOthers);
  }
}
