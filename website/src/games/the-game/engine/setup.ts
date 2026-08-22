/**
 * Dealing a fresh game.
 *
 * @module
 * @remarks
 * Almost nothing to do: four row cards down, 98 numbers shuffled, everybody
 * dealt a hand. The one thing worth noticing is the last line - a fresh deal
 * goes through the referee's {@link settle} like any other position. Nothing
 * says an opening hand cannot already be stuck, and finding that out on the
 * first click rather than never is the difference between a rule and a wish.
 */
import { buildDeck, freshPiles } from "./cards";
import { settle } from "./moves";
import { createRandom, shuffle } from "./random";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  handSizeFor,
  perTurnFor,
  type TheGame,
  type TheGamePlayer,
  type Variant,
} from "./state";

/** A seat at the table, before anything is dealt. */
export type TheGameSeat = {
  readonly name: string;
  readonly isBot: boolean;
};

/** What the seat you play yourself is called when it has no other name. */
export const SELF_NAME = "Du";

/**
 * Shuffles and deals a game.
 *
 * @param seats - the players, in turn order
 * @param variant - how hard the table wants it
 * @param seed - the shuffle to use, so a game can be replayed exactly
 * @returns a game waiting on the first player
 */
export function createGame(
  seats: readonly TheGameSeat[],
  variant: Variant,
  seed: number,
): TheGame {
  const count = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, seats.length));
  const random = createRandom(seed);
  const deck = shuffle(random, buildDeck());
  const handSize = handSizeFor(count, variant);
  const players: TheGamePlayer[] = Array.from(
    { length: count },
    (unused, seat) => ({
      name: seats[seat]?.name ?? `Spieler ${seat + 1}`,
      isBot: seats[seat]?.isBot ?? true,
      hand: deck
        .slice(seat * handSize, (seat + 1) * handSize)
        .sort((left, right) => left - right),
    }),
  );
  return settle({
    phase: "playing",
    players,
    active: 0,
    piles: freshPiles(),
    draw: deck.slice(count * handSize),
    placed: 0,
    handSize,
    minPerTurn: perTurnFor(variant),
    hints: {},
    rng: random.state(),
    seed,
    log: ["Vier Reihen liegen. 98 Karten wollen darauf."],
  });
}

/**
 * The seats for a game against the computer.
 *
 * @param playerName - what the human seat is called
 * @param partners - how many computer players join
 * @returns the seats, the human first
 * @remarks
 * Partners, not opponents. Nobody at this table is playing against anybody, and
 * the box even has a solo variant - so zero partners is a real setting here
 * rather than a degenerate one.
 */
export function soloSeats(
  playerName: string,
  partners: number,
): readonly TheGameSeat[] {
  const names = ["Aria", "Bruno", "Cleo", "Dexter"];
  return [
    { name: playerName, isBot: false },
    ...Array.from({ length: partners }, (unused, at) => ({
      name: names[at % names.length],
      isBot: true,
    })),
  ];
}
