/**
 * *Fischfang auf Catan* - the first of the five Händler & Barbaren scenarios.
 *
 * @module
 * @remarks
 * A scenario, not a variant and not a mode. The difference is what it touches:
 * a variant adds a rule, a mode replaces the game, and a scenario changes the
 * **board**. Here the desert becomes a lake, six fishing grounds go round the
 * coast, and a second currency joins the table.
 *
 * The rules are read out of `game_instructions/catan_babaren.pdf`, pages 8 and
 * 9, and written up in `docs/games/catan/szenarien.md`.
 */
import { islandOf, type Island } from "./board";
import { playing, type CatanGame } from "./state";

/**
 * The numbers printed on the lake.
 *
 * @remarks
 * Four of them on one tile - "1 Landschaftsfeld See mit den Würfelzahlen 2, 3,
 * 11, 12" - which is why the lake cannot be an ordinary chip: the chips array
 * holds one number per landscape and this one has four. The four are the
 * rarest rolls, so the lake pays seldom and pays everybody who fishes it.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the numbers printed on
   the tiles are the rule, quoted from the material list. */
export const LAKE_NUMBERS: readonly number[] = [2, 3, 11, 12];

/** The numbers the six fishing grounds carry. */
export const GROUND_NUMBERS: readonly number[] = [4, 5, 6, 8, 9, 10];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** How many coastal crossings one fishing ground marks. */
export const GROUND_CROSSINGS = 3;

/**
 * How the 29 fish tiles are made up.
 *
 * @remarks
 * Counted off the material picture: eleven tiles showing one fish, ten showing
 * two, eight showing three. They add up to 29, which is what the list says.
 */
export const FISH_TILES: readonly {
  readonly fish: number;
  readonly count: number;
}[] = [
  { fish: 1, count: 11 },
  { fish: 2, count: 10 },
  { fish: 3, count: 8 },
];

/**
 * Where the robber stands while it is not on the board.
 *
 * @remarks
 * A place rather than a null, because everything that reads `robber` already
 * indexes the landscapes with it and -1 simply never matches - "hex !==
 * game.robber" is true for every field, which is exactly what "the robber is
 * not out there" means.
 */
export const OFF_BOARD = -1;

/** The one tile that is not a fish. */
export const OLD_SHOE = 0;

/** How many tiles one player may hold. */
export const MAX_TILES = 7;

/**
 * What each action costs, cheapest first.
 *
 * @remarks
 * Straight off the Übersichtskarte. Spent in **fish**, not in tiles, and the
 * rulebook is strict that change is not given: "gibst du mehr Fische aus, als
 * die Aktion kostet, verfallen die überzähligen Fische."
 */
export type FishAction = "robber" | "steal" | "take" | "road" | "card";

/** The price of each, in fish. */
export const FISH_COST: Readonly<Record<FishAction, number>> = {
  robber: 2,
  steal: 3,
  take: 4,
  road: 5,
  card: 7,
};

/** The actions in the order the overview card prints them. */
export const FISH_ACTIONS: readonly FishAction[] = [
  "robber",
  "steal",
  "take",
  "road",
  "card",
];

/** What each action is called on screen. */
export const FISH_ACTION_NAMES: Readonly<Record<FishAction, string>> = {
  robber: "Räuber vom Feld nehmen",
  steal: "1 Rohstoff ziehen",
  take: "1 Rohstoff nehmen",
  road: "1 Straße gratis",
  card: "1 Entwicklungskarte",
};

/** What the Alter Schuh costs its holder. */
export const SHOE_POINTS = 1;

/** Whether this game is the fishing scenario. */
export function fishing(game: CatanGame): boolean {
  return game.scenario === "fischer";
}

/**
 * One fishing ground: a number and the coastal crossings it feeds.
 *
 * @remarks
 * "Jeder Fischgrund weist 3 Kreuzungen an der Küste als Fischfanggebiet aus."
 */
export type Ground = {
  readonly number: number;
  readonly crossings: readonly number[];
};

/**
 * Where the six fishing grounds go.
 *
 * @param board - the island
 * @param taken - the coastal paths a harbour already occupies
 * @returns six grounds, each with its number and three crossings
 * @remarks
 * "Legt auf jede freie Spitze der Rahmenteile (ohne Hafen) einen beliebigen
 * Fischgrund." The frame is not modelled here - the board is landscapes,
 * crossings and paths - so this is derived the same way the harbours are: walk
 * the coast and space them evenly, skipping anything a harbour has taken.
 *
 * That is an invention in its detail and not in its shape. What the rulebook
 * asks for is six fishing grounds spread round the coast, clear of the
 * harbours, each covering three neighbouring crossings; that is exactly what
 * comes out. The alternative - naming crossing numbers - would only be right
 * for one printed frame and wrong for the variable board this table builds.
 */
export function fishingGrounds(
  board: Island,
  taken: readonly number[],
): readonly Ground[] {
  const busy = new Set(taken);
  const free = board.coast.filter((path) => !busy.has(path));
  return GROUND_NUMBERS.map((number, index) => {
    const at =
      free[
        Math.round((index * free.length) / GROUND_NUMBERS.length) % free.length
      ];
    return { number, crossings: coastalRun(board, at) };
  });
}

/**
 * The three crossings a ground covers: a coastal path's two ends, plus one on.
 *
 * @param board - the island
 * @param path - the coastal path the ground sits on
 * @returns three crossings, in coastal order
 */
function coastalRun(board: Island, path: number): readonly number[] {
  const [first, second] = board.paths[path].ends;
  const onward = board.crossings[second].paths
    .filter((other) => other !== path && board.paths[other].hexes.length === 1)
    .map((other) => board.paths[other].ends.find((end) => end !== second))
    .find((end) => end !== undefined);
  return onward === undefined ? [first, second] : [first, second, onward];
}

/**
 * Every crossing that fishes, and on which number.
 *
 * @param game - the game
 * @returns one entry per crossing that can fish, with the numbers it pays on
 * @remarks
 * The lake counts as a fishing ground too - "auch der See ist ein
 * Fischfanggebiet" - and it feeds the six crossings around it on any of its
 * four numbers.
 */
export function fishingSpots(
  game: CatanGame,
): Readonly<Record<number, readonly number[]>> {
  const spots: Record<number, number[]> = {};
  const add = (crossing: number, numbers: readonly number[]): void => {
    spots[crossing] = [...(spots[crossing] ?? []), ...numbers];
  };
  for (const ground of game.grounds) {
    for (const crossing of ground.crossings) {
      add(crossing, [ground.number]);
    }
  }
  const lake = game.land.indexOf("see");
  if (lake >= 0) {
    for (const crossing of islandOf(game.land.length).hexes[lake].corners) {
      add(crossing, LAKE_NUMBERS);
    }
  }
  return spots;
}

/**
 * How many fish tiles a roll earns a seat.
 *
 * @param game - the game
 * @param seat - whose buildings
 * @param rolled - the number that came up
 * @returns one per settlement on a matching spot, two per city
 * @remarks
 * "Besitzt du eine Stadt an einem Fischfanggebiet, erhältst du 2
 * Fischplättchen." A crossing that both a ground and the lake feed pays for
 * each of them, because each is its own fishing area.
 */
export function fishEarned(
  game: CatanGame,
  seat: number,
  rolled: number,
): number {
  const spots = fishingSpots(game);
  return Object.entries(spots).reduce((sum, [crossing, numbers]) => {
    const town = game.towns[Number(crossing)];
    const hits = numbers.filter((each) => each === rolled).length;
    return town !== null && town.owner === seat
      ? sum + hits * (town.city ? 2 : 1)
      : sum;
  }, 0);
}

/**
 * How many victory points this seat needs.
 *
 * @param game - the game
 * @param seat - whose target
 * @returns the table's target, plus one while they hold the Alter Schuh
 * @remarks
 * "Wer den alten Schuh besitzt, benötigt 1 Siegpunkt mehr, um das Spiel zu
 * gewinnen." A handicap that moves with the tile rather than a score that
 * changes, which is why it is asked here and not folded into pointsOf.
 */
export function targetFor(game: CatanGame, seat: number): number {
  return game.target + (game.shoe === seat ? SHOE_POINTS : 0);
}

/** Whether the robber is off the board, waiting for a seven. */
export function robberAshore(game: CatanGame): boolean {
  return !fishing(game) || game.robber >= 0;
}

/** Whether a Häfen-style extra point is in play, for the docs to line up. */
export function harbourPointsOn(game: CatanGame): boolean {
  return playing(game, "haefen");
}
