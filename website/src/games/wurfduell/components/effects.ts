/**
 * The mess a throw leaves: splashes, shards, snow clouds, sparks, dust and the
 * words that pop up over a hit.
 *
 * @module
 * @remarks
 * Purely for the eye. Particles use `Math.random` freely - the two screens of
 * an online match may splash a little differently, and nobody will ever know.
 * What a throw *did* is decided by the engine, never here.
 */
import type { ImpactKind, ImpactLook } from "@/games/wurfduell/engine/types";

/** One flying speck. */
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  readonly maxLife: number;
  readonly size: number;
  readonly color: string;
  readonly shape: "drop" | "shard" | "cloud" | "spark";
  rotation: number;
  readonly spin: number;
};

/** A word floating up from a hit. */
type Popup = {
  readonly x: number;
  y: number;
  readonly text: string;
  readonly color: string;
  life: number;
  readonly big: boolean;
};

/** A splash left lying on the ground. */
type Decal = {
  readonly x: number;
  readonly y: number;
  readonly color: string;
  readonly size: number;
  readonly seed: number;
};

/** Everything currently flying or lying about. */
export type Effects = {
  particles: Particle[];
  popups: Popup[];
  decals: Decal[];
};

/** One impact to show. */
export type ImpactShow = {
  /** Canvas position. */
  readonly x: number;
  readonly y: number;
  readonly look: ImpactLook;
  readonly color: string;
  readonly kind: ImpactKind;
  /** Life points it cost, for the number that pops up. */
  readonly damage: number;
  /** The cry above the hit, if any. */
  readonly word: string | null;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- particle tuning */
/** Gravity on particles, in canvas units per second squared. */
const PARTICLE_GRAVITY = 700;
/** How long a popup floats, in seconds. */
const POPUP_SECONDS = 1.3;
/** The most splashes kept lying about. */
const MAX_DECALS = 24;

/** How many particles each look throws. */
const COUNTS: Readonly<Record<ImpactLook, number>> = {
  splat: 18,
  shatter: 12,
  puff: 14,
  clang: 14,
  thud: 10,
};

/** Which particle shape each look throws. */
const SHAPES: Readonly<Record<ImpactLook, Particle["shape"]>> = {
  splat: "drop",
  shatter: "shard",
  puff: "cloud",
  clang: "spark",
  thud: "cloud",
};

/**
 * A fresh, empty set of effects.
 *
 * @returns nothing flying, nothing lying about
 */
export function createEffects(): Effects {
  return { particles: [], popups: [], decals: [] };
}

/**
 * Throws up the mess of one impact.
 *
 * @param effects - the set to add to
 * @param show - what landed where
 */
export function spawnImpact(effects: Effects, show: ImpactShow): void {
  const count = COUNTS[show.look];
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI * Math.random();
    const speed = 80 + Math.random() * 260;
    const life = 0.5 + Math.random() * 0.6;
    effects.particles.push({
      x: show.x,
      y: show.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size: 2 + Math.random() * 5,
      color: particleColor(show, i),
      shape: SHAPES[show.look],
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 20,
    });
  }
  if (show.look === "splat" && show.kind !== "out") {
    effects.decals.push({
      x: show.x,
      y: show.kind === "ground" ? show.y + 4 : show.y,
      color: show.color,
      size: 12 + Math.random() * 8,
      seed: Math.random() * 10,
    });
    effects.decals = effects.decals.slice(-MAX_DECALS);
  }
  if (show.damage > 0) {
    popup(effects, show.x, show.y - 30, `-${show.damage}`, "#ef4444", true);
  }
  if (show.word !== null) {
    popup(effects, show.x, show.y - 62, show.word, "#fde047", false);
  }
}

/**
 * Adds a word that floats up and fades.
 *
 * @param effects - the set to add to
 * @param x - where, in canvas units
 * @param y - where, in canvas units
 * @param text - the word
 * @param color - its colour
 * @param big - the big font, for numbers
 */
export function popup(
  effects: Effects,
  x: number,
  y: number,
  text: string,
  color: string,
  big: boolean,
): void {
  effects.popups.push({ x, y, text, color, life: POPUP_SECONDS, big });
}

/**
 * Moves everything on.
 *
 * @param effects - the set
 * @param dt - seconds passed
 * @param groundY - the ground line, where particles come to rest
 */
export function stepEffects(
  effects: Effects,
  dt: number,
  groundY: number,
): void {
  for (const p of effects.particles) {
    p.life -= dt;
    if (p.shape === "cloud") {
      p.vx *= 0.92;
      p.vy = p.vy * 0.92 - 10 * dt;
    } else {
      p.vy += PARTICLE_GRAVITY * dt;
    }
    p.x += p.vx * dt;
    p.y = Math.min(groundY, p.y + p.vy * dt);
    p.rotation += p.spin * dt;
  }
  effects.particles = effects.particles.filter((p) => p.life > 0);
  for (const item of effects.popups) {
    item.life -= dt;
    item.y -= 40 * dt;
  }
  effects.popups = effects.popups.filter((item) => item.life > 0);
}

/**
 * Draws the splashes lying about - under the fighters.
 *
 * @param ctx - where to draw
 * @param effects - the set
 */
export function drawDecals(
  ctx: CanvasRenderingContext2D,
  effects: Effects,
): void {
  for (const decal of effects.decals) {
    ctx.fillStyle = decal.color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(
      decal.x,
      decal.y,
      decal.size,
      decal.size * 0.35,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      const a = decal.seed + i * 1.7;
      ctx.beginPath();
      ctx.arc(
        decal.x + Math.cos(a) * decal.size * 1.3,
        decal.y + Math.sin(a) * decal.size * 0.3,
        decal.size * 0.18,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * Draws the flying particles and the popups - over everything.
 *
 * @param ctx - where to draw
 * @param effects - the set
 */
export function drawEffects(
  ctx: CanvasRenderingContext2D,
  effects: Effects,
): void {
  for (const p of effects.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    switch (p.shape) {
      case "shard":
        ctx.beginPath();
        ctx.moveTo(-p.size, -p.size * 0.5);
        ctx.lineTo(p.size, 0);
        ctx.lineTo(-p.size * 0.3, p.size * 0.7);
        ctx.closePath();
        ctx.fill();
        break;
      case "cloud": {
        const grow = 1 + (1 - p.life / p.maxLife) * 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * grow, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "spark":
        ctx.fillRect(-p.size, -1, p.size * 2, 2);
        break;
      default:
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  for (const item of effects.popups) {
    ctx.globalAlpha = Math.min(1, item.life / 0.4);
    ctx.font = item.big
      ? "900 34px system-ui, sans-serif"
      : "900 22px system-ui, sans-serif";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1f2937";
    ctx.strokeText(item.text, item.x, item.y);
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, item.x, item.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "start";
}

/** The colour of the i-th particle of an impact. */
function particleColor(show: ImpactShow, index: number): string {
  let color = show.color;
  if (show.look === "clang") {
    color = index % 2 === 0 ? "#fde047" : "#fb923c";
  } else if (show.look === "thud") {
    color = index % 2 === 0 ? "#a8a29e" : "#d6d3d1";
  } else if (show.look === "puff") {
    color = "#ffffffcc";
  }
  return color;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
