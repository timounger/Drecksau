/**
 * How a faction's settlement is laid out on its island: harbour, palace or
 * fortress, houses, workshops, fields, towers, trees - fixed for the world,
 * so the view draws the same town every time and the towers always stand
 * where their guns fire from.
 *
 * @module
 * @remarks
 * A pure function of the world, kept per world and never saved. Every
 * place is a footprint of whole tiles on the island's land, none on top of
 * another.
 */
import { CULTURE } from "./factions-data";
import { hash2 } from "./random";
import { areaSlope, DIRS8, isSea } from "./terrain";
import { Terrain, type CultureId, type FactionHome, type World } from "./types";

/** The kinds of place in a faction's town. */
export type SiteKind =
  | "palace"
  | "harbour"
  | "house"
  | "workshop"
  | "field"
  | "tower"
  | "market"
  | "temple"
  | "warehouse"
  | "garden"
  | "shipyard"
  | "tavern"
  | "fire"
  | "wreck"
  | "tree";

/** One place of a faction's town. */
export type FactionSite = {
  readonly kind: SiteKind;
  /** Top-left tile of the footprint. */
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** Quarter turns, 0 to 3. */
  readonly rot: number;
  /** A small number that varies the model (0 to 3). */
  readonly variant: number;
};

/** What a town holds, in the order it is laid out. */
type Plan = readonly (readonly [SiteKind, number])[];

/** Coastal places of one kind spread over this many parts of the coast. */
const COAST_SPREAD = 3;

/** Quarter turns in a whole turn. */
const QUARTERS = 4;

/* eslint-disable @typescript-eslint/no-magic-numbers -- town plans: footprints and counts */

/** The footprint of each kind of place, in tiles. */
const SIZE: Readonly<Record<SiteKind, readonly [number, number]>> = {
  palace: [4, 4],
  harbour: [3, 2],
  house: [2, 2],
  workshop: [2, 2],
  field: [3, 3],
  tower: [2, 2],
  market: [3, 3],
  temple: [2, 2],
  warehouse: [2, 2],
  garden: [2, 2],
  shipyard: [3, 2],
  tavern: [2, 2],
  fire: [1, 1],
  wreck: [2, 1],
  tree: [1, 1],
};

/** The towns of the cultures. */
const PLANS: Readonly<Record<CultureId, Plan>> = {
  qasirah: [
    ["garden", 1],
    ["market", 1],
    ["warehouse", 1],
    ["workshop", 3],
    ["house", 10],
    ["field", 2],
    ["tree", 18],
  ],
  shogunara: [
    ["temple", 2],
    ["warehouse", 1],
    ["workshop", 2],
    ["house", 10],
    ["field", 3],
    ["tree", 16],
  ],
  valdoria: [
    ["market", 1],
    ["warehouse", 2],
    ["workshop", 3],
    ["house", 12],
    ["field", 2],
    ["tree", 10],
  ],
  skeld: [
    ["shipyard", 1],
    ["warehouse", 1],
    ["workshop", 2],
    ["house", 8],
    ["field", 1],
  ],
  crows: [
    ["tavern", 1],
    ["market", 1],
    ["shipyard", 1],
    ["warehouse", 2],
    ["house", 6],
    ["fire", 3],
    ["wreck", 2],
  ],
  blackreef: [
    ["tavern", 1],
    ["market", 1],
    ["shipyard", 1],
    ["warehouse", 2],
    ["house", 5],
    ["fire", 3],
    ["wreck", 2],
  ],
};

/** Towers a culture puts on its coast. */
const TOWERS: Readonly<Record<CultureId, number>> = {
  qasirah: 1,
  shogunara: 2,
  valdoria: 1,
  skeld: 2,
  crows: 4,
  blackreef: 3,
};

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Steepest a footprint may be (a little more than the players may build). */
const SITE_SLOPE = 2.2;

/** Kinds that stand by the water. */
const COASTAL: readonly SiteKind[] = ["shipyard", "wreck", "tower"];

/** Kinds kept far from the middle. */
const OUTER: readonly SiteKind[] = ["field"];

/** Kinds that stand near the harbour. */
const NEAR_HARBOUR: readonly SiteKind[] = ["warehouse", "tavern", "market"];

/** Salt of the hash that varies the models. */
const VARIANT_SALT = 71;

/** Variants of a model. */
const VARIANTS = 4;

/** Towns per world, made once. */
const layouts = new WeakMap<World, Map<number, readonly FactionSite[]>>();

/**
 * The town of a faction on its island.
 *
 * @param world - the world
 * @param home - the faction's home
 * @returns its places, harbour and palace first
 */
export function factionLayout(
  world: World,
  home: FactionHome,
): readonly FactionSite[] {
  let perWorld = layouts.get(world);
  if (perWorld === undefined) {
    perWorld = new Map();
    layouts.set(world, perWorld);
  }
  let sites = perWorld.get(home.island);
  if (sites === undefined) {
    sites = layOut(world, home);
    perWorld.set(home.island, sites);
  }
  return sites;
}

/**
 * The middle of a place, in tiles.
 *
 * @param site - the place
 * @returns its centre
 */
export function siteCentre(site: FactionSite): { x: number; y: number } {
  return { x: site.x + site.w / 2, y: site.y + site.h / 2 };
}

/** Lays the whole town out. */
function layOut(world: World, home: FactionHome): FactionSite[] {
  const n = world.n;
  const pirates = CULTURE[home.culture].kind === "pirates";
  const info = world.islands[home.island];
  const used = new Set<number>();
  const sites: FactionSite[] = [];
  const fits = (x: number, y: number, w: number, h: number, kind: SiteKind) => {
    let ok = x >= 0 && y >= 0 && x + w <= n && y + h <= n;
    for (let ty = y; ty < y + h && ok; ty += 1) {
      for (let tx = x; tx < x + w && ok; tx += 1) {
        const index = ty * n + tx;
        const ground = world.terrain[index] as Terrain;
        ok =
          world.islandOf[index] === home.island &&
          !used.has(index) &&
          ground !== Terrain.River &&
          (ground !== Terrain.Mountain || kind === "tree") &&
          (pirates || ground !== Terrain.Rock);
      }
    }
    return (
      ok && (kind === "tree" || areaSlope(world, x, y, w, h) <= SITE_SLOPE)
    );
  };
  const put = (kind: SiteKind, x: number, y: number, w: number, h: number) => {
    for (let ty = y; ty < y + h; ty += 1) {
      for (let tx = x; tx < x + w; tx += 1) {
        used.add(ty * n + tx);
      }
    }
    const variant = Math.floor(
      hash2(x, y, world.seed + VARIANT_SALT) * VARIANTS,
    );
    sites.push({
      kind,
      x,
      y,
      w,
      h,
      rot: facing(x + w / 2, y + h / 2, info.cx, info.cy),
      variant: Math.min(VARIANTS - 1, variant),
    });
  };
  const quayX = home.quay % n;
  const quayY = Math.floor(home.quay / n);
  // The harbour first, on the quay or right beside it.
  const harbour = nearestFit(world, home, fits, "harbour", quayX, quayY);
  if (harbour !== null) {
    put("harbour", harbour.x, harbour.y, harbour.w, harbour.h);
  }
  const palace = nearestFit(world, home, fits, "palace", info.cx, info.cy);
  if (palace !== null) {
    put("palace", palace.x, palace.y, palace.w, palace.h);
  }
  placeTowers(world, home, fits, put, TOWERS[home.culture], quayX, quayY);
  const middle =
    palace === null
      ? { x: info.cx, y: info.cy }
      : siteCentre({ ...palace, kind: "palace", rot: 0, variant: 0 });
  for (const [kind, count] of PLANS[home.culture]) {
    for (let k = 0; k < count; k += 1) {
      const anchor = NEAR_HARBOUR.includes(kind)
        ? { x: quayX, y: quayY }
        : middle;
      const spot = OUTER.includes(kind)
        ? farthestFit(world, home, fits, kind, middle.x, middle.y)
        : COASTAL.includes(kind)
          ? coastFit(world, home, fits, kind, anchor.x, anchor.y, k)
          : nearestFit(world, home, fits, kind, anchor.x, anchor.y);
      if (spot !== null) {
        put(kind, spot.x, spot.y, spot.w, spot.h);
      }
    }
  }
  return sites;
}

/** A footprint that may be turned: the first that fits, nearest a point. */
function nearestFit(
  world: World,
  home: FactionHome,
  fits: (x: number, y: number, w: number, h: number, kind: SiteKind) => boolean,
  kind: SiteKind,
  px: number,
  py: number,
): { x: number; y: number; w: number; h: number } | null {
  return bestFit(world, home, fits, kind, (x, y) => Math.hypot(x - px, y - py));
}

/** The fitting footprint farthest from a point. */
function farthestFit(
  world: World,
  home: FactionHome,
  fits: (x: number, y: number, w: number, h: number, kind: SiteKind) => boolean,
  kind: SiteKind,
  px: number,
  py: number,
): { x: number; y: number; w: number; h: number } | null {
  return bestFit(
    world,
    home,
    fits,
    kind,
    (x, y) => -Math.hypot(x - px, y - py),
  );
}

/**
 * A fitting footprint on the coast, the k-th place away from a point, so
 * that coastal places spread out.
 */
function coastFit(
  world: World,
  home: FactionHome,
  fits: (x: number, y: number, w: number, h: number, kind: SiteKind) => boolean,
  kind: SiteKind,
  px: number,
  py: number,
  k: number,
): { x: number; y: number; w: number; h: number } | null {
  const n = world.n;
  const info = world.islands[home.island];
  const angle =
    Math.atan2(py - info.cy, px - info.cx) +
    Math.PI * (1 + (k * 2) / COAST_SPREAD);
  const tx = info.cx + Math.cos(angle) * (info.maxX - info.minX);
  const ty = info.cy + Math.sin(angle) * (info.maxY - info.minY);
  return bestFit(world, home, fits, kind, (x, y) =>
    coastal(world, home.island, x, y, n)
      ? Math.hypot(x - tx, y - ty)
      : Infinity,
  );
}

/** The fitting footprint with the lowest score, either way round. */
function bestFit(
  world: World,
  home: FactionHome,
  fits: (x: number, y: number, w: number, h: number, kind: SiteKind) => boolean,
  kind: SiteKind,
  score: (x: number, y: number) => number,
): { x: number; y: number; w: number; h: number } | null {
  const info = world.islands[home.island];
  const [a, b] = SIZE[kind];
  let best: { x: number; y: number; w: number; h: number } | null = null;
  let bestScore = Infinity;
  for (let y = info.minY; y <= info.maxY; y += 1) {
    for (let x = info.minX; x <= info.maxX; x += 1) {
      for (const [w, h] of a === b
        ? [[a, b]]
        : [
            [a, b],
            [b, a],
          ]) {
        const value = score(x + w / 2, y + h / 2);
        if (value < bestScore && fits(x, y, w, h, kind)) {
          bestScore = value;
          best = { x, y, w, h };
        }
      }
    }
  }
  return best;
}

/** Puts towers around the coast, spread from the harbour. */
function placeTowers(
  world: World,
  home: FactionHome,
  fits: (x: number, y: number, w: number, h: number, kind: SiteKind) => boolean,
  put: (kind: SiteKind, x: number, y: number, w: number, h: number) => void,
  count: number,
  quayX: number,
  quayY: number,
): void {
  const info = world.islands[home.island];
  const start = Math.atan2(quayY - info.cy, quayX - info.cx);
  for (let k = 0; k < count; k += 1) {
    // The first tower guards the harbour, the others spread round.
    const angle =
      start + (k * Math.PI * 2) / count + (k === 0 ? 0 : Math.PI / count);
    const tx = info.cx + Math.cos(angle) * (info.maxX - info.minX);
    const ty = info.cy + Math.sin(angle) * (info.maxY - info.minY);
    const spot = bestFit(world, home, fits, "tower", (x, y) =>
      coastal(world, home.island, x, y, world.n)
        ? Math.hypot(x - tx, y - ty)
        : Infinity,
    );
    if (spot !== null) {
      put("tower", spot.x, spot.y, spot.w, spot.h);
    }
  }
}

/** Whether the sea lies within two tiles of a point of an island. */
function coastal(
  world: World,
  island: number,
  x: number,
  y: number,
  n: number,
): boolean {
  let near = false;
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  for (const [dx, dy] of DIRS8) {
    for (const step of [1, 2]) {
      const tx = cx + dx * step;
      const ty = cy + dy * step;
      if (
        tx >= 0 &&
        ty >= 0 &&
        tx < n &&
        ty < n &&
        world.islandOf[cy * n + cx] === island &&
        isSea(world.terrain[ty * n + tx] as Terrain)
      ) {
        near = true;
      }
    }
  }
  return near;
}

/** The quarter turn that faces a place towards a point. */
function facing(x: number, y: number, tx: number, ty: number): number {
  const angle = Math.atan2(ty - y, tx - x);
  const quarter = Math.round(angle / (Math.PI / 2));
  return ((quarter % QUARTERS) + QUARTERS) % QUARTERS;
}
