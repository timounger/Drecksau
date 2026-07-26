/**
 * A view-only explosion where a tank was destroyed: a fireball, sparks and smoke.
 *
 * @module
 * @remarks
 * Pure eye-candy, kept out of the simulation and the network snapshots. A tank
 * that is destroyed is simply gone from the next state (enemies are removed;
 * a downed player is flagged dead and the level reloads in the same step), so the
 * spot cannot be read off a single frame. {@link detectTankDeaths} compares the
 * state before and after a step - the same trick {@link ../audio/events} uses -
 * and reports where a tank just died; the hook spawns a blast at each spot. The
 * field is owned by the hook, advanced with {@link stepTankExplosions} and drawn
 * with {@link drawTankExplosions}, so {@link ./render.draw} stays a plain draw.
 */
import {
  BODY_HEIGHT,
  DEPTH,
  project,
} from "@/games/panzerkiste/components/projection";
import type { GameState } from "@/games/panzerkiste/engine/types";

/** A world spot where a tank was destroyed. */
export type DeathSpot = { readonly x: number; readonly y: number };

/**
 * Where tanks were destroyed between two states.
 *
 * @param prev - the state before the step
 * @param next - the state after the step
 * @returns the spots a tank just died at, in no particular order
 * @remarks
 * Mirrors {@link ../audio/events.detectSounds}: an enemy counts as destroyed only
 * when nothing reloaded in between (same level and lives), a downed co-op player
 * while the level plays on, and a life spent means a player was destroyed (the
 * level then reloads, so the spot is read from the previous frame).
 */
export function detectTankDeaths(
  prev: GameState,
  next: GameState,
): DeathSpot[] {
  const spots: DeathSpot[] = [];

  // Enemies: alive before, gone after, with no reload in between.
  if (next.level === prev.level && next.lives === prev.lives) {
    const aliveNow = new Set(
      next.tanks
        .filter((tank) => tank.kind !== "player" && tank.alive)
        .map((tank) => tank.id),
    );
    for (const tank of prev.tanks) {
      if (tank.kind !== "player" && tank.alive && !aliveNow.has(tank.id)) {
        spots.push({ x: tank.x, y: tank.y });
      }
    }
  }

  // A co-op partner going down while the level plays on (no life spent).
  if (next.level === prev.level && next.lives === prev.lives) {
    for (const tank of prev.tanks) {
      if (tank.kind === "player" && tank.alive) {
        const after = next.tanks.find((other) => other.id === tank.id);
        if (after !== undefined && !after.alive) {
          spots.push({ x: tank.x, y: tank.y });
        }
      }
    }
  }

  // A life was spent: the player(s) still alive this step were destroyed (a solo
  // death or a co-op wipe); the level then reloaded, so read the previous spots.
  if (next.level === prev.level && next.lives < prev.lives) {
    for (const tank of prev.tanks) {
      if (tank.kind === "player" && tank.alive) {
        spots.push({ x: tank.x, y: tank.y });
      }
    }
  }

  return spots;
}

/** Height the fireball and sparks are centred at, in world units. */
const BLAST_Z = BODY_HEIGHT;

/** How long the fireball, the sparks and the smoke each last, in seconds. */
const FIREBALL_LIFE = 0.5;
const SPARK_LIFE = 0.6;
const SMOKE_LIFE = 0.8;

/** The whole blast is dropped once it is older than the longest-lived part. */
const BLAST_LIFE = SMOKE_LIFE;

/** Fireball radius: starting and fully grown, in pixels. */
const FIREBALL_R0 = 9;
const FIREBALL_R1 = 40;

/** Where the fireball's mid colour sits in its gradient (0 = core, 1 = edge). */
const FIREBALL_MID_STOP = 0.55;

/** How many spark streaks fly out of a blast. */
const SPARK_COUNT = 15;

/** Spark speed range, in pixels per second, and the streak length, in pixels. */
const SPARK_SPEED_MIN = 110;
const SPARK_SPEED_SPAN = 210;
const SPARK_LEN = 9;
const SPARK_WIDTH = 2.5;

/** How high a spark pops before it falls back, in world units. */
const SPARK_RISE = 17;

/** How many smoke puffs a blast leaves. */
const SMOKE_COUNT = 6;

/** Smoke puff: starting radius, how much it grows, how far it scatters, its rise. */
const SMOKE_R0 = 8;
const SMOKE_GROW = 19;
const SMOKE_SPREAD = 15;
const SMOKE_RISE = 14;

/** Peak opacity of the smoke. */
const SMOKE_ALPHA = 0.4;

/** Colours; the ALPHA placeholder is filled with the current fade. */
const CORE_COLOR = "rgba(255, 250, 228, ALPHA)";
const MID_COLOR = "rgba(255, 156, 40, ALPHA)";
const EDGE_COLOR = "rgba(200, 40, 12, 0)";
const SPARK_COLOR = "rgba(255, 206, 104, ALPHA)";
const SMOKE_COLOR = "rgba(70, 68, 72, ALPHA)";

/** One spark streak flying out of a blast. */
type Spark = {
  readonly angle: number;
  readonly speed: number;
};

/** One smoke puff drifting off a blast. */
type SmokePuff = {
  readonly dx: number;
  readonly dy: number;
};

/** One tank explosion: its spot, its age and the pieces flung from it. */
type Blast = {
  readonly x: number;
  readonly y: number;
  age: number;
  readonly sparks: readonly Spark[];
  readonly puffs: readonly SmokePuff[];
};

/** The render-side tank explosions. */
export type TankExplosionField = {
  blasts: Blast[];
};

/** Creates an empty tank-explosion field for one game. */
export function createTankExplosions(): TankExplosionField {
  return { blasts: [] };
}

/**
 * Adds a fresh explosion at a spot a tank was destroyed.
 *
 * @param field - the field to add to
 * @param spot - where the tank died
 */
export function spawnTankExplosion(
  field: TankExplosionField,
  spot: DeathSpot,
): void {
  const sparks: Spark[] = [];
  for (let i = 0; i < SPARK_COUNT; i++) {
    sparks.push({
      angle: Math.random() * Math.PI * 2,
      speed: SPARK_SPEED_MIN + Math.random() * SPARK_SPEED_SPAN,
    });
  }
  const puffs: SmokePuff[] = [];
  for (let i = 0; i < SMOKE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const reach = Math.random() * SMOKE_SPREAD;
    puffs.push({ dx: Math.cos(angle) * reach, dy: Math.sin(angle) * reach });
  }
  field.blasts.push({ x: spot.x, y: spot.y, age: 0, sparks, puffs });
}

/**
 * Ages the explosions and drops the ones that have burned out.
 *
 * @param field - the field to advance
 * @param dt - elapsed time in seconds
 */
export function stepTankExplosions(
  field: TankExplosionField,
  dt: number,
): void {
  for (const blast of field.blasts) {
    blast.age += dt;
  }
  field.blasts = field.blasts.filter((blast) => blast.age < BLAST_LIFE);
}

/**
 * Draws the explosions on top of the scene.
 *
 * @param ctx - the canvas context
 * @param field - the field to draw
 */
export function drawTankExplosions(
  ctx: CanvasRenderingContext2D,
  field: TankExplosionField,
): void {
  ctx.save();
  for (const blast of field.blasts) {
    drawSmokePuffs(ctx, blast);
    drawFireball(ctx, blast);
    drawSparks(ctx, blast);
  }
  ctx.restore();
}

/** The dark smoke puffs the blast leaves, rising and fading. */
function drawSmokePuffs(ctx: CanvasRenderingContext2D, blast: Blast): void {
  const t = blast.age / SMOKE_LIFE;
  if (t >= 1) {
    return;
  }
  const fade = (1 - t) * SMOKE_ALPHA;
  ctx.fillStyle = tint(SMOKE_COLOR, fade);
  const radius = SMOKE_R0 + SMOKE_GROW * t;
  for (const puff of blast.puffs) {
    const point = project(
      blast.x + puff.dx,
      blast.y + puff.dy,
      BLAST_Z + SMOKE_RISE * t,
    );
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, radius, radius * DEPTH, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The central fireball: a radial gradient that grows and fades. */
function drawFireball(ctx: CanvasRenderingContext2D, blast: Blast): void {
  const t = blast.age / FIREBALL_LIFE;
  if (t >= 1) {
    return;
  }
  const fade = 1 - t;
  const centre = project(blast.x, blast.y, BLAST_Z);
  const radius = FIREBALL_R0 + (FIREBALL_R1 - FIREBALL_R0) * t;
  const gradient = ctx.createRadialGradient(
    centre.x,
    centre.y,
    0,
    centre.x,
    centre.y,
    radius,
  );
  gradient.addColorStop(0, tint(CORE_COLOR, fade));
  gradient.addColorStop(FIREBALL_MID_STOP, tint(MID_COLOR, fade));
  gradient.addColorStop(1, EDGE_COLOR);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(centre.x, centre.y, radius, radius * DEPTH, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** The spark streaks flung outward, popping up then fading. */
function drawSparks(ctx: CanvasRenderingContext2D, blast: Blast): void {
  const t = blast.age / SPARK_LIFE;
  if (t >= 1) {
    return;
  }
  const fade = 1 - t;
  const rise = BLAST_Z + SPARK_RISE * Math.sin(t * Math.PI);
  ctx.strokeStyle = tint(SPARK_COLOR, fade);
  ctx.lineWidth = SPARK_WIDTH;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const spark of blast.sparks) {
    const dist = spark.speed * blast.age;
    const dirX = Math.cos(spark.angle);
    const dirY = Math.sin(spark.angle);
    const head = project(blast.x + dirX * dist, blast.y + dirY * dist, rise);
    const tail = project(
      blast.x + dirX * (dist - SPARK_LEN),
      blast.y + dirY * (dist - SPARK_LEN),
      rise,
    );
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(head.x, head.y);
  }
  ctx.stroke();
}

/** Fills the ALPHA placeholder of a colour with the current fade. */
function tint(color: string, fade: number): string {
  return color.replace("ALPHA", fade.toFixed(2));
}
