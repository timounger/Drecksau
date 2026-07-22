/**
 * Touch controls for Panzerkiste on a phone: a left drive stick, and a right
 * side where a quick tap fires and a long press lays a mine.
 *
 * @module
 * @remarks
 * There is no keyboard or mouse on a touch screen, so the left half of the
 * canvas becomes a virtual joystick that appears under the thumb that presses
 * it and drives the tank. The right half aims and acts: the turret points at
 * the touched floor spot, a quick tap fires one shell, and holding the finger
 * down past a short threshold lays a mine instead (a filling ring shows the
 * hold). A mine drops at the tank, so the aim spot only turns the turret.
 *
 * The controller only listens and remembers; it never advances the game. A hook
 * samples it once per frame and folds the result into the same {@link Input} the
 * keyboard and mouse produce, so the engine stays unaware of the input device.
 */
import { unprojectFloor } from "@/games/panzerkiste/components/projection";
import type { Vec } from "@/games/panzerkiste/engine/types";

/** Largest thumb travel the drive stick reads, in canvas pixels. */
const STICK_MAX_RADIUS = 64;

/** Fraction of the travel ignored around the centre, so a still thumb is zero. */
const STICK_DEADZONE = 0.2;

/** How long the right thumb must stay down to lay a mine instead of firing, ms. */
const LONG_PRESS_MS = 280;

/** Line width of the stick and hold-ring outlines. */
const OUTLINE_WIDTH = 3;

/** Radius of the stick knob (the moving dot), in canvas pixels. */
const KNOB_RADIUS = 26;

/** Radius of the mine hold-ring drawn under the right thumb, in canvas pixels. */
const HOLD_RING_RADIUS = 30;

/** A quarter turn, the angle a full progress arc starts from (straight up). */
const ARC_START = -Math.PI / 2;

/** A stick drawn on screen: where it was pressed and where the thumb is now. */
export type StickView = {
  readonly baseX: number;
  readonly baseY: number;
  readonly tipX: number;
  readonly tipY: number;
};

/** The mine hold-ring drawn under the right thumb, filling as the press grows. */
export type ChargeView = {
  readonly x: number;
  readonly y: number;
  /** How far the hold has come, from 0 to 1; a mine drops at 1. */
  readonly progress: number;
};

/** One frame's touch input, in the same terms the engine's {@link Input} uses. */
export type TouchSample = {
  /** True once any touch has happened, so the hook switches to touch input. */
  readonly engaged: boolean;
  /** The drive axis, each component in [-1, 1]. */
  readonly move: Vec;
  /** The floor spot the turret aims at (the last touched point, or the centre). */
  readonly aim: Vec;
  /** The drive stick to draw, or null when it is not held. */
  readonly left: StickView | null;
  /** The mine hold-ring to draw, or null when the right thumb is up. */
  readonly charge: ChargeView | null;
};

/** A live touch controller bound to one canvas. */
export type TouchControls = {
  /** The current input for this frame. */
  sample(): TouchSample;
  /** Whether a fresh tap wants to fire, clearing it. */
  consumeFire(): boolean;
  /** Whether a fresh long press wants to lay a mine, clearing it. */
  consumeMine(): boolean;
  /** Removes the listeners. */
  dispose(): void;
};

/** Internal mutable state of the drive stick. */
type Stick = {
  id: number;
  baseX: number;
  baseY: number;
  tipX: number;
  tipY: number;
};

/** Internal mutable state of the right-hand aim/fire/mine touch. */
type Aim = {
  id: number;
  startMs: number;
  canvasX: number;
  canvasY: number;
  point: Vec;
  /** True once this press has grown long enough to have laid a mine. */
  mined: boolean;
};

/**
 * Creates touch controls on a canvas: a left drive stick and tap/hold on the right.
 *
 * @param canvas - the game canvas to read touches from
 * @returns the controller the hook samples each frame
 */
export function createTouchControls(canvas: HTMLCanvasElement): TouchControls {
  let left: Stick | null = null;
  let aim: Aim | null = null;
  let lastAim: Vec | null = null;
  let engaged = false;
  let firePending = false;
  let minePending = false;

  const toCanvas = (touch: Touch): Vec => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((touch.clientX - rect.left) / rect.width) * canvas.width,
      y: ((touch.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const onStart = (event: TouchEvent) => {
    event.preventDefault();
    engaged = true;
    for (const touch of Array.from(event.changedTouches)) {
      const point = toCanvas(touch);
      if (point.x <= canvas.width / 2 && left === null) {
        left = {
          id: touch.identifier,
          baseX: point.x,
          baseY: point.y,
          tipX: point.x,
          tipY: point.y,
        };
      } else if (aim === null) {
        // Right half: aim the turret here; a tap fires, a long press mines.
        const floor = unprojectFloor(point.x, point.y);
        aim = {
          id: touch.identifier,
          startMs: performance.now(),
          canvasX: point.x,
          canvasY: point.y,
          point: floor,
          mined: false,
        };
        lastAim = floor;
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
      } else if (aim !== null && touch.identifier === aim.id) {
        aim.canvasX = point.x;
        aim.canvasY = point.y;
        aim.point = unprojectFloor(point.x, point.y);
        lastAim = aim.point;
      }
    }
  };

  const onEnd = (event: TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      if (left !== null && touch.identifier === left.id) {
        left = null;
      } else if (aim !== null && touch.identifier === aim.id) {
        // A short tap that never became a mine fires one shell on release.
        if (!aim.mined) {
          firePending = true;
        }
        aim = null;
      }
    }
  };

  canvas.addEventListener("touchstart", onStart, { passive: false });
  canvas.addEventListener("touchmove", onMove, { passive: false });
  canvas.addEventListener("touchend", onEnd);
  canvas.addEventListener("touchcancel", onEnd);

  // Lays the mine once the right thumb has been held past the threshold.
  const ripen = () => {
    if (
      aim !== null &&
      !aim.mined &&
      performance.now() - aim.startMs >= LONG_PRESS_MS
    ) {
      aim.mined = true;
      minePending = true;
    }
  };

  return {
    sample(): TouchSample {
      ripen();
      return {
        engaged,
        move: left === null ? { x: 0, y: 0 } : axisOf(left),
        aim: lastAim ?? centreFloor(canvas),
        left: left === null ? null : viewOf(left),
        charge: chargeOf(aim),
      };
    },
    consumeFire(): boolean {
      const had = firePending;
      firePending = false;
      return had;
    },
    consumeMine(): boolean {
      ripen();
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

/** The hold-ring for the current right-hand touch, or null when there is none. */
function chargeOf(aim: Aim | null): ChargeView | null {
  return aim === null
    ? null
    : {
        x: aim.canvasX,
        y: aim.canvasY,
        progress: Math.min(
          1,
          (performance.now() - aim.startMs) / LONG_PRESS_MS,
        ),
      };
}

/** The floor point under the canvas centre, the resting turret target. */
function centreFloor(canvas: HTMLCanvasElement): Vec {
  return unprojectFloor(canvas.width / 2, canvas.height / 2);
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

/** Semi-transparent white for the stick ring and knob. */
const TOUCH_LIGHT = "rgba(255, 255, 255, 0.35)";

/** Stronger white for the knob fill. */
const TOUCH_STRONG = "rgba(255, 255, 255, 0.55)";

/** Warm tint for the mine hold-ring, to set it apart. */
const TOUCH_WARM = "rgba(251, 191, 36, 0.85)";

/**
 * Draws the drive stick and the mine hold-ring over the game.
 *
 * @param ctx - the canvas context, already holding the drawn frame
 * @param sample - the current touch sample
 * @remarks
 * Nothing is drawn until the player has touched the screen once, so the desktop
 * view stays clean. Aiming needs no widget - the turret shows where the last
 * touch pointed it; the hold-ring only appears while the right thumb is down.
 */
export function drawTouchControls(
  ctx: CanvasRenderingContext2D,
  sample: TouchSample,
): void {
  if (sample.engaged) {
    if (sample.left !== null) {
      drawStick(ctx, sample.left);
    }
    if (sample.charge !== null) {
      drawCharge(ctx, sample.charge);
    }
  }
}

/** Draws the drive stick: the ring where it was pressed and the knob at the thumb. */
function drawStick(ctx: CanvasRenderingContext2D, view: StickView): void {
  ctx.save();
  ctx.lineWidth = OUTLINE_WIDTH;
  ctx.strokeStyle = TOUCH_LIGHT;
  ctx.beginPath();
  ctx.arc(view.baseX, view.baseY, STICK_MAX_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = TOUCH_STRONG;
  ctx.beginPath();
  ctx.arc(view.tipX, view.tipY, KNOB_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draws the mine hold-ring under the right thumb, filling clockwise as it grows.
 *
 * @param ctx - the canvas context
 * @param charge - the ring's centre and how far the hold has come
 */
function drawCharge(ctx: CanvasRenderingContext2D, charge: ChargeView): void {
  ctx.save();
  ctx.lineWidth = OUTLINE_WIDTH;
  // The faint full circle, then the warm arc that fills as the press grows.
  ctx.strokeStyle = TOUCH_LIGHT;
  ctx.beginPath();
  ctx.arc(charge.x, charge.y, HOLD_RING_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = TOUCH_WARM;
  ctx.beginPath();
  ctx.arc(
    charge.x,
    charge.y,
    HOLD_RING_RADIUS,
    ARC_START,
    ARC_START + charge.progress * Math.PI * 2,
  );
  ctx.stroke();
  // A filled core once the mine is armed, so the drop is obvious.
  if (charge.progress >= 1) {
    ctx.fillStyle = TOUCH_WARM;
    ctx.beginPath();
    ctx.arc(charge.x, charge.y, KNOB_RADIUS / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
