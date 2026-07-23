/**
 * The pure Panzerkiste simulation: one {@link step} advances the world.
 *
 * @module
 * @remarks
 * Every function here is a pure transformation - it never touches the DOM, a
 * canvas or the clock. The React layer feeds it the elapsed time and the
 * player's {@link Input}; the same inputs and seed always play out identically,
 * which is what makes the enemy behaviour testable without a browser.
 */
import { LEVELS } from "./levels";
import { LEVELS_PER_BONUS, loadLevel, LIVES_START } from "./setup";
import { nextRandom, type RandomState } from "./random";
import {
  BULLET_BOUNCES,
  BULLET_RADIUS,
  BULLET_SPEED,
  ENEMY_MAX_MINES,
  ENEMY_MINE_RATE,
  ENEMY_TRAITS,
  EXPLOSION_TIME,
  MAX_STEP,
  MINE_BODY_RADIUS,
  MINE_FUSE,
  MINE_RADIUS,
  PLAYER_MAX_BULLETS,
  PLAYER_MAX_MINES,
  PLAYER_RELOAD,
  PLAYER_SPEED,
  TANK_RADIUS,
  TILE,
  type Bullet,
  type GameState,
  type Input,
  type Mine,
  type Tank,
  type Trail,
} from "./types";

/** Shortest time an enemy keeps a roaming heading, in seconds. */
const HEADING_MIN = 1;

/** Extra random time on top of {@link HEADING_MIN}, in seconds. */
const HEADING_SPAN = 2;

/** Largest aiming error of the least accurate enemy, in radians. */
const MAX_SPREAD = 0.5;

/** How many line-of-sight samples are taken per tile along a shot's path. */
const LOS_SAMPLES_PER_TILE = 3;

/** How far apart line-of-sight samples are taken, in pixels. */
const LOS_STEP = TILE / LOS_SAMPLES_PER_TILE;

/** How far a tank must drive before it drops another trail breadcrumb, px. */
const TRAIL_STEP = 6;

/** Time step the bank-shot path tracer walks with, in seconds. */
const TRACE_DT = 0.02;

/** Most steps the bank-shot tracer walks before giving up. */
const TRACE_STEPS = 320;

/** A no-op input: stand still, hold fire, no aim change. */
export const IDLE_INPUT: Input = {
  move: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
  fire: false,
  layMine: false,
};

/**
 * Advances the whole world by `dt` seconds.
 *
 * @param state - the current state
 * @param input - what the first player (id "player") asks of their tank
 * @param dt - elapsed time in seconds (clamped to {@link MAX_STEP})
 * @param input2 - the second player (id "player2") input, for co-op; idle if omitted
 * @returns the next state
 */
export function step(
  state: GameState,
  input: Input,
  dt: number,
  input2: Input = IDLE_INPUT,
): GameState {
  let result: GameState;
  if (state.phase !== "playing") {
    result = state;
  } else {
    const time = state.time + Math.min(dt, MAX_STEP);
    const acted = actTanks(state, input, input2, time, dt);
    const shots = advanceBullets(state, acted.tanks, acted.newBullets, dt);
    // A shell that reaches a mine sets it off at once; the mines then detonate.
    const armed = triggerMinesByBullets(
      shots.bullets,
      [...state.mines, ...acted.newMines],
      time,
    );
    const blasts = advanceMines(
      state,
      armed.mines,
      shots.tanks,
      armed.bullets,
      time,
    );
    // Dead enemies leave the field; the player stays so the result can respawn.
    const tanks = blasts.tanks.filter(
      (tank) => tank.kind === "player" || tank.alive,
    );
    // Each enemy that just died leaves a white X on the floor for the round.
    const newMarks = blasts.tanks
      .filter((tank) => tank.kind !== "player" && !tank.alive)
      .map((tank) => ({ x: tank.x, y: tank.y }));
    result = resolve({
      ...state,
      tanks,
      bullets: blasts.bullets,
      mines: blasts.mines,
      explosions: blasts.explosions,
      marks: [...state.marks, ...newMarks],
      trails: extendTrails(state.trails, tanks),
      walls: blasts.walls,
      breakable: blasts.breakable,
      time,
      random: acted.random,
      nextId: acted.nextId,
    });
  }
  return result;
}

/**
 * Moves a "cleared" level on to the next one.
 *
 * @param state - a state whose phase is "cleared"
 * @returns the next level, or the same state if there is nothing to advance to
 * @remarks
 * Reaching every {@link LEVELS_PER_BONUS}-th level (5, 10, ...) grants one bonus
 * life on top of the ones carried over.
 */
export function advance(state: GameState): GameState {
  if (state.phase !== "cleared") {
    return state;
  }
  const nextLevel = state.level + 1;
  const bonus = (nextLevel + 1) % LEVELS_PER_BONUS === 0 ? 1 : 0;
  return loadLevel(
    nextLevel,
    state.lives + bonus,
    state.random,
    playerCount(state),
  );
}

/** How many human tanks are in the mission (1 solo, 2 co-op). */
export function playerCount(state: GameState): number {
  return state.tanks.filter((tank) => tank.kind === "player").length;
}

/**
 * Starts the mission again from the first level.
 *
 * @param state - any state (typically "won" or "lost")
 * @returns a fresh mission at level 0
 */
export function restart(state: GameState): GameState {
  return loadLevel(0, LIVES_START, state.random, playerCount(state));
}

/** How many levels the mission has. */
export const LEVEL_COUNT = LEVELS.length;

/**
 * Jumps straight to a level, fresh and with full lives.
 *
 * @param state - the current state (its random stream carries on)
 * @param level - the target level index, clamped into range
 * @returns a fresh "playing" state for that level
 */
export function setLevel(state: GameState, level: number): GameState {
  const clamped = Math.max(0, Math.min(LEVEL_COUNT - 1, level));
  return loadLevel(clamped, LIVES_START, state.random);
}

/** The human tank, or null if it has been destroyed. */
export function playerTank(state: GameState): Tank | null {
  return state.tanks.find((tank) => tank.id === "player" && tank.alive) ?? null;
}

/** How many enemy tanks are still on the field. */
export function enemiesLeft(state: GameState): number {
  return state.tanks.filter((tank) => tank.kind !== "player" && tank.alive)
    .length;
}

/** How many mines the player still has room to lay. */
export function minesLeft(state: GameState): number {
  const laid = state.mines.filter((mine) => mine.ownerId === "player").length;
  return PLAYER_MAX_MINES - laid;
}

/** The tank actions of one step: movement, aim and any shots or mines fired. */
type TankStep = {
  readonly tanks: Tank[];
  readonly newBullets: Bullet[];
  readonly newMines: Mine[];
  readonly random: RandomState;
  readonly nextId: number;
};

/**
 * Moves and aims every tank, and collects the shots and mines they fire.
 *
 * @remarks
 * The player follows the {@link Input}; enemies follow a small heuristic that
 * draws from the random state, which is threaded through so the whole step
 * stays pure.
 */
function actTanks(
  state: GameState,
  input: Input,
  input2: Input,
  time: number,
  dt: number,
): TankStep {
  const player = state.tanks.find((tank) => tank.id === "player") ?? null;
  const newBullets: Bullet[] = [];
  const newMines: Mine[] = [];
  let random = state.random;
  let nextId = state.nextId;

  const tanks = state.tanks.map((tank) => {
    let updated: Tank;
    if (!tank.alive) {
      updated = tank;
    } else if (tank.kind === "player") {
      // In co-op the second seat's tank is "player2"; both are driven the same.
      const own = tank.id === "player2" ? input2 : input;
      const moved = movePlayer(state, tank, own, dt);
      const owned = countOwned(state.bullets, newBullets, tank.id);
      const canFire =
        own.fire && time >= tank.reloadUntil && owned < PLAYER_MAX_BULLETS;
      if (canFire) {
        newBullets.push(
          makeBullet(nextId++, moved, moved.turret, BULLET_BOUNCES),
        );
      }
      if (own.layMine && minesRoom(state.mines, newMines, tank.id)) {
        newMines.push({
          id: `m${nextId++}`,
          x: moved.x,
          y: moved.y,
          ownerId: tank.id,
          explodeAt: time + MINE_FUSE,
        });
      }
      updated = {
        ...moved,
        reloadUntil: canFire ? time + PLAYER_RELOAD : moved.reloadUntil,
      };
    } else {
      const ai = driveEnemy(state, tank, player, time, dt, random);
      random = ai.random;
      if (ai.fire) {
        const traits = ENEMY_TRAITS[tank.kind as keyof typeof ENEMY_TRAITS];
        newBullets.push(
          makeBullet(
            nextId++,
            ai.tank,
            ai.fireAngle,
            traits.bounces,
            traits.bulletSpeed,
          ),
        );
      }
      if (ai.layMine) {
        newMines.push({
          id: `m${nextId++}`,
          x: ai.tank.x,
          y: ai.tank.y,
          ownerId: tank.id,
          explodeAt: time + MINE_FUSE,
        });
      }
      updated = ai.tank;
    }
    return updated;
  });

  return { tanks, newBullets, newMines, random, nextId };
}

/** Moves the player tank and points its turret at the aim spot. */
function movePlayer(
  state: GameState,
  tank: Tank,
  input: Input,
  dt: number,
): Tank {
  const len = Math.hypot(input.move.x, input.move.y);
  let x = tank.x;
  let y = tank.y;
  if (len > 0) {
    const dx = (input.move.x / len) * PLAYER_SPEED * dt;
    const dy = (input.move.y / len) * PLAYER_SPEED * dt;
    const pos = slide(state, tank.x, tank.y, dx, dy);
    x = pos.x;
    y = pos.y;
  }
  const turret = Math.atan2(input.aim.y - y, input.aim.x - x);
  // The chassis turns to face the way it drives; it holds its angle when idle.
  const heading =
    len > 0 ? Math.atan2(input.move.y, input.move.x) : tank.heading;
  return { ...tank, x, y, turret, heading };
}

/** One enemy's decision: where it ends up, whether it fires and lays a mine. */
type EnemyStep = {
  readonly tank: Tank;
  readonly fire: boolean;
  readonly fireAngle: number;
  readonly layMine: boolean;
  readonly random: RandomState;
};

/** Drives one enemy tank: roam, track the player and shoot on a clear line. */
function driveEnemy(
  state: GameState,
  tank: Tank,
  player: Tank | null,
  time: number,
  dt: number,
  random: RandomState,
): EnemyStep {
  const traits = ENEMY_TRAITS[tank.kind as keyof typeof ENEMY_TRAITS];
  let rng = random;
  let heading = tank.heading;
  let headingUntil = tank.headingUntil;

  // Pick a fresh heading when the old one runs out.
  if (time >= headingUntil) {
    const angle = nextRandom(rng);
    const span = nextRandom(angle.state);
    rng = span.state;
    heading = angle.value * Math.PI * 2;
    headingUntil = time + HEADING_MIN + span.value * HEADING_SPAN;
  }

  let x = tank.x;
  let y = tank.y;
  let moved = false;
  if (traits.speed > 0) {
    const dx = Math.cos(heading) * traits.speed * dt;
    const dy = Math.sin(heading) * traits.speed * dt;
    const pos = slide(state, tank.x, tank.y, dx, dy);
    moved = pos.x !== tank.x || pos.y !== tank.y;
    x = pos.x;
    y = pos.y;
    // Walked into a wall: repick a heading next step.
    if (!moved) {
      headingUntil = time;
    }
  }

  // Mine-layers (the yellow tank) drop a mine now and then as they drive, up to
  // a small number out at once, and only while actually rolling forward.
  let layMine = false;
  if (traits.laysMines && moved) {
    const mineCount = state.mines.filter((m) => m.ownerId === tank.id).length;
    if (mineCount < ENEMY_MAX_MINES) {
      const roll = nextRandom(rng);
      rng = roll.state;
      layMine = roll.value < ENEMY_MINE_RATE * dt;
    }
  }

  // Aim at the player and decide whether to fire.
  let turret = tank.turret;
  let fire = false;
  let fireAngle = turret;
  let reloadUntil = tank.reloadUntil;
  if (player !== null) {
    turret = Math.atan2(player.y - y, player.x - x);
    const owned = state.bullets.filter((b) => b.ownerId === tank.id).length;
    const ready = time >= tank.reloadUntil && owned < traits.maxBullets;
    if (traits.banks) {
      // Bank-shooter (green): if the player is in a clear line, aim straight at
      // them; only when the line is blocked does it look for a bank shot off the
      // walls. It keeps its current bank aim while that still lands, so the
      // barrel does not flicker between solutions.
      if (hasLineOfSight(state, x, y, player.x, player.y)) {
        if (ready) {
          fire = true;
          fireAngle = turret; // straight at the player
          reloadUntil = time + traits.reload;
        }
      } else {
        const held = traceShot(
          state,
          x,
          y,
          tank.turret,
          traits.bulletSpeed,
          traits.bounces,
          player,
        );
        const bank =
          held.hit && held.bounced
            ? tank.turret
            : bankFireAngle(
                state,
                x,
                y,
                player,
                traits.bounces,
                traits.bulletSpeed,
              );
        if (bank !== null) {
          turret = bank;
          if (ready) {
            fire = true;
            fireAngle = bank;
            reloadUntil = time + traits.reload;
          }
        }
      }
    } else if (ready && hasLineOfSight(state, x, y, player.x, player.y)) {
      const err = nextRandom(rng);
      rng = err.state;
      fire = true;
      // err.value in [0, 1) maps to a symmetric [-spread, spread) offset.
      fireAngle = turret + (err.value * 2 - 1) * (1 - traits.aim) * MAX_SPREAD;
      reloadUntil = time + traits.reload;
    }
  }

  return {
    tank: { ...tank, x, y, turret, heading, headingUntil, reloadUntil },
    fire,
    fireAngle,
    layMine,
    random: rng,
  };
}

/** Bullets after moving, bouncing and colliding, plus any tanks they killed. */
type BulletStep = {
  readonly bullets: Bullet[];
  readonly tanks: Tank[];
};

/** Moves every shell, bounces it off walls and resolves what it hits. */
function advanceBullets(
  state: GameState,
  tanks: Tank[],
  fresh: Bullet[],
  dt: number,
): BulletStep {
  const moved = [...state.bullets, ...fresh]
    .map((bullet) => moveBullet(state, bullet, dt))
    .filter((bullet) => bullet.bouncesLeft >= 0);

  const dead = new Set<number>();
  // Two shells that meet cancel each other out.
  for (let i = 0; i < moved.length; i++) {
    for (let j = i + 1; j < moved.length; j++) {
      if (within(moved[i], moved[j], BULLET_RADIUS * 2)) {
        dead.add(i);
        dead.add(j);
      }
    }
  }

  const killed = new Set<string>();
  const hitReach = TANK_RADIUS + BULLET_RADIUS;
  moved.forEach((bullet, index) => {
    if (!dead.has(index)) {
      const target = tanks.find(
        (tank) =>
          tank.alive &&
          (bullet.armed || tank.id !== bullet.ownerId) &&
          within(bullet, tank, hitReach),
      );
      if (target !== undefined) {
        killed.add(target.id);
        dead.add(index);
      }
    }
  });

  return {
    bullets: moved.filter((_, index) => !dead.has(index)),
    tanks: tanks.map((tank) =>
      killed.has(tank.id) ? { ...tank, alive: false } : tank,
    ),
  };
}

/**
 * Sets off every mine a surviving shell has reached, spending those shells.
 *
 * @param bullets - the shells still in flight this step
 * @param mines - every mine on the field (laid earlier plus fresh ones)
 * @param time - the current simulation time
 * @returns the shells that did not hit a mine, and the mines with cut fuses
 */
function triggerMinesByBullets(
  bullets: Bullet[],
  mines: Mine[],
  time: number,
): { bullets: Bullet[]; mines: Mine[] } {
  const spent = new Set<number>();
  const reach = MINE_BODY_RADIUS + BULLET_RADIUS;
  const armed = mines.map((mine) => {
    let next = mine;
    bullets.forEach((bullet, index) => {
      if (within(bullet, mine, reach)) {
        spent.add(index);
        if (next.explodeAt > time) {
          next = { ...next, explodeAt: time };
        }
      }
    });
    return next;
  });
  return {
    bullets: bullets.filter((_, index) => !spent.has(index)),
    mines: armed,
  };
}

/** Everything a blast can change this step. */
type MineStep = {
  readonly mines: Mine[];
  readonly explosions: GameState["explosions"];
  readonly tanks: Tank[];
  readonly bullets: Bullet[];
  readonly walls: readonly boolean[];
  readonly breakable: readonly boolean[];
};

/**
 * Detonates due mines: kills tanks and bullets, chains nearby mines and blasts
 * destructible walls in reach back to floor.
 */
function advanceMines(
  state: GameState,
  current: Mine[],
  tanks: Tank[],
  bullets: Bullet[],
  time: number,
): MineStep {
  const blown = current.filter((mine) => time >= mine.explodeAt);
  let mines = current.filter((mine) => time < mine.explodeAt);
  let liveTanks = tanks;
  let liveBullets = bullets;
  let walls = state.walls;
  let breakable = state.breakable;
  const explosions = state.explosions.filter((blast) => blast.until > time);

  for (const mine of blown) {
    explosions.push({ x: mine.x, y: mine.y, until: time + EXPLOSION_TIME });
    liveTanks = liveTanks.map((tank) =>
      tank.alive && within(mine, tank, MINE_RADIUS)
        ? { ...tank, alive: false }
        : tank,
    );
    liveBullets = liveBullets.filter(
      (bullet) => !within(mine, bullet, MINE_RADIUS),
    );
    // Chain: a nearby mine's fuse is cut so it goes off next step.
    mines = mines.map((other) =>
      within(mine, other, MINE_RADIUS) ? { ...other, explodeAt: time } : other,
    );
    // Clear any destructible wall the blast reaches back to floor.
    const cleared = breakableInRadius(state, breakable, mine);
    if (cleared.length > 0) {
      const nextWalls = [...walls];
      const nextBreakable = [...breakable];
      for (const index of cleared) {
        nextWalls[index] = false;
        nextBreakable[index] = false;
      }
      walls = nextWalls;
      breakable = nextBreakable;
    }
  }

  return {
    mines,
    explosions,
    tanks: liveTanks,
    bullets: liveBullets,
    walls,
    breakable,
  };
}

/**
 * Decides the phase after a step: reload on a death, loss, level cleared or win.
 *
 * @remarks
 * Solo, any death repeats the whole level (every enemy back, the player at its
 * start) and spends one life. In co-op a single downed player is not the end:
 * the partner plays the level out. Clearing it moves both on to the next level,
 * both revived, with no life lost; only a full wipe (both down at once) spends a
 * life and repeats the level. When the last life is gone the mission is lost.
 */
function resolve(draft: GameState): GameState {
  const players = draft.tanks.filter((tank) => tank.kind === "player");
  const enemies = draft.tanks.filter(
    (tank) => tank.kind !== "player" && tank.alive,
  ).length;

  let result: GameState;
  if (players.length >= 2) {
    result = resolveCoop(draft, players, enemies);
  } else {
    const dead = players.length === 0 || !players[0].alive;
    if (dead) {
      result = reloadOrLose(draft, 1);
    } else if (enemies === 0) {
      result = clearedOrWon(draft);
    } else {
      result = draft;
    }
  }
  return result;
}

/**
 * Co-op resolution: the level runs on while at least one player is alive.
 *
 * @param draft - the state after this step
 * @param players - the human tanks (some may be down)
 * @param enemies - how many enemies are still alive
 * @returns the next state
 * @remarks
 * A wipe (no player left alive) spends one shared life and repeats the level
 * with both back; clearing it advances - {@link advance} reloads the next level
 * with both players, so a downed partner returns without costing a life.
 */
function resolveCoop(
  draft: GameState,
  players: readonly Tank[],
  enemies: number,
): GameState {
  const anyAlive = players.some((tank) => tank.alive);
  let result: GameState;
  if (!anyAlive) {
    result = reloadOrLose(draft, players.length);
  } else if (enemies === 0) {
    result = clearedOrWon(draft);
  } else {
    result = draft;
  }
  return result;
}

/**
 * Spends one life and repeats the level with every player and enemy back, or
 * ends the mission if that was the last life.
 *
 * @param draft - the state after the fatal step
 * @param playerCount - how many human tanks to deal back in
 * @returns a fresh level with one fewer life, or a "lost" state
 */
function reloadOrLose(draft: GameState, playerCount: number): GameState {
  const lives = draft.lives - 1;
  return lives > 0
    ? loadLevel(draft.level, lives, draft.random, Math.max(1, playerCount))
    : { ...draft, lives: 0, phase: "lost" };
}

/** "cleared" if more levels remain, else "won". */
function clearedOrWon(draft: GameState): GameState {
  return draft.level + 1 < LEVELS.length
    ? { ...draft, phase: "cleared" }
    : { ...draft, phase: "won" };
}

/** Moves a shell one step, reflecting it off any wall it meets. */
function moveBullet(state: GameState, bullet: Bullet, dt: number): Bullet {
  let { vx, vy, bouncesLeft, armed } = bullet;
  let x = bullet.x + vx * dt;
  if (isWallAtPoint(state, x, bullet.y)) {
    vx = -vx;
    x = bullet.x;
    bouncesLeft -= 1;
    armed = true;
  }
  let y = bullet.y + vy * dt;
  if (isWallAtPoint(state, x, y)) {
    vy = -vy;
    y = bullet.y;
    bouncesLeft -= 1;
    armed = true;
  }
  return { ...bullet, x, y, vx, vy, bouncesLeft, armed };
}

/** A shell fired from a tank along an angle, with a bounce budget and speed. */
function makeBullet(
  id: number,
  from: Tank,
  angle: number,
  bounces: number,
  speed = BULLET_SPEED,
): Bullet {
  return {
    id: `b${id}`,
    x: from.x,
    y: from.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    bouncesLeft: bounces,
    ownerId: from.id,
    armed: false,
  };
}

/** Slides a tank by (dx, dy), stopping against walls on each axis. */
function slide(
  state: GameState,
  x: number,
  y: number,
  dx: number,
  dy: number,
): { x: number; y: number } {
  const nx = tankHitsWall(state, x + dx, y) ? x : x + dx;
  const ny = tankHitsWall(state, nx, y + dy) ? y : y + dy;
  return { x: nx, y: ny };
}

/** Whether a tank body centred at (cx, cy) overlaps a wall or a hole cell. */
function tankHitsWall(state: GameState, cx: number, cy: number): boolean {
  const c0 = Math.floor((cx - TANK_RADIUS) / TILE);
  const c1 = Math.floor((cx + TANK_RADIUS) / TILE);
  const r0 = Math.floor((cy - TANK_RADIUS) / TILE);
  const r1 = Math.floor((cy + TANK_RADIUS) / TILE);
  let hit = false;
  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      // Walls and holes both stop a tank; only walls stop shells (elsewhere).
      if (isWallCell(state, col, row) || isHoleCell(state, col, row)) {
        hit = true;
      }
    }
  }
  return hit;
}

/** Whether grid cell (col, row) is a hole; off-grid is not (walls handle that). */
function isHoleCell(state: GameState, col: number, row: number): boolean {
  const inside = col >= 0 && col < state.cols && row >= 0 && row < state.rows;
  return inside ? state.holes[row * state.cols + col] : false;
}

/** Whether the point (px, py) lies in a wall cell (or off the field). */
function isWallAtPoint(state: GameState, px: number, py: number): boolean {
  return isWallCell(state, Math.floor(px / TILE), Math.floor(py / TILE));
}

/** Whether grid cell (col, row) is a wall; off-grid counts as wall. */
function isWallCell(state: GameState, col: number, row: number): boolean {
  const inside = col >= 0 && col < state.cols && row >= 0 && row < state.rows;
  return inside ? state.walls[row * state.cols + col] : true;
}

/** Whether a clear line runs from (ax, ay) to (bx, by) with no wall between. */
function hasLineOfSight(
  state: GameState,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): boolean {
  const dx = bx - ax;
  const dy = by - ay;
  const steps = Math.max(1, Math.floor(Math.hypot(dx, dy) / LOS_STEP));
  let clear = true;
  for (let i = 1; i < steps; i++) {
    if (isWallAtPoint(state, ax + (dx * i) / steps, ay + (dy * i) / steps)) {
      clear = false;
    }
  }
  return clear;
}

/** How a traced shot fared: did it reach the target, after how many bounces. */
type TraceResult = {
  readonly hit: boolean;
  readonly bounced: boolean;
  readonly closest: number;
};

/**
 * Walks a shot's bouncing path and reports whether it reaches the target.
 *
 * @param state - the game (for its walls)
 * @param x - the muzzle x
 * @param y - the muzzle y
 * @param angle - the firing angle
 * @param speed - the shell speed
 * @param bounces - how many wall bounces the shell gets
 * @param target - the point to reach (the player)
 * @returns whether the path passed within a hit of the target, and how
 */
function traceShot(
  state: GameState,
  x: number,
  y: number,
  angle: number,
  speed: number,
  bounces: number,
  target: { readonly x: number; readonly y: number },
): TraceResult {
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;
  let px = x;
  let py = y;
  let left = bounces;
  let used = 0;
  const reach = TANK_RADIUS + BULLET_RADIUS;
  let result: TraceResult = { hit: false, bounced: false, closest: Infinity };
  for (let step = 0; step < TRACE_STEPS; step++) {
    let nx = px + vx * TRACE_DT;
    if (isWallAtPoint(state, nx, py)) {
      vx = -vx;
      nx = px;
      left -= 1;
      used += 1;
    }
    let ny = py + vy * TRACE_DT;
    if (isWallAtPoint(state, nx, ny)) {
      vy = -vy;
      ny = py;
      left -= 1;
      used += 1;
    }
    px = nx;
    py = ny;
    if (left < 0) {
      break;
    }
    const dist = Math.hypot(px - target.x, py - target.y);
    if (dist <= reach) {
      result = { hit: true, bounced: used > 0, closest: dist };
      break;
    }
  }
  return result;
}

/**
 * The angle for a bank shot that reaches the player, or null if none is found.
 *
 * @remarks
 * Candidate aims are the player and the player mirrored across the four border
 * walls and the four corners (one- and two-bounce banks). Each is traced with
 * the real wall bounces (so interior walls count too); bounced solutions are
 * preferred over a direct one, and the most centred of those is chosen.
 */
function bankFireAngle(
  state: GameState,
  x: number,
  y: number,
  player: Tank,
  bounces: number,
  speed: number,
): number | null {
  const minX = TILE;
  const maxX = (state.cols - 1) * TILE;
  const minY = TILE;
  const maxY = (state.rows - 1) * TILE;
  const left = 2 * minX - player.x;
  const right = 2 * maxX - player.x;
  const top = 2 * minY - player.y;
  const bottom = 2 * maxY - player.y;
  const targets = [
    { x: player.x, y: player.y },
    { x: left, y: player.y },
    { x: right, y: player.y },
    { x: player.x, y: top },
    { x: player.x, y: bottom },
    { x: left, y: top },
    { x: left, y: bottom },
    { x: right, y: top },
    { x: right, y: bottom },
  ];

  let bestAngle: number | null = null;
  let bestBounced = false;
  let bestClosest = Infinity;
  for (const target of targets) {
    const angle = Math.atan2(target.y - y, target.x - x);
    const trace = traceShot(state, x, y, angle, speed, bounces, player);
    if (trace.hit) {
      // A bounced (bank) shot beats a direct one; among equals, the most centred.
      const better =
        bestAngle === null ||
        (trace.bounced && !bestBounced) ||
        (trace.bounced === bestBounced && trace.closest < bestClosest);
      if (better) {
        bestAngle = angle;
        bestBounced = trace.bounced;
        bestClosest = trace.closest;
      }
    }
  }
  return bestAngle;
}

/** Whether two points are within `reach` pixels of each other. */
function within(
  a: { x: number; y: number },
  b: { x: number; y: number },
  reach: number,
): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy <= reach * reach;
}

/**
 * The grid indices of the destructible wall cells a blast reaches.
 *
 * @param state - the game state, for the grid dimensions
 * @param breakable - which cells are currently destructible
 * @param mine - the detonating mine
 * @returns the indices whose cell centre lies within the blast radius
 */
function breakableInRadius(
  state: GameState,
  breakable: readonly boolean[],
  mine: Mine,
): number[] {
  const c0 = Math.floor((mine.x - MINE_RADIUS) / TILE);
  const c1 = Math.floor((mine.x + MINE_RADIUS) / TILE);
  const r0 = Math.floor((mine.y - MINE_RADIUS) / TILE);
  const r1 = Math.floor((mine.y + MINE_RADIUS) / TILE);
  const result: number[] = [];
  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      const inside =
        col >= 0 && col < state.cols && row >= 0 && row < state.rows;
      const index = row * state.cols + col;
      const centre = { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
      if (inside && breakable[index] && within(mine, centre, MINE_RADIUS)) {
        result.push(index);
      }
    }
  }
  return result;
}

/** Live plus freshly-fired shells an owner has out. */
function countOwned(
  existing: readonly Bullet[],
  fresh: readonly Bullet[],
  ownerId: string,
): number {
  const count = (list: readonly Bullet[]) =>
    list.filter((bullet) => bullet.ownerId === ownerId).length;
  return count(existing) + count(fresh);
}

/** Whether a player still has room to lay another mine. */
function minesRoom(
  existing: readonly Mine[],
  fresh: readonly Mine[],
  ownerId: string,
): boolean {
  const laid =
    existing.filter((mine) => mine.ownerId === ownerId).length +
    fresh.filter((mine) => mine.ownerId === ownerId).length;
  return laid < PLAYER_MAX_MINES;
}

/** Drops a fresh breadcrumb for each tank that has driven far enough since its last. */
function extendTrails(
  trails: readonly Trail[],
  tanks: readonly Tank[],
): readonly Trail[] {
  const additions: Trail[] = [];
  for (const tank of tanks) {
    const last = lastTrail(trails, tank.id);
    const moved =
      last === undefined ||
      Math.hypot(tank.x - last.x, tank.y - last.y) >= TRAIL_STEP;
    if (moved) {
      additions.push({
        id: tank.id,
        x: tank.x,
        y: tank.y,
        heading: tank.heading,
      });
    }
  }
  return additions.length > 0 ? [...trails, ...additions] : trails;
}

/** The most recent breadcrumb a given tank dropped, if any. */
function lastTrail(trails: readonly Trail[], id: string): Trail | undefined {
  let found: Trail | undefined;
  for (let i = trails.length - 1; i >= 0; i--) {
    if (found === undefined && trails[i].id === id) {
      found = trails[i];
    }
  }
  return found;
}
