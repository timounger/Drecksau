/**
 * One tree, drawn the same way from the cab and from the roadside.
 *
 * @module
 * @remarks
 * It used to be a circle on a line, in both views separately. A circle on a
 * line is a lollipop: nothing about it says wood, and the tree it stands for
 * is the thing a three-tonne motorhome is winched up a hill by - it ought to
 * look like it could take it.
 *
 * So: a trunk that tapers and flares out into its roots, a couple of branches,
 * and a crown of overlapping lobes rather than one ball, lit from the upper
 * left like everything else in the view. The body of the crown keeps exactly
 * the size and colour it always had, so what the tree **is** has not changed -
 * only what it looks like.
 *
 * Both views hand in a foot and a scale in pixels per metre, which is all that
 * differs between standing beside a tree and seeing one from a moving cab.
 */
import { blend } from "@/games/rv-there-yet/components/palette";

/** Where a tree stands and how it is to be drawn. */
export type TreePlace = {
  /** The foot of the trunk on the canvas. */
  readonly x: number;
  readonly y: number;
  /** How many pixels one metre is here. */
  readonly scale: number;
  /** Height of the trunk in metres, up to the middle of the crown. */
  readonly trunk: number;
  /** Radius of the crown in metres. */
  readonly crown: number;
  /** The colour of the crown's body. */
  readonly tone: string;
  /** The colour of the bark. */
  readonly bark: string;
  /** Which tree this is, so that a row of them is not one tree repeated. */
  readonly seed: number;
};

/** The shape of the tree, in shares of the crown's radius. */
const SHAPE = {
  /** Half the trunk at the ground, where the crown radius is one. */
  baseHalf: 0.1,
  /** Half the trunk where the crown swallows it. */
  tipHalf: 0.045,
  /** How much wider than that the roots flare out at the very bottom. */
  flare: 1.8,
  /** How far up the trunk the taper is pulled in towards. */
  waist: 0.35,
  /** How wide the shaded side of the trunk is, of its whole width. */
  darkSide: 0.38,
} as const;

/**
 * Where the branches leave the trunk, and where they reach.
 *
 * @remarks
 * Low enough on the stem to come out from under the crown - a branch drawn
 * inside the leaves is work nobody ever sees.
 */
const BRANCHES = [
  { at: 0.38, out: -0.8, rise: 0.34 },
  { at: 0.45, out: 0.74, rise: 0.38 },
] as const;

/**
 * The lobes of the crown, drawn in this order.
 *
 * @remarks
 * Offsets and radii are shares of the crown's radius, `y` counted upwards.
 * The dark ones come first and hang out below the body of the crown; the lit
 * ones come last and sit on top of it, which is what gives the thing a side
 * the light is coming from. The body is the one with no shade at all: it keeps
 * the crown's own colour and its full radius, so a tree is still found and
 * measured by exactly one circle.
 */
const LOBES = [
  { x: 0.62, y: -0.34, radius: 0.6, shade: -0.34 },
  { x: -0.68, y: -0.26, radius: 0.58, shade: -0.2 },
  { x: 0.66, y: 0.3, radius: 0.5, shade: -0.08 },
  { x: 0, y: 0, radius: 1, shade: 0 },
  { x: -0.46, y: 0.52, radius: 0.56, shade: 0.11 },
  { x: 0.02, y: 0.82, radius: 0.42, shade: 0.19 },
] as const;

/** The colours the crown is shaded towards, away from the light and into it. */
const DEEP = "#0d2b16";
const SUN = "#f2ffd2";

/**
 * How the trees differ from one another, picked by their number.
 *
 * @remarks
 * The crown is turned by so much and its lobes grown or shrunk by so much.
 * Three of them is enough: two trees are never side by side, and the point is
 * only that the row of them along a route does not read as one tree stamped
 * out over and over.
 */
const SHAPES = [
  { turn: -0.15, size: 1 },
  { turn: 0.1, size: 0.92 },
  { turn: 0.22, size: 1.08 },
] as const;

/**
 * How far above the rope's height the middle of the crown sits, in crowns.
 *
 * @remarks
 * The rope goes round the trunk at the height the map gives, which is where
 * the crown used to be centred - and a crown centred two and a half metres up
 * with a radius of two and a half sits **on the ground**. That is where the
 * lollipop came from. The stem carries on past the rope and the crown rides on
 * top of it, so there is a tree under the leaves.
 */
const CROWN_LIFT = 0.8;

/** How big a crown has to be, in pixels, to be worth any detail at all. */
const DETAIL = 7;

/** The thinnest anything is drawn, in pixels: below that it is a hair. */
const THIN = 0.5;

/** A whole turn, for the arcs. */
const FULL = Math.PI * 2;

/**
 * Draws one tree.
 *
 * @param ctx - the canvas to paint on
 * @param place - where it stands and how it is to look
 */
export function drawTree(
  ctx: CanvasRenderingContext2D,
  place: TreePlace,
): void {
  const crown = place.crown * place.scale;
  const stem = place.trunk * place.scale + crown * CROWN_LIFT;
  drawTrunk(ctx, place, crown, stem);
  if (crown > DETAIL) {
    drawBranches(ctx, place, crown, stem);
  }
  drawCrown(ctx, place, crown, stem);
}

/**
 * The trunk: wider at the roots than under the crown, and shaded down one side.
 *
 * @param ctx - the canvas to paint on
 * @param place - where the tree stands
 * @param crown - the crown's radius in pixels
 * @param trunk - the trunk's height in pixels
 */
function drawTrunk(
  ctx: CanvasRenderingContext2D,
  place: TreePlace,
  crown: number,
  trunk: number,
): void {
  const base = Math.max(1, crown * SHAPE.baseHalf);
  const tip = Math.max(THIN, crown * SHAPE.tipHalf);
  const foot = base * SHAPE.flare;
  const top = place.y - trunk;
  ctx.fillStyle = place.bark;
  ctx.beginPath();
  ctx.moveTo(place.x - foot, place.y);
  ctx.quadraticCurveTo(
    place.x - base,
    place.y - trunk * SHAPE.waist,
    place.x - tip,
    top,
  );
  ctx.lineTo(place.x + tip, top);
  ctx.quadraticCurveTo(
    place.x + base,
    place.y - trunk * SHAPE.waist,
    place.x + foot,
    place.y,
  );
  ctx.closePath();
  ctx.fill();
  // The side away from the light, so a trunk is round rather than a plank.
  ctx.fillStyle = blend(place.bark, DEEP, SHAPE.darkSide);
  ctx.beginPath();
  ctx.moveTo(place.x + foot * (1 - SHAPE.darkSide), place.y);
  ctx.lineTo(place.x + foot, place.y);
  ctx.quadraticCurveTo(
    place.x + base,
    place.y - trunk * SHAPE.waist,
    place.x + tip,
    top,
  );
  ctx.lineTo(place.x + tip * (1 - SHAPE.darkSide), top);
  ctx.closePath();
  ctx.fill();
}

/**
 * The two branches that break the trunk's outline.
 *
 * @param ctx - the canvas to paint on
 * @param place - where the tree stands
 * @param crown - the crown's radius in pixels
 * @param trunk - the trunk's height in pixels
 */
function drawBranches(
  ctx: CanvasRenderingContext2D,
  place: TreePlace,
  crown: number,
  trunk: number,
): void {
  ctx.strokeStyle = place.bark;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1, crown * SHAPE.tipHalf * 2);
  for (const branch of BRANCHES) {
    const from = place.y - trunk * branch.at;
    ctx.beginPath();
    ctx.moveTo(place.x, from);
    ctx.quadraticCurveTo(
      place.x + crown * branch.out * SHAPE.waist,
      from,
      place.x + crown * branch.out,
      from - crown * branch.rise,
    );
    ctx.stroke();
  }
}

/**
 * The crown, lobe by lobe, from the shaded ones to the lit ones.
 *
 * @param ctx - the canvas to paint on
 * @param place - where the tree stands
 * @param crown - the crown's radius in pixels
 * @param trunk - the trunk's height in pixels
 */
function drawCrown(
  ctx: CanvasRenderingContext2D,
  place: TreePlace,
  crown: number,
  trunk: number,
): void {
  const middle = place.y - trunk;
  const own = SHAPES[place.seed % SHAPES.length];
  for (const lobe of LOBES) {
    const body = lobe.shade === 0;
    // Turned and sized a little differently per tree, so that a row of them
    // does not read as one tree stamped out over and over - except for the
    // body, which every tree has the same because it is what a tree **is**.
    const away = body ? 0 : own.turn;
    const x = lobe.x * Math.cos(away) - lobe.y * Math.sin(away);
    const y = lobe.x * Math.sin(away) + lobe.y * Math.cos(away);
    const radius = crown * lobe.radius * (body ? 1 : own.size);
    if (!body && radius < DETAIL / 2) {
      continue;
    }
    ctx.fillStyle = toneOf(place.tone, lobe.shade);
    ctx.beginPath();
    ctx.arc(place.x + crown * x, middle - crown * y, radius, 0, FULL);
    ctx.fill();
  }
}

/**
 * A lobe's colour.
 *
 * @param tone - the crown's own colour
 * @param shade - below nought into the shadow, above it into the light
 * @returns the colour to paint that lobe in
 */
function toneOf(tone: string, shade: number): string {
  return shade < 0 ? blend(tone, DEEP, -shade) : blend(tone, SUN, shade);
}
