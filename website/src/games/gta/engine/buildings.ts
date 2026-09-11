/**
 * What stands in the blocks: houses to live in, and places with a name.
 *
 * @module
 * @remarks
 * Fifteen sorts, one row each - the colour of the roof, the colour of the wall,
 * how tall it builds, whether it is one house or several, and the sign over the
 * door. The city plan decides which block gets which, always the same way for
 * the same block, so that after an hour you know where the hospital is.
 *
 * The ordinary houses come first and often; a city of nothing but landmarks is
 * a theme park. The named places appear once or twice each and are what turns a
 * grid of blocks into somewhere you can give directions in.
 */

import { AIRPORT, BLOCK_TILES, CITY_TILES, ISLANDS, type Vec } from "./types";

/** What kind of building fills a block. */
export type BuildingKind =
  | "house"
  | "double"
  | "terrace"
  | "tower"
  | "bank"
  | "guns"
  | "mint"
  | "fire"
  | "hospital"
  | "police"
  | "barber"
  | "restaurant"
  | "casino"
  | "hall"
  | "market"
  | "club"
  | "prison";

/** How the houses of a block are cut up. */
export type BuildingShape = "one" | "two" | "row";

/** One sort of building, as numbers and colours. */
export type Building = {
  readonly kind: BuildingKind;
  /** What is written over the door, or empty for the plain ones. */
  readonly name: string;
  /** The roof. */
  readonly roof: string;
  /** The wall you see. */
  readonly wall: string;
  /** How the block is divided: one house, two, or a row of them. */
  readonly shape: BuildingShape;
  /** How tall it builds, against the height the block would have anyway. */
  readonly rise: number;
  /** The colour of the sign, if it has one. */
  readonly sign: string;
};

/** Every sort there is. */
export const BUILDINGS: Readonly<Record<BuildingKind, Building>> = {
  house: {
    kind: "house",
    name: "",
    roof: "#a8a29e",
    wall: "#78716c",
    shape: "one",
    rise: 1,
    sign: "#e2e8f0",
  },
  double: {
    kind: "double",
    name: "",
    roof: "#c4b5a0",
    wall: "#9a8c78",
    shape: "two",
    rise: 0.85,
    sign: "#e2e8f0",
  },
  terrace: {
    kind: "terrace",
    name: "",
    roof: "#b9a08f",
    wall: "#8d6e63",
    shape: "row",
    rise: 0.75,
    sign: "#e2e8f0",
  },
  tower: {
    kind: "tower",
    name: "",
    roof: "#94a3b8",
    wall: "#64748b",
    shape: "one",
    rise: 1.9,
    sign: "#e2e8f0",
  },
  bank: {
    kind: "bank",
    name: "BANK",
    roof: "#d6d3d1",
    wall: "#a8a29e",
    shape: "one",
    rise: 1.3,
    sign: "#facc15",
  },
  mint: {
    kind: "mint",
    // The one building in Los Santos that makes money instead of keeping it:
    // grey walls, a long hall, and gold over the door. The sign is long enough
    // that {@link signOver} shrinks it, which is the point of that loop.
    name: "LA CASA DE PAPEL",
    roof: "#3f3f46",
    wall: "#52525b",
    shape: "one",
    rise: 1.15,
    sign: "#eab308",
  },
  guns: {
    kind: "guns",
    name: "WAFFEN",
    roof: "#44403c",
    wall: "#57534e",
    shape: "one",
    rise: 0.85,
    sign: "#b91c1c",
  },
  fire: {
    kind: "fire",
    name: "FEUERWEHR",
    roof: "#b91c1c",
    wall: "#7f1d1d",
    shape: "one",
    rise: 0.9,
    sign: "#fde047",
  },
  hospital: {
    kind: "hospital",
    name: "KRANKENHAUS",
    roof: "#e2e8f0",
    wall: "#cbd5e1",
    shape: "one",
    rise: 1.4,
    sign: "#ef4444",
  },
  police: {
    kind: "police",
    name: "POLIZEI",
    roof: "#1e3a8a",
    wall: "#1e293b",
    shape: "one",
    rise: 1.1,
    sign: "#93c5fd",
  },
  barber: {
    kind: "barber",
    name: "BARBER",
    roof: "#f1f5f9",
    wall: "#94a3b8",
    shape: "one",
    rise: 0.7,
    sign: "#ef4444",
  },
  restaurant: {
    kind: "restaurant",
    name: "RESTAURANT",
    roof: "#a16207",
    wall: "#78350f",
    shape: "one",
    rise: 0.8,
    sign: "#fde047",
  },
  casino: {
    kind: "casino",
    name: "CASINO",
    roof: "#7e22ce",
    wall: "#581c87",
    shape: "one",
    rise: 1.5,
    sign: "#fde047",
  },
  hall: {
    kind: "hall",
    name: "RATHAUS",
    roof: "#d6d3d1",
    wall: "#a8a29e",
    shape: "one",
    rise: 1.2,
    sign: "#0f172a",
  },
  market: {
    kind: "market",
    name: "SUPERMARKT",
    roof: "#0d9488",
    wall: "#115e59",
    shape: "one",
    rise: 0.65,
    sign: "#f8fafc",
  },
  club: {
    kind: "club",
    name: "NACHTCLUB",
    roof: "#1e1b4b",
    wall: "#312e81",
    shape: "one",
    rise: 0.9,
    sign: "#f472b6",
  },
  prison: {
    kind: "prison",
    name: "GEFÄNGNIS",
    roof: "#57534e",
    wall: "#44403c",
    shape: "one",
    rise: 1,
    sign: "#f97316",
  },
};

/**
 * What goes where, drawn from evenly.
 *
 * @remarks
 * Two thirds ordinary housing, one third places with a name. The list is the
 * mix: the more often a sort appears in it, the more of them the city has.
 *
 * The place in the row counts too. The block hash is quick rather than perfectly
 * flat - some rows come up four times as often as others - so the named places
 * are sorted into it on purpose: the barber in a thin row, the gun shops in a
 * fat one. A rare barber is a curiosity; a gun shop nobody can find is a shop
 * that is not there.
 *
 * Two of them are not drawn from this at all. See {@link ONE_ONLY}.
 */
export const THE_BLOCKS: readonly BuildingKind[] = [
  "house",
  "house",
  "house",
  "house",
  "house",
  "house",
  "double",
  "double",
  "double",
  "terrace",
  "terrace",
  "terrace",
  "tower",
  "tower",
  "hall",
  "mint",
  "police",
  "barber",
  "restaurant",
  "casino",
  "club",
  "fire",
  "guns",
  "bank",
  "hospital",
  "prison",
  "market",
];

/**
 * Which sort of building fills a given block.
 *
 * @param roll - that block's own dice roll, between zero and one
 * @returns the sort it holds, the same one every time
 */
export function blockAt(roll: number): Building {
  const at = Math.min(
    THE_BLOCKS.length - 1,
    Math.floor(roll * THE_BLOCKS.length),
  );
  return BUILDINGS[THE_BLOCKS[at] ?? "house"];
}

/**
 * What stands in the block at these block coordinates.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns the sort of building, the same one every time
 * @remarks
 * Both the renderer and the city need this: one to paint the roof and the sign,
 * the other to know where the night club is so that somebody can stand outside
 * it. It lives here, in the table, so that the two can never disagree about
 * what is on a corner.
 */
export function buildingAt(blockX: number, blockY: number): Building {
  const drawn = rawKindAt(blockX, blockY);
  const spare = ONE_ONLY.includes(drawn) && !isTheOne(drawn, blockX, blockY);
  return BUILDINGS[spare ? "house" : drawn];
}

/**
 * The two there is exactly one of in Los Santos.
 *
 * @remarks
 * A bank on every third corner is a cash machine; one bank is a place. The same
 * goes double for the printing works, which is the biggest job in the city and
 * has to be a landmark rather than a chain. Wherever else the plan would have
 * put one, an ordinary house goes up instead - so the city keeps its shape and
 * only the sign over one door is different.
 *
 * Both are marked on the map, because a single building in four thousand blocks
 * that one has to stumble over is a building nobody ever finds.
 */
const ONE_ONLY: readonly BuildingKind[] = ["bank", "mint"];

/**
 * Whether a block is a green one rather than houses.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns true where a park goes
 * @remarks
 * Every third block on a rhythm, so that the city has lungs without anybody
 * having to place them. It lives here rather than in ./city because it answers
 * the same question the table above does - what is in this block - and the two
 * must not be able to disagree. The floor asks it to lay out grass; the sign
 * over the door asks it because a name on an empty lawn is a name on nothing.
 */
export function greenBlock(blockX: number, blockY: number): boolean {
  return (
    (blockX + blockY * 2) % PARK_EVERY === 0 && (blockX + blockY) % 2 === 0
  );
}

/** Every third block is a park rather than houses, on this rhythm. */
const PARK_EVERY = 3;

/**
 * Whether a square is on land at all.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true inside one of the three cities
 * @remarks
 * The floor asks it to decide between tarmac and sea; the table above asks it
 * because a block in the water holds nothing - and a night club out there
 * would put its whole queue in the sea.
 */
export function inCity(col: number, row: number): boolean {
  // The airfield is inside Los Santos and is not part of it: a terminal with
  // a row of terraced houses down the middle of the runway is not an airport.
  const flying =
    col >= AIRPORT.left &&
    col <= AIRPORT.right &&
    row >= AIRPORT.top &&
    row <= AIRPORT.bottom;
  return (
    !flying &&
    ISLANDS.some(
      (isle) =>
        col >= isle.left &&
        col <= isle.right &&
        row >= isle.top &&
        row <= isle.bottom,
    )
  );
}

/**
 * Whether anything is built on a block at all.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns false for the parks and for the sand and water along the south edge
 * @remarks
 * The plan deals a sort of building to every block in the grid, including the
 * ones that turn out to be a lawn or a beach. Whoever wants a door has to ask
 * this first: a quarter of the addresses in town are otherwise a name on a
 * piece of grass, and standing in front of one used to open a gun shop.
 */
export function builtBlock(blockX: number, blockY: number): boolean {
  const left = blockX * BLOCK_TILES;
  const top = blockY * BLOCK_TILES;
  const dry =
    inCity(left, top) && inCity(left + BLOCK_TILES - 1, top + BLOCK_TILES - 1);
  return !greenBlock(blockX, blockY) && dry;
}

/** What the plan would put on a block, before the two rare ones are thinned. */
function rawKindAt(blockX: number, blockY: number): BuildingKind {
  return blockAt(roll(blockY + SHIFT_DOWN, blockX - SHIFT_ACROSS)).kind;
}

/** Whether this block is the one that keeps its sign. */
function isTheOne(kind: BuildingKind, blockX: number, blockY: number): boolean {
  const one = theOne(kind);
  return one !== null && one.x === blockX && one.y === blockY;
}

/**
 * Which block keeps it: the one nearest the middle of town.
 *
 * @param kind - one of {@link ONE_ONLY}
 * @returns the block, or null if the plan drew none at all
 * @remarks
 * Nearest the middle rather than first in reading order, so that the one bank
 * in the city is somewhere one passes anyway - and only where there is anything
 * built at all: the plan draws blocks for the parks and the beach as well, and
 * a sign over a door needs a door under it. Worked out once and remembered; it
 * is the same city every time, and the map asks on every frame.
 */
function theOne(kind: BuildingKind): Vec | null {
  const known = ONLY_BLOCKS.get(kind);
  if (known !== undefined) {
    return known;
  }
  const blocks = CITY_TILES / BLOCK_TILES;
  const middle = blocks / 2;
  let best: Vec | null = null;
  let bestAway = Number.POSITIVE_INFINITY;
  for (let blockY = 0; blockY < blocks; blockY += 1) {
    for (let blockX = 0; blockX < blocks; blockX += 1) {
      const away = Math.hypot(blockX - middle, blockY - middle);
      if (
        rawKindAt(blockX, blockY) === kind &&
        builtBlock(blockX, blockY) &&
        away < bestAway
      ) {
        best = { x: blockX, y: blockY };
        bestAway = away;
      }
    }
  }
  ONLY_BLOCKS.set(kind, best);
  return best;
}

/** The answers to {@link theOne}, once each. */
const ONLY_BLOCKS = new Map<BuildingKind, Vec | null>();

/* The block is asked twice about itself - once for what it is, once for how
   tall it builds - and the two answers must not be the same draw. Shifting the
   coordinates before the hash is what pulls them apart. */

/** How far the row is shifted before it is hashed. */
const SHIFT_DOWN = 41;

/** And the column. */
const SHIFT_ACROSS = 17;

/**
 * A number between 0 and 1 that is always the same for the same pair.
 *
 * @param one - any number
 * @param two - any other
 * @returns that pair's own private dice roll
 */
function roll(one: number, two: number): number {
  const spun = Math.sin(one * SPIN_ONE + two * SPIN_TWO) * SPIN_WIDE;
  return spun - Math.floor(spun);
}

/* The three numbers of the usual one-line hash: two to mix the coordinates
   with, one to blow the result up before the fractional part is taken. They
   mean nothing on their own - only that the same pair always lands in the same
   place. */

/** How much the first coordinate is turned by. */
const SPIN_ONE = 12.9898;

/** And the second. */
const SPIN_TWO = 78.233;

/** How far the sine is stretched before the decimals are kept. */
const SPIN_WIDE = 43758.5453;
