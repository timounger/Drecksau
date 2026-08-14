/**
 * Dealing a game of Qwixx.
 *
 * @module
 * @remarks
 * Nothing is dealt, really: everybody starts with an empty sheet and the same
 * four rows. All the setup does is decide who rolls first and throw the dice
 * for them.
 */
import { startTurn } from "./moves";
import { createRandom } from "./random";
import {
  ROWS,
  type Player,
  type QwixxGame,
  type Row,
  type Sheet,
} from "./state";

/** A seat to deal in. */
export type QwixxSeat = {
  readonly name: string;
  /** True if the computer plays this seat. */
  readonly isBot: boolean;
};

/** The computer players' names, in the order they join. */
const BOT_NAMES: readonly string[] = ["Runa", "Sven", "Tilda", "Uwe"];

/**
 * Deals a fresh game.
 *
 * @param seats - the players, in turn order (two to five)
 * @param seed - the seed every roll of the game runs from
 * @returns the game, with the first player's dice already on the table
 */
export function createGame(
  seats: readonly QwixxSeat[],
  seed: number,
): QwixxGame {
  const random = createRandom(seed);
  const players: Player[] = seats.map((seat) => ({
    name: seat.name,
    isBot: seat.isBot,
    sheet: emptySheet(),
  }));
  const base: QwixxGame = {
    phase: "white",
    players,
    active: 0,
    dice: { white: [1, 1], colours: blankColours() },
    locked: { rot: false, gelb: false, gruen: false, blau: false },
    decided: players.map(() => false),
    activeCrossed: false,
    seed,
    rng: random.state(),
    log: [],
  };
  // The first roll is part of the first turn, not of the setup.
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
): readonly QwixxSeat[] {
  const seats: QwixxSeat[] = [{ name: playerName, isBot: false }];
  for (let index = 0; index < opponents; index++) {
    seats.push({ name: BOT_NAMES[index % BOT_NAMES.length], isBot: true });
  }
  return seats;
}

/** A sheet with nothing on it. */
function emptySheet(): Sheet {
  const crosses = {} as Record<Row, readonly number[]>;
  for (const row of ROWS) {
    crosses[row] = [];
  }
  return { crosses, penalties: 0 };
}

/** Four colour dice with nothing on them yet. */
function blankColours(): Record<Row, number | null> {
  const colours = {} as Record<Row, number | null>;
  for (const row of ROWS) {
    colours[row] = null;
  }
  return colours;
}
