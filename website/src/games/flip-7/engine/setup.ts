/**
 * Dealing a fresh game.
 *
 * @module
 * @remarks
 * There is nothing to lay out: the deck is shuffled, somebody is chosen to
 * deal, and the first round opens. The opening card going round to each player
 * is not done here - it can be interrupted by an action card, so it belongs to
 * the referee, which is where {@link start} takes it.
 */
import { buildDeck } from "./cards";
import { openRound, start } from "./moves";
import { createRandom, randomInt, shuffle } from "./random";
import { MAX_PLAYERS, MIN_PLAYERS, type Flip7Game, type Player } from "./state";

/** A seat at the table, before anything is dealt. */
export type Flip7Seat = {
  readonly name: string;
  readonly isBot: boolean;
};

/**
 * Shuffles the deck and opens the first round.
 *
 * @param seats - the players, in seating order
 * @param seed - the shuffle to use, so a game can be replayed exactly
 * @returns a game with the opening card already on its way round
 */
export function createGame(
  seats: readonly Flip7Seat[],
  seed: number,
): Flip7Game {
  const count = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, seats.length));
  const random = createRandom(seed);
  const deck = shuffle(random, buildDeck());
  const players: Player[] = Array.from({ length: count }, (unused, seat) => ({
    name: seats[seat]?.name ?? `Spieler ${seat + 1}`,
    isBot: seats[seat]?.isBot ?? true,
    numbers: [],
    modifiers: [],
    second: null,
    standing: "in" as const,
    score: 0,
    roundScore: 0,
  }));
  // "Choose a player to be the Dealer" - nobody at a screen can choose, so it
  // is drawn. openRound moves it on one seat, so the draw is offset by one.
  const first = randomInt(random, count);
  const base: Flip7Game = {
    stage: "roundEnd",
    players,
    active: first,
    dealer: (first - 1 + count) % count,
    dealt: 0,
    deck,
    discard: [],
    pending: null,
    forced: null,
    flipped: null,
    round: 0,
    rng: random.state(),
    seed,
    log: [],
  };
  return start(openRound(base));
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
): readonly Flip7Seat[] {
  const names = ["Aria", "Bruno", "Cleo", "Dexter", "Elif", "Fips", "Greta"];
  return [
    { name: playerName, isBot: false },
    ...Array.from({ length: opponents }, (unused, at) => ({
      name: names[at % names.length],
      isBot: true,
    })),
  ];
}
