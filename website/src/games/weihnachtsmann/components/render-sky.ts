/**
 * The sky over the map outside: the dark of the night laid over the
 * picture, the northern lights waving at the top, and the dense driving
 * snow and white haze of a snowstorm.
 *
 * @module
 * @remarks
 * Only outside; rooms and minigames stay as they are. Everything here is a
 * few big fills, gradients and dots, so the picture keeps its frame rate.
 */
import {
  auroraStrength,
  darkness,
  stormStrength,
} from "@/games/weihnachtsmann/engine/sky";
import type { GameState } from "@/games/weihnachtsmann/engine/types";
import { snap } from "./sprites";

/** The size of the visible part of the map, map px. */
type View = { readonly w: number; readonly h: number };

/** How dark the night tint gets, and its colour. */
const NIGHT_ALPHA = 0.55;
const NIGHT_RGB = "12, 18, 58";

/** How much the lights outside shine by day, and how much more at night. */
const DAY_LIGHT = 0.3;
const NIGHT_LIGHT = 1.05;

/** How much larger the lights' glow grows at night. */
const NIGHT_REACH = 0.5;

/** The curtains of the northern lights: colour, height, speed. */
const AURORA_BANDS: readonly {
  readonly rgb: string;
  readonly top: number;
  readonly depth: number;
  readonly speed: number;
  readonly phase: number;
}[] = [
  { rgb: "80, 255, 160", top: 4, depth: 30, speed: 0.35, phase: 0 },
  { rgb: "120, 220, 255", top: 12, depth: 22, speed: -0.27, phase: 2 },
  { rgb: "200, 120, 255", top: 0, depth: 18, speed: 0.21, phase: 4 },
];

/** Points along one curtain. */
const AURORA_STEPS = 24;

/** Flakes of a storm, and the white haze at its height. */
const STORM_FLAKES = 320;
const STORM_HAZE = 0.18;

/**
 * How strongly the lights outside shine right now: faint by day, bright at
 * night.
 *
 * @param state - the game
 * @returns a factor for their strength, and one for their size
 */
export function lightBoost(state: GameState): {
  strength: number;
  reach: number;
} {
  const dark = state.viewArea === "outdoors" ? darkness(state) : 1;
  return state.viewArea === "outdoors"
    ? {
        strength: DAY_LIGHT + (NIGHT_LIGHT - DAY_LIGHT) * dark,
        reach: 1 + NIGHT_REACH * dark,
      }
    : { strength: 1, reach: 1 };
}

/**
 * The night's darkness over the picture outside, before the lights.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param cx - left of the view, map px
 * @param cy - top of the view, map px
 */
export function drawNight(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cx: number,
  cy: number,
): void {
  const dark = darkness(state);
  if (state.viewArea === "outdoors" && dark > 0) {
    ctx.fillStyle = `rgba(${NIGHT_RGB}, ${String(NIGHT_ALPHA * dark)})`;
    ctx.fillRect(cx, cy, state.view.w, state.view.h);
  }
}

/**
 * The northern lights and the snowstorm, over the picture outside.
 *
 * @param ctx - the buffer, view corner at 0, 0
 * @param state - the game
 * @param cx - left of the view, map px, for the snow's drift
 * @param cy - top of the view, map px
 */
export function drawSky(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cx: number,
  cy: number,
): void {
  if (state.viewArea === "outdoors") {
    const aurora = auroraStrength(state);
    if (aurora > 0) {
      drawAurora(ctx, state.time, aurora, state.view);
    }
    const storm = stormStrength(state);
    if (storm > 0) {
      drawStorm(ctx, state.time, storm, cx, cy, state.view);
    }
  }
}

/** Curtains of green, blue and violet light waving across the top. */
function drawAurora(
  ctx: CanvasRenderingContext2D,
  time: number,
  strength: number,
  view: View,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const band of AURORA_BANDS) {
    const gradient = ctx.createLinearGradient(
      0,
      band.top,
      0,
      band.top + band.depth * 2,
    );
    /* eslint-disable @typescript-eslint/no-magic-numbers -- the fade of a
       curtain from its bright lower hem up into the dark */
    gradient.addColorStop(0, `rgba(${band.rgb}, 0)`);
    gradient.addColorStop(
      0.55,
      `rgba(${band.rgb}, ${String(0.26 * strength)})`,
    );
    gradient.addColorStop(
      0.75,
      `rgba(${band.rgb}, ${String(0.12 * strength)})`,
    );
    gradient.addColorStop(1, `rgba(${band.rgb}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    for (let k = 0; k <= AURORA_STEPS; k += 1) {
      const x = (k / AURORA_STEPS) * view.w;
      const wave =
        Math.sin(k * 0.45 + time * band.speed * 3 + band.phase) * 8 +
        Math.sin(k * 0.9 - time * band.speed * 5) * 4;
      const y = band.top + band.depth + wave;
      if (k === 0) {
        ctx.moveTo(x, band.top - 4);
      }
      ctx.lineTo(x, y + band.depth * 0.6);
    }
    for (let k = AURORA_STEPS; k >= 0; k -= 1) {
      const x = (k / AURORA_STEPS) * view.w;
      const wave = Math.sin(k * 0.3 + time * band.speed * 2 + band.phase) * 6;
      ctx.lineTo(x, band.top + wave);
    }
    /* eslint-enable @typescript-eslint/no-magic-numbers */
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- drift of the
   storm's flakes, picked by eye */
/** Dense snow driven sideways, and a white haze that hides the distance. */
function drawStorm(
  ctx: CanvasRenderingContext2D,
  time: number,
  strength: number,
  cx: number,
  cy: number,
  view: View,
): void {
  ctx.fillStyle = `rgba(232, 238, 250, ${String(STORM_HAZE * strength)})`;
  ctx.fillRect(0, 0, view.w, view.h);
  // The distance disappears in white: thick at the edges, clear round the
  // middle where the character walks.
  const haze = ctx.createRadialGradient(
    view.w / 2,
    view.h / 2,
    view.h * 0.25,
    view.w / 2,
    view.h / 2,
    Math.hypot(view.w, view.h) / 2,
  );
  haze.addColorStop(0, "rgba(240, 244, 252, 0)");
  haze.addColorStop(1, `rgba(240, 244, 252, ${String(0.75 * strength)})`);
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, view.w, view.h);
  const count = Math.round(STORM_FLAKES * strength);
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  for (let k = 0; k < count; k += 1) {
    const near = k % 3 === 0;
    const parallax = near ? 1.3 : 0.7;
    const x = mod(
      k * 61.7 - time * (150 + (k % 5) * 20) - cx * parallax,
      view.w,
    );
    const y = mod(k * 37.3 + time * (60 + (k % 7) * 8) - cy * parallax, view.h);
    // Driven sideways: short streaks rather than dots.
    const length = near ? 4 : 2;
    const thick = near ? 1 : 0.5;
    ctx.fillRect(snap(x), snap(y), length, thick);
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Remainder that is never negative. */
function mod(value: number, by: number): number {
  return ((value % by) + by) % by;
}
