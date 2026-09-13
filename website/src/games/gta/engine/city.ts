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
  LIGHT_AMBER,
  LIGHT_PHASE,
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
  BUILDINGS,
  THE_BLOCKS,
  type Building,
  type BuildingKind,
} from "./buildings";

/** How many cells of a block are pavement on each side. */
const WALK_RING = 1;

/** Where the door of a block is, across it: the middle of its houses. */
const DOOR_ACROSS = 4.5;

/** And down: the pavement south of the front wall. */
const DOOR_DOWN = 6.5;

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
  } else if (onCarPark(col, row)) {
    // The tarmac round the supermarket, which is where its own pavement would
    // otherwise be. Concrete rather than road: it is not part of the street
    // grid, so the traffic never turns on to it and nobody on foot treats
    // crossing it as crossing a road.
    cell = "dock";
  } else if (nextToRoad(col) || nextToRoad(row)) {
    cell = "walk";
  } else if (
    !builtBlock(Math.floor(col / BLOCK_TILES), Math.floor(row / BLOCK_TILES))
  ) {
    // A block with nothing on it is open ground, and the floor has to say so.
    // The plan decides what is built - parks, the blocks the railway curves
    // through, the half blocks along the shore - and if the floor disagreed
    // one would walk into a wall that is not drawn anywhere.
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
  const into = ((at % BLOCK_TILES) + BLOCK_TILES) % BLOCK_TILES;
  return (
    into <= ROAD_HALF || into >= BLOCK_TILES - ROAD_HALF || motorwayNear(at)
  );
}

/**
 * How many squares of tarmac lie either side of an ordinary street line.
 *
 * @remarks
 * One, so a street is three squares - a lane and a half each way. At one
 * square the whole carriageway was two car widths and nothing could pass
 * anything. A motorway is still wider: see {@link MOTORWAY_HALF}.
 */
const ROAD_HALF = 1;

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
  const into = ((at % BLOCK_TILES) + BLOCK_TILES) % BLOCK_TILES;
  return (
    into <= ROAD_HALF + WALK_RING || into >= BLOCK_TILES - ROAD_HALF - WALK_RING
  );
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
 * Which way the country road runs at a point, if one runs there at all.
 *
 * @param x - the point, in pixels
 * @param y - the point, in pixels
 * @returns the heading of the nearest stretch of road, or null off the roads
 * @remarks
 * Out of town the roads sweep, and a driver who only knows north, south, east
 * and west drives a curve as a zigzag - two seconds one way, two seconds the
 * other, all the way along it. The road itself knows which way it goes at
 * every point: it is the same polyline the tarmac was laid from, and the
 * nearest leg of it is the answer.
 */
export function routeHeading(x: number, y: number): number | null {
  const col = x / TILE;
  const row = y / TILE;
  let best: number | null = null;
  let bestAway = Number.POSITIVE_INFINITY;
  for (const road of ROADS) {
    road.points.forEach((point, at) => {
      const next = road.points[at + 1];
      if (next !== undefined) {
        const away = awayFromLeg(col, row, point, next);
        if (away < bestAway && away <= road.wide / 2) {
          best = Math.atan2(next.y - point.y, next.x - point.x);
          bestAway = away;
        }
      }
    });
  }
  return best;
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
  return railCells().has(cellKey(col, row));
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
      { x: 20, y: 39 },
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
      { x: 100, y: 30 },
      { x: 105, y: 30 },
    ],
  },
  // Von San Fierro schraeg durch die Wueste nach Las Venturas.
  {
    wide: 5,
    points: [
      { x: 50, y: 60 },
      { x: 62, y: 56 },
      { x: 78, y: 48 },
      { x: 94, y: 44 },
      { x: 105, y: 42 },
    ],
  },
  // Die Landstrasse im Sueden: von Los Santos an den Hafen.
  {
    wide: 5,
    points: [
      { x: 87, y: 114 },
      { x: 80, y: 106 },
      { x: 74, y: 100 },
      { x: 68, y: 90 },
      { x: 58, y: 84 },
      { x: 51, y: 80 },
    ],
  },
  // Von Las Venturas hinunter nach Los Santos, am Ostufer entlang.
  {
    wide: 5,
    points: [
      { x: 138, y: 69 },
      { x: 144, y: 84 },
      { x: 138, y: 98 },
      { x: 132, y: 105 },
    ],
  },
  // Die Bruecke ueber die Meerenge, von San Fierro nach Sueden.
  {
    wide: 5,
    points: [
      { x: 22, y: 99 },
      { x: 22, y: 104 },
      { x: 24, y: 112 },
    ],
  },
  // Die Runde um den Berg im Suedwesten - und zwar wirklich um ihn herum.
  // Sie fuehrte quer ueber den Fels; eine Landstrasse klettert aber nicht auf
  // einen Berg, dafuer ist die Piste da.
  {
    wide: 3,
    points: [
      { x: 24, y: 112 },
      { x: 9, y: 122 },
      { x: 9, y: 146 },
      { x: 28, y: 157 },
      { x: 52, y: 153 },
      { x: 68, y: 142 },
      { x: 80, y: 134 },
      { x: 87, y: 129 },
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
      { x: 96, y: 105 },
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
 * The railway: one great loop through all three cities.
 *
 * @remarks
 * Four straights on street lines, so the track runs down the middle of a road
 * instead of through somebody's front room - and where it leaves the land it
 * simply carries on over the water on its own bridge.
 *
 * Its bottom used to run along row 138, which took it straight over Mount
 * Chiliad. A railway does not climb a mountain; it goes round the foot of one
 * or through it in a tunnel, and there is no tunnel here. Row 114 clears the
 * rock by twenty squares and still crosses Los Santos.
 */
const RAIL = { left: 24, right: 136, top: 24, bottom: 112 };

/**
 * How wide the curve at each corner is, in squares.
 *
 * @remarks
 * Eighteen squares is the better part of nine hundred pixels - a radius a
 * train at this scale can take without the carriages folding up. Rail does not
 * do right angles: a ninety degree corner is a derailment, and drawn from
 * above it is the one thing that says this line was laid by a program.
 */
const RAIL_BEND = 18;

/** How finely the loop is walked when it is turned into squares, in squares. */
const RAIL_STEP = 0.2;

/**
 * The middle of the track, all the way round, in squares.
 *
 * @returns the points of the loop, clockwise from the top left corner, each one
 *   a fifth of a square from the next
 * @remarks
 * Straight, curve, straight, curve: the same shape one would draw with a ruler
 * and a pair of compasses. Everything else about the railway is read off this
 * one line - which squares are track, which way the sleepers lie on each of
 * them, where the train is after so many pixels, and where the platforms are.
 */
export function railLine(): readonly Vec[] {
  if (RAIL_LINE.length === 0) {
    const left = RAIL.left + HALF;
    const right = RAIL.right + HALF;
    const top = RAIL.top + HALF;
    const bottom = RAIL.bottom + HALF;
    const bend = RAIL_BEND;
    runStraight(
      RAIL_LINE,
      { x: left + bend, y: top },
      { x: right - bend, y: top },
    );
    runCurve(RAIL_LINE, { x: right - bend, y: top + bend }, -QUARTER, 0);
    runStraight(
      RAIL_LINE,
      { x: right, y: top + bend },
      { x: right, y: bottom - bend },
    );
    runCurve(RAIL_LINE, { x: right - bend, y: bottom - bend }, 0, QUARTER);
    runStraight(
      RAIL_LINE,
      { x: right - bend, y: bottom },
      { x: left + bend, y: bottom },
    );
    runCurve(
      RAIL_LINE,
      { x: left + bend, y: bottom - bend },
      QUARTER,
      HALF_TURN,
    );
    runStraight(
      RAIL_LINE,
      { x: left, y: bottom - bend },
      { x: left, y: top + bend },
    );
    runCurve(
      RAIL_LINE,
      { x: left + bend, y: top + bend },
      HALF_TURN,
      THREE_QUARTERS,
    );
  }
  return RAIL_LINE;
}

/** The loop, worked out once. */
const RAIL_LINE: Vec[] = [];

/** A quarter of a circle, which a corner of the loop is. */
const QUARTER = Math.PI / 2;

/** A half of one, and three quarters: the headings the four corners end on. */
const HALF_TURN = Math.PI;

/** The last corner, which comes back round to where the loop began. */
const THREE_QUARTERS = HALF_TURN + QUARTER;

/** One straight length of it, stepped out. */
function runStraight(into: Vec[], from: Vec, to: Vec): void {
  const long = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.round(long / RAIL_STEP));
  for (let step = 0; step < steps; step += 1) {
    const along = step / steps;
    into.push({
      x: from.x + (to.x - from.x) * along,
      y: from.y + (to.y - from.y) * along,
    });
  }
}

/** And one corner of it. */
function runCurve(into: Vec[], middle: Vec, from: number, to: number): void {
  const steps = Math.max(
    1,
    Math.round((Math.abs(to - from) * RAIL_BEND) / RAIL_STEP),
  );
  for (let step = 0; step < steps; step += 1) {
    const turn = from + ((to - from) * step) / steps;
    into.push({
      x: middle.x + Math.cos(turn) * RAIL_BEND,
      y: middle.y + Math.sin(turn) * RAIL_BEND,
    });
  }
}

/**
 * Which squares the track lies on, and which way it runs on each.
 *
 * @returns the squares, by {@link cellKey}, against the heading of the rail
 * @remarks
 * Walked once and remembered. The floor asks it of every square in San
 * Andreas, and the picture asks it again for every square on the screen, so
 * the one thing it must not be is a loop over nine hundred points.
 */
function railCells(): ReadonlyMap<number, number> {
  if (RAIL_CELLS.size === 0) {
    const line = railLine();
    line.forEach((point, at) => {
      const next = line[(at + 1) % line.length] ?? point;
      const col = Math.floor(point.x);
      const row = Math.floor(point.y);
      if (col >= 0 && row >= 0 && col < CITY_TILES && row < CITY_TILES) {
        RAIL_CELLS.set(
          cellKey(col, row),
          Math.atan2(next.y - point.y, next.x - point.x),
        );
      }
    });
  }
  return RAIL_CELLS;
}

/** The answer to that, once. */
const RAIL_CELLS = new Map<number, number>();

/** One square of the map, as a single number. */
function cellKey(col: number, row: number): number {
  return row * CITY_TILES + col;
}

/**
 * Which way the track runs across one square.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns the heading in radians, or zero where there is no track
 * @remarks
 * The picture needs it: sleepers lie across the rails, and on a curve that is
 * not one of four directions.
 */
export function railAngle(col: number, row: number): number {
  return railCells().get(cellKey(col, row)) ?? 0;
}

/**
 * Where a point so far along the loop is, and which way the track runs there.
 *
 * @param along - the distance from the top left corner, clockwise, in pixels
 * @returns the point in city pixels and the heading in radians
 */
export function railAt(along: number): { at: Vec; angle: number } {
  const line = railLine();
  const step = RAIL_STEP * TILE;
  const round = railLength();
  const gone = ((along % round) + round) % round;
  const at = Math.floor(gone / step) % line.length;
  const point = line[at] ?? ORIGIN;
  const next = line[(at + 1) % line.length] ?? point;
  const into = (gone - at * step) / step;
  return {
    at: {
      x: (point.x + (next.x - point.x) * into) * TILE,
      y: (point.y + (next.y - point.y) * into) * TILE,
    },
    angle: Math.atan2(next.y - point.y, next.x - point.x),
  };
}

/** What a point off the end of the loop would be, which cannot happen. */
const ORIGIN: Vec = { x: 0, y: 0 };

/**
 * How long one lap is, in pixels.
 *
 * @returns the way round the loop
 * @remarks
 * Every point is one step from the next by construction, so the lap is the
 * number of steps - there is nothing to add up.
 */
export function railLength(): number {
  return railLine().length * RAIL_STEP * TILE;
}

/**
 * How far round the loop a station sits.
 *
 * @param stop - the station
 * @returns its distance from the top left corner, clockwise, in pixels
 */
export function stationAlong(stop: Station): number {
  const line = railLine();
  let best = 0;
  let bestAway = Number.POSITIVE_INFINITY;
  line.forEach((point, at) => {
    const away = Math.hypot(
      point.x - (stop.col + HALF),
      point.y - (stop.row + HALF),
    );
    if (away < bestAway) {
      best = at;
      bestAway = away;
    }
  });
  return best * RAIL_STEP * TILE;
}

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
  { name: "San Fierro", col: 24, row: 64 },
  { name: "Las Venturas", col: 112, row: 24 },
  { name: "Los Santos", col: 112, row: 112 },
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
 * Whether a square is a crossing of two streets.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true where a line of the grid meets another one
 */
export function atCrossing(col: number, row: number): boolean {
  return inCity(col, row) && isRoad(col) && isRoad(row);
}

/**
 * Whether a crossing has traffic lights.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true where one motorway crosses another
 * @remarks
 * Only where two big roads meet. A light at every corner of a grid city means
 * a driver spends the whole game waiting at one - the traffic crawls, and so
 * does anybody trying to get across town in it. The junctions that are worth
 * stopping at are the handful where the wide roads cross each other.
 */
export function lightAt(col: number, row: number): boolean {
  return atCrossing(col, row) && motorwayNear(col) && motorwayNear(row);
}

/** What a traffic light is showing. */
export type LightColour = "green" | "amber" | "red";

/**
 * What the lights are showing one way at this moment.
 *
 * @param time - the clock, in seconds
 * @param upright - true for traffic going north or south
 * @returns green, amber or red
 * @remarks
 * One clock for the whole city: every light on one axis is green together and
 * then every light on the other is. A green wave, free of charge - and what it
 * buys is that the traffic moves in blocks, the way traffic does.
 *
 * Three colours rather than two, because two is not a traffic light. Each way
 * gets its green, then its amber, and is red for exactly as long as the other
 * way has both - so the two sides can never be anything but opposite, and
 * there is no moment when both are green.
 */
export function lightColour(time: number, upright: boolean): LightColour {
  const span = LIGHT_PHASE + LIGHT_AMBER;
  const round = span * 2;
  const into = ((time % round) + round) % round;
  const mine = upright ? into : (into + span) % round;
  let colour: LightColour;
  if (mine < LIGHT_PHASE) {
    colour = "green";
  } else if (mine < span) {
    colour = "amber";
  } else {
    colour = "red";
  }
  return colour;
}

/**
 * Which squares of the grid make up the street on this line.
 *
 * @param at - a column or a row
 * @returns the first and last square of that street, in squares
 * @remarks
 * Read off the plan rather than measured off the floor, because at a crossing
 * the floor gives the wrong answer: tarmac runs seven squares in both
 * directions there, and a car working out its lane from that puts itself in
 * the middle of the junction and stays there. The plan knows that a street is
 * one square wide and a motorway is five, wherever one happens to be standing.
 */
export function streetRun(at: number): {
  readonly from: number;
  readonly to: number;
} {
  const step = BLOCK_TILES * MOTORWAY_EVERY;
  const into = ((at % step) + step) % step;
  let run: { from: number; to: number };
  if (into <= MOTORWAY_HALF || into >= step - MOTORWAY_HALF) {
    const middle = Math.round(at / step) * step;
    run = { from: middle - MOTORWAY_HALF, to: middle + MOTORWAY_HALF };
  } else {
    const middle = Math.round(at / BLOCK_TILES) * BLOCK_TILES;
    run = { from: middle - ROAD_HALF, to: middle + ROAD_HALF };
  }
  return run;
}

/**
 * How wide the run of tarmac here is, across one axis.
 *
 * @param cells - the city floor
 * @param col - the square, across
 * @param row - the square, down
 * @param upright - true to measure up and down, false to measure left to right
 * @returns the first and last square of the run, in squares
 * @remarks
 * An ordinary street is one square wide and a motorway is five, and a car has
 * to know which it is on to know where its lane is. Measured rather than
 * looked up, because a junction is wide in both directions and the answer
 * there is whatever is actually under the wheels.
 */
export function roadRun(
  cells: readonly Cell[],
  col: number,
  row: number,
  upright: boolean,
): { readonly from: number; readonly to: number } {
  const at = upright ? row : col;
  let from = at;
  let to = at;
  while (
    to - from < ROAD_RUN_MAX &&
    onTarmac(cells, col, row, upright, from - 1)
  ) {
    from -= 1;
  }
  while (
    to - from < ROAD_RUN_MAX &&
    onTarmac(cells, col, row, upright, to + 1)
  ) {
    to += 1;
  }
  return { from, to };
}

/** How wide a run of tarmac may be counted, in squares. */
const ROAD_RUN_MAX = 6;

/** Whether one square of that run is tarmac. */
function onTarmac(
  cells: readonly Cell[],
  col: number,
  row: number,
  upright: boolean,
  at: number,
): boolean {
  const x = (upright ? col : at) * TILE + TILE * HALF;
  const y = (upright ? at : row) * TILE + TILE * HALF;
  return cellUnder(cells, x, y) === "road";
}

/**
 * Whether a square is part of a motorway.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true anywhere on the wide tarmac, middle line and lanes alike
 * @remarks
 * The map in the corner asks: three lanes of grey among a grid of grey streets
 * is not a motorway, it is a slightly wider street. Drawn black it is the one
 * line on the map one can follow across a city at a glance.
 */
export function onMotorway(col: number, row: number): boolean {
  return inCity(col, row) && (motorwayNear(col) || motorwayNear(row));
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

/* ------------------------------------------------- what stands on a block */

/**
 * Which sort of building fills a given block.
 *
 * @param roll - that block's own dice roll, between zero and one
 * @returns the sort it holds, the same one every time
 */
function blockAt(roll: number): Building {
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
  const spare =
    (ONE_ONLY.includes(drawn) && !isTheOne(drawn, blockX, blockY)) ||
    (ONE_PER_QUARTER.includes(drawn) && !isTheLocalOne(drawn, blockX, blockY));
  return BUILDINGS[spare ? "house" : drawn];
}

/**
 * The sorts there is one of in each quarter rather than one in the city.
 *
 * @remarks
 * A night club. Four of them in Los Santos, one to a district, is a night out;
 * one on every other corner is a shopping centre, and nobody arranges to meet
 * anybody at the third club on the left. It is the same thinning as
 * {@link ONE_ONLY}, counted per quarter instead of per city - the four
 * districts are what the gangs are fought over, so they are the size of thing
 * a place of one own belongs to.
 */
const ONE_PER_QUARTER: readonly BuildingKind[] = ["club"];

/** Whether this block is the one of its sort in its own quarter. */
function isTheLocalOne(
  kind: BuildingKind,
  blockX: number,
  blockY: number,
): boolean {
  const one = theOneIn(kind, quarterOf(blockX, blockY));
  return one !== null && one.x === blockX && one.y === blockY;
}

/** Which quarter of town a block stands in. */
function quarterOf(blockX: number, blockY: number): District {
  const span = BLOCK_TILES * TILE;
  return districtAt((blockX + HALF) * span, (blockY + HALF) * span);
}

/**
 * Which block of a quarter keeps it: the one nearest the middle of that
 * quarter.
 *
 * @param kind - one of {@link ONE_PER_QUARTER}
 * @param district - which quarter of town
 * @returns the block, or null where the plan drew none in it at all
 */
function theOneIn(kind: BuildingKind, district: District): Vec | null {
  const key = `${kind}|${district}`;
  const known = QUARTER_BLOCKS.get(key);
  if (known !== undefined) {
    return known;
  }
  const blocks = CITY_TILES / BLOCK_TILES;
  const span = BLOCK_TILES * TILE;
  const middle = districtCentre(district);
  let best: Vec | null = null;
  let bestAway = Number.POSITIVE_INFINITY;
  for (let blockY = 0; blockY < blocks; blockY += 1) {
    for (let blockX = 0; blockX < blocks; blockX += 1) {
      const away = Math.hypot(
        (blockX + HALF) * span - middle.x,
        (blockY + HALF) * span - middle.y,
      );
      if (
        rawKindAt(blockX, blockY) === kind &&
        quarterOf(blockX, blockY) === district &&
        builtBlock(blockX, blockY) &&
        away < bestAway
      ) {
        best = { x: blockX, y: blockY };
        bestAway = away;
      }
    }
  }
  QUARTER_BLOCKS.set(key, best);
  return best;
}

/** The answers to {@link theOneIn}, once each. */
const QUARTER_BLOCKS = new Map<string, Vec | null>();

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
  // The plot, not the whole block. A block is ten squares across and the town
  // it belongs to does not end on a multiple of ten - so asking about the
  // corners of the block threw away every block along the edge of every city,
  // which with blocks this size was most of them.
  const plot = builtPlot(blockX, blockY);
  const dry =
    inCity(plot.left, plot.top) && inCity(plot.right - 1, plot.bottom - 1);
  return !greenBlock(blockX, blockY) && dry && !crossed(blockX, blockY);
}

/**
 * Whether anything runs through a block.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns true where the railway, a country road or a platform takes a bite
 *   out of the plot
 * @remarks
 * **Nothing in this city is cut in half.** A house is drawn as a box over the
 * whole plot, whatever the floor underneath it happens to say - so where a
 * railway curve or a trunk road crossed a plot, the tarmac was drawn and then a
 * front room was drawn on top of it. That reads exactly as what it is: a
 * building sawn through.
 *
 * The answer is the one a planning office gives. Land something runs through is
 * not built on; it stays open, and the city keeps its shape around it. The
 * curves of the railway leave a green swathe through the corner of two
 * districts, which is what a railway leaves in a real one.
 *
 * Remembered per block, because the picture asks it of every block on the
 * screen on every frame and the country roads are a thousand points.
 */
function crossed(blockX: number, blockY: number): boolean {
  const key = cellKey(blockX, blockY);
  const known = CROSSED.get(key);
  let cut: boolean;
  if (known === undefined) {
    cut = anythingThrough(blockX, blockY);
    CROSSED.set(key, cut);
  } else {
    cut = known;
  }
  return cut;
}

/** The answers to that, one per block. */
const CROSSED = new Map<number, boolean>();

/** How far outside the plot something still counts as going through it. */
const PLOT_EDGE = 1;

/** The same question, actually asked. */
function anythingThrough(blockX: number, blockY: number): boolean {
  const box = builtPlot(blockX, blockY);
  let hit = false;
  // A square wider than the plot on every side. What is drawn is wider than
  // what is laid: a country road is painted as a smooth line a little broader
  // than its own band of squares, so that the staircase underneath disappears -
  // and a road that only clips the pavement is still painted up against the
  // front wall of the house. This margin is that difference.
  for (
    let row = box.top - PLOT_EDGE;
    row < box.bottom + PLOT_EDGE && !hit;
    row += 1
  ) {
    for (
      let col = box.left - PLOT_EDGE;
      col < box.right + PLOT_EDGE && !hit;
      col += 1
    ) {
      // The street grid does not count - every plot in town has a road on two
      // sides of it, and that is what a street is. Only the things that cut
      // across the grid do.
      hit =
        onRail(col, row) ||
        onRoute(col, row) ||
        onTrack(col, row) ||
        onPlatform(col, row);
    }
  }
  return hit;
}

/**
 * Whether a square is part of a supermarket car park.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true on the tarmac
 */
function onCarPark(col: number, row: number): boolean {
  const blockX = Math.floor(col / BLOCK_TILES);
  const blockY = Math.floor(row / BLOCK_TILES);
  const lot = carPark(blockX, blockY);
  let tarmac = false;
  if (lot !== null) {
    const plot = builtPlot(blockX, blockY);
    const inside =
      col >= plot.left &&
      col < plot.right &&
      row >= plot.top &&
      row < plot.bottom;
    tarmac =
      !inside &&
      col >= lot.left &&
      col < lot.right &&
      row >= lot.top &&
      row < lot.bottom;
  }
  return tarmac;
}

/**
 * The car park of the supermarket on a block, in squares.
 *
 * @param blockX - the block, across
 * @param blockY - the block, down
 * @returns the tarmac, or null where the block holds anything else
 * @remarks
 * **A supermarket is a shed with a car park round it.** Nobody walks to one.
 * So the ring of pavement every other block has becomes tarmac here, all the
 * way round the shop: room for a dozen cars nose in to the wall, and the one
 * place in this city where a person on foot and a parked car have anything to
 * do with each other. The shop itself keeps its whole plot - a supermarket cut
 * in half to make room for the cars is a corner shop.
 */
export function carPark(
  blockX: number,
  blockY: number,
): {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
} | null {
  let lot = null;
  if (builtBlock(blockX, blockY) && marketBlock(blockX, blockY)) {
    lot = {
      left: blockX * BLOCK_TILES + ROAD_HALF + WALK_RING,
      top: blockY * BLOCK_TILES + ROAD_HALF + WALK_RING,
      right: (blockX + 1) * BLOCK_TILES - ROAD_HALF,
      bottom: (blockY + 1) * BLOCK_TILES - ROAD_HALF,
    };
  }
  return lot;
}

/** Whether the block holds a supermarket. */
function marketBlock(blockX: number, blockY: number): boolean {
  return buildingAt(blockX, blockY).kind === "market";
}

/**
 * Every parking bay of every supermarket in the city.
 *
 * @returns where each bay is, in pixels, and which way a car in it points
 * @remarks
 * Asked once when the city is set up: some of the bays get a car, and the
 * shoppers are put on the rest of them.
 */
export function carParks(): readonly {
  readonly at: Vec;
  readonly angle: number;
}[] {
  const blocks = CITY_TILES / BLOCK_TILES;
  const found: { at: Vec; angle: number }[] = [];
  for (let blockY = 0; blockY < blocks; blockY += 1) {
    for (let blockX = 0; blockX < blocks; blockX += 1) {
      const lot = carPark(blockX, blockY);
      if (lot !== null) {
        const plot = builtPlot(blockX, blockY);
        for (let row = lot.top; row < lot.bottom; row += 1) {
          for (let col = lot.left; col < lot.right; col += 1) {
            const inside =
              col >= plot.left &&
              col < plot.right &&
              row >= plot.top &&
              row < plot.bottom;
            if (!inside) {
              // Nose in to the wall, square to it. Pointing at the middle of
              // the shop instead would stand the four corner bays at
              // forty five degrees, and a car park where the corners are
              // parked askew looks like a car park after an earthquake.
              const above = row < plot.top;
              const below = row >= plot.bottom;
              const left = col < plot.left;
              found.push({
                at: { x: (col + HALF) * TILE, y: (row + HALF) * TILE },
                angle: above
                  ? QUARTER
                  : below
                    ? -QUARTER
                    : left
                      ? 0
                      : HALF_TURN,
              });
            }
          }
        }
      }
    }
  }
  return found;
}

/**
 * Whether a square is part of a station forecourt.
 *
 * @param col - the square, across
 * @param row - the square, down
 * @returns true on the concrete
 * @remarks
 * A platform is drawn flat on the floor beside the track, and it is seven
 * squares long - long enough to reach into the plot next door. Counting it as
 * something that runs through a block is what keeps the station from being
 * built into somebody front room, which is exactly where one of them was.
 */
function onPlatform(col: number, row: number): boolean {
  return STATIONS.some((stop) => {
    const box = platformBox(stop);
    return (
      col + HALF >= box.left &&
      col + HALF <= box.right &&
      row + HALF >= box.top &&
      row + HALF <= box.bottom
    );
  });
}

/**
 * Where the concrete of one platform lies, in squares.
 *
 * @param stop - the station
 * @returns its four sides
 * @remarks
 * Beside the track rather than on it, and along it: which way along comes from
 * the rail itself, so a platform on a curve still lies the right way round.
 * The picture draws this rectangle and the plan keeps it clear of houses, so
 * the two can never disagree about how much room a station takes.
 */
export function platformBox(stop: Station): {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
} {
  const flat = Math.abs(Math.cos(railAngle(stop.col, stop.row))) > HALF;
  const x = stop.col + HALF;
  const y = stop.row + HALF;
  const long = flat ? PLATFORM_LONG : PLATFORM_WIDE * 2;
  const deep = flat ? PLATFORM_WIDE * 2 : PLATFORM_LONG;
  const middleX = x + (flat ? 0 : PLATFORM_WIDE);
  const middleY = y + (flat ? PLATFORM_WIDE : 0);
  return {
    left: middleX - long / 2,
    right: middleX + long / 2,
    top: middleY - deep / 2,
    bottom: middleY + deep / 2,
  };
}

/** How long a platform is, in squares. */
const PLATFORM_LONG = 7;

/** And how far it stands off the middle of the track. */
const PLATFORM_WIDE = 1.6;

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
