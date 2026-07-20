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
};

/**
 * Deals a fresh mission at the first level.
 *
 * @param seed - the seed for the enemies' random behaviour
 * @returns the initial state, ready to play
 */
export function createGame(seed: number): GameState {
  return loadLevel(0, LIVES_START, createRandom(seed));
}

/**
 * Builds the playing state for one level.
 *
 * @param level - the level index into {@link LEVELS}
 * @param lives - how many lives the player has left
 * @param random - the generator to carry on with
 * @returns a fresh "playing" state for that level
 */
export function loadLevel(
  level: number,
  lives: number,
  random: RandomState,
): GameState {
  const parsed = parseLevel(LEVELS[level]);
  return {
    cols: parsed.cols,
    rows: parsed.rows,
    walls: parsed.walls,
    breakable: parsed.breakable,
    holes: parsed.holes,
    tanks: parsed.tanks,
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
