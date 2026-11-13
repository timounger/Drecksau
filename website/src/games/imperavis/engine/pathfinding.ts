/**
 * A* on the tile grid, shared by roads, carts and ships, and the same search
 * without a goal that finds the ways of a store's carts to every producer.
 *
 * @module
 * @remarks
 * One binary heap and typed arrays sized to the map, reused between calls,
 * so a search allocates almost nothing. Costs come from a callback, which
 * lets the road planner prefer existing roads and ships keep off the shore.
 */

/** Square root of two, the cost of a diagonal step. */
const DIAGONAL = Math.SQRT2;

/** Straight neighbours as index offsets are built per map width. */
type Step = { readonly dx: number; readonly dy: number; readonly cost: number };

/** Straight steps. */
const STRAIGHT: readonly Step[] = [
  { dx: 1, dy: 0, cost: 1 },
  { dx: -1, dy: 0, cost: 1 },
  { dx: 0, dy: 1, cost: 1 },
  { dx: 0, dy: -1, cost: 1 },
];

/** Straight and diagonal steps. */
const ALL: readonly Step[] = [
  ...STRAIGHT,
  { dx: 1, dy: 1, cost: DIAGONAL },
  { dx: 1, dy: -1, cost: DIAGONAL },
  { dx: -1, dy: 1, cost: DIAGONAL },
  { dx: -1, dy: -1, cost: DIAGONAL },
];

/** What a search needs to know. */
export type SearchSpec = {
  /** Tiles per side. */
  readonly n: number;
  /** Start tiles (indices). */
  readonly from: readonly number[];
  /** Whether a tile ends the search. */
  readonly isGoal: (index: number) => boolean;
  /** Tile the heuristic aims at. */
  readonly towards: number;
  /** Extra cost factor to enter a tile, or Infinity when blocked. */
  readonly cost: (index: number) => number;
  /** Whether diagonal steps are allowed. */
  readonly diagonal: boolean;
  /** Give up after this many expanded tiles. */
  readonly limit: number;
  /** Cheapest factor `cost` can return, so the heuristic stays admissible. */
  readonly minCost: number;
};

/** Reused buffers, grown to the largest map seen. */
let gScore = new Float32Array(0);
let cameFrom = new Int32Array(0);
let stamp = new Uint32Array(0);
let closed = new Uint32Array(0);
let generation = 0;

/** What a search that settles every reachable tile needs to know. */
export type SpreadSpec = Omit<SearchSpec, "isGoal" | "towards" | "minCost">;

/** The outcome of {@link explore}: the cost to each settled tile and the way there. */
export type Spread = {
  /**
   * Cost from the nearest start.
   *
   * @param index - a tile
   * @returns the cost, or Infinity when the search did not settle the tile
   */
  costTo(index: number): number;
  /**
   * The cheapest way from a start to a settled tile.
   *
   * @param index - a tile the search settled
   * @returns the tiles from the start to it
   */
  pathTo(index: number): number[];
};

/**
 * Finds the cheapest way from any start to a goal.
 *
 * @param spec - the search
 * @returns the tiles from start to goal, or null when there is none
 */
export function findPath(spec: SearchSpec): number[] | null {
  const goal = search(spec);
  return goal >= 0 ? walkBack(goal) : null;
}

/**
 * Settles every tile reachable from the starts, cheapest first - the same
 * search without a goal (Dijkstra), up to the limit.
 *
 * @param spec - the search
 * @returns the costs and ways, valid until the next search of this module
 */
export function explore(spec: SpreadSpec): Spread {
  search({ ...spec, isGoal: () => false, towards: 0, minCost: 0 });
  const done = generation;
  return {
    costTo: (index) =>
      closed[index] === done ? gScore[index] : Number.POSITIVE_INFINITY,
    pathTo: (index) => walkBack(index),
  };
}

/** The search itself; returns the goal it reached, or -1. */
function search(spec: SearchSpec): number {
  const n = spec.n;
  ensure(n * n);
  generation += 1;
  const heap = new Heap();
  const tx = spec.towards % n;
  const ty = Math.floor(spec.towards / n);
  const heuristic = (index: number) => {
    const dx = Math.abs((index % n) - tx);
    const dy = Math.abs(Math.floor(index / n) - ty);
    const straight = spec.diagonal
      ? Math.max(dx, dy) + (DIAGONAL - 1) * Math.min(dx, dy)
      : dx + dy;
    return straight * spec.minCost;
  };
  for (const start of spec.from) {
    gScore[start] = 0;
    stamp[start] = generation;
    cameFrom[start] = -1;
    heap.push(start, heuristic(start));
  }
  const steps = spec.diagonal ? ALL : STRAIGHT;
  let goal = -1;
  let expanded = 0;
  while (heap.size > 0 && goal < 0 && expanded < spec.limit) {
    const current = heap.pop();
    if (closed[current] !== generation) {
      closed[current] = generation;
      expanded += 1;
      if (spec.isGoal(current)) {
        goal = current;
      } else {
        const cx = current % n;
        const cy = Math.floor(current / n);
        for (const step of steps) {
          const nx = cx + step.dx;
          const ny = cy + step.dy;
          const next = ny * n + nx;
          const inside = nx >= 0 && ny >= 0 && nx < n && ny < n;
          const factor = inside ? spec.cost(next) : Infinity;
          // A diagonal may not cut a blocked corner.
          const cornerFree =
            !inside ||
            step.cost === 1 ||
            (spec.cost(cy * n + nx) < Infinity &&
              spec.cost(ny * n + cx) < Infinity);
          if (factor < Infinity && cornerFree && closed[next] !== generation) {
            const tentative = gScore[current] + step.cost * factor;
            if (stamp[next] !== generation || tentative < gScore[next]) {
              stamp[next] = generation;
              gScore[next] = tentative;
              cameFrom[next] = current;
              heap.push(next, tentative + heuristic(next));
            }
          }
        }
      }
    }
  }
  return goal;
}

/** The tiles from the start of the last search to a tile it reached. */
function walkBack(goal: number): number[] {
  const result: number[] = [];
  for (let at = goal; at >= 0; at = cameFrom[at]) {
    result.push(at);
  }
  return result.reverse();
}

/** Grows the shared buffers when a larger map comes along. */
function ensure(size: number): void {
  if (gScore.length < size) {
    gScore = new Float32Array(size);
    cameFrom = new Int32Array(size);
    stamp = new Uint32Array(size);
    closed = new Uint32Array(size);
    generation = 0;
  }
}

/** A minimal binary min-heap of tile indices by priority. */
class Heap {
  /** The tiles. */
  private readonly items: number[] = [];

  /** Their priorities. */
  private readonly keys: number[] = [];

  /** How many are waiting. */
  get size(): number {
    return this.items.length;
  }

  /**
   * Adds a tile.
   *
   * @param item - the tile
   * @param key - its priority, lower first
   */
  push(item: number, key: number): void {
    const items = this.items;
    const keys = this.keys;
    let i = items.length;
    items.push(item);
    keys.push(key);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (keys[parent] <= key) {
        break;
      }
      items[i] = items[parent];
      keys[i] = keys[parent];
      i = parent;
    }
    items[i] = item;
    keys[i] = key;
  }

  /**
   * Takes the tile with the lowest priority.
   *
   * @returns it
   */
  pop(): number {
    const items = this.items;
    const keys = this.keys;
    const top = items[0];
    const lastItem = items.pop() as number;
    const lastKey = keys.pop() as number;
    if (items.length > 0) {
      let i = 0;
      const length = items.length;
      let done = false;
      while (!done) {
        const left = i * 2 + 1;
        const right = left + 1;
        let smallest = i;
        let smallestKey = lastKey;
        if (left < length && keys[left] < smallestKey) {
          smallest = left;
          smallestKey = keys[left];
        }
        if (right < length && keys[right] < smallestKey) {
          smallest = right;
        }
        if (smallest === i) {
          done = true;
        } else {
          items[i] = items[smallest];
          keys[i] = keys[smallest];
          i = smallest;
        }
      }
      items[i] = lastItem;
      keys[i] = lastKey;
    }
    return top;
  }
}
