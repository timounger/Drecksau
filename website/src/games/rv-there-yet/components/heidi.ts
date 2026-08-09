/**
 * The girl with the kid, standing where the climb begins.
 *
 * @module
 * @remarks
 * An alpine road with goats on it wants one more thing on it, and everybody
 * who has ever seen a cartoon about a mountain knows what: a small girl in a
 * red pinafore with a white kid beside her, waving at whatever comes up the
 * pass. She stands just past the mud, where the road tips up and the winch
 * section really begins - the last friendly thing anybody sees before the wall.
 *
 * She is scenery and nothing else: no rule of the game knows she is there, and
 * driving into her does nothing at all. The kid beside her is one of the same
 * goats that graze the first section, only small and white.
 */
import { blend } from "@/games/rv-there-yet/components/palette";
import { type Goat } from "@/games/rv-there-yet/components/goat";

/** Where she stands, in metres. */
const SPOT = {
  /** How far past the end of the mud, where the ground starts to rise. */
  after: 5,
  /** How far out from the middle of the road, on the sunny side. */
  out: 7,
  /** How far along from her the kid stands, and how much nearer the road. */
  kid: 1.6,
  kidIn: 0.6,
} as const;

/** How tall she is, in metres - a child, so a good head shorter than a driver. */
export const HEIDI_TALL = 1.25;

/** A stretch of the route, as the mud is given. */
export type Span = { readonly from: number; readonly to: number };

/** Where she stands and what she has with her. */
export type Heidi = {
  /** Where along the route, in metres. */
  readonly at: number;
  /** How far out from the middle of the road, in metres. */
  readonly out: number;
  /** The kid beside her, as a goat like any other. */
  readonly kid: Goat;
};

/**
 * Where the girl stands on this route, if anywhere.
 *
 * @param mud - the mud stretches of the route
 * @returns one place per mud stretch, in the order they come
 * @remarks
 * Tied to the mud rather than to a number of metres, because what she is
 * standing at is the **place**: the far edge of the mud is where the climb
 * starts, and if that ever moves she moves with it.
 */
export function heidiPlaces(mud: readonly Span[]): Heidi[] {
  return mud.map((patch) => {
    const at = patch.to + SPOT.after;
    return {
      at,
      out: SPOT.out,
      kid: {
        at: at + SPOT.kid,
        side: 1,
        out: SPOT.out - SPOT.kidIn,
        size: 0.5,
        facing: -1,
        coat: 0,
      },
    };
  });
}

/** How high the tallest thing in the pair reaches, in metres. */
export const HEIDI_REACH = HEIDI_TALL;

/** The shape of her, in shares of how tall she is. */
const SHAPE = {
  /** The legs: how long, how thick and how far apart. */
  leg: 0.26,
  legThick: 0.09,
  legApart: 0.1,
  /** The shoes at the bottom of them. */
  shoe: 0.06,
  /** The pinafore: where it starts, how wide at the hem and at the shoulders. */
  skirt: 0.46,
  hem: 0.44,
  waist: 0.26,
  /** The blouse under it: the sleeves standing out at the shoulders. */
  sleeve: 0.085,
  sleeveUp: 0.62,
  /** The arms hanging from them. */
  arm: 0.16,
  armThick: 0.06,
  /** The head, and the hair over it. */
  head: 0.15,
  headUp: 0.83,
  hair: 0.18,
  hairUp: 0.06,
  /** The eyes and the cheeks in it. */
  eye: 0.022,
  eyeApart: 0.055,
  eyeUp: 0.02,
  cheek: 0.035,
  cheekApart: 0.1,
  cheekDown: 0.04,
  /** Where the shoulders sit, of the hem, and where the shading starts. */
  shoulder: 0.4,
  shadeFrom: 6,
} as const;

/** Red pinafore, yellow blouse, and the rest of her. */
const PAINT = {
  dress: "#d13a2b",
  blouse: "#f0cf4a",
  skin: "#f3c7a0",
  hair: "#241a16",
  shoe: "#5a3f2a",
  cheek: "#e8806c",
} as const;

/** How much darker the shaded side of the pinafore is. */
const SHADE = 0.22;

/** A whole turn, for the arcs, and the smallest dot worth drawing. */
const FULL = Math.PI * 2;
const THIN = 0.5;

/**
 * Draws the girl.
 *
 * @param ctx - the canvas to paint on
 * @param place - where her feet are, and how many pixels a metre is
 * @remarks
 * Front on, because she is standing at the roadside watching the road: that is
 * what somebody in a picture does when something is coming. The red pinafore
 * over the yellow sleeves is the whole of the likeness - at this size a face is
 * two dots and two red cheeks, and anything more is a smudge.
 */
export function drawHeidi(
  ctx: CanvasRenderingContext2D,
  place: { readonly x: number; readonly y: number; readonly scale: number },
): void {
  const tall = HEIDI_TALL * place.scale;
  const { x, y } = place;
  // Legs, and the shoes on the end of them.
  ctx.fillStyle = PAINT.skin;
  const legThick = Math.max(1, tall * SHAPE.legThick);
  for (const side of [-1, 1]) {
    ctx.fillRect(
      x + side * tall * SHAPE.legApart - legThick / 2,
      y - tall * SHAPE.leg,
      legThick,
      tall * SHAPE.leg,
    );
  }
  ctx.fillStyle = PAINT.shoe;
  for (const side of [-1, 1]) {
    ctx.fillRect(
      x + side * tall * SHAPE.legApart - legThick,
      y - tall * SHAPE.shoe,
      legThick * 2,
      tall * SHAPE.shoe,
    );
  }
  // The arms, before the pinafore, so the sleeves lie over their tops.
  ctx.fillStyle = PAINT.skin;
  const armThick = Math.max(1, tall * SHAPE.armThick);
  for (const side of [-1, 1]) {
    ctx.fillRect(
      x + side * tall * SHAPE.hem * SHAPE.shoulder - armThick / 2,
      y - tall * SHAPE.sleeveUp,
      armThick,
      tall * SHAPE.arm,
    );
  }
  // The pinafore: a trapezoid, wide at the hem, with a shaded side.
  ctx.fillStyle = PAINT.dress;
  ctx.beginPath();
  ctx.moveTo(x - (tall * SHAPE.hem) / 2, y - tall * (SHAPE.leg - SHAPE.shoe));
  ctx.lineTo(x + (tall * SHAPE.hem) / 2, y - tall * (SHAPE.leg - SHAPE.shoe));
  ctx.lineTo(x + (tall * SHAPE.waist) / 2, y - tall * SHAPE.headUp);
  ctx.lineTo(x - (tall * SHAPE.waist) / 2, y - tall * SHAPE.headUp);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = blend(PAINT.dress, PAINT.hair, SHADE);
  ctx.beginPath();
  ctx.moveTo(
    x + (tall * SHAPE.hem) / SHAPE.shadeFrom,
    y - tall * (SHAPE.leg - SHAPE.shoe),
  );
  ctx.lineTo(x + (tall * SHAPE.hem) / 2, y - tall * (SHAPE.leg - SHAPE.shoe));
  ctx.lineTo(x + (tall * SHAPE.waist) / 2, y - tall * SHAPE.headUp);
  ctx.lineTo(
    x + (tall * SHAPE.waist) / SHAPE.shadeFrom,
    y - tall * SHAPE.headUp,
  );
  ctx.closePath();
  ctx.fill();
  // The puffed sleeves of the blouse, standing out at the shoulders.
  ctx.fillStyle = PAINT.blouse;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      x + side * tall * SHAPE.hem * SHAPE.shoulder,
      y - tall * SHAPE.sleeveUp,
      tall * SHAPE.sleeve,
      0,
      FULL,
    );
    ctx.fill();
  }
  drawFace(ctx, place, tall);
}

/**
 * Her head: hair, face, eyes and two red cheeks.
 *
 * @param ctx - the canvas to paint on
 * @param place - where her feet are
 * @param tall - how tall she came out, in pixels
 */
function drawFace(
  ctx: CanvasRenderingContext2D,
  place: { readonly x: number; readonly y: number },
  tall: number,
): void {
  const middle = { x: place.x, y: place.y - tall * SHAPE.headUp };
  ctx.fillStyle = PAINT.hair;
  ctx.beginPath();
  ctx.arc(middle.x, middle.y - tall * SHAPE.hairUp, tall * SHAPE.hair, 0, FULL);
  ctx.fill();
  ctx.fillStyle = PAINT.skin;
  ctx.beginPath();
  ctx.arc(middle.x, middle.y, tall * SHAPE.head, 0, FULL);
  ctx.fill();
  // The fringe: the hair comes back down over the top of the face.
  ctx.fillStyle = PAINT.hair;
  ctx.beginPath();
  ctx.arc(
    middle.x,
    middle.y - tall * SHAPE.hairUp,
    tall * SHAPE.hair,
    Math.PI,
    FULL,
  );
  ctx.fill();
  ctx.fillStyle = PAINT.cheek;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      middle.x + side * tall * SHAPE.cheekApart,
      middle.y + tall * SHAPE.cheekDown,
      tall * SHAPE.cheek,
      0,
      FULL,
    );
    ctx.fill();
  }
  ctx.fillStyle = PAINT.hair;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      middle.x + side * tall * SHAPE.eyeApart,
      middle.y - tall * SHAPE.eyeUp,
      Math.max(THIN, tall * SHAPE.eye),
      0,
      FULL,
    );
    ctx.fill();
  }
}
