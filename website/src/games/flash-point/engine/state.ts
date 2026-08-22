/**
 * What a fire looks like from the outside, and the sums that read it.
 *
 * @module
 * @remarks
 * Plain JSON, flat, like every game here - it has to survive storage and the
 * wire unchanged. The board is a map from `"row,col"` to what is on that square,
 * rather than a nested array, because most squares hold nothing and a sparse map
 * is both smaller on the wire and impossible to index wrongly.
 *
 * One thing is deliberately hidden and one is deliberately not. A point of
 * interest keeps its identity secret until somebody walks onto it - that is the
 * game's one unknown. Everything else is on the table: this is a cooperative
 * game and the players are meant to be talking.
 */
import {
  ACTION_POINTS,
  DAMAGE_CUBES,
  WALL_HEALTH,
  allEdges,
  type Cell,
} from "./board";

/** How a fire ends. */
export type Stage =
  /** Somebody is spending action points. */
  | "acting"
  /** Everybody got out and seven are safe. */
  | "won"
  /** Three are dead, or the house came down. */
  | "lost";

/** Why it ended badly. */
export type Failure = "deaths" | "collapse";

/** What is burning on a square. */
export type Blaze = "smoke" | "fire";

/** What a point of interest turns out to be. */
export type Poi = "victim" | "falseAlarm";

/** A point of interest on the board, face down until somebody looks. */
export type Marker = {
  /** What it really is - never shown before {@link revealed}. */
  readonly kind: Poi;
  readonly revealed: boolean;
};

/** A door, and what has happened to it. */
export type DoorState = "closed" | "open" | "gone";

/** One firefighter. */
export type Firefighter = {
  readonly name: string;
  readonly isBot: boolean;
  readonly at: Cell;
  /** Action points in hand, this turn's four plus anything saved. */
  readonly ap: number;
  /** Points saved from earlier turns, never more than four. */
  readonly saved: number;
  /** True while carrying somebody out. */
  readonly carrying: boolean;
};

/** A whole fire. */
export type FlashPointGame = {
  readonly stage: Stage;
  readonly failure: Failure | null;
  readonly players: readonly Firefighter[];
  /** Whose turn it is. */
  readonly active: number;
  /** Turns played, counted for the log and nothing else. */
  readonly turn: number;
  /** Smoke and fire, by `"row,col"`. */
  readonly blaze: Readonly<Record<string, Blaze>>;
  /** Points of interest still on the board, by `"row,col"`. */
  readonly pois: Readonly<Record<string, Marker>>;
  /** Damage on each wall, by edge key. */
  readonly damage: Readonly<Record<string, number>>;
  /** What each doorway is doing, by edge key. */
  readonly doors: Readonly<Record<string, DoorState>>;
  /** Damage cubes still in the box. */
  readonly cubes: number;
  /** Carried out alive. */
  readonly rescued: number;
  /** Burned, or dropped by a firefighter who was knocked down. */
  readonly dead: number;
  /** Victims and false alarms not yet drawn, shuffled. */
  readonly bag: readonly Poi[];
  readonly log: readonly string[];
  readonly rng: number;
  readonly seed: number;
};

/** What a player may do. */
export type FlashPointMove =
  /** Walk to a neighbouring square. */
  | { readonly kind: "move"; readonly to: Cell }
  /** Open or shut a door on one of this square's edges. */
  | { readonly kind: "door"; readonly to: Cell }
  /** Put out what is burning here or next door. */
  | { readonly kind: "extinguish"; readonly at: Cell }
  /** Take an axe to the wall between here and there. */
  | { readonly kind: "chop"; readonly to: Cell }
  /** Pick up or put down the victim on this square. */
  | { readonly kind: "carry" }
  /** Stop, keep what is left, and let the fire have its turn. */
  | { readonly kind: "endTurn" };

/** The key a square is stored under. */
export function cellKey(cell: Cell): string {
  return `${cell.row},${cell.col}`;
}

/** The square a key came from. */
export function cellOf(key: string): Cell {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

/** Whether two squares are the same one. */
export function sameCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

/** What is burning on a square, if anything. */
export function blazeAt(game: FlashPointGame, cell: Cell): Blaze | null {
  return game.blaze[cellKey(cell)] ?? null;
}

/** Whether a square is on fire - the one that costs two points to enter. */
export function isBurning(game: FlashPointGame, cell: Cell): boolean {
  return blazeAt(game, cell) === "fire";
}

/** The point of interest on a square, if there is one. */
export function poiAt(game: FlashPointGame, cell: Cell): Marker | null {
  return game.pois[cellKey(cell)] ?? null;
}

/** How much damage a wall has taken. */
export function damageOn(game: FlashPointGame, edge: string): number {
  return game.damage[edge] ?? 0;
}

/** Whether a wall has taken all it can. */
export function isBroken(game: FlashPointGame, edge: string): boolean {
  return damageOn(game, edge) >= WALL_HEALTH;
}

/** The firefighter whose turn it is. */
export function activePlayer(game: FlashPointGame): Firefighter {
  return game.players[game.active];
}

/** Everybody standing on a square. */
export function playersOn(game: FlashPointGame, cell: Cell): readonly number[] {
  return game.players
    .map((player, index) => (sameCell(player.at, cell) ? index : -1))
    .filter((index) => index >= 0);
}

/** Victims still to be found, so the screen can say how it stands. */
export function victimsLeft(game: FlashPointGame): number {
  const onBoard = Object.values(game.pois).filter(
    (marker) => marker.kind === "victim",
  ).length;
  const inBag = game.bag.filter((kind) => kind === "victim").length;
  return onBoard + inBag;
}

/**
 * A board with nothing damaged and every door shut.
 *
 * @returns the doors and damage a fresh house starts with
 */
export function freshHouse(): {
  readonly doors: Record<string, DoorState>;
  readonly damage: Record<string, number>;
} {
  const doors: Record<string, DoorState> = {};
  const damage: Record<string, number> = {};
  for (const edge of allEdges()) {
    damage[edge] = 0;
  }
  return { doors, damage };
}

/** Action points a firefighter starts a turn with. */
export function turnPoints(saved: number): number {
  return ACTION_POINTS + saved;
}

/** Damage cubes still in the box, for the screen. */
export function cubesLeft(game: FlashPointGame): number {
  return Math.max(0, game.cubes);
}

/** Whether the house has run out of damage cubes. */
export function hasCollapsed(game: FlashPointGame): boolean {
  return game.cubes <= 0;
}

/** Cubes the box holds, for the screen's "x of 24". */
export const TOTAL_CUBES = DAMAGE_CUBES;
