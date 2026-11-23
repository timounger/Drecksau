/**
 * Low-poly models built in code: every vehicle, people, cats and dogs, the
 * helicopters and the aeroplane, the train, trees, lamps and the rest of the
 * furniture of the street. No files, no assets.
 *
 * @module
 * @remarks
 * The same idea as IMPERAVIS's models: many simple shapes merged into one
 * geometry, with a colour per vertex and a few numbers per vertex that the
 * materials read - whether it glows, whether it takes the car's paint, which
 * piece of clothing it is. One geometry per model is one draw call for every
 * car of a kind on the screen.
 *
 * The vehicles are stood up from the outlines the 2D picture already draws
 * them by - {@link bodyOutline}, {@link cabinOutline}, {@link tiersOf} - so a
 * car is exactly as long, wide and tall in either view, and a change to its
 * plan shows in both.
 */
import * as THREE from "three";
import {
  bodyOutline,
  cabinOutline,
  tiersOf,
} from "@/games/gta/components/vehicle-art";
import { VEHICLES, type VehicleBody } from "@/games/gta/engine/vehicles";
import {
  TRAIN_LONG,
  TRAIN_WIDE,
  type ChopperKind,
  type Vec,
} from "@/games/gta/engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- model geometry: the
   sizes, offsets and colours of every part, in city pixels */

/** What a part of a model is, beyond its shape. */
export type Tag = {
  /** Its colour. */
  readonly color: number;
  /** Whether and how it glows - see the materials. */
  readonly glow?: number;
  /** One where it takes the instance's colour, nought where it keeps its own. */
  readonly paint?: number;
  /** Which piece of clothing it is, on a figure. */
  readonly part?: number;
  /** Which limb it swings with, on a figure. */
  readonly limb?: number;
};

/** Glows only at night, as a lit window or a headlamp does. */
export const NIGHT = 1;

/** The two halves of a blue lamp, flashing against each other. */
export const FLASH_ONE = 3;

/** The other half. */
export const FLASH_TWO = 4;

/** Which piece of clothing: shirt, skin, trousers, hair, the gun. */
export const PART = { shirt: 1, skin: 2, legs: 3, hair: 4, gun: 5 } as const;

/** Which limb: the two legs and the two arms, the right ones negative. */
export const LIMB = { leftLeg: 1, rightLeg: -1, leftArm: 2, rightArm: -2 };

/** Builds one model from simple parts. */
export class ModelBuilder {
  /** Corners, three numbers each. */
  private readonly positions: number[] = [];
  /** Their normals. */
  private readonly normals: number[] = [];
  /** Their colours, linear. */
  private readonly colors: number[] = [];
  /** And the four numbers per corner the materials read. */
  private readonly glows: number[] = [];
  /** Paint. */
  private readonly paints: number[] = [];
  /** Clothing. */
  private readonly parts: number[] = [];
  /** Limbs. */
  private readonly limbs: number[] = [];
  /** A scratch colour. */
  private readonly tint = new THREE.Color();

  /**
   * Adds a finished geometry, which is used up by it.
   *
   * @param geometry - the shape
   * @param tag - what it is
   * @param matrix - where it goes, if not where it is
   * @returns this
   */
  add(geometry: THREE.BufferGeometry, tag: Tag, matrix?: THREE.Matrix4): this {
    const flat = geometry.index === null ? geometry : geometry.toNonIndexed();
    if (matrix !== undefined) {
      flat.applyMatrix4(matrix);
    }
    flat.computeVertexNormals();
    const at = flat.getAttribute("position");
    const facing = flat.getAttribute("normal");
    for (let corner = 0; corner < at.count; corner += 1) {
      this.corner(
        at.getX(corner),
        at.getY(corner),
        at.getZ(corner),
        facing.getX(corner),
        facing.getY(corner),
        facing.getZ(corner),
        tag,
      );
    }
    if (flat !== geometry) {
      flat.dispose();
    }
    geometry.dispose();
    return this;
  }

  /**
   * Adds a box standing on its bottom.
   *
   * @param w - size along x
   * @param h - height
   * @param d - size along z
   * @param x - middle, x
   * @param y - bottom
   * @param z - middle, z
   * @param tag - what it is
   * @param turn - turn about the vertical
   * @returns this
   */
  box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    tag: Tag,
    turn = 0,
  ): this {
    const shape = new THREE.BoxGeometry(w, h, d);
    shape.translate(0, h / 2, 0);
    shape.rotateY(turn);
    shape.translate(x, y, z);
    return this.add(shape, tag);
  }

  /**
   * Adds a cylinder, or a cone where one radius is nought.
   *
   * @param top - radius at the top
   * @param bottom - radius at the bottom
   * @param h - length
   * @param x - middle, x
   * @param y - bottom for an upright one, the middle for one lying down
   * @param z - middle, z
   * @param tag - what it is
   * @param sides - how many sides
   * @param axis - which way it runs
   * @returns this
   */
  cyl(
    top: number,
    bottom: number,
    h: number,
    x: number,
    y: number,
    z: number,
    tag: Tag,
    sides = 8,
    axis: "x" | "y" | "z" = "y",
  ): this {
    const shape = new THREE.CylinderGeometry(top, bottom, h, sides);
    if (axis === "y") {
      shape.translate(0, h / 2, 0);
    } else if (axis === "x") {
      shape.rotateZ(-Math.PI / 2);
    } else {
      shape.rotateX(Math.PI / 2);
    }
    shape.translate(x, y, z);
    return this.add(shape, tag);
  }

  /**
   * Adds a ball, squashed if wanted.
   *
   * @param r - radius
   * @param x - middle, x
   * @param y - middle, y
   * @param z - middle, z
   * @param tag - what it is
   * @param squash - how much flatter than round it is
   * @param stretch - how much longer along x
   * @returns this
   */
  ball(
    r: number,
    x: number,
    y: number,
    z: number,
    tag: Tag,
    squash = 1,
    stretch = 1,
  ): this {
    const shape = new THREE.IcosahedronGeometry(r, 1);
    shape.scale(stretch, squash, 1);
    shape.translate(x, y, z);
    return this.add(shape, tag);
  }

  /**
   * Adds an outline stood up into a solid: a plan at the bottom, another at
   * the top, walls between them and a lid on each end.
   *
   * @param low - the plan at the bottom, x along and y across
   * @param high - the plan at the top, as many corners in the same order
   * @param bottom - height of the bottom
   * @param top - height of the top
   * @param tag - what it is
   * @returns this
   * @remarks
   * The plans are convex, which is all a car's are. The facing of every
   * triangle is checked against the middle of the solid rather than trusted,
   * so it does not matter which way round an outline was written down.
   */
  prism(
    low: readonly Vec[],
    high: readonly Vec[],
    bottom: number,
    top: number,
    tag: Tag,
  ): this {
    const middle = new THREE.Vector3(
      low.reduce((sum, point) => sum + point.x, 0) / low.length,
      (bottom + top) / 2,
      low.reduce((sum, point) => sum + point.y, 0) / low.length,
    );
    const lower = low.map(
      (point) => new THREE.Vector3(point.x, bottom, point.y),
    );
    const upper = high.map((point) => new THREE.Vector3(point.x, top, point.y));
    for (let at = 0; at < lower.length; at += 1) {
      const next = (at + 1) % lower.length;
      const a = lower[at];
      const b = lower[next];
      const c = upper[next];
      const d = upper[at];
      if (
        a !== undefined &&
        b !== undefined &&
        c !== undefined &&
        d !== undefined
      ) {
        this.facing(a, b, c, middle, tag);
        this.facing(a, c, d, middle, tag);
      }
    }
    for (let at = 1; at + 1 < lower.length; at += 1) {
      const first = lower[0];
      const one = lower[at];
      const two = lower[at + 1];
      const lid = upper[0];
      const three = upper[at];
      const four = upper[at + 1];
      if (first !== undefined && one !== undefined && two !== undefined) {
        this.facing(first, one, two, middle, tag);
      }
      if (lid !== undefined && three !== undefined && four !== undefined) {
        this.facing(lid, three, four, middle, tag);
      }
    }
    return this;
  }

  /**
   * Merges everything added so far.
   *
   * @returns one geometry with the attributes the materials read
   */
  build(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.positions, 3),
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(this.normals, 3),
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(this.colors, 3),
    );
    // The four numbers the materials read, packed into one attribute: a
    // figure needs five of its own per instance on top, and WebGL has only
    // sixteen slots to go round.
    const tags = new Float32Array(this.glows.length * 4);
    this.glows.forEach((glow, at) => {
      tags.set(
        [glow, this.paints[at] ?? 0, this.parts[at] ?? 0, this.limbs[at] ?? 0],
        at * 4,
      );
    });
    geometry.setAttribute("tag", new THREE.Float32BufferAttribute(tags, 4));
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    return geometry;
  }

  /** One triangle, turned to face away from the middle of the solid. */
  private facing(
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    middle: THREE.Vector3,
    tag: Tag,
  ): void {
    const normal = new THREE.Vector3()
      .subVectors(b, a)
      .cross(new THREE.Vector3().subVectors(c, a));
    const out = new THREE.Vector3()
      .addVectors(a, b)
      .add(c)
      .divideScalar(3)
      .sub(middle);
    const flip = normal.dot(out) < 0;
    normal.normalize();
    if (flip) {
      normal.negate();
    }
    const order = flip ? [a, c, b] : [a, b, c];
    for (const point of order) {
      this.corner(point.x, point.y, point.z, normal.x, normal.y, normal.z, tag);
    }
  }

  /** One corner and everything that goes with it. */
  private corner(
    x: number,
    y: number,
    z: number,
    nx: number,
    ny: number,
    nz: number,
    tag: Tag,
  ): void {
    this.tint.setHex(tag.color);
    this.positions.push(x, y, z);
    this.normals.push(nx, ny, nz);
    this.colors.push(this.tint.r, this.tint.g, this.tint.b);
    this.glows.push(tag.glow ?? 0);
    this.paints.push(tag.paint ?? 0);
    this.parts.push(tag.part ?? 0);
    this.limbs.push(tag.limb ?? 0);
  }
}

/** Colours used across the models. */
const C = {
  tyre: 0x1c1917,
  hub: 0x9ca3af,
  glass: 0x1f2a36,
  bumper: 0x27272a,
  head: 0xfff4cf,
  tail: 0xdc2626,
  blue: 0x2563eb,
  red: 0xef4444,
  police: 0x0a45a8,
  white: 0xf4f6f8,
  dark: 0x18181b,
  steel: 0x9ca3af,
  trunk: 0x5b3d26,
  leaf: 0xffffff,
  pole: 0x4b5563,
  lamp: 0xffe3a3,
  olive: 0x556b2f,
} as const;

/** A part that takes the car's paint. */
const PAINTED: Tag = { color: 0xffffff, paint: 1 };

/** Whether a body wears the blue lamps of the police. */
export function policeBody(body: VehicleBody): boolean {
  return body === "patrol" || body === "patrolbike" || body === "patrolboat";
}

/** Whether a body is ridden rather than sat in. */
export function riddenBody(body: VehicleBody): boolean {
  return body === "bike" || body === "patrolbike" || body === "cycle";
}

/**
 * The model of one sort of vehicle, nose along +x.
 *
 * @param body - which sort
 * @returns the geometry, standing on the road at y nought
 */
export function vehicleModel(body: VehicleBody): THREE.BufferGeometry {
  const make = new ModelBuilder();
  if (riddenBody(body)) {
    twoWheeler(make, body);
  } else if (body === "boat" || body === "patrolboat") {
    boat(make, body);
  } else if (body === "tank") {
    tankHull(make);
  } else {
    fourWheeler(make, body);
  }
  return make.build();
}

/** A car, a van, a truck: body, cabin, wheels and lamps. */
function fourWheeler(make: ModelBuilder, body: VehicleBody): void {
  const shape = VEHICLES[body];
  const tiers = tiersOf(body);
  const long = shape.length;
  const wide = shape.width;
  const tractor = body === "tractor";
  const wheel = tractor ? 4.2 : Math.min(5.5, Math.max(2.8, tiers.belt * 0.37));
  const axle = long / 2 - Math.min(8, long * 0.18);
  const lift = wheel * 0.55;
  for (const along of [axle, -axle]) {
    const big = tractor && along < 0 ? 7.4 : wheel;
    for (const side of [1, -1]) {
      const z = side * (wide / 2 - 1.4);
      make.cyl(big, big, 2.8, along, big, z, { color: C.tyre }, 10, "z");
      make.cyl(
        big * 0.5,
        big * 0.5,
        3,
        along,
        big,
        z,
        { color: C.hub },
        6,
        "z",
      );
    }
  }
  const outline = bodyOutline(body);
  make.prism(outline, outline, lift, tiers.belt, PAINTED);
  // A darker skirt at the bottom, so the body does not float on its wheels.
  const skirt = outline.map((point) => ({
    x: point.x * 1.01,
    y: point.y * 1.01,
  }));
  make.prism(skirt, skirt, lift - 0.4, lift + 1.4, { color: C.bumper });
  const cabin = cabinOutline(body);
  const rake = Math.min(
    tiers.rake,
    (tiers.cabinFront - tiers.cabinBack) * 0.45,
  );
  const back = tiers.rakeBack ?? rake * 0.35;
  const roof = cabin.map((point) => ({
    x:
      point.x > (tiers.cabinFront + tiers.cabinBack) / 2
        ? point.x - rake
        : point.x + back,
    y: point.y * 0.94,
  }));
  const glassTop = tiers.tall - 1;
  make.prism(cabin, roof, tiers.belt, glassTop, { color: C.glass });
  make.prism(roof, roof, glassTop, tiers.tall, PAINTED);
  // Lamps front and back, and the bumpers they sit over.
  for (const side of [1, -1]) {
    const z = side * (wide / 2 - 3.2);
    make.box(1.2, 1.8, 3.4, long / 2 - 0.4, tiers.belt * 0.62, z, {
      color: C.head,
      glow: NIGHT,
    });
    make.box(1.2, 1.6, 3, -long / 2 + 0.4, tiers.belt * 0.68, z, {
      color: C.tail,
      glow: 1.35,
    });
  }
  make.box(1.4, 2, wide * 0.9, long / 2 - 0.5, lift, 0, { color: C.bumper });
  make.box(1.4, 2, wide * 0.9, -long / 2 + 0.5, lift, 0, { color: C.bumper });
  liveries(make, body, long, wide, tiers.belt, tiers.tall);
}

/** What is painted on or bolted to the roof of the working vehicles. */
function liveries(
  make: ModelBuilder,
  body: VehicleBody,
  long: number,
  wide: number,
  belt: number,
  tall: number,
): void {
  const middle = (tiersOf(body).cabinFront + tiersOf(body).cabinBack) / 2;
  if (policeBody(body) || body === "ambulance" || body === "firetruck") {
    make.box(2.6, 1.4, 3.6, middle, tall, -2.2, {
      color: C.blue,
      glow: FLASH_ONE,
    });
    make.box(2.6, 1.4, 3.6, middle, tall, 2.2, {
      color: body === "patrol" ? C.blue : C.red,
      glow: FLASH_TWO,
    });
  }
  if (body === "patrol") {
    for (const side of [1, -1]) {
      make.box(
        long * 0.86,
        1.6,
        0.3,
        0,
        belt * 0.42,
        side * (wide / 2 + 0.05),
        {
          color: C.police,
        },
      );
    }
  }
  if (body === "ambulance" || body === "firetruck") {
    for (const side of [1, -1]) {
      make.box(long * 0.9, 1.4, 0.3, 0, belt * 0.55, side * (wide / 2 + 0.05), {
        color: body === "ambulance" ? C.red : C.white,
      });
    }
  }
  if (body === "firetruck") {
    for (const side of [1, -1]) {
      make.box(long * 0.62, 0.8, 0.8, -long * 0.08, tall + 0.6, side * 3.2, {
        color: C.steel,
      });
    }
  }
  if (body === "taxi") {
    make.box(3, 2, 7, middle - 2, tall, 0, { color: 0xfde047, glow: NIGHT });
  }
}

/** A motorbike or a bicycle: two wheels and a frame between them. */
function twoWheeler(make: ModelBuilder, body: VehicleBody): void {
  const shape = VEHICLES[body];
  const long = shape.length;
  const cycle = body === "cycle";
  const wheel = cycle ? 4.2 : 3.6;
  for (const along of [long / 2 - wheel, -long / 2 + wheel]) {
    make.cyl(
      wheel,
      wheel,
      cycle ? 0.8 : 1.8,
      along,
      wheel,
      0,
      { color: C.tyre },
      12,
      "z",
    );
  }
  if (cycle) {
    make.box(long - wheel * 2, 0.9, 0.9, 0, wheel + 2.5, 0, PAINTED);
    make.box(1, 4, 1, -1.5, wheel, 0, PAINTED);
    make.box(3, 0.8, 1.4, -1.6, wheel + 4, 0, { color: C.dark });
    make.box(0.8, 0.8, 4.4, long / 2 - wheel - 0.5, wheel + 5, 0, {
      color: C.dark,
    });
  } else {
    make.box(long * 0.55, 3.4, 3.2, 0, wheel + 0.8, 0, PAINTED);
    make.box(long * 0.32, 1.2, 3, -long * 0.12, wheel + 4.2, 0, {
      color: C.dark,
    });
    make.box(1, 1.2, 5.4, long / 2 - wheel - 0.6, wheel + 4.6, 0, {
      color: C.dark,
    });
    make.box(0.8, 1.4, 2, long / 2 - 0.6, wheel + 1.8, 0, {
      color: C.head,
      glow: NIGHT,
    });
    if (body === "patrolbike") {
      make.box(1, 1, 1, -long / 2 + 2, wheel + 5.4, -1.2, {
        color: C.blue,
        glow: FLASH_ONE,
      });
      make.box(1, 1, 1, -long / 2 + 2, wheel + 5.4, 1.2, {
        color: C.blue,
        glow: FLASH_TWO,
      });
    }
  }
}

/** A boat: a pointed hull and a little wheelhouse. */
function boat(make: ModelBuilder, body: VehicleBody): void {
  const shape = VEHICLES[body];
  const long = shape.length / 2;
  const wide = shape.width / 2;
  const hull: readonly Vec[] = [
    { x: -long, y: -wide * 0.85 },
    { x: long * 0.45, y: -wide },
    { x: long, y: 0 },
    { x: long * 0.45, y: wide },
    { x: -long, y: wide * 0.85 },
  ];
  const keel = hull.map((point) => ({ x: point.x * 0.92, y: point.y * 0.7 }));
  make.prism(keel, hull, -2.5, 4, PAINTED);
  make.prism(hull, hull, 4, 4.8, { color: 0xd6d3d1 });
  make.box(long * 0.6, 5, wide * 1.1, -long * 0.15, 4.8, 0, { color: C.glass });
  make.box(long * 0.66, 1, wide * 1.2, -long * 0.15, 9.8, 0, PAINTED);
  if (body === "patrolboat") {
    make.box(1.6, 1.2, 2.2, -long * 0.15, 10.8, -1.4, {
      color: C.blue,
      glow: FLASH_ONE,
    });
    make.box(1.6, 1.2, 2.2, -long * 0.15, 10.8, 1.4, {
      color: C.blue,
      glow: FLASH_TWO,
    });
    for (const side of [1, -1]) {
      make.box(long * 1.2, 1.2, 0.3, -long * 0.1, 2, side * wide * 0.95, {
        color: C.police,
      });
    }
  }
}

/** The tank's hull and tracks; the turret is its own model. */
function tankHull(make: ModelBuilder): void {
  const shape = VEHICLES.tank;
  const tiers = tiersOf("tank");
  const outline = bodyOutline("tank");
  const long = shape.length;
  const wide = shape.width;
  for (const side of [1, -1]) {
    make.box(long, tiers.belt * 0.62, wide * 0.24, 0, 0, side * wide * 0.38, {
      color: C.dark,
    });
    for (let wheel = 0; wheel < 5; wheel += 1) {
      const along = -long * 0.38 + (wheel * long * 0.76) / 4;
      make.cyl(
        2.6,
        2.6,
        wide * 0.25,
        along,
        3,
        side * wide * 0.38,
        { color: 0x3f3f46 },
        8,
        "z",
      );
    }
  }
  const deck = outline.map((point) => ({
    x: point.x * 0.96,
    y: point.y * 0.82,
  }));
  make.prism(deck, deck, tiers.belt * 0.45, tiers.belt, PAINTED);
}

/**
 * The tank's turret and gun, which turn on their own.
 *
 * @returns the geometry, centred on the turret ring
 */
export function turretModel(): THREE.BufferGeometry {
  const tiers = tiersOf("tank");
  const make = new ModelBuilder();
  const cabin = cabinOutline("tank");
  const middle = (tiers.cabinFront + tiers.cabinBack) / 2;
  const ring = cabin.map((point) => ({ x: point.x - middle, y: point.y }));
  const top = ring.map((point) => ({ x: point.x * 0.86, y: point.y * 0.84 }));
  make.prism(ring, top, tiers.belt, tiers.tall, PAINTED);
  make.cyl(
    1.3,
    1.5,
    26,
    tiers.cabinFront - middle + 12,
    tiers.belt + 3.4,
    0,
    PAINTED,
    8,
    "x",
  );
  make.cyl(
    2,
    2,
    3,
    tiers.cabinFront - middle + 25,
    tiers.belt + 3.4,
    0,
    { color: C.dark },
    8,
    "x",
  );
  return make.build();
}

/**
 * The man on a motorbike or a bicycle, sitting up.
 *
 * @returns a seated figure facing +x, seat at y nought
 */
export function riderModel(): THREE.BufferGeometry {
  const make = new ModelBuilder();
  make.box(3, 5.4, 4.6, -0.8, 0, 0, { color: 0x27272a });
  for (const side of [1, -1]) {
    make.box(5, 1.6, 1.6, 1.6, 0, side * 1.6, { color: 0x1e293b });
    make.box(
      4.4,
      1.3,
      1.3,
      1.4,
      3.6,
      side * 2.6,
      { color: 0x27272a },
      0.1 * side,
    );
  }
  make.ball(2.1, -0.4, 7.2, 0, { color: 0xfafaf9 }, 1, 1.1);
  return make.build();
}

/**
 * One person, facing +x, feet at y nought.
 *
 * @returns the geometry, with the clothing and the limbs marked for the
 *   figure material
 * @remarks
 * Every part says which piece of clothing it is, so one geometry dresses as
 * a policeman, a gangster or a woman in a bikini depending on the four
 * colours handed to it; and every limb says which one it is, so the material
 * swings them. The gun is part of everybody and folded away unless held.
 */
export function figureModel(): THREE.BufferGeometry {
  const make = new ModelBuilder();
  for (const side of [1, -1]) {
    const limb = side > 0 ? LIMB.rightLeg : LIMB.leftLeg;
    make.box(2, 6.2, 1.9, 0, 0, side * 1.15, {
      color: 0xffffff,
      part: PART.legs,
      limb,
    });
    make.box(2.6, 0.9, 1.9, 0.4, 0, side * 1.15, { color: 0x1c1917, limb });
    const arm = side > 0 ? LIMB.rightArm : LIMB.leftArm;
    make.box(1.5, 4.6, 1.5, 0, 6.9, side * 3.25, {
      color: 0xffffff,
      part: PART.shirt,
      limb: arm,
    });
    make.box(1.4, 1.2, 1.4, 0, 5.7, side * 3.25, {
      color: 0xffffff,
      part: PART.skin,
      limb: arm,
    });
  }
  make.box(2.8, 5.4, 5, 0, 6.2, 0, { color: 0xffffff, part: PART.shirt });
  make.box(1.2, 0.8, 1.2, 0, 11.6, 0, { color: 0xffffff, part: PART.skin });
  make.box(2.7, 2.8, 2.6, 0.1, 12, 0, { color: 0xffffff, part: PART.skin });
  make.box(2.9, 1, 2.8, -0.05, 14.4, 0, { color: 0xffffff, part: PART.hair });
  make.box(0.9, 2.2, 2.8, -1.1, 12.4, 0, { color: 0xffffff, part: PART.hair });
  make.box(1, 3.4, 0.9, 0.5, 2.6, 3.25, {
    color: 0x111111,
    part: PART.gun,
    limb: LIMB.rightArm,
  });
  return make.build();
}

/**
 * A cat or a dog, facing +x.
 *
 * @param dog - true for the dog, which is bigger and has a snout
 * @returns the geometry, fur taking the instance's colour
 */
export function animalModel(dog: boolean): THREE.BufferGeometry {
  const make = new ModelBuilder();
  const size = dog ? 1.5 : 1;
  const fur: Tag = { color: 0xffffff, paint: 1 };
  for (const along of [2.6, -2.6]) {
    for (const side of [1, -1]) {
      make.box(
        1 * size,
        2.6 * size,
        1 * size,
        along * size,
        0,
        side * 1.2 * size,
        fur,
      );
    }
  }
  make.box(7.4 * size, 2.6 * size, 3.2 * size, 0, 2.4 * size, 0, fur);
  make.box(2.8 * size, 2.6 * size, 2.8 * size, 4.4 * size, 3.8 * size, 0, fur);
  if (dog) {
    make.box(1.8 * size, 1.3 * size, 1.6 * size, 6.2 * size, 4 * size, 0, fur);
  }
  for (const side of [1, -1]) {
    make.box(
      0.7 * size,
      1.3 * size,
      0.7 * size,
      4.4 * size,
      6.4 * size,
      side * 0.9 * size,
      fur,
    );
  }
  make.box(4 * size, 0.8 * size, 0.8 * size, -5 * size, 4 * size, 0, fur, 0.5);
  return make.build();
}

/**
 * A helicopter without its rotor, nose along +x.
 *
 * @param kind - the police machine is `police`; the others as the engine
 *   names them
 * @returns the geometry, skids at y nought, body taking the paint
 */
export function heliModel(kind: ChopperKind | "police"): THREE.BufferGeometry {
  const make = new ModelBuilder();
  make.ball(8, 6, 8, 0, PAINTED, 0.8, 1.45);
  make.ball(5.6, 12.4, 8.4, 0, { color: C.glass }, 0.72, 0.8);
  make.box(26, 3, 2.6, -16, 7.4, 0, PAINTED);
  make.box(4, 8, 0.8, -28, 7.4, 0, PAINTED);
  make.box(3, 0.8, 9, -26, 9, 0, PAINTED);
  make.cyl(0.9, 0.9, 4, 4, 13, 0, { color: C.dark }, 6);
  for (const side of [1, -1]) {
    make.box(22, 0.9, 0.9, 5, 0, side * 5.2, { color: C.dark });
    make.box(0.8, 3.6, 0.8, 0, 0, side * 5.2, { color: C.dark });
    make.box(0.8, 3.6, 0.8, 10, 0, side * 5.2, { color: C.dark });
  }
  if (kind === "police") {
    make.box(14, 2.2, 0.3, 4, 6.2, -8.2, { color: C.police });
    make.box(14, 2.2, 0.3, 4, 6.2, 8.2, { color: C.police });
    make.box(1.4, 1, 1.4, 6, 1.6, -4, { color: C.blue, glow: FLASH_ONE });
    make.box(1.4, 1, 1.4, 6, 1.6, 4, { color: C.red, glow: FLASH_TWO });
  } else if (kind === "rescue") {
    make.box(3, 3, 0.3, 6, 7, -8.4, { color: C.red });
    make.box(3, 3, 0.3, 6, 7, 8.4, { color: C.red });
  }
  make.box(1, 1, 1, -28, 12, 0, { color: C.red, glow: NIGHT });
  return make.build();
}

/** How high the rotor turns above a helicopter's skids. */
export const ROTOR_HIGH = 17;

/**
 * A rotor: four blades round a hub.
 *
 * @returns the geometry, turning about y at its middle
 */
export function rotorModel(): THREE.BufferGeometry {
  const make = new ModelBuilder();
  for (let blade = 0; blade < 2; blade += 1) {
    make.box(50, 0.4, 2.4, 0, 0, 0, { color: 0x27272a }, (blade * Math.PI) / 2);
  }
  make.cyl(1.6, 1.6, 1.4, 0, -0.5, 0, { color: C.dark }, 8);
  return make.build();
}

/**
 * The aeroplane: a twin-engined thing with a high tail.
 *
 * @returns the geometry, wheels at y nought, nose along +x
 */
export function planeModel(): THREE.BufferGeometry {
  const make = new ModelBuilder();
  make.cyl(4.4, 4.4, 50, 0, 7, 0, PAINTED, 10, "x");
  make.cyl(0.6, 4.4, 10, 30, 7, 0, PAINTED, 10, "x");
  make.cyl(4.4, 1.2, 12, -31, 8, 0, PAINTED, 10, "x");
  make.box(5, 2.4, 6.2, 27, 8.6, 0, { color: C.glass });
  make.box(9, 1.2, 62, 3, 6, 0, PAINTED);
  make.box(6, 0.8, 22, -34, 9, 0, PAINTED);
  make.box(7, 11, 0.9, -34, 9, 0, PAINTED);
  make.box(48, 1.2, 0.3, 0, 6.6, 4.4, { color: C.blue });
  make.box(48, 1.2, 0.3, 0, 6.6, -4.4, { color: C.blue });
  for (const side of [1, -1]) {
    make.cyl(2, 2, 10, 6, 4.4, side * 12, { color: 0xd4d4d8 }, 8, "x");
    make.box(0.4, 7, 0.6, 11.2, 1, side * 12, { color: C.dark });
    make.box(1.6, 1.6, 1.6, 2, 5.4, side * 30.5, {
      color: side > 0 ? 0x22c55e : C.red,
      glow: 1.6,
    });
  }
  for (const along of [18, -2]) {
    make.cyl(1.4, 1.4, 1, along, 1.4, 0, { color: C.tyre }, 8, "z");
  }
  return make.build();
}

/**
 * One carriage of the train, or the engine.
 *
 * @param engine - true for the one at the front
 * @returns the geometry, nose along +x
 */
export function wagonModel(engine: boolean): THREE.BufferGeometry {
  const make = new ModelBuilder();
  const long = TRAIN_LONG;
  const wide = TRAIN_WIDE;
  make.box(long - 2, 4, wide - 6, 0, 1, 0, { color: 0x27272a });
  make.box(long, 10, wide, 0, 5, 0, { color: 0xb91c1c });
  make.box(long - 3, 7, wide + 0.2, 0, 15, 0, {
    color: C.glass,
    glow: NIGHT * 0.6,
  });
  make.box(long, 3, wide, 0, 22, 0, { color: 0xb91c1c });
  make.box(long - 2, 2.4, wide - 4, 0, 25, 0, { color: 0x8a95a5 });
  make.box(long + 0.2, 1.2, wide + 0.3, 0, 12, 0, { color: 0xe2e8f0 });
  if (engine) {
    make.box(3, 8, wide - 4, long / 2 - 1, 14, 0, { color: 0x111827 });
    for (const side of [1, -1]) {
      make.box(1, 2, 3, long / 2 + 0.3, 7, side * (wide / 2 - 4), {
        color: C.head,
        glow: 1.7,
      });
    }
    make.box(8, 3, 1, 0, 27.4, 0, { color: 0x0f172a });
  }
  return make.build();
}

/**
 * A tree.
 *
 * @param round - a broad round crown, or a tall pointed one
 * @returns the geometry for a crown a unit wide, the crown taking the tint
 */
export function treeModel(round: boolean): THREE.BufferGeometry {
  const make = new ModelBuilder();
  const crown: Tag = { color: 0xffffff, paint: 1 };
  make.cyl(0.11, 0.16, 1.3, 0, 0, 0, { color: C.trunk }, 6);
  if (round) {
    make.ball(0.95, 0, 1.75, 0, crown, 0.82);
    make.ball(0.62, 0.42, 2.25, 0.25, crown, 0.85);
    make.ball(0.55, -0.4, 2.1, -0.3, crown, 0.85);
  } else {
    make.cyl(0, 0.9, 1.6, 0, 0.8, 0, crown, 7);
    make.cyl(0, 0.72, 1.4, 0, 1.6, 0, crown, 7);
    make.cyl(0, 0.5, 1.2, 0, 2.4, 0, crown, 7);
  }
  return make.build();
}

/** How tall a street lamp stands. */
export const LAMP_HIGH = 44;

/** How far its head reaches out over the road. */
export const LAMP_REACH = 11;

/**
 * A street lamp, its arm reaching out along +x.
 *
 * @returns the geometry, foot at y nought
 */
export function lampModel(): THREE.BufferGeometry {
  const make = new ModelBuilder();
  make.cyl(0.9, 1.2, LAMP_HIGH, 0, 0, 0, { color: C.pole }, 6);
  make.box(LAMP_REACH, 1, 1, LAMP_REACH / 2, LAMP_HIGH - 1, 0, {
    color: C.pole,
  });
  make.box(5, 1.6, 3, LAMP_REACH, LAMP_HIGH - 2.4, 0, { color: C.pole });
  make.box(4, 0.5, 2.4, LAMP_REACH, LAMP_HIGH - 2.9, 0, {
    color: C.lamp,
    glow: NIGHT,
  });
  return make.build();
}

/** How tall a traffic light stands. */
export const SIGNAL_HIGH = 30;

/**
 * The post of a traffic light, with its lamp housing facing -x.
 *
 * @returns the geometry, foot at y nought
 */
export function signalModel(): THREE.BufferGeometry {
  const make = new ModelBuilder();
  make.cyl(0.8, 0.8, SIGNAL_HIGH, 0, 0, 0, { color: 0x3f3f46 }, 6);
  make.box(3, 10, 3.4, 0, SIGNAL_HIGH - 4, 0, { color: 0x18181b });
  return make.build();
}

/**
 * One launcher of the air defence.
 *
 * @returns the geometry, foot at y nought, tubes pointing up and along +x
 */
export function ackModel(): THREE.BufferGeometry {
  const make = new ModelBuilder();
  make.box(30, 4, 30, 0, 0, 0, PAINTED);
  make.box(14, 6, 14, 0, 4, 0, PAINTED);
  for (const side of [-4.5, -1.5, 1.5, 4.5]) {
    const tube = new THREE.CylinderGeometry(1.3, 1.3, 18, 6);
    tube.rotateZ(-0.9);
    tube.translate(2, 16, side);
    make.add(tube, { color: C.olive });
  }
  return make.build();
}

/**
 * A crate with something in it, for a pickup.
 *
 * @returns the geometry, a unit-ish box centred on its middle, taking the
 *   pickup's colour
 */
export function crateModel(): THREE.BufferGeometry {
  const make = new ModelBuilder();
  make.box(8, 8, 8, 0, -4, 0, { color: 0xffffff, paint: 1, glow: 1.25 });
  make.box(8.4, 1.2, 8.4, 0, -0.6, 0, { color: 0x1c1917 });
  return make.build();
}

/**
 * A charge on the road: a block with a lamp on it.
 *
 * @returns the geometry, foot at y nought
 */
export function chargeModel(): THREE.BufferGeometry {
  const make = new ModelBuilder();
  make.box(7, 3, 5, 0, 0, 0, { color: 0x44403c });
  make.box(2, 1, 2, 0, 3, 0, { color: C.red, glow: FLASH_ONE });
  return make.build();
}

/**
 * A lump of tree, cut out of nowhere: the colours woods come in.
 *
 * @returns the greens a tree's crown may take, as three colours
 */
export function crownTints(): readonly THREE.Color[] {
  return [0x3f6b2a, 0x2f6b34, 0x4d7c0f, 0x557a2b, 0x3b5f2c].map(
    (tint) => new THREE.Color(tint),
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
