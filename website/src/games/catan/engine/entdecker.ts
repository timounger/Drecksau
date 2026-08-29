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
import { islandOf, type Island } from "./board";
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

/**
 * What the fish mission needs: scenario 3, *Fische für Catan*.
 *
 * @remarks
 * "Das Szenario endet, wenn eine Person in ihrem Zug 15 Siegpunkte erreicht
 * hat", and the supply holds "6 Fischschwärme". A shoal is a **large** figure,
 * so a ship carrying one carries nothing else.
 */
export const FISH_TARGET = 15;
export const SHOALS = 6;

/** The die that calls a shoal onto the water, and the numbers a field may show. */
export const FISH_SIDES = 6;
export const FISH_NUMBERS: readonly number[] = [1, 2, 3, 4, 5, 6];

/**
 * What lies face down in the northern region of scenario 3.
 *
 * @remarks
 * The rulebook deals the north "3 Goldflussfelder" and "2 zufällig bestimmte
 * Fischfelder" from the pile with the parrots on its back, and the south "3
 * Fischfelder" and "2 zufällig bestimmte Goldflussfelder" from the pile with
 * the geese. Those ten fields are the mission and are kept exactly; what gives
 * way is the countryside around them, as in scenario 2 - seven slots to a
 * region is what this lattice has.
 *
 * The Goldflussfelder go on the outer row, for the reason scenario 2 found out
 * the hard way: a camp that no ship can reach never falls, and a field that
 * never opens shuts its whole region.
 */
export const FISH_NORTH_ROW: readonly Land[] = [
  "gold",
  "gold",
  "gold",
  "lehm",
  "holz",
];
export const FISH_NORTH_LAND: readonly Land[] = [
  "fisch",
  "fisch",
  "wolle",
  "erz",
];

/** And the south, whose inner row also carries the Catanischer Rat. */
export const FISH_SOUTH_ROW: readonly Land[] = [
  "gold",
  "gold",
  "fisch",
  "getreide",
  "erz",
];
export const FISH_SOUTH_LAND: readonly Land[] = ["fisch", "fisch", "holz"];

/** The chips of a region of scenario 3 - one for each landscape under the pile. */
export const FISH_REGION_CHIPS: readonly number[] = REGION_CHIPS;

/**
 * What the spice mission needs: scenario 4, *Gewürze für Catan*.
 *
 * @remarks
 * "Das Szenario endet, wenn eine Person in ihrem Zug 15 Siegpunkte erreicht
 * hat." The supply holds 24 sacks, and a discovered village takes "so viele
 * Gewürzsäcke aus dem Vorrat ..., wie Personen am Spiel teilnehmen" - one for
 * each seat, because each seat may fetch exactly one from each village.
 */
export const SPICE_TARGET = 15;
export const SACKS = 24;

/**
 * What a village gives the person who befriends it.
 *
 * @remarks
 * Six villages, three pairs: "Schnelle Fahrt (2x)", "Piratenbonus (2x)" - one
 * marked 4 and one marked 5 - and "Gutes Gold (2x)". The advantage is not
 * stored anywhere: it follows from the units standing on the villages, which is
 * where the printed game keeps it too.
 */
export type Spice = "fahrt" | "pirat4" | "pirat5" | "gold";

/**
 * Every advantage there is.
 *
 * @remarks
 * A record, so the type checker counts them - the same reason
 * {@link LAND_KINDS} is one.
 */
const SPICE_SET: Readonly<Record<Spice, true>> = {
  fahrt: true,
  pirat4: true,
  pirat5: true,
  gold: true,
};

/** Their names, for anything that has to check one. */
export const SPICE_KINDS: readonly Spice[] = Object.keys(SPICE_SET) as Spice[];

/** The six villages, one of each pair. */
export const SPICES: readonly Spice[] = [
  "fahrt",
  "fahrt",
  "pirat4",
  "pirat5",
  "gold",
  "gold",
];

/** What each Piratenbonus village drives the pirate off with. */
export const SPICE_ROLLS: Readonly<Partial<Record<Spice, number>>> = {
  pirat4: 4,
  pirat5: 5,
};

/** What one Gutes-Gold village pays for one resource, and how often a turn. */
export const SELL_GOLD = 1;

/**
 * What lies face down in scenario 4.
 *
 * @remarks
 * "3 Gewürzfelder, 3 Fischfelder und 1 Meerfeld" out of each pile - all six
 * villages and all six fishing grounds are in play, and no Goldflussfeld is:
 * scenario 4 plays the fish and the spices, not the camps. The two landscapes
 * behind them are what this lattice has room for beyond the mission.
 */
export const SPICE_NORTH_ROW: readonly Land[] = [
  "gewuerz",
  "gewuerz",
  "gewuerz",
  "fisch",
  "fisch",
];
export const SPICE_NORTH_LAND: readonly Land[] = [
  "fisch",
  "meer",
  "holz",
  "erz",
];

/** And the south, whose inner row also carries the Catanischer Rat. */
export const SPICE_SOUTH_ROW: readonly Land[] = [
  "gewuerz",
  "gewuerz",
  "gewuerz",
  "fisch",
  "fisch",
];
export const SPICE_SOUTH_LAND: readonly Land[] = ["fisch", "meer", "wolle"];

/**
 * What the last scenario needs: scenario 5, *Entdecker & Piraten*.
 *
 * @remarks
 * "Dies ist das finale Szenario mit allen 3 Missionen", and it ends "wenn eine
 * Person in ihrem Zug 17 Siegpunkte erreicht hat" - three tracks are worth more
 * than two, so the target rises again.
 */
export const FINAL_TARGET = 17;

/**
 * What lies face down in scenario 5.
 *
 * @remarks
 * Both piles go in whole: "3 Goldflussfelder, 3 Fischfelder, 3 Gewürzfelder"
 * out of each. That is eighteen fields for the eighteen this lattice has, and
 * the Catanischer Rat needs one of them - so **one Fischfeld** stays in the box.
 * A fishing ground is the one piece that comes in six: the camps come in six
 * too but each wants a Goldflussfeld, and the villages come in three **pairs**,
 * each pair one of the three advantages. Breaking a pair would take one of the
 * two Schnelle-Fahrt or Gutes-Gold villages out of the game and make the other
 * unbeatable; dropping one of six fishing grounds costs nothing but one number.
 *
 * The Goldflussfelder go on the outer row again, where a ship can reach the
 * camps standing on them.
 */
export const FINAL_ROW: readonly Land[] = ["gold", "gold", "gold", "fisch"];

/**
 * What lies against the start island in the finale.
 *
 * @remarks
 * Water, and that is a rule of the sea rather than of the mission. A
 * Hafensiedlung builds its ships on the sea lanes beside it, and a lane is only
 * a lane while a field beside it is water. The regions start face down - which
 * counts as water - so the island's coast is open at the beginning and closes
 * as the fields come up as land. Self-play showed where that ends: two colours
 * with every ship still in the box after 13072 turns, because the coast they
 * had settled had turned into a wall of islands.
 *
 * So the row that touches the island stays wet: the mission's own fishing
 * grounds and the sea field, which is what the printed board has there too.
 */
export const FINAL_COAST: readonly Land[] = [
  "fisch",
  "fisch",
  "meer",
  "gewuerz",
];

/** And what lies behind it: the villages and the countryside. */
export const FINAL_NORTH_LAND: readonly Land[] = [
  "gewuerz",
  "gewuerz",
  "holz",
  "wolle",
  "erz",
];

/**
 * And the south, which carries the Catanischer Rat and one more sea field.
 *
 * @remarks
 * Two fields of the south's inner row are spoken for: the council, and the sea
 * field **beside** it. That is not decoration - it is what keeps the mission
 * reachable. A sea field's edges are sea lanes, and a field ringed by land has
 * only its own six edges: a ship inside can circle it forever and one outside
 * can never get in. Self-play walked into exactly that, and the finale ran 3297
 * turns with all three missions on nought.
 */
export const FINAL_SOUTH_LAND: readonly Land[] = [
  "fisch",
  "gewuerz",
  "gewuerz",
  "lehm",
  "getreide",
];

/** The south's coast, where the Catanischer Rat and its sea field take two. */
export const FINAL_SOUTH_COAST: readonly Land[] = ["fisch", "gewuerz"];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Whether this game is *Entdecker & Piraten*, in any of its scenarios. */
export function finding(game: CatanGame): boolean {
  return (
    game.scenario === "entdecker" ||
    game.scenario === "piraten" ||
    game.scenario === "fische" ||
    game.scenario === "gewuerze" ||
    game.scenario === "finale"
  );
}

/**
 * Whether the pirate camps are in play - scenario 2, and every one after it.
 *
 * @remarks
 * "In diesem Szenario spielt ihr mit dem Material der beiden Missionen Die
 * Piratenlager und Fische für Catan": the missions stack, they do not replace
 * one another.
 */
export function camping(game: CatanGame): boolean {
  return (
    game.scenario === "piraten" ||
    game.scenario === "fische" ||
    game.scenario === "finale"
  );
}

/** Whether the spice villages are in play - scenario 4. */
export function spicing(game: CatanGame): boolean {
  return game.scenario === "gewuerze" || game.scenario === "finale";
}

/** Whether the fish mission is in play - scenario 3 and on. */
export function shoaling(game: CatanGame): boolean {
  return (
    game.scenario === "fische" ||
    game.scenario === "gewuerze" ||
    game.scenario === "finale"
  );
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

/**
 * Every sea field a pirate ship may be put on.
 *
 * @remarks
 * "Es ist nicht erlaubt, ein Piratenschiff auf Feldern des Rahmens außen
 * einzusetzen oder auf einem Meerfeld, das an die Startinsel grenzt", and "da
 * der Catanische Rat an die Startinsel grenzt, darf der Pirat nicht darauf
 * gestellt werden."
 *
 * The printed regions are deep enough that the second rule still leaves plenty
 * of water. This lattice gives each region two rows, and one of them touches
 * the island - so the rule is applied where it leaves anywhere to go, and the
 * near water is allowed when it is all there is. A rule that would leave the
 * one legal move undefined is worse than a rule bent by one row.
 */
export function pirateSeas(game: CatanGame): readonly number[] {
  const board = islandOf(game.land.length);
  const open = board.hexes
    .filter(
      (hex) =>
        (game.land[hex.id] === "meer" || game.land[hex.id] === "fisch") &&
        hex.id !== game.council &&
        region(board, hex.id) !== "insel",
    )
    .map((hex) => hex.id);
  const far = open.filter((hex) => !besideIsland(board, hex));
  return far.length > 0 ? far : open;
}

/** Whether a field touches the start island. */
export function besideIsland(board: Island, hex: number): boolean {
  return board.hexes[hex].corners.some((corner) =>
    board.crossings[corner].hexes.some(
      (near) => region(board, near) === "insel",
    ),
  );
}

/**
 * What one mission track is worth to a seat.
 *
 * @param track - where every marker stands
 * @param seat - whose marker
 * @returns the points of its field, plus the tile if it leads
 * @remarks
 * "Stehen die Markierungssteine mehrerer Personen auf dem höchsten erreichten
 * Feld übereinander, hat die Person, deren Markierungsstein die unterste
 * Position einnimmt, das Anrecht auf die Sondersiegpunkttafel" - the one that
 * got there first, which is the lowest seat to have arrived.
 */
export function trackPoints(track: readonly number[], seat: number): number {
  const step = track[seat] ?? 0;
  const best = Math.max(0, ...track);
  const leader = track.findIndex((each) => each === best && best > 0);
  return (
    (MISSION_STEPS[Math.min(step, MISSION_STEPS.length - 1)] ?? 0) +
    (leader === seat ? MISSION_TILE : 0)
  );
}

/** What every mission track in play is worth to a seat, tiles included. */
export function missionPoints(game: CatanGame, seat: number): number {
  return (
    (camping(game) ? trackPoints(game.mission, seat) : 0) +
    (shoaling(game) ? trackPoints(game.catches, seat) : 0) +
    (spicing(game) ? trackPoints(game.spices, seat) : 0)
  );
}

/**
 * What a ship or a harbour is carrying.
 *
 * @remarks
 * "Jedes Schiff besitzt einen Laderaum, in den zwei kleine Spielfiguren
 * (Einheiten oder Gewürzsäcke) oder eine große Spielfigur (Entdecker,
 * Fischschwarm) hineinpassen" - so a shoal takes a whole hold, like an
 * explorer. See {@link holdRoom}.
 */
export type Cargo = "entdecker" | "einheit" | "fisch" | "gewuerz";

/**
 * Every kind of cargo there is.
 *
 * @remarks
 * A record, so the type checker counts them: the reader of saved games used to
 * spell the list out itself and knew only two of the four, which quietly threw
 * away every game with a shoal or a sack aboard.
 */
const CARGO_SET: Readonly<Record<Cargo, true>> = {
  entdecker: true,
  einheit: true,
  fisch: true,
  gewuerz: true,
};

/** Their names, for anything that has to check one. */
export const CARGO_KINDS: readonly Cargo[] = Object.keys(CARGO_SET) as Cargo[];

/** Whether this cargo fills a hold on its own. */
export function bigCargo(cargo: Cargo): boolean {
  return cargo === "entdecker" || cargo === "fisch";
}

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

/**
 * Whether a field is open water - or still unknown, which may yet be water.
 *
 * @remarks
 * A Fischfeld is water too: it lies in the sea, ships sail its lanes, and a
 * pirate ship may be put on it. What it is not is a landscape, so nothing is
 * built at it and no number chip lies on it - the die number it shows belongs
 * to {@link CatanGame.fish} and calls shoals, not resources.
 */
export function water(game: CatanGame, hex: number): boolean {
  return (
    game.land[hex] === "meer" ||
    game.land[hex] === "fisch" ||
    unknown(game, hex)
  );
}

/** Whether a field is a spice island with a village on it. */
export function village(game: CatanGame, hex: number): boolean {
  return game.land[hex] === "gewuerz";
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
export function movesLeft(game: CatanGame, boat: Boat): number {
  return (
    BOAT_MOVES +
    fastVillages(game, boat.owner) +
    (boat.boosted ? BOOST_MOVES : 0) -
    boat.spent
  );
}

/**
 * The villages a seat has befriended, by what they are worth.
 *
 * @param game - the game
 * @param seat - whose units
 * @returns one entry per village this seat has a unit on
 * @remarks
 * "Hast du eine Einheit auf dem Dorf eines Gewürzfelds abgesetzt, bist du mit
 * den Bewohnern dieses Dorfes befreundet" - so friendship is the unit, and
 * nothing else has to be remembered.
 */
export function friends(game: CatanGame, seat: number): readonly Spice[] {
  return Object.entries(game.villages)
    .filter(([, seats]) => seats.includes(seat))
    .map(([hex]) => game.spice[Number(hex)])
    .filter((each): each is Spice => each !== undefined);
}

/** How many extra movement points the Schnelle Fahrt villages give. */
export function fastVillages(game: CatanGame, seat: number): number {
  return spicing(game)
    ? friends(game, seat).filter((each) => each === "fahrt").length
    : 0;
}

/**
 * What drives a pirate ship off for this seat.
 *
 * @remarks
 * "Bist du mit einem dieser Dörfer befreundet, vertreibst du das Piratenschiff
 * einer anderen Person nicht nur mit einer '6', sondern auch mit der Würfelzahl
 * des Dorfes."
 */
export function chaseRolls(game: CatanGame, seat: number): readonly number[] {
  return [
    CHASE_ROLL,
    ...friends(game, seat)
      .map((each) => SPICE_ROLLS[each])
      .filter((each): each is number => each !== undefined),
  ];
}

/** How often a seat may sell a resource for gold in one turn. */
export function goldSales(game: CatanGame, seat: number): number {
  return spicing(game)
    ? friends(game, seat).filter((each) => each === "gold").length
    : 0;
}

/**
 * How many occupied sea lanes a ship may cross in one go.
 *
 * @remarks
 * "Du darfst dein Schiff über ein oder zwei nebeneinanderstehende Schiffe
 * hinwegziehen."
 */
const CROSSED_LANES = 2;

/**
 * Where a ship may go next, and what getting there costs it.
 *
 * @param game - the game
 * @param boat - which ship
 * @returns the sea paths it could come to rest on, by movement points spent
 * @remarks
 * "Ein Schiff wird immer von Meerweg zu Meerweg gezogen. Es darf in beliebiger
 * Richtung gezogen werden" - so the neighbours are every sea path sharing a
 * crossing with this one, and each of them costs one movement point.
 *
 * Two ships may share a lane, and a third may **pass** but not stop: "du darfst
 * dein Schiff über ein oder zwei nebeneinanderstehende Schiffe hinwegziehen. Du
 * darfst jedoch nicht den Zug eines deiner Schiffe auf einem Meerweg beenden,
 * auf dem schon 2 Schiffe stehen." So a full lane is not a wall but a crossing
 * that costs its point like any other - which is why this answers with a price
 * rather than a list.
 *
 * Without it a table of six gridlocks: eighteen ships on the water turn every
 * narrow strait into a wall, and a self-played finale spent a thousand turns
 * with its fleets shuffling in front of one another.
 */
export function laneCosts(
  game: CatanGame,
  boat: Boat,
): ReadonlyMap<number, number> {
  const board = islandOf(game.land.length);
  const found = new Map<number, number>();
  const left = boat.done ? 0 : movesLeft(game, boat);
  const beside = (path: number): readonly number[] =>
    board.paths[path].ends.flatMap((end) =>
      board.crossings[end].paths.filter(
        (each) => each !== path && seaLane(game, each),
      ),
    );
  const walk = (from: number, spent: number, crossed: number): void => {
    for (const step of beside(from)) {
      const price = spent + 1;
      if (price <= left && step !== boat.at) {
        if (laneFree(game, step)) {
          const known = found.get(step);
          if (known === undefined || price < known) {
            found.set(step, price);
          }
        } else if (crossed < CROSSED_LANES) {
          walk(step, price, crossed + 1);
        }
      }
    }
  };
  walk(boat.at, 0, 0);
  return found;
}

/**
 * Where a ship may come to rest next.
 *
 * @param game - the game
 * @param boat - which ship
 * @returns the sea paths, near ones and ones across a jam alike
 * @remarks
 * A ship that has just discovered something stops for good: "eine Entdeckung
 * beendet immer den Zug deines Schiffs."
 */
export function lanesFrom(game: CatanGame, boat: Boat): readonly number[] {
  return [...laneCosts(game, boat).keys()];
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
 * Where an explorer aboard a ship on this path may actually go ashore.
 *
 * @param game - the game
 * @param seat - whose explorer
 * @param at - the path the ship lies on
 * @returns the crossings a settlement could be founded on
 * @remarks
 * {@link landfall} answers the geometric half - which crossings the ship points
 * at - and this one adds everything else the founding needs: a free crossing,
 * the Abstandsregel, no face-down field beside it, and a settlement left in the
 * box.
 *
 * Both halves in one place, because the two used to be asked separately and
 * disagreed: the computer offered a landing on an occupied crossing, the
 * referee refused it, and because the offer was still on the list the ship at
 * the helm counted as busy. Its fleet then never sailed again - a self-played
 * finale spent 6800 turns with one explorer ship rowing back and forth between
 * two sea paths while the other ships lay still.
 */
export function landingSpots(
  game: CatanGame,
  seat: number,
  at: number,
): readonly number[] {
  const board = islandOf(game.land.length);
  return game.players[seat].settlements === 0
    ? []
    : landfall(game, at).filter(
        (end) =>
          game.towns[end] === null &&
          board.crossings[end].next.every(
            (near) => game.towns[near] === null,
          ) &&
          !besideUnknown(game, end),
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
export function portShore(
  game: CatanGame,
  at: number,
  founding = false,
): boolean {
  const board = islandOf(game.land.length);
  return (
    board.crossings[at].paths.some((path) => seaLane(game, path)) &&
    // A face-down field is not known to be land, and in the founding phase it
    // is the coast: the printed board has open water between the start island
    // and the unknown regions, this lattice has them side by side. Without the
    // exception a table of five or six runs out of shore before everybody has
    // founded - twelve coastal crossings, and every settlement blocks its
    // neighbours.
    (founding || !besideUnknown(game, at))
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
  // The start island is the middle three rows, whichever lattice this is: two
  // rows of region above it, two below, and fourteen fields in between.
  const first = Math.floor((board.rows.length - ISLAND_BAND) / 2);
  return row < first ? "nord" : row >= first + ISLAND_BAND ? "sued" : "insel";
}

/** How many rows of the lattice the start island takes. */
const ISLAND_BAND = 3;

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

/** Whether a shoal is lying on this field. */
export function shoalAt(game: CatanGame, hex: number): boolean {
  return game.shoals.includes(hex);
}

/** The die numbers of every fish field that has been discovered. */
export function fishNumbers(game: CatanGame): readonly number[] {
  return Object.entries(game.fish)
    .filter(([hex]) => game.land[Number(hex)] === "fisch")
    .map(([, number]) => number);
}

/**
 * The fish field a roll would call a shoal onto, if any.
 *
 * @param game - the game
 * @param rolled - what the die showed
 * @returns the field, or null when nothing happens
 * @remarks
 * "Du darfst den Fischschwarm nicht auf einem Fischfeld einsetzen, wenn auf
 * diesem bereits ein Fischschwarm liegt [oder] das Feld von einem Piratenschiff
 * besetzt ist ... Würfelst du die Zahl eines Fischfelds, das noch nicht
 * entdeckt wurde, wird ebenfalls kein neuer Fischschwarm eingesetzt."
 */
export function fishField(game: CatanGame, rolled: number): number | null {
  const found = Object.entries(game.fish).find(
    ([hex, number]) =>
      number === rolled &&
      game.land[Number(hex)] === "fisch" &&
      !shoalAt(game, Number(hex)) &&
      game.pirateShip?.hex !== Number(hex),
  );
  return found === undefined ? null : Number(found[0]);
}

/**
 * Whether this seat may still try for a shoal.
 *
 * @remarks
 * "In deiner Bewegungsphase darfst du zu einem beliebigen Zeitpunkt einmalig
 * versuchen, einen Fischschwarm auf einem der entdeckten Fischfelder
 * einzuwürfeln. Du darfst dafür allerdings nicht die Bewegung eines deiner
 * Schiffe unterbrechen." So: once a turn, and not with a ship halfway through
 * its voyage - either none has set out yet, or the one at the helm has come to
 * rest.
 */
export function canCast(game: CatanGame): boolean {
  const boat = game.sailing === null ? null : game.boats[game.sailing];
  return (
    shoaling(game) &&
    game.phase === "sailing" &&
    !game.cast &&
    game.shoalsLeft > 0 &&
    fishNumbers(game).length > 0 &&
    (boat === undefined ||
      boat === null ||
      boat.done ||
      movesLeft(game, boat) === 0)
  );
}

/**
 * The two harbours of the Catanischer Rat.
 *
 * @remarks
 * "Der Catanische Rat unterhält auf einer kleinen Insel einen Stützpunkt mit 2
 * Häfen (helle Kreise mit Anker) zum Entladen." The printed tile draws them on
 * its seaward side, away from the start island, and that is what is taken here:
 * of the corners that do not touch the island, the two furthest from it.
 */
export function councilDocks(game: CatanGame): readonly number[] {
  const hex = game.council;
  if (hex === null) {
    return [];
  }
  const board = islandOf(game.land.length);
  const middle = board.hexes[hex].y;
  const inland = board.hexes[hex].corners.filter((corner) =>
    board.crossings[corner].hexes.some(
      (near) => region(board, near) === "insel",
    ),
  );
  return board.hexes[hex].corners
    .filter((corner) => !inland.includes(corner))
    .sort(
      (one, other) =>
        Math.abs(board.crossings[other].y - middle) -
        Math.abs(board.crossings[one].y - middle),
    )
    .slice(0, COUNCIL_DOCKS)
    .sort((one, other) => one - other);
}

/** How many harbours the Catanischer Rat has. */
export const COUNCIL_DOCKS = 2;

/**
 * Whether a ship on this path could reach a figure on that field.
 *
 * @remarks
 * "Du kannst einen Fischschwarm fangen, wenn eines deiner Schiffe mit einer
 * Spitze auf eine Ecke eines Felds mit einem Fischschwarm zeigt bzw. auf einem
 * angrenzenden Meerweg steht." A ship on a rim path has both its ends on
 * corners of the field, so pointing at a corner is the whole rule.
 */
export function reaches(board: Island, at: number, hex: number): boolean {
  return board.paths[at].ends.some((end) =>
    board.hexes[hex].corners.includes(end),
  );
}

/**
 * The shoals this seat could take aboard, with the ship that would take them.
 *
 * @param game - the game
 * @param seat - whose ships
 * @returns one entry per field a shoal could be lifted from
 */
export function catchSpots(
  game: CatanGame,
  seat: number,
): readonly { readonly hex: number; readonly boat: number }[] {
  if (!shoaling(game) || game.phase !== "sailing") {
    return [];
  }
  const board = islandOf(game.land.length);
  return game.shoals.flatMap((hex) => {
    // The ship at the helm first: it is the one the player is looking at.
    const which = game.boats.findIndex(
      (boat, index) =>
        boat.owner === seat &&
        holdRoom(boat.hold, true) &&
        reaches(board, boat.at, hex) &&
        (game.sailing === null || game.sailing === index),
    );
    const any =
      which >= 0
        ? which
        : game.boats.findIndex(
            (boat) =>
              boat.owner === seat &&
              holdRoom(boat.hold, true) &&
              reaches(board, boat.at, hex),
          );
    return any >= 0 ? [{ hex, boat: any }] : [];
  });
}

/**
 * The council harbours this seat could unload a shoal at.
 *
 * @param game - the game
 * @param seat - whose ships
 * @returns one entry per harbour, with the ship that would unload there
 */
export function landings(
  game: CatanGame,
  seat: number,
): readonly { readonly at: number; readonly boat: number }[] {
  if (!shoaling(game) || game.phase !== "sailing") {
    return [];
  }
  const board = islandOf(game.land.length);
  return councilDocks(game).flatMap((at) => {
    // A shoal or a sack - "zeigt eine Spitze eines deiner mit einem oder zwei
    // Gewürzsäcken beladenen Schiffs auf einen Hafen des Catanischen Rats,
    // darfst du das Schiff entladen", and both count on their own track.
    const which = game.boats.findIndex(
      (boat) =>
        boat.owner === seat &&
        boat.hold.some((cargo) => cargo === "fisch" || cargo === "gewuerz") &&
        board.paths[boat.at].ends.includes(at),
    );
    return which >= 0 ? [{ at, boat: which }] : [];
  });
}

/**
 * The villages this seat could set a unit down on.
 *
 * @param game - the game
 * @param seat - whose ships
 * @returns one entry per village, with the ship that would do it
 * @remarks
 * "Zeigt eine Spitze eines deiner mit einer Einheit beladenen Schiffe auf eine
 * Ecke eines Gewürzfelds, darfst du die Einheit auf dem Dorf des Gewürzfelds
 * absetzen." Once per village and seat: "ihr dürft auf jedem Gewürzfeld immer
 * jeweils nur 1 Einheit absetzen und im Gegenzug von jedem Gewürzfeld nur 1
 * Gewürzsack einladen."
 */
export function villageSpots(
  game: CatanGame,
  seat: number,
): readonly { readonly hex: number; readonly boat: number }[] {
  if (!spicing(game) || game.phase !== "sailing") {
    return [];
  }
  const board = islandOf(game.land.length);
  return board.hexes
    .filter(
      (hex) =>
        village(game, hex.id) &&
        !(game.villages[hex.id] ?? []).includes(seat) &&
        (game.sacks[hex.id] ?? 0) > 0,
    )
    .flatMap((hex) => {
      const which = game.boats.findIndex(
        (boat, index) =>
          boat.owner === seat &&
          boat.hold.includes("einheit") &&
          reaches(board, boat.at, hex.id) &&
          (game.sailing === null || game.sailing === index),
      );
      const any =
        which >= 0
          ? which
          : game.boats.findIndex(
              (boat) =>
                boat.owner === seat &&
                boat.hold.includes("einheit") &&
                reaches(board, boat.at, hex.id),
            );
      return any >= 0 ? [{ hex: hex.id, boat: any }] : [];
    });
}

/**
 * Whether this seat may build at a spice field yet.
 *
 * @remarks
 * "Du darfst erst dann eine Straße an den Wegen oder eine Siedlung auf den
 * Kreuzungen eines Gewürzfelds bauen, wenn du eine Einheit auf dem Dorf des
 * Felds abgesetzt hast."
 */
export function befriended(
  game: CatanGame,
  seat: number,
  hex: number,
): boolean {
  return !village(game, hex) || (game.villages[hex] ?? []).includes(seat);
}

/** Whether a crossing is barred by a village this seat has not befriended. */
export function besideVillage(
  game: CatanGame,
  seat: number,
  at: number,
): boolean {
  const board = islandOf(game.land.length);
  return board.crossings[at].hexes.some((hex) => !befriended(game, seat, hex));
}

/** Whether a path is barred by a village this seat has not befriended. */
export function laneVillage(
  game: CatanGame,
  seat: number,
  at: number,
): boolean {
  const board = islandOf(game.land.length);
  return board.paths[at].hexes.some((hex) => !befriended(game, seat, hex));
}

/**
 * What the 5-6 Personen Erweiterung adds to a board of this expansion.
 *
 * @remarks
 * "Für die Startinsel benötigt ihr folgende Landschaftsfelder: 3x Hügelland, 5x
 * Wald, 5x Weideland, 3x Ackerland, 5x Gebirge" - one and twenty rather than
 * fourteen - "außerdem die 22 Zahlenchips". And each unknown region grows from
 * seven to ten: "1x Hügelland, 2x Wald, 1x Weideland, 2x Ackerland, 3x Gebirge,
 * 1x Meer" out of the parrot pile, one field more out of the geese.
 *
 * On the lattice this table plays at five and six - the same 44 the Seefahrer
 * boards use - the middle band is **22** and each region **11**, so every list
 * is one field longer than the printed one. What fills those places is
 * countryside: the mission material of a scenario is laid exactly as printed,
 * and the fields around it are what give way, which is the same rule this
 * expansion's boards have followed since scenario 2.
 */
export const BIG_ISLAND_LAND: readonly Land[] = [
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
  "wolle",
  "getreide",
  "getreide",
  "getreide",
  "getreide",
  "erz",
  "erz",
  "erz",
  "erz",
  "erz",
];

/* eslint-disable @typescript-eslint/no-magic-numbers -- the printed chips. */
/** The 22 chips of the bigger start island. */
export const BIG_ISLAND_CHIPS: readonly number[] = [
  2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12, 3, 5, 9, 10,
];

/** And the nine a region of that board carries. */
export const BIG_REGION_CHIPS: readonly number[] = [
  3, 4, 5, 6, 8, 9, 10, 11, 12,
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** What a longer row is padded with: countryside, and water at the end. */
export const BIG_FILLER: readonly Land[] = [
  "holz",
  "wolle",
  "getreide",
  "lehm",
  "erz",
  "meer",
  "wolle",
  "holz",
];

/**
 * Stretches a printed list to the length this lattice needs.
 *
 * @param list - the printed fields
 * @param size - how many the row has here
 * @param from - where the extra ones come from
 * @returns exactly `size` fields, the printed ones first
 */
/**
 * Stretches a **fixed row** - the one that carries the mission's own fields.
 *
 * @param list - the printed row
 * @param size - how many fields the row has here
 * @returns the row, one mission field longer where the board is wider
 * @remarks
 * "6 Piratenlager aus Entdecker & Piraten, 2 Piratenlager aus Entdecker &
 * Piraten - 5-6 Personen Erweiterung": a bigger table gets **more** mission
 * material, not only more countryside - eight camps rather than six, and a
 * fishing ground or a village to match. So the first field of the row, which is
 * the mission's own, is the one that repeats.
 */
export function stretchRow(
  list: readonly Land[],
  size: number,
): readonly Land[] {
  return list.length >= size
    ? list.slice(0, size)
    : stretched([...list, list[0]], size);
}

export function stretched(
  list: readonly Land[],
  size: number,
  from: readonly Land[] = BIG_FILLER,
): readonly Land[] {
  return list.length >= size
    ? list.slice(0, size)
    : [...list, ...from.slice(0, size - list.length)];
}

/**
 * Whether the founding phase has run out of proper coast.
 *
 * @param game - the game
 * @param loose - what counts as a place when the coast is gone
 * @returns whether the exception is needed at all
 * @remarks
 * The printed board keeps open water between the start island and the unknown
 * regions; this lattice lays them side by side, so the island's own coast is
 * short. At three and four colours it is long enough and the ordinary rule
 * holds - a Hafensiedlung on a face-down coast could never launch a ship,
 * because a lane between two unknown fields is not known to be a lane. At five
 * and six it runs out, and then the face-down coast counts. Asked here rather
 * than assumed, so the smaller tables play exactly as before.
 */
export function crowded(
  game: CatanGame,
  loose: (at: number) => boolean,
): boolean {
  const board = islandOf(game.land.length);
  return !board.crossings.some(
    (crossing) =>
      game.towns[crossing.id] === null &&
      crossing.next.every((near) => game.towns[near] === null) &&
      loose(crossing.id),
  );
}

/** Whether a founding Hafensiedlung may stand here. */
export function foundingShore(game: CatanGame, at: number): boolean {
  return (
    portShore(game, at) ||
    (crowded(game, (each) => portShore(game, each)) &&
      portShore(game, at, true))
  );
}
