/**
 * Builds a fresh game: deals pigs and hand cards and shuffles the deck.
 *
 * @module
 */
import { createDeck, type Card } from "./cards";
import { createRandom, shuffle, type RandomState } from "./random";
import { HAND_SIZE, type GameState, type Pig, type Player } from "./state";

/** Description of one seat at the table. */
export type PlayerSetup = {
  readonly name: string;
  readonly isHuman: boolean;
};

/** Smallest supported table size. */
export const MIN_PLAYERS = 2;

/** Largest supported table size. */
export const MAX_PLAYERS = 4;

/**
 * Pigs each player receives, by number of players.
 *
 * @remarks
 * Straight from the rulebook: the leftover pig cards are not used.
 */
const PIGS_PER_PLAYER: Readonly<Record<number, number>> = {
  2: 5,
  3: 4,
  4: 3,
};

/**
 * Creates a ready to play game state.
 *
 * @param setups - the players, in turn order
 * @param seed - seed of the shuffle; the same seed replays the same game
 * @returns the initial state, with the first player to move
 * @throws if the number of players is not supported
 */
export function createGame(
  setups: readonly PlayerSetup[],
  seed: number,
): GameState {
  if (setups.length < MIN_PLAYERS || setups.length > MAX_PLAYERS) {
    throw new Error(
      `Drecksau supports ${MIN_PLAYERS} to ${MAX_PLAYERS} players, got ${setups.length}`,
    );
  }

  const shuffled = shuffle(createDeck(), createRandom(seed));
  const dealt = dealPlayers(setups, shuffled.items, shuffled.state);

  return {
    players: dealt.players,
    currentPlayerIndex: 0,
    drawPile: dealt.drawPile,
    discardPile: [],
    random: dealt.random,
    winnerId: null,
    log: [],
    nextLogId: 0,
  };
}

/**
 * Returns how many pigs each player gets at this table size.
 *
 * @param playerCount - number of players
 * @returns the pig count per player
 * @throws if the table size is not supported
 */
export function pigsPerPlayer(playerCount: number): number {
  const count = PIGS_PER_PLAYER[playerCount];
  if (count === undefined) {
    throw new Error(`no pig count defined for ${playerCount} players`);
  }
  return count;
}

/** Deals pigs and hands, and returns the remaining draw pile. */
function dealPlayers(
  setups: readonly PlayerSetup[],
  deck: readonly Card[],
  random: RandomState,
): { players: Player[]; drawPile: Card[]; random: RandomState } {
  const pigCount = pigsPerPlayer(setups.length);
  const remaining = [...deck];

  const players = setups.map((setup, playerIndex) => ({
    id: `p${playerIndex}`,
    name: setup.name,
    isHuman: setup.isHuman,
    pigs: createPigs(playerIndex, pigCount),
    hand: remaining.splice(0, HAND_SIZE),
  }));

  return { players, drawPile: remaining, random };
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
    });
  }
  return pigs;
}
