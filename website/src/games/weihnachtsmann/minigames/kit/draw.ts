/**
 * Drawing helpers for minigames: sprites from the game's sheets and from a
 * minigame's own sheet, the cast in any pose, sky, falling snow, panels,
 * buttons and the common HUD for score, time and lives.
 *
 * @module
 * @remarks
 * Everything takes logical px of the minigame field; the context handed to
 * `draw` is already scaled to the art's two pixels per logical pixel, so
 * sprites land on whole art pixels. Text goes through `g.text`, which writes
 * sharp letters on top of the finished picture.
 */
import {
  EFFECTS,
  FIGURES,
  OBJECTS,
  SHEET_DENSITY,
  type EffectName,
  type Facing,
  type FigureId,
  type ObjectName,
  type SpriteRect,
} from "@/games/weihnachtsmann/components/sprite-atlas";
import {
  blit,
  snap,
  type Art,
} from "@/games/weihnachtsmann/components/sprites";
import { MINI_H, MINI_W, type MiniDraw } from "../types";

/** The poses a figure can be drawn in; not every figure has every pose. */
export type FigurePose = "idle" | "walk" | "fly" | "slide";

/** A box on the field, logical px. */
export type Box = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

/** What the common HUD shows; leave out what a game does not have. */
export type HudInfo = {
  /** Points so far and, if there is one, the goal. */
  readonly score?: number;
  readonly goal?: number;
  /** What the points count, such as "Geschenke". */
  readonly scoreLabel?: string;
  /** Seconds left. */
  readonly time?: number;
  /** Lives left and how many there were. */
  readonly lives?: number;
  readonly maxLives?: number;
};

/** Seconds per minute. */
const MINUTE = 60;

/** Two digits for the seconds. */
const PAD = 2;

/** Height of the HUD bar, logical px. */
export const HUD_H = 14;

/** Size of the HUD text, logical px. */
const HUD_FONT = 8;

/** Gap from the field's edge, logical px. */
const HUD_MARGIN = 6;

/** Seconds left from which the clock turns red. */
const HURRY = 5;

/** Size of one life heart, logical px, and the gap between two. */
const HEART = 7;
const HEART_GAP = 2;

/** Rounding of panels and buttons, logical px. */
const ROUND = 3;

/** Snowflakes in front of a scene by default. */
const FLAKES = 40;

/** The letters every minigame text is set in. */
export const FONT_FAMILY = "system-ui, sans-serif";

/** Texts are measured this much bigger, so rounding does not matter. */
const MEASURE_SCALE = 10;

/** Width of an average letter as a share of its size, without a canvas. */
const AVERAGE_LETTER = 0.55;

/** A context only for measuring text, made on first use. */
let measureContext: CanvasRenderingContext2D | null = null;

/**
 * Starts loading a minigame's own sprite sheet.
 *
 * @param src - the imported image's `src`
 * @returns the image; it draws nothing until loaded
 */
export function loadSheet(src: string): HTMLImageElement {
  const image = new Image();
  image.src = src;
  return image;
}

/**
 * Whether a sheet has arrived.
 *
 * @param sheet - the sheet
 * @returns true once it can be drawn
 */
export function sheetReady(sheet: HTMLImageElement): boolean {
  return sheet.complete && sheet.naturalWidth > 0;
}

/**
 * Draws one picture off any two-pixel sheet with its top left at a point.
 *
 * @param ctx - the field
 * @param sheet - the sheet
 * @param rect - where the picture sits on it, logical px
 * @param x - left edge, logical px
 * @param y - top edge, logical px
 * @param mirror - flip it left to right
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  rect: SpriteRect,
  x: number,
  y: number,
  mirror = false,
): void {
  blit(ctx, sheet, rect, x, y, mirror);
}

/**
 * Draws a picture centred on a point, optionally scaled and turned.
 *
 * @param ctx - the field
 * @param sheet - the sheet
 * @param rect - where the picture sits on it, logical px
 * @param x - centre, logical px
 * @param y - centre, logical px
 * @param scale - size factor, 1 for the natural size
 * @param angle - turn, radians
 */
export function drawSpriteCentred(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  rect: SpriteRect,
  x: number,
  y: number,
  scale = 1,
  angle = 0,
): void {
  if (scale === 1 && angle === 0) {
    blit(ctx, sheet, rect, x - rect[2] / 2, y - rect[3] / 2);
  } else {
    const [sx, sy, w, h] = rect;
    const k = SHEET_DENSITY;
    ctx.save();
    ctx.translate(snap(x), snap(y));
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.drawImage(sheet, sx * k, sy * k, w * k, h * k, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
}

/**
 * Draws one of the cast (or Jordi's animals) standing with its feet on a
 * point.
 *
 * @param ctx - the field
 * @param art - the shared sheets
 * @param who - the figure
 * @param x - feet, logical px
 * @param y - feet, logical px
 * @param pose - which pose; falls back to standing where the figure lacks it
 * @param facing - which way it looks
 * @param frame - which frame, counted up freely (wraps)
 * @param mirror - look left instead of right (side view)
 */
export function drawFigure(
  ctx: CanvasRenderingContext2D,
  art: Art,
  who: FigureId,
  x: number,
  y: number,
  pose: FigurePose = "idle",
  facing: Facing = "down",
  frame = 0,
  mirror = false,
): void {
  const figure = FIGURES[who];
  const poses = figure[facing] as Partial<
    Record<FigurePose, readonly SpriteRect[]>
  >;
  const frames = poses[pose] ?? figure[facing].idle;
  const rect = frames[Math.abs(Math.floor(frame)) % frames.length];
  blit(
    ctx,
    art.figures,
    rect,
    x - figure.anchor[0],
    y - figure.anchor[1],
    mirror,
  );
}

/**
 * Draws a picture of the world sheet (gifts, toys, trees, the sleigh ...)
 * with its top left at a point.
 *
 * @param ctx - the field
 * @param art - the shared sheets
 * @param name - which picture
 * @param x - left edge, logical px
 * @param y - top edge, logical px
 * @param mirror - flip it left to right
 */
export function drawObject(
  ctx: CanvasRenderingContext2D,
  art: Art,
  name: ObjectName,
  x: number,
  y: number,
  mirror = false,
): void {
  blit(ctx, art.world, OBJECTS[name], x, y, mirror);
}

/**
 * Draws an effect of the figures sheet (sparkles, poof, notes, marker)
 * centred on a point.
 *
 * @param ctx - the field
 * @param art - the shared sheets
 * @param name - which effect
 * @param x - centre, logical px
 * @param y - centre, logical px
 */
export function drawEffect(
  ctx: CanvasRenderingContext2D,
  art: Art,
  name: EffectName,
  x: number,
  y: number,
): void {
  const rect = EFFECTS[name];
  blit(ctx, art.figures, rect, x - rect[2] / 2, y - rect[3] / 2);
}

/**
 * Fills the whole field with a sky running from one colour at the top to
 * another at the bottom.
 *
 * @param ctx - the field
 * @param top - colour at the top
 * @param bottom - colour at the bottom
 */
export function drawSky(
  ctx: CanvasRenderingContext2D,
  top: string,
  bottom: string,
): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, MINI_H);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, MINI_W, MINI_H);
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- drift of the flakes,
   picked by eye */
/**
 * Snow falling over the whole field.
 *
 * @param ctx - the field
 * @param time - seconds, for the motion
 * @param count - how many flakes
 */
export function drawSnowfall(
  ctx: CanvasRenderingContext2D,
  time: number,
  count = FLAKES,
): void {
  for (let k = 0; k < count; k += 1) {
    const near = k % 3 === 0;
    const fall = 10 + (k % 7) * 2 + (near ? 8 : 0);
    const x = mod(k * 73.3 + Math.sin(time * 0.8 + k) * 6 + time * 4, MINI_W);
    const y = mod(k * 41.7 + time * fall, MINI_H);
    ctx.fillStyle = near
      ? "rgba(255, 255, 255, 0.95)"
      : "rgba(255, 255, 255, 0.65)";
    const size = near ? 1 : 0.5;
    ctx.fillRect(snap(x), snap(y), size, size);
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * A soft round light.
 *
 * @param ctx - the field
 * @param x - centre, logical px
 * @param y - centre, logical px
 * @param radius - logical px
 * @param rgb - colour as "r, g, b"
 * @param strength - 0 to 1 in the middle
 */
export function drawGlow(
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
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

/**
 * A dark panel with a gold rim, for cards, menus and the HUD.
 *
 * @param ctx - the field
 * @param box - where, logical px
 * @param fill - the panel's colour
 * @param rim - the rim's colour
 */
export function drawPanel(
  ctx: CanvasRenderingContext2D,
  box: Box,
  fill = "rgba(28, 14, 34, 0.88)",
  rim = "#e8b830",
): void {
  ctx.fillStyle = fill;
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(box.x + 1 / 2, box.y + 1 / 2, box.w - 1, box.h - 1, ROUND);
  ctx.fill();
  ctx.stroke();
}

/**
 * A button: a panel with a label, brighter when it has the focus.
 *
 * @param g - what to draw with
 * @param box - where, logical px
 * @param label - German text
 * @param focused - whether keys would press it
 */
export function drawButton(
  g: MiniDraw,
  box: Box,
  label: string,
  focused: boolean,
): void {
  drawPanel(
    g.ctx,
    box,
    focused ? "#c8303a" : "rgba(60, 30, 50, 0.92)",
    focused ? "#ffe27a" : "#a87a18",
  );
  g.text(label, box.x + box.w / 2, box.y + box.h / 2, {
    size: HUD_FONT,
    bold: true,
    align: "center",
    baseline: "middle",
    color: focused ? "#fff8e0" : "#e8dcc8",
  });
}

/**
 * Whether a point lies in a box.
 *
 * @param box - the box
 * @param x - logical px
 * @param y - logical px
 * @returns true when inside
 */
export function inside(box: Box, x: number, y: number): boolean {
  return x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h;
}

/**
 * The common HUD across the top of the field: points (and goal) on the left,
 * lives in the middle, the clock on the right.
 *
 * @param g - what to draw with
 * @param info - what to show
 */
export function drawHud(g: MiniDraw, info: HudInfo): void {
  const ctx = g.ctx;
  ctx.fillStyle = "rgba(20, 10, 26, 0.55)";
  ctx.fillRect(0, 0, MINI_W, HUD_H);
  ctx.fillStyle = "rgba(232, 184, 48, 0.7)";
  ctx.fillRect(0, HUD_H, MINI_W, 1 / 2);
  const middle = HUD_H / 2;
  if (info.score !== undefined) {
    const goal = info.goal === undefined ? "" : ` / ${String(info.goal)}`;
    const label = info.scoreLabel === undefined ? "" : `${info.scoreLabel}: `;
    g.text(`${label}${String(info.score)}${goal}`, HUD_MARGIN, middle, {
      size: HUD_FONT,
      bold: true,
      baseline: "middle",
      color: "#ffe9a8",
    });
  }
  if (info.lives !== undefined) {
    const max = info.maxLives ?? info.lives;
    const width = max * HEART + (max - 1) * HEART_GAP;
    for (let k = 0; k < max; k += 1) {
      drawHeart(
        ctx,
        MINI_W / 2 - width / 2 + k * (HEART + HEART_GAP),
        middle - HEART / 2,
        k < info.lives,
      );
    }
  }
  if (info.time !== undefined) {
    g.text(formatTime(info.time), MINI_W - HUD_MARGIN, middle, {
      size: HUD_FONT,
      bold: true,
      align: "right",
      baseline: "middle",
      color: info.time <= HURRY ? "#ff7a7a" : "#e8f0ff",
    });
  }
}

/**
 * Splits a text into lines no wider than a limit, as `g.text` would set it
 * (bold or not makes little difference at these sizes).
 *
 * @param text - the text
 * @param width - widest line, logical px
 * @param size - letter size, logical px
 * @returns the lines
 */
export function wrapText(text: string, width: number, size: number): string[] {
  const measure = measurer();
  const lines: string[] = [];
  let line = "";
  if (measure !== null) {
    measure.font = `${String(size * MEASURE_SCALE)}px ${FONT_FAMILY}`;
  }
  const wide = (candidate: string) =>
    measure === null
      ? candidate.length * size * AVERAGE_LETTER > width
      : measure.measureText(candidate).width / MEASURE_SCALE > width;
  for (const word of text.split(" ")) {
    const next = line === "" ? word : `${line} ${word}`;
    if (wide(next) && line !== "") {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  lines.push(line);
  return lines;
}

/**
 * Seconds as a clock, rounded up: 65.2 becomes "1:06".
 *
 * @param seconds - time left
 * @returns minutes and seconds
 */
export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(whole / MINUTE))}:${String(whole % MINUTE).padStart(PAD, "0")}`;
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- the heart's shape in
   its 7 x 7 box */
/** One life: a full or an empty heart. */
function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  full: boolean,
): void {
  ctx.fillStyle = full ? "#e83040" : "rgba(255, 255, 255, 0.25)";
  ctx.beginPath();
  ctx.moveTo(x + 3.5, y + 6.5);
  ctx.lineTo(x, y + 3);
  ctx.arc(x + 1.75, y + 1.9, 1.75, Math.PI, 0);
  ctx.arc(x + 5.25, y + 1.9, 1.75, Math.PI, 0);
  ctx.lineTo(x + 7, y + 3);
  ctx.closePath();
  ctx.fill();
  if (full) {
    ctx.fillStyle = "#ff9aa4";
    ctx.fillRect(snap(x + 1), snap(y + 1), 1, 1 / 2);
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** The context for measuring text, or null outside a browser. */
function measurer(): CanvasRenderingContext2D | null {
  if (measureContext === null && typeof document !== "undefined") {
    measureContext = document.createElement("canvas").getContext("2d");
  }
  return measureContext;
}

/** Remainder that is never negative. */
function mod(value: number, by: number): number {
  return ((value % by) + by) % by;
}
