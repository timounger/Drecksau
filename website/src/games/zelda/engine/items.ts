/**
 * Link's weapons and everything that flies or lies about: the sword's swing,
 * arrows, flames and rocks, bombs, the boomerang, and the pickups on the
 * ground.
 *
 * @module
 */
import { KINDS, facesBlow, hurtEnemy, hurtPlayer } from "./combat";
import {
  BUSH_DROPS,
  GRASS_DROPS,
  addEffect,
  burstLeaves,
  rollDrop,
} from "./effects";
import { containerIndex } from "./areas";
import { openedKey, tileFlag } from "./clearing";
import { PLAYER_HH, PLAYER_HW } from "./enemies";
import { DIR_VEC, dist, evading, overlaps, shotBlocked } from "./physics";
import { TILE, TILE_CHARS, isCuttable, tileAt, tileIndex } from "./tiles";
import { give } from "./treasure";
import type {
  Dir,
  Enemy,
  GameState,
  PickupKind,
  Shot,
  StepReport,
} from "./types";
import { HALVES_PER_HEART, MAX_ARROWS, MAX_BOMBS, MAX_RUPEES } from "./world";
import { MESSAGES } from "@/games/zelda/i18n/texts";

/** Seconds a short notice stays on screen. */
export const BANNER_SHORT = 1.4;

/** Seconds one sword swing takes - a wind-up, the sweep, a short hold. */
export const SLASH_TIME = 0.26;

/** Seconds the spin attack takes. */
export const SPIN_TIME = 0.44;

/** Seconds the sword must be held out before a spin is ready. */
export const CHARGE_TIME = 0.85;

/** Seconds the boots stamp on the spot before the dash takes off. */
export const DASH_WINDUP = 0.3;

/** Link's middle is this far above his feet, px. */
export const BODY_LIFT = 7;

/** How far the sword's middle sits from Link's middle, px. */
const SWORD_REACH = 12;

/** Half size of the sword's hit box, px. */
const SWORD_HALF = 7;

/** Reach of the spin attack, px. */
const SPIN_RADIUS = 22;

/** Sword damage, in hits. */
const SWORD_DAMAGE = 1;

/** Spin damage, in hits. */
const SPIN_DAMAGE = 2;

/** Arrow damage, in hits. */
const ARROW_DAMAGE = 1;

/** Damage of the fire rod's flame, in hits. */
const FLAME_DAMAGE = 2;

/** Damage of the sword held out in a dash, in hits. */
const DASH_DAMAGE = 2;

/** Half size of what a flame burns as it passes, px. */
const FLAME_BURN = 3;

/** Bomb damage to monsters, in hits. */
const BOMB_DAMAGE = 3;

/** Bomb damage to Link, in half hearts. */
const BOMB_SELF_DAMAGE = 2;

/** Rock damage to Link, in half hearts. */
const ROCK_DAMAGE = 1;

/** Fireball damage to Link, in half hearts. */
const FIRE_DAMAGE = 2;

/** Damage of a thrown rock, in hits. */
const BOULDER_DAMAGE = 2;

/** Speed of a thrown rock, px/s. */
const THROW_SPEED = 170;

/** Seconds a thrown rock flies before it lands and breaks. */
const THROW_LIFE = 0.42;

/** How high over Link's feet a carried rock is held, px. */
export const CARRY_LIFT = 20;

/** Arrow speed, px/s. */
const ARROW_SPEED = 210;

/** Seconds an arrow flies. */
const ARROW_LIFE = 1.2;

/** Seconds a bomb burns. */
export const BOMB_FUSE = 2;

/** Most bombs on the ground at once. */
const MAX_LIVE_BOMBS = 3;

/** Blast radius, px. */
const BLAST_RADIUS = 26;

/** How far in front of Link a bomb is put down, px. */
const BOMB_DROP = 12;

/** Boomerang speed going out, px/s. */
const BOOMERANG_OUT = 190;

/** Boomerang speed coming back, px/s. */
const BOOMERANG_BACK = 220;

/** Seconds the boomerang flies out before turning. */
const BOOMERANG_RANGE = 0.34;

/** Seconds a boomerang hit stuns a monster. */
const BOOMERANG_STUN = 1.8;

/** How close the boomerang must come back to be caught, px. */
const BOOMERANG_CATCH = 9;

/** Half size of a shot's or the boomerang's hit box, px. */
const SHOT_HALF = 4;

/** Gravity for bouncing pickups, px/s². */
const PICKUP_GRAVITY = 380;

/** Half size of a pickup, px. */
const PICKUP_HALF = 5;

/** Arrows or bombs in one pickup. */
const AMMO_PACK = 5;

/** Half hearts one heart pickup heals. */
const HEART_HEAL = 2;

/** Rupee value of each rupee pickup. */
const RUPEE_VALUE: Partial<Record<PickupKind, number>> = {
  rupee1: 1,
  rupee5: 5,
  rupee20: 20,
};

/**
 * Sword angle index per facing for the three frames of a swing.
 *
 * @remarks
 * Angles are counted in eighths of a turn, counter-clockwise from "right":
 * 0 right, 2 up, 4 left, 6 down. A swing sweeps a quarter turn into the
 * direction Link faces.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- eighths of a turn */
const SWING: Readonly<Record<Dir, readonly number[]>> = {
  down: [1, 0, 7, 6, 6],
  up: [5, 4, 3, 2, 2],
  right: [3, 2, 1, 0, 0],
  left: [1, 2, 3, 4, 4],
};

/** The angle (in eighths) straight ahead for each facing. */
export const AHEAD: Readonly<Record<Dir, number>> = {
  right: 0,
  up: 2,
  left: 4,
  down: 6,
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Eighths of a turn in a full turn. */
export const EIGHTHS = 8;

/** Where the sword is: its angle index and the middle of its blade. */
export type SwordPose = {
  readonly k: number;
  readonly x: number;
  readonly y: number;
};

/**
 * Where Link's sword is this frame, if it is out.
 *
 * @param state - the game
 * @returns the pose, or null when the sword is sheathed
 */
export function swordPose(state: GameState): SwordPose | null {
  const player = state.player;
  const action = player.action;
  let k: number | null = null;
  if (action.kind === "slash") {
    const frame = Math.min(
      SWING[player.facing].length - 1,
      Math.floor((action.t / SLASH_TIME) * SWING[player.facing].length),
    );
    k = SWING[player.facing][frame];
  } else if (action.kind === "spin") {
    const step = Math.floor((action.t / SPIN_TIME) * EIGHTHS);
    k = (AHEAD[player.facing] - step + EIGHTHS * 2) % EIGHTHS;
  } else if (
    (action.kind === "idle" && player.charge > 0) ||
    (action.kind === "dash" && action.t >= DASH_WINDUP)
  ) {
    k = AHEAD[player.facing];
  }
  let pose: SwordPose | null = null;
  if (k !== null) {
    const angle = (k / EIGHTHS) * Math.PI * 2;
    pose = {
      k,
      x: player.x + Math.cos(angle) * SWORD_REACH,
      y: player.y - BODY_LIFT - Math.sin(angle) * SWORD_REACH,
    };
  }
  return pose;
}

/**
 * Lets the swinging sword - or the one held out in a dash - hit monsters and
 * cut grass.
 *
 * @param state - the game
 * @param report - where to note what happened
 */
export function swordHits(state: GameState, report: StepReport): void {
  const player = state.player;
  const action = player.action;
  const pose = swordPose(state);
  if (
    pose !== null &&
    (action.kind === "slash" ||
      action.kind === "spin" ||
      action.kind === "dash")
  ) {
    const spin = action.kind === "spin";
    const damage = action.kind === "dash" ? DASH_DAMAGE : SWORD_DAMAGE;
    for (const enemy of [...state.enemies]) {
      const stats = KINDS[enemy.kind];
      const hit = spin
        ? dist(player.x, player.y - BODY_LIFT, enemy.x, enemy.y - enemy.z) <
          SPIN_RADIUS + stats.hw
        : overlaps(
            pose.x,
            pose.y,
            SWORD_HALF,
            SWORD_HALF,
            enemy.x,
            enemy.y - enemy.z,
            stats.hw,
            stats.hh + stats.hh,
          );
      if (hit && !action.hit.has(enemy.id)) {
        action.hit.add(enemy.id);
        hurtEnemy(state, report, enemy, {
          damage: spin ? SPIN_DAMAGE : damage,
          fromX: player.x,
          fromY: player.y,
          blockable: true,
          source: "sword",
        });
      }
    }
    const reach = spin ? SPIN_RADIUS : SWORD_HALF;
    const cx = spin ? player.x : pose.x;
    const cy = spin ? player.y : pose.y + BODY_LIFT / 2;
    cutArea(
      state,
      report,
      cx - reach,
      cy - reach,
      cx + reach,
      cy + reach,
      true,
    );
  }
}

/**
 * Cuts every bush and tuft of grass in a rectangle.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @param x0 - left edge, world px
 * @param y0 - top edge
 * @param x1 - right edge
 * @param y1 - bottom edge
 * @param bushes - also bushes, not only grass
 */
export function cutArea(
  state: GameState,
  report: StepReport,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  bushes: boolean,
): void {
  for (let ty = Math.floor(y0 / TILE); ty <= Math.floor(y1 / TILE); ty++) {
    for (let tx = Math.floor(x0 / TILE); tx <= Math.floor(x1 / TILE); tx++) {
      const letter = tileAt(state.area, tx, ty);
      const index = tileIndex(state.area, tx, ty);
      const allowed = bushes || letter === TILE_CHARS.tallGrass;
      if (isCuttable(letter) && allowed && !state.cut.has(index)) {
        state.cut.set(index, state.time);
        const cx = tx * TILE + TILE / 2;
        const cy = ty * TILE + TILE / 2;
        const grass = letter === TILE_CHARS.tallGrass;
        burstLeaves(state, cx, cy, grass);
        rollDrop(state, grass ? GRASS_DROPS : BUSH_DROPS, cx, cy);
        report.cuts += 1;
        report.events.push("cut");
      }
    }
  }
}

/**
 * Shoots an arrow the way Link faces.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @returns true if there was an arrow to shoot
 */
export function fireArrow(state: GameState, report: StepReport): boolean {
  const player = state.player;
  const fired = state.inv.arrows > 0;
  if (fired) {
    const v = DIR_VEC[player.facing];
    state.inv.arrows -= 1;
    state.shots.push({
      kind: "arrow",
      x: player.x + v.x * SWORD_REACH,
      y: player.y - BODY_LIFT / 2 + v.y * SWORD_REACH,
      vx: v.x * ARROW_SPEED,
      vy: v.y * ARROW_SPEED,
      facing: player.facing,
      life: ARROW_LIFE,
      fromPlayer: true,
      fire: false,
    });
    report.events.push("arrow");
  } else {
    state.banner = { text: MESSAGES.noArrows, t: BANNER_SHORT };
  }
  return fired;
}

/**
 * Puts a lit bomb down in front of Link.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @returns true if a bomb was placed
 */
export function placeBomb(state: GameState, report: StepReport): boolean {
  const player = state.player;
  const placed = state.inv.bombs > 0 && state.bombs.length < MAX_LIVE_BOMBS;
  if (placed) {
    const v = DIR_VEC[player.facing];
    state.inv.bombs -= 1;
    state.bombs.push({
      x: player.x + v.x * BOMB_DROP,
      y: player.y + v.y * BOMB_DROP,
      fuse: BOMB_FUSE,
    });
    report.events.push("bombPlace");
  } else if (state.inv.bombs <= 0) {
    state.banner = { text: MESSAGES.noBombs, t: BANNER_SHORT };
  }
  return placed;
}

/**
 * Throws the rock Link carries the way he faces.
 *
 * @param state - the game
 * @param report - where to note what happened
 */
export function throwRock(state: GameState, report: StepReport): void {
  const player = state.player;
  const v = DIR_VEC[player.facing];
  state.shots.push({
    kind: "boulder",
    x: player.x,
    y: player.y - BODY_LIFT,
    vx: v.x * THROW_SPEED,
    vy: v.y * THROW_SPEED,
    facing: player.facing,
    life: THROW_LIFE,
    fromPlayer: true,
    fire: false,
  });
  report.events.push("throw");
}

/**
 * Throws the boomerang, if it is not already out.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @param aimX - stick direction, or zero to throw straight ahead
 * @param aimY - stick direction
 * @returns true if it was thrown
 */
export function throwBoomerang(
  state: GameState,
  report: StepReport,
  aimX: number,
  aimY: number,
): boolean {
  const player = state.player;
  const thrown = state.boomerang === null;
  if (thrown) {
    const v = DIR_VEC[player.facing];
    const length = Math.hypot(aimX, aimY);
    const ux = length > 0 ? aimX / length : v.x;
    const uy = length > 0 ? aimY / length : v.y;
    state.boomerang = {
      x: player.x,
      y: player.y - BODY_LIFT,
      vx: ux * BOOMERANG_OUT,
      vy: uy * BOOMERANG_OUT,
      t: 0,
      returning: false,
      carried: [],
      hit: new Set(),
    };
    report.events.push("boomerang");
  }
  return thrown;
}

/**
 * Flies arrows and rocks, burns bombs down, brings the boomerang back and
 * lets Link pick things up.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @param dt - seconds since the last step
 */
export function stepItems(
  state: GameState,
  report: StepReport,
  dt: number,
): void {
  stepShots(state, report, dt);
  stepBombs(state, report, dt);
  stepBoomerang(state, report, dt);
  stepPickups(state, report, dt);
}

/** Moves every shot and resolves what it hits. */
function stepShots(state: GameState, report: StepReport, dt: number): void {
  const keep = [];
  for (const shot of state.shots) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    let gone = shot.life <= 0;
    if (!gone && (shot.kind === "arrow" || shot.kind === "flame")) {
      gone = burnThrough(state, shot, report);
    }
    if (!gone && shot.kind === "flame") {
      cutArea(
        state,
        report,
        shot.x - FLAME_BURN,
        shot.y - FLAME_BURN,
        shot.x + FLAME_BURN,
        shot.y + FLAME_BURN,
        true,
      );
    }
    if (!gone && shotBlocked(state, shot.x, shot.y)) {
      gone = true;
      addEffect(state, "spark", shot.x, shot.y);
    }
    if (!gone) {
      gone = shot.fromPlayer
        ? shotHitsMonster(state, shot, report)
        : shotHitsLink(state, shot, report);
    }
    if (gone && shot.kind === "boulder") {
      addEffect(state, "poof", shot.x, shot.y);
      report.events.push("cut");
    }
    if (!gone) {
      keep.push(shot);
    }
  }
  state.shots = keep;
}

/**
 * Lights a cold torch, if there is one on the tile.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @param tx - tile column
 * @param ty - tile row
 * @returns true when a torch caught fire
 */
export function lightTorch(
  state: GameState,
  report: StepReport,
  tx: number,
  ty: number,
): boolean {
  const flag = tileFlag("torch", state.area, tx, ty);
  const lit =
    tileAt(state.area, tx, ty) === TILE_CHARS.torch && !state.flags.has(flag);
  if (lit) {
    state.flags.add(flag);
    report.events.push("torch");
    addEffect(state, "spark", tx * TILE + TILE / 2, ty * TILE + TILE / 2);
  }
  return lit;
}

/**
 * An arrow passing a brazier catches fire; a burning arrow or a flame lights
 * a cold torch and is spent on it.
 *
 * @returns true when the shot is used up
 */
function burnThrough(
  state: GameState,
  shot: Shot,
  report: StepReport,
): boolean {
  const tx = Math.floor(shot.x / TILE);
  const ty = Math.floor(shot.y / TILE);
  const letter = tileAt(state.area, tx, ty);
  let spent = false;
  if (letter === TILE_CHARS.brazier && !shot.fire) {
    shot.fire = true;
    report.events.push("torch");
  } else if (letter === TILE_CHARS.torch) {
    if (shot.fire) {
      lightTorch(state, report, tx, ty);
    }
    spent = true;
  }
  return spent;
}

/** One of Link's shots meets a monster. */
function shotHitsMonster(
  state: GameState,
  shot: Shot,
  report: StepReport,
): boolean {
  const target = state.enemies.find((enemy) =>
    hitsEnemy(enemy, shot.x, shot.y),
  );
  if (target !== undefined) {
    const boulder = shot.kind === "boulder";
    const flame = shot.kind === "flame";
    let damage = ARROW_DAMAGE;
    let source: "bomb" | "fire" | "arrow" = "arrow";
    if (boulder) {
      damage = BOULDER_DAMAGE;
      source = "bomb";
    } else if (flame) {
      damage = FLAME_DAMAGE;
      source = "fire";
    }
    hurtEnemy(state, report, target, {
      damage,
      fromX: shot.x - shot.vx,
      fromY: shot.y - shot.vy,
      blockable: !boulder,
      source,
    });
  }
  return target !== undefined;
}

/** A monster's shot meets Link - or his shield. */
function shotHitsLink(
  state: GameState,
  shot: Shot,
  report: StepReport,
): boolean {
  const player = state.player;
  const hit =
    overlaps(
      shot.x,
      shot.y,
      SHOT_HALF,
      SHOT_HALF,
      player.x,
      player.y - BODY_LIFT / 2,
      PLAYER_HW,
      PLAYER_HH + PLAYER_HH,
    ) && !evading(player);
  if (hit) {
    const fire = shot.kind === "fireball";
    // Only a raised shield guards - Link carries it out of sight otherwise.
    const guarding = !player.small && player.shieldUp && !fire;
    const fromX = shot.x - shot.vx;
    const fromY = shot.y - shot.vy;
    if (guarding && facesBlow(state, fromX, fromY)) {
      report.events.push("block");
      addEffect(state, "spark", shot.x, shot.y);
    } else {
      hurtPlayer(
        state,
        report,
        fire ? FIRE_DAMAGE : ROCK_DAMAGE,
        fromX,
        fromY,
        false,
      );
    }
  }
  return hit;
}

/** Whether a point lies on a monster's body. */
function hitsEnemy(enemy: Enemy, x: number, y: number): boolean {
  const stats = KINDS[enemy.kind];
  return overlaps(
    x,
    y,
    SHOT_HALF,
    SHOT_HALF,
    enemy.x,
    enemy.y - enemy.z - stats.hh,
    stats.hw,
    stats.hh + stats.hh,
  );
}

/** Burns fuses down and sets off the bombs that are due. */
function stepBombs(state: GameState, report: StepReport, dt: number): void {
  const keep = [];
  for (const bomb of state.bombs) {
    bomb.fuse -= dt;
    if (bomb.fuse <= 0) {
      explode(state, report, bomb.x, bomb.y);
    } else {
      keep.push(bomb);
    }
  }
  state.bombs = keep;
}

/** A bomb going off: hurts all around, opens cracked rocks, cuts bushes. */
function explode(
  state: GameState,
  report: StepReport,
  x: number,
  y: number,
): void {
  addEffect(state, "explosion", x, y);
  report.events.push("explode");
  for (const enemy of [...state.enemies]) {
    if (dist(x, y, enemy.x, enemy.y) < BLAST_RADIUS + KINDS[enemy.kind].hw) {
      hurtEnemy(state, report, enemy, {
        damage: BOMB_DAMAGE,
        fromX: x,
        fromY: y,
        blockable: false,
        source: "bomb",
      });
    }
  }
  const player = state.player;
  if (dist(x, y, player.x, player.y) < BLAST_RADIUS) {
    hurtPlayer(state, report, BOMB_SELF_DAMAGE, x, y, false);
  }
  for (
    let ty = Math.floor((y - BLAST_RADIUS) / TILE);
    ty <= Math.floor((y + BLAST_RADIUS) / TILE);
    ty++
  ) {
    for (
      let tx = Math.floor((x - BLAST_RADIUS) / TILE);
      tx <= Math.floor((x + BLAST_RADIUS) / TILE);
      tx++
    ) {
      const near =
        dist(x, y, tx * TILE + TILE / 2, ty * TILE + TILE / 2) <
        BLAST_RADIUS + TILE / 2;
      if (near) {
        blowOpen(state, report, tx, ty);
      }
    }
  }
  cutArea(
    state,
    report,
    x - BLAST_RADIUS,
    y - BLAST_RADIUS,
    x + BLAST_RADIUS,
    y + BLAST_RADIUS,
    true,
  );
}

/** Opens a cracked rock or wall - all of it, through both walls of a door. */
function blowOpen(
  state: GameState,
  report: StepReport,
  tx: number,
  ty: number,
): void {
  const todo = [{ tx, ty }];
  while (todo.length > 0) {
    const tile = todo.pop();
    if (tile !== undefined) {
      const letter = tileAt(state.area, tile.tx, tile.ty);
      const key = openedKey(state.area, tile.tx, tile.ty);
      const cracked =
        letter === TILE_CHARS.crackedRock || letter === TILE_CHARS.crackedWall;
      if (cracked && !state.opened.has(key)) {
        state.opened.add(key);
        addEffect(
          state,
          "poof",
          tile.tx * TILE + TILE / 2,
          tile.ty * TILE + TILE / 2,
        );
        if (!report.events.includes("secret")) {
          report.events.push("secret");
        }
        if (letter === TILE_CHARS.crackedWall) {
          for (const v of Object.values(DIR_VEC)) {
            todo.push({ tx: tile.tx + v.x, ty: tile.ty + v.y });
          }
        }
      }
    }
  }
}

/** Flies the boomerang out and back, stunning and fetching on the way. */
function stepBoomerang(state: GameState, report: StepReport, dt: number): void {
  const boomerang = state.boomerang;
  if (boomerang !== null) {
    const player = state.player;
    boomerang.t += dt;
    if (boomerang.returning) {
      const dx = player.x - boomerang.x;
      const dy = player.y - BODY_LIFT - boomerang.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      boomerang.vx = (dx / length) * BOOMERANG_BACK;
      boomerang.vy = (dy / length) * BOOMERANG_BACK;
    }
    boomerang.x += boomerang.vx * dt;
    boomerang.y += boomerang.vy * dt;
    if (
      !boomerang.returning &&
      (boomerang.t > BOOMERANG_RANGE ||
        shotBlocked(state, boomerang.x, boomerang.y + BODY_LIFT))
    ) {
      boomerang.returning = true;
    }
    for (const enemy of [...state.enemies]) {
      if (
        !boomerang.hit.has(enemy.id) &&
        hitsEnemy(enemy, boomerang.x, boomerang.y)
      ) {
        boomerang.hit.add(enemy.id);
        boomerang.returning = true;
        hurtEnemy(state, report, enemy, {
          damage: enemy.kind === "keese" ? 1 : 0,
          fromX: player.x,
          fromY: player.y,
          stun: BOOMERANG_STUN,
          blockable: true,
          source: "boomerang",
        });
        addEffect(state, "spark", boomerang.x, boomerang.y);
      }
    }
    for (const pickup of state.pickups) {
      if (
        pickup.spot === null &&
        dist(pickup.x, pickup.y - pickup.z, boomerang.x, boomerang.y) <
          PICKUP_HALF + SHOT_HALF
      ) {
        boomerang.carried.push(pickup);
      }
    }
    state.pickups = state.pickups.filter(
      (pickup) => !boomerang.carried.includes(pickup),
    );
    for (const pickup of boomerang.carried) {
      pickup.x = boomerang.x;
      pickup.y = boomerang.y;
      pickup.z = 0;
    }
    cutArea(
      state,
      report,
      boomerang.x - SHOT_HALF,
      boomerang.y + BODY_LIFT - SHOT_HALF,
      boomerang.x + SHOT_HALF,
      boomerang.y + BODY_LIFT + SHOT_HALF,
      false,
    );
    if (
      boomerang.returning &&
      dist(boomerang.x, boomerang.y, player.x, player.y - BODY_LIFT) <
        BOOMERANG_CATCH
    ) {
      for (const pickup of boomerang.carried) {
        collectPickup(state, report, pickup.kind, pickup.spot);
      }
      state.boomerang = null;
    }
  }
}

/** Bounces pickups, ages them, and collects those Link walks over. */
function stepPickups(state: GameState, report: StepReport, dt: number): void {
  const player = state.player;
  const keep = [];
  for (const pickup of state.pickups) {
    if (pickup.z > 0 || pickup.vz > 0) {
      pickup.vz -= PICKUP_GRAVITY * dt;
      pickup.z = Math.max(0, pickup.z + pickup.vz * dt);
      if (pickup.z <= 0) {
        pickup.vz = 0;
      }
    }
    if (pickup.life !== null) {
      pickup.life -= dt;
    }
    const touched =
      pickup.z < PICKUP_HALF &&
      overlaps(
        pickup.x,
        pickup.y,
        PICKUP_HALF,
        PICKUP_HALF,
        player.x,
        player.y - BODY_LIFT / 2,
        PLAYER_HW,
        PLAYER_HH + PLAYER_HH,
      );
    if (touched) {
      collectPickup(state, report, pickup.kind, pickup.spot);
    } else if (pickup.life === null || pickup.life > 0) {
      keep.push(pickup);
    }
  }
  state.pickups = keep;
}

/**
 * What picking something up does.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @param kind - what was picked up
 * @param spot - for lasting finds, the flag that marks them as taken
 */
export function collectPickup(
  state: GameState,
  report: StepReport,
  kind: PickupKind,
  spot: string | null,
): void {
  const player = state.player;
  const value = RUPEE_VALUE[kind];
  if (value !== undefined) {
    state.inv.rupees = Math.min(MAX_RUPEES, state.inv.rupees + value);
    report.rupees += value;
    report.events.push("rupee");
  } else {
    switch (kind) {
      case "heart":
        player.hp = Math.min(
          player.maxHearts * HALVES_PER_HEART,
          player.hp + HEART_HEAL,
        );
        report.events.push("heart");
        break;
      case "arrows":
        state.inv.arrows = Math.min(MAX_ARROWS, state.inv.arrows + AMMO_PACK);
        report.events.push("item");
        break;
      case "bombs":
        state.inv.bombs = Math.min(MAX_BOMBS, state.inv.bombs + AMMO_PACK);
        report.events.push("item");
        break;
      case "piece":
        if (spot !== null) {
          state.flags.add(spot);
        }
        give(state, "piece", report);
        break;
      default:
        if (spot !== null) {
          state.takenContainers.add(containerIndex(spot));
        }
        report.events.push("container");
        give(state, "container", report);
    }
  }
}
