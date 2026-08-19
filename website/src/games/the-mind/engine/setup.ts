/**
 * Dealing a game of The Mind, and each new level.
 *
 * @module
 * @remarks
 * Level one is one card each, level two is two, and so on. The deck is the
 * numbers 1 to 100 and it is shuffled fresh for every level - what was played
 * last level tells you nothing about this one.
 */
import { createRandom, shuffle, type Random } from "./random";
import {
  HIGHEST_CARD,
  MIN_PLAYERS,
  START_SHURIKENS,
  levelsFor,
  type MindGame,
} from "./state";

/** A seat to deal in. */
export type MindSeat = {
  readonly name: string;
  /** True if the computer plays this seat. */
  readonly isBot: boolean;
};

/**
 * Deals a fresh game at level one.
 *
 * @param seats - the players (two to four)
 * @param seed - the seed every level's shuffle runs from
 * @returns the game, waiting for somebody to dare play a card
 * @remarks
 * Lives are the number of players, which is the one number in this game that
 * scales with the table: more hands means more ways to get it wrong.
 */
export function createGame(seats: readonly MindSeat[], seed: number): MindGame {
  const random = createRandom(seed);
  const count = Math.max(MIN_PLAYERS, seats.length);
  const hands = deal(random, seats.length, 1);
  return {
    phase: "playing",
    players: seats.map((seat, index) => ({
      name: seat.name,
      isBot: seat.isBot,
      hand: hands[index],
      wantsShuriken: false,
    })),
    level: 1,
    levels: levelsFor(count),
    lives: count,
    shurikens: START_SHURIKENS,
    pile: [],
    lost: [],
    lastMistake: null,
    lastReward: null,
    won: false,
    seed,
    rng: random.state(),
    log: ["Level 1 - eine Karte für jeden."],
  };
}

/**
 * Deals the next level.
 *
 * @param game - the game with the last level finished
 * @returns the game one level further on
 */
export function dealLevel(game: MindGame): MindGame {
  const random = createRandom(game.rng);
  const level = game.level + 1;
  const hands = deal(random, game.players.length, level);
  return {
    ...game,
    phase: "playing",
    level,
    players: game.players.map((player, index) => ({
      ...player,
      hand: hands[index],
      wantsShuriken: false,
    })),
    pile: [],
    lost: [],
    lastMistake: null,
    lastReward: null,
    rng: random.state(),
    log: [...game.log, `Level ${level} - ${level} Karten für jeden.`],
  };
}

/** Shuffles the deck and gives everybody their cards, lowest first. */
function deal(
  random: Random,
  seats: number,
  level: number,
): readonly (readonly number[])[] {
  const deck = shuffle(
    random,
    Array.from({ length: HIGHEST_CARD }, (unused, index) => index + 1),
  );
  const hands: number[][] = [];
  for (let seat = 0; seat < seats; seat++) {
    hands.push(
      deck.slice(seat * level, (seat + 1) * level).sort((a, b) => a - b),
    );
  }
  return hands;
}
