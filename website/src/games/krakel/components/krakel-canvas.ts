/**
 * Draws the Krakel Orakel board onto a 2D canvas: the printed dots, then the
 * player's strokes on top.
 *
 * @module
 * @remarks
 * Pure drawing only. Points are normalised (0..1) so the same drawing renders at
 * any canvas size; here they are scaled to the canvas pixels. The dots come
 * straight from the scanned template the round dealt this player. Strokes are drawn
 * with rounded caps and midpoint smoothing so a fast scribble still looks like a
 * line, not a chain of dots.
 */
import { krakelBoard } from "@/games/krakel/engine/boards";
import type { Point, Stroke } from "@/games/krakel/engine/types";

/** Colour of the printed dots, the olive of the real board. */
const KRAKEL_COLOR = "rgba(132, 145, 84, 0.75)";

/** Radius of a printed dot, as a fraction of the canvas width. */
const KRAKEL_DOT_RADIUS = 0.0032;

/** Background the board is cleared to. */
const BOARD_BACKGROUND = "#ffffff";

/** A full turn in radians, for the printed dots. */
const TAU = Math.PI * 2;

/**
 * Pre-painted dot layers, one per board and size.
 *
 * @remarks
 * A board carries a couple of thousand dots and never changes, while the frame
 * loop repaints every open board many times a second. Painting the dots once
 * into an offscreen canvas turns that into a single blit per frame.
 */
const layers = new Map<string, HTMLCanvasElement>();

/** Everything needed to draw one frame of the board. */
export type Scene = {
  readonly boardId: number;
  readonly strokes: readonly Stroke[];
  readonly live: Stroke | null;
  readonly width: number;
  readonly height: number;
};

/**
 * Paints the whole board.
 *
 * @param ctx - the 2D context of the board canvas
 * @param scene - the board id, the strokes and the canvas size
 */
export function drawBoard(ctx: CanvasRenderingContext2D, scene: Scene): void {
  ctx.fillStyle = BOARD_BACKGROUND;
  ctx.fillRect(0, 0, scene.width, scene.height);

  // The printed dots: the only places the drawing is allowed to run through.
  ctx.drawImage(dotLayer(scene.boardId, scene.width, scene.height), 0, 0);

  for (const stroke of scene.strokes) {
    drawStroke(ctx, stroke, scene.width, scene.height);
  }
  if (scene.live !== null) {
    drawStroke(ctx, scene.live, scene.width, scene.height);
  }
}

/** The pre-painted dots of a board, painted on first use and then reused. */
function dotLayer(
  boardId: number,
  width: number,
  height: number,
): HTMLCanvasElement {
  const key = `${boardId}:${width}x${height}`;
  let layer = layers.get(key);
  if (layer === undefined) {
    layer = document.createElement("canvas");
    layer.width = width;
    layer.height = height;
    const ctx = layer.getContext("2d");
    if (ctx !== null) {
      ctx.fillStyle = KRAKEL_COLOR;
      const radius = Math.max(1, KRAKEL_DOT_RADIUS * width);
      for (const point of krakelBoard(boardId)) {
        ctx.beginPath();
        ctx.arc(point.x * width, point.y * height, radius, 0, TAU);
        ctx.fill();
      }
    }
    layers.set(key, layer);
  }
  return layer;
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
