/**
 * The vehicles, drawn properly - and drawn once.
 *
 * @module
 * @remarks
 * The same bargain as the people in ./figure-art: shapes with outlines instead
 * of coloured rectangles, painted once into an offscreen canvas and from then
 * on stamped. A car is worth thirty paths - wheel arches, a windscreen, a
 * bonnet seam, lights at both ends - and thirty paths per car per frame with
 * sixty cars on screen would not hold sixty frames a second. Once per body and
 * colour will.
 *
 * Two sorts of picture come out of here. The roof, drawn from above, facing
 * east, centred on the middle of the vehicle - the same orientation the engine
 * keeps its angles in, so the renderer only has to turn it and put it down.
 * And the walls, drawn straight from the side with the road along the bottom
 * edge, which is what stops a car from being a box with a photograph on the
 * lid: from the side you want wheels, doors, bumpers and a windscreen that
 * leans. Both are in city pixels.
 */
import {
  VEHICLES,
  twoWheeled,
  type VehicleBody,
} from "@/games/gta/engine/vehicles";
import type { Vec } from "@/games/gta/engine/types";

/** How many pixels of sprite stand for one city pixel. */
const GRAIN = 6;

/**
 * How much room around the body the picture needs, in city pixels.
 *
 * @remarks
 * Wheels stand out past the flanks, mirrors past the doors, a gun barrel past
 * the nose. The sprite is that much bigger than the vehicle it draws, and the
 * renderer has to know by how much or everything would come out squashed.
 */
export const VEHICLE_MARGIN = 10;

/** Which wall of a vehicle a picture shows. */
export type VehicleFace = "flank" | "nose" | "tail";

/**
 * How a vehicle stacks up, in city pixels.
 *
 * @remarks
 * A car is not a box, and drawing it as one is what made the old vehicles look
 * like crates with a photograph on the lid. It is two: a low body that runs the
 * whole length and carries the wheels, and a shorter, narrower cabin standing
 * on it. Two boxes is all it takes - from the side you get a bonnet, a
 * windscreen that leans, a roof and a boot, which is the whole silhouette of a
 * car.
 *
 * The same two boxes serve the others. On a bike the lower one is the machine
 * and the upper one is the rider; on the tank, the hull and the turret.
 */
export type VehicleTiers = {
  /** How high the whole thing stands. */
  readonly tall: number;
  /** How high the lower body goes - where the windows begin. */
  readonly belt: number;
  /** Where the cabin starts, measured from the middle towards the back. */
  readonly cabinBack: number;
  /** And where it ends, towards the nose. */
  readonly cabinFront: number;
  /** How wide the cabin is. */
  readonly cabinWide: number;
  /**
   * How far the windscreen leans back, in city pixels.
   *
   * @remarks
   * A cabin drawn as a plain box has a windscreen standing straight up, which
   * no car has had since about 1935. This is how far the top of the screen
   * sits behind its bottom - and because the roof has to end where the screen
   * ends rather than where the cabin's floor does, the picture of the roof is
   * pulled back by the same amount. The back window leans too, about half as
   * far.
   *
   * Nought for the bodies that draw their own sides: the DMC-12 is a wedge,
   * the tank has no windscreen, the tractor's cab is a glass box on purpose.
   */
  readonly rake: number;
  /**
   * How far the roof draws in at the **tail**, in city pixels.
   *
   * @remarks
   * The same idea as {@link VehicleTiers.rake} at the other end, and left out
   * everywhere but the Cybertruck. A saloon's back window leans too, but it is
   * drawn leaning on the side panels and the roof is left alone - trimming the
   * roof there as well leaves a notch at the rear corner where the wall's top
   * edge and the roof no longer meet.
   *
   * The Cybertruck is the one body that needs it, because on that one the back
   * is not a window in a roof, it **is** the roof: one straight line from the
   * top of the screen down to the tailgate, and no boot lid at the bottom of
   * it. Its own flank picture draws the same slope, so the two agree and there
   * is no notch to leave.
   */
  readonly rakeBack?: number;
};

/**
 * How every body is stacked.
 *
 * @remarks
 * The cabin has to stand exactly where the view from above draws the roof. Any
 * less and a piece of roof is left lying flat on the bonnet with a step up to
 * the rest of it, which is the one thing that looks worse than a plain box.
 */
const CORSA_BOX: VehicleTiers = {
  tall: 12.4,
  belt: 8.8,
  cabinBack: -19,
  cabinFront: 10.4,
  cabinWide: 14.4,
  rake: 11.4,
};

const TIERS: Readonly<Record<VehicleBody, VehicleTiers>> = {
  /**
   * The estate the police drive, from the photograph and the data sheet.
   *
   * @remarks
   * **Measured, not guessed.** There is no 3D model of this car to be had, but
   * there is something nearly as good: the works rescue sheet
   * (`rk.mb-qr.com/de/214.250`) carries a true side elevation and plan view of
   * the exact car, drawn to scale. Every number below is read off it, with the
   * wheelbase as the ruler - 2961 millimetres came out at 595,5 pixels of
   * drawing, and the height that scale then predicts is 1487 against the
   * 1469 on the data sheet, which is how one knows the drawing is square.
   *
   * What it settled:
   *
   * - **The bonnet is long.** The windscreen meets it 999 millimetres ahead of
   *   the middle of the car - ten pixels - where a Golf's cabin starts eleven
   *   pixels ahead of a middle that is three pixels further forward to begin
   *   with. In bonnet that is fourteen pixels against eleven.
   * - **The roof runs to the tail.** `cabinBack` sits two pixels from the back
   *   of the car, and there is no sloping hatch under it.
   * - **The tailgate stands up.** See `BACK_RAKE_OF`: the roof ends 2,6 pixels
   *   ahead of the foot of the tailgate against a windscreen that lies back
   *   11,7 - a ratio of 0,22 where a hatchback's is 0,55. That one angle is
   *   most of the difference between the two silhouettes from the side.
   * - **It is no taller than a Golf.** 1487 millimetres against 1491, which
   *   was worth checking: an E-Klasse looks big because it is six pixels
   *   longer, not because it stands high.
   */
  patrol: {
    tall: 12.5,
    belt: 8.6,
    cabinBack: -23.4,
    cabinFront: 10.3,
    cabinWide: 14.9,
    rake: 11.7,
  },
  /*
   * Measured off the works 3D model rather than guessed off a photograph:
   * every number here is the mesh scaled so the car is 44 pixels long. See
   * the README - the wheelbase came out at 26.4 against 26.9 from the data
   * sheet, which is how one knows the reading is sound.
   *
   * The two that were most wrong before: the screen lies back **twelve**
   * pixels, not five - a modern windscreen is a quarter of the whole plan
   * view - and the cabin is far narrower than the body, 14.6 against 18.4.
   */
  car: {
    tall: 12.6,
    belt: 8.9,
    cabinBack: -20,
    cabinFront: 11,
    cabinWide: 14.6,
    rake: 12,
  },
  // The Corsa, which is the Golf's box with a foot taken out of its length and
  // a couple of millimetres off its width. 1,433 m tall against 1,491, which
  // at 8,6 pixels to the metre is 12,4 against 12,6 - one does not see that,
  // and one is not meant to: what one sees is the length.
  corsa: CORSA_BOX,
  corsaelegance: CORSA_BOX,
  corsaultimate: CORSA_BOX,
  // A wedge. The cabin sits in the middle of the wheelbase with a bonnet in
  // front of it and an open bed behind, and the screen lies a long way back -
  // the roofline of this thing is one straight line up and another straight
  // line down, which is the whole of what it looks like.
  suv: {
    // 1,79 m tall. Heights draw at 8,6 pixels to the metre in this city - a
    // Golf is 1,46 m and 12,6 - so it stands 15,4, which is three pixels over
    // a saloon rather than the five it used to have.
    tall: 15.4,
    belt: 8.7,
    // **The cabin runs to the tail.** This thing has no boot and no bed behind
    // a cab: with the cover shut it is one shape from the nose to the back
    // bumper, and the roofline is one straight line up and another straight
    // line down. The second of those is `rakeBack`: the roof stops fifteen
    // pixels short of the tail and the wall under it leans out to meet the
    // tailgate.
    // **The cabin is the whole vehicle.** This one has no bonnet lying flat
    // with a windscreen standing on the end of it: from the front bumper there
    // is one straight line up to the roof and one straight line down to the
    // tailgate, and the bonnet is simply the bottom half of the first of them.
    // So the cabin runs the full length and both ends are enormous rakes - 27
    // pixels of run at the front, 21 at the back - which leaves ten pixels of
    // flat roof between them and no kink anywhere on the silhouette.
    cabinBack: -29,
    cabinFront: 29,
    cabinWide: 19,
    rake: 27,
    rakeBack: 21,
  },
  // The same car as the patrol, because it is the same car.
  taxi: {
    tall: 12.5,
    belt: 8.6,
    cabinBack: -23.4,
    cabinFront: 10.3,
    cabinWide: 14.9,
    rake: 11.7,
  },
  // Low, and low again: the roof of this one is about chest height, which is
  // the whole reason a DMC-12 looks like nothing else in the street. The cabin
  // is barely three pixels of glass on top of five of body.
  dmc: {
    tall: 8.6,
    belt: 5.4,
    cabinBack: -10,
    cabinFront: 6,
    cabinWide: 22,
    rake: 0,
  },
  bike: {
    tall: 16,
    belt: 9,
    cabinBack: -6,
    cabinFront: 4,
    cabinWide: 11,
    rake: 0,
  },
  // Taller than a naked bike and wider at the back: the screen stands up in
  // front of the rider and the panniers stand out behind him.
  patrolbike: {
    tall: 16,
    belt: 9,
    cabinBack: -6,
    cabinFront: 4,
    cabinWide: 11,
    rake: 0,
  },
  cycle: {
    tall: 14,
    belt: 8,
    cabinBack: -4.5,
    cabinFront: 3,
    // As wide as the bicycle, which is as wide as the man on it. Twelve put
    // his shoulders outside the outline, and what falls outside the outline
    // the ring stamps flat on the road.
    cabinWide: 9,
    rake: 0,
  },
  tank: {
    tall: 19,
    belt: 12,
    cabinBack: -14,
    cabinFront: 10,
    cabinWide: 34,
    rake: 0,
  },
  // Tall and narrow: a tractor is mostly cab, and the cab sits over the back
  // axle rather than in the middle.
  tractor: {
    rake: 0,
    tall: 26,
    belt: 13,
    cabinBack: -19,
    cabinFront: -2,
    cabinWide: 20,
  },
};

/**
 * How many city pixels across the turret picture stands for.
 *
 * @remarks
 * Long enough for the barrel, which sticks a good way out past the hull - and
 * square, because the thing turns.
 */
export const TURRET_SIZE = 76;

/** Every vehicle sprite built so far, by what it shows. */
const drawn = new Map<string, HTMLCanvasElement>();

/**
 * The picture of one vehicle, seen from above.
 *
 * @param body - which sort of vehicle
 * @param paint - the colour of its bodywork
 * @param police - whether it wears the black and white
 * @returns the sprite, or null where no canvas can be made
 */
export function vehicleSprite(
  body: VehicleBody,
  paint: string,
  police: boolean,
  mine: boolean,
): HTMLCanvasElement | null {
  // Only a two-wheeler shows who is on it - everything else has a roof over
  // the driver - so only a two-wheeler is cached twice over.
  const own = twoWheeled(body) && mine;
  const key = `${body}|${paint}|${police ? "p" : "-"}|${own ? "me" : "-"}`;
  const had = drawn.get(key);
  if (had !== undefined) {
    return had;
  }
  const shape = VEHICLES[body];
  const wide = (shape.length + VEHICLE_MARGIN) * GRAIN;
  const high = (shape.width + VEHICLE_MARGIN) * GRAIN;
  const sheet = document.createElement("canvas");
  sheet.width = Math.round(wide);
  sheet.height = Math.round(high);
  const ctx = sheet.getContext("2d");
  if (ctx === null) {
    return null;
  }
  ctx.translate(sheet.width / 2, sheet.height / 2);
  ctx.scale(GRAIN, GRAIN);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  paintVehicle(ctx, body, paint, police, own);
  drawn.set(key, sheet);
  return sheet;
}

/**
 * The tank's turret, seen from above, pointing east.
 *
 * @returns the sprite, or null where no canvas can be made
 * @remarks
 * Separate from the hull for one reason: it turns on its own. Everything else
 * in this city points where it is going, so a single picture per vehicle was
 * enough; a turret is the one part that does not.
 */
export function turretSprite(): HTMLCanvasElement | null {
  const key = "turret";
  let sheet = drawn.get(key) ?? null;
  if (sheet === null) {
    sheet = document.createElement("canvas");
    sheet.width = TURRET_SIZE * GRAIN;
    sheet.height = TURRET_SIZE * GRAIN;
    const ctx = sheet.getContext("2d");
    if (ctx === null) {
      sheet = null;
    } else {
      ctx.translate(sheet.width / 2, sheet.height / 2);
      ctx.scale(GRAIN, GRAIN);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      paintTurret(ctx);
      drawn.set(key, sheet);
    }
  }
  return sheet;
}

/**
 * The outline of a body seen from above, nose to the east, in city pixels.
 *
 * @param body - which sort of vehicle
 * @returns its four corners: tail left, nose left, nose right, tail right
 * @remarks
 * **One silhouette, used twice.** The picture of the roof is filled with it,
 * and the walls of the box are raised from it - so the top edge of a wall and
 * the edge of the roof above it are the same line by construction.
 *
 * They used not to be. The walls stood on a plain rectangle while the roof
 * tapered towards the nose, which left a wedge of daylight between the two -
 * and since only the walls facing the camera are drawn, which side the daylight
 * showed on changed with the angle. That is exactly what "the parts do not fit
 * together" looks like.
 *
 * Four corners and no more, because the wall pictures are dealt out per edge:
 * flank, nose, flank, tail. A rounder outline would want a picture per corner,
 * which is how one ends up with a model and a texture atlas - the point at
 * which this stops being a canvas and starts being an engine.
 */
export function bodyOutline(body: VehicleBody): readonly Vec[] {
  const shape = VEHICLES[body];
  const long = shape.length / 2;
  const wide = shape.width / 2;
  const cut = NARROWS[body] ?? { nose: 1, tail: 1 };
  const round = ROUNDS[body];
  return round === undefined
    ? [
        { x: -long, y: -wide * cut.tail },
        { x: long, y: -wide * cut.nose },
        { x: long, y: wide * cut.nose },
        { x: -long, y: wide * cut.tail },
      ]
    : cornered(long, wide * cut.nose, wide * cut.tail, round);
}

/**
 * The same box with its four corners taken off.
 *
 * @param long - half the length, in city pixels
 * @param nose - half the width at the nose
 * @param tail - half the width at the tail
 * @param round - how deep the corners are cut, along and across
 * @returns twelve corners: three at each corner of the box
 * @remarks
 * **A car is not a brick.** Four corners give four walls and four right angles,
 * and from above that is a shoebox however carefully the flanks are painted.
 * Three points at each corner - in, round, out - give a bevel that reads as a
 * radius at this size, and cost eight more walls a vehicle.
 *
 * Each of those extra walls is a sliver a pixel or two wide, which is why they
 * are painted flat rather than given a picture of their own: a whole flank
 * squeezed into two pixels is a smear, and a corner of a car is a highlight,
 * not a detail.
 */
function cornered(
  long: number,
  nose: number,
  tail: number,
  round: { readonly along: number; readonly across: number },
): readonly Vec[] {
  const box: readonly Vec[] = [
    { x: -long, y: -tail },
    { x: long, y: -nose },
    { x: long, y: nose },
    { x: -long, y: tail },
  ];
  const points: Vec[] = [];
  box.forEach((corner, at) => {
    const before = box[(at + box.length - 1) % box.length] ?? corner;
    const after = box[(at + 1) % box.length] ?? corner;
    // Back down the edge one came in on, and out along the one one leaves by.
    const from = stepTo(corner, before, round);
    const to = stepTo(corner, after, round);
    // And a point pulled towards the corner between them, which is what turns
    // a flat chamfer into something that reads as a radius.
    points.push(from);
    points.push({
      x: (from.x + to.x) / 2 + (corner.x - (from.x + to.x) / 2) * CORNER_EASE,
      y: (from.y + to.y) / 2 + (corner.y - (from.y + to.y) / 2) * CORNER_EASE,
    });
    points.push(to);
  });
  return points;
}

/** One step from a corner towards its neighbour, by however much that way cuts. */
function stepTo(
  corner: Vec,
  towards: Vec,
  round: { readonly along: number; readonly across: number },
): Vec {
  const runX = towards.x - corner.x;
  const runY = towards.y - corner.y;
  const length = Math.hypot(runX, runY) || 1;
  const cut = Math.abs(runX) > Math.abs(runY) ? round.along : round.across;
  const step = Math.min(cut, length / 2);
  return {
    x: corner.x + (runX / length) * step,
    y: corner.y + (runY / length) * step,
  };
}

/** How far the middle point of a bevel is pulled back towards its corner. */
const CORNER_EASE = 0.5;

/**
 * Whether this body is drawn by the Golf's walls.
 *
 * @param body - the sort of vehicle
 * @returns true for the Golf, the patrol car, the taxi and the three Corsas
 * @remarks
 * They are one shell with different numbers in it, and what matters here is
 * that all of them carry their lamps on their **walls** - so none of them
 * wants a second set painted into the picture from above.
 */
function onGolfWalls(body: VehicleBody): boolean {
  return (
    body === "car" || body === "patrol" || body === "taxi" || isCorsa(body)
  );
}

/**
 * Whether this body is one of the three Opel Corsas.
 *
 * @param body - the sort of vehicle
 * @returns true for the Corsa, the Elegance and the Ultimate
 * @remarks
 * They are three rows in the table because they have three different engines,
 * and one car everywhere else: same shell, same box, same walls.
 */
export function isCorsa(body: VehicleBody): boolean {
  return (
    body === "corsa" || body === "corsaelegance" || body === "corsaultimate"
  );
}

/**
 * Whether this body wears a black roof whatever colour the rest of it is.
 *
 * @param body - the sort of vehicle
 * @returns true for the Elegance and the Ultimate
 * @remarks
 * A contrast roof is the one thing on a small hatchback one can see from a
 * hundred metres, which is exactly why it is sold: the roof, the pillars and
 * the mirrors go black and the paint below them stays whatever was ordered.
 */
function blackTop(body: VehicleBody): boolean {
  return body === "corsaelegance" || body === "corsaultimate";
}

/** What a black roof is painted, which is not quite black. */
const CORSA_LID = "#18181b";

/**
 * The maker's mark in the grille, between the two headlamps.
 *
 * @param ctx - what to paint on, the road along the bottom
 * @param x - where across the face it goes
 * @param y - and how far up it
 * @param size - the radius of the ring, in city pixels
 * @param dark - whether it is the black one
 * @remarks
 * A ring with a flash of lightning lying across it. At this size the flash is
 * three short strokes - out, down, out - which comes to a **Z**, and a Z in a
 * ring on the nose of a small hatchback is read as exactly what it is. The
 * ring itself is black on the Ultimate, which is how that car is sold, and
 * chrome on the other two; the flash is drawn in whichever of the two the ring
 * is not, so it shows either way round.
 */
function opelBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  dark: boolean,
): void {
  const ring = dark ? BADGE_DARK : BADGE_CHROME;
  const bolt = dark ? BADGE_CHROME : BADGE_DARK;
  const disc = new Path2D();
  disc.ellipse(x, y, size, size, 0, 0, Math.PI * 2);
  ctx.fillStyle = ring;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * BADGE_EDGE;
  ctx.fill(disc);
  ctx.stroke(disc);
  ctx.strokeStyle = bolt;
  ctx.lineWidth = size * BADGE_PEN;
  ctx.lineJoin = "miter";
  ctx.beginPath();
  ctx.moveTo(x - size * BOLT_OUT, y + size * BOLT_STEP);
  ctx.lineTo(x - size * BOLT_IN, y + size * BOLT_STEP);
  ctx.lineTo(x + size * BOLT_IN, y - size * BOLT_STEP);
  ctx.lineTo(x + size * BOLT_OUT, y - size * BOLT_STEP);
  ctx.stroke();
  ctx.lineJoin = "round";
  ctx.strokeStyle = INK;
}

/** How fine the line round the ring is, as a share of the pen. */
const BADGE_EDGE = 0.4;

/** How thick the flash is, as a share of the ring. */
const BADGE_PEN = 0.34;

/** How far out the two ends of the flash reach, the same way. */
const BOLT_OUT = 0.72;

/** Where the step in the middle of it starts. */
const BOLT_IN = 0.12;

/** And how far up and down that step goes. */
const BOLT_STEP = 0.26;

/** The black badge of the Ultimate. */
const BADGE_DARK = "#0f172a";

/** And the chrome one every other Corsa wears. */
const BADGE_CHROME = "#cbd5e1";

/** How deeply each body has its corners taken off, in city pixels.
 *
 * @remarks
 * Only the ones that are meant to look rounded. A tank has corners; so, for
 * the look of the thing, does a tractor.
 *
 * **And so does a motorbike**, which used to have them and is better without.
 * A chamfer is a sliver of wall a pixel or two wide, and it takes its slice of
 * whichever picture it faces more nearly - which at the corners of a bike is
 * the front or back of the **flank**, and the front of a bike's flank is all
 * tyre. Coming at you, that put a black stripe on edge either side of the
 * machine: two more wheels, standing where a motorbike has no bodywork at all.
 * Its plan view is a drawn wedge rather than a cut one anyway, so the corners
 * of the box were rounding nothing anybody could see.
 */
const ROUNDS: Readonly<
  Partial<
    Record<VehicleBody, { readonly along: number; readonly across: number }>
  >
> = {
  car: { along: 4.6, across: 3.5 },
  patrol: { along: 5, across: 3 },
  taxi: { along: 5, across: 3 },
  corsa: { along: 4.4, across: 3.4 },
  corsaelegance: { along: 4.4, across: 3.4 },
  corsaultimate: { along: 4.4, across: 3.4 },
};

/**
 * The outline of a cabin, the same way.
 *
 * @param body - which sort of vehicle
 * @returns its four corners in the same order
 */
export function cabinOutline(body: VehicleBody): readonly Vec[] {
  const tiers = TIERS[body];
  const half = tiers.cabinWide / 2;
  const cut = CABIN_NARROWS[body] ?? 1;
  const round = CABIN_ROUNDS[body];
  const long = (tiers.cabinFront - tiers.cabinBack) / 2;
  const middle = (tiers.cabinFront + tiers.cabinBack) / 2;
  return round === undefined
    ? [
        { x: tiers.cabinBack, y: -half },
        { x: tiers.cabinFront, y: -half * cut },
        { x: tiers.cabinFront, y: half * cut },
        { x: tiers.cabinBack, y: half },
      ]
    : cornered(long, half * cut, half, round).map((point) => ({
        x: point.x + middle,
        y: point.y,
      }));
}

/** And the same for the cabins that are meant to look rounded. */
const CABIN_ROUNDS: Readonly<
  Partial<
    Record<VehicleBody, { readonly along: number; readonly across: number }>
  >
> = {
  car: { along: 3, across: 2.2 },
  patrol: { along: 3.2, across: 2.2 },
  corsa: { along: 2.9, across: 2.2 },
  corsaelegance: { along: 2.9, across: 2.2 },
  corsaultimate: { along: 2.9, across: 2.2 },
};

/**
 * How much narrower each end of a body is than its widest point.
 *
 * @remarks
 * A saloon noses in, an off-roader hardly does, a DMC-12 is a wedge. Anything
 * not listed is square from end to end - a tank, a tractor, two wheels.
 */
const NARROWS: Readonly<
  Partial<Record<VehicleBody, { readonly nose: number; readonly tail: number }>>
> = {
  // Square to the widest point: the way both ends draw in is the bevel below,
  // not a taper along the whole length.
  car: { nose: 1, tail: 1 },
  patrol: { nose: 1, tail: 1 },
  // **Square, and the point is drawn on.** A wedge-shaped outline was the
  // obvious way to give the bike a pointed nose, and it was the wrong one:
  // the silhouette is what clips the picture from above, so a nose an inch
  // wide left the screen, the mirrors and the blue lamps outside it - and
  // whatever falls outside is stamped flat on the road by the ring. The nose
  // is pointed in the drawing instead, where it costs nothing.
  patrolbike: { nose: 1, tail: 1 },
  taxi: { nose: 1, tail: 1 },
  // Seen from above this one is a hexagon: the nose draws in hard, the tail a
  // little, and the widest point is over the wheels.
  suv: { nose: 0.8, tail: 0.88 },
  dmc: { nose: 0.84, tail: 1 },
  // A tractor is the exception that proves it: a narrow bonnet between two
  // big wheels, widening into the cab. The wheels stand outside the body and
  // are drawn on the road, which is where a tractor's wheels are.
  tractor: { nose: 0.4, tail: 0.66 },
};

/** And how much the roof narrows towards the windscreen. */
const CABIN_NARROWS: Readonly<Partial<Record<VehicleBody, number>>> = {
  car: 0.87,
  corsa: 0.86,
  corsaelegance: 0.86,
  corsaultimate: 0.86,
  // An estate's roof runs nearly parallel: it is a box with a windscreen on
  // the front, which is the whole point of buying one.
  patrol: 0.94,
  taxi: 0.94,
  suv: 0.82,
};

/**
 * How high a vehicle stands, and where its cabin sits on it.
 *
 * @param body - which sort of vehicle
 * @returns the two boxes it is drawn as
 */
export function tiersOf(body: VehicleBody): VehicleTiers {
  return TIERS[body];
}

/**
 * The picture of one wall of a vehicle, seen straight from the side.
 *
 * @param body - which sort of vehicle
 * @param paint - the colour of its bodywork
 * @param police - whether it wears the black and white
 * @param face - which wall: a flank, the nose or the tail
 * @param upper - true for the cabin, false for the body under it
 * @returns the sprite, or null where no canvas can be made
 * @remarks
 * Drawn with the ground at the bottom edge and the nose to the right, in city
 * pixels, so that the renderer can lay it straight onto the side of the box
 * without knowing anything about what is on it.
 */
export function vehicleWall(
  body: VehicleBody,
  paint: string,
  police: boolean,
  face: VehicleFace,
  upper: boolean,
  spin: number,
  held: boolean,
  mirror: boolean,
  mine: boolean,
): HTMLCanvasElement | null {
  // Only a flank has wheels on it, so only a flank gets a picture per spin -
  // otherwise every nose and every windscreen in the city would be cached
  // seven times over for a wheel that is not in them. The same goes for the
  // mirrored copy: nothing on a nose is written down, so nothing on a nose
  // needs a second picture to read it the right way round.
  const wheels = face === "flank" && !upper;
  const turn = wheels ? spin : 0;
  const stuck = wheels && held;
  // A second picture per flank for the bodies that have something written on
  // them, which is the patrol car and the taxi. Nothing else needs one.
  const other = wheels && (police || body === "taxi") && mirror;
  const own = twoWheeled(body) && mine;
  const key = `${body}|${paint}|${police ? "p" : "-"}|${face}|${upper ? "u" : "l"}|${turn}|${stuck ? "h" : "-"}|${other ? "m" : "-"}|${own ? "me" : "-"}`;
  let sheet = drawn.get(key) ?? null;
  if (sheet === null) {
    sheet = buildWall(
      body,
      paint,
      police,
      face,
      upper,
      turn,
      stuck,
      other,
      own,
    );
    if (sheet !== null) {
      drawn.set(key, sheet);
    }
  }
  return sheet;
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- from here on the
   numbers are the drawing: where a wheel arch sits, how far a mirror stands
   out. They are shapes, not arithmetic. */

/** The outline every part gets. */
const INK = "#0f172a";

/** How thick that outline is, in city pixels. */
const PEN = 0.7;

/** Glass, for windscreens and windows. */
const GLASS = "#1e293b";

/**
 * What a patrol vehicle is painted under its stripes.
 *
 * @remarks
 * **Silver, not white.** A German patrol car is a silver car with a blue and
 * fluorescent band along it - the white-with-black-doors one is American, and
 * it is the one thing about a police car that says at a glance which country
 * one is in. See `game_instructions/GTA/Fahrzeuge/Polizei`.
 */
export const POLICE_PAINT = "#b6bcc2";

/** The fluorescent yellow of the band down its side. */
const POLICE_GLOW = "#d9e021";

/**
 * Where that band sits, as shares of the bodyside.
 *
 * @remarks
 * **Shared between the flank and the ends on purpose.** The corners of a car
 * are chamfered off, and each chamfer is drawn from whichever picture faces
 * its way - so if the nose carries its stripes at one height and the flank at
 * another, the two do not meet and what one sees at every corner is a bare
 * grey sliver of paint with the livery stopping dead on both sides of it. Both
 * pictures now measure from the same four numbers, and the bands run round the
 * car in one piece.
 */
const POLICE_BAND = {
  /** The top of the lower fluorescent stripe, and the foot of the blue. */
  low: 0.34,
  /** The top of the blue, and the foot of the upper stripe, which runs to the
   * shoulder line above it. */
  top: 0.86,
};

/** How tall the word on the door is, as a share of the bodyside. */
const POLICE_WORD = 0.34;

/** And the blue under it, which is also what the roof bar burns. */
const POLICE_BLUE = "#0a45a8";

/** What a headlight is made of. */
const LAMP = "#fef3c7";

/** And a tail light. */
const TAIL = "#dc2626";

/** Which routine draws which body. */
function paintVehicle(
  ctx: CanvasRenderingContext2D,
  body: VehicleBody,
  paint: string,
  police: boolean,
  mine: boolean,
): void {
  if (body === "patrolbike" || body === "bike") {
    paintPatrolBike(ctx, paint, police, mine);
  } else if (body === "cycle") {
    paintTwoWheeler(ctx, body, paint, police, mine);
  } else if (body === "tank") {
    paintTank(ctx);
  } else if (body === "dmc") {
    paintDelorean(ctx);
  } else if (body === "suv") {
    paintCyber(ctx, paint);
  } else if (body === "tractor") {
    paintTractor(ctx, paint);
  } else {
    paintCar(ctx, body, paint, police);
  }
}

/**
 * The patrol bike from above: a BMW R 1300 RT.
 *
 * @param ctx - what to paint on, the nose to the east
 * @remarks
 * **Narrow at the front, wide at the back**, and that is the whole silhouette.
 * A naked bike is a stripe from up here; a tourer has a screen and a fairing
 * in front of the rider and a pannier standing out on each side behind him, so
 * from above it is a long wedge with a crossbar at the tail. Nothing else at
 * this size tells the two apart.
 *
 * Painted like the car it works with - silver under, blue over, fluorescent
 * along the edges - because a force does not run two liveries.
 */
function paintPatrolBike(
  ctx: CanvasRenderingContext2D,
  paint: string,
  police: boolean,
  mine: boolean,
): void {
  const shape = VEHICLES.patrolbike;
  const long = shape.length / 2;
  const wide = shape.width / 2;
  const skin = police ? POLICE_PAINT : paint;
  const panel = police ? POLICE_BLUE : shade(paint);

  // The two wheels, in line down the middle and both narrower than the bike.
  ctx.fillStyle = "#1c1917";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  for (const at of [long - 3, -long + 6]) {
    const wheel = new Path2D();
    wheel.roundRect(at - 3, -1.3, 6, 2.6, 0.6);
    ctx.fill(wheel);
    ctx.stroke(wheel);
  }

  // **A wedge, and a narrow one.** From above this machine is a triangle: a
  // point at the nose, the bars about three pixels across, and everything wide
  // at the back where the panniers are. It used to be as broad at the front as
  // at the back, which is the plan view of a small van.
  ctx.lineWidth = PEN;
  const nose = new Path2D();
  nose.moveTo(long - 0.4, 0);
  nose.quadraticCurveTo(long - 3.5, -2, long - 7, -2.6);
  nose.lineTo(long - 12, -2.8);
  nose.lineTo(long - 12, 2.8);
  nose.quadraticCurveTo(long - 3.5, 2, long - 0.4, 0);
  nose.closePath();
  ctx.fillStyle = panel;
  ctx.fill(nose);
  ctx.stroke(nose);
  if (police) {
    ctx.fillStyle = POLICE_GLOW;
    for (const side of [-1, 1]) {
      ctx.fillRect(long - 11, side * 2.1 - 0.4, 7, 0.8);
    }
  }

  // The tank and the seat behind it, which is where the rider sits.
  const spine = new Path2D();
  spine.roundRect(-long + 7, -2.4, long * 2 - 19, 4.8, 0.8);
  ctx.fillStyle = skin;
  ctx.fill(spine);
  ctx.stroke(spine);

  // A pannier each side, standing clear of the bike, and the top box between.
  ctx.lineWidth = PEN * 0.8;
  for (const side of [-1, 1]) {
    const box = new Path2D();
    box.roundRect(-long + 3, side === 1 ? 2.1 : -wide, 8.5, wide - 2.1, 0.6);
    ctx.fillStyle = skin;
    ctx.fill(box);
    ctx.stroke(box);
    if (police) {
      ctx.fillStyle = POLICE_GLOW;
      ctx.fillRect(-long + 4, side * (wide - 0.9) - 0.45, 6.5, 0.9);
      ctx.fillStyle = POLICE_BLUE;
      ctx.fillRect(-long + 4, side * 2.9 - 0.45, 6.5, 0.9);
    }
  }
  const trunk = new Path2D();
  trunk.roundRect(-long + 4, -1.9, 6.5, 3.8, 0.6);
  ctx.fillStyle = panel;
  ctx.fill(trunk);
  ctx.stroke(trunk);

  // The screen over the bars.
  ctx.fillStyle = "#cbd5e1";
  ctx.lineWidth = PEN * 0.6;
  const screen = new Path2D();
  screen.roundRect(long - 10.4, -2.5, 2.2, 5, 0.7);
  ctx.fill(screen);
  ctx.stroke(screen);

  // The bars, with a grip at each end - and on a police one a blue lamp beside
  // each grip, and a third in the middle of the tail.
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(long - 12.4, -wide + 0.5);
  ctx.lineTo(long - 12.4, wide - 0.5);
  ctx.stroke();
  if (police) {
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN * 0.6;
    for (const side of [-1, 1]) {
      const pod = new Path2D();
      pod.roundRect(long - 13.4, side * 3.6 - 1, 2.6, 2, 0.5);
      ctx.fill(pod);
      ctx.stroke(pod);
    }
    const siren = new Path2D();
    siren.roundRect(-long + 0.8, -1.5, 2.6, 3, 0.6);
    ctx.fill(siren);
    ctx.stroke(siren);
  }

  // And the man on it: knees out either side of the tank, arms forward to the
  // bars, and a helmet between the shoulders.
  const who = riderLook("patrolbike", police, mine);
  ctx.strokeStyle = who.jacket;
  ctx.lineCap = "round";
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(-1.6, side * 2.2);
    ctx.lineTo(long - 12, side * 3.2);
  }
  ctx.stroke();
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(-4.5, side * 1.8);
    ctx.lineTo(0.5, side * 3.6);
  }
  ctx.stroke();
  const rider = new Path2D();
  rider.ellipse(-2.5, 0, 4.2, 2.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = who.jacket;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(rider);
  ctx.stroke(rider);
  const helmet = new Path2D();
  helmet.ellipse(-1.2, 0, 2, 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = who.helmet;
  ctx.fill(helmet);
  ctx.stroke(helmet);
  ctx.fillStyle = "#1e293b";
  const visor = new Path2D();
  visor.roundRect(-0.4, -1.3, 1.4, 2.6, 0.5);
  ctx.fill(visor);
}

/**
 * A car, a taxi or an off-roader, from above.
 *
 * @remarks
 * All three are the same drawing with three dials: how much the nose tapers,
 * how far the wheels stand out, and what is painted on the roof. What makes
 * them read as different vehicles is mostly the outline - a saloon narrows
 * towards the bonnet, an off-roader does not.
 */
function paintCar(
  ctx: CanvasRenderingContext2D,
  body: VehicleBody,
  paint: string,
  police: boolean,
): void {
  const shape = VEHICLES[body];
  const long = shape.length / 2;
  const wide = shape.width / 2;
  const boxy = body === "suv";

  // No wheels here. Seen from straight above a car is bodywork: the tyres are
  // under the arches, and the only place one sees them is from the side, where
  // the flank picture draws them. They used to be drawn here as well, standing
  // proud of the bodywork - which from the front put four tyres out in the
  // open beside a car that has wheel arches, and from the side laid a black
  // bar on the road under each wheel.

  // The body, filled with the very outline the walls are raised from - see
  // bodyOutline. Anything else here and the roof and the walls part company.
  const shell = pathOf(bodyOutline(body));
  ctx.fillStyle = police ? POLICE_PAINT : paint;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  if (police) {
    // What one sees of the side band from straight above: the top edge of it,
    // a fluorescent line down each flank. The rest of the livery is on the
    // walls, where it belongs - from up here a patrol car is a silver car.
    // Kept clear of the chamfered corners: a rectangle that runs the whole
    // length pokes out past the silhouette at each end, and what pokes out is
    // stamped flat on the road by the ring - two yellow specks on the tarmac.
    ctx.fillStyle = POLICE_GLOW;
    for (const side of [-1, 1]) {
      ctx.fillRect(-long + 5, side === 1 ? wide - 1 : -wide, long * 2 - 10, 1);
    }
  } else if (body === "taxi") {
    // **The chequers sit on the back half and nowhere else**, one row down
    // each side. Run the whole length they cross the doors, and the doors are
    // where the writing goes.
    ctx.fillStyle = "#0f172a";
    for (let at = -long * 0.86; at < -long * 0.12; at += 4) {
      ctx.fillRect(at, -wide, 2, 1.6);
      ctx.fillRect(at + 2, wide - 1.6, 2, 1.6);
    }
  }

  // The cabin: the same trick again, so its roof sits exactly on its walls.
  const roof = pathOf(cabinOutline(body));
  ctx.fillStyle = blackTop(body)
    ? CORSA_LID
    : shade(police ? POLICE_PAINT : paint);
  ctx.fill(roof);
  ctx.stroke(roof);

  // No glass up here. Every pane a car has is on a wall of the cabin, and the
  // cabin is a box of its own that stands on this picture - drawing the
  // windscreen flat as well would put it on the roof, a step above where it
  // belongs, and read as a dark lid on a crate.

  if (body === "patrol") {
    patrolRoof(ctx, long, wide, paint);
  } else if (body === "car") {
    golfRoof(ctx, long, wide, paint, body, true);
  } else if (isCorsa(body)) {
    // **No shark fin, and no badge on the bonnet either.** The triangle on the
    // back of the roof is a Golf's aerial; this car keeps its aerial in the
    // tailgate glass. And a maker's mark does not lie flat on a bonnet where
    // one would look down on it - it stands in the grille between the two
    // headlamps, which is where `golfFace` puts it.
    golfRoof(ctx, long, wide, paint, body, false);
  }

  // Mirrors, lights and the seams of the bonnet.
  ctx.lineWidth = PEN * 0.7;
  // A contrast roof takes the mirrors with it, the way it is actually sold:
  // roof, pillars and mirror caps in black, and the paint below them whatever
  // was ordered.
  ctx.fillStyle = blackTop(body) ? CORSA_LID : shade(paint);
  for (const side of [-1, 1]) {
    // Measured off the mesh: x 4.8 to 6.8, and out to the very edge of the
    // silhouette. Further out would be clipped away - what falls outside the
    // outline is not part of the car as far as the stamp is concerned.
    const mirror = new Path2D();
    mirror.rect(long * 0.22, side * (wide - 1.5) - 0.7, 2.4, 1.4);
    ctx.fill(mirror);
    ctx.stroke(mirror);
  }
  // Lamps on the bodywork seen from above, for the bodies whose walls do not
  // carry them. Everything that is drawn by `golfWall` does carry them - on
  // both ends and round on to the flanks - so a second set up here is a row of
  // red and white dots above and below the real ones, sitting on the bonnet
  // and the boot lid where no lamp has ever been.
  if (!onGolfWalls(body)) {
    ctx.fillStyle = LAMP;
    for (const side of [-1, 1]) {
      const lamp = new Path2D();
      lamp.roundRect(long - 2.6, side * wide * 0.5 - 1.1, 2.4, 2.2, 0.8);
      ctx.fill(lamp);
      ctx.stroke(lamp);
    }
    ctx.fillStyle = TAIL;
    for (const side of [-1, 1]) {
      const lamp = new Path2D();
      lamp.roundRect(-long + 0.6, side * wide * 0.55 - 1, 1.8, 2, 0.6);
      ctx.fill(lamp);
      ctx.stroke(lamp);
    }
  }

  if (boxy) {
    // A roof rack and a bull bar: the two things that say off-roader.
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (const at of [-long * 0.2, 0, long * 0.2]) {
      ctx.moveTo(at, -wide * 0.8);
      ctx.lineTo(at, wide * 0.8);
    }
    ctx.stroke();
    const bar = new Path2D();
    bar.roundRect(long - 2.4, -wide * 0.9, 1.8, wide * 1.8, 0.8);
    ctx.fillStyle = "#94a3b8";
    ctx.lineWidth = PEN * 0.7;
    ctx.fill(bar);
    ctx.stroke(bar);
  }

  if (police) {
    // **No light bar here.** It used to be painted flat on the roof, which is
    // what it is not: a light bar stands up off the roof, and a rectangle of
    // colour lying in the paint reads as a sticker. The renderer builds it as
    // a little box of its own - see `beacon` - so that it has sides and a lid
    // and throws its light from above the roof rather than out of it.
  }
  // **No taxi sign here either**, and for the same reason as the light bar: a
  // sign lies on top of a roof, it is not painted into one. The renderer
  // builds it as a little box - see `taxiSign` - so that it has sides, catches
  // the light from an angle and does not vanish into the paint when the car is
  // seen flat on.
}

/**
 * The DMC-12, from above.
 *
 * @remarks
 * Its own drawing rather than a dial on {@link paintCar}, because nothing about
 * it is a saloon: the nose is a wedge, the flanks carry a black band all the
 * way round, the doors open upwards - so the seam runs along the roof instead
 * of down the side - and the engine sits behind the cabin under a bonnet full
 * of slats. And it is never painted. Bare stainless steel is the car.
 */
function paintDelorean(ctx: CanvasRenderingContext2D): void {
  const shape = VEHICLES.dmc;
  const long = shape.length / 2;
  const wide = shape.width / 2;

  // The shell: broad across the rear wheels, tapering to a flat nose - and the
  // same outline the walls stand on.
  const shell = pathOf(bodyOutline("dmc"));
  ctx.fillStyle = STEEL;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  // The black band along the sills, which is what one sees of it side-on.
  ctx.fillStyle = "#1c1917";
  for (const side of [-1, 1]) {
    ctx.fillRect(-long * 0.75, side * wide - side * 1.4, long * 1.5, 1.4);
  }

  // The cabin: a dark wedge of glass with the roof seam of the two gullwings
  // running down the middle of it.
  const cabin = new Path2D();
  cabin.moveTo(long * 0.12, -wide * 0.78);
  cabin.lineTo(-long * 0.46, -wide * 0.84);
  cabin.lineTo(-long * 0.46, wide * 0.84);
  cabin.lineTo(long * 0.12, wide * 0.78);
  cabin.closePath();
  ctx.fillStyle = "#6b7280";
  ctx.fill(cabin);
  ctx.stroke(cabin);
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(long * 0.12, 0);
  ctx.lineTo(-long * 0.46, 0);
  ctx.stroke();

  // The louvres over the engine, at the back.
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let at = -long * 0.9; at < -long * 0.5; at += 1.6) {
    ctx.moveTo(at, -wide * 0.7);
    ctx.lineTo(at, wide * 0.7);
  }
  ctx.stroke();

  // The black nose, with the lamps in it.
  ctx.fillStyle = "#1c1917";
  const nose = new Path2D();
  nose.rect(long - 3.4, -wide * 0.62, 3.4, wide * 1.24);
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(nose);
  ctx.stroke(nose);
  ctx.fillStyle = LAMP;
  for (const side of [-1, 1]) {
    const lamp = new Path2D();
    lamp.roundRect(long - 3, side * wide * 0.36 - 1, 2.2, 2, 0.5);
    ctx.fill(lamp);
    ctx.stroke(lamp);
  }
  ctx.fillStyle = TAIL;
  for (const side of [-1, 1]) {
    const lamp = new Path2D();
    lamp.roundRect(-long + 0.8, side * wide * 0.45 - 1, 1.6, 2, 0.5);
    ctx.fill(lamp);
    ctx.stroke(lamp);
  }
  // Mirrors, which on this car stand well forward.
  ctx.fillStyle = "#1c1917";
  for (const side of [-1, 1]) {
    const mirror = new Path2D();
    mirror.rect(long * 0.16, side * (wide + 0.2) - 0.5, 2, 1.2);
    ctx.fill(mirror);
    ctx.stroke(mirror);
  }
}

/**
 * What a DMC-12 is made of: brushed stainless steel, never paint.
 *
 * @remarks
 * Exported because the city picks the colour of every car before it asks for a
 * sprite, and this one has no colour to pick - it left the factory unpainted.
 */
export const STEEL = "#b9bec6";

/**
 * A motorbike or a bicycle, from above.
 *
 * @remarks
 * Almost all of what is visible is the rider: a bike from directly above is two
 * wheels, a frame between them and a person on top. The handlebars are what
 * makes it read as a machine rather than as somebody lying down.
 */
function paintTwoWheeler(
  ctx: CanvasRenderingContext2D,
  body: VehicleBody,
  paint: string,
  police: boolean,
  mine: boolean,
): void {
  const shape = VEHICLES[body];
  const long = shape.length / 2;
  const wide = shape.width / 2;
  const cycle = body === "cycle";

  // **No wheels in this picture on a bicycle.** The walls draw them, and on a
  // machine with no bodywork over them the walls' wheels are all one sees -
  // so a pair drawn here as well got stamped at the belt line and came out as
  // a second tyre hanging in the air behind the first. One tyre at each end,
  // seen from whichever side one happens to be on, is the whole of it.
  if (!cycle) {
    ctx.fillStyle = "#1c1917";
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN * 0.7;
    for (const at of [long - 2, -long + 2]) {
      const wheel = new Path2D();
      wheel.roundRect(at - 3, -wide * 0.7, 6, wide * 1.4, 1);
      ctx.fill(wheel);
      ctx.stroke(wheel);
    }
  }

  if (cycle) {
    // The frame: a spine down the middle from hub to hub, no wider than the
    // tubes it is made of.
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(long - 3, 0);
    ctx.lineTo(-long + 3, 0);
    ctx.stroke();
  } else {
    const frame = new Path2D();
    frame.moveTo(long - 3, -wide * 0.5);
    frame.lineTo(-long + 3, -wide * 0.7);
    frame.lineTo(-long + 3, wide * 0.7);
    frame.lineTo(long - 3, wide * 0.5);
    frame.closePath();
    ctx.fillStyle = paint;
    ctx.lineWidth = PEN;
    ctx.fill(frame);
    ctx.stroke(frame);
  }

  // The handlebars, across the front.
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = cycle ? 0.9 : 1.2;
  ctx.beginPath();
  ctx.moveTo(long - 5, -wide - 1.6);
  ctx.lineTo(long - 5, wide + 1.6);
  ctx.stroke();

  if (!cycle) {
    // A tank and an exhaust, for the one with an engine.
    const fuel = new Path2D();
    fuel.ellipse(2, 0, 3.4, wide * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = shade(paint);
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN * 0.7;
    ctx.fill(fuel);
    ctx.stroke(fuel);
  }

  if (police) {
    // A white tank and a little blue light: enough to tell a patrol bike from
    // a courier at a glance, which is all one gets at this size.
    const fairing = new Path2D();
    fairing.roundRect(-1, -wide * 0.8, 7, wide * 1.6, 1.4);
    ctx.fillStyle = POLICE_PAINT;
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN * 0.7;
    ctx.fill(fairing);
    ctx.stroke(fairing);
    const lamp = new Path2D();
    lamp.roundRect(-5.4, -1.6, 2.4, 3.2, 0.8);
    ctx.fillStyle = "#3b82f6";
    ctx.fill(lamp);
    ctx.stroke(lamp);
  }

  // And the rider, seen from above: shoulders, arms to the bars, a head - and
  // dressed as whoever is actually on it.
  const who = riderLook(body, police, mine);
  const rider = new Path2D();
  rider.ellipse(-2, 0, 4.4, wide + 1.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = who.jacket;
  ctx.lineWidth = PEN;
  ctx.fill(rider);
  ctx.stroke(rider);
  ctx.strokeStyle = who.jacket;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(-1, side * wide);
    ctx.lineTo(long - 5.4, side * (wide + 1.2));
  }
  ctx.stroke();
  const head = new Path2D();
  head.ellipse(1.4, 0, 2.8, 2.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = who.helmet;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(head);
  ctx.stroke(head);
}

/**
 * A tank, from above.
 *
 * @remarks
 * Two tracks, a hull between them, a turret and a gun - and the tracks are what
 * the eye goes to, so they get their links drawn. Nothing about it is subtle,
 * which is right: finding one is meant to change the afternoon.
 */
function paintTank(ctx: CanvasRenderingContext2D): void {
  const shape = VEHICLES.tank;
  const long = shape.length / 2;
  const wide = shape.width / 2;

  // The tracks, with the drive sprocket at the back and the idler at the nose.
  ctx.fillStyle = "#292524";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  for (const side of [-1, 1]) {
    const track = new Path2D();
    track.roundRect(-long, side * wide - 6.5, long * 2, 6.5, 1.4);
    ctx.fill(track);
    ctx.stroke(track);
  }
  ctx.fillStyle = "#44403c";
  for (let link = -long + 2; link < long - 2; link += 4) {
    for (const side of [-1, 1]) {
      ctx.fillRect(link, side * wide - 5.6, 2, 4.8);
    }
  }
  // Side skirts over the top run of each track: the flat grey slabs that are
  // the first thing one recognises a Leopard by from above.
  ctx.fillStyle = TANK_SKIRT;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.8;
  for (const side of [-1, 1]) {
    const skirt = new Path2D();
    skirt.rect(-long + 6, side * wide - 7.4, long * 2 - 12, 3.4);
    ctx.fill(skirt);
    ctx.stroke(skirt);
  }

  // The hull: a long sloped glacis at the front, square at the back.
  const hull = new Path2D();
  hull.moveTo(long - 9, -wide + 7);
  hull.lineTo(long + 1, -wide + 11);
  hull.lineTo(long + 1, wide - 11);
  hull.lineTo(long - 9, wide - 7);
  hull.lineTo(-long + 1, wide - 7);
  hull.lineTo(-long + 1, -wide + 7);
  hull.closePath();
  ctx.fillStyle = TANK_GREEN;
  ctx.lineWidth = PEN;
  ctx.fill(hull);
  ctx.stroke(hull);
  // The two-tone NATO camouflage: a couple of brown patches, nothing clever.
  ctx.fillStyle = TANK_BROWN;
  ctx.beginPath();
  ctx.ellipse(-long * 0.45, -wide * 0.3, 7, 4, 0.4, 0, Math.PI * 2);
  ctx.ellipse(long * 0.2, wide * 0.35, 8, 3.6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // The engine deck at the back, with its louvres.
  ctx.fillStyle = "#3f4f22";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  const deck = new Path2D();
  deck.rect(-long + 3, -wide + 8, 13, (wide - 8) * 2);
  ctx.fill(deck);
  ctx.stroke(deck);
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let louvre = -long + 5; louvre < -long + 15; louvre += 2.6) {
    ctx.moveTo(louvre, -wide + 9.5);
    ctx.lineTo(louvre, wide - 9.5);
  }
  ctx.stroke();

  // The ring the turret sits in. The turret itself is a picture of its own:
  // it turns with the mouse, and the hull turns with the tracks.
  const ring = new Path2D();
  ring.ellipse(2, 0, 9.6, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#3f6212";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(ring);
  ctx.stroke(ring);
}

/** The green a tank is painted in. */
const TANK_GREEN = "#4d5d29";

/** And the brown of the patches on it. */
const TANK_BROWN = "#6b5433";

/** The grey of the skirts down its sides. */
const TANK_SKIRT = "#57534e";

/**
 * A tractor, from above.
 *
 * @remarks
 * Two big wheels at the back, two small ones at the front, a bonnet with the
 * exhaust standing up out of it and a cab over the rear axle - and a tow bar
 * behind, which is the entire reason this vehicle is in the game.
 */
function paintTractor(ctx: CanvasRenderingContext2D, paint: string): void {
  const shape = VEHICLES.tractor;
  const long = shape.length / 2;

  // The wheels: the back pair wide and deep, the front pair small. These are
  // the one set of wheels in the city that may be seen from above, because a
  // tractor's really do stand outside its body - they start at the edge of the
  // silhouette, so there is no strip of road showing between wheel and wing.
  ctx.fillStyle = "#1c1917";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.8;
  for (const side of [-1, 1]) {
    const back = new Path2D();
    back.roundRect(-long + 4, side === 1 ? 8.6 : -15.6, 18, 7, 2);
    ctx.fill(back);
    ctx.stroke(back);
    const front = new Path2D();
    front.roundRect(long - 14, side === 1 ? 6 : -10.5, 10, 4.5, 1.5);
    ctx.fill(front);
    ctx.stroke(front);
  }

  // The body: a narrow bonnet up front, widening into the cab - and it is the
  // outline the walls are raised from, so bonnet and wing meet flush.
  const body = pathOf(bodyOutline("tractor"));
  ctx.fillStyle = paint;
  ctx.lineWidth = PEN;
  ctx.fill(body);
  ctx.stroke(body);

  // The cab, glazed all round, over the back axle - the same trick again.
  const cab = pathOf(cabinOutline("tractor"));
  ctx.fillStyle = shade(paint);
  ctx.fill(cab);
  ctx.stroke(cab);
  // A roof, not a skylight: from above a cab is a painted lid with a hatch in
  // it. The glass is on the walls of the cab, which are their own pictures.
  const lid = new Path2D();
  lid.roundRect(-long + 7.5, -8, 13, 16, 2);
  ctx.fillStyle = paint;
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(lid);
  ctx.stroke(lid);
  const hatch = new Path2D();
  hatch.rect(-long + 11, -3.5, 6, 7);
  ctx.fillStyle = "#1e293b";
  ctx.fill(hatch);
  ctx.stroke(hatch);

  // The exhaust stack beside the bonnet, and the tow bar behind.
  ctx.fillStyle = "#44403c";
  const stack = new Path2D();
  stack.ellipse(long - 9, -3.4, 2.6, 2.6, 0, 0, Math.PI * 2);
  ctx.fill(stack);
  ctx.stroke(stack);
  const bar = new Path2D();
  bar.rect(-long, -3, 5, 6);
  ctx.fillStyle = "#57534e";
  ctx.fill(bar);
  ctx.stroke(bar);
}

/** The turret: a squat block, the hatch behind it, and the gun out in front. */
function paintTurret(ctx: CanvasRenderingContext2D): void {
  // The wedge: flat sides sloping in to a narrow, heavily armoured face, with
  // a squared-off bustle behind. Seen from above that outline is the whole of
  // what says Leopard rather than tank.
  const turret = new Path2D();
  turret.moveTo(12, -4.2);
  turret.lineTo(12, 4.2);
  turret.lineTo(-2, 9.5);
  turret.lineTo(-13, 9.5);
  turret.lineTo(-13, -9.5);
  turret.lineTo(-2, -9.5);
  turret.closePath();
  ctx.fillStyle = TURRET_GREEN;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(turret);
  ctx.stroke(turret);
  // A stowage basket across the back of the bustle.
  ctx.fillStyle = "#3f4f22";
  ctx.lineWidth = PEN * 0.7;
  const basket = new Path2D();
  basket.rect(-17, -8, 4.5, 16);
  ctx.fill(basket);
  ctx.stroke(basket);
  // Commander's sight and the loader's hatch.
  const sight = new Path2D();
  sight.roundRect(-8, -7.5, 5, 5, 1.2);
  ctx.fillStyle = "#57534e";
  ctx.fill(sight);
  ctx.stroke(sight);
  const hatch = new Path2D();
  hatch.ellipse(-7, 4, 3, 2.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#365314";
  ctx.fill(hatch);
  ctx.stroke(hatch);
  // Smoke dischargers, four a side, angled forward.
  ctx.fillStyle = "#1c1917";
  for (const side of [-1, 1]) {
    for (let tube = 0; tube < 4; tube += 1) {
      ctx.fillRect(2 - tube * 2.6, side * 6.5, 1.8, side * 2.6);
    }
  }
  // The gun: a long barrel with the thermal sleeve over the breech half and a
  // muzzle brake at the end.
  const gun = new Path2D();
  gun.rect(10, -1.7, 32, 3.4);
  ctx.fillStyle = "#1c1917";
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(gun);
  ctx.stroke(gun);
  const sleeve = new Path2D();
  sleeve.rect(11, -2.6, 13, 5.2);
  ctx.fillStyle = "#44403c";
  ctx.fill(sleeve);
  ctx.stroke(sleeve);
  const muzzle = new Path2D();
  muzzle.rect(39, -2.8, 4, 5.6);
  ctx.fillStyle = "#1c1917";
  ctx.fill(muzzle);
  ctx.stroke(muzzle);
}

/** The turret is a shade darker than the hull under it. */
const TURRET_GREEN = "#44521f";

/**
 * A darker version of a colour, for a roof against its own flanks.
 *
 * @param colour - any of the palette colours, as `#rrggbb`
 * @returns the same colour with a quarter taken off each channel
 */
export function shade(colour: string): string {
  const hex = colour.replace("#", "");
  if (hex.length !== 6) {
    return colour;
  }
  const darker = [0, 2, 4].map((at) => {
    const part = Number.parseInt(hex.slice(at, at + 2), 16);
    return Math.round(part * 0.74)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${darker.join("")}`;
}

/* --------------------------------------------------------- from the side */

/** How high the rocker panel under the doors is, in city pixels. */
const SILL = 0.9;

/** What a bumper is made of. */
const TRIM = "#334155";

/** And a tyre. */
const RUBBER = "#1c1917";

/** And the metal in the middle of a wheel. */
const RIM = "#94a3b8";

/** Everything one wall picture needs to know about itself. */
type WallJob = {
  readonly body: VehicleBody;
  readonly paint: string;
  readonly police: boolean;
  readonly face: VehicleFace;
  /** True for the cabin, false for the body under it. */
  readonly upper: boolean;
  /** How wide the picture is, in city pixels. */
  readonly span: number;
  /** And how high, from the ground up. */
  readonly high: number;
  /** Which picture of a turning wheel to draw - see {@link wheelStep}. */
  readonly spin: number;
  /** Whether the handbrake is holding the back wheels still. */
  readonly held: boolean;
  /** Whether this picture is the one that goes on back to front. */
  readonly mirror: boolean;
  /** Whether the player is the one riding it. */
  readonly mine: boolean;
};

/** Paints one wall into a canvas of its own. */
function buildWall(
  body: VehicleBody,
  paint: string,
  police: boolean,
  face: VehicleFace,
  upper: boolean,
  spin: number,
  held: boolean,
  mirror: boolean,
  mine: boolean,
): HTMLCanvasElement | null {
  const tiers = TIERS[body];
  const shape = VEHICLES[body];
  const flank = face === "flank";
  let span: number;
  if (upper) {
    span = flank ? tiers.cabinFront - tiers.cabinBack : tiers.cabinWide;
  } else {
    span = flank ? shape.length : shape.width;
  }
  const high = upper ? tiers.tall - tiers.belt : tiers.belt;
  const sheet = document.createElement("canvas");
  sheet.width = Math.round(span * GRAIN);
  sheet.height = Math.round(high * GRAIN);
  const ctx = sheet.getContext("2d");
  let made: HTMLCanvasElement | null = null;
  if (ctx !== null) {
    // The ground along the bottom edge, height going up, the middle at zero:
    // the way one would draw a car on paper.
    ctx.translate(sheet.width / 2, sheet.height);
    ctx.scale(GRAIN, -GRAIN);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    paintWall(ctx, {
      body,
      paint,
      police,
      face,
      upper,
      span,
      high,
      spin,
      held,
      mirror,
      mine,
    });
    made = sheet;
  }
  return made;
}

/** Which routine draws which wall. */
function paintWall(ctx: CanvasRenderingContext2D, job: WallJob): void {
  if (onGolfWalls(job.body)) {
    // **A taxi is the patrol car in yellow.** Same bodywork, same wheelbase,
    // same tailgate: what it does not have is the livery, the light bar and
    // the lettering, and what it has instead is a chequered band and a sign on
    // the roof. Drawing it as a third saloon was drawing the same car twice.
    golfWall(ctx, job);
  } else if (job.body === "suv") {
    cyberWall(ctx, job);
  } else if (job.body === "tank") {
    tankWall(ctx, job);
  } else if (twoWheeled(job.body)) {
    rideWall(ctx, job);
  } else if (job.body === "tractor") {
    tractorWall(ctx, job);
  } else if (job.body === "dmc") {
    dmcWall(ctx, job);
  } else {
    carWall(ctx, job);
  }
}

/* ------------------------------------------------------------------- golf */

/**
 * The Golf VIII, from whichever side one is looking at it.
 *
 * @param ctx - what to paint on, with the ground along the bottom edge
 * @param job - which wall of which vehicle, and how big
 * @remarks
 * Its own set of walls rather than the saloon with different numbers, because
 * the car in the works drawings is not a saloon at all. What has to be right,
 * in the order one notices it:
 *
 * - **A hatchback tail.** The cabin runs back almost to the bumper and stops
 *   in a near vertical hatch with a spoiler over it. On the old saloon the
 *   cabin sat in the middle with a boot behind it, which is the one silhouette
 *   this car does not have.
 * - **A light bar across the nose.** Two slim lamps and a dark strip joining
 *   them, straight across, badge in the middle - that band is the whole of what
 *   says Golf from the front. Under it the wide dark lower grille, and the
 *   outer vents at the corners.
 * - **Tall lamps in the rear corners**, wrapping round on to the flank.
 * - **The crease down the doors**, rising a little towards the back, with the
 *   handles sitting on it.
 */
function golfWall(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const flank = job.face === "flank";
  if (job.upper && flank) {
    golfGlass(ctx, job);
  } else if (job.upper) {
    golfScreen(ctx, job);
  } else if (flank) {
    golfFlank(ctx, job);
  } else {
    golfEnd(ctx, job);
  }
}

/** The long side, from the sill up to the window line. */
function golfFlank(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const long = job.span / 2;
  const high = job.high;
  const skin = job.police ? POLICE_PAINT : job.paint;
  const tyre = high * GOLF_TYRE;
  const axles = AXLES[job.body] ?? {
    front: long * GOLF_AXLE,
    rear: -long * GOLF_AXLE,
  };
  const sill = high * GOLF_SILL;

  // The bodyside. The nose drops away at the front and the tail is cut off
  // square, which is the difference between a hatchback and everything else.
  const shell = new Path2D();
  shell.moveTo(-long, sill);
  shell.lineTo(-long, high - 1.6);
  shell.quadraticCurveTo(-long, high, -long + 1.3, high);
  shell.lineTo(long - 4, high);
  shell.quadraticCurveTo(long - 1.4, high - 0.3, long - 0.5, high - 2);
  shell.lineTo(long, high - 2.3);
  shell.lineTo(long, sill);
  shell.closePath();
  ctx.fillStyle = skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  if (job.police) {
    policeFlank(ctx, job, long, high, sill);
  } else if (job.body === "taxi") {
    // **The name on the front door**, and on both of them: the same trick the
    // patrol car's lettering uses, so it reads the right way round from either
    // side of the street rather than backwards from one of them.
    ctx.save();
    ctx.translate(long * UBER_ALONG, high * UBER_HIGH);
    ctx.scale(job.mirror ? -1 : 1, -1);
    ctx.fillStyle = "#111827";
    ctx.font = `700 ${String(high * UBER_SIZE)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("UBER", 0, 0);
    ctx.restore();
  }
  // **No band down the flank.** The picture from above already carries one
  // along each shoulder, and the belt stamp lays that on the side of the car
  // for nothing - painted here as well it came out as two rows of dark
  // squares one above the other, which is a bus.

  // The sill under the doors, and the arch and wheel at each axle. Both stop
  // short of the road: the tyre is the only thing that touches it.
  ctx.fillStyle = shade(skin);
  ctx.fillRect(axles.rear, sill, axles.front - axles.rear, sill * 0.4);
  for (const at of [axles.front, axles.rear]) {
    // **The arch starts level with the axle**, which is where the tyre is at
    // its widest. Drawn any lower its two bottom corners stuck out past the
    // round of the tyre, and what one saw was a dark triangle either side of
    // each wheel, sitting on the road with nothing to be.
    const arch = new Path2D();
    arch.moveTo(at - tyre, tyre);
    arch.quadraticCurveTo(at - tyre - 0.5, tyre * 2.05, at, tyre * 2.15);
    arch.quadraticCurveTo(at + tyre + 0.5, tyre * 2.05, at + tyre, tyre);
    arch.closePath();
    ctx.fillStyle = "#0f172a";
    ctx.lineWidth = PEN * 0.7;
    ctx.fill(arch);
    ctx.stroke(arch);
    wheelAt(ctx, at, tyre, wheelTurn(job, at), job.body === "corsaultimate");
  }

  // The handles, at the height the crease used to run at. The crease itself is
  // gone: at this size a line along the whole flank is not a crease, it is a
  // stripe painted round the car.
  ctx.fillStyle = RIM;
  for (const grip of [long * 0.1, -long * 0.32]) {
    ctx.fillRect(grip, high * GOLF_CREASE, 2.4, 0.7);
  }
  // The door shuts: two doors a side, and the cut behind the rear one.
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.5;
  ctx.beginPath();
  for (const seam of [long * 0.26, -long * 0.16, -long * 0.62]) {
    ctx.moveTo(seam, sill + 0.4);
    ctx.lineTo(seam, high);
  }
  ctx.stroke();

  // The lamps, which both wrap round the corner on to this side: a sliver of
  // clear glass at the nose, a tall red one at the tail.
  ctx.lineWidth = PEN * 0.5;
  ctx.fillStyle = LAMP;
  const head = new Path2D();
  head.moveTo(long, high * GOLF_BAND);
  head.lineTo(long - 3, high * GOLF_BAND + 0.3);
  head.lineTo(long - 3, high * GOLF_BAND + 1.2);
  head.lineTo(long, high * GOLF_BAND + 1.5);
  head.closePath();
  ctx.fill(head);
  ctx.stroke(head);
  // The tail lamp runs off the back corner on to this side, high up and thin,
  // which is what one sees of it from three quarters on.
  ctx.fillStyle = TAIL;
  const rear = new Path2D();
  rear.roundRect(-long + 0.2, high * GOLF_BAND_BACK, 1.8, 1.1, 0.3);
  ctx.fill(rear);
  ctx.stroke(rear);

  // No mirror on this wall. It sits on the shoulder line, which is the top
  // edge of this picture - and the bonnet in front of it is lower than that
  // edge, so anything drawn there stands up above the bonnet like an aerial.
  // The view from above carries it instead, where it belongs.

  // And the black valance along the bottom of the bumpers.
  ctx.fillStyle = TRIM;
  for (const side of [-1, 1]) {
    const skirt = new Path2D();
    skirt.roundRect(
      side === 1 ? long - 3.4 : -long,
      sill * 0.9,
      3.4,
      sill,
      0.5,
    );
    ctx.fill(skirt);
  }
}

/**
 * The stripes down the side of a patrol car.
 *
 * @param ctx - what to paint on, the road along the bottom
 * @param long - half the length of the car, in city pixels
 * @param high - how tall the bodyside is
 * @param sill - where the rocker panel ends, above the road
 * @remarks
 * Two bands, blue below and fluorescent above, and **both of them climb
 * towards the nose**. That climb is the whole of it: a stripe painted straight
 * along the side is a delivery van, and the diagonal is what one reads as a
 * police car from the far end of a street. The lettering that belongs on the
 * fluorescent band is four pixels tall here, so it is left off - what carries
 * at this size is the colour and the angle, not the word.
 */
function policeFlank(
  ctx: CanvasRenderingContext2D,
  job: WallJob,
  long: number,
  high: number,
  sill: number,
): void {
  const low = high * POLICE_BAND.low;
  const top = high * POLICE_BAND.top;

  // **The whole side is blue**, with a fluorescent stripe along the bottom and
  // another along the top, and no paint showing between them. It was two
  // stripes on a silver side before, which left a grey band above the writing
  // and read as a car with a sticker on it rather than as a painted car.
  ctx.fillStyle = POLICE_GLOW;
  ctx.fillRect(-long, sill, long * 2, low - sill);
  ctx.fillStyle = POLICE_BLUE;
  ctx.fillRect(-long, low, long * 2, top - low);
  ctx.fillStyle = POLICE_GLOW;
  ctx.fillRect(-long, top, long * 2, high - top);

  // And the word on it, over the front door, in white.
  ctx.save();
  ctx.translate(long * 0.06, (low + top) / 2);
  ctx.scale(job.mirror ? -1 : 1, -1);
  policeWord(ctx, high * POLICE_WORD, "#f8fafc");
  ctx.restore();
}

/**
 * The word POLIZEI, laid on a panel.
 *
 * @param ctx - what to paint on
 * @param size - how tall the letters are, in city pixels
 * @param ink - what colour to write it in
 * @remarks
 * Centred on wherever the caller has put the origin and turned whichever way
 * the caller has turned it, because the two places this word goes want two
 * different things and neither is plain text on a plain canvas.
 *
 * - **On a flank** the picture is painted with its y axis pointing up, so the
 *   caller flips it back or every letter stands on its head. And both flanks
 *   of a car share one picture, one of them laid on back to front - so a word
 *   painted once reads correctly down one side and backwards down the other.
 *   The caller mirrors the copy that gets flipped, and it reads both ways.
 * - **On the bonnet** the picture is seen from above and turns with the car,
 *   so the word goes across it rather than along it: that way it comes out
 *   the right way up in the one case that matters, which is a patrol car
 *   coming straight at you.
 *
 * At this size the word is three pixels tall on screen and nobody will read
 * it. That is not what it is for - what one reads is **that there is writing
 * there**, which no other vehicle in the city has, and that is enough to tell
 * a patrol car from a silver estate at a glance.
 */
function policeWord(
  ctx: CanvasRenderingContext2D,
  size: number,
  ink: string,
): void {
  ctx.fillStyle = ink;
  ctx.font = `700 ${size}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("POLIZEI", 0, 0);
}

/**
 * The same livery across an end of the car.
 *
 * @param ctx - what to paint on
 * @param half - half the width of the wall, in city pixels
 * @param high - how tall it is
 * @remarks
 * **One stripe here, not two.** Seen from the front or the back the car is
 * blue with a fluorescent line along the bumper and nothing else - the second
 * stripe belongs to the sides. Painted before the grille and the lamps, which
 * then sit on top of it the way they do on the real car.
 */
function policeEnd(
  ctx: CanvasRenderingContext2D,
  half: number,
  high: number,
): void {
  const foot = high * GOLF_BUMPER;
  const low = high * POLICE_BAND.low;
  ctx.fillStyle = POLICE_GLOW;
  ctx.fillRect(-half, foot, half * 2, low - foot);
  ctx.fillStyle = POLICE_BLUE;
  ctx.fillRect(-half, low, half * 2, high - low);
}

/** The nose or the tail: the light bar, the grille and the bumper. */
function golfEnd(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const nose = job.face === "nose";
  const skin = job.police ? POLICE_PAINT : job.paint;

  // **No tyres on this wall.** An end of the car is a couple of pixels wide
  // when one is looking at it from the side, and anything standing at the edge
  // of it - a wheel, say - is then a straight black line on the road at the
  // nose and another at the tail. The flanks carry the wheels, and from any
  // angle at which a wheel is worth seeing, a flank is in view.
  // The bumper stops short of the road, and by the same measure at both ends:
  // an end wall that started lower than the flanks does gave the car one ride
  // height from the side and another from the front.
  ctx.strokeStyle = INK;
  const shell = new Path2D();
  const foot = high * GOLF_BUMPER;
  shell.roundRect(-half, foot, half * 2, high - foot, 1.8);
  ctx.fillStyle = skin;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  // The livery goes on **before** the lamps and the grille, so that they sit
  // on top of it the way they do on the real car.
  if (job.police) {
    policeEnd(ctx, half, high);
  }
  ctx.lineWidth = PEN * 0.5;
  if (!nose) {
    golfTail(ctx, job, half, high);
  } else if (job.body === "patrol") {
    mercedesFace(ctx, job, half, high);
  } else {
    golfFace(ctx, job, half, high);
  }
}

/**
 * The face of a Mercedes: one big grille with a star in the middle of it.
 *
 * @param ctx - what to paint on
 * @param job - which wall of which vehicle
 * @param half - half the width of the wall, in city pixels
 * @param high - how tall it is
 * @remarks
 * Measured off the works CAD drawing
 * (`game_instructions/GTA/Fahrzeuge/Polizei/eklasse_ansicht.jpg`), and it is
 * nothing like the Golf's face. A Golf wears a slim dark bar across the nose
 * with the lamps in it and its badge the size of a pinhead; this car wears a
 * **radiator grille**, half the width of the car and a quarter of the height
 * of the bodyside, sitting high with a three-pointed star in the middle of it
 * and slim lamps pushed out to the wings on either side. Below it the bumper
 * has its own wide intake with the plate on the panel between.
 */
function mercedesFace(
  ctx: CanvasRenderingContext2D,
  job: WallJob,
  half: number,
  high: number,
): void {
  // The lamps first: the grille overlaps their inner ends.
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.45;
  ctx.fillStyle = LAMP;
  for (const side of [-1, 1]) {
    const lamp = new Path2D();
    lamp.moveTo(side * half * 0.5, high * 0.615);
    lamp.lineTo(side * half * 0.92, high * 0.578);
    lamp.lineTo(side * half * 0.92, high * 0.7);
    lamp.lineTo(side * half * 0.5, high * 0.705);
    lamp.closePath();
    ctx.fill(lamp);
    ctx.stroke(lamp);
  }

  // The grille: wider at the top than at the bottom, which is what makes it
  // read as a Mercedes rather than as a letterbox.
  ctx.fillStyle = "#1c1917";
  ctx.lineWidth = PEN * 0.55;
  const grille = new Path2D();
  grille.moveTo(-half * 0.485, high * 0.475);
  grille.lineTo(half * 0.485, high * 0.475);
  grille.lineTo(half * 0.53, high * 0.713);
  grille.lineTo(-half * 0.53, high * 0.713);
  grille.closePath();
  ctx.fill(grille);
  ctx.stroke(grille);
  mercedesStar(ctx, 0, high * 0.595, high * 0.1);

  // The bumper under it: one wide intake, the plate on the panel between.
  ctx.fillStyle = "#0f172a";
  ctx.lineWidth = PEN * 0.5;
  const mouth = new Path2D();
  mouth.roundRect(-half * 0.885, high * 0.269, half * 1.77, high * 0.175, 0.6);
  ctx.fill(mouth);
  ctx.stroke(mouth);
  ctx.fillStyle = "#e2e8f0";
  ctx.lineWidth = PEN * 0.4;
  const plate = new Path2D();
  plate.rect(-half * 0.28, high * 0.34, half * 0.56, high * 0.115);
  ctx.fill(plate);
  ctx.stroke(plate);
}

/**
 * The three-pointed star, in its ring.
 *
 * @param ctx - what to paint on
 * @param at - where the middle of it goes across the picture
 * @param up - and how far up it
 * @param size - the radius of the ring, in city pixels
 */
function mercedesStar(
  ctx: CanvasRenderingContext2D,
  at: number,
  up: number,
  size: number,
): void {
  ctx.fillStyle = "#334155";
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = size * 0.3;
  const ring = new Path2D();
  ring.ellipse(at, up, size, size, 0, 0, Math.PI * 2);
  ctx.fill(ring);
  ctx.stroke(ring);
  ctx.lineWidth = size * 0.26;
  ctx.beginPath();
  for (let arm = 0; arm < 3; arm += 1) {
    const turn = Math.PI / 2 + (arm * Math.PI * 2) / 3;
    ctx.moveTo(at, up);
    ctx.lineTo(at + Math.cos(turn) * size, up + Math.sin(turn) * size);
  }
  ctx.stroke();
}

/**
 * The face: the light bar, the badge, and the mouth under it.
 *
 * @param ctx - what to paint on
 * @param job - which wall of which vehicle
 * @param half - half the width of the wall, in city pixels
 * @param high - how tall it is
 * @remarks
 * The band is the whole of it: two slim lamps and a dark strip joining them,
 * straight across, with the badge in the middle. Under it the wide dark
 * intake, a vent in each corner, and the plate on the panel between.
 */
function golfFace(
  ctx: CanvasRenderingContext2D,
  job: WallJob,
  half: number,
  high: number,
): void {
  const band = high * GOLF_BAND;
  ctx.fillStyle = "#1c1917";
  const strip = new Path2D();
  strip.roundRect(-half * 0.93, band, half * 1.86, high * 0.13, 0.5);
  ctx.fill(strip);
  ctx.stroke(strip);
  ctx.fillStyle = LAMP;
  for (const side of [-1, 1]) {
    const lamp = new Path2D();
    lamp.roundRect(
      side === 1 ? half * 0.486 : -half * 0.9,
      band,
      half * 0.414,
      high * 0.13,
      0.4,
    );
    ctx.fill(lamp);
    ctx.stroke(lamp);
  }
  if (isCorsa(job.body)) {
    // The lightning in the ring, black on the Ultimate and chrome on the rest.
    opelBadge(ctx, 0, band + high * 0.05, 1.5, job.body === "corsaultimate");
  } else {
    ctx.fillStyle = RIM;
    const badge = new Path2D();
    badge.ellipse(0, band + high * 0.05, 1.1, 1.1, 0, 0, Math.PI * 2);
    ctx.fill(badge);
    ctx.stroke(badge);
  }

  ctx.fillStyle = "#0f172a";
  const mouth = new Path2D();
  mouth.roundRect(-half * 0.86, high * 0.24, half * 1.72, high * 0.23, 0.8);
  ctx.fill(mouth);
  ctx.stroke(mouth);
  ctx.fillStyle = TRIM;
  for (const side of [-1, 1]) {
    const vent = new Path2D();
    vent.roundRect(
      side === 1 ? half * 0.74 : -half * 0.86,
      high * 0.26,
      half * 0.12,
      high * 0.19,
      0.3,
    );
    ctx.fill(vent);
  }
  ctx.fillStyle = "#e2e8f0";
  ctx.lineWidth = PEN * 0.4;
  const plate = new Path2D();
  plate.rect(-half * 0.29, high * 0.42, half * 0.58, high * 0.09);
  ctx.fill(plate);
  ctx.stroke(plate);
}

/**
 * The tail, which is not the face with red bulbs in it.
 *
 * @param ctx - what to paint on
 * @param job - which wall of which vehicle
 * @param half - half the width of the wall, in city pixels
 * @param high - how tall it is
 * @remarks
 * Four things the front does not have, all of them measured off the works
 * photograph (`game_instructions/Golf-8-hinten.webp`):
 *
 * - **The lamps sit high and wide**, right under the glass, and each one is a
 *   wing: deep at the corner, tapering to a rounded tip a little under halfway
 *   in. Drawn as two rounded blocks they read as a saloon's, and that taper is
 *   most of what says which car this is from behind.
 * - **The tailgate has an outline.** The shut line runs down beside the glass,
 *   **crosses the lamp** about a third of the way in from the corner, and turns
 *   across the car well below the badge. Without it the back is one blank panel
 *   and the lamps look stuck on rather than half sunk into the lid.
 * - **Nothing joins the lamps.** The tailgate between them is painted bodywork
 *   with the badge on it - the dark band belongs to the front of this car.
 * - **A red line along the top of the bumper**, out to each corner, and the
 *   plate low down in the middle of it. Under that the dark valance with a
 *   bright trim at each end where the exhaust comes out.
 */
function golfTail(
  ctx: CanvasRenderingContext2D,
  job: WallJob,
  half: number,
  high: number,
): void {
  const band = high * GOLF_BAND_BACK;
  const hatch = half * GOLF_HATCH;

  // The tailgate first, so that everything else lies on top of it.
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.6;
  const seam = new Path2D();
  seam.moveTo(-hatch, high);
  seam.lineTo(-hatch, high * GOLF_LID_SIDE);
  seam.quadraticCurveTo(
    -hatch,
    high * GOLF_LID_FOOT,
    -half * 0.66,
    high * GOLF_LID_FOOT,
  );
  seam.lineTo(half * 0.66, high * GOLF_LID_FOOT);
  seam.quadraticCurveTo(
    hatch,
    high * GOLF_LID_FOOT,
    hatch,
    high * GOLF_LID_SIDE,
  );
  seam.lineTo(hatch, high);
  ctx.stroke(seam);

  // The lamps, and the shut line that cuts each of them in two.
  ctx.fillStyle = TAIL;
  ctx.lineWidth = PEN * 0.4;
  for (const side of [-1, 1]) {
    const outer = side * half * GOLF_LAMP_OUT;
    const inner = side * half * GOLF_LAMP_IN;
    const lamp = new Path2D();
    lamp.moveTo(outer, band);
    lamp.lineTo(inner + side * 0.5, band + high * GOLF_LAMP_RISE);
    lamp.quadraticCurveTo(
      inner,
      band + high * (GOLF_LAMP_RISE + GOLF_LAMP_TIP / 2),
      inner + side * 0.5,
      band + high * (GOLF_LAMP_RISE + GOLF_LAMP_TIP),
    );
    lamp.lineTo(outer, band + high * GOLF_LAMP_DEEP);
    lamp.closePath();
    ctx.fill(lamp);
    ctx.stroke(lamp);
    ctx.lineWidth = PEN * 0.6;
    ctx.beginPath();
    ctx.moveTo(side * hatch, band);
    ctx.lineTo(side * hatch, band + high * GOLF_LAMP_DEEP);
    ctx.stroke();
    ctx.lineWidth = PEN * 0.4;
  }
  ctx.fillStyle = RIM;
  ctx.lineWidth = PEN * 0.5;
  const badge = new Path2D();
  badge.ellipse(0, high * 0.85, 1.1, 1.1, 0, 0, Math.PI * 2);
  ctx.fill(badge);
  ctx.stroke(badge);

  // **No reflector line along the bumper.** The car carries one, a hand's
  // breadth under the shut line - and a hand's breadth here is one pixel, so
  // all it did was smear red along the one line the tailgate is known by.
  ctx.fillStyle = "#e2e8f0";
  ctx.lineWidth = PEN * 0.4;
  const plate = new Path2D();
  plate.rect(-half * 0.32, high * 0.37, half * 0.64, high * 0.13);
  ctx.fill(plate);
  ctx.stroke(plate);

  // The valance, with a bright trim at each end for the exhaust.
  ctx.fillStyle = "#0f172a";
  const valance = new Path2D();
  valance.roundRect(
    -half * 0.9,
    high * GOLF_BUMPER,
    half * 1.8,
    high * 0.13,
    0.5,
  );
  ctx.fill(valance);
  ctx.stroke(valance);
  ctx.fillStyle = RIM;
  for (const side of [-1, 1]) {
    ctx.fillRect(
      side === 1 ? half * 0.54 : -half * 0.87,
      high * (GOLF_BUMPER + 0.02),
      half * 0.33,
      high * 0.075,
    );
  }
}

/** The greenhouse from the side: two door windows and the quarter light. */
function golfGlass(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  // A contrast roof takes the pillars with it. Black roof, body-coloured
  // pillars is not a two-tone car, it is a car with a lid on.
  const skin = blackTop(job.body)
    ? CORSA_LID
    : job.police
      ? POLICE_PAINT
      : job.paint;
  const rake = tiersOf(job.body).rake;
  const back = rake * (BACK_RAKE_OF[job.body] ?? BACK_RAKE);

  // The roofline: up the windscreen, flat along the roof, and down the hatch -
  // which on this car is a good deal steeper at the front than at the back.
  const shell = new Path2D();
  shell.moveTo(-half, 0);
  shell.lineTo(-half + back, high - 0.6);
  shell.quadraticCurveTo(-half + back + 0.3, high, -half + back + 1, high);
  shell.lineTo(half - rake - 1, high);
  shell.quadraticCurveTo(half - rake - 0.3, high, half - rake, high - 0.6);
  shell.lineTo(half, 0);
  shell.closePath();
  ctx.fillStyle = skin;
  // Painted metal, not ink: the edge of this picture is the windscreen pillar,
  // and drawn in black it reads from the side as a mast standing up out of the
  // bonnet rather than as the edge of the glass.
  ctx.strokeStyle = shade(skin);
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  // Three panes: the two door windows, and the little one in the rear pillar.
  // The pillars between them are what makes a greenhouse read as one.
  ctx.fillStyle = GLASS;
  ctx.lineWidth = PEN * 0.5;
  // The front pane runs right up to the edge of the shell, and so does the
  // back one. A margin there leaves a strip of bodywork between the door glass
  // and the windscreen - and since the corner of the cabin is its own little
  // wall, that strip turned the corner into a pane of its own.
  const panes = [
    [half - rake, half - 0.3, 0.8, 0.8],
    [0.1, 0.1, -half * 0.62, -half * 0.62],
    [-half * 0.72, -half * 0.72, -half + back, -half + back],
  ];
  for (const pane of panes) {
    const glass = new Path2D();
    glass.moveTo(pane[0], high - 0.9);
    glass.lineTo(pane[1], 0.5);
    glass.lineTo(pane[2], 0.5);
    glass.lineTo(pane[3], high - 0.9);
    glass.closePath();
    ctx.fill(glass);
    ctx.stroke(glass);
  }
}

/** The windscreen, or the hatch window with the spoiler over it. */
function golfScreen(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const nose = job.face === "nose";
  const skin = job.police ? POLICE_PAINT : job.paint;

  const shell = new Path2D();
  shell.moveTo(-half, 0);
  shell.lineTo(-half + 0.6, high - 0.6);
  shell.quadraticCurveTo(-half + 0.9, high, -half + 1.6, high);
  shell.lineTo(half - 1.6, high);
  shell.quadraticCurveTo(half - 0.9, high, half - 0.6, high - 0.6);
  shell.lineTo(half, 0);
  shell.closePath();
  ctx.fillStyle = skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  // Out to the edges, for the same reason: the glass has to meet the glass on
  // the wall round the corner, or there is a pillar between them on both sides
  // and the screen reads as a separate little window.
  //
  // **And out to the top edge.** The glass used to stop short of it, which left
  // a strip of bodywork between the screen and the roof with a black line down
  // each side of it - a second black bar above the windscreen, standing for a
  // roof header that on a real car is an inch of painted metal. At this size an
  // inch is nothing, and the screen simply runs into the roofline.
  ctx.fillStyle = GLASS;
  ctx.lineWidth = PEN * 0.5;
  const glass = new Path2D();
  glass.moveTo(-half + 0.2, 0.5);
  glass.lineTo(-half + 0.9, high);
  glass.lineTo(half - 0.9, high);
  glass.lineTo(half - 0.2, 0.5);
  glass.closePath();
  ctx.fill(glass);
  ctx.stroke(glass);
  if (!nose) {
    // The spoiler sits on the roof over the hatch, so from behind it is a bar
    // across the top of the glass.
    ctx.fillStyle = shade(skin);
    const wing = new Path2D();
    wing.roundRect(-half * 0.88, high - 1, half * 1.76, 1.1, 0.3);
    ctx.fill(wing);
    ctx.stroke(wing);
  }
}

/**
 * What a Golf has on its roof and bonnet, seen from above.
 *
 * @param ctx - what to paint on, the nose to the east
 * @param long - half its length, in city pixels
 * @param wide - half its width
 * @param paint - the colour of the bodywork
 * @param body - which of the two cars built on these walls it is
 * @remarks
 * Three things, and from above they are the only three there are: the spoiler
 * over the hatch, the shark fin in front of it, and the two creases down the
 * bonnet.
 */
function golfRoof(
  ctx: CanvasRenderingContext2D,
  long: number,
  wide: number,
  paint: string,
  body: VehicleBody,
  fin: boolean,
): void {
  const tiers = TIERS[body];
  const lid = blackTop(body) ? CORSA_LID : paint;
  ctx.lineWidth = PEN * 0.6;
  ctx.strokeStyle = INK;
  // The spoiler, across the back of the roof.
  ctx.fillStyle = shade(shade(lid));
  const wing = new Path2D();
  wing.roundRect(tiers.cabinBack - 0.2, -wide * 0.68, 1.3, wide * 1.36, 0.4);
  ctx.fill(wing);
  ctx.stroke(wing);
  // The fin, which points back - on the bodies that have one.
  if (fin) {
    ctx.fillStyle = "#1c1917";
    const stub = new Path2D();
    stub.moveTo(tiers.cabinBack + 7.4, 0);
    stub.lineTo(tiers.cabinBack + 4.6, -1);
    stub.lineTo(tiers.cabinBack + 4.6, 1);
    stub.closePath();
    ctx.fill(stub);
  }
  // And the creases along the bonnet, either side of the middle.
  ctx.strokeStyle = shade(paint);
  ctx.lineWidth = PEN * 0.8;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(long - 2, side * wide * 0.34);
    ctx.lineTo(long - 8, side * wide * 0.58);
  }
  ctx.stroke();
}

/**
 * What the patrol car has on its roof and bonnet, seen from above.
 *
 * @param ctx - what to paint on, the nose to the east
 * @param long - half its length, in city pixels
 * @param wide - half its width
 * @param paint - the colour of the bodywork
 * @remarks
 * Three things it does **not** share with the Golf, all of them off the CAD
 * drawing:
 *
 * - **No shark fin and no aerial.** The Golf carries one on the back of its
 *   roof and this car does not: what it carries up there is the light bar,
 *   and a mast beside the light bar reads as a mistake.
 * - **The bonnet creases run straight.** A Golf's two creases splay outwards
 *   from the badge towards the wings; the Mercedes has two straight parallel
 *   power domes running the length of the bonnet, which in the front
 *   elevation are the two marks either side of the middle.
 * - **POLIZEI across the bonnet**, which is the one marking anybody reads
 *   before they read the colour.
 */
function patrolRoof(
  ctx: CanvasRenderingContext2D,
  long: number,
  wide: number,
  paint: string,
): void {
  const tiers = TIERS.patrol;
  // The spoiler over the tailgate, and nothing in front of it.
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.6;
  ctx.fillStyle = shade(shade(paint));
  const wing = new Path2D();
  wing.roundRect(tiers.cabinBack - 0.2, -wide * 0.62, 1.4, wide * 1.24, 0.4);
  ctx.fill(wing);
  ctx.stroke(wing);

  // The power domes: straight, parallel, the length of the bonnet.
  ctx.strokeStyle = shade(paint);
  ctx.lineWidth = PEN * 0.9;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(long - 3, side * wide * 0.32);
    ctx.lineTo(tiers.cabinFront + 0.8, side * wide * 0.32);
  }
  ctx.stroke();

  // **Across the bonnet, not along it.** The writing on a bonnet is there to
  // be read by whoever the car is driving at, and this view turns with the
  // car: laid along the length it reads correctly only when the car is going
  // sideways past one. Turned a quarter, it comes out the right way up in the
  // one case that matters - a patrol car coming straight towards you. In black
  // rather than blue, which is what it is on the real bonnet: blue on silver
  // at this size is a smudge.
  // **The bonnet is blue**, and the word on it white. Inset a little from the
  // silhouette so that a rim of silver is left round it: a blue panel painted
  // out to the edges reads as a blue car with a silver roof.
  ctx.fillStyle = POLICE_BLUE;
  const hood = new Path2D();
  hood.roundRect(
    tiers.cabinFront - 0.4,
    -wide + 1.2,
    long - 1.6 - tiers.cabinFront,
    wide * 2 - 2.4,
    1,
  );
  ctx.fill(hood);
  ctx.save();
  ctx.translate((long + tiers.cabinFront) / 2, 0);
  ctx.rotate(-Math.PI / 2);
  policeWord(ctx, wide * 0.4, "#f8fafc");
  ctx.restore();
}

/**
 * How big a wheel is, as a share of the height of the bodyside.
 *
 * @remarks
 * Off the mesh, by slicing the front wheel and watching the chord grow: seven
 * pixels across on a car 44 long, which is a 680 millimetre wheel on a 4284
 * millimetre car. That is the wheel standing up; here it is laid down with
 * everything else vertical by `DEPTH`, so what gets drawn is 0,33 of a
 * bodyside - and two thirds of the bodyside is what a Golf's wheel is.
 */
const GOLF_TYRE = 0.33;

/** How far along the flank the name sits, as a share of half the length. */
const UBER_ALONG = 0.1;

/** How far up the bodyside, as a share of it. */
const UBER_HIGH = 0.62;

/** And how tall the letters are, the same way. */
const UBER_SIZE = 0.34;

/** And how far from the middle each axle sits, as a share of half the length. */
const GOLF_AXLE = 0.6;

/**
 * Where a vehicle's axles sit, in city pixels from the middle of it.
 *
 * @remarks
 * For anything not listed here the two are the same distance out, which for a
 * hatchback is near enough - a Golf's overhangs are 880 millimetres at the
 * front and 784 at the back, a pixel apart.
 *
 * An estate is not near enough. Off the rescue sheet the E-Klasse carries
 * 843 millimetres of overhang in front of the front wheel and **1144** behind
 * the rear one, so its wheels sit 16,8 pixels ahead of the middle and 13,7
 * behind it. Drawn on the same axle both ways the back wheel lands three
 * pixels too far back, and a car with its rear wheel in the tailgate is a
 * car nobody can name.
 */
const AXLES: Readonly<
  Partial<
    Record<VehicleBody, { readonly front: number; readonly rear: number }>
  >
> = {
  patrol: { front: 16.8, rear: -13.7 },
  taxi: { front: 16.8, rear: -13.7 },
};

/** How high the rocker panel sits under the doors, as a share of the side. */
const GOLF_SILL = 0.22;

/** Where the door handles sit, as a share of the bodyside. */
const GOLF_CREASE = 0.68;

/** Where the light bar crosses the nose, as a share of the height. */
const GOLF_BAND = 0.57;

/** And the tail, where the lamps sit right under the glass. */
const GOLF_BAND_BACK = 0.79;

/** How far above the road the bumpers stop, as a share of the height. */
const GOLF_BUMPER = 0.18;

/** How far in from the corner the tailgate shut line runs, across half a car. */
const GOLF_HATCH = 0.77;

/** How far down its sides reach before they turn inboard. */
const GOLF_LID_SIDE = 0.66;

/** And where the seam crosses the car, under the badge. */
const GOLF_LID_FOOT = 0.62;

/** How far out the tail lamp reaches, as a share of half the width. */
const GOLF_LAMP_OUT = 0.949;

/** And how far in, where it tapers away to a tip. */
const GOLF_LAMP_IN = 0.444;

/** How deep the lamp is at the corner, as a share of the height. */
const GOLF_LAMP_DEEP = 0.169;

/** How much its lower edge climbs on the way inboard. */
const GOLF_LAMP_RISE = 0.056;

/** And what is left of it at the tip. */
const GOLF_LAMP_TIP = 0.091;

/* -------------------------------------------------------------- cybertruck */

/**
 * The Cybertruck, from whichever side one is looking at it.
 *
 * @param ctx - what to paint on, with the ground along the bottom edge
 * @param job - which wall of which vehicle, and how big
 * @remarks
 * The opposite of the Golf in every line: **nothing here is round**. Flat
 * panels meeting at hard angles, no wheel arch cut out of the bodywork but a
 * black trapezoid stuck on to it, and a roofline that is one straight rise and
 * one straight fall. Drawing it is a matter of leaving out everything one
 * would normally put in.
 *
 * - **A light bar right across, at both ends.** Not two lamps with a strip
 *   between them - one unbroken bar from corner to corner, which is the one
 *   thing everybody recognises this vehicle by.
 * - **A bed, not a boot.** Behind the cabin the body is open and covered by a
 *   flat tonneau, so from above the back half is a dark panel rather than
 *   bodywork.
 * - **The glass is one wedge.** No door frames, no quarter lights: a single
 *   dark shape whose top edge is the roofline.
 */
function cyberWall(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const flank = job.face === "flank";
  if (job.upper && flank) {
    cyberGlass(ctx, job);
  } else if (job.upper) {
    cyberScreen(ctx, job);
  } else if (flank) {
    cyberFlank(ctx, job);
  } else {
    cyberEnd(ctx, job);
  }
}

/** The long side: flat panel, black arches, and the wheels under them. */
function cyberFlank(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const long = job.span / 2;
  const high = job.high;
  const skin = job.police ? POLICE_PAINT : job.paint;
  const tyre = high * CYBER_TYRE;
  const axle = long * CYBER_AXLE;

  // One flat panel from end to end. The bottom edge steps up under each
  // bumper - this thing has no overhangs, it has approach angles.
  const shell = new Path2D();
  shell.moveTo(-long, SILL * 2.6);
  shell.lineTo(-long, high);
  shell.lineTo(long, high);
  shell.lineTo(long, SILL * 2.6);
  shell.lineTo(long - 2.4, SILL * 1.2);
  shell.lineTo(-long + 2.4, SILL * 1.2);
  shell.closePath();
  ctx.fillStyle = skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  // The panel is split lengthways: the lower third is a shade darker, and the
  // line between the two is dead straight from bumper to bumper.
  ctx.fillStyle = shade(skin);
  ctx.fillRect(-long + 2.4, SILL * 1.2, (long - 2.4) * 2, high * CYBER_SPLIT);
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.5;
  ctx.beginPath();
  ctx.moveTo(-long + 2.4, SILL * 1.2 + high * CYBER_SPLIT);
  ctx.lineTo(long - 2.4, SILL * 1.2 + high * CYBER_SPLIT);
  ctx.stroke();
  // Two door cuts, and the join where the bed begins behind them.
  ctx.beginPath();
  for (const seam of [long * 0.4, long * 0.02, -long * 0.36]) {
    ctx.moveTo(seam, SILL * 2.6);
    ctx.lineTo(seam, high);
  }
  ctx.stroke();

  // The arches: trapezoids bolted on, not curves cut out of the bodywork.
  // **The colour is set inside the loop**, because the wheel drawn at the end
  // of each turn leaves the brush loaded with the silver of its own hub - so
  // the second arch, which is the back one, came out as a pair of pale grey
  // ears either side of the rear tyre.
  ctx.lineWidth = PEN * 0.7;
  for (const at of [axle, -axle]) {
    ctx.fillStyle = "#18181b";
    const arch = new Path2D();
    arch.moveTo(at - tyre * 1.6, SILL * 0.5);
    arch.lineTo(at - tyre * 1.25, tyre * 1.55);
    arch.lineTo(at - tyre * 0.5, tyre * 1.9);
    arch.lineTo(at + tyre * 0.5, tyre * 1.9);
    arch.lineTo(at + tyre * 1.25, tyre * 1.55);
    arch.lineTo(at + tyre * 1.6, SILL * 0.5);
    arch.closePath();
    ctx.fill(arch);
    ctx.stroke(arch);
    wheelAt(ctx, at, tyre, wheelTurn(job, at));
  }
  // The step between the arches.
  ctx.fillStyle = "#27272a";
  ctx.fillRect(-axle, SILL * 0.9, axle * 2, SILL * 0.9);

  // And the light bar wrapping round each corner - white at the nose, red at
  // the tail, both hard against the top edge of the panel.
  ctx.lineWidth = PEN * 0.4;
  ctx.fillStyle = LAMP;
  ctx.fillRect(long - 2, high - 1.4, 2, 1);
  ctx.fillStyle = TAIL;
  ctx.fillRect(-long, high - 1.4, 2, 1);
}

/** The nose or the tail: a bar of light across the top, and a wall under it. */
function cyberEnd(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const nose = job.face === "nose";
  const skin = job.police ? POLICE_PAINT : job.paint;

  // No tyres on this wall either - see golfEnd for why.
  ctx.strokeStyle = INK;

  // The face is a trapezoid: widest at the bumper, drawn in a little towards
  // the top edge where the bonnet begins.
  const shell = new Path2D();
  shell.moveTo(-half, SILL * 0.8);
  shell.lineTo(-half * CYBER_TAPER, high);
  shell.lineTo(half * CYBER_TAPER, high);
  shell.lineTo(half, SILL * 0.8);
  shell.closePath();
  ctx.fillStyle = skin;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  // The steel panel in the middle of it, with the two vertical joins that cut
  // the face into three.
  ctx.fillStyle = shade(skin);
  ctx.fillRect(-half * 0.62, high * 0.36, half * 1.24, high * 0.42);
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.4;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(side * half * 0.62, high * 0.36);
    ctx.lineTo(side * half * 0.62, high * 0.78);
  }
  ctx.stroke();

  // **The bar.** Right across, corner to corner, unbroken, hard against the
  // top edge - there is no other lamp on this vehicle and no grille to put
  // between two of them. That single line is the whole face.
  ctx.fillStyle = nose ? LAMP : TAIL;
  const bar = new Path2D();
  bar.rect(-half * CYBER_TAPER, high - 1.3, half * CYBER_TAPER * 2, 1);
  ctx.fill(bar);
  ctx.stroke(bar);
  // And the thin one along the bottom of the steel, which the real one also
  // has: dimmer, and the same colour as the bar above it.
  ctx.globalAlpha = CYBER_DIM;
  ctx.fillRect(-half * 0.72, high * 0.33, half * 1.44, 0.6);
  ctx.globalAlpha = 1;

  // The bumper: black, full width, with a vent across it, and the plate in the
  // middle. The outer ends of it are the arch extensions.
  ctx.fillStyle = "#18181b";
  const bumper = new Path2D();
  bumper.rect(-half, SILL * 0.5, half * 2, high * 0.28);
  ctx.fill(bumper);
  ctx.stroke(bumper);
  ctx.fillStyle = "#0a0a0b";
  ctx.fillRect(-half * 0.66, SILL * 0.8, half * 1.32, high * 0.14);
  ctx.fillStyle = "#e2e8f0";
  const plate = new Path2D();
  plate.rect(-3, SILL * 1.6, 6, high * 0.13);
  ctx.fill(plate);
  ctx.stroke(plate);
}

/**
 * The glasshouse from the side, which on this vehicle is the whole silhouette.
 *
 * @param ctx - what to paint on, the road along the bottom
 * @param job - which wall of which vehicle, and how big
 * @remarks
 * **One line up and one line down.** Every other car here is a body with a
 * greenhouse standing on it and a kink between the two; this one is a single
 * wedge from bumper to bumper, and the picture is drawn that way: the shell is
 * a trapezoid whose sloping ends are the front and the back of the vehicle,
 * and the glass is a band that follows the top of it - windscreen, side
 * windows and rear screen in one piece, because on the road they are one
 * piece. What is left below the band on either slope is steel: the bonnet at
 * the front, the tailgate at the back.
 */
function cyberGlass(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const skin = job.police ? POLICE_PAINT : job.paint;
  const tiers = tiersOf(job.body);
  const rake = tiers.rake;
  const back = tiers.rakeBack ?? rake * BACK_RAKE;

  const shell = new Path2D();
  shell.moveTo(-half, 0);
  shell.lineTo(-half + back, high);
  shell.lineTo(half - rake, high);
  shell.lineTo(half, 0);
  shell.closePath();
  ctx.fillStyle = skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  // The glass, laid along the top of the wedge: its lower edge is a straight
  // cut at {@link GLASS_FOOT}, and its two ends sit on the two slopes.
  const foot = high * GLASS_FOOT;
  const ahead = half - rake * GLASS_FOOT;
  const behind = -half + back * GLASS_FOOT;
  ctx.fillStyle = GLASS;
  ctx.lineWidth = PEN * 0.5;
  const glass = new Path2D();
  glass.moveTo(behind + 0.6, foot);
  glass.lineTo(-half + back + 0.9, high - 0.8);
  glass.lineTo(half - rake - 0.9, high - 0.8);
  glass.lineTo(ahead - 0.6, foot);
  ctx.fill(glass);
  ctx.stroke(glass);

  // Two pillars in it, and the black rail along the flat part of the roof.
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = PEN * 0.6;
  ctx.beginPath();
  for (const seam of [half - rake - 0.9, -half + back + 0.9]) {
    ctx.moveTo(seam, high - 0.9);
    ctx.lineTo(seam + Math.sign(seam) * 1.4, foot + 0.4);
  }
  ctx.stroke();
  ctx.fillStyle = "#18181b";
  ctx.fillRect(-half + back, high - 0.9, half * 2 - back - rake, 0.9);

  // The seam across the steel below the glass, front and back: the shut line
  // of the bonnet at one end and of the tailgate at the other.
  ctx.strokeStyle = shade(skin);
  ctx.lineWidth = PEN * 0.6;
  ctx.beginPath();
  ctx.moveTo(ahead - 0.4, foot - 0.6);
  ctx.lineTo(half - rake * CYBER_SHUT, high * CYBER_SHUT);
  ctx.moveTo(behind + 0.4, foot - 0.6);
  ctx.lineTo(-half + back * CYBER_SHUT, high * CYBER_SHUT);
  ctx.stroke();
  ctx.strokeStyle = INK;

  // The mirror, on the A pillar where the slope meets the doors.
  ctx.fillStyle = "#18181b";
  ctx.fillRect(half - rake * MIRROR_UP - 1.3, high * MIRROR_UP - 0.5, 2.6, 1.1);
}

/**
 * How far up the wedge the glass starts, as a share of the glasshouse.
 *
 * @remarks
 * The band above this is window and the wedge below it is steel. Under a half,
 * because the bonnet of this thing is a good deal more of that front slope
 * than the windscreen is.
 */
const GLASS_FOOT = 0.45;

/** Where the shut line under the glass ends, as a share of the same. */
const CYBER_SHUT = 0.16;

/** How far up the front slope the mirror sits, the same way. */
const MIRROR_UP = 0.3;

/**
 * The windscreen at the nose, and the tailgate at the back.
 *
 * @remarks
 * **Not the same wall twice.** The front of the cabin is a windscreen and
 * almost nothing else. The back of it is a tailgate: a sheet of steel with a
 * band of glass along the top of it, which is what one sees of a closed truck
 * from behind - and it is drawn on a wall that leans, because the roof comes
 * down to meet it.
 */
function cyberScreen(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const nose = job.face === "nose";
  const skin = job.police ? POLICE_PAINT : job.paint;

  const shell = new Path2D();
  shell.rect(-half, 0, half * 2, high);
  ctx.fillStyle = skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  ctx.fillStyle = GLASS;
  ctx.lineWidth = PEN * 0.5;
  const glass = new Path2D();
  if (nose) {
    // **The front is not all windscreen either.** This wall leans back the
    // whole length of the bonnet now, so the bottom of it is the bonnet and
    // only the top of it is glass - the same split the back has, cut at the
    // same height, because it is the same line on the other side of the roof.
    glass.rect(-half + 0.6, high * TAILGATE, half * 2 - 1.2, high * 0.46);
  } else {
    glass.rect(-half + 1.4, high * TAILGATE, half * 2 - 2.8, high * 0.42);
  }
  ctx.fill(glass);
  ctx.stroke(glass);
  if (!nose) {
    // The seam across the tailgate, and the handle in the middle of it.
    ctx.strokeStyle = shade(skin);
    ctx.lineWidth = PEN * 0.6;
    ctx.beginPath();
    ctx.moveTo(-half + 1.4, high * TAILGATE * 0.5);
    ctx.lineTo(half - 1.4, high * TAILGATE * 0.5);
    ctx.stroke();
    ctx.fillStyle = "#18181b";
    ctx.fillRect(-2.4, high * TAILGATE * 0.72, 4.8, 0.7);
    ctx.strokeStyle = INK;
  }
  // The black band along the top, which is the roof edge seen end on.
  ctx.fillStyle = "#18181b";
  ctx.fillRect(-half, high - 1, half * 2, 1);
}

/** How far up the tailgate its window starts, as a share of the glasshouse. */
const TAILGATE = 0.5;

/**
 * The Cybertruck from above: bonnet, cabin, and an open bed behind it.
 *
 * @param ctx - what to paint on, the nose to the east
 * @param paint - the colour of the bodywork
 */
function paintCyber(ctx: CanvasRenderingContext2D, paint: string): void {
  const shape = VEHICLES.suv;
  const long = shape.length / 2;
  const wide = shape.width / 2;
  const tiers = TIERS.suv;

  const shell = pathOf(bodyOutline("suv"));
  ctx.fillStyle = paint;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  // **One shape, closed.** The cabin outline now runs all the way to the tail,
  // so from above there is no open bed to draw - there is a roof, and behind
  // where the roof stops there is the back slope going down to the tailgate.
  const roof = pathOf(cabinOutline("suv"));
  ctx.fillStyle = shade(paint);
  ctx.lineWidth = PEN;
  ctx.fill(roof);
  ctx.stroke(roof);
  // Where the roof ends and the slope begins, and two panel lines down it.
  const fold = tiers.cabinBack + (tiers.rakeBack ?? 0);
  ctx.strokeStyle = shade(shade(paint));
  ctx.lineWidth = PEN * 0.8;
  ctx.beginPath();
  ctx.moveTo(fold, -wide * 0.84);
  ctx.lineTo(fold, wide * 0.84);
  ctx.stroke();
  ctx.lineWidth = PEN * 0.5;
  ctx.beginPath();
  for (const seam of [0.4, 0.72]) {
    const at = fold + (tiers.cabinBack - fold) * seam;
    ctx.moveTo(at, -wide * 0.78);
    ctx.lineTo(at, wide * 0.78);
  }
  ctx.stroke();
  ctx.strokeStyle = INK;

  // The seam down the middle of the bonnet, and the light bars at both ends,
  // which from above are the leading and trailing edge of the whole vehicle.
  ctx.strokeStyle = shade(paint);
  ctx.lineWidth = PEN * 0.8;
  ctx.beginPath();
  ctx.moveTo(long - 1, 0);
  ctx.lineTo(tiers.cabinFront + 1, 0);
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.4;
  ctx.fillStyle = LAMP;
  const nose = new Path2D();
  nose.rect(long - 1.4, -wide * 0.86, 1.2, wide * 1.72);
  ctx.fill(nose);
  ctx.stroke(nose);
  ctx.fillStyle = TAIL;
  const tail = new Path2D();
  tail.rect(-long + 0.2, -wide * 0.9, 1.2, wide * 1.8);
  ctx.fill(tail);
  ctx.stroke(tail);
  ctx.fillStyle = "#18181b";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.6;
  for (const side of [-1, 1]) {
    const mirror = new Path2D();
    mirror.rect(tiers.cabinFront - 1.2, side * (wide - 2.2) - 0.6, 3, 1.2);
    ctx.fill(mirror);
    ctx.stroke(mirror);
  }
}

/** How big a wheel is, as a share of the height of the bodyside. */
const CYBER_TYRE = 0.46;

/** And how far from the middle each axle sits, as a share of half the length. */
const CYBER_AXLE = 0.66;

/** How much of the bodyside the darker lower panel takes. */
const CYBER_SPLIT = 0.3;

/** How far the face draws in towards the bonnet line, as a share of the width. */
const CYBER_TAPER = 0.9;

/** How bright the lower light strip is against the bar above it. */
const CYBER_DIM = 0.55;

/**
 * The DMC-12, from the side and from the ends.
 *
 * @remarks
 * Its own set of walls rather than the saloon with different numbers, because
 * three things about this car are not a saloon at all: the black band that runs
 * round the whole lower body, the single long door whose cut goes up **over**
 * the roof - that is what a gullwing is, and from the side it is the only way
 * to show one - and a windscreen that lies down rather than standing up.
 */
function dmcWall(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const flank = job.face === "flank";
  if (job.upper && flank) {
    dmcGlassFlank(ctx, job);
  } else if (job.upper) {
    dmcGlassEnd(ctx, job);
  } else if (flank) {
    dmcFlank(ctx, job);
  } else {
    dmcEnd(ctx, job);
  }
}

/** The long side: steel above, black below, one very large door. */
function dmcFlank(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const long = job.span / 2;
  const high = job.high;
  const tyre = high * 0.42;
  const axle = long * 0.62;

  const shell = new Path2D();
  shell.moveTo(-long, SILL);
  shell.lineTo(-long, high - 0.8);
  shell.quadraticCurveTo(-long, high, -long + 1, high);
  shell.lineTo(long - 2.6, high);
  // The nose drops away: a wedge, not a bonnet.
  shell.lineTo(long, high - 1.8);
  shell.lineTo(long, SILL);
  shell.closePath();
  ctx.fillStyle = STEEL;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  // The black band along the whole lower body - the one thing everybody
  // remembers about the car after the doors.
  ctx.fillStyle = "#18181b";
  ctx.fillRect(-long, SILL, long * 2, high * 0.34);

  // The wheel arches, and the wheels in them.
  for (const at of [axle, -axle]) {
    const arch = new Path2D();
    arch.moveTo(at - tyre - 0.6, 0);
    arch.lineTo(at - tyre - 0.6, tyre * 0.5);
    arch.quadraticCurveTo(at, tyre * 2.2, at + tyre + 0.6, tyre * 0.5);
    arch.lineTo(at + tyre + 0.6, 0);
    arch.closePath();
    ctx.fillStyle = "#0f172a";
    ctx.lineWidth = PEN * 0.7;
    ctx.fill(arch);
    ctx.stroke(arch);
    wheelAt(ctx, at, tyre, wheelTurn(job, at));
  }

  // The door: one cut, from the sill up and over the top edge, because the
  // hinge is on the roof. The little bulge at the top is where it swings.
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.6;
  const door = new Path2D();
  door.moveTo(long * 0.34, SILL);
  door.lineTo(long * 0.3, high * 0.62);
  door.quadraticCurveTo(long * 0.24, high, long * 0.02, high);
  door.lineTo(-long * 0.42, high);
  door.quadraticCurveTo(-long * 0.5, high * 0.7, -long * 0.46, SILL);
  ctx.stroke(door);
  // The handle, which on this car sits high and flat.
  ctx.fillStyle = RIM;
  ctx.fillRect(-long * 0.12, high * 0.64, 2.2, 0.7);

  // And the slats over the engine, at the back.
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = PEN * 0.5;
  ctx.beginPath();
  for (let at = -long * 0.92; at < -long * 0.6; at += 1.1) {
    ctx.moveTo(at, high * 0.45);
    ctx.lineTo(at, high - 0.4);
  }
  ctx.stroke();

  // A bumper at each end, black like the band.
  ctx.fillStyle = "#18181b";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  for (const side of [-1, 1]) {
    const bumper = new Path2D();
    bumper.roundRect(
      side === 1 ? long - 1.8 : -long,
      SILL * 0.5,
      1.8,
      high * 0.36,
      0.5,
    );
    ctx.fill(bumper);
    ctx.stroke(bumper);
  }
}

/** The nose or the tail: wide, low, and black along the bottom. */
function dmcEnd(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const nose = job.face === "nose";
  const tyre = high * 0.42;

  ctx.fillStyle = RUBBER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  for (const side of [-1, 1]) {
    const wheel = new Path2D();
    wheel.rect(side * (half - 1.6) - 0.9, 0, 1.8, tyre * 1.5);
    ctx.fill(wheel);
    ctx.stroke(wheel);
  }

  const shell = new Path2D();
  shell.moveTo(-half, SILL);
  shell.lineTo(-half, high - 1);
  shell.quadraticCurveTo(-half, high, -half + 1, high);
  shell.lineTo(half - 1, high);
  shell.quadraticCurveTo(half, high, half, high - 1);
  shell.lineTo(half, SILL);
  shell.closePath();
  ctx.fillStyle = STEEL;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  // The black bumper across the bottom, and the lamps above it.
  ctx.fillStyle = "#18181b";
  ctx.fillRect(-half, SILL, half * 2, high * 0.42);
  ctx.fillStyle = nose ? LAMP : TAIL;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.6;
  for (const side of [-1, 1]) {
    const lamp = new Path2D();
    lamp.roundRect(side * half * 0.55 - 1.6, high * 0.5, 3.2, high * 0.3, 0.4);
    ctx.fill(lamp);
    ctx.stroke(lamp);
  }
}

/** The glasshouse from the side: long, low, and lying down at the front. */
function dmcGlassFlank(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;

  const shell = new Path2D();
  // The windscreen lies almost flat; the rear window drops away just as far.
  shell.moveTo(-half, 0);
  shell.lineTo(-half + 2.6, high);
  shell.lineTo(half - 5.4, high);
  shell.lineTo(half, 0);
  shell.closePath();
  ctx.fillStyle = STEEL;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  // One side window, with the black pillar behind it.
  ctx.fillStyle = GLASS;
  ctx.lineWidth = PEN * 0.5;
  const pane = new Path2D();
  pane.moveTo(-half + 2.9, 0.4);
  pane.lineTo(-half + 4.2, high - 0.5);
  pane.lineTo(half - 5.8, high - 0.5);
  pane.lineTo(half - 1.4, 0.4);
  pane.closePath();
  ctx.fill(pane);
  ctx.stroke(pane);
  // The roof seam of the gullwing: the cut runs along the top of the cabin.
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.5;
  ctx.beginPath();
  ctx.moveTo(-half + 2.8, high - 0.3);
  ctx.lineTo(half - 5.6, high - 0.3);
  ctx.stroke();
}

/** The windscreen head on: nearly the whole width, and nearly lying down. */
function dmcGlassEnd(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;

  const shell = new Path2D();
  shell.moveTo(-half, 0);
  shell.lineTo(-half + 0.5, high);
  shell.lineTo(half - 0.5, high);
  shell.lineTo(half, 0);
  shell.closePath();
  ctx.fillStyle = STEEL;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  const glass = new Path2D();
  glass.moveTo(-half + 0.8, 0.4);
  glass.lineTo(-half + 1.2, high - 0.6);
  glass.lineTo(half - 1.2, high - 0.6);
  glass.lineTo(half - 0.8, 0.4);
  glass.closePath();
  ctx.fillStyle = GLASS;
  ctx.lineWidth = PEN * 0.5;
  ctx.fill(glass);
  ctx.stroke(glass);
  if (job.face === "tail") {
    // The louvres over the rear window, which is what one actually sees of the
    // back of this car.
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = PEN * 0.7;
    ctx.beginPath();
    for (let at = 0.6; at < high - 0.6; at += 0.9) {
      ctx.moveTo(-half + 1, at);
      ctx.lineTo(half - 1, at);
    }
    ctx.stroke();
  }
}

/** A car from the side: wheels and doors below, glass above. */
function carWall(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const flank = job.face === "flank";
  if (job.upper && flank) {
    cabinFlank(ctx, job);
  } else if (job.upper) {
    cabinEnd(ctx, job);
  } else if (flank) {
    carFlank(ctx, job);
  } else {
    carEnd(ctx, job);
  }
}

/**
 * The long side of a car, from the sill up to the window line.
 *
 * @remarks
 * The wheels are the point of the whole exercise. They are round, they sit in
 * an arch cut out of the bodywork, and they touch the road - which is what a
 * car has and a crate has not.
 */
function carFlank(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const long = job.span / 2;
  const high = job.high;
  const skin = job.police ? POLICE_PAINT : job.paint;
  // The same six and a bit pixels the picture from above now draws, so that a
  // wheel is the same wheel whichever side of the car one is looking at.
  const tyre = high * (job.body === "suv" ? 0.44 : 0.4);
  const axle = long * 0.6;

  const shell = new Path2D();
  shell.moveTo(-long, SILL);
  shell.lineTo(-long, high - 1);
  shell.quadraticCurveTo(-long, high, -long + 1.2, high);
  shell.lineTo(long - 1.6, high);
  shell.quadraticCurveTo(long, high, long, high - 1.4);
  shell.lineTo(long, SILL);
  shell.closePath();
  ctx.fillStyle = skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  if (job.police) {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-long * 0.45, SILL, long * 0.9, high - SILL);
  } else if (job.body === "taxi") {
    ctx.fillStyle = "#0f172a";
    for (let at = -long * 0.5; at < long * 0.5; at += 3.2) {
      ctx.fillRect(at, high - 2.6, 1.6, 1.6);
    }
  }

  // The sill along the bottom, then an arch and a wheel at each axle. Both of
  // them stop short of the road: **the tyre is the only thing that touches the
  // ground**. They used to run down to it, which put a black line along the
  // bottom of the car and under each wheel - and a tyre with a dark band across
  // its contact patch is a tyre with no air in it.
  ctx.fillStyle = shade(skin);
  ctx.fillRect(-axle, SILL, axle * 2, SILL);
  for (const at of [axle, -axle]) {
    const arch = new Path2D();
    arch.moveTo(at - tyre - 1.4, tyre * 0.3);
    arch.lineTo(at - tyre - 1.4, tyre * 0.9);
    arch.quadraticCurveTo(at, tyre * 3.1, at + tyre + 1.4, tyre * 0.9);
    arch.lineTo(at + tyre + 1.4, tyre * 0.3);
    arch.closePath();
    ctx.fillStyle = "#0f172a";
    ctx.lineWidth = PEN * 0.7;
    ctx.fill(arch);
    ctx.stroke(arch);
    wheelAt(ctx, at, tyre, wheelTurn(job, at));
  }

  // A bumper at each end, door seams, and a handle on each door.
  ctx.fillStyle = TRIM;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  for (const side of [-1, 1]) {
    const bumper = new Path2D();
    bumper.roundRect(
      side === 1 ? long - 2.2 : -long,
      SILL * 0.6,
      2.2,
      high * 0.42,
      0.6,
    );
    ctx.fill(bumper);
    ctx.stroke(bumper);
  }
  ctx.lineWidth = PEN * 0.5;
  ctx.beginPath();
  for (const seam of [-long * 0.44, long * 0.04, long * 0.42]) {
    ctx.moveTo(seam, SILL + 0.4);
    ctx.lineTo(seam, high);
  }
  ctx.stroke();
  ctx.fillStyle = RIM;
  for (const grip of [-long * 0.24, long * 0.18]) {
    ctx.fillRect(grip, high - 1.8, 2, 0.7);
  }
}

/** How far the back window leans, against the windscreen. */
const BACK_RAKE = 0.55;

/**
 * And the ones whose back window leans somewhere else.
 *
 * @remarks
 * The estate is the reason this table exists. A hatchback's tailgate lies over
 * at better than half the angle of its own windscreen; an estate's is close to
 * upright, and drawn at the hatchback's angle the patrol car reads as a large
 * Golf rather than as a Kombi.
 */
const BACK_RAKE_OF: Readonly<Partial<Record<VehicleBody, number>>> = {
  patrol: 0.22,
  taxi: 0.22,
};

/**
 * Which wall each edge of an outline is.
 *
 * @param outline - the corners in car-local pixels, nose to the east
 * @returns one entry per edge: which wall it is, whether its picture goes on
 *   mirrored, and which slice of that picture it covers
 * @remarks
 * Read off the shape rather than counted off in order, because an outline may
 * now have four corners or twelve. An edge whose outward side faces more along
 * the car than across it is an end; otherwise it is a flank. There is no third
 * answer - see the note in the body about what the corners used to look like.
 */
export function wallFaces(outline: readonly Vec[]): readonly VehicleSide[] {
  const xs = outline.map((point) => point.x);
  const ys = outline.map((point) => point.y);
  const west = Math.min(...xs);
  const east = Math.max(...xs);
  const north = Math.min(...ys);
  const south = Math.max(...ys);
  return outline.map((from, at) => {
    const to = outline[(at + 1) % outline.length] ?? from;
    // The outward normal of an edge on a shape wound this way round.
    const outX = to.y - from.y;
    const outY = from.x - to.x;
    const along = Math.abs(outX);
    const across = Math.abs(outY);
    // **Every edge gets a picture**, even the chamfers at the corners, which
    // point neither one way nor the other. They used to get the colour of the
    // bodywork instead, on the grounds that a whole flank squeezed into two
    // pixels is a smear - but an edge takes only its own slice of a picture
    // now, so a chamfer can carry the slice of whichever wall it faces more
    // nearly. Left flat it was worse than a smear: on a car with stripes down
    // its side the corners came out as bare grey slivers with the livery
    // stopping dead on both sides of them.
    const face: VehicleFace | null =
      along >= across ? (outX > 0 ? "nose" : "tail") : "flank";
    const one = shareAt(from, face, { west, east, north, south });
    const other = shareAt(to, face, { west, east, north, south });
    return {
      face,
      // The flank pictures are drawn nose to the right, so the one whose edge
      // runs the other way round gets its picture mirrored.
      flip: other < one,
      start: Math.min(one, other),
      end: Math.max(one, other),
    };
  });
}

/** How far an outline reaches each way, before the vehicle is turned. */
type Bounds = {
  /** The tail, and the left edge of a flank picture. */
  readonly west: number;
  /** The nose, and its right edge. */
  readonly east: number;
  /** One side of the vehicle, and the left edge of an end picture. */
  readonly north: number;
  /** And the other side. */
  readonly south: number;
};

/**
 * How far along its wall's picture one corner of the outline lies.
 *
 * @param point - the corner, before the vehicle is turned
 * @param face - which wall the edge belongs to
 * @param bounds - how far the whole outline reaches, which is what the picture
 *   was drawn for
 * @returns where it sits across that picture, nought to one
 * @remarks
 * A wall picture is drawn for the **whole** length or width of the vehicle, and
 * an outline has twelve corners rather than four: every corner of the box is
 * chamfered off, so between the two long flanks there are four short slivers
 * facing the same way the flanks do. Laying the whole picture on each of them -
 * which is what happens when an edge is only ever asked which wall it is -
 * squeezes a car's worth of doors, wheels and bumpers into two or three pixels,
 * and what comes out is a black bar standing on the road at each end of every
 * vehicle seen from the side. So an edge is asked **which part** of the wall it
 * is as well, and takes that slice of the picture and no more.
 */
function shareAt(point: Vec, face: VehicleFace | null, bounds: Bounds): number {
  const long = bounds.east - bounds.west;
  const wide = bounds.south - bounds.north;
  let share: number;
  if (face === "flank" && long > 0) {
    share = (point.x - bounds.west) / long;
  } else if (face === "nose" && wide > 0) {
    share = (point.y - bounds.north) / wide;
  } else if (face === "tail" && wide > 0) {
    share = (bounds.south - point.y) / wide;
  } else {
    share = 0;
  }
  return share;
}

/** One edge of an outline: which wall it is, and how much of that wall. */
export type VehicleSide = {
  /** Which wall, or null for a bevel between two of them. */
  readonly face: VehicleFace | null;
  /**
   * Whether the picture goes on mirrored.
   *
   * @remarks
   * Both flanks share one picture, drawn with the nose to the right. On one
   * side of the car the edge runs the other way round, so there the picture is
   * flipped. Which side that is cannot be read off the corner number any more -
   * an outline may have four corners or twelve - so it is worked out from the
   * outline itself, before it is turned and put on the road.
   */
  readonly flip: boolean;
  /** Where this edge starts across the wall's picture, nought to one. */
  readonly start: number;
  /** And where it ends. */
  readonly end: number;
};

/**
 * A closed path through a set of points.
 *
 * @param points - the corners, in order
 * @returns the path
 */
function pathOf(points: readonly Vec[]): Path2D {
  const path = new Path2D();
  points.forEach((point, at) => {
    if (at === 0) {
      path.moveTo(point.x, point.y);
    } else {
      path.lineTo(point.x, point.y);
    }
  });
  path.closePath();
  return path;
}

/** One wheel, seen from the side: a tyre with a rim in it. */
function wheelAt(
  ctx: CanvasRenderingContext2D,
  at: number,
  tyre: number,
  spin: number,
  fancy = false,
): void {
  const wheel = new Path2D();
  wheel.ellipse(at, tyre, tyre, tyre, 0, 0, Math.PI * 2);
  ctx.fillStyle = RUBBER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(wheel);
  ctx.stroke(wheel);

  // The well between the spokes, which is the dark one sees through.
  const rim = tyre * WHEEL_RIM;
  const well = new Path2D();
  well.ellipse(at, tyre, rim, rim, 0, 0, Math.PI * 2);
  // Machined and dark behind the spokes on the good one, plain grey on the
  // rest: a two-tone alloy is the other half of what one is paying for.
  ctx.fillStyle = fancy ? "#0b1120" : "#1f2937";
  ctx.fill(well);
  if (fancy) {
    // **The caliper.** At three pixels of rim there is one thing that says
    // sports wheel louder than any number of spokes, and it is a red brake
    // caliper showing through them. It stands still while the wheel turns,
    // because that is what a caliper does.
    ctx.fillStyle = SPORT_CALIPER;
    const grip = new Path2D();
    grip.roundRect(
      at - rim * 0.86,
      tyre - rim * 0.3,
      rim * 0.34,
      rim * 0.6,
      0.3,
    );
    ctx.fill(grip);
  }

  // The spokes, and the flange they all end on - or, when the wheel is going
  // too fast for either to be seen, the smear they turn into.
  ctx.strokeStyle = RIM;
  if (spin === WHEEL_SMEAR) {
    ctx.fillStyle = "#64748b";
    const smear = new Path2D();
    smear.ellipse(at, tyre, rim * 0.78, rim * 0.78, 0, 0, Math.PI * 2);
    ctx.fill(smear);
  } else {
    // **The one with the good wheels.** Five spokes split into ten thin ones,
    // reaching further out and drawn in a brighter silver over a nearly black
    // well - which at this size is the whole difference between a steel wheel
    // with a cover on it and an alloy somebody paid for.
    const arms = fancy ? WHEEL_SPOKES * 2 : WHEEL_SPOKES;
    ctx.strokeStyle = fancy ? SPORT_SPOKE : RIM;
    ctx.lineWidth = rim * (fancy ? 0.13 : 0.3);
    ctx.beginPath();
    for (let spoke = 0; spoke < arms; spoke += 1) {
      // **Minus**, not plus. A flank picture is drawn nose to the right, so a
      // car going forward is going right, and a wheel rolling to the right
      // turns clockwise - which in this picture, drawn with the road along
      // the bottom and height going up, is the way angles count down.
      const turn =
        ((spoke - spin / WHEEL_STEPS) * Math.PI * 2) / arms + WHEEL_TURN;
      // Twin spokes sit either side of the line they share, which is what
      // makes five of them look like ten and ten look like an alloy.
      const lean = fancy ? (spoke % 2 === 0 ? 1 : -1) * rim * 0.16 : 0;
      ctx.moveTo(
        at + Math.cos(turn) * rim * 0.24 + lean * Math.sin(turn),
        tyre + Math.sin(turn) * rim * 0.24 - lean * Math.cos(turn),
      );
      ctx.lineTo(
        at + Math.cos(turn) * rim * (fancy ? 0.98 : 0.92),
        tyre + Math.sin(turn) * rim * (fancy ? 0.98 : 0.92),
      );
    }
    ctx.stroke();
  }
  // The flange the spokes end on - a polished lip on the good one, and set a
  // little further out, because a wheel that fills its tyre looks bigger than
  // one that sits inside it.
  ctx.strokeStyle = fancy ? SPORT_LIP : RIM;
  ctx.lineWidth = rim * (fancy ? 0.16 : 0.22);
  ctx.beginPath();
  ctx.ellipse(
    at,
    tyre,
    rim * (fancy ? 0.98 : 0.9),
    rim * (fancy ? 0.98 : 0.9),
    0,
    0,
    Math.PI * 2,
  );
  ctx.stroke();

  const nut = new Path2D();
  nut.ellipse(at, tyre, rim * 0.32, rim * 0.32, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#cbd5e1";
  ctx.fill(nut);
}

/** What a sports spoke is polished to. */
const SPORT_SPOKE = "#e2e8f0";

/** And the lip round the outside of it. */
const SPORT_LIP = "#f1f5f9";

/** The one thing behind a sports wheel that is not grey. */
const SPORT_CALIPER = "#dc2626";

/**
 * How far out the alloy reaches, as a share of the whole wheel's radius.
 *
 * @remarks
 * Measured off the mesh: the spoke ends and the flange sit at seven tenths of
 * the way out, which is an eighteen inch wheel in a tyre 680 millimetres
 * across. Drawn the other way about - a small silver hub in a black disc -
 * every car in the city rolled on solid rubber.
 */
const WHEEL_RIM = 0.7;

/** How many spokes it has. */
const WHEEL_SPOKES = 5;

/** And how far round they start, so that none of them stands straight up. */
const WHEEL_TURN = 0.35;

/**
 * How many pictures there are of a wheel turning, over one spoke.
 *
 * @remarks
 * Over **one spoke**, not one turn: five spokes all look alike, so a wheel is
 * back to where it started every seventy-two degrees and there is nothing to
 * be gained by drawing the other four fifths of the circle.
 */
export const WHEEL_STEPS = 6;

/** The picture of a wheel going too fast to have spokes at all. */
export const WHEEL_SMEAR = -1;

/**
 * Which picture of a turning wheel a vehicle should be drawn with.
 *
 * @param body - which sort of vehicle, for the size of its tyre
 * @param rolled - how far it has rolled, in pixels, reverse counting backwards
 * @param speed - what it is doing now, in pixels a second
 * @returns a step from nought to {@link WHEEL_STEPS} - 1, or
 *   {@link WHEEL_SMEAR}
 * @remarks
 * **A wheel here is six pixels across.** It turns once every nineteen pixels
 * of road, so at the speed ordinary traffic moves it is doing six turns a
 * second - thirty-six degrees between one frame and the next, against a spoke
 * pattern that repeats every seventy-two. Drawn true, every wheel in the city
 * would sit exactly on the edge of the wagon-wheel illusion: half of them
 * rolling backwards, the rest standing still. That is what the eye does with a
 * real wheel through a cine camera, and it is not what one wants to look at
 * all day.
 *
 * So the drawn wheel is **geared down** by {@link WHEEL_GEAR}: a third of the
 * true angle, which puts twelve degrees between frames at traffic speed and
 * leaves the turn readable, going the right way, and proportional to the
 * speed - faster car, faster wheel, and backwards in reverse. Past
 * {@link WHEEL_FAST} even that outruns the eye, and the spokes give way to the
 * grey smear a fast wheel actually is. Both halves of that are what a game
 * engine does with wheels too small to animate honestly.
 */
export function wheelStep(
  body: VehicleBody,
  rolled: number,
  speed: number,
): number {
  const radius = TIERS[body].belt * (TYRE_SHARE[body] ?? TYRE_ANY);
  let step: number;
  if (Math.abs(speed) >= WHEEL_FAST || radius <= 0) {
    step = WHEEL_SMEAR;
  } else {
    // One spoke round, in radians, and where in that this wheel stands.
    const spoke = (Math.PI * 2) / WHEEL_SPOKES;
    const turned = ((rolled * WHEEL_GEAR) / radius) % spoke;
    const within = (turned + spoke) % spoke;
    step = Math.min(
      WHEEL_STEPS - 1,
      Math.floor((within / spoke) * WHEEL_STEPS),
    );
  }
  return step;
}

/**
 * Which picture the wheel at one end of a vehicle turns to.
 *
 * @param job - which wall is being painted, and how fast it is going
 * @param at - where along the car this axle sits, the nose being positive
 * @returns the step to draw that wheel at
 * @remarks
 * The whole of what the handbrake does to the picture. It works on the **back
 * wheels only**, so with it pulled the back pair stand still while the front
 * pair go on rolling - and that, from the side, is the difference between a
 * car slowing down and a car being thrown round a corner on the handbrake.
 * The skid marks under it come from somewhere else entirely.
 *
 * A locked wheel is drawn at a fixed step rather than the one it happened to
 * stop at, which is a lie worth six pixels: what one reads at this size is
 * that it is not turning, never which spoke is upright.
 */
function wheelTurn(job: WallJob, at: number): number {
  return job.held && at < 0 ? WHEEL_HELD : job.spin;
}

/** Where a wheel that is not turning at all stands. */
const WHEEL_HELD = 0;

/** How much of a wheel's true turn gets drawn. */
const WHEEL_GEAR = 1 / 3;

/**
 * Above this, in pixels a second, there are no spokes left to see.
 *
 * @remarks
 * Traffic runs at 110 and the player tops out well over 400, so this is set
 * where brisk driving still shows a turning wheel and only real speed smears
 * it - which is also where the geared-down turn would start to alias.
 */
const WHEEL_FAST = 230;

/** How big a tyre is on each vehicle, as a share of its bodyside. */
const TYRE_SHARE: Readonly<Partial<Record<VehicleBody, number>>> = {
  car: GOLF_TYRE,
  patrol: GOLF_TYRE,
  taxi: GOLF_TYRE,
  corsa: GOLF_TYRE,
  corsaelegance: GOLF_TYRE,
  corsaultimate: GOLF_TYRE,
  // A motorbike wheel is enormous next to a car s: nearly two thirds of the
  // height of the machine, which is why it turns so much more slowly.
  bike: 0.62,
  patrolbike: 0.62,
  suv: CYBER_TYRE,
};

/** And what everything else runs on. */
const TYRE_ANY = 0.4;

/** The nose or the tail of a car: bumper, plate, lights, and a grille. */
function carEnd(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const nose = job.face === "nose";
  const skin = job.police ? POLICE_PAINT : job.paint;
  const tyre = high * 0.4;

  ctx.fillStyle = RUBBER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  for (const side of [-1, 1]) {
    const wheel = new Path2D();
    wheel.roundRect(side * (half - 0.6) - 1.4, 0, 2.8, tyre * 1.7, 0.6);
    ctx.fill(wheel);
    ctx.stroke(wheel);
  }

  const shell = new Path2D();
  shell.roundRect(-half, SILL, half * 2, high - SILL, 1.6);
  ctx.fillStyle = skin;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  ctx.fillStyle = TRIM;
  ctx.lineWidth = PEN * 0.7;
  const bumper = new Path2D();
  bumper.roundRect(-half * 0.96, SILL * 0.5, half * 1.92, high * 0.36, 0.7);
  ctx.fill(bumper);
  ctx.stroke(bumper);
  const plate = new Path2D();
  plate.rect(-2.6, SILL * 0.9, 5.2, high * 0.2);
  ctx.fillStyle = "#e2e8f0";
  ctx.lineWidth = PEN * 0.5;
  ctx.fill(plate);
  ctx.stroke(plate);

  ctx.fillStyle = nose ? LAMP : TAIL;
  ctx.lineWidth = PEN * 0.6;
  for (const side of [-1, 1]) {
    const lamp = new Path2D();
    lamp.roundRect(
      side === 1 ? half - 3.8 : -half + 0.8,
      high * 0.5,
      3,
      high * 0.28,
      0.5,
    );
    ctx.fill(lamp);
    ctx.stroke(lamp);
  }
  if (nose) {
    const grille = new Path2D();
    grille.roundRect(-half * 0.4, high * 0.46, half * 0.8, high * 0.34, 0.6);
    ctx.fillStyle = GLASS;
    ctx.fill(grille);
    ctx.stroke(grille);
  }
}

/**
 * The cabin along the flank: two panes with a pillar between them.
 *
 * @remarks
 * The slants are what say "car" rather than "shed": the windscreen leans back
 * at the front, the rear pillar leans in at the back. Straight sides here look
 * like a delivery van however good the rest of it is.
 */
function cabinFlank(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const skin = job.police ? POLICE_PAINT : job.paint;
  // How far the two screens lean back. The front one is the one anybody
  // notices; the back window of a saloon leans about half as far.
  const rake = tiersOf(job.body).rake;
  const back = rake * BACK_RAKE;

  const shell = new Path2D();
  shell.moveTo(-half, 0);
  shell.lineTo(-half + back, high - 0.8);
  shell.quadraticCurveTo(-half + back + 0.4, high, -half + back + 1.2, high);
  shell.lineTo(half - rake - 1.2, high);
  shell.quadraticCurveTo(half - rake - 0.4, high, half - rake, high - 0.8);
  shell.lineTo(half, 0);
  shell.closePath();
  ctx.fillStyle = skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  ctx.fillStyle = GLASS;
  ctx.lineWidth = PEN * 0.5;
  // Each pane is a four-cornered patch: its bottom edge on the belt line, its
  // top edge pulled back by however far that screen leans.
  const panes = [
    [-half + 0.9, -half + back + 0.9, -0.5, -0.5],
    [0.5, 0.5, half - rake - 1, half - 0.6],
  ];
  for (const pane of panes) {
    const glass = new Path2D();
    glass.moveTo(pane[0], 0.4);
    glass.lineTo(pane[1], high - 1.1);
    glass.lineTo(pane[2], high - 1.1);
    glass.lineTo(pane[3], 0.4);
    glass.closePath();
    ctx.fill(glass);
    ctx.stroke(glass);
  }
}

/** The cabin seen end on: the windscreen, or the rear window. */
function cabinEnd(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const skin = job.police ? POLICE_PAINT : job.paint;

  const shell = new Path2D();
  shell.moveTo(-half, 0);
  shell.lineTo(-half + 0.7, high - 0.7);
  shell.quadraticCurveTo(-half + 1, high, -half + 1.8, high);
  shell.lineTo(half - 1.8, high);
  shell.quadraticCurveTo(half - 1, high, half - 0.7, high - 0.7);
  shell.lineTo(half, 0);
  shell.closePath();
  ctx.fillStyle = skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  const glass = new Path2D();
  glass.moveTo(-half + 1.1, 0.4);
  glass.lineTo(-half + 1.9, high - 1);
  glass.lineTo(half - 1.9, high - 1);
  glass.lineTo(half - 1.1, 0.4);
  glass.closePath();
  ctx.fillStyle = GLASS;
  ctx.lineWidth = PEN * 0.5;
  ctx.fill(glass);
  ctx.stroke(glass);
}

/** A motorbike or a bicycle: the machine below, the rider above. */
function rideWall(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const flank = job.face === "flank";
  if (job.upper && flank) {
    riderFlank(ctx, job);
  } else if (job.upper) {
    riderEnd(ctx, job);
  } else if (flank && job.body !== "cycle") {
    patrolBikeFlank(ctx, job);
  } else if (flank) {
    machineFlank(ctx, job);
  } else {
    machineEnd(ctx, job);
  }
}

/**
 * The patrol bike from the side.
 *
 * @param ctx - what to paint on, the road along the bottom
 * @param job - which wall of which vehicle, and how big
 * @remarks
 * A tourer's profile, which is nothing like the naked bike's: a fairing that
 * rises into a screen at the front, a body with the same three bands the car
 * wears, and a pannier standing out over the back wheel.
 */
function patrolBikeFlank(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const tyre = high * 0.62;
  const axle = half - tyre - 0.8;
  const skin = job.police ? POLICE_PAINT : job.paint;
  const panel = job.police ? POLICE_BLUE : shade(job.paint);

  // **The wheels first and the bodywork high up.** A motorbike from the side
  // is mostly wheel - that is what tells it from a small van - so nothing is
  // painted below the axle line except the engine hanging between them.
  for (const at of [axle, -axle]) {
    bikeWheel(ctx, at, tyre, wheelTurn(job, at));
  }
  // **The engine, and it must not read as rubber.** Black, squat and hung
  // between two black tyres, it closed the gap between them: from the side the
  // machine came out as one long dark mass, which is to say as a single very
  // wide tyre with a fairing on top. So it is metal-coloured, outlined, well
  // clear of the road and short enough to leave daylight either side of it.
  ctx.fillStyle = "#3f3f46";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.6;
  const block = new Path2D();
  block.roundRect(-3.4, tyre * 0.72, 7.4, tyre * 0.62, 0.8);
  ctx.fill(block);
  ctx.stroke(block);

  // **Three steps, not one bar.** The fairing stands tallest at the front, the
  // seat dips behind it and the pannier sits square over the back wheel - that
  // stepped line is the profile of a tourer, and a single stripe from end to
  // end is the profile of a bumper.
  ctx.lineWidth = PEN;
  const seat = new Path2D();
  seat.moveTo(half - 8, high);
  seat.lineTo(-half + 4, high * 0.94);
  seat.lineTo(-half + 4, high * 0.7);
  seat.lineTo(half - 8, high * 0.74);
  seat.closePath();
  ctx.fillStyle = skin;
  ctx.fill(seat);
  ctx.stroke(seat);

  // Curved, not cut: the nose of the fairing runs forward and down into the
  // mudguard rather than stopping at a corner.
  // **The same wedge the plan view has.** Deep where the rider sits behind it
  // and drawn out to a point at the nose, top and bottom edge both closing on
  // it - a fairing that keeps its full depth all the way forward does not
  // match the triangle one sees from above.
  const fairing = new Path2D();
  fairing.moveTo(half - 0.2, high * 0.74);
  fairing.quadraticCurveTo(half - 1.2, high * 0.97, half - 3.2, high);
  fairing.lineTo(half - 9, high);
  fairing.lineTo(half - 9.6, high * 0.56);
  fairing.quadraticCurveTo(half - 5, high * 0.62, half - 0.2, high * 0.74);
  fairing.closePath();
  ctx.fillStyle = panel;
  ctx.fill(fairing);
  ctx.stroke(fairing);
  if (job.police) {
    ctx.save();
    ctx.clip(fairing);
    ctx.fillStyle = POLICE_GLOW;
    ctx.fillRect(half - 12, high * 0.58, 12, high * 0.11);
    ctx.restore();
  }

  // The pannier over the back wheel, and the word on the side of it.
  const box = new Path2D();
  box.roundRect(-half + 0.4, high * 0.5, 8.6, high * 0.46, 0.7);
  ctx.fillStyle = skin;
  ctx.lineWidth = PEN * 0.8;
  ctx.fill(box);
  ctx.stroke(box);
  if (job.police) {
    ctx.fillStyle = POLICE_BLUE;
    ctx.fillRect(-half + 1, high * 0.56, 7.4, high * 0.28);
    ctx.fillStyle = POLICE_GLOW;
    ctx.fillRect(-half + 1, high * 0.86, 7.4, high * 0.08);
    ctx.save();
    ctx.translate(-half + 4.7, high * 0.7);
    ctx.scale(job.mirror ? -1 : 1, -1);
    policeWord(ctx, high * 0.2, "#f8fafc");
    ctx.restore();
  }

  // The screen over the bars, and the blue lamps: one beside the grips and one
  // in the middle of the tail, both of which show from the side.
  ctx.fillStyle = "#cbd5e1";
  ctx.lineWidth = PEN * 0.6;
  const screen = new Path2D();
  screen.moveTo(half - 8.6, high);
  screen.lineTo(half - 7.2, high * 0.72);
  screen.lineTo(half - 5, high * 0.76);
  screen.lineTo(half - 5.4, high);
  screen.closePath();
  ctx.fill(screen);
  ctx.stroke(screen);
  if (job.police) {
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = INK;
    for (const pod of [half - 11.2, -half + 1.6]) {
      const lamp = new Path2D();
      lamp.roundRect(pod, high * 0.8, 2.4, high * 0.16, 0.4);
      ctx.fill(lamp);
      ctx.stroke(lamp);
    }
  }
}

/**
 * The bicycle from the side.
 *
 * @param ctx - what to paint on, the road along the bottom
 * @param job - which wall of which vehicle, and how big
 * @remarks
 * **A bicycle is two wheels and a set of tubes.** Nothing on one is a panel,
 * so nothing here is filled: the frame is the diamond every bicycle has been
 * built round for a hundred and thirty years - seat tube, down tube, top tube
 * and the two stays back to the rear hub - drawn as lines about as thick as
 * the tubes are. Drawn as a slab instead it came out as a grey box with a man
 * sitting in it.
 */
function machineFlank(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const tyre = high * 0.62;
  const axle = half - tyre - 0.6;

  for (const at of [axle, -axle]) {
    cycleWheel(ctx, at, tyre, wheelTurn(job, at));
  }

  // The corners of the diamond: the bracket the pedals turn on, the top of the
  // seat tube, and the head tube the forks hang from.
  const crank = { x: -1.4, y: tyre * 0.5 };
  const seat = { x: -axle * 0.62, y: high };
  const head = { x: axle * 0.66, y: high * 0.92 };
  const stem = { x: axle * 0.78, y: high * 0.62 };

  ctx.strokeStyle = CYCLE_FRAME;
  ctx.lineWidth = CYCLE_TUBE;
  ctx.lineCap = "round";
  ctx.beginPath();
  // The diamond itself.
  ctx.moveTo(crank.x, crank.y);
  ctx.lineTo(seat.x, seat.y);
  ctx.lineTo(head.x, head.y);
  ctx.lineTo(crank.x, crank.y);
  ctx.lineTo(stem.x, stem.y);
  // And the two stays, back to the hub it drives.
  ctx.moveTo(crank.x, crank.y);
  ctx.lineTo(-axle, tyre);
  ctx.lineTo(seat.x, seat.y);
  ctx.stroke();

  // The forks, which are what the front wheel hangs on.
  ctx.lineWidth = CYCLE_TUBE * 0.85;
  ctx.beginPath();
  ctx.moveTo(stem.x, stem.y);
  ctx.lineTo(axle, tyre);
  ctx.moveTo(head.x, head.y);
  ctx.lineTo(stem.x, stem.y);
  ctx.stroke();

  // The chain, slung between the two.
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(crank.x, crank.y - 0.5);
  ctx.lineTo(-axle, tyre - 0.3);
  ctx.moveTo(crank.x, crank.y + 0.5);
  ctx.lineTo(-axle, tyre + 0.3);
  ctx.stroke();

  // The crank and a pedal on the end of it, which turn with the wheels.
  const spin = wheelTurn(job, 0);
  const round = spin === WHEEL_SMEAR ? 0.8 : (spin / WHEEL_STEPS) * Math.PI * 2;
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(crank.x, crank.y);
  ctx.lineTo(
    crank.x + Math.cos(-round) * CYCLE_CRANK,
    crank.y + Math.sin(-round) * CYCLE_CRANK,
  );
  ctx.stroke();
  const ring = new Path2D();
  ring.ellipse(crank.x, crank.y, 1.1, 1.1, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 0.3;
  ctx.stroke(ring);

  // The saddle to sit on, and the bars to hold.
  ctx.fillStyle = "#0f172a";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.5;
  const saddle = new Path2D();
  saddle.roundRect(seat.x - 2, high - 0.5, 4, 1, 0.5);
  ctx.fill(saddle);
  ctx.stroke(saddle);
  const bars = new Path2D();
  bars.roundRect(head.x - 1.6, head.y - 0.4, 3.2, 0.9, 0.4);
  ctx.fill(bars);
  ctx.stroke(bars);
}

/** What a bicycle frame is painted, since every one in the city is the same. */
const CYCLE_FRAME = "#0f766e";

/** How thick its tubes are, in city pixels. */
const CYCLE_TUBE = 0.65;

/** And how long a crank is. */
const CYCLE_CRANK = 1.9;

/**
 * One wheel of a bicycle, seen from the side.
 *
 * @param ctx - what to paint on, the road along the bottom
 * @param at - where along the machine the axle sits
 * @param tyre - the radius of the wheel, in city pixels
 * @param spin - which picture of it to draw, from {@link wheelStep}
 * @remarks
 * **You can see through a bicycle wheel**, and that is the whole of what makes
 * one look like a bicycle wheel rather than like a moped's. It is a thin ring
 * of rubber on a thinner ring of rim, and between that and the hub there is
 * nothing but a couple of dozen wires - so nothing is filled in here at all:
 * the tyre is a **stroked** circle, and what is inside it is whatever happens
 * to be behind the bicycle.
 *
 * The spokes turn with `spin` like every other wheel in the city. There are
 * far more of them on a real one than fit in eight pixels; what is drawn is
 * enough of them to catch the eye as the wheel goes round.
 */
function cycleWheel(
  ctx: CanvasRenderingContext2D,
  at: number,
  tyre: number,
  spin: number,
): void {
  const smeared = spin === WHEEL_SMEAR;
  const turn = smeared
    ? 0
    : ((spin / WHEEL_STEPS) * Math.PI * 2) / CYCLE_SPOKES;
  const rim = tyre - CYCLE_TYRE;
  // The spokes first, so that the rubber and the rim lie over their ends.
  if (smeared) {
    // Too fast to count: the wires blur into a disc one can still see through.
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = rim * 0.9;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(at, tyre, rim * 0.55, rim * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = CYCLE_WIRE;
    ctx.beginPath();
    for (let spoke = 0; spoke < CYCLE_SPOKES; spoke += 1) {
      const way = -turn + (spoke * Math.PI * 2) / CYCLE_SPOKES;
      ctx.moveTo(at, tyre);
      ctx.lineTo(at + Math.cos(way) * rim, tyre + Math.sin(way) * rim);
    }
    ctx.stroke();
  }
  // The rim, and the tyre on it: two rings, neither of them filled.
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = CYCLE_TYRE * 0.5;
  ctx.beginPath();
  ctx.ellipse(at, tyre, rim, rim, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = CYCLE_TYRE;
  ctx.beginPath();
  ctx.ellipse(
    at,
    tyre,
    tyre - CYCLE_TYRE / 2,
    tyre - CYCLE_TYRE / 2,
    0,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  // And the hub, which is the only solid thing in the whole wheel.
  const hub = new Path2D();
  hub.ellipse(at, tyre, tyre * 0.14, tyre * 0.14, 0, 0, Math.PI * 2);
  ctx.fillStyle = RIM;
  ctx.fill(hub);
}

/** How thick a bicycle tyre is, in city pixels. */
const CYCLE_TYRE = 0.7;

/** How thick a spoke is. */
const CYCLE_WIRE = 0.22;

/** And how many of them are drawn, which is fewer than a real wheel has. */
const CYCLE_SPOKES = 9;

/**
 * The machine head on or tail on: one tyre, at the width of a tyre.
 *
 * @param ctx - what to paint on, the road along the bottom
 * @param job - which wall of which vehicle, and how big
 * @remarks
 * **A motorbike coming at you is a tyre with a fairing over it.** The machine
 * is eleven pixels across and its tyre is under three of them, so the whole of
 * this wall is that one narrow upright band down the middle and what stands
 * above it. There used to be a whole wheel drawn side on here instead, which
 * from straight ahead came out as a black slab as wide as the bike - the plan
 * view draws the tyres lying down, so a second one standing up gave the thing
 * four of them, and none of them the width a tyre actually is.
 */
function machineEnd(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const nose = job.face === "nose";
  const bare = job.body === "cycle";
  const panel = job.police ? POLICE_BLUE : shade(job.paint);
  // A back tyre is the fatter of the two, on a bicycle as on a tourer.
  const wide = half * (nose ? 0.24 : 0.3);

  // The tyre: an upright band with a round top, standing on the road.
  const rubber = new Path2D();
  rubber.roundRect(-wide, 0, wide * 2, high * 0.92, wide);
  ctx.fillStyle = RUBBER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.6;
  ctx.fill(rubber);
  ctx.stroke(rubber);
  // Two grooves down it, because that is what tread looks like from in front.
  ctx.strokeStyle = "#33333a";
  ctx.lineWidth = wide * 0.34;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(side * wide * 0.44, high * 0.08);
    ctx.lineTo(side * wide * 0.44, high * 0.8);
  }
  ctx.stroke();

  // Forks at the nose, silencers at the tail: a pair of slim uprights either
  // side of the tyre, which is all there is of a machine at this width.
  ctx.fillStyle = RIM;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.5;
  for (const side of [-1, 1]) {
    const leg = new Path2D();
    leg.roundRect(
      side * (wide + 1.5) - 0.45,
      nose ? high * 0.26 : high * 0.22,
      0.9,
      nose ? high * 0.6 : high * 0.34,
      0.4,
    );
    ctx.fill(leg);
    ctx.stroke(leg);
  }

  if (nose && !bare) {
    // **The fairing, and it tapers.** Widest along the top where the mirrors
    // and the screen are, drawn in to the tyre below: the same wedge the plan
    // view has, stood on end.
    const shell = new Path2D();
    shell.moveTo(-half + 0.5, high);
    shell.lineTo(half - 0.5, high);
    shell.quadraticCurveTo(half - 1.4, high * 0.66, wide + 1.1, high * 0.48);
    shell.lineTo(-wide - 1.1, high * 0.48);
    shell.quadraticCurveTo(-half + 1.4, high * 0.66, -half + 0.5, high);
    shell.closePath();
    ctx.fillStyle = panel;
    ctx.lineWidth = PEN * 0.8;
    ctx.fill(shell);
    ctx.stroke(shell);
    if (job.police) {
      ctx.save();
      ctx.clip(shell);
      ctx.fillStyle = POLICE_GLOW;
      ctx.fillRect(-half, high * 0.48, half * 2, high * 0.1);
      ctx.restore();
    }
    // **One headlamp, in the middle**, because that is where the lit one goes:
    // a two-wheeler carries a single lamp on its centre line, and the glow the
    // renderer lays on has to land in a glass that is drawn there. Painted as
    // a pair either side, the two of them plus the glow between came out as
    // three lights across the front of one motorbike.
    ctx.fillStyle = "#e2e8f0";
    ctx.lineWidth = PEN * 0.5;
    const lens = new Path2D();
    lens.roundRect(-2.6, high * 0.56, 5.2, high * 0.2, 0.7);
    ctx.fill(lens);
    ctx.stroke(lens);
    // And the bars across the top, with a grip on each end. A **bar**, mind:
    // filled edge to edge it was a black board bolted to the front.
    ctx.fillStyle = "#334155";
    const rail = new Path2D();
    rail.roundRect(-half + 0.3, high - 0.9, half * 2 - 0.6, 0.6, 0.3);
    ctx.fill(rail);
    ctx.fillStyle = "#111827";
    for (const side of [-1, 1]) {
      const grip = new Path2D();
      grip.roundRect(side * (half - 1.8) - 0.75, high - 1.1, 1.5, 1, 0.4);
      ctx.fill(grip);
    }
  } else if (nose) {
    // A bicycle: no bodywork, only the bars.
    ctx.fillStyle = "#334155";
    const rail = new Path2D();
    rail.roundRect(-half + 0.4, high - 0.9, half * 2 - 0.8, 0.6, 0.3);
    ctx.fill(rail);
  } else if (!bare) {
    // The back of the seat unit, which closes the machine off above the tyre
    // without adding anything dark - the panniers stand either side of it in
    // the plan view and this only has to fill what is between them. Blue with
    // the yellow along the bottom and nothing else, which is the rule the ends
    // of the patrol car follow: the grey is the roof's and the roof's alone.
    const tail = new Path2D();
    tail.roundRect(-wide - 1.9, high * 0.5, (wide + 1.9) * 2, high * 0.5, 0.8);
    ctx.fillStyle = panel;
    ctx.lineWidth = PEN * 0.8;
    ctx.fill(tail);
    ctx.stroke(tail);
    if (job.police) {
      ctx.fillStyle = POLICE_GLOW;
      ctx.fillRect(-wide - 1.5, high * 0.54, (wide + 1.5) * 2, high * 0.1);
    }
  }
}

/**
 * What the person on a two-wheeler is wearing.
 *
 * @param body - which machine it is
 * @param police - whether the machine is a police one
 * @param mine - whether the player is the one on it
 * @returns the colour of the jacket and of the helmet
 * @remarks
 * **Whoever is actually on it**, and that goes for the bicycle as much as for
 * anything else. Somebody else's bicycle has a man in a yellow jersey with
 * bare hair; a patrol bike has a policeman in dark leathers and a white
 * helmet; and when the player takes either of them, the player is the one
 * sitting there - in his own green, with a dark head - because a machine
 * ridden by the man it was taken from is a picture of somebody else's machine.
 */
function riderLook(
  body: VehicleBody,
  police: boolean,
  mine: boolean,
): { readonly jacket: string; readonly helmet: string } {
  let look;
  if (mine) {
    look = { jacket: RIDER_MINE, helmet: "#0f172a" };
  } else if (body === "cycle") {
    look = { jacket: "#facc15", helmet: "#f2c9a0" };
  } else if (police) {
    look = { jacket: "#1e293b", helmet: "#f8fafc" };
  } else {
    look = { jacket: "#1e293b", helmet: "#0f172a" };
  }
  return look;
}

/** The green the player wears, on foot and on a saddle. */
const RIDER_MINE = "#4ade80";

/**
 * One wheel of a motorbike, seen from the side.
 *
 * @param ctx - what to paint on, the road along the bottom
 * @param at - where along the machine the axle sits
 * @param tyre - the radius of the wheel, in city pixels
 * @param spin - which picture of it to draw, from {@link wheelStep}
 * @remarks
 * Not the car's alloy shrunk down. A motorbike wheel is **mostly tyre**, and
 * what one sees inside it is a brake disc: a bright ring with the hub in the
 * middle of it and daylight between the spokes. The tread is a set of grooves
 * round the rim, and both the grooves and the spokes turn with `spin` - so the
 * wheel reads as rolling rather than sliding, the same way the car's does.
 */
function bikeWheel(
  ctx: CanvasRenderingContext2D,
  at: number,
  tyre: number,
  spin: number,
): void {
  const smeared = spin === WHEEL_SMEAR;
  const turn = smeared
    ? 0
    : ((spin / WHEEL_STEPS) * Math.PI * 2) / WHEEL_SPOKES;
  const wheel = new Path2D();
  wheel.ellipse(at, tyre, tyre, tyre, 0, 0, Math.PI * 2);
  ctx.fillStyle = RUBBER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(wheel);
  ctx.stroke(wheel);

  // The tread, and the rim it sits on.
  if (!smeared) {
    // Grooves, not teeth: a shade lighter than the rubber and stopping short
    // of the edge, or the wheel comes out looking like a cog.
    ctx.strokeStyle = "#33333a";
    ctx.lineWidth = tyre * 0.1;
    ctx.beginPath();
    for (let block = 0; block < BIKE_TREAD; block += 1) {
      const round = -turn + (block * Math.PI * 2) / BIKE_TREAD;
      ctx.moveTo(
        at + Math.cos(round) * tyre * 0.76,
        tyre + Math.sin(round) * tyre * 0.76,
      );
      ctx.lineTo(
        at + Math.cos(round) * tyre * 0.94,
        tyre + Math.sin(round) * tyre * 0.94,
      );
    }
    ctx.stroke();
  }
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = tyre * 0.08;
  ctx.beginPath();
  ctx.ellipse(at, tyre, tyre * 0.56, tyre * 0.56, 0, 0, Math.PI * 2);
  ctx.stroke();

  // The brake disc, and the spokes across it.
  const disc = new Path2D();
  disc.ellipse(at, tyre, tyre * 0.44, tyre * 0.44, 0, 0, Math.PI * 2);
  ctx.fillStyle = smeared ? "#64748b" : "#1f2937";
  ctx.fill(disc);
  if (!smeared) {
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = tyre * 0.1;
    ctx.beginPath();
    for (let spoke = 0; spoke < WHEEL_SPOKES; spoke += 1) {
      const round = -turn + (spoke * Math.PI * 2) / WHEEL_SPOKES + WHEEL_TURN;
      ctx.moveTo(at, tyre);
      ctx.lineTo(
        at + Math.cos(round) * tyre * 0.5,
        tyre + Math.sin(round) * tyre * 0.5,
      );
    }
    ctx.stroke();
  }
  const hub = new Path2D();
  hub.ellipse(at, tyre, tyre * 0.17, tyre * 0.17, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#cbd5e1";
  ctx.fill(hub);
}

/** How many grooves of tread go round a motorbike tyre. */
const BIKE_TREAD = 10;

/** The rider from the side: leaning forward, hands on the bars. */
function riderFlank(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const who = riderLook(job.body, job.police, job.mine);
  const boots = job.body === "cycle" ? "#1e3a8a" : "#111827";

  // **A person sitting on a motorbike, limb by limb.** It used to be a slab
  // with a dot on top, and a slab narrower than the wall it stands on leaves
  // daylight either side of it - which is what made the rider look hollow.
  // Arms forward to the bars, boots down on the pegs, and a trunk between them
  // wide enough to fill the saddle.
  ctx.lineWidth = high * 0.3;
  ctx.strokeStyle = boots;
  ctx.beginPath();
  ctx.moveTo(-half * 0.24, high * 0.44);
  ctx.lineTo(half * 0.48, high * 0.3);
  ctx.lineTo(half * 0.18, high * 0.06);
  ctx.stroke();

  ctx.lineWidth = high * 0.22;
  ctx.strokeStyle = who.jacket;
  ctx.beginPath();
  ctx.moveTo(-half * 0.02, high * 0.72);
  ctx.lineTo(half * 0.94, high * 0.48);
  ctx.stroke();

  const trunk = new Path2D();
  trunk.moveTo(-half * 0.66, high * 0.32);
  trunk.lineTo(-half * 0.34, high * 0.84);
  trunk.lineTo(half * 0.22, high * 0.86);
  trunk.lineTo(half * 0.14, high * 0.34);
  trunk.closePath();
  ctx.fillStyle = who.jacket;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(trunk);
  ctx.stroke(trunk);

  // The helmet, and the visor across the front of it.
  const head = new Path2D();
  head.ellipse(
    -half * 0.04,
    high * 0.86,
    high * 0.27,
    high * 0.27,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = who.helmet;
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(head);
  ctx.stroke(head);
  ctx.fillStyle = "#1e293b";
  const visor = new Path2D();
  visor.roundRect(half * 0.04, high * 0.78, high * 0.26, high * 0.16, 0.3);
  ctx.fill(visor);
}

/** The rider seen end on: knees out, arms on the bars, a helmet on top. */
function riderEnd(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const who = riderLook(job.body, job.police, job.mine);
  const boots = job.body === "cycle" ? "#1e3a8a" : "#111827";

  // The knees, which stick out further than anything else on a rider.
  ctx.lineCap = "round";
  ctx.lineWidth = high * 0.26;
  ctx.strokeStyle = boots;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(side * half * 0.3, high * 0.42);
    ctx.lineTo(side * half * 0.86, high * 0.2);
  }
  ctx.stroke();

  // The arms, out and down to the ends of the bars.
  ctx.lineWidth = high * 0.2;
  ctx.strokeStyle = who.jacket;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(side * half * 0.28, high * 0.62);
    ctx.lineTo(side * half * 0.92, high * 0.44);
  }
  ctx.stroke();

  const trunk = new Path2D();
  trunk.roundRect(-half * 0.56, high * 0.18, half * 1.12, high * 0.58, 1.2);
  ctx.fillStyle = who.jacket;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(trunk);
  ctx.stroke(trunk);

  const head = new Path2D();
  head.ellipse(0, high * 0.82, high * 0.27, high * 0.27, 0, 0, Math.PI * 2);
  ctx.fillStyle = who.helmet;
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(head);
  ctx.stroke(head);
  ctx.fillStyle = "#1e293b";
  const visor = new Path2D();
  visor.roundRect(-high * 0.22, high * 0.76, high * 0.44, high * 0.16, 0.3);
  ctx.fill(visor);
}

/**
 * A tractor from the side or the end: it is mostly wheel.
 *
 * @remarks
 * The one thing that has to read at a glance is the pair of wheel sizes. A
 * flank shows both; from the front or the back only one pair is in the way,
 * and which one depends on which end is being looked at.
 */
function tractorWall(ctx: CanvasRenderingContext2D, job: WallJob): void {
  if (job.upper) {
    tractorCab(ctx, job);
  } else {
    tractorLower(ctx, job);
  }
}

/**
 * The lower storey: chassis, bonnet and the wheels it stands on.
 *
 * @remarks
 * Like every other wall picture this is drawn with the ground along the bottom
 * edge and the middle at zero. It used to be drawn from a top left corner into
 * exactly the same picture, which put the body in mid-air, the cab below it
 * and the wheels up on the roof - and made the whole machine look like parts
 * of two others.
 */
function tractorLower(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const flank = job.face === "flank";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  // The chassis rail, and the bonnet sitting on it.
  ctx.fillStyle = shade(job.paint);
  const rail = new Path2D();
  rail.rect(-half, high * 0.34, half * 2, high * 0.22);
  ctx.fill(rail);
  ctx.stroke(rail);
  ctx.fillStyle = job.paint;
  const bonnet = new Path2D();
  if (flank) {
    bonnet.moveTo(-half, high * 0.5);
    bonnet.lineTo(-half, high);
    bonnet.lineTo(half * 0.1, high);
    bonnet.lineTo(half * 0.86, high * 0.86);
    bonnet.lineTo(half, high * 0.82);
    bonnet.lineTo(half, high * 0.5);
  } else {
    bonnet.rect(-half, high * 0.5, half * 2, high * 0.5);
  }
  bonnet.closePath();
  ctx.fill(bonnet);
  ctx.stroke(bonnet);
  // The wheels: one big one behind, one small one in front, or a pair of the
  // same size when one is looking at an end of the machine.
  const axles = flank
    ? [
        { at: -half * 0.62, tyre: high * 0.5 },
        { at: half * 0.68, tyre: high * 0.3 },
      ]
    : [
        { at: -half * 0.82, tyre: high * (job.face === "nose" ? 0.3 : 0.5) },
        { at: half * 0.82, tyre: high * (job.face === "nose" ? 0.3 : 0.5) },
      ];
  for (const axle of axles) {
    wheelAt(ctx, axle.at, axle.tyre, wheelTurn(job, axle.at));
  }
}

/** The upper storey: a glasshouse on four posts, which is all a cab is. */
function tractorCab(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fillStyle = shade(job.paint);
  const frame = new Path2D();
  frame.rect(-half, 0, half * 2, high);
  ctx.fill(frame);
  ctx.stroke(frame);
  ctx.fillStyle = GLASS;
  ctx.lineWidth = PEN * 0.7;
  const glass = new Path2D();
  glass.rect(-half * 0.78, high * 0.16, half * 1.56, high * 0.68);
  ctx.fill(glass);
  ctx.stroke(glass);
}

/** The tank: tracks and hull below, turret above. */
function tankWall(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const flank = job.face === "flank";
  if (job.upper) {
    turretWall(ctx, job, flank);
  } else if (flank) {
    tankFlank(ctx, job);
  } else {
    tankEnd(ctx, job);
  }
}

/** The tank from the side: the track with its road wheels, and the hull. */
function tankFlank(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;

  const track = new Path2D();
  track.roundRect(-half, 0, half * 2, high * 0.62, 1.8);
  ctx.fillStyle = "#292524";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(track);
  ctx.stroke(track);
  ctx.fillStyle = "#44403c";
  ctx.lineWidth = PEN * 0.5;
  for (let at = -half + 4.5; at < half - 4; at += 6.5) {
    const roller = new Path2D();
    roller.ellipse(at, high * 0.3, high * 0.19, high * 0.19, 0, 0, Math.PI * 2);
    ctx.fill(roller);
    ctx.stroke(roller);
  }

  const hull = new Path2D();
  hull.moveTo(-half + 1, high * 0.52);
  hull.lineTo(half - 1, high * 0.52);
  hull.lineTo(half - 1, high * 0.78);
  hull.lineTo(half - 7, high);
  hull.lineTo(-half + 1, high);
  hull.closePath();
  ctx.fillStyle = "#4d7c0f";
  ctx.lineWidth = PEN;
  ctx.fill(hull);
  ctx.stroke(hull);
}

/** The tank end on: a track at each side, the hull between them. */
function tankEnd(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;

  ctx.fillStyle = "#292524";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  for (const side of [-1, 1]) {
    const track = new Path2D();
    track.roundRect(side === 1 ? half - 6 : -half, 0, 6, high * 0.62, 1.4);
    ctx.fill(track);
    ctx.stroke(track);
  }
  const hull = new Path2D();
  hull.roundRect(-half + 5, high * 0.22, half * 2 - 10, high * 0.78, 1.4);
  ctx.fillStyle = "#4d7c0f";
  ctx.fill(hull);
  ctx.stroke(hull);
}

/** The turret, from whichever side: a sloped block with the gun in it. */
function turretWall(
  ctx: CanvasRenderingContext2D,
  job: WallJob,
  flank: boolean,
): void {
  const half = job.span / 2;
  const high = job.high;

  const turret = new Path2D();
  turret.moveTo(-half, 0);
  turret.lineTo(-half + 1.6, high - 0.8);
  turret.lineTo(half - 3, high - 0.8);
  turret.lineTo(half - 1, 0);
  turret.closePath();
  ctx.fillStyle = "#3f6212";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(turret);
  ctx.stroke(turret);

  const gun = new Path2D();
  if (flank) {
    gun.roundRect(half - 8, high * 0.34, 8, 1.6, 0.6);
  } else {
    gun.ellipse(0, high * 0.42, 1.8, 1.8, 0, 0, Math.PI * 2);
  }
  ctx.fillStyle = RUBBER;
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(gun);
  ctx.stroke(gun);

  const hatch = new Path2D();
  hatch.roundRect(-half * 0.4, high - 1.4, 3.4, 1.4, 0.5);
  ctx.fillStyle = "#365314";
  ctx.fill(hatch);
  ctx.stroke(hatch);
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
