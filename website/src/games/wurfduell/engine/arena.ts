/**
 * The field the duel is fought on: its size, where the two fighters stand and
 * how big they are.
 *
 * @module
 * @remarks
 * World units, with the ground at height 0 and up being positive; a hundred
 * units make a metre on the distance signs. The field is much wider than the
 * picture: the two fighters stand so far apart that, while aiming, the
 * opponent is out of sight, and the camera follows the throw across. Nothing
 * here knows about a screen - that is the renderer's business.
 */
import type { CharacterDef } from "./types";

/** Width of the field in world units. */
export const WORLD_WIDTH = 2400;

/** How far each fighter stands in from the edge. */
const FIGHTER_INSET = 200;

/** Where the two fighters stand, left seat first. */
export const FIGHTER_X: readonly number[] = [
  FIGHTER_INSET,
  WORLD_WIDTH - FIGHTER_INSET,
];

/** World units per metre, for the distances shown. */
export const UNITS_PER_METRE = 100;

/** A fighter's body, before their size is applied. */
export const BODY_WIDTH = 50;
export const BODY_HEIGHT = 74;

/** A fighter's head radius, before their size is applied. */
export const HEAD_RADIUS = 19;

/** Where the throw leaves the hand: ahead of the fighter and how high. */
export const HAND_AHEAD = 24;
export const HAND_HEIGHT = 104;

/** How many looks the scenery has (garden, town, farm, winter). */
export const SCENERY_STYLES = 4;

/** The strongest wind, in steps either way. */
export const WIND_MAX_STEPS = 5;

/** The sideways push of one wind step, in world units per second squared. */
export const WIND_ACCELERATION = 19;

/** How far the head sits into the shoulders, as a share of its radius. */
const HEAD_SINK = 0.85;

/** A target's hit areas, in world units. */
export type Hitbox = {
  /** Centre of the body, sideways. */
  readonly x: number;
  readonly bodyHalfWidth: number;
  readonly bodyTop: number;
  readonly headY: number;
  readonly headRadius: number;
};

/**
 * Where a fighter can be hit.
 *
 * @param seat - which side they stand on
 * @param character - who they are, for their size
 * @returns the head and body areas
 */
export function hitboxOf(seat: number, character: CharacterDef): Hitbox {
  const bodyTop = BODY_HEIGHT * character.size;
  const headRadius = HEAD_RADIUS * character.size;
  return {
    x: FIGHTER_X[seat],
    bodyHalfWidth: (BODY_WIDTH * character.size) / 2,
    bodyTop,
    headY: bodyTop + headRadius * HEAD_SINK,
    headRadius,
  };
}

/**
 * Which way a seat throws.
 *
 * @param seat - the thrower's side
 * @returns +1 for the left seat (throwing right), -1 for the right one
 */
export function facing(seat: number): number {
  return seat === 0 ? 1 : -1;
}
