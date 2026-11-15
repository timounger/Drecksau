/**
 * Low-poly models of the foreign peoples' and the pirates' towns: every
 * place of a faction's settlement in the style of its culture, a small
 * harbour boat and a flag cloth. No external assets.
 *
 * @module
 * @remarks
 * Built like the player's buildings in `models.ts`: many simple shapes
 * merged into one geometry with a colour per vertex and a "glow" value for
 * windows, lanterns and embers that light up at night. A model is centred
 * on its footprint (one tile is one unit), floor at y 0, its front facing
 * +z; the layer turns it by the site's quarter turns.
 */
import type * as THREE from "three";
import type { SiteKind } from "@/games/imperavis/engine/faction-layout";
import { CULTURE } from "@/games/imperavis/engine/factions-data";
import type { CultureId } from "@/games/imperavis/engine/types";
import { C, cannon, ModelBuilder, part, pyramid, skullMark } from "./models";

/* eslint-disable @typescript-eslint/no-magic-numbers -- model geometry: sizes, offsets and colours */

/** A point in model space. */
type Point = readonly [number, number, number];

/** How a culture roofs its buildings. */
type Family = "flat" | "tiered" | "tile" | "turf" | "shack";

/** The colours of a culture's buildings. */
type Style = {
  /** Main wall colour. */
  readonly wall: number;
  /** A second, darker wall colour. */
  readonly wallDark: number;
  /** Cornices, ridges, parapets. */
  readonly trim: number;
  readonly roof: number;
  readonly wood: number;
  /** The ground plate under a place. */
  readonly ground: number;
  readonly stone: number;
  /** Dark insets of doors and arches. */
  readonly inset: number;
  /** Chimneys and stacks. */
  readonly stack: number;
  /** Bare soil of fields. */
  readonly soil: number;
};

/** Everything a drawing needs to know about the place it draws. */
type Ctx = {
  readonly culture: CultureId;
  readonly family: Family;
  readonly st: Style;
  /** Footprint in tiles. */
  readonly w: number;
  readonly h: number;
  /** Half the footprint. */
  readonly hx: number;
  readonly hz: number;
  /** 0 to 3. */
  readonly variant: number;
  /** The faction's colour, for flags. */
  readonly flag: number;
  /** The faction's second colour. */
  readonly accent: number;
  readonly pirate: boolean;
};

/** Draws one kind of place. */
type Draw = (m: ModelBuilder, c: Ctx) => void;

/** No smoke at all. */
const NONE: readonly Point[] = [];

/** Every culture's colours. */
const STYLES: Readonly<Record<CultureId, Style>> = {
  qasirah: {
    wall: 0xdcbc8c,
    wallDark: 0xbf9862,
    trim: 0xeedfbd,
    roof: 0xc9a777,
    wood: 0x7a5534,
    ground: 0xd3bf92,
    stone: 0xcdb98f,
    inset: 0x3b2b20,
    stack: 0xbf9862,
    soil: 0xc7aa72,
  },
  shogunara: {
    wall: 0xf0ebdf,
    wallDark: 0x3b2a22,
    trim: 0x2c2420,
    roof: 0x41464e,
    wood: 0x4a3426,
    ground: 0xa49a86,
    stone: 0x8d8a82,
    inset: 0x2a1f19,
    stack: 0x6f6c66,
    soil: 0x6e5a3a,
  },
  valdoria: {
    wall: 0xe8dcc4,
    wallDark: 0xd8bf95,
    trim: 0xf3ead7,
    roof: C.roofRed,
    wood: 0x6b4a2f,
    ground: 0xc9b996,
    stone: 0xcfc6b2,
    inset: 0x3a2e26,
    stack: C.brick,
    soil: 0x8a6e48,
  },
  skeld: {
    wall: 0x5f4630,
    wallDark: 0x3f2e20,
    trim: 0x2f241a,
    roof: 0x4f5c34,
    wood: 0x6b4d33,
    ground: 0x7d7a63,
    stone: 0x80817f,
    inset: 0x231a12,
    stack: 0x6d6e6c,
    soil: 0x6a5434,
  },
  crows: {
    wall: 0x4d443b,
    wallDark: 0x3a322b,
    trim: 0x23201d,
    roof: 0x3a332d,
    wood: 0x5a4c3e,
    ground: 0x6a5f50,
    stone: 0x3d3b39,
    inset: 0x161412,
    stack: 0x2b2927,
    soil: 0x5a4a38,
  },
  blackreef: {
    wall: 0x4a3f38,
    wallDark: 0x362c27,
    trim: 0x241c1a,
    roof: 0x3b2f2b,
    wood: 0x564638,
    ground: 0x655a4c,
    stone: 0x35302e,
    inset: 0x141010,
    stack: 0x2a2523,
    soil: 0x584634,
  },
};

/** How each culture roofs. */
const FAMILY: Readonly<Record<CultureId, Family>> = {
  qasirah: "flat",
  shogunara: "tiered",
  valdoria: "tile",
  skeld: "turf",
  crows: "shack",
  blackreef: "shack",
};

/**
 * Where smoke rises, per culture and kind, as fractions of the half
 * footprint for x and z and in model units for y.
 */
const SMOKE: Readonly<
  Record<CultureId, Partial<Record<SiteKind, readonly Point[]>>>
> = {
  qasirah: {
    workshop: [[0.55, 1.75, -0.5]],
    palace: [[-0.5, 2.35, -0.6]],
    tavern: [[0.4, 1.6, -0.4]],
    fire: [[0, 0.4, 0]],
  },
  shogunara: {
    workshop: [[0.55, 1.65, -0.5]],
    palace: [[-0.7, 1.4, -0.7]],
    tavern: [[0.4, 1.85, -0.4]],
    fire: [[0, 0.4, 0]],
  },
  valdoria: {
    workshop: [[0.4, 1.85, -0.55]],
    palace: [[-0.5, 2.65, -0.45]],
    tavern: [[0.4, 1.85, -0.4]],
    fire: [[0, 0.4, 0]],
  },
  skeld: {
    house: [[0.3, 1.7, -0.1]],
    workshop: [[0.1, 1.7, -0.35]],
    palace: [
      [-0.3, 2.6, -0.15],
      [0.4, 2.6, -0.15],
    ],
    tavern: [[0.3, 2.2, -0.1]],
    fire: [[0, 0.4, 0]],
  },
  crows: {
    workshop: [[0.55, 1.7, -0.45]],
    palace: [[-0.25, 2.75, -0.4]],
    tavern: [[0.5, 2.4, -0.35]],
    fire: [[0, 0.4, 0]],
  },
  blackreef: {
    workshop: [[0.55, 1.7, -0.45]],
    palace: [[-0.25, 2.75, -0.4]],
    tavern: [[0.5, 2.4, -0.35]],
    fire: [[0, 0.4, 0]],
  },
};

/** Places that stand on the bare ground without a plate. */
const LOOSE: readonly SiteKind[] = ["tree", "fire", "wreck"];

/**
 * The model of one place of a faction's town.
 *
 * @param culture - whose town
 * @param kind - what kind of place
 * @param w - footprint width in tiles (x)
 * @param h - footprint depth in tiles (z)
 * @param variant - varies the model, 0 to 3
 * @returns the geometry, centred on the footprint, floor at y 0, with
 *   `color` and `glow` attributes
 */
export function factionSiteModel(
  culture: CultureId,
  kind: SiteKind,
  w: number,
  h: number,
  variant: number,
): THREE.BufferGeometry {
  const m = new ModelBuilder();
  const c = context(culture, w, h, variant);
  if (!LOOSE.includes(kind)) {
    // Ground plate so a place sits on slopes without floating edges.
    m.box(w - 0.1, 0.35, h - 0.1, 0, -0.3, 0, c.st.ground);
  }
  const draw = DRAW[c.culture][kind] ?? GENERIC[kind] ?? genericHouse;
  draw(m, c);
  return m.build();
}

/**
 * Where smoke rises from a place.
 *
 * @param culture - whose town
 * @param kind - what kind of place
 * @param w - footprint width in tiles
 * @param h - footprint depth in tiles
 * @returns points in model space (the frame of {@link factionSiteModel},
 *   before the turn), empty where nothing smokes
 */
export function chimneysOf(
  culture: CultureId,
  kind: SiteKind,
  w: number,
  h: number,
): readonly (readonly [number, number, number])[] {
  const table = SMOKE[culture]?.[kind];
  return table === undefined
    ? NONE
    : table.map(([fx, y, fz]) => [(fx * w) / 2, y, (fz * h) / 2] as const);
}

/**
 * A small rowing and fishing boat for harbour life.
 *
 * @returns the geometry, about 0.9 x 0.35, waterline at y 0, bow towards +x
 */
export function boatModel(): THREE.BufferGeometry {
  const m = new ModelBuilder();
  m.box(0.62, 0.15, 0.3, -0.05, -0.09, 0, C.timber);
  part(
    m,
    (b) => b.box(0.21, 0.15, 0.21, 0, 0, 0, C.timber),
    (g) => {
      g.rotateY(Math.PI / 4);
      g.translate(0.26, -0.09, 0);
    },
  );
  m.box(0.08, 0.13, 0.26, -0.39, -0.07, 0, C.timberDark);
  for (const z of [0.15, -0.15]) {
    m.box(0.62, 0.03, 0.025, -0.05, 0.06, z, C.plank);
  }
  m.box(0.05, 0.03, 0.28, 0.05, 0.03, 0, C.plank);
  m.box(0.05, 0.03, 0.28, -0.25, 0.03, 0, C.plank);
  // Two oars resting across the gunwales and a fish basket.
  for (const turn of [0.35, -0.35]) {
    m.box(0.55, 0.02, 0.03, -0.08, 0.07, 0, C.wood, 0, turn);
  }
  m.cyl(0.06, 0.05, 0.08, -0.28, 0.0, 0.06, C.thatch, 6);
  return m.build();
}

/**
 * A single flag cloth, white so that a material colour can tint it, cut
 * into strips along its length so that the layer can make it wave.
 *
 * @returns the geometry, about 0.6 x 0.36, hoisted at its left edge (x 0),
 *   spanning x 0 to 0.6 and y -0.18 to 0.18
 */
export function bannerModel(): THREE.BufferGeometry {
  const m = new ModelBuilder();
  const strips = 6;
  const length = 0.6;
  const step = length / strips;
  for (let i = 0; i < strips; i += 1) {
    m.box(step, 0.36, 0.02, step / 2 + i * step, -0.18, 0, 0xffffff);
  }
  return m.build();
}

/**
 * What a drawing needs to know about a place.
 *
 * @param culture - whose town
 * @param w - footprint width
 * @param h - footprint depth
 * @param variant - the model variant
 * @returns the drawing context
 */
function context(
  culture: CultureId,
  w: number,
  h: number,
  variant: number,
): Ctx {
  const known = culture in STYLES ? culture : "valdoria";
  const def = CULTURE[known];
  const turn = Number.isFinite(variant) ? Math.floor(variant) : 0;
  return {
    culture: known,
    family: FAMILY[known],
    st: STYLES[known],
    w,
    h,
    hx: w / 2,
    hz: h / 2,
    variant: ((turn % 4) + 4) % 4,
    flag: def.color,
    accent: def.accent,
    pirate: def.kind === "pirates",
  };
}

// ---------------------------------------------------------------------------
// Small parts shared by every culture.
// ---------------------------------------------------------------------------

/** A window that lights up at night. */
function win(
  m: ModelBuilder,
  x: number,
  y: number,
  z: number,
  w = 0.2,
  h = 0.24,
  rotY = 0,
): void {
  m.box(w, h, 0.02, x, y, z, C.window, 1, rotY);
}

/** A dark arched inset (door or arcade): a box with a round head. */
function archInset(
  m: ModelBuilder,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  color: number,
  rotY = 0,
): void {
  m.box(w, h, 0.03, x, y, z, color, 0, rotY);
  part(
    m,
    (b) => b.cyl(w / 2, w / 2, 0.03, 0, -0.015, 0, color, 6),
    (g) => {
      g.rotateX(Math.PI / 2);
      g.rotateY(rotY);
      g.translate(x, y + h, z);
    },
  );
}

/**
 * A flag on a pole in the faction's colour; pirates' flags carry a skull.
 *
 * @param m - the model
 * @param c - the place
 * @param x - foot of the pole
 * @param y - foot of the pole
 * @param z - foot of the pole
 * @param height - pole height
 * @param fw - cloth width
 * @param fh - cloth height
 */
function flag(
  m: ModelBuilder,
  c: Ctx,
  x: number,
  y: number,
  z: number,
  height: number,
  fw = 0.5,
  fh = 0.3,
): void {
  m.cyl(0.025, 0.035, height, x, y, z, C.timberDark, 5);
  const fx = x + fw / 2 + 0.02;
  const fy = y + height - fh - 0.04;
  m.box(fw, fh, 0.03, fx, fy, z, c.flag);
  m.ball(0.04, x, y + height + 0.02, z, c.pirate ? C.cannon : C.gold);
  if (c.pirate) {
    skullMark(m, fx, fy + fh / 2, z, Math.min(fw, fh * 1.6) / 0.55);
  }
}

/** The chimneys of a place, each standing from the ground to its smoke point. */
function stacks(m: ModelBuilder, c: Ctx, kind: SiteKind): void {
  for (const [x, y, z] of chimneysOf(c.culture, kind, c.w, c.h)) {
    switch (c.family) {
      case "flat":
        m.cyl(0.07, 0.09, y - 0.08, x, 0, z, c.st.stack, 6);
        m.cyl(0.11, 0.11, 0.08, x, y - 0.08, z, c.st.trim, 6);
        break;
      case "shack":
        m.cyl(0.07, 0.08, y - 0.1, x, 0, z, c.st.stack, 6);
        m.cyl(0.1, 0.07, 0.1, x, y - 0.1, z, C.cannon, 6);
        break;
      default:
        m.box(0.2, y - 0.08, 0.2, x, 0, z, c.st.stack);
        m.box(0.26, 0.08, 0.26, x, y - 0.08, z, c.st.stone);
    }
  }
}

/**
 * A roof in the culture's manner over a body of the given size.
 *
 * @param m - the model
 * @param c - the place
 * @param w - body width (x)
 * @param d - body depth (z)
 * @param x - centre x
 * @param y - eaves height
 * @param z - centre z
 */
function roofOf(
  m: ModelBuilder,
  c: Ctx,
  w: number,
  d: number,
  x: number,
  y: number,
  z: number,
): void {
  switch (c.family) {
    case "flat":
      flatRoof(m, c, w, d, x, y, z);
      break;
    case "tiered":
      tieredRoof(m, c, w, d, x, y, z);
      break;
    case "turf":
      turfRoof(m, c, w, d, x, y, z);
      break;
    case "shack":
      shackRoof(m, c, w, d, x, y, z);
      break;
    default:
      tileRoof(m, c, w, d, x, y, z);
  }
}

/** A flat roof with a parapet (Qasirah). */
function flatRoof(
  m: ModelBuilder,
  c: Ctx,
  w: number,
  d: number,
  x: number,
  y: number,
  z: number,
  rim = true,
): void {
  m.box(w + 0.08, 0.08, d + 0.08, x, y, z, c.st.trim);
  if (rim) {
    for (const side of [1, -1]) {
      m.box(
        w + 0.08,
        0.14,
        0.06,
        x,
        y + 0.08,
        z + side * (d / 2 + 0.01),
        c.st.wallDark,
      );
      m.box(
        0.06,
        0.14,
        d + 0.08,
        x + side * (w / 2 + 0.01),
        y + 0.08,
        z,
        c.st.wallDark,
      );
    }
  }
}

/**
 * A wide eaved roof with lifted corners (Shogunara): two overhanging slabs,
 * up-turned corner tips and, when capped, a ridge roof on top.
 */
function tieredRoof(
  m: ModelBuilder,
  c: Ctx,
  w: number,
  d: number,
  x: number,
  y: number,
  z: number,
  cap = true,
): void {
  const { roof, trim } = c.st;
  m.box(w + 0.5, 0.06, d + 0.5, x, y, z, roof);
  for (const [sx, sz] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]) {
    m.box(
      0.22,
      0.07,
      0.22,
      x + sx * (w / 2 + 0.2),
      y + 0.05,
      z + sz * (d / 2 + 0.2),
      roof,
    );
  }
  m.box(w + 0.3, 0.07, d + 0.3, x, y + 0.06, z, roof);
  if (cap) {
    m.roof(w + 0.1, 0.34, d + 0.12, x, y + 0.13, z, roof);
    m.box(w + 0.16, 0.05, 0.08, x, y + 0.45, z, trim);
  }
}

/** A low gabled roof of red tiles over a cornice (Valdoria). */
function tileRoof(
  m: ModelBuilder,
  c: Ctx,
  w: number,
  d: number,
  x: number,
  y: number,
  z: number,
): void {
  m.box(w + 0.12, 0.06, d + 0.12, x, y, z, c.st.trim);
  m.roof(w + 0.2, 0.45, d + 0.22, x, y + 0.06, z, c.st.roof);
}

/** A steep turf roof with crossed boards on both gables (Skeld). */
function turfRoof(
  m: ModelBuilder,
  c: Ctx,
  w: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color = c.st.roof,
): void {
  const rise = 0.85 * d + 0.05;
  const span = d + 0.35;
  m.roof(w + 0.2, rise, span, x, y, z, color);
  const tilt = Math.atan2(span / 2, rise);
  const board = Math.min(0.9, 0.35 + d * 0.3);
  for (const end of [1, -1]) {
    for (const lean of [tilt, -tilt]) {
      part(
        m,
        (b) => b.box(0.05, board, 0.05, 0, -board / 2, 0, c.st.trim),
        (g) => {
          g.rotateX(lean);
          g.translate(x + end * (w / 2 + 0.1), y + rise, z);
        },
      );
    }
  }
}

/** A crooked plank roof with a mismatched patch (pirates). */
function shackRoof(
  m: ModelBuilder,
  c: Ctx,
  w: number,
  d: number,
  x: number,
  y: number,
  z: number,
): void {
  const rise = 0.5;
  const half = (d + 0.15) / 2;
  part(
    m,
    (b) => b.roof(w + 0.15, rise, d + 0.15, 0, 0, 0, c.st.roof),
    (g) => {
      g.rotateZ(0.04);
      g.translate(x, y, z);
    },
  );
  const slope = Math.atan2(rise, half);
  const along = half * 0.5;
  part(
    m,
    (b) => b.box(w * 0.35, 0.03, 0.3, 0, 0, 0, c.st.wood),
    (g) => {
      g.rotateX(slope);
      g.translate(
        x - w * 0.15,
        y + rise * (1 - along / half) + 0.01,
        z + along,
      );
    },
  );
}

/** Stripes of cloth on a flat awning, alternating two colours. */
function stripedAwning(
  m: ModelBuilder,
  w: number,
  d: number,
  x: number,
  y: number,
  z: number,
  a: number,
  b: number,
): void {
  const n = 5;
  const step = w / n;
  for (let i = 0; i < n; i += 1) {
    m.box(
      step,
      0.04,
      d,
      x - w / 2 + step / 2 + i * step,
      y,
      z,
      i % 2 === 0 ? a : b,
    );
  }
}

/** A market stall: counter, posts, a striped awning and wares. */
function stall(
  m: ModelBuilder,
  x: number,
  z: number,
  a: number,
  b: number,
  wood: number,
): void {
  m.box(0.75, 0.4, 0.38, x, 0, z, wood);
  for (const [dx, dz] of [
    [-0.38, -0.25],
    [0.38, -0.25],
    [-0.38, 0.3],
    [0.38, 0.3],
  ]) {
    m.box(0.04, 0.85, 0.04, x + dx, 0, z + dz, C.timberDark);
  }
  stripedAwning(m, 0.9, 0.7, x, 0.85, z + 0.02, a, b);
  m.ball(0.07, x - 0.2, 0.45, z, C.awningC, 0.7);
  m.ball(0.07, x, 0.45, z + 0.05, C.awningA, 0.7);
  m.box(0.14, 0.1, 0.14, x + 0.22, 0.4, z, C.plank);
}

/** A small round fountain. */
function fountain(
  m: ModelBuilder,
  x: number,
  z: number,
  r: number,
  stone: number,
): void {
  m.cyl(r, r + 0.05, 0.25, x, 0, z, stone, 10);
  m.cyl(r - 0.06, r - 0.06, 0.02, x, 0.24, z, C.water, 10);
  m.cyl(0.06, 0.08, 0.45, x, 0.2, z, stone, 6);
  m.cyl(r * 0.4, r * 0.15, 0.08, x, 0.62, z, stone, 8);
  m.ball(0.05, x, 0.74, z, C.glass);
}

/** A barrel. */
function barrel(
  m: ModelBuilder,
  x: number,
  y: number,
  z: number,
  color: number = C.timber,
): void {
  m.cyl(0.12, 0.12, 0.3, x, y, z, color, 7);
  m.cyl(0.125, 0.125, 0.03, x, y + 0.2, z, C.metal, 7);
}

/** Two crates and a barrel. */
function goods(m: ModelBuilder, x: number, z: number): void {
  m.box(0.3, 0.3, 0.3, x, 0, z, C.plank);
  m.box(0.24, 0.24, 0.24, x + 0.34, 0, z + 0.04, C.wood, 0, 0.3);
  barrel(m, x + 0.1, 0, z + 0.36);
}

/** A lantern that glows at night. */
function lantern(m: ModelBuilder, x: number, y: number, z: number): void {
  m.box(0.1, 0.13, 0.1, x, y, z, 0xffc46a, 1);
  m.box(0.13, 0.03, 0.13, x, y + 0.13, z, C.cannon);
}

/** A lantern on a post. */
function lanternPost(
  m: ModelBuilder,
  x: number,
  z: number,
  height = 1.1,
): void {
  m.box(0.05, height, 0.05, x, 0, z, C.timberDark);
  lantern(m, x, height, z);
}

// ---------------------------------------------------------------------------
// Trees.
// ---------------------------------------------------------------------------

/** A palm tree with drooping fronds. */
function palm(m: ModelBuilder, x: number, z: number, s = 1): void {
  for (let i = 0; i < 3; i += 1) {
    m.cyl(
      0.05 * s,
      0.065 * s,
      0.46 * s,
      x + i * 0.04 * s,
      i * 0.45 * s,
      z,
      0x8a6a45,
      5,
    );
  }
  const cx = x + 0.1 * s;
  const cy = 1.35 * s;
  for (let k = 0; k < 5; k += 1) {
    const turn = (k * Math.PI * 2) / 5 + 0.3;
    part(
      m,
      (b) =>
        b.box(
          0.62 * s,
          0.03,
          0.16 * s,
          0.31 * s,
          0,
          0,
          k % 2 === 0 ? 0x4f8a2f : 0x3f7426,
        ),
      (g) => {
        g.rotateZ(-0.45);
        g.rotateY(turn);
        g.translate(cx, cy, z);
      },
    );
  }
  m.ball(0.08 * s, cx, cy - 0.05 * s, z, 0x8a4a22);
}

/** A cherry tree in pink blossom. */
function cherry(m: ModelBuilder, x: number, z: number, s = 1): void {
  m.cyl(0.05 * s, 0.08 * s, 0.6 * s, x, 0, z, 0x4a3328, 5);
  m.ball(0.36 * s, x, 0.85 * s, z, 0xf0b4c8);
  m.ball(0.24 * s, x + 0.22 * s, 0.75 * s, z + 0.08 * s, 0xe597b2);
  m.ball(0.26 * s, x - 0.18 * s, 0.78 * s, z - 0.1 * s, 0xf6cad7);
}

/** A slender dark cypress. */
function cypress(m: ModelBuilder, x: number, z: number, s = 1): void {
  m.cyl(0.04 * s, 0.05 * s, 0.25 * s, x, 0, z, C.timber, 4);
  m.cyl(0.03 * s, 0.2 * s, 1.6 * s, x, 0.15 * s, z, 0x2e4a2a, 6);
  m.ball(0.18 * s, x, 0.45 * s, z, 0x2e4a2a, 1.4);
}

/** A dark spruce of three stacked cones. */
function spruce(m: ModelBuilder, x: number, z: number, s = 1): void {
  m.cyl(0.05 * s, 0.07 * s, 0.35 * s, x, 0, z, C.timberDark, 5);
  m.cyl(0, 0.48 * s, 0.7 * s, x, 0.25 * s, z, 0x22402c, 6);
  m.cyl(0, 0.38 * s, 0.65 * s, x, 0.65 * s, z, 0x22402c, 6);
  m.cyl(0, 0.26 * s, 0.55 * s, x, 1.05 * s, z, 0x284a32, 6);
}

/** A small silver-green olive tree. */
function olive(m: ModelBuilder, x: number, z: number, s = 1): void {
  m.cyl(0.05 * s, 0.08 * s, 0.45 * s, x, 0, z, 0x6b5a48, 5);
  m.ball(0.3 * s, x, 0.65 * s, z, 0x8b9a6b, 0.8);
  m.ball(0.22 * s, x + 0.18 * s, 0.55 * s, z + 0.05 * s, 0x7a8a5c, 0.8);
}

/** A dead, bare tree with a few crooked branches. */
function deadTree(m: ModelBuilder, x: number, z: number, s = 1): void {
  const bark = 0x5b5148;
  m.cyl(0.05 * s, 0.09 * s, 1.1 * s, x, 0, z, bark, 5);
  [0.4, 2.5, 4.4].forEach((turn, i) => {
    part(
      m,
      (b) => b.cyl(0.015 * s, 0.035 * s, 0.5 * s, 0, 0, 0, bark, 4),
      (g) => {
        g.rotateZ(0.8 + i * 0.15);
        g.rotateY(turn);
        g.translate(x, (0.55 + i * 0.17) * s, z);
      },
    );
  });
}

/** The culture's usual tree. */
function treeOf(m: ModelBuilder, c: Ctx, x: number, z: number, s = 1): void {
  switch (c.culture) {
    case "qasirah":
      palm(m, x, z, s);
      break;
    case "shogunara":
      cherry(m, x, z, s);
      break;
    case "valdoria":
      cypress(m, x, z, s);
      break;
    case "skeld":
      spruce(m, x, z, s);
      break;
    default:
      deadTree(m, x, z, s);
  }
}

// ---------------------------------------------------------------------------
// Places every culture can fall back on, in its own colours and roofs.
// ---------------------------------------------------------------------------

/** A plain house in the culture's manner. */
function genericHouse(m: ModelBuilder, c: Ctx): void {
  m.box(
    1.3,
    1.0,
    1.1,
    0,
    0,
    -0.1,
    c.variant % 2 === 0 ? c.st.wall : c.st.wallDark,
  );
  roofOf(m, c, 1.3, 1.1, 0, 1.0, -0.1);
  m.box(0.26, 0.5, 0.03, -0.3, 0, 0.46, C.door);
  win(m, 0.3, 0.45, 0.46);
  win(m, 0.66, 0.45, -0.1, 0.2, 0.24, Math.PI / 2);
}

/** A workshop: a house with a chimney and goods by the door. */
function genericWorkshop(m: ModelBuilder, c: Ctx): void {
  genericHouse(m, c);
  stacks(m, c, "workshop");
  goods(m, -0.7, 0.6);
}

/** An inn: a house with a hanging sign, a lantern and barrels. */
function genericTavern(m: ModelBuilder, c: Ctx): void {
  genericHouse(m, c);
  stacks(m, c, "tavern");
  m.box(0.05, 0.9, 0.05, 0.75, 0, 0.7, C.timberDark);
  m.box(0.35, 0.04, 0.04, 0.6, 0.86, 0.7, C.timberDark);
  m.box(0.28, 0.2, 0.03, 0.58, 0.6, 0.7, c.flag);
  lantern(m, 0.1, 0.6, 0.5);
  barrel(m, -0.75, 0, 0.7);
}

/** A big hall with a tower: the seat of the ruler. */
function genericPalace(m: ModelBuilder, c: Ctx): void {
  m.box(3.0, 1.6, 2.0, 0, 0, -0.3, c.st.wall);
  roofOf(m, c, 3.0, 2.0, 0, 1.6, -0.3);
  m.box(0.8, 2.6, 0.8, 1.3, 0, 1.1, c.st.wallDark);
  roofOf(m, c, 0.8, 0.8, 1.3, 2.6, 1.1);
  m.box(0.5, 0.8, 0.03, 0, 0, 0.71, C.door);
  for (const x of [-1.0, -0.5, 0.5, 1.0]) {
    win(m, x, 0.9, 0.71, 0.2, 0.32);
  }
  stacks(m, c, "palace");
  flag(m, c, -1.4, 0, 1.4, 2.4);
}

/** A defence tower with a flag. */
function genericTower(m: ModelBuilder, c: Ctx): void {
  m.box(1.1, 1.2, 1.1, 0, 0, 0, c.st.stone);
  m.box(0.9, 1.1, 0.9, 0, 1.2, 0, c.st.wall);
  roofOf(m, c, 0.9, 0.9, 0, 2.3, 0);
  m.box(0.26, 0.5, 0.03, 0, 0, 0.56, C.door);
  win(m, 0, 1.6, 0.46, 0.1, 0.3);
  flag(m, c, 0.65, 0, 0.65, 2.6);
}

/** A market square with three stalls. */
function genericMarket(m: ModelBuilder, c: Ctx): void {
  m.box(c.w - 0.3, 0.06, c.h - 0.3, 0, 0, 0, c.st.stone);
  stall(m, -0.8, -0.8, c.flag, c.st.trim, c.st.wood);
  stall(m, 0.8, -0.8, C.awningB, c.st.trim, c.st.wood);
  stall(m, -0.8, 0.8, C.awningA, c.st.trim, c.st.wood);
  fountain(m, 0.75, 0.75, 0.35, c.st.stone);
}

/** A hall of worship with a small tower. */
function genericTemple(m: ModelBuilder, c: Ctx): void {
  m.box(1.0, 1.1, 1.4, 0.25, 0, 0, c.st.wall);
  roofOf(m, c, 1.0, 1.4, 0.25, 1.1, 0);
  m.box(0.55, 1.8, 0.55, -0.5, 0, -0.45, c.st.wallDark);
  roofOf(m, c, 0.55, 0.55, -0.5, 1.8, -0.45);
  m.box(0.3, 0.55, 0.03, 0.25, 0, 0.71, C.door);
  win(m, 0.25, 0.7, 0.71, 0.18, 0.28);
}

/** A storehouse with goods outside. */
function genericWarehouse(m: ModelBuilder, c: Ctx): void {
  m.box(1.6, 1.1, 1.2, 0, 0, -0.25, c.st.wallDark);
  roofOf(m, c, 1.6, 1.2, 0, 1.1, -0.25);
  m.box(0.6, 0.7, 0.03, 0, 0, 0.36, C.door);
  goods(m, -0.7, 0.55);
  goods(m, 0.3, 0.6);
}

/** A walled garden with trees. */
function genericGarden(m: ModelBuilder, c: Ctx): void {
  m.box(c.w - 0.2, 0.06, c.h - 0.2, 0, 0, 0, C.green);
  m.box(0.3, 0.02, c.h - 0.2, 0, 0.06, 0, C.path);
  treeOf(m, c, -0.55, -0.5, 0.7);
  treeOf(m, c, 0.55, 0.5, 0.7);
  m.ball(0.2, -0.5, 0.15, 0.5, C.greenDark, 0.8);
  m.ball(0.2, 0.5, 0.15, -0.5, C.greenDark, 0.8);
}

/** Fields: rows of a crop on bare soil. */
function genericField(m: ModelBuilder, c: Ctx): void {
  m.box(c.w - 0.2, 0.06, c.h - 0.2, 0, 0, 0, c.st.soil);
  const rows = 6;
  for (let row = 0; row < rows; row += 1) {
    const z = -c.hz + 0.35 + (row * (c.h - 0.7)) / (rows - 1);
    m.box(c.w - 0.5, 0.18, 0.14, 0, 0.05, z, C.grain);
  }
}

/** A building slip with a hull and a shed. */
function genericShipyard(m: ModelBuilder, c: Ctx): void {
  m.box(c.w - 0.2, 0.08, 1.1, 0, 0, c.hz - 0.6, C.plank);
  hullFrame(m, 0, c.hz - 0.6, 2.2, 0.8, 0.6, c.st.wood, false);
  m.box(1.0, 0.7, 0.6, -0.8, 0, -c.hz + 0.4, c.st.wall);
  roofOf(m, c, 1.0, 0.6, -0.8, 0.7, -c.hz + 0.4);
  m.box(0.08, 1.6, 0.08, 1.2, 0, -0.5, c.st.wood);
}

/** A quay and a pier with goods, bollards and a flag. */
function genericHarbour(m: ModelBuilder, c: Ctx): void {
  const px = harbourBase(m, c, false);
  goods(m, -px - 0.2, c.hz - 0.45);
  flag(m, c, -px + 0.5, 0.05, c.hz - 0.25, 1.8);
}

/** The culture's tree on one tile. */
function treeSite(m: ModelBuilder, c: Ctx): void {
  const s = 0.85 + c.variant * 0.07;
  const dx = (c.variant - 1.5) * 0.06;
  if (c.culture === "valdoria" && c.variant === 3) {
    olive(m, dx, 0, 1.1);
  } else if (c.culture === "shogunara" && c.variant === 3) {
    spruce(m, dx, 0, 0.9);
  } else {
    treeOf(m, c, dx, 0, s);
  }
}

/** A campfire: a ring of stones, crossed logs, embers and a spit. */
function campfire(m: ModelBuilder, c: Ctx): void {
  const stones = 7;
  for (let k = 0; k < stones; k += 1) {
    const a = (k * Math.PI * 2) / stones;
    m.ball(0.07, Math.cos(a) * 0.24, 0.03, Math.sin(a) * 0.24, 0x5f5c58, 0.7);
  }
  for (const turn of [0, 2.1, -2.1]) {
    part(
      m,
      (b) => b.cyl(0.035, 0.035, 0.36, 0, -0.18, 0, C.timberDark, 5),
      (g) => {
        g.rotateZ(Math.PI / 2 - 0.35);
        g.rotateY(turn);
        g.translate(0, 0.08, 0);
      },
    );
  }
  m.box(0.18, 0.06, 0.18, 0, 0.0, 0, C.ember, 1, 0.4);
  m.box(0.1, 0.22, 0.1, 0, 0.04, 0, 0xffb347, 1, 0.8);
  m.box(0.06, 0.14, 0.06, 0.05, 0.1, 0.03, 0xffd27a, 1, 0.2);
  for (const x of [-0.32, 0.32]) {
    m.box(0.03, 0.45, 0.03, x, 0, 0, C.timberDark);
  }
  m.box(0.68, 0.025, 0.025, 0, 0.42, 0, C.metal);
  // A log to sit on, turned by the variant.
  m.box(0.4, 0.1, 0.1, 0, 0, 0.4, C.timber, 0, c.variant * 0.5);
}

/** A broken hull lying on its side in the sand. */
function wreckSite(m: ModelBuilder, c: Ctx): void {
  const hull = c.pirate ? C.hullPirate : C.hullDark;
  m.box(
    Math.min(1.9, c.w - 0.1),
    0.1,
    Math.min(0.9, c.h - 0.1),
    0,
    -0.06,
    0,
    C.sand,
  );
  part(
    m,
    (b) => {
      b.box(1.4, 0.42, 0.6, -0.1, 0, 0, hull);
      b.box(0.34, 0.36, 0.34, 0.62, 0.03, 0, hull, 0, Math.PI / 4);
      b.box(1.1, 0.04, 0.5, -0.1, 0.42, 0, C.plank);
      for (let i = 0; i < 4; i += 1) {
        b.box(0.05, 0.5, 0.66, -0.55 + i * 0.22, 0, 0, C.timberDark);
      }
    },
    (g) => {
      g.rotateX(1.15);
      g.translate(0, 0.02, 0.05);
    },
  );
  part(
    m,
    (b) => b.cyl(0.04, 0.05, 1.0, 0, 0, 0, C.timberDark, 5),
    (g) => {
      g.rotateZ(Math.PI / 2);
      g.rotateY(0.25);
      g.translate(0.55, 0.05, -0.2);
    },
  );
  m.box(
    0.4,
    0.02,
    0.3,
    0.55,
    0,
    0.25,
    c.pirate ? C.sailPirate : C.sail,
    0,
    0.5,
  );
  m.box(0.5, 0.04, 0.1, -0.6, 0, 0.32, C.plank, 0, -0.4);
  barrel(m, 0.75, 0, 0.3);
}

/**
 * A hull on its stocks, its long side along x, ribs standing and planked
 * from the stern up to a share of its length.
 *
 * @param m - the model
 * @param x - centre x
 * @param z - centre z
 * @param len - hull length
 * @param beam - hull beam
 * @param planked - share planked, 0 (bare ribs) to 1
 * @param color - plank colour
 * @param nordic - a tall curved stem post
 */
function hullFrame(
  m: ModelBuilder,
  x: number,
  z: number,
  len: number,
  beam: number,
  planked: number,
  color: number,
  nordic: boolean,
): void {
  for (const sx of [-0.3, 0, 0.3]) {
    m.box(0.12, 0.25, beam + 0.3, x + sx * len, 0, z, C.timberDark);
  }
  m.box(len, 0.1, 0.12, x, 0.25, z, color);
  const ribs = 7;
  const step = (len * 0.9) / (ribs - 1);
  for (let i = 0; i < ribs; i += 1) {
    const t = (i / (ribs - 1)) * 2 - 1;
    const rh = 0.55 * (1 - 0.35 * t * t);
    const hw = (beam / 2) * (1 - 0.5 * t * t);
    const rx = x + t * len * 0.45;
    for (const side of [1, -1]) {
      m.box(0.05, rh, 0.05, rx, 0.3, z + side * hw, C.timber);
      if ((t + 1) / 2 < planked) {
        m.box(
          step + 0.02,
          rh * 0.85,
          0.04,
          rx,
          0.3,
          z + side * (hw + 0.02),
          color,
        );
      }
    }
    m.box(0.05, 0.05, hw * 2, rx, 0.3 + rh, z, C.timber);
  }
  if (nordic) {
    for (const [tilt, dx, y] of [
      [0.5, 0, 0.3],
      [0.2, 0.15, 0.58],
      [-0.3, 0.21, 0.89],
    ]) {
      part(
        m,
        (b) => b.box(0.08, 0.32, 0.07, 0, 0, 0, color),
        (g) => {
          g.rotateZ(-tilt);
          g.translate(x + len / 2 + dx, y, z);
        },
      );
    }
  } else {
    part(
      m,
      (b) => b.box(0.08, 0.6, 0.07, 0, 0, 0, color),
      (g) => {
        g.rotateZ(-0.5);
        g.translate(x + len / 2, 0.3, z);
      },
    );
  }
}

/**
 * The quay along the shore edge (+z) and a pier reaching out over the
 * water by about a tile, with bollards at its end.
 *
 * @param m - the model
 * @param c - the place
 * @param stone - a stone pier, else a wooden one on posts
 * @returns the x of the pier's middle
 */
function harbourBase(m: ModelBuilder, c: Ctx, stone: boolean): number {
  const { w, hz, st } = c;
  const deck = stone ? st.stone : C.plank;
  const px = c.variant % 2 === 0 ? w / 2 - 0.8 : -w / 2 + 0.8;
  m.box(w - 0.1, 0.3, 0.7, 0, -0.25, hz - 0.35, deck);
  m.box(
    w - 0.1,
    0.9,
    0.14,
    0,
    -0.9,
    hz - 0.07,
    stone ? st.wallDark : C.timberDark,
  );
  if (stone) {
    m.box(0.85, 1.0, 1.15, px, -0.95, hz + 0.55, deck);
    m.box(0.89, 0.06, 1.19, px, 0.03, hz + 0.55, st.wallDark);
  } else {
    m.box(0.8, 0.07, 1.2, px, -0.02, hz + 0.6, C.plank);
    for (const dz of [0.15, 0.6, 1.1]) {
      for (const dx of [-0.35, 0.35]) {
        m.cyl(0.05, 0.05, 1.1, px + dx, -1.0, hz + dz, C.timberDark, 5);
      }
      m.box(0.82, 0.02, 0.06, px, 0.05, hz + dz, C.wood);
    }
  }
  for (const dx of [-0.3, 0.3]) {
    m.cyl(0.06, 0.07, 0.18, px + dx, 0.05, hz + 1.0, C.cannon, 6);
  }
  return px;
}

/** Fallback drawings, one for every kind of place. */
const GENERIC: Readonly<Record<SiteKind, Draw>> = {
  palace: genericPalace,
  harbour: genericHarbour,
  house: genericHouse,
  workshop: genericWorkshop,
  field: genericField,
  tower: genericTower,
  market: genericMarket,
  temple: genericTemple,
  warehouse: genericWarehouse,
  garden: genericGarden,
  shipyard: genericShipyard,
  tavern: genericTavern,
  fire: campfire,
  wreck: wreckSite,
  tree: treeSite,
};

// ---------------------------------------------------------------------------
// Qasirah: sandstone, flat roofs, golden domes, palms and gardens.
// ---------------------------------------------------------------------------

/** A cubic sandstone house with a flat roof, maybe an upper room or dome. */
function qasirahHouse(m: ModelBuilder, c: Ctx): void {
  const { st, variant: v } = c;
  const ht = 1.1 + (v % 2) * 0.35;
  const wall = v === 2 ? st.wallDark : st.wall;
  m.box(1.4, ht, 1.3, -0.1, 0, -0.1, wall);
  flatRoof(m, c, 1.4, 1.3, -0.1, ht, -0.1);
  archInset(m, -0.4, 0, 0.56, 0.3, 0.42, st.inset);
  win(m, 0.25, ht - 0.55, 0.56, 0.2, 0.26);
  win(m, 0.61, ht - 0.55, -0.1, 0.2, 0.26, Math.PI / 2);
  stripedAwning(m, 0.5, 0.25, 0.25, ht - 0.25, 0.7, c.flag, st.trim);
  if (v === 1 || v === 3) {
    m.box(0.7, 0.6, 0.6, 0.15, ht, -0.4, wall);
    flatRoof(m, c, 0.7, 0.6, 0.15, ht + 0.6, -0.4, false);
    win(m, 0.15, ht + 0.2, -0.09, 0.18, 0.22);
  }
  if (v >= 2) {
    m.cyl(0.26, 0.27, 0.12, -0.5, ht + 0.08, 0.2, st.trim, 8);
    m.dome(0.27, -0.5, ht + 0.2, 0.2, c.accent);
  }
  if (v === 0) {
    palm(m, 0.72, 0.68, 0.6);
  }
  m.cyl(0.07, 0.11, 0.28, 0.0, 0, 0.78, C.clay, 6);
}

/** A workshop with a flat roof, a striped awning, jars and a slender stack. */
function qasirahWorkshop(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(1.5, 1.0, 1.1, -0.2, 0, -0.25, st.wall);
  flatRoof(m, c, 1.5, 1.1, -0.2, 1.0, -0.25);
  archInset(m, -0.6, 0, 0.31, 0.32, 0.42, st.inset);
  win(m, 0.1, 0.45, 0.31, 0.3, 0.24);
  stripedAwning(m, 1.3, 0.45, -0.2, 0.75, 0.55, c.flag, st.trim);
  for (const x of [-0.82, 0.42]) {
    m.box(0.04, 0.75, 0.04, x, 0, 0.75, C.timberDark);
  }
  for (const [x, z] of [
    [0.72, 0.55],
    [0.86, 0.78],
    [0.6, 0.82],
  ]) {
    m.cyl(0.06, 0.1, 0.3, x, 0, z, C.clay, 6);
  }
  m.dome(0.25, 0.7, 0, 0.1, st.wallDark);
  m.box(0.14, 0.12, 0.02, 0.7, 0.04, 0.35, C.ember, 1);
  stacks(m, c, "workshop");
}

/**
 * The sultan's palace: a hall under a big golden dome with an arcade, two
 * lower wings, four slender towers and a pool between palms.
 */
function qasirahPalace(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(3.7, 0.2, 3.7, 0, 0, 0, st.stone);
  m.box(2.4, 1.6, 2.0, 0, 0.2, -0.3, st.wall);
  flatRoof(m, c, 2.4, 2.0, 0, 1.8, -0.3);
  for (const x of [-0.9, -0.45, 0, 0.45, 0.9]) {
    const big = x === 0;
    archInset(m, x, 0.2, 0.71, big ? 0.36 : 0.26, big ? 0.7 : 0.5, st.inset);
    win(m, x, 1.25, 0.71, 0.16, 0.26);
  }
  m.cyl(0.72, 0.75, 0.42, 0, 1.88, -0.3, st.trim, 10);
  m.dome(0.78, 0, 2.3, -0.3, c.accent);
  m.cyl(0.03, 0.05, 0.35, 0, 3.02, -0.3, c.accent, 5);
  m.ball(0.08, 0, 3.42, -0.3, c.accent);
  for (const side of [1, -1]) {
    const x = side * 1.55;
    m.box(0.8, 1.1, 1.6, x, 0.2, -0.2, st.wallDark);
    flatRoof(m, c, 0.8, 1.6, x, 1.3, -0.2, false);
    m.ball(0.3, x, 1.42, -0.3, c.accent, 0.9);
    archInset(m, x, 0.2, 0.61, 0.26, 0.45, st.inset);
  }
  for (const [x, z] of [
    [-1.6, -1.6],
    [1.6, -1.6],
    [-1.6, 1.4],
    [1.6, 1.4],
  ]) {
    m.cyl(0.13, 0.17, 2.0, x, 0.2, z, st.trim, 6);
    m.cyl(0.22, 0.22, 0.07, x, 2.2, z, st.wallDark, 6);
    m.ball(0.15, x, 2.42, z, c.accent, 1.35);
    m.cyl(0, 0.03, 0.2, x, 2.58, z, c.accent, 4);
  }
  m.box(1.36, 0.08, 0.76, 0, 0.2, 1.45, st.wallDark);
  m.box(1.2, 0.04, 0.6, 0, 0.26, 1.45, C.water);
  palm(m, -1.0, 1.55, 0.75);
  palm(m, 1.0, 1.55, 0.75);
  flag(m, c, 1.0, 2.02, -1.1, 1.2);
  flag(m, c, -1.55, 1.38, 0.35, 0.9);
  stacks(m, c, "palace");
}

/** A paved market with striped awnings, spice baskets and a fountain. */
function qasirahMarket(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(2.8, 0.06, 2.8, 0, 0, 0, st.stone);
  stall(m, -0.85, -0.85, c.flag, st.trim, st.wood);
  stall(m, 0.85, -0.85, C.awningA, st.trim, st.wood);
  stall(m, -0.85, 0.85, c.accent, st.trim, st.wood);
  stall(m, 0.85, 0.85, c.flag, C.awningA, st.wood);
  fountain(m, 0, 0, 0.32, st.wallDark);
  for (const [x, z, color] of [
    [0.55, 0.05, 0xd8962a],
    [-0.55, -0.05, 0xa83a2a],
    [0.05, 0.55, 0x6a8a3a],
  ]) {
    m.cyl(0.11, 0.09, 0.14, x, 0.06, z, C.thatch, 7);
    m.ball(0.09, x, 0.2, z, color, 0.5);
  }
}

/** A tall storehouse with a great arched gate and sacks. */
function qasirahWarehouse(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(1.7, 1.3, 1.4, 0, 0, -0.2, st.wallDark);
  flatRoof(m, c, 1.7, 1.4, 0, 1.3, -0.2);
  archInset(m, 0, 0, 0.51, 0.6, 0.55, st.inset);
  for (const x of [-0.55, 0.55]) {
    win(m, x, 0.95, 0.51, 0.12, 0.2);
  }
  for (const [x, z] of [
    [-0.65, 0.7],
    [-0.4, 0.75],
    [-0.52, 0.72],
  ]) {
    m.ball(0.15, x, 0.1, z, 0xd9c8a0, 0.7);
  }
  goods(m, 0.35, 0.6);
}

/** A walled garden: green squares, a cross of paths, a fountain, palms. */
function qasirahGarden(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  for (const side of [1, -1]) {
    m.box(1.9, 0.3, 0.08, 0, 0, side * 0.92, st.wall);
    m.box(0.08, 0.3, 1.9, side * 0.92, 0, 0, st.wall);
  }
  m.box(1.8, 0.04, 1.8, 0, 0, 0, st.stone);
  for (const [x, z] of [
    [-0.47, -0.47],
    [0.47, -0.47],
    [-0.47, 0.47],
    [0.47, 0.47],
  ]) {
    m.box(0.68, 0.08, 0.68, x, 0, z, C.green);
  }
  m.cyl(0.28, 0.3, 0.2, 0, 0, 0, st.wallDark, 10);
  m.cyl(0.24, 0.24, 0.02, 0, 0.19, 0, C.water, 10);
  m.cyl(0.04, 0.05, 0.3, 0, 0.18, 0, st.trim, 5);
  m.ball(0.05, 0, 0.5, 0, C.glass);
  palm(m, -0.55, -0.55, 0.6);
  palm(m, 0.55, 0.55, 0.6);
  for (const [x, z, color] of [
    [0.5, -0.5, 0xd8607a],
    [-0.5, 0.5, C.awningC],
  ]) {
    m.ball(0.12, x, 0.12, z, color, 0.8);
  }
}

/** A grove of date palms along an irrigation channel. */
function qasirahField(m: ModelBuilder, c: Ctx): void {
  m.box(c.w - 0.15, 0.06, c.h - 0.15, 0, 0, 0, c.st.soil);
  m.box(c.w - 0.2, 0.03, 0.18, 0, 0.06, 0, C.water);
  const shift = (c.variant - 1.5) * 0.08;
  for (const x of [-1, 0, 1]) {
    for (const z of [-0.75, 0.75]) {
      palm(m, x * (c.hx - 0.5) + shift * z, z * (c.hz / 1.5), 0.85);
    }
  }
}

/** A square sandstone tower with merlons, a domed kiosk and a flag. */
function qasirahTower(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(1.3, 0.2, 1.3, 0, 0, 0, st.stone);
  m.box(0.95, 2.2, 0.95, 0, 0.2, 0, st.wall);
  m.box(1.0, 0.08, 1.0, 0, 1.4, 0, st.trim);
  m.box(1.15, 0.1, 1.15, 0, 2.4, 0, st.wallDark);
  for (const [x, z] of [
    [-0.5, -0.5],
    [0.5, -0.5],
    [-0.5, 0.5],
    [0.5, 0.5],
    [0, 0.5],
    [0, -0.5],
    [0.5, 0],
    [-0.5, 0],
  ]) {
    m.box(0.16, 0.22, 0.16, x, 2.5, z, st.wall);
  }
  m.cyl(0.27, 0.27, 0.25, 0, 2.5, 0, st.trim, 8);
  m.dome(0.28, 0, 2.75, 0, c.accent);
  m.ball(0.05, 0, 3.07, 0, c.accent);
  archInset(m, 0, 0.2, 0.49, 0.26, 0.4, st.inset);
  win(m, 0, 1.0, 0.49, 0.08, 0.24);
  win(m, 0, 1.75, 0.49, 0.08, 0.24);
  flag(m, c, 0.45, 2.5, 0.45, 1.0);
}

/** A stone quay with an awning shelter, jars, crates and a flag. */
function qasirahHarbour(m: ModelBuilder, c: Ctx): void {
  const { st, hz } = c;
  const px = harbourBase(m, c, true);
  const sx = -px;
  for (const [dx, dz] of [
    [-0.45, -0.3],
    [0.45, -0.3],
    [-0.45, 0.25],
    [0.45, 0.25],
  ]) {
    m.box(0.05, 0.8, 0.05, sx + dx, 0.05, dz - 0.2, C.timberDark);
  }
  stripedAwning(m, 1.0, 0.7, sx, 0.85, -0.22, c.flag, st.trim);
  for (const [x, z] of [
    [sx - 0.2, -0.3],
    [sx + 0.05, -0.35],
    [sx + 0.25, -0.25],
  ]) {
    m.cyl(0.06, 0.1, 0.3, x, 0.05, z, C.clay, 6);
  }
  goods(m, px - 0.3, hz - 0.6);
  flag(m, c, sx + 0.3, 0.05, hz - 0.25, 1.7);
}

// ---------------------------------------------------------------------------
// Shogunara: dark wood, white plaster, wide eaves, pagodas and cherries.
// ---------------------------------------------------------------------------

/** A stone lantern with a glowing light box. */
function stoneLantern(
  m: ModelBuilder,
  x: number,
  z: number,
  stone: number,
): void {
  m.box(0.16, 0.06, 0.16, x, 0, z, stone);
  m.box(0.08, 0.25, 0.08, x, 0.06, z, stone);
  m.box(0.15, 0.12, 0.15, x, 0.31, z, 0xf0d9a0, 1);
  pyramid(m, 0.16, 0.1, x, 0.43, z, stone);
}

/** A timber frame house with plaster panels on a stone base. */
function shogunaraHouse(m: ModelBuilder, c: Ctx): void {
  const { st, variant: v } = c;
  const upper = v === 1 || v === 3;
  m.box(1.6, 0.18, 1.35, 0, 0, -0.1, st.stone);
  m.box(1.4, 0.85, 1.15, 0, 0.18, -0.1, st.wall);
  for (const x of [-0.7, 0, 0.7]) {
    for (const z of [0.475, -0.675]) {
      m.box(0.07, 0.85, 0.07, x, 0.18, z, st.wallDark);
    }
  }
  m.box(1.44, 0.07, 1.19, 0, 0.62, -0.1, st.wallDark);
  m.box(0.5, 0.55, 0.02, -0.33, 0.18, 0.485, st.wood);
  win(m, 0.35, 0.3, 0.485, 0.42, 0.26);
  tieredRoof(m, c, 1.4, 1.15, 0, 1.03, -0.1, !upper);
  if (upper) {
    m.box(0.9, 0.6, 0.75, 0, 1.1, -0.1, st.wall);
    m.box(0.94, 0.06, 0.79, 0, 1.4, -0.1, st.wallDark);
    win(m, 0, 1.2, 0.28, 0.4, 0.18);
    tieredRoof(m, c, 0.9, 0.75, 0, 1.7, -0.1);
  }
  if (v === 2) {
    m.box(1.5, 0.05, 0.35, 0, 0.13, 0.66, C.plank);
    for (const x of [-0.7, 0.7]) {
      m.box(0.06, 0.88, 0.06, x, 0.18, 0.8, st.wallDark);
    }
  }
  for (const [x, z] of [
    [-0.3, 0.72],
    [-0.15, 0.88],
  ]) {
    m.box(0.2, 0.04, 0.16, x, 0, z, st.stone, 0, 0.3);
  }
  if (v === 0) {
    stoneLantern(m, 0.75, 0.75, st.stone);
  }
}

/** A potter's or smith's workshop with a kiln. */
function shogunaraWorkshop(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(1.45, 0.12, 1.2, -0.25, 0, -0.2, st.stone);
  m.box(1.3, 0.45, 1.0, -0.25, 0.12, -0.2, st.wood);
  m.box(1.3, 0.35, 1.0, -0.25, 0.57, -0.2, st.wall);
  tieredRoof(m, c, 1.3, 1.0, -0.25, 0.92, -0.2);
  m.box(0.45, 0.22, 0.02, -0.5, 0.5, 0.31, c.flag);
  m.box(0.45, 0.5, 0.02, -0.5, 0.12, 0.305, st.inset);
  win(m, 0.1, 0.62, 0.31, 0.3, 0.2);
  m.dome(0.32, 0.6, 0, 0.55, 0x8a6a50);
  m.box(0.14, 0.12, 0.02, 0.6, 0.04, 0.87, C.ember, 1);
  for (const [x, z] of [
    [-0.75, 0.65],
    [-0.55, 0.75],
  ]) {
    m.cyl(0.07, 0.1, 0.2, x, 0, z, 0x7a5a48, 7);
  }
  stacks(m, c, "workshop");
}

/**
 * The shogun's castle: a stepped stone base, three white storeys under
 * wide eaved roofs, a walled front with a gate and tall banners.
 */
function shogunaraPalace(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(3.2, 0.5, 3.2, 0, 0, 0, st.stone);
  m.box(2.8, 0.45, 2.8, 0, 0.5, 0, st.stone);
  m.box(2.4, 0.3, 2.4, 0, 0.95, 0, 0x7a7770);
  m.box(2.0, 0.75, 1.8, 0, 1.25, 0, st.wall);
  m.box(2.04, 0.1, 1.84, 0, 1.25, 0, st.wallDark);
  for (const x of [-0.6, 0, 0.6]) {
    win(m, x, 1.55, 0.91, 0.22, 0.2);
  }
  win(m, 1.01, 1.55, 0, 0.3, 0.2, Math.PI / 2);
  win(m, -1.01, 1.55, 0, 0.3, 0.2, Math.PI / 2);
  tieredRoof(m, c, 2.0, 1.8, 0, 2.0, 0);
  m.box(1.4, 0.65, 1.25, 0, 2.1, 0, st.wall);
  win(m, 0, 2.4, 0.635, 0.4, 0.18);
  tieredRoof(m, c, 1.4, 1.25, 0, 2.75, 0);
  m.box(0.9, 0.5, 0.8, 0, 2.9, 0, st.wall);
  m.box(0.94, 0.08, 0.84, 0, 2.9, 0, st.wallDark);
  win(m, 0, 3.1, 0.41, 0.3, 0.16);
  tieredRoof(m, c, 0.9, 0.8, 0, 3.4, 0);
  for (const x of [-0.5, 0.5]) {
    m.box(0.06, 0.16, 0.12, x, 3.84, 0, C.gold);
  }
  // A low front wall with a roofed gate.
  for (const side of [1, -1]) {
    m.box(1.15, 0.5, 0.15, side * 1.25, 0, 1.75, st.wall);
    m.box(1.2, 0.06, 0.25, side * 1.25, 0.5, 1.75, st.roof);
  }
  for (const x of [-0.38, 0.38]) {
    m.box(0.1, 0.85, 0.1, x, 0, 1.75, st.wallDark);
  }
  m.box(1.0, 0.08, 0.2, 0, 0.75, 1.75, st.wallDark);
  tieredRoof(m, c, 0.7, 0.2, 0, 0.85, 1.75);
  // The kitchen hut on the lower step at the back.
  m.box(0.55, 0.45, 0.55, -1.35, 0.5, -1.35, st.wallDark);
  m.roof(0.65, 0.25, 0.65, -1.35, 0.95, -1.35, st.roof);
  stacks(m, c, "palace");
  // Tall upright banners in the faction's colour.
  flag(m, c, 1.45, 0.5, 1.4, 1.6, 0.22, 0.6);
  flag(m, c, -1.45, 0.5, 1.4, 1.6, 0.22, 0.6);
  cherry(m, 1.55, -1.55, 0.6);
}

/** A three-tiered pagoda with a spire, a gate before it and lanterns. */
function shogunaraTemple(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  const lacquer = 0xa5382c;
  m.box(1.3, 0.2, 1.3, 0, 0, -0.15, st.stone);
  for (let i = 0; i < 3; i += 1) {
    const s = 0.9 - i * 0.2;
    const y = 0.2 + i * 0.6;
    m.box(s, 0.55, s, 0, y, -0.15, i === 0 ? lacquer : st.wall);
    win(m, 0, y + 0.18, -0.15 + s / 2 + 0.01, s * 0.4, 0.2);
    tieredRoof(m, c, s, s, 0, y + 0.55, -0.15, i === 2);
  }
  m.cyl(0.03, 0.05, 0.7, 0, 2.4, -0.15, C.brass, 6);
  for (let i = 0; i < 3; i += 1) {
    m.cyl(0.08, 0.08, 0.03, 0, 2.55 + i * 0.13, -0.15, C.brass, 6);
  }
  // A gate of two posts and two beams across the path.
  for (const x of [-0.42, 0.42]) {
    m.box(0.08, 0.95, 0.08, x, 0, 0.82, lacquer);
  }
  m.box(1.1, 0.07, 0.1, 0, 0.92, 0.82, st.trim);
  m.box(0.95, 0.05, 0.07, 0, 0.75, 0.82, lacquer);
  m.box(0.3, 0.02, 0.7, 0, 0, 0.45, st.stone);
  stoneLantern(m, -0.7, 0.6, st.stone);
  stoneLantern(m, 0.7, 0.6, st.stone);
}

/** Rice paddies: shallow water plots between dikes, rows of green shoots. */
function shogunaraField(m: ModelBuilder, c: Ctx): void {
  m.box(c.w - 0.1, 0.08, c.h - 0.1, 0, 0, 0, c.st.soil);
  const pw = (c.w - 0.35) / 2;
  const pd = (c.h - 0.35) / 2;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = (sx * (pw + 0.07)) / 2;
      const z = (sz * (pd + 0.07)) / 2;
      m.box(pw, 0.04, pd, x, 0.06, z, 0x6f9e86);
      for (let row = 0; row < 4; row += 1) {
        m.box(
          pw - 0.15,
          0.12,
          0.05,
          x,
          0.06,
          z - pd / 2 + (row + 0.5) * (pd / 4),
          0x7fae4a,
        );
      }
    }
  }
  m.box(0.08, 0.6, 0.08, c.hx - 0.3, 0, c.hz - 0.3, c.st.wood);
  m.cyl(0, 0.22, 0.12, c.hx - 0.3, 0.6, c.hz - 0.3, C.thatch, 8);
}

/** Raked gravel, a pond with stones, a little bridge and a cherry tree. */
function shogunaraGarden(m: ModelBuilder, c: Ctx): void {
  m.box(1.85, 0.05, 1.85, 0, 0, 0, 0xd8d2c2);
  for (let i = 0; i < 4; i += 1) {
    m.box(0.8, 0.015, 0.03, 0.4, 0.05, -0.75 + i * 0.12, 0xc8c2b2);
  }
  m.box(0.9, 0.03, 0.7, -0.4, 0.04, 0.45, C.water);
  for (const [x, z, r] of [
    [0.45, -0.1, 0.14],
    [0.6, 0.2, 0.1],
    [-0.85, 0.05, 0.11],
  ]) {
    m.ball(r, x, 0.05, z, 0x7d7a74, 0.6);
  }
  m.box(0.2, 0.06, 0.8, -0.4, 0.1, 0.45, 0xa5382c);
  cherry(m, 0.55, 0.55, 0.65);
  stoneLantern(m, -0.7, -0.6, c.st.stone);
}

/** A white watchtower on a stone base under a wide roof, a banner beside. */
function shogunaraTower(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(1.25, 0.9, 1.25, 0, 0, 0, st.stone);
  m.box(1.05, 0.15, 1.05, 0, 0.9, 0, 0x7a7770);
  m.box(0.9, 1.1, 0.9, 0, 1.05, 0, st.wall);
  for (const [x, z] of [
    [-0.45, -0.45],
    [0.45, -0.45],
    [-0.45, 0.45],
    [0.45, 0.45],
  ]) {
    m.box(0.07, 1.1, 0.07, x, 1.05, z, st.wallDark);
  }
  m.box(0.94, 0.06, 0.94, 0, 1.55, 0, st.wallDark);
  win(m, 0, 1.7, 0.46, 0.3, 0.16);
  tieredRoof(m, c, 0.9, 0.9, 0, 2.15, 0);
  m.box(0.3, 0.5, 0.03, 0, 0, 0.64, st.wood);
  flag(m, c, 0.75, 0, 0.75, 2.3, 0.22, 0.6);
}

/** A white plastered storehouse with a dark base band and rice bales. */
function shogunaraWarehouse(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(1.6, 0.15, 1.25, 0, 0, -0.25, st.stone);
  m.box(1.5, 0.45, 1.15, 0, 0.15, -0.25, st.wallDark);
  m.box(1.5, 0.8, 1.15, 0, 0.6, -0.25, st.wall);
  tieredRoof(m, c, 1.5, 1.15, 0, 1.4, -0.25);
  m.box(0.45, 0.6, 0.04, -0.3, 0.15, 0.33, st.inset);
  win(m, 0.4, 1.0, 0.33, 0.18, 0.14);
  for (const [x, y] of [
    [0.25, 0.13],
    [0.55, 0.13],
    [0.4, 0.37],
  ]) {
    part(
      m,
      (b) => b.cyl(0.12, 0.12, 0.3, 0, -0.15, 0, 0xcdb27a, 8),
      (g) => {
        g.rotateZ(Math.PI / 2);
        g.translate(x, y, 0.65);
      },
    );
  }
}

/** Market stalls with indigo cloth roofs and paper lanterns. */
function shogunaraMarket(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  const indigo = 0x2f3d5c;
  m.box(c.w - 0.3, 0.05, c.h - 0.3, 0, 0, 0, st.stone);
  for (const [x, z] of [
    [-0.85, -0.85],
    [0.85, -0.85],
    [-0.85, 0.85],
    [0.85, 0.85],
  ]) {
    m.box(0.75, 0.4, 0.38, x, 0, z, st.wood);
    for (const dx of [-0.38, 0.38]) {
      m.box(0.05, 0.9, 0.05, x + dx, 0, z - 0.2, st.wallDark);
    }
    m.roof(0.95, 0.25, 0.7, x, 0.9, z, indigo);
    m.box(0.8, 0.18, 0.02, x, 0.72, z + 0.32, z > 0 ? c.flag : st.wall);
    m.ball(0.07, x - 0.15, 0.45, z, C.awningC, 0.7);
  }
  for (const [x, z] of [
    [0, -0.9],
    [0, 0.9],
  ]) {
    lanternPost(m, x, z, 1.0);
  }
  m.cyl(0.25, 0.28, 0.3, 0, 0, 0, st.stone, 8);
  m.cyl(0.2, 0.2, 0.02, 0, 0.29, 0, C.water, 8);
}

/** A wooden pier with a gate at its root, lanterns and a banner. */
function shogunaraHarbour(m: ModelBuilder, c: Ctx): void {
  const { st, hz } = c;
  const px = harbourBase(m, c, false);
  for (const dx of [-0.42, 0.42]) {
    m.box(0.08, 1.0, 0.08, px + dx, 0.05, hz - 0.05, 0xa5382c);
  }
  m.box(1.05, 0.07, 0.1, px, 1.0, hz - 0.05, st.trim);
  m.box(0.9, 0.05, 0.07, px, 0.82, hz - 0.05, 0xa5382c);
  lantern(m, px + 0.35, 0.05, hz + 1.05);
  lantern(m, px - 0.35, 0.05, hz + 1.05);
  for (const [x, z] of [
    [-px - 0.3, hz - 0.5],
    [-px, hz - 0.45],
  ]) {
    m.cyl(0.13, 0.13, 0.3, x, 0.05, z, 0xcdb27a, 8);
  }
  goods(m, -px + 0.3, -0.3);
  flag(m, c, -px - 0.6, 0.05, hz - 0.3, 1.8, 0.22, 0.6);
}

// ---------------------------------------------------------------------------
// Valdoria: light stone, red tiles, loggias, bell towers and cypresses.
// ---------------------------------------------------------------------------

/** Green shutters either side of a window. */
function shutters(m: ModelBuilder, x: number, y: number, z: number): void {
  for (const dx of [-0.15, 0.15]) {
    m.box(0.08, 0.32, 0.02, x + dx, y, z + 0.005, 0x4d6b4a);
  }
}

/** A two or three storey town house with red tiles and green shutters. */
function valdoriaHouse(m: ModelBuilder, c: Ctx): void {
  const { st, variant: v } = c;
  const floors = v === 1 ? 3 : 2;
  const ht = floors * 0.72;
  const wall = [st.wall, st.wall, st.wallDark, 0xe9cfae][v];
  m.box(1.5, ht, 1.2, 0, 0, -0.15, wall);
  m.box(1.54, 0.14, 1.24, 0, 0, -0.15, st.stone);
  m.box(1.56, 0.08, 1.26, 0, ht - 0.08, -0.15, st.trim);
  tileRoof(m, c, 1.5, 1.2, 0, ht, -0.15);
  for (let f = 0; f < floors; f += 1) {
    for (const x of [-0.4, 0.4]) {
      if (f > 0 || x > 0) {
        win(m, x, 0.22 + f * 0.72, 0.455, 0.18, 0.32);
        shutters(m, x, 0.22 + f * 0.72, 0.455);
      }
    }
  }
  m.box(0.3, 0.55, 0.03, -0.4, 0, 0.46, C.door);
  m.box(0.38, 0.06, 0.04, -0.4, 0.55, 0.465, st.stone);
  if (v === 3) {
    m.box(0.6, 0.05, 0.25, 0.4, 0.72, 0.57, st.stone);
    m.box(0.6, 0.2, 0.03, 0.4, 0.77, 0.69, C.cannon);
  }
  if (v === 2) {
    for (const x of [-0.7, 0.7]) {
      m.box(0.06, 0.85, 0.06, x, 0, 0.85, C.timber);
    }
    m.box(1.5, 0.1, 0.4, 0, 0.85, 0.7, C.greenDark);
  }
  if (v === 0) {
    cypress(m, 0.85, 0.7, 0.55);
  }
}

/** A stone workshop with a wide arched door, barrels and a chimney. */
function valdoriaWorkshop(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(1.5, 1.1, 1.2, -0.2, 0, -0.25, st.wallDark);
  tileRoof(m, c, 1.5, 1.2, -0.2, 1.1, -0.25);
  archInset(m, -0.5, 0, 0.36, 0.45, 0.4, st.inset);
  win(m, 0.2, 0.5, 0.36, 0.2, 0.28);
  shutters(m, 0.2, 0.5, 0.36);
  for (const [x, z] of [
    [0.55, 0.65],
    [0.8, 0.6],
  ]) {
    barrel(m, x, 0, z);
  }
  m.box(0.35, 0.3, 0.3, -0.75, 0, 0.65, C.plank);
  stacks(m, c, "workshop");
}

/**
 * The palazzo of the republic: two floors over an open loggia of columns,
 * a red roof, a slender bell tower with a flag and a fountain court.
 */
function valdoriaPalace(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(3.8, 0.06, 3.8, 0, 0, 0, st.stone);
  m.box(3.0, 1.9, 1.7, 0, 0, -0.5, st.wall);
  m.box(3.04, 0.08, 1.74, 0, 0.95, -0.5, st.trim);
  m.box(3.06, 0.1, 1.76, 0, 1.82, -0.5, st.trim);
  m.roof(3.15, 0.5, 1.85, 0, 1.9, -0.5, st.roof);
  for (const x of [-1.2, -0.6, 0, 0.6, 1.2]) {
    win(m, x, 1.25, 0.36, 0.2, 0.4);
    archInset(m, x, 0.06, 0.36, 0.3, 0.4, st.inset);
  }
  // The loggia: columns, a beam and a balcony rail above.
  for (const x of [-1.35, -0.9, -0.45, 0, 0.45, 0.9, 1.35]) {
    m.cyl(0.06, 0.07, 0.86, x, 0.06, 0.62, st.trim, 6);
  }
  m.box(3.0, 0.1, 0.55, 0, 0.92, 0.62, st.trim);
  m.box(3.0, 0.16, 0.04, 0, 1.02, 0.87, st.stone);
  // The bell tower with an open belfry and a pyramid cap.
  const tx = 1.45;
  const tz = -1.4;
  m.box(0.65, 3.0, 0.65, tx, 0, tz, st.wallDark);
  m.box(0.7, 0.08, 0.7, tx, 2.2, tz, st.trim);
  for (const [dx, dz, turn] of [
    [0, 0.33, 0],
    [0, -0.33, 0],
    [0.33, 0, Math.PI / 2],
    [-0.33, 0, Math.PI / 2],
  ]) {
    m.box(0.26, 0.42, 0.02, tx + dx, 2.4, tz + dz, st.inset, 0, turn);
  }
  m.box(0.72, 0.1, 0.72, tx, 3.0, tz, st.trim);
  pyramid(m, 0.52, 0.55, tx, 3.1, tz, st.roof);
  flag(m, c, tx, 3.65, tz, 0.8);
  // A fountain court before the loggia with two cypresses and a flag.
  fountain(m, 0, 1.45, 0.4, st.stone);
  cypress(m, -1.6, 1.5, 0.85);
  cypress(m, 1.6, 1.5, 0.85);
  flag(m, c, -1.6, 1.9, -1.1, 1.0);
  stacks(m, c, "palace");
}

/** A large square with stalls in many colours and a two-tier fountain. */
function valdoriaMarket(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(2.85, 0.06, 2.85, 0, 0, 0, st.stone);
  for (const [x, z] of [
    [-0.48, -0.48],
    [0.48, 0.48],
  ]) {
    m.box(0.9, 0.015, 0.9, x, 0.06, z, 0xbdb39e);
  }
  stall(m, -0.9, -0.95, c.flag, st.trim, st.wood);
  stall(m, 0.9, -0.95, C.awningB, st.trim, st.wood);
  stall(m, -0.95, 0.9, C.awningA, st.trim, st.wood);
  stall(m, 0.95, 0.9, C.awningC, c.accent, st.wood);
  fountain(m, 0, 0, 0.42, st.stone);
  m.cyl(0.12, 0.08, 0.06, 0, 0.82, 0, st.stone, 8);
  goods(m, -0.3, 0.75);
}

/** A counting house: a long hall with an arcade, bales and barrels. */
function valdoriaWarehouse(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(1.8, 1.4, 1.2, 0, 0, -0.3, st.wall);
  m.box(1.84, 0.08, 1.24, 0, 0.7, -0.3, st.trim);
  tileRoof(m, c, 1.8, 1.2, 0, 1.4, -0.3);
  for (const x of [-0.55, 0, 0.55]) {
    archInset(m, x, 0, 0.31, 0.36, 0.35, st.inset);
    win(m, x, 0.92, 0.31, 0.18, 0.28);
    shutters(m, x, 0.92, 0.31);
  }
  for (const x of [-0.6, -0.25]) {
    m.box(0.3, 0.24, 0.24, x, 0, 0.65, 0xd9cfae);
  }
  barrel(m, 0.4, 0, 0.6);
  barrel(m, 0.68, 0, 0.7);
}

/** Olive trees on one side and vine rows on the other. */
function valdoriaField(m: ModelBuilder, c: Ctx): void {
  m.box(c.w - 0.15, 0.06, c.h - 0.15, 0, 0, 0, c.st.soil);
  for (const x of [-1.05, -0.35]) {
    for (const z of [-0.95, 0, 0.95]) {
      olive(m, x, z + (c.variant % 2) * 0.1, 0.85);
    }
  }
  for (let row = 0; row < 4; row += 1) {
    const z = -1.05 + row * 0.7;
    m.box(1.3, 0.38, 0.12, 0.65, 0.05, z, C.greenDark);
    m.box(1.3, 0.06, 0.14, 0.65, 0.4, z, 0x6d2f5c);
    m.box(0.05, 0.5, 0.05, 1.3, 0, z, C.timberDark);
  }
}

/** A formal garden: hedges, cypresses and a fountain. */
function valdoriaGarden(m: ModelBuilder, c: Ctx): void {
  m.box(1.85, 0.05, 1.85, 0, 0, 0, C.path);
  for (const [x, z] of [
    [-0.5, -0.5],
    [0.5, -0.5],
    [-0.5, 0.5],
    [0.5, 0.5],
  ]) {
    m.box(0.6, 0.06, 0.6, x, 0.05, z, C.green);
    m.box(0.6, 0.18, 0.08, x, 0.05, z + (z > 0 ? 0.26 : -0.26), C.greenDark);
  }
  fountain(m, 0, 0, 0.28, c.st.stone);
  cypress(m, -0.8, -0.8, 0.6);
  cypress(m, 0.8, 0.8, 0.6);
}

/** A round stone tower with merlons and a flag. */
function valdoriaTower(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.cyl(0.55, 0.62, 0.3, 0, 0, 0, st.wallDark, 10);
  m.cyl(0.5, 0.55, 2.2, 0, 0.3, 0, st.wall, 10);
  m.cyl(0.6, 0.6, 0.12, 0, 2.5, 0, st.trim, 10);
  const merlons = 8;
  for (let k = 0; k < merlons; k += 1) {
    const a = (k * Math.PI * 2) / merlons;
    m.box(
      0.16,
      0.22,
      0.12,
      Math.sin(a) * 0.52,
      2.62,
      Math.cos(a) * 0.52,
      st.wall,
      0,
      a,
    );
  }
  m.box(0.26, 0.5, 0.03, 0, 0, 0.55, C.door);
  win(m, 0, 1.2, 0.54, 0.08, 0.28);
  win(m, 0, 1.95, 0.53, 0.08, 0.28);
  flag(m, c, 0, 2.62, 0, 1.1);
}

/** A big stone harbour with a wooden crane, bollards, bales and a flag. */
function valdoriaHarbour(m: ModelBuilder, c: Ctx): void {
  const { hz } = c;
  const px = harbourBase(m, c, true);
  const cx = -px * 0.6;
  m.box(0.4, 0.15, 0.4, cx, 0.05, hz - 0.35, C.stoneDark);
  m.box(0.14, 1.9, 0.14, cx, 0.2, hz - 0.35, C.timber);
  part(
    m,
    (b) => b.box(0.08, 1.3, 0.08, 0, 0, 0, C.timber),
    (g) => {
      g.rotateX(1.05);
      g.translate(cx, 1.6, hz - 0.35);
    },
  );
  m.box(0.015, 1.1, 0.015, cx, 1.15, hz + 0.75, C.cannon);
  m.box(0.25, 0.22, 0.25, cx, 0.95, hz + 0.75, C.plank);
  for (const x of [-px - 0.4, -px + 0.05]) {
    m.box(0.3, 0.25, 0.25, x, 0.05, -0.35, 0xd9cfae);
  }
  goods(m, px - 0.45, hz - 0.65);
  flag(m, c, -px + 0.55, 0.05, -0.4, 1.9);
}

// ---------------------------------------------------------------------------
// Skeld: long houses of timber under turf, a great hall, spruces.
// ---------------------------------------------------------------------------

/**
 * A long low hall with a stone footing and a steep roof with crossed
 * gable boards; its ridge stands at `ht - 0.05 + 0.85 * dep + 0.05`.
 */
function longhouse(
  m: ModelBuilder,
  c: Ctx,
  len: number,
  dep: number,
  ht: number,
  x: number,
  z: number,
  wall: number,
  roof: number,
): void {
  m.box(len + 0.06, 0.12, dep + 0.06, x, 0, z, c.st.stone);
  m.box(len, ht, dep, x, 0, z, wall);
  turfRoof(m, c, len, dep, x, ht - 0.05, z, roof);
}

/** A long house of timber, or of stone under a slate roof. */
function skeldHouse(m: ModelBuilder, c: Ctx): void {
  const { st, variant: v } = c;
  const stoneHouse = v === 2;
  longhouse(
    m,
    c,
    1.7,
    0.95,
    0.6,
    0,
    -0.1,
    stoneHouse ? st.stone : st.wall,
    stoneHouse ? 0x4a4644 : st.roof,
  );
  m.box(0.26, 0.45, 0.03, -0.3, 0, 0.39, C.door);
  m.box(0.34, 0.06, 0.04, -0.3, 0.45, 0.395, st.trim);
  win(m, 0.4, 0.28, 0.39, 0.14, 0.14);
  stacks(m, c, "house");
  if (v === 1) {
    for (const x of [-0.75, 0.15]) {
      m.box(0.06, 0.5, 0.06, x, 0, 0.75, st.trim);
    }
    m.box(1.0, 0.05, 0.4, -0.3, 0.5, 0.62, st.roof);
  }
  if (v === 3 || v === 0) {
    for (let i = 0; i < 3; i += 1) {
      m.cyl(
        0.06,
        0.06,
        0.5,
        0.5 + (i % 2) * 0.06,
        0.06 + i * 0.1,
        0.72,
        C.timber,
        5,
      );
    }
  }
}

/** A smithy: a small long house, a forge under a lean-to and an anvil. */
function skeldWorkshop(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  longhouse(m, c, 1.4, 0.9, 0.6, -0.25, -0.35, st.wall, st.roof);
  m.box(0.26, 0.45, 0.03, -0.55, 0, 0.11, C.door);
  for (const x of [0.15, 0.8]) {
    m.box(0.06, 0.6, 0.06, x, 0, 0.75, st.trim);
  }
  part(
    m,
    (b) => b.box(0.8, 0.05, 0.75, 0, 0, 0, st.roof),
    (g) => {
      g.rotateX(0.25);
      g.translate(0.48, 0.62, 0.45);
    },
  );
  m.box(0.4, 0.35, 0.35, 0.6, 0, 0.45, st.stone);
  m.box(0.26, 0.04, 0.22, 0.6, 0.35, 0.45, C.ember, 1);
  m.box(0.22, 0.2, 0.1, 0.25, 0, 0.6, C.metal);
  m.box(0.3, 0.06, 0.12, 0.25, 0.2, 0.6, C.metal);
  stacks(m, c, "workshop");
}

/**
 * The great hall of the jarl: a long hall on a stone footing under a huge
 * turf roof, a porch, shields on the wall, a store house and flags.
 */
function skeldPalace(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(3.3, 0.15, 1.7, 0, 0, -0.3, st.stone);
  m.box(3.2, 1.0, 1.6, 0, 0.12, -0.3, st.wall);
  for (const [x, z] of [
    [-1.6, 0.5],
    [1.6, 0.5],
    [-1.6, -1.1],
    [1.6, -1.1],
  ]) {
    m.box(0.12, 1.05, 0.12, x, 0.12, z, st.trim);
  }
  turfRoof(m, c, 3.3, 1.6, 0, 1.05, -0.3);
  // The porch before the door.
  m.box(0.9, 0.06, 0.55, 0, 0.12, 0.78, C.plank);
  for (const x of [-0.4, 0.4]) {
    m.box(0.08, 0.85, 0.08, x, 0.12, 0.98, st.trim);
  }
  m.roof(0.7, 0.45, 1.05, 0, 0.95, 0.75, st.roof, Math.PI / 2);
  m.box(0.45, 0.7, 0.03, 0, 0.12, 0.51, C.door);
  // Round shields on the long wall.
  [-1.3, -0.85, 0.85, 1.3].forEach((x, i) => {
    part(
      m,
      (b) =>
        b.cyl(
          0.16,
          0.16,
          0.03,
          0,
          0,
          0,
          [c.flag, c.accent, 0x9a6a3a, c.flag][i],
          8,
        ),
      (g) => {
        g.rotateX(Math.PI / 2);
        g.translate(x, 0.65, 0.52);
      },
    );
  });
  for (const x of [-0.55, 0.55]) {
    win(m, x, 0.75, 0.51, 0.14, 0.16);
  }
  // A store house beside the hall.
  longhouse(m, c, 1.0, 0.7, 0.5, -1.3, 1.35, st.wallDark, st.roof);
  m.box(0.2, 0.36, 0.03, -1.3, 0, 1.71, C.door);
  for (const x of [0.4, 1.0, 1.6]) {
    m.box(0.06, 0.45, 0.06, x, 0, 1.85, st.trim);
  }
  m.box(1.3, 0.05, 0.04, 1.0, 0.35, 1.85, st.trim);
  flag(m, c, 0.7, 0, 1.3, 2.0);
  flag(m, c, 1.6, 0, 1.3, 2.0);
  stacks(m, c, "palace");
  spruce(m, 1.6, -1.75, 0.6);
}

/** A timber watch tower on a stone base with a steep roof and a flag. */
function skeldTower(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(1.15, 0.9, 1.15, 0, 0, 0, st.stone);
  m.box(0.95, 1.0, 0.95, 0, 0.9, 0, st.wall);
  for (const [x, z] of [
    [-0.48, -0.48],
    [0.48, -0.48],
    [-0.48, 0.48],
    [0.48, 0.48],
  ]) {
    m.box(0.1, 1.3, 0.1, x, 0.9, z, st.trim);
  }
  m.box(1.25, 0.08, 1.25, 0, 1.9, 0, C.plank);
  for (const side of [1, -1]) {
    m.box(1.25, 0.2, 0.04, 0, 1.98, side * 0.6, st.wallDark);
    m.box(0.04, 0.2, 1.25, side * 0.6, 1.98, 0, st.wallDark);
  }
  pyramid(m, 0.85, 0.75, 0, 2.2, 0, st.roof);
  m.box(0.26, 0.5, 0.03, 0, 0, 0.59, C.door);
  win(m, 0, 1.3, 0.485, 0.1, 0.2);
  flag(m, c, 0.55, 2.0, 0.55, 1.2);
}

/** A slip with a long ship's hull taking shape and a shed. */
function skeldShipyard(m: ModelBuilder, c: Ctx): void {
  const { st, hz } = c;
  m.box(c.w - 0.2, 0.08, 1.1, 0, 0, hz - 0.6, C.plank);
  hullFrame(
    m,
    0.1,
    hz - 0.6,
    2.3,
    0.75,
    0.25 + c.variant * 0.2,
    0x6a4a30,
    true,
  );
  longhouse(m, c, 1.2, 0.6, 0.5, -0.75, -hz + 0.4, st.wall, st.roof);
  for (let i = 0; i < 3; i += 1) {
    m.box(
      0.9,
      0.08,
      0.14,
      0.85,
      i * 0.08,
      -hz + 0.35 + (i % 2) * 0.05,
      C.timber,
    );
  }
}

/** A small barley field inside a dry stone wall, with a hay rack. */
function skeldField(m: ModelBuilder, c: Ctx): void {
  const { st, hx, hz } = c;
  m.box(c.w - 0.3, 0.06, c.h - 0.3, 0, 0, 0, st.soil);
  for (const side of [1, -1]) {
    m.box(c.w - 0.2, 0.22, 0.14, 0, 0, side * (hz - 0.12), st.stone);
    m.box(0.14, 0.22, c.h - 0.2, side * (hx - 0.12), 0, 0, st.stone);
  }
  for (let row = 0; row < 5; row += 1) {
    m.box(
      c.w - 0.8,
      0.2,
      0.14,
      -0.15,
      0.05,
      -hz + 0.5 + row * ((c.h - 1) / 4),
      0xc9b06a,
    );
  }
  for (const z of [-0.5, 0.5]) {
    m.box(0.05, 0.7, 0.05, hx - 0.4, 0, z, st.trim);
  }
  m.box(0.08, 0.35, 1.0, hx - 0.4, 0.3, 0, 0xc9b06a);
}

/** A store house on posts and a rack of drying fish. */
function skeldWarehouse(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  for (const [x, z] of [
    [-0.6, -0.65],
    [0.6, -0.65],
    [-0.6, 0.15],
    [0.6, 0.15],
  ]) {
    m.box(0.12, 0.4, 0.12, x, 0, z, st.trim);
  }
  m.box(1.4, 0.75, 0.95, 0, 0.4, -0.25, st.wall);
  turfRoof(m, c, 1.4, 0.95, 0, 1.12, -0.25);
  m.box(0.3, 0.45, 0.03, 0, 0.45, 0.235, C.door);
  m.box(0.3, 0.05, 0.4, 0, 0.3, 0.45, C.plank);
  skeldFishRack(m, c, 0.2, 0.75);
  barrel(m, -0.7, 0, 0.6);
}

/** A rack of fish drying in the wind. */
function skeldFishRack(m: ModelBuilder, c: Ctx, x: number, z: number): void {
  for (const dx of [-0.35, 0.35]) {
    m.box(0.05, 0.7, 0.05, x + dx, 0, z, c.st.trim);
  }
  m.box(0.8, 0.04, 0.04, x, 0.66, z, c.st.trim);
  for (let i = 0; i < 5; i += 1) {
    m.box(0.05, 0.22, 0.03, x - 0.24 + i * 0.12, 0.42, z, 0x9aa3a8);
  }
}

/** A wooden pier with a fish rack, crates and a flag. */
function skeldHarbour(m: ModelBuilder, c: Ctx): void {
  const { hz } = c;
  const px = harbourBase(m, c, false);
  skeldFishRack(m, c, -px, -0.2);
  goods(m, -px - 0.5, hz - 0.65);
  flag(m, c, px - 0.55, 0.05, hz - 0.25, 1.9);
}

// ---------------------------------------------------------------------------
// The pirates (Crows and Blackreef): dark weathered wood, black stone.
// ---------------------------------------------------------------------------

/** A ramshackle hut of mismatched planks under planks or old sailcloth. */
function pirateHouse(m: ModelBuilder, c: Ctx): void {
  const { st, variant: v } = c;
  m.box(
    1.2,
    0.85,
    1.0,
    -0.1,
    0,
    -0.1,
    v % 2 === 0 ? st.wall : st.wallDark,
    0,
    0.05,
  );
  m.box(0.4, 0.5, 0.02, 0.25, 0.15, 0.41, st.wood, 0, 0.05);
  m.box(0.24, 0.5, 0.03, -0.4, 0, 0.42, C.door, 0, 0.05);
  win(m, 0.2, 0.45, 0.425, 0.16, 0.16, 0.05);
  if (v < 2) {
    shackRoof(m, c, 1.2, 1.0, -0.1, 0.85, -0.1);
  } else {
    m.roof(1.35, 0.4, 1.2, -0.1, 0.85, -0.1, 0x6e665a, 0.05);
    m.box(0.04, 0.3, 0.04, 0.55, 1.0, -0.1, st.wood);
  }
  if (v === 3) {
    for (const x of [-0.6, 0.4]) {
      m.box(0.05, 0.6, 0.05, x, 0, 0.75, st.wood);
    }
    m.box(1.1, 0.04, 0.4, -0.1, 0.6, 0.6, C.sailPirate);
  }
  barrel(m, 0.7, 0, 0.6, st.wood);
  m.box(0.3, 0.3, 0.3, -0.75, 0, 0.7, C.plank, 0, 0.3);
}

/** A crooked two storey tavern with a lantern, a sign and barrels. */
function pirateTavern(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(1.5, 0.9, 1.2, 0, 0, -0.1, st.wallDark);
  m.box(1.6, 0.7, 1.3, 0.05, 0.9, -0.1, st.wall, 0, 0.04);
  shackRoof(m, c, 1.6, 1.3, 0.05, 1.6, -0.1);
  stacks(m, c, "tavern");
  m.box(0.34, 0.6, 0.03, -0.3, 0, 0.51, C.door);
  win(m, 0.35, 0.4, 0.51, 0.2, 0.2);
  for (const x of [-0.45, 0.45]) {
    win(m, x, 1.15, 0.56, 0.2, 0.2);
  }
  m.box(0.04, 0.04, 0.3, 0.1, 0.75, 0.62, C.metal);
  lantern(m, 0.1, 0.6, 0.75);
  m.box(0.5, 0.26, 0.03, 0.0, 0.62, 0.53, c.flag);
  skullMark(m, 0.0, 0.75, 0.53, 0.65);
  barrel(m, 0.6, 0, 0.7, st.wood);
  barrel(m, 0.82, 0, 0.55, st.wood);
  barrel(m, 0.7, 0.3, 0.62, st.wood);
  m.box(0.6, 0.06, 0.18, -0.55, 0.25, 0.75, st.wood);
}

/** A black market of dark tents, crates, chests and lanterns. */
function pirateMarket(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  for (const [x, z, turn] of [
    [-0.85, -0.8, 0],
    [0.85, -0.85, 0.15],
    [-0.75, 0.85, -0.1],
  ]) {
    for (const [dx, dz] of [
      [-0.4, -0.35],
      [0.4, -0.35],
      [-0.4, 0.35],
      [0.4, 0.35],
    ]) {
      m.box(0.04, 0.75, 0.04, x + dx, 0, z + dz, st.wood);
    }
    m.roof(0.95, 0.45, 0.85, x, 0.72, z, c.flag, turn);
    m.box(0.7, 0.35, 0.35, x, 0, z, st.wood);
    m.box(0.22, 0.14, 0.16, x - 0.15, 0.35, z, 0x5a3a22);
    m.box(0.2, 0.03, 0.17, x - 0.15, 0.49, z, C.gold);
  }
  for (const [x, z] of [
    [0.6, 0.6],
    [0.15, 0.2],
  ]) {
    goods(m, x, z);
  }
  lanternPost(m, 0, -0.2, 1.2);
  lanternPost(m, 1.2, 1.1, 1.0);
}

/** An open shed of dark wood full of barrels and crates. */
function pirateWarehouse(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.box(1.7, 1.0, 0.1, 0, 0, -0.75, st.wallDark);
  for (const side of [1, -1]) {
    m.box(0.1, 1.0, 1.0, side * 0.8, 0, -0.3, st.wall, 0, side * 0.03);
  }
  for (const x of [-0.8, 0.8]) {
    m.box(0.08, 1.0, 0.08, x, 0, 0.2, st.wood);
  }
  shackRoof(m, c, 1.7, 1.05, 0, 1.0, -0.28);
  for (let i = 0; i < 5; i += 1) {
    barrel(m, -0.55 + i * 0.27, 0, -0.5, st.wood);
  }
  barrel(m, -0.42, 0.3, -0.5, st.wood);
  barrel(m, 0.1, 0.3, -0.5, st.wood);
  goods(m, -0.4, 0.05);
  goods(m, 0.3, 0.55);
}

/** A slip with a half-built hull, scaffolding, timber and a lantern. */
function pirateShipyard(m: ModelBuilder, c: Ctx): void {
  const { st, hz } = c;
  m.box(c.w - 0.2, 0.08, 1.1, 0, 0, hz - 0.6, st.wood);
  hullFrame(m, 0, hz - 0.6, 2.3, 0.85, 0.45, C.hullPirate, false);
  for (const x of [-0.9, 0, 0.9]) {
    m.box(0.06, 1.1, 0.06, x, 0, hz - 0.05, st.wood);
  }
  m.box(2.0, 0.05, 0.2, 0, 0.75, hz - 0.05, C.plank);
  m.box(1.0, 0.65, 0.6, -0.8, 0, -hz + 0.4, st.wall);
  shackRoof(m, c, 1.0, 0.6, -0.8, 0.65, -hz + 0.4);
  for (let i = 0; i < 3; i += 1) {
    m.box(
      0.9,
      0.08,
      0.14,
      0.8,
      i * 0.08,
      -hz + 0.35 + (i % 2) * 0.05,
      C.timber,
    );
  }
  lanternPost(m, 1.3, -0.1, 1.0);
}

/** A forge hut with a glowing hearth and an iron stove pipe. */
function pirateWorkshop(m: ModelBuilder, c: Ctx): void {
  pirateHouse(m, { ...c, variant: 0 });
  m.box(0.4, 0.3, 0.3, 0.55, 0, -0.05, c.st.stone);
  m.box(0.2, 0.12, 0.02, 0.55, 0.08, 0.11, C.ember, 1);
  m.box(0.22, 0.2, 0.12, 0.1, 0, 0.75, C.metal);
  stacks(m, c, "workshop");
}

/** Pirates' crops: a patchy plot with a few plants and stick fences. */
function pirateField(m: ModelBuilder, c: Ctx): void {
  m.box(c.w - 0.4, 0.05, c.h - 0.4, 0, 0, 0, c.st.soil);
  for (let i = 0; i < 9; i += 1) {
    m.ball(
      0.14,
      -1 + (i % 3) * 1.0,
      0.1,
      -1 + Math.floor(i / 3) * 1.0,
      C.herb,
      0.7,
    );
  }
  for (const side of [1, -1]) {
    m.box(c.w - 0.4, 0.04, 0.04, 0, 0.3, side * (c.hz - 0.2), c.st.wood);
  }
  deadTree(m, c.hx - 0.4, c.hz - 0.4, 0.6);
}

/**
 * The pirates' fortress: thick black walls with merlons, four round
 * towers, a keep with a kitchen chimney, a gate, cannons and black flags.
 */
function pirateFortress(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  const dark = 0x2a2927;
  const wt = 0.35;
  m.box(3.4, 1.2, wt, 0, 0, -1.55, st.stone);
  for (const side of [1, -1]) {
    m.box(wt, 1.2, 3.4, side * 1.55, 0, 0, st.stone);
    m.box(1.2, 1.2, wt, side * 1.05, 0, 1.55, st.stone);
  }
  m.box(0.9, 0.35, wt, 0, 0.85, 1.55, st.stone);
  m.box(0.85, 0.85, 0.05, 0, 0, 1.4, st.wood);
  for (const t of [-0.9, 0, 0.9]) {
    m.box(0.22, 0.22, 0.38, t, 1.2, -1.55, st.stone);
    m.box(0.38, 0.22, 0.22, 1.55, 1.2, t, st.stone);
    m.box(0.38, 0.22, 0.22, -1.55, 1.2, t, st.stone);
  }
  for (const x of [-1.0, 1.0]) {
    m.box(0.22, 0.22, 0.38, x, 1.2, 1.55, st.stone);
  }
  for (const [x, z] of [
    [-1.55, -1.55],
    [1.55, -1.55],
    [-1.55, 1.55],
    [1.55, 1.55],
  ]) {
    m.cyl(0.48, 0.55, 1.9, x, 0, z, st.stone, 8);
    m.cyl(0.56, 0.56, 0.16, x, 1.9, z, dark, 8);
  }
  // The keep.
  m.box(1.5, 2.3, 1.4, 0, 0, -0.35, dark);
  for (const [x, z] of [
    [-0.66, -0.97],
    [0.66, -0.97],
    [-0.66, 0.27],
    [0.66, 0.27],
  ]) {
    m.box(0.2, 0.22, 0.2, x, 2.3, z, dark);
  }
  for (const x of [-0.4, 0.4]) {
    win(m, x, 1.4, 0.36, 0.12, 0.22);
  }
  win(m, 0, 0.6, 0.36, 0.3, 0.3);
  stacks(m, c, "palace");
  // Torches by the gate and cannons on the front wall.
  for (const x of [-0.6, 0.6]) {
    m.box(0.08, 0.14, 0.08, x, 0.75, 1.76, C.ember, 1);
  }
  cannon(m, -1.0, 1.36, 1.45, 0, 0.55);
  cannon(m, 1.0, 1.36, 1.45, 0, 0.55);
  flag(m, c, 0.3, 2.3, -0.6, 1.2);
  flag(m, c, -1.55, 2.06, 1.55, 0.9);
  flag(m, c, 1.55, 2.06, 1.55, 0.9);
  barrel(m, 0.95, 0, 0.7, st.wood);
  barrel(m, 1.1, 0, 0.45, st.wood);
}

/** A round tower of black stone with three cannons and a flag. */
function pirateTower(m: ModelBuilder, c: Ctx): void {
  const { st } = c;
  m.cyl(0.6, 0.7, 1.4, 0, 0, 0, st.stone, 10);
  m.cyl(0.74, 0.74, 0.12, 0, 1.4, 0, 0x2a2927, 10);
  const merlons = 6;
  for (let k = 0; k < merlons; k += 1) {
    const a = (k * Math.PI * 2) / merlons + Math.PI / merlons;
    m.box(
      0.22,
      0.22,
      0.14,
      Math.sin(a) * 0.64,
      1.52,
      Math.cos(a) * 0.64,
      st.stone,
      0,
      a,
    );
  }
  for (const a of [0, 2.1, -2.1]) {
    cannon(m, Math.sin(a) * 0.3, 1.66, Math.cos(a) * 0.3, a, 0.6);
  }
  m.box(0.3, 0.5, 0.03, 0, 0, 0.66, st.wood);
  win(m, 0, 0.85, 0.63, 0.08, 0.2);
  barrel(m, -0.2, 1.52, -0.25, st.wood);
  flag(m, c, -0.3, 1.52, 0.1, 1.2);
}

/** A rickety pier with crooked posts, barrels, a lantern and a flag. */
function pirateHarbour(m: ModelBuilder, c: Ctx): void {
  const { st, hz } = c;
  const px = harbourBase(m, c, false);
  m.box(0.3, 0.03, 0.2, px + 0.15, 0.06, hz + 0.4, st.wood, 0, 0.2);
  lanternPost(m, px + 0.35, hz + 0.9, 0.9);
  for (const [x, z] of [
    [-px - 0.3, hz - 0.5],
    [-px, hz - 0.55],
    [-px - 0.15, hz - 0.3],
  ]) {
    barrel(m, x, 0.05, z, st.wood);
  }
  goods(m, -px + 0.2, -0.4);
  flag(m, c, -px - 0.6, 0.05, -0.2, 1.8);
}

/** The pirates' places. */
const PIRATE_DRAW: Partial<Record<SiteKind, Draw>> = {
  palace: pirateFortress,
  harbour: pirateHarbour,
  house: pirateHouse,
  workshop: pirateWorkshop,
  field: pirateField,
  tower: pirateTower,
  market: pirateMarket,
  warehouse: pirateWarehouse,
  shipyard: pirateShipyard,
  tavern: pirateTavern,
};

/** Each culture's own drawings; anything missing falls back to GENERIC. */
const DRAW: Readonly<Record<CultureId, Partial<Record<SiteKind, Draw>>>> = {
  qasirah: {
    palace: qasirahPalace,
    harbour: qasirahHarbour,
    house: qasirahHouse,
    workshop: qasirahWorkshop,
    field: qasirahField,
    tower: qasirahTower,
    market: qasirahMarket,
    warehouse: qasirahWarehouse,
    garden: qasirahGarden,
  },
  shogunara: {
    palace: shogunaraPalace,
    harbour: shogunaraHarbour,
    house: shogunaraHouse,
    workshop: shogunaraWorkshop,
    field: shogunaraField,
    tower: shogunaraTower,
    market: shogunaraMarket,
    temple: shogunaraTemple,
    warehouse: shogunaraWarehouse,
    garden: shogunaraGarden,
  },
  valdoria: {
    palace: valdoriaPalace,
    harbour: valdoriaHarbour,
    house: valdoriaHouse,
    workshop: valdoriaWorkshop,
    field: valdoriaField,
    tower: valdoriaTower,
    market: valdoriaMarket,
    warehouse: valdoriaWarehouse,
    garden: valdoriaGarden,
  },
  skeld: {
    palace: skeldPalace,
    harbour: skeldHarbour,
    house: skeldHouse,
    workshop: skeldWorkshop,
    field: skeldField,
    tower: skeldTower,
    warehouse: skeldWarehouse,
    shipyard: skeldShipyard,
  },
  crows: PIRATE_DRAW,
  blackreef: PIRATE_DRAW,
};
/* eslint-enable @typescript-eslint/no-magic-numbers */
