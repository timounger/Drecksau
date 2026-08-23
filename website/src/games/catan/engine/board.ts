/**
 * The island: landscapes, the crossings between them, and the paths along
 * their edges - in both sizes the box comes in.
 *
 * @module
 * @remarks
 * There are two boards. The printed game is 19 Landschaftsfelder in rows of
 * 3-4-5-4-3; the 5-6 Personen Erweiterung adds eleven more and makes it
 * 3-4-5-6-5-4-3, which is 30. Neither rulebook lists the crossings or the
 * paths - it names them ("Wege münden immer in eine Kreuzung - das ist der
 * Punkt, an dem 3 Felder zusammenstoßen, an der Küste nur 2") and leaves the
 * counting to your eyes. Here they have to exist as data, so both boards are
 * derived from their row layout rather than transcribed. The small one has to
 * land on 54 crossings and 72 paths, which a throwaway harness checked against
 * the rulebook's own figures.
 *
 * The grid is exact, not floating point. Catan hexes are pointy-top - a corner
 * at the top and at the bottom, flat sides left and right - so every corner
 * sits on a lattice of half-widths across and half-heights down. Keeping those
 * integers means two hexes sharing a corner produce the *same* key, with no
 * rounding anywhere. {@link pointOf} turns a lattice pair into pixels when it
 * is time to draw.
 *
 * **Nothing here is a module-level board on purpose.** A game says how big it
 * is by how many landscapes it holds, and everything asks {@link islandOf} for
 * the matching one. A convenient `HEXES` constant would be a trap: it would
 * work perfectly until somebody dealt a six-handed game.
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */

/** How many landscapes sit in each row of the printed board. */
export const SMALL_ROWS: readonly number[] = [3, 4, 5, 4, 3];

/** How many sit in each row once the 5-6 Personen Erweiterung is in. */
export const LARGE_ROWS: readonly number[] = [3, 4, 5, 6, 5, 4, 3];

/** Landscapes on the printed board. */
export const SMALL_HEXES = 19;

/** Landscapes once the 5-6 Personen Erweiterung is in. */
export const LARGE_HEXES = 30;

/** Harbours around the printed board. */
const SMALL_HARBOURS = 9;

/**
 * Harbours around the bigger board.
 *
 * @remarks
 * A **decision**: the 5-6 rulebook says to slot the four small frame pieces
 * between the six big ones and "achtet dabei auf die richtige Position der
 * Häfen", but it never says how many harbours the finished frame carries.
 * Eleven keeps the density of the printed board across a longer coast, and the
 * stock is chosen to stay fair - see `HARBOUR_STOCK` in the setup module.
 */
const LARGE_HARBOURS = 11;

/**
 * Where the six corners of a pointy-top hex sit, relative to its middle.
 *
 * @remarks
 * In lattice units: x counts half-widths (sqrt(3)/2 of the radius), y counts
 * half-heights. Listed clockwise from the upper right, so corner `i` and corner
 * `i + 1` are always the two ends of one edge.
 */
const CORNERS: readonly (readonly [number, number])[] = [
  [1, -1],
  [1, 1],
  [0, 2],
  [-1, 1],
  [-1, -1],
  [0, -2],
];

/** One landscape. */
export type Hex = {
  readonly id: number;
  readonly row: number;
  readonly col: number;
  /** Middle of the hex, in lattice units. */
  readonly x: number;
  readonly y: number;
  /** The six crossings around it, clockwise from the upper right. */
  readonly corners: readonly number[];
  /** The six paths around it, in the same order. */
  readonly rim: readonly number[];
};

/** A Kreuzung - where a settlement or a city can stand. */
export type Crossing = {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  /** The landscapes that touch it: three inland, two or one at the coast. */
  readonly hexes: readonly number[];
  /** The paths that end here. */
  readonly paths: readonly number[];
  /** The crossings one path away - what the Abstandsregel keeps clear. */
  readonly next: readonly number[];
};

/** A Weg - where a road can lie. */
export type Path = {
  readonly id: number;
  /** The two crossings it joins, lower id first. */
  readonly ends: readonly [number, number];
  /** The landscapes it borders: two inland, one at the coast. */
  readonly hexes: readonly number[];
};

/** A whole board. */
export type Island = {
  readonly rows: readonly number[];
  readonly hexes: readonly Hex[];
  readonly crossings: readonly Crossing[];
  readonly paths: readonly Path[];
  /** The coastal paths, in order once around. */
  readonly coast: readonly number[];
  /** The coastal paths a harbour docks at. */
  readonly harbourPaths: readonly number[];
  /** The landscapes at the points of the island, where the chips start. */
  readonly cornerHexes: readonly number[];
  /**
   * The landscapes in the order the chips go on: a counter-clockwise spiral
   * from each of the six corners, outer ring first.
   */
  readonly spirals: Readonly<Record<number, readonly number[]>>;
};

/** A lattice point, or a pair of crossings, as a lookup key. */
function keyOf(a: number, b: number): string {
  return `${a}:${b}`;
}

/** Middles of the landscapes, in reading order. */
function hexMiddles(rows: readonly number[]): readonly (readonly [number, number])[] {
  const middles: (readonly [number, number])[] = [];
  const mid = (rows.length - 1) / 2;
  rows.forEach((count, row) => {
    for (let col = 0; col < count; col += 1) {
      middles.push([2 * col - (count - 1), 3 * (row - mid)]);
    }
  });
  return middles;
}

/** Which row a landscape id falls in. */
function rowOf(rows: readonly number[], id: number): number {
  let row = 0;
  let seen = 0;
  while (seen + rows[row] <= id) {
    seen += rows[row];
    row += 1;
  }
  return row;
}

/** How many landscapes come before the given row. */
function firstOfRow(rows: readonly number[], row: number): number {
  return rows.slice(0, row).reduce((sum, count) => sum + count, 0);
}

type Skeleton = {
  readonly hexes: readonly Hex[];
  readonly crossings: readonly Crossing[];
  readonly paths: readonly Path[];
};

/**
 * Derives one board from its row layout.
 *
 * @remarks
 * Every hex corner is collected and de-duplicated by its lattice key, which is
 * what turns six corner slots per hex into shared crossings; the same for
 * edges, keyed by the pair of crossings they join. Each relation is recorded
 * once, at the moment the crossing or path is first seen, and read back from
 * both sides.
 */
function buildSkeleton(rows: readonly number[]): Skeleton {
  const crossingAt = new Map<string, number>();
  const cx: number[] = [];
  const cy: number[] = [];
  const cHexes: number[][] = [];
  const cPaths: number[][] = [];
  const cNext: number[][] = [];
  const pathAt = new Map<string, number>();
  const pEnds: (readonly [number, number])[] = [];
  const pHexes: number[][] = [];
  const hexes: Hex[] = [];

  const crossingId = (x: number, y: number): number => {
    const key = keyOf(x, y);
    let id = crossingAt.get(key);
    if (id === undefined) {
      id = cx.length;
      crossingAt.set(key, id);
      cx.push(x);
      cy.push(y);
      cHexes.push([]);
      cPaths.push([]);
      cNext.push([]);
    }
    return id;
  };

  const pathId = (from: number, to: number): number => {
    const ends: readonly [number, number] = from < to ? [from, to] : [to, from];
    const key = keyOf(ends[0], ends[1]);
    let id = pathAt.get(key);
    if (id === undefined) {
      id = pEnds.length;
      pathAt.set(key, id);
      pEnds.push(ends);
      pHexes.push([]);
      cPaths[ends[0]].push(id);
      cPaths[ends[1]].push(id);
      cNext[ends[0]].push(ends[1]);
      cNext[ends[1]].push(ends[0]);
    }
    return id;
  };

  hexMiddles(rows).forEach(([hx, hy], id) => {
    const corners = CORNERS.map(([dx, dy]) => crossingId(hx + dx, hy + dy));
    const rim = corners.map((from, i) => pathId(from, corners[(i + 1) % corners.length]));
    corners.forEach((at) => cHexes[at].push(id));
    rim.forEach((at) => pHexes[at].push(id));
    const row = rowOf(rows, id);
    hexes.push({ id, row, col: id - firstOfRow(rows, row), x: hx, y: hy, corners, rim });
  });

  return {
    hexes,
    crossings: cx.map((x, id) => ({
      id,
      x,
      y: cy[id],
      hexes: cHexes[id],
      paths: cPaths[id],
      next: cNext[id],
    })),
    paths: pEnds.map((ends, id) => ({ id, ends, hexes: pHexes[id] })),
  };
}

/**
 * The coast, walked once around.
 *
 * @remarks
 * A path with only one landscape beside it is a coastal one. Walking them in
 * order matters because the harbours are spaced along the walk, so it starts at
 * the northernmost path and then keeps following whichever coastal path it has
 * not used yet - on a ring, that is only ever one.
 */
function walkTheCoast(board: Skeleton): readonly number[] {
  const coastal = board.paths.filter((path) => path.hexes.length === 1).map((path) => path.id);
  const isCoastal = new Set(coastal);
  const start = coastal.reduce((best, id) =>
    board.crossings[board.paths[id].ends[0]].y < board.crossings[board.paths[best].ends[0]].y
      ? id
      : best,
  );
  const walk: number[] = [start];
  const seen = new Set([start]);
  let at = board.paths[start].ends[1];
  let going = true;
  while (going && walk.length < coastal.length) {
    const step = board.crossings[at].paths.find((id) => isCoastal.has(id) && !seen.has(id));
    if (step === undefined) {
      going = false;
    } else {
      walk.push(step);
      seen.add(step);
      const ends = board.paths[step].ends;
      at = ends[0] === at ? ends[1] : ends[0];
    }
  }
  return walk;
}

/**
 * The coastal paths a harbour docks at.
 *
 * @remarks
 * Spread evenly around the coast, which on the printed board comes out as two
 * clear edges between neighbours and three at the points of the island - what
 * the setup picture on page 4 shows. The rulebook cannot say more than that,
 * and does not try to: the frame goes together "in beliebiger Reihenfolge", so
 * where any particular harbour lands is decided by how the pieces are turned.
 */
function dockSpots(coast: readonly number[], count: number): readonly number[] {
  return Array.from({ length: count }, (unused, index) =>
    coast[Math.round((index * coast.length) / count) % coast.length],
  );
}

/**
 * How deep inside the island a landscape sits.
 *
 * @remarks
 * Peeled like an onion rather than measured from the middle: ring 0 is every
 * landscape with a side on the open sea, ring 1 is what is left once those are
 * lifted off, and so on. Measuring from a centre would work on the printed
 * board, which is a tidy hexagon, and quietly fail on the six-handed one, which
 * has a row of six through the middle and no single landscape at its centre.
 */
function rings(board: Skeleton): readonly number[] {
  const depth = board.hexes.map(() => -1);
  const left = new Set(board.hexes.map((hex) => hex.id));
  let ring = 0;
  while (left.size > 0) {
    const edge = [...left].filter((id) =>
      board.hexes[id].rim.some((path) =>
        board.paths[path].hexes.every((other) => other === id || !left.has(other)),
      ),
    );
    edge.forEach((id) => {
      depth[id] = ring;
      left.delete(id);
    });
    ring += 1;
  }
  return depth;
}

/** Half a hex width, as a fraction of its radius. */
const HALF_WIDTH = Math.sqrt(3) / 2;

/** A drawing position. */
export type Point = { readonly px: number; readonly py: number };

/** Turn a lattice point into pixels. */
export function pointOf(x: number, y: number, size: number): Point {
  return { px: x * HALF_WIDTH * size, py: (y * size) / 2 };
}

/**
 * The landscapes in the order the number chips go on.
 *
 * @param board - the board to walk
 * @param depth - how deep each landscape sits
 * @param start - the corner landscape to begin at
 * @returns every landscape, outer ring first and the middle last
 *
 * @remarks
 * "Beginnt in einer Ecke (mit A) und führt die Reihe spiralförmig nach innen
 * zum Zentrum." The base game adds the direction - "gegen den Uhrzeigersinn" -
 * and the arrows in the 5-6 booklet's picture run the same way. So: walk each
 * ring counter-clockwise, starting as near as possible to where the last one
 * finished, outermost ring first.
 */
function spiralFrom(
  board: Skeleton,
  depth: readonly number[],
  start: number,
): readonly number[] {
  const angleOf = (hex: Hex): number => {
    const { px, py } = pointOf(hex.x, hex.y, 1);
    const turn = Math.atan2(-py, px);
    return turn < 0 ? turn + 2 * Math.PI : turn;
  };
  const from = angleOf(board.hexes[start]);
  const byRing = new Map<number, number[]>();
  board.hexes.forEach((hex) => {
    const ring = byRing.get(depth[hex.id]) ?? [];
    ring.push(hex.id);
    byRing.set(depth[hex.id], ring);
  });
  const spiral: number[] = [];
  [...byRing.keys()]
    .sort((a, b) => a - b)
    .forEach((ring) => {
      const turned = (byRing.get(ring) ?? [])
        .map((id) => ({
          id,
          turn: (angleOf(board.hexes[id]) - from + 2 * Math.PI) % (2 * Math.PI),
        }))
        .sort((a, b) => a.turn - b.turn);
      turned.forEach((entry) => spiral.push(entry.id));
    });
  return spiral;
}

/** Builds one whole board. */
function buildIsland(rows: readonly number[], harbours: number): Island {
  const board = buildSkeleton(rows);
  const coast = walkTheCoast(board);
  const depth = rings(board);
  const ends = rows.reduce<number[]>(
    (list, count, row) => [...list, firstOfRow(rows, row), firstOfRow(rows, row) + count - 1],
    [],
  );
  // The points of the island: the two ends of the top row, the widest row and
  // the bottom row - the six landscapes with only two neighbours inside.
  const widest = rows.indexOf(Math.max(...rows));
  const cornerHexes = [
    firstOfRow(rows, 0),
    firstOfRow(rows, 0) + rows[0] - 1,
    firstOfRow(rows, widest),
    firstOfRow(rows, widest) + rows[widest] - 1,
    firstOfRow(rows, rows.length - 1),
    firstOfRow(rows, rows.length - 1) + rows[rows.length - 1] - 1,
  ].filter((id, index, list) => list.indexOf(id) === index && ends.includes(id));
  const spirals: Record<number, readonly number[]> = {};
  cornerHexes.forEach((corner) => {
    spirals[corner] = spiralFrom(board, depth, corner);
  });
  return {
    rows,
    ...board,
    coast,
    harbourPaths: dockSpots(coast, harbours),
    cornerHexes,
    spirals,
  };
}

const SMALL = buildIsland(SMALL_ROWS, SMALL_HARBOURS);
const LARGE = buildIsland(LARGE_ROWS, LARGE_HARBOURS);

/**
 * The board a game of this size is played on.
 *
 * @param hexCount - how many landscapes the game holds
 * @returns the printed board, or the bigger one for five and six players
 */
export function islandOf(hexCount: number): Island {
  return hexCount <= SMALL_HEXES ? SMALL : LARGE;
}

/** How many landscapes a table of this size plays on. */
export function hexesFor(players: number): number {
  return players <= 4 ? SMALL_HEXES : LARGE_HEXES;
}
