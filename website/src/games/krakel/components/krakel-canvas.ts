/**
 * Draws the Krakel Orakel board onto a 2D canvas: the base squiggle, then the
 * strokes on top.
 *
 * @module
 * @remarks
 * Pure drawing only. Points are normalised (0..1) so the same drawing renders at
 * any canvas size; here they are scaled to the canvas pixels. Strokes are drawn
 * with rounded caps and midpoint smoothing so a fast scribble still looks like a
 * line, not a chain of dots.
 */
import { krakelTemplate } from "@/games/krakel/engine/krakel-path";
import type { Point, Stroke } from "@/games/krakel/engine/types";

/** Colour of the faint template lines the drawing must stay on. */
const KRAKEL_COLOR = "rgba(148, 163, 184, 0.55)";

/** Width of a template line, as a fraction of the canvas height. */
const KRAKEL_WIDTH = 0.018;

/** Background the board is cleared to. */
const BOARD_BACKGROUND = "#ffffff";

/** Everything needed to draw one frame of the board. */
export type Scene = {
  readonly krakelSeed: number;
  readonly strokes: readonly Stroke[];
  readonly live: Stroke | null;
  readonly width: number;
  readonly height: number;
};

/**
 * Paints the whole board.
 *
 * @param ctx - the 2D context of the board canvas
 * @param scene - the squiggle seed, the strokes and the canvas size
 */
export function drawBoard(ctx: CanvasRenderingContext2D, scene: Scene): void {
  ctx.fillStyle = BOARD_BACKGROUND;
  ctx.fillRect(0, 0, scene.width, scene.height);

  // The faint template: the only lines the drawing is allowed to run along.
  for (const line of krakelTemplate(scene.krakelSeed)) {
    drawStroke(
      ctx,
      { color: KRAKEL_COLOR, width: KRAKEL_WIDTH, points: line },
      scene.width,
      scene.height,
    );
  }

  for (const stroke of scene.strokes) {
    drawStroke(ctx, stroke, scene.width, scene.height);
  }
  if (scene.live !== null) {
    drawStroke(ctx, scene.live, scene.width, scene.height);
  }
}

/** Draws one stroke, smoothed through the midpoints of its segments. */
function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  width: number,
  height: number,
): void {
  const points = stroke.points;
  if (points.length > 0) {
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = Math.max(1, stroke.width * height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (points.length === 1) {
      dot(ctx, points[0], width, height, ctx.lineWidth / 2);
    } else {
      smoothPath(ctx, points, width, height);
    }
  }
}

/** A filled dot, so a single tap still leaves a mark. */
function dot(
  ctx: CanvasRenderingContext2D,
  point: Point,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.arc(point.x * width, point.y * height, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** Strokes a smooth curve through the points using midpoint quadratics. */
function smoothPath(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  width: number,
  height: number,
): void {
  ctx.beginPath();
  ctx.moveTo(points[0].x * width, points[0].y * height);
  for (let i = 1; i < points.length - 1; i++) {
    const midX = ((points[i].x + points[i + 1].x) / 2) * width;
    const midY = ((points[i].y + points[i + 1].y) / 2) * height;
    ctx.quadraticCurveTo(points[i].x * width, points[i].y * height, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x * width, last.y * height);
  ctx.stroke();
}
