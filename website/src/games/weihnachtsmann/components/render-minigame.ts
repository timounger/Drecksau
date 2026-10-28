/**
 * Putting a minigame on the canvas: its field is drawn into a buffer of
 * fixed size, blown up as large as the canvas allows (by a whole number
 * where it can), and its texts are set on top at full resolution.
 *
 * @module
 */
import { FONT_FAMILY } from "@/games/weihnachtsmann/minigames/kit/draw";
import type { MiniSession } from "@/games/weihnachtsmann/minigames/kit/host";
import {
  MINI_H,
  MINI_W,
  type MiniPoint,
  type TextStyle,
} from "@/games/weihnachtsmann/minigames/types";
import { SHEET_DENSITY } from "./sprite-atlas";
import type { Art } from "./sprites";

/** Where the field lies on the canvas: top left and canvas px per logical px. */
export type FieldView = {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
};

/** A text waiting to be set on top of the picture. */
type TextJob = {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly style: TextStyle;
};

/** Letter size when a style names none, logical px. */
const DEFAULT_SIZE = 8;

/** Width of a text outline as a share of the letter size. */
const OUTLINE_SHARE = 0.18;

/** What shows round the field when the canvas has another shape. */
const SURROUND = "#06040c";

/**
 * Creates the buffer a minigame field is drawn into.
 *
 * @returns the buffer and its context, or null without a 2D context
 */
export function createFieldBuffer(): {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
} | null {
  const canvas = document.createElement("canvas");
  canvas.width = MINI_W * SHEET_DENSITY;
  canvas.height = MINI_H * SHEET_DENSITY;
  const ctx = canvas.getContext("2d");
  return ctx === null ? null : { canvas, ctx };
}

/**
 * Draws a session's frame onto the visible canvas.
 *
 * @param ctx - the visible canvas
 * @param field - the field buffer and its context
 * @param session - the visit to a gate
 * @param art - the shared sheets
 * @param time - seconds, for the field's own animations
 * @param fill - whether the field may grow by a fraction to fill the canvas:
 *   on a phone, where art pixels are too small to show uneven sizes
 * @returns where the field lies on the canvas, for the pointer
 */
export function drawSession(
  ctx: CanvasRenderingContext2D,
  field: {
    readonly canvas: HTMLCanvasElement;
    readonly ctx: CanvasRenderingContext2D;
  },
  session: MiniSession,
  art: Art,
  time: number,
  fill = false,
): FieldView {
  const jobs: TextJob[] = [];
  const fctx = field.ctx;
  fctx.setTransform(SHEET_DENSITY, 0, 0, SHEET_DENSITY, 0, 0);
  fctx.imageSmoothingEnabled = false;
  fctx.globalAlpha = 1;
  fctx.clearRect(0, 0, MINI_W, MINI_H);
  fctx.save();
  session.draw({
    ctx: fctx,
    art,
    time,
    text: (text, x, y, style = {}) => {
      jobs.push({ text, x, y, style });
    },
  });
  fctx.restore();
  const view = fieldView(ctx.canvas, fill);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = SURROUND;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.imageSmoothingEnabled = view.scale < SHEET_DENSITY;
  ctx.drawImage(
    field.canvas,
    view.x,
    view.y,
    MINI_W * view.scale,
    MINI_H * view.scale,
  );
  for (const job of jobs) {
    setText(ctx, job, view);
  }
  ctx.restore();
  return view;
}

/**
 * Turns a point on the canvas element into a point on the field.
 *
 * @param canvas - the visible canvas
 * @param view - where the field lies on it
 * @param clientX - pointer, CSS px of the window
 * @param clientY - pointer, CSS px of the window
 * @returns the point on the field, logical px
 */
export function fieldPoint(
  canvas: HTMLCanvasElement,
  view: FieldView,
  clientX: number,
  clientY: number,
): MiniPoint {
  const box = canvas.getBoundingClientRect();
  const cx = ((clientX - box.left) / Math.max(1, box.width)) * canvas.width;
  const cy = ((clientY - box.top) / Math.max(1, box.height)) * canvas.height;
  return { x: (cx - view.x) / view.scale, y: (cy - view.y) / view.scale };
}

/**
 * Where the field goes on a canvas: as large as fits, by a whole number of
 * canvas px per logical px when that is at least one (unless it may fill the
 * canvas), centred.
 */
function fieldView(canvas: HTMLCanvasElement, fill: boolean): FieldView {
  const fit = Math.min(canvas.width / MINI_W, canvas.height / MINI_H);
  const scale = fit >= 1 && !fill ? Math.floor(fit) : fit;
  return {
    x: Math.floor((canvas.width - MINI_W * scale) / 2),
    y: Math.floor((canvas.height - MINI_H * scale) / 2),
    scale,
  };
}

/** Sets one text at full resolution. */
function setText(
  ctx: CanvasRenderingContext2D,
  job: TextJob,
  view: FieldView,
): void {
  const style = job.style;
  const size = (style.size ?? DEFAULT_SIZE) * view.scale;
  const x = view.x + job.x * view.scale;
  const y = view.y + job.y * view.scale;
  ctx.globalAlpha = Math.max(0, Math.min(1, style.alpha ?? 1));
  ctx.font = `${style.bold === true ? "bold " : ""}${String(Math.round(size))}px ${FONT_FAMILY}`;
  ctx.textAlign = style.align ?? "left";
  ctx.textBaseline = style.baseline ?? "alphabetic";
  if (style.outline !== undefined && style.outline !== null) {
    ctx.strokeStyle = style.outline;
    ctx.lineWidth = Math.max(1, size * OUTLINE_SHARE);
    ctx.lineJoin = "round";
    ctx.strokeText(job.text, x, y);
  }
  ctx.fillStyle = style.color ?? "#ffffff";
  ctx.fillText(job.text, x, y);
  ctx.globalAlpha = 1;
}
