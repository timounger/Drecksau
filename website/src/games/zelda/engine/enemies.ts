/**
 * The monsters: when they come back, and how each kind moves and attacks.
 *
 * @module
 * @remarks
 * Every kind has a handful of modes - walking, pausing, hopping, charging -
 * and a timer that runs down to the next one. That is all the "AI" there is,
 * and it is enough for each to feel different: the octorok wanders and spits,
 * the slime bounces after you, the bat flutters, the moblin charges once it
 * has seen you, the tektite leaps and the black knight blocks from the front.
 */
import { stepBeetle, stepGolem } from "./boss";
import { BOSS_FLAG, MINIBOSS_FLAG } from "./clearing";
import { KINDS, hurtPlayer, unit } from "./combat";
import { DIR_VEC, between, dirOf, dist, evading, moveBody } from "./physics";
import { AREAS, ROOM_COLS, ROOM_ROWS, TILE, roomOrigin } from "./tiles";
import type {
  Dir,
  Enemy,
  EnemyKind,
  GameState,
  Spawn,
  StepReport,
} from "./types";

/** Screen size in world pixels - the GBA's 240 x 160. */
export const VIEW_W = 240;
export const VIEW_H = 160;

/** Monsters further than this from Link (in px) are frozen. */
const ACTIVE_X = 200;
const ACTIVE_Y = 150;

/** A spawn point must be this far outside the screen to come back, px. */
const RESPAWN_MARGIN = 24;

/** Gravity for hopping monsters, px/s². */
const GRAVITY = 440;

/** Above this height a hopping monster passes over Link harmlessly. */
const CONTACT_Z = 7;

/** The four directions, to pick from at random. */
const DIRS: readonly Dir[] = ["up", "down", "left", "right"];

/** Chance an octorok turns towards Link rather than anywhere. */
const OCTOROK_AIM = 0.45;

/** How far an octorok sees to spit at Link, px. */
const OCTOROK_RANGE = 120;

/** Speed of an octorok's rock, px/s. */
const ROCK_SPEED = 105;

/** Seconds a rock flies. */
const ROCK_LIFE = 1.6;

/** How far a slime or tektite notices Link, px. */
const HOP_RANGE = 110;

/** Upward speed of a slime's hop, px/s. */
const CHU_HOP = 120;

/** Upward speed of a tektite's leap, px/s. */
const TEK_HOP = 150;

/** How close Link must come to wake a bat, px. */
const KEESE_WAKE = 64;

/** Height a bat flies at, px. */
const KEESE_HEIGHT = 8;

/** Seconds between a flying bat's changes of course. */
const KEESE_TURN = 0.3;

/** How far ahead a moblin sees, px. */
const MOBLIN_SIGHT = 100;

/** How far off its line of sight a moblin still notices Link, px. */
const MOBLIN_LANE = 16;

/** A charging moblin's speed, px/s. */
const MOBLIN_CHARGE = 92;

/** How far the moblin's spear reaches out in front, px. */
const SPEAR_REACH = 7;

/** How close the black knight wakes up, px. */
const DARKNUT_WAKE = 130;

/** How close it gets before it lunges, px. */
const DARKNUT_REACH = 30;

/** Its lunge speed, px/s. */
const DARKNUT_LUNGE = 135;

/** Mode timers in seconds: [shortest, longest]. */
type Span = readonly [number, number];

/* eslint-disable @typescript-eslint/no-magic-numbers -- how long each mode
   lasts, in seconds, per kind. */
const SPANS = {
  octorokWalk: [0.6, 1.6],
  octorokPause: [0.4, 1.0],
  chuIdle: [0.7, 1.3],
  keeseFly: [2.5, 4],
  keeseRest: [1.5, 3],
  moblinPatrol: [1.6, 3],
  moblinAlert: [0.35, 0.35],
  moblinCharge: [1.4, 1.4],
  moblinRest: [0.8, 1.1],
  tekCrouch: [0.6, 1.3],
  darknutWindup: [0.45, 0.45],
  darknutLunge: [0.25, 0.25],
  darknutRecover: [0.7, 0.9],
} as const satisfies Record<string, Span>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Link's body box, half width and half height. */
export const PLAYER_HW = 5;
export const PLAYER_HH = 4;

/** The mode each kind starts in. */
const START_MODE: Readonly<Record<EnemyKind, string>> = {
  octorok: "pause",
  chuchu: "idle",
  keese: "rest",
  moblin: "patrol",
  tektite: "crouch",
  darknut: "walk",
  beetle: "walk",
  golem: "wake",
};

/** What each kind does with its step. */
const BEHAVIOUR: Readonly<
  Record<
    EnemyKind,
    (state: GameState, enemy: Enemy, dt: number, report: StepReport) => void
  >
> = {
  octorok: stepOctorok,
  chuchu: stepChuchu,
  keese: stepKeese,
  moblin: stepMoblin,
  tektite: stepTektite,
  darknut: stepDarknut,
  beetle: stepBeetle,
  golem: stepGolem,
};

/**
 * Moves every monster on for one step, and brings back those that are due.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @param dt - seconds since the last step
 */
export function stepEnemies(
  state: GameState,
  report: StepReport,
  dt: number,
): void {
  respawn(state);
  const player = state.player;
  for (const enemy of [...state.enemies]) {
    const active =
      state.room >= 0 ||
      (Math.abs(enemy.x - player.x) < ACTIVE_X &&
        Math.abs(enemy.y - player.y) < ACTIVE_Y);
    if (active && state.enemies.includes(enemy)) {
      stepOne(state, report, enemy, dt);
    }
  }
}

/** Ticks timers, applies knockback and runs the kind's behaviour. */
function stepOne(
  state: GameState,
  report: StepReport,
  enemy: Enemy,
  dt: number,
): void {
  const stats = KINDS[enemy.kind];
  enemy.anim += dt;
  enemy.hurt = Math.max(0, enemy.hurt - dt);
  if (enemy.knockT > 0) {
    enemy.knockT -= dt;
    moveBody(
      state,
      enemy,
      enemy.knockX * dt,
      enemy.knockY * dt,
      stats.hw,
      stats.hh,
    );
  } else if (enemy.stun > 0) {
    enemy.stun -= dt;
    fall(enemy, dt);
  } else {
    enemy.t -= dt;
    BEHAVIOUR[enemy.kind](state, enemy, dt, report);
  }
  touchPlayer(state, report, enemy);
}

/** Wanders tile to tile; pauses, and sometimes spits a rock. */
function stepOctorok(state: GameState, enemy: Enemy, dt: number): void {
  const stats = KINDS.octorok;
  if (enemy.mode === "walk") {
    const v = DIR_VEC[enemy.facing];
    const stopped = moveBody(
      state,
      enemy,
      v.x * stats.speed * dt,
      v.y * stats.speed * dt,
      stats.hw,
      stats.hh,
    );
    if (enemy.t <= 0 || stopped) {
      setMode(enemy, "pause", SPANS.octorokPause);
    }
  } else if (enemy.t <= 0) {
    const player = state.player;
    if (
      dist(enemy.x, enemy.y, player.x, player.y) < OCTOROK_RANGE &&
      Math.random() < OCTOROK_AIM + OCTOROK_AIM
    ) {
      spit(state, enemy);
    }
    enemy.facing =
      Math.random() < OCTOROK_AIM
        ? dirOf(player.x - enemy.x, player.y - enemy.y, enemy.facing)
        : DIRS[Math.floor(Math.random() * DIRS.length)];
    setMode(enemy, "walk", SPANS.octorokWalk);
  }
}

/** An octorok's rock, flying the way it faces. */
function spit(state: GameState, enemy: Enemy): void {
  const v = DIR_VEC[enemy.facing];
  state.shots.push({
    kind: "rock",
    x: enemy.x + v.x * KINDS.octorok.hw,
    y: enemy.y + v.y * KINDS.octorok.hh,
    vx: v.x * ROCK_SPEED,
    vy: v.y * ROCK_SPEED,
    facing: enemy.facing,
    life: ROCK_LIFE,
    fromPlayer: false,
    fire: false,
  });
}

/** Wobbles in place, then hops - towards Link when he is near. */
function stepChuchu(state: GameState, enemy: Enemy, dt: number): void {
  if (enemy.mode === "hop") {
    airborne(state, enemy, dt);
    if (enemy.z <= 0) {
      setMode(enemy, "idle", SPANS.chuIdle);
    }
  } else if (enemy.t <= 0) {
    launch(state, enemy, KINDS.chuchu.speed, CHU_HOP);
  }
}

/** Sleeps until Link comes close, then flutters about erratically. */
function stepKeese(state: GameState, enemy: Enemy, dt: number): void {
  const player = state.player;
  if (enemy.mode === "fly") {
    enemy.z = Math.min(KEESE_HEIGHT, enemy.z + KEESE_HEIGHT * dt * 2);
    if (enemy.anim % KEESE_TURN < dt) {
      const to = unit(player.x - enemy.x, player.y - enemy.y);
      const angle = Math.atan2(to.y, to.x) + (between(-1, 1) * Math.PI) / 2;
      enemy.vx = Math.cos(angle) * KINDS.keese.speed;
      enemy.vy = Math.sin(angle) * KINDS.keese.speed;
    }
    const box = bounds(state);
    enemy.x = clamp(enemy.x + enemy.vx * dt, box.x0, box.x1);
    enemy.y = clamp(enemy.y + enemy.vy * dt, box.y0, box.y1);
    if (enemy.t <= 0) {
      setMode(enemy, "rest", SPANS.keeseRest);
    }
  } else {
    enemy.z = Math.max(0, enemy.z - KEESE_HEIGHT * dt * 2);
    const near = dist(enemy.x, enemy.y, player.x, player.y) < KEESE_WAKE;
    if (near && enemy.t <= 0) {
      setMode(enemy, "fly", SPANS.keeseFly);
    }
  }
}

/** Patrols; once it sees Link straight ahead it stops, then charges. */
function stepMoblin(state: GameState, enemy: Enemy, dt: number): void {
  const stats = KINDS.moblin;
  const v = DIR_VEC[enemy.facing];
  switch (enemy.mode) {
    case "alert":
      if (enemy.t <= 0) {
        setMode(enemy, "charge", SPANS.moblinCharge);
      }
      break;
    case "charge": {
      const stopped = moveBody(
        state,
        enemy,
        v.x * MOBLIN_CHARGE * dt,
        v.y * MOBLIN_CHARGE * dt,
        stats.hw,
        stats.hh,
      );
      if (stopped || enemy.t <= 0) {
        setMode(enemy, "rest", SPANS.moblinRest);
      }
      break;
    }
    case "rest":
      if (enemy.t <= 0) {
        enemy.facing = DIRS[Math.floor(Math.random() * DIRS.length)];
        setMode(enemy, "patrol", SPANS.moblinPatrol);
      }
      break;
    default: {
      const stopped = moveBody(
        state,
        enemy,
        v.x * stats.speed * dt,
        v.y * stats.speed * dt,
        stats.hw,
        stats.hh,
      );
      if (sees(state, enemy)) {
        setMode(enemy, "alert", SPANS.moblinAlert);
      } else if (stopped || enemy.t <= 0) {
        setMode(enemy, "rest", SPANS.moblinRest);
      }
    }
  }
}

/** Whether Link stands in front of a monster, within sight. */
function sees(state: GameState, enemy: Enemy): boolean {
  const v = DIR_VEC[enemy.facing];
  const dx = state.player.x - enemy.x;
  const dy = state.player.y - enemy.y;
  const along = dx * v.x + dy * v.y;
  const lane = Math.abs(dx * v.y - dy * v.x);
  return along > 0 && along < MOBLIN_SIGHT && lane < MOBLIN_LANE;
}

/** Crouches, then leaps - at Link when he is in range. */
function stepTektite(state: GameState, enemy: Enemy, dt: number): void {
  if (enemy.mode === "jump") {
    airborne(state, enemy, dt);
    if (enemy.z <= 0) {
      setMode(enemy, "crouch", SPANS.tekCrouch);
    }
  } else if (enemy.t <= 0) {
    launch(state, enemy, KINDS.tektite.speed, TEK_HOP);
    enemy.mode = "jump";
  }
}

/** Walks at Link once he is near; winds up, lunges, recovers. */
function stepDarknut(state: GameState, enemy: Enemy, dt: number): void {
  const stats = KINDS.darknut;
  const player = state.player;
  const d = dist(enemy.x, enemy.y, player.x, player.y);
  switch (enemy.mode) {
    case "windup":
      if (enemy.t <= 0) {
        setMode(enemy, "lunge", SPANS.darknutLunge);
      }
      break;
    case "lunge": {
      const v = DIR_VEC[enemy.facing];
      moveBody(
        state,
        enemy,
        v.x * DARKNUT_LUNGE * dt,
        v.y * DARKNUT_LUNGE * dt,
        stats.hw,
        stats.hh,
      );
      if (enemy.t <= 0) {
        setMode(enemy, "recover", SPANS.darknutRecover);
      }
      break;
    }
    case "recover":
      if (enemy.t <= 0) {
        enemy.mode = "walk";
      }
      break;
    default:
      if (d < DARKNUT_WAKE) {
        enemy.facing = dirOf(
          player.x - enemy.x,
          player.y - enemy.y,
          enemy.facing,
        );
        const to = unit(player.x - enemy.x, player.y - enemy.y);
        moveBody(
          state,
          enemy,
          to.x * stats.speed * dt,
          to.y * stats.speed * dt,
          stats.hw,
          stats.hh,
        );
        if (d < DARKNUT_REACH) {
          setMode(enemy, "windup", SPANS.darknutWindup);
        }
      }
  }
}

/** Starts a hop: up, and sideways towards Link or anywhere. */
function launch(
  state: GameState,
  enemy: Enemy,
  speed: number,
  up: number,
): void {
  const player = state.player;
  const near = dist(enemy.x, enemy.y, player.x, player.y) < HOP_RANGE;
  const angle = near
    ? Math.atan2(player.y - enemy.y, player.x - enemy.x)
    : between(0, Math.PI * 2);
  enemy.vx = Math.cos(angle) * speed;
  enemy.vy = Math.sin(angle) * speed;
  enemy.vz = up;
  enemy.z = 0;
  enemy.mode = "hop";
  enemy.facing = dirOf(enemy.vx, enemy.vy, enemy.facing);
}

/** Flies a hopping monster on and lets gravity pull it down. */
function airborne(state: GameState, enemy: Enemy, dt: number): void {
  const stats = KINDS[enemy.kind];
  moveBody(state, enemy, enemy.vx * dt, enemy.vy * dt, stats.hw, stats.hh);
  fall(enemy, dt);
}

/**
 * Gravity for anything in the air.
 *
 * @param enemy - the monster
 * @param dt - seconds since the last step
 */
export function fall(enemy: Enemy, dt: number): void {
  if (enemy.kind !== "keese" && (enemy.z > 0 || enemy.vz > 0)) {
    enemy.vz -= GRAVITY * dt;
    enemy.z = Math.max(0, enemy.z + enemy.vz * dt);
    if (enemy.z <= 0) {
      enemy.vz = 0;
    }
  }
}

/** Contact damage when a monster runs into Link. */
function touchPlayer(state: GameState, report: StepReport, enemy: Enemy): void {
  const stats = KINDS[enemy.kind];
  const player = state.player;
  const reach = enemy.kind === "moblin" ? SPEAR_REACH : 0;
  const v = DIR_VEC[enemy.facing];
  const cx = enemy.x + v.x * reach;
  const cy = enemy.y + v.y * reach;
  const lowEnough = enemy.kind === "keese" || enemy.z < CONTACT_Z;
  const harmless = enemy.mode === "stunned" || enemy.mode === "dazed";
  const touching =
    Math.abs(cx - player.x) < stats.hw + PLAYER_HW &&
    Math.abs(cy - player.y) < stats.hh + PLAYER_HH;
  if (
    touching &&
    lowEnough &&
    enemy.stun <= 0 &&
    !harmless &&
    !evading(player)
  ) {
    hurtPlayer(state, report, stats.damage, enemy.x, enemy.y, true);
  }
}

/**
 * Where a flying monster may go: the room it is in, or the whole area.
 *
 * @param state - the game
 * @returns the edges in area pixels
 */
export function bounds(state: GameState): {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
} {
  const map = AREAS[state.area];
  let box = { x0: 0, y0: 0, x1: map.width, y1: map.height };
  if (state.room >= 0) {
    const origin = roomOrigin(state.area, state.room);
    box = {
      x0: origin.x + TILE + KEESE_HEIGHT,
      y0: origin.y + TILE + KEESE_HEIGHT,
      x1: origin.x + (ROOM_COLS - 1) * TILE - KEESE_HEIGHT,
      y1: origin.y + (ROOM_ROWS - 1) * TILE,
    };
  }
  return box;
}

/** Brings back monsters whose time is up and whose home is off screen. */
function respawn(state: GameState): void {
  state.spawns.forEach((spawn, index) => {
    if (!spawn.alive && dueBack(state, spawn)) {
      state.enemies.push(makeEnemy(state, spawn, index));
      spawn.alive = true;
    }
  });
}

/** Whether a spawn point may bring its monster back now. */
function dueBack(state: GameState, spawn: Spawn): boolean {
  const beaten =
    (spawn.kind === "golem" && state.flags.has(BOSS_FLAG)) ||
    (spawn.kind === "beetle" && state.flags.has(MINIBOSS_FLAG));
  const here = spawn.area === state.area && spawn.room === state.room;
  let due = spawn.deadAt === null && here && !beaten;
  if (spawn.deadAt !== null) {
    const rested = state.time - spawn.deadAt > KINDS[spawn.kind].respawn;
    const offScreen =
      spawn.x < state.camX - RESPAWN_MARGIN ||
      spawn.x > state.camX + VIEW_W + RESPAWN_MARGIN ||
      spawn.y < state.camY - RESPAWN_MARGIN ||
      spawn.y > state.camY + VIEW_H + RESPAWN_MARGIN;
    due = rested && offScreen && here && !beaten;
  }
  return due;
}

/** A fresh monster at its spawn point. */
function makeEnemy(state: GameState, spawn: Spawn, index: number): Enemy {
  const stats = KINDS[spawn.kind];
  const enemy: Enemy = {
    id: state.nextId,
    spawn: index,
    kind: spawn.kind,
    x: spawn.x,
    y: spawn.y,
    z: 0,
    vz: 0,
    vx: 0,
    vy: 0,
    hp: stats.hp,
    facing: DIRS[Math.floor(Math.random() * DIRS.length)],
    mode: START_MODE[spawn.kind],
    t: between(0, 1),
    hurt: 0,
    stun: 0,
    knockX: 0,
    knockY: 0,
    knockT: 0,
    anim: between(0, 1),
  };
  state.nextId += 1;
  return enemy;
}

/**
 * Switches mode and draws its duration.
 *
 * @param enemy - the monster
 * @param mode - the new mode
 * @param span - shortest and longest time in it, seconds
 */
export function setMode(
  enemy: Enemy,
  mode: string,
  span: readonly [number, number],
): void {
  enemy.mode = mode;
  enemy.t = between(span[0], span[1]);
}

/** Keeps a value within bounds. */
function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}
