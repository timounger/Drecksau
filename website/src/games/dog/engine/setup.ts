/**
 * Setting a game of Dog up, and dealing every round of it.
 *
 * @module
 * @remarks
 * The deal is part of the game rather than something the table does off to one
 * side: the pack, what is left of it and the generator's cursor all live in the
 * state, so a saved game carries on with the very cards it would have had.
 *
 * Two things happen at the top of every round, and in this order: the cards are
 * dealt, and then each player pushes one of them face down across - to the
 * partner at a table of four or six, and to the left-hand neighbour where
 * everybody plays alone. The push is the only help the rules allow - no
 * talking, ever - which is why it has a phase of its own rather than being
 * folded into the deal.
 */
import { DEFAULT_SEATS, freshPieces, nextSeat } from "./board";
import { freshPack, type Card } from "./cards";
import { createRandom, type Random } from "./random";
import { DEAL_SIZES, LOG_LINES, type DogGame, type DogPlayer } from "./state";

/** One seat, as the screen or a room sets it up. */
export type DogSeat = {
  readonly name: string;
  readonly isBot: boolean;
};

/** What the computer players are called. */
const BOT_NAMES: readonly string[] = ["Bea", "Cem", "Dana", "Eva", "Finn"];

/**
 * The seats of a game against the computer.
 *
 * @param human - what the player is called
 * @param seats - how many sit at the table
 * @returns the human and as many bots as the table needs, clockwise
 */
export function soloSeats(human: string, seats: number): readonly DogSeat[] {
  return [
    { name: human, isBot: false },
    ...Array.from({ length: Math.max(0, seats - 1) }, (unused, at) => ({
      name: BOT_NAMES[at % BOT_NAMES.length] ?? "?",
      isBot: true,
    })),
  ];
}

/**
 * A fresh game, dealt and waiting for the cards to be pushed across.
 *
 * @param seats - the players, clockwise
 * @param seed - what the pack is shuffled with
 * @returns the game at the top of its first round
 */
export function createGame(seats: readonly DogSeat[], seed: number): DogGame {
  const count = seats.length === 0 ? DEFAULT_SEATS : seats.length;
  const players: readonly DogPlayer[] = Array.from(
    { length: count },
    (unused, at) => ({
      name: seats[at]?.name ?? BOT_NAMES[at % BOT_NAMES.length] ?? "?",
      isBot: seats[at]?.isBot ?? true,
      hand: [],
    }),
  );
  const shuffled = shuffle(freshPack(), createRandom(seed));
  const empty: DogGame = {
    phase: "passing",
    seats: count,
    players,
    pieces: freshPieces(count),
    deck: shuffled.cards,
    pile: [],
    // The last seat deals the first round, so that seat nought begins it.
    turn: 0,
    dealer: count - 1,
    handSize: DEAL_SIZES[0] ?? 0,
    round: 1,
    given: Array.from({ length: count }, () => null),
    out: Array.from({ length: count }, () => false),
    redrew: false,
    rng: shuffled.rng,
    log: ["Los geht es. Jeder schiebt eine Karte zu."],
    winners: [],
  };
  return deal(empty, DEAL_SIZES[0] ?? 0);
}

/**
 * The next round: a new dealer, a shorter hand, and cards on the table again.
 *
 * @param game - the game with an empty round behind it
 * @returns the game at the top of the next round
 * @remarks
 * The pieces stay exactly where they are. A round of Dog is a hand of cards,
 * not a fresh board - which is why a round that goes badly is only ever a
 * setback and never a reset.
 */
export function nextRound(game: DogGame): DogGame {
  const round = game.round + 1;
  const size = DEAL_SIZES[(round - 1) % DEAL_SIZES.length] ?? 0;
  const dealer = nextSeat(game.dealer, game.seats);
  return deal(
    {
      ...game,
      phase: "passing",
      round,
      dealer,
      handSize: size,
      turn: nextSeat(dealer, game.seats),
      given: Array.from({ length: game.seats }, () => null),
      out: Array.from({ length: game.seats }, () => false),
      redrew: false,
      log: note(game.log, `Runde ${String(round)}: ${String(size)} Karten.`),
    },
    size,
  );
}

/**
 * Deals a round.
 *
 * @param game - the game to deal into
 * @param size - how many cards each player gets
 * @returns the game with a hand for every seat
 * @remarks
 * When the pack runs short the pile is shuffled back into it, which is what the
 * rules say to do and what keeps a long game from running out of cards.
 */
function deal(game: DogGame, size: number): DogGame {
  let deck = game.deck;
  let pile = game.pile;
  let rng = game.rng;
  const hands: Card[][] = Array.from({ length: game.seats }, () => []);
  for (let round = 0; round < size; round += 1) {
    for (let seat = 0; seat < game.seats; seat += 1) {
      if (deck.length === 0) {
        const again = shuffle(pile, createRandom(rng));
        deck = again.cards;
        pile = [];
        rng = again.rng;
      }
      const card = deck[0];
      if (card !== undefined) {
        hands[seat]?.push(card);
        deck = deck.slice(1);
      }
    }
  }
  return {
    ...game,
    deck,
    pile,
    rng,
    players: game.players.map((player, seat) => ({
      ...player,
      hand: hands[seat] ?? [],
    })),
  };
}

/**
 * One card off the top of the pack, shuffling the pile back in if need be.
 *
 * @param game - the game as it stands
 * @returns the card and the game it came out of, or null when there is none
 * @remarks
 * Only the variant for two, three and five players draws during a round: a
 * player who cannot move swaps a dead card for a new one rather than sitting
 * the round out.
 */
export function drawOne(
  game: DogGame,
): { readonly card: Card; readonly game: DogGame } | null {
  let deck = game.deck;
  let pile = game.pile;
  let rng = game.rng;
  if (deck.length === 0) {
    const again = shuffle(pile, createRandom(rng));
    deck = again.cards;
    pile = [];
    rng = again.rng;
  }
  const card = deck[0];
  return card === undefined
    ? null
    : { card, game: { ...game, deck: deck.slice(1), pile, rng } };
}

/**
 * Shuffles a pile of cards.
 *
 * @param cards - the cards to shuffle
 * @param random - the generator, whose cursor travels with the game
 * @returns the shuffled cards and where the generator got to
 */
function shuffle(
  cards: readonly Card[],
  random: Random,
): { readonly cards: readonly Card[]; readonly rng: number } {
  const out = [...cards];
  for (let at = out.length - 1; at > 0; at -= 1) {
    const other = Math.floor(random.next() * (at + 1));
    const here = out[at];
    const there = out[other];
    if (here !== undefined && there !== undefined) {
      out[at] = there;
      out[other] = here;
    }
  }
  return { cards: out, rng: random.state() };
}

/**
 * Adds a line to the log, keeping the last few.
 *
 * @param log - the log as it stands
 * @param line - what happened
 * @returns the log with the line on the end
 */
export function note(log: readonly string[], line: string): readonly string[] {
  return [...log, line].slice(-LOG_LINES);
}
