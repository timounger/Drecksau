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
import { VEHICLES, type VehicleBody } from "@/games/gta/engine/vehicles";
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
};

/**
 * How every body is stacked.
 *
 * @remarks
 * The cabin has to stand exactly where the view from above draws the roof. Any
 * less and a piece of roof is left lying flat on the bonnet with a step up to
 * the rest of it, which is the one thing that looks worse than a plain box.
 */
const TIERS: Readonly<Record<VehicleBody, VehicleTiers>> = {
  car: {
    tall: 13,
    belt: 8,
    cabinBack: -9.6,
    cabinFront: 7.9,
    cabinWide: 22,
    rake: 3.2,
  },
  suv: {
    tall: 16,
    belt: 10,
    cabinBack: -11.7,
    cabinFront: 9.6,
    cabinWide: 27.6,
    // Upright: a big square thing has a big square screen.
    rake: 2.4,
  },
  taxi: {
    tall: 13,
    belt: 8,
    cabinBack: -10,
    cabinFront: 8.2,
    cabinWide: 23,
    rake: 3,
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
    tall: 14,
    belt: 8,
    cabinBack: -5,
    cabinFront: 3.5,
    cabinWide: 14,
    rake: 0,
  },
  cycle: {
    tall: 14,
    belt: 8,
    cabinBack: -4.5,
    cabinFront: 3,
    cabinWide: 12,
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
    cabinBack: -16,
    cabinFront: 2,
    cabinWide: 24,
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
): HTMLCanvasElement | null {
  const key = `${body}|${paint}|${police ? "p" : "-"}`;
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
  paintVehicle(ctx, body, paint, police);
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
  return [
    { x: -long, y: -wide * cut.tail },
    { x: long, y: -wide * cut.nose },
    { x: long, y: wide * cut.nose },
    { x: -long, y: wide * cut.tail },
  ];
}

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
  return [
    { x: tiers.cabinBack, y: -half },
    { x: tiers.cabinFront, y: -half * cut },
    { x: tiers.cabinFront, y: half * cut },
    { x: tiers.cabinBack, y: half },
  ];
}

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
  car: { nose: 0.76, tail: 0.97 },
  taxi: { nose: 0.78, tail: 0.97 },
  suv: { nose: 0.92, tail: 1 },
  dmc: { nose: 0.62, tail: 0.94 },
};

/** And how much the roof narrows towards the windscreen. */
const CABIN_NARROWS: Readonly<Partial<Record<VehicleBody, number>>> = {
  car: 0.93,
  taxi: 0.93,
  suv: 0.96,
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
): HTMLCanvasElement | null {
  const key = `${body}|${paint}|${police ? "p" : "-"}|${face}|${upper ? "u" : "l"}`;
  let sheet = drawn.get(key) ?? null;
  if (sheet === null) {
    sheet = buildWall(body, paint, police, face, upper);
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
): void {
  if (body === "bike" || body === "cycle") {
    paintTwoWheeler(ctx, body, paint, police);
  } else if (body === "tank") {
    paintTank(ctx);
  } else if (body === "dmc") {
    paintDelorean(ctx);
  } else if (body === "tractor") {
    paintTractor(ctx, paint);
  } else {
    paintCar(ctx, body, paint, police);
  }
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

  wheels(ctx, long, wide, boxy ? 7.4 : 6.4, boxy ? 3 : 2.5);

  // The body, filled with the very outline the walls are raised from - see
  // bodyOutline. Anything else here and the roof and the walls part company.
  const shell = pathOf(bodyOutline(body));
  ctx.fillStyle = police ? "#f8fafc" : paint;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  if (police) {
    // Black doors on a white car: the shape everybody knows at a glance.
    const doors = new Path2D();
    doors.rect(-long * 0.45, -wide, long * 0.9, wide * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill(doors);
    ctx.stroke(doors);
  } else if (body === "taxi") {
    // The chequered stripe along the flanks.
    ctx.fillStyle = "#0f172a";
    for (let at = -long * 0.5; at < long * 0.5; at += 4) {
      ctx.fillRect(at, -wide, 2, 1.6);
      ctx.fillRect(at + 2, wide - 1.6, 2, 1.6);
    }
  }

  // The cabin: the same trick again, so its roof sits exactly on its walls.
  const roof = pathOf(cabinOutline(body));
  ctx.fillStyle = shade(police ? "#e2e8f0" : paint);
  ctx.fill(roof);
  ctx.stroke(roof);

  // No glass up here. Every pane a car has is on a wall of the cabin, and the
  // cabin is a box of its own that stands on this picture - drawing the
  // windscreen flat as well would put it on the roof, a step above where it
  // belongs, and read as a dark lid on a crate.

  // Mirrors, lights and the seams of the bonnet.
  ctx.lineWidth = PEN * 0.7;
  ctx.fillStyle = shade(paint);
  for (const side of [-1, 1]) {
    const mirror = new Path2D();
    mirror.rect(long * 0.3, side * (wide + 0.4) - 0.5, 2.2, 1.2);
    ctx.fill(mirror);
    ctx.stroke(mirror);
  }
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
    bar.roundRect(long - 0.6, -wide * 0.9, 1.8, wide * 1.8, 0.8);
    ctx.fillStyle = "#94a3b8";
    ctx.lineWidth = PEN * 0.7;
    ctx.fill(bar);
    ctx.stroke(bar);
  }

  if (police) {
    // The light bar across the roof.
    const bar = new Path2D();
    bar.roundRect(-long * 0.12, -wide * 0.8, 3, wide * 1.6, 0.8);
    ctx.fillStyle = "#0f172a";
    ctx.fill(bar);
    ctx.stroke(bar);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-long * 0.12 + 0.4, -wide * 0.75, 2.2, wide * 0.7);
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(-long * 0.12 + 0.4, wide * 0.05, 2.2, wide * 0.7);
  } else if (body === "taxi") {
    // The sign on the roof.
    const sign = new Path2D();
    sign.roundRect(-1.6, -3, 3.2, 6, 0.8);
    ctx.fillStyle = "#fde047";
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN * 0.7;
    ctx.fill(sign);
    ctx.stroke(sign);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-0.9, -2.2, 1.8, 4.4);
  }
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

  wheels(ctx, long, wide, 6.6, 2.6);

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

/** Four wheels, standing a little proud of the flanks. */
function wheels(
  ctx: CanvasRenderingContext2D,
  long: number,
  wide: number,
  size: number,
  thick: number,
): void {
  // A car is four and a half metres long and its tyres are two thirds of a
  // metre across: at this scale that is a good six pixels, not three. Drawn
  // too small they read as castors, and now that they stand on the road
  // rather than at the height of the bodywork, that shows.
  ctx.fillStyle = "#1c1917";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  for (const at of [long * 0.58, -long * 0.58]) {
    for (const side of [-1, 1]) {
      const wheel = new Path2D();
      wheel.roundRect(
        at - size / 2,
        side * (wide + thick * 0.35) - thick / 2,
        size,
        thick,
        0.9,
      );
      ctx.fill(wheel);
      ctx.stroke(wheel);
      // The crown of the tyre, where a round thing catches the light. Without
      // it a wheel from above is a black bar, and a black bar on the road next
      // to a shadow reads as a puncture.
      ctx.fillStyle = "#44403c";
      ctx.fillRect(
        at - size * 0.32,
        side * (wide + thick * 0.35) - thick * 0.16,
        size * 0.64,
        thick * 0.32,
      );
      ctx.fillStyle = "#1c1917";
    }
  }
}

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
): void {
  const shape = VEHICLES[body];
  const long = shape.length / 2;
  const wide = shape.width / 2;
  const cycle = body === "cycle";

  ctx.fillStyle = "#1c1917";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  for (const at of [long - 2, -long + 2]) {
    const wheel = new Path2D();
    wheel.roundRect(at - 3, -wide * 0.7, 6, wide * 1.4, 1);
    ctx.fill(wheel);
    ctx.stroke(wheel);
  }

  const frame = new Path2D();
  frame.moveTo(long - 3, -wide * 0.5);
  frame.lineTo(-long + 3, -wide * 0.7);
  frame.lineTo(-long + 3, wide * 0.7);
  frame.lineTo(long - 3, wide * 0.5);
  frame.closePath();
  ctx.fillStyle = cycle ? "#94a3b8" : paint;
  ctx.lineWidth = PEN;
  ctx.fill(frame);
  ctx.stroke(frame);

  // The handlebars, across the front.
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1.2;
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
    ctx.fillStyle = "#f8fafc";
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

  // And the rider, seen from above: shoulders, arms to the bars, a head.
  const rider = new Path2D();
  rider.ellipse(-2, 0, 4.4, wide + 1.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = cycle ? "#facc15" : "#1e293b";
  ctx.lineWidth = PEN;
  ctx.fill(rider);
  ctx.stroke(rider);
  ctx.strokeStyle = cycle ? "#facc15" : "#1e293b";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(-1, side * wide);
    ctx.lineTo(long - 5.4, side * (wide + 1.2));
  }
  ctx.stroke();
  const head = new Path2D();
  head.ellipse(1.4, 0, 2.8, 2.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = cycle ? "#f2c9a0" : "#0f172a";
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
  const wide = shape.width / 2;

  // The wheels: the back pair wide and deep, the front pair small.
  ctx.fillStyle = "#1c1917";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.8;
  for (const side of [-1, 1]) {
    const back = new Path2D();
    back.roundRect(-long + 4, side * wide - 7, 18, 7, 2);
    ctx.fill(back);
    ctx.stroke(back);
    const front = new Path2D();
    front.roundRect(long - 14, side * (wide - 2) - 4.5, 10, 4.5, 1.5);
    ctx.fill(front);
    ctx.stroke(front);
  }

  // The body: a narrow bonnet up front, widening into the cab.
  const body = new Path2D();
  body.moveTo(long - 2, -wide + 9);
  body.lineTo(long - 2, wide - 9);
  body.lineTo(-long + 6, wide - 5);
  body.lineTo(-long + 6, -wide + 5);
  body.closePath();
  ctx.fillStyle = paint;
  ctx.lineWidth = PEN;
  ctx.fill(body);
  ctx.stroke(body);

  // The cab, glazed all round, over the back axle.
  const cab = new Path2D();
  cab.roundRect(-long + 5, -wide + 4, 17, (wide - 4) * 2, 2.5);
  ctx.fillStyle = shade(paint);
  ctx.fill(cab);
  ctx.stroke(cab);
  const glass = new Path2D();
  glass.roundRect(-long + 7.5, -wide + 6, 12, (wide - 6) * 2, 2);
  ctx.fillStyle = "#1e293b";
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(glass);
  ctx.stroke(glass);

  // The exhaust stack beside the bonnet, and the tow bar behind.
  ctx.fillStyle = "#44403c";
  const stack = new Path2D();
  stack.ellipse(long - 9, -wide + 6, 2.6, 2.6, 0, 0, Math.PI * 2);
  ctx.fill(stack);
  ctx.stroke(stack);
  const bar = new Path2D();
  bar.rect(-long - 4, -3, 8, 6);
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
function shade(colour: string): string {
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
};

/** Paints one wall into a canvas of its own. */
function buildWall(
  body: VehicleBody,
  paint: string,
  police: boolean,
  face: VehicleFace,
  upper: boolean,
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
    paintWall(ctx, { body, paint, police, face, upper, span, high });
    made = sheet;
  }
  return made;
}

/** Which routine draws which wall. */
function paintWall(ctx: CanvasRenderingContext2D, job: WallJob): void {
  if (job.body === "tank") {
    tankWall(ctx, job);
  } else if (job.body === "bike" || job.body === "cycle") {
    rideWall(ctx, job);
  } else if (job.body === "tractor") {
    tractorWall(ctx, job);
  } else if (job.body === "dmc") {
    dmcWall(ctx, job);
  } else {
    carWall(ctx, job);
  }
}

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
    wheelAt(ctx, at, tyre);
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
  const skin = job.police ? "#f8fafc" : job.paint;
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

  // The sill along the bottom, then an arch and a wheel at each axle.
  ctx.fillStyle = shade(skin);
  ctx.fillRect(-axle, SILL * 0.2, axle * 2, SILL);
  for (const at of [axle, -axle]) {
    const arch = new Path2D();
    arch.moveTo(at - tyre - 0.7, 0);
    arch.lineTo(at - tyre - 0.7, tyre * 0.4);
    arch.quadraticCurveTo(at, tyre * 2.4, at + tyre + 0.7, tyre * 0.4);
    arch.lineTo(at + tyre + 0.7, 0);
    arch.closePath();
    ctx.fillStyle = "#0f172a";
    ctx.lineWidth = PEN * 0.7;
    ctx.fill(arch);
    ctx.stroke(arch);
    wheelAt(ctx, at, tyre);
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
): void {
  const wheel = new Path2D();
  wheel.ellipse(at, tyre, tyre, tyre, 0, 0, Math.PI * 2);
  ctx.fillStyle = RUBBER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(wheel);
  ctx.stroke(wheel);
  const hub = new Path2D();
  hub.ellipse(at, tyre, tyre * 0.4, tyre * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = RIM;
  ctx.lineWidth = PEN * 0.5;
  ctx.fill(hub);
  ctx.stroke(hub);
  const nut = new Path2D();
  nut.ellipse(at, tyre, tyre * 0.16, tyre * 0.16, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#475569";
  ctx.fill(nut);
}

/** The nose or the tail of a car: bumper, plate, lights, and a grille. */
function carEnd(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const nose = job.face === "nose";
  const skin = job.police ? "#f8fafc" : job.paint;
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
  const skin = job.police ? "#f8fafc" : job.paint;
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
  const skin = job.police ? "#f8fafc" : job.paint;

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
  } else if (flank) {
    machineFlank(ctx, job);
  } else {
    machineEnd(ctx, job);
  }
}

/**
 * The machine from the side: two big wheels and a frame between them.
 *
 * @remarks
 * A bicycle from the side is almost entirely wheel, which is why it needed
 * this: from above it was a stripe, and a stripe standing on a stripe is not a
 * bicycle.
 */
function machineFlank(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const cycle = job.body === "cycle";
  const tyre = high * 0.62;
  const axle = half - tyre - 0.6;

  for (const at of [axle, -axle]) {
    const wheel = new Path2D();
    wheel.ellipse(at, tyre, tyre, tyre, 0, 0, Math.PI * 2);
    ctx.fillStyle = cycle ? "#0f172a" : RUBBER;
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN * 0.7;
    ctx.fill(wheel);
    ctx.stroke(wheel);
    if (cycle) {
      // Spokes, because a bicycle wheel that is a black disc is a moped.
      ctx.strokeStyle = RIM;
      ctx.lineWidth = 0.25;
      ctx.beginPath();
      for (let spoke = 0; spoke < 6; spoke += 1) {
        const turn = (spoke * Math.PI) / 6;
        ctx.moveTo(at - Math.cos(turn) * tyre, tyre - Math.sin(turn) * tyre);
        ctx.lineTo(at + Math.cos(turn) * tyre, tyre + Math.sin(turn) * tyre);
      }
      ctx.stroke();
    }
    const spindle = tyre * (cycle ? 0.18 : 0.42);
    const hub = new Path2D();
    hub.ellipse(at, tyre, spindle, spindle, 0, 0, Math.PI * 2);
    ctx.fillStyle = RIM;
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN * 0.5;
    ctx.fill(hub);
    ctx.stroke(hub);
  }

  // The frame: seat post, top tube, fork.
  ctx.strokeStyle = cycle ? "#94a3b8" : job.paint;
  ctx.lineWidth = cycle ? 0.9 : 1.6;
  ctx.beginPath();
  ctx.moveTo(-axle, tyre);
  ctx.lineTo(-axle + 0.8, high);
  ctx.lineTo(axle - 1.6, high * 0.88);
  ctx.lineTo(axle, tyre);
  ctx.moveTo(-axle + 0.8, high);
  ctx.lineTo(axle - 1.6, high * 0.88);
  ctx.stroke();

  if (!cycle) {
    // A tank and an exhaust, for the one with an engine.
    const fuel = new Path2D();
    fuel.ellipse(-1, high * 0.82, 4.4, 1.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = job.paint;
    ctx.strokeStyle = INK;
    ctx.lineWidth = PEN * 0.7;
    ctx.fill(fuel);
    ctx.stroke(fuel);
    const pipe = new Path2D();
    pipe.roundRect(-axle - 1, tyre * 0.5, axle * 0.9, 1.1, 0.5);
    ctx.fillStyle = RIM;
    ctx.fill(pipe);
    ctx.stroke(pipe);
  }

  // And the saddle to sit on.
  const seat = new Path2D();
  seat.roundRect(-axle - 1.6, high - 0.4, 3.6, 1, 0.5);
  ctx.fillStyle = "#0f172a";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.5;
  ctx.fill(seat);
  ctx.stroke(seat);
}

/** The machine end on: one wheel edge on, and the bars over it. */
function machineEnd(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;

  const wheel = new Path2D();
  wheel.roundRect(-1.5, 0, 3, high * 0.9, 0.7);
  ctx.fillStyle = RUBBER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(wheel);
  ctx.stroke(wheel);

  if (job.face === "nose") {
    const bars = new Path2D();
    bars.roundRect(-half + 0.4, high - 1.4, half * 2 - 0.8, 1, 0.5);
    ctx.fillStyle = "#334155";
    ctx.fill(bars);
    ctx.stroke(bars);
  }
}

/** The rider from the side: leaning forward, hands on the bars. */
function riderFlank(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const cycle = job.body === "cycle";

  const leg = new Path2D();
  leg.roundRect(-1.8, 0, 4.6, high * 0.42, 1.1);
  ctx.fillStyle = cycle ? "#1e3a8a" : "#111827";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(leg);
  ctx.stroke(leg);

  const trunk = new Path2D();
  trunk.moveTo(-2.6, high * 0.22);
  trunk.lineTo(-1.4, high * 0.62);
  trunk.lineTo(2, high * 0.62);
  trunk.lineTo(1.2, high * 0.22);
  trunk.closePath();
  ctx.fillStyle = cycle ? "#facc15" : "#1e293b";
  ctx.lineWidth = PEN;
  ctx.fill(trunk);
  ctx.stroke(trunk);

  ctx.strokeStyle = cycle ? "#facc15" : "#1e293b";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(1.4, high * 0.55);
  ctx.lineTo(half - 0.4, high * 0.32);
  ctx.stroke();

  const head = new Path2D();
  head.ellipse(0.6, high * 0.78, high * 0.22, high * 0.22, 0, 0, Math.PI * 2);
  ctx.fillStyle = cycle ? "#f2c9a0" : "#0f172a";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(head);
  ctx.stroke(head);
}

/** The rider seen end on: shoulders and a head. */
function riderEnd(ctx: CanvasRenderingContext2D, job: WallJob): void {
  const half = job.span / 2;
  const high = job.high;
  const cycle = job.body === "cycle";

  const trunk = new Path2D();
  trunk.roundRect(-half, 0, half * 2, high * 0.66, 1.4);
  ctx.fillStyle = cycle ? "#facc15" : "#1e293b";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(trunk);
  ctx.stroke(trunk);

  const head = new Path2D();
  head.ellipse(0, high * 0.78, high * 0.22, high * 0.22, 0, 0, Math.PI * 2);
  ctx.fillStyle = cycle ? "#f2c9a0" : "#0f172a";
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(head);
  ctx.stroke(head);
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
  const high = job.high;
  const across = job.span;
  ctx.fillStyle = job.paint;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  // The body, and the cab standing up out of the back half of it.
  const flank = job.face === "flank";
  const body = new Path2D();
  body.rect(0, high * 0.45, across, high * 0.3);
  ctx.fill(body);
  ctx.stroke(body);
  const cab = new Path2D();
  cab.rect(
    flank ? across * 0.08 : across * 0.12,
    high * 0.05,
    flank ? across * 0.42 : across * 0.76,
    high * 0.42,
  );
  ctx.fillStyle = shade(job.paint);
  ctx.fill(cab);
  ctx.stroke(cab);
  const glass = new Path2D();
  glass.rect(
    flank ? across * 0.12 : across * 0.18,
    high * 0.1,
    flank ? across * 0.34 : across * 0.64,
    high * 0.26,
  );
  ctx.fillStyle = "#1e293b";
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(glass);
  ctx.stroke(glass);
  // And the wheels along the bottom.
  ctx.fillStyle = "#1c1917";
  ctx.lineWidth = PEN * 0.8;
  const wheels = flank
    ? [
        { at: across * 0.2, size: high * 0.5 },
        { at: across * 0.82, size: high * 0.3 },
      ]
    : [
        { at: across * 0.12, size: high * 0.42 },
        { at: across * 0.88, size: high * 0.42 },
      ];
  for (const wheel of wheels) {
    const tyre = new Path2D();
    tyre.ellipse(
      wheel.at,
      high - wheel.size / 2,
      wheel.size / 2,
      wheel.size / 2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill(tyre);
    ctx.stroke(tyre);
  }
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
