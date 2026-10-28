/**
 * The night workshop of Türchen 26: its tiles, the guards' rounds and the
 * turning lantern, and the questions every part asks of the map.
 *
 * @module
 * @remarks
 * One character per tile of {@link TILE} logical px:
 *
 * - `#` wall, `D` the golden door (two by two in the top wall)
 * - `.` floor, `r` rug, `n` a creaking board
 * - `B` workbench, `S` toy shelf, `C` crate, `L` the turning lantern - solid
 * - `H` a pile of presents to hide in, `K` a key, `P` where Gilfi starts
 */

/** Size of one tile, logical px. */
export const TILE = 16;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the level: rows,
   rounds and the lantern, laid out by hand */
/** The workshop, row by row. */
export const ROWS: readonly string[] = [
  "#################DD#################",
  "#################DD#################",
  "#K........C#H...n..n...H#.........K#",
  "#..n.SS....#............#.CC..n.S..#",
  "#....SS....#..BBrrrrBB..#.......S..#",
  "#..........#..BBrrrrBB..#..........#",
  "#..H....n....n.rrrrrr.n....n.L...H.#",
  "#....SS....#...rrrrrr...#..........#",
  "#....SS....#..BBrrrrBB..#.C....CC..#",
  "#CC.n....H.#H..........H#...H.....C#",
  "####..###########..###########..####",
  "#........H................H........#",
  "#..................................#",
  "#...BBBBB...BBBB....BBBB...BBBBB...#",
  "#..................................#",
  "#SS...n...C......H.......C...n...SS#",
  "#..................................#",
  "#...BBBBB...BBBB....BBBB...BBBBB...#",
  "#..................................#",
  "#..H.......n.....P......n........H.#",
  "#K.................................#",
  "####################################",
];

/** Who walks a round, and how. */
export type GuardSpec = {
  readonly who: "grantelbart" | "gugor" | "fuchs";
  /** Corners of the round, in tiles, walked in order and round again. */
  readonly route: readonly (readonly [number, number])[];
  /** Walking speed, logical px per second. */
  readonly speed: number;
  /** How far the light reaches, logical px, and half its width, radians. */
  readonly range: number;
  readonly half: number;
  /** Whether the guard carries a lantern (drawn in the hand, lights the dark). */
  readonly lantern: boolean;
};

/** The three guards: Gugor in the store, Grantelbart before the door, the fox in the workshop. */
export const GUARDS: readonly GuardSpec[] = [
  {
    who: "fuchs",
    route: [
      [3, 12],
      [32, 12],
      [32, 16],
      [3, 16],
    ],
    speed: 40,
    range: 46,
    half: 0.5,
    lantern: false,
  },
  {
    who: "gugor",
    route: [
      [3, 2],
      [8, 2],
      [8, 9],
      [3, 9],
    ],
    speed: 26,
    range: 60,
    half: 0.45,
    lantern: true,
  },
  {
    who: "grantelbart",
    route: [
      [13, 3],
      [22, 3],
      [22, 7],
      [13, 7],
    ],
    speed: 24,
    range: 70,
    half: 0.45,
    lantern: true,
  },
];

/** The lantern turning in the east store: where (tiles), reach, width, speed and start. */
export const LANTERN = {
  tx: 29,
  ty: 6,
  range: 72,
  half: 0.36,
  /** Radians per second. */
  turn: 0.9,
  start: 0,
} as const;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Width and height of the workshop, logical px. */
export const LEVEL_W = ROWS[0].length * TILE;
export const LEVEL_H = ROWS.length * TILE;

/** Step of a sight line, logical px. */
const LINE_STEP = 2;

/** Tiles nobody walks through and nobody sees through. */
const SOLID = "#DBSCL";

/**
 * The tile at a point.
 *
 * @param x - logical px in the workshop
 * @param y - logical px in the workshop
 * @returns its character; outside counts as wall
 */
export function tileAt(x: number, y: number): string {
  const row = ROWS[Math.floor(y / TILE)] as string | undefined;
  return row?.[Math.floor(x / TILE)] ?? "#";
}

/**
 * Whether a point is inside something solid.
 *
 * @param x - logical px in the workshop
 * @param y - logical px in the workshop
 * @returns true for walls, the door and furniture
 */
export function solidAt(x: number, y: number): boolean {
  return SOLID.includes(tileAt(x, y));
}

/**
 * Whether one point can see another: nothing solid on the line between.
 *
 * @param ax - from, logical px
 * @param ay - from, logical px
 * @param bx - to, logical px
 * @param by - to, logical px
 * @returns true when the line is clear
 */
export function clearLine(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): boolean {
  const length = Math.hypot(bx - ax, by - ay);
  const steps = Math.ceil(length / LINE_STEP);
  let clear = true;
  for (let k = 1; k < steps && clear; k += 1) {
    const t = k / steps;
    clear = !solidAt(ax + (bx - ax) * t, ay + (by - ay) * t);
  }
  return clear;
}

/**
 * How far a light ray goes from a point in a direction before something
 * solid stops it.
 *
 * @param x - from, logical px
 * @param y - from, logical px
 * @param angle - direction, radians
 * @param range - farthest, logical px
 * @returns the distance, logical px
 */
export function rayLength(
  x: number,
  y: number,
  angle: number,
  range: number,
): number {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let d = 0;
  while (d < range && !solidAt(x + dx * d, y + dy * d)) {
    d += LINE_STEP;
  }
  return Math.min(d, range);
}

/**
 * Every tile with a given character.
 *
 * @param mark - the character
 * @returns the tiles' middles, logical px, row by row
 */
export function find(mark: string): { x: number; y: number }[] {
  const found: { x: number; y: number }[] = [];
  ROWS.forEach((row, ty) => {
    [...row].forEach((tile, tx) => {
      if (tile === mark) {
        found.push({ x: (tx + 1 / 2) * TILE, y: (ty + 1 / 2) * TILE });
      }
    });
  });
  return found;
}
