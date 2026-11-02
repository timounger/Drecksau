/**
 * The ice cave behind the frozen waterfall: a thick curtain of ice closes its
 * mouth. Jordi as a bear breaks it open; as a fox he smells the cold air
 * from a crawl hole beside the cliff - the snow over it twitches - and digs
 * it free. Either way stays open for a while, then the ice grows back and
 * the snow drifts over the hole.
 *
 * @module
 */
import { EAST_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { say, snowPuff, spawn } from "./effects";
import { CURTAIN_DOOR, HOLE_DOOR } from "./east-data";
import { TILE, inBox } from "./map";
import { randomIn } from "./random";
import type { Character, Door, GameState, Spot } from "./types";

/** How long the broken curtain or the dug hole stays open, seconds. */
const OPEN_SECONDS = 120;

/** In its last seconds the curtain is growing back: thin ice. */
export const REGROW_SECONDS = 20;

/** How far the fox smells the hole, map px, and how often the snow twitches. */
const SNIFF_REACH = 60;
const SNIFF_EVERY = 1.1;

/** How far round the hole the fox can dig, map px. */
const DIG_SLACK = 8;

/** Bits of ice flying when the bear breaks through, and how fast. */
const SHARDS = 10;
const SHARD_SPRAY = 30;

/** How the ice curtain looks. */
export type CurtainLook = "closed" | "thin" | "open";

/**
 * Whether a door can be gone through right now: the cave's only while open.
 *
 * @param state - the game
 * @param door - the door
 * @returns true when it is not shut
 */
export function doorUsable(state: GameState, door: Door): boolean {
  const east = state.world.east;
  let open = true;
  if (sameDoor(door, CURTAIN_DOOR)) {
    open = east.curtain > 0;
  } else if (sameDoor(door, HOLE_DOOR)) {
    open = east.hole > 0;
  }
  return open;
}

/**
 * Whether a door is the fox's secret hole, which nobody else knows of.
 *
 * @param door - the door
 * @returns true for the crawl hole
 */
export function isHole(door: Door): boolean {
  return sameDoor(door, HOLE_DOOR);
}

/**
 * The talk key at the ice curtain: the bear breaks it, others only knock.
 *
 * @param state - the game
 * @param char - who stands at it
 */
export function useCurtain(state: GameState, char: Character): void {
  const east = state.world.east;
  if (east.curtain > 0) {
    say(char, EAST_TEXTS.curtainOpen);
  } else if (char.form === "baer") {
    east.curtain = OPEN_SECONDS;
    const x = (CURTAIN_DOOR.tx + CURTAIN_DOOR.w / 2) * TILE;
    const y = CURTAIN_DOOR.ty * TILE;
    for (let k = 0; k < SHARDS; k += 1) {
      spawn(
        state,
        "sparkle",
        "outdoors",
        x + randomIn(state, -TILE, TILE),
        y - randomIn(state, 0, TILE * 2),
        randomIn(state, -SHARD_SPRAY, SHARD_SPRAY),
        randomIn(state, -SHARD_SPRAY, 0),
        2,
      );
    }
    snowPuff(state, "outdoors", x, y);
    say(char, EAST_TEXTS.curtainBreak);
    state.sounds.push("iceBreak");
  } else if (char.form === "fuchs") {
    say(char, EAST_TEXTS.holeSniff);
  } else {
    say(char, EAST_TEXTS.curtainThick);
  }
}

/**
 * The hole as a spot for the talk key, if the fox stands at it.
 *
 * @param state - the game
 * @param char - the character steered
 * @param x - the point it reaches, map px
 * @param y - the point it reaches, map px
 * @returns the spot, or null
 */
export function holeSpot(
  state: GameState,
  char: Character,
  x: number,
  y: number,
): Spot | null {
  const box = HOLE_DOOR;
  const found =
    char.form === "fuchs" &&
    char.area === "outdoors" &&
    state.world.east.hole <= 0 &&
    (inBox(box, x, y, DIG_SLACK) || inBox(box, char.x, char.y, DIG_SLACK));
  return found ? { kind: "foxHole", tx: box.tx, ty: box.ty, w: 1, h: 1 } : null;
}

/**
 * The fox digs the crawl hole free.
 *
 * @param state - the game
 * @param char - the fox
 */
export function digHole(state: GameState, char: Character): void {
  const at = holePoint();
  state.world.east.hole = OPEN_SECONDS;
  snowPuff(state, "outdoors", at.x, at.y);
  snowPuff(state, "outdoors", at.x, at.y - TILE / 2);
  say(char, EAST_TEXTS.holeDug);
  state.sounds.push("collect");
}

/**
 * The ice grows back, the snow drifts over the hole, and near it the fox's
 * nose twitches.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateCave(state: GameState, dt: number): void {
  const east = state.world.east;
  east.curtain = Math.max(0, east.curtain - dt);
  east.hole = Math.max(0, east.hole - dt);
  east.sniffIn -= dt;
  const char = state.chars[state.active];
  const at = holePoint();
  if (
    char.form === "fuchs" &&
    char.area === "outdoors" &&
    east.hole <= 0 &&
    east.sniffIn <= 0 &&
    Math.hypot(char.x - at.x, char.y - at.y) < SNIFF_REACH
  ) {
    east.sniffIn = SNIFF_EVERY;
    snowPuff(state, "outdoors", at.x, at.y);
  }
}

/**
 * How the ice curtain looks right now.
 *
 * @param state - the game
 * @returns closed, thin (growing back) or open
 */
export function curtainLook(state: GameState): CurtainLook {
  const left = state.world.east.curtain;
  let look: CurtainLook = "open";
  if (left <= 0) {
    look = "closed";
  } else if (left < REGROW_SECONDS) {
    look = "thin";
  }
  return look;
}

/**
 * The bottom middle of the crawl hole, map px.
 *
 * @returns the point
 */
export function holePoint(): { x: number; y: number } {
  return {
    x: (HOLE_DOOR.tx + 1 / 2) * TILE,
    y: (HOLE_DOOR.ty + 1) * TILE,
  };
}

/** Whether two doors are the same doorway. */
function sameDoor(a: Door, b: Door): boolean {
  return a.tx === b.tx && a.ty === b.ty && a.to === b.to;
}
