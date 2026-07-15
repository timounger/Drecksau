/**
 * Builders for hand crafted game states in tests.
 *
 * @module
 */
import { createDeck, type ActionCardType, type Card } from "./cards";
import { createRandom } from "./random";
import type { GameState, Pig, Player } from "./state";

/** Shorthand description of a pig in a test scenario. */
export type PigSpec = {
  readonly isDirty?: boolean;
  readonly hasBarn?: boolean;
  readonly hasLightningRod?: boolean;
  readonly hasBarnDoor?: boolean;
};

/** Shorthand description of a player in a test scenario. */
export type PlayerSpec = {
  readonly name?: string;
  readonly isHuman?: boolean;
  readonly pigs: readonly PigSpec[];
  readonly hand: readonly ActionCardType[];
};

/** Counter that keeps generated card ids unique within a test state. */
let cardCounter = 0;

/**
 * Builds a card of a given type with a unique id.
 *
 * @param type - the card type
 * @returns a fresh card instance
 */
export function makeCard(type: ActionCardType): Card {
  cardCounter++;
  return { id: `${type}-test-${cardCounter}`, type };
}

/**
 * Builds a game state directly from a scenario description.
 *
 * @param specs - the players, in turn order
 * @param options - draw pile and active player overrides
 * @returns a state ready to feed into the engine
 */
export function makeState(
  specs: readonly PlayerSpec[],
  options: {
    readonly drawPile?: readonly ActionCardType[];
    readonly discardPile?: readonly ActionCardType[];
    readonly currentPlayerIndex?: number;
  } = {},
): GameState {
  const players = specs.map((spec, playerIndex) =>
    makePlayer(spec, playerIndex),
  );

  return {
    players,
    currentPlayerIndex: options.currentPlayerIndex ?? 0,
    drawPile: (options.drawPile ?? []).map(makeCard),
    discardPile: (options.discardPile ?? []).map(makeCard),
    random: createRandom(1),
    winnerId: null,
    log: [],
    nextLogId: 0,
  };
}

/**
 * Finds a hand card of a player by type.
 *
 * @param state - the game state
 * @param playerIndex - which player holds the card
 * @param type - the card type to look for
 * @returns the id of the first matching hand card
 * @throws if the player holds no such card
 */
export function handCardId(
  state: GameState,
  playerIndex: number,
  type: ActionCardType,
): string {
  const card = state.players[playerIndex].hand.find(
    (candidate) => candidate.type === type,
  );
  if (card === undefined) {
    throw new Error(`player ${playerIndex} holds no ${type}`);
  }
  return card.id;
}

/**
 * Counts all cards that exist anywhere in a state.
 *
 * @param state - the game state
 * @returns hands, piles and attached cards added up
 */
export function totalCardCount(state: GameState): number {
  const onTable = state.players.flatMap((player) => [
    ...player.hand,
    ...player.pigs.flatMap((pig) =>
      [pig.barn, pig.lightningRod, pig.barnDoor].filter(
        (card): card is Card => card !== null,
      ),
    ),
  ]);
  return onTable.length + state.drawPile.length + state.discardPile.length;
}

/**
 * Builds the full action deck, for tests that need real card counts.
 *
 * @returns all 54 action cards
 */
export function fullDeck(): Card[] {
  return createDeck();
}

/** Builds one player of a scenario. */
function makePlayer(spec: PlayerSpec, playerIndex: number): Player {
  return {
    id: `p${playerIndex}`,
    name: spec.name ?? `Spieler ${playerIndex}`,
    isHuman: spec.isHuman ?? playerIndex === 0,
    pigs: spec.pigs.map((pigSpec, pigIndex) =>
      makePig(pigSpec, playerIndex, pigIndex),
    ),
    hand: spec.hand.map(makeCard),
  };
}

/** Builds one pig of a scenario. */
function makePig(spec: PigSpec, playerIndex: number, pigIndex: number): Pig {
  return {
    id: `p${playerIndex}-pig${pigIndex}`,
    isDirty: spec.isDirty ?? false,
    barn: spec.hasBarn === true ? makeCard("barn") : null,
    lightningRod:
      spec.hasLightningRod === true ? makeCard("lightningRod") : null,
    barnDoor: spec.hasBarnDoor === true ? makeCard("barnDoor") : null,
  };
}
