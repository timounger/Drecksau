/**
 * Link in the water: swimming with head and arms above the surface, a
 * stroke for a short burst of speed, diving under for a moment - and the
 * finds lying on the bottom at the dive spots.
 *
 * @module
 * @remarks
 * Whether Link swims follows from where his feet are: on a water tile he
 * swims, anywhere else he walks. Only the timers of a dive and a stroke are
 * kept on the player; the dive spots already emptied are flags, so the save
 * needs no new field.
 */
import { tileFlag } from "./clearing";
import { addEffect, spawnPickup } from "./effects";
import { between, dist } from "./physics";
import { TILE, TILE_CHARS, tileAt, tileCentre } from "./tiles";
import { give } from "./treasure";
import type { GameState, PickupKind, StepReport } from "./types";

/** Speed factor while swimming. */
export const SWIM_SLOW = 0.62;

/** Speed factor of a stroke's burst, on top of swimming. */
export const STROKE_BOOST = 1.7;

/** Speed factor under water, on top of swimming. */
export const DIVE_SLOW = 0.75;

/** Seconds a dive lasts. */
export const DIVE_TIME = 1.5;

/** Seconds a stroke's burst lasts. */
export const STROKE_TIME = 0.32;

/** Seconds after surfacing before the next dive. */
const DIVE_COOLDOWN = 0.7;

/** Seconds after a stroke before the next one. */
const STROKE_COOLDOWN = 0.25;

/** Seconds between two bubbles rising from a diving Link. */
const BUBBLE_EVERY = 0.16;

/** How far round a diving Link the bubbles rise, px. */
const BUBBLE_SPREAD = 4;

/** How fast a bubble rises, px/s. */
const BUBBLE_RISE = 14;

/** Drops thrown up by a splash. */
const SPLASH_DROPS = 6;

/** Sideways speed of a splash's drops, px/s - they fly up twice as fast. */
const SPLASH_SPREAD = 26;

/** How close to a dive spot's middle Link must dive to find it, px. */
const DIVE_REACH = 12;

/** Spread of a dive spot's rupees, px. */
const FIND_SPREAD = 8;

/** What lies on the bottom at a dive spot. */
type Sunken = "rupees" | "container";

/** A dive spot, in overworld tiles, and what lies there. */
export type DiveSpot = {
  readonly tx: number;
  readonly ty: number;
  readonly find: Sunken;
};

/**
 * The dive spots, in overworld tile columns and rows (each one open water):
 * three rupee hoards and, deep in the lake, a heart container.
 */
export const DIVE_SPOTS: readonly DiveSpot[] = [
  { tx: 45, ty: 17, find: "rupees" },
  { tx: 55, ty: 34, find: "rupees" },
  { tx: 52, ty: 43, find: "rupees" },
  { tx: 60, ty: 38, find: "container" },
];

/** The rupees in one hoard. */
const HOARD: readonly PickupKind[] = ["rupee20", "rupee20", "rupee5", "rupee5"];

/**
 * The flag of a dive spot that has been emptied.
 *
 * @param spot - the dive spot
 * @returns its flag
 */
export function diveFlag(spot: DiveSpot): string {
  return tileFlag("dive", "overworld", spot.tx, spot.ty);
}

/**
 * Whether Link may go into the water right now: not while shrunk to the
 * size of a beetle, and not with a rock over his head.
 *
 * @param state - the game
 * @returns true when water does not stop him
 */
export function canSwim(state: GameState): boolean {
  return !state.player.small && !state.player.carrying;
}

/**
 * Whether a point lies in swimmable water.
 *
 * @param state - the game
 * @param x - area pixels
 * @param y - area pixels
 * @returns true on a water tile
 */
export function isWaterAt(state: GameState, x: number, y: number): boolean {
  return (
    tileAt(state.area, Math.floor(x / TILE), Math.floor(y / TILE)) ===
    TILE_CHARS.water
  );
}

/**
 * Whether Link is under water right now.
 *
 * @param state - the game
 * @returns true during a dive
 */
export function diving(state: GameState): boolean {
  return state.player.swimming && state.player.diveT > 0;
}

/**
 * Notices Link going into or out of the water: a splash either way, and
 * whatever he was doing on land ends.
 *
 * @param state - the game
 * @param report - where to note what happened
 */
export function updateSwim(state: GameState, report: StepReport): void {
  const player = state.player;
  const kind = player.action.kind;
  // In the air or on the chain, Link is not in the water yet.
  const airborne = kind === "hop" || kind === "hook" || kind === "leap";
  const wet =
    !airborne && canSwim(state) && isWaterAt(state, player.x, player.y);
  if (wet !== player.swimming) {
    player.swimming = wet;
    splash(state, report);
    player.diveT = 0;
    player.strokeT = 0;
    if (wet) {
      player.charge = 0;
      player.shieldUp = false;
      if (kind === "roll" || kind === "dash" || kind === "use") {
        player.action = { kind: "idle" };
      }
    }
  }
}

/**
 * Starts a dive, if the last one is long enough ago.
 *
 * @param state - the game
 * @param report - where to note what happened
 */
export function startDive(state: GameState, report: StepReport): void {
  const player = state.player;
  if (player.diveT <= 0 && player.diveCooldown <= 0) {
    player.diveT = DIVE_TIME;
    player.strokeT = 0;
    splash(state, report);
  }
}

/**
 * Starts a stroke: a short burst of speed.
 *
 * @param state - the game
 * @param report - where to note what happened
 */
export function startStroke(state: GameState, report: StepReport): void {
  const player = state.player;
  if (player.strokeT <= 0 && player.diveT <= 0 && player.diveCooldown <= 0) {
    player.strokeT = STROKE_TIME;
    player.diveCooldown = STROKE_COOLDOWN;
    addEffect(state, "ring", player.x, player.y);
    report.events.push("stroke");
  }
}

/**
 * Runs the swimming timers on: the stroke, the dive and its bubbles, and
 * the find at a dive spot.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @param dt - seconds since the last step
 */
export function stepSwim(
  state: GameState,
  report: StepReport,
  dt: number,
): void {
  const player = state.player;
  player.strokeT = Math.max(0, player.strokeT - dt);
  player.diveCooldown = Math.max(0, player.diveCooldown - dt);
  if (player.diveT > 0) {
    const before = player.diveT;
    player.diveT = Math.max(0, player.diveT - dt);
    if (
      Math.floor(before / BUBBLE_EVERY) !==
      Math.floor(player.diveT / BUBBLE_EVERY)
    ) {
      addEffect(
        state,
        "bubble",
        player.x + between(-BUBBLE_SPREAD, BUBBLE_SPREAD),
        player.y + between(-BUBBLE_SPREAD, 0),
        0,
        -BUBBLE_RISE,
      );
    }
    const spot = spotHere(state);
    if (spot !== undefined) {
      // Link comes up at once with what he found.
      player.diveT = 0;
      state.flags.add(diveFlag(spot));
      bringUp(state, spot, report);
    }
    if (player.diveT <= 0) {
      player.diveCooldown = DIVE_COOLDOWN;
      splash(state, report);
    }
  }
}

/** The unemptied dive spot Link is diving at, if any. */
function spotHere(state: GameState): DiveSpot | undefined {
  const player = state.player;
  let found: DiveSpot | undefined;
  if (state.area === "overworld") {
    found = DIVE_SPOTS.find((spot) => {
      const centre = tileCentre(spot.tx, spot.ty);
      return (
        !state.flags.has(diveFlag(spot)) &&
        dist(centre.x, centre.y, player.x, player.y) < DIVE_REACH
      );
    });
  }
  return found;
}

/** What a dive spot gives up. */
function bringUp(state: GameState, spot: DiveSpot, report: StepReport): void {
  const player = state.player;
  if (spot.find === "container") {
    give(state, "container", report);
  } else {
    report.events.push("secret");
    for (const kind of HOARD) {
      spawnPickup(
        state,
        kind,
        player.x + between(-FIND_SPREAD, FIND_SPREAD),
        player.y + between(-FIND_SPREAD, FIND_SPREAD),
      );
    }
  }
}

/** Water flying up round Link, with its sound. */
function splash(state: GameState, report: StepReport): void {
  const player = state.player;
  addEffect(state, "ring", player.x, player.y);
  for (let i = 0; i < SPLASH_DROPS; i++) {
    addEffect(
      state,
      "splash",
      player.x,
      player.y,
      between(-SPLASH_SPREAD, SPLASH_SPREAD),
      between(-SPLASH_SPREAD * 2, -SPLASH_SPREAD),
    );
  }
  report.events.push("splash");
}
