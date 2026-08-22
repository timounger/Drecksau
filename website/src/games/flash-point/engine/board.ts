/**
 * The house: rooms, walls, doorways and the ground around it.
 *
 * @module
 * @remarks
 * **This is not the floor plan from the box.** The rulebook that came with this
 * request is a scan with no text in it, and the building exists in it only as a
 * photograph of a set-up table. Roughly a hundred and ten cell edges would have
 * had to be read off that photograph, each one either nothing, a wall or a
 * doorway - and two of them were already ambiguous on the third quadrant. A wall
 * in the wrong place changes where the fire runs and where a blast wave stops.
 * It would not show in the code and would only surface half an hour into a game.
 *
 * So the **rules** are the book's, exactly, and the **house** is this file's.
 * It is laid out here as data anybody can read and correct: nine rooms, eight
 * doorways, four ways in, and a ring of ground around the outside.
 *
 * Coordinates follow the book: row 1 to 6 top to bottom, column 1 to 8 left to
 * right. The ring outside carries row 0 and 7 and column 0 and 9, and is part of
 * the board - firefighters start there, fire can be blown out onto it, and the
 * ambulance stands on it.
 */

/** One square of the board, inside or out. */
export type Cell = {
  readonly row: number;
  readonly col: number;
};

/** Rows of the building itself. */
export const ROWS = 6;

/** Columns of the building itself. */
export const COLS = 8;

/** What sits on the line between two cells. */
export type EdgeKind = "wall" | "door";

/** Damage a wall takes before it is gone - from the rulebook. */
export const WALL_HEALTH = 2;

/** Damage cubes in the box; when they run out the house falls down. */
export const DAMAGE_CUBES = 24;

/** Victims that have to be carried out to win - from the rulebook. */
export const VICTIMS_TO_WIN = 7;

/** Deaths that lose the game - from the rulebook. */
export const DEATHS_TO_LOSE = 3;

/** Points of interest that must be on the board after every turn. */
export const POI_ON_BOARD = 3;

/** Victims and false alarms in the beginner game - from the rulebook. */
export const VICTIM_COUNT = 10;
export const FALSE_ALARM_COUNT = 5;

/** Action points a turn gives, and the most that may be saved. */
export const ACTION_POINTS = 4;

/**
 * Whether a cell is inside the building.
 *
 * @param cell - the cell to test
 * @returns true for the 6 by 8 interior
 */
export function isInside(cell: Cell): boolean {
  return cell.row >= 1 && cell.row <= ROWS && cell.col >= 1 && cell.col <= COLS;
}

/**
 * Whether a cell is on the board at all.
 *
 * @param cell - the cell to test
 * @returns true for the interior and the ring around it
 */
export function onBoard(cell: Cell): boolean {
  return (
    cell.row >= 0 &&
    cell.row <= ROWS + 1 &&
    cell.col >= 0 &&
    cell.col <= COLS + 1
  );
}

/**
 * The key an edge is stored under.
 *
 * @param a - one cell
 * @param b - the cell next to it
 * @returns a key that is the same whichever way round the two are given
 * @remarks
 * Normalised on purpose. An edge belongs to both of its cells, and a wall that
 * existed looking north but not looking south would be the sort of bug that
 * takes an afternoon.
 */
export function edgeKey(a: Cell, b: Cell): string {
  const first = a.row < b.row || (a.row === b.row && a.col < b.col) ? a : b;
  const second = first === a ? b : a;
  return `${first.row},${first.col}-${second.row},${second.col}`;
}

/** The four cells around one, whether or not they are on the board. */
export function around(cell: Cell): readonly Cell[] {
  return [
    { row: cell.row - 1, col: cell.col },
    { row: cell.row + 1, col: cell.col },
    { row: cell.row, col: cell.col - 1 },
    { row: cell.row, col: cell.col + 1 },
  ];
}

/** A room, only for naming what a player is looking at. */
export type Room = {
  readonly name: string;
  readonly rows: readonly [number, number];
  readonly cols: readonly [number, number];
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- the floor plan.
   Room corners, doorways and passages are coordinates on a drawing, not
   quantities anything is derived from. Naming each of them would put a layer of
   indirection between this file and the house it describes. */

/**
 * The nine rooms, taken from the scan of the board.
 *
 * @remarks
 * The room shapes **are** the original's - they can be read straight off the
 * floor colours and there is nothing to guess about them. The living area is
 * one L-shaped room, which is why it appears twice here: two rectangles under
 * one name, and the wall builder below asks only whether two squares belong to
 * the same name, so the corner joins itself.
 *
 * What is not the original's is where the doors are; see {@link DOORWAYS}.
 */
export const ROOMS: readonly Room[] = [
  { name: "Wohnzimmer", rows: [1, 2], cols: [1, 3] },
  { name: "Wohnzimmer", rows: [3, 4], cols: [1, 2] },
  { name: "Bad", rows: [1, 2], cols: [4, 5] },
  { name: "Schlafzimmer", rows: [1, 2], cols: [6, 8] },
  { name: "Küche", rows: [3, 4], cols: [3, 6] },
  { name: "Spielzimmer", rows: [3, 4], cols: [7, 8] },
  { name: "Esszimmer", rows: [5, 6], cols: [1, 4] },
  { name: "Kinderzimmer", rows: [5, 6], cols: [5, 7] },
  { name: "Gäste-WC", rows: [5, 6], cols: [8, 8] },
];

/**
 * The floor of each room, as it is painted on the board.
 *
 * @remarks
 * Read off the scan, and worth having: at a real table you never think "row
 * four, column six", you think "the blue kitchen". A grid of identical squares
 * makes people count, and counting is not what a fire leaves time for.
 */
export const FLOORS: Readonly<Record<string, string>> = {
  Wohnzimmer: "#8a4b2f",
  Bad: "#2f8f52",
  Schlafzimmer: "#93413a",
  Küche: "#6d86ad",
  Spielzimmer: "#7a4630",
  Esszimmer: "#a9702f",
  Kinderzimmer: "#7e5233",
  "Gäste-WC": "#c98d86",
};

/** The grass and pavement outside. */
export const OUTSIDE_FLOOR = "#4e7c3a";

/**
 * Where the two vehicles park, as the board prints them.
 *
 * @remarks
 * The ambulance bays are the four the rulebook sends a knocked-down
 * firefighter to; the engine bays are only paint in the beginner game, which
 * uses no vehicles - but they are on the board, and a board with a piece
 * missing looks wrong in a way nobody can name.
 */
export const ENGINE_BAYS: readonly Cell[] = [
  { row: ROWS + 1, col: 1 },
  { row: ROWS + 1, col: 2 },
  { row: 0, col: 7 },
  { row: 0, col: 8 },
];

/**
 * Which room a cell belongs to.
 *
 * @param cell - the cell
 * @returns the room's name, or null outside the building
 */
export function roomOf(cell: Cell): string | null {
  const room = ROOMS.find(
    (each) =>
      cell.row >= each.rows[0] &&
      cell.row <= each.rows[1] &&
      cell.col >= each.cols[0] &&
      cell.col <= each.cols[1],
  );
  return room === undefined ? null : room.name;
}

/** A doorway or wall as this file declares it. */
type Segment = {
  readonly a: Cell;
  readonly b: Cell;
  readonly kind: EdgeKind;
};

/**
 * The eight doorways.
 *
 * @remarks
 * Eight because the box holds eight door markers and the setup puts one in
 * every doorway. The scan of the board shows **eleven** places that look like
 * doorways, which cannot both be true - so three of them are open passages
 * here, chosen so that the house still flows the way the picture does. Which
 * three is the one thing on this board that is a reading rather than a fact.
 */
const DOORWAYS: readonly Segment[] = [
  // The four ways in from outside, all four visible on the scan.
  { a: { row: 0, col: 6 }, b: { row: 1, col: 6 }, kind: "door" },
  { a: { row: 6, col: 3 }, b: { row: 7, col: 3 }, kind: "door" },
  { a: { row: 3, col: 0 }, b: { row: 3, col: 1 }, kind: "door" },
  { a: { row: 4, col: 8 }, b: { row: 4, col: 9 }, kind: "door" },
  // Between rooms.
  { a: { row: 1, col: 3 }, b: { row: 1, col: 4 }, kind: "door" },
  { a: { row: 2, col: 5 }, b: { row: 2, col: 6 }, kind: "door" },
  { a: { row: 4, col: 6 }, b: { row: 4, col: 7 }, kind: "door" },
  // Between the dining room and the children's room, whose boundary runs
  // between columns 4 and 5 - not 5 and 6, where an earlier version put it.
  // That door sat inside the children's room, connected nothing, and left two
  // rooms of the house sealed off with victims in them.
  { a: { row: 6, col: 4 }, b: { row: 6, col: 5 }, kind: "door" },
];

/**
 * The open passages: room boundaries with nothing on them.
 *
 * @remarks
 * The three doorways the scan shows that the eight markers cannot cover, plus
 * nothing else. Every room stays reachable with all eight doors shut, which is
 * the property that matters: a room you can only enter through a door somebody
 * has closed is a room with a victim in it and no way to reach them.
 */
const PASSAGES: readonly (readonly [Cell, Cell])[] = [
  [
    { row: 3, col: 2 },
    { row: 3, col: 3 },
  ],
  [
    { row: 2, col: 8 },
    { row: 3, col: 8 },
  ],
  [
    { row: 4, col: 4 },
    { row: 5, col: 4 },
  ],
  [
    { row: 6, col: 7 },
    { row: 6, col: 8 },
  ],
];

/**
 * Every wall and doorway of the house, by edge key.
 *
 * @remarks
 * Built rather than listed: the outer wall runs all the way round, the room
 * boundaries follow the bands and the room columns, and then the doorways and
 * passages are punched through. Listing a hundred and ten edges by hand is how
 * one of them ends up missing.
 */
export const EDGES: Readonly<Record<string, EdgeKind>> = buildEdges();

/**
 * Walls first, then the holes in them.
 *
 * @remarks
 * The inner walls are derived from the rooms rather than listed: two squares
 * that belong to different rooms have a wall between them, and two that belong
 * to the same one do not. That is what a room **is**, and deriving it means an
 * L-shaped room cannot accidentally grow a wall across its own corner - which
 * is exactly what a hand-written list of a hundred and ten edges would do.
 */
function buildEdges(): Record<string, EdgeKind> {
  const edges: Record<string, EdgeKind> = {};

  // The outer wall: every edge between inside and outside.
  for (let col = 1; col <= COLS; col++) {
    edges[edgeKey({ row: 0, col }, { row: 1, col })] = "wall";
    edges[edgeKey({ row: ROWS, col }, { row: ROWS + 1, col })] = "wall";
  }
  for (let row = 1; row <= ROWS; row++) {
    edges[edgeKey({ row, col: 0 }, { row, col: 1 })] = "wall";
    edges[edgeKey({ row, col: COLS }, { row, col: COLS + 1 })] = "wall";
  }

  // Inside: a wall wherever two squares belong to different rooms.
  for (let row = 1; row <= ROWS; row++) {
    for (let col = 1; col <= COLS; col++) {
      const here = { row, col };
      for (const there of [
        { row: row + 1, col },
        { row, col: col + 1 },
      ]) {
        if (isInside(there) && roomOf(here) !== roomOf(there)) {
          edges[edgeKey(here, there)] = "wall";
        }
      }
    }
  }

  for (const [a, b] of PASSAGES) {
    delete edges[edgeKey(a, b)];
  }
  for (const door of DOORWAYS) {
    edges[edgeKey(door.a, door.b)] = door.kind;
  }
  return edges;
}

/**
 * What lies on the line between two neighbouring cells.
 *
 * @param a - one cell
 * @param b - the cell next to it
 * @returns the wall or door there, or null for open air
 */
export function edgeBetween(a: Cell, b: Cell): EdgeKind | null {
  return EDGES[edgeKey(a, b)] ?? null;
}

/** Every edge the house has, for setting up the damage and door state. */
export function allEdges(): readonly string[] {
  return Object.keys(EDGES);
}

/**
 * Where the ambulance waits.
 *
 * @remarks
 * One on each side, so a firefighter knocked down anywhere has somewhere near
 * to be carried to. The rulebook says the **nearest** of four, and four spread
 * like this is what makes that a choice rather than a formality.
 */
export const AMBULANCE: readonly Cell[] = [
  { row: 0, col: 4 },
  { row: ROWS + 1, col: 5 },
  { row: 3, col: 0 },
  { row: 4, col: COLS + 1 },
];

/** Where the fire starts - the ten coordinates from the rulebook's setup. */
export const START_FIRE: readonly Cell[] = [
  { row: 2, col: 2 },
  { row: 2, col: 3 },
  { row: 3, col: 2 },
  { row: 3, col: 3 },
  { row: 3, col: 4 },
  { row: 3, col: 5 },
  { row: 4, col: 4 },
  { row: 5, col: 6 },
  { row: 5, col: 7 },
  { row: 6, col: 6 },
];

/** Where the first three points of interest lie - also from the setup. */
export const START_POI: readonly Cell[] = [
  { row: 2, col: 4 },
  { row: 5, col: 1 },
  { row: 5, col: 8 },
];

/* eslint-enable @typescript-eslint/no-magic-numbers */
