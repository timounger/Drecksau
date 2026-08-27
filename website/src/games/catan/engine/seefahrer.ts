/**
 * *CATAN - Seefahrer*: the general rules, and the free game *Neue Welt*.
 *
 * @module
 * @remarks
 * The expansion turns the board into an archipelago: some fields are sea, and
 * everything follows from that.
 *
 * - **Schiffe** are built like roads but only on water - "auf eine Grenze
 *   zwischen zwei Meerfeldern (= Wasserweg) oder auf einen Weg zwischen einem
 *   Meerfeld und einem Landschaftsfeld (= Küste)". They cost 1 Holz + 1 Wolle,
 *   they branch, and a ship and a road only ever join **through a settlement**.
 * - The front ship of an **open** line may be picked up and put down elsewhere,
 *   once a turn, never one built this turn, never out of a closed line.
 * - The **Längste Handelsroute** counts ships as well as roads.
 * - The **Seeräuber** sits on a sea field, steals from a ship on its edges, and
 *   freezes all six of them while it is there.
 * - A **Goldfluss** pays a resource of the holder's own choosing.
 * - Settling a **foreign island** for the first time is worth extra points.
 *
 * The rules are read out of `game_instructions/catan_seefahrer.pdf`, pages 4 to
 * 7 and 24, and written up in `docs/games/catan/seefahrer.md`.
 */
import { islandOf, type Island } from "./board";
import type { CatanGame, Hand, Land } from "./state";

/** What a ship costs: 1 Holz + 1 Wolle. */
export const SHIP_COST: Hand = {
  lehm: 0,
  holz: 1,
  wolle: 1,
  getreide: 0,
  erz: 0,
};

/** How many ships each colour has. */
export const SHIPS_EACH = 15;

/** What a first settlement on a foreign island is worth in *Neue Welt*. */
export const ISLAND_POINTS = 1;

/** How much higher the finish line is: twelve rather than ten. */
export const NEUE_WELT_EXTRA = 2;

/* eslint-disable @typescript-eslint/no-magic-numbers -- these three lists are
   the rulebook's own material count, quoted. */

/**
 * The nineteen sea fields of *Neue Welt*.
 *
 * @remarks
 * "Meer 19", straight off the scenario's material table - and it stays at
 * nineteen. The lattice this table plays on holds 44 where the printed frame
 * holds 42, and the two fields over are taken by the two **Goldflüsse** the
 * rulebook invites into the free game. So the board comes out as 19 sea, the
 * 23 printed landscapes, and 2 gold rivers.
 */
export const NEUE_WELT_SEA = 19;

/**
 * The landscapes of *Neue Welt*.
 *
 * @remarks
 * Twenty-three of them, "Gesamt 42" against 19 sea, and the table's own column
 * reads 4-5-5-5-4. Which two kinds carry the four is the one thing the column
 * does not make unambiguous once it is pulled out of a picture, so the two go
 * where Catan always puts its scarcity: on clay and on ore.
 *
 * The two **Goldflüsse** are on top of that count, and the rulebook invites
 * them itself: "Spielt ihr mit Goldfluss-Landschaftsfeldern, achtet darauf,
 * dass auf diesen keine roten Zahlen liegen." The box holds exactly two.
 */
export const NEUE_WELT_LAND: readonly Land[] = [
  ...Array.from({ length: 4 }, () => "lehm" as const),
  ...Array.from({ length: 4 }, () => "erz" as const),
  ...Array.from({ length: 5 }, () => "holz" as const),
  ...Array.from({ length: 5 }, () => "wolle" as const),
  ...Array.from({ length: 5 }, () => "getreide" as const),
  ...Array.from({ length: 2 }, () => "gold" as const),
];

/**
 * The twenty-five number chips.
 *
 * @remarks
 * "Gesamt 23" in the table, counted out as 2, 3x3, 3x4, 3x5, 2x6, 2x8, 3x9,
 * 3x10, 2x11, 12 - and two more for the two Goldflüsse that come with them, one
 * at each end of the middle where they cannot be red.
 */
export const NEUE_WELT_CHIPS: readonly number[] = [
  2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 8, 8, 9, 9, 9, 10, 10, 10, 10, 11, 11,
  12,
];

/** The numbers printed in red, which may not sit side by side. */
export const RED_CHIPS: readonly number[] = [6, 8];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Whether this game is played on the sea. */
export function sailing(game: CatanGame): boolean {
  return game.scenario === "neuewelt";
}

/** Whether a field is open water. */
export function isSea(game: CatanGame, hex: number): boolean {
  return game.land[hex] === "meer";
}

/**
 * Whether a ship may lie on this path.
 *
 * @param game - the game
 * @param at - the path
 * @returns true on a water path or a coast
 * @remarks
 * "Ein Schiff darf nur auf eine Grenze zwischen zwei Meerfeldern (= Wasserweg)
 * gesetzt werden oder auf einen Weg zwischen einem Meerfeld und einem
 * Landschaftsfeld (= Küste)." A path at the outer rim of the lattice borders
 * one field only; that field being sea makes it water too.
 */
export function seaPath(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return sailing(game) && board.paths[at].hexes.some((hex) => isSea(game, hex));
}

/**
 * Whether a road may lie on this path.
 *
 * @remarks
 * The mirror image: a road wants land on at least one side, and "auf Wegen an
 * der Küste entweder 1 Schiff oder 1 Straße" - so the coast takes either, and
 * the open sea takes only a ship.
 */
export function landPath(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return (
    !sailing(game) || board.paths[at].hexes.some((hex) => !isSea(game, hex))
  );
}

/**
 * Whether a crossing may hold a building.
 *
 * @remarks
 * A crossing surrounded only by water is not a place anybody settles. The
 * rulebook never says it, because on a printed board it cannot come up: you can
 * see that there is nothing there.
 */
export function landCrossing(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return (
    !sailing(game) || board.crossings[at].hexes.some((hex) => !isSea(game, hex))
  );
}

/**
 * Whether this seat's network reaches a path, by sea.
 *
 * @param game - the game
 * @param seat - who wants to build
 * @param at - the path
 * @returns true when one of their settlements or ships touches it
 * @remarks
 * "Schiffe können an eine eigene Siedlung oder Stadt und/oder an ein eigenes
 * Schiff (verzweigen ist erlaubt) gesetzt werden." Roads are not in that list,
 * and that is the whole of the "kein Schiff an eine Straße" rule: a road simply
 * never counts as a reach for a ship.
 */
export function shipReaches(
  game: CatanGame,
  seat: number,
  at: number,
): boolean {
  const board = islandOf(game.land.length);
  return board.paths[at].ends.some(
    (end) =>
      game.towns[end]?.owner === seat ||
      board.crossings[end].paths.some(
        (path) => path !== at && game.ships[path] === seat,
      ),
  );
}

/**
 * Whether a ship may be built here.
 *
 * @param game - the game
 * @param seat - who is building
 * @param at - the path
 * @returns true if the rules allow it
 * @remarks
 * "Auf jedem Wasserweg (offenes Meer) darf maximal 1 Schiff, auf Wegen an der
 * Küste entweder 1 Schiff oder 1 Straße eingesetzt werden" - so the path has to
 * be free of both. And nothing may be built on the six edges of the field the
 * Seeräuber is sitting on.
 */
export function canShip(game: CatanGame, seat: number, at: number): boolean {
  return (
    sailing(game) &&
    seaPath(game, at) &&
    game.ships[at] === null &&
    game.roads[at] === null &&
    game.players[seat].shipsLeft > 0 &&
    !pirateBlocks(game, at) &&
    shipReaches(game, seat, at)
  );
}

/** Every path this seat could put a ship on. */
export function shipSpots(game: CatanGame, seat: number): readonly number[] {
  return islandOf(game.land.length)
    .paths.filter((path) => canShip(game, seat, path.id))
    .map((path) => path.id);
}

/**
 * Whether the Seeräuber freezes this path.
 *
 * @remarks
 * "Solange der Seeräuber ein Meerfeld besetzt, darf auf den angrenzenden
 * Seewegen (das sind die 6 Kanten dieses Feldes) weder ein Schiff eingesetzt,
 * noch ein Schiff entfernt werden."
 */
export function pirateBlocks(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return (
    sailing(game) &&
    game.pirate >= 0 &&
    board.hexes[game.pirate]?.rim.includes(at) === true
  );
}

/** Everyone with a ship on one of the pirate's six edges. */
export function pirateTargets(
  game: CatanGame,
  seat: number,
): readonly number[] {
  const board = islandOf(game.land.length);
  const rim = board.hexes[game.pirate]?.rim ?? [];
  return [
    ...new Set(
      rim
        .map((path) => game.ships[path])
        .filter((owner): owner is number => owner !== null && owner !== seat),
    ),
  ];
}

/** Every sea field the Seeräuber could be sent to. */
export function pirateSpots(game: CatanGame): readonly number[] {
  return islandOf(game.land.length)
    .hexes.filter((hex) => isSea(game, hex.id) && hex.id !== game.pirate)
    .map((hex) => hex.id);
}

/**
 * The ships of one seat that may be picked up and put down again.
 *
 * @param game - the game
 * @param seat - whose ships
 * @returns the front ships of their open lines
 * @remarks
 * "Das jeweils vorderste Schiff einer offenen Schiffslinie darf entfernt und an
 * einer anderen Stelle wieder eingesetzt werden." A front ship is one whose far
 * end is a dead end: no building of this seat's on it, and no other ship of
 * theirs leaving it. That is exactly what makes a line **open**, seen from one
 * ship rather than from the whole line - and it is the same answer, because a
 * closed line has a building at both ends and so no dead end anywhere.
 *
 * "Es darf jedoch kein Schiff versetzt werden, das in der gleichen Runde gebaut
 * wurde", and only one a turn, which the referee tracks.
 */
export function looseShips(game: CatanGame, seat: number): readonly number[] {
  const board = islandOf(game.land.length);
  return game.ships.reduce<number[]>((list, owner, at) => {
    const free =
      owner === seat &&
      !game.freshShips.includes(at) &&
      !pirateBlocks(game, at) &&
      board.paths[at].ends.some(
        (end) =>
          game.towns[end] === null &&
          board.crossings[end].paths.every(
            (path) => path === at || game.ships[path] !== seat,
          ),
      );
    return free ? [...list, at] : list;
  }, []);
}

/**
 * The islands of a board: each set of land fields that touch one another.
 *
 * @param game - the game
 * @returns one list of fields per island
 * @remarks
 * A flood fill over the land, which is what "eine Insel" is once the board is
 * dealt at random: the rulebook can point at its picture and say "die große
 * Insel", and this table has to work it out.
 */
export function islandsOf(game: CatanGame): readonly (readonly number[])[] {
  return landIslands(islandOf(game.land.length), game.land);
}

/** The same, on landscapes that are not a game yet. */
export function landIslands(
  board: Island,
  land: readonly Land[],
): readonly (readonly number[])[] {
  const isWater = (hex: number): boolean => land[hex] === "meer";
  const seen = new Set<number>();
  const islands: number[][] = [];
  for (const hex of board.hexes) {
    if (!isWater(hex.id) && !seen.has(hex.id)) {
      const island: number[] = [];
      const edge = [hex.id];
      seen.add(hex.id);
      while (edge.length > 0) {
        const at = edge.pop() as number;
        island.push(at);
        for (const path of board.hexes[at].rim) {
          for (const near of board.paths[path].hexes) {
            if (!isWater(near) && !seen.has(near)) {
              seen.add(near);
              edge.push(near);
            }
          }
        }
      }
      islands.push(island);
    }
  }
  return islands;
}

/** Which island a crossing belongs to, or null out at sea. */
export function islandAt(
  game: CatanGame,
  islands: readonly (readonly number[])[],
  at: number,
): number | null {
  const board = islandOf(game.land.length);
  const found = islands.findIndex((island) =>
    board.crossings[at].hexes.some((hex) => island.includes(hex)),
  );
  return found === -1 ? null : found;
}

/**
 * Whether a settlement here is this seat's first on its island.
 *
 * @remarks
 * "Für die jeweils erste Siedlung, die du auf einer fremden Insel baust,
 * erhältst du 1 Siegpunkt-Chip zusätzlich." Foreign means not one of the
 * islands they founded on, which is what {@link CatanPlayer.homeIslands}
 * remembers - and it is settled at the end of the founding phase, because
 * "zu Beginn habt ihr also alle eine oder zwei Heimatinseln".
 */
export function newIsland(game: CatanGame, seat: number, at: number): boolean {
  const islands = islandsOf(game);
  const island = islandAt(game, islands, at);
  const board = islandOf(game.land.length);
  return (
    sailing(game) &&
    island !== null &&
    !game.players[seat].homeIslands.includes(island) &&
    // Nothing of theirs on it yet.
    !islands[island].some((hex) =>
      board.hexes[hex].corners.some(
        (corner) => game.towns[corner]?.owner === seat,
      ),
    )
  );
}

/** What the island chips are worth to a seat. */
export function islandPoints(game: CatanGame, seat: number): number {
  return sailing(game) ? game.players[seat].islandChips * ISLAND_POINTS : 0;
}

/** Whether a landscape pays a resource of the holder's own choosing. */
export function paysGold(game: CatanGame, hex: number): boolean {
  return sailing(game) && game.land[hex] === "gold";
}

/** How many islands a dealt board needs, and how much land the biggest may hold. */
export const LEAST_ISLANDS = 3;
export const BIGGEST_SHARE = 0.6;

/**
 * Whether a dealt board is worth playing on.
 *
 * @param board - the island
 * @param land - the landscapes
 * @returns true when the water really has broken the land into islands
 * @remarks
 * A pure shuffle is what the rulebook says - "mischt alle Sechseckfelder
 * verdeckt und legt sie offen nacheinander im Rahmen aus" - but a shuffle
 * often leaves one continent with a few puddles in it, and *Seefahrer* on one
 * continent is *Das Spiel* with extra steps. The rulebook has the answer in the
 * same breath: "Seid ihr mit der Auslage der Felder nicht zufrieden, dürft ihr
 * Veränderungen vornehmen, wenn alle damit einverstanden sind." So a board that
 * is one island is dealt again, which is the same objection made earlier.
 */
export function boardLiesWell(board: Island, land: readonly Land[]): boolean {
  const islands = landIslands(board, land);
  const total = land.filter((kind) => kind !== "meer").length;
  const biggest = Math.max(0, ...islands.map((one) => one.length));
  return islands.length >= LEAST_ISLANDS && biggest <= total * BIGGEST_SHARE;
}

/**
 * Whether the chips may lie like this.
 *
 * @param board - the island
 * @param land - the landscapes
 * @param chips - the numbers on them
 * @returns true when no two red numbers touch and no gold river is red
 * @remarks
 * "Achtet darauf, dass rote Zahlen nicht nebeneinander liegen", and "spielt ihr
 * mit Goldfluss-Landschaftsfeldern, achtet darauf, dass auf diesen keine roten
 * Zahlen liegen." Both are checks on a finished layout rather than rules for
 * building one, so the deal is repeated until it passes - which is what a table
 * does with a bad shuffle.
 */
export function chipsLieWell(
  board: Island,
  land: readonly Land[],
  chips: readonly number[],
): boolean {
  return board.hexes.every((hex) => {
    const red = RED_CHIPS.includes(chips[hex.id]);
    const goldRed = red && land[hex.id] === "gold";
    const nextToRed =
      red &&
      hex.rim.some((path) =>
        board.paths[path].hexes.some(
          (near) => near !== hex.id && RED_CHIPS.includes(chips[near]),
        ),
      );
    return !goldRed && !nextToRed;
  });
}
