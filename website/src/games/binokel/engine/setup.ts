/**
 * Dealing a fresh Binokel round.
 *
 * @module
 * @remarks
 * Three players, each against the others. Hand and Dabb sizes depend on whether
 * the deck has Sevens (15 + 3 with, 12 + 4 without). The same seed deals the
 * same round.
 */
import { createDeck, type Card } from "./cards";
import { createRandom, shuffle } from "./random";
import type { BinokelPlayer, GameState } from "./state";

/** Description of one seat at the table. */
export type PlayerSetup = {
  readonly name: string;
  readonly isHuman: boolean;
};

/** How a new game is put together. */
export type GameOptions = {
  /** Seed of the shuffle; the same seed replays the same deal. */
  readonly seed: number;
  /** True for the 48-card deck (with Sevens), false for 40 cards. */
  readonly withSevens: boolean;
  /** Points that end the match. */
  readonly targetScore: number;
  /** Who deals; bidding starts to their right. Defaults to 0. */
  readonly dealerIndex?: number;
};

/** Only three players are supported for now. */
export const PLAYER_COUNT = 3;

/** Hand size per player, by deck. */
const HAND_SIZE = { withSevens: 15, withoutSevens: 12 } as const;

/** Dabb (widow) size, by deck. */
const DABB_SIZE = { withSevens: 3, withoutSevens: 4 } as const;

/**
 * Creates a ready-to-bid round.
 *
 * @param setups - the three players, in seating order
 * @param options - deck, seed and target score
 * @returns the initial state, in the bidding phase
 * @throws if the number of players is not exactly three
 */
export function createGame(
  setups: readonly PlayerSetup[],
  options: GameOptions,
): GameState {
  if (setups.length !== PLAYER_COUNT) {
    throw new Error(`Binokel needs exactly ${PLAYER_COUNT} players for now`);
  }

  const handSize = options.withSevens
    ? HAND_SIZE.withSevens
    : HAND_SIZE.withoutSevens;
  const dabbSize = options.withSevens
    ? DABB_SIZE.withSevens
    : DABB_SIZE.withoutSevens;

  const shuffled = shuffle(
    createDeck(options.withSevens),
    createRandom(options.seed),
  );
  const cards = [...shuffled.items];

  const players: BinokelPlayer[] = setups.map((setup, index) => ({
    id: `p${index}`,
    name: setup.name,
    isHuman: setup.isHuman,
    hand: cards.splice(0, handSize),
    won: [],
    meldPoints: 0,
    hasTrick: false,
    score: 0,
    bid: null,
    bidding: true,
  }));

  const dabb: Card[] = cards.splice(0, dabbSize);
  const dealerIndex = options.dealerIndex ?? 0;
  const forehand = (dealerIndex + 1) % PLAYER_COUNT;

  return {
    players,
    withSevens: options.withSevens,
    targetScore: options.targetScore,
    dealerIndex,
    phase: "bidding",
    dabb,
    takenDabb: [],
    currentPlayerIndex: forehand,
    highestBid: 0,
    declarerIndex: null,
    trump: null,
    currentTrick: [],
    leaderIndex: forehand,
    random: shuffled.state,
    log: [],
    nextLogId: 0,
    matchWinnerId: null,
  };
}
