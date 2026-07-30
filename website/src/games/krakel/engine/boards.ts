/**
 * The printed Krakel boards: the dots a drawing has to follow.
 *
 * @module
 * @remarks
 * Like the real game, a player may not draw freely. Every board is a fixed
 * pattern of printed dots, and the pen only inks where those dots are - which is
 * what turns a scribble into something the others can read.
 *
 * The patterns are not generated: they are the scanned templates of the real
 * game, stored dot for dot in `boards-data.ts` and decoded here on first use.
 * Each round hands every player one board by its id, and only that id crosses
 * the wire, so every client draws the identical pattern.
 */
import { ENCODED_BOARDS } from "./boards-data";
import type { Point } from "./types";

/** The alphabet a coordinate's two characters are written in. */
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Characters per dot: two for x, two for y. */
const CHARS_PER_DOT = 4;

/** Bits each character carries, and the largest value two of them encode. */
const BITS_PER_CHAR = 6;
const COORD_MAX = 4095;

/** How many boards there are to deal from. */
export const KRAKEL_BOARD_COUNT = ENCODED_BOARDS.length;

/**
 * Width divided by height of a printed board.
 *
 * @remarks
 * The scans agree to within half a percent; the canvas uses this so the pattern
 * is not stretched out of shape.
 */
export const BOARD_ASPECT = 1.436;

/** Decoded boards, filled in on first use so an unplayed board costs nothing. */
const cache: (readonly Point[] | undefined)[] = [];

/** Reverse lookup for the alphabet, built once. */
const VALUES: ReadonlyMap<string, number> = new Map(
  [...ALPHABET].map((char, index) => [char, index]),
);

/**
 * The dots of one board.
 *
 * @param id - the board's id, as dealt for the round
 * @returns the board's dots on the normalised 0..1 canvas
 * @remarks
 * Ids outside the range wrap around, so a caller can never ask for a board that
 * does not exist.
 */
export function krakelBoard(id: number): readonly Point[] {
  const index =
    ((id % KRAKEL_BOARD_COUNT) + KRAKEL_BOARD_COUNT) % KRAKEL_BOARD_COUNT;
  const cached = cache[index];
  let dots: readonly Point[];
  if (cached === undefined) {
    dots = decodeBoard(ENCODED_BOARDS[index]);
    cache[index] = dots;
  } else {
    dots = cached;
  }
  return dots;
}

/**
 * Snaps a point onto the nearest dot, if one is close enough.
 *
 * @param dots - the board's dots
 * @param target - the raw point to snap
 * @param tolerance - the largest distance that still counts as "on the board"
 * @returns the nearest dot within tolerance, or null if the pen is off the lines
 */
export function snapToBoard(
  dots: readonly Point[],
  target: Point,
  tolerance: number,
): Point | null {
  let best: Point | null = null;
  let bestDist = tolerance * tolerance;
  for (const dot of dots) {
    const dist = (dot.x - target.x) ** 2 + (dot.y - target.y) ** 2;
    if (dist <= bestDist) {
      bestDist = dist;
      best = dot;
    }
  }
  return best;
}

/** Reads one board's dots out of its encoded string. */
function decodeBoard(encoded: string): readonly Point[] {
  const dots: Point[] = [];
  for (let i = 0; i + CHARS_PER_DOT <= encoded.length; i += CHARS_PER_DOT) {
    dots.push({
      x: coord(encoded, i),
      y: coord(encoded, i + 2),
    });
  }
  return dots;
}

/** Reads the two characters at an offset back into a 0..1 coordinate. */
function coord(encoded: string, at: number): number {
  const high = VALUES.get(encoded[at]) ?? 0;
  const low = VALUES.get(encoded[at + 1]) ?? 0;
  return ((high << BITS_PER_CHAR) | low) / COORD_MAX;
}
