/**
 * Puffs, sparks, leaves - and what drops out of a cut bush or a beaten
 * monster.
 *
 * @module
 */
import { between } from "./physics";
import type { Effect, GameState, PickupKind } from "./types";

/** How long each kind of effect lives, in seconds. */
const EFFECT_LIFE: Readonly<Record<Effect["kind"], number>> = {
  poof: 0.36,
  spark: 0.18,
  leaf: 0.5,
  grass: 0.4,
  explosion: 0.45,
  dust: 0.3,
  ring: 0.4,
  twinkle: 0.5,
  flame: 0.35,
  dirt: 0.4,
  glow: 0.6,
  splash: 0.45,
  bubble: 0.6,
};

/** Upward speed a dropped item pops out with, px/s. */
const DROP_POP = 70;

/** Seconds a dropped item stays before it vanishes. */
export const DROP_LIFE = 12;

/** Leaves flying out of a cut bush. */
const LEAVES_PER_CUT = 5;

/** Fastest a leaf flies, px/s. */
const LEAF_SPEED = 50;

/** One row of a drop table: what may fall out, and how likely. */
type DropChance = readonly [PickupKind, number];

/* eslint-disable @typescript-eslint/no-magic-numbers -- drop tables:
   probabilities that add up to at most one, the rest is nothing. */
/** What falls out of a cut bush. */
export const BUSH_DROPS: readonly DropChance[] = [
  ["rupee1", 0.18],
  ["heart", 0.1],
  ["rupee5", 0.03],
  ["arrows", 0.03],
  ["bombs", 0.03],
];

/** What falls out of cut tall grass. */
export const GRASS_DROPS: readonly DropChance[] = [
  ["rupee1", 0.12],
  ["heart", 0.07],
];

/** What a tree shaken by the boots lets fall. */
export const TREE_DROPS: readonly DropChance[] = [
  ["rupee1", 0.3],
  ["rupee5", 0.1],
  ["heart", 0.15],
];

/** What a hole dug at random turns up. */
export const DIG_DROPS: readonly DropChance[] = [
  ["rupee1", 0.25],
  ["rupee5", 0.08],
  ["heart", 0.1],
];

/** What an ordinary monster leaves behind. */
export const ENEMY_DROPS: readonly DropChance[] = [
  ["rupee1", 0.28],
  ["rupee5", 0.1],
  ["heart", 0.18],
  ["arrows", 0.07],
  ["bombs", 0.07],
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * Adds a visual effect.
 *
 * @param state - the game
 * @param kind - what to show
 * @param x - where
 * @param y - where
 * @param vx - drift speed
 * @param vy - drift speed
 */
export function addEffect(
  state: GameState,
  kind: Effect["kind"],
  x: number,
  y: number,
  vx = 0,
  vy = 0,
): void {
  state.effects.push({ kind, x, y, vx, vy, t: 0, life: EFFECT_LIFE[kind] });
}

/**
 * Leaves or grass blades bursting out of a cut tile.
 *
 * @param state - the game
 * @param x - tile centre
 * @param y - tile centre
 * @param grass - blades instead of leaves
 */
export function burstLeaves(
  state: GameState,
  x: number,
  y: number,
  grass: boolean,
): void {
  for (let i = 0; i < LEAVES_PER_CUT; i++) {
    const angle = (i / LEAVES_PER_CUT) * Math.PI * 2 + between(0, 1);
    addEffect(
      state,
      grass ? "grass" : "leaf",
      x,
      y,
      Math.cos(angle) * between(LEAF_SPEED / 2, LEAF_SPEED),
      Math.sin(angle) * between(LEAF_SPEED / 2, LEAF_SPEED),
    );
  }
}

/**
 * Drops an item on the ground, popping up a little.
 *
 * @param state - the game
 * @param kind - what to drop
 * @param x - where
 * @param y - where
 */
export function spawnPickup(
  state: GameState,
  kind: PickupKind,
  x: number,
  y: number,
): void {
  state.pickups.push({
    id: state.nextId,
    kind,
    x,
    y,
    z: 0,
    vz: DROP_POP,
    life: DROP_LIFE,
    spot: null,
  });
  state.nextId += 1;
}

/**
 * Rolls a drop table and drops what comes up, if anything.
 *
 * @param state - the game
 * @param table - the chances
 * @param x - where
 * @param y - where
 */
export function rollDrop(
  state: GameState,
  table: readonly DropChance[],
  x: number,
  y: number,
): void {
  let roll = Math.random();
  let picked: PickupKind | null = null;
  for (const [kind, chance] of table) {
    if (picked === null) {
      if (roll < chance) {
        picked = kind;
      }
      roll -= chance;
    }
  }
  if (picked !== null) {
    spawnPickup(state, picked, x, y);
  }
}

/**
 * Ages every effect and drops the finished ones.
 *
 * @param state - the game
 * @param dt - seconds since the last step
 */
export function stepEffects(state: GameState, dt: number): void {
  for (const effect of state.effects) {
    effect.t += dt;
    effect.x += effect.vx * dt;
    effect.y += effect.vy * dt;
  }
  state.effects = state.effects.filter((effect) => effect.t < effect.life);
}
