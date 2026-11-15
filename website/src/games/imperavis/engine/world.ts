/**
 * The WorldManager: builds the archipelago from a seed - island shapes,
 * heights, beaches, forests, rock, mountains, rivers, deposits, fertility
 * and names.
 *
 * @module
 * @remarks
 * Everything here is a pure function of seed and size, so a saved game only
 * keeps those two numbers and the world comes back exactly as it was.
 */
import {
  describeIsland,
  drawFertility,
  findIslands,
  islandNames,
} from "./islands";
import { fbm } from "./noise";
import {
  hash2,
  nextRandom,
  randomInt,
  randomRange,
  type Seeded,
} from "./random";
import { CORNERS, DIRS4, DIRS8, isSea, TILE_CENTER } from "./terrain";
import { CULTURE, NATIONS, PIRATE_BANDS } from "./factions-data";
import {
  Deposit,
  Terrain,
  type CultureId,
  type Crop,
  type FactionHome,
  type IslandInfo,
  type MapSize,
  type World,
} from "./types";

/** Tiles per side and how many islands to try, per map size. */
const SIZES: Readonly<
  Record<
    MapSize,
    {
      n: number;
      islands: number;
      startRadius: number;
      minRadius: number;
      maxRadius: number;
    }
  >
> = {
  small: { n: 160, islands: 8, startRadius: 21, minRadius: 8, maxRadius: 17 },
  medium: { n: 224, islands: 13, startRadius: 23, minRadius: 8, maxRadius: 20 },
  large: { n: 288, islands: 20, startRadius: 24, minRadius: 8, maxRadius: 22 },
};

/** Chances that an island has a deposit or a crop. */
const CHANCE = { stone: 0.75, clay: 0.6, ore: 0.45, grain: 0.7, grapes: 0.35 };

/** Noise frequencies and salts. */
const NOISE = {
  warp: 0.07,
  hills: 0.09,
  ridge: 0.06,
  forest: 0.11,
  warpSalt: 31,
  hillSalt: 7,
  ridgeSalt: 57,
  forestSalt: 99,
};

/** Shape of the land. */
const SHAPE = {
  /** How far coastlines wander, as a share of the radius. */
  warp: 0.6,
  /** Smallest radius factor after warping. */
  warpBase: 0.7,
  /** Height gained from coast to centre. */
  rise: 2,
  /** Hill height. */
  hills: 1.8,
  /** Ridge threshold and height for mountains. */
  ridgeFrom: 0.6,
  ridgeHeight: 22,
  /** Under water the shore falls this steeply. */
  shelf: 9,
  /** Deepest sea. */
  floor: -4,
  /** Reach of an island's influence on heights, in radii. */
  reach: 1.7,
};

/** The home island lies within an eighth of the map from the centre. */
const START_SPREAD = 8;

/** Octaves of the noise. */
const OCTAVES = 3;

/** A tile is land when its mean height is above this. */
const LAND = 0.12;

/** Mean heights above which land is rock and mountain. */
const ROCK = 3;
const MOUNTAIN = 4.6;

/** Beaches are lower than this. */
const BEACH = 0.9;

/** Water deeper than this is deep sea. */
const DEEP = -1.6;

/** Forest noise above this grows trees. */
const FOREST = 0.53;

/** Open sea kept between islands, in tiles. */
const SEA_GAP = 8;

/** Margin to the map edge, in tiles. */
const EDGE = 6;

/** Attempts to place islands. */
const PLACE_TRIES = 600;

/** Islands smaller than this sink. */
const MIN_ISLAND = 30;

/** Rivers only on islands at least this large... */
const RIVER_AREA = 380;

/** ...with this chance, and at most this long. */
const RIVER_CHANCE = 0.65;
const RIVER_LENGTH = 70;

/** A river bed lies this much lower than the bank. */
const RIVER_CUT = 0.35;

/** Lowest a river bed may sink. */
const RIVER_FLOOR = 0.06;

/** Deposit patches: tiles across. */
const PATCH = 2;

/** How far out to sea the first ship waits, in tiles. */
const SHIP_OFFSHORE = 5;

/** The starting island's fertility and deposits. */
const START_FERTILE: Readonly<Record<Crop, boolean>> = {
  grain: true,
  grapes: false,
  tobacco: false,
};

/** Chance an island other than the start grows tobacco. */
const TOBACCO_CHANCE = 0.35;

/** Mixed into the hash that decides tobacco, apart from all other chance. */
const TOBACCO_SALT = 0x70bacc0;

/** Peoples and pirate bands a new world tries to place, per map size. */
const FACTION_COUNTS: Readonly<
  Record<MapSize, { nations: number; pirates: number }>
> = {
  small: { nations: 4, pirates: 1 },
  medium: { nations: 4, pirates: 1 },
  large: { nations: 4, pirates: 2 },
};

/** A small map holds at least this many peoples, even if crowded. */
const MIN_NATIONS = 2;

/** Radius of a faction's home island, in tiles - well below the others. */
const FACTION_RADIUS = 7.5;

/** A faction island keeps this share of the map away from the start... */
export const FACTION_FROM_START = 0.3;

/** ...and this share from every other faction island. */
export const FACTION_APART = 0.2;

/** Places tried for each faction island. */
const FACTION_TRIES = 400;

/** Mixed into the seed for placing the faction islands. */
const FACTION_SALT = 0xfac7;

/** Peaks of the faction islands: gentle peoples, craggy pirate rocks. */
const NATION_PEAK = 0.25;
const PIRATE_PEAK = 1.7;

/** On a pirate island land above this height turns to dark rock. */
const CLIFF_HEIGHT = 0.95;

/** Qasirah's land below this height is sand. */
const SAND_HEIGHT = 1.4;

/** Skeld's land this far from its centre (share of the radius) is pine forest. */
const PINE_FROM = 0.45;

/** Open water a harbour looks out on, in tiles. */
const HARBOUR_SEA = 5;

/** The berth lies this far out from the quay, in tiles. */
const BERTH_OUT = 2;

/** The fertility of a faction's home: nothing anyone else could grow. */
const NO_CROPS: Readonly<Record<Crop, boolean>> = {
  grain: false,
  grapes: false,
  tobacco: false,
};

/** One island to raise. */
type Seed = {
  cx: number;
  cy: number;
  r: number;
  peak: number;
  /** The faction it is home to, if any. */
  culture?: CultureId;
};

/**
 * Builds a world.
 *
 * @param seed - the seed
 * @param size - small, medium or large
 * @param factions - whether the foreign peoples and pirates get their home
 *   islands; off for worlds of games from before them, which stay exactly
 *   as they were
 * @param left - peoples and pirate bands left out of a world with factions:
 *   they get no island, and the others are placed as if they were not
 *   there; the same seed and the same choice give the same world
 * @returns the world
 */
export function createWorld(
  seed: number,
  size: MapSize,
  factions = false,
  left: readonly CultureId[] = [],
): World {
  const random: Seeded = { rng: seed };
  const config = SIZES[size];
  const n = config.n;
  const seeds = placeIslands(random, config, factions ? size : null, left);
  const heights = raiseLand(seed, n, seeds);
  const terrain = new Uint8Array(n * n);
  classify(seed, n, heights, terrain);
  const groups = findIslands(terrain, n).filter((group) => {
    const keep = group.length >= MIN_ISLAND;
    if (!keep) {
      sink(group, n, heights, terrain);
    }
    return keep;
  });
  const islandOf = new Int16Array(n * n).fill(-1);
  groups.forEach((group, id) => {
    for (const index of group) {
      islandOf[index] = id;
    }
  });
  // The start island is the land that grew around the first seed.
  const start = islandOf[Math.floor(seeds[0].cy) * n + Math.floor(seeds[0].cx)];
  const startIsland = start >= 0 ? start : 0;
  const homes = factionIslands(seeds, islandOf, n, startIsland);
  const reserved = new Set(homes.map((home) => home.island));
  for (const home of homes) {
    shapeHome(home.culture, groups[home.island], seeds, heights, terrain, n);
  }
  const deposits = new Uint8Array(n * n);
  const fertile: Record<Crop, boolean>[] = [];
  groups.forEach((group, id) => {
    if (reserved.has(id)) {
      // A faction's home has no deposits or rivers anyone could use.
      fertile.push({ ...NO_CROPS });
    } else {
      if (
        group.length >= RIVER_AREA &&
        (id === startIsland || nextRandom(random) < RIVER_CHANCE)
      ) {
        carveRiver(random, n, group, heights, terrain);
      }
      const isStart = id === startIsland;
      placeDeposit(
        random,
        n,
        group,
        terrain,
        deposits,
        Deposit.Stone,
        isStart || nextRandom(random) < CHANCE.stone,
      );
      placeDeposit(
        random,
        n,
        group,
        terrain,
        deposits,
        Deposit.Clay,
        isStart || nextRandom(random) < CHANCE.clay,
      );
      placeDeposit(
        random,
        n,
        group,
        terrain,
        deposits,
        Deposit.Ore,
        !isStart && nextRandom(random) < CHANCE.ore,
      );
      fertile.push(
        isStart
          ? { ...START_FERTILE }
          : drawFertility(random, CHANCE.grain, CHANCE.grapes),
      );
    }
  });
  guaranteeOthers(
    random,
    n,
    groups,
    startIsland,
    terrain,
    deposits,
    fertile,
    reserved,
  );
  growTobacco(seed, startIsland, fertile, reserved);
  const names = islandNames(random, groups.length);
  for (const home of homes) {
    names[home.island] = CULTURE[home.culture].island;
  }
  const islands: IslandInfo[] = groups.map((group, id) =>
    describeIsland(id, names[id], group, terrain, deposits, n, fertile[id]),
  );
  return {
    seed,
    size,
    n,
    heights,
    terrain,
    islandOf,
    deposits,
    islands,
    startIsland,
    startShip: shipStart(n, terrain, islands[startIsland]),
    factionHomes: homes.map((home) => harbourOf(home, groups, terrain, n)),
  };
}

/**
 * Picks island centres and radii with open sea between them: the start,
 * then (in a world with factions) their home islands, then the others.
 */
function placeIslands(
  random: Seeded,
  config: (typeof SIZES)[MapSize],
  factions: MapSize | null,
  left: readonly CultureId[],
): Seed[] {
  const n = config.n;
  const peak = () => randomRange(random, 1, 2);
  const seeds: Seed[] = [
    {
      cx: n / 2 + randomRange(random, -n / START_SPREAD, n / START_SPREAD),
      cy: n / 2 + randomRange(random, -n / START_SPREAD, n / START_SPREAD),
      r: config.startRadius,
      // The home island is gentle, with room to build.
      peak: peak() / 2,
    },
  ];
  if (factions !== null) {
    placeFactions(random.rng ^ FACTION_SALT, n, seeds, factions, left);
  }
  // The factions' islands come on top of the usual number.
  const wanted = config.islands + seeds.length - 1;
  for (
    let attempt = 0;
    attempt < PLACE_TRIES && seeds.length < wanted;
    attempt += 1
  ) {
    const r = randomRange(random, config.minRadius, config.maxRadius);
    const margin = r + EDGE;
    const cx = randomRange(random, margin, n - margin);
    const cy = randomRange(random, margin, n - margin);
    const free = seeds.every(
      (other) =>
        Math.hypot(other.cx - cx, other.cy - cy) > other.r + r + SEA_GAP,
    );
    if (free) {
      seeds.push({ cx, cy, r, peak: peak() });
    }
  }
  return seeds;
}

/** Corner heights: each island a warped dome with hills and ridges. */
function raiseLand(
  seed: number,
  n: number,
  seeds: readonly Seed[],
): Float32Array {
  const size = n + 1;
  const heights = new Float32Array(size * size).fill(SHAPE.floor);
  seeds.forEach((island, index) => {
    const reach = island.r * SHAPE.reach;
    const x0 = Math.max(0, Math.floor(island.cx - reach));
    const x1 = Math.min(n, Math.ceil(island.cx + reach));
    const y0 = Math.max(0, Math.floor(island.cy - reach));
    const y1 = Math.min(n, Math.ceil(island.cy + reach));
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const warp = fbm(
          x * NOISE.warp,
          y * NOISE.warp,
          seed + index * NOISE.warpSalt,
          OCTAVES,
        );
        const distance = Math.hypot(x - island.cx, y - island.cy);
        const base =
          1 - distance / (island.r * (SHAPE.warpBase + SHAPE.warp * warp));
        let value: number;
        if (base > 0) {
          const hills = fbm(
            x * NOISE.hills,
            y * NOISE.hills,
            seed + NOISE.hillSalt,
            OCTAVES,
          );
          const ridge = fbm(
            x * NOISE.ridge,
            y * NOISE.ridge,
            seed + NOISE.ridgeSalt,
            2,
          );
          const mountains =
            Math.max(0, ridge - SHAPE.ridgeFrom) *
            SHAPE.ridgeHeight *
            island.peak;
          value =
            base * SHAPE.rise +
            hills * SHAPE.hills * base +
            mountains * Math.min(1, base * 2);
        } else {
          value = Math.max(SHAPE.floor, base * SHAPE.shelf);
        }
        const at = y * size + x;
        heights[at] = Math.max(heights[at], value);
      }
    }
  });
  return heights;
}

/** Sets the ground of every tile from its height and the forest noise. */
function classify(
  seed: number,
  n: number,
  heights: Float32Array,
  terrain: Uint8Array,
): void {
  const size = n + 1;
  const mean = (x: number, y: number) =>
    (heights[y * size + x] +
      heights[y * size + x + 1] +
      heights[(y + 1) * size + x] +
      heights[(y + 1) * size + x + 1]) /
    CORNERS;
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      const h = mean(x, y);
      terrain[y * n + x] =
        h > LAND
          ? Terrain.Meadow
          : h < DEEP
            ? Terrain.DeepWater
            : Terrain.Water;
    }
  }
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      const index = y * n + x;
      if (terrain[index] === Terrain.Meadow) {
        const h = mean(x, y);
        const forest = fbm(
          x * NOISE.forest,
          y * NOISE.forest,
          seed + NOISE.forestSalt,
          OCTAVES,
        );
        let ground = Terrain.Meadow;
        if (h > MOUNTAIN) {
          ground = Terrain.Mountain;
        } else if (h > ROCK) {
          ground = Terrain.Rock;
        } else if (h < BEACH && nearSea(terrain, n, x, y)) {
          ground = Terrain.Beach;
        } else if (forest > FOREST) {
          ground = Terrain.Forest;
        }
        terrain[index] = ground;
      }
    }
  }
}

/** Whether sea lies within one tile. */
function nearSea(
  terrain: Uint8Array,
  n: number,
  x: number,
  y: number,
): boolean {
  let result = false;
  for (const [dx, dy] of DIRS8) {
    const nx = x + dx;
    const ny = y + dy;
    if (
      nx >= 0 &&
      ny >= 0 &&
      nx < n &&
      ny < n &&
      isSea(terrain[ny * n + nx] as Terrain)
    ) {
      result = true;
    }
  }
  return result;
}

/** Turns a speck of land into shallow water. */
function sink(
  group: readonly number[],
  n: number,
  heights: Float32Array,
  terrain: Uint8Array,
): void {
  const size = n + 1;
  for (const index of group) {
    terrain[index] = Terrain.Water;
    const x = index % n;
    const y = Math.floor(index / n);
    for (const [cx, cy] of [
      [x, y],
      [x + 1, y],
      [x, y + 1],
      [x + 1, y + 1],
    ]) {
      heights[cy * size + cx] = Math.min(heights[cy * size + cx], -LAND);
    }
  }
}

/** Runs a river from the hills down to the sea and cuts its bed. */
function carveRiver(
  random: Seeded,
  n: number,
  group: readonly number[],
  heights: Float32Array,
  terrain: Uint8Array,
): void {
  const size = n + 1;
  const mean = (index: number) => {
    const x = index % n;
    const y = Math.floor(index / n);
    return (
      (heights[y * size + x] +
        heights[y * size + x + 1] +
        heights[(y + 1) * size + x] +
        heights[(y + 1) * size + x + 1]) /
      CORNERS
    );
  };
  // Springs rise at the foot of the high ground.
  const springs = group.filter((index) => {
    const h = mean(index);
    return h > ROCK - 1 && h < MOUNTAIN && terrain[index] !== Terrain.Mountain;
  });
  if (springs.length > 0) {
    let current = springs[randomInt(random, 0, springs.length - 1)];
    const course: number[] = [];
    const visited = new Set<number>();
    let reached = false;
    for (let step = 0; step < RIVER_LENGTH && !reached; step += 1) {
      course.push(current);
      visited.add(current);
      const x = current % n;
      const y = Math.floor(current / n);
      let best = -1;
      let bestHeight = Infinity;
      for (const [dx, dy] of DIRS4) {
        const nx = x + dx;
        const ny = y + dy;
        const next = ny * n + nx;
        if (nx >= 0 && ny >= 0 && nx < n && ny < n && !visited.has(next)) {
          const h = isSea(terrain[next] as Terrain)
            ? -1
            : mean(next) + nextRandom(random) * RIVER_CUT;
          if (h < bestHeight) {
            bestHeight = h;
            best = next;
          }
        }
      }
      if (best < 0) {
        reached = true;
      } else if (isSea(terrain[best] as Terrain)) {
        reached = true;
      } else {
        current = best;
      }
    }
    // Only keep a river that found the sea.
    const last = course[course.length - 1];
    if (
      reached &&
      last !== undefined &&
      nearSea(terrain, n, last % n, Math.floor(last / n))
    ) {
      for (const index of course) {
        terrain[index] = Terrain.River;
        const x = index % n;
        const y = Math.floor(index / n);
        for (const [cx, cy] of [
          [x, y],
          [x + 1, y],
          [x, y + 1],
          [x + 1, y + 1],
        ]) {
          const at = cy * size + cx;
          heights[at] = Math.max(RIVER_FLOOR, heights[at] - RIVER_CUT);
        }
      }
    }
  }
}

/** Lays a patch of a deposit on fitting ground of an island. */
function placeDeposit(
  random: Seeded,
  n: number,
  group: readonly number[],
  terrain: Uint8Array,
  deposits: Uint8Array,
  kind: Deposit,
  wanted: boolean,
): void {
  const fits = (index: number) => {
    const ground = terrain[index] as Terrain;
    let result: boolean;
    switch (kind) {
      case Deposit.Clay:
        result = ground === Terrain.Meadow || ground === Terrain.Beach;
        break;
      default:
        result = ground === Terrain.Rock;
    }
    return result && deposits[index] === Deposit.None;
  };
  const candidates = wanted ? group.filter(fits) : [];
  if (candidates.length > 0) {
    const center = candidates[randomInt(random, 0, candidates.length - 1)];
    const cx = center % n;
    const cy = Math.floor(center / n);
    for (let y = cy - PATCH; y <= cy + PATCH; y += 1) {
      for (let x = cx - PATCH; x <= cx + PATCH; x += 1) {
        const index = y * n + x;
        const inside = x >= 0 && y >= 0 && x < n && y < n;
        if (
          inside &&
          Math.hypot(x - cx, y - cy) <= PATCH + TILE_CENTER &&
          !isSea(terrain[index] as Terrain) &&
          terrain[index] !== Terrain.River
        ) {
          deposits[index] = kind;
        }
      }
    }
  }
}

/**
 * Decides where tobacco grows, by a hash of the seed so the rest of the
 * world comes out as it always did; at least one other island gets it.
 */
function growTobacco(
  seed: number,
  startIsland: number,
  fertile: Record<Crop, boolean>[],
  reserved: ReadonlySet<number>,
): void {
  fertile.forEach((crops, id) => {
    crops.tobacco =
      id !== startIsland &&
      !reserved.has(id) &&
      hash2(id, id, seed ^ TOBACCO_SALT) < TOBACCO_CHANCE;
  });
  const others = fertile
    .map((_, id) => id)
    .filter((id) => id !== startIsland && !reserved.has(id));
  if (others.length > 0 && !others.some((id) => fertile[id].tobacco)) {
    fertile[others[others.length - 1]].tobacco = true;
  }
}

/** Makes sure some other island has ore and some has grapes. */
function guaranteeOthers(
  random: Seeded,
  n: number,
  groups: readonly number[][],
  startIsland: number,
  terrain: Uint8Array,
  deposits: Uint8Array,
  fertile: Record<Crop, boolean>[],
  reserved: ReadonlySet<number>,
): void {
  const others = groups
    .map((_, id) => id)
    .filter((id) => id !== startIsland && !reserved.has(id));
  if (others.length > 0 && !others.some((id) => fertile[id].grapes)) {
    fertile[others[0]].grapes = true;
  }
  const hasOre = others.some((id) =>
    groups[id].some((index) => deposits[index] === Deposit.Ore),
  );
  if (others.length > 0 && !hasOre) {
    // The largest other island with rock gets ore; failing that, any meadow.
    const target =
      others.find((id) =>
        groups[id].some((index) => terrain[index] === Terrain.Rock),
      ) ?? others[0];
    const rock = groups[target].some(
      (index) => terrain[index] === Terrain.Rock,
    );
    if (!rock) {
      const spot = groups[target].find(
        (index) => terrain[index] === Terrain.Meadow,
      );
      if (spot !== undefined) {
        terrain[spot] = Terrain.Rock;
      }
    }
    placeDeposit(
      random,
      n,
      groups[target],
      terrain,
      deposits,
      Deposit.Ore,
      true,
    );
  }
}

/** A water tile off the start island's coast for the first ship. */
export function shipStart(
  n: number,
  terrain: Uint8Array,
  island: IslandInfo,
): { x: number; y: number } {
  let result = {
    x: Math.floor(island.cx),
    y: Math.max(0, island.minY - SHIP_OFFSHORE),
  };
  let found = false;
  // Walk out from the centre in several directions until open water.
  const directions = DIRS8.length;
  for (let k = 0; k < directions && !found; k += 1) {
    const angle = (k / directions) * Math.PI * 2;
    let water = 0;
    for (let step = 1; step < n && !found; step += 1) {
      const x = Math.round(island.cx + Math.cos(angle) * step);
      const y = Math.round(island.cy + Math.sin(angle) * step);
      const inside = x >= 0 && y >= 0 && x < n && y < n;
      if (inside && isSea(terrain[y * n + x] as Terrain)) {
        water += 1;
        if (water >= SHIP_OFFSHORE) {
          result = { x, y };
          found = true;
        }
      } else {
        water = 0;
      }
    }
  }
  return result;
}

/**
 * Places the home islands of the peoples and the pirates right after the
 * start: far from it and from each other, each the best of many tries. A
 * crowded small map takes fewer peoples, but never less than
 * {@link MIN_NATIONS}, and always its pirates. Peoples and bands left out
 * are skipped.
 */
function placeFactions(
  salt: number,
  n: number,
  seeds: Seed[],
  size: MapSize,
  left: readonly CultureId[],
): void {
  const random: Seeded = { rng: salt };
  const counts = FACTION_COUNTS[size];
  const wanted: { culture: CultureId; must: boolean }[] = [
    ...NATIONS.slice(0, counts.nations)
      .filter((culture) => !left.includes(culture))
      .map((culture, index) => ({
        culture,
        must: index < MIN_NATIONS,
      })),
    ...PIRATE_BANDS.slice(0, counts.pirates)
      .filter((culture) => !left.includes(culture))
      .map((culture) => ({
        culture,
        must: true,
      })),
  ];
  const start = seeds[0];
  const margin = FACTION_RADIUS + EDGE + SEA_GAP;
  for (const { culture, must } of wanted) {
    let best: Seed | null = null;
    let bestScore = -Infinity;
    for (let attempt = 0; attempt < FACTION_TRIES; attempt += 1) {
      const cx = randomRange(random, margin, n - margin);
      const cy = randomRange(random, margin, n - margin);
      const free = seeds.every(
        (other) =>
          Math.hypot(other.cx - cx, other.cy - cy) >
          other.r + FACTION_RADIUS + SEA_GAP,
      );
      const fromStart = Math.hypot(start.cx - cx, start.cy - cy);
      const apart = Math.min(
        n,
        ...seeds
          .filter((other) => other.culture !== undefined)
          .map((other) => Math.hypot(other.cx - cx, other.cy - cy)),
      );
      // Far from the start counts, and from the others while they are close.
      const score =
        Math.min(fromStart, n * FACTION_FROM_START) +
        Math.min(apart, n * FACTION_APART);
      if (free && score > bestScore) {
        bestScore = score;
        best = {
          cx,
          cy,
          r: FACTION_RADIUS,
          peak: CULTURE[culture].kind === "pirates" ? PIRATE_PEAK : NATION_PEAK,
          culture,
        };
      }
    }
    // A full score means both distances are kept.
    const roomy = bestScore >= n * (FACTION_FROM_START + FACTION_APART) - 1;
    if (best !== null && (roomy || must)) {
      seeds.push(best);
    }
  }
}

/** The island that grew around each faction's seed, in seed order. */
function factionIslands(
  seeds: readonly Seed[],
  islandOf: Int16Array,
  n: number,
  startIsland: number,
): { culture: CultureId; island: number }[] {
  const homes: { culture: CultureId; island: number }[] = [];
  for (const seed of seeds) {
    if (seed.culture !== undefined) {
      let island = -1;
      // The centre may lie in a bay; look around it for the island's land.
      for (let r = 0; r <= FACTION_RADIUS && island < 0; r += 1) {
        for (let dy = -r; dy <= r && island < 0; dy += 1) {
          for (let dx = -r; dx <= r && island < 0; dx += 1) {
            const x = Math.floor(seed.cx) + dx;
            const y = Math.floor(seed.cy) + dy;
            const inside = x >= 0 && y >= 0 && x < n && y < n;
            island = inside ? islandOf[y * n + x] : -1;
          }
        }
      }
      if (
        island >= 0 &&
        island !== startIsland &&
        !homes.some((home) => home.island === island)
      ) {
        homes.push({ culture: seed.culture, island });
      }
    }
  }
  return homes;
}

/**
 * Gives a faction's island its look: dark cliffs for pirates, sand for
 * Qasirah, pine forest for Skeld, open land for the others.
 */
function shapeHome(
  culture: CultureId,
  tiles: readonly number[],
  seeds: readonly Seed[],
  heights: Float32Array,
  terrain: Uint8Array,
  n: number,
): void {
  const size = n + 1;
  const seed = seeds.find((s) => s.culture === culture);
  const pirates = CULTURE[culture].kind === "pirates";
  for (const index of tiles) {
    const x = index % n;
    const y = Math.floor(index / n);
    const h =
      (heights[y * size + x] +
        heights[y * size + x + 1] +
        heights[(y + 1) * size + x] +
        heights[(y + 1) * size + x + 1]) /
      CORNERS;
    const ground = terrain[index] as Terrain;
    const far =
      seed === undefined
        ? 0
        : Math.hypot(x - seed.cx, y - seed.cy) / Math.max(1, seed.r);
    let next = ground;
    if (pirates) {
      next =
        h > CLIFF_HEIGHT && ground !== Terrain.Beach ? Terrain.Rock : ground;
    } else if (ground === Terrain.Mountain || ground === Terrain.Rock) {
      next = Terrain.Meadow;
    } else if (culture === "qasirah") {
      next = h < SAND_HEIGHT ? Terrain.Beach : Terrain.Meadow;
    } else if (culture === "skeld") {
      next =
        far > PINE_FROM && ground !== Terrain.Beach ? Terrain.Forest : ground;
    } else if (ground === Terrain.Forest) {
      next = Terrain.Meadow;
    }
    terrain[index] = next;
  }
}

/**
 * Where a faction's harbour lies: the coastal tile that looks out on open
 * water, as close to the middle of the map as can be, so ships from every
 * side reach it.
 */
function harbourOf(
  home: { culture: CultureId; island: number },
  groups: readonly number[][],
  terrain: Uint8Array,
  n: number,
): FactionHome {
  let quay = groups[home.island][0];
  let berth = -1;
  let bestScore = Infinity;
  for (const index of groups[home.island]) {
    const x = index % n;
    const y = Math.floor(index / n);
    for (const [dx, dy] of DIRS4) {
      let open = true;
      for (let step = 1; step <= HARBOUR_SEA && open; step += 1) {
        const sx = x + dx * step;
        const sy = y + dy * step;
        open =
          sx >= 0 &&
          sy >= 0 &&
          sx < n &&
          sy < n &&
          isSea(terrain[sy * n + sx] as Terrain);
      }
      const score = Math.hypot(x - n / 2, y - n / 2);
      if (open && score < bestScore) {
        bestScore = score;
        quay = index;
        berth = (y + dy * BERTH_OUT) * n + x + dx * BERTH_OUT;
      }
    }
  }
  return { culture: home.culture, island: home.island, berth, quay };
}
