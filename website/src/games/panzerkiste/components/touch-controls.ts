/**
 * Twin-stick touch controls for Panzerkiste on a phone.
 *
 * @module
 * @remarks
 * There is no keyboard or mouse on a touch screen, so the two halves of the
 * canvas become two virtual joysticks that appear under the thumb that presses
 * them: the left half drives the tank, the right half turns the turret and
 * fires while it is held. A small button in the bottom-right corner lays a mine.
 *
 * The controller only listens and remembers; it never advances the game. A hook
 * samples it once per frame and folds the result into the same {@link Input} the
 * keyboard and mouse produce, so the engine stays unaware of the input device.
 */
import type { Vec } from "@/games/panzerkiste/engine/types";

/** Largest thumb travel a stick reads, in canvas pixels. */
const STICK_MAX_RADIUS = 64;

/** Fraction of the travel ignored around the centre, so a still thumb is zero. */
const STICK_DEADZONE = 0.2;

/** Radius of the mine button, in canvas pixels. */
const MINE_BUTTON_RADIUS = 34;

/** Distance from the bottom-right corner to the mine button's centre, pixels. */
const MINE_BUTTON_MARGIN = 52;

/** How many spikes the mine glyph draws. */
const MINE_SPIKES = 8;

/** The mine glyph's core radius, as a fraction of the button radius. */
const MINE_CORE_FRACTION = 0.4;

/** The mine glyph's spike length, as a fraction of the button radius. */
const MINE_SPIKE_FRACTION = 0.68;

/** Line width of the stick and button outlines. */
const OUTLINE_WIDTH = 3;

/** Radius of the stick knob (the moving dot), in canvas pixels. */
const KNOB_RADIUS = 26;

/** The default turret direction before the aim stick has been touched. */
const DEFAULT_AIM: Vec = { x: 1, y: 0 };

/** A stick drawn on screen: where it was pressed and where the thumb is now. */
export type StickView = {
  readonly baseX: number;
  readonly baseY: number;
  readonly tipX: number;
  readonly tipY: number;
};

/** One frame's touch input, in the same terms the engine's {@link Input} uses. */
export type TouchSample = {
  /** True once any touch has happened, so the hook switches to touch input. */
  readonly engaged: boolean;
  /** The drive axis, each component in [-1, 1]. */
  readonly move: Vec;
  /** A unit vector for the turret direction (kept while the stick is released). */
  readonly aimDir: Vec;
  /** True while the aim stick is held, for auto-fire (the reload gates the rate). */
  readonly fire: boolean;
  readonly left: StickView | null;
  readonly right: StickView | null;
};

/** A live twin-stick controller bound to one canvas. */
export type TouchControls = {
  /** The current input for this frame. */
  sample(): TouchSample;
  /** Whether a fresh mine tap is waiting, clearing it. */
  consumeMine(): boolean;
  /** Removes the listeners. */
  dispose(): void;
};

/** Internal mutable state of one stick. */
type Stick = {
  id: number;
  baseX: number;
  baseY: number;
  tipX: number;
  tipY: number;
};

/**
 * Creates twin-stick touch controls on a canvas.
 *
 * @param canvas - the game canvas to read touches from
 * @returns the controller the hook samples each frame
 */
export function createTouchControls(canvas: HTMLCanvasElement): TouchControls {
  let left: Stick | null = null;
  let right: Stick | null = null;
  let aimDir: Vec = DEFAULT_AIM;
  let engaged = false;
  let minePending = false;

  const toCanvas = (touch: Touch): Vec => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((touch.clientX - rect.left) / rect.width) * canvas.width,
      y: ((touch.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const inMineButton = (point: Vec): boolean => {
    const cx = canvas.width - MINE_BUTTON_MARGIN;
    const cy = canvas.height - MINE_BUTTON_MARGIN;
    return Math.hypot(point.x - cx, point.y - cy) <= MINE_BUTTON_RADIUS;
  };

  const onStart = (event: TouchEvent) => {
    event.preventDefault();
    engaged = true;
    for (const touch of Array.from(event.changedTouches)) {
      const point = toCanvas(touch);
      const stick: Stick = {
        id: touch.identifier,
        baseX: point.x,
        baseY: point.y,
        tipX: point.x,
        tipY: point.y,
      };
      if (inMineButton(point)) {
        minePending = true;
      } else if (point.x <= canvas.width / 2 && left === null) {
        left = stick;
      } else if (point.x > canvas.width / 2 && right === null) {
        right = stick;
      }
    }
  };

  const onMove = (event: TouchEvent) => {
    event.preventDefault();
    for (const touch of Array.from(event.changedTouches)) {
      const point = toCanvas(touch);
      if (left !== null && touch.identifier === left.id) {
        left.tipX = point.x;
        left.tipY = point.y;
      } else if (right !== null && touch.identifier === right.id) {
        right.tipX = point.x;
        right.tipY = point.y;
        aimDir = directionOf(right, aimDir);
      }
    }
  };

  const onEnd = (event: TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      if (left !== null && touch.identifier === left.id) {
        left = null;
      } else if (right !== null && touch.identifier === right.id) {
        right = null;
      }
    }
  };

  canvas.addEventListener("touchstart", onStart, { passive: false });
  canvas.addEventListener("touchmove", onMove, { passive: false });
  canvas.addEventListener("touchend", onEnd);
  canvas.addEventListener("touchcancel", onEnd);

  return {
    sample(): TouchSample {
      return {
        engaged,
        move: left === null ? { x: 0, y: 0 } : axisOf(left),
        aimDir,
        fire: right !== null,
        left: left === null ? null : viewOf(left),
        right: right === null ? null : viewOf(right),
      };
    },
    consumeMine(): boolean {
      const had = minePending;
      minePending = false;
      return had;
    },
    dispose(): void {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onEnd);
      canvas.removeEventListener("touchcancel", onEnd);
    },
  };
}

/** The drive axis of a stick, clamped to the unit disc, with a dead centre. */
function axisOf(stick: Stick): Vec {
  const dx = stick.tipX - stick.baseX;
  const dy = stick.tipY - stick.baseY;
  const distance = Math.hypot(dx, dy);
  let axis: Vec = { x: 0, y: 0 };
  if (distance > STICK_MAX_RADIUS * STICK_DEADZONE) {
    const reach = Math.min(distance, STICK_MAX_RADIUS);
    axis = {
      x: (dx / distance) * (reach / STICK_MAX_RADIUS),
      y: (dy / distance) * (reach / STICK_MAX_RADIUS),
    };
  }
  return axis;
}

/** The aim direction of a stick, keeping the last one while inside the dead zone. */
function directionOf(stick: Stick, previous: Vec): Vec {
  const dx = stick.tipX - stick.baseX;
  const dy = stick.tipY - stick.baseY;
  const distance = Math.hypot(dx, dy);
  return distance > STICK_MAX_RADIUS * STICK_DEADZONE
    ? { x: dx / distance, y: dy / distance }
    : previous;
}

/** The on-screen view of a stick, with the knob clamped to the ring. */
function viewOf(stick: Stick): StickView {
  const dx = stick.tipX - stick.baseX;
  const dy = stick.tipY - stick.baseY;
  const distance = Math.hypot(dx, dy);
  const reach = Math.min(distance, STICK_MAX_RADIUS);
  const scale = distance === 0 ? 0 : reach / distance;
  return {
    baseX: stick.baseX,
    baseY: stick.baseY,
    tipX: stick.baseX + dx * scale,
    tipY: stick.baseY + dy * scale,
  };
}

/** Semi-transparent white for the stick rings and knobs. */
const TOUCH_LIGHT = "rgba(255, 255, 255, 0.35)";

/** Stronger white for the knob fills and outlines. */
const TOUCH_STRONG = "rgba(255, 255, 255, 0.55)";

/** Warm tint for the aim stick and the mine button, to set them apart. */
const TOUCH_WARM = "rgba(251, 191, 36, 0.6)";

/**
 * Draws the on-screen sticks and the mine button over the game.
 *
 * @param ctx - the canvas context, already holding the drawn frame
 * @param sample - the current touch sample
 * @remarks
 * Nothing is drawn until the player has touched the screen once, so the desktop
 * view stays clean.
 */
export function drawTouchControls(
  ctx: CanvasRenderingContext2D,
  sample: TouchSample,
): void {
  if (sample.engaged) {
    drawMineButton(ctx);
    if (sample.left !== null) {
      drawStick(ctx, sample.left, TOUCH_LIGHT, TOUCH_STRONG);
    }
    if (sample.right !== null) {
      drawStick(ctx, sample.right, TOUCH_WARM, TOUCH_WARM);
    }
  }
}

/** Draws one stick: the ring where it was pressed and the knob at the thumb. */
function drawStick(
  ctx: CanvasRenderingContext2D,
  view: StickView,
  ring: string,
  knob: string,
): void {
  ctx.save();
  ctx.lineWidth = OUTLINE_WIDTH;
  ctx.strokeStyle = ring;
  ctx.beginPath();
  ctx.arc(view.baseX, view.baseY, STICK_MAX_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = knob;
  ctx.beginPath();
  ctx.arc(view.tipX, view.tipY, KNOB_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draws the corner mine button as a spiked disc. */
function drawMineButton(ctx: CanvasRenderingContext2D): void {
  const cx = ctx.canvas.width - MINE_BUTTON_MARGIN;
  const cy = ctx.canvas.height - MINE_BUTTON_MARGIN;
  ctx.save();
  ctx.strokeStyle = TOUCH_WARM;
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = OUTLINE_WIDTH;
  ctx.beginPath();
  ctx.arc(cx, cy, MINE_BUTTON_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // A small spiked core, so the button reads as a mine.
  const core = MINE_BUTTON_RADIUS * MINE_CORE_FRACTION;
  const spike = MINE_BUTTON_RADIUS * MINE_SPIKE_FRACTION;
  ctx.strokeStyle = TOUCH_WARM;
  for (let i = 0; i < MINE_SPIKES; i++) {
    const angle = (i / MINE_SPIKES) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * core, cy + Math.sin(angle) * core);
    ctx.lineTo(cx + Math.cos(angle) * spike, cy + Math.sin(angle) * spike);
    ctx.stroke();
  }
  ctx.fillStyle = TOUCH_WARM;
  ctx.beginPath();
  ctx.arc(cx, cy, core, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
