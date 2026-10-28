/**
 * The tools found on the adventure: the lantern, the boots' dash, the fire
 * rod, the hookshot, the shovel, the feather's hop - and the bottles.
 *
 * @module
 */
import { chestVisible, tileFlag } from "./clearing";
import { hurtEnemy, hurtPlayer, KINDS, knockPlayer } from "./combat";
import {
  DIG_DROPS,
  TREE_DROPS,
  addEffect,
  burstLeaves,
  rollDrop,
  spawnPickup,
} from "./effects";
import { PLAYER_HH, PLAYER_HW } from "./enemies";
import { bottleIndex } from "./gear";
import {
  BANNER_SHORT,
  BODY_LIFT,
  DASH_WINDUP,
  collectPickup,
  lightTorch,
} from "./items";
import {
  DIR_VEC,
  HOP_TIME,
  between,
  boxBlocked,
  dist,
  moveBody,
  overlaps,
  shotBlocked,
} from "./physics";
import {
  TILE,
  TILE_CHARS,
  isDiggable,
  isTree,
  tileAt,
  tileCentre,
  tileIndex,
} from "./tiles";
import { give } from "./treasure";
import type { BottleId, GameState, Input, StepReport } from "./types";
import { HALVES_PER_HEART } from "./world";
import { MESSAGES } from "@/games/zelda/i18n/texts";

/** How far in front of Link the lantern and the shovel reach, px. */
const REACH = 10;

/** Speed of the dash, px/s. */
const DASH_SPEED = 165;

/** Seconds between dust puffs while dashing. */
const DASH_DUST = 0.06;

/** Seconds the screen shakes when a dash runs into something. */
const BONK_SHAKE = 0.25;

/** How far beside Link a shaken-loose drop lands, px. */
const DROP_ASIDE = 14;

/** Speed of a hop over the ground, px/s. */
const HOP_SPEED = 90;

/** Half hearts lost by landing in the current or a puddle. */
const SPLASH_DAMAGE = 1;

/** Speed of the fire rod's flame, px/s. */
const FLAME_SPEED = 150;

/** Seconds a flame flies. */
const FLAME_LIFE = 0.6;

/** Speed of the hookshot's tip, out and back, px/s. */
const HOOK_SPEED = 280;

/** How far the hookshot reaches, px. */
const HOOK_RANGE = 120;

/** Speed Link is pulled along the chain, px/s. */
const PULL_SPEED = 210;

/** Seconds a hookshot hit stuns a monster. */
const HOOK_STUN = 2;

/** Half size of the hookshot's tip, px. */
const TIP_HALF = 4;

/** How close the tip must come back to be caught, px. */
const HOOK_CATCH = 8;

/** How far in front of Link the chain starts, px. */
const HAND = 8;

/** Half size of a pickup the tip can catch, px. */
const PICKUP_HALF = 5;

/** Clods of earth thrown up by one dig. */
const DIRT_BITS = 5;

/** Sideways speed of the clods, px/s - they fly up twice as fast. */
const DIRT_SPREAD = 24;

/** Red rupees in the buried stash. */
const STASH_RUPEES = 5;

/** Spread of the stash's rupees, px. */
const STASH_SPREAD = 10;

/** What lies buried at a dig spot. */
type Buried = "bottle" | "stash";

/** A hidden dig spot, in tiles, and what it holds. */
export type DigSpot = {
  readonly tx: number;
  readonly ty: number;
  readonly find: Buried;
};

/** The overworld's hidden dig spots, in tile columns and rows. */
export const DIG_SPOTS: readonly DigSpot[] = [
  { tx: 5, ty: 8, find: "bottle" },
  { tx: 37, ty: 36, find: "stash" },
];

/**
 * The flag of a dig spot that has been dug up.
 *
 * @param spot - the dig spot
 * @returns its flag
 */
export function digFlag(spot: DigSpot): string {
  return tileFlag("dig", "overworld", spot.tx, spot.ty);
}

/**
 * Holds the lantern out: lights a cold torch in front of Link, and glows.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @returns true - the lantern always shines
 */
export function shineLantern(state: GameState, report: StepReport): boolean {
  const ahead = aheadPoint(state);
  const tx = Math.floor(ahead.x / TILE);
  const ty = Math.floor(ahead.y / TILE);
  if (!lightTorch(state, report, tx, ty)) {
    report.events.push("fire");
  }
  addEffect(state, "glow", ahead.x, ahead.y - BODY_LIFT);
  return true;
}

/**
 * Shoots a flame from the fire rod - one at a time.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @returns true if a flame left the rod
 */
export function shootFlame(state: GameState, report: StepReport): boolean {
  const player = state.player;
  const shot = !state.shots.some(
    (one) => one.fromPlayer && one.kind === "flame",
  );
  if (shot) {
    const v = DIR_VEC[player.facing];
    state.shots.push({
      kind: "flame",
      x: player.x + v.x * HAND,
      y: player.y - BODY_LIFT / 2 + v.y * HAND,
      vx: v.x * FLAME_SPEED,
      vy: v.y * FLAME_SPEED,
      facing: player.facing,
      life: FLAME_LIFE,
      fromPlayer: true,
      fire: true,
    });
    report.events.push("fire");
  }
  return shot;
}

/**
 * Starts the boots' dash: a moment of stamping, then a run straight ahead
 * for as long as the button is held.
 *
 * @param state - the game
 * @param button - the button the boots sit on
 */
export function startDash(state: GameState, button: "a" | "b"): void {
  state.player.action = { kind: "dash", t: 0, hit: new Set(), button };
  state.player.vx = 0;
  state.player.vy = 0;
}

/**
 * Runs the dash on, until the button is let go or Link runs into something.
 *
 * @param state - the game
 * @param input - this step's buttons
 * @param report - where to note what happened
 * @param dt - seconds since the last step
 */
export function stepDash(
  state: GameState,
  input: Input,
  report: StepReport,
  dt: number,
): void {
  const player = state.player;
  const action = player.action;
  if (action.kind === "dash") {
    const held = action.button === "a" ? input.a : input.b;
    const before = action.t;
    action.t += dt;
    player.walk += dt * 2;
    if (!held) {
      player.action = { kind: "idle" };
    } else {
      const v = DIR_VEC[player.facing];
      if (Math.floor(before / DASH_DUST) !== Math.floor(action.t / DASH_DUST)) {
        addEffect(
          state,
          "dust",
          player.x - v.x * PLAYER_HW,
          player.y - v.y * PLAYER_HH,
        );
      }
      if (before < DASH_WINDUP && action.t >= DASH_WINDUP) {
        report.events.push("dash");
      }
      if (action.t >= DASH_WINDUP) {
        const stopped = moveBody(
          state,
          player,
          v.x * DASH_SPEED * dt,
          v.y * DASH_SPEED * dt,
          PLAYER_HW,
          PLAYER_HH,
        );
        if (stopped) {
          bonk(state, report);
        }
      }
    }
  }
}

/** A dash runs into something: Link bounces off; a tree drops something. */
function bonk(state: GameState, report: StepReport): void {
  const player = state.player;
  const v = DIR_VEC[player.facing];
  const tx = Math.floor((player.x + v.x * (PLAYER_HW + 2)) / TILE);
  const ty = Math.floor((player.y + v.y * (PLAYER_HH + 2)) / TILE);
  player.action = { kind: "idle" };
  knockPlayer(state, -v.x, -v.y);
  state.shake = BONK_SHAKE;
  report.events.push("slam");
  addEffect(state, "spark", player.x + v.x * PLAYER_HW, player.y - BODY_LIFT);
  if (isTree(tileAt(state.area, tx, ty))) {
    const centre = tileCentre(tx, ty);
    burstLeaves(state, centre.x, centre.y, false);
    // The drop lands beside Link, so it is seen falling before he takes it.
    const side = Math.random() < 1 / 2 ? -1 : 1;
    rollDrop(
      state,
      TREE_DROPS,
      player.x + v.y * DROP_ASIDE * side,
      player.y + v.x * DROP_ASIDE * side,
    );
  }
}

/**
 * Starts a hop with the feather: in the stick's direction, or on the spot.
 *
 * @param state - the game
 * @param mx - stick direction
 * @param my - stick direction
 * @param report - where to note what happened
 */
export function startHop(
  state: GameState,
  mx: number,
  my: number,
  report: StepReport,
): void {
  const player = state.player;
  const length = Math.hypot(mx, my);
  const ux = length > 0 ? mx / length : 0;
  const uy = length > 0 ? my / length : 0;
  player.action = {
    kind: "hop",
    t: 0,
    vx: ux * HOP_SPEED,
    vy: uy * HOP_SPEED,
    fromX: player.x,
    fromY: player.y,
  };
  player.shieldUp = false;
  report.events.push("hop");
}

/**
 * Carries a hop on and lands it - a landing in the current, a puddle or on
 * a fence puts Link back where he jumped from. In open water he swims.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @param dt - seconds since the last step
 */
export function stepHop(
  state: GameState,
  report: StepReport,
  dt: number,
): void {
  const player = state.player;
  const action = player.action;
  if (action.kind === "hop") {
    action.t += dt;
    moveBody(
      state,
      player,
      action.vx * dt,
      action.vy * dt,
      PLAYER_HW,
      PLAYER_HH,
    );
    if (action.t >= HOP_TIME) {
      player.action = { kind: "idle" };
      player.vx = action.vx;
      player.vy = action.vy;
      addEffect(state, "dust", player.x, player.y);
      if (boxBlocked(state, player.x, player.y, PLAYER_HW, PLAYER_HH, true)) {
        const letter = tileAt(
          state.area,
          Math.floor(player.x / TILE),
          Math.floor(player.y / TILE),
        );
        const wet =
          letter === TILE_CHARS.current || letter === TILE_CHARS.puddle;
        if (wet) {
          addEffect(state, "ring", player.x, player.y);
          report.events.push("splash");
        }
        player.x = action.fromX;
        player.y = action.fromY;
        player.vx = 0;
        player.vy = 0;
        if (wet) {
          hurtPlayer(state, report, SPLASH_DAMAGE, player.x, player.y, false);
        }
      }
    }
  }
}

/**
 * Fires the hookshot straight ahead, if its chain is not already out.
 *
 * @param state - the game
 * @param report - where to note what happened
 */
export function fireHook(state: GameState, report: StepReport): void {
  const player = state.player;
  if (state.hook === null) {
    const v = DIR_VEC[player.facing];
    state.hook = {
      x: player.x + v.x * HAND,
      y: player.y - BODY_LIFT / 2 + v.y * HAND,
      facing: player.facing,
      dist: 0,
      phase: "out",
      toX: player.x,
      toY: player.y,
      fromX: player.x,
      fromY: player.y,
      carried: [],
    };
    player.action = { kind: "hook", t: 0 };
    player.vx = 0;
    player.vy = 0;
    report.events.push("hookshot");
  }
}

/**
 * Flies the hookshot's tip out, reels it in, or pulls Link along the chain.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @param dt - seconds since the last step
 */
export function stepHook(
  state: GameState,
  report: StepReport,
  dt: number,
): void {
  const hook = state.hook;
  if (hook !== null) {
    switch (hook.phase) {
      case "out":
        hookOut(state, report, dt);
        break;
      case "back":
        hookBack(state, report, dt);
        break;
      default:
        hookPull(state, dt);
    }
  }
}

/** The tip flies on: catches a post or chest, a monster, a pickup - or a wall. */
function hookOut(state: GameState, report: StepReport, dt: number): void {
  const hook = state.hook;
  const player = state.player;
  if (hook !== null) {
    const v = DIR_VEC[hook.facing];
    const stepLength = HOOK_SPEED * dt;
    hook.x += v.x * stepLength;
    hook.y += v.y * stepLength;
    hook.dist += stepLength;
    const tx = Math.floor(hook.x / TILE);
    const ty = Math.floor(hook.y / TILE);
    const letter = tileAt(state.area, tx, ty);
    const target =
      letter === TILE_CHARS.hookPost ||
      (letter === TILE_CHARS.chest && chestVisible(state, tx, ty));
    const enemy = state.enemies.find((one) => {
      const stats = KINDS[one.kind];
      return overlaps(
        hook.x,
        hook.y,
        TIP_HALF,
        TIP_HALF,
        one.x,
        one.y - one.z - stats.hh,
        stats.hw,
        stats.hh + stats.hh,
      );
    });
    const pickup = state.pickups.find(
      (one) =>
        one.spot === null &&
        dist(one.x, one.y - one.z, hook.x, hook.y) < PICKUP_HALF + TIP_HALF,
    );
    if (target) {
      // Link is pulled to the tile just before what the tip caught.
      const stop = tileCentre(tx - v.x, ty - v.y);
      hook.phase = "pull";
      hook.toX = stop.x;
      hook.toY = stop.y;
      hook.fromX = player.x;
      hook.fromY = player.y;
      report.events.push("block");
      addEffect(state, "spark", hook.x, hook.y);
    } else if (shotBlocked(state, hook.x, hook.y)) {
      hook.phase = "back";
      report.events.push("block");
      addEffect(state, "spark", hook.x, hook.y);
    } else if (enemy !== undefined) {
      hook.phase = "back";
      hurtEnemy(state, report, enemy, {
        damage: enemy.kind === "keese" ? 1 : 0,
        fromX: player.x,
        fromY: player.y,
        stun: HOOK_STUN,
        blockable: true,
        source: "hook",
      });
      addEffect(state, "spark", hook.x, hook.y);
    } else if (pickup !== undefined) {
      hook.phase = "back";
      hook.carried.push(pickup);
      state.pickups = state.pickups.filter((one) => one !== pickup);
    } else if (hook.dist >= HOOK_RANGE) {
      hook.phase = "back";
    }
  }
}

/** The tip comes back to Link's hand, with whatever it caught. */
function hookBack(state: GameState, report: StepReport, dt: number): void {
  const hook = state.hook;
  const player = state.player;
  if (hook !== null) {
    const v = DIR_VEC[hook.facing];
    const handX = player.x + v.x * HAND;
    const handY = player.y - BODY_LIFT / 2 + v.y * HAND;
    const gap = dist(hook.x, hook.y, handX, handY);
    const stepLength = HOOK_SPEED * dt;
    if (gap <= Math.max(HOOK_CATCH, stepLength)) {
      for (const pickup of hook.carried) {
        collectPickup(state, report, pickup.kind, pickup.spot);
      }
      endHook(state);
    } else {
      hook.x += ((handX - hook.x) / gap) * stepLength;
      hook.y += ((handY - hook.y) / gap) * stepLength;
      for (const pickup of hook.carried) {
        pickup.x = hook.x;
        pickup.y = hook.y;
        pickup.z = 0;
      }
    }
  }
}

/** Link flies along the chain to what it caught. */
function hookPull(state: GameState, dt: number): void {
  const hook = state.hook;
  const player = state.player;
  if (hook !== null) {
    const gap = dist(player.x, player.y, hook.toX, hook.toY);
    const stepLength = PULL_SPEED * dt;
    player.walk += dt;
    if (gap <= stepLength) {
      player.x = hook.toX;
      player.y = hook.toY;
      // A stop that is no place to stand puts Link back where he started.
      if (boxBlocked(state, player.x, player.y, PLAYER_HW, PLAYER_HH, true)) {
        player.x = hook.fromX;
        player.y = hook.fromY;
      }
      endHook(state);
    } else {
      player.x += ((hook.toX - player.x) / gap) * stepLength;
      player.y += ((hook.toY - player.y) / gap) * stepLength;
    }
  }
}

/** Puts the hookshot away and frees Link. */
function endHook(state: GameState): void {
  state.hook = null;
  if (state.player.action.kind === "hook") {
    state.player.action = { kind: "idle" };
  }
}

/**
 * Digs a hole in front of Link - if the ground is soft. A hidden dig spot
 * gives up its treasure; elsewhere a rupee or a heart may turn up.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @returns true - the shovel is always swung
 */
export function dig(state: GameState, report: StepReport): boolean {
  const ahead = aheadPoint(state);
  const tx = Math.floor(ahead.x / TILE);
  const ty = Math.floor(ahead.y / TILE);
  const index = tileIndex(state.area, tx, ty);
  const soft =
    state.area === "overworld" &&
    isDiggable(tileAt(state.area, tx, ty)) &&
    !state.dug.has(index);
  const centre = tileCentre(tx, ty);
  if (soft) {
    state.dug.set(index, state.time);
    report.events.push("dig");
    for (let i = 0; i < DIRT_BITS; i++) {
      addEffect(
        state,
        "dirt",
        centre.x,
        centre.y,
        between(-DIRT_SPREAD, DIRT_SPREAD),
        between(-DIRT_SPREAD * 2, -DIRT_SPREAD),
      );
    }
    const spot = DIG_SPOTS.find((one) => one.tx === tx && one.ty === ty);
    if (spot !== undefined && !state.flags.has(digFlag(spot))) {
      state.flags.add(digFlag(spot));
      unearth(state, spot.find, centre, report);
    } else {
      rollDrop(state, DIG_DROPS, centre.x, centre.y);
    }
  } else {
    report.events.push("block");
    addEffect(state, "spark", ahead.x, ahead.y);
    if (state.banner === null) {
      state.banner = { text: MESSAGES.tooHard, t: BANNER_SHORT };
    }
  }
  return true;
}

/** What a dig spot gives up. */
function unearth(
  state: GameState,
  find: Buried,
  at: { readonly x: number; readonly y: number },
  report: StepReport,
): void {
  if (find === "bottle") {
    give(state, "bottle", report);
  } else {
    report.events.push("secret");
    for (let i = 0; i < STASH_RUPEES; i++) {
      spawnPickup(
        state,
        "rupee20",
        at.x + between(-STASH_SPREAD, STASH_SPREAD),
        at.y + between(-STASH_SPREAD, STASH_SPREAD),
      );
    }
  }
}

/**
 * Drinks from a bottle: a healing potion fills every heart and leaves the
 * bottle empty.
 *
 * @param state - the game
 * @param id - which bottle
 * @param report - where to note what happened
 * @returns true when there was something to drink
 */
export function drink(
  state: GameState,
  id: BottleId,
  report: StepReport,
): boolean {
  const player = state.player;
  const index = bottleIndex(id);
  const full = state.inv.bottles[index] === "potion";
  if (full) {
    state.inv.bottles[index] = "empty";
    player.hp = player.maxHearts * HALVES_PER_HEART;
    report.events.push("drink");
    addEffect(state, "glow", player.x, player.y - BODY_LIFT);
  } else {
    state.banner = { text: MESSAGES.bottleEmpty, t: BANNER_SHORT };
    report.events.push("error");
  }
  return full;
}

/** The point just in front of Link's feet. */
function aheadPoint(state: GameState): { x: number; y: number } {
  const player = state.player;
  const v = DIR_VEC[player.facing];
  return { x: player.x + v.x * REACH, y: player.y + v.y * REACH };
}
