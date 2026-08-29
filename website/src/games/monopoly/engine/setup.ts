/**
 * Dealing a fresh game.
 *
 * @module
 * @remarks
 * Almost nothing to lay out: everybody starts on LOS with 1500 €, both decks
 * are shuffled, and the box's 32 houses and 12 hotels go on the side. The
 * supply matters and is not decoration - running the bank out of houses is a
 * real strategy, and a game that quietly printed a thirty-third would not be
 * this game.
 *
 * Who begins is the one thing the rulebook leaves to the table ("der Spieler
 * mit dem höchsten Wurf beginnt"). Nobody at a screen can roll for it, so the
 * first seat begins.
 *
 * The game opens on {@link Phase} `"tokens"` rather than on a throw, because
 * the rulebook opens there too: "Jeder Spieler nimmt sich eine Spielfigur und
 * stellt sie auf LOS."
 */
import { GO_AT } from "./board";
import { deckOf } from "./cards";
import { createRandom, shuffle } from "./random";
import {
  HOTEL_SUPPLY,
  HOUSE_SUPPLY,
  MAX_PLAYERS,
  MIN_PLAYERS,
  START_CASH,
  blankEstates,
  type MonopolyGame,
  type MonopolyPlayer,
} from "./state";
import { NO_TOKEN } from "./tokens";

/** A seat at the table, before anything is dealt. */
export type MonopolySeat = {
  readonly name: string;
  readonly isBot: boolean;
};

/** What the seat you play yourself is called when it has no other name. */
export const SELF_NAME = "Du";

/**
 * Deals a game.
 *
 * @param seats - the players, in turn order
 * @param seed - the shuffle to use, so a game can be replayed exactly
 * @returns a game waiting on the first player's throw
 */
export function createGame(
  seats: readonly MonopolySeat[],
  seed: number,
  parkingPot = true,
  doubleGo = true,
): MonopolyGame {
  const count = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, seats.length));
  const random = createRandom(seed);
  const players: MonopolyPlayer[] = Array.from(
    { length: count },
    (unused, seat) => ({
      name: seats[seat]?.name ?? `Spieler ${seat + 1}`,
      isBot: seats[seat]?.isBot ?? true,
      token: NO_TOKEN,
      cash: START_CASH,
      at: GO_AT,
      jailTurns: null,
      pardons: [],
      bankrupt: false,
    }),
  );
  return {
    phase: "tokens",
    players,
    active: 0,
    estates: blankEstates(),
    dice: [],
    doubles: 0,
    houses: HOUSE_SUPPLY,
    hotels: HOTEL_SUPPLY,
    ereignis: shuffle(random, deckOf("ereignis")),
    gemeinschaft: shuffle(random, deckOf("gemeinschaft")),
    drawn: null,
    auction: null,
    debt: null,
    offer: null,
    offersThisTurn: 0,
    toAuction: [],
    winners: [],
    rng: random.state(),
    seed,
    pot: 0,
    parkingPot,
    doubleGo,
    log: [
      `${count} Spieler, je ${START_CASH} €. Zuerst sucht sich jeder eine Spielfigur.`,
    ],
  };
}

/**
 * The seats for a game against the computer.
 *
 * @param playerName - what the human seat is called
 * @param opponents - how many computer players join
 * @returns the seats, the human first
 * @remarks
 * Plain names, and they used to be the pieces' - "Schiff", "Zylinder". That
 * stopped working the moment the piece became something you choose: the table
 * ended up with a player called Zylinder pushing the wheelbarrow, which reads
 * as a bug even though nothing was wrong. A player has a name and a piece, and
 * they are two different things.
 */
export function soloSeats(
  playerName: string,
  opponents: number,
): readonly MonopolySeat[] {
  const names = ["Bruno", "Clara", "Dilan", "Erika", "Fatih"];
  return [
    { name: playerName, isBot: false },
    ...Array.from({ length: opponents }, (unused, at) => ({
      name: names[at % names.length],
      isBot: true,
    })),
  ];
}
