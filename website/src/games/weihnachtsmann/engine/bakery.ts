/**
 * The elves' bakery: dough from the bowl, cut out onto a tray, baked in the
 * oven, set out on the cooling rack - and Balbo tripping over his own paws,
 * which sends cookies flying through a cloud of flour.
 *
 * @module
 * @remarks
 * The oven bakes for {@link BAKE_SECONDS}; left in too long the cookies burn.
 * Trays on the rack are nibbled away by the elves after a while. None of it
 * is saved; taking the first good tray out unlocks "firstTray".
 */
import { TOWN_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import { carries, pickUp } from "./carry";
import { say, spawn, SPARKLE_TINTS } from "./effects";
import { TILE } from "./map";
import { pick, randomIn } from "./random";
import type { BakeryState, Character, GameState } from "./types";

/** How long a tray bakes, seconds. */
export const BAKE_SECONDS = 8;

/** How long done cookies wait in the oven before they burn, seconds. */
const BURN_AFTER = 20;

/** Most trays on the cooling rack. */
export const RACK_MAX = 3;

/** Seconds until the elves have nibbled a tray off the rack. */
const NIBBLE_SECONDS = 50;

/** Seconds between two wafts of smell from finished cookies. */
const WAFT_EVERY = 0.3;

/** The oven's mouth, map px in the bakery: middle, and its top. */
const OVEN_AT = { x: 160, y: 36 } as const;

/** Cookies and flour flung by a fall, and how hard. */
const COOKIES_FLUNG = 10;
const FLOUR_PUFFS = 14;
const FLING = 70;
const FLOUR_SPREAD = 14;

/** Sideways drift of the oven's steam, and how far up flung cookies go at most (times the fling), map px per second. */
const WAFT_DRIFT = 2;
const FLING_UP = 1.4;

/** Sparkles when the cookies are done. */
const DONE_SPARKLES = 8;
const DONE_SPRAY = 16;

/**
 * The bakery as it is on a new game: oven cold, rack empty.
 *
 * @returns the bakery
 */
export function createBakery(): BakeryState {
  return { oven: "empty", ovenTime: 0, rack: 0, nibbleIn: 0, waftIn: 0 };
}

/**
 * Bakes on: the cookies get done, then burn; the done ones smell; the rack
 * is nibbled empty bit by bit.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateBakery(state: GameState, dt: number): void {
  const bakery = state.world.bakery;
  if (bakery.oven === "baking" || bakery.oven === "done") {
    bakery.ovenTime += dt;
  }
  if (bakery.oven === "baking" && bakery.ovenTime >= BAKE_SECONDS) {
    bakery.oven = "done";
    if (state.viewArea === "bakery") {
      state.sounds.push("ding");
    }
    for (let k = 0; k < DONE_SPARKLES; k += 1) {
      spawn(
        state,
        "sparkle",
        "bakery",
        OVEN_AT.x,
        OVEN_AT.y,
        randomIn(state, -DONE_SPRAY, DONE_SPRAY),
        randomIn(state, -DONE_SPRAY, 0),
        k % SPARKLE_TINTS,
      );
    }
  } else if (
    bakery.oven === "done" &&
    bakery.ovenTime >= BAKE_SECONDS + BURN_AFTER
  ) {
    bakery.oven = "burnt";
  }
  bakery.waftIn -= dt;
  if (bakery.waftIn <= 0) {
    bakery.waftIn = WAFT_EVERY;
    if (bakery.oven !== "empty") {
      spawn(
        state,
        bakery.oven === "burnt" ? "soot" : "steam",
        "bakery",
        OVEN_AT.x + randomIn(state, -TILE, TILE),
        OVEN_AT.y,
        randomIn(state, -WAFT_DRIFT, WAFT_DRIFT),
      );
    }
  }
  if (bakery.rack > 0) {
    bakery.nibbleIn -= dt;
    if (bakery.nibbleIn <= 0) {
      bakery.rack -= 1;
      bakery.nibbleIn = NIBBLE_SECONDS;
    }
  }
}

/**
 * The talk key at the dough bowl: a lump of dough into the hands.
 *
 * @param state - the game
 * @param char - who takes it
 */
export function takeDough(state: GameState, char: Character): void {
  if (pickUp(char, "dough")) {
    say(char, TOWN_TEXTS.doughTaken);
    state.sounds.push("collect");
  }
}

/**
 * The talk key at the tray table: the dough is cut out onto a tray.
 *
 * @param state - the game
 * @param char - who cuts
 */
export function cutCookies(state: GameState, char: Character): void {
  if (carries(char, "dough")) {
    char.carry = { kind: "trayRaw", tint: 0 };
    say(char, pick(state, TOWN_TEXTS.traysCut));
    state.sounds.push("paper");
  } else {
    say(char, TOWN_TEXTS.doughNeed);
  }
}

/**
 * The talk key at the oven: a tray goes in, or the baked one comes out.
 *
 * @param state - the game
 * @param char - who stands at it
 */
export function useOven(state: GameState, char: Character): void {
  const bakery = state.world.bakery;
  switch (bakery.oven) {
    case "empty":
      if (carries(char, "trayRaw")) {
        char.carry = null;
        bakery.oven = "baking";
        bakery.ovenTime = 0;
        say(char, TOWN_TEXTS.ovenIn);
        state.sounds.push("door");
      } else {
        say(char, TOWN_TEXTS.ovenEmpty);
      }
      break;
    case "baking":
      say(
        char,
        `${TOWN_TEXTS.ovenBusy} ${String(Math.ceil(BAKE_SECONDS - bakery.ovenTime))} s`,
      );
      break;
    case "done":
    case "burnt":
      if (pickUp(char, bakery.oven === "done" ? "trayBaked" : "trayBurnt")) {
        const good = bakery.oven === "done";
        bakery.oven = "empty";
        say(
          char,
          good ? pick(state, TOWN_TEXTS.ovenDone) : TOWN_TEXTS.ovenBurnt,
        );
        if (good && steered(state, char)) {
          unlock(state, "firstTray");
        }
      }
      break;
  }
}

/**
 * The talk key at the cooling rack: a baked tray goes on it, a burnt one is
 * thrown away, and with free hands one nibbles a cookie.
 *
 * @param state - the game
 * @param char - who stands at it
 */
export function useRack(state: GameState, char: Character): void {
  const bakery = state.world.bakery;
  if (carries(char, "trayBaked") && bakery.rack < RACK_MAX) {
    char.carry = null;
    bakery.rack += 1;
    bakery.nibbleIn = NIBBLE_SECONDS;
    say(char, TOWN_TEXTS.rackPut);
  } else if (carries(char, "trayBaked")) {
    say(char, TOWN_TEXTS.rackFull);
  } else if (carries(char, "trayBurnt")) {
    char.carry = null;
    say(char, TOWN_TEXTS.rackBurnt);
  } else if (char.carry === null && bakery.rack > 0) {
    say(char, pick(state, TOWN_TEXTS.rackNibble));
    state.sounds.push("munch");
  } else {
    say(char, TOWN_TEXTS.rackEmpty);
  }
}

/**
 * Balbo falls in the bakery: flour flies up, cookies off the rack (or out of
 * thin air) fly through the room. Unlocks "balboFlour".
 *
 * @param state - the game
 * @param char - Balbo, just hitting the floor
 */
export function bakeryTumble(state: GameState, char: Character): void {
  if (char.area === "bakery") {
    for (let k = 0; k < FLOUR_PUFFS; k += 1) {
      spawn(
        state,
        "flour",
        "bakery",
        char.x + randomIn(state, -FLOUR_SPREAD, FLOUR_SPREAD),
        char.y - randomIn(state, 0, FLOUR_SPREAD),
        randomIn(state, -FLOUR_SPREAD, FLOUR_SPREAD),
        -randomIn(state, FLOUR_SPREAD / 2, FLOUR_SPREAD),
      );
    }
    for (let k = 0; k < COOKIES_FLUNG; k += 1) {
      spawn(
        state,
        "cookie",
        "bakery",
        char.x,
        char.y - TILE,
        randomIn(state, -FLING, FLING),
        -randomIn(state, FLING / 2, FLING * FLING_UP),
        k % SPARKLE_TINTS,
      );
    }
    state.world.bakery.rack = Math.max(0, state.world.bakery.rack - 1);
    say(char, TOWN_TEXTS.balboFlour);
    if (steered(state, char)) {
      unlock(state, "balboFlour");
    }
  }
}
