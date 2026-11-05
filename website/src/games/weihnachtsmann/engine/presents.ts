/**
 * Presents: a toy from the workshop's machine goes into the hands; at the
 * packing table it is wrapped in paper with a bow; under the decorated gift
 * tree south of the pond the pile of presents grows (and stays). On
 * Christmas Eve, in the evening, the talk key at the tree begins the giving
 * of presents: everybody gathers round the tree, Santa hands out a present
 * to each, bells ring and the snow glitters.
 *
 * @module
 * @remarks
 * The pile is the count `counts.wrapped`, saved. Christmas Eve is the 24th
 * of December by the screen's date (`?datum=12-24` to try) after dark, once
 * per visit; the gathering comes through `gather.ts`.
 */
import { EXTRA_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { addCount, steered, unlock } from "./achievements";
import { noteTask } from "./daily";
import { poof, say, spawn, SPARKLE_TINTS } from "./effects";
import { EVE_SANTA, EVE_SPOTS, TREE_FOOT } from "./extras-data";
import { callTogether, endGather } from "./gather";
import { TILE, areaMap, fits } from "./map";
import { CAST } from "./cast";
import { moveCharacter } from "./movement";
import { pick, randomIn } from "./random";
import { darkness } from "./sky";
import {
  TOY_KINDS,
  type Character,
  type GameState,
  type ToyKind,
} from "./types";

/** How long wrapping takes, seconds. */
export const WRAP_SECONDS = 1.4;

/** The wrapping papers. */
export const PAPERS = 4;

/** How long a present flies from the pile to its owner, seconds. */
export const GIFT_FLIGHT = 0.9;

/** Seconds of gathering before the first present, and between two. */
const EVE_GATHER = 3;
const EVE_EVERY = 1.3;

/** Seconds after the last present until it is over. */
const EVE_AFTER = 4;

/** How dark it has to be for Christmas Eve's giving. */
const EVE_DARK = 0.3;

/** The day of Christmas Eve. */
const DECEMBER = 12;
const EVE_DAY = 24;

/** Seconds between two paper snippets while wrapping. */
const SNIP_EVERY = 0.12;

/** How far round the table snippets fly up, and how fast, map px (per second). */
const SNIP_SPREAD = 6;
const SNIP_SPEED = 12;

/** Hearts over somebody getting a present: how many, how far apart, how high, how fast. */
const THANK_HEARTS = 3;
const HEART_GAP = 5;
const HEART_LIFT = 30;
const HEART_RISE = -14;

/** How fast the glitter sinks, map px per second. */
const GLITTER_SINK = 8;

/** Glitter over the snow on Christmas Eve: per step, and how far round. */
const GLITTER_CHANCE = 0.5;
const GLITTER_SPREAD = 150;

/** How far above the feet the poof over a new present sits, map px. */
const POOF_LIFT = 18;

/** How long a receiver hops, seconds. */
const HOP = 0.35;

/**
 * A toy just made goes into the hands, if they are free or hold a toy.
 *
 * @param char - who used the machine
 * @param kind - the toy
 */
export function handToy(char: Character, kind: ToyKind): void {
  if (
    (char.carry === null || char.carry.kind === "toy") &&
    char.form === null
  ) {
    char.carry = { kind: "toy", tint: TOY_KINDS.indexOf(kind) };
  }
}

/**
 * The talk key at the packing table: the toy carried is wrapped.
 *
 * @param state - the game
 * @param char - who wraps
 */
export function useTable(state: GameState, char: Character): void {
  const extras = state.world.extras;
  if (char.carry?.kind === "toy" && extras.wrapping === null) {
    extras.wrapping = {
      who: state.chars.indexOf(char),
      left: WRAP_SECONDS,
      toy: char.carry.tint,
    };
    state.sounds.push("wrap");
    say(char, EXTRA_TEXTS.wrapStart);
  } else if (char.carry?.kind === "wrapped") {
    say(char, EXTRA_TEXTS.wrapAlready);
  } else {
    say(char, EXTRA_TEXTS.wrapNeedToy);
  }
}

/**
 * Holds somebody still while wrapping, with paper snippets flying.
 *
 * @param state - the game
 * @param char - the character
 * @param index - its index
 * @param dt - seconds
 * @returns true while wrapping
 */
export function holdWrapper(
  state: GameState,
  char: Character,
  index: number,
  dt: number,
): boolean {
  const wrapping = state.world.extras.wrapping;
  const held = wrapping !== null && wrapping.who === index;
  if (held) {
    moveCharacter(areaMap(state, char), char, 0, 0, dt);
    const before = Math.floor((wrapping.left + dt) / SNIP_EVERY);
    if (Math.floor(wrapping.left / SNIP_EVERY) !== before) {
      spawn(
        state,
        "sparkle",
        char.area,
        char.x + randomIn(state, -SNIP_SPREAD, SNIP_SPREAD),
        char.y - TILE,
        randomIn(state, -SNIP_SPEED, SNIP_SPEED),
        -randomIn(state, SNIP_SPEED / 2, SNIP_SPEED * 2),
        Math.floor(randomIn(state, 0, SPARKLE_TINTS)),
      );
    }
  }
  return held;
}

/**
 * The talk key at the gift tree: a present laid under it; on Christmas Eve
 * the giving of presents begins.
 *
 * @param state - the game
 * @param char - who comes
 */
export function useGiftTree(state: GameState, char: Character): void {
  const extras = state.world.extras;
  if (char.carry?.kind === "wrapped") {
    char.carry = null;
    poof(state, "outdoors", TREE_FOOT.x * TILE, TREE_FOOT.y * TILE - POOF_LIFT);
    state.sounds.push("bell");
    say(char, pick(state, EXTRA_TEXTS.treeLaid));
    if (steered(state, char)) {
      addCount(state, "wrapped", "giftPile");
    }
  } else if (extras.eve !== null) {
    say(char, EXTRA_TEXTS.eveRunning);
  } else if (christmasEve(state) && !extras.eveDone) {
    startEve(state, char);
  } else if (christmasEve(state)) {
    say(char, EXTRA_TEXTS.eveOver);
  } else {
    say(char, EXTRA_TEXTS.treeHint);
  }
}

/**
 * Whether it is Christmas Eve after dark.
 *
 * @param state - the game
 * @returns true on the evening of the 24th of December
 */
export function christmasEve(state: GameState): boolean {
  return (
    state.today.month === DECEMBER &&
    state.today.day === EVE_DAY &&
    darkness(state) >= EVE_DARK
  );
}

/**
 * Runs the wrapping and Christmas Eve on.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updatePresents(state: GameState, dt: number): void {
  const extras = state.world.extras;
  const wrapping = extras.wrapping;
  if (wrapping !== null) {
    wrapping.left -= dt;
    if (wrapping.left <= 0) {
      const char = state.chars[wrapping.who];
      extras.wrapping = null;
      char.carry = { kind: "wrapped", tint: wrapping.toy % PAPERS };
      state.sounds.push("ding");
      say(
        char,
        EXTRA_TEXTS.wrapDone.replace(
          "{toy}",
          EXTRA_TEXTS.toyWords[wrapping.toy % TOY_KINDS.length],
        ),
      );
      noteTask(state, char, "wrap");
    }
  }
  updateEve(state, dt);
}

/** Christmas Eve begins: everybody to the tree, Santa beside the pile. */
function startEve(state: GameState, char: Character): void {
  const extras = state.world.extras;
  const santaIndex = state.chars.findIndex((other) => other.id === "santa");
  const santa = state.chars[santaIndex];
  extras.concert = null;
  endGather(state);
  callTogether(state, "eve", EVE_SPOTS, TREE_FOOT, new Set([santaIndex]));
  if (santaIndex !== state.active) {
    // Santa comes to hand out the presents, wherever he was.
    santa.area = "outdoors";
    santa.flying = false;
    santa.carry = null;
    const x = EVE_SANTA.x * TILE;
    const y = EVE_SANTA.y * TILE;
    if (fits(state.maps.outdoors, CAST.santa.walk, x, y)) {
      santa.x = x;
      santa.y = y;
    }
    santa.dir = "left";
    poof(state, "outdoors", santa.x, santa.y - POOF_LIFT);
  }
  const queue = state.chars
    .map((_, index) => index)
    .filter((index) => index !== santaIndex);
  extras.eve = { elapsed: 0, queue, gifts: [], nextIn: EVE_GATHER };
  extras.eveDone = true;
  state.sounds.push("sleighStart");
  say(santa, EXTRA_TEXTS.eveStart);
  if (char !== santa) {
    say(char, EXTRA_TEXTS.eveCall);
  }
}

/** Presents fly from the pile, one each; glitter; the end. */
function updateEve(state: GameState, dt: number): void {
  const extras = state.world.extras;
  const eve = extras.eve;
  if (eve !== null) {
    eve.elapsed += dt;
    eve.nextIn -= dt;
    const next = eve.queue.at(0);
    if (eve.nextIn <= 0 && next !== undefined) {
      eve.queue.shift();
      eve.nextIn = EVE_EVERY;
      eve.gifts.push({ to: next, age: 0, paper: next % PAPERS });
      state.sounds.push("whoosh");
    }
    for (const gift of eve.gifts) {
      gift.age += dt;
      if (gift.age >= GIFT_FLIGHT && gift.age - dt < GIFT_FLIGHT) {
        received(state, state.chars[gift.to]);
      }
    }
    const flying = eve.gifts.filter((gift) => gift.age < GIFT_FLIGHT);
    eve.gifts.length = 0;
    eve.gifts.push(...flying);
    glitter(state);
    if (eve.queue.length === 0 && eve.gifts.length === 0) {
      if (eve.nextIn < -EVE_AFTER) {
        finishEve(state);
      }
    }
  }
}

/** Somebody gets a present: a hop, hearts, thanks. */
function received(state: GameState, char: Character): void {
  char.hop = HOP;
  state.sounds.push("bell");
  for (let k = 0; k < THANK_HEARTS; k += 1) {
    spawn(
      state,
      "heart",
      char.area,
      char.x + (k - 1) * HEART_GAP,
      char.y - HEART_LIFT,
      0,
      HEART_RISE,
    );
  }
  say(char, pick(state, EXTRA_TEXTS.eveThanks));
}

/** Christmas Eve is over: merry Christmas, everybody strolls on. */
function finishEve(state: GameState): void {
  const extras = state.world.extras;
  extras.eve = null;
  endGather(state);
  state.sounds.push("achievement");
  const char = state.chars[state.active];
  say(char, EXTRA_TEXTS.eveEnd);
  unlock(state, "christmasEve");
}

/** Snow glittering round the tree. */
function glitter(state: GameState): void {
  if (randomIn(state, 0, 1) < GLITTER_CHANCE) {
    spawn(
      state,
      "sparkle",
      "outdoors",
      TREE_FOOT.x * TILE + randomIn(state, -GLITTER_SPREAD, GLITTER_SPREAD),
      TREE_FOOT.y * TILE +
        randomIn(state, -GLITTER_SPREAD / 2, GLITTER_SPREAD / 2),
      0,
      randomIn(state, GLITTER_SINK / 2, GLITTER_SINK),
      Math.floor(randomIn(state, 0, SPARKLE_TINTS)),
    );
  }
}
