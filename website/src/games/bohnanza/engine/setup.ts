/**
 * Dealing a fresh game.
 *
 * @module
 * @remarks
 * Almost nothing to lay out: shuffle, five cards each, and the rest is the draw
 * pile. The one thing worth saying about it is that the five are dealt **in
 * order and stay in it** - the hand is the game's whole tension, and it starts
 * being a fixed sequence the moment the cards are handed out.
 *
 * How many fields each player gets is not a setting: three at a three-handed
 * table, two above that, because that is which side of the board the rulebook
 * tells you to lay down.
 */
import { buildDeck } from "./beans";
import { start } from "./moves";
import { createRandom, randomInt, shuffle } from "./random";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  START_HAND,
  fieldsFor,
  type BohnanzaGame,
  type Player,
} from "./state";

/** A seat at the table, before anything is dealt. */
export type BohnanzaSeat = {
  readonly name: string;
  readonly isBot: boolean;
};

/**
 * Shuffles the deck and deals the first hands.
 *
 * @param seats - the players, in seating order
 * @param seed - the shuffle to use, so a game can be replayed exactly
 * @returns a game waiting for the first player to plant
 */
export function createGame(
  seats: readonly BohnanzaSeat[],
  seed: number,
): BohnanzaGame {
  const count = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, seats.length));
  const random = createRandom(seed);
  const deck = shuffle(random, buildDeck());
  const fields = fieldsFor(count);
  const players: Player[] = Array.from({ length: count }, (unused, seat) => ({
    name: seats[seat]?.name ?? `Spieler ${seat + 1}`,
    isBot: seats[seat]?.isBot ?? true,
    // Dealt round the table one at a time, exactly as at a real table - the
    // order inside a hand is the game, so it must not come from a slice.
    hand: Array.from(
      { length: START_HAND },
      (nothing, round) => deck[round * count + seat],
    ),
    fields: Array.from({ length: fields }, () => []),
    pending: [],
    coins: 0,
  }));
  // "Bestimmt, wer beginnt. Diese Person erhält eine der beiden Start-Karten."
  // Nobody at a screen can be asked, so it is drawn - and the card itself never
  // moves again, which is why the seat is all that has to be remembered.
  const starter = randomInt(random, count);
  const base: BohnanzaGame = {
    players,
    deck: deck.slice(START_HAND * count),
    discard: [],
    spent: [],
    revealed: [],
    active: starter,
    phase: "plant",
    planted: 0,
    offer: null,
    offers: 0,
    starter,
    emptied: 0,
    ending: false,
    turn: 1,
    rng: random.state(),
    seed,
    log: [`Start-Karte und erster Zug: ${players[starter].name}.`],
  };
  return start(base);
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
): readonly BohnanzaSeat[] {
  const names = ["Nina", "Timon", "Keno", "Eiko"];
  return [
    { name: playerName, isBot: false },
    ...Array.from({ length: opponents }, (unused, at) => ({
      name: names[at % names.length],
      isBot: true,
    })),
  ];
}
