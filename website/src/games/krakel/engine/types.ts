/**
 * Core types and tuning constants of the Krakel Orakel game logic.
 *
 * @module
 * @remarks
 * The world here is tiny: a shared drawing (strokes on a normalised 0..1
 * canvas), a secret term the drawer must picture, and the round/score
 * bookkeeping. All of it is a pure, serialisable value so the host can run it
 * and stream it, and so the rules stay testable without a browser.
 */

/** A point on the drawing, in normalised canvas coordinates (0..1). */
export type Point = {
  readonly x: number;
  readonly y: number;
};

/** One pen stroke: a colour, a width and the points it runs through. */
export type Stroke = {
  /** CSS colour of the line. */
  readonly color: string;
  /** Line width as a fraction of the canvas height, so it scales. */
  readonly width: number;
  readonly points: readonly Point[];
};

/** How far a single round of Krakel Orakel has got. */
export type KrakelPhase = "drawing" | "reveal" | "over";

/** Seconds a drawer has to picture the term while the others guess. */
export const DRAW_SECONDS = 90;

/** Seconds the answer and the round's scores stay up between rounds. */
export const REVEAL_SECONDS = 6;

/** How many times each player draws over a full game. */
export const ROUNDS_PER_PLAYER = 2;

/** Fewest and most players a room holds. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

/** Most strokes a drawing keeps, so a round cannot pile up without bound. */
export const MAX_STROKES = 600;

/** Most points one stroke keeps, so a long scribble stays bounded. */
export const MAX_STROKE_POINTS = 400;

/** The colours a drawer can pick; the last one paints the background (eraser). */
export const PALETTE: readonly string[] = [
  "#1e293b",
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#0ea5e9",
  "#6366f1",
  "#ec4899",
  "#a16207",
  "#ffffff",
];

/** The eraser colour: the drawing background, so it rubs a line out. */
export const ERASER_COLOR = "#ffffff";

/** Selectable pen widths, each a fraction of the canvas height. */
const PEN_THIN = 0.006;
const PEN_MEDIUM = 0.013;
const PEN_THICK = 0.028;
const PEN_HUGE = 0.06;

/** The pen widths a drawer can pick, thin to thick. */
export const PEN_WIDTHS: readonly number[] = [
  PEN_THIN,
  PEN_MEDIUM,
  PEN_THICK,
  PEN_HUGE,
];
