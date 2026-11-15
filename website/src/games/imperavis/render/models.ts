/**
 * Low-poly models built in code: every building (by kind and tier), the
 * building site, trees, ships, carts and townsfolk. No external assets.
 *
 * @module
 * @remarks
 * A model is many simple shapes merged into one geometry with a colour per
 * vertex and a "glow" value for windows that light up at night. One merged
 * geometry per model lets the view draw all buildings of a kind with a single
 * instanced draw call.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { BUILDING } from "@/games/imperavis/engine/buildings-data";
import type { UnitShape } from "@/games/imperavis/engine/units-data";
import type {
  BuildingKind,
  ShipKind,
  UnitKind,
} from "@/games/imperavis/engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- model geometry: sizes, offsets and colours */

/** Colours used across the models. */
export const C = {
  plaster: 0xe9dfc6,
  plasterWarm: 0xe3cfa4,
  timber: 0x6b4a2f,
  timberDark: 0x4a3322,
  roofRed: 0xa4442e,
  roofBrown: 0x7a4b2e,
  roofSlate: 0x4d5a6b,
  thatch: 0xc9a65a,
  stone: 0x9d9a90,
  stoneDark: 0x75726b,
  brick: 0xa8553a,
  window: 0x2c2a33,
  door: 0x3e2a1c,
  wood: 0x8a6239,
  plank: 0xc39a62,
  green: 0x5e8c3a,
  greenDark: 0x3f6b2a,
  grain: 0xd9b54a,
  wool: 0xf1efe6,
  metal: 0x5a5d63,
  copper: 0xb8733d,
  water: 0x3a6f8f,
  clay: 0xb46a3c,
  ore: 0x7d4e3e,
  coal: 0x2b2a2a,
  sail: 0xf2ead6,
  sailTrader: 0xc9873f,
  flag: 0x9b2d30,
  awningA: 0xc0392b,
  awningB: 0x2e6da4,
  awningC: 0xd8a51d,
  gold: 0xd6b04c,
  path: 0xb59c74,
  glass: 0x9fc9d8,
  brass: 0xc9a243,
  sand: 0xe8d8a6,
  leaf: 0x4f8f2f,
  tobacco: 0x7a5230,
  cannon: 0x26272b,
  pearl: 0xf1ecf4,
  herb: 0x6fb04a,
  soil: 0x6e4f33,
  patina: 0x6f8fa3,
  hullDark: 0x3a2b21,
  hullPirate: 0x2b2420,
  sailPirate: 0x2a2a2a,
  ember: 0xff8a2a,
} as const;

/** The glow value of fire: lit by day as well as by night. */
const FIRE_GLOW = 2;

/**
 * Detail of the models built from now on: 0 the simple shapes, 1 with
 * window frames, doors, roof tiles and trims, curved sails and rigging.
 * Set by the graphics level before the layers build their models.
 */
let modelDetail = 0;

/** Parts thinner than this are panes or doors set in a wall. */
const PANE = 0.07;

/** Window frames: how much wider than the pane, and the bars across it. */
const FRAME = 0.06;
const BAR = 0.022;

/** Colour of painted window and door frames. */
const FRAME_COLOR = 0xd8c8a6;

/** Roof tile rows per slope, and how much darker they are. */
const TILE_ROWS = 3;
const TILE_SHADE = 0.8;

/** Shade of the ridge and the eave boards against the roof. */
const RIDGE_SHADE = 0.62;

/** How far a sail bellies out, as a share of its width. */
const SAIL_BELLY = 0.16;

/** Colours of a townsperson. */
const WALKER = { tunic: 0x6d5a8a, legs: 0x4a3b2c, skin: 0xe0b48a } as const;

/** Colour of ropes and stays. */
const ROPE = 0x3b3128;

/**
 * Sets the detail of the models built from now on.
 *
 * @param detail - 0 simple, 1 fine
 */
export function setModelDetail(detail: number): void {
  modelDetail = detail;
}

/** Builds one model from simple parts. */
export class ModelBuilder {
  /** The parts so far. */
  private readonly parts: THREE.BufferGeometry[] = [];

  /** Detail of this model, from {@link setModelDetail} at its start. */
  readonly detail = modelDetail;

  /**
   * Adds a box.
   *
   * @param w - width (x)
   * @param h - height (y)
   * @param d - depth (z)
   * @param x - centre x
   * @param y - bottom y
   * @param z - centre z
   * @param color - colour
   * @param glow - 1 for a window that lights up at night
   * @param rotY - turn around the vertical axis
   * @returns this
   */
  box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: number,
    glow = 0,
    rotY = 0,
  ): this {
    const geometry = new THREE.BoxGeometry(w, h, d);
    geometry.rotateY(rotY);
    geometry.translate(x, y + h / 2, z);
    this.add(geometry, color, glow);
    const pane = Math.min(w, d) < PANE;
    if (this.detail > 0 && pane && glow === 1 && color === C.window) {
      this.frame(w, h, d, x, y, z, rotY, true);
    } else if (this.detail > 0 && pane && color === C.door) {
      this.frame(w, h, d, x, y, z, rotY, false);
    }
    return this;
  }

  /**
   * A frame around a window or door pane set in a wall: a border behind
   * it, and for windows bars across the glass and a stone sill.
   */
  private frame(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    rotY: number,
    window: boolean,
  ): void {
    const alongX = d <= w;
    const deep = Math.min(w, d);
    const size = alongX ? w : d;
    const across = (wide: number, thin: number) =>
      alongX ? [wide, thin] : [thin, wide];
    const below = window ? FRAME / 2 : 0;
    const [fw, fd] = across(size + FRAME, deep * 0.6);
    this.box(fw, h + below, fd, x, y - below, z, FRAME_COLOR, 0, rotY);
    if (window) {
      const [bw, bd] = across(BAR, deep + BAR);
      this.box(bw, h, bd, x, y, z, FRAME_COLOR, 0, rotY);
      const [cw, cd] = across(size, deep + BAR);
      this.box(cw, BAR, cd, x, y + h / 2 - BAR / 2, z, FRAME_COLOR, 0, rotY);
      const [sw, sd] = across(size + FRAME * 1.6, deep + FRAME);
      this.box(sw, BAR * 1.4, sd, x, y - below - BAR, z, C.stone, 0, rotY);
    }
  }

  /**
   * Adds a gabled roof (a prism) over a box of the given size.
   *
   * @param w - width (x), the ridge runs along x
   * @param h - height of the roof
   * @param d - depth (z)
   * @param x - centre x
   * @param y - eaves height
   * @param z - centre z
   * @param color - colour
   * @param rotY - turn around the vertical axis
   * @returns this
   */
  roof(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: number,
    rotY = 0,
  ): this {
    const shape = new THREE.Shape();
    shape.moveTo(-d / 2, 0);
    shape.lineTo(d / 2, 0);
    shape.lineTo(0, h);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: w,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, -w / 2);
    geometry.rotateY(Math.PI / 2 + rotY);
    geometry.translate(x, y, z);
    this.add(geometry, color, 0);
    if (this.detail > 0) {
      this.roofDetail(w, h, d, x, y, z, color, rotY);
    }
    return this;
  }

  /** Tile rows on both slopes, a ridge beam and boards along the eaves. */
  private roofDetail(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: number,
    rotY: number,
  ): void {
    const tile = new THREE.Color(color).multiplyScalar(TILE_SHADE).getHex();
    const dark = new THREE.Color(color).multiplyScalar(RIDGE_SHADE).getHex();
    const half = d / 2;
    const slope = Math.hypot(h, half);
    const angle = Math.atan2(h, half);
    const lift = 0.012;
    for (const side of [1, -1]) {
      for (let row = 0; row < TILE_ROWS; row += 1) {
        const t = (row + 0.5) / (TILE_ROWS + 0.4);
        const strip = new THREE.BoxGeometry(
          w + 0.02,
          0.022,
          (slope / TILE_ROWS) * 0.42,
        );
        strip.rotateX(side * angle);
        strip.translate(
          0,
          h * t + (half / slope) * lift,
          side * (half * (1 - t) + (h / slope) * lift),
        );
        strip.rotateY(rotY);
        strip.translate(x, y, z);
        this.add(strip, tile, 0);
      }
      // The eave board along the lower edge of the slope.
      const ox = side * (half - 0.02) * Math.sin(rotY);
      const oz = side * (half - 0.02) * Math.cos(rotY);
      this.box(w + 0.04, 0.05, 0.05, x + ox, y - 0.03, z + oz, dark, 0, rotY);
    }
    this.box(w + 0.05, 0.07, 0.08, x, y + h - 0.045, z, dark, 0, rotY);
  }

  /**
   * Adds a thin rod between two points (ropes, stays, poles).
   *
   * @param a - one end
   * @param b - the other end
   * @param r - radius
   * @param color - colour
   * @returns this
   */
  rod(
    a: readonly [number, number, number],
    b: readonly [number, number, number],
    r: number,
    color: number,
  ): this {
    const from = new THREE.Vector3(...a);
    const to = new THREE.Vector3(...b);
    const geometry = new THREE.CylinderGeometry(
      r,
      r,
      from.distanceTo(to),
      3,
      1,
      true,
    );
    geometry.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        to.clone().sub(from).normalize(),
      ),
    );
    geometry.translate(
      (from.x + to.x) / 2,
      (from.y + to.y) / 2,
      (from.z + to.z) / 2,
    );
    return this.add(geometry, color, 0);
  }

  /**
   * Adds a sail that bellies out towards +x: a curved sheet, seen from
   * both sides.
   *
   * @param w - width (z)
   * @param h - height (y)
   * @param x - x of the yard
   * @param y - bottom y
   * @param z - centre z
   * @param belly - how far the middle bulges, along +x
   * @param color - colour
   * @returns this
   */
  sheet(
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    belly: number,
    color: number,
  ): this {
    const segments = 4;
    for (const face of [1, -1]) {
      const geometry = new THREE.PlaneGeometry(w, h, segments, segments);
      geometry.rotateY(face * (Math.PI / 2));
      const position = geometry.getAttribute("position");
      for (let i = 0; i < position.count; i += 1) {
        const u = (position.getZ(i) / w) * 2;
        const v = (position.getY(i) / h) * 2;
        const bulge = belly * (1 - u * u) * (1 - v * v * 0.6);
        position.setX(i, bulge - face * 0.004);
      }
      geometry.translate(x, y + h / 2, z);
      this.add(geometry, color, 0);
    }
    return this;
  }

  /**
   * Adds a cylinder (or cone when the top radius is 0).
   *
   * @param rTop - top radius
   * @param rBottom - bottom radius
   * @param h - height
   * @param x - centre x
   * @param y - bottom y
   * @param z - centre z
   * @param color - colour
   * @param segments - sides
   * @returns this
   */
  cyl(
    rTop: number,
    rBottom: number,
    h: number,
    x: number,
    y: number,
    z: number,
    color: number,
    segments = 8,
  ): this {
    const geometry = new THREE.CylinderGeometry(rTop, rBottom, h, segments);
    geometry.translate(x, y + h / 2, z);
    return this.add(geometry, color, 0);
  }

  /**
   * Adds a ball, squashed if wanted.
   *
   * @param r - radius
   * @param x - centre x
   * @param y - centre y
   * @param z - centre z
   * @param color - colour
   * @param squash - vertical scale
   * @param detail - subdivisions
   * @returns this
   */
  ball(
    r: number,
    x: number,
    y: number,
    z: number,
    color: number,
    squash = 1,
    detail = 0,
  ): this {
    const geometry = new THREE.IcosahedronGeometry(r, detail);
    geometry.scale(1, squash, 1);
    geometry.translate(x, y, z);
    return this.add(geometry, color, 0);
  }

  /**
   * Adds a half dome.
   *
   * @param r - radius
   * @param x - centre x
   * @param y - base y
   * @param z - centre z
   * @param color - colour
   * @returns this
   */
  dome(r: number, x: number, y: number, z: number, color: number): this {
    const geometry = new THREE.SphereGeometry(
      r,
      10,
      5,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2,
    );
    geometry.translate(x, y, z);
    return this.add(geometry, color, 0);
  }

  /**
   * Adds loose triangles of one colour.
   *
   * @param positions - x, y, z of every corner, three corners a triangle
   * @param color - colour
   * @returns this
   */
  mesh(positions: readonly number[], color: number): this {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    return this.add(geometry, color, 0);
  }

  /**
   * Adds a finished geometry that already has colour and glow.
   *
   * @param geometry - the geometry
   * @returns this
   */
  take(geometry: THREE.BufferGeometry): this {
    this.parts.push(geometry);
    return this;
  }

  /**
   * Merges all parts.
   *
   * @returns one geometry with `color` and `glow` attributes
   */
  build(): THREE.BufferGeometry {
    const merged = mergeGeometries(this.parts, false) as THREE.BufferGeometry;
    merged.computeVertexNormals();
    merged.computeBoundingSphere();
    for (const part of this.parts) {
      part.dispose();
    }
    return merged;
  }

  /** Normalises a part and gives it colour and glow. */
  private add(
    geometry: THREE.BufferGeometry,
    color: number,
    glow: number,
  ): this {
    const flat = geometry.index !== null ? geometry.toNonIndexed() : geometry;
    if (flat !== geometry) {
      geometry.dispose();
    }
    flat.deleteAttribute("uv");
    flat.computeVertexNormals();
    const count = flat.getAttribute("position").count;
    const colors = new Float32Array(count * 3);
    const tint = new THREE.Color(color);
    for (let i = 0; i < count; i += 1) {
      colors[i * 3] = tint.r;
      colors[i * 3 + 1] = tint.g;
      colors[i * 3 + 2] = tint.b;
    }
    flat.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    // Lit embers glow day and night (2), windows only at night (1).
    const light = glow > 0 && color === C.ember ? FIRE_GLOW : glow;
    flat.setAttribute(
      "glow",
      new THREE.BufferAttribute(new Float32Array(count).fill(light), 1),
    );
    this.parts.push(flat);
    return this;
  }
}

/**
 * The model of a building of a kind and, for houses, a tier.
 *
 * @param kind - the building kind
 * @param tier - the house tier (ignored for other kinds)
 * @param level - the building stage; above 0 the model gets a stone kerb,
 *   an annex with a chimney at the back and stone steps - never a flag
 * @returns the geometry, centred on the footprint, floor at y 0
 */
export function buildingModel(
  kind: BuildingKind,
  tier: number,
  level = 0,
): THREE.BufferGeometry {
  const m = new ModelBuilder();
  const def = BUILDING[kind];
  // Ground plate so a building sits on slopes without floating edges.
  m.box(def.w - 0.1, 0.35, def.h - 0.1, 0, -0.3, 0, C.path);
  MODELS[kind](m, tier);
  if (level > 0) {
    upgradeExtras(m, def.w, def.h);
  }
  return m.build();
}

/**
 * The extras of an upgraded building: kerb, back annex with a chimney and
 * front steps. Deliberately no flag - see the note inside.
 */
function upgradeExtras(m: ModelBuilder, w: number, h: number): void {
  const ex = w / 2 - 0.12;
  const ez = h / 2 - 0.12;
  // Dressed stone kerb around the footprint edge.
  m.box(w - 0.1, 0.2, 0.16, 0, -0.02, ez, C.stone).box(
    w - 0.1,
    0.2,
    0.16,
    0,
    -0.02,
    -ez,
    C.stone,
  );
  m.box(0.16, 0.2, h - 0.1, ex, -0.02, 0, C.stone).box(
    0.16,
    0.2,
    h - 0.1,
    -ex,
    -0.02,
    0,
    C.stone,
  );
  for (const [x, z] of [
    [-ex, -ez],
    [ex, -ez],
    [-ex, ez],
    [ex, ez],
  ]) {
    m.box(0.26, 0.34, 0.26, x, -0.02, z, C.stoneDark);
  }
  // Upgrades never get a flag, pennant or banner: the second stage shows in
  // its architecture alone (stone kerb, annex, chimney, dressed corners).
  // Flags that belong to a model itself (kontor, barracks) stay with it.
  // A small annex on a stone plinth, with a slate roof, along the back edge.
  const aw = Math.max(0.7, w * 0.38);
  const ax = -w / 2 + aw / 2 + 0.2;
  const az = -h / 2 + 0.38;
  m.box(aw + 0.08, 0.22, 0.58, ax, -0.02, az, C.stoneDark);
  m.box(aw, 0.85, 0.5, ax, 0.2, az, C.plaster);
  for (const side of [-1, 1]) {
    m.box(0.1, 0.85, 0.54, ax + (side * (aw - 0.08)) / 2, 0.2, az, C.timber);
  }
  m.box(aw + 0.04, 0.08, 0.54, ax, 1.0, az, C.stoneDark);
  m.roof(aw + 0.15, 0.4, 0.62, ax, 1.08, az, C.roofSlate);
  m.box(0.2, 0.24, 0.02, ax, 0.45, az - 0.26, C.window, 1);
  m.box(0.02, 0.24, 0.2, ax - aw / 2 - 0.01, 0.45, az, C.window, 1);
  // A brick chimney with a stone cap rises from the annex roof.
  const cx = ax + aw / 2 - 0.18;
  m.box(0.18, 0.75, 0.18, cx, 1.0, az + 0.05, C.brick);
  m.box(0.24, 0.06, 0.24, cx, 1.75, az + 0.05, C.stoneDark);
  // Dressed stone steps before the front edge.
  m.box(Math.min(1.1, w * 0.4), 0.12, 0.28, 0, -0.02, ez - 0.2, C.stone);
}

/**
 * Runs a sub-builder, transforms its merged result and adds it to a model.
 *
 * @param m - the model to add to
 * @param draw - draws the part
 * @param place - moves and turns the finished part
 */
export function part(
  m: ModelBuilder,
  draw: (b: ModelBuilder) => void,
  place: (g: THREE.BufferGeometry) => void,
): void {
  const b = new ModelBuilder();
  draw(b);
  const geometry = b.build();
  place(geometry);
  m.take(geometry);
}

/**
 * A four-sided pyramid roof, square to the axes.
 *
 * @param m - the model
 * @param r - corner radius
 * @param h - height
 * @param x - centre x
 * @param y - bottom y
 * @param z - centre z
 * @param color - colour
 */
export function pyramid(
  m: ModelBuilder,
  r: number,
  h: number,
  x: number,
  y: number,
  z: number,
  color: number,
): void {
  part(
    m,
    (b) => b.cyl(0, r, h, 0, 0, 0, color, 4),
    (g) => {
      g.rotateY(Math.PI / 4);
      g.translate(x, y, z);
    },
  );
}

/**
 * A cannon barrel, pointing along +z before the turn.
 *
 * @param m - the model
 * @param x - breech x
 * @param y - barrel axis y
 * @param z - breech z
 * @param rotY - turn around the vertical axis
 * @param len - barrel length
 */
export function cannon(
  m: ModelBuilder,
  x: number,
  y: number,
  z: number,
  rotY: number,
  len = 0.55,
): void {
  part(
    m,
    (b) => {
      b.cyl(0.045, 0.07, len, 0, 0, 0, C.cannon, 8);
      b.ball(0.075, 0, 0, 0, C.cannon);
    },
    (g) => {
      g.rotateX(Math.PI / 2);
      g.rotateY(rotY);
      g.translate(x, y, z);
    },
  );
}

/**
 * A building site: posts, scaffold and a few planks.
 *
 * @param w - footprint width
 * @param h - footprint depth
 * @returns the geometry
 */
export function siteModel(w: number, h: number): THREE.BufferGeometry {
  const m = new ModelBuilder();
  m.box(w - 0.1, 0.3, h - 0.1, 0, -0.25, 0, C.path);
  const hx = w / 2 - 0.25;
  const hz = h / 2 - 0.25;
  for (const [x, z] of [
    [-hx, -hz],
    [hx, -hz],
    [-hx, hz],
    [hx, hz],
  ]) {
    m.box(0.1, 1.4, 0.1, x, 0, z, C.wood);
  }
  m.box(w - 0.4, 0.08, 0.1, 0, 0.7, -hz, C.plank).box(
    w - 0.4,
    0.08,
    0.1,
    0,
    0.7,
    hz,
    C.plank,
  );
  m.box(0.1, 0.08, h - 0.4, -hx, 1.2, 0, C.plank).box(
    0.1,
    0.08,
    h - 0.4,
    hx,
    1.2,
    0,
    C.plank,
  );
  m.box(w * 0.5, 0.5, h * 0.5, 0, 0, 0, C.plasterWarm);
  m.box(0.6, 0.25, 0.4, hx - 0.3, 0, hz - 0.5, C.plank);
  return m.build();
}

/**
 * The turning sails of a windmill, centred on the hub.
 *
 * @returns the geometry
 */
export function millBladesModel(): THREE.BufferGeometry {
  const m = new ModelBuilder();
  for (let i = 0; i < 4; i += 1) {
    const angle = (i * Math.PI) / 2;
    const geometry = new ModelBuilder()
      .box(0.08, 1.1, 0.04, 0, 0.05, 0, C.timber)
      .box(0.3, 0.9, 0.02, 0.18, 0.2, 0, C.sail)
      .build();
    geometry.rotateZ(angle);
    m.take(geometry);
  }
  m.cyl(0.1, 0.1, 0.12, 0, -0.06, 0, C.timberDark, 6);
  return m.build();
}

/**
 * A tree: a conifer or a broadleaf.
 *
 * @param conifer - true for a fir
 * @returns the geometry, foot at y 0
 */
export function treeModel(conifer: boolean): THREE.BufferGeometry {
  const m = new ModelBuilder();
  m.cyl(0.07, 0.1, 0.5, 0, 0, 0, C.timber, 5);
  if (conifer) {
    m.cyl(0, 0.5, 0.9, 0, 0.35, 0, C.greenDark, 6).cyl(
      0,
      0.36,
      0.7,
      0,
      0.85,
      0,
      C.greenDark,
      6,
    );
  } else {
    m.ball(0.5, 0, 0.95, 0, C.green, 0.9);
  }
  return m.build();
}

/**
 * A simpler tree for far away.
 *
 * @param conifer - true for a fir
 * @returns the geometry
 */
export function farTreeModel(conifer: boolean): THREE.BufferGeometry {
  const m = new ModelBuilder();
  if (conifer) {
    m.cyl(0, 0.5, 1.5, 0, 0.1, 0, C.greenDark, 4);
  } else {
    m.cyl(0.05, 0.08, 0.5, 0, 0, 0, C.timber, 3).ball(
      0.5,
      0,
      0.95,
      0,
      C.green,
      0.9,
    );
  }
  return m.build();
}

/**
 * The length of a ship kind's hull, for its wake.
 *
 * @param kind - the ship kind
 * @returns tiles from stern to bow
 */
export function shipLength(kind: ShipKind): number {
  return SHIPS[kind].length;
}

/**
 * A ship's hull, deck and masts (the sails are separate, they billow).
 *
 * @param kind - the ship kind
 * @returns the geometry, waterline at y 0, bow towards +x
 */
export function hullModel(kind: ShipKind): THREE.BufferGeometry {
  const m = new ModelBuilder();
  const s = SHIPS[kind];
  const { length, beam, hull } = s;
  hullBody(m, s, kind);
  const stern = -length / 2;
  if (!s.steel) {
    // A raised quarterdeck over the stern.
    const qx = stern + 0.4;
    m.box(
      0.7,
      0.16,
      hullHalf(s, stern) * 1.8,
      qx,
      deckAt(s, qx) - 0.02,
      0,
      hull,
    );
  }
  if (kind === "galleon") {
    // High stern castle with lit windows and a rail.
    const cw = hullHalf(s, stern) * 1.9;
    const cx = stern + 0.5;
    m.box(1.0, 0.6, cw, cx, deckAt(s, cx), 0, hull);
    m.box(1.04, 0.08, cw + 0.04, cx, deckAt(s, cx) + 0.6, 0, C.gold);
    for (const z of [-0.25, 0.25]) {
      m.box(0.02, 0.2, 0.2, stern - 0.01, deckAt(s, cx) + 0.2, z, C.window, 1);
    }
    const fx = length / 2 - 0.4;
    m.box(0.6, 0.3, hullHalf(s, fx + 0.3) * 1.8, fx, deckAt(s, fx), 0, hull);
  }
  if (kind === "knarr") {
    knarrExtras(m, s);
  }
  const spacing = s.guns > 3 ? 0.7 : 0.75;
  for (let deck = 0; deck < s.decks; deck += 1) {
    for (let i = 0; i < s.guns; i += 1) {
      const x = (i - (s.guns - 1) / 2) * spacing;
      for (const side of [1, -1]) {
        const z = side * (hullHalf(s, x) - 0.15);
        cannon(m, x, 0.18 + deck * 0.38, z, side > 0 ? 0 : Math.PI, 0.42);
      }
    }
  }
  if (s.cargo) {
    for (const x of [-0.9, 0.7]) {
      const y = deckAt(s, x);
      m.box(0.5, 0.22, beam * 0.5, x, y, 0, C.plank);
      m.box(0.24, 0.22, 0.24, x + 0.1, y + 0.22, -0.1, C.wood);
    }
  }
  for (const fx of s.funnels) {
    const y = deckAt(s, fx);
    m.cyl(0.16, 0.18, 1.3, fx, y, 0, 0x2b2b2e, 10);
    m.cyl(0.17, 0.17, 0.12, fx, y + 1.05, 0, C.awningA, 10);
  }
  if (s.steel) {
    // Superstructure and two gun turrets with long barrels.
    const y = deckAt(s, 0);
    m.box(1.4, 0.45, beam * 0.6, 0, y, 0, s.hull);
    m.box(0.7, 0.3, beam * 0.45, 0.2, y + 0.45, 0, s.hull);
    for (const tx of [length / 2 - 0.9, -length / 2 + 0.9]) {
      const ty = deckAt(s, tx);
      m.cyl(0.26, 0.3, 0.22, tx, ty, 0, 0x4a5058, 10);
      const facing = tx > 0 ? -Math.PI / 2 : Math.PI / 2;
      cannon(m, tx, ty + 0.13, 0, facing, 0.75);
    }
  }
  for (const mast of s.masts) {
    m.cyl(0.05, 0.06, mast.height, mast.x, 0.25, 0, C.timberDark, 5);
  }
  // A bowsprit for every sailing ship but the knarr with its tall stem.
  const tipX = length / 2;
  const sprit: [number, number, number] | null =
    s.steel || kind === "knarr"
      ? null
      : [tipX + 0.55, gunwaleAt(s, tipX) + 0.3, 0];
  if (sprit !== null) {
    const base = tipX - 0.5;
    m.rod([base, deckAt(s, base) + 0.05, 0], sprit, 0.035, C.timberDark);
  }
  if (m.detail > 0) {
    shipDetail(m, s, sprit ?? [tipX, gunwaleAt(s, tipX), 0]);
  }
  const main = s.masts[0];
  if (PIRATE_KINDS.includes(kind)) {
    // A black flag with a white skull and crossed bones near the masthead.
    const fx = main.x + 0.3;
    const fy = main.height - 0.2;
    m.box(0.55, 0.36, 0.04, fx, fy, 0, C.sailPirate);
    skullMark(m, fx, fy + 0.18, 0);
  } else if (
    kind !== "warship" &&
    kind !== "frigate" &&
    kind !== "lineShip" &&
    kind !== "cruiser"
  ) {
    m.box(
      0.25,
      0.15,
      0.04,
      main.x,
      main.height + 0.25,
      0,
      kind === "trader" ? C.awningC : C.flag,
    );
  }
  return m.build();
}

/**
 * A ship's sails.
 *
 * @param kind - the ship kind
 * @returns the geometry, relative to the hull
 */
export function sailModel(kind: ShipKind): THREE.BufferGeometry {
  const m = new ModelBuilder();
  const s = SHIPS[kind];
  for (const mast of s.masts) {
    const x = mast.x + 0.08;
    if (m.detail > 0) {
      // A curved sail hung from a yard.
      m.sheet(
        mast.sailW,
        mast.sailH,
        x,
        mast.sailY,
        0,
        SAIL_BELLY * mast.sailW,
        s.sail,
      );
      m.box(
        0.05,
        0.05,
        mast.sailW + 0.12,
        x,
        mast.sailY + mast.sailH,
        0,
        C.timberDark,
      );
    } else {
      m.box(0.06, mast.sailH, mast.sailW, x, mast.sailY, 0, s.sail);
    }
  }
  return m.build();
}

/** The ship kinds sailed by pirates: they fly the black flag. */
const PIRATE_KINDS: readonly ShipKind[] = [
  "pirate",
  "pirateBoat",
  "corvette",
  "pirateFrigate",
  "pirateWarship",
];

/**
 * A white skull over crossed bones, centred on a point of a flag cloth that
 * lies in the x/y plane; the shapes stick out on both faces of the cloth.
 *
 * @param m - the model
 * @param x - centre x
 * @param y - centre y
 * @param z - centre z (the cloth's middle)
 * @param scale - size, 1 for a flag of about 0.5 x 0.3
 */
export function skullMark(
  m: ModelBuilder,
  x: number,
  y: number,
  z: number,
  scale = 1,
): void {
  const bone = 0xf2efe6;
  m.ball(0.055 * scale, x, y + 0.03 * scale, z, bone);
  m.box(
    0.06 * scale,
    0.035 * scale,
    0.05 * scale,
    x,
    y - 0.04 * scale,
    z,
    bone,
  );
  for (const turn of [0.6, -0.6]) {
    part(
      m,
      (b) => b.box(0.18 * scale, 0.025 * scale, 0.045 * scale, 0, 0, 0, bone),
      (g) => {
        g.rotateZ(turn);
        g.translate(x, y - 0.1 * scale, z);
      },
    );
  }
}

/** Where the bow starts to narrow, as a share of half the length. */
const BOW_START = 0.15;

/** Where the stern starts to round in, as a share of half the length. */
const STERN_START = -0.55;

/** How much narrower the transom is than the widest beam. */
const STERN_NARROW = 0.3;

/** Half width left at the very tip of the bow. */
const BOW_TIP = 0.008;

/** Height of the gunwale amidships over the waterline, one gun deck. */
const FREEBOARD = 0.58;

/** Extra height of each further gun deck. */
const DECK_STEP = 0.38;

/** How far the gunwale sweeps up towards bow and stern. */
const BOW_SHEER = 0.2;
const STERN_SHEER = 0.14;

/** The deck lies this far under the gunwale. */
const DECK_DROP = 0.13;

/** Bottom of the keel. */
const KEEL = -0.22;

/** The stem rakes up from this share of half the length on, this high. */
const STEM_START = 0.55;
const STEM_RISE = 0.55;

/** The keel lifts a little at the stern from this share on, this high. */
const HEEL_START = -0.85;
const HEEL_RISE = 0.12;

/** Thickness of the bulwark, and its most as a share of the half width. */
const BULWARK = 0.06;
const BULWARK_SHARE = 0.45;

/**
 * The cross section of one side of the hull, gunwale to keel: share of the
 * half width and share of the depth. Narrow bands mark the stripe and the
 * plank seams.
 */
const PROFILE: readonly (readonly [number, number])[] = [
  [1, 0],
  [1, 0.08],
  [1, 0.17],
  [0.995, 0.33],
  [0.99, 0.36],
  [0.95, 0.55],
  [0.935, 0.58],
  [0.78, 0.78],
  [0.5, 0.92],
  [0.12, 1],
];

/** The profile band painted as the stripe. */
const STRIPE_BAND = 1;

/** The profile bands painted as plank seams. */
const SEAM_BANDS: readonly number[] = [3, 5];

/** Cross sections along the hull, simple and fine. */
const HULL_RINGS = 9;
const HULL_RINGS_FINE = 17;

/** Colour of the rail cap of the bigger pirate ships. */
const PIRATE_RAIL = 0x4a1a18;

/**
 * Half the hull's width at a point along it.
 *
 * @param s - the ship's shape
 * @param x - position along the hull, bow towards +x
 * @returns half the width
 */
function hullHalf(s: ShipShape, x: number): number {
  const t = Math.max(-1, Math.min(1, (2 * x) / s.length));
  let share = 1;
  if (t > BOW_START) {
    const u = (t - BOW_START) / (1 - BOW_START);
    share = 1 - u * u;
  } else if (t < STERN_START) {
    const u = (STERN_START - t) / (1 + STERN_START);
    share = 1 - STERN_NARROW * u * u;
  }
  return Math.max(BOW_TIP, (s.beam / 2) * share);
}

/**
 * Height of the gunwale at a point along the hull.
 *
 * @param s - the ship's shape
 * @param x - position along the hull
 * @returns y
 */
function gunwaleAt(s: ShipShape, x: number): number {
  const t = Math.max(-1, Math.min(1, (2 * x) / s.length));
  const sheer = t > 0 ? BOW_SHEER : STERN_SHEER;
  return FREEBOARD + (s.decks - 1) * DECK_STEP + sheer * t * t;
}

/**
 * Height of the deck at a point along the hull.
 *
 * @param s - the ship's shape
 * @param x - position along the hull
 * @returns y
 */
function deckAt(s: ShipShape, x: number): number {
  return gunwaleAt(s, x) - DECK_DROP;
}

/**
 * Height of the keel at a point along the hull: it rakes up into the stem.
 *
 * @param t - position as a share of half the length, -1 stern to 1 bow
 * @returns y
 */
function keelAt(t: number): number {
  const stem = t > STEM_START ? (t - STEM_START) / (1 - STEM_START) : 0;
  const heel = t < HEEL_START ? (HEEL_START - t) / (1 + HEEL_START) : 0;
  return KEEL + STEM_RISE * stem * stem + HEEL_RISE * heel * heel;
}

/**
 * One cross section of the hull as a closed ring: down the starboard side,
 * up the port side, then over the port bulwark, across the deck and over
 * the starboard bulwark.
 *
 * @param s - the ship's shape
 * @param t - position as a share of half the length
 * @returns the ring's corners
 */
function hullRing(s: ShipShape, t: number): [number, number, number][] {
  const x = (t * s.length) / 2;
  const half = hullHalf(s, x);
  const top = gunwaleAt(s, x);
  const keel = keelAt(t);
  const deck = top - DECK_DROP;
  const inner = half - Math.min(BULWARK, half * BULWARK_SHARE);
  const side = (sign: number): [number, number, number][] =>
    PROFILE.map(([zf, yf]) => [x, top + (keel - top) * yf, sign * half * zf]);
  return [
    ...side(1),
    ...side(-1).reverse(),
    [x, top, -inner],
    [x, deck, -inner],
    [x, deck, inner],
    [x, top, inner],
  ];
}

/**
 * The colour of one band of the ring, from one corner to the next.
 *
 * @param s - the ship's shape
 * @param kind - the ship kind
 * @param band - index of the band's first corner
 * @param detail - model detail
 * @returns the colour
 */
function bandColor(
  s: ShipShape,
  kind: ShipKind,
  band: number,
  detail: number,
): number {
  const sides = PROFILE.length * 2;
  // The port side runs the profile backwards.
  const profileBand = band < PROFILE.length ? band : sides - 2 - band;
  const seam = new THREE.Color(s.hull).multiplyScalar(TILE_SHADE).getHex();
  const pirateRail = PIRATE_KINDS.includes(kind) && kind !== "pirateBoat";
  let color = s.hull;
  if (band === sides + 1) {
    color = C.plank;
  } else if (band === sides - 1 || band === sides + 3) {
    color = pirateRail ? PIRATE_RAIL : s.hull;
  } else if (band >= sides) {
    color = s.hull;
  } else if (profileBand === STRIPE_BAND && s.stripe !== null) {
    color = s.stripe;
  } else if (SEAM_BANDS.includes(profileBand) && detail > 0) {
    color = seam;
  }
  return color;
}

/**
 * The hull itself: cross sections lofted from the transom to the stem, a
 * pointed bow, a rounded bilge, a sheer rising to both ends, a bulwark and
 * an open deck.
 *
 * @param m - the model
 * @param s - the ship's shape
 * @param kind - the ship kind
 */
function hullBody(m: ModelBuilder, s: ShipShape, kind: ShipKind): void {
  const count = m.detail > 0 ? HULL_RINGS_FINE : HULL_RINGS;
  const rings: [number, number, number][][] = [];
  for (let k = 0; k < count; k += 1) {
    // Closer rings towards the ends, where the shape bends most.
    rings.push(
      hullRing(s, Math.sin((Math.PI / 2) * (-1 + (2 * k) / (count - 1)))),
    );
  }
  const byColor = new Map<number, number[]>();
  const put = (color: number, ...corners: [number, number, number][]) => {
    const list = byColor.get(color) ?? [];
    for (const corner of corners) {
      list.push(...corner);
    }
    byColor.set(color, list);
  };
  const size = rings[0].length;
  for (let k = 0; k + 1 < count; k += 1) {
    const a = rings[k];
    const b = rings[k + 1];
    for (let j = 0; j < size; j += 1) {
      const next = (j + 1) % size;
      const color = bandColor(s, kind, j, m.detail);
      put(color, a[j], b[next], b[j]);
      put(color, a[j], a[next], b[next]);
    }
  }
  // Transom and stem: the end rings filled, facing aft and forward.
  for (const [ring, facing] of [
    [rings[0], -1],
    [rings[count - 1], 1],
  ] as const) {
    const contour = ring.map(([, y, z]) => new THREE.Vector2(z, y));
    for (const face of THREE.ShapeUtils.triangulateShape(contour, [])) {
      const [p, q, r] = face.map((i) => ring[i]);
      const cross =
        (q[2] - p[2]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[2] - p[2]);
      // The face's normal along x is minus this cross product.
      put(s.hull, ...(-cross * facing > 0 ? [p, q, r] : [p, r, q]));
    }
  }
  for (const [color, positions] of byColor) {
    m.mesh(positions, color);
  }
}

/**
 * The finer parts of a ship: the standing rigging from the mastheads to
 * bow, stern and the sides.
 *
 * @param m - the model
 * @param s - the ship's shape
 * @param bow - where the forestay ends
 */
function shipDetail(
  m: ModelBuilder,
  s: ShipShape,
  bow: readonly [number, number, number],
): void {
  const sternX = -s.length / 2 + 0.05;
  const stern: [number, number, number] = [sternX, gunwaleAt(s, sternX), 0];
  s.masts.forEach((mast, index) => {
    const top: [number, number, number] = [mast.x, 0.25 + mast.height, 0];
    const ahead = s.masts[index - 1];
    m.rod(
      top,
      ahead === undefined ? bow : [ahead.x, 0.25 + ahead.height * 0.8, 0],
      0.012,
      ROPE,
    );
    m.rod(top, stern, 0.012, ROPE);
    const foot = mast.x - 0.25;
    for (const side of [1, -1]) {
      m.rod(
        [mast.x, 0.25 + mast.height * 0.85, 0],
        [foot, gunwaleAt(s, foot), side * hullHalf(s, foot)],
        0.01,
        ROPE,
      );
    }
  });
}

/**
 * The touches of a Nordic knarr: tall curved stem and stern posts and a row
 * of round shields along each rail (the clinker strakes are the seams).
 *
 * @param m - the model
 * @param s - the ship's shape
 */
function knarrExtras(m: ModelBuilder, s: ShipShape): void {
  const { length, hull } = s;
  // Stem and stern posts curving up and inwards, in three pieces each.
  for (const end of [1, -1]) {
    for (const [tilt, dx, y] of [
      [0.5, -0.1, 0.15],
      [0.2, 0.05, 0.43],
      [-0.3, 0.11, 0.74],
    ]) {
      part(
        m,
        (b) => b.box(0.1, 0.32, 0.09, 0, 0, 0, hull),
        (g) => {
          g.rotateZ(-end * tilt);
          g.translate(end * (length / 2 + dx), y, 0);
        },
      );
    }
  }
  // Round shields along both rails, alternating colours.
  for (let i = 0; i < 5; i += 1) {
    const x = -0.9 + i * 0.42;
    for (const side of [1, -1]) {
      part(
        m,
        (b) =>
          b.cyl(
            0.13,
            0.13,
            0.03,
            0,
            0,
            0,
            i % 2 === 0 ? 0xb3402a : 0xd9cfae,
            8,
          ),
        (g) => {
          g.rotateX(Math.PI / 2);
          g.translate(x, gunwaleAt(s, x) - 0.1, side * (hullHalf(s, x) + 0.03));
        },
      );
    }
  }
}

/**
 * A wreck: a small raft of planks with a broken mast stump and two
 * castaways waving for help.
 *
 * @returns the geometry, about 1.2 x 0.9 tiles, floor at y 0
 */
export function wreckModel(): THREE.BufferGeometry {
  const m = new ModelBuilder();
  m.box(0.08, 0.05, 0.85, -0.4, 0, 0, C.timberDark).box(
    0.08,
    0.05,
    0.85,
    0.4,
    0,
    0,
    C.timberDark,
  );
  for (let i = 0; i < 5; i += 1) {
    m.box(
      1.15 - (i % 2) * 0.12,
      0.06,
      0.16,
      (i % 2) * 0.05,
      0.04,
      -0.36 + i * 0.18,
      i % 2 === 0 ? C.plank : C.wood,
    );
  }
  // Broken mast stump with a torn rag of sail.
  m.cyl(0.05, 0.06, 0.5, -0.25, 0.1, 0.05, C.timberDark, 5);
  part(
    m,
    (b) => b.box(0.06, 0.35, 0.06, 0, 0, 0, C.timberDark),
    (g) => {
      g.rotateZ(0.9);
      g.translate(-0.25, 0.58, 0.05);
    },
  );
  m.box(0.03, 0.22, 0.25, -0.22, 0.32, 0.18, C.sail);
  m.cyl(0.08, 0.08, 0.16, 0.42, 0.1, -0.25, C.timber, 7);
  // Two castaways, one waving.
  m.cyl(0.05, 0.07, 0.22, 0.15, 0.1, -0.12, 0x6d5a8a, 5);
  m.ball(0.055, 0.15, 0.38, -0.12, 0xe0b48a);
  m.cyl(0.05, 0.07, 0.2, 0.38, 0.1, 0.18, 0x8a5a3a, 5);
  m.ball(0.055, 0.38, 0.35, 0.18, 0xe0b48a);
  m.box(0.03, 0.18, 0.03, 0.44, 0.32, 0.18, 0xe0b48a);
  return m.build();
}

/**
 * An ox cart with a load.
 *
 * @returns the geometry, facing +x
 */
export function cartModel(): THREE.BufferGeometry {
  const m = new ModelBuilder();
  m.box(0.5, 0.18, 0.32, -0.12, 0.12, 0, C.wood);
  m.box(0.36, 0.14, 0.26, -0.12, 0.3, 0, C.plank);
  m.cyl(0.11, 0.11, 0.04, -0.12, 0, 0.19, C.timberDark, 8);
  m.cyl(0.11, 0.11, 0.04, -0.12, 0, -0.23, C.timberDark, 8);
  m.box(0.3, 0.18, 0.16, 0.3, 0.1, 0, 0x8b6f4e);
  m.box(0.12, 0.12, 0.1, 0.48, 0.2, 0, 0x7a5f40);
  return m.build();
}

/**
 * A walking townsperson.
 *
 * @returns the geometry
 */
export function walkerModel(): THREE.BufferGeometry {
  const m = new ModelBuilder();
  if (m.detail > 0) {
    // Legs, a tunic with a belt, arms, a head and a cap.
    m.box(0.035, 0.12, 0.04, 0, 0, -0.03, WALKER.legs);
    m.box(0.035, 0.12, 0.04, 0, 0, 0.03, WALKER.legs);
    m.cyl(0.05, 0.075, 0.17, 0, 0.11, 0, WALKER.tunic, 6);
    m.box(0.1, 0.02, 0.12, 0, 0.16, 0, C.timberDark);
    m.box(0.03, 0.13, 0.03, 0, 0.14, -0.075, WALKER.tunic);
    m.box(0.03, 0.13, 0.03, 0, 0.14, 0.075, WALKER.tunic);
    m.ball(0.055, 0, 0.33, 0, WALKER.skin);
    m.cyl(0.03, 0.065, 0.05, 0, 0.36, 0, C.awningB, 6);
  } else {
    m.cyl(0.06, 0.08, 0.26, 0, 0, 0, WALKER.tunic, 5);
    m.ball(0.06, 0, 0.33, 0, WALKER.skin);
  }
  return m.build();
}

/** Height of a rider's seat above the ground, model units. */
const SADDLE = 0.32;

/**
 * A unit's coat, white so that the owner's colour can tint it per instance:
 * on foot, on horseback (raised) or the crew beside a gun.
 *
 * @param shape - how the unit is drawn
 * @returns the geometry
 */
export function unitBodyModel(shape: UnitShape): THREE.BufferGeometry {
  const m = new ModelBuilder();
  const y = shape === "rider" ? SADDLE : 0;
  const x = shape === "gun" ? -0.22 : 0;
  m.cyl(0.07, 0.09, 0.3, x, y, 0, 0xffffff, 6);
  m.box(0.2, 0.05, 0.06, x, y + 0.2, 0, 0xffffff);
  return m.build();
}

/**
 * A unit's face, headgear and gear in their own colours - what tells the
 * kinds apart at a glance: spear, musket, grenade, long rifle, a gun on
 * wheels, a horse, a spade, a satchel with a red cross, a spyglass.
 *
 * @param kind - the unit kind
 * @param shape - how it is drawn
 * @returns the geometry
 */
export function unitGearModel(
  kind: UnitKind,
  shape: UnitShape,
): THREE.BufferGeometry {
  const m = new ModelBuilder();
  const y = shape === "rider" ? SADDLE : 0;
  const x = shape === "gun" ? -0.22 : 0;
  const skin = 0xe0b48a;
  const wood = 0x6b4a2b;
  const steel = 0xb8c0c8;
  m.ball(0.065, x, y + 0.37, 0, skin);
  if (shape === "rider") {
    // The horse under the rider.
    const coat = kind === "scout" ? 0x8a6a48 : 0x4a3322;
    m.box(0.5, 0.18, 0.16, 0, 0.2, 0, coat);
    m.box(0.1, 0.22, 0.1, 0.28, 0.3, 0, coat);
    m.box(0.16, 0.08, 0.08, 0.34, 0.48, 0, coat);
    for (const [lx, lz] of [
      [0.18, 0.05],
      [0.18, -0.05],
      [-0.18, 0.05],
      [-0.18, -0.05],
    ]) {
      m.box(0.04, 0.2, 0.04, lx, 0, lz, coat);
    }
  }
  switch (kind) {
    case "militia":
      m.cyl(0.08, 0.09, 0.04, x, y + 0.42, 0, 0x6b5a3a, 6);
      m.box(0.025, 0.55, 0.025, 0.11, y + 0.05, 0.02, wood);
      break;
    case "line":
      m.cyl(0.075, 0.08, 0.05, x, y + 0.42, 0, 0x5b6470, 6);
      m.box(0.025, 0.6, 0.025, 0.11, y + 0.05, 0.02, wood);
      m.box(0.04, 0.08, 0.04, 0.11, y + 0.65, 0.02, steel);
      break;
    case "grenadier":
      m.cyl(0.02, 0.07, 0.16, x, y + 0.42, 0, 0x2c2c3a, 6);
      m.ball(0.05, 0.12, y + 0.22, 0.04, 0x1a1a1a);
      break;
    case "elite":
      m.cyl(0.06, 0.08, 0.1, x, y + 0.42, 0, 0xd6b04c, 6);
      m.box(0.025, 0.6, 0.025, 0.11, y + 0.05, 0.02, wood);
      m.box(0.12, 0.16, 0.03, -0.1, y + 0.1, 0.05, 0xd6b04c);
      break;
    case "musketeer":
      m.cyl(0.085, 0.09, 0.03, x, y + 0.42, 0, 0x2f3a2a, 6);
      m.box(0.45, 0.025, 0.025, 0.12, y + 0.24, 0.06, wood);
      break;
    case "sharpshooter":
      m.cyl(0.1, 0.1, 0.02, x, y + 0.42, 0, 0x3a3a2a, 8);
      m.box(0.55, 0.022, 0.022, 0.15, y + 0.25, 0.06, wood);
      m.box(0.12, 0.03, 0.03, 0.12, y + 0.28, 0.06, 0x333333);
      break;
    case "artillery":
      // A field gun on two wheels beside its crewman.
      cannon(m, 0.05, 0.16, 0, Math.PI / 2, 0.55);
      for (const z of [0.12, -0.12]) {
        part(
          m,
          (b) => b.cyl(0.12, 0.12, 0.03, 0, 0, 0, wood, 10),
          (g) => {
            g.rotateX(Math.PI / 2);
            g.translate(0, 0.12, z);
          },
        );
      }
      m.box(0.3, 0.03, 0.04, -0.12, 0.05, 0, wood);
      break;
    case "cavalry":
      m.cyl(0.075, 0.08, 0.05, x, y + 0.42, 0, 0x5b6470, 6);
      m.box(0.03, 0.03, 0.4, 0.08, y + 0.3, 0.12, steel);
      break;
    case "pioneer":
      m.cyl(0.08, 0.09, 0.04, x, y + 0.42, 0, 0x6b5a2a, 6);
      m.box(0.025, 0.5, 0.025, 0.11, y + 0.05, 0.02, wood);
      m.box(0.09, 0.1, 0.02, 0.11, y + 0.02, 0.02, steel);
      break;
    case "medic":
      m.cyl(0.075, 0.08, 0.04, x, y + 0.42, 0, 0xf1ede2, 6);
      m.box(0.12, 0.12, 0.06, -0.1, y + 0.12, 0, 0xf1ede2);
      m.box(0.02, 0.07, 0.065, -0.1, y + 0.145, 0, 0xc0392b);
      break;
    default:
      m.cyl(0.085, 0.09, 0.03, x, y + 0.42, 0, 0x3a5a3a, 6);
      m.box(0.16, 0.03, 0.03, 0.12, y + 0.35, 0.05, 0x3a3a3a);
  }
  return m.build();
}

/** One mast of a ship and its sail (sail y is relative to the sail mesh). */
type MastDef = {
  readonly x: number;
  readonly height: number;
  readonly sailY: number;
  readonly sailH: number;
  readonly sailW: number;
};

/** The shape of a ship kind. */
type ShipShape = {
  readonly length: number;
  readonly beam: number;
  readonly hull: number;
  readonly sail: number;
  /** Colour of the stripe along the hull, or null. */
  readonly stripe: number | null;
  /** Cannons per side. */
  readonly guns: number;
  /** Rows of gun ports (decks), 1 or 2. */
  readonly decks: number;
  /** Funnels of a steam engine, as x positions. */
  readonly funnels: readonly number[];
  /** Raised cargo hatches and crates on deck. */
  readonly cargo: boolean;
  /** An armoured steel deck with turrets instead of open gun ports. */
  readonly steel: boolean;
  /** The masts, main mast first. */
  readonly masts: readonly MastDef[];
};

/** Masts of a two-masted ship of the classic size. */
const TWO_MASTS: readonly MastDef[] = [
  { x: 0.1, height: 2.4, sailY: 0.75, sailH: 1.4, sailW: 1.5 },
  { x: -0.9, height: 1.7, sailY: 0.8, sailH: 1, sailW: 1.1 },
];

/** What most ships do not have. */
const PLAIN = {
  decks: 1,
  funnels: [],
  cargo: false,
  steel: false,
} as const;

/** Every ship kind's shape. */
const SHIPS: Readonly<Record<ShipKind, ShipShape>> = {
  cog: {
    ...PLAIN,
    length: 2.4,
    beam: 0.85,
    hull: C.timber,
    sail: C.sail,
    stripe: null,
    guns: 0,
    masts: [{ x: 0.1, height: 2, sailY: 0.75, sailH: 1.2, sailW: 1.2 }],
  },
  hulk: {
    ...PLAIN,
    // The clipper: long and narrow, three tall masts.
    length: 3.5,
    beam: 0.85,
    hull: 0x8a5d36,
    sail: C.sail,
    stripe: C.plank,
    guns: 0,
    masts: [
      { x: 0.9, height: 2.6, sailY: 0.8, sailH: 1.5, sailW: 1.0 },
      { x: 0, height: 3.0, sailY: 0.75, sailH: 1.9, sailW: 1.1 },
      { x: -0.95, height: 2.4, sailY: 0.85, sailH: 1.3, sailW: 0.9 },
    ],
  },
  trader: {
    ...PLAIN,
    length: 3.2,
    beam: 1.1,
    hull: 0x5d3f2a,
    sail: C.sailTrader,
    stripe: null,
    guns: 0,
    masts: TWO_MASTS,
  },
  galleon: {
    ...PLAIN,
    // The freighter: broad, high, crates and hatches on deck.
    length: 3.9,
    beam: 1.4,
    hull: 0x6a4630,
    sail: C.sail,
    stripe: C.gold,
    guns: 0,
    cargo: true,
    masts: [
      { x: 0.05, height: 2.9, sailY: 0.8, sailH: 1.7, sailW: 1.8 },
      { x: 1.05, height: 2.4, sailY: 0.75, sailH: 1.3, sailW: 1.4 },
      { x: -0.9, height: 2.2, sailY: 0.95, sailH: 1, sailW: 1.1 },
    ],
  },
  steamer: {
    ...PLAIN,
    // The steamship: dark iron hull, a funnel and a small steadying sail.
    length: 4.0,
    beam: 1.25,
    hull: 0x3d3a37,
    sail: C.sail,
    stripe: C.awningA,
    guns: 0,
    cargo: true,
    funnels: [0.1],
    masts: [{ x: 1.2, height: 1.9, sailY: 0.7, sailH: 0.9, sailW: 0.8 }],
  },
  warship: {
    ...PLAIN,
    // The gunboat: small, quick, one mast and a few guns.
    length: 2.7,
    beam: 0.95,
    hull: C.hullDark,
    sail: C.sail,
    stripe: C.awningA,
    guns: 2,
    masts: [{ x: 0.15, height: 2.2, sailY: 0.75, sailH: 1.3, sailW: 1.2 }],
  },
  frigate: {
    ...PLAIN,
    length: 3.7,
    beam: 0.95,
    hull: 0x4a3a2c,
    sail: C.sail,
    stripe: 0x5a7184,
    guns: 4,
    masts: [
      { x: 0.4, height: 2.7, sailY: 0.8, sailH: 1.5, sailW: 1.4 },
      { x: -0.9, height: 2.2, sailY: 0.8, sailH: 1.1, sailW: 1.1 },
    ],
  },
  lineShip: {
    ...PLAIN,
    // The ship of the line: huge, two gun decks, three masts.
    length: 4.4,
    beam: 1.45,
    hull: C.hullDark,
    sail: C.sail,
    stripe: C.gold,
    guns: 5,
    decks: 2,
    masts: [
      { x: 1.2, height: 2.9, sailY: 0.9, sailH: 1.6, sailW: 1.5 },
      { x: 0.1, height: 3.4, sailY: 0.85, sailH: 2.0, sailW: 1.8 },
      { x: -1.1, height: 2.8, sailY: 0.95, sailH: 1.5, sailW: 1.4 },
    ],
  },
  cruiser: {
    ...PLAIN,
    // The battlecruiser: grey steel, two funnels, turrets fore and aft.
    length: 4.6,
    beam: 1.2,
    hull: 0x5f6670,
    sail: 0x5f6670,
    stripe: 0x30343a,
    guns: 0,
    funnels: [0.35, -0.35],
    steel: true,
    masts: [{ x: 0.9, height: 2.4, sailY: 1.6, sailH: 0.18, sailW: 0.5 }],
  },
  pirate: {
    ...PLAIN,
    length: 3.0,
    beam: 1.0,
    hull: C.hullPirate,
    sail: C.sailPirate,
    stripe: null,
    guns: 2,
    masts: TWO_MASTS,
  },
  knarr: {
    ...PLAIN,
    // Skeld's trader: clinker-built, one big square sail, cargo amidships.
    length: 3.2,
    beam: 1.15,
    hull: 0x6a4a30,
    sail: 0xd8c8a2,
    stripe: null,
    guns: 0,
    cargo: true,
    masts: [{ x: 0, height: 2.3, sailY: 0.7, sailH: 1.4, sailW: 1.75 }],
  },
  pirateBoat: {
    ...PLAIN,
    // A small fast sloop: dark hull, one black sail, a single gun a side.
    length: 2.4,
    beam: 0.8,
    hull: 0x231d1a,
    sail: 0x1c1c1c,
    stripe: null,
    guns: 1,
    masts: [{ x: 0.1, height: 2.0, sailY: 0.75, sailH: 1.2, sailW: 1.05 }],
  },
  corvette: {
    ...PLAIN,
    length: 3.2,
    beam: 1.0,
    hull: 0x2a221d,
    sail: 0x262626,
    stripe: 0x5c1a1a,
    guns: 3,
    masts: [
      { x: 0.3, height: 2.5, sailY: 0.75, sailH: 1.45, sailW: 1.4 },
      { x: -0.85, height: 1.9, sailY: 0.8, sailH: 1.05, sailW: 1.05 },
    ],
  },
  pirateFrigate: {
    ...PLAIN,
    length: 3.9,
    beam: 1.15,
    hull: 0x251e1a,
    sail: 0x2e2a28,
    stripe: 0x7a6a44,
    guns: 4,
    masts: [
      { x: 0.2, height: 3.0, sailY: 0.8, sailH: 1.8, sailW: 1.55 },
      { x: 1.2, height: 2.5, sailY: 0.8, sailH: 1.35, sailW: 1.2 },
      { x: -1.0, height: 2.4, sailY: 0.9, sailH: 1.25, sailW: 1.15 },
    ],
  },
  pirateWarship: {
    ...PLAIN,
    // The pirate flagship: huge, two gun decks, dark red sails.
    length: 4.5,
    beam: 1.5,
    hull: 0x1f1916,
    sail: 0x4a1a1a,
    stripe: 0x6b1f1f,
    guns: 5,
    decks: 2,
    masts: [
      { x: 0.1, height: 3.5, sailY: 0.85, sailH: 2.05, sailW: 1.85 },
      { x: 1.25, height: 3.0, sailY: 0.9, sailH: 1.6, sailW: 1.5 },
      { x: -1.15, height: 2.9, sailY: 0.95, sailH: 1.5, sailW: 1.4 },
    ],
  },
};

/** One house, a step larger and finer per tier. */
function house(m: ModelBuilder, tier: number): void {
  switch (tier) {
    case 0:
      m.box(1.2, 0.7, 1.1, -0.1, 0, 0, C.wood);
      m.roof(1.4, 0.7, 1.3, -0.1, 0.7, 0, C.thatch);
      m.box(0.22, 0.4, 0.02, -0.1, 0, 0.56, C.door);
      m.box(0.4, 0.3, 0.4, 0.6, 0, -0.5, C.plank);
      break;
    case 1:
      m.box(1.4, 0.95, 1.25, 0, 0, 0, C.plaster);
      for (const x of [-0.69, 0.69]) {
        m.box(0.06, 0.95, 1.27, x, 0, 0, C.timber);
      }
      m.roof(1.55, 0.75, 1.45, 0, 0.95, 0, C.roofRed);
      m.box(0.2, 0.55, 0.2, 0.4, 1.2, -0.2, C.brick);
      m.box(0.24, 0.24, 0.02, -0.35, 0.45, 0.635, C.window, 1);
      m.box(0.24, 0.24, 0.02, 0.35, 0.45, 0.635, C.window, 1);
      m.box(0.22, 0.45, 0.02, 0, 0, 0.635, C.door);
      break;
    case 2:
      m.box(1.5, 1.6, 1.4, 0, 0, 0, C.plasterWarm);
      m.box(1.52, 0.07, 1.42, 0, 0.8, 0, C.timber);
      for (const x of [-0.74, 0, 0.74]) {
        m.box(0.07, 1.6, 1.42, x, 0, 0, C.timber);
      }
      m.roof(1.7, 0.85, 1.6, 0, 1.6, 0, C.roofRed);
      m.box(0.22, 0.6, 0.22, -0.45, 1.9, 0.25, C.brick);
      for (const y of [0.35, 1.1]) {
        for (const x of [-0.4, 0.4]) {
          m.box(0.24, 0.28, 0.02, x, y, 0.71, C.window, 1);
        }
      }
      m.box(0.5, 0.45, 0.5, 0.55, 0, -0.6, C.wood).roof(
        0.55,
        0.25,
        0.55,
        0.55,
        0.45,
        -0.6,
        C.roofBrown,
      );
      break;
    default: {
      const height = 2.1 + (tier - 3) * 0.35;
      m.box(1.65, height, 1.55, 0, 0, 0, tier >= 4 ? C.plaster : 0xd8d2c4);
      m.box(1.7, 0.12, 1.6, 0, height - 0.12, 0, C.stoneDark);
      m.roof(1.8, 0.8, 1.7, 0, height, 0, C.roofSlate);
      m.box(0.45, 0.35, 0.4, 0, height + 0.25, 0.5, C.plaster).roof(
        0.5,
        0.25,
        0.45,
        0,
        height + 0.6,
        0.5,
        C.roofSlate,
      );
      for (let floor = 0; floor < Math.floor(height / 0.75); floor += 1) {
        for (const x of [-0.5, 0, 0.5]) {
          m.box(0.22, 0.32, 0.02, x, 0.3 + floor * 0.72, 0.785, C.window, 1);
        }
      }
      m.box(0.3, 0.5, 0.06, 0, 0, 0.8, C.door);
      if (tier >= 4) {
        m.box(0.12, 0.6, 0.12, -0.7, 0, 0.75, C.stone).box(
          0.12,
          0.6,
          0.12,
          0.7,
          0,
          0.75,
          C.stone,
        );
      }
    }
  }
}

/** A row of crates and barrels. */
function goodsPile(m: ModelBuilder, x: number, z: number): void {
  m.box(0.3, 0.3, 0.3, x, 0, z, C.plank).box(
    0.25,
    0.25,
    0.25,
    x + 0.35,
    0,
    z + 0.05,
    C.wood,
  );
  m.cyl(0.13, 0.13, 0.32, x + 0.1, 0, z + 0.38, C.timber, 7);
}

/** A small workshop body with roof, door and window. */
function workshop(
  m: ModelBuilder,
  w: number,
  d: number,
  wall: number,
  roof: number,
  x = 0,
  z = 0,
): void {
  m.box(w, 0.9, d, x, 0, z, wall);
  m.roof(w + 0.15, 0.6, d + 0.15, x, 0.9, z, roof);
  m.box(0.22, 0.45, 0.02, x - w / 4, 0, z + d / 2 + 0.01, C.door);
  m.box(0.22, 0.22, 0.02, x + w / 4, 0.4, z + d / 2 + 0.01, C.window, 1);
}

/** A field of rows. */
function field(
  m: ModelBuilder,
  x: number,
  z: number,
  w: number,
  d: number,
  color: number,
  ground: number,
): void {
  m.box(w, 0.06, d, x, 0, z, ground);
  for (let row = 0; row < 4; row += 1) {
    m.box(
      w * 0.9,
      0.16,
      0.1,
      x,
      0.05,
      z - d / 2 + (row + 0.5) * (d / 4),
      color,
    );
  }
}

/** Every building's look. */
const MODELS: Readonly<
  Record<BuildingKind, (m: ModelBuilder, tier: number) => void>
> = {
  kontor: (m) => {
    m.box(2.2, 1.4, 1.8, -0.2, 0, -0.3, C.stone);
    m.roof(2.35, 0.9, 1.95, -0.2, 1.4, -0.3, C.roofRed);
    m.box(2.24, 0.1, 1.84, -0.2, 0.7, -0.3, C.stoneDark);
    m.box(0.5, 0.6, 0.02, -0.2, 0, 0.61, C.door);
    for (const x of [-0.85, 0.45]) {
      m.box(0.28, 0.3, 0.02, x, 0.85, 0.61, C.window, 1);
    }
    m.cyl(0.04, 0.05, 2.6, 1.1, 0, 1.0, C.timberDark, 5);
    m.box(0.6, 0.35, 0.03, 1.4, 2.15, 1.0, C.flag);
    goodsPile(m, 0.6, 0.9);
    goodsPile(m, -1.1, 1.0);
  },
  warehouse: (m) => {
    for (const [x, z] of [
      [-0.75, -0.7],
      [0.75, -0.7],
      [-0.75, 0.7],
      [0.75, 0.7],
    ]) {
      m.box(0.12, 1, 0.12, x, 0, z, C.timber);
    }
    m.roof(1.8, 0.6, 1.7, 0, 1, 0, C.roofBrown);
    goodsPile(m, -0.5, -0.4);
    goodsPile(m, 0.1, 0.1);
    m.box(0.5, 0.35, 0.5, 0.5, 0, -0.4, C.plank);
  },
  house,
  market: (m) => {
    m.box(2.7, 0.08, 2.7, 0, 0, 0, C.stone);
    const awnings = [C.awningA, C.awningB, C.awningC];
    [
      [-0.8, -0.8],
      [0.8, -0.8],
      [-0.8, 0.8],
    ].forEach(([x, z], i) => {
      m.box(0.7, 0.4, 0.45, x, 0.08, z, C.wood);
      m.roof(0.85, 0.3, 0.65, x, 0.75, z, awnings[i]);
      for (const dx of [-0.38, 0.38]) {
        m.box(0.05, 0.7, 0.05, x + dx, 0.08, z + 0.3, C.timber);
      }
    });
    m.cyl(0.35, 0.4, 0.35, 0.8, 0.08, 0.8, C.stone, 10).cyl(
      0.3,
      0.3,
      0.05,
      0.8,
      0.4,
      0.8,
      C.water,
      10,
    );
    m.box(0.05, 0.6, 0.05, 0.55, 0.4, 0.8, C.timber)
      .box(0.05, 0.6, 0.05, 1.05, 0.4, 0.8, C.timber)
      .roof(0.6, 0.25, 0.5, 0.8, 1, 0.8, C.roofBrown);
  },
  chapel: (m) => {
    m.box(1.0, 1.1, 1.5, 0.2, 0, 0.1, C.stone);
    m.roof(1.6, 0.7, 1.15, 0.2, 1.1, 0.1, C.roofSlate, Math.PI / 2);
    m.box(0.6, 1.9, 0.6, -0.5, 0, -0.5, C.stone);
    m.cyl(0, 0.45, 0.9, -0.5, 1.9, -0.5, C.roofSlate, 4);
    m.box(0.18, 0.4, 0.02, 0.2, 0.5, 0.86, C.window, 1);
    m.box(0.3, 0.55, 0.02, -0.5, 0, -0.19, C.door);
  },
  tavern: (m) => {
    workshop(m, 1.5, 1.2, C.plasterWarm, C.roofBrown, 0, -0.1);
    m.box(0.22, 0.6, 0.22, 0.45, 1.2, -0.3, C.brick);
    m.box(0.05, 0.6, 0.05, 0.8, 0, 0.7, C.timber).box(
      0.35,
      0.25,
      0.04,
      0.8,
      0.5,
      0.75,
      C.gold,
    );
    m.cyl(0.15, 0.15, 0.32, -0.6, 0, 0.75, C.timber, 7).cyl(
      0.15,
      0.15,
      0.32,
      -0.25,
      0,
      0.8,
      C.timber,
      7,
    );
  },
  school: (m) => {
    m.box(2.5, 1.3, 1.3, 0, 0, 0, C.brick);
    m.roof(2.6, 0.7, 1.45, 0, 1.3, 0, C.roofSlate);
    for (const x of [-0.8, -0.3, 0.3, 0.8]) {
      m.box(0.24, 0.4, 0.02, x, 0.55, 0.66, C.window, 1);
    }
    m.box(0.35, 0.4, 0.35, 0, 1.75, 0, C.plaster).cyl(
      0,
      0.3,
      0.45,
      0,
      2.15,
      0,
      C.roofSlate,
      4,
    );
  },
  bathhouse: (m) => {
    m.box(2.5, 1.2, 2.2, 0, 0, 0, 0xd9d4c7);
    m.dome(0.9, 0, 1.2, 0, 0x6f8fa3);
    for (const x of [-1, -0.5, 0, 0.5, 1]) {
      m.cyl(0.08, 0.08, 1.1, x, 0, 1.2, C.wool, 8);
    }
    m.box(2.6, 0.12, 0.4, 0, 1.1, 1.2, C.stone);
    m.box(0.8, 0.05, 0.5, 0.7, 0, -1.3, C.water);
  },
  woodcutter: (m) => {
    workshop(m, 1.0, 0.9, C.wood, C.roofBrown, -0.3, -0.3);
    for (let i = 0; i < 3; i += 1) {
      m.cyl(0.1, 0.1, 0.8, 0.5, 0.1 + i * 0.18, 0.55, C.timber, 6);
    }
    m.cyl(0.18, 0.2, 0.25, -0.5, 0, 0.6, C.wood, 7);
  },
  sawmill: (m) => {
    m.box(1.4, 0.8, 1.0, 0, 0, -0.3, C.wood);
    m.roof(1.55, 0.5, 1.15, 0, 0.8, -0.3, C.roofBrown);
    m.cyl(0.35, 0.35, 0.05, 0.75, 0.2, 0.5, C.metal, 12);
    for (let i = 0; i < 3; i += 1) {
      m.box(0.9, 0.08, 0.3, -0.3, i * 0.09, 0.6, C.plank);
    }
  },
  fishery: (m) => {
    workshop(m, 1.0, 0.9, C.wood, C.thatch, -0.3, -0.3);
    for (const x of [0.3, 0.7]) {
      m.box(0.05, 0.6, 0.05, x, 0, 0.6, C.timber);
    }
    m.box(0.5, 0.04, 0.04, 0.5, 0.55, 0.6, C.timber);
    m.box(0.08, 0.2, 0.04, 0.4, 0.33, 0.6, 0x8aa3b3).box(
      0.08,
      0.2,
      0.04,
      0.58,
      0.33,
      0.6,
      0x8aa3b3,
    );
    m.box(0.8, 0.18, 0.35, -0.4, 0, 0.6, C.timber);
  },
  sheepFarm: (m) => {
    workshop(m, 1.0, 0.9, C.plasterWarm, C.thatch, -0.9, -0.9);
    m.box(2.6, 0.04, 2.6, 0, 0, 0, 0x88a85a);
    for (const [x, z] of [
      [0.3, 0.2],
      [0.8, 0.7],
      [-0.2, 0.9],
      [0.9, -0.4],
      [-0.7, 0.4],
    ]) {
      m.box(0.32, 0.22, 0.2, x, 0.1, z, C.wool).box(
        0.1,
        0.12,
        0.1,
        x + 0.2,
        0.2,
        z,
        0x3a3a3a,
      );
    }
    for (const t of [-1.3, 1.3]) {
      m.box(2.6, 0.05, 0.04, 0, 0.3, t, C.timber).box(
        0.04,
        0.05,
        2.6,
        t,
        0.3,
        0,
        C.timber,
      );
    }
  },
  grainFarm: (m) => {
    workshop(m, 1.0, 0.9, C.plasterWarm, C.thatch, -0.9, -0.9);
    field(m, 0.55, -0.6, 1.5, 1.4, C.grain, 0x8a6a3a);
    field(m, 0, 0.75, 2.7, 1.1, C.grain, 0x8a6a3a);
  },
  vineyard: (m) => {
    workshop(m, 1.0, 0.9, C.stone, C.roofRed, -0.9, -0.9);
    m.box(2.7, 0.05, 1.5, 0, 0, 0.55, 0x7a6a42);
    for (let row = 0; row < 4; row += 1) {
      m.box(2.4, 0.4, 0.14, 0, 0.05, 0.05 + row * 0.35, C.greenDark);
      m.box(2.4, 0.08, 0.16, 0, 0.42, 0.05 + row * 0.35, 0x6d2f5c);
    }
    field(m, 0.6, -0.65, 1.4, 1.2, C.greenDark, 0x7a6a42);
  },
  mill: (m) => {
    m.cyl(0.45, 0.6, 1.8, 0, 0, 0, C.plaster, 8);
    m.cyl(0, 0.55, 0.6, 0, 1.8, 0, C.roofBrown, 8);
    m.box(0.25, 0.45, 0.02, 0, 0, 0.58, C.door);
  },
  bakery: (m) => {
    workshop(m, 1.4, 1.1, C.plasterWarm, C.roofRed, 0, -0.2);
    m.box(0.35, 0.9, 0.35, 0.45, 0.8, -0.4, C.brick);
    m.dome(0.35, -0.5, 0, 0.6, C.brick);
  },
  malthouse: (m) => {
    m.box(1.2, 1.5, 1.1, -0.2, 0, -0.1, C.brick);
    m.roof(1.3, 0.6, 1.2, -0.2, 1.5, -0.1, C.roofBrown);
    m.cyl(0.15, 0.25, 0.7, -0.2, 2, -0.1, C.stoneDark, 6);
    m.box(0.4, 0.3, 0.4, 0.6, 0, 0.6, C.grain);
  },
  brewery: (m) => {
    workshop(m, 1.3, 1.0, C.stone, C.roofRed, -0.2, -0.3);
    m.cyl(0.35, 0.35, 0.8, 0.55, 0, 0.45, C.copper, 10).dome(
      0.35,
      0.55,
      0.8,
      0.45,
      C.copper,
    );
    m.cyl(0.14, 0.14, 0.3, -0.5, 0, 0.7, C.timber, 7).cyl(
      0.14,
      0.14,
      0.3,
      -0.2,
      0,
      0.75,
      C.timber,
      7,
    );
    m.box(0.18, 0.5, 0.18, -0.6, 1.2, -0.5, C.brick);
  },
  weaver: (m) => {
    workshop(m, 1.4, 1.0, C.plaster, C.roofRed, 0, -0.3);
    m.box(0.05, 0.6, 0.05, -0.4, 0, 0.6, C.timber).box(
      0.05,
      0.6,
      0.05,
      0.4,
      0,
      0.6,
      C.timber,
    );
    m.box(0.8, 0.4, 0.02, 0, 0.15, 0.6, 0x9c4f6b);
  },
  tailor: (m) => {
    m.box(1.3, 1.4, 1.1, 0, 0, -0.2, C.plasterWarm);
    m.roof(1.45, 0.6, 1.25, 0, 1.4, -0.2, C.roofSlate);
    m.box(0.3, 0.3, 0.02, -0.3, 0.5, 0.36, C.window, 1).box(
      0.3,
      0.3,
      0.02,
      0.3,
      0.5,
      0.36,
      C.window,
      1,
    );
    m.cyl(0.1, 0.1, 0.45, 0.6, 0, 0.65, 0x2e6da4, 8).cyl(
      0.1,
      0.1,
      0.45,
      0.35,
      0,
      0.7,
      C.awningA,
      8,
    );
  },
  claypit: (m) => {
    m.box(1.4, 0.06, 1.1, 0.1, 0, 0.3, 0x6b3f22);
    m.ball(0.4, -0.5, 0.1, -0.5, C.clay, 0.6);
    m.box(0.7, 0.6, 0.6, 0.5, 0, -0.55, C.wood).roof(
      0.8,
      0.3,
      0.7,
      0.5,
      0.6,
      -0.55,
      C.thatch,
    );
  },
  brickworks: (m) => {
    m.cyl(0.45, 0.55, 1.1, -0.35, 0, -0.35, C.brick, 8);
    m.cyl(0.12, 0.15, 0.8, -0.35, 1.1, -0.35, C.stoneDark, 6);
    for (let i = 0; i < 3; i += 1) {
      m.box(0.5, 0.15, 0.3, 0.45, i * 0.15, 0.4, C.brick);
    }
    m.box(0.6, 0.6, 0.5, 0.45, 0, -0.45, C.wood).roof(
      0.7,
      0.3,
      0.6,
      0.45,
      0.6,
      -0.45,
      C.roofBrown,
    );
  },
  quarry: (m) => {
    m.ball(0.6, -0.3, 0.2, -0.3, C.stone, 0.7);
    for (const [x, z] of [
      [0.5, 0.4],
      [0.2, 0.6],
      [0.6, 0],
    ]) {
      m.box(0.3, 0.25, 0.3, x, 0, z, 0xb7b3a8);
    }
    m.box(0.06, 1.4, 0.06, 0.6, 0, -0.6, C.timber).box(
      0.8,
      0.06,
      0.06,
      0.3,
      1.35,
      -0.6,
      C.timber,
    );
  },
  oreMine: (m) => {
    m.ball(0.85, 0, 0.1, -0.2, C.stoneDark, 0.75);
    m.box(0.5, 0.55, 0.3, 0, 0, 0.55, C.timber).box(
      0.36,
      0.45,
      0.05,
      0,
      0,
      0.71,
      0x141414,
    );
    m.ball(0.25, 0.6, 0.1, 0.6, C.ore, 0.7);
    m.box(0.08, 0.04, 0.6, -0.1, 0, 0.85, C.metal).box(
      0.08,
      0.04,
      0.6,
      0.1,
      0,
      0.85,
      C.metal,
    );
  },
  charcoal: (m) => {
    m.dome(0.55, -0.2, 0, -0.2, 0x3b3530);
    for (let i = 0; i < 3; i += 1) {
      m.cyl(0.08, 0.08, 0.7, 0.55, 0.08 + i * 0.15, 0.5, C.timber, 6);
    }
    m.ball(0.2, 0.5, 0.1, -0.5, C.coal, 0.6);
  },
  smelter: (m) => {
    m.box(1.0, 1.2, 1.0, -0.3, 0, -0.3, C.stoneDark);
    m.cyl(0.18, 0.25, 1.4, -0.3, 1.2, -0.3, C.brick, 6);
    m.box(0.3, 0.25, 0.02, -0.3, 0.2, 0.21, 0xff8a2a, 1);
    m.ball(0.22, 0.55, 0.1, 0.5, C.ore, 0.6).ball(
      0.22,
      0.1,
      0.1,
      0.65,
      C.coal,
      0.6,
    );
  },
  toolmaker: (m) => {
    workshop(m, 1.3, 1.0, C.stone, C.roofSlate, 0, -0.3);
    m.box(0.25, 0.8, 0.25, -0.45, 1.0, -0.5, C.brick);
    m.box(0.3, 0.25, 0.15, 0.5, 0, 0.6, C.metal).box(
      0.2,
      0.1,
      0.12,
      0.5,
      0.25,
      0.6,
      C.metal,
    );
    m.box(0.3, 0.2, 0.02, 0.1, 0.25, 0.21, 0xff8a2a, 1);
  },
  gunsmith: (m) => {
    // A smithy with a forge chimney and a rack of muskets by the door.
    workshop(m, 1.3, 1.0, C.brick, C.roofSlate, -0.1, -0.3);
    m.box(0.26, 0.9, 0.26, 0.4, 0.9, -0.55, C.stoneDark);
    m.box(0.3, 0.2, 0.02, 0.2, 0.25, 0.21, C.ember, 1);
    m.box(0.7, 0.06, 0.12, 0.35, 0.55, 0.62, C.timber);
    for (let i = 0; i < 4; i += 1) {
      m.box(0.03, 0.62, 0.03, 0.1 + i * 0.16, 0, 0.66, C.timberDark);
    }
    m.box(0.25, 0.2, 0.15, -0.6, 0, 0.6, C.metal);
  },
  foundry: (m) => {
    // A tall stone casting hall with a furnace stack and cannons outside.
    m.box(1.8, 1.3, 1.1, -0.4, 0, -0.35, C.stone);
    m.roof(1.95, 0.6, 1.25, -0.4, 1.3, -0.35, C.roofSlate);
    m.cyl(0.22, 0.3, 1.9, 0.75, 0, -0.45, C.brick, 8);
    m.cyl(0.24, 0.24, 0.1, 0.75, 1.9, -0.45, C.stoneDark, 8);
    m.box(0.55, 0.5, 0.02, -0.4, 0, 0.21, C.door);
    m.box(0.4, 0.25, 0.02, -0.4, 0.55, 0.21, C.ember, 1);
    for (const x of [-0.9, -0.2, 0.5]) {
      cannon(m, x, 0.12, 0.55, 0, 0.5);
    }
  },
  engineWorks: (m) => {
    // A brick works with glass skylights, a boiler and a flywheel.
    m.box(1.9, 1.1, 1.1, -0.35, 0, -0.35, C.brick);
    for (let i = 0; i < 3; i += 1) {
      m.roof(
        0.62,
        0.35,
        1.2,
        -1.0 + i * 0.63,
        1.1,
        -0.35,
        i % 2 === 0 ? C.glass : C.roofSlate,
      );
    }
    m.cyl(0.14, 0.18, 1.5, 0.9, 0, -0.6, C.metal, 8);
    m.cyl(0.3, 0.3, 0.7, 0.85, 0, 0.45, C.copper, 10);
    part(
      m,
      (b) => b.cyl(0.32, 0.32, 0.06, 0, 0, 0, C.cannon, 12),
      (g) => {
        g.rotateX(Math.PI / 2);
        g.translate(0.2, 0.42, 0.55);
      },
    );
    m.box(0.5, 0.45, 0.02, -0.6, 0, 0.21, C.door);
  },
  winery: (m) => {
    workshop(m, 1.4, 1.1, C.stone, C.roofRed, 0, -0.25);
    for (const x of [-0.6, -0.25, 0.1]) {
      m.cyl(0.15, 0.15, 0.32, x, 0, 0.7, C.timber, 8);
    }
    m.cyl(0.25, 0.25, 0.4, 0.55, 0, 0.6, 0x6d2f5c, 8);
  },
  shipyard: (m) => {
    m.box(2.6, 0.1, 1.4, 0, 0, 0.4, C.plank);
    for (let i = 0; i < 6; i += 1) {
      m.box(
        0.06,
        0.6 - Math.abs(i - 2.5) * 0.12,
        0.9,
        -1 + i * 0.4,
        0.1,
        0.4,
        C.timber,
      );
    }
    m.box(2.2, 0.06, 0.06, 0, 0.6, 0.4, C.timberDark);
    workshop(m, 1.2, 0.8, C.wood, C.roofBrown, -0.6, -0.9);
    m.box(0.08, 1.8, 0.08, 1.1, 0, -0.6, C.timber).box(
      0.08,
      0.08,
      1.2,
      1.1,
      1.75,
      -0.1,
      C.timber,
    );
  },
  fireStation: (m) => {
    m.box(1.3, 1.1, 1.1, -0.25, 0, -0.25, C.brick);
    m.box(1.34, 0.08, 1.14, -0.25, 1.05, -0.25, C.stoneDark);
    m.roof(1.45, 0.6, 1.25, -0.25, 1.1, -0.25, C.roofRed);
    m.box(0.6, 0.72, 0.02, -0.25, 0, 0.31, C.door);
    m.box(0.64, 0.06, 0.03, -0.25, 0.72, 0.32, C.wood);
    m.box(0.2, 0.2, 0.02, -0.75, 0.6, 0.31, C.window, 1);
    // Bell tower with an open belfry.
    m.box(0.45, 1.9, 0.45, 0.65, 0, -0.55, C.brick);
    for (const [x, z] of [
      [0.47, -0.73],
      [0.83, -0.73],
      [0.47, -0.37],
      [0.83, -0.37],
    ]) {
      m.box(0.07, 0.42, 0.07, x, 1.9, z, C.timber);
    }
    m.ball(0.13, 0.65, 2.08, -0.55, C.brass, 1.1);
    pyramid(m, 0.4, 0.5, 0.65, 2.32, -0.55, C.roofRed);
    m.box(0.16, 0.2, 0.02, 0.65, 1.2, -0.32, C.window, 1);
    // Water barrels, buckets and a ladder.
    for (const [x, z] of [
      [0.35, 0.7],
      [0.72, 0.65],
    ]) {
      m.cyl(0.15, 0.15, 0.36, x, 0, z, C.timber, 8);
      m.cyl(0.13, 0.13, 0.02, x, 0.36, z, C.water, 8);
    }
    m.cyl(0.08, 0.06, 0.12, 0.55, 0, 0.3, C.awningA, 7);
    m.box(0.04, 1.0, 0.04, 0.42, 0, -0.03, C.wood).box(
      0.04,
      1.0,
      0.04,
      0.42,
      0,
      0.2,
      C.wood,
    );
    for (let i = 0; i < 4; i += 1) {
      m.box(0.03, 0.03, 0.26, 0.42, 0.2 + i * 0.22, 0.085, C.wood);
    }
  },
  doctor: (m) => {
    m.box(1.3, 1.2, 1.0, -0.2, 0, -0.35, C.plaster);
    m.roof(1.45, 0.65, 1.15, -0.2, 1.2, -0.35, C.roofSlate);
    m.box(0.22, 0.45, 0.02, -0.55, 0, 0.16, C.door);
    m.box(0.26, 0.26, 0.02, 0.15, 0.5, 0.16, C.window, 1);
    m.box(0.26, 0.26, 0.02, -0.2, 0.5, 0.16, C.window, 1);
    m.box(0.18, 0.45, 0.18, 0.2, 1.3, -0.55, C.brick);
    // Green herb sign on a post.
    m.box(0.06, 1.0, 0.06, -0.8, 0, 0.6, C.timber);
    m.box(0.4, 0.04, 0.04, -0.62, 0.95, 0.6, C.timber);
    m.box(0.3, 0.3, 0.04, -0.55, 0.55, 0.6, C.herb);
    m.ball(0.1, -0.55, 0.7, 0.63, C.leaf, 1.4);
    // Small herb garden with a low wattle fence.
    m.box(0.95, 0.08, 0.6, 0.35, 0, 0.55, C.soil);
    for (let row = 0; row < 2; row += 1) {
      for (let i = 0; i < 4; i += 1) {
        m.ball(
          0.09,
          0.03 + i * 0.21,
          0.14,
          0.43 + row * 0.24,
          row === 0 ? C.herb : C.leaf,
          0.8,
        );
      }
    }
    m.box(0.97, 0.12, 0.03, 0.35, 0, 0.86, C.wood);
    m.box(0.03, 0.12, 0.6, 0.84, 0, 0.55, C.wood);
  },
  scholarHouse: (m) => {
    m.box(2.0, 1.4, 1.2, -0.4, 0, -0.2, C.plasterWarm);
    m.box(2.04, 0.08, 1.24, -0.4, 0.7, -0.2, C.timber);
    m.roof(2.15, 0.7, 1.35, -0.4, 1.4, -0.2, C.roofSlate);
    for (const x of [-1.1, -0.65, -0.15, 0.25]) {
      m.box(0.22, 0.3, 0.02, x, 0.95, 0.41, C.window, 1);
    }
    m.box(0.28, 0.5, 0.02, -0.4, 0, 0.41, C.door);
    m.box(0.22, 0.3, 0.02, -0.95, 0.25, 0.41, C.window, 1);
    m.box(0.22, 0.3, 0.02, 0.15, 0.25, 0.41, C.window, 1);
    // Observatory tower with a dome and a slit.
    m.cyl(0.4, 0.42, 1.8, 1.0, 0, -0.25, C.stone, 10);
    m.box(0.86, 0.08, 0.86, 1.0, 1.8, -0.25, C.stoneDark);
    m.dome(0.4, 1.0, 1.85, -0.25, C.patina);
    m.box(0.1, 0.38, 0.06, 1.0, 1.9, 0.12, C.window, 1);
    part(
      m,
      (b) => b.cyl(0.04, 0.06, 0.5, 0, 0, 0, C.brass, 6),
      (g) => {
        g.rotateX(0.7);
        g.translate(1.0, 2.0, 0.1);
      },
    );
    m.box(0.18, 0.3, 0.02, 1.0, 0.8, 0.17, C.window, 1);
    // Books in a crate by the door.
    m.box(0.35, 0.2, 0.25, 0.5, 0, 0.7, C.plank);
    m.box(0.1, 0.12, 0.2, 0.42, 0.2, 0.7, C.awningB).box(
      0.1,
      0.12,
      0.2,
      0.55,
      0.2,
      0.7,
      C.awningA,
    );
  },
  university: (m) => {
    m.box(2.8, 0.15, 2.6, 0, 0, -0.1, C.stone);
    m.box(2.4, 1.6, 1.6, 0, 0.15, -0.5, 0xd8d2c4);
    m.box(2.44, 0.12, 1.64, 0, 1.75, -0.5, C.stoneDark);
    m.roof(2.5, 0.5, 1.7, 0, 1.87, -0.5, C.roofSlate);
    for (const x of [-0.8, -0.3, 0.3, 0.8]) {
      m.box(0.22, 0.45, 0.02, x, 0.85, 0.31, C.window, 1);
      m.box(0.22, 0.35, 0.02, x, 0.35, 0.31, C.window, 1);
    }
    m.box(0.4, 0.65, 0.02, 0, 0.15, 0.31, C.door);
    // Portico: columns, entablature and a low pediment.
    for (const x of [-1.05, -0.63, -0.21, 0.21, 0.63, 1.05]) {
      m.cyl(0.08, 0.09, 1.35, x, 0.15, 0.62, C.wool, 8);
      m.box(0.2, 0.06, 0.2, x, 1.48, 0.62, C.stone);
    }
    m.box(2.4, 0.18, 0.5, 0, 1.54, 0.55, C.stone);
    m.roof(0.5, 0.35, 2.4, 0, 1.72, 0.55, C.stone, Math.PI / 2);
    m.box(1.4, 0.07, 0.3, 0, 0.0, 1.05, C.stone).box(
      1.2,
      0.07,
      0.2,
      0,
      0.07,
      1.0,
      C.stone,
    );
    // Drum and dome with a gold lantern.
    m.cyl(0.58, 0.6, 0.45, 0, 2.0, -0.6, 0xd8d2c4, 12);
    m.dome(0.6, 0, 2.45, -0.6, C.patina);
    m.cyl(0.08, 0.1, 0.25, 0, 3.0, -0.6, C.gold, 6);
    m.ball(0.08, 0, 3.3, -0.6, C.gold);
  },
  theatre: (m) => {
    m.box(2.7, 0.1, 2.7, 0, 0, 0, C.stone);
    m.cyl(1.15, 1.2, 1.35, 0, 0.1, -0.15, C.plasterWarm, 14);
    m.cyl(1.22, 1.22, 0.12, 0, 1.4, -0.15, C.stoneDark, 14);
    // Striped awning roof in three colours.
    m.cyl(0.85, 1.32, 0.35, 0, 1.52, -0.15, C.awningA, 14);
    m.cyl(0.42, 0.85, 0.3, 0, 1.87, -0.15, C.awningC, 14);
    m.cyl(0, 0.42, 0.3, 0, 2.17, -0.15, C.awningB, 14);
    m.cyl(0.02, 0.025, 0.5, 0, 2.4, -0.15, C.timberDark, 4);
    m.box(0.35, 0.2, 0.03, 0.18, 2.68, -0.15, C.awningA);
    for (const a of [-1.5, -1, -0.5, 0.5, 1, 1.5, 2.4, -2.4]) {
      m.box(
        0.18,
        0.3,
        0.02,
        Math.sin(a) * 1.19,
        0.75,
        Math.cos(a) * 1.19 - 0.15,
        C.window,
        1,
        a,
      );
    }
    // Entrance portal with columns and posters.
    m.box(1.1, 1.2, 0.35, 0, 0.1, 1.1, C.stone);
    m.roof(1.25, 0.35, 0.5, 0, 1.3, 1.1, C.stone);
    m.box(0.45, 0.65, 0.02, 0, 0.1, 1.28, C.door);
    m.box(0.45, 0.12, 0.02, 0, 0.8, 1.28, C.window, 1);
    for (const x of [-0.45, 0.45]) {
      m.cyl(0.07, 0.08, 1.2, x, 0.1, 1.33, C.wool, 8);
    }
    m.box(0.2, 0.3, 0.02, -0.85, 0.3, 1.0, C.awningC, 0, 0.3).box(
      0.2,
      0.3,
      0.02,
      0.85,
      0.3,
      1.0,
      C.awningB,
      0,
      -0.3,
    );
  },
  sandPit: (m) => {
    m.box(1.8, 0.05, 1.8, 0, 0, 0, 0xcbb98a);
    m.ball(0.5, -0.35, 0.05, -0.35, C.sand, 0.55, 1);
    m.ball(0.32, 0.45, 0.05, -0.45, C.sand, 0.55, 1);
    m.ball(0.26, -0.45, 0.05, 0.5, C.sand, 0.55, 1);
    // Sieve frame leaning on two legs.
    part(
      m,
      (b) => {
        b.box(0.7, 0.04, 0.05, 0, 0, -0.25, C.wood).box(
          0.7,
          0.04,
          0.05,
          0,
          0,
          0.25,
          C.wood,
        );
        b.box(0.05, 0.04, 0.55, -0.33, 0, 0, C.wood).box(
          0.05,
          0.04,
          0.55,
          0.33,
          0,
          0,
          C.wood,
        );
        b.box(0.62, 0.01, 0.46, 0, 0.015, 0, C.metal);
      },
      (g) => {
        g.rotateZ(0.8);
        g.translate(0.45, 0.35, 0.4);
      },
    );
    m.box(0.05, 0.5, 0.05, 0.75, 0, 0.18, C.timber).box(
      0.05,
      0.5,
      0.05,
      0.75,
      0,
      0.62,
      C.timber,
    );
    m.ball(0.2, 0.05, 0.05, 0.45, C.sand, 0.5);
    // Wheelbarrow and a shovel.
    m.box(0.35, 0.15, 0.25, 0.25, 0.1, 0.85, C.plank);
    m.cyl(0.07, 0.07, 0.04, 0.45, 0, 0.85, C.timberDark, 6);
    m.box(0.04, 0.6, 0.04, -0.1, 0, -0.85, C.wood).box(
      0.14,
      0.18,
      0.03,
      -0.1,
      0,
      -0.85,
      C.metal,
    );
  },
  glassworks: (m) => {
    workshop(m, 0.9, 0.85, C.brick, C.roofSlate, 0.5, 0.45);
    // Conical kiln with a chimney; smoke at about (-0.3, 2.6, -0.3).
    m.cyl(0.28, 0.58, 1.4, -0.3, 0, -0.3, C.brick, 10);
    m.cyl(0.3, 0.3, 0.08, -0.3, 1.4, -0.3, C.stoneDark, 10);
    m.cyl(0.12, 0.16, 1.2, -0.3, 1.4, -0.3, C.stoneDark, 6);
    m.box(0.26, 0.24, 0.04, -0.3, 0.12, 0.27, C.ember, 1);
    m.box(0.22, 0.2, 0.04, 0.27, 0.12, -0.3, C.ember, 1, Math.PI / 2);
    // Panes leaning on a rack and some bottles.
    m.box(0.5, 0.05, 0.25, -0.55, 0, 0.7, C.wood);
    for (let i = 0; i < 3; i += 1) {
      m.box(0.4, 0.4, 0.02, -0.55, 0.05, 0.62 + i * 0.07, C.glass, 1);
    }
    for (const [x, z] of [
      [0.75, -0.55],
      [0.6, -0.7],
      [0.82, -0.78],
    ]) {
      m.cyl(0.04, 0.07, 0.22, x, 0, z, 0x5f9f7a, 6);
    }
    m.box(0.35, 0.25, 0.25, 0.4, 0, -0.6, C.sand);
  },
  instrumentMaker: (m) => {
    m.box(1.3, 1.3, 1.0, -0.2, 0, -0.35, C.plaster);
    for (const x of [-0.84, 0.44]) {
      m.box(0.06, 1.3, 1.02, x, 0, -0.35, C.timber);
    }
    m.box(1.32, 0.06, 1.02, -0.2, 1.24, -0.35, C.timber);
    m.roof(1.45, 0.6, 1.15, -0.2, 1.3, -0.35, C.roofSlate);
    // Big workshop window with mullions.
    m.box(0.78, 0.55, 0.02, -0.3, 0.45, 0.16, C.window, 1);
    m.box(0.84, 0.05, 0.04, -0.3, 0.42, 0.17, C.wood).box(
      0.84,
      0.05,
      0.04,
      -0.3,
      1.0,
      0.17,
      C.wood,
    );
    for (const x of [-0.69, -0.3, 0.09]) {
      m.box(0.04, 0.58, 0.04, x, 0.42, 0.17, C.wood);
    }
    m.box(0.2, 0.42, 0.02, 0.27, 0, 0.16, C.door);
    m.ball(0.12, -0.2, 2.0, -0.35, C.brass, 1, 1);
    m.box(0.04, 0.16, 0.04, -0.2, 1.84, -0.35, C.brass);
    // Brass telescope on a tripod.
    for (const [dx, dz] of [
      [-0.12, -0.08],
      [0.12, -0.08],
      [0, 0.13],
    ]) {
      m.box(0.03, 0.62, 0.03, 0.6 + dx, 0, 0.55 + dz, C.timberDark);
    }
    part(
      m,
      (b) => b.cyl(0.05, 0.08, 0.75, 0, -0.3, 0, C.brass, 8),
      (g) => {
        g.rotateZ(-0.9);
        g.translate(0.6, 0.68, 0.55);
      },
    );
    m.box(0.3, 0.25, 0.25, -0.65, 0, 0.55, C.plank);
  },
  tobaccoFarm: (m) => {
    // Drying shed with leaves hanging under the roof.
    for (const [x, z] of [
      [-1.35, -1.35],
      [-0.35, -1.35],
      [-1.35, -0.55],
      [-0.35, -0.55],
    ]) {
      m.box(0.08, 1.1, 0.08, x, 0, z, C.timber);
    }
    m.box(1.0, 0.5, 0.06, -0.85, 0.6, -1.35, C.wood);
    m.roof(1.25, 0.55, 1.05, -0.85, 1.1, -0.95, C.thatch);
    for (let i = 0; i < 6; i += 1) {
      m.box(0.07, 0.38, 0.07, -1.2 + i * 0.14, 0.6, -0.95, C.tobacco);
    }
    m.box(1.0, 0.03, 0.03, -0.85, 1.0, -0.95, C.timberDark);
    // Fields of broad tobacco plants.
    m.box(2.8, 0.05, 1.6, 0, 0, 0.6, C.soil);
    for (let row = 0; row < 4; row += 1) {
      for (let i = 0; i < 6; i += 1) {
        m.ball(
          0.2,
          -1.1 + i * 0.44,
          0.2,
          0.06 + row * 0.36,
          (row + i) % 3 === 0 ? C.greenDark : C.leaf,
          0.75,
        );
      }
    }
    m.box(1.3, 0.05, 1.0, 0.65, 0, -0.85, C.soil);
    for (let row = 0; row < 2; row += 1) {
      for (let i = 0; i < 3; i += 1) {
        m.ball(0.18, 0.25 + i * 0.4, 0.18, -1.08 + row * 0.42, C.leaf, 0.75);
      }
    }
  },
  tobacconist: (m) => {
    workshop(m, 1.3, 1.0, C.plasterWarm, C.roofBrown, -0.1, -0.4);
    // Small chimney; smoke at about (0.35, 1.65, -0.6).
    m.box(0.18, 0.55, 0.18, 0.35, 1.1, -0.6, C.brick);
    // Awning over the front with hanging brown leaves.
    for (const x of [-0.65, 0.45]) {
      m.box(0.05, 0.85, 0.05, x, 0, 0.75, C.timber);
    }
    m.roof(1.3, 0.12, 0.7, -0.1, 0.85, 0.45, C.awningA);
    m.box(1.15, 0.03, 0.03, -0.1, 0.78, 0.6, C.timberDark);
    for (let i = 0; i < 8; i += 1) {
      m.box(0.08, 0.3, 0.03, -0.6 + i * 0.14, 0.48, 0.6, C.tobacco);
    }
    m.cyl(0.14, 0.14, 0.32, 0.72, 0, 0.55, C.timber, 7);
    m.box(0.3, 0.2, 0.22, 0.72, 0, -0.55, C.plank);
  },
  pearlDiver: (m) => {
    // Water channel along the shore side.
    m.box(0.85, 0.04, 1.85, 0.52, 0, 0, C.water);
    // Hut on stilts.
    for (const [x, z] of [
      [-0.8, -0.8],
      [0.1, -0.8],
      [-0.8, 0.1],
      [0.1, 0.1],
    ]) {
      m.cyl(0.05, 0.05, 0.5, x, 0, z, C.timber, 5);
    }
    m.box(1.05, 0.08, 1.05, -0.35, 0.5, -0.35, C.plank);
    m.box(0.8, 0.6, 0.7, -0.4, 0.58, -0.45, C.wood);
    m.roof(0.95, 0.45, 0.88, -0.4, 1.18, -0.45, C.thatch);
    m.box(0.2, 0.38, 0.02, -0.55, 0.58, -0.09, C.door);
    m.box(0.16, 0.16, 0.02, -0.2, 0.78, -0.09, C.window, 1);
    m.box(0.25, 0.04, 0.5, -0.35, 0.25, 0.35, C.plank);
    // Jetty plank and a small boat.
    m.box(0.6, 0.06, 0.2, 0.4, 0.45, -0.3, C.plank);
    m.box(0.25, 0.14, 0.75, 0.55, 0.02, 0.35, C.timber);
    m.box(0.19, 0.04, 0.6, 0.55, 0.12, 0.35, C.plank);
    // Baskets with pearls.
    for (const [x, z] of [
      [-0.75, 0.6],
      [-0.4, 0.75],
    ]) {
      m.cyl(0.13, 0.1, 0.18, x, 0, z, C.thatch, 8);
      m.ball(0.05, x - 0.03, 0.2, z, C.pearl, 1, 1);
      m.ball(0.05, x + 0.04, 0.2, z + 0.03, C.pearl, 1, 1);
    }
  },
  goldsmith: (m) => {
    m.box(1.3, 1.35, 1.05, -0.15, 0, -0.35, C.stone);
    m.box(1.34, 0.1, 1.09, -0.15, 1.3, -0.35, C.stoneDark);
    m.box(1.35, 0.05, 1.1, -0.15, 1.4, -0.35, C.gold);
    m.roof(1.45, 0.6, 1.2, -0.15, 1.45, -0.35, C.roofSlate);
    m.ball(0.09, -0.15, 2.1, -0.35, C.gold, 1, 1);
    // Shop windows and a door framed in gold.
    for (const x of [-0.55, 0.25]) {
      m.box(0.34, 0.42, 0.02, x, 0.35, 0.18, C.window, 1);
      m.box(0.4, 0.05, 0.04, x, 0.3, 0.19, C.gold);
    }
    m.box(0.24, 0.55, 0.02, -0.15, 0, 0.18, C.door);
    for (const x of [-0.31, 0.01]) {
      m.box(0.06, 0.62, 0.06, x, 0, 0.2, C.stoneDark);
      m.box(0.09, 0.05, 0.09, x, 0.62, 0.2, C.gold);
    }
    // Hanging sign with a gold ring.
    m.box(0.05, 1.1, 0.05, 0.7, 0, 0.6, C.timberDark);
    m.box(0.35, 0.04, 0.04, 0.55, 1.05, 0.6, C.timberDark);
    part(
      m,
      (b) => b.cyl(0.16, 0.16, 0.04, 0, 0, 0, C.gold, 10),
      (g) => {
        g.rotateX(Math.PI / 2);
        g.translate(0.5, 0.8, 0.6);
      },
    );
    m.box(0.3, 0.2, 0.25, -0.75, 0, 0.6, C.plank);
  },
  watchtower: (m) => {
    m.box(1.05, 1.2, 1.05, 0, 0, 0, C.stone);
    m.box(0.9, 1.2, 0.9, 0, 1.2, 0, C.timber);
    for (const [x, z] of [
      [-0.45, -0.45],
      [0.45, -0.45],
      [-0.45, 0.45],
      [0.45, 0.45],
    ]) {
      m.box(0.08, 1.2, 0.08, x, 1.2, z, C.timberDark);
    }
    m.box(0.25, 0.45, 0.02, 0, 0, 0.53, C.door);
    m.box(0.08, 0.3, 0.02, 0, 1.6, 0.46, C.window, 1);
    m.box(0.08, 0.3, 0.02, 0, 0.6, 0.53, C.window, 1);
    // Platform with a railing, a roof on posts and a small cannon.
    m.box(1.5, 0.1, 1.5, 0, 2.4, 0, C.plank);
    for (const t of [-0.72, 0.72]) {
      m.box(1.5, 0.05, 0.05, 0, 2.75, t, C.timber).box(
        0.05,
        0.05,
        1.5,
        t,
        2.75,
        0,
        C.timber,
      );
    }
    for (const [x, z] of [
      [-0.7, -0.7],
      [0.7, -0.7],
      [-0.7, 0.7],
      [0.7, 0.7],
    ]) {
      m.box(0.07, 0.75, 0.07, x, 2.5, z, C.timberDark);
    }
    pyramid(m, 1.1, 0.7, 0, 3.25, 0, C.roofRed);
    m.box(0.2, 0.12, 0.3, 0, 2.5, 0.2, C.timber);
    cannon(m, 0, 2.66, 0.15, 0, 0.6);
  },
  barracks: (m) => {
    // A long stone hall with a slate roof, a yard with a flag and a rack.
    m.box(2.3, 0.9, 1.0, -0.2, 0, -0.3, C.stone);
    m.box(2.34, 0.08, 1.04, -0.2, 0.86, -0.3, C.stoneDark);
    m.roof(2.45, 0.55, 1.2, -0.2, 0.94, -0.3, C.roofSlate);
    m.box(0.26, 0.5, 0.02, -0.2, 0, 0.21, C.door);
    for (const x of [-1.0, -0.6, 0.2, 0.6]) {
      m.box(0.18, 0.2, 0.02, x, 0.45, 0.21, C.window, 1);
    }
    // Yard wall in front.
    m.box(2.6, 0.3, 0.1, -0.1, 0, 0.9, C.stone);
    m.box(0.1, 0.3, 0.55, -1.35, 0, 0.62, C.stone);
    // Flag pole with a red banner.
    m.box(0.05, 1.7, 0.05, 1.15, 0, 0.55, C.timberDark);
    m.box(0.4, 0.25, 0.02, 1.36, 1.38, 0.55, C.roofRed);
    // Weapon rack with spears.
    m.box(0.6, 0.06, 0.06, 0.55, 0.5, 0.45, C.timber);
    for (const x of [0.32, 0.48, 0.64, 0.8]) {
      m.box(0.03, 0.75, 0.03, x, 0, 0.42, C.timberDark);
    }
  },
  battery: (m) => {
    m.box(1.85, 0.6, 1.65, 0, 0, -0.1, C.stone);
    m.box(1.9, 0.08, 1.7, 0, 0.6, -0.1, C.stoneDark);
    m.box(1.95, 0.2, 1.75, 0, 0, -0.1, C.stoneDark);
    // Parapet with merlons at the front and sides.
    for (const x of [-0.82, 0, 0.82]) {
      m.box(0.3, 0.35, 0.3, x, 0.68, 0.58, C.stone);
    }
    for (const x of [-0.82, 0.82]) {
      m.box(0.2, 0.25, 1.2, x, 0.68, -0.25, C.stone);
    }
    m.box(1.85, 0.25, 0.2, 0, 0.68, -0.83, C.stone);
    // Two cannons on carriages pointing towards +z.
    for (const x of [-0.41, 0.41]) {
      m.box(0.26, 0.15, 0.4, x, 0.68, 0.15, C.timber);
      m.cyl(0.09, 0.09, 0.04, x - 0.15, 0.68, 0.2, C.timberDark, 8);
      m.cyl(0.09, 0.09, 0.04, x + 0.15, 0.68, 0.2, C.timberDark, 8);
      cannon(m, x, 0.92, 0.0, 0, 0.85);
    }
    // Powder kegs and a pile of shot.
    m.cyl(0.11, 0.11, 0.22, -0.45, 0.68, -0.55, C.timber, 7);
    m.cyl(0.11, 0.11, 0.22, -0.2, 0.68, -0.6, C.timber, 7);
    for (const [x, z] of [
      [0.3, -0.5],
      [0.44, -0.5],
      [0.37, -0.62],
    ]) {
      m.ball(0.07, x, 0.75, z, C.cannon);
    }
    m.ball(0.07, 0.37, 0.86, -0.54, C.cannon);
  },
  decorTree: (m) => {
    m.box(0.85, 0.06, 0.85, 0, 0, 0, C.green);
    m.cyl(0.07, 0.09, 0.55, 0, 0.05, 0, C.timber, 6);
    m.ball(0.34, 0, 0.8, 0, C.leaf, 1, 1);
    m.ball(0.22, 0.12, 1.05, 0.05, C.greenDark, 1, 1);
  },
  flowerBed: (m) => {
    m.box(0.85, 0.12, 0.85, 0, 0, 0, C.stone);
    m.box(0.7, 0.08, 0.7, 0, 0.12, 0, C.soil);
    const blooms = [C.awningA, C.awningC, C.wool, C.awningB, C.awningA];
    blooms.forEach((color, k) => {
      const angle = (k / blooms.length) * Math.PI * 2;
      const x = Math.cos(angle) * 0.2;
      const z = Math.sin(angle) * 0.2;
      m.cyl(0.015, 0.015, 0.12, x, 0.2, z, C.herb, 4);
      m.ball(0.07, x, 0.34, z, color);
    });
    m.ball(0.09, 0, 0.3, 0, C.herb);
  },
  lantern: (m) => {
    m.box(0.3, 0.1, 0.3, 0, 0, 0, C.stoneDark);
    m.cyl(0.04, 0.05, 1.3, 0, 0.1, 0, C.cannon, 6);
    m.box(0.22, 0.26, 0.22, 0, 1.4, 0, C.glass, 1);
    m.cyl(0, 0.17, 0.14, 0, 1.66, 0, C.cannon, 4);
    m.ball(0.04, 0, 1.82, 0, C.brass);
  },
  plaza: (m) => {
    m.box(1.9, 0.08, 1.9, 0, 0, 0, C.stone);
    for (const [x, z] of [
      [-0.48, -0.48],
      [0.48, -0.48],
      [-0.48, 0.48],
      [0.48, 0.48],
    ]) {
      m.box(0.9, 0.02, 0.9, x, 0.08, z, C.stoneDark);
    }
    m.box(0.5, 0.18, 0.5, 0, 0.08, 0, C.stone);
    m.box(0.6, 0.06, 0.18, 0.55, 0.22, 0.75, C.timber);
    m.box(0.6, 0.06, 0.18, -0.55, 0.22, -0.75, C.timber);
    for (const x of [0.3, 0.8]) {
      m.box(0.05, 0.22, 0.05, x, 0.08, 0.75, C.timberDark);
      m.box(0.05, 0.22, 0.05, -x, 0.08, -0.75, C.timberDark);
    }
  },
  park: (m) => {
    m.box(2.9, 0.06, 2.9, 0, 0, 0, C.green);
    // A gravel path across.
    m.box(2.9, 0.02, 0.35, 0, 0.06, 0, C.path);
    m.box(0.35, 0.02, 2.9, 0, 0.06, 0, C.path);
    for (const [x, z, r] of [
      [-0.9, -0.9, 0.42],
      [0.95, -0.85, 0.36],
      [-0.85, 0.95, 0.38],
      [0.9, 0.9, 0.44],
    ]) {
      m.cyl(0.07, 0.09, 0.5, x, 0.06, z, C.timber, 6);
      m.ball(r, x, 0.5 + r, z, C.leaf, 1, 1);
    }
    m.box(0.6, 0.06, 0.18, 0.55, 0.26, 0.3, C.timber);
    m.box(0.6, 0.06, 0.18, -0.55, 0.26, -0.3, C.timber);
    m.ball(0.16, 0.45, 0.16, -0.55, C.awningA);
    m.ball(0.16, -0.45, 0.16, 0.55, C.awningC);
  },
  fountain: (m) => {
    m.box(1.9, 0.06, 1.9, 0, 0, 0, C.stone);
    m.cyl(0.85, 0.9, 0.3, 0, 0.06, 0, C.stone, 12);
    m.cyl(0.74, 0.74, 0.04, 0, 0.32, 0, C.water, 12);
    m.cyl(0.14, 0.2, 0.7, 0, 0.3, 0, C.stoneDark, 8);
    m.cyl(0.4, 0.2, 0.12, 0, 1.0, 0, C.stone, 10);
    m.cyl(0.32, 0.32, 0.03, 0, 1.1, 0, C.water, 10);
    m.cyl(0.05, 0.1, 0.35, 0, 1.1, 0, C.patina, 6);
    m.ball(0.08, 0, 1.5, 0, C.glass);
  },
  statue: (m) => {
    m.box(0.85, 0.1, 0.85, 0, 0, 0, C.stone);
    m.box(0.5, 0.6, 0.5, 0, 0.1, 0, C.stoneDark);
    m.box(0.56, 0.06, 0.56, 0, 0.7, 0, C.stone);
    // A figure in patinated bronze.
    m.box(0.18, 0.42, 0.14, 0, 0.76, 0, C.patina);
    m.ball(0.08, 0, 1.28, 0, C.patina);
    m.box(0.06, 0.32, 0.06, 0.13, 0.9, 0.04, C.patina);
    m.box(0.06, 0.06, 0.32, -0.13, 1.1, 0.1, C.patina);
    m.cyl(0.11, 0.12, 0.05, 0, 1.36, 0, C.brass, 8);
  },
  dike: (m) => {
    // An earth wall along the footprint, grassed, with a stone foot and a
    // path on its crown.
    m.box(2.95, 0.12, 0.95, 0, 0, 0, C.stoneDark);
    m.box(2.9, 0.32, 0.8, 0, 0.12, 0, C.soil);
    m.box(2.85, 0.22, 0.56, 0, 0.44, 0, C.green);
    m.box(2.85, 0.03, 0.18, 0, 0.66, 0, C.path);
    for (const x of [-1.2, -0.4, 0.4, 1.2]) {
      m.box(0.32, 0.18, 0.12, x, 0.12, 0.44, C.stone);
    }
    m.cyl(0.03, 0.03, 0.5, 1.3, 0.66, 0, C.timberDark, 4);
    m.box(0.22, 0.12, 0.02, 1.3, 1.0, 0.02, C.awningB);
  },
  pumpStation: (m) => {
    // A brick engine house with a tall chimney, a wheel and a sluice.
    m.box(1.2, 0.9, 1.1, -0.25, 0, -0.2, C.brick);
    m.roof(1.3, 0.5, 1.2, -0.25, 0.9, -0.2, C.roofSlate);
    m.box(0.3, 0.45, 0.02, -0.25, 0, 0.36, C.door);
    m.box(0.25, 0.22, 0.02, -0.6, 0.5, 0.36, C.window, 1);
    m.cyl(0.11, 0.14, 1.9, 0.55, 0, -0.55, C.brick, 8);
    m.cyl(0.14, 0.14, 0.08, 0.55, 1.9, -0.55, C.stoneDark, 8);
    m.box(0.7, 0.12, 0.5, 0.55, 0, 0.55, C.stone);
    m.box(0.56, 0.05, 0.36, 0.55, 0.1, 0.55, C.water);
    part(
      m,
      (b) => b.cyl(0.36, 0.36, 0.08, 0, 0, 0, C.timber, 12),
      (g) => {
        g.rotateX(Math.PI / 2);
        g.translate(0.55, 0.5, 0.8);
      },
    );
    m.box(0.08, 0.5, 0.08, 0.55, 0.12, 0.8, C.timberDark);
  },
  irrigation: (m) => {
    // A round stone cistern with a well head, and channels to the fields.
    m.box(1.9, 0.05, 1.9, 0, 0, 0, C.soil);
    m.cyl(0.55, 0.6, 0.45, -0.25, 0.05, -0.25, C.stone, 12);
    m.cyl(0.47, 0.47, 0.04, -0.25, 0.45, -0.25, C.water, 12);
    for (const x of [-0.65, 0.15]) {
      m.box(0.06, 0.7, 0.06, x, 0.45, -0.25, C.timber);
    }
    m.roof(0.95, 0.25, 0.4, -0.25, 1.15, -0.25, C.thatch);
    m.box(1.0, 0.06, 0.16, 0.45, 0.05, 0.55, C.stoneDark);
    m.box(0.8, 0.02, 0.1, 0.45, 0.1, 0.55, C.water);
    m.box(0.16, 0.06, 1.0, 0.65, 0.05, -0.05, C.stoneDark);
    m.box(0.1, 0.02, 0.8, 0.65, 0.1, -0.05, C.water);
    m.box(0.3, 0.2, 0.2, 0.25, 0.05, 0.2, C.wood);
  },
  breakwater: (m) => {
    // A heavy wall of dressed stone with a walk and a small beacon.
    m.box(3, 0.2, 1, 0, 0, 0, C.stoneDark);
    m.box(2.9, 0.6, 0.7, 0, 0.2, 0, C.stone);
    for (const x of [-1.25, -0.75, -0.25, 0.25, 0.75, 1.25]) {
      m.box(0.36, 0.14, 0.18, x, 0.8, 0.26, C.stone);
    }
    m.box(2.9, 0.04, 0.3, 0, 0.8, -0.1, C.path);
    m.cyl(0.14, 0.18, 0.5, 1.25, 0.8, -0.15, C.stoneDark, 8);
    m.box(0.2, 0.18, 0.2, 1.25, 1.3, -0.15, C.glass, 1);
    m.cyl(0, 0.16, 0.14, 1.25, 1.48, -0.15, C.metal, 4);
  },
  perfumery: (m) => {
    // A sandstone workshop in Qasirah's manner with a small golden dome.
    const sandstone = 0xd9b98a;
    const ochre = 0xb8925f;
    const gilt = 0xd8b04a;
    m.box(1.45, 1.15, 1.1, -0.2, 0, -0.3, sandstone);
    m.box(1.53, 0.08, 1.18, -0.2, 1.15, -0.3, ochre);
    for (const z of [-0.86, 0.26]) {
      m.box(1.53, 0.14, 0.06, -0.2, 1.23, z, ochre);
    }
    m.cyl(0.32, 0.34, 0.2, -0.45, 1.23, -0.35, sandstone, 10);
    m.dome(0.33, -0.45, 1.43, -0.35, gilt);
    m.cyl(0.02, 0.03, 0.22, -0.45, 1.72, -0.35, gilt, 5);
    m.ball(0.05, -0.45, 1.97, -0.35, gilt);
    // Arched door: a dark inset with a round head.
    m.box(0.3, 0.5, 0.03, -0.6, 0, 0.26, C.door);
    part(
      m,
      (b) => b.cyl(0.15, 0.15, 0.03, 0, -0.015, 0, C.door, 8),
      (g) => {
        g.rotateX(Math.PI / 2);
        g.translate(-0.6, 0.5, 0.26);
      },
    );
    // A lit window with coloured glass flasks on its sill.
    m.box(0.5, 0.34, 0.02, 0.15, 0.4, 0.26, C.window, 1);
    m.box(0.58, 0.05, 0.12, 0.15, 0.36, 0.3, ochre);
    for (const [x, color] of [
      [-0.03, 0x9f5fa8],
      [0.1, 0x5fa8a0],
      [0.23, 0xd8a03a],
      [0.34, 0xc0607a],
    ]) {
      m.cyl(0.02, 0.045, 0.12, x, 0.41, 0.31, color, 6);
      m.ball(0.025, x, 0.56, 0.31, color);
    }
    // The still: a copper kettle with a coil, and its slender chimney.
    m.cyl(0.24, 0.28, 0.45, 0.65, 0, 0.45, C.copper, 10);
    m.dome(0.24, 0.65, 0.45, 0.45, C.copper);
    part(
      m,
      (b) => b.cyl(0.025, 0.025, 0.55, 0, 0, 0, C.copper, 5),
      (g) => {
        g.rotateZ(1.0);
        g.translate(0.62, 0.62, 0.45);
      },
    );
    m.cyl(0.1, 0.12, 0.3, 0.2, 0, 0.6, C.timber, 8);
    m.cyl(0.07, 0.09, 1.85, 0.65, 0, -0.55, ochre, 8);
    m.cyl(0.11, 0.11, 0.08, 0.65, 1.85, -0.55, sandstone, 8);
    // Sacks of blossoms and spice.
    m.ball(0.14, -0.85, 0.1, 0.55, 0xc87a8a, 0.7);
    m.ball(0.13, -0.6, 0.1, 0.7, C.awningC, 0.7);
  },
};
/* eslint-enable @typescript-eslint/no-magic-numbers */
