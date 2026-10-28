/**
 * Drawing the Advent gates: the gate pictures with their number plates, the
 * gold star of a finished gate, the glow and arrow over the next one, the
 * name of a gate one stands at, and an arrow at the edge of the picture that
 * points the way to the next gate.
 *
 * @module
 */
import { gateLocked } from "@/games/weihnachtsmann/engine/calendar";
import { gateFront, nextGate } from "@/games/weihnachtsmann/engine/gates";
import { GATE_WIDTH, TILE } from "@/games/weihnachtsmann/engine/map";
import type {
  Gate,
  GateStyle,
  GameMap,
  GameState,
} from "@/games/weihnachtsmann/engine/types";
import { WM_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { miniGame } from "@/games/weihnachtsmann/minigames";
import { EFFECTS, OBJECTS, type ObjectName } from "./sprite-atlas";
import { blit, snap, type Art } from "./sprites";

/** Something to draw at the depth of its foot line; as in `render.ts`. */
type Drawable = { readonly depth: number; readonly draw: () => void };

/** The picture of each style, shut and open. */
const GATE_ART: Readonly<
  Record<GateStyle, { readonly shut: ObjectName; readonly open: ObjectName }>
> = {
  arch: { shut: "gateArchShut", open: "gateArchOpen" },
  hut: { shut: "gateHutShut", open: "gateHutOpen" },
  snowWall: { shut: "gateSnowWallShut", open: "gateSnowWallOpen" },
  giftBox: { shut: "gateGiftBoxShut", open: "gateGiftBoxOpen" },
};

/** The digit pictures, 0 to 9. */
const DIGITS: readonly ObjectName[] = [
  "digit0",
  "digit1",
  "digit2",
  "digit3",
  "digit4",
  "digit5",
  "digit6",
  "digit7",
  "digit8",
  "digit9",
];

/** Ten, for splitting a number into digits. */
const DECIMAL = 10;

/** Middle of the plate's red board below the picture's top, map px. */
const PLATE_MIDDLE = 8.5;

/** Half the plate's width, map px - the star sits on its right corner. */
const PLATE_HALF = 11;

/** Top of the plate below the picture's top, map px. */
const PLATE_TOP = 2;

/** Gap between two digits, map px. */
const DIGIT_GAP = 1;

/** The star twinkles this fast (radians per second) and bobs this far (map px). */
const STAR_SPEED = 3;
const STAR_BOB = 0.8;

/** The next gate's glow: where it sits above the feet, size and strength. */
const NEXT_GLOW_LIFT = 14;
const NEXT_GLOW = 30;
const NEXT_GLOW_STRENGTH = 0.32;

/** The glow pulses this fast (radians per second) and by this share. */
const NEXT_PULSE = 4;
const NEXT_PULSE_SIZE = 0.2;

/** The arrow over the next gate bobs this fast and this far. */
const MARKER_SPEED = 5;
const MARKER_BOB = 1.5;

/** How near the doorway the name of a gate shows, map px. */
const LABEL_NEAR = 30;

/** Gap between the doorway and the label below it, map px. */
const LABEL_GAP = 2;

/** Size of the label text, map px, and its padding. */
const LABEL_FONT = 6;
const LABEL_PAD = 3;

/** Size of the edge arrow, map px, and its distance from the edge. */
const GUIDE_SIZE = 7;
const GUIDE_INSET = 12;

/** Where the arrow head's base sits from the circle's middle, in circle radii. */
const GUIDE_BASE = 1.2;

/** Room kept round the view before a gate counts as off screen, map px. */
const GUIDE_SLACK = 8;

/**
 * Adds every gate in view to the things sorted by depth.
 *
 * @param ctx - the buffer, in map px
 * @param state - the game
 * @param map - the place shown
 * @param art - the sheets
 * @param items - where the drawables go
 */
export function collectGates(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  art: Art,
  items: Drawable[],
): void {
  const next = nextGate(state.gatesDone, state.today);
  const left = state.camera.x - TILE * 2;
  const right = state.camera.x + state.view.w + TILE * 2;
  for (const gate of map.gates) {
    const x = gate.tx * TILE;
    if (x > left - GATE_WIDTH * TILE && x < right) {
      items.push({
        depth: (gate.ty + 1) * TILE,
        draw: () => {
          drawGate(ctx, state, art, gate, gate.number === next);
        },
      });
    }
  }
}

/**
 * Draws the name of the gate the character steered stands at, and an arrow
 * at the edge pointing to the next gate when it is off screen. Drawn onto the
 * visible canvas at full resolution, like the speech bubbles.
 *
 * @param ctx - the visible canvas
 * @param state - the game
 * @param scale - canvas pixels per map px
 * @param cx - left of the view, map px
 * @param cy - top of the view, map px
 */
export function drawGateHints(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  scale: number,
  cx: number,
  cy: number,
): void {
  const map = state.maps[state.viewArea];
  if (state.fade === null && map.gates.length > 0) {
    drawGateLabel(ctx, state, map, scale, cx, cy);
    drawGuide(ctx, state, map, scale, cx, cy);
  }
}

/** One gate: picture, number, and the star or the next-gate glow. */
function drawGate(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  art: Art,
  gate: Gate,
  isNext: boolean,
): void {
  const done = state.gatesDone.has(gate.number);
  const rect =
    OBJECTS[done ? GATE_ART[gate.style].open : GATE_ART[gate.style].shut];
  const middle = (gate.tx + GATE_WIDTH / 2) * TILE;
  const bottom = (gate.ty + 1) * TILE;
  const left = middle - rect[2] / 2;
  const top = bottom - rect[3];
  if (isNext) {
    const pulse = 1 + Math.sin(state.time * NEXT_PULSE) * NEXT_PULSE_SIZE;
    glow(
      ctx,
      middle,
      bottom - NEXT_GLOW_LIFT,
      NEXT_GLOW * pulse,
      "255, 214, 90",
      NEXT_GLOW_STRENGTH,
    );
  }
  blit(ctx, art.world, rect, left, top);
  drawNumber(ctx, art, gate.number, middle, top + PLATE_MIDDLE);
  if (done) {
    const star = OBJECTS.gateStar;
    const bob = Math.sin(state.time * STAR_SPEED + gate.number) * STAR_BOB;
    blit(
      ctx,
      art.world,
      star,
      middle + PLATE_HALF - star[2] / 2,
      top + PLATE_TOP - star[3] / 2 + bob,
    );
  }
  if (gateLocked(state, gate.number)) {
    drawPadlock(ctx, middle, bottom - LOCK_LIFT);
  }
  if (isNext) {
    const marker =
      EFFECTS[Math.sin(state.time * MARKER_SPEED) > 0 ? "marker0" : "marker1"];
    const bob = Math.sin(state.time * MARKER_SPEED) * MARKER_BOB;
    blit(
      ctx,
      art.figures,
      marker,
      middle - marker[2] / 2,
      top - marker[3] + bob,
    );
  }
}

/** The number on a plate, centred on a point. */
function drawNumber(
  ctx: CanvasRenderingContext2D,
  art: Art,
  number: number,
  x: number,
  y: number,
): void {
  const digits = String(number)
    .split("")
    .map((digit) => OBJECTS[DIGITS[Number(digit) % DECIMAL]]);
  const width =
    digits.reduce((sum, rect) => sum + rect[2], 0) +
    DIGIT_GAP * (digits.length - 1);
  let left = x - width / 2;
  for (const rect of digits) {
    blit(ctx, art.world, rect, left, y - rect[3] / 2);
    left += rect[2] + DIGIT_GAP;
  }
}

/** A soft round light, as round the lamps. */
function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rgb: string,
  strength: number,
): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${rgb}, ${String(strength)})`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(snap(x - radius), snap(y - radius), radius * 2, radius * 2);
}

/** The gate the character steered stands at: its number and name. */
function drawGateLabel(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  scale: number,
  cx: number,
  cy: number,
): void {
  const char = state.chars[state.active];
  const gate = map.gates.find((candidate) => {
    const front = gateFront(candidate);
    return (
      char.area === map.area &&
      Math.abs(front.x - char.x) < LABEL_NEAR &&
      Math.abs(front.y - char.y) < LABEL_NEAR
    );
  });
  if (gate !== undefined && char.bubble === null) {
    const done = state.gatesDone.has(gate.number);
    const game = miniGame(gate.number);
    const text = `${WM_TEXTS.gateLabel} ${String(gate.number)} - ${game.title}`;
    const locked = gateLocked(state, gate.number);
    let hint: string = done ? WM_TEXTS.gateDone : WM_TEXTS.gateEnter;
    if (locked) {
      hint = `${WM_TEXTS.gateLockedHint} ${String(gate.number)}. ${WM_TEXTS.december}`;
    }
    const font = LABEL_FONT * scale;
    const pad = LABEL_PAD * scale;
    ctx.font = `bold ${String(Math.round(font))}px system-ui, sans-serif`;
    const w =
      Math.max(ctx.measureText(text).width, ctx.measureText(hint).width) +
      pad * 2;
    const h = font * 2 + pad * 2 + scale;
    // Under the doorway, so it never hides the number plate.
    const front = gateFront(gate);
    const x = (front.x - cx) * scale;
    const below = ((gate.ty + 2) * TILE + LABEL_GAP - cy) * scale;
    const left = Math.max(2, Math.min(ctx.canvas.width - w - 2, x - w / 2));
    const y = Math.min(ctx.canvas.height - h - 2, below);
    ctx.fillStyle = "rgba(30, 14, 30, 0.86)";
    ctx.strokeStyle = "#e8b830";
    ctx.lineWidth = Math.max(1, scale / 2);
    ctx.beginPath();
    ctx.roundRect(left, y, w, h, scale * 2);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffe9a8";
    ctx.fillText(text, left + w / 2, y + pad);
    ctx.font = `${String(Math.round(font))}px system-ui, sans-serif`;
    ctx.fillStyle = locked ? "#ff9a8a" : done ? "#9be39b" : "#f4f0ff";
    ctx.fillText(hint, left + w / 2, y + pad + font + scale);
  }
}

/** An arrow at the edge of the picture pointing to the next gate. */
function drawGuide(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  map: GameMap,
  scale: number,
  cx: number,
  cy: number,
): void {
  const next = nextGate(state.gatesDone, state.today);
  const gate = map.gates.find((candidate) => candidate.number === next);
  if (gate !== undefined) {
    const front = gateFront(gate);
    const view = state.view;
    const gx = front.x - cx;
    const gy = front.y - cy - TILE;
    const inside =
      gx > -GUIDE_SLACK &&
      gx < view.w + GUIDE_SLACK &&
      gy > -GUIDE_SLACK &&
      gy < view.h + GUIDE_SLACK;
    if (!inside) {
      const mx = view.w / 2;
      const my = view.h / 2;
      const angle = Math.atan2(gy - my, gx - mx);
      // Push the arrow out from the middle until it meets the inset frame.
      const reach = Math.min(
        Math.abs((mx - GUIDE_INSET) / (Math.cos(angle) || Number.EPSILON)),
        Math.abs((my - GUIDE_INSET) / (Math.sin(angle) || Number.EPSILON)),
      );
      const ax = (mx + Math.cos(angle) * reach) * scale;
      const ay = (my + Math.sin(angle) * reach) * scale;
      const size = GUIDE_SIZE * scale;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.fillStyle = "rgba(30, 14, 30, 0.8)";
      ctx.strokeStyle = "#e8b830";
      ctx.lineWidth = Math.max(1, scale / 2);
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffe9a8";
      ctx.font = `bold ${String(Math.round(size))}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(gate.number), 0, scale / 2);
      ctx.rotate(angle);
      ctx.fillStyle = "#e8b830";
      ctx.beginPath();
      ctx.moveTo(size * 2, 0);
      ctx.lineTo(size * GUIDE_BASE, -size / 2);
      ctx.lineTo(size * GUIDE_BASE, size / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- the padlock's
   pixel shape, in map px round its middle. */
/** How far above the gate's bottom edge the padlock hangs, map px. */
const LOCK_LIFT = 11;

/**
 * A padlock on a gate that is shut until its day: a gold body with a
 * keyhole and a grey shackle.
 *
 * @param ctx - the buffer, in map px
 * @param x - middle, map px
 * @param y - middle of the body, map px
 */
function drawPadlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  const left = Math.round(x) - 4;
  const top = Math.round(y) - 2;
  ctx.fillStyle = "#4a4a58";
  ctx.fillRect(left + 1, top - 5, 1.5, 5);
  ctx.fillRect(left + 5.5, top - 5, 1.5, 5);
  ctx.fillRect(left + 1, top - 6, 6, 1.5);
  ctx.fillStyle = "#3a2410";
  ctx.fillRect(left - 0.5, top - 0.5, 9, 8);
  ctx.fillStyle = "#e8b830";
  ctx.fillRect(left, top, 8, 7);
  ctx.fillStyle = "#fff0a0";
  ctx.fillRect(left, top, 8, 1);
  ctx.fillStyle = "#3a2410";
  ctx.fillRect(left + 3.5, top + 2, 1, 3);
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
