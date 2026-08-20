/**
 * Dealing a fresh game.
 *
 * @module
 * @remarks
 * The rulebook's setup is a dance, and the order of its steps is the whole
 * point: the kittens and the spare defuses come **out** before anything is
 * dealt, so nobody can be dealt a kitten and everybody is dealt exactly one
 * defuse. Only then do the kittens go back in, one fewer than there are
 * players - which is what guarantees that all but one will explode.
 */
import { buildDeck, type Card } from "./cards";
import { createRandom, randomInt, shuffle, type Random } from "./random";
import {
  DEALT_CARDS,
  DEFUSE_KEPT,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type ExplodingKittensGame,
  type Player,
} from "./state";

/** A seat at the table, before the cards are dealt. */
export type ExplodingKittensSeat = {
  readonly name: string;
  readonly isBot: boolean;
};

/** What the host chose before dealing. */
export type ExplodingKittensOptions = {
  /**
   * The rulebook's faster game: about a third of the pile never turns up.
   *
   * @remarks
   * "Before inserting any Kittens into the deck, randomly remove about
   * one-third of the deck from the game (you will be playing with approximately
   * two-thirds of a deck, but you won't know which cards have been removed)."
   *
   * **Before inserting the kittens** - which in the rulebook's own numbering is
   * after the hands have been dealt. So it thins the draw pile, not the deck
   * the hands come out of: everybody still gets their eight cards, there are
   * just fewer left to draw. Taking it off the top instead would leave a
   * five-handed table unable to deal at all.
   */
  readonly fastGame: boolean;
};

/** The deck is thought of in thirds, and the faster game does without one. */
const DECK_PARTS = 3;

/** The share of the pile the faster game takes out - from the rulebook. */
const FAST_GAME_REMOVED = 1 / DECK_PARTS;

/**
 * Shuffles the deck and deals everybody in.
 *
 * @param seats - the players, in seating order
 * @param options - the host's choices
 * @param seed - the shuffle to use, so a game can be replayed exactly
 * @returns a game waiting for the first player to act
 */
export function createGame(
  seats: readonly ExplodingKittensSeat[],
  options: ExplodingKittensOptions,
  seed: number,
): ExplodingKittensGame {
  const count = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, seats.length));
  const random = createRandom(seed);
  const full = shuffle(random, buildDeck());

  // Step 1 and 2: the kittens and every defuse come out of the deck first.
  const kittens = full.filter((card) => card.kind === "kitten");
  const defuses = full.filter((card) => card.kind === "defuse");
  const rest = full.filter(
    (card) => card.kind !== "kitten" && card.kind !== "defuse",
  );

  // Everybody gets one defuse; two of the spares go back in, the rest are out.
  const spare = Math.max(0, defuses.length - count);
  const deck = shuffle(random, [
    ...rest,
    ...defuses.slice(count, count + Math.min(DEFUSE_KEPT, spare)),
  ]);

  const players: Player[] = [];
  let at = 0;
  for (let seat = 0; seat < count; seat++) {
    const dealt = deck.slice(at, at + DEALT_CARDS);
    at += DEALT_CARDS;
    players.push({
      name: seats[seat]?.name ?? `Spieler ${seat + 1}`,
      isBot: seats[seat]?.isBot ?? true,
      hand: [defuses[seat], ...dealt],
      peek: null,
      place: null,
    });
  }

  // The faster game happens here, between the deal and the kittens, which is
  // exactly where the rulebook puts it.
  const left = deck.slice(at);
  const pile = options.fastGame ? thinOut(random, left) : left;

  // Step 4: one kitten fewer than there are players, then shuffle again.
  const draw = shuffle(random, [...pile, ...kittens.slice(0, count - 1)]);
  const starter = randomInt(random, count);
  return {
    phase: "play",
    players,
    active: starter,
    turnsOwed: 1,
    underAttack: false,
    draw,
    discard: [],
    pending: null,
    demand: null,
    kitten: null,
    rng: random.state(),
    seed,
    log: [
      `${count} Spieler, ${count - 1} Kätzchen im Stapel.`,
      ...(options.fastGame ? ["Schnelles Spiel - ein Drittel fehlt."] : []),
      `Anwurf: ${players[starter].name}.`,
    ],
  };
}

/** Takes a third of the pile out of the game, unseen. */
function thinOut(random: Random, cards: readonly Card[]): readonly Card[] {
  const keep = cards.length - Math.round(cards.length * FAST_GAME_REMOVED);
  return shuffle(random, cards).slice(0, keep);
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
): readonly ExplodingKittensSeat[] {
  const names = ["Mieze", "Struppi", "Nala", "Findus"];
  return [
    { name: playerName, isBot: false },
    ...Array.from({ length: opponents }, (unused, at) => ({
      name: names[at % names.length],
      isBot: true,
    })),
  ];
}
