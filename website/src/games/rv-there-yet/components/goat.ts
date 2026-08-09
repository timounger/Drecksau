/**
 * The goats standing about on the first section.
 *
 * @module
 * @remarks
 * Mountain pasture, so there are goats on it: a dozen of them scattered along
 * the verges of the first section, in all sizes from kid to old billy. They do
 * nothing at all - no rule of the game touches them - and that is the point.
 * The first section is where somebody is learning which pedal is which, and a
 * road with something living beside it is a road somebody wants to drive down.
 *
 * Where they stand comes out of their number rather than being remembered, the
 * same way the wood does: the same stretch of road always has the same goats
 * on it, and a goat that wandered off between one glance and the next would be
 * a bug rather than a goat.
 *
 * Both views draw the same animal from the same side. A goat on a verge stands
 * across it, chewing, whichever direction you are looking from.
 */
import { blend } from "@/games/rv-there-yet/components/palette";

/** One goat of the herd. */
export type Goat = {
  /** Where it stands along the route, in metres. */
  readonly at: number;
  /** Which verge: -1 on the left of the road, 1 on the right. */
  readonly side: number;
  /** How far out from the middle of the road, in metres. */
  readonly out: number;
  /** How big it is, of a full-grown one. */
  readonly size: number;
  /** Which way it is facing: -1 back down the road, 1 on up it. */
  readonly facing: number;
  /** Which coat it wears, as an index into the ones there are. */
  readonly coat: number;
};

/** Where the herd is put out to graze, in metres. */
const HERD = {
  /** How far apart they stand, before the wandering. */
  every: 44,
  /** How far off that they may have wandered. */
  jitter: 16,
  /** How far out from the road they stand: near the verge, off the road. */
  out: 9,
  outJitter: 3.4,
  /** The smallest kid, as a share of a full-grown goat. */
  small: 0.5,
} as const;

/** How tall a full-grown goat stands, in metres. */
export const GOAT_TALL = 1.15;

/**
 * How far a goat keeps from a notice board, in metres.
 *
 * @remarks
 * The boards stand on the left verge and reach out to twelve and a half
 * metres, which is exactly where a goat would like to stand. A goat in front of
 * the one sign that says what the section is about is a goat too many.
 */
const CLEAR_OF_SIGNS = 14;

/** How far past its own mark a section's notice board stands, in metres. */
const BOARD_AFTER = 10;

/** The shape of a goat, in shares of how tall it stands. */
const SHAPE = {
  /** The barrel of it: how long, how deep, and how high off the ground. */
  long: 1.05,
  deep: 0.42,
  belly: 0.52,
  /** The legs: how thick, and where the two pairs stand along the body. */
  leg: 0.09,
  fore: 0.34,
  hind: -0.38,
  /** The neck and the head it carries. */
  neck: 0.22,
  neckUp: 0.3,
  skull: 0.19,
  muzzle: 0.16,
  /** The horns, swept back over the neck. */
  horn: 0.26,
  hornBack: 0.55,
  /** The beard under the chin, and the tail over the rump. */
  beard: 0.14,
  tail: 0.16,
  /** Where on the skull the muzzle, the eye and the horn roots sit. */
  muzzleOut: 0.9,
  muzzleDown: 0.3,
  muzzleFlat: 0.62,
  eyeOut: 0.3,
  eyeUp: 0.2,
  eye: 0.03,
  /** How thin a horn is drawn, of a leg. */
  hornThin: 0.7,
} as const;

/** The coats they come in, and the parts that are darker whatever the coat. */
const COATS = ["#e6e0d4", "#c9b8a0", "#8d7a63", "#5c4b3b"] as const;
const PAINT = {
  dark: "#3a2f26",
  horn: "#6f6455",
  eye: "#1d1712",
} as const;

/** How much darker the legs and the face are than the coat. */
const SHADE = 0.55;

/** The waves the scatter is mixed from, so no two goats agree. */
const WAVES = [
  { turn: 0.93, share: 0.5 },
  { turn: 2.41, share: 0.3 },
  { turn: 0.29, share: 0.2 },
] as const;

/** How far apart the seeds of one goat lie. */
const SEED_STEP = 5.7;

/** Which of a goat's numbers is which. */
const SEED = { out: 1, size: 2, side: 3, facing: 4, coat: 5 } as const;

/** The middle of a slot, and of a wobble. */
const HALF = 0.5;

/**
 * A number between nought and one that belongs to this goat and no other.
 *
 * @param index - which goat
 * @param seed - which of its several numbers is wanted
 * @returns the number
 */
function wobble(index: number, seed: number): number {
  const mixed = WAVES.reduce(
    (sum, wave) =>
      sum + Math.sin((index + seed * SEED_STEP) * wave.turn) * wave.share,
    0,
  );
  return (mixed + 1) / 2;
}

/**
 * The goats standing between two points of the route.
 *
 * @param from - the nearer end, in metres
 * @param to - the further end, in metres
 * @param sections - where the sections of this route begin, in metres
 * @returns the goats, in the order they stand
 * @remarks
 * Only ever on the **first** section: the herd belongs to the pasture at the
 * start of the drive, and asking about any other stretch of road gives none. A
 * route with fewer than two sections has no first section to speak of and so
 * no goats either.
 *
 * The sections come in rather than being read off the map, because that is
 * what makes this a drawing of the route it is handed and not of the one the
 * game happens to ship.
 */
export function goatsBetween(
  from: number,
  to: number,
  sections: readonly number[],
): Goat[] {
  if (sections.length < 2) {
    return [];
  }
  const pasture = { from: sections[0], to: sections[1] };
  const first = Math.floor(Math.max(from, pasture.from) / HERD.every) - 1;
  const last = Math.ceil(Math.min(to, pasture.to) / HERD.every) + 1;
  const herd: Goat[] = [];
  for (let index = first; index <= last; index++) {
    const at =
      (index + HALF) * HERD.every + (wobble(index, 0) - HALF) * HERD.jitter;
    if (at < from || at > to || at < pasture.from || at > pasture.to) {
      continue;
    }
    const side = wobble(index, SEED.side) < HALF ? -1 : 1;
    if (side < 0 && atASign(at, sections)) {
      continue;
    }
    herd.push({
      at,
      side,
      out: HERD.out + (wobble(index, SEED.out) - HALF) * HERD.outJitter,
      size: HERD.small + (1 - HERD.small) * wobble(index, SEED.size),
      facing: wobble(index, SEED.facing) < HALF ? -1 : 1,
      coat: Math.min(
        COATS.length - 1,
        Math.floor(wobble(index, SEED.coat) * COATS.length),
      ),
    });
  }
  return herd;
}

/**
 * Whether a spot on the left verge is where a notice board stands.
 *
 * @param at - the spot, in metres along the route
 * @param sections - where the sections begin, in metres
 * @returns true if a goat there would stand in front of a sign
 */
function atASign(at: number, sections: readonly number[]): boolean {
  return sections.some(
    (section) => Math.abs(at - (section + BOARD_AFTER)) < CLEAR_OF_SIGNS,
  );
}

/**
 * Draws one goat, side on.
 *
 * @param ctx - the canvas to paint on
 * @param place - where it stands, how big it comes out, and which way it faces
 * @remarks
 * Barrel, four legs, a neck carried low and a head with horns swept back and a
 * beard under it. The horns and the beard are what say goat rather than sheep
 * or dog at this size; without them it is a grey loaf on four sticks.
 */
export function drawGoat(
  ctx: CanvasRenderingContext2D,
  place: {
    readonly x: number;
    readonly y: number;
    readonly scale: number;
    readonly goat: Goat;
  },
): void {
  const tall = GOAT_TALL * place.goat.size * place.scale;
  const coat = COATS[place.goat.coat] ?? COATS[0];
  const dark = blend(coat, PAINT.dark, SHADE);
  ctx.save();
  ctx.translate(place.x, place.y);
  ctx.scale(place.goat.facing, 1);
  drawLegs(ctx, tall, dark);
  drawBody(ctx, tall, coat);
  drawHead(ctx, tall, coat, dark);
  ctx.restore();
}

/** The four legs, drawn before the body so they end under it. */
function drawLegs(
  ctx: CanvasRenderingContext2D,
  tall: number,
  dark: string,
): void {
  ctx.fillStyle = dark;
  const thick = Math.max(1, tall * SHAPE.leg);
  for (const along of [SHAPE.fore, SHAPE.hind]) {
    for (const step of [-1, 1]) {
      const at = tall * along + step * thick * HALF;
      ctx.fillRect(
        at - thick / 2,
        -tall * SHAPE.belly,
        thick,
        tall * SHAPE.belly,
      );
    }
  }
}

/** The barrel, with the tail over the rump. */
function drawBody(
  ctx: CanvasRenderingContext2D,
  tall: number,
  coat: string,
): void {
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.ellipse(
    0,
    -tall * (SHAPE.belly + SHAPE.deep / 2),
    (tall * SHAPE.long) / 2,
    (tall * SHAPE.deep) / 2,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-tall * SHAPE.long * HALF, -tall * (SHAPE.belly + SHAPE.deep));
  ctx.lineTo(
    -tall * (SHAPE.long * HALF + SHAPE.tail),
    -tall * (SHAPE.belly + SHAPE.deep + SHAPE.tail * HALF),
  );
  ctx.lineTo(-tall * SHAPE.long * HALF, -tall * (SHAPE.belly + SHAPE.deep / 2));
  ctx.closePath();
  ctx.fill();
}

/** The neck, the head on the end of it, the horns, the beard and an eye. */
function drawHead(
  ctx: CanvasRenderingContext2D,
  tall: number,
  coat: string,
  dark: string,
): void {
  const withers = {
    x: tall * SHAPE.long * HALF,
    y: -tall * (SHAPE.belly + SHAPE.deep),
  };
  const head = {
    x: withers.x + tall * SHAPE.neck,
    y: withers.y - tall * SHAPE.neckUp + tall * SHAPE.skull,
  };
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(withers.x - tall * SHAPE.neck, withers.y);
  ctx.lineTo(head.x, head.y - tall * SHAPE.skull);
  ctx.lineTo(head.x, head.y + tall * SHAPE.skull);
  ctx.lineTo(
    withers.x - tall * SHAPE.neck,
    withers.y + (tall * SHAPE.deep) / 2,
  );
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(head.x, head.y, tall * SHAPE.skull, 0, Math.PI * 2);
  ctx.fill();
  // The muzzle, held out in front of the skull.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(
    head.x + tall * SHAPE.skull * SHAPE.muzzleOut,
    head.y + tall * SHAPE.skull * SHAPE.muzzleDown,
    tall * SHAPE.muzzle,
    tall * SHAPE.muzzle * SHAPE.muzzleFlat,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  // The beard, and then the horns over the top of the head.
  ctx.beginPath();
  ctx.moveTo(head.x, head.y + tall * SHAPE.skull * HALF);
  ctx.lineTo(
    head.x + tall * SHAPE.beard * HALF,
    head.y + tall * SHAPE.beard * 2,
  );
  ctx.lineTo(head.x - tall * SHAPE.beard * HALF, head.y + tall * SHAPE.skull);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PAINT.horn;
  ctx.lineWidth = Math.max(1, tall * SHAPE.leg * SHAPE.hornThin);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(head.x - tall * SHAPE.skull * HALF, head.y - tall * SHAPE.skull);
  ctx.quadraticCurveTo(
    head.x - tall * SHAPE.horn * HALF,
    head.y - tall * (SHAPE.skull + SHAPE.horn),
    head.x - tall * SHAPE.horn * SHAPE.hornBack,
    head.y - tall * SHAPE.skull * HALF,
  );
  ctx.stroke();
  ctx.fillStyle = PAINT.eye;
  ctx.beginPath();
  ctx.arc(
    head.x + tall * SHAPE.skull * SHAPE.eyeOut,
    head.y - tall * SHAPE.skull * SHAPE.eyeUp,
    Math.max(HALF, tall * SHAPE.eye),
    0,
    Math.PI * 2,
  );
  ctx.fill();
}
