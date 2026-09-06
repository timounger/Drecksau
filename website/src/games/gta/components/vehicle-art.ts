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
  car: { tall: 13, belt: 8, cabinBack: -9.6, cabinFront: 7.9, cabinWide: 22 },
  suv: {
    tall: 16,
    belt: 10,
    cabinBack: -11.7,
    cabinFront: 9.6,
    cabinWide: 27.6,
  },
  taxi: { tall: 13, belt: 8, cabinBack: -10, cabinFront: 8.2, cabinWide: 23 },
  bike: { tall: 14, belt: 8, cabinBack: -5, cabinFront: 3.5, cabinWide: 14 },
  cycle: { tall: 14, belt: 8, cabinBack: -4.5, cabinFront: 3, cabinWide: 12 },
  tank: { tall: 19, belt: 12, cabinBack: -14, cabinFront: 10, cabinWide: 34 },
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
  const taper = boxy ? 0.92 : 0.76;

  wheels(ctx, long, wide, boxy ? 3.4 : 2.8, boxy ? 2.6 : 2.2);

  // The body: a rounded shell, narrower at the nose than at the flanks.
  const shell = new Path2D();
  shell.moveTo(long, -wide * taper);
  shell.quadraticCurveTo(long + 1.6, 0, long, wide * taper);
  shell.lineTo(-long + 2, wide);
  shell.quadraticCurveTo(-long - 1.2, 0, -long + 2, -wide);
  shell.closePath();
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

  // The cabin: roof between two panes, and a seam where the bonnet begins.
  const roof = new Path2D();
  roof.moveTo(long * 0.34, -wide * 0.86);
  roof.lineTo(-long * 0.42, -wide * 0.92);
  roof.lineTo(-long * 0.42, wide * 0.92);
  roof.lineTo(long * 0.34, wide * 0.86);
  roof.closePath();
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

/** Four wheels, standing a little proud of the flanks. */
function wheels(
  ctx: CanvasRenderingContext2D,
  long: number,
  wide: number,
  size: number,
  thick: number,
): void {
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

  // The tracks.
  ctx.fillStyle = "#292524";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  for (const side of [-1, 1]) {
    const track = new Path2D();
    track.roundRect(-long, side * wide - 5.5, long * 2, 5.5, 1.4);
    ctx.fill(track);
    ctx.stroke(track);
  }
  ctx.fillStyle = "#44403c";
  for (let link = -long + 2; link < long - 2; link += 5) {
    for (const side of [-1, 1]) {
      ctx.fillRect(link, side * wide - 4.6, 2.4, 3.8);
    }
  }

  // The hull, with a plate at the front.
  const hull = new Path2D();
  hull.moveTo(long - 2, -wide + 6);
  hull.lineTo(long + 1, 0);
  hull.lineTo(long - 2, wide - 6);
  hull.lineTo(-long + 1, wide - 6);
  hull.lineTo(-long + 1, -wide + 6);
  hull.closePath();
  ctx.fillStyle = "#4d7c0f";
  ctx.lineWidth = PEN;
  ctx.fill(hull);
  ctx.stroke(hull);
  ctx.strokeStyle = "#3f6212";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(long * 0.3, -wide + 6.5);
  ctx.lineTo(long * 0.3, wide - 6.5);
  ctx.stroke();

  // The ring the turret sits in. The turret itself is a picture of its own:
  // it turns with the mouse, and the hull turns with the tracks.
  const ring = new Path2D();
  ring.ellipse(-2, 0, 8.6, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#3f6212";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(ring);
  ctx.stroke(ring);
}

/** The turret: a squat block, the hatch behind it, and the gun out in front. */
function paintTurret(ctx: CanvasRenderingContext2D): void {
  const turret = new Path2D();
  turret.ellipse(-2, 0, 8, 7.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#3f6212";
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(turret);
  ctx.stroke(turret);
  const hatch = new Path2D();
  hatch.ellipse(-5, 0, 2.6, 2.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#365314";
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(hatch);
  ctx.stroke(hatch);
  const gun = new Path2D();
  gun.rect(4, -1.8, 31, 3.6);
  ctx.fillStyle = "#1c1917";
  ctx.lineWidth = PEN * 0.7;
  ctx.fill(gun);
  ctx.stroke(gun);
  const muzzle = new Path2D();
  muzzle.rect(34, -2.4, 2.4, 4.8);
  ctx.fill(muzzle);
  ctx.stroke(muzzle);
}

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
  } else {
    carWall(ctx, job);
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
  const tyre = high * (job.body === "suv" ? 0.4 : 0.35);
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

  const shell = new Path2D();
  shell.moveTo(-half, 0);
  shell.lineTo(-half + 1.4, high - 0.8);
  shell.quadraticCurveTo(-half + 1.8, high, -half + 2.6, high);
  shell.lineTo(half - 2.8, high);
  shell.quadraticCurveTo(half - 2, high, half - 1.6, high - 0.8);
  shell.lineTo(half, 0);
  shell.closePath();
  ctx.fillStyle = skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = PEN;
  ctx.fill(shell);
  ctx.stroke(shell);

  ctx.fillStyle = GLASS;
  ctx.lineWidth = PEN * 0.5;
  const panes = [
    [-half + 0.9, -half + 2.3, -0.5, -0.5],
    [0.5, 0.5, half - 2.6, half - 1.2],
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
