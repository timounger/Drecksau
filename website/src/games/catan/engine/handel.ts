/**
 * *Händler & Barbaren* - the fifth and last of the five scenarios.
 *
 * @module
 * @remarks
 * The barbarians have been driven off and the castle is being rebuilt. Everyone
 * runs a **Trosswagen** along the roads, hauling one load at a time between
 * three sites: the castle wants marble and glass, the quarry wants tools, the
 * glassworks wants sand. Every delivery is a victory point and a purse of gold,
 * and the roads people built are what the wagons drive on - so a rival's road
 * costs a gold coin to use.
 *
 * What that changes about Catan:
 *
 * - three of the nineteen fields are **sites**, not landscapes: no chip, no
 *   yield, and one crossing in the middle nobody may build on,
 * - the island is dealt from sixteen tiles and sixteen chips - the desert, the
 *   2 and the 12 are all out of the box,
 * - a turn ends with a **drive**: movement points, tolls, and three barbarians
 *   sitting on paths,
 * - the **Wagen-Tableau** is upgraded five steps, which buys movement, reward
 *   and the die roll that shifts a barbarian,
 * - there is no robber and no Längste Handelsroute, and the game runs to
 *   thirteen.
 *
 * The rules are read out of `game_instructions/catan_babaren.pdf`, pages 20 to
 * 24, and written up in `docs/games/catan/szenarien.md`.
 */
import { islandOf, type Island } from "./board";
import type { CatanGame, Hand, Land } from "./state";

/** The three sites the wagons drive between. */
export const TARGETS = ["burg", "steinbruch", "huette"] as const;

/** One of them. */
export type Target = (typeof TARGETS)[number];

/** The four wares. */
export const WARES = ["glas", "marmor", "werkzeug", "sand"] as const;

/** One of them. */
export type Ware = (typeof WARES)[number];

/** What each site is called. */
export const TARGET_NAMES: Readonly<Record<Target, string>> = {
  burg: "Burg",
  steinbruch: "Marmorsteinbruch",
  huette: "Glashütte",
};

/** The short name, for the label that has to fit inside a hex. */
export const TARGET_SHORT: Readonly<Record<Target, string>> = {
  burg: "Burg",
  steinbruch: "Steinbruch",
  huette: "Glashütte",
};

/** What each ware is called. */
export const WARE_NAMES: Readonly<Record<Ware, string>> = {
  glas: "Glas",
  marmor: "Marmor",
  werkzeug: "Werkzeug",
  sand: "Sand",
};

/**
 * Where each ware has to go.
 *
 * @remarks
 * "Die Burg benötigt Marmor und Glas. Der Steinbruch benötigt Werkzeug. Die
 * Glashütte benötigt Sand." Four wares, three destinations, and a load always
 * knows where it is going the moment it is drawn.
 */
export const WARE_GOES: Readonly<Record<Ware, Target>> = {
  glas: "burg",
  marmor: "burg",
  werkzeug: "steinbruch",
  sand: "huette",
};

/**
 * What each site sends out.
 *
 * @remarks
 * "Von dort werden Werkzeug und Sand geliefert" (the castle), "von dort wird
 * Marmor und Sand geliefert" (the quarry), "von dort wird Glas und Werkzeug
 * geliefert" (the glassworks). Two wares a site, six of each in its stack of
 * twelve - "36 Warenplättchen (12 pro Sorte)", sorted by their backs into three
 * piles.
 */
export const TARGET_SENDS: Readonly<Record<Target, readonly Ware[]>> = {
  burg: ["werkzeug", "sand"],
  steinbruch: ["marmor", "sand"],
  huette: ["glas", "werkzeug"],
};

/** How many tiles each site's stack holds. */
export const TILES_PER_TARGET = 12;

/** How many barbarians are left over from the last scenario. */
export const RAIDERS = 3;

/** The gold everybody starts with. */
export const START_GOLD = 5;

/** How much higher the finish line is: thirteen rather than ten. */
export const HANDEL_EXTRA = 3;

/** What the top step of the Wagen-Tableau is worth. */
export const TOP_STEP_POINTS = 1;

/** What one delivered load is worth. */
export const HAUL_POINTS = 1;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the tableau is a
   printed track, and these five columns are what is printed on it. */

/**
 * The five steps of the Wagen-Tableau.
 *
 * @remarks
 * The rulebook names the ends and one middle column rather than the whole
 * track: the wagon starts with **4 movement points**, a delivery pays "zwischen
 * 1 und 5 Gold" by step, driving a barbarian off works "ab der zweiten
 * Ausbaustufe", and the printed example has the third step succeed on "eine 5
 * oder 6". Five columns rising evenly from those fixed points is the only track
 * that fits all four statements at once - so the numbers below are read off the
 * rulebook's own edges rather than invented between them.
 */
export const MOVE_POINTS: readonly number[] = [4, 5, 6, 7, 8];

/** What a delivery pays at each step. */
export const REWARD_GOLD: readonly number[] = [1, 2, 3, 4, 5];

/** What a single die has to show to shift a barbarian, by step. */
export const DRIVE_OFF: readonly (readonly number[])[] = [
  [],
  [6],
  [5, 6],
  [4, 5, 6],
  [3, 4, 5, 6],
];

/** What crossing one edge costs. */
export const PATH_MOVE = 2;
export const ROAD_MOVE = 1;
export const RAIDER_MOVE = 2;

/** What using somebody else's road costs them to build and you to drive. */
export const TOLL = 1;

/** What one Getreide buys, once a turn. */
export const GRAIN_MOVE = 2;

/**
 * What each step of the tableau costs.
 *
 * @remarks
 * The four prices are printed "zwischen deiner Ritterfigur und der nächsten
 * freien Spalte" and the rulebook never writes them out, so they are a
 * **reconstruction**. They are paid "in deiner Handels- und Bauphase", which is
 * where resources are spent, and they rise the way every other track in Catan
 * rises: the first step is a road, the last is nearly a city.
 */
export const UPGRADE_COST: readonly Hand[] = [
  { lehm: 1, holz: 1, wolle: 0, getreide: 0, erz: 0 },
  { lehm: 1, holz: 1, wolle: 0, getreide: 0, erz: 1 },
  { lehm: 0, holz: 0, wolle: 0, getreide: 1, erz: 2 },
  { lehm: 0, holz: 0, wolle: 0, getreide: 2, erz: 2 },
];

/**
 * The sixteen landscapes this scenario is dealt from.
 *
 * @remarks
 * "Von den Landschaftsfeldern aus CATAN - Das Spiel sortiert ihr die Wüste und
 * je 1 Ackerland und 1 Weidelandschaft aus. Ihr benötigt also 3x Hügelland, 4x
 * Wald, 3x Weideland, 3x Ackerland, 3x Gebirge." Sixteen, and the three sites
 * make nineteen.
 */
export const HAUL_LAND: readonly Land[] = [
  "lehm",
  "lehm",
  "lehm",
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
  "erz",
  "erz",
  "erz",
];

/**
 * The sites of the bigger board.
 *
 * @remarks
 * "Legt dann die 3 Marmorsteinbrüche, die 3 Glashütten, die 2 Wüsten und die
 * neue Burg gemäß der Abbildung aus." Seven sites rather than three, and two
 * deserts on top - which leaves twenty-one landscapes to fill the rest of the
 * thirty.
 *
 * The loads are shared out from the same three piles whatever the board: "die
 * einzelnen Stapel sind keinem Zielfeld zugeordnet."
 */
export const BIG_TARGETS: readonly Target[] = [
  "burg",
  "steinbruch",
  "steinbruch",
  "steinbruch",
  "huette",
  "huette",
  "huette",
];

/** How many deserts the bigger board carries. */
export const BIG_DESERTS = 2;

/**
 * The twenty-one landscapes of the bigger board.
 *
 * @remarks
 * "Füllt die freien Plätze der Insel zufällig mit Landschaftsfeldern auf" - all
 * of them, from both boxes, so the mix is the printed one carried up: clay and
 * ore the scarcer, wood, wool and grain the commoner.
 */
export const BIG_HAUL_LAND: readonly Land[] = [
  "lehm",
  "lehm",
  "lehm",
  "lehm",
  "holz",
  "holz",
  "holz",
  "holz",
  "holz",
  "wolle",
  "wolle",
  "wolle",
  "wolle",
  "getreide",
  "getreide",
  "getreide",
  "getreide",
  "getreide",
  "erz",
  "erz",
  "erz",
];

/** The two chips that stay in the box, and so the two rolls that repeat. */
export const SKIP_CHIPS: readonly number[] = [2, 12];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** The cards of this scenario's own deck. */
export type HaulCard =
  | "ritter"
  | "strassenbau"
  | "reise"
  | "steinhauerei"
  | "glasproduktion"
  | "werkzeugbau";

/** What each of them is called. */
export const HAUL_CARD_NAMES: Readonly<Record<HaulCard, string>> = {
  ritter: "Ritter",
  strassenbau: "Straßenbau",
  reise: "Gute Reise",
  steinhauerei: "Siegpunkt: Steinhauerei",
  glasproduktion: "Siegpunkt: Glasproduktion",
  werkzeugbau: "Siegpunkt: Werkzeugbau",
};

/** What each of them does. */
export const HAUL_CARD_TEXTS: Readonly<Record<HaulCard, string>> = {
  ritter:
    "Versetze 1 Barbaren auf einen anderen Weg. Auf einer Straße: 1 Handkarte von der Besitzerin.",
  strassenbau: "Baue zwei Straßen kostenlos.",
  reise: "Ein kompletter zweiter Zug mit deinem Trosswagen.",
  steinhauerei: "1 Siegpunkt.",
  glasproduktion: "1 Siegpunkt.",
  werkzeugbau: "1 Siegpunkt.",
};

/** The three that are simply a point. */
export const HAUL_POINT_CARDS: readonly HaulCard[] = [
  "steinhauerei",
  "glasproduktion",
  "werkzeugbau",
];

/**
 * The twenty-five development cards.
 *
 * @remarks
 * "Mischt die Entwicklungskarten dieses Szenarios" - twenty-five of them, and
 * the three victory-point cards are named one by one on the card sheet, so
 * there is exactly one of each. That leaves twenty-two across the three cards
 * that do something, and the split follows the printed game's own shape:
 * knights are much the commonest, the free roads much the rarest.
 */
export const HAUL_DECK: readonly HaulCard[] = [
  ...Array.from({ length: 12 }, () => "ritter" as const),
  ...Array.from({ length: 6 }, () => "reise" as const),
  ...Array.from({ length: 4 }, () => "strassenbau" as const),
  "steinhauerei",
  "glasproduktion",
  "werkzeugbau",
];

/** Whether this game is the hauling scenario. */
export function hauling(game: CatanGame): boolean {
  return game.scenario === "handel";
}

/**
 * One of the three sites.
 *
 * @remarks
 * The printed sites are frame pieces outside the island, each showing a
 * crossing with a building on it and four paths running to it. This table's
 * board is a fixed lattice of nineteen fields, so a site is laid **on** one of
 * them: the field carries no chip and pays nothing, and its most inland corner
 * is the crossing the building stands on.
 *
 * That is a reconstruction of the shape rather than of the picture, and it can
 * be checked against the rulebook's own counting twice over: sixteen landscapes
 * plus three sites is nineteen fields, and sixteen landscapes want exactly the
 * sixteen chips left when the 2 and the 12 go back in the box.
 */
export type Depot = {
  readonly target: Target;
  /** The field the site sits on. */
  readonly hex: number;
  /** The crossing the building stands on - and nobody may build on. */
  readonly gate: number;
  /** The stack of loads waiting there, top first. */
  readonly stack: readonly Ware[];
};

/** No sites at all: what every game outside this scenario carries. */
export const NO_DEPOTS: readonly Depot[] = [];

/**
 * Lays the three sites out.
 *
 * @param board - the island
 * @param stacks - the shuffled stack for each site, in the order of TARGETS
 * @returns the three sites
 * @remarks
 * Spread evenly round the outer ring, which is what "legt die 3 Zielfelder so
 * in den Rahmen, wie auf der Abbildung gezeigt" comes to on a board whose frame
 * is not modelled: three sites, as far from one another as the ring allows, so
 * that a haul is a journey rather than a step.
 */
export function layDepots(
  board: Island,
  stacks: readonly (readonly Ware[])[],
): readonly Depot[] {
  const ring = outerRing(board);
  // Three sites on the printed board, seven on the bigger one.
  const sites = board.hexes.length > SMALL_HAUL_HEXES ? BIG_TARGETS : TARGETS;
  const apart = Math.floor(ring.length / sites.length);
  return sites.map((target, at) => {
    const hex = ring[(at * apart) % ring.length];
    return {
      target,
      hex,
      gate: gateOf(board, hex),
      // The three piles are shared, so every site of a kind draws from the same
      // one: "die einzelnen Stapel sind keinem Zielfeld zugeordnet."
      stack: stacks[TARGETS.indexOf(target)] ?? [],
    };
  });
}

/** The size the printed island stops at. */
const SMALL_HAUL_HEXES = 19;

/** The crossing a site's building stands on: its most inland corner. */
function gateOf(board: Island, hex: number): number {
  return [...board.hexes[hex].corners].sort(
    (one, other) =>
      board.crossings[other].hexes.length - board.crossings[one].hexes.length,
  )[0];
}

/** The outer ring of the island, in order once around. */
export function outerRing(board: Island): readonly number[] {
  const spiral = board.spirals[board.cornerHexes[0]] ?? [];
  const edge = new Set(
    board.hexes
      .filter((hex) =>
        hex.rim.some((path) => board.paths[path].hexes.length === 1),
      )
      .map((hex) => hex.id),
  );
  return spiral.filter((hex) => edge.has(hex));
}

/** The stack of twelve a site starts with: six of each ware it sends. */
export function stackFor(target: Target): readonly Ware[] {
  const sends = TARGET_SENDS[target];
  return Array.from(
    { length: TILES_PER_TARGET },
    (unused, at) => sends[at % sends.length],
  );
}

/** The site a crossing belongs to, if it is one. */
export function depotAt(game: CatanGame, at: number): Depot | null {
  return game.depots.find((depot) => depot.gate === at) ?? null;
}

/** Whether a crossing is a site's building, which nobody may build on. */
export function siteGate(game: CatanGame, at: number): boolean {
  return hauling(game) && game.depots.some((depot) => depot.gate === at);
}

/**
 * Whether a path may carry a road.
 *
 * @remarks
 * "Auf den 3 Seiten eines Zielfeldes, die an das Meer grenzen, dürfen keine
 * Straßen gebaut werden." A site's seaward edges: on this board those are
 * exactly the coastal paths of the field the site sits on.
 */
export function siteShore(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return (
    hauling(game) &&
    board.paths[at].hexes.length === 1 &&
    game.depots.some((depot) => board.paths[at].hexes.includes(depot.hex))
  );
}

/**
 * What one step of a drive costs.
 *
 * @param game - the game
 * @param seat - who is driving
 * @param at - the path being crossed
 * @returns the movement points, and the toll in gold
 * @remarks
 * "Ziehst du deinen Trosswagen über einen Weg (ohne Straße), kostet der Zug 2
 * Bewegungspunkte ... über eine eigene Straße 1 ... über eine fremde Straße
 * ebenfalls 1, aber zusätzlich musst du der Person 1 Gold zahlen." And a
 * barbarian adds two on top of whichever it is.
 */
export function stepCost(
  game: CatanGame,
  seat: number,
  at: number,
): { readonly moves: number; readonly toll: number } {
  const owner = game.roads[at];
  const moves =
    (owner === null ? PATH_MOVE : ROAD_MOVE) +
    (game.raiders[at] ? RAIDER_MOVE : 0);
  return {
    moves,
    toll: owner !== null && owner !== seat ? TOLL : 0,
  };
}

/**
 * Where a wagon could drive next.
 *
 * @param game - the game
 * @param seat - whose wagon
 * @returns the neighbouring crossings it can afford to reach
 * @remarks
 * One step at a time, because every step is a decision: the cost depends on
 * whose road it is, a barbarian may be sitting on it, and "hat eine Person mit
 * ihrem Trosswagen ein Zielfeld erreicht, endet die Bewegung" - so arriving is
 * an end and not a waypoint.
 */
export function driveSpots(game: CatanGame, seat: number): readonly number[] {
  const board = islandOf(game.land.length);
  const player = game.players[seat];
  const from = player.wagon;
  return from === null || player.moves <= 0
    ? []
    : board.crossings[from].paths
        .filter((path) => {
          const cost = stepCost(game, seat, path);
          return cost.moves <= player.moves && cost.toll <= player.gold;
        })
        .map((path) => {
          const ends = board.paths[path].ends;
          return ends[0] === from ? ends[1] : ends[0];
        });
}

/** The path between two neighbouring crossings. */
export function edgeBetween(
  board: Island,
  from: number,
  to: number,
): number | null {
  return (
    board.crossings[from].paths.find((path) =>
      board.paths[path].ends.includes(to),
    ) ?? null
  );
}

/**
 * The barbarian a wagon is standing in front of, if there is one.
 *
 * @param game - the game
 * @param seat - whose wagon
 * @returns the paths with a barbarian on them, leaving this crossing
 * @remarks
 * "Bleib dafür mit deinem Trosswagen auf der Kreuzung vor dem Barbaren stehen
 * und würfle mit 1 Würfel." So the wagon has to be next to it, and the roll is
 * only offered from the second step of the tableau on.
 */
export function facingRaiders(
  game: CatanGame,
  seat: number,
): readonly number[] {
  const board = islandOf(game.land.length);
  const player = game.players[seat];
  return player.wagon === null || DRIVE_OFF[player.level].length === 0
    ? []
    : board.crossings[player.wagon].paths.filter((path) => game.raiders[path]);
}

/** Where a barbarian may be put instead. */
export function raiderSpots(game: CatanGame): readonly number[] {
  return islandOf(game.land.length)
    .paths.filter((path) => !game.raiders[path.id])
    .map((path) => path.id);
}

/** What the tableau and the delivered loads are worth to a seat. */
export function haulPoints(game: CatanGame, seat: number): number {
  const player = game.players[seat];
  return !hauling(game)
    ? 0
    : player.delivered * HAUL_POINTS +
        (player.level >= MOVE_POINTS.length - 1 ? TOP_STEP_POINTS : 0);
}

/** What the next step of the tableau costs, or null at the top. */
export function stepPrice(game: CatanGame, seat: number): Hand | null {
  const level = game.players[seat].level;
  return !hauling(game) || level >= UPGRADE_COST.length
    ? null
    : UPGRADE_COST[level];
}
