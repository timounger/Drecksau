/**
 * *CATAN - Entdecker & Piraten*, scenario 1: **Land in Sicht**.
 *
 * @module
 * @remarks
 * The furthest any expansion moves away from the printed game, and the rulebook
 * says so itself by listing what it takes away first: no development cards, no
 * Längste Handelsroute, no Größte Rittermacht, no cities, no robber, and no
 * harbours at all.
 *
 * What it puts in their place:
 *
 * - **Schiffe fahren.** They are not roads on the water: each has four movement
 *   points a turn, a hold, and a bow and a stern that point at crossings.
 * - Two thirds of the board start **face down**. A ship that comes to rest
 *   pointing at an unknown field turns it over - and that ends its journey.
 * - **Entdecker** ride in ships and found settlements where no road could
 *   reach; a **Hafensiedlung** is a settlement grown into a port, worth two
 *   points and holding cargo of its own.
 * - **Gold** is the consolation for a roll that pays you nothing, and buys
 *   resources two for one.
 *
 * The rules are read out of `game_instructions/catan_piraten.pdf`, pages 5 to
 * 13, and written up in `docs/games/catan/entdecker.md`.
 */
import { FIND_ISLAND_ROWS, islandOf, type Island } from "./board";
import type { CatanGame, Hand, Land, Resource } from "./state";

/** What a ship costs: 1 Holz + 1 Wolle. */
export const BOAT_COST: Hand = {
  lehm: 0,
  holz: 1,
  wolle: 1,
  getreide: 0,
  erz: 0,
};

/** What an explorer costs - the same as a settlement. */
export const SCOUT_COST: Hand = {
  lehm: 1,
  holz: 1,
  wolle: 1,
  getreide: 1,
  erz: 0,
};

/** What growing a settlement into a Hafensiedlung costs. */
export const PORT_COST: Hand = {
  lehm: 0,
  holz: 0,
  wolle: 0,
  getreide: 2,
  erz: 2,
};

/** One Wolle, for the two extra movement points a ship may buy. */
export const BOOST_COST: Hand = {
  lehm: 0,
  holz: 0,
  wolle: 1,
  getreide: 0,
  erz: 0,
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- every number below is
   a count the rulebook prints. */

/** How many ships and explorers each colour has in scenario 1. */
export const BOATS_EACH = 3;
export const SCOUTS_EACH = 2;

/** How many harbour settlements each colour has. */
export const PORTS_EACH = 4;

/** What a ship can do in one turn. */
export const BOAT_MOVES = 4;
export const BOOST_MOVES = 2;

/** How many ships may share one sea path. */
export const BOATS_PER_PATH = 2;

/** What a hold takes: two small figures, or one big one. */
export const HOLD_SMALL = 2;

/** What a discovery pays. */
export const FIND_GOLD = 2;

/** The gold everybody starts with, and what a barren roll pays. */
export const START_GOLD = 2;
export const DRY_GOLD = 1;

/** What gold buys, and how often a turn. */
export const GOLD_PER_BUY = 2;
export const BUYS_PER_TURN = 2;

/** The one trade rate this expansion has: "generell Rohstoffe im Verhältnis 3:1". */
export const FIND_RATE = 3;

/** What the two kinds of building are worth. */
export const TOWN_POINTS = 1;
export const PORT_POINTS = 2;

/** "Das Szenario endet, wenn eine Person in ihrem Zug 8 Siegpunkte erreicht." */
export const FIND_TARGET = 8;

/**
 * The fourteen landscapes of the start island.
 *
 * @remarks
 * "2x Hügelland, 4x Wald, 3x Weideland, 2x Ackerland und 3x Gebirge."
 */
export const ISLAND_LAND: readonly Land[] = [
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
  "erz",
  "erz",
  "erz",
];

/**
 * The chips of the start island.
 *
 * @remarks
 * "2x '3', 2x '4', '5', 2x '6', 2x '8', '9', 2x '10', 2x '11', '12'" - one for
 * each of the fourteen fields.
 */
export const ISLAND_CHIPS: readonly number[] = [
  3, 3, 4, 4, 5, 6, 6, 8, 8, 9, 10, 10, 11, 12,
];

/**
 * What lies face down in the northern region.
 *
 * @remarks
 * "1x Hügelland, 1x Wald, 1x Weideland, 1x Ackerland, 2x Gebirge" and two sea
 * fields - one of which this lattice has no room for, so six landscapes and one
 * sea. The six chips beside the pile are for the six landscapes.
 */
export const NORTH_LAND: readonly Land[] = [
  "lehm",
  "holz",
  "wolle",
  "getreide",
  "erz",
  "erz",
  "meer",
];

/** And the southern one: "1x Hügelland, 1x Wald, 1x Weideland, 2x Ackerland, 1x Gebirge". */
export const SOUTH_LAND: readonly Land[] = [
  "lehm",
  "holz",
  "wolle",
  "getreide",
  "getreide",
  "erz",
  "meer",
];

/** The six chips that come with each region. */
export const REGION_CHIPS: readonly number[] = [4, 5, 8, 9, 10, 11];

/**
 * What a unit costs: 1 Wolle + 1 Erz.
 *
 * @remarks
 * Scenario 2 and on. "Einheiten werden je nach Mission fuer den Handel oder
 * fuer den Kampf eingesetzt" - here they storm the pirate camps.
 */
export const UNIT_COST: Hand = {
  lehm: 0,
  holz: 0,
  wolle: 1,
  getreide: 0,
  erz: 1,
};

/** How many units each colour has, and how many take a camp. */
export const UNITS_EACH = 9;
export const CAMP_UNITS = 3;

/** The six pirate camps, on the six Goldflussfelder. */
export const CAMPS = 6;

/** What a conquest pays everybody who took part. */
export const CAMP_GOLD = 2;

/** What a Goldfluss pays each building when its number comes up. */
export const GOLD_YIELD = 2;

/** What driving a pirate ship off needs, and what its tribute costs. */
export const CHASE_ROLL = 6;
export const TRIBUTE = 1;

/**
 * What each step of a mission track is worth.
 *
 * @remarks
 * The track is a printed strip with the victory points drawn beside each field,
 * and the rulebook never writes the ladder out - so it is a **reconstruction**.
 * It rises every second step, which keeps six camps worth about as much as the
 * buildings around them: a scenario that runs to twelve points should not be
 * decided by the mission alone.
 *
 * On top of the ladder, "die Person, deren Markierungsstein am weitesten vorne
 * steht, erhaelt die Sondersiegpunkttafel dieser Mission. Sie zaehlt 1
 * Siegpunkt."
 */
export const MISSION_STEPS: readonly number[] = [0, 0, 1, 1, 2, 2, 3, 3, 4];

/** What the mission's own tile is worth. */
export const MISSION_TILE = 1;

/** "Das Szenario endet, wenn eine Person in ihrem Zug 12 Siegpunkte erreicht." */
export const CAMP_TARGET = 12;

/**
 * What lies face down in each region once the camps are in.
 *
 * @remarks
 * Scenario 2 puts "3 Goldflussfelder" into each of the two regions, each with a
 * pirate camp on it. The seven slots of a region here take those three and four
 * landscapes, where the printed board has room for more of both - the mission
 * material stays exact, and the countryside around it is what gives way.
 */
export const CAMP_REGION_LAND: readonly Land[] = [
  "lehm",
  "holz",
  "meer",
  "meer",
];

/**
 * The three Goldflussfelder of a region, and where they go.
 *
 * @remarks
 * On the **outer** row of the region, which always borders the frame - and a
 * frame edge is a Meerweg, so a camp there can always be reached by ship. Left
 * to the shuffle they can end up ringed by land as the region is turned over,
 * and then the camp is unreachable for ever *and* blocks its own crossings:
 * a self-played game stalled with six camps standing and nowhere left to build.
 */
export const CAMP_ROW_LAND: readonly Land[] = ["gold", "gold", "gold"];

/**
 * The six chips a region of scenario 2 carries.
 *
 * @remarks
 * Six again, and again one per landscape: the three Goldflussfelder carry a
 * number too - "wird die Zahl eines Zahlenchips eines Goldflussfelds
 * gewürfelt" - and the sea field carries none.
 */
export const CAMP_REGION_CHIPS: readonly number[] = REGION_CHIPS;

/** Which row of a region is its outer one. */
export function outerRow(board: Island, hex: number): boolean {
  const row = board.hexes[hex].row;
  return row === 0 || row === board.rows.length - 1;
}

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Whether this game is *Entdecker & Piraten*, in any of its scenarios. */
export function finding(game: CatanGame): boolean {
  return game.scenario === "entdecker" || game.scenario === "piraten";
}

/** Whether the pirate camps are in play - scenario 2. */
export function camping(game: CatanGame): boolean {
  return game.scenario === "piraten";
}

/** One pirate camp, on the Goldflussfeld it sits on. */
export type Camp = {
  /** One entry per unit standing on it, naming its owner. */
  readonly units: readonly number[];
  /** Whether the three have taken it. */
  readonly taken: boolean;
};

/** The camp on a field, if there is one. */
export function campAt(game: CatanGame, hex: number): Camp | null {
  return game.camps[hex] ?? null;
}

/**
 * Whether a camp still blocks the field it sits on.
 *
 * @remarks
 * "Solange auf einem Landschaftsfeld ein Piratenlager existiert, darf keine
 * Strasse auf den Wegen dieses Feldes und keine Siedlung auf den Kreuzungen
 * gebaut werden." Once taken it stops blocking: "auf den Wegen des eroberten
 * Goldflussfelds duerft ihr nun Strassen bauen."
 */
export function campHolds(game: CatanGame, hex: number): boolean {
  const camp = campAt(game, hex);
  return camp !== null && !camp.taken;
}

/** Whether a crossing is blocked by a camp beside it. */
export function besideCamp(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return board.crossings[at].hexes.some((hex) => campHolds(game, hex));
}

/** Whether a path is blocked by a camp beside it. */
export function laneCamp(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return board.paths[at].hexes.some((hex) => campHolds(game, hex));
}

/**
 * The camps a ship at rest could drop units on.
 *
 * @remarks
 * "Zeigt eine Spitze eines mit 1 oder 2 Einheiten beladenen Schiffs auf eine
 * Kreuzung eines Goldflussfelds mit einem Piratenlager, darf die bzw. duerfen
 * die Einheit(en) auf dem Piratenlager abgesetzt werden."
 */
export function campsFrom(game: CatanGame, at: number): readonly number[] {
  const board = islandOf(game.land.length);
  return [
    ...new Set(
      board.paths[at].ends
        .flatMap((end) => board.crossings[end].hexes)
        .filter(
          (hex) =>
            campHolds(game, hex) &&
            (campAt(game, hex)?.units.length ?? 0) < CAMP_UNITS,
        ),
    ),
  ];
}

/**
 * Whether a ship still owes tribute for using the pirate's water.
 *
 * @remarks
 * "Moechtest du mit einem Schiff die Meerwege eines Meerfeldes, das von einem
 * fremden Piratenschiff besetzt ist, zur Bewegung nutzen, musst du als Tribut 1
 * Gold in den Vorrat zahlen ... An ein eigenes Piratenschiff musst du keinen
 * Tribut zahlen." Paid once per ship and turn, which is what
 * {@link CatanGame.tributes} remembers.
 */
export function tributeDue(
  game: CatanGame,
  seat: number,
  boat: number,
  at: number,
): boolean {
  const board = islandOf(game.land.length);
  const ship = game.pirateShip;
  const rim = ship === null ? [] : board.hexes[ship.hex].rim;
  const from = game.boats[boat]?.at;
  return (
    ship !== null &&
    ship.owner !== seat &&
    !game.tributes.includes(boat) &&
    (rim.includes(at) || (from !== undefined && rim.includes(from)))
  );
}

/**
 * The ships of one seat that could try to drive a pirate ship off.
 *
 * @remarks
 * "Das Schiff darf in diesem Zug noch nicht gezogen worden sein", and "das
 * Schiff muss mit einer Spitze auf eine Kreuzung des vom Piraten besetzten
 * Feldes zeigen bzw. auf einem angrenzenden Meerweg stehen."
 */
export function chasers(game: CatanGame, seat: number): readonly number[] {
  const board = islandOf(game.land.length);
  const ship = game.pirateShip;
  return ship === null || ship.owner === seat
    ? []
    : game.boats.reduce<number[]>(
        (list, boat, which) =>
          boat.owner === seat &&
          boat.spent === 0 &&
          !game.chased.includes(which) &&
          board.hexes[ship.hex].rim.includes(boat.at)
            ? [...list, which]
            : list,
        [],
      );
}

/** Every sea field a pirate ship may be put on. */
export function pirateSeas(game: CatanGame): readonly number[] {
  const board = islandOf(game.land.length);
  return board.hexes
    .filter(
      (hex) =>
        game.land[hex.id] === "meer" &&
        // "Es ist nicht erlaubt, ein Piratenschiff auf einem Meerfeld
        // einzusetzen, das an die Startinsel grenzt."
        region(board, hex.id) !== "insel",
    )
    .map((hex) => hex.id);
}

/** What the mission track is worth to a seat. */
export function missionPoints(game: CatanGame, seat: number): number {
  if (!camping(game)) {
    return 0;
  }
  const step = game.mission[seat] ?? 0;
  const best = Math.max(0, ...game.mission);
  // "Stehen die Markierungssteine mehrerer Personen auf dem hoechsten
  // erreichten Feld uebereinander, hat die Person, deren Markierungsstein die
  // unterste Position einnimmt, das Anrecht auf die Sondersiegpunkttafel" -
  // the one that got there first, which is the lowest seat to have arrived.
  const leader = game.mission.findIndex((each) => each === best && best > 0);
  return (
    (MISSION_STEPS[Math.min(step, MISSION_STEPS.length - 1)] ?? 0) +
    (leader === seat ? MISSION_TILE : 0)
  );
}

/** What a ship or a harbour is carrying. */
export type Cargo = "entdecker" | "einheit";

/** One ship on the water. */
export type Boat = {
  readonly owner: number;
  /** The sea path it lies on. */
  readonly at: number;
  /** What is in its hold. */
  readonly hold: readonly Cargo[];
  /** Movement points already spent this turn. */
  readonly spent: number;
  /** Whether the Wolle for two more has been paid this turn. */
  readonly boosted: boolean;
  /** Whether it has discovered something this turn, which ends its journey. */
  readonly done: boolean;
};

/** Whether a field is still face down. */
export function unknown(game: CatanGame, hex: number): boolean {
  return finding(game) && game.land[hex] === "unbekannt";
}

/** Whether a field is open water - or still unknown, which may yet be water. */
export function water(game: CatanGame, hex: number): boolean {
  return game.land[hex] === "meer" || unknown(game, hex);
}

/**
 * Whether a ship may lie on this path.
 *
 * @remarks
 * "Meerwege sind die Kanten eines Meerfeldes. Die Meerwege trennen Meerfelder
 * voneinander und Landschaftsfelder von Meerfeldern. Auch die Kanten der
 * Rahmenteile, an denen der Rahmen an Meer- oder Landschaftsfelder grenzt,
 * gelten als Meerwege." The frame is the rim of the lattice, so a path with one
 * field beside it is a sea path whatever that field is.
 */
export function seaLane(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  const beside = board.paths[at].hexes;
  return (
    finding(game) &&
    (beside.length === 1 || beside.some((hex) => water(game, hex)))
  );
}

/** The ships on one path. */
export function boatsOn(game: CatanGame, at: number): readonly Boat[] {
  return game.boats.filter((boat) => boat.at === at);
}

/** Whether another ship still fits here. */
export function laneFree(game: CatanGame, at: number): boolean {
  return boatsOn(game, at).length < BOATS_PER_PATH;
}

/** Every harbour settlement of one seat. */
export function portsOf(game: CatanGame, seat: number): readonly number[] {
  return game.towns.reduce<number[]>(
    (list, town, at) =>
      town !== null && town.owner === seat && town.port === true
        ? [...list, at]
        : list,
    [],
  );
}

/**
 * Where this seat may build a ship.
 *
 * @remarks
 * "Baust du ein Schiff, setzt du es auf einem der zwei oder drei Meerwege ein,
 * die an eine deiner Hafensiedlungen grenzen. Es ist nicht erlaubt, ein Schiff
 * auf einem Meerweg zu bauen, der an ein unentdecktes Sechseckfeld angrenzt."
 */
export function boatSpots(game: CatanGame, seat: number): readonly number[] {
  const board = islandOf(game.land.length);
  const spots = new Set<number>();
  // A fleet already on the water has nowhere to put another ship - asked here
  // so no caller can light a spot the referee would then refuse.
  for (const port of game.players[seat].boatsLeft > 0
    ? portsOf(game, seat)
    : []) {
    for (const path of board.crossings[port].paths) {
      if (
        seaLane(game, path) &&
        laneFree(game, path) &&
        !board.paths[path].hexes.some((hex) => unknown(game, hex))
      ) {
        spots.add(path);
      }
    }
  }
  return [...spots];
}

/** How far a ship may still travel this turn. */
export function movesLeft(boat: Boat): number {
  return BOAT_MOVES + (boat.boosted ? BOOST_MOVES : 0) - boat.spent;
}

/**
 * Where a ship may go next.
 *
 * @param game - the game
 * @param boat - which ship
 * @returns the neighbouring sea paths it could come to rest on
 * @remarks
 * "Ein Schiff wird immer von Meerweg zu Meerweg gezogen. Es darf in beliebiger
 * Richtung gezogen werden" - so the neighbours are every sea path sharing a
 * crossing with this one. Two ships may share a path but a third may not come
 * to rest there, and a ship that has just discovered something stops for good:
 * "eine Entdeckung beendet immer den Zug deines Schiffs."
 */
export function lanesFrom(game: CatanGame, boat: Boat): readonly number[] {
  const board = islandOf(game.land.length);
  return boat.done || movesLeft(boat) <= 0
    ? []
    : [
        ...new Set(
          board.paths[boat.at].ends.flatMap((end) =>
            board.crossings[end].paths.filter(
              (path) =>
                path !== boat.at && seaLane(game, path) && laneFree(game, path),
            ),
          ),
        ),
      ];
}

/**
 * The unknown field a ship at rest is pointing at.
 *
 * @param game - the game
 * @param at - the path the ship lies on
 * @returns that field, or null
 * @remarks
 * "Zeigt ein Schiff, nachdem es gezogen wurde, mit einer Spitze (Bug oder Heck)
 * auf eine Kreuzung eines unentdeckten Sechseckfeldes, entdeckst du dieses
 * Feld." Bow and stern are the two ends of the path it lies on, so what it
 * points at is any unknown field touching either end.
 */
export function pointsAt(game: CatanGame, at: number): number | null {
  const board = islandOf(game.land.length);
  const found = board.paths[at].ends
    .flatMap((end) => board.crossings[end].hexes)
    .find((hex) => unknown(game, hex));
  return found ?? null;
}

/**
 * The crossings a ship at rest could found a settlement on.
 *
 * @remarks
 * "Zeigt dein Schiff mit einer Spitze auf eine Kreuzung eines
 * Landschaftsfelds, darfst du dort eine Siedlung gründen." Only with an
 * explorer aboard, and only where a settlement could stand at all.
 */
export function landfall(game: CatanGame, at: number): readonly number[] {
  const board = islandOf(game.land.length);
  return board.paths[at].ends.filter((end) =>
    board.crossings[end].hexes.some(
      (hex) => !water(game, hex) && game.land[hex] !== "unbekannt",
    ),
  );
}

/**
 * Whether a crossing could carry a Hafensiedlung.
 *
 * @remarks
 * A port needs water beside it - it is where ships are built and where they
 * load - so the founding one has to stand at the coast. The rulebook fixes the
 * places by picture ("die mit Kreisen markierten Kreuzungen"), and what those
 * circles have in common is exactly this.
 */
export function portShore(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return (
    board.crossings[at].paths.some((path) => seaLane(game, path)) &&
    !besideUnknown(game, at)
  );
}

/** Whether a crossing touches anything still face down. */
export function besideUnknown(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return board.crossings[at].hexes.some((hex) => unknown(game, hex));
}

/** Whether a path touches anything still face down. */
export function laneUnknown(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return board.paths[at].hexes.some((hex) => unknown(game, hex));
}

/** Which band of the board a field lies in. */
export function region(board: Island, hex: number): "nord" | "insel" | "sued" {
  const row = board.hexes[hex].row;
  return row < FIND_ISLAND_ROWS[0]
    ? "nord"
    : row > FIND_ISLAND_ROWS[FIND_ISLAND_ROWS.length - 1]
      ? "sued"
      : "insel";
}

/** What the buildings are worth to a seat. */
export function findPoints(game: CatanGame, seat: number): number {
  return !finding(game)
    ? 0
    : game.towns.reduce(
        (sum, town) =>
          town === null || town.owner !== seat
            ? sum
            : sum + (town.port === true ? PORT_POINTS : TOWN_POINTS),
        0,
      );
}

/** What a landscape pays the person who turned it over. */
export function findReward(kind: Land): Resource | null {
  const pays: Partial<Record<Land, Resource>> = {
    lehm: "lehm",
    holz: "holz",
    wolle: "wolle",
    getreide: "getreide",
    erz: "erz",
  };
  return pays[kind] ?? null;
}

/** Whether a hold has room for one more figure of this size. */
export function holdRoom(hold: readonly Cargo[], big: boolean): boolean {
  return big ? hold.length === 0 : hold.length < HOLD_SMALL;
}
