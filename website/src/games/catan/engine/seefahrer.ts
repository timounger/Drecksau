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
import type { CatanGame, Hand, Land, Wonder } from "./state";

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

/**
 * What *Zu neuen Ufern* is made of.
 *
 * @remarks
 * The scenario's own material table: "Gesamt 42" fields - 14 sea, one desert,
 * two Goldflüsse and five of each landscape - with "27 Zahlenchips", one for
 * every field that pays. This lattice holds 44, so two more sea fields close
 * the frame, exactly as *Neue Welt* does it.
 *
 * The board is not free, though: a **main island** in the middle and small
 * islands around it, "das eingerahmte Gebiet" the rulebook shuffles separately.
 * The nineteen fields of the printed island go in the middle, the desert among
 * them, where the robber starts.
 *
 * The nine that are left become the small islands, both Goldflüsse among them,
 * because gold is what the story sends everybody out to find. None of them
 * touches the main island: an island grown onto the mainland is a peninsula,
 * and reaching it would need no ship at all.
 */
export const SHORE_MAIN = 19;
export const SHORE_SEA = 16;

/** What the first settlement on a small island is worth here. */
export const SHORE_POINTS = 2;

/** "Sobald jemand an der Reihe ist und dabei 14 Siegpunkte erreicht." */
export const SHORE_TARGET = 14;

/** The eighteen landscapes of the main island, and its desert. */
export const SHORE_MAIN_LAND: readonly Land[] = [
  "lehm",
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
  "wolle",
  "getreide",
  "getreide",
  "getreide",
  "erz",
  "erz",
  "erz",
  "wueste",
];

/** And the nine of the small islands, with both Goldflüsse among them. */
export const SHORE_ISLE_LAND: readonly Land[] = [
  "lehm",
  "holz",
  "wolle",
  "getreide",
  "getreide",
  "erz",
  "erz",
  "gold",
  "gold",
];

/** The chips of the main island: eighteen, one for each landscape. */
export const SHORE_MAIN_CHIPS: readonly number[] = [
  2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12,
];

/** And the nine of the small islands. */
export const SHORE_ISLE_CHIPS: readonly number[] = [
  2, 3, 4, 5, 6, 8, 9, 10, 11,
];

/** The numbers printed in red, which may not sit side by side. */
export const RED_CHIPS: readonly number[] = [6, 8];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * The hexes of the main island of *Zu neuen Ufern*.
 *
 * @param board - the lattice
 * @returns the nineteen fields in the middle, in the printed island's shape
 * @remarks
 * The printed board draws one big island in the middle of the frame and a
 * ring of small ones around it. Nineteen fields in the shape of the printed
 * island - 3-4-5-4-3 - taken out of the middle of the five middle rows is that
 * island, and it leaves the outer ring for the small ones.
 */
export function mainIsland(board: Island): readonly number[] {
  const rows = board.rows.length;
  const first = Math.floor((rows - SHORE_ROWS.length) / 2);
  return SHORE_ROWS.flatMap((wide, at) => {
    const row = board.hexes.filter((hex) => hex.row === first + at);
    // Against one side of the frame, the way the scenario is printed: the big
    // island on one edge and "das eingerahmte Gebiet" of small islands beside
    // it. Centred instead, the island leaves a ring one field thick that holds
    // seven fields and welds them into one long island - fourteen fields of
    // open water lie on this side of it.
    return row.slice(0, wide).map((hex) => hex.id);
  });
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- the printed island. */

/** The shape of the main island: the printed nineteen, 3-4-5-4-3. */
const SHORE_ROWS: readonly number[] = [3, 4, 5, 4, 3];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * The four islands of *Die vier Inseln*.
 *
 * @param board - the lattice
 * @returns one list of fields per island
 * @remarks
 * "Die Umrisse der vier Inseln sollten nicht verändert werden. Innerhalb der
 * Umrisse könnt ihr die Landschaftsfelder, Häfen und Zahlenchips beliebig neu
 * verteilen." So the outlines are the scenario and the fields inside them are
 * the deal - which is exactly how this is built: four fixed shapes in the four
 * corners of the frame, and 23 landscapes shuffled into them.
 *
 * The shapes are read off the printed picture as far as it can be read: four
 * islands of about six fields each, in the four corners, with open water
 * between them - a middle row of sea across, and a gap of at least one field
 * between the left and the right pair. The rulebook's own count is 23
 * landscapes; six, six, six and five is what that comes to.
 */
export function fourIslands(board: Island): readonly (readonly number[])[] {
  const rowOf = (row: number): readonly number[] =>
    board.hexes.filter((hex) => hex.row === row).map((hex) => hex.id);
  const take = (
    parts: readonly (readonly [number, number, number])[],
  ): readonly number[] =>
    parts.flatMap(([row, from, count]) => rowOf(row).slice(from, from + count));
  const last = board.rows.length - 1;
  const middle = Math.floor(board.rows.length / 2);
  return [
    // North-west and north-east, above the middle row.
    take([
      [0, 0, ISLE_WIDE],
      [1, 0, ISLE_WIDE],
      [2, 0, ISLE_WIDE],
    ]),
    take([
      [0, board.rows[0] - ISLE_WIDE, ISLE_WIDE],
      [1, board.rows[1] - ISLE_WIDE, ISLE_WIDE],
      [2, board.rows[2] - ISLE_WIDE, ISLE_WIDE],
    ]),
    // And the same below it, with the fourth island one field smaller: the
    // material counts 23 landscapes, not 24.
    take([
      [middle + 1, 0, ISLE_WIDE],
      [last - 1, 0, ISLE_WIDE],
      [last, 0, ISLE_WIDE],
    ]),
    take([
      [middle + 1, board.rows[middle + 1] - ISLE_WIDE, ISLE_WIDE],
      [last - 1, board.rows[last - 1] - ISLE_WIDE, ISLE_WIDE],
      [last, board.rows[last] - 1, 1],
    ]),
  ];
}

/** How wide each row of an island is. */
const ISLE_WIDE = 2;

/** The landscapes of the four islands: "Gesamt 23", without desert or gold. */
export const FOUR_LAND: readonly Land[] = [
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
  "wolle",
  "getreide",
  "getreide",
  "getreide",
  "getreide",
  "getreide",
  "erz",
  "erz",
  "erz",
  "erz",
];

/* eslint-disable @typescript-eslint/no-magic-numbers -- the printed chips. */

/** And their 23 chips. */
export const FOUR_CHIPS: readonly number[] = [
  2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 12,
];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** "Sobald jemand an der Reihe ist und dabei 13 Siegpunkte erreicht." */
export const FOUR_TARGET = 13;

/**
 * The two start islands of *Ozeanien*.
 *
 * @param board - the lattice
 * @returns one list of fields per island
 * @remarks
 * "Baut die beiden großen Startinseln (mit Häfen) und das Meer wie gezeigt auf.
 * Mischt die Sechseckfelder, die übrig geblieben und für das unentdeckte Land
 * vorgesehen sind, und legt sie verdeckt auf die freien Plätze." So two fixed
 * outlines, seven fields each, in opposite corners - and everything else is
 * fog.
 */
export function fogIslands(board: Island): readonly (readonly number[])[] {
  const rowOf = (row: number): readonly number[] =>
    board.hexes.filter((hex) => hex.row === row).map((hex) => hex.id);
  const take = (
    parts: readonly (readonly [number, number, number])[],
  ): readonly number[] =>
    parts.flatMap(([row, from, count]) => rowOf(row).slice(from, from + count));
  const last = board.rows.length - 1;
  return [
    take([
      [0, 0, FOG_ISLE_ROW],
      [1, 0, FOG_ISLE_WIDE],
      [2, 0, FOG_ISLE_ROW],
    ]),
    take([
      [last - 2, board.rows[last - 2] - FOG_ISLE_ROW, FOG_ISLE_ROW],
      [last - 1, board.rows[last - 1] - FOG_ISLE_WIDE, FOG_ISLE_WIDE],
      [last, board.rows[last] - FOG_ISLE_ROW, FOG_ISLE_ROW],
    ]),
  ];
}

/** How the seven fields of a start island are shaped: 2-3-2. */
const FOG_ISLE_ROW = 2;
const FOG_ISLE_WIDE = 3;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the printed counts. */

/** The fourteen landscapes of the two start islands, and their chips. */
export const FOG_START_LAND: readonly Land[] = [
  "lehm",
  "lehm",
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
export const FOG_START_CHIPS: readonly number[] = [
  2, 3, 4, 4, 5, 5, 6, 8, 9, 9, 10, 10, 11, 12,
];

/**
 * What lies under the fog.
 *
 * @remarks
 * The rest of the scenario's material: "Gesamt 42" with 15 sea, two Goldflüsse
 * and five of each landscape, of which the start islands take fourteen. What is
 * left is thirteen landscapes - the two Goldflüsse among them, "sagenhaftes
 * Gold", which is what the story sends everybody into the fog for - and the sea
 * they are hidden among. This lattice holds 44, so the sea comes to seventeen.
 */
export const FOG_HIDDEN_LAND: readonly Land[] = [
  "lehm",
  "lehm",
  "lehm",
  "holz",
  "holz",
  "wolle",
  "wolle",
  "getreide",
  "getreide",
  "erz",
  "erz",
  "gold",
  "gold",
];
export const FOG_HIDDEN_CHIPS: readonly number[] = [
  3, 4, 5, 6, 6, 8, 8, 9, 10, 11, 11, 12, 3,
];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** "Sobald jemand an der Reihe ist und dabei 12 Siegpunkte erreicht." */
export const FOG_TARGET = 12;

/**
 * The board of *Durch die Wüste*, read onto this lattice.
 *
 * @remarks
 * One big island with a **belt of desert** across its north-western corner,
 * cutting a narrow strip of three fields off from it; small islands with gold
 * and ore out in the east; open water around all of it. The fields are named by
 * their place in the lattice because the outlines are the scenario - "die
 * Landschaftsfelder, Häfen und Zahlenchips der Hauptinsel ... können beliebig
 * neu ausgelegt werden", but not the shapes.
 *
 * The belt is what makes the scenario: the strip behind it is land, reachable
 * on foot - "die Wagemutigsten wählen den Weg durch die gnadenlose Wüste" - and
 * still counts as a **foreign island**, which is why the desert separates
 * islands here rather than joining them. See {@link groupLand}.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the printed outlines. */
export const DUNE_STRIP: readonly number[] = [0, 1, 2];
export const DUNE_BELT: readonly number[] = [6, 7, 8];
export const DUNE_MAIN: readonly number[] = [
  11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30, 33, 34, 35,
];
export const DUNE_ISLES: readonly number[] = [10, 25, 38, 42, 43];

/** The landscapes of the main island: nineteen, plus the three of the strip. */
export const DUNE_MAIN_LAND: readonly Land[] = [
  "lehm",
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
  "wolle",
  "getreide",
  "getreide",
  "getreide",
  "getreide",
  "erz",
  "erz",
  "erz",
];
export const DUNE_STRIP_LAND: readonly Land[] = ["holz", "wolle", "getreide"];

/**
 * And the small islands out east.
 *
 * @remarks
 * "Kleinere Inseln mit Goldvorkommen und reichen Erzlagern" - three of them, of
 * one, one and three fields, and none of them touching the main island or each
 * other. On this lattice the free water east of the island lies in a chain, so
 * which fields are picked decides how many islands there are: five in a row
 * would be one long island and no race at all.
 */
export const DUNE_ISLE_LAND: readonly Land[] = [
  "gold",
  "gold",
  "erz",
  "erz",
  "lehm",
];

/** The 27 chips, one for every field that pays. */
export const DUNE_CHIPS: readonly number[] = [
  2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12, 3, 4, 5, 6, 8, 9,
  10, 11, 12,
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** "Sobald jemand an der Reihe ist und dabei 14 Siegpunkte erreicht." */
export const DUNE_TARGET = 14;

/**
 * The fields as the island count sees them.
 *
 * @param game - the game
 * @returns the field kinds, with the desert belt counted as water
 * @remarks
 * Only in *Durch die Wüste*, and only for counting islands: the strip behind
 * the belt is a foreign island although one can walk to it, and that is exactly
 * what the scenario is about. Everywhere else a desert is simply a field that
 * pays nothing.
 */
export function groupLand(game: CatanGame): readonly Land[] {
  return dunes(game)
    ? game.land.map((kind) => (kind === "wueste" ? "meer" : kind))
    : game.land;
}

/**
 * The board of *Der vergessene Stamm*, read onto this lattice.
 *
 * @remarks
 * "Eine lange, schmale Insel", and around it the small inhabited islands that
 * nobody settles: "auf den kleinen Inseln rundum darf niemals eine Siedlung
 * gegründet werden, sie werfen auch keine Erträge ab" - and "die kleinen Inseln
 * bleiben alle ohne Zahlenchip", which is why they need none.
 *
 * The main island is the middle band of the lattice, nineteen fields long and
 * three deep; the small ones are single fields in the water north and south of
 * it, each with open water around it, so every one of them has a coastline of
 * its own for the gifts to lie on.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the printed outlines. */
export const TRIBE_MAIN: readonly number[] = [
  11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31,
];
export const TRIBE_ISLES: readonly number[] = [0, 2, 4, 39, 41, 43];

/** The nineteen fields of the main island: eighteen landscapes and a desert. */
export const TRIBE_MAIN_LAND: readonly Land[] = [
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
  "wolle",
  "getreide",
  "getreide",
  "getreide",
  "getreide",
  "erz",
  "erz",
  "erz",
  "wueste",
];

/**
 * And the six small islands, the two Goldflüsse among them - which pay nobody.
 *
 * @remarks
 * Six rather than the printed handful, and each a single field: a small island
 * may touch neither the main island nor another one, or the gifts on its
 * coastline would be reachable without ever leaving home. On this lattice only
 * the top and bottom rows keep that distance, and three fields fit in each with
 * water between them.
 */
export const TRIBE_ISLE_LAND: readonly Land[] = [
  "gold",
  "gold",
  "holz",
  "wolle",
  "getreide",
  "erz",
];

/** The eighteen chips of the main island. */
export const TRIBE_CHIPS: readonly number[] = [
  2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12,
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** What lies on the coastlines: "8 Siegpunkt-Chips", "6 Häfen", "4 Karten". */
export const TRIBE_GIFT_CHIPS = 8;
export const TRIBE_GIFT_PORTS = 6;
export const TRIBE_GIFT_CARDS = 4;

/** "Sobald jemand an der Reihe ist und dabei 13 Siegpunkte erreicht." */
export const TRIBE_TARGET = 13;

/** Whether a crossing may never carry a settlement: a small island's coast. */
export function tribeIsle(game: CatanGame, hex: number): boolean {
  return tribe(game) && TRIBE_ISLES.includes(hex);
}

/** Whether this crossing belongs to one of the untouchable small islands. */
export function onTribeIsle(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return (
    tribe(game) && board.crossings[at].hexes.some((hex) => tribeIsle(game, hex))
  );
}

/**
 * The board of *Stoffe für Catan*, read onto this lattice.
 *
 * @remarks
 * "Eure ersten beiden Siedlungen gründet ihr ... auf den beiden Hauptinseln
 * oben und unten", and between them "die 4 kleinen Inseln in der Mitte", on
 * which nobody may build. The two main islands are the top and bottom bands of
 * the lattice; the four small ones are single fields in the middle row, spaced
 * so that none of them touches another or the mainland.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the printed outlines. */
export const CLOTH_NORTH: readonly number[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
];
export const CLOTH_SOUTH: readonly number[] = [
  33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
];
export const CLOTH_ISLES: readonly number[] = [18, 20, 22, 24];

/** The 22 fields of the two main islands: two deserts, two Goldflüsse, 18 landscapes. */
export const CLOTH_MAIN_LAND: readonly Land[] = [
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
  "wolle",
  "getreide",
  "getreide",
  "getreide",
  "getreide",
  "erz",
  "erz",
  "erz",
  "gold",
  "gold",
  "wueste",
  "wueste",
];

/** What the four small islands are made of - they pay nobody, so it hardly matters. */
export const CLOTH_ISLE_LAND: readonly Land[] = [
  "wolle",
  "wolle",
  "getreide",
  "holz",
];

/** The twenty chips of the two main islands. */
export const CLOTH_CHIPS: readonly number[] = [
  2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12, 4, 10,
];

/** The eight village numbers, one for each village. */
export const CLOTH_VILLAGE_CHIPS: readonly number[] = [
  3, 4, 5, 6, 8, 9, 10, 11,
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** "Zu jedem der 8 Dörfer werden 5 Stoffballen gelegt." */
export const CLOTH_PER_VILLAGE = 5;

/** "Die restlichen 10 Stoffballen werden als allgemeiner Vorrat ... bereitgelegt." */
export const CLOTH_SUPPLY = 10;

/** "2 Stoffballen sind 1 Siegpunkt wert." */
export const CLOTH_PER_POINT = 2;

/** "Sobald sich nur noch in 3 Dörfern Stoffballen-Chips befinden, endet das Spiel." */
export const CLOTH_LAST_VILLAGES = 3;

/** "Sobald jemand an der Reihe ist und dabei 14 Siegpunkte erreicht." */
export const CLOTH_TARGET = 14;

/** Three founding settlements rather than two, and the third one pays. */
export const CLOTH_ROUNDS = 3;

/** What the cloth a seat has gathered is worth. */
export function clothPoints(game: CatanGame, seat: number): number {
  return cloth(game)
    ? Math.floor(game.players[seat].bales / CLOTH_PER_POINT)
    : 0;
}

/** Whether this field is one of the four islands of the villages. */
export function clothIsle(game: CatanGame, hex: number): boolean {
  return cloth(game) && CLOTH_ISLES.includes(hex);
}

/** Whether this crossing belongs to one of them. */
export function onClothIsle(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return (
    cloth(game) && board.crossings[at].hexes.some((hex) => clothIsle(game, hex))
  );
}

/** Whether this crossing carries a village of the forgotten tribe. */
export function villageAt(
  game: CatanGame,
  at: number,
): { readonly number: number; readonly bales: number } | null {
  return game.villagesOf[at] ?? null;
}

/**
 * The villages a seat has a trade relation with.
 *
 * @param game - the game
 * @param seat - whose ships
 * @returns the crossings of the villages it is connected to
 */
export function tradesOf(game: CatanGame, seat: number): readonly number[] {
  return Object.entries(game.traders)
    .filter(([, seats]) => seats.includes(seat))
    .map(([at]) => Number(at));
}

/**
 * The villages this seat's ships have just reached.
 *
 * @param game - the game
 * @param seat - whose ships
 * @returns the village crossings connected to one of its settlements
 * @remarks
 * "Sobald du eine Schiffslinie zwischen einer eigenen Siedlung und einem Dorf
 * des Vergessenen Stammes hergestellt hast, unterhältst du eine
 * Handelsbeziehung zu diesem Dorf." So: walk the seat's own ships from every
 * one of its settlements and see which villages the walk reaches.
 */
export function reachedVillages(
  game: CatanGame,
  seat: number,
): readonly { readonly at: number; readonly line: readonly number[] }[] {
  const board = islandOf(game.land.length);
  const found: { at: number; line: readonly number[] }[] = [];
  board.crossings.forEach((crossing) => {
    if (game.towns[crossing.id]?.owner !== seat) {
      return;
    }
    // A walk over this seat's own ships, remembering how it got there.
    const seen = new Map<number, readonly number[]>([[crossing.id, []]]);
    const edge = [crossing.id];
    while (edge.length > 0) {
      const at = edge.pop() as number;
      const line = seen.get(at) ?? [];
      for (const path of board.crossings[at].paths) {
        if (game.ships[path] !== seat) {
          continue;
        }
        for (const end of board.paths[path].ends) {
          if (!seen.has(end)) {
            seen.set(end, [...line, path]);
            edge.push(end);
          }
        }
      }
    }
    seen.forEach((line, at) => {
      if (villageAt(game, at) !== null && line.length > 0) {
        found.push({ at, line });
      }
    });
  });
  return found;
}

/**
 * The board of *Die Pirateninseln*, read onto this lattice.
 *
 * @remarks
 * "Das Szenario ist nur mit dem vorgegebenen Aufbau ausgewogen und sollte nicht
 * variiert werden" - so nothing here is shuffled but the landscapes of the home
 * island, and even those keep their chips in place.
 *
 * Four bands, west to east: the **pirate islands** with the four fortresses,
 * two **desert islands** the fleet circles, open water, and the **home island**
 * everybody settles on.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the printed outlines. */
export const CORSAIR_HOME: readonly number[] = [
  3, 4, 8, 9, 10, 15, 16, 17, 23, 24, 25, 31, 32, 37, 38, 42, 43,
];
export const CORSAIR_ISLES: readonly number[] = [0, 5, 11, 18, 39, 40];
export const CORSAIR_DUNES: readonly number[] = [13, 20, 27, 21, 28];

/** The seventeen landscapes of the home island, and their chips. */
export const CORSAIR_LAND: readonly Land[] = [
  "lehm",
  "lehm",
  "lehm",
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
  "erz",
  "erz",
  "erz",
  "gold",
];
export const CORSAIR_CHIPS: readonly number[] = [
  2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 12,
];

/** What the pirate islands are made of - they pay their holder once retaken. */
export const CORSAIR_ISLE_LAND: readonly Land[] = [
  "wolle",
  "holz",
  "getreide",
  "erz",
  "lehm",
  "wolle",
];
export const CORSAIR_ISLE_CHIPS: readonly number[] = [4, 5, 9, 10, 3, 11];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** "Jede Piratenfestung besteht aus 3 ... Chips." */
export const FORT_CHIPS = 3;

/** "Wer zuerst die Piratenfestung erobert und 10 Siegpunkte besitzt, gewinnt." */
export const CORSAIR_TARGET = 10;

/** Whether this crossing belongs to one of the pirate islands in the west. */
export function onCorsairIsle(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return (
    corsairs(game) &&
    board.crossings[at].hexes.some((hex) => CORSAIR_ISLES.includes(hex))
  );
}

/** Whether this crossing carries a pirate fortress that still stands. */
export function fortAt(
  game: CatanGame,
  at: number,
): { readonly owner: number; readonly chips: number } | null {
  return game.forts[at] ?? null;
}

/** Whether a settlement is still held by the pirates, and so pays nothing. */
export function overrunByPirates(game: CatanGame, at: number): boolean {
  const fort = fortAt(game, at);
  return corsairs(game) && fort !== null && fort.chips > 0;
}

/**
 * The circuit the pirate fleet sails.
 *
 * @param board - the lattice
 * @returns the sea fields around the desert islands, clockwise
 * @remarks
 * "Die Piratenflotte umrundet die beiden Wüsteninseln im Uhrzeigersinn." The
 * ring of fields around them, sorted by the angle they lie at - which is what
 * "clockwise" means once the picture is gone.
 */
export function fleetRing(board: Island): readonly number[] {
  const dunes = CORSAIR_DUNES;
  const middle = {
    x: dunes.reduce((sum, hex) => sum + board.hexes[hex].x, 0) / dunes.length,
    y: dunes.reduce((sum, hex) => sum + board.hexes[hex].y, 0) / dunes.length,
  };
  const ring = [
    ...new Set(
      dunes.flatMap((hex) =>
        board.hexes[hex].rim.flatMap((path) =>
          board.paths[path].hexes.filter((near) => !dunes.includes(near)),
        ),
      ),
    ),
  ];
  return ring.sort(
    (one, other) =>
      Math.atan2(board.hexes[one].y - middle.y, board.hexes[one].x - middle.x) -
      Math.atan2(
        board.hexes[other].y - middle.y,
        board.hexes[other].x - middle.x,
      ),
  );
}

/**
 * What each of the five wonders asks for, and what a stage of it costs.
 *
 * @remarks
 * **A reconstruction.** The rulebook prints neither the conditions nor the
 * prices: "du kannst mit dem Bau eines Catanischen Wunders erst beginnen, wenn
 * du die vom jeweiligen Wunder abhängige Bedingung erfüllst (siehe
 * Wunderplättchen)", and the tiles are not in the text. What is quoted is the
 * shape - "jedes Wunder gliedert sich in vier Stufen. Jede Stufe kostet die auf
 * dem entsprechenden Wunderplättchen angegebenen 5 Rohstoffe" - and one
 * example: "so kannst du beispielsweise nur dann mit dem Bau des Theaters
 * beginnen, wenn du bereits 2 Städte gebaut hast."
 *
 * So: four stages, five resources each, and one condition apiece - the Theater
 * as printed, and the other four chosen to ask for four different things a
 * colour can have, so that which wonder is worth claiming depends on how the
 * game has gone rather than on which is cheapest.
 */
export type WonderTile = {
  readonly name: string;
  readonly cost: Hand;
  /** What the colour must already have before it may claim this wonder. */
  readonly needs:
    | { readonly kind: "towns"; readonly count: number }
    | { readonly kind: "cities"; readonly count: number }
    | { readonly kind: "harbours"; readonly count: number }
    | { readonly kind: "knights"; readonly count: number };
};

export const WONDERS: Readonly<Record<Wonder, WonderTile>> = {
  mauer: {
    name: "Große Mauer",
    cost: { lehm: 2, holz: 1, wolle: 0, getreide: 0, erz: 2 },
    needs: { kind: "towns", count: 3 },
  },
  bruecke: {
    name: "Große Brücke",
    cost: { lehm: 2, holz: 2, wolle: 1, getreide: 0, erz: 0 },
    needs: { kind: "harbours", count: 2 },
  },
  monument: {
    name: "Monument",
    cost: { lehm: 0, holz: 1, wolle: 1, getreide: 1, erz: 2 },
    needs: { kind: "towns", count: 4 },
  },
  theater: {
    name: "Großes Theater",
    cost: { lehm: 0, holz: 0, wolle: 2, getreide: 2, erz: 1 },
    needs: { kind: "cities", count: 2 },
  },
  burg: {
    name: "Burg",
    cost: { lehm: 1, holz: 2, wolle: 0, getreide: 0, erz: 2 },
    needs: { kind: "knights", count: 2 },
  },
};
/** The five, in the order they are offered. */
export const WONDER_KINDS: readonly Wonder[] = Object.keys(WONDERS) as Wonder[];

/* eslint-disable @typescript-eslint/no-magic-numbers -- the printed counts. */

/**
 * The nineteen fields of the big island: two deserts among them.
 *
 * @remarks
 * The material table counts "Gesamt 42" with 19 sea and 23 landscapes, and the
 * rules speak of "die beiden Landschaftsfelder, die an die Wüsten grenzen" - so
 * the deserts are there whatever the table's dashes say. On this lattice of 44
 * that comes to 25 land and 19 sea.
 */
export const WONDER_MAIN_LAND: readonly Land[] = [
  "lehm",
  "lehm",
  "lehm",
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
  "erz",
  "wolle",
  "wueste",
  "wueste",
];

/** And the six small islands, which are settled for a Siegpunkt-Chip. */
export const WONDER_ISLE_LAND: readonly Land[] = [
  "lehm",
  "holz",
  "wolle",
  "getreide",
  "erz",
  "holz",
];

/** The 23 chips, one for every landscape. */
export const WONDER_CHIPS: readonly number[] = [
  2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12, 3, 5, 9, 10, 4,
];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** "Jedes Wunder gliedert sich in vier Stufen." */
export const WONDER_STAGES = 4;

/** "... wenn jemand an der Reihe ist, 10 Siegpunkte besitzt ..." */
export const WONDER_TARGET = 10;

/** How far along a seat's wonder is, or zero where there is none. */
export function wonderStage(game: CatanGame, seat: number): number {
  return game.wonders[seat]?.stage ?? 0;
}

/** Whether a wonder is still free to claim. */
export function wonderFree(game: CatanGame, which: Wonder): boolean {
  return !game.wonders.some((each) => each?.kind === which);
}

/**
 * Whether a seat may claim this wonder.
 *
 * @param game - the game
 * @param seat - who wants it
 * @param which - the wonder
 * @returns whether its condition is met
 */
export function wonderOpen(
  game: CatanGame,
  seat: number,
  which: Wonder,
): boolean {
  const board = islandOf(game.land.length);
  const needs = WONDERS[which].needs;
  const towns = game.towns.filter((town) => town?.owner === seat);
  const count =
    needs.kind === "towns"
      ? towns.length
      : needs.kind === "cities"
        ? towns.filter((town) => town?.city === true).length
        : needs.kind === "harbours"
          ? game.harbours.filter((harbour) =>
              board.paths[harbour.path].ends.some(
                (end) => game.towns[end]?.owner === seat,
              ),
            ).length
          : game.players[seat].knights;
  return count >= needs.count;
}

/** Whether this game is played on the sea. */
export function sailing(game: CatanGame): boolean {
  return (
    game.scenario === "neuewelt" ||
    game.scenario === "ufer" ||
    game.scenario === "inseln" ||
    game.scenario === "ozeanien" ||
    game.scenario === "wuestengurt" ||
    game.scenario === "stamm" ||
    game.scenario === "stoffe" ||
    game.scenario === "pirateninseln" ||
    game.scenario === "wunder"
  );
}

/** Whether this is *Die Catanischen Wunder*, the last. */
export function wonders(game: CatanGame): boolean {
  return game.scenario === "wunder";
}

/** Whether this is *Die Pirateninseln*, the seventh. */
export function corsairs(game: CatanGame): boolean {
  return game.scenario === "pirateninseln";
}

/** Whether this is *Stoffe für Catan*, the sixth. */
export function cloth(game: CatanGame): boolean {
  return game.scenario === "stoffe";
}

/** Whether this is *Der vergessene Stamm*, the fifth. */
export function tribe(game: CatanGame): boolean {
  return game.scenario === "stamm";
}

/** Whether this is *Durch die Wüste*, the fourth. */
export function dunes(game: CatanGame): boolean {
  return game.scenario === "wuestengurt";
}

/** Whether this is *Ozeanien*, the third - the one with the fog. */
export function fogging(game: CatanGame): boolean {
  return game.scenario === "ozeanien";
}

/** Whether this field is still under the fog. */
export function foggy(game: CatanGame, hex: number): boolean {
  return fogging(game) && game.land[hex] === "unbekannt";
}

/** Whether this is *Zu neuen Ufern*, the first Seefahrer scenario. */
export function shores(game: CatanGame): boolean {
  return game.scenario === "ufer";
}

/** Whether this is *Die vier Inseln*, the second. */
export function fourIsles(game: CatanGame): boolean {
  return game.scenario === "inseln";
}

/**
 * What one island chip is worth.
 *
 * @param game - the game
 * @returns the points a first settlement overseas pays
 * @remarks
 * The scenarios say "2 Siegpunkt-Chips ... (Siedlungswert insgesamt: 3
 * Siegpunkte)"; the free game of the Neue Welt pays one.
 */
export function chipWorth(game: CatanGame): number {
  return shores(game) || fourIsles(game) || dunes(game)
    ? SHORE_POINTS
    : ISLAND_POINTS;
}

/**
 * Whether a first settlement overseas is worth anything here.
 *
 * @param game - the game
 * @returns whether the scenario hands out Siegpunkt-Chips at all
 * @remarks
 * *Ozeanien* does not: its extra rule is the fog. *Stoffe für Catan* does not
 * either: its extra points are the cloth, and *Die Pirateninseln* has its own
 * way of winning altogether. The rest pay - one in the free game of the Neue
 * Welt, two in the scenarios that print "Sondersiegpunkte".
 */
export function islandPay(game: CatanGame): boolean {
  return sailing(game) && !fogging(game) && !cloth(game) && !corsairs(game);
}

/** Whether a field is open water. */
export function isSea(game: CatanGame, hex: number): boolean {
  // Fog is sailed into, not around: nobody knows what is under it, so a ship
  // may be built along it, and that is how it comes to light.
  return game.land[hex] === "meer" || foggy(game, hex);
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
  // "Du darfst in diesem Szenario nur 1 Schiffslinie zu den westlichen Inseln
  // bauen ... Die Schiffslinie darf sich nicht verzweigen und auch nicht über
  // die Piratenfestung hinaus gebaut werden." A line that does not branch is a
  // line whose new ship goes on an end: a crossing this seat has at most one
  // ship at, and never past the fortress it is heading for.
  if (corsairs(game) && !straightLine(game, seat, at)) {
    return false;
  }
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
      // "Sobald du eine Schiffslinie zwischen einer eigenen Siedlung und einem
      // Dorf ... hergestellt hast, gilt die Schiffslinie als geschlossen. Das
      // heißt, dass aus dieser Schiffslinie kein Schiff mehr versetzt werden
      // darf."
      !game.lockedShips.includes(at) &&
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
  return landIslands(islandOf(game.land.length), groupLand(game));
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
    islandPay(game) &&
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
  return islandPay(game) ? game.players[seat].islandChips * chipWorth(game) : 0;
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

/**
 * The fortress a seat is fighting for.
 *
 * @param game - the game
 * @param seat - whose colour
 * @returns the crossing of its fortress, or null once it has fallen
 */
export function fortOf(game: CatanGame, seat: number): number | null {
  const found = Object.entries(game.forts).find(
    ([, fort]) => fort.owner === seat && fort.chips > 0,
  );
  return found === undefined ? null : Number(found[0]);
}

/** How many warships a seat has on the water. */
export function warshipsOf(game: CatanGame, seat: number): number {
  return game.warships.filter((path) => game.ships[path] === seat).length;
}

/**
 * The ships of a seat's line, from the settlement outwards.
 *
 * @param game - the game
 * @param seat - whose line
 * @returns its paths, the one nearest home first
 * @remarks
 * "Deckst du eine Ritterkarte auf, darfst du jeweils das hinterste 'normale'
 * Schiff deiner Schiffslinie in ein Kriegsschiff umwandeln" - the rearmost is
 * the one nearest home, so the line has to be walked in order.
 *
 * **Which** line, when a colour has ships in more than one place: "baut eine
 * Schiffslinie von einer eurer Küstensiedlungen zu eurer Piratenfestung", so
 * the line is the one that goes there. Taking the first settlement that happens
 * to have a ship beside it instead cost a self-played table its game: the
 * knights armed ships in a stub of two out in the wrong sea while the line at
 * the fortress stayed unarmed, and twenty-one knight cards later nobody had
 * ever attacked. Failing a line at the fortress, the longest one is the fleet
 * that will do the fighting.
 */
export function shipLine(game: CatanGame, seat: number): readonly number[] {
  const board = islandOf(game.land.length);
  const homes = board.crossings.filter(
    (crossing) =>
      game.towns[crossing.id]?.owner === seat &&
      crossing.paths.some((path) => game.ships[path] === seat),
  );
  const fort = fortOf(game, seat);
  const lines = homes.map((home) => walkLine(game, seat, home.id));
  const fighting =
    fort === null
      ? []
      : lines.filter((line) =>
          line.some((path) => board.crossings[fort].paths.includes(path)),
        );
  // The **longest** of them, not the first: once a colour has built its
  // settlement on the pirate island, the one ship beside it touches the
  // fortress as well, and that stub is not the fleet - a self-played table
  // measured its whole campaign against a line of one and never attacked with
  // more than a single warship.
  return (
    [...(fighting.length > 0 ? fighting : lines)].sort(
      (one, other) => other.length - one.length,
    )[0] ?? []
  );
}

/** One connected line of ships, walked outwards from a settlement. */
function walkLine(
  game: CatanGame,
  seat: number,
  from: number,
): readonly number[] {
  const board = islandOf(game.land.length);
  const line: number[] = [];
  const seen = new Set<number>([from]);
  let edge = [from];
  while (edge.length > 0) {
    const next: number[] = [];
    for (const at of edge) {
      for (const path of board.crossings[at].paths) {
        if (game.ships[path] === seat && !line.includes(path)) {
          line.push(path);
          for (const end of board.paths[path].ends) {
            if (!seen.has(end)) {
              seen.add(end);
              next.push(end);
            }
          }
        }
      }
    }
    edge = next;
  }
  return line;
}

/** Whether this seat's line has reached its own fortress. */
export function atFort(game: CatanGame, seat: number): boolean {
  const board = islandOf(game.land.length);
  const fort = fortOf(game, seat);
  return (
    fort !== null &&
    board.crossings[fort].paths.some((path) => game.ships[path] === seat)
  );
}

/**
 * Whether a new ship would keep this seat's line a line.
 *
 * @param game - the game
 * @param seat - whose ships
 * @param at - the path it would go on
 * @returns whether it goes on an end of the line and not past the fortress
 */
export function straightLine(
  game: CatanGame,
  seat: number,
  at: number,
): boolean {
  const board = islandOf(game.land.length);
  const fort = fortOf(game, seat);
  const ends = board.paths[at].ends;
  // Never past the fortress: a crossing that carries one is the end of the
  // line, and nothing is built beyond it.
  if (fort !== null && ends.includes(fort) && atFort(game, seat)) {
    return false;
  }
  return ends.every(
    (end) =>
      board.crossings[end].paths.filter((path) => game.ships[path] === seat)
        .length <= 1,
  );
}
