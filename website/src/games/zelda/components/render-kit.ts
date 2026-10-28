/**
 * Small drawing helpers shared by the world and the screens on top of it:
 * framed boxes, crisp rounded corners, shadows, digit counters and
 * outlined text.
 *
 * @module
 */
import type { SpriteName } from "./sprite-atlas";
import { drawSprite, type Art } from "./sprites";

/** Colour of drop shadows on the ground. */
export const SHADOW = "rgba(24, 16, 40, 0.32)";

/** Outline colour of boxes and text. */
export const INK = "#282038";

/** Text font family, used for every word on the canvas. */
const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';

/** Width of a big digit on the sheet, px. */
const DIGIT_STEP = 8;

/** Width of a small digit on the sheet, px. */
const SMALL_STEP = 4;

/** Outline thickness of text, in logical pixels. */
const TEXT_OUTLINE = 1.6;

/** Corner radius of a box's dark outline, px. */
const OUTER_RADIUS = 4;

/** Corner radius of a box's light rim, px. */
const RIM_RADIUS = 3;

/** Length of a cursor bracket's arms, px. */
const BRACKET = 6;

/** The cursor pulses this many times a second. */
const CURSOR_PULSE = 4;

/** Height of a shadow relative to its width. */
const SHADOW_FLAT = 2.6;

/** Thinnest a shadow gets, px. */
const SHADOW_MIN = 1.5;

/**
 * A framed box in the GBA's style.
 *
 * @param ctx - where to draw
 * @param x - left edge
 * @param y - top edge
 * @param w - width
 * @param h - height
 * @param fill - the inside colour
 * @param rim - the frame colour
 */
export function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  rim = "#e8e0c8",
): void {
  ctx.fillStyle = INK;
  roundRect(ctx, x - 1, y - 1, w + 2, h + 2, OUTER_RADIUS);
  ctx.fillStyle = rim;
  roundRect(ctx, x, y, w, h, RIM_RADIUS);
  ctx.fillStyle = fill;
  roundRect(ctx, x + 2, y + 2, w - 2 * 2, h - 2 * 2, 2);
}

/**
 * A filled rectangle with cut corners - crisp, unlike a canvas arc.
 *
 * @param ctx - where to draw
 * @param x - left edge
 * @param y - top edge
 * @param w - width
 * @param h - height
 * @param r - corner radius
 */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  for (let i = 0; i < r; i++) {
    const inset =
      r - i - 1 > 0
        ? Math.ceil(r - Math.sqrt(r * r - (r - i - 1) * (r - i - 1)))
        : 0;
    ctx.fillRect(x + inset, y + i, w - inset * 2, 1);
    ctx.fillRect(x + inset, y + h - 1 - i, w - inset * 2, 1);
  }
  ctx.fillRect(x, y + r, w, h - r * 2);
}

/**
 * A soft oval shadow under something.
 *
 * @param ctx - where to draw
 * @param x - centre
 * @param y - centre
 * @param rx - half width
 */
export function shadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
): void {
  ctx.fillStyle = SHADOW;
  ctx.beginPath();
  ctx.ellipse(
    Math.round(x),
    Math.round(y),
    rx,
    Math.max(SHADOW_MIN, rx / SHADOW_FLAT),
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

/**
 * A zero-padded number from the digit sprites.
 *
 * @param ctx - where to draw
 * @param art - the pictures
 * @param value - the number
 * @param digits - how many digits to show
 * @param x - left edge
 * @param y - top edge
 * @param font - big or small digits
 */
export function drawNumber(
  ctx: CanvasRenderingContext2D,
  art: Art,
  value: number,
  digits: number,
  x: number,
  y: number,
  font: "digit" | "small",
): void {
  const textValue = String(value).padStart(digits, "0");
  const step = font === "digit" ? DIGIT_STEP : SMALL_STEP;
  for (let i = 0; i < textValue.length; i++) {
    drawSprite(
      ctx,
      art,
      `${font}${textValue[i]}` as SpriteName,
      x + i * step,
      y,
    );
  }
}

/**
 * Blinking corner brackets round a chosen cell.
 *
 * @param ctx - where to draw
 * @param x - left edge of the cell
 * @param y - top edge
 * @param w - width
 * @param h - height
 * @param clock - seconds, for the pulse
 */
export function cursor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  clock: number,
): void {
  const grow = Math.floor(clock * CURSOR_PULSE) % 2;
  const left = x - 2 - grow;
  const top = y - 2 - grow;
  const right = x + w + 1 + grow;
  const bottom = y + h + 1 + grow;
  ctx.fillStyle = "#f8e040";
  for (const [cx, cy, dx, dy] of [
    [left, top, 1, 1],
    [right, top, -1, 1],
    [left, bottom, 1, -1],
    [right, bottom, -1, -1],
  ] as const) {
    ctx.fillRect(Math.min(cx, cx + dx * (BRACKET - 1)), cy, BRACKET, 1);
    ctx.fillRect(cx, Math.min(cy, cy + dy * (BRACKET - 1)), 1, BRACKET);
  }
}

/**
 * One line of outlined text, placed in logical pixels.
 *
 * @param ctx - the big canvas
 * @param value - the words
 * @param x - anchor, logical px
 * @param y - middle of the line, logical px
 * @param scale - canvas pixels per logical pixel
 * @param size - font size, logical px
 * @param align - where the anchor sits
 * @param colour - the letters' colour
 */
export function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  scale: number,
  size: number,
  align: CanvasTextAlign,
  colour = "#ffffff",
): void {
  ctx.font = `bold ${Math.round(size * scale)}px ${FONT}`;
  ctx.textAlign = align;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, scale * TEXT_OUTLINE);
  ctx.strokeStyle = INK;
  ctx.strokeText(value, x * scale, y * scale);
  ctx.fillStyle = colour;
  ctx.fillText(value, x * scale, y * scale);
}

/**
 * Breaks a text into lines that fit a width (in logical pixels).
 *
 * @param ctx - the big canvas, for measuring
 * @param value - the words
 * @param width - the room, logical px
 * @param scale - canvas pixels per logical pixel
 * @param size - font size, logical px
 * @returns the lines
 */
export function wrap(
  ctx: CanvasRenderingContext2D,
  value: string,
  width: number,
  scale: number,
  size: number,
): string[] {
  ctx.font = `bold ${Math.round(size * scale)}px ${FONT}`;
  const lines: string[] = [];
  let line = "";
  for (const word of value.split(" ")) {
    const next = line === "" ? word : `${line} ${word}`;
    if (ctx.measureText(next).width > width * scale && line !== "") {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  lines.push(line);
  return lines;
}
