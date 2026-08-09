/**
 * The notice board at the start of a section, drawn the same way in both views.
 *
 * @module
 * @remarks
 * It began as a card floating over the picture, which said what it had to say
 * but belonged to the screen rather than to the world. Now it is a board on
 * two posts, standing in the ground on the left verge a few metres past the
 * section marker - the sort of thing that really does stand at the start of a
 * forest track, and something the headlights come round to face.
 *
 * The board is big: as wide as the motorhome is long. It has to be, because
 * the text on it has to be readable from the driver's seat, and a metre of
 * board ten metres away is thirty pixels. A smaller board would be a smudge.
 *
 * Both views hand in the foot of it and a scale in pixels per metre.
 */

/** Where a notice board stands, how big it comes out, and what it says. */
export type NoticePlace = {
  /** The middle of the board on the canvas. */
  readonly x: number;
  /** The ground at the foot of its posts. */
  readonly y: number;
  /** How many pixels one metre is here. */
  readonly scale: number;
  /** What is written on it. */
  readonly words: string;
};

/** How far past the section marker the board stands, in metres. */
export const NOTICE_AFTER = 10;

/** How far to the left of the middle of the road it stands, in metres. */
export const NOTICE_SIDE = -9;

/** The board itself, in metres. */
const BOARD = {
  wide: 7,
  tall: 3,
  /** How high the bottom edge of it stands above the ground. */
  low: 1.1,
  /** How far apart the posts stand, of the board's width, and how thick. */
  posts: 0.62,
  postWide: 0.22,
  /** How much of a post's width lies in its own shadow. */
  postShade: 0.25,
  /** The frame around the face of it. */
  frame: 0.12,
  /** The air between the frame and the writing. */
  pad: 0.28,
} as const;

/** How the writing is laid out. */
const WRITING = {
  /** Line spacing, as a share of the text size. */
  leading: 1.25,
  /** The most lines it will break the wording into. */
  lines: 5,
  /**
   * The pixels-per-metre the setting is worked out at.
   *
   * @remarks
   * Any number would do - it cancels out again - but a large one keeps the
   * measuring well clear of whole-pixel rounding.
   */
  perMetre: 100,
  /** Below this many pixels the writing is a smudge, so it is left off. */
  legible: 5,
} as const;

/** Weathered wood, a painted face, and the writing on it. */
const PAINT = {
  post: "#6b4a2f",
  edge: "#7a5a34",
  face: "#f7f1e3",
  ink: "#3a2f22",
  /** The shaded side of a post, so the wood is round. */
  shade: "#4e351f",
} as const;

/**
 * Draws one notice board.
 *
 * @param ctx - the canvas to paint on
 * @param place - where it stands, how big, and what it says
 */
export function drawNotice(
  ctx: CanvasRenderingContext2D,
  place: NoticePlace,
): void {
  const scale = place.scale;
  const wide = BOARD.wide * scale;
  const high = BOARD.tall * scale;
  const top = place.y - (BOARD.low + BOARD.tall) * scale;
  const left = place.x - wide / 2;
  drawPosts(ctx, place, wide, top + high);
  ctx.fillStyle = PAINT.edge;
  ctx.fillRect(left, top, wide, high);
  const frame = BOARD.frame * scale;
  ctx.fillStyle = PAINT.face;
  ctx.fillRect(left + frame, top + frame, wide - frame * 2, high - frame * 2);
  drawWriting(ctx, place, { left, top, wide, high });
}

/**
 * The two posts the board stands on.
 *
 * @param ctx - the canvas to paint on
 * @param place - where the board stands
 * @param wide - how wide the board came out, in pixels
 * @param under - the bottom edge of the board, on the canvas
 */
function drawPosts(
  ctx: CanvasRenderingContext2D,
  place: NoticePlace,
  wide: number,
  under: number,
): void {
  const thick = Math.max(1, BOARD.postWide * place.scale);
  for (const side of [-1, 1]) {
    const at = place.x + (side * wide * BOARD.posts) / 2;
    ctx.fillStyle = PAINT.post;
    ctx.fillRect(at - thick / 2, under, thick, place.y - under);
    // The far side of the post, so it is a pole and not a stripe.
    ctx.fillStyle = PAINT.shade;
    const dark = thick * BOARD.postShade;
    ctx.fillRect(at + dark, under, dark, place.y - under);
  }
}

/**
 * The wording, painted on the face of the board.
 *
 * @param ctx - the canvas to paint on
 * @param place - where the board stands
 * @param board - the face of it on the canvas
 * @remarks
 * Too far off to read, nothing is written at all - a grey smear of half-pixels
 * says less than a blank board does.
 */
function drawWriting(
  ctx: CanvasRenderingContext2D,
  place: NoticePlace,
  board: {
    readonly left: number;
    readonly top: number;
    readonly wide: number;
    readonly high: number;
  },
): void {
  const fitted = fitting(ctx, place.words);
  const size = fitted.size * place.scale;
  if (size < WRITING.legible) {
    return;
  }
  ctx.font = `${size}px sans-serif`;
  ctx.fillStyle = PAINT.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const step = size * WRITING.leading;
  const middle = board.top + board.high / 2;
  fitted.lines.forEach((line, index) => {
    const away = index - (fitted.lines.length - 1) / 2;
    ctx.fillText(line, board.left + board.wide / 2, middle + away * step);
  });
}

/** A wording broken into lines, with the height of the letters, in metres. */
type Fitted = { readonly size: number; readonly lines: readonly string[] };

/**
 * How each wording is set, worked out once and kept.
 *
 * @remarks
 * The board is the same board at every distance, so the setting is the same
 * setting: one line break, one size, both in metres. Keeping them is a saving
 * of a few measurements a frame, but that is not why it is here - see
 * {@link fitting}.
 */
const SET = new Map<string, Fitted>();

/**
 * The largest the wording can be written at and still fit the board.
 *
 * @param ctx - the canvas, for measuring with
 * @param words - the wording
 * @returns the height of the letters in **metres**, and the lines
 * @remarks
 * Worked out in metres on the board rather than in pixels on the screen, and
 * that is the whole point. Done in pixels it came out afresh every frame, and
 * as the board grew on the approach the answer kept changing: five words on the
 * first line, then four, then five again, the whole sentence hopping about from
 * one frame to the next while the vehicle rolled towards it. A sign is painted
 * once and then it is just a sign, so the line break belongs to the board and
 * not to how far away one happens to be standing.
 *
 * Tried at one line first and then at more, taking the first size whose lines
 * fit: that is the largest writing the board can carry, which is the point of a
 * sign. Measured at a fixed size and scaled, which is exact - a font twice the
 * size is twice as wide.
 */
function fitting(ctx: CanvasRenderingContext2D, words: string): Fitted {
  const kept = SET.get(words);
  if (kept !== undefined) {
    return kept;
  }
  const pad = (BOARD.frame + BOARD.pad) * WRITING.perMetre;
  const inner = {
    wide: BOARD.wide * WRITING.perMetre - pad * 2,
    high: BOARD.tall * WRITING.perMetre - pad * 2,
  };
  let fitted: Fitted = { size: 0, lines: [] };
  for (let count = 1; count <= WRITING.lines; count++) {
    const size = inner.high / (count * WRITING.leading);
    ctx.font = `${size}px sans-serif`;
    const lines = brokenInto(ctx, words, inner.wide);
    fitted = { size: size / WRITING.perMetre, lines };
    if (lines.length <= count) {
      break;
    }
  }
  SET.set(words, fitted);
  return fitted;
}

/**
 * Breaks a sentence into lines that fit.
 *
 * @param ctx - the canvas, for measuring in the font already set on it
 * @param words - the sentence
 * @param wide - the widest a line may be, in pixels
 * @returns the lines
 * @remarks
 * A word wider than the whole board gets a line to itself rather than an
 * endless loop: it will stick out, and sticking out says the wording wants
 * shortening.
 */
function brokenInto(
  ctx: CanvasRenderingContext2D,
  words: string,
  wide: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of words.split(" ")) {
    const grown = line === "" ? word : `${line} ${word}`;
    if (line !== "" && ctx.measureText(grown).width > wide) {
      lines.push(line);
      line = word;
    } else {
      line = grown;
    }
  }
  if (line !== "") {
    lines.push(line);
  }
  return lines;
}
