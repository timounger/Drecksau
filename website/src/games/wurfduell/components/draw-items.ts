/**
 * Drawing the things that are thrown - every one of them by hand, out of
 * circles, curves and a few lines.
 *
 * @module
 * @remarks
 * Each drawing is centred on the origin and sized by the item's radius, so the
 * same function draws a tomato in flight, on a button and on the rules page.
 */
import type { ItemId } from "@/games/wurfduell/engine/types";

/** Draws one item, centred on the origin, `r` being its radius. */
type ItemPainter = (ctx: CanvasRenderingContext2D, r: number) => void;

/* eslint-disable @typescript-eslint/no-magic-numbers -- drawing proportions,
   all relative to the item's radius */

/** Every item's drawing. */
const PAINTERS: Readonly<Record<ItemId, ItemPainter>> = {
  tomate: (ctx, r) => {
    ball(ctx, r, "#e0362c", "#b5221b");
    leaf(ctx, 0, -r * 0.85, r * 0.5, "#3d9a32");
  },
  pfanne: (ctx, r) => {
    ctx.fillStyle = "#3b3f46";
    ctx.fillRect(r * 0.6, -r * 0.14, r * 1.1, r * 0.28);
    ball(ctx, r * 0.85, "#2c2f35", "#16181b");
    ctx.fillStyle = "#f2c25a";
    ellipse(ctx, 0, 0, r * 0.55, r * 0.5);
    ctx.fill();
  },
  blumentopf: (ctx, r) => {
    ctx.fillStyle = "#b8582e";
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.3);
    ctx.lineTo(r * 0.8, -r * 0.3);
    ctx.lineTo(r * 0.55, r);
    ctx.lineTo(-r * 0.55, r);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#9c4320";
    ctx.fillRect(-r * 0.9, -r * 0.45, r * 1.8, r * 0.3);
    ctx.strokeStyle = "#3d9a32";
    ctx.lineWidth = r * 0.14;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.45);
    ctx.lineTo(0, -r * 1.1);
    ctx.stroke();
    flower(ctx, 0, -r * 1.15, r * 0.35);
  },
  kuerbis: (ctx, r) => {
    for (const dx of [-0.45, 0.45, 0]) {
      ctx.fillStyle = dx === 0 ? "#f7a531" : "#e88a17";
      ellipse(ctx, dx * r, 0, r * 0.62, r * 0.88);
      ctx.fill();
    }
    ctx.fillStyle = "#5b7d2a";
    ctx.fillRect(-r * 0.1, -r * 1.1, r * 0.2, r * 0.3);
  },
  kokosnuss: (ctx, r) => {
    ball(ctx, r, "#7a5232", "#553620");
    ctx.fillStyle = "#2e1d10";
    for (const [x, y] of [
      [-0.25, -0.2],
      [0.2, -0.25],
      [0, 0.15],
    ]) {
      dot(ctx, x * r, y * r, r * 0.12);
    }
  },
  kanonenkugel: (ctx, r) => {
    ball(ctx, r, "#34373c", "#121315");
    shine(ctx, r);
  },
  apfel: (ctx, r) => apple(ctx, r),
  apfelhagel: (ctx, r) => {
    apple(ctx, r * 0.6, -r * 0.45, -r * 0.3);
    apple(ctx, r * 0.6, r * 0.45, -r * 0.3);
    apple(ctx, r * 0.6, 0, r * 0.4);
  },
  brezel: (ctx, r) => {
    ctx.strokeStyle = "#9b5a22";
    ctx.lineWidth = r * 0.36;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 0.1, r * 0.48, Math.PI * 0.2, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 0.4, -r * 0.1, r * 0.48, Math.PI * 1.1, Math.PI * 0.8);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    for (const [x, y] of [
      [-0.6, -0.4],
      [0.5, -0.5],
      [0.1, 0.3],
      [-0.3, 0.2],
    ]) {
      dot(ctx, x * r, y * r, r * 0.06);
    }
  },
  torte: (ctx, r) => cake(ctx, r, 1),
  hochzeitstorte: (ctx, r) => cake(ctx, r, 3),
  schneeball: (ctx, r) => {
    ball(ctx, r, "#f6faff", "#c9d8ea");
    shine(ctx, r);
  },
  lawinenball: (ctx, r) => {
    ball(ctx, r, "#eef6ff", "#b9cde4");
    ctx.fillStyle = "#cfe0f2";
    dot(ctx, -r * 0.3, r * 0.2, r * 0.25);
    dot(ctx, r * 0.35, -r * 0.25, r * 0.2);
    ctx.fillStyle = "#5c3b1e";
    ctx.fillRect(r * 0.3, r * 0.1, r * 0.5, r * 0.08);
  },
  schraube: (ctx, r) => {
    ctx.fillStyle = "#b8bec6";
    ctx.fillRect(-r * 0.25, -r * 0.4, r * 1.3, r * 0.5);
    ctx.strokeStyle = "#7d858f";
    ctx.lineWidth = r * 0.08;
    for (let i = 0; i < 5; i++) {
      const x = -r * 0.15 + i * r * 0.25;
      ctx.beginPath();
      ctx.moveTo(x, -r * 0.4);
      ctx.lineTo(x + r * 0.12, r * 0.1);
      ctx.stroke();
    }
    ctx.fillStyle = "#9aa1aa";
    ctx.fillRect(-r * 0.75, -r * 0.7, r * 0.5, r * 1.1);
    outline(ctx, "#5d636b");
  },
  magnetmutter: (ctx, r) => {
    ctx.strokeStyle = "#d8333a";
    ctx.lineWidth = r * 0.5;
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.65, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = "#e9edf1";
    ctx.fillRect(-r * 0.9, -r * 0.1, r * 0.5, r * 0.6);
    ctx.fillRect(r * 0.4, -r * 0.1, r * 0.5, r * 0.6);
    gear(ctx, r * 0.35, "#5d6670");
  },
  knochen: (ctx, r) => bone(ctx, r),
  riesenknochen: (ctx, r) => bone(ctx, r),
  lanze: (ctx, r) => {
    ctx.strokeStyle = "#8b5a2b";
    ctx.lineWidth = r * 0.28;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-r * 2.2, 0);
    ctx.lineTo(r * 1.2, 0);
    ctx.stroke();
    ctx.fillStyle = "#c9d1da";
    ctx.beginPath();
    ctx.moveTo(r * 1.1, -r * 0.45);
    ctx.lineTo(r * 2.3, 0);
    ctx.lineTo(r * 1.1, r * 0.45);
    ctx.closePath();
    ctx.fill();
    outline(ctx, "#5f6872");
    ctx.fillStyle = "#c8342d";
    ctx.fillRect(-r * 2.3, -r * 0.35, r * 0.4, r * 0.7);
  },
  springknochen: (ctx, r) => {
    bone(ctx, r);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    ctx.arc(0, r * 0.9, r * 0.5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  },
};

/**
 * Draws a thrown thing.
 *
 * @param ctx - where to draw
 * @param id - which item
 * @param x - its centre, in canvas units
 * @param y - its centre, in canvas units
 * @param r - its radius, in canvas units
 * @param rotation - how far it has spun, in radians
 */
export function drawItem(
  ctx: CanvasRenderingContext2D,
  id: ItemId,
  x: number,
  y: number,
  r: number,
  rotation: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.lineJoin = "round";
  PAINTERS[id](ctx, r);
  ctx.restore();
}

/** A shaded ball. */
function ball(
  ctx: CanvasRenderingContext2D,
  r: number,
  light: string,
  dark: string,
): void {
  const gradient = ctx.createRadialGradient(
    -r * 0.35,
    -r * 0.35,
    r * 0.1,
    0,
    0,
    r,
  );
  gradient.addColorStop(0, light);
  gradient.addColorStop(1, dark);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
}

/** A little white highlight. */
function shine(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = "#ffffff99";
  ellipse(ctx, -r * 0.35, -r * 0.4, r * 0.22, r * 0.14);
  ctx.fill();
}

/** A leaf pointing up from a point. */
function leaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ellipse(ctx, x, y, size * 0.35, size * 0.6);
  ctx.fill();
}

/** A five-petalled flower. */
function flower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  ctx.fillStyle = "#f05aa0";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    dot(
      ctx,
      x + Math.cos(a) * size * 0.6,
      y + Math.sin(a) * size * 0.6,
      size * 0.45,
    );
  }
  ctx.fillStyle = "#ffd23f";
  dot(ctx, x, y, size * 0.4);
}

/** An apple, optionally off-centre. */
function apple(ctx: CanvasRenderingContext2D, r: number, x = 0, y = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ball(ctx, r, "#ef4b4b", "#a8161c");
  ctx.strokeStyle = "#5a3a1e";
  ctx.lineWidth = r * 0.14;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.8);
  ctx.lineTo(r * 0.1, -r * 1.2);
  ctx.stroke();
  leaf(ctx, r * 0.35, -r * 1.05, r * 0.5, "#3d9a32");
  ctx.restore();
}

/** A cake with cream and a cherry; `tiers` stacks it up. */
function cake(ctx: CanvasRenderingContext2D, r: number, tiers: number): void {
  const tierHeight = (r * 1.6) / tiers;
  for (let i = 0; i < tiers; i++) {
    const width = r * (1 - i * 0.22);
    const top = r * 0.8 - (i + 1) * tierHeight;
    ctx.fillStyle = i % 2 === 0 ? "#f7c6d3" : "#fbe3ea";
    ctx.fillRect(-width, top, width * 2, tierHeight);
    ctx.fillStyle = "#fffaf5";
    ctx.fillRect(-width, top, width * 2, tierHeight * 0.3);
    for (let k = -2; k <= 2; k++) {
      dot(ctx, (k * width) / 2.5, top + tierHeight * 0.3, width * 0.13);
    }
  }
  ctx.fillStyle = "#d81f3c";
  dot(ctx, 0, r * 0.8 - tiers * tierHeight - r * 0.12, r * 0.16);
}

/** A cog wheel. */
function gear(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  const teeth = 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const reach = i % 2 === 0 ? r : r * 0.75;
    ctx.lineTo(Math.cos(a) * reach, Math.sin(a) * reach);
  }
  ctx.closePath();
  ctx.fill();
  outline(ctx, "#4c535b");
  ctx.fillStyle = "#3a4047";
  dot(ctx, 0, 0, r * 0.3);
}

/** A cartoon bone. */
function bone(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = "#f1ead8";
  ctx.fillRect(-r * 0.75, -r * 0.2, r * 1.5, r * 0.4);
  for (const x of [-0.8, 0.8]) {
    for (const y of [-0.25, 0.25]) {
      dot(ctx, x * r, y * r, r * 0.3);
    }
  }
  ctx.strokeStyle = "#c8bc9c";
  ctx.lineWidth = r * 0.06;
  ctx.strokeRect(-r * 0.75, -r * 0.2, r * 1.5, r * 0.4);
}

/** An ellipse path, ready to fill. */
function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

/** A filled circle in the current colour. */
function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Strokes the current path as a thin outline. */
function outline(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
