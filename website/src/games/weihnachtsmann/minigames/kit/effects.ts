/**
 * Juice for minigames: bursts of sparks, confetti and snow, little texts
 * that float up ("+1", "Super!"), and a screen shake.
 *
 * @module
 * @remarks
 * One {@link Effects} per run: call `update` from `step` and `draw` from
 * `draw` (texts need `g.text`, so `draw` takes the whole draw kit). The
 * shake offset is applied by translating the field before drawing the scene.
 */
import { snap } from "@/games/weihnachtsmann/components/sprites";
import type { MiniDraw } from "../types";
import type { Random } from "./random";

/** One spark, flake or scrap of confetti. */
type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  readonly life: number;
  readonly color: string;
  readonly size: number;
  /** Pull downwards, logical px per second squared. */
  readonly gravity: number;
};

/** A text floating up and fading. */
type FloatText = {
  readonly text: string;
  x: number;
  y: number;
  age: number;
  readonly color: string;
  readonly size: number;
};

/** How a burst looks. */
export type BurstStyle = {
  /** How many pieces. */
  readonly count?: number;
  /** Fastest speed, logical px per second. */
  readonly speed?: number;
  /** Colours to pick from. */
  readonly colors?: readonly string[];
  /** Pull downwards, logical px per second squared. */
  readonly gravity?: number;
  /** Seconds each piece lives. */
  readonly life?: number;
  /** Size of a piece, logical px. */
  readonly size?: number;
};

/** Sparks, floating texts and the shake of one run. */
export type Effects = {
  /** Throws out a burst of pieces from a point. */
  burst(x: number, y: number, style?: BurstStyle): void;
  /** Lets a text float up from a point. */
  float(
    text: string,
    x: number,
    y: number,
    color?: string,
    size?: number,
  ): void;
  /** Shakes the field; strength in logical px, it dies down by itself. */
  shake(strength: number): void;
  /** Moves everything on. */
  update(dt: number): void;
  /** Draws the pieces and the texts. */
  draw(g: MiniDraw): void;
  /** Where the field is pushed by the shake right now, logical px. */
  offset(): { x: number; y: number };
};

/** Festive colours for bursts by default. */
export const FESTIVE = [
  "#ffd84a",
  "#ff5a6a",
  "#7ae08a",
  "#7ac8ff",
  "#ffffff",
] as const;

/** Defaults of a burst. */
const BURST_COUNT = 14;
const BURST_SPEED = 70;
const BURST_GRAVITY = 120;
const BURST_LIFE = 0.7;
const BURST_SIZE = 1.5;

/** The slowest piece of a burst, as a share of the fastest. */
const SLOWEST = 0.25;

/** How long a floating text lives, seconds, and how fast it rises. */
const FLOAT_LIFE = 0.9;
const FLOAT_RISE = 22;

/** Size of a floating text by default, logical px. */
const FLOAT_SIZE = 8;

/** How fast a shake dies down, per second. */
const SHAKE_DECAY = 9;

/** Most pieces alive at once. */
const MAX_SPARKS = 400;

/** How quickly the pieces slow down in the air, per second. */
const DRAG = 1.5;

/**
 * Creates the effects of one run.
 *
 * @param random - the run's random source, so bursts can be replayed
 * @returns the effects
 */
export function createEffects(random: Random): Effects {
  const sparks: Spark[] = [];
  const texts: FloatText[] = [];
  let shakeLeft = 0;
  let shakeX = 0;
  let shakeY = 0;
  return {
    burst(x, y, style = {}) {
      const colors = style.colors ?? FESTIVE;
      const speed = style.speed ?? BURST_SPEED;
      for (let k = 0; k < (style.count ?? BURST_COUNT); k += 1) {
        const angle = random.range(0, Math.PI * 2);
        const v = random.range(speed * SLOWEST, speed);
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          age: 0,
          life: (style.life ?? BURST_LIFE) * random.range(1 / 2, 1),
          color: random.pick(colors),
          size: style.size ?? BURST_SIZE,
          gravity: style.gravity ?? BURST_GRAVITY,
        });
      }
      sparks.splice(0, Math.max(0, sparks.length - MAX_SPARKS));
    },
    float(text, x, y, color = "#ffe9a8", size = FLOAT_SIZE) {
      texts.push({ text, x, y, age: 0, color, size });
    },
    shake(strength) {
      shakeLeft = Math.max(shakeLeft, strength);
    },
    update(dt) {
      for (const spark of sparks) {
        spark.age += dt;
        spark.vy += spark.gravity * dt;
        spark.vx *= 1 - DRAG * dt;
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
      }
      for (const text of texts) {
        text.age += dt;
        text.y -= FLOAT_RISE * dt;
      }
      removeWhere(sparks, (spark) => spark.age >= spark.life);
      removeWhere(texts, (text) => text.age >= FLOAT_LIFE);
      shakeLeft = Math.max(0, shakeLeft - shakeLeft * SHAKE_DECAY * dt);
      shakeX = shakeLeft > 0 ? random.range(-shakeLeft, shakeLeft) : 0;
      shakeY = shakeLeft > 0 ? random.range(-shakeLeft, shakeLeft) : 0;
    },
    draw(g) {
      for (const spark of sparks) {
        g.ctx.globalAlpha = Math.max(0, 1 - spark.age / spark.life);
        g.ctx.fillStyle = spark.color;
        g.ctx.fillRect(snap(spark.x), snap(spark.y), spark.size, spark.size);
      }
      g.ctx.globalAlpha = 1;
      for (const text of texts) {
        g.text(text.text, text.x, text.y, {
          size: text.size,
          bold: true,
          align: "center",
          baseline: "middle",
          color: text.color,
          outline: "#2a1430",
          alpha: Math.max(0, 1 - text.age / FLOAT_LIFE),
        });
      }
    },
    offset() {
      return { x: snap(shakeX), y: snap(shakeY) };
    },
  };
}

/** Removes the entries of a list that pass a test, in place. */
function removeWhere<T>(list: T[], gone: (item: T) => boolean): void {
  let keep = 0;
  for (const item of list) {
    if (!gone(item)) {
      list[keep] = item;
      keep += 1;
    }
  }
  list.length = keep;
}
