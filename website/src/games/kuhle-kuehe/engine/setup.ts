/**
 * Dealing a fresh game.
 *
 * @module
 */
import { buildDeck, type Card } from "./cards";
import { createRandom, shuffle } from "./random";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  START_HAND,
  type KuhleKueheGame,
  type Player,
} from "./state";

/** A seat at the table, before the cards are dealt. */
export type KuhleKueheSeat = {
  readonly name: string;
  readonly isBot: boolean;
};

/**
 * Shuffles the deck and deals everybody in.
 *
 * @param seats - the players, in seating order
 * @param seed - the shuffle to use, so a game can be replayed exactly
 * @returns a game waiting for the first player to take cards
 * @remarks
 * The whole deck is shuffled at once and the cursor stored in the game, so
 * everything that follows - the draws, a blind Lasso - runs off the same
 * sequence. That is what lets an online host deal for the table and every
 * client check the result instead of having to trust it.
 */
export function createGame(
  seats: readonly KuhleKueheSeat[],
  seed: number,
): KuhleKueheGame {
  const count = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, seats.length));
  const random = createRandom(seed);
  const deck = shuffle(random, buildDeck());
  const players: Player[] = [];
  let at = 0;
  for (let seat = 0; seat < count; seat++) {
    const hand: Card[] = deck.slice(at, at + START_HAND);
    at += START_HAND;
    players.push({
      name: seats[seat]?.name ?? `Spieler ${seat + 1}`,
      isBot: seats[seat]?.isBot ?? true,
      hand,
      herd: [],
      calves: [],
      trade: null,
    });
  }
  return {
    phase: "draw",
    players,
    active: 0,
    draw: deck.slice(at),
    discard: [],
    awards: { firstCow: null, biggestHerd: null, longestCow: null },
    pending: null,
    emptiedBy: null,
    crossing: null,
    rng: random.state(),
    seed,
    log: [`Es geht los - ${count} Spieler, je ${START_HAND} Handkarten.`],
  };
}

/**
 * The seats for a game against the computer.
 *
 * @param playerName - what the human seat is called
 * @param opponents - how many computer players join
 * @returns the seats, the human first
 */
export function soloSeats(
  playerName: string,
  opponents: number,
): readonly KuhleKueheSeat[] {
  const names = ["Berta", "Elsa", "Frieda", "Hilda"];
  return [
    { name: playerName, isBot: false },
    ...Array.from({ length: opponents }, (unused, at) => ({
      name: names[at % names.length],
      isBot: true,
    })),
  ];
}
