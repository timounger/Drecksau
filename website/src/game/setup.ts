/**
 * Builds a fresh game: deals pigs and hand cards and shuffles the deck.
 *
 * @module
 */
import { createDeck, type Card } from "./cards";
import type { Difficulty } from "./difficulty";
import { createRandom, nextRandom, shuffle } from "./random";
import { HAND_SIZE, type GameState, type Pig, type Player } from "./state";

/** Description of one seat at the table. */
export type PlayerSetup = {
  readonly name: string;
  readonly isHuman: boolean;
};

/** How a new game is put together. */
export type GameOptions = {
  /** Seed of the shuffle; the same seed replays the same game. */
  readonly seed: number;
  /** True to play with the Sauschön expansion. */
  readonly withExpansion: boolean;
  /** True to add the "Drecksau total" defence cards. */
  readonly withDefense?: boolean;
  /** Index of the player who moves first; defaults to 0 (the human). */
  readonly firstPlayerIndex?: number;
};

/** Offset so the first-player draw does not share the deck's random numbers. */
const FIRST_PLAYER_SEED_OFFSET = 4241;

/**
 * Decides who begins a game, based on the difficulty.
 *
 * @param playerCount - number of players at the table
 * @param difficulty - the chosen level
 * @param seed - the game's seed
 * @returns the index of the first player, 0 being the human
 * @remarks
 * On "leicht" the human always starts - that free tempo is part of what makes
 * it easy. On the harder levels a seeded draw decides, so the same seed always
 * picks the same starter.
 */
export function pickFirstPlayer(
  playerCount: number,
  difficulty: Difficulty,
  seed: number,
): number {
  if (difficulty === "leicht") {
    return 0;
  }
  const { value } = nextRandom(createRandom(seed + FIRST_PLAYER_SEED_OFFSET));
  return Math.floor(value * playerCount);
}

/** Smallest supported table size. */
export const MIN_PLAYERS = 2;

/** Largest supported table size. */
export const MAX_PLAYERS = 4;

/**
 * Pigs each player receives in the base game, by number of players.
 *
 * @remarks
 * Straight from the rulebook: the leftover pig cards are not used.
 */
const BASE_PIGS_PER_PLAYER: Readonly<Record<number, number>> = {
  2: 5,
  3: 4,
  4: 3,
};

/**
 * Pigs each player receives with the expansion.
 *
 * @remarks
 * Sauschön replaces the table above with a flat number - "Jeder Spieler erhält
 * 3 doppelseitige Schweinekarten", regardless of how many are playing. Easy to
 * miss, so it lives in its own constant.
 */
const EXPANSION_PIGS_PER_PLAYER = 3;

/**
 * Creates a ready to play game state.
 *
 * @param setups - the players, in turn order
 * @param options - shuffle seed and whether the expansion is in
 * @returns the initial state, with the first player to move
 * @throws if the number of players is not supported
 */
export function createGame(
  setups: readonly PlayerSetup[],
  options: GameOptions,
): GameState {
  if (setups.length < MIN_PLAYERS || setups.length > MAX_PLAYERS) {
    throw new Error(
      `Drecksau supports ${MIN_PLAYERS} to ${MAX_PLAYERS} players, got ${setups.length}`,
    );
  }

  const shuffled = shuffle(
    createDeck(options.withExpansion, options.withDefense ?? false),
    createRandom(options.seed),
  );
  const dealt = dealPlayers(setups, shuffled.items, options.withExpansion);

  return {
    players: dealt.players,
    currentPlayerIndex: options.firstPlayerIndex ?? 0,
    drawPile: dealt.drawPile,
    discardPile: [],
    random: shuffled.state,
    winnerId: null,
    log: [],
    nextLogId: 0,
    pendingCardIds: [],
    hasExpansion: options.withExpansion,
  };
}

/**
 * Returns how many pigs each player gets.
 *
 * @param playerCount - number of players
 * @param withExpansion - true when playing with Sauschön
 * @returns the pig count per player
 * @throws if the table size is not supported
 */
export function pigsPerPlayer(
  playerCount: number,
  withExpansion: boolean,
): number {
  let count: number | undefined = EXPANSION_PIGS_PER_PLAYER;

  if (!withExpansion) {
    count = BASE_PIGS_PER_PLAYER[playerCount];
    if (count === undefined) {
      throw new Error(`no pig count defined for ${playerCount} players`);
    }
  }

  return count;
}

/** Deals pigs and hands, and returns the remaining draw pile. */
function dealPlayers(
  setups: readonly PlayerSetup[],
  deck: readonly Card[],
  withExpansion: boolean,
): { players: Player[]; drawPile: Card[] } {
  const pigCount = pigsPerPlayer(setups.length, withExpansion);
  const remaining = [...deck];

  const players = setups.map((setup, playerIndex) => ({
    id: `p${playerIndex}`,
    name: setup.name,
    isHuman: setup.isHuman,
    pigs: createPigs(playerIndex, pigCount),
    hand: remaining.splice(0, HAND_SIZE),
  }));

  return { players, drawPile: remaining };
}

/** Creates the clean pigs of one player. */
function createPigs(playerIndex: number, pigCount: number): Pig[] {
  const pigs: Pig[] = [];
  for (let pigIndex = 0; pigIndex < pigCount; pigIndex++) {
    pigs.push({
      id: `p${playerIndex}-pig${pigIndex}`,
      isDirty: false,
      barn: null,
      lightningRod: null,
      barnDoor: null,
      beauty: null,
    });
  }
  return pigs;
}
