/**
 * The players: the human at index 0 and up to three AI rivals, each with a
 * name, a colour, a character and a treasury of their own - and the lookups
 * every manager uses to learn who owns an island, a building or a ship.
 *
 * @module
 */
import { STARTING_UNLOCKS } from "./buildings-data";
import { createLedger } from "./economy";
import type { Building, Game, GameStats, Personality, Player } from "./types";

/** The human player's id. */
export const HUMAN = 0;

/** Owner id of the free trader's ship. */
export const TRADER = -1;

/** Owner id of pirate ships. */
export const PIRATES = -2;

/** Most AI players in a game. */
export const MAX_AI = 3;

/** AI players a new game has unless the player chooses otherwise. */
export const DEFAULT_AI = 2;

/** The rivals there can be, in order: made-up houses of this game. */
export const RIVALS: readonly {
  readonly name: string;
  readonly color: number;
  readonly personality: Personality;
}[] = [
  { name: "Haus Valdoro", color: 0x2f6fd0, personality: "trader" },
  { name: "Haus Morvaine", color: 0xc23b3b, personality: "warlike" },
  { name: "Haus Elsenreich", color: 0x3f9a4a, personality: "expansionist" },
];

/** The human's colour. */
export const HUMAN_COLOR = 0xd6a21e;

/** The human's name in the lists. */
export const HUMAN_NAME = "Du";

/**
 * Counters at zero.
 *
 * @returns fresh statistics
 */
export function emptyStats(): GameStats {
  return {
    built: 0,
    peakPopulation: 0,
    peakTier: 0,
    founded: 0,
    shipsBuilt: 0,
    traded: 0,
    sold: 0,
    sunk: 0,
    missions: 0,
  };
}

/**
 * A new player.
 *
 * @param id - the id (index in the game's list)
 * @param gold - starting gold
 * @param rival - the AI's name, colour and character, or null for the human
 * @param firstThink - game second of the AI's first decision
 * @returns the player
 */
export function createPlayer(
  id: number,
  gold: number,
  rival: (typeof RIVALS)[number] | null,
  firstThink: number,
): Player {
  return {
    id,
    name: rival?.name ?? HUMAN_NAME,
    color: rival?.color ?? HUMAN_COLOR,
    human: rival === null,
    gold,
    taxLevel: 1,
    ledger: createLedger(gold),
    unlocked: [...STARTING_UNLOCKS],
    stats: emptyStats(),
    research: { current: null, progress: 0, done: [], rate: 0 },
    reputation: [],
    ai:
      rival === null
        ? null
        : {
            personality: rival.personality,
            nextThink: firstThink,
            nextDiplomacy: firstThink * 2,
            task: { type: "none" },
            noSite: {},
            thrifty: false,
            crises: { shortage: 0, money: 0, war: 0 },
            missions: [],
          },
    alive: true,
  };
}

/**
 * A player by id.
 *
 * @param game - the game
 * @param id - the player id
 * @returns the player, or null for the trader, pirates or an unknown id
 */
export function playerById(game: Game, id: number): Player | null {
  return id >= 0 && id < game.players.length ? game.players[id] : null;
}

/**
 * Who owns an island.
 *
 * @param game - the game
 * @param island - the island id
 * @returns the player id, or -1 when nobody does
 */
export function islandOwner(game: Game, island: number): number {
  return game.islands[island]?.owner ?? -1;
}

/**
 * Who owns a building: the owner of its island.
 *
 * @param game - the game
 * @param building - the building
 * @returns the player id, or -1
 */
export function ownerOf(game: Game, building: Building): number {
  return islandOwner(game, building.island);
}

/**
 * The player who owns a building, as an object.
 *
 * @param game - the game
 * @param building - the building
 * @returns the player, or null
 */
export function playerOf(game: Game, building: Building): Player | null {
  return playerById(game, ownerOf(game, building));
}

/**
 * The islands a player owns.
 *
 * @param game - the game
 * @param player - the player id
 * @returns island ids
 */
export function islandsOf(game: Game, player: number): number[] {
  return game.islands
    .filter((island) => island.owner === player)
    .map((island) => island.id);
}

/**
 * The islands a player owns, the oldest settlement first: index 0 is home.
 *
 * @param game - the game
 * @param player - the player id
 * @returns island ids, by founding time and then by id
 */
export function islandsByAge(game: Game, player: number): number[] {
  return islandsOf(game, player).sort(
    (a, b) => game.islands[a].foundedAt - game.islands[b].foundedAt || a - b,
  );
}

/**
 * The human player.
 *
 * @param game - the game
 * @returns the player
 */
export function human(game: Game): Player {
  return game.players[HUMAN];
}
