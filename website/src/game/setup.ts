/**
 * Builds a fresh game: deals pigs and hand cards and shuffles the deck.
 *
 * @module
 */
import { createDeck, type Card } from "./cards";
import { createRandom, shuffle } from "./random";
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
};

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
    currentPlayerIndex: 0,
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
