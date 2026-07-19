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
  /** Whether a Dabb (widow) is played. Defaults to true. */
  readonly withDabb?: boolean;
  /** Whether two teams play (only for four or six players). Defaults to false. */
  readonly teams?: boolean;
  /** Points that end the match. */
  readonly targetScore: number;
  /** Who deals; bidding starts to their right. Defaults to 0. */
  readonly dealerIndex?: number;
};

/** Fewest players Binokel supports. */
export const MIN_PLAYERS = 3;

/** Most players Binokel supports. */
export const MAX_PLAYERS = 6;

/** Player counts that split into two even teams (cross partnership): 4 and 6. */
export const TEAM_PLAYER_COUNTS: readonly number[] = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, offset) => MIN_PLAYERS + offset,
).filter((count) => count % 2 === 0);

/** Cards in each deck. */
const DECK_SIZE = { withSevens: 48, withoutSevens: 40 } as const;

/** Hand and Dabb sizes so that players * hand + dabb fills the deck exactly. */
const DEALS: Readonly<
  Record<
    number,
    {
      readonly withSevens: { readonly hand: number; readonly dabb: number };
      readonly withoutSevens: { readonly hand: number; readonly dabb: number };
    }
  >
> = {
  3: {
    withSevens: { hand: 15, dabb: 3 },
    withoutSevens: { hand: 12, dabb: 4 },
  },
  4: { withSevens: { hand: 11, dabb: 4 }, withoutSevens: { hand: 9, dabb: 4 } },
  5: { withSevens: { hand: 9, dabb: 3 }, withoutSevens: { hand: 7, dabb: 5 } },
  6: { withSevens: { hand: 7, dabb: 6 }, withoutSevens: { hand: 6, dabb: 4 } },
};

/**
 * Hand and Dabb sizes for a given table.
 *
 * @param playerCount - how many players sit at the table (3 to 6)
 * @param withSevens - whether the 48-card deck is in play
 * @param withDabb - whether a Dabb is played
 * @returns the cards each player is dealt and the size of the Dabb
 * @remarks
 * Without a Dabb the cards are dealt out evenly; any remainder that will not
 * divide still forms a small Dabb, so the deal always uses the whole deck.
 */
export function dealSizes(
  playerCount: number,
  withSevens: boolean,
  withDabb: boolean,
): { handSize: number; dabbSize: number } {
  const total = withSevens ? DECK_SIZE.withSevens : DECK_SIZE.withoutSevens;
  if (!withDabb) {
    const handSize = Math.floor(total / playerCount);
    return { handSize, dabbSize: total - handSize * playerCount };
  }
  const deal = DEALS[playerCount] ?? DEALS[MIN_PLAYERS];
  const sizes = withSevens ? deal.withSevens : deal.withoutSevens;
  return { handSize: sizes.hand, dabbSize: sizes.dabb };
}

/**
 * Creates a ready-to-bid round.
 *
 * @param setups - the players (3 to 6), in seating order
 * @param options - deck, seed and target score
 * @returns the initial state, in the bidding phase
 * @throws if the number of players is not between three and six
 */
export function createGame(
  setups: readonly PlayerSetup[],
  options: GameOptions,
): GameState {
  if (setups.length < MIN_PLAYERS || setups.length > MAX_PLAYERS) {
    throw new Error(`Binokel needs ${MIN_PLAYERS} to ${MAX_PLAYERS} players`);
  }

  const withDabb = options.withDabb ?? true;
  const teams =
    (options.teams ?? false) && TEAM_PLAYER_COUNTS.includes(setups.length);
  const { handSize, dabbSize } = dealSizes(
    setups.length,
    options.withSevens,
    withDabb,
  );

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
  const forehand = (dealerIndex + 1) % setups.length;

  return {
    players,
    withSevens: options.withSevens,
    withDabb,
    teams,
    targetScore: options.targetScore,
    dealerIndex,
    phase: "bidding",
    dabb,
    takenDabb: [],
    currentPlayerIndex: forehand,
    highestBid: 0,
    declarerIndex: null,
    trump: null,
    gameType: null,
    conceded: false,
    currentTrick: [],
    leaderIndex: forehand,
    random: shuffled.state,
    log: [],
    nextLogId: 0,
    matchWinnerId: null,
  };
}
