/**
 * The flying boy and his fairy, hanging over the ditch.
 *
 * @module
 * @remarks
 * The third section is the one with a hole in the road that a motorhome cannot
 * simply be driven across, and over that hole floats the one figure in all of
 * children's stories who never had that problem: a boy in green with a feather
 * in his cap, and a fairy trailing sparks beside him. Nobody down there can
 * fly, which is the joke.
 *
 * Scenery only: no rule knows about them, they cannot be driven into, and they
 * do not move - a hovering figure over a hole reads as hovering all by itself,
 * and something bobbing on a clock would be the only thing in this world that
 * moves without anybody doing anything.
 *
 * Where they hang comes from the **ditch** rather than from a metre count: the
 * middle of the hole is the place, and if the hole ever moves they move with
 * it. A route with no ditch has no boy over it.
 */
import { blend } from "@/games/rv-there-yet/components/palette";
import { ROUTE_STEP } from "@/games/rv-there-yet/engine/types";

/** A stretch of the route, as the ditches are given. */
export type Span = { readonly from: number; readonly to: number };

/** Where the pair hang. */
export type Flying = {
  /** Where along the route, in metres. */
  readonly at: number;
  /** How high above the lips of the hole, in metres. */
  readonly up: number;
  /**
   * The last whole field of road on each side, whose height he is reckoned
   * from - the edges of the hole are already halfway down into it.
   */
  readonly rim: readonly [number, number];
};

/** How he hangs there, in metres. */
const AIR = {
  /** How far above the lip of the ditch he floats. */
  up: 6.4,
  /** How far off the middle of the road he is, on the sunny side. */
  out: 3.4,
  /** How far ahead of him the fairy flies, and how much lower. */
  fairyOn: 3.6,
  fairyDown: 2,
} as const;

/**
 * How long he is from cap to toe, in metres.
 *
 * @remarks
 * More than twice as long as a boy really is. Life size he was a green speck
 * over a hole thirty metres off, and a speck nobody can make out is not a joke
 * but a smudge. Storybook people may be the size the story needs them to be.
 */
export const PETER_LONG = 3.4;

/** How high the pair reach above the ground, for the sight lines. */
export const PETER_REACH = AIR.up + PETER_LONG;

/** How far out from the middle of the road he floats, in metres. */
export const PETER_OUT = AIR.out;

/**
 * Where the boy and his fairy hang on this route, if anywhere.
 *
 * @param pits - the ditches of the route
 * @returns one place per ditch, in the order they come
 */
export function peterPlaces(pits: readonly Span[]): Flying[] {
  return pits.map((pit) => ({
    at: (pit.from + pit.to) / 2,
    up: AIR.up,
    rim: [pit.from - ROUTE_STEP, pit.to + ROUTE_STEP] as const,
  }));
}

/**
 * How high above the ground he hangs, in metres.
 *
 * @param flying - where the pair hang
 * @param lips - how high the ground is at each lip of the hole
 * @returns the height he floats at, in the same measure as the ground
 * @remarks
 * Reckoned from the **lips** rather than from the floor of the hole, which is
 * the whole point of him: measured from the bottom he would hang down inside
 * the ditch, level with the very thing nobody down there can get across.
 */
export function hoverOver(
  flying: Flying,
  lips: readonly [number, number],
): number {
  return Math.max(lips[0], lips[1]) + flying.up;
}

/** The shape of him, in shares of how long he is. */
const SHAPE = {
  /** The tunic: how long the body is and how deep, with its jagged hem. */
  body: 0.4,
  deep: 0.26,
  hem: 0.1,
  /** The legs, trailing out behind him. */
  leg: 0.36,
  legThick: 0.09,
  legDrop: 0.2,
  /** The shoe on the end of each, turned up at the toe. */
  shoe: 0.08,
  /** The arm reaching forward, and the fist on the end of it. */
  arm: 0.3,
  armThick: 0.08,
  /** The head, and the cap over it with its feather. */
  head: 0.14,
  headOn: 0.28,
  cap: 0.17,
  capUp: 0.5,
  feather: 0.22,
  /** The ear, which is the pointed one. */
  ear: 0.06,
} as const;

/**
 * The finer proportions, as shares of the parts they belong to.
 *
 * @remarks
 * All of them are "how far along that piece", which is why they live together
 * rather than each having a name of its own three lines long.
 */
const PART = {
  /** The far leg kicks up while the near one trails down. */
  legLift: -0.15,
  /** How far down and up the jagged hem of the tunic cuts. */
  hem: 0.7,
  /** Where the shading of the tunic starts, and where the arm leaves it. */
  shadeFrom: 0.1,
  armFrom: 0.7,
  armDown: 0.2,
  /** The head: how high he carries it, and how far back the hair sits. */
  headUp: 0.6,
  hairBack: 0.2,
  face: 0.86,
  /** The ear: where on the skull, and how it is cut. */
  earAt: 0.5,
  earDown: 0.6,
  earBack: 0.4,
  /** The cap: how far back and forward it sits, and where its point is. */
  capBack: 0.8,
  capDown: 0.5,
  capTip: 0.55,
  capIn: 0.2,
  /** The feather: where it leaves the cap, how it bends, and how fine it is. */
  featherFrom: 0.3,
  featherUp: 0.7,
  featherBend: 0.6,
  featherOut: 0.5,
  featherThin: 0.6,
  /** The fairy: how low the far wing hangs and how the sparks fade out. */
  wingLow: 0.4,
  fade: 0.6,
} as const;

/** The fairy, in shares of how long **he** is. */
const FAIRY = {
  body: 0.075,
  wing: 0.13,
  wingUp: 0.06,
  /** Her trail: how many sparks, how far back they go and how small. */
  sparks: 5,
  trail: 0.55,
  spark: 0.022,
} as const;

/** Lincoln green, and everything else the pair are made of. */
const PAINT = {
  tunic: "#3c8b4a",
  tunicDeep: "#26603a",
  cap: "#347d43",
  feather: "#c0392b",
  skin: "#f3c7a0",
  hair: "#8a4b23",
  shoe: "#5a3f2a",
  fairy: "#8fd05a",
  glow: "#f7e79a",
  spark: "#fdf3bd",
} as const;

/** How much darker the underside of the tunic is. */
const SHADE = 0.35;

/** A whole turn, for the arcs, and the smallest dot worth drawing. */
const FULL = Math.PI * 2;
const THIN = 0.5;

/**
 * Draws the boy and his fairy, flying.
 *
 * @param ctx - the canvas to paint on
 * @param place - the point he flies about, and how many pixels a metre is
 * @remarks
 * Side on and lying out flat, the way anybody in a picture flies: cap forward,
 * one arm out, legs trailing. The green tunic with the jagged hem, the pointed
 * cap and the red feather are the whole of the likeness at this size.
 */
export function drawPeter(
  ctx: CanvasRenderingContext2D,
  place: { readonly x: number; readonly y: number; readonly scale: number },
): void {
  const long = PETER_LONG * place.scale;
  const { x, y } = place;
  // The legs first, trailing out behind, then the tunic over their tops. The
  // far one goes down in the darker green, so the pair read as two legs.
  const legThick = Math.max(1, long * SHAPE.legThick);
  for (const step of [-1, 1]) {
    const near = step > 0;
    const drop = y + long * SHAPE.legDrop * (near ? 1 : PART.legLift);
    ctx.fillStyle = near ? PAINT.tunic : PAINT.tunicDeep;
    ctx.beginPath();
    ctx.moveTo(x, y - legThick / 2);
    ctx.lineTo(x - long * SHAPE.leg, drop);
    ctx.lineTo(x - long * SHAPE.leg, drop + legThick);
    ctx.lineTo(x, y + legThick / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAINT.shoe;
    ctx.beginPath();
    ctx.ellipse(
      x - long * (SHAPE.leg + SHAPE.shoe / 2),
      drop + legThick / 2,
      long * SHAPE.shoe,
      legThick,
      0,
      0,
      FULL,
    );
    ctx.fill();
  }
  // The tunic: a wedge with a jagged hem at the back.
  ctx.fillStyle = PAINT.tunic;
  ctx.beginPath();
  ctx.moveTo(x + long * SHAPE.body, y - long * SHAPE.deep * THIN);
  ctx.lineTo(x + long * SHAPE.body, y + long * SHAPE.deep * THIN);
  ctx.lineTo(x - long * SHAPE.hem, y + long * SHAPE.deep * PART.hem);
  ctx.lineTo(x, y);
  ctx.lineTo(x - long * SHAPE.hem, y - long * SHAPE.deep * PART.hem);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = blend(PAINT.tunic, PAINT.tunicDeep, SHADE);
  ctx.beginPath();
  ctx.moveTo(x + long * SHAPE.body, y + long * SHAPE.deep * PART.shadeFrom);
  ctx.lineTo(x + long * SHAPE.body, y + long * SHAPE.deep * THIN);
  ctx.lineTo(x - long * SHAPE.hem, y + long * SHAPE.deep * PART.hem);
  ctx.closePath();
  ctx.fill();
  // The arm, reaching out in front of him.
  ctx.fillStyle = PAINT.skin;
  const armThick = Math.max(1, long * SHAPE.armThick);
  ctx.fillRect(
    x + long * SHAPE.body * PART.armFrom,
    y - long * SHAPE.deep * PART.armDown,
    long * SHAPE.arm,
    armThick,
  );
  drawHead(ctx, place, long);
  drawTrail(ctx, place, long);
}

/**
 * His head: face, hair, the pointed ear and the cap with the feather.
 *
 * @param ctx - the canvas to paint on
 * @param place - the point he flies about
 * @param long - how long he came out, in pixels
 */
function drawHead(
  ctx: CanvasRenderingContext2D,
  place: { readonly x: number; readonly y: number },
  long: number,
): void {
  const head = {
    x: place.x + long * SHAPE.headOn,
    y: place.y - long * SHAPE.head * PART.headUp,
  };
  ctx.fillStyle = PAINT.hair;
  ctx.beginPath();
  ctx.arc(
    head.x - long * SHAPE.head * PART.hairBack,
    head.y,
    long * SHAPE.head,
    0,
    FULL,
  );
  ctx.fill();
  ctx.fillStyle = PAINT.skin;
  ctx.beginPath();
  ctx.arc(head.x, head.y, long * SHAPE.head * PART.face, 0, FULL);
  ctx.fill();
  // The pointed ear, which is half of what says who he is.
  ctx.beginPath();
  ctx.moveTo(head.x - long * SHAPE.head * PART.earAt, head.y);
  ctx.lineTo(
    head.x - long * (SHAPE.head * PART.earAt + SHAPE.ear),
    head.y - long * SHAPE.ear,
  );
  ctx.lineTo(
    head.x - long * SHAPE.head * PART.earBack,
    head.y + long * SHAPE.ear * PART.earDown,
  );
  ctx.closePath();
  ctx.fill();
  // The cap, and the feather standing up out of it.
  ctx.fillStyle = PAINT.cap;
  ctx.beginPath();
  ctx.moveTo(
    head.x - long * SHAPE.cap * PART.capBack,
    head.y - long * SHAPE.head * PART.capDown,
  );
  ctx.lineTo(
    head.x + long * SHAPE.cap,
    head.y - long * SHAPE.head * PART.capTip,
  );
  ctx.lineTo(
    head.x - long * SHAPE.cap * PART.capIn,
    head.y - long * SHAPE.capUp * PART.capDown,
  );
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PAINT.feather;
  ctx.lineWidth = Math.max(1, long * SHAPE.armThick * PART.featherThin);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(
    head.x - long * SHAPE.cap * PART.featherFrom,
    head.y - long * SHAPE.head * PART.featherUp,
  );
  ctx.quadraticCurveTo(
    head.x - long * SHAPE.feather * PART.featherBend,
    head.y - long * SHAPE.feather,
    head.x - long * SHAPE.feather,
    head.y - long * SHAPE.feather * PART.featherOut,
  );
  ctx.stroke();
}

/**
 * The fairy flying with him, and the sparks she leaves behind.
 *
 * @param ctx - the canvas to paint on
 * @param place - the point he flies about
 * @param long - how long he came out, in pixels
 * @remarks
 * At this size she is a bright dot with two wings; what makes her a fairy and
 * not a fly is the **trail** - a handful of sparks getting smaller and fainter
 * the further back they are.
 */
function drawTrail(
  ctx: CanvasRenderingContext2D,
  place: { readonly x: number; readonly y: number; readonly scale: number },
  long: number,
): void {
  const her = {
    x: place.x + AIR.fairyOn * place.scale,
    y: place.y + AIR.fairyDown * place.scale,
  };
  ctx.fillStyle = PAINT.spark;
  for (let spark = 1; spark <= FAIRY.sparks; spark++) {
    const share = spark / FAIRY.sparks;
    ctx.beginPath();
    ctx.arc(
      her.x - long * FAIRY.trail * share,
      her.y + long * FAIRY.wingUp * share,
      Math.max(THIN, long * FAIRY.spark * (1 - share * PART.fade)),
      0,
      FULL,
    );
    ctx.fill();
  }
  // Her wings, then the glow, then her.
  ctx.fillStyle = PAINT.glow;
  for (const step of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(
      her.x - long * FAIRY.body,
      her.y - long * FAIRY.wingUp * (step > 0 ? 1 : PART.wingLow),
      long * FAIRY.wing,
      long * FAIRY.wing * THIN,
      -THIN,
      0,
      FULL,
    );
    ctx.fill();
  }
  ctx.fillStyle = PAINT.fairy;
  ctx.beginPath();
  ctx.arc(her.x, her.y, long * FAIRY.body, 0, FULL);
  ctx.fill();
}
