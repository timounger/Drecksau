/**
 * *Die Flüsse von Catan* - the second of the five Händler & Barbaren scenarios.
 *
 * @module
 * @remarks
 * Two rivers run across the island. Building a road or a settlement on one
 * earns **gold**, gold buys resources, and the two people at the ends of the
 * gold table get a tile: one point for the richest, minus two for the poorest.
 *
 * The rules are read out of `game_instructions/catan_babaren.pdf`, pages 10 to
 * 12, and written up in `docs/games/catan/szenarien.md`.
 */
import { islandOf, type Island } from "./board";
import type { CatanGame, Land, Resource } from "./state";

/**
 * How many landscapes each of the two printed river tiles covers.
 *
 * @remarks
 * "2 Flussfelder (1 Fluss mit 3 Landschaften, einer mit 4)."
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the two lengths are the
   material list, quoted. */
export const RIVER_RUNS: readonly number[] = [4, 3];

/**
 * The three river tiles of the bigger board.
 *
 * @remarks
 * The 5-6 booklet adds "1 Flussfeld" to the two printed ones and names the
 * twenty landscapes that fill the rest - "2x Gebirge, 3x Hügelland, 3x
 * Weideland, 6x Wald und 6x Ackerland". Twenty and thirty leave ten for the
 * rivers, and the two printed ones account for seven, so the third carries
 * three.
 */
export const BIG_RIVER_RUNS: readonly number[] = [4, 3, 3];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * What a bridge costs: 2 Lehm + 1 Holz.
 *
 * @remarks
 * Written as a full hand so it can go straight through the referee's ordinary
 * spend, the same way a road or a settlement does.
 */
export const BRIDGE_PRICE: Readonly<Record<Resource, number>> = {
  lehm: 2,
  holz: 1,
  wolle: 0,
  getreide: 0,
  erz: 0,
};

/** How many bridges one player gets for the whole game. */
export const BRIDGES_EACH = 3;

/** Gold for a road or a settlement on the river, and for a bridge. */
export const GOLD_FOR_ROAD = 1;
export const GOLD_FOR_TOWN = 1;
export const GOLD_FOR_BRIDGE = 3;

/** What buying a resource with gold costs, and how often a turn. */
export const GOLD_PER_BUY = 2;
export const BUYS_PER_TURN = 2;

/** What the two tiles are worth. */
export const RICHEST_POINTS = 1;
export const POOREST_POINTS = -2;

/**
 * The landscapes this scenario deals, and where the fixed ones go.
 *
 * @remarks
 * The rulebook names the twelve that make up the rest of the island - "1x
 * Hügelland, 4x Wald, 2x Weideland, 4x Ackerland, 1x Gebirge" - and the other
 * seven are printed on the two river tiles. Those seven are read off the
 * picture: each river starts in a **marsh** and runs on through the landscapes
 * shown, and the two runs together account for the difference between twelve
 * and nineteen.
 *
 * Upstream first, so the first entry of each run is its marsh.
 */
export const RIVER_LAND: readonly (readonly Land[])[] = [
  ["sumpf", "wolle", "lehm", "erz"],
  ["sumpf", "lehm", "erz"],
];

/**
 * The landscapes of the three river tiles.
 *
 * @remarks
 * The third tile's own fields are printed on it and named nowhere, so its three
 * are a **reconstruction**: a marsh at the source like the other two, and two
 * fields that keep the whole island's mix even against the twenty the booklet
 * counts out for the rest.
 */
export const BIG_RIVER_LAND: readonly (readonly Land[])[] = [
  ["sumpf", "wolle", "lehm", "erz"],
  ["sumpf", "lehm", "erz"],
  ["sumpf", "wolle", "getreide"],
];

/**
 * The twenty landscapes the rest of the bigger island is built from.
 *
 * @remarks
 * "2x Gebirge, 3x Hügelland, 3x Weideland, 6x Wald und 6x Ackerland."
 */
export const BIG_REST_LAND: readonly Land[] = [
  "lehm",
  "lehm",
  "lehm",
  "holz",
  "holz",
  "holz",
  "holz",
  "holz",
  "holz",
  "wolle",
  "wolle",
  "wolle",
  "getreide",
  "getreide",
  "getreide",
  "getreide",
  "getreide",
  "getreide",
  "erz",
  "erz",
];

/** The twelve landscapes the rest of the island is built from. */
export const REST_LAND: readonly Land[] = [
  "lehm",
  "holz",
  "holz",
  "holz",
  "holz",
  "wolle",
  "wolle",
  "getreide",
  "getreide",
  "getreide",
  "getreide",
  "erz",
];

/** The size the printed island stops at. */
const SMALL_RIVER_HEXES = 19;

/** Whether this game is the rivers scenario. */
export function rivers(game: CatanGame): boolean {
  return game.scenario === "fluesse";
}

/**
 * Where the two rivers run, and what they touch.
 *
 * @remarks
 * The rulebook shows the rivers only as a picture, on the fixed starting
 * layout - and this table builds its island variably. So the layout is
 * reconstructed as a **shape** rather than copied as a list of numbers.
 *
 * What the picture shows: each river tile is a horizontal run of landscapes
 * with the water flowing left to right through the middle of every one of
 * them. A pointy-top hex has vertical left and right edges, so the water
 * **crosses** those - and a crossing of the water is exactly a place you would
 * need a bridge.
 *
 * That reconstruction can be checked against the one hard number the rulebook
 * gives. Each run is crossed at every edge between two of its landscapes, plus
 * once more where the water leaves the last one: `(4-1)+1` and `(3-1)+1`, which
 * is **seven bridge sites** - "eine Brücke darf nur auf einem der 7
 * Brückenbauplätze gebaut werden".
 */
export type Rivers = {
  /** The landscapes the water runs through, upstream first. */
  readonly hexes: readonly number[];
  /** The paths the water crosses: the only places a bridge may go. */
  readonly bridges: readonly number[];
  /** The crossings on the bank, where a settlement earns gold. */
  readonly crossings: readonly number[];
  /** The paths along the bank, where a road earns gold. */
  readonly paths: readonly number[];
  /** The two marshes at the sources, which carry no number chip. */
  readonly marshes: readonly number[];
};

/** No rivers at all: what every game outside this scenario carries. */
export const NO_RIVERS: Rivers = {
  hexes: [],
  bridges: [],
  crossings: [],
  paths: [],
  marshes: [],
};

/**
 * Lays the two rivers on an island.
 *
 * @param board - the island
 * @returns everything the scenario needs to know about the water
 * @remarks
 * The four-landscape river takes the second row and the three-landscape one the
 * left of the third, which is where the picture puts them: the two runs sit one
 * above the other, left of centre, with a marsh at the upstream end of each.
 */
export function layRivers(board: Island): Rivers {
  const rows = rowsOf(board);
  // Two rivers on the printed island, three once the 5-6 Erweiterung is in -
  // each one row further down, which is where the picture puts them.
  const lengths =
    board.hexes.length > SMALL_RIVER_HEXES ? BIG_RIVER_RUNS : RIVER_RUNS;
  const runs = lengths.map((length, at) =>
    (rows[at + 1] ?? []).slice(0, length),
  );
  const hexes: number[] = [];
  const bridges = new Set<number>();
  const marshes: number[] = [];
  for (const run of runs) {
    if (run.length === 0) {
      continue;
    }
    marshes.push(run[0]);
    hexes.push(...run);
    for (let step = 0; step < run.length; step++) {
      // The edge the water leaves this landscape by: the one it shares with the
      // next landscape along, or - for the last one - its own right-hand edge.
      const crossed =
        step + 1 < run.length
          ? sharedPath(board, run[step], run[step + 1])
          : rightEdge(board, run[step]);
      if (crossed !== null) {
        bridges.add(crossed);
      }
    }
  }
  const crossings = new Set<number>();
  for (const path of bridges) {
    for (const end of board.paths[path].ends) {
      crossings.add(end);
    }
  }
  // The banks: every other path meeting a bank crossing. A bridge site is the
  // water itself and is never one of them.
  const paths = new Set<number>();
  for (const crossing of crossings) {
    for (const path of board.crossings[crossing].paths) {
      if (!bridges.has(path)) {
        paths.add(path);
      }
    }
  }
  return {
    hexes,
    bridges: [...bridges],
    crossings: [...crossings],
    paths: [...paths],
    marshes,
  };
}

/** The landscapes of the island, row by row, left to right. */
function rowsOf(board: Island): readonly (readonly number[])[] {
  const rows: number[][] = [];
  for (const hex of board.hexes) {
    rows[hex.row] = [...(rows[hex.row] ?? []), hex.id];
  }
  return rows.map((row) => [...row].sort((one, other) => one - other));
}

/** The path two neighbouring landscapes share, if they touch. */
function sharedPath(board: Island, one: number, other: number): number | null {
  const found = board.paths.find(
    (path) => path.hexes.includes(one) && path.hexes.includes(other),
  );
  return found?.id ?? null;
}

/**
 * The right-hand edge of a landscape.
 *
 * @param board - the island
 * @param hex - the landscape
 * @returns the vertical path on its right, or null at the very edge of the map
 * @remarks
 * A pointy-top hex has two vertical edges, and the right one is the pair of
 * corners furthest to the right. That is where the water leaves the last
 * landscape of a run.
 */
function rightEdge(board: Island, hex: number): number | null {
  const corners = [...board.hexes[hex].corners].sort(
    (one, other) => board.crossings[other].x - board.crossings[one].x,
  );
  const [first, second] = corners;
  const found = board.paths.find(
    (path) =>
      path.ends.includes(first) &&
      path.ends.includes(second) &&
      path.hexes.includes(hex),
  );
  return found?.id ?? null;
}

/**
 * Whether a bridge may go here.
 *
 * @param game - the game
 * @param at - the path
 * @returns true on a free bridge site
 */
export function bridgeSite(game: CatanGame, at: number): boolean {
  return rivers(game) && game.rivers.bridges.includes(at);
}

/** The gold a new road or settlement earns. */
export function goldFor(
  game: CatanGame,
  kind: "road" | "town" | "bridge",
  at: number,
): number {
  let gold = 0;
  if (rivers(game)) {
    if (kind === "bridge") {
      gold = GOLD_FOR_BRIDGE;
    } else if (kind === "road" && game.rivers.paths.includes(at)) {
      gold = GOLD_FOR_ROAD;
    } else if (kind === "town" && game.rivers.crossings.includes(at)) {
      gold = GOLD_FOR_TOWN;
    }
  }
  return gold;
}

/**
 * Who holds the two gold tiles.
 *
 * @param game - the game
 * @returns the richest seat, or null, and every poorest seat
 * @remarks
 * Two different shapes, and the rulebook is careful about both. The **richest**
 * tile belongs to whoever has the most gold **alone** - "gibt es keine solche
 * Person, wird das Plättchen so lange beiseitegelegt". The **poorest** tile
 * goes to *everybody* who has the least, and "haben alle gleich viel Gold oder
 * kein Gold, erhalten alle das Plättchen".
 */
export function goldTiles(
  game: CatanGame,
  seats: readonly number[],
): { readonly richest: number | null; readonly poorest: readonly number[] } {
  const golds = seats.map((seat) => game.players[seat].gold);
  const most = Math.max(...golds);
  const least = Math.min(...golds);
  const leaders = seats.filter((seat) => game.players[seat].gold === most);
  return {
    richest: leaders.length === 1 && most > least ? leaders[0] : null,
    poorest: seats.filter((seat) => game.players[seat].gold === least),
  };
}

/** What the two tiles are worth to a seat. */
export function goldPoints(game: CatanGame, seat: number): number {
  return rivers(game)
    ? (game.richest === seat ? RICHEST_POINTS : 0) +
        (game.poorest.includes(seat) ? POOREST_POINTS : 0)
    : 0;
}

/** The landscapes with no number chip: the two marshes. */
export function marshOf(game: CatanGame): readonly number[] {
  return rivers(game) ? game.rivers.marshes : [];
}

/** Whether a landscape lies on a river, for the board to paint it. */
export function onRiver(game: CatanGame, hex: number): boolean {
  return rivers(game) && game.rivers.hexes.includes(hex);
}

/** The island a game is played on, for callers that only hold the state. */
export function boardOf(game: CatanGame): Island {
  return islandOf(game.land.length);
}
