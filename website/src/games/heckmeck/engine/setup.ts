/**
 * Dealing a game of Heckmeck.
 *
 * @module
 * @remarks
 * Nothing to deal: the sixteen tiles go on the grill and the first player
 * throws. Everything else the game does to itself.
 */
import { startTurn } from "./moves";
import { createRandom } from "./random";
import { allTiles, type HeckmeckGame, type Player } from "./state";

/** A seat to deal in. */
export type HeckmeckSeat = {
  readonly name: string;
  /** True if the computer plays this seat. */
  readonly isBot: boolean;
};

/** The computer players' names, in the order they join. */
const BOT_NAMES: readonly string[] = [
  "Vera",
  "Willi",
  "Xenia",
  "Yusuf",
  "Zora",
  "Anton",
];

/**
 * Deals a fresh game.
 *
 * @param seats - the players, in turn order (two to seven)
 * @param seed - the seed every roll of the game runs from
 * @returns the game, with the first player's dice already on the table
 */
export function createGame(
  seats: readonly HeckmeckSeat[],
  seed: number,
): HeckmeckGame {
  const random = createRandom(seed);
  const players: Player[] = seats.map((seat) => ({
    name: seat.name,
    isBot: seat.isBot,
    stack: [],
  }));
  const base: HeckmeckGame = {
    phase: "pick",
    players,
    active: 0,
    grill: allTiles(),
    burnt: [],
    dice: [],
    kept: [],
    lastOutcome: null,
    seed,
    rng: random.state(),
    log: ["Sechzehn Chips liegen auf dem Grill."],
  };
  // The first throw belongs to the first turn, not to the setup.
  return startTurn(base, 0);
}

/**
 * Builds the seats for a game against the computer.
 *
 * @param playerName - what the human seat is called
 * @param opponents - how many computer players join
 * @returns the seats, the human first
 */
export function soloSeats(
  playerName: string,
  opponents: number,
): readonly HeckmeckSeat[] {
  const seats: HeckmeckSeat[] = [{ name: playerName, isBot: false }];
  for (let index = 0; index < opponents; index++) {
    seats.push({ name: BOT_NAMES[index % BOT_NAMES.length], isBot: true });
  }
  return seats;
}
