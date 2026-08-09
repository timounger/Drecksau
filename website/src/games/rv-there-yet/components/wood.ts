/**
 * The wood along the road in the second half of the drive.
 *
 * @module
 * @remarks
 * A treeline on the horizon says "somewhere out there is a forest". Trees
 * going past the window say "you are **in** one", and that is the difference
 * between a backdrop and a place. So the last four sections have conifers
 * standing along both verges, near enough to sweep past and far enough out to
 * leave the road, the markers and the notice boards clear.
 *
 * Where they stand is worked out from their number rather than remembered, so
 * the same stretch of road always has the same trees in it - a wood that
 * rearranged itself behind you would be worse than no wood.
 *
 * Both views ask this module where the trees are and hand it a foot and a
 * scale; what a conifer looks like is decided in one place for both.
 */
import { blend } from "@/games/rv-there-yet/components/palette";

/** One tree of the roadside wood. */
export type Conifer = {
  /** Where it stands along the route, in metres. */
  readonly at: number;
  /** Which verge: -1 on the left of the road, 1 on the right. */
  readonly side: number;
  /** How far out from the middle of the road, in metres. */
  readonly out: number;
  /** How tall it is, in metres. */
  readonly tall: number;
};

/** How the wood is laid out, in metres. */
const WOOD = {
  /** How far apart the trees of one row stand. */
  every: 7,
  /**
   * How far out each row stands.
   *
   * @remarks
   * Well clear of everything that has a job: the road is 6.4 m wide, the
   * markers stand at 5.5 m and the notice boards reach out to 12.5 m. The
   * first row begins beyond all of that, so no tree ever hides a sign.
   */
  rows: [{ out: 14.5 }, { out: 21.5 }],
  /** How far off its slot a tree may stand, so the rows are not a fence. */
  jitter: 2.4,
  /** The tallest a tree grows, and the shortest as a share of that. */
  tall: 9,
  low: 0.55,
} as const;

/** The shape of one conifer, in shares of its height. */
const SHAPE = {
  /** The trunk: how thick and how much of the tree is bare wood. */
  trunk: 0.055,
  bare: 0.16,
  /** How many tiers of branches, and how wide the lowest one is. */
  tiers: 3,
  wide: 0.34,
  /** How much narrower each tier is than the one below it. */
  taper: 0.72,
  /** How much of the tree each tier covers, top to bottom. */
  reach: 0.42,
} as const;

/** The lit side of the needles, the shaded side, and the trunk. */
const PAINT = {
  lit: "#3f6b46",
  deep: "#24422b",
  /** Darker than the bark of the broadleaf trees: this is a different tree. */
  bark: "#43301f",
} as const;

/** How hard the light from one side tells the two halves of a tree apart. */
const SHADE = 0.55;

/** How far apart the seeds of one slot lie, so its numbers never agree. */
const SEED_STEP = 7.3;

/** Which of a slot's numbers is which: where it stands, how far out, how tall. */
const SEED = { out: 4, tall: 8 } as const;

/** The middle of a slot, and of a wobble. */
const HALF = 0.5;

/** The waves the scatter is mixed from: nothing here ever repeats visibly. */
const WAVES = [
  { turn: 1.13, share: 0.5 },
  { turn: 0.37, share: 0.31 },
  { turn: 2.71, share: 0.19 },
] as const;

/**
 * A number between nought and one that belongs to this tree and no other.
 *
 * @param index - which slot
 * @param seed - which of a slot's several numbers is wanted
 * @returns the number
 * @remarks
 * Waves rather than a random generator, for the same reason the skyline uses
 * them: the drawing has to come out the same every time it is drawn, and the
 * periods share no common multiple, so no pattern is ever visible.
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
 * Every tree of the roadside wood between two points of the route.
 *
 * @param from - the nearer end, in metres
 * @param to - the further end, in metres
 * @returns the trees, in the order they stand
 */
export function conifersBetween(from: number, to: number): Conifer[] {
  const trees: Conifer[] = [];
  const first = Math.floor(from / WOOD.every) - 1;
  const last = Math.ceil(to / WOOD.every) + 1;
  for (let slot = first; slot <= last; slot++) {
    WOOD.rows.forEach((row, which) => {
      for (const side of [-1, 1]) {
        const seed = which * 2 + (side < 0 ? 0 : 1);
        const at = (slot + wobble(slot, seed) - HALF) * WOOD.every;
        if (at < from || at > to) {
          continue;
        }
        trees.push({
          at,
          side,
          out: row.out + (wobble(slot, seed + SEED.out) - HALF) * WOOD.jitter,
          tall:
            WOOD.tall *
            (WOOD.low + (1 - WOOD.low) * wobble(slot, seed + SEED.tall)),
        });
      }
    });
  }
  return trees;
}

/** How tall the tallest tree of the wood is, in metres. */
export const CONIFER_TALL = WOOD.tall;

/**
 * Draws one conifer.
 *
 * @param ctx - the canvas to paint on
 * @param place - where its foot is on the canvas, how big, and how tall
 * @remarks
 * Three tiers of branches over a bare bit of trunk, each tier a triangle
 * narrower than the one below it. Every tier is painted twice, the far half a
 * shade darker, which is what keeps a row of them from reading as a stack of
 * flat green arrowheads.
 */
export function drawConifer(
  ctx: CanvasRenderingContext2D,
  place: {
    readonly x: number;
    readonly y: number;
    readonly scale: number;
    readonly tall: number;
  },
): void {
  const high = place.tall * place.scale;
  const trunk = Math.max(1, high * SHAPE.trunk);
  ctx.fillStyle = PAINT.bark;
  ctx.fillRect(
    place.x - trunk / 2,
    place.y - high * SHAPE.bare,
    trunk,
    high * SHAPE.bare,
  );
  for (let tier = 0; tier < SHAPE.tiers; tier++) {
    const share = tier / SHAPE.tiers;
    const foot = place.y - high * (SHAPE.bare + (1 - SHAPE.bare) * share);
    const wide = high * SHAPE.wide * SHAPE.taper ** tier;
    const tip = foot - high * SHAPE.reach;
    for (const side of [-1, 1]) {
      ctx.fillStyle =
        side < 0 ? PAINT.lit : blend(PAINT.lit, PAINT.deep, SHADE);
      ctx.beginPath();
      ctx.moveTo(place.x, tip);
      ctx.lineTo(place.x + (side * wide) / 2, foot);
      ctx.lineTo(place.x, foot);
      ctx.closePath();
      ctx.fill();
    }
  }
}
