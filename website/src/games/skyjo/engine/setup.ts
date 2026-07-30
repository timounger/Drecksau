/**
 * Dealing a Skyjo game and its rounds.
 *
 * @module
 * @remarks
 * Every round is dealt from a freshly shuffled full deck - Skyjo does not carry
 * a pile over. Only the running totals survive a round.
 */
import { GRID_SIZE, fullDeck, shuffle } from "./cards";
import { createRandom } from "./random";
import type { Player, SkyjoGame, Slot } from "./state";

/** A seat to deal in. */
export type SkyjoSeat = {
  readonly name: string;
  /** True if the computer plays this seat. */
  readonly isBot: boolean;
};

/** The 32-bit golden-ratio odd constant, for spreading a round into a seed. */
const GOLDEN_ODD_32 = 0x9e3779b1;

/**
 * Deals a fresh game.
 *
 * @param seats - the players, in turn order (at least two)
 * @param seed - the base seed every round's shuffle is derived from
 * @returns a game waiting for everyone's opening flips
 */
export function createGame(
  seats: readonly SkyjoSeat[],
  seed: number,
): SkyjoGame {
  const round = 1;
  const deal = dealRound(seats.length, roundSeed(seed, round));
  return {
    phase: "flip",
    players: seats.map((seat, index) => ({
      name: seat.name,
      grid: deal.grids[index],
      total: 0,
      roundScore: 0,
      isBot: seat.isBot,
    })),
    turn: 0,
    round,
    deck: deal.deck,
    discard: deal.discard,
    drawn: null,
    endedBy: null,
    seed,
    log: [],
  };
}

/**
 * Deals the next round of a running game.
 *
 * @param game - the finished round
 * @returns the game with fresh layouts, keeping every total
 * @remarks
 * The player who ended the last round opens the next one, as the rules say.
 */
export function dealNextRound(game: SkyjoGame): SkyjoGame {
  const round = game.round + 1;
  const deal = dealRound(game.players.length, roundSeed(game.seed, round));
  return {
    ...game,
    phase: "flip",
    players: game.players.map((player, index) => ({
      ...player,
      grid: deal.grids[index],
      roundScore: 0,
    })),
    turn: game.endedBy ?? 0,
    round,
    deck: deal.deck,
    discard: deal.discard,
    drawn: null,
    endedBy: null,
  };
}

/** Mixes the base seed with a round number into a fresh 32-bit seed. */
function roundSeed(seed: number, round: number): number {
  return (seed ^ Math.imul(round, GOLDEN_ODD_32)) >>> 0;
}

/** Shuffles a deck and deals every player their twelve face-down cards. */
function dealRound(
  playerCount: number,
  seed: number,
): {
  readonly grids: readonly (readonly Slot[])[];
  readonly deck: readonly number[];
  readonly discard: readonly number[];
} {
  const cards = shuffle(createRandom(seed), fullDeck());
  const grids: Slot[][] = [];
  let at = 0;
  for (let player = 0; player < playerCount; player++) {
    const grid: Slot[] = [];
    for (let slot = 0; slot < GRID_SIZE; slot++) {
      grid.push({ state: "down", value: cards[at] });
      at += 1;
    }
    grids.push(grid);
  }
  // The next card starts the discard pile face up; the rest is the draw pile.
  const discard = [cards[at]];
  return { grids, deck: cards.slice(at + 1), discard };
}

/** Builds the seats for a game against the computer. */
export function soloSeats(
  playerName: string,
  opponents: number,
): readonly SkyjoSeat[] {
  const seats: SkyjoSeat[] = [{ name: playerName, isBot: false }];
  for (let i = 0; i < opponents; i++) {
    seats.push({ name: BOT_NAMES[i % BOT_NAMES.length], isBot: true });
  }
  return seats;
}

/** The computer players' names, in the order they join. */
const BOT_NAMES: readonly string[] = [
  "Bea",
  "Cem",
  "Dana",
  "Emil",
  "Fina",
  "Gero",
  "Hilda",
];

/** A player as they start a round, for tests and the setup. */
export type { Player };
