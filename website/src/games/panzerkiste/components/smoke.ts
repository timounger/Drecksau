/**
 * A view-only dust/smoke trail behind flying shells and rockets.
 *
 * @module
 * @remarks
 * This is pure eye-candy and lives entirely in the render layer, so the pure
 * simulation and the network snapshots stay untouched. As a shell travels it
 * drops small puffs at the spots it passed; each puff lingers a moment, grows a
 * little and fades where it was dropped, so a short cloud trails the shell.
 * Rockets leave a darker, longer-lived smoke; ordinary shells a light dust.
 *
 * The field is owned by the hook (one per game) and advanced once per frame with
 * {@link stepSmoke}; {@link drawSmoke} renders it. Keeping the ageing out of the
 * renderer lets {@link ../components/render.draw} stay a plain draw of its input.
 */
import { DEPTH, project } from "@/games/panzerkiste/components/projection";
import { BULLET_SPEED, type Bullet } from "@/games/panzerkiste/engine/types";

/** A shell counts as a rocket above this multiple of the ordinary shell speed. */
const ROCKET_FACTOR = 1.2;

/** How far a shell must travel before it drops another puff, in pixels. */
const SPAWN_DIST = 7;

/** Most puffs one shell drops in a single frame (caps a big teleport/bounce). */
const MAX_SPAWN_PER_STEP = 4;

/** Hard cap on live puffs, so a long firefight cannot pile them up forever. */
const MAX_PUFFS = 220;

/** How long a dust puff lasts, in seconds. */
const DUST_LIFE = 0.3;

/** How long a rocket smoke puff lasts, in seconds. */
const ROCKET_LIFE = 0.45;

/** Height above the floor the puffs sit at, in world units. */
const SMOKE_HEIGHT = 2;

/** Starting and added radius of a dust puff, in pixels. */
const DUST_RADIUS = 2.5;
const DUST_GROW = 3;

/** Starting and added radius of a rocket smoke puff, in pixels. */
const ROCKET_RADIUS = 3.5;
const ROCKET_GROW = 5;

/** Peak opacity of a dust and a rocket puff. */
const DUST_ALPHA = 0.35;
const ROCKET_ALPHA = 0.5;

/** Tan dust for shells, grey smoke for rockets. */
const DUST_COLOR = "rgb(190, 184, 168)";
const SMOKE_COLOR = "rgb(112, 112, 118)";

/** One lingering puff dropped at a spot a shell passed. */
type Puff = {
  readonly x: number;
  readonly y: number;
  age: number;
  readonly life: number;
  readonly rocket: boolean;
};

/** The render-side smoke trail: the live puffs and each shell's last drop spot. */
export type SmokeField = {
  puffs: Puff[];
  readonly last: Map<string, { x: number; y: number }>;
};

/** Creates an empty smoke field for one game. */
export function createSmoke(): SmokeField {
  return { puffs: [], last: new Map<string, { x: number; y: number }>() };
}

/**
 * Advances the trail: drops puffs behind shells that moved, ages and culls them.
 *
 * @param field - the smoke field to advance
 * @param bullets - the shells this frame
 * @param dt - elapsed time in seconds
 */
export function stepSmoke(
  field: SmokeField,
  bullets: readonly Bullet[],
  dt: number,
): void {
  const present = new Set<string>();
  for (const bullet of bullets) {
    present.add(bullet.id);
    const speed = Math.hypot(bullet.vx, bullet.vy);
    const rocket = speed > BULLET_SPEED * ROCKET_FACTOR;
    const prev = field.last.get(bullet.id);
    if (prev === undefined) {
      field.last.set(bullet.id, { x: bullet.x, y: bullet.y });
    } else {
      const dist = Math.hypot(bullet.x - prev.x, bullet.y - prev.y);
      if (dist >= SPAWN_DIST) {
        const steps = Math.min(
          MAX_SPAWN_PER_STEP,
          Math.floor(dist / SPAWN_DIST),
        );
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          field.puffs.push({
            x: prev.x + (bullet.x - prev.x) * t,
            y: prev.y + (bullet.y - prev.y) * t,
            age: 0,
            life: rocket ? ROCKET_LIFE : DUST_LIFE,
            rocket,
          });
        }
        field.last.set(bullet.id, { x: bullet.x, y: bullet.y });
      }
    }
  }

  // Forget shells that are gone, so their ids do not leak.
  for (const id of [...field.last.keys()]) {
    if (!present.has(id)) {
      field.last.delete(id);
    }
  }

  for (const puff of field.puffs) {
    puff.age += dt;
  }
  field.puffs = field.puffs.filter((puff) => puff.age < puff.life);
  if (field.puffs.length > MAX_PUFFS) {
    field.puffs.splice(0, field.puffs.length - MAX_PUFFS);
  }
}

/**
 * Draws the smoke trail on the floor plane, oldest and faintest first.
 *
 * @param ctx - the canvas context
 * @param field - the smoke field to draw
 */
export function drawSmoke(
  ctx: CanvasRenderingContext2D,
  field: SmokeField,
): void {
  ctx.save();
  for (const puff of field.puffs) {
    const t = puff.age / puff.life;
    ctx.globalAlpha = (1 - t) * (puff.rocket ? ROCKET_ALPHA : DUST_ALPHA);
    ctx.fillStyle = puff.rocket ? SMOKE_COLOR : DUST_COLOR;
    const radius =
      (puff.rocket ? ROCKET_RADIUS : DUST_RADIUS) +
      t * (puff.rocket ? ROCKET_GROW : DUST_GROW);
    const point = project(puff.x, puff.y, SMOKE_HEIGHT);
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, radius, radius * DEPTH, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
