/**
 * Building a playable {@link ./types GameState} from a level map.
 *
 * @module
 */
import { LEVELS, type LevelMap } from "./levels";
import { createRandom, type RandomState } from "./random";
import { TILE, type GameState, type Tank, type TankKind } from "./types";

/** Lives the player starts a mission with. */
export const LIVES_START = 3;

/** A bonus life is granted on reaching every this-many-th level (5, 10, ...). */
export const LEVELS_PER_BONUS = 5;

/** Playable width of every field, in cells - a fixed size, as in Wii Play. */
export const FIELD_COLS = 22;

/** Playable height of every field, in cells. */
export const FIELD_ROWS = 17;

/** A parsed level: its grid, the walls and where every tank starts. */
type ParsedLevel = {
  readonly cols: number;
  readonly rows: number;
  readonly walls: boolean[];
  readonly breakable: boolean[];
  readonly holes: boolean[];
  readonly tanks: Tank[];
};

/** Which tank a spawn character stands for. */
const SPAWN_KIND: Readonly<Record<string, TankKind>> = {
  P: "player",
  B: "brown",
  G: "grey",
  T: "teal",
  U: "teal", // the turquoise "blue" enemy
  N: "green",
  Y: "yellow",
  L: "purple",
  I: "invisible",
};

/**
 * Deals a fresh mission at the first level.
 *
 * @param seed - the seed for the enemies' random behaviour
 * @returns the initial state, ready to play
 */
export function createGame(seed: number, players = 1): GameState {
  return loadLevel(0, LIVES_START, createRandom(seed), players);
}

/** The running total of enemy tanks through each level, filled once on load. */
const CUMULATIVE_ENEMIES: readonly number[] = buildCumulativeEnemies();

/** Counts the enemies each level holds and sums them up from the first level. */
function buildCumulativeEnemies(): number[] {
  const totals: number[] = [];
  let sum = 0;
  for (const map of LEVELS) {
    const enemies = parseLevel(map).tanks.filter(
      (tank) => tank.kind !== "player",
    ).length;
    sum += enemies;
    totals.push(sum);
  }
  return totals;
}

/**
 * How many enemy tanks all levels up to and including this one hold together.
 *
 * @param level - the level index (clamped into range)
 * @returns the total enemy count from the first level through this one
 * @remarks
 * Clearing a level means every one of its enemies was destroyed, so this is the
 * grand total of enemies beaten once that level is cleared - independent of how
 * many respawns it took, and the same figure on every client.
 */
export function totalEnemiesThroughLevel(level: number): number {
  const index = Math.max(0, Math.min(CUMULATIVE_ENEMIES.length - 1, level));
  return CUMULATIVE_ENEMIES[index];
}

/**
 * Builds the playing state for one level.
 *
 * @param level - the level index into {@link LEVELS}
 * @param lives - how many lives the player has left
 * @param random - the generator to carry on with
 * @param players - how many human tanks (2 for co-op adds "player2" beside "player")
 * @returns a fresh "playing" state for that level
 */
export function loadLevel(
  level: number,
  lives: number,
  random: RandomState,
  players = 1,
): GameState {
  const parsed = parseLevel(LEVELS[level]);
  const tanks = [...parsed.tanks];
  const state: GameState = {
    cols: parsed.cols,
    rows: parsed.rows,
    walls: parsed.walls,
    breakable: parsed.breakable,
    holes: parsed.holes,
    tanks,
    bullets: [],
    mines: [],
    explosions: [],
    marks: [],
    trails: [],
    level,
    lives,
    phase: "playing",
    time: 0,
    random,
    nextId: 0,
  };
  // Co-op: the second player spawns on a free cell right beside the first.
  const first =
    players >= 2 ? tanks.find((tank) => tank.id === "player") : null;
  if (first !== null && first !== undefined) {
    const spot = freeCellNear(state, first.x, first.y);
    tanks.push({ ...first, id: "player2", x: spot.x, y: spot.y });
  }
  return state;
}

/** The four sides then the diagonals, for finding a free cell nearby. */
const NEIGHBOUR_OFFSETS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];

/** The grid parts needed to find a free (drivable) cell. */
type CellGrid = Pick<GameState, "cols" | "rows" | "walls" | "holes">;

/** Whether the point (px, py) is a drivable cell (no wall, no hole, on-grid). */
export function isFreePoint(grid: CellGrid, px: number, py: number): boolean {
  const col = Math.floor(px / TILE);
  const row = Math.floor(py / TILE);
  const inside = col >= 0 && col < grid.cols && row >= 0 && row < grid.rows;
  const index = row * grid.cols + col;
  return inside && !grid.walls[index] && !grid.holes[index];
}

/** A free cell centre next to (x, y), or (x, y) itself if none is free. */
export function freeCellNear(
  grid: CellGrid,
  x: number,
  y: number,
): { readonly x: number; readonly y: number } {
  let spot = { x, y };
  for (const [dx, dy] of NEIGHBOUR_OFFSETS) {
    const px = x + dx * TILE;
    const py = y + dy * TILE;
    if (isFreePoint(grid, px, py)) {
      spot = { x: px, y: py };
      break;
    }
  }
  return spot;
}

/** Pixel width of the arena for a state. */
export function arenaWidth(state: GameState): number {
  return state.cols * TILE;
}

/** Pixel height of the arena for a state. */
export function arenaHeight(state: GameState): number {
  return state.rows * TILE;
}

/**
 * Turns an ASCII level map into walls and tank spawns.
 *
 * @param map - the level's rows, holding only the playable interior
 * @returns the grid dimensions, the walls and the starting tanks
 * @remarks
 * The map is the {@link FIELD_COLS} x {@link FIELD_ROWS} interior; a solid wall
 * ring is added around it here, so a level map never has to draw its own border
 * and every field ends up exactly the same size.
 */
function parseLevel(map: LevelMap): ParsedLevel {
  const cols = map[0].length + 2;
  const rows = map.length + 2;
  const walls: boolean[] = new Array<boolean>(cols * rows).fill(false);
  const breakable: boolean[] = new Array<boolean>(cols * rows).fill(false);
  const holes: boolean[] = new Array<boolean>(cols * rows).fill(false);
  const tanks: Tank[] = [];
  let enemyIndex = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      const onBorder =
        row === 0 || row === rows - 1 || col === 0 || col === cols - 1;
      if (onBorder) {
        walls[index] = true;
      } else {
        const cell = map[row - 1][col - 1];
        if (cell === "#") {
          walls[index] = true;
        } else if (cell === "x") {
          // A destructible wall blocks like any wall until a mine clears it.
          walls[index] = true;
          breakable[index] = true;
        } else if (cell === "o") {
          // A hole stops tanks but lets shells pass straight over it.
          holes[index] = true;
        } else if (cell !== ".") {
          const kind = SPAWN_KIND[cell];
          const id = kind === "player" ? "player" : `e${enemyIndex++}`;
          tanks.push(makeTank(id, kind, col, row));
        }
      }
    }
  }
  return { cols, rows, walls, breakable, holes, tanks };
}

/** A tank at the centre of a grid cell, turret facing right. */
function makeTank(id: string, kind: TankKind, col: number, row: number): Tank {
  return {
    id,
    kind,
    x: col * TILE + TILE / 2,
    y: row * TILE + TILE / 2,
    turret: 0,
    alive: true,
    reloadUntil: 0,
    heading: 0,
    headingUntil: 0,
  };
}
