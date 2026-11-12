/**
 * What the engine derives from a game and keeps beside it: which tile holds
 * which structure, the flow field to the headquarters, the spatial hash of the
 * enemies and the pools of reusable objects.
 *
 * @module
 * @remarks
 * None of it is saved. It hangs off the game in a WeakMap, so a loaded game
 * gets fresh caches and an abandoned one takes its caches with it.
 */
import { isWalkable, MAP_COLS, MAP_ROWS, TILE, terrainOf } from "./map";
import { STRUCTURES } from "./structures";
import {
  Terrain,
  type Enemy,
  type Game,
  type Projectile,
  type Structure,
} from "./types";

/** Tiles per side of a spatial hash cell. */
const CELL_TILES = 4;

/** Size of a spatial hash cell in world units. */
export const CELL = TILE * CELL_TILES;

/** Cells across and down. */
const CELL_COLS = Math.ceil((MAP_COLS * TILE) / CELL);
const CELL_ROWS = Math.ceil((MAP_ROWS * TILE) / CELL);

/** Path cost of each terrain (rock is closed). */
const TERRAIN_COST: Readonly<Record<Terrain, number>> = {
  [Terrain.Snow]: 1,
  [Terrain.DeepSnow]: 1.6,
  [Terrain.Ice]: 0.85,
  [Terrain.Rock]: Infinity,
  [Terrain.Forest]: 2.2,
  [Terrain.IronOre]: 1,
  [Terrain.StoneOre]: 1,
};

/** Extra path cost of a tile with a wall, per level, and its base. */
const WALL_COST = 8;
const WALL_COST_LEVEL = 5;

/** Extra path cost of any other structure. */
const STRUCTURE_COST = 12;

/** Diagonal step length. */
const DIAGONAL = Math.SQRT2;

/** The eight neighbours: column step, row step. */
const NEIGHBOURS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** The caches of one game. */
export type Runtime = {
  /** Structure id per tile, 0 for none. */
  readonly occupancy: Int32Array;
  /** Path cost to the headquarters per tile. */
  readonly distance: Float32Array;
  /** The next tile on the way, per tile (-1 at the goal or nowhere). */
  readonly next: Int32Array;
  /** Set when a structure appeared or vanished. */
  dirty: boolean;
  /** Enemy indices per spatial cell, refilled every step. */
  readonly cells: number[][];
  /** Structures by id. */
  readonly byId: Map<number, Structure>;
  /** Enemies by id, refilled every step. */
  readonly enemyById: Map<number, Enemy>;
  /** Discarded objects waiting to be reused. */
  readonly enemyPool: Enemy[];
  readonly projectilePool: Projectile[];
  /** Share of the energy demand met last step, 0 to 1. */
  power: number;
  /** Energy made and used per second, last step. */
  energyIn: number;
  energyOut: number;
  /** Net change of every resource per second, last step. */
  readonly rates: Record<string, number>;
  /** Game time of the last warnings, so the log is not flooded. */
  hqWarnedAt: number;
  stealWarnedAt: number;
  powerWarnedAt: number;
};

/** One runtime per game. */
const runtimes = new WeakMap<Game, Runtime>();

/**
 * The caches of a game, built on first use.
 *
 * @param game - the game
 * @returns its runtime
 */
export function runtimeOf(game: Game): Runtime {
  let runtime = runtimes.get(game);
  if (runtime === undefined) {
    const size = MAP_COLS * MAP_ROWS;
    runtime = {
      occupancy: new Int32Array(size),
      distance: new Float32Array(size),
      next: new Int32Array(size),
      dirty: true,
      cells: Array.from({ length: CELL_COLS * CELL_ROWS }, () => []),
      byId: new Map(),
      enemyById: new Map(),
      enemyPool: [],
      projectilePool: [],
      power: 1,
      energyIn: 0,
      energyOut: 0,
      rates: {},
      hqWarnedAt: -Infinity,
      stealWarnedAt: -Infinity,
      powerWarnedAt: -Infinity,
    };
    runtimes.set(game, runtime);
  }
  if (runtime.dirty) {
    rebuild(game, runtime);
  }
  return runtime;
}

/**
 * Tells the caches that structures changed.
 *
 * @param game - the game
 */
export function markDirty(game: Game): void {
  const runtime = runtimes.get(game);
  if (runtime !== undefined) {
    runtime.dirty = true;
  }
}

/**
 * The structure on a tile.
 *
 * @param game - the game
 * @param col - column
 * @param row - row
 * @returns the structure, or undefined
 */
export function structureAt(
  game: Game,
  col: number,
  row: number,
): Structure | undefined {
  const runtime = runtimeOf(game);
  const inside = col >= 0 && row >= 0 && col < MAP_COLS && row < MAP_ROWS;
  const id = inside ? runtime.occupancy[row * MAP_COLS + col] : 0;
  return id === 0 ? undefined : runtime.byId.get(id);
}

/**
 * Sorts the enemies into the spatial hash.
 *
 * @param game - the game
 */
export function indexEnemies(game: Game): void {
  const runtime = runtimeOf(game);
  for (const cell of runtime.cells) {
    cell.length = 0;
  }
  runtime.enemyById.clear();
  game.enemies.forEach((enemy, index) => {
    runtime.cells[cellIndex(enemy.x, enemy.y)].push(index);
    runtime.enemyById.set(enemy.id, enemy);
  });
}

/**
 * Calls back for every enemy within a radius, using the spatial hash.
 *
 * @param game - the game
 * @param x - centre, world units
 * @param y - centre, world units
 * @param radius - reach, world units
 * @param visit - called with each enemy inside and its squared distance
 */
export function forEnemiesNear(
  game: Game,
  x: number,
  y: number,
  radius: number,
  visit: (enemy: Enemy, distanceSq: number) => void,
): void {
  const runtime = runtimeOf(game);
  const left = Math.max(0, Math.floor((x - radius) / CELL));
  const right = Math.min(CELL_COLS - 1, Math.floor((x + radius) / CELL));
  const top = Math.max(0, Math.floor((y - radius) / CELL));
  const bottom = Math.min(CELL_ROWS - 1, Math.floor((y + radius) / CELL));
  const reachSq = radius * radius;
  for (let row = top; row <= bottom; row += 1) {
    for (let col = left; col <= right; col += 1) {
      for (const index of runtime.cells[row * CELL_COLS + col]) {
        const enemy = game.enemies[index];
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const distanceSq = dx * dx + dy * dy;
        if (enemy.alive && distanceSq <= reachSq) {
          visit(enemy, distanceSq);
        }
      }
    }
  }
}

/** The spatial cell of a point. */
function cellIndex(x: number, y: number): number {
  const col = Math.min(CELL_COLS - 1, Math.max(0, Math.floor(x / CELL)));
  const row = Math.min(CELL_ROWS - 1, Math.max(0, Math.floor(y / CELL)));
  return row * CELL_COLS + col;
}

/** Rebuilds the occupancy grid and the flow field. */
function rebuild(game: Game, runtime: Runtime): void {
  runtime.dirty = false;
  runtime.occupancy.fill(0);
  runtime.byId.clear();
  for (const structure of game.structures) {
    runtime.byId.set(structure.id, structure);
    const def = STRUCTURES[structure.kind];
    for (let row = structure.row; row < structure.row + def.height; row += 1) {
      for (let col = structure.col; col < structure.col + def.width; col += 1) {
        runtime.occupancy[row * MAP_COLS + col] = structure.id;
      }
    }
  }
  flow(game, runtime);
}

/** Path cost of stepping onto a tile. */
function stepCost(
  terrain: Uint8Array,
  runtime: Runtime,
  index: number,
): number {
  const base = TERRAIN_COST[terrain[index] as Terrain];
  const id = runtime.occupancy[index];
  let extra = 0;
  if (id !== 0) {
    const structure = runtime.byId.get(id);
    if (structure?.kind === "wall") {
      extra = WALL_COST + WALL_COST_LEVEL * structure.level;
    } else if (structure !== undefined && structure.kind !== "minefield") {
      extra = STRUCTURE_COST;
    }
  }
  return base + extra;
}

/**
 * Dijkstra from the headquarters outwards: every tile learns how far it is
 * and which neighbour leads closer.
 */
function flow(game: Game, runtime: Runtime): void {
  const terrain = terrainOf(game.seed);
  const { distance, next, occupancy } = runtime;
  distance.fill(Infinity);
  next.fill(-1);
  const heap = new MinHeap();
  const hq = game.structures.find((entry) => entry.kind === "hq");
  if (hq !== undefined) {
    for (let index = 0; index < occupancy.length; index += 1) {
      if (occupancy[index] === hq.id) {
        distance[index] = 0;
        heap.push(index, 0);
      }
    }
  }
  while (heap.size > 0) {
    const index = heap.pop();
    const col = index % MAP_COLS;
    const row = (index - col) / MAP_COLS;
    const here = distance[index];
    for (const [dc, dr] of NEIGHBOURS) {
      const nc = col + dc;
      const nr = row + dr;
      const inside = nc >= 0 && nr >= 0 && nc < MAP_COLS && nr < MAP_ROWS;
      const diagonal = dc !== 0 && dr !== 0;
      // No squeezing diagonally past a corner of rock or between two walls.
      const corner =
        diagonal &&
        (closed(terrain, runtime, row * MAP_COLS + nc) ||
          closed(terrain, runtime, nr * MAP_COLS + col));
      if (inside && !corner) {
        const target = nr * MAP_COLS + nc;
        // The cost of the tile being left, since the walk goes the other way.
        const cost =
          stepCost(terrain, runtime, index) * (diagonal ? DIAGONAL : 1);
        const through = here + (distance[index] === 0 ? 1 : cost);
        if (
          isWalkable(terrain[target] as Terrain) &&
          through < distance[target]
        ) {
          distance[target] = through;
          next[target] = index;
          heap.push(target, through);
        }
      }
    }
  }
}

/** Whether a tile closes a diagonal: rock, or a structure other than mines. */
function closed(terrain: Uint8Array, runtime: Runtime, index: number): boolean {
  const id = runtime.occupancy[index];
  const structure = id === 0 ? undefined : runtime.byId.get(id);
  return (
    !isWalkable(terrain[index] as Terrain) ||
    (structure !== undefined && structure.kind !== "minefield")
  );
}

/** A binary heap of tile indices by cost. */
class MinHeap {
  private readonly items: number[] = [];
  private readonly costs: number[] = [];

  /** Entries waiting. */
  get size(): number {
    return this.items.length;
  }

  /** Adds an entry. */
  push(item: number, cost: number): void {
    this.items.push(item);
    this.costs.push(cost);
    let at = this.items.length - 1;
    while (at > 0) {
      const parent = (at - 1) >> 1;
      if (this.costs[parent] <= this.costs[at]) {
        break;
      }
      this.swap(at, parent);
      at = parent;
    }
  }

  /** Takes the cheapest entry off. */
  pop(): number {
    const top = this.items[0];
    const lastItem = this.items.pop() as number;
    const lastCost = this.costs.pop() as number;
    if (this.items.length > 0) {
      this.items[0] = lastItem;
      this.costs[0] = lastCost;
      let at = 0;
      for (;;) {
        const left = at * 2 + 1;
        const right = left + 1;
        let smallest = at;
        if (
          left < this.items.length &&
          this.costs[left] < this.costs[smallest]
        ) {
          smallest = left;
        }
        if (
          right < this.items.length &&
          this.costs[right] < this.costs[smallest]
        ) {
          smallest = right;
        }
        if (smallest === at) {
          break;
        }
        this.swap(at, smallest);
        at = smallest;
      }
    }
    return top;
  }

  private swap(a: number, b: number): void {
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
    [this.costs[a], this.costs[b]] = [this.costs[b], this.costs[a]];
  }
}
