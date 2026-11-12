/**
 * The passing things on screen: sparks, smoke, flames, tracers, lightning,
 * blast rings and damage numbers - all from one fixed pool.
 *
 * @module
 * @remarks
 * The pool never grows: when it is full the oldest particle is reused. A big
 * wave therefore costs the same memory as a quiet one, and nothing is
 * allocated while the game runs.
 */
import type { GameEvent } from "@/games/frost-fortress/engine/types";

/** What a particle looks like. */
type Look =
  | "spark"
  | "smoke"
  | "fire"
  | "debris"
  | "snow"
  | "flash"
  | "ring"
  | "tracer"
  | "bolt"
  | "number"
  | "gold"
  | "frost";

/** One particle. */
type Particle = {
  look: Look;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds lived and to live. */
  age: number;
  life: number;
  size: number;
  /** End point for tracers. */
  tx: number;
  ty: number;
  color: string;
  /** Damage number or lightning seed. */
  value: number;
  alive: boolean;
};

/** Particles at most. */
const POOL_SIZE = 2400;

/** Lightning bolts kept, each with its points. */
const BOLT_LIMIT = 40;

/** Damage numbers shown at once at most. */
const NUMBER_LIMIT = 30;

/** Friction on particle speed per second. */
const DRAG = 2.2;

/** Smoke rises, debris falls (screen y). */
const RISE = -14;

/** The effects of one screen. */
export type Effects = {
  /** Turns game events into particles. */
  readonly add: (events: readonly GameEvent[], numbers: boolean) => void;
  /** Moves everything on. */
  readonly update: (dt: number) => void;
  /** Paints everything, in world coordinates (the transform is set). */
  readonly draw: (ctx: CanvasRenderingContext2D, zoom: number) => void;
  /** Removes everything. */
  readonly clear: () => void;
};

/**
 * Creates the effect pool of a screen.
 *
 * @returns the pool
 */
export function createEffects(): Effects {
  const pool: Particle[] = Array.from({ length: POOL_SIZE }, () => ({
    look: "spark",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    age: 0,
    life: 0,
    size: 0,
    tx: 0,
    ty: 0,
    color: "",
    value: 0,
    alive: false,
  }));
  const bolts: { points: readonly number[]; age: number }[] = [];
  let cursor = 0;
  let numbers = 0;

  const spawn = (
    look: Look,
    x: number,
    y: number,
    life: number,
    size: number,
    color: string,
  ): Particle => {
    const particle = pool[cursor];
    cursor = (cursor + 1) % POOL_SIZE;
    particle.look = look;
    particle.x = x;
    particle.y = y;
    particle.vx = 0;
    particle.vy = 0;
    particle.age = 0;
    particle.life = life;
    particle.size = size;
    particle.color = color;
    particle.tx = x;
    particle.ty = y;
    particle.value = 0;
    particle.alive = true;
    return particle;
  };

  /* eslint-disable @typescript-eslint/no-magic-numbers -- random spread of
     speed, life and size */
  const burst = (
    look: Look,
    x: number,
    y: number,
    count: number,
    speed: number,
    life: number,
    size: number,
    color: string,
  ) => {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const pace = speed * (0.3 + Math.random() * 0.7);
      const particle = spawn(
        look,
        x,
        y,
        life * (0.6 + Math.random() * 0.6),
        size * (0.6 + Math.random() * 0.8),
        color,
      );
      particle.vx = Math.cos(angle) * pace;
      particle.vy = Math.sin(angle) * pace;
    }
  };

  /* eslint-enable @typescript-eslint/no-magic-numbers */

  /* eslint-disable @typescript-eslint/no-magic-numbers -- effect tuning:
     counts, speeds, lifetimes and colours */
  const add = (events: readonly GameEvent[], showNumbers: boolean): void => {
    for (const event of events) {
      switch (event.type) {
        case "mg":
        case "rifle":
        case "defenderShot":
        case "heavyShot":
        case "sniper": {
          const tracer = spawn(
            "tracer",
            event.x,
            event.y,
            event.type === "sniper" ? 0.22 : 0.08,
            event.type === "sniper" ? 2.2 : 1.2,
            TRACER_COLORS[event.type],
          );
          tracer.tx = event.tx;
          tracer.ty = event.ty;
          spawn(
            "flash",
            event.x,
            event.y,
            0.06,
            event.type === "sniper" ? 9 : 5,
            "#ffe9a8",
          );
          burst(
            "spark",
            event.tx,
            event.ty,
            event.type === "sniper" ? 6 : 2,
            70,
            0.25,
            1.4,
            "#ffd27a",
          );
          break;
        }
        case "zap":
          break;
        case "chain":
          bolts.push({ points: event.points, age: 0 });
          if (bolts.length > BOLT_LIMIT) {
            bolts.shift();
          }
          for (let index = 2; index < event.points.length; index += 2) {
            burst(
              "spark",
              event.points[index],
              event.points[index + 1],
              4,
              90,
              0.3,
              1.6,
              "#9fe7ff",
            );
          }
          break;
        case "flame": {
          const angle = event.angle ?? 0;
          const reach = event.size ?? 80;
          for (let index = 0; index < 3; index += 1) {
            const spread = angle + (Math.random() - 0.5) * 0.9;
            const particle = spawn(
              "fire",
              event.x + Math.cos(angle) * 18,
              event.y + Math.sin(angle) * 18,
              0.35 + Math.random() * 0.2,
              5 + Math.random() * 4,
              "",
            );
            const pace = reach * (2.2 + Math.random());
            particle.vx = Math.cos(spread) * pace;
            particle.vy = Math.sin(spread) * pace;
          }
          break;
        }
        case "explosion":
          spawn(
            "flash",
            event.x,
            event.y,
            0.12,
            (event.size ?? 30) * 0.9,
            "#fff1c1",
          );
          spawn(
            "ring",
            event.x,
            event.y,
            0.35,
            event.size ?? 30,
            "rgba(255,200,120,0.9)",
          );
          burst("fire", event.x, event.y, 10, 120, 0.45, 6, "");
          burst("smoke", event.x, event.y, 6, 40, 1.2, 10, "");
          burst("snow", event.x, event.y, 8, 110, 0.6, 2.4, "#ffffff");
          break;
        case "bigExplosion":
        case "mine":
          spawn(
            "flash",
            event.x,
            event.y,
            0.16,
            (event.size ?? 40) * 1.1,
            "#fff4d0",
          );
          spawn(
            "ring",
            event.x,
            event.y,
            0.5,
            (event.size ?? 40) * 1.2,
            "rgba(255,170,90,0.9)",
          );
          burst("fire", event.x, event.y, 18, 170, 0.55, 8, "");
          burst("smoke", event.x, event.y, 12, 60, 1.6, 14, "");
          burst("debris", event.x, event.y, 10, 160, 0.8, 2.6, "#4b5563");
          burst("snow", event.x, event.y, 14, 150, 0.8, 2.6, "#ffffff");
          break;
        case "slam":
          spawn(
            "ring",
            event.x,
            event.y,
            0.6,
            event.size ?? 90,
            "rgba(160,220,255,0.95)",
          );
          spawn(
            "ring",
            event.x,
            event.y,
            0.8,
            (event.size ?? 90) * 0.7,
            "rgba(255,255,255,0.8)",
          );
          burst("snow", event.x, event.y, 26, 220, 0.9, 3, "#e8f6ff");
          burst("frost", event.x, event.y, 12, 120, 0.9, 4, "#bfe8ff");
          break;
        case "hitEnemy":
        case "hitStructure":
          burst("spark", event.x, event.y, 3, 80, 0.25, 1.4, "#ffd27a");
          break;
        case "death":
          burst("debris", event.x, event.y, 6, 90, 0.6, 2, "#7f1d1d");
          burst("snow", event.x, event.y, 6, 70, 0.6, 2, "#ffffff");
          burst(
            "smoke",
            event.x,
            event.y,
            3,
            20,
            0.9,
            (event.size ?? 8) * 0.9,
            "",
          );
          break;
        case "destroyed":
          spawn(
            "flash",
            event.x,
            event.y,
            0.2,
            60 * (event.size ?? 2) * 0.5,
            "#fff1c1",
          );
          spawn(
            "ring",
            event.x,
            event.y,
            0.7,
            40 * (event.size ?? 2),
            "rgba(255,150,80,0.9)",
          );
          burst("fire", event.x, event.y, 24, 160, 0.8, 9, "");
          burst("smoke", event.x, event.y, 20, 50, 2.5, 18, "");
          burst("debris", event.x, event.y, 22, 190, 1, 3.4, "#57534e");
          break;
        case "repairSpark":
          burst("spark", event.x, event.y, 2, 40, 0.3, 1.2, "#7dd3fc");
          break;
        case "spawn":
          burst("frost", event.x, event.y, 8, 60, 0.6, 3, "#c7e9ff");
          break;
        case "loot":
          burst("gold", event.x, event.y, 10, 70, 0.7, 2.4, "#fde68a");
          break;
        case "built":
        case "upgraded":
          if (event.x !== undefined && event.y !== undefined) {
            spawn("ring", event.x, event.y, 0.6, 46, "rgba(134,239,172,0.95)");
            burst("gold", event.x, event.y, 16, 90, 0.8, 2.2, "#bbf7d0");
          }
          break;
        case "placed":
          if (event.x !== undefined && event.y !== undefined) {
            burst(
              "snow",
              event.x + 16,
              event.y + 16,
              10,
              60,
              0.6,
              2.4,
              "#ffffff",
            );
          }
          break;
        case "cannon":
        case "siegeFire":
          if (event.x !== undefined && event.y !== undefined) {
            spawn("flash", event.x, event.y, 0.1, 14, "#ffe2a0");
            burst("smoke", event.x, event.y, 4, 30, 0.9, 7, "");
          }
          break;
        case "damage":
          if (showNumbers && numbers < NUMBER_LIMIT) {
            const particle = spawn(
              "number",
              event.x + (Math.random() - 0.5) * 10,
              event.y - 10,
              0.7,
              1,
              "#ffffff",
            );
            particle.vy = -38;
            particle.value = event.amount;
          }
          break;
        default:
          break;
      }
    }
  };

  const update = (dt: number): void => {
    numbers = 0;
    const drag = Math.max(0, 1 - DRAG * dt);
    for (const particle of pool) {
      if (particle.alive) {
        particle.age += dt;
        if (particle.age >= particle.life) {
          particle.alive = false;
        } else {
          particle.x += particle.vx * dt;
          particle.y += particle.vy * dt;
          if (particle.look !== "number") {
            particle.vx *= drag;
            particle.vy *= drag;
          }
          if (particle.look === "smoke") {
            particle.vy += RISE * dt;
          }
          numbers += particle.look === "number" ? 1 : 0;
        }
      }
    }
    for (const bolt of bolts) {
      bolt.age += dt;
    }
    while (bolts.length > 0 && bolts[0].age > 0.18) {
      bolts.shift();
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, zoom: number): void => {
    ctx.save();
    for (const particle of pool) {
      if (particle.alive) {
        const t = particle.age / particle.life;
        drawParticle(ctx, particle, t, zoom);
      }
    }
    ctx.globalCompositeOperation = "lighter";
    for (const bolt of bolts) {
      const fade = 1 - bolt.age / 0.18;
      drawBolt(ctx, bolt.points, fade);
    }
    ctx.restore();
  };
  /* eslint-enable @typescript-eslint/no-magic-numbers */

  const clear = (): void => {
    for (const particle of pool) {
      particle.alive = false;
    }
    bolts.length = 0;
  };

  return { add, update, draw, clear };
}

/** Colours of the tracers per shooter. */
const TRACER_COLORS: Readonly<Record<string, string>> = {
  mg: "rgba(255,226,140,0.95)",
  sniper: "rgba(255,255,255,0.95)",
  rifle: "rgba(255,120,90,0.9)",
  heavyShot: "rgba(255,90,60,0.95)",
  defenderShot: "rgba(150,210,255,0.95)",
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- the particle looks */

/** One particle. */
function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  t: number,
  zoom: number,
): void {
  switch (particle.look) {
    case "spark":
    case "gold":
    case "frost":
    case "snow":
    case "debris":
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        particle.x - particle.size / 2,
        particle.y - particle.size / 2,
        particle.size,
        particle.size,
      );
      break;
    case "smoke": {
      ctx.globalAlpha = 0.45 * (1 - t);
      ctx.fillStyle = t < 0.2 ? "#52525b" : "#9ca3af";
      ctx.beginPath();
      ctx.arc(
        particle.x,
        particle.y,
        particle.size * (0.6 + t),
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    }
    case "fire": {
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = t < 0.3 ? "#fff3b0" : t < 0.6 ? "#fb923c" : "#b91c1c";
      ctx.beginPath();
      ctx.arc(
        particle.x,
        particle.y,
        particle.size * (1 - t * 0.5),
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    }
    case "flash":
      // Two plain discs instead of a gradient: much cheaper to raster.
      ctx.globalAlpha = (1 - t) * 0.45;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1 - t;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 0.45, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "ring":
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 3 * (1 - t) + 1;
      ctx.beginPath();
      ctx.arc(
        particle.x,
        particle.y,
        particle.size * (0.3 + t * 0.9),
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      break;
    case "tracer":
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = particle.size;
      ctx.beginPath();
      ctx.moveTo(
        particle.x + (particle.tx - particle.x) * t * 0.6,
        particle.y + (particle.ty - particle.y) * t * 0.6,
      );
      ctx.lineTo(particle.tx, particle.ty);
      ctx.stroke();
      break;
    case "number":
      ctx.globalAlpha = 1 - t * t;
      ctx.font = `bold ${Math.round(11 / Math.max(0.6, zoom))}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 3 / Math.max(0.6, zoom);
      ctx.strokeStyle = "rgba(15,23,42,0.85)";
      ctx.strokeText(String(particle.value), particle.x, particle.y);
      ctx.fillStyle = particle.value >= 100 ? "#fde047" : "#ffffff";
      ctx.fillText(String(particle.value), particle.x, particle.y);
      break;
    case "bolt":
      break;
  }
  ctx.globalAlpha = 1;
}

/** A jagged lightning line through some points. */
function drawBolt(
  ctx: CanvasRenderingContext2D,
  points: readonly number[],
  fade: number,
): void {
  for (const [width, color] of [
    [6, `rgba(80,180,255,${0.35 * fade})`],
    [2.2, `rgba(220,245,255,${fade})`],
  ] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let index = 2; index < points.length; index += 2) {
      const fromX = points[index - 2];
      const fromY = points[index - 1];
      const toX = points[index];
      const toY = points[index + 1];
      for (let step = 1; step <= 4; step += 1) {
        const t = step / 4;
        const jitter = step === 4 ? 0 : 7;
        ctx.lineTo(
          fromX + (toX - fromX) * t + (Math.random() - 0.5) * jitter,
          fromY + (toY - fromY) * t + (Math.random() - 0.5) * jitter,
        );
      }
    }
    ctx.stroke();
  }
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
