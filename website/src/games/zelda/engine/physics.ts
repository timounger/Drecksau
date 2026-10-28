/**
 * Moving boxes over the tile map: collision, sliding round corners, and the
 * little bits of direction maths everybody needs.
 *
 * @module
 */
import { isCleared } from "./clearing";
import { NPC_HH, NPC_HW, STORY_ELDER, npcsHere } from "./npcs";
import {
  AREAS,
  TILE,
  TILE_CHARS,
  blocksShots,
  isHopOver,
  isSolidTile,
  tileAt,
} from "./tiles";
import type { Dir, GameState, Player } from "./types";

/** How far Link is nudged sideways round a corner he walks into, in pixels. */
const CORNER_SLIDE = 6;

/** Seconds a hop with the feather lasts. */
export const HOP_TIME = 0.45;

/** Highest point of a hop over Link's shadow, px. */
const HOP_HEIGHT = 12;

/** Seconds a hop down a low ledge lasts. */
export const LEAP_TIME = 0.35;

/** Highest point of a hop down a ledge over the line between its ends, px. */
const LEAP_HEIGHT = 9;

/** Above this height a hopping Link is out of reach of shots and monsters, px. */
const HOP_SAFE = 3;

/** Unit vectors of the four directions. */
export const DIR_VEC: Readonly<Record<Dir, { x: number; y: number }>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** A box that moves: the middle of its feet and its half sizes. */
export type Body = { x: number; y: number };

/** Letters a shrunk Link cannot use: doors far too heavy for him. */
const TOO_BIG = new Set<string>([TILE_CHARS.door, TILE_CHARS.templeGate]);

/**
 * Whether any solid tile overlaps a box.
 *
 * @param state - the game
 * @param x - box centre
 * @param y - box centre
 * @param hw - half width
 * @param hh - half height
 * @param forPlayer - the box is Link's (mouse holes, doors when small)
 * @returns true when the box would stand inside something
 */
export function boxBlocked(
  state: GameState,
  x: number,
  y: number,
  hw: number,
  hh: number,
  forPlayer = false,
): boolean {
  const map = AREAS[state.area];
  const area = state.area;
  const small = forPlayer && state.player.small;
  // In the middle of a hop Link sails over water, puddles and fences.
  const hopping = forPlayer && state.player.action.kind === "hop";
  // Full size and with free hands, Link swims - only the current is too strong.
  const swimmer = forPlayer && !state.player.small && !state.player.carrying;
  // Until the elder has spoken, the guard keeps the temple gate shut.
  const gateShut = !state.flags.has(STORY_ELDER);
  let blocked =
    x - hw < 0 || y - hh < 0 || x + hw > map.width || y + hh > map.height;
  const x0 = Math.floor((x - hw) / TILE);
  const x1 = Math.floor((x + hw - 1) / TILE);
  const y0 = Math.floor((y - hh) / TILE);
  const y1 = Math.floor((y + hh - 1) / TILE);
  for (let ty = y0; ty <= y1 && !blocked; ty++) {
    for (let tx = x0; tx <= x1 && !blocked; tx++) {
      const letter = tileAt(area, tx, ty);
      blocked =
        (isSolidTile(letter, isCleared(state, tx, ty, forPlayer)) &&
          !(hopping && isHopOver(letter)) &&
          !(swimmer && letter === TILE_CHARS.water)) ||
        (small && TOO_BIG.has(letter)) ||
        (gateShut && letter === TILE_CHARS.templeGate);
    }
  }
  for (const block of state.blocks) {
    blocked ||= overlaps(
      x,
      y,
      hw,
      hh,
      block.x + TILE / 2,
      block.y + TILE / 2,
      TILE / 2,
      TILE / 2,
    );
  }
  for (const npc of npcsHere(state)) {
    blocked ||= overlaps(x, y, hw, hh, npc.x, npc.y, NPC_HW, NPC_HH);
  }
  return blocked;
}

/**
 * How high a hopping Link is over the ground - with the feather or down a
 * ledge.
 *
 * @param player - the hero
 * @returns the height in px, 0 when he stands
 */
export function hopHeight(player: Player): number {
  const action = player.action;
  let height = 0;
  if (action.kind === "hop") {
    height =
      Math.sin((Math.min(action.t, HOP_TIME) / HOP_TIME) * Math.PI) *
      HOP_HEIGHT;
  } else if (action.kind === "leap") {
    height =
      Math.sin((Math.min(action.t, LEAP_TIME) / LEAP_TIME) * Math.PI) *
      LEAP_HEIGHT;
  }
  return height;
}

/**
 * Whether Link is out of reach of shots and monsters right now: rolling,
 * high in a hop, flying along the hookshot's chain, hopping down a ledge,
 * or under water.
 *
 * @param player - the hero
 * @returns true when nothing can touch him
 */
export function evading(player: Player): boolean {
  return (
    player.diveT > 0 ||
    player.action.kind === "leap" ||
    player.action.kind === "roll" ||
    player.action.kind === "hook" ||
    hopHeight(player) > HOP_SAFE
  );
}

/**
 * Whether a point stops a shot.
 *
 * @param state - the game
 * @param x - world position
 * @param y - world position
 * @returns true when an arrow or rock would hit something there
 */
export function shotBlocked(state: GameState, x: number, y: number): boolean {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  const map = AREAS[state.area];
  const outside = x < 0 || y < 0 || x >= map.width || y >= map.height;
  return (
    outside || blocksShots(tileAt(state.area, tx, ty), isCleared(state, tx, ty))
  );
}

/**
 * Moves a box, one axis at a time, stopping at walls.
 *
 * @param state - the game
 * @param body - what moves; changed in place
 * @param dx - wanted movement on x
 * @param dy - wanted movement on y
 * @param hw - half width of the box
 * @param hh - half height of the box
 * @param slide - nudge round corners, as Link does
 * @returns whether the move was stopped on either axis
 */
export function moveBody(
  state: GameState,
  body: Body,
  dx: number,
  dy: number,
  hw: number,
  hh: number,
  slide = false,
): boolean {
  let stopped = false;
  const forPlayer = body === state.player;
  if (dx !== 0) {
    if (!boxBlocked(state, body.x + dx, body.y, hw, hh, forPlayer)) {
      body.x += dx;
    } else {
      stopped = true;
      if (slide && dy === 0) {
        nudge(state, body, dx, 0, hw, hh);
      }
    }
  }
  if (dy !== 0) {
    if (!boxBlocked(state, body.x, body.y + dy, hw, hh, forPlayer)) {
      body.y += dy;
    } else {
      stopped = true;
      if (slide && dx === 0) {
        nudge(state, body, 0, dy, hw, hh);
      }
    }
  }
  return stopped;
}

/**
 * The direction that best matches a vector.
 *
 * @param x - vector x
 * @param y - vector y
 * @param fallback - what to answer for a zero vector
 * @returns one of the four directions
 */
export function dirOf(x: number, y: number, fallback: Dir): Dir {
  let dir = fallback;
  if (Math.abs(x) > Math.abs(y)) {
    dir = x > 0 ? "right" : "left";
  } else if (y !== 0) {
    dir = y > 0 ? "down" : "up";
  }
  return dir;
}

/**
 * Distance between two points.
 *
 * @param ax - first point
 * @param ay - first point
 * @param bx - second point
 * @param by - second point
 * @returns the straight-line distance
 */
export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/**
 * Whether two boxes overlap.
 *
 * @param ax - first centre
 * @param ay - first centre
 * @param ahw - first half width
 * @param ahh - first half height
 * @param bx - second centre
 * @param by - second centre
 * @param bhw - second half width
 * @param bhh - second half height
 * @returns true on overlap
 */
export function overlaps(
  ax: number,
  ay: number,
  ahw: number,
  ahh: number,
  bx: number,
  by: number,
  bhw: number,
  bhh: number,
): boolean {
  return Math.abs(ax - bx) < ahw + bhw && Math.abs(ay - by) < ahh + bhh;
}

/**
 * A random number in a range.
 *
 * @param low - smallest value
 * @param high - largest value
 * @returns a uniform pick between the two
 */
export function between(low: number, high: number): number {
  return low + Math.random() * (high - low);
}

/** Slides a blocked box sideways if a small step frees it. */
function nudge(
  state: GameState,
  body: Body,
  dx: number,
  dy: number,
  hw: number,
  hh: number,
): void {
  let done = false;
  const forPlayer = body === state.player;
  for (let k = 1; k <= CORNER_SLIDE && !done; k++) {
    for (const sign of [-1, 1]) {
      const ox = dy !== 0 ? sign * k : 0;
      const oy = dx !== 0 ? sign * k : 0;
      if (
        !done &&
        !boxBlocked(state, body.x + ox, body.y + oy, hw, hh, forPlayer) &&
        !boxBlocked(
          state,
          body.x + ox + dx,
          body.y + oy + dy,
          hw,
          hh,
          forPlayer,
        )
      ) {
        // Only one pixel per step towards the gap, so it reads as a slide.
        body.x += Math.sign(ox);
        body.y += Math.sign(oy);
        done = true;
      }
    }
  }
}
