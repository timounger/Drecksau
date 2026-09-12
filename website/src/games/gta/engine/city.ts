/**
 * Laying out Los Santos: streets, blocks, the beach and the four districts.
 *
 * @module
 * @remarks
 * A grid city, because a grid is what a top-down car game needs: every corner
 * is a decision, and a chase has somewhere to go. The blocks between the
 * streets are buildings with a pavement around them, so a person on foot always
 * has a way past and a car always has a kerb to mount.
 *
 * **Three cities, not one.** They stand in the sea with water between them and
 * are joined by three bridges; a railway runs a great rectangle through all
 * three, over the water on its own crossings. Motorways are the same streets as
 * the others, three lanes wide instead of one - every fourth line of the grid.
 * All of it comes out of the coordinates: there is no map file, and the same
 * square is the same thing for ever.
 *
 * The city is the same every time. A city that reshuffled itself would take
 * away the one thing that makes an open world an open world - that after an
 * hour you know where you are.
 */
import {
  AIRPORT,
  BASE,
  BASE_GATE,
  BASE_HUTS,
  FARMS,
  FIELDS,
  MOUNTAIN,
  BLOCK_TILES,
  DESERT,
  HARBOUR,
  ISLANDS,
  LAND,
  PIERS,
  RUNWAY,
  CITY_TILES,
  TILE,
  type Cell,
  type District,
  type Island,
  type Vec,
} from "./types";
import {
  buildingAt,
  builtBlock,
  greenBlock,
  inCity,
  type BuildingKind,
} from "./buildings";

/** How many cells of a block are pavement on each side. */
const WALK_RING = 1;

/** Where the door of a block is, across it: the middle of its three houses. */
const DOOR_ACROSS = 3.5;

/** And down: the pavement south of the front wall. */
const DOOR_DOWN = 5.5;

/**
 * Builds the city floor.
 *
 * @returns one cell per grid square, row by row
 */
export function createCity(): readonly Cell[] {
  const cells: Cell[] = [];
  for (let row = 0; row < CITY_TILES; row += 1) {
    for (let col = 0; col < CITY_TILES; col += 1) {
      cells.push(cellAt(col, row));
    }
  }
  return cells;
}

/**
 * What one square of San Andreas is.
 *
 * @remarks
 * The order of the questions is the order the map was drawn in. The railway
 * goes down first because it crosses everything; then the country roads, which
 * are bridges wherever they leave the land; then the airport and the piers,
 * the beach, and the built-up grid of a city. Only what is left over is
 * landscape - sea, desert, woodland, meadow.
 */
function cellAt(col: number, row: number): Cell {
  let cell: Cell;
  if (onRail(col, row)) {
    cell = "rail";
  } else if (onRoute(col, row)) {
    cell = "road";
  } else if (onTrack(col, row)) {
    cell = "dirt";
  } else if (FARMS.some((farm) => inBox(farm, col, row))) {
    cell = "building";
  } else if (inBox(AIRPORT, col, row)) {
    cell = inBox(RUNWAY, col, row) ? "runway" : "dock";
  } else if (onFence(col, row)) {
    cell = "fence";
  } else if (BASE_HUTS.some((hut) => inBox(hut, col, row))) {
    cell = "building";
  } else if (inBox(BASE, col, row)) {
    // Inside the wire, the gate included: concrete, and one drives straight
    // in. What stops anybody is not the ground, it is the ten men on it.
    cell = "dock";
  } else if (onPier(col, row)) {
    cell = "dock";
  } else if (inBox(HARBOUR, col, row) && onLand(col, row)) {
    // Before the beach: the docks are a tongue of land with water on three
    // sides, and asked in the other order the whole quay would be sand.
    cell = "dock";
  } else if (onShore(col, row)) {
    cell = "sand";
  } else if (inCity(col, row)) {
    cell = inTown(col, row);
  } else if (!onLand(col, row)) {
    cell = "water";
  } else if (inBox(DESERT, col, row)) {
    cell = "sand";
  } else if (onMountain(col, row)) {
    cell = "rock";
  } else if (FIELDS.some((field) => inBox(field, col, row))) {
    cell = "field";
  } else {
    cell = wooded(col, row) ? "forest" : "park";
  }
  return cell;
}

/** The built-up part: streets, pavements, parks and blocks. */
function inTown(col: number, row: number): Cell {
  let cell: Cell;
  if (isRoad(col) || isRoad(row)) {
    cell = "road";
  } else if (nextToRoad(col) || nextToRoad(row)) {
    cell = "walk";
  } else if (
    greenBlock(Math.floor(col / BLOCK_TILES), Math.floor(row / BLOCK_TILES))
  ) {
    cell = "park";
  } else {
    cell = "building";
  }
  return cell;
}

/**
 * Whether this line of the grid is a street.
 *
 * @remarks
 * Every sixth line, as before - and every fourth of **those** is a motorway,
 * which is the same street with a lane either side of it. That is all a
 * motorway is here: three squares of tarmac instead of one, so it reads as a
 * fast road from two blocks away and a chase down one has room to overtake.
 */
function isRoad(at: number): boolean {
  return at % BLOCK_TILES === 0 || motorwayNear(at);
}

/** Whether a line is one of the wide ones. */
function isMotorway(at: number): boolean {
  return at % (BLOCK_TILES * MOTORWAY_EVERY) === 0;
}

/** Whether this square is one of the extra lanes of a motorway. */
function motorwayNear(at: number): boolean {
  const step = BLOCK_TILES * MOTORWAY_EVERY;
  const into = ((at % step) + step) % step;
  return into <= MOTORWAY_HALF || into >= step - MOTORWAY_HALF;
}

/** Whether this line is the pavement beside a street. */
function nextToRoad(at: number): boolean {
  const into = at % BLOCK_TILES;
  return into <= WALK_RING || into >= BLOCK_TILES - WALK_RING;
}

/** Whether a square is inside a rectangle of the map. */
function inBox(box: Island, col: number, row: number): boolean {
  return (
    col >= box.left && col <= box.right && row >= box.top && row <= box.bottom
  );
}

/**
 * Whether a square is dry land.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true anywhere in the landmass, false out at sea
 * @remarks
 * The rectangles of {@link LAND} with a wandering edge on top of them: each
 * side of each one is pushed in or out by a couple of squares, by where one is
 * looking rather than at random, so a coast has bays and headlands and is
 * still the same coast every time. Only the wild stretches wander - a city
 * with a chewed edge would put somebody's front room in the sea.
 */
function onLand(col: number, row: number): boolean {
  const span = CITY_TILES + LAND_PAD * 2;
  const spare =
    col >= -LAND_PAD &&
    row >= -LAND_PAD &&
    col < CITY_TILES + LAND_PAD &&
    row < CITY_TILES + LAND_PAD;
  const at = (row + LAND_PAD) * span + (col + LAND_PAD);
  const known = spare ? (LAND_MEMO[at] ?? UNKNOWN) : UNKNOWN;
  let dry: boolean;
  if (known === UNKNOWN) {
    dry = dryAt(col, row);
    if (spare) {
      LAND_MEMO[at] = dry ? 1 : 0;
    }
  } else {
    dry = known === 1;
  }
  return dry;
}

/** The same question, actually asked. */
function dryAt(col: number, row: number): boolean {
  const built = ISLANDS.some((city) => inBox(city, col, row));
  return LAND.some((box, at) => {
    const give = built ? 0 : SHORE_WANDER;
    return (
      col >= box.left - shoreShift(at, row, WEST) * give &&
      col <= box.right + shoreShift(at, row, EAST) * give &&
      row >= box.top - shoreShift(at, col, NORTH) * give &&
      row <= box.bottom + shoreShift(at, col, SOUTH) * give
    );
  });
}

/**
 * How far one side of one rectangle has wandered here.
 *
 * @param box - which rectangle
 * @param along - the square along that side
 * @param side - which of the four sides
 * @returns a share of {@link SHORE_WANDER}, from nothing to all of it
 */
function shoreShift(box: number, along: number, side: number): number {
  return hash(box * SIDES + side, Math.floor(along / SHORE_STEP));
}

/** Whether a square is beach: land, with the sea a step or two away. */
function onShore(col: number, row: number): boolean {
  let sand = false;
  if (onLand(col, row)) {
    for (let down = -SAND_RING; down <= SAND_RING && !sand; down += 1) {
      for (let across = -SAND_RING; across <= SAND_RING && !sand; across += 1) {
        sand = !onLand(col + across, row + down);
      }
    }
  }
  return sand;
}

/**
 * Whether a square is part of the fence round the military base.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true on the wire, false in the gateway and everywhere else
 */
function onFence(col: number, row: number): boolean {
  const edge =
    col === BASE.left ||
    col === BASE.right ||
    row === BASE.top ||
    row === BASE.bottom;
  const gate =
    row === BASE.bottom && col >= BASE_GATE.left && col <= BASE_GATE.right;
  return inBox(BASE, col, row) && edge && !gate;
}

/**
 * Whether a square is on the mountain in the south-west.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true anywhere on the stone
 * @remarks
 * A circle with a wandering edge, by the same hash the coast uses: a mountain
 * with a compass-drawn foot would look like a roundabout.
 */
function onMountain(col: number, row: number): boolean {
  const out = Math.hypot(col - MOUNTAIN.x, row - MOUNTAIN.y);
  const ragged =
    hash(Math.round(col / MOUNTAIN_PATCH), Math.round(row / MOUNTAIN_PATCH)) *
    MOUNTAIN_EDGE;
  return out < MOUNTAIN.radius - ragged;
}

/** How far the foot of the mountain wanders in and out, in squares. */
const MOUNTAIN_EDGE = 3;

/** And over how many squares it wanders by the same amount. */
const MOUNTAIN_PATCH = 3;

/** Whether a square is one of the piers out into the water. */
function onPier(col: number, row: number): boolean {
  return PIERS.some((pier) => inBox(pier, col, row));
}

/** Whether woodland rather than meadow stands here. */
function wooded(col: number, row: number): boolean {
  return (
    hash(Math.floor(col / WOOD_PATCH), Math.floor(row / WOOD_PATCH)) >
    WOOD_SHARE
  );
}

/**
 * A number between nothing and one, the same for the same two numbers.
 *
 * @param across - anything
 * @param down - anything else
 * @returns their hash, spread evenly over nought to one
 * @remarks
 * The landscape has to be irregular, and it has to be the same irregular every
 * time the game is opened - which is exactly what a hash of the coordinates
 * is. There is no seed here: the map is not generated, it is a formula.
 */
function hash(across: number, down: number): number {
  const mixed = Math.sin(across * HASH_A + down * HASH_B) * HASH_C;
  return mixed - Math.floor(mixed);
}

/** Whether a square is part of a country road. */
function onRoute(col: number, row: number): boolean {
  return ROADS.some((road) =>
    road.points.some((point, at) => {
      const next = road.points[at + 1];
      return (
        next !== undefined &&
        awayFromLeg(col + HALF, row + HALF, point, next) <= road.wide / 2
      );
    }),
  );
}

/**
 * How far a point is from one leg of a road.
 *
 * @param x - the point, in squares
 * @param y - the point, in squares
 * @param from - one end of the leg
 * @param to - the other
 * @returns the distance, in squares
 */
function awayFromLeg(x: number, y: number, from: Vec, to: Vec): number {
  const runX = to.x - from.x;
  const runY = to.y - from.y;
  const length = runX * runX + runY * runY;
  const raw =
    length === 0 ? 0 : ((x - from.x) * runX + (y - from.y) * runY) / length;
  const along = Math.max(0, Math.min(1, raw));
  return Math.hypot(x - (from.x + runX * along), y - (from.y + runY * along));
}

/**
 * A line through a handful of points, bent into a curve.
 *
 * @param points - the corners the road is meant to pass
 * @returns many more points, on a smooth line through all of them
 * @remarks
 * Catmull-Rom: every leg is drawn with an eye on the point before it and the
 * point after it, which is what turns five corners into a road that sweeps.
 * Outside the cities nothing is straight, and this is why.
 */
function bend(points: readonly Vec[]): readonly Vec[] {
  const many: Vec[] = [];
  for (let at = 0; at < points.length - 1; at += 1) {
    const before = points[Math.max(0, at - 1)];
    const from = points[at];
    const to = points[at + 1];
    const after = points[Math.min(points.length - 1, at + 2)];
    const whole =
      before !== undefined &&
      from !== undefined &&
      to !== undefined &&
      after !== undefined;
    for (let part = 0; whole && part < BEND_PARTS; part += 1) {
      many.push(spline(before, from, to, after, part / BEND_PARTS));
    }
  }
  const last = points[points.length - 1];
  return last === undefined ? many : [...many, last];
}

/** One point of that curve. */
function spline(before: Vec, from: Vec, to: Vec, after: Vec, at: number): Vec {
  const square = at * at;
  const cube = square * at;
  /* eslint-disable @typescript-eslint/no-magic-numbers -- the weights of a
     Catmull-Rom spline. They are the formula; naming them would name nothing. */
  const pull = (a: number, b: number, c: number, d: number) =>
    HALF *
    (2 * b +
      (c - a) * at +
      (2 * a - 5 * b + 4 * c - d) * square +
      (3 * b - a - 3 * c + d) * cube);
  /* eslint-enable @typescript-eslint/no-magic-numbers */
  return {
    x: pull(before.x, from.x, to.x, after.x),
    y: pull(before.y, from.y, to.y, after.y),
  };
}

/** Whether a square is part of the railway. */
function onRail(col: number, row: number): boolean {
  const loop = RAIL;
  const onSide =
    (col === loop.left || col === loop.right) &&
    row >= loop.top &&
    row <= loop.bottom;
  const onEnd =
    (row === loop.top || row === loop.bottom) &&
    col >= loop.left &&
    col <= loop.right;
  return onSide || onEnd;
}

/** How many squares of sand lie inside each shore. */
const SAND_RING = 2;

/** How far beyond the map the coast is remembered, in squares. */
const LAND_PAD = 4;

/** What stands in the memory for a square nobody has asked about. */
const UNKNOWN = -1;
/**
 * What is known about each square: sea, land, or not asked yet.
 *
 * @remarks
 * The beach looks two squares in every direction for water, so without this
 * every square of San Andreas would have its coastline worked out
 * twenty-five times over - and the coastline is the most expensive question on
 * the map. The answer never changes, so it is kept.
 */
const LAND_MEMO = new Int8Array((CITY_TILES + LAND_PAD * 2) ** 2).fill(UNKNOWN);

/** How far a wild coast may wander in or out, in squares. */
const SHORE_WANDER = 3;

/** And how long a stretch of it wanders by the same amount. */
const SHORE_STEP = 5;

/** A rectangle has four of them. */
const SIDES = 4;

/** The left one. */
const WEST = 0;

/** The right one. */
const EAST = 1;

/** The top one. */
const NORTH = 2;

/** And the bottom one. */
const SOUTH = 3;

/** How big a patch of one sort of green is, in squares. */
const WOOD_PATCH = 7;

/** How much of the countryside is wood rather than meadow. */
const WOOD_SHARE = 0.45;

/** The first of the three numbers the hash is stirred with. */
const HASH_A = 12.9898;

/** The second of them. */
const HASH_B = 78.233;

/** And the third, which is only large. */
const HASH_C = 43758.5453;

/** The middle of a square. */
const HALF = 0.5;

/** How many pieces each leg of a country road is bent into. */
const BEND_PARTS = 6;

/** Every fourth street is a motorway. */
const MOTORWAY_EVERY = 4;

/**
 * How many lanes a motorway has either side of its middle.
 *
 * @remarks
 * Two, so a motorway is five squares of tarmac across - wide enough that two
 * cars side by side still leave room for a third to come past, and wide enough
 * to read as a motorway from the far side of a block.
 */
const MOTORWAY_HALF = 2;

/** One country road: the corners it passes and how wide it is, in squares. */
type Route = {
  readonly wide: number;
  readonly points: readonly Vec[];
};

/** Whether a square is on the track up the mountain. */
function onTrack(col: number, row: number): boolean {
  return TRACKS.some((track) =>
    track.points.some((point, at) => {
      const next = track.points[at + 1];
      return (
        next !== undefined &&
        awayFromLeg(col + HALF, row + HALF, point, next) <= track.wide / 2
      );
    }),
  );
}

/**
 * The tracks: dirt rather than tarmac.
 *
 * @remarks
 * One of them, and it is the only way up the mountain - it starts on the road
 * along the south coast and winds anticlockwise to the top, which is what a
 * road up a hill does when it cannot go straight up.
 */
const TRACK_LINES: readonly Route[] = [
  {
    wide: 3,
    points: [
      { x: 22, y: 152 },
      { x: 12, y: 146 },
      { x: 9, y: 136 },
      { x: 14, y: 126 },
      { x: 26, y: 122 },
      { x: 36, y: 128 },
      { x: 36, y: 138 },
      { x: 28, y: 144 },
      { x: 20, y: 140 },
      { x: 19, y: 132 },
      { x: 24, y: 134 },
    ],
  },
];

/** The same, bent into curves once. */
const TRACKS: readonly Route[] = TRACK_LINES.map((track) => ({
  wide: track.wide,
  points: bend(track.points),
}));

/**
 * The roads between the cities.
 *
 * @remarks
 * Nothing here is straight and nothing here is on the grid: these are the lines
 * on the map that sweep round a hill, cut the desert on the diagonal and cross
 * the bay on a bridge. The grid belongs to the cities and stops at the last
 * street sign.
 *
 * Where one of them leaves the land it does not stop - a road over water is a
 * bridge, and that is how every crossing in San Andreas is made.
 */
const ROUTES: readonly Route[] = [
  // Die Kuestenstrasse im Nordwesten: von San Fierro hinauf in den Wald.
  {
    wide: 5,
    points: [
      { x: 20, y: 46 },
      { x: 12, y: 32 },
      { x: 18, y: 16 },
      { x: 38, y: 10 },
      { x: 58, y: 14 },
    ],
  },
  // Quer durch die Wueste nach Las Venturas.
  {
    wide: 5,
    points: [
      { x: 58, y: 14 },
      { x: 76, y: 18 },
      { x: 92, y: 28 },
      { x: 106, y: 30 },
      { x: 116, y: 30 },
    ],
  },
  // Von San Fierro schraeg durch die Wueste nach Las Venturas.
  {
    wide: 5,
    points: [
      { x: 46, y: 60 },
      { x: 62, y: 56 },
      { x: 78, y: 48 },
      { x: 94, y: 44 },
      { x: 112, y: 42 },
    ],
  },
  // Die Landstrasse im Sueden: von Los Santos an den Hafen.
  {
    wide: 5,
    points: [
      { x: 96, y: 120 },
      { x: 84, y: 112 },
      { x: 74, y: 100 },
      { x: 68, y: 90 },
      { x: 58, y: 84 },
      { x: 48, y: 80 },
    ],
  },
  // Von Las Venturas hinunter nach Los Santos, am Ostufer entlang.
  {
    wide: 5,
    points: [
      { x: 138, y: 68 },
      { x: 144, y: 84 },
      { x: 138, y: 98 },
      { x: 130, y: 108 },
      { x: 124, y: 118 },
    ],
  },
  // Die Bruecke ueber die Meerenge, von San Fierro nach Sueden.
  {
    wide: 5,
    points: [
      { x: 22, y: 90 },
      { x: 22, y: 102 },
      { x: 24, y: 112 },
    ],
  },
  // Die Runde um den Berg im Suedwesten.
  {
    wide: 3,
    points: [
      { x: 24, y: 112 },
      { x: 14, y: 128 },
      { x: 20, y: 150 },
      { x: 42, y: 154 },
      { x: 58, y: 150 },
      { x: 68, y: 142 },
      { x: 80, y: 134 },
      { x: 92, y: 128 },
    ],
  },
  // Die Zufahrt zum Militaergelaende, bis vors Tor und keinen Meter weiter.
  {
    wide: 5,
    points: [
      { x: 69, y: 53 },
      { x: 69, y: 49 },
      { x: 68, y: 45 },
    ],
  },
  // Und die Piste durch die Wueste nach Sueden.
  {
    wide: 3,
    points: [
      { x: 80, y: 30 },
      { x: 86, y: 52 },
      { x: 88, y: 72 },
      { x: 94, y: 92 },
      { x: 98, y: 110 },
    ],
  },
];

/** The same roads, bent into curves once and for all. */
const ROADS: readonly Route[] = ROUTES.map((route) => ({
  wide: route.wide,
  points: bend(route.points),
}));

/**
 * The squares of a block that are actually built on.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns its built rectangle in squares, the far edges exclusive
 * @remarks
 * Used to be three squares in the middle of every six, and that was true for
 * as long as every street was one square wide. A motorway is five, and it
 * takes its extra lanes out of the blocks either side of it - so a house drawn
 * to the old rule stood in the outside lane.
 *
 * Now the picture asks the same two questions the floor asks - is this line a
 * street, is it a pavement - and builds on what is left. A block beside a
 * motorway simply gets a smaller house, which is what happens when a motorway
 * is put through a neighbourhood.
 */
export function builtPlot(
  blockX: number,
  blockY: number,
): { left: number; top: number; right: number; bottom: number } {
  const across = builtSpan(blockX);
  const down = builtSpan(blockY);
  return {
    left: blockX * BLOCK_TILES + across.from,
    top: blockY * BLOCK_TILES + down.from,
    right: blockX * BLOCK_TILES + across.to + 1,
    bottom: blockY * BLOCK_TILES + down.to + 1,
  };
}

/** Which squares of one block, along one axis, are neither road nor pavement. */
function builtSpan(block: number): { from: number; to: number } {
  let from = BLOCK_TILES;
  let to = -1;
  for (let into = 0; into < BLOCK_TILES; into += 1) {
    const at = block * BLOCK_TILES + into;
    if (!isRoad(at) && !nextToRoad(at)) {
      from = Math.min(from, into);
      to = Math.max(to, into);
    }
  }
  return { from, to };
}

/**
 * The country roads, as the smooth lines they were bent from.
 *
 * @returns each road with its width in squares and its points, in squares
 * @remarks
 * The floor answers *where one may drive* in squares of forty-eight pixels,
 * and a curve laid into squares that size is a staircase. So the picture does
 * not use the floor for these: it strokes **this**, the same curve, as one
 * smooth line. Squares decide, the line is what one sees - and because the
 * line is drawn a shade wider than the squares it covers, the staircase
 * disappears under it.
 *
 * The dirt tracks come back as well, so the renderer can tell tarmac from
 * gravel without a second table.
 */
export function roadLines(): readonly {
  readonly wide: number;
  readonly dirt: boolean;
  readonly points: readonly Vec[];
}[] {
  return [
    ...ROADS.map((road) => ({ ...road, dirt: false })),
    ...TRACKS.map((track) => ({ ...track, dirt: true })),
  ];
}

/**
 * The railway: one great rectangle through all three cities.
 *
 * @remarks
 * Its lines fall on streets rather than through blocks, so the track runs down
 * the middle of a road instead of through somebody's front room - and where it
 * leaves the land it simply carries on over the water on its own bridge.
 */
const RAIL = { left: 24, right: 138, top: 24, bottom: 138 };

/** One stop on the line: where the train waits and one can get on. */
export type Station = {
  readonly name: string;
  /** Where the platform is, in squares. */
  readonly col: number;
  readonly row: number;
};

/**
 * The three of them, one to a city.
 *
 * @remarks
 * Each sits on the loop itself, which is what lets the train work out where to
 * stop from the same two numbers the platform is drawn from.
 */
export const STATIONS: readonly Station[] = [
  { name: "San Fierro", col: 24, row: 66 },
  { name: "Las Venturas", col: 126, row: 24 },
  { name: "Los Santos", col: 108, row: 138 },
];

/**
 * The cell at a point in the city.
 *
 * @param cells - the city floor
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns what is under it; outside the city counts as water
 */
export function cellUnder(cells: readonly Cell[], x: number, y: number): Cell {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  const inside = col >= 0 && row >= 0 && col < CITY_TILES && row < CITY_TILES;
  return inside ? cells[row * CITY_TILES + col] : "water";
}

/**
 * Whether a point can be stood on at all.
 *
 * @param cells - the city floor
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns true for anything but a building or the sea
 */
export function isOpen(cells: readonly Cell[], x: number, y: number): boolean {
  const cell = cellUnder(cells, x, y);
  // Wire is a wall. One can see the tank through it, which is the whole point
  // of a fence rather than a hoarding - but nobody drives through it.
  return cell !== "building" && cell !== "water" && cell !== "fence";
}

/**
 * Whether a point is on the tarmac.
 *
 * @param cells - the city floor
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns true on a street
 */
export function isRoadAt(
  cells: readonly Cell[],
  x: number,
  y: number,
): boolean {
  return cellUnder(cells, x, y) === "road";
}

/**
 * The middle of the nearest street crossing.
 *
 * @param x - a point in the city, in pixels
 * @param y - a point in the city, in pixels
 * @returns the crossing a car would aim for
 */
export function nearestCrossing(x: number, y: number): Vec {
  const step = BLOCK_TILES * TILE;
  return {
    x: Math.round(x / step) * step + TILE / 2,
    y: Math.round(y / step) * step + TILE / 2,
  };
}

/**
 * The pavement in front of every building of one sort.
 *
 * @param kind - the sort of building to look for
 * @returns one point per block, on the street side of its door
 * @remarks
 * The city plan is the same every time, so this is a fixed list rather than a
 * search that has to be repeated: whoever wants to stand outside the night club
 * asks once at the start and remembers the answer.
 *
 * Only blocks that are actually built on count. The plan deals a sort to every
 * square of the grid, the parks and the beach included, and a door in front of
 * a lawn is a shop that cannot be seen and a hospital one wakes up beside
 * rather than in.
 */
export function doorsOf(kind: BuildingKind): readonly Vec[] {
  const blocks = CITY_TILES / BLOCK_TILES;
  const doors: Vec[] = [];
  for (let blockY = 0; blockY < blocks; blockY += 1) {
    for (let blockX = 0; blockX < blocks; blockX += 1) {
      if (
        buildingAt(blockX, blockY).kind === kind &&
        builtBlock(blockX, blockY)
      ) {
        // The middle of the block, one cell south of its front wall: the
        // pavement people would actually stand on.
        doors.push({
          x: (blockX * BLOCK_TILES + DOOR_ACROSS) * TILE,
          y: (blockY * BLOCK_TILES + DOOR_DOWN) * TILE,
        });
      }
    }
  }
  return doors;
}

/**
 * The garage: the square a car comes to rest in, two deep into the house.
 *
 * @param garage - the pavement outside the door, as the game stores it
 * @returns the middle of the far square of the bay
 * @remarks
 * Two squares deep, because the door has to have something to shut **behind**.
 * With a one-square garage a car parked in the doorway could always drive
 * straight back out of the shut door - whatever is already inside a wall is
 * allowed to move out of it, and that rule is what keeps anybody from being
 * stuck in scenery for good.
 */
export function garageBay(garage: Vec): Vec {
  return { x: garage.x, y: garage.y - TILE * 2 };
}

/**
 * The square under the door itself.
 *
 * @param garage - the pavement outside the door
 * @returns the middle of the doorway square
 * @remarks
 * Open while the door is up, part of the house while it is down.
 */
export function garageMouth(garage: Vec): Vec {
  return { x: garage.x, y: garage.y - TILE };
}

/**
 * The city floor with the garage hollowed out of the house.
 *
 * @param cells - the floor as the plan laid it out
 * @param garage - the pavement outside the door
 * @returns the same floor with the far square of the bay open
 * @remarks
 * Done once, when the game is made. The square under the door is left to
 * {@link setGarage}, which opens and shuts it with the door.
 */
export function openBay(cells: readonly Cell[], garage: Vec): readonly Cell[] {
  return cellSet(cells, garageBay(garage), "walk");
}

/**
 * The city floor with the garage door open or shut.
 *
 * @param cells - the floor as it stands
 * @param garage - the pavement outside the door
 * @param open - whether the door is up
 * @returns a floor in which the doorway is a way in or a wall again
 * @remarks
 * The door is not painted on: while it is down, the square under it **is**
 * part of the house, and everything that asks the floor whether it may go
 * somewhere gets the same answer as the eye. That is what makes being shut in
 * for the length of a respray a fact rather than a picture.
 */
export function setGarage(
  cells: readonly Cell[],
  garage: Vec,
  open: boolean,
): readonly Cell[] {
  return cellSet(cells, garageMouth(garage), open ? "walk" : "building");
}

/** One square of the floor, changed. */
function cellSet(cells: readonly Cell[], at: Vec, cell: Cell): readonly Cell[] {
  const floor = [...cells];
  floor[Math.floor(at.y / TILE) * CITY_TILES + Math.floor(at.x / TILE)] = cell;
  return floor;
}

/**
 * One house of your own in every city.
 *
 * @param start - where the day begins, which decides nothing but the order
 * @returns the pavement outside each of the three garages
 * @remarks
 * Three cities, three front doors. Whichever one is nearest is the one the
 * door opens for - see `homeOf` in ./engine - so a chase in Las Venturas can
 * end in a garage in Las Venturas rather than in a ferry queue.
 */
export function myHouses(): readonly Vec[] {
  const doors = doorsOf("house");
  return ISLANDS.map((isle) => {
    const middle = {
      x: ((isle.left + isle.right) / 2) * TILE,
      y: ((isle.top + isle.bottom) / 2) * TILE,
    };
    let best = doors[0] ?? middle;
    let bestAway = Number.POSITIVE_INFINITY;
    for (const door of doors) {
      const inside =
        door.x > isle.left * TILE &&
        door.x < isle.right * TILE &&
        door.y > isle.top * TILE &&
        door.y < isle.bottom * TILE;
      const away = Math.hypot(door.x - middle.x, door.y - middle.y);
      if (inside && away < bestAway) {
        best = door;
        bestAway = away;
      }
    }
    return best;
  });
}

/**
 * Whether a line of the grid is one of the wide roads.
 *
 * @param at - a column or a row
 * @returns true on the middle line of a motorway
 * @remarks
 * The picture asks: a motorway gets the dashes down the middle and the others
 * do not, which is the only thing that tells them apart from three ordinary
 * streets side by side.
 */
export function motorwayLine(at: number): boolean {
  return isMotorway(at);
}

/**
 * The rectangle the railway runs round.
 *
 * @returns its four sides, in squares
 * @remarks
 * The train needs the same four lines the floor was laid from, so there is one
 * answer and both read it.
 */
export function railLoop(): {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
} {
  return RAIL;
}

/**
 * Which district a point belongs to.
 *
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns the quarter of town it lies in
 * @remarks
 * Four quarters, cut down the middle of the map: the beach along the south
 * belongs to whichever half it lies under, because a strip of sand is not a
 * neighbourhood anybody fights over.
 */
export function districtAt(x: number, y: number): District {
  const half = (CITY_TILES * TILE) / 2;
  let district: District;
  if (y > half) {
    district = x < half ? "beach" : "vagos";
  } else {
    district = x < half ? "grove" : "ballas";
  }
  return district;
}

/**
 * A point somewhere in the middle of a district.
 *
 * @param district - which quarter
 * @returns a point a marker can be put near
 */
export function districtCentre(district: District): Vec {
  const half = (CITY_TILES * TILE) / 2;
  const quarter = half / 2;
  const spots: Readonly<Record<District, Vec>> = {
    grove: { x: quarter, y: quarter },
    ballas: { x: half + quarter, y: quarter },
    beach: { x: quarter, y: half + quarter },
    vagos: { x: half + quarter, y: half + quarter },
  };
  return spots[district];
}
