/**
 * Core types and tuning constants of the Krakel Orakel game logic.
 *
 * @module
 * @remarks
 * The world here is tiny: one drawing per player (strokes on a normalised 0..1
 * canvas), the secret term each of them must picture, and the round/score
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

/**
 * How far a single round of Krakel Orakel has got.
 *
 * @remarks
 * `drawing` - everyone pictures their own secret term at the same time.
 * `eliminating` - every board is open and the players take turns striking a
 * word they believe nobody drew. `reveal` - the round's result, with each
 * board's real term. `over` - the whole game is done.
 */
export type KrakelPhase = "drawing" | "eliminating" | "reveal" | "over";

/** Seconds every player has to picture their own term - the two minutes. */
export const DRAW_SECONDS = 120;

/** Seconds a player has to strike a word before the clock picks for them. */
export const ELIMINATE_SECONDS = 45;

/** Seconds the round's result stays up between rounds. */
export const REVEAL_SECONDS = 10;

/** How many rounds a full game runs. */
export const TOTAL_ROUNDS = 3;

/**
 * How many words the round adds on top of the real ones.
 *
 * @remarks
 * Nobody drew these, so exactly this many words have to go - which is also how
 * many turns the elimination phase lasts.
 */
export const DECOY_COUNT = 4;

/** Fewest and most players a room holds. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;

/** Most strokes a drawing keeps, so a round cannot pile up without bound. */
export const MAX_STROKES = 600;

/** Most points one stroke keeps, so a long scribble stays bounded. */
export const MAX_STROKE_POINTS = 400;

/**
 * How close (normalised) the pen must be to a printed dot to ink it.
 *
 * @remarks
 * The dots sit about 0.017 apart down the board, so this is roughly one and a
 * half dots: close enough that following a line is comfortable, far enough from
 * generous that the pen keeps inking out in the open.
 */
export const SNAP_TOLERANCE = 0.025;

/**
 * A snapped jump larger than this (normalised) lifts the pen.
 *
 * @remarks
 * Must clear one dot step so a line can be followed, but stay well under the
 * gap between neighbouring lines, or a stroke would leap from one to the next.
 */
export const SNAP_MAX_JUMP = 0.04;

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
