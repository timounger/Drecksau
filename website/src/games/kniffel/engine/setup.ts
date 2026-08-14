/**
 * Dealing a game of Kniffel.
 *
 * @module
 * @remarks
 * Nothing to deal: everybody gets an empty sheet and the first player throws.
 */
import { startTurn } from "./moves";
import { createRandom } from "./random";
import {
  CATEGORIES,
  type Category,
  type KniffelGame,
  type Player,
  type Sheet,
} from "./state";

/** A seat to deal in. */
export type KniffelSeat = {
  readonly name: string;
  /** True if the computer plays this seat. */
  readonly isBot: boolean;
};

/** The computer players' names, in the order they join. */
const BOT_NAMES: readonly string[] = ["Berta", "Cem", "Dora", "Emil", "Frida"];

/**
 * Deals a fresh game.
 *
 * @param seats - the players, in turn order (one to six)
 * @param seed - the seed every throw of the game runs from
 * @returns the game, with the first player's dice already on the table
 */
export function createGame(
  seats: readonly KniffelSeat[],
  seed: number,
): KniffelGame {
  const random = createRandom(seed);
  const players: Player[] = seats.map((seat) => ({
    name: seat.name,
    isBot: seat.isBot,
    sheet: emptySheet(),
  }));
  const base: KniffelGame = {
    phase: "turn",
    players,
    active: 0,
    dice: [],
    held: [],
    rollsLeft: 0,
    round: 1,
    seed,
    rng: random.state(),
    log: [],
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
 * @remarks
 * Zero opponents is allowed and is not an oversight: Kniffel alone, against
 * your own best sheet, is how most people have played it.
 */
export function soloSeats(
  playerName: string,
  opponents: number,
): readonly KniffelSeat[] {
  const seats: KniffelSeat[] = [{ name: playerName, isBot: false }];
  for (let index = 0; index < opponents; index++) {
    seats.push({ name: BOT_NAMES[index % BOT_NAMES.length], isBot: true });
  }
  return seats;
}

/** A sheet with every box still free. */
function emptySheet(): Sheet {
  const sheet = {} as Record<Category, number | null>;
  for (const category of CATEGORIES) {
    sheet[category] = null;
  }
  return sheet;
}
