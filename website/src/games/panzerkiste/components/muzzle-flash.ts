/**
 * A view-only muzzle flash: a brief bright burst at the barrel when a tank fires.
 *
 * @module
 * @remarks
 * Pure eye-candy, kept out of the simulation and the network snapshots. Every
 * shell is born at the muzzle (see {@link ../engine/types.MUZZLE_OFFSET}), so a
 * bullet appearing for the first time is a shot just fired: a short-lived flash
 * is spawned at that spot, facing the shell's travel direction, and it grows and
 * fades over a fraction of a second. The field is owned by the hook (one per
 * game), advanced with {@link stepMuzzleFlashes} and drawn with
 * {@link drawMuzzleFlashes}, so {@link ./render.draw} stays a plain draw.
 */
import {
  BODY_HEIGHT,
  DEPTH,
  project,
} from "@/games/panzerkiste/components/projection";
import { BULLET_SPEED, type Bullet } from "@/games/panzerkiste/engine/types";

/** A shell counts as a rocket above this multiple of the ordinary shell speed. */
const ROCKET_FACTOR = 1.2;

/** How far the turret crown sits above the body top (matches the renderer). */
const TURRET_RISE = 5;

/** Height of the barrel tip above the floor (body top plus the turret rise). */
const MUZZLE_Z = BODY_HEIGHT + TURRET_RISE;

/** How long a flash lasts, in seconds - deliberately short. */
const FLASH_LIFE = 0.09;

/** The flash sits a touch behind the shell's first seen spot, onto the barrel. */
const MUZZLE_BACKSET = 5;

/** Central glow: starting radius and how much it grows over its life, in pixels. */
const GLOW_RADIUS = 5;
const GLOW_GROW = 4;

/** How many rays the starburst has. */
const RAY_COUNT = 8;

/** Ray length: the base every ray has, plus a bonus for pointing forward. */
const RAY_MIN = 4;
const RAY_FORWARD = 11;

/** Width of a starburst ray, in pixels. */
const RAY_WIDTH = 2;

/** A ray starts at this fraction of its length and stretches out as it ages. */
const RAY_GROW_BASE = 0.6;

/** Where the mid colour sits in the glow's radial gradient (0 = core, 1 = edge). */
const GLOW_MID_STOP = 0.5;

/** Rockets flash a little bigger than ordinary shells. */
const ROCKET_SCALE = 1.35;

/** Colours of the flash: a near-white core, an orange mid and bright rays. */
const CORE_COLOR = "rgba(255, 249, 224, ALPHA)";
const MID_COLOR = "rgba(255, 176, 52, ALPHA)";
const EDGE_COLOR = "rgba(255, 140, 20, 0)";
const RAY_COLOR = "rgba(255, 214, 120, ALPHA)";

/** One brief muzzle flash at a barrel. */
type Flash = {
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly scale: number;
  age: number;
};

/** The render-side flashes and the shell ids already flashed, so each fires once. */
export type MuzzleFlashField = {
  flashes: Flash[];
  readonly flashed: Set<string>;
};

/** Creates an empty muzzle-flash field for one game. */
export function createMuzzleFlashes(): MuzzleFlashField {
  return { flashes: [], flashed: new Set<string>() };
}

/**
 * Advances the flashes: spawns one behind each freshly fired shell, ages the rest.
 *
 * @param field - the muzzle-flash field to advance
 * @param bullets - the shells this frame
 * @param dt - elapsed time in seconds
 */
export function stepMuzzleFlashes(
  field: MuzzleFlashField,
  bullets: readonly Bullet[],
  dt: number,
): void {
  const present = new Set<string>();
  for (const bullet of bullets) {
    present.add(bullet.id);
    if (!field.flashed.has(bullet.id)) {
      field.flashed.add(bullet.id);
      const speed = Math.hypot(bullet.vx, bullet.vy);
      const ux = speed > 0 ? bullet.vx / speed : 1;
      const uy = speed > 0 ? bullet.vy / speed : 0;
      field.flashes.push({
        // Nudge back onto the barrel tip: the shell already moved one step off.
        x: bullet.x - ux * MUZZLE_BACKSET,
        y: bullet.y - uy * MUZZLE_BACKSET,
        angle: Math.atan2(bullet.vy, bullet.vx),
        scale: speed > BULLET_SPEED * ROCKET_FACTOR ? ROCKET_SCALE : 1,
        age: 0,
      });
    }
  }

  // Forget shells that are gone, so a later id cannot be mistaken for flashed.
  for (const id of [...field.flashed]) {
    if (!present.has(id)) {
      field.flashed.delete(id);
    }
  }

  for (const flash of field.flashes) {
    flash.age += dt;
  }
  field.flashes = field.flashes.filter((flash) => flash.age < FLASH_LIFE);
}

/**
 * Draws the muzzle flashes on top of the scene, at the barrel tip height.
 *
 * @param ctx - the canvas context
 * @param field - the muzzle-flash field to draw
 */
export function drawMuzzleFlashes(
  ctx: CanvasRenderingContext2D,
  field: MuzzleFlashField,
): void {
  ctx.save();
  for (const flash of field.flashes) {
    const t = flash.age / FLASH_LIFE;
    const fade = 1 - t;
    drawRays(ctx, flash, t, fade);
    drawGlow(ctx, flash, t, fade);
  }
  ctx.restore();
}

/** The starburst rays, longest towards the firing direction. */
function drawRays(
  ctx: CanvasRenderingContext2D,
  flash: Flash,
  t: number,
  fade: number,
): void {
  const centre = project(flash.x, flash.y, MUZZLE_Z);
  ctx.strokeStyle = tint(RAY_COLOR, fade);
  ctx.lineWidth = RAY_WIDTH;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < RAY_COUNT; i++) {
    const theta = (i / RAY_COUNT) * Math.PI * 2;
    const forward = Math.max(0, Math.cos(theta - flash.angle));
    const length =
      (RAY_MIN + RAY_FORWARD * forward) * flash.scale * (RAY_GROW_BASE + t);
    // World-space ray so the tilt squashes it like everything else.
    const end = project(
      flash.x + Math.cos(theta) * length,
      flash.y + Math.sin(theta) * length,
      MUZZLE_Z,
    );
    ctx.moveTo(centre.x, centre.y);
    ctx.lineTo(end.x, end.y);
  }
  ctx.stroke();
}

/** The central glow: a radial gradient that grows and fades. */
function drawGlow(
  ctx: CanvasRenderingContext2D,
  flash: Flash,
  t: number,
  fade: number,
): void {
  const centre = project(flash.x, flash.y, MUZZLE_Z);
  const radius = (GLOW_RADIUS + GLOW_GROW * t) * flash.scale;
  const gradient = ctx.createRadialGradient(
    centre.x,
    centre.y,
    0,
    centre.x,
    centre.y,
    radius,
  );
  gradient.addColorStop(0, tint(CORE_COLOR, fade));
  gradient.addColorStop(GLOW_MID_STOP, tint(MID_COLOR, fade));
  gradient.addColorStop(1, EDGE_COLOR);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(centre.x, centre.y, radius, radius * DEPTH, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Fills the ALPHA placeholder of a colour with the current fade. */
function tint(color: string, fade: number): string {
  return color.replace("ALPHA", fade.toFixed(2));
}
