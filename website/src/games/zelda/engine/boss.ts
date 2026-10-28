/**
 * The temple's two guardians: the armoured beetle that charges along the
 * floor, and the stone golem with its single eye - fireballs, a leap that
 * brings the ceiling down, and an eye that is its only weak point.
 *
 * @module
 * @remarks
 * Both run on the same mode-and-timer scheme as every other monster. The
 * beetle can only be hurt from the side - or after it has rammed a wall and
 * lies dazed. The golem shrugs off every blow until an arrow finds its open
 * eye (or a bomb goes off beside it); then it stands stunned for a moment
 * and the sword can do its work.
 */
import { KINDS, hurtPlayer, unit } from "./combat";
import { addEffect } from "./effects";
import { bounds, fall, setMode } from "./enemies";
import { DIR_VEC, between, dirOf, dist, evading, moveBody } from "./physics";
import type { Enemy, GameState, StepReport } from "./types";

/** The beetle notices Link lined up within this many pixels. */
const BEETLE_LANE = 10;

/** The beetle's charge, px/s. */
const BEETLE_CHARGE = 150;

/** Gravity for the golem's leap and the falling rocks, px/s². */
const GRAVITY = 520;

/** Upward speed of the golem's leap, px/s. */
const LEAP_UP = 250;

/** Seconds the golem crouches before it leaps. */
const LEAP_CROUCH = 0.35;

/** Seconds the golem's eye stays open before the fireballs fly. */
const AIM_FIRE_AT = 0.55;

/** Fireball speed, px/s. */
const FIREBALL_SPEED = 95;

/** Seconds a fireball flies. */
const FIREBALL_LIFE = 2.6;

/** Angle between the three fireballs of a volley, radians. */
const FIREBALL_SPREAD = 0.38;

/** Height the golem's eye sits above its feet, px. */
const EYE_HEIGHT = 20;

/** Rocks that fall after each landing. */
const ROCKS_PER_SLAM = 4;

/** Height rocks fall from, px. */
const ROCK_HEIGHT = 150;

/** How close a falling rock must land to hurt Link, px. */
const ROCK_HIT = 10;

/** Damage of a falling rock, in half hearts. */
const ROCK_DAMAGE = 2;

/** Seconds the screen shakes when the golem lands. */
const SLAM_SHAKE = 0.45;

/** Seconds the screen shakes when the beetle hits a wall. */
const RAM_SHAKE = 0.2;

/** Seconds the golem stands still when it wakes. */
const WAKE_TIME = 1.2;

/** The golem leaps at most this many seconds' walk far. */
const LEAP_REACH = 4;

/** Below this much health the golem leaps more often than it shoots. */
const ANGRY_HP = 4;

/** Chance of a leap rather than a volley - calm, then angry. */
const LEAP_CHANCE = { calm: 0.4, angry: 0.65 } as const;

/** Mode timers in seconds: [shortest, longest]. */
type Span = readonly [number, number];

/* eslint-disable @typescript-eslint/no-magic-numbers -- how long each mode
   of the guardians lasts, in seconds */
const SPANS = {
  beetleWalk: [1.2, 2.2],
  beetleAim: [0.45, 0.45],
  beetleCharge: [1.6, 1.6],
  beetleDazed: [1.8, 1.8],
  golemWalk: [1.4, 2.4],
  golemAim: [1.4, 1.4],
  golemLand: [1.0, 1.4],
} as const satisfies Record<string, Span>;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * The armoured beetle: walks at Link, lines up, charges - and is dazed
 * when it rams a wall.
 *
 * @param state - the game
 * @param enemy - the beetle
 * @param dt - seconds since the last step
 * @param report - where to note what happened
 */
export function stepBeetle(
  state: GameState,
  enemy: Enemy,
  dt: number,
  report: StepReport,
): void {
  const stats = KINDS.beetle;
  const player = state.player;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  switch (enemy.mode) {
    case "aim":
      if (enemy.t <= 0) {
        setMode(enemy, "charge", SPANS.beetleCharge);
      }
      break;
    case "charge": {
      const v = DIR_VEC[enemy.facing];
      const stopped = moveBody(
        state,
        enemy,
        v.x * BEETLE_CHARGE * dt,
        v.y * BEETLE_CHARGE * dt,
        stats.hw,
        stats.hh,
      );
      if (stopped) {
        setMode(enemy, "dazed", SPANS.beetleDazed);
        state.shake = RAM_SHAKE;
        addEffect(state, "spark", enemy.x + v.x * stats.hw, enemy.y - stats.hh);
        report.events.push("slam");
      } else if (enemy.t <= 0) {
        setMode(enemy, "walk", SPANS.beetleWalk);
      }
      break;
    }
    case "dazed":
      if (enemy.t <= 0) {
        setMode(enemy, "walk", SPANS.beetleWalk);
      }
      break;
    default: {
      enemy.facing = dirOf(dx, dy, enemy.facing);
      const to = unit(dx, dy);
      moveBody(
        state,
        enemy,
        to.x * stats.speed * dt,
        to.y * stats.speed * dt,
        stats.hw,
        stats.hh,
      );
      const lined = Math.abs(dx) < BEETLE_LANE || Math.abs(dy) < BEETLE_LANE;
      if (enemy.t <= 0 || (lined && enemy.anim > 1)) {
        enemy.facing = dirOf(dx, dy, enemy.facing);
        setMode(enemy, "aim", SPANS.beetleAim);
      }
    }
  }
}

/**
 * The stone golem: stomps after Link, then either opens its eye and spits a
 * volley of fireballs or leaps and brings rocks down from the ceiling.
 *
 * @param state - the game
 * @param enemy - the golem
 * @param dt - seconds since the last step
 * @param report - where to note what happened
 */
export function stepGolem(
  state: GameState,
  enemy: Enemy,
  dt: number,
  report: StepReport,
): void {
  const stats = KINDS.golem;
  const player = state.player;
  switch (enemy.mode) {
    case "wake":
      if (enemy.anim >= WAKE_TIME) {
        setMode(enemy, "walk", SPANS.golemWalk);
      }
      break;
    case "aim": {
      const before = enemy.t + dt;
      const fireAt = SPANS.golemAim[0] - AIM_FIRE_AT;
      if (before > fireAt && enemy.t <= fireAt) {
        volley(state, enemy);
        report.events.push("torch");
      }
      if (enemy.t <= 0) {
        setMode(enemy, "walk", SPANS.golemWalk);
      }
      break;
    }
    case "crouch":
      if (enemy.t <= 0) {
        const to = unit(player.x - enemy.x, player.y - enemy.y);
        const reach = Math.min(
          dist(enemy.x, enemy.y, player.x, player.y),
          stats.speed * LEAP_REACH,
        );
        const airTime = (2 * LEAP_UP) / GRAVITY;
        enemy.vx = (to.x * reach) / airTime;
        enemy.vy = (to.y * reach) / airTime;
        enemy.vz = LEAP_UP;
        enemy.z = 1;
        enemy.mode = "leap";
      }
      break;
    case "leap":
      moveBody(state, enemy, enemy.vx * dt, enemy.vy * dt, stats.hw, stats.hh);
      enemy.vz -= GRAVITY * dt;
      enemy.z = Math.max(0, enemy.z + enemy.vz * dt);
      if (enemy.z <= 0) {
        land(state, enemy, report);
      }
      break;
    case "stunned":
      fall(enemy, dt);
      if (enemy.t <= 0) {
        setMode(enemy, "walk", SPANS.golemWalk);
      }
      break;
    default: {
      const to = unit(player.x - enemy.x, player.y - enemy.y);
      enemy.facing = dirOf(to.x, to.y, enemy.facing);
      moveBody(
        state,
        enemy,
        to.x * stats.speed * dt,
        to.y * stats.speed * dt,
        stats.hw,
        stats.hh,
      );
      if (enemy.t <= 0) {
        const chance =
          enemy.hp <= ANGRY_HP ? LEAP_CHANCE.angry : LEAP_CHANCE.calm;
        if (Math.random() < chance) {
          enemy.mode = "crouch";
          enemy.t = LEAP_CROUCH;
        } else {
          setMode(enemy, "aim", SPANS.golemAim);
        }
      }
    }
  }
}

/**
 * Lets the ceiling's rocks fall and hurt Link where they land.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @param dt - seconds since the last step
 */
export function stepRocks(
  state: GameState,
  report: StepReport,
  dt: number,
): void {
  const player = state.player;
  const keep = [];
  for (const rock of state.rocks) {
    rock.vz -= GRAVITY * dt;
    rock.z += rock.vz * dt;
    if (rock.z <= 0) {
      addEffect(state, "poof", rock.x, rock.y);
      if (
        dist(rock.x, rock.y, player.x, player.y) < ROCK_HIT &&
        !evading(player)
      ) {
        hurtPlayer(state, report, ROCK_DAMAGE, rock.x, rock.y, false);
      }
    } else {
      keep.push(rock);
    }
  }
  state.rocks = keep;
}

/** Three fireballs fanned out at Link. */
function volley(state: GameState, enemy: Enemy): void {
  const player = state.player;
  const angle = Math.atan2(
    player.y - (enemy.y - EYE_HEIGHT / 2),
    player.x - enemy.x,
  );
  for (const turn of [-1, 0, 1]) {
    const a = angle + turn * FIREBALL_SPREAD;
    state.shots.push({
      kind: "fireball",
      x: enemy.x,
      y: enemy.y - EYE_HEIGHT,
      vx: Math.cos(a) * FIREBALL_SPEED,
      vy: Math.sin(a) * FIREBALL_SPEED,
      facing: enemy.facing,
      life: FIREBALL_LIFE,
      fromPlayer: false,
      fire: true,
    });
  }
}

/** The golem comes down: the floor shakes and the ceiling crumbles. */
function land(state: GameState, enemy: Enemy, report: StepReport): void {
  enemy.z = 0;
  enemy.vz = 0;
  setMode(enemy, "walk", SPANS.golemLand);
  state.shake = SLAM_SHAKE;
  addEffect(state, "ring", enemy.x, enemy.y);
  report.events.push("slam");
  const box = bounds(state);
  const player = state.player;
  for (let i = 0; i < ROCKS_PER_SLAM; i++) {
    // One rock always aims at Link, the rest anywhere in the room.
    const aimed = i === 0;
    state.rocks.push({
      x: aimed ? player.x : between(box.x0, box.x1),
      y: aimed ? player.y : between(box.y0, box.y1),
      z: ROCK_HEIGHT + i * ROCK_HEIGHT * between(0, 1),
      vz: 0,
    });
  }
}
