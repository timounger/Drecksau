/**
 * Who hurts whom: damage, knockback, shields and what a beaten monster
 * leaves behind.
 *
 * @module
 */
import { placeBossContainer } from "./areas";
import { BOSS_FLAG, MINIBOSS_FLAG } from "./clearing";
import { give } from "./treasure";
import { ENEMY_DROPS, addEffect, rollDrop, spawnPickup } from "./effects";
import { DIR_VEC, between } from "./physics";
import type { Enemy, EnemyKind, GameState, StepReport } from "./types";

/** Seconds Link cannot be hurt again after a hit. */
export const PLAYER_INVULN = 1;

/** Seconds a knockback lasts. */
export const KNOCK_TIME = 0.16;

/** Knockback speed, px/s. */
export const KNOCK_SPEED = 170;

/** Seconds a monster flashes (and cannot be hurt again) after a hit. */
const ENEMY_HURT = 0.32;

/** How much a shield faces a blow before it blocks it (dot product). */
const SHIELD_FACING = 0.4;

/** Red rupees the black knight leaves behind. */
const DARKNUT_RUPEES = 3;

/** Spread of the knight's rupees around where it fell, in pixels. */
const DARKNUT_SPREAD = 10;

/** Seconds the world freezes when a sword blow lands. */
const HIT_STOP = 0.05;

/** Seconds the golem stays stunned after an arrow in the eye or a blast. */
export const GOLEM_STUN = 2.6;

/** Seconds of the golem's stun each sword blow knocks off - two or three blows per stun. */
const STUN_PER_BLOW = 0.75;

/** Rupees the beetle leaves behind. */
const BEETLE_RUPEES = 2;

/** The statistics of each kind of monster. */
export type KindStats = {
  /** Health in sword hits. */
  readonly hp: number;
  /** Walking speed, px/s. */
  readonly speed: number;
  /** Damage to Link, in half hearts. */
  readonly damage: number;
  /** Half width of the body box. */
  readonly hw: number;
  /** Half height of the body box. */
  readonly hh: number;
  /** Seconds before it comes back after being beaten. */
  readonly respawn: number;
};

/** Per kind: health, speed, damage, size and respawn time. */
export const KINDS: Readonly<Record<EnemyKind, KindStats>> = {
  octorok: { hp: 2, speed: 32, damage: 1, hw: 6, hh: 5, respawn: 60 },
  chuchu: { hp: 2, speed: 42, damage: 1, hw: 6, hh: 5, respawn: 60 },
  keese: { hp: 1, speed: 62, damage: 1, hw: 5, hh: 4, respawn: 50 },
  moblin: { hp: 4, speed: 28, damage: 2, hw: 7, hh: 6, respawn: 75 },
  tektite: { hp: 2, speed: 70, damage: 1, hw: 6, hh: 5, respawn: 60 },
  darknut: { hp: 10, speed: 24, damage: 3, hw: 7, hh: 6, respawn: 180 },
  beetle: { hp: 8, speed: 30, damage: 2, hw: 10, hh: 8, respawn: Infinity },
  golem: { hp: 8, speed: 22, damage: 2, hw: 15, hh: 10, respawn: Infinity },
};

/** How a blow on a monster went. */
export type HitResult = "hit" | "blocked" | "ignored";

/** The details of a blow on a monster. */
export type Blow = {
  /** Damage in sword hits. */
  readonly damage: number;
  /** Where it came from, for knockback and shields. */
  readonly fromX: number;
  readonly fromY: number;
  /** Seconds the monster is stunned for instead of (or besides) hurt. */
  readonly stun?: number;
  /** A shield held up against it stops it (sword, arrow, boomerang). */
  readonly blockable: boolean;
  /** What dealt it - the golem cares. */
  readonly source: "sword" | "arrow" | "bomb" | "boomerang" | "fire" | "hook";
};

/**
 * Hurts Link, unless he is still flashing or his shield takes it.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @param damage - half hearts
 * @param fromX - where the blow came from
 * @param fromY - where the blow came from
 * @param blockable - whether a raised shield stops it
 * @returns true if Link took the damage
 */
export function hurtPlayer(
  state: GameState,
  report: StepReport,
  damage: number,
  fromX: number,
  fromY: number,
  blockable: boolean,
): boolean {
  const player = state.player;
  let hurt = false;
  if (player.invuln <= 0 && state.phase === "playing" && !state.cheat) {
    const away = unit(player.x - fromX, player.y - fromY);
    if (blockable && player.shieldUp && facesBlow(state, fromX, fromY)) {
      report.events.push("block");
      addEffect(
        state,
        "spark",
        player.x - (away.x * (KNOCK_TIME * KNOCK_SPEED)) / 2,
        player.y - (away.y * (KNOCK_TIME * KNOCK_SPEED)) / 2,
      );
      knockPlayer(state, away.x, away.y);
    } else {
      player.hp = Math.max(0, player.hp - damage);
      player.invuln = PLAYER_INVULN;
      knockPlayer(state, away.x, away.y);
      report.events.push("hurt");
      hurt = true;
      if (player.hp <= 0) {
        state.phase = "gameover";
        report.events.push("die");
      }
    }
  }
  return hurt;
}

/**
 * Whether Link's shield points at something.
 *
 * @param state - the game
 * @param fromX - where the thing is
 * @param fromY - where the thing is
 * @returns true when it is in front of him
 */
export function facesBlow(
  state: GameState,
  fromX: number,
  fromY: number,
): boolean {
  const player = state.player;
  const to = unit(fromX - player.x, fromY - player.y);
  const face = DIR_VEC[player.facing];
  return to.x * face.x + to.y * face.y > SHIELD_FACING;
}

/**
 * Lands a blow on a monster.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @param enemy - the monster
 * @param blow - how hard and from where
 * @returns whether it hurt, was blocked, or did nothing
 */
export function hurtEnemy(
  state: GameState,
  report: StepReport,
  enemy: Enemy,
  blow: Blow,
): HitResult {
  let result: HitResult = "ignored";
  const away = unit(enemy.x - blow.fromX, enemy.y - blow.fromY);
  const face = DIR_VEC[enemy.facing];
  const fromFront = -(away.x * face.x + away.y * face.y) > SHIELD_FACING;
  const armoured =
    (enemy.kind === "darknut" && blow.blockable && fromFront) ||
    (enemy.kind === "beetle" &&
      blow.blockable &&
      fromFront &&
      enemy.mode !== "dazed") ||
    (enemy.kind === "golem" && enemy.mode !== "stunned");
  if (enemy.kind === "golem" && stunsGolem(enemy, blow)) {
    result = "hit";
    enemy.mode = "stunned";
    enemy.t = GOLEM_STUN;
    enemy.hurt = ENEMY_HURT;
    report.events.push("bossHit");
  } else if (armoured) {
    result = "blocked";
    report.events.push("block");
    const stats = KINDS[enemy.kind];
    addEffect(
      state,
      "spark",
      enemy.x - away.x * stats.hw,
      enemy.y - away.y * stats.hh - stats.hh,
    );
  } else if (enemy.hurt <= 0) {
    result = "hit";
    if (blow.stun !== undefined) {
      enemy.stun = blow.stun;
    }
    if (blow.damage > 0) {
      enemy.hp -= blow.damage;
      enemy.hurt = ENEMY_HURT;
      const heavy = enemy.kind === "golem";
      enemy.knockX = heavy ? 0 : away.x * KNOCK_SPEED;
      enemy.knockY = heavy ? 0 : away.y * KNOCK_SPEED;
      enemy.knockT = KNOCK_TIME;
      report.events.push(heavy || enemy.kind === "beetle" ? "bossHit" : "hit");
      if (blow.source === "sword") {
        state.hitStop = HIT_STOP;
      }
      if (heavy) {
        enemy.t -= STUN_PER_BLOW;
      }
    }
    if (enemy.hp <= 0) {
      defeat(state, report, enemy);
    }
  }
  return result;
}

/**
 * Pushes Link away from something.
 *
 * @param state - the game
 * @param ux - direction to push, unit vector
 * @param uy - direction to push, unit vector
 */
export function knockPlayer(state: GameState, ux: number, uy: number): void {
  const player = state.player;
  player.knockX = ux * KNOCK_SPEED;
  player.knockY = uy * KNOCK_SPEED;
  player.knockT = KNOCK_TIME;
}

/**
 * A vector scaled to length one (or zero).
 *
 * @param x - vector x
 * @param y - vector y
 * @returns the unit vector
 */
export function unit(x: number, y: number): { x: number; y: number } {
  const length = Math.hypot(x, y);
  return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}

/** An arrow or a flame into the open eye, or a blast close by, knocks the golem out. */
function stunsGolem(enemy: Enemy, blow: Blow): boolean {
  const eyeOpen = enemy.mode === "aim";
  return (
    enemy.mode !== "stunned" &&
    enemy.mode !== "wake" &&
    (((blow.source === "arrow" || blow.source === "fire") && eyeOpen) ||
      blow.source === "bomb")
  );
}

/** Takes a beaten monster off the map, with a puff and its drop. */
function defeat(state: GameState, report: StepReport, enemy: Enemy): void {
  state.enemies = state.enemies.filter((other) => other !== enemy);
  const spawn = state.spawns[enemy.spawn];
  spawn.alive = false;
  spawn.deadAt = state.time;
  addEffect(state, "poof", enemy.x, enemy.y - enemy.z);
  report.kills.push(enemy.kind);
  report.events.push("kill");
  if (enemy.kind === "darknut") {
    for (let i = 0; i < DARKNUT_RUPEES; i++) {
      spawnPickup(
        state,
        "rupee20",
        enemy.x + between(-DARKNUT_SPREAD, DARKNUT_SPREAD),
        enemy.y + between(-DARKNUT_SPREAD, DARKNUT_SPREAD),
      );
    }
    spawnPickup(state, "heart", enemy.x, enemy.y);
    state.darknutBeaten = true;
    report.events.push("secret");
  } else if (enemy.kind === "beetle") {
    state.flags.add(MINIBOSS_FLAG);
    for (let i = 0; i < BEETLE_RUPEES; i++) {
      spawnPickup(
        state,
        "rupee20",
        enemy.x + between(-DARKNUT_SPREAD, DARKNUT_SPREAD),
        enemy.y,
      );
    }
    addEffect(state, "explosion", enemy.x, enemy.y);
    report.events.push("bossDie");
  } else if (enemy.kind === "golem") {
    state.flags.add(BOSS_FLAG);
    state.shots = [];
    state.rocks = [];
    state.shake = 0;
    addEffect(state, "explosion", enemy.x, enemy.y - enemy.z);
    addEffect(
      state,
      "explosion",
      enemy.x - DARKNUT_SPREAD,
      enemy.y + DARKNUT_SPREAD / 2,
    );
    addEffect(
      state,
      "explosion",
      enemy.x + DARKNUT_SPREAD,
      enemy.y - DARKNUT_SPREAD / 2,
    );
    report.events.push("bossDie", "victory");
    placeBossContainer(state, state.room);
    give(state, "sunstone", report);
  } else {
    rollDrop(state, ENEMY_DROPS, enemy.x, enemy.y);
  }
}
